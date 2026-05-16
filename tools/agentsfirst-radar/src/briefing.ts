// briefing.ts — render the morning briefing markdown + the compact iMessage
// summary for agentsfirst-radar.
//
// Design contract: docs/plans/2026-05-15-agentsfirst-radar-design.md §5.2
// Voice: Mikey Trafton — direct, no filler, dry; emoji at START of bullets per
// global CLAUDE.md formatting rules.
//
// PURE function (no I/O). Caller writes the markdown to disk and ships the
// summary to iMessage.

import type { RadarState, Recommendation, SourceHealth } from './state.js';
import { renderInspectableStateBlock, computeMetrics } from './overview.js';

// ─── Public types ────────────────────────────────────────────────────────────

export interface BriefingInput {
  state: RadarState;
  /** Recs to surface in this briefing (already triaged + dedup'd; status='open'). */
  fresh_recs: Recommendation[];
  /** Previous run's last_run_iso. */
  windowStartIso: string;
  /** Current run's start. */
  windowEndIso: string;
  /** One-line summary like "11 blogs · 12 X handles · …". */
  sourcesScannedSummary: string;
  /** Total fresh items found (pre-rec generation). */
  freshItemCount: number;
  /** Items that survived to be classified. */
  highSignalCount: number;
  /** Current snapshot for the health line. */
  source_health: Record<string, SourceHealth>;
}

export interface BriefingRender {
  /** YYYY-MM-DD */
  date: string;
  /** Full briefing body. */
  markdown: string;
  /** <=250 char compact summary for the iMessage preview. */
  imsg_summary: string;
  rec_counts: {
    website: number;
    social: number;
    other: number;
  };
  /** docs/checks/<date>-radar.md (computed; not written here). */
  briefing_path: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const IMSG_MAX_CHARS = 250;
const TOP_HEADLINE_MAX_CHARS = 60;
const HEALTH_DEGRADED_NAMED_LIMIT = 4;
const NOISE_ALARM_THRESHOLD = 0.4; // 40%

// ─── Public entry point ──────────────────────────────────────────────────────

export function renderBriefing(input: BriefingInput): BriefingRender {
  const metrics = computeMetrics(input.state, input.windowEndIso);
  const rec_counts = countByLane(input.fresh_recs);
  const date = input.windowEndIso.slice(0, 10);
  const briefing_path = `docs/checks/${date}-radar.md`;

  const markdown = buildMarkdown({
    input,
    rec_counts,
    date,
    metricsBlock: renderInspectableStateBlock(metrics),
  });

  const imsg_summary = buildImsgSummary({
    date,
    rec_counts,
    fresh_recs: input.fresh_recs,
    sourcesScannedSummary: input.sourcesScannedSummary,
    briefing_path,
  });

  return {
    date,
    markdown,
    imsg_summary,
    rec_counts,
    briefing_path,
  };
}

// ─── Markdown body ───────────────────────────────────────────────────────────

interface BuildMarkdownArgs {
  input: BriefingInput;
  rec_counts: { website: number; social: number; other: number };
  date: string;
  metricsBlock: string;
}

function buildMarkdown(args: BuildMarkdownArgs): string {
  const { input, rec_counts, date, metricsBlock } = args;
  const total = rec_counts.website + rec_counts.social + rec_counts.other;

  const websiteRecs = filterLane(input.fresh_recs, 'website');
  const socialRecs = filterLane(input.fresh_recs, 'social');
  const otherRecs = filterLane(input.fresh_recs, 'other');

  const lines: string[] = [];

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push(`# Agents First Radar — ${date}`);
  lines.push('');
  lines.push(`**Window:** ${input.windowStartIso} → ${input.windowEndIso}`);
  lines.push(`**Sources:** ${input.sourcesScannedSummary}`);
  lines.push(
    `**Fresh items:** ${input.freshItemCount}  ·  High-signal: ${input.highSignalCount}  ·  Recommendations: ${total} (W:${rec_counts.website} S:${rec_counts.social} O:${rec_counts.other})`,
  );
  lines.push(`**🩺 Source health:** ${renderHealthLine(input.source_health)}`);
  lines.push('');

  // ── Top of the stack ──────────────────────────────────────────────────────
  const topRec = pickTopRec(input.fresh_recs);
  if (topRec) {
    lines.push(
      `🎯 **Top of the stack:** [${topRec.id}] ${topRec.headline} (${laneLabel(topRec.lane)} lane — ${multipovStatusNote(topRec)})`,
    );
    lines.push('');
  }

  // ── Pause banner ──────────────────────────────────────────────────────────
  if (input.state.agent_paused) {
    const reason = input.state.pause_reason ?? '(no reason given)';
    lines.push(`⏸️ **PAUSED:** ${reason}`);
    lines.push('');
  }

  // ── Noise alarm ───────────────────────────────────────────────────────────
  const noise = noiseAlarm(input.state, input.windowEndIso);
  if (noise) {
    lines.push(
      `🚨 **NOISE ALARM:** acceptance rate ${noise.percent}% in last 7d — radar is producing more noise than signal. Retune or kill.`,
    );
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // ── Website lane ──────────────────────────────────────────────────────────
  lines.push(`## 🌐 Website updates (${rec_counts.website})`);
  lines.push('');
  if (websiteRecs.length === 0) {
    lines.push('_No new thesis or rubric edits surfaced today._');
    lines.push('');
  } else {
    for (const rec of websiteRecs) {
      renderWebsiteRec(rec, lines);
    }
  }
  lines.push('---');
  lines.push('');

  // ── Social lane ───────────────────────────────────────────────────────────
  lines.push(`## 📣 Social drafts (${rec_counts.social})`);
  lines.push('');
  if (socialRecs.length === 0) {
    lines.push('_No social-ready signal in the window._');
    lines.push('');
  } else {
    for (const rec of socialRecs) {
      renderSocialRec(rec, lines);
    }
  }
  lines.push('---');
  lines.push('');

  // ── Other lane ────────────────────────────────────────────────────────────
  lines.push(`## 🔧 Other moves (${rec_counts.other})`);
  lines.push('');
  if (otherRecs.length === 0) {
    lines.push('_No ops/outreach moves recommended today._');
    lines.push('');
  } else {
    for (const rec of otherRecs) {
      renderOtherRec(rec, lines);
    }
  }
  lines.push('---');
  lines.push('');

  // ── Inspectable State block (delegated) ───────────────────────────────────
  lines.push(metricsBlock.trimEnd());
  lines.push('');
  lines.push('🔧 -agentsfirst-radar');

  return lines.join('\n');
}

// ─── Per-lane rec renderers ─────────────────────────────────────────────────

function renderWebsiteRec(rec: Recommendation, out: string[]): void {
  out.push(`### [${rec.id}] ${rec.headline}`);
  const fileLine = extractFileLine(rec.body);
  out.push(`**File:** ${fileLine ?? 'see body'}`);
  out.push(`**Multipov review:** ${multipovReviewField(rec)}`);
  out.push(rec.body.trimEnd());
  out.push(
    `**Reply:** \`accept ${rec.id}\` → opens PR · \`dismiss ${rec.id} <reason>\` · \`defer ${rec.id} 7d\``,
  );
  out.push('');
}

function renderSocialRec(rec: Recommendation, out: string[]): void {
  out.push(`### [${rec.id}] ${rec.headline}`);
  out.push(rec.body.trimEnd());
  out.push(
    `**Reply:** \`accept ${rec.id}\` → triggers CONFIRM round-trip · \`dismiss ${rec.id} <reason>\``,
  );
  out.push('');
}

function renderOtherRec(rec: Recommendation, out: string[]): void {
  const tier = extractImpactTier(rec.body) ?? extractImpactTier(rec.headline) ?? 'info';
  // Strip leading "(<tier>)" if the body generator already prefixed it — avoid
  // double-tagging.
  const headline = stripLeadingTier(rec.headline);
  out.push(`### [${rec.id}] (${tier}) ${headline}`);
  out.push(rec.body.trimEnd());
  out.push(
    `**Reply:** \`accept ${rec.id}\` → files unassigned Asana task in "Radar: Triage" · \`dismiss ${rec.id} <reason>\``,
  );
  out.push('');
}

// ─── Health line ────────────────────────────────────────────────────────────

function renderHealthLine(health: Record<string, SourceHealth>): string {
  const entries = Object.values(health);
  const total = entries.length;
  const degradedEntries = entries.filter((e) => e.consecutive_failures > 0);
  const degraded = degradedEntries.length;
  const healthy = total - degraded;

  if (total === 0) {
    return '0/0 healthy · 0 degraded';
  }

  if (degraded === 0) {
    return `${healthy}/${total} healthy · 0 degraded`;
  }

  // Sort by consecutive_failures desc so the noisiest sources are named first.
  const sorted = [...degradedEntries].sort(
    (a, b) => b.consecutive_failures - a.consecutive_failures,
  );
  const named = sorted.slice(0, HEALTH_DEGRADED_NAMED_LIMIT);
  const tail = sorted.length > HEALTH_DEGRADED_NAMED_LIMIT ? ', …' : '';
  const namedStr = named
    .map((e) => `${e.source_id} ${e.consecutive_failures} fail`)
    .join(', ');

  return `${healthy}/${total} healthy · ${degraded} degraded (${namedStr}${tail})`;
}

// ─── Top-of-stack picker ────────────────────────────────────────────────────

function pickTopRec(recs: Recommendation[]): Recommendation | undefined {
  if (recs.length === 0) return undefined;
  // Priority: website > social > other. Within a lane, prefer multipov-
  // verified, then keep input order (callers triage by salience upstream).
  const order: Record<Recommendation['lane'], number> = {
    website: 0,
    social: 1,
    other: 2,
  };
  const sorted = [...recs].sort((a, b) => {
    const laneCmp = order[a.lane] - order[b.lane];
    if (laneCmp !== 0) return laneCmp;
    const aVerified = a.multipov_review_id ? 0 : 1;
    const bVerified = b.multipov_review_id ? 0 : 1;
    return aVerified - bVerified;
  });
  return sorted[0];
}

function multipovStatusNote(rec: Recommendation): string {
  if (rec.lane === 'website') {
    if (rec.multipov_review_id) {
      return `multipov ${rec.multipov_review_id}`;
    }
    return 'multipov unverified';
  }
  if (rec.lane === 'social') {
    return '/social-draft verified';
  }
  return 'single-model';
}

function multipovReviewField(rec: Recommendation): string {
  if (rec.multipov_review_id) {
    return `https://multipov.ai/review/${rec.multipov_review_id}`;
  }
  return 'skipped (not verified — see error)';
}

// ─── Noise alarm ────────────────────────────────────────────────────────────

interface NoiseAlarm {
  percent: number;
}

function noiseAlarm(state: RadarState, nowIso: string): NoiseAlarm | null {
  const cutoff = Date.parse(nowIso) - 7 * 24 * 3600 * 1000;
  let accepted = 0;
  let dismissedish = 0;
  for (const rec of Object.values(state.recommendations)) {
    const changedMs = Date.parse(rec.status_changed_iso);
    if (Number.isNaN(changedMs) || changedMs < cutoff) continue;
    if (rec.status === 'accepted' || rec.status === 'in_flight' || rec.status === 'shipped') {
      accepted++;
    } else if (rec.status === 'dismissed' || rec.status === 'auto_dismissed') {
      dismissedish++;
    }
  }
  const decided = accepted + dismissedish;
  if (decided === 0) return null;
  const rate = accepted / decided;
  if (rate >= NOISE_ALARM_THRESHOLD) return null;
  return { percent: Math.round(rate * 100) };
}

// ─── iMessage summary ───────────────────────────────────────────────────────

interface BuildImsgSummaryArgs {
  date: string;
  rec_counts: { website: number; social: number; other: number };
  fresh_recs: Recommendation[];
  sourcesScannedSummary: string;
  briefing_path: string;
}

function buildImsgSummary(args: BuildImsgSummaryArgs): string {
  const { date, rec_counts, fresh_recs, sourcesScannedSummary, briefing_path } = args;
  const total = rec_counts.website + rec_counts.social + rec_counts.other;

  if (total === 0) {
    const head = `🛰️ Radar ${date}: 🟢 no signal worth acting on today. `;
    const tail = `\n📄 ${briefing_path}`;
    const budget = IMSG_MAX_CHARS - head.length - tail.length;
    const sources = truncate(sourcesScannedSummary, Math.max(0, budget));
    return capAt(`${head}${sources}${tail}`, IMSG_MAX_CHARS);
  }

  const top = pickTopRec(fresh_recs);
  const head = `🛰️ Radar ${date}: ${rec_counts.website} website · ${rec_counts.social} social · ${rec_counts.other} other.\n`;
  const tail = `\n📄 ${briefing_path}`;
  const fixed = head.length + '🎯 Top: '.length + tail.length;
  const headlineBudget = Math.max(
    0,
    Math.min(TOP_HEADLINE_MAX_CHARS, IMSG_MAX_CHARS - fixed),
  );
  const headline = top ? truncate(top.headline, headlineBudget) : '(no rec)';
  const composed = `${head}🎯 Top: ${headline}${tail}`;
  return capAt(composed, IMSG_MAX_CHARS);
}

// ─── Small helpers ──────────────────────────────────────────────────────────

function filterLane(recs: Recommendation[], lane: Recommendation['lane']): Recommendation[] {
  return recs.filter((r) => r.lane === lane);
}

function countByLane(recs: Recommendation[]): {
  website: number;
  social: number;
  other: number;
} {
  const counts = { website: 0, social: 0, other: 0 };
  for (const r of recs) counts[r.lane]++;
  return counts;
}

function laneLabel(lane: Recommendation['lane']): string {
  if (lane === 'website') return 'Website';
  if (lane === 'social') return 'Social';
  return 'Other';
}

/**
 * Pull `file:line` style anchors out of the rec body if the generator wrote one
 * in a `**File:**` field. Returns the first match or undefined.
 */
function extractFileLine(body: string): string | undefined {
  const m = body.match(/\*\*File:\*\*\s*`?([^\n`]+?)`?\s*$/m);
  if (m && m[1]) return m[1].trim();
  const bare = body.match(/^([\w./-]+:\d+)/m);
  if (bare && bare[1]) return bare[1].trim();
  return undefined;
}

/**
 * Pull `(<tier>)` impact marker from the rec body if the generator placed one
 * on a leading line; the spec allows the body to omit it and have briefing.ts
 * default to "info".
 */
function extractImpactTier(text: string): string | undefined {
  const m = text.match(/\(\s*(high|medium|low|info)\s+impact\s*\)/i);
  if (m && m[1]) return `${m[1].toLowerCase()} impact`;
  const bare = text.match(/^\s*\((high|medium|low|info)\)/i);
  if (bare && bare[1]) return bare[1].toLowerCase();
  return undefined;
}

function stripLeadingTier(headline: string): string {
  return headline.replace(/^\s*\((?:high|medium|low|info)(?:\s+impact)?\)\s*/i, '');
}

function truncate(s: string, max: number): string {
  if (max <= 0) return '';
  if (s.length <= max) return s;
  if (max <= 1) return s.slice(0, max);
  return `${s.slice(0, max - 1)}…`;
}

function capAt(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}
