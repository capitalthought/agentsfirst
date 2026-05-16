// radar.ts — main entry point. Orchestrates the 10-step daily run per
// AGENTS.md §Sequence and docs/plans/2026-05-15-agentsfirst-radar-design.md §3.
//
// Entry surface:
//   - `npm run radar`              → main() → runRadar() with default args
//   - `npm run radar:dry-run`      → main() with RADAR_DRY_RUN=1 / --dry-run
//   - imported from tests          → call runRadar(opts) directly
//
// Pipeline:
//   STEP A  prep gates (TZ, state load, paused flag, COS skip)
//   STEP A' fold pending mutations, auto-dismiss stale recs, evict seen_urls
//   STEP B  source fan-out
//   STEP C  dedup against seen_urls
//   STEP D  triage (reader LLM)
//   STEP E  planner (lane proposals)
//   STEP F  per-lane rec generation (website/social/other)
//   STEP G  render briefing
//   STEP H  atomic state write + commit + push (skipped in dry-run)
//   STEP I  iMessage summary
//   STEP K  Healthchecks.io heartbeat
//
// Anti-patterns avoided:
//   - never throws on individual lane failure (partial briefing > none)
//   - always pings HC on terminal paths
//   - truncates mutations.jsonl only AFTER successful push
//   - dry-run skips git, state write, imsg

import { promises as fs } from 'node:fs';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

import {
  RadarState,
  readState,
  writeStateAtomic,
  LAST_RUN_PATH,
  STATE_BACKUP_PREFIX,
  DEFAULT_STATE_PATH,
  evictSeenUrls,
  autoDismissStale,
  resetDailySpendIfNeeded,
  loadCosSkipDates,
  REPO_ROOT_PATH,
} from './state.js';
import { loadSources, Source, SourceKind } from './sources.js';
import { fanoutAll, FetchAttempt } from './fanout.js';
import { triageItems, planLaneProposals } from './triage.js';
import { generateWebsiteRecs } from './recs/website.js';
import { generateSocialRecs } from './recs/social.js';
import { generateOtherRecs } from './recs/other.js';
import { renderBriefing } from './briefing.js';
import { foldMutationsIntoState, truncateMutationsLog } from './actuator.js';
import { sendImsg, getMikeyChatId } from './imsg.js';

const execFile = promisify(execFileCb);

// ─── Public types ────────────────────────────────────────────────────────────

export interface RadarRunOptions {
  /** --dry-run: skip commits, iMessage, state writes. Preview only. */
  dryRun: boolean;
  /** --since=14d override (default = state.last_run_iso). */
  since?: string;
  /** --source=x restrict fan-out to one SourceKind. */
  source?: string;
  /** --skip-tz-guard (manual workflow_dispatch invocations). */
  skipTzGuard?: boolean;
  /** Override CWD (for tests). */
  cwd?: string;
}

export interface RadarRunResult {
  /** 0 = success, 1 = degraded (e.g. paused, cold-start), 2 = fatal. */
  exit_code: 0 | 1 | 2;
  briefing_path?: string;
  rec_counts?: { website: number; social: number; other: number };
  error?: string;
}

// ─── Tiny helpers ────────────────────────────────────────────────────────────

function log(msg: string): void {
  process.stderr.write(`${msg}\n`);
}

/**
 * Parse argv overlay onto opts. Recognized flags:
 *   --dry-run | --since=14d | --source=x_handle | --skip-tz-guard
 * RADAR_DRY_RUN=1 sets dryRun true regardless.
 */
export function parseArgs(
  argv: readonly string[],
  opts?: Partial<RadarRunOptions>,
): RadarRunOptions {
  const result: RadarRunOptions = {
    dryRun: opts?.dryRun ?? process.env.RADAR_DRY_RUN === '1',
    since: opts?.since,
    source: opts?.source,
    skipTzGuard: opts?.skipTzGuard ?? false,
    cwd: opts?.cwd,
  };
  for (const arg of argv) {
    if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--skip-tz-guard') {
      result.skipTzGuard = true;
    } else if (arg.startsWith('--since=')) {
      result.since = arg.slice('--since='.length);
    } else if (arg.startsWith('--source=')) {
      result.source = arg.slice('--source='.length);
    }
  }
  return result;
}

/** Subtract a window like "14d" / "7d" / "30d" / "24h" from an ISO timestamp. */
export function subtractWindow(iso: string, window: string): string {
  const match = /^(\d+)([dh])$/.exec(window);
  if (!match) {
    throw new Error(`subtractWindow: invalid window "${window}"`);
  }
  const n = Number(match[1]);
  const unit = match[2];
  const ms = unit === 'd' ? n * 24 * 3600 * 1000 : n * 3600 * 1000;
  return new Date(Date.parse(iso) - ms).toISOString();
}

/**
 * The cron fires at 07:00 America/Chicago. DST transitions can shift UTC such
 * that an extra run sneaks in. Skip unless we're actually in the 07:xx hour
 * in Chicago — OR the operator forced --skip-tz-guard (manual dispatch).
 */
export function checkTzGuard(skipFlag?: boolean): {
  ok: true;
} | { ok: false; reason: string } {
  if (skipFlag) return { ok: true };
  const hourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: '2-digit',
    hour12: false,
  }).format(new Date());
  // Intl can return "07" or "7" depending on the runtime; normalize.
  const hour = Number(hourStr.replace(/[^\d]/g, ''));
  if (hour === 7) return { ok: true };
  return { ok: false, reason: `Chicago hour=${hour}, expected 07` };
}

/** Heartbeat the daily HC slug. Never throws (trap inside). */
export async function pingHc(
  dryRun: boolean,
  status: 'success' | 'fail',
): Promise<void> {
  if (dryRun) {
    log(`[hc] dry-run: would ping ${status}`);
    return;
  }
  const url = process.env.HC_PING_URL;
  if (!url) {
    log('[hc] HC_PING_URL not set — skipping');
    return;
  }
  try {
    const target = status === 'success' ? url : `${url}/fail`;
    await execFile('curl', ['-sS', '-m', '10', '-o', '/dev/null', target]);
  } catch (err) {
    log(`[hc] ping failed (non-fatal): ${(err as Error).message}`);
  }
}

/** Ping an arbitrary HC slug (e.g. agentsfirst-radar-paused). Never throws. */
export async function pingHcSlug(
  slug: string,
  status: 'success' | 'fail',
): Promise<void> {
  const base = process.env.HC_PING_URL_BASE;
  if (!base) {
    log(`[hc] HC_PING_URL_BASE not set — skipping slug ${slug}`);
    return;
  }
  try {
    const target = status === 'success'
      ? `${base.replace(/\/$/, '')}/${slug}`
      : `${base.replace(/\/$/, '')}/${slug}/fail`;
    await execFile('curl', ['-sS', '-m', '10', '-o', '/dev/null', target]);
  } catch (err) {
    log(`[hc] slug ping failed (non-fatal): ${(err as Error).message}`);
  }
}

/** Commit + push. No-op if nothing staged. Throws on hard git failures. */
export async function gitCommitAndPush(
  repoRoot: string,
  dateStr: string,
): Promise<{ committed: boolean; pushed: boolean }> {
  // Stage the artifacts we want — never use `git add -A` per CLAUDE.md.
  await execFile('git', [
    '-C', repoRoot,
    'add',
    'docs/checks/',
    'state/last-run.txt',
    'state/snapshot-weekly.json',
    'state/radar-state.json.v1.bak',
  ]).catch((err) => {
    // Tolerate missing files (e.g. snapshot not yet created).
    log(`[git] add (partial): ${(err as Error).message}`);
  });

  // Check if anything actually staged.
  const { stdout } = await execFile('git', [
    '-C', repoRoot, 'diff', '--cached', '--name-only',
  ]);
  if (stdout.trim().length === 0) {
    log('[git] nothing to commit');
    return { committed: false, pushed: false };
  }

  await execFile('git', [
    '-C', repoRoot,
    'commit',
    '-m', `chore(radar): briefing ${dateStr}`,
  ]);
  await execFile('git', ['-C', repoRoot, 'push']);
  return { committed: true, pushed: true };
}

/** Backup the current state file alongside its schema version. */
export async function backupState(
  state: RadarState,
  _repoRoot: string,
): Promise<void> {
  const backupPath = `${STATE_BACKUP_PREFIX}${state.schema_version}.bak`;
  try {
    await fs.copyFile(DEFAULT_STATE_PATH, backupPath);
  } catch (err) {
    // Cold-start: no state file to back up yet. Caller has already handled
    // the cold-start branch — this is the post-first-run path.
    log(`[state] backup skipped: ${(err as Error).message}`);
  }
}

/**
 * Merge fan-out attempt outcomes into state.sources_health. Successful
 * attempts reset consecutive_failures; failures increment it.
 */
export function mergeFanoutHealth(
  state: RadarState,
  attempts: FetchAttempt[],
  _nowIso: string,
): RadarState {
  const sourcesHealth = { ...state.sources_health };
  for (const attempt of attempts) {
    const prev = sourcesHealth[attempt.source_id];
    // We need the source kind to satisfy the SourceHealth schema; pull from
    // the prior entry if known, else default to 'web'. The kind is a hint
    // for the health renderer — not load-bearing for dedup.
    const kind = prev?.kind ?? 'web';
    if (attempt.ok) {
      sourcesHealth[attempt.source_id] = {
        source_id: attempt.source_id,
        kind,
        last_success_iso: attempt.iso,
        last_attempt_iso: attempt.iso,
        consecutive_failures: 0,
        last_error: null,
      };
    } else {
      sourcesHealth[attempt.source_id] = {
        source_id: attempt.source_id,
        kind,
        last_success_iso: prev?.last_success_iso ?? null,
        last_attempt_iso: attempt.iso,
        consecutive_failures: (prev?.consecutive_failures ?? 0) + 1,
        last_error: attempt.error ?? 'unknown',
      };
    }
  }
  return { ...state, sources_health: sourcesHealth };
}

/** Set the sources_health kind from the Source registry where possible. */
function applySourceKinds(
  state: RadarState,
  sources: Source[],
): RadarState {
  const kindMap = new Map<string, Source['kind']>();
  for (const s of sources) kindMap.set(s.id, s.kind);
  const next = { ...state.sources_health };
  for (const id of Object.keys(next)) {
    const k = kindMap.get(id);
    if (!k) continue;
    // Map SourceKind → SourceHealth.kind (the health schema uses a narrower
    // vocabulary). Best-effort mapping; unknown kinds fall back to 'web'.
    const healthKind = mapSourceKindToHealthKind(k);
    const cur = next[id];
    if (!cur) continue;
    next[id] = { ...cur, kind: healthKind };
  }
  return { ...state, sources_health: next };
}

function mapSourceKindToHealthKind(k: SourceKind): RadarState['sources_health'][string]['kind'] {
  switch (k) {
    case 'blog': return 'rss';
    case 'hn_frontpage': return 'rss';
    case 'mcp_registry': return 'rss';
    case 'x_handle':
    case 'x_query': return 'x';
    case 'bluesky': return 'bluesky';
    case 'linkedin': return 'linkedin';
    case 'gh_releases': return 'gh';
    case 'cf_portfolio': return 'mcp_probe';
    case 'cf_ars':
    case 'spec_diff':
    case 'web_search':
    default: return 'web';
  }
}

/** Short one-line summary like "11 blogs · 12 X · 3 bluesky · 4 gh". */
export function buildSourceSummary(sources: readonly Source[]): string {
  const counts = new Map<string, number>();
  const label = (kind: SourceKind): string => {
    switch (kind) {
      case 'blog': return 'blogs';
      case 'x_handle': return 'X handles';
      case 'x_query': return 'X queries';
      case 'gh_releases': return 'gh releases';
      case 'spec_diff': return 'spec diffs';
      case 'web_search': return 'web searches';
      case 'hn_frontpage': return 'HN';
      case 'linkedin': return 'LinkedIn';
      case 'bluesky': return 'bluesky';
      case 'mcp_registry': return 'MCP registry';
      case 'cf_ars': return 'CF ARS';
      case 'cf_portfolio': return 'CF portfolio';
      default: return kind;
    }
  };
  for (const s of sources) {
    const k = label(s.kind);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].map(([k, n]) => `${n} ${k}`).join(' · ');
}

// ─── Degraded-path briefing writers ──────────────────────────────────────────

async function writeMinimalBriefing(
  repoRoot: string,
  iso: string,
  body: string,
): Promise<string> {
  const date = iso.slice(0, 10);
  const rel = `docs/checks/${date}-radar.md`;
  const full = `${repoRoot}/${rel}`;
  await fs.mkdir(`${repoRoot}/docs/checks`, { recursive: true });
  await fs.writeFile(full, body);
  return rel;
}

async function writeColdStartBriefing(repoRoot: string, iso: string): Promise<string> {
  const body = [
    `# Radar briefing — ${iso.slice(0, 10)}`,
    '',
    `🚨 **Cold start** — state was missing or unparseable at \`${DEFAULT_STATE_PATH}\`.`,
    '',
    'Manual `npm run state:init` required before the next run can proceed.',
    '',
    `_Generated ${iso}._`,
    '',
  ].join('\n');
  return writeMinimalBriefing(repoRoot, iso, body);
}

async function writePausedBriefing(
  repoRoot: string,
  iso: string,
  reason: string | undefined,
): Promise<string> {
  const body = [
    `# Radar briefing — ${iso.slice(0, 10)}`,
    '',
    `⏸️ **PAUSED** — manual reset required.`,
    '',
    `**Reason:** ${reason ?? '(not recorded)'}`,
    '',
    'Clear `state.agent_paused` to resume autonomous runs.',
    '',
    `_Generated ${iso}._`,
    '',
  ].join('\n');
  return writeMinimalBriefing(repoRoot, iso, body);
}

async function writeSkipBriefing(
  repoRoot: string,
  iso: string,
  reason: string,
): Promise<string> {
  const body = [
    `# Radar briefing — ${iso.slice(0, 10)}`,
    '',
    `🛌 Skipped per COS calendar: ${reason}`,
    '',
    `_Generated ${iso}._`,
    '',
  ].join('\n');
  return writeMinimalBriefing(repoRoot, iso, body);
}

// ─── Main orchestrator ──────────────────────────────────────────────────────

export async function runRadar(
  opts?: Partial<RadarRunOptions>,
): Promise<RadarRunResult> {
  const args = parseArgs(process.argv.slice(2), opts);
  const repoRoot = args.cwd ?? REPO_ROOT_PATH;
  const startIso = new Date().toISOString();

  try {
    // ─── STEP A — Prep gates ────────────────────────────────────────────────

    // 1. TZ guard
    const tzCheck = checkTzGuard(args.skipTzGuard);
    if (!tzCheck.ok) {
      log(`[prep] DST guard: ${tzCheck.reason} — exiting 0`);
      return { exit_code: 0 };
    }

    // 2. Load state (cold-start handling)
    let state: RadarState;
    try {
      state = await readState();
    } catch (err) {
      log(`[prep] state cold-start: ${(err as Error).message}`);
      const briefingPath = await writeColdStartBriefing(repoRoot, startIso);
      await pingHc(args.dryRun, 'fail');
      return { exit_code: 1, briefing_path: briefingPath };
    }

    // 3. Paused?
    if (state.agent_paused) {
      const briefingPath = await writePausedBriefing(
        repoRoot, startIso, state.pause_reason,
      );
      await pingHcSlug('agentsfirst-radar-paused', 'success');
      log(`[prep] agent paused: ${state.pause_reason ?? '(no reason)'}`);
      return { exit_code: 1, briefing_path: briefingPath };
    }

    // 4. COS skip dates
    const skipDates = await loadCosSkipDates();
    const todayDate = startIso.slice(0, 10);
    const skipToday = skipDates.find((d) => d.date === todayDate);
    if (skipToday) {
      log(`[prep] COS skip: ${skipToday.reason}`);
      const briefingPath = await writeSkipBriefing(
        repoRoot, startIso, skipToday.reason,
      );
      await pingHc(args.dryRun, 'success');
      return { exit_code: 0, briefing_path: briefingPath };
    }

    // 5. Reset daily multipov spend if we've crossed UTC midnight.
    state = resetDailySpendIfNeeded(state, startIso);

    // ─── STEP A' — Fold pending mutations + housekeeping ────────────────────

    // Fold imsg-listener mutations BEFORE generating today's briefing so
    // yesterday's reply actions (accept/dismiss/defer) are reflected.
    const foldResult = await foldMutationsIntoState(state);
    if (foldResult.applied_count > 0) {
      log(`[prep] folded ${foldResult.applied_count} mutations`);
    }
    if (foldResult.errors.length > 0) {
      log(`[prep] mutation fold errors: ${foldResult.errors.length}`);
    }
    state = foldResult.state;

    // Auto-dismiss recs older than 72h that nobody acted on.
    const dismissResult = autoDismissStale(state, startIso);
    if (dismissResult.dismissed.length > 0) {
      log(`[prep] auto-dismissed ${dismissResult.dismissed.length} stale recs`);
    }
    state = dismissResult.state;

    // Evict old seen_urls (LRU + TTL).
    state = evictSeenUrls(state, startIso);

    // ─── STEP B — Source fan-out ────────────────────────────────────────────

    const allSources = await loadSources();
    const sources = args.source
      ? allSources.filter((s) => s.kind === args.source)
      : allSources;
    if (sources.length === 0) {
      log(`[fanout] no sources match filter (source=${args.source ?? 'all'})`);
    }
    const since = args.since
      ? subtractWindow(startIso, args.since)
      : state.last_run_iso;
    log(`[fanout] scanning ${sources.length} sources since ${since}`);

    const fanout = await fanoutAll({ sources, since });
    log(`[fanout] ${fanout.items.length} items · ${fanout.attempts.filter((a) => !a.ok).length} attempt failures`);

    // Merge health from this run's attempts, then re-stamp the .kind hints
    // from the registry so the renderer can group meaningfully.
    state = mergeFanoutHealth(state, fanout.attempts, startIso);
    state = applySourceKinds(state, sources);

    // ─── STEP C — Dedup against seen_urls ───────────────────────────────────

    const freshItems = fanout.items.filter((item) => !state.seen_urls[item.url]);
    log(`[dedup] ${fanout.items.length} total · ${freshItems.length} fresh`);

    // Record fresh URLs as seen NOW so subsequent runs don't re-process them
    // even if downstream lanes fail.
    for (const item of freshItems) {
      state.seen_urls[item.url] = startIso;
    }

    // ─── STEP D + E — Triage + Plan ─────────────────────────────────────────

    let triagedItems: Awaited<ReturnType<typeof triageItems>> = [];
    try {
      triagedItems = await triageItems(freshItems);
    } catch (err) {
      log(`[triage] failed (degraded): ${(err as Error).message}`);
    }
    const highSignal = triagedItems.filter((t) => t.bucket !== 'noise');
    log(`[triage] ${triagedItems.length} classified · ${highSignal.length} high-signal`);

    const openHeadlines = Object.values(state.recommendations)
      .filter((r) => r.status === 'open' || r.status === 'in_flight')
      .map((r) => r.headline);

    let proposals: Awaited<ReturnType<typeof planLaneProposals>> = [];
    try {
      proposals = await planLaneProposals(highSignal, { openHeadlines });
    } catch (err) {
      log(`[plan] failed (degraded): ${(err as Error).message}`);
    }
    const wCount = proposals.filter((p) => p.lane === 'website').length;
    const sCount = proposals.filter((p) => p.lane === 'social').length;
    const oCount = proposals.filter((p) => p.lane === 'other').length;
    log(`[plan] ${proposals.length} proposals (${wCount}W ${sCount}S ${oCount}O)`);

    // ─── STEP F — Per-lane rec generation ───────────────────────────────────

    const websiteProposals = proposals.filter((p) => p.lane === 'website');
    const socialProposals = proposals.filter((p) => p.lane === 'social');
    const otherProposals = proposals.filter((p) => p.lane === 'other');

    // Each lane runs independently. A lane failure logs and yields no recs —
    // it MUST NOT block the other lanes (partial briefing > none).
    let websiteRecs: Awaited<ReturnType<typeof generateWebsiteRecs>>['recs'] = [];
    try {
      const websiteResult = await generateWebsiteRecs({
        proposals: websiteProposals,
        state,
        runTimestamp: startIso,
      });
      state = websiteResult.state;
      websiteRecs = websiteResult.recs;
    } catch (err) {
      log(`[lane:website] failed: ${(err as Error).message}`);
    }

    let socialRecs: Awaited<ReturnType<typeof generateSocialRecs>>['recs'] = [];
    try {
      const socialResult = await generateSocialRecs({
        proposals: socialProposals,
        state,
        runTimestamp: startIso,
      });
      state = socialResult.state;
      socialRecs = socialResult.recs;
    } catch (err) {
      log(`[lane:social] failed: ${(err as Error).message}`);
    }

    let otherRecs: Awaited<ReturnType<typeof generateOtherRecs>>['recs'] = [];
    try {
      const otherResult = await generateOtherRecs({
        proposals: otherProposals,
        state,
        runTimestamp: startIso,
      });
      // Note: generateOtherRecs does NOT return state (lane is read-only on
      // state per its signature).
      otherRecs = otherResult.recs;
    } catch (err) {
      log(`[lane:other] failed: ${(err as Error).message}`);
    }

    const allRecs = [...websiteRecs, ...socialRecs, ...otherRecs];
    for (const rec of allRecs) {
      state.recommendations[rec.id] = rec;
    }

    // ─── STEP G — Render briefing ───────────────────────────────────────────

    const sourcesScannedSummary = buildSourceSummary(sources);
    const render = renderBriefing({
      state,
      fresh_recs: allRecs,
      windowStartIso: since,
      windowEndIso: startIso,
      sourcesScannedSummary,
      freshItemCount: freshItems.length,
      highSignalCount: highSignal.length,
      source_health: state.sources_health,
    });

    // ─── STEP H — Dry-run short-circuit ─────────────────────────────────────

    if (args.dryRun) {
      log(`[dry-run] would write ${render.briefing_path}`);
      log(`[dry-run] rec counts: ${JSON.stringify(render.rec_counts)}`);
      log('---');
      log(render.markdown.slice(0, 2000));
      log('---');
      return {
        exit_code: 0,
        briefing_path: render.briefing_path,
        rec_counts: render.rec_counts,
      };
    }

    // ─── STEP H — Persist + commit + push ───────────────────────────────────

    // Back up the on-disk state BEFORE we overwrite it (per design R4).
    await backupState(state, repoRoot);

    // Write briefing.
    const briefingFullPath = `${repoRoot}/${render.briefing_path}`;
    await fs.mkdir(`${repoRoot}/docs/checks`, { recursive: true });
    await fs.writeFile(briefingFullPath, render.markdown);

    // Append briefing entry to state (placeholders for imsg + hc, updated below).
    state.briefings.push({
      date: render.date,
      path: render.briefing_path,
      rec_counts: render.rec_counts,
      imsg_sent_iso: null,
      imsg_chat_id: '',
      hc_pinged: false,
    });
    if (state.briefings.length > 90) state.briefings.shift();
    state.last_run_iso = startIso;
    state.next_run_iso = new Date(
      Date.parse(startIso) + 24 * 3600 * 1000,
    ).toISOString();

    await writeStateAtomic(state);

    // Dead-man's-switch input — must be committed for the external monitor.
    await fs.writeFile(LAST_RUN_PATH, startIso);

    // Commit + push. No-op if nothing staged.
    let pushed = false;
    try {
      const gitResult = await gitCommitAndPush(repoRoot, render.date);
      pushed = gitResult.pushed;
    } catch (err) {
      log(`[git] commit/push failed: ${(err as Error).message}`);
    }

    // Truncate mutations.jsonl ONLY after a successful push — otherwise a
    // crash here loses the mutations we just folded.
    if (pushed) {
      try {
        await truncateMutationsLog();
      } catch (err) {
        log(`[mutations] truncate failed: ${(err as Error).message}`);
      }
    }

    // ─── STEP I — iMessage ──────────────────────────────────────────────────

    const lastBriefing = state.briefings[state.briefings.length - 1];
    try {
      const chatId = await getMikeyChatId();
      const result = await sendImsg(chatId, render.imsg_summary);
      if (result.success && lastBriefing) {
        lastBriefing.imsg_sent_iso = result.sent_iso;
        lastBriefing.imsg_chat_id = result.chat_id;
        await writeStateAtomic(state);
      } else if (!result.success) {
        log(`[imsg] send returned !success: ${result.error ?? '(no error)'}`);
      }
    } catch (err) {
      // silent-imsg path per AGENTS.md §Errors — briefing already shipped,
      // dead-man's-switch monitor on imsg-last-success.json will catch this.
      log(`[imsg] failed: ${(err as Error).message}`);
    }

    // ─── STEP K — Heartbeat ────────────────────────────────────────────────

    await pingHc(args.dryRun, 'success');
    if (lastBriefing) {
      lastBriefing.hc_pinged = true;
      try {
        await writeStateAtomic(state);
      } catch (err) {
        log(`[state] post-hc write failed: ${(err as Error).message}`);
      }
    }

    const elapsedSec = (Date.now() - Date.parse(startIso)) / 1000;
    log(`[done] briefing=${render.briefing_path} recs=${allRecs.length} elapsed=${elapsedSec.toFixed(1)}s`);

    return {
      exit_code: 0,
      briefing_path: render.briefing_path,
      rec_counts: render.rec_counts,
    };
  } catch (err) {
    log(`[fatal] ${(err as Error).stack ?? (err as Error).message}`);
    await pingHc(opts?.dryRun ?? false, 'fail');
    return { exit_code: 2, error: (err as Error).message };
  }
}

/** Bin entry: dispatches runRadar() and sets process.exitCode. */
export async function main(): Promise<void> {
  const result = await runRadar();
  process.exit(result.exit_code);
}

// Only run main() when invoked directly (not when imported by tests).
const isEntry = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isEntry) {
  void main();
}
