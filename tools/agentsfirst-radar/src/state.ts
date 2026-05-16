// state.ts — typed state for agentsfirst-radar. Single source of truth for the
// schema. Atomic write + zod validation per AGENTS.md §Errors.
//
// Design contract: docs/plans/2026-05-15-agentsfirst-radar-design.md §5.1
//
// Layout:
//   - Zod schemas (RecLane, RecStatus, Recommendation, SourceHealth, HandleEntry,
//     BriefingEntry, AdopterPing, RadarState)
//   - File path constants for the state/ directory layout
//   - readState / writeStateAtomic / freshState

import { z } from 'zod';
import { promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';

// ─── Repo paths ──────────────────────────────────────────────────────────────
// Path resolution: state/ lives at the repo root. Detect repo root by walking
// up from this file (compiled into dist/, so two ".." for dist/state.js or
// two ".." for src/state.ts → tools/agentsfirst-radar → tools → repo root).

const HERE_URL = new URL('.', import.meta.url);
const HERE = decodeURIComponent(HERE_URL.pathname);
// HERE is .../tools/agentsfirst-radar/src/ (in dev) or .../tools/agentsfirst-radar/dist/ (in prod)
const PACKAGE_ROOT = resolve(HERE, '..');
const REPO_ROOT = resolve(PACKAGE_ROOT, '..', '..');

export const REPO_ROOT_PATH = REPO_ROOT;
export const STATE_DIR = resolve(REPO_ROOT, 'state');
export const DEFAULT_STATE_PATH = resolve(STATE_DIR, 'radar-state.json');
export const STATE_TMP_PATH = resolve(STATE_DIR, 'radar-state.json.tmp');
export const STATE_BACKUP_PREFIX = resolve(STATE_DIR, 'radar-state.json.v');
export const SNAPSHOT_PATH = resolve(STATE_DIR, 'snapshot-weekly.json');
export const LAST_RUN_PATH = resolve(STATE_DIR, 'last-run.txt');
export const MUTATIONS_PATH = resolve(STATE_DIR, 'mutations.jsonl');
export const IMSG_UNPARSED_PATH = resolve(STATE_DIR, 'imsg-unparsed.jsonl');
export const IMSG_LAST_SUCCESS_PATH = resolve(STATE_DIR, 'imsg-last-success.json');
export const LLM_ANOMALIES_PATH = resolve(STATE_DIR, 'llm-anomalies.jsonl');
export const COS_SKIP_DATES_PATH = resolve(STATE_DIR, 'cos-skip-dates.json');

// ─── Schema (per design §5.1) ────────────────────────────────────────────────

export const RecLane = z.enum(['website', 'social', 'other']);
export type RecLane = z.infer<typeof RecLane>;

export const RecStatus = z.enum([
  'open', // surfaced in latest briefing, awaiting Josh
  'accepted', // Josh said yes; downstream actuator firing
  'in_flight', // accepted, PR opened or post-pending, not yet shipped
  'shipped', // landed (PR merged / tweet posted / Asana task created)
  'dismissed', // Josh said no, with reason
  'auto_dismissed', // stale-no-action-72h
]);
export type RecStatus = z.infer<typeof RecStatus>;

export const Recommendation = z.object({
  id: z.string().regex(/^[a-f0-9]{8}$/), // sha1[:8] of headline + lane + iso-date + run_timestamp (salt prevents external prediction)
  lane: RecLane,
  headline: z.string().max(120),
  body: z.string(),
  created_iso: z.string().datetime(),
  status: RecStatus,
  status_changed_iso: z.string().datetime(),
  dismissal_reason: z.string().optional(),
  acceptance_note: z.string().optional(),
  expires_iso: z.string().datetime(),
  source_urls: z.array(z.string().url()).min(1),
  multipov_review_id: z.string().optional(),
  parent_event_id: z.string().optional(), // groups multi-lane recs that share a triggering event
  accept_iso: z.string().datetime().optional(), // for CONFIRM 2h window
  downstream: z
    .object({
      pr_url: z.string().url().optional(),
      tweet_url: z.string().url().optional(),
      asana_task_gid: z.string().optional(),
    })
    .optional(),
});
export type Recommendation = z.infer<typeof Recommendation>;

export const SourceHealth = z.object({
  source_id: z.string(),
  kind: z.enum([
    'rss',
    'atom',
    'x',
    'bluesky',
    'linkedin',
    'hn',
    'gh',
    'web',
    'mcp_probe',
  ]),
  last_success_iso: z.string().datetime().nullable(),
  last_attempt_iso: z.string().datetime(),
  consecutive_failures: z.number().int().nonnegative(),
  last_error: z.string().nullable(),
});
export type SourceHealth = z.infer<typeof SourceHealth>;

export const HandleEntry = z.object({
  display_name: z.string(),
  platform: z.enum(['x', 'bluesky', 'linkedin']),
  handle: z.string(),
  verified_iso: z.string().datetime(),
  evidence_url: z.string().url(),
  confidence: z.enum(['high', 'medium', 'low']),
});
export type HandleEntry = z.infer<typeof HandleEntry>;

export const BriefingEntry = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  path: z.string(),
  rec_counts: z.object({
    website: z.number().int().nonnegative(),
    social: z.number().int().nonnegative(),
    other: z.number().int().nonnegative(),
  }),
  imsg_sent_iso: z.string().datetime().nullable(),
  imsg_chat_id: z.string(),
  hc_pinged: z.boolean(),
});
export type BriefingEntry = z.infer<typeof BriefingEntry>;

export const AdopterPing = z.object({
  domain: z.string(),
  score: z.number().int().min(0).max(100),
  level: z.number().int().min(0).max(4),
  first_seen_iso: z.string().datetime(),
  last_scored_iso: z.string().datetime(),
  contact_status: z.enum([
    'uncontacted',
    'dm_drafted',
    'dm_sent',
    'responded',
    'out_of_scope',
  ]),
});
export type AdopterPing = z.infer<typeof AdopterPing>;

export const RadarState = z.object({
  schema_version: z.literal(1),
  agent_paused: z.boolean().default(false),
  pause_reason: z.string().optional(),
  first_run_iso: z.string().datetime(),
  last_run_iso: z.string().datetime(),
  next_run_iso: z.string().datetime(),
  multipov_spend_today_usd: z.number().nonnegative().default(0),
  multipov_last_reset_iso: z.string().datetime(),
  seen_urls: z.record(z.string().url(), z.string().datetime()), // capped at SEEN_URLS_MAX via LRU; entries older than SEEN_URLS_TTL_DAYS evicted at each run
  recommendations: z.record(z.string(), Recommendation),
  sources_health: z.record(z.string(), SourceHealth),
  handle_allowlist: z.record(z.string(), HandleEntry),
  briefings: z.array(BriefingEntry).max(90),
  adopters: z.record(z.string(), AdopterPing),
});
export type RadarState = z.infer<typeof RadarState>;

// ─── Configurable bounds (env-overridable for tests / tuning) ────────────────

export const SEEN_URLS_MAX = Number(process.env.RADAR_SEEN_URLS_MAX ?? 10_000);
export const SEEN_URLS_TTL_DAYS = Number(process.env.RADAR_SEEN_URLS_TTL_DAYS ?? 90);
export const MULTIPOV_DAILY_CAP_USD = Number(process.env.RADAR_MULTIPOV_CAP_USD ?? 10);
export const REC_STALE_HOURS = 72;
export const CONFIRM_WINDOW_HOURS = 2;

// ─── I/O ─────────────────────────────────────────────────────────────────────

/**
 * Build a clean v1 state. Called by `bin/state-init.ts` on first deploy.
 */
export function freshState(): RadarState {
  const now = new Date().toISOString();
  return {
    schema_version: 1,
    agent_paused: false,
    first_run_iso: now,
    last_run_iso: now,
    next_run_iso: now,
    multipov_spend_today_usd: 0,
    multipov_last_reset_iso: now,
    seen_urls: {},
    recommendations: {},
    sources_health: {},
    handle_allowlist: {},
    briefings: [],
    adopters: {},
  };
}

/**
 * Read + zod-validate the state file. Throws on missing file (caller treats
 * as cold-start; see AGENTS.md §Errors) or on validation failure (caller
 * writes degraded briefing).
 */
export async function readState(path: string = DEFAULT_STATE_PATH): Promise<RadarState> {
  const raw = await fs.readFile(path, 'utf8');
  const parsed = JSON.parse(raw);
  return RadarState.parse(parsed);
}

/**
 * Atomic write: tmp file → fsync → rename. A SIGKILL mid-write leaves either
 * the prior valid file or no .tmp file that affects production. Per AGENTS.md
 * §Errors.
 */
export async function writeStateAtomic(
  state: RadarState,
  path: string = DEFAULT_STATE_PATH,
): Promise<void> {
  // zod-validate before serializing — refuse to write garbage.
  const validated = RadarState.parse(state);
  await fs.mkdir(dirname(path), { recursive: true });
  const tmpPath = `${path}.tmp.${process.pid}.${Date.now()}`;
  const handle = await fs.open(tmpPath, 'w');
  try {
    await handle.writeFile(JSON.stringify(validated, null, 2));
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(tmpPath, path);
}

/**
 * Read the cos-skip-dates.json file. Returns the array of skip dates; empty
 * array if file is missing (graceful degrade per AGENTS.md §Errors).
 */
export interface CosSkipEntry {
  date: string; // YYYY-MM-DD
  reason: string;
}
export const CosSkipFile = z.object({
  skip_dates: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      reason: z.string(),
    }),
  ),
});
export async function loadCosSkipDates(): Promise<CosSkipEntry[]> {
  try {
    const raw = await fs.readFile(COS_SKIP_DATES_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const { skip_dates } = CosSkipFile.parse(parsed);
    return skip_dates;
  } catch {
    return [];
  }
}

// ─── Recommendation lifecycle helpers ────────────────────────────────────────

import { createHash } from 'node:crypto';

/**
 * Build a deterministic parent_event_id from a union of source URLs. Multi-
 * lane recs from the same triggering signal cluster should share the same
 * parent_event_id so the briefing renderer can group "From the same signal:
 * Website / Social / Other" — design open-question Q1 resolution.
 *
 * 12 hex chars (longer than rec_id's 8) because there are fewer event_ids per
 * cron firing than rec_ids; collision tolerance can be looser.
 */
export function parentEventIdFromUrls(urls: readonly string[]): string {
  const sorted = [...urls].sort();
  return createHash('sha1').update(sorted.join('|')).digest('hex').slice(0, 12);
}

/**
 * Build a stable rec_id from headline + lane + iso-date + run_timestamp.
 * The run_timestamp salt prevents external prediction (P2-R2).
 */
export function makeRecId(args: {
  headline: string;
  lane: RecLane;
  isoDate: string; // YYYY-MM-DD
  runTimestamp: string; // ISO datetime of the cron firing
}): string {
  const input = `${args.headline}|${args.lane}|${args.isoDate}|${args.runTimestamp}`;
  return createHash('sha1').update(input).digest('hex').slice(0, 8);
}

/**
 * Mint a fresh Recommendation with `open` status. Caller fills in body /
 * source_urls / multipov_review_id.
 */
export function newRecommendation(args: {
  headline: string;
  lane: RecLane;
  body: string;
  source_urls: string[];
  runTimestamp: string;
  multipov_review_id?: string;
  parent_event_id?: string;
}): Recommendation {
  const now = args.runTimestamp;
  const isoDate = now.slice(0, 10);
  const id = makeRecId({
    headline: args.headline,
    lane: args.lane,
    isoDate,
    runTimestamp: now,
  });
  const expires = new Date(Date.parse(now) + REC_STALE_HOURS * 3600 * 1000).toISOString();
  return {
    id,
    lane: args.lane,
    headline: args.headline,
    body: args.body,
    created_iso: now,
    status: 'open',
    status_changed_iso: now,
    expires_iso: expires,
    source_urls: args.source_urls,
    multipov_review_id: args.multipov_review_id,
    parent_event_id: args.parent_event_id,
  };
}

/**
 * seen_urls hygiene: drop entries older than SEEN_URLS_TTL_DAYS, then LRU-cap
 * to SEEN_URLS_MAX. Called at the start of every fanout per AGENTS.md.
 */
export function evictSeenUrls(state: RadarState, nowIso: string): RadarState {
  const cutoff = Date.parse(nowIso) - SEEN_URLS_TTL_DAYS * 24 * 3600 * 1000;
  const kept = Object.entries(state.seen_urls).filter(
    ([, iso]) => Date.parse(iso) >= cutoff,
  );
  kept.sort(([, a], [, b]) => Date.parse(b) - Date.parse(a)); // newest first
  const capped = kept.slice(0, SEEN_URLS_MAX);
  return { ...state, seen_urls: Object.fromEntries(capped) };
}

/**
 * Auto-dismiss any rec older than REC_STALE_HOURS that is still `open`.
 * Mutates a copy; returns the new state + ids of newly-dismissed recs.
 */
export function autoDismissStale(
  state: RadarState,
  nowIso: string,
): { state: RadarState; dismissed: string[] } {
  const now = Date.parse(nowIso);
  const dismissed: string[] = [];
  const newRecs: Record<string, Recommendation> = {};
  for (const [id, rec] of Object.entries(state.recommendations)) {
    if (rec.status === 'open' && Date.parse(rec.expires_iso) <= now) {
      newRecs[id] = {
        ...rec,
        status: 'auto_dismissed',
        status_changed_iso: nowIso,
        dismissal_reason: rec.dismissal_reason ?? 'stale-no-action-72h',
      };
      dismissed.push(id);
    } else {
      newRecs[id] = rec;
    }
  }
  return { state: { ...state, recommendations: newRecs }, dismissed };
}

/**
 * Reset the daily multipov spend if we've crossed UTC midnight since the
 * last reset.
 */
export function resetDailySpendIfNeeded(state: RadarState, nowIso: string): RadarState {
  const lastReset = state.multipov_last_reset_iso.slice(0, 10);
  const today = nowIso.slice(0, 10);
  if (lastReset === today) return state;
  return {
    ...state,
    multipov_spend_today_usd: 0,
    multipov_last_reset_iso: nowIso,
  };
}

// ─── Tmp-dir fallback for tests ─────────────────────────────────────────────

export function makeTestStatePath(): string {
  return resolve(tmpdir(), `radar-state-test-${process.pid}-${Date.now()}.json`);
}
