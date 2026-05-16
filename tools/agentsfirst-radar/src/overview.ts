// overview.ts — Inspectable State surface for agentsfirst-radar (Principle 9).
//
// Pure functions over RadarState. No I/O. Used in two places:
//   1. The bottom of every morning briefing (the "🩺 Inspectable State (today)"
//      block — see docs/plans/2026-05-15-agentsfirst-radar-design.md §5.2).
//   2. The output of the `radar_overview` MCP tool (wired into agentsfirst-mcp
//      in a later wave).
//
// Design contract: docs/plans/2026-05-15-agentsfirst-radar-design.md §5.2.

import type { RadarState, Recommendation, SourceHealth, BriefingEntry } from './state.js';
import { MULTIPOV_DAILY_CAP_USD } from './state.js';

// ─── Public types ────────────────────────────────────────────────────────────

export interface RadarOverviewMetrics {
  acceptance_rate_7d_num: number;
  acceptance_rate_7d_den: number;
  acceptance_rate_30d_num: number;
  acceptance_rate_30d_den: number;
  auto_dismissed_30d: number;
  recs_open_gt_24h: number;
  sources_healthy: number;
  sources_degraded: number;
  sources_dead: number;
  source_health_delta_since_last_briefing: number;
  cron_freshness_iso: string;
  cron_freshness_age_hours: number;
  agent_paused: boolean;
  pause_reason?: string;
  multipov_spend_today_usd: number;
  multipov_cap_today_usd: number;
}

// ─── Internal constants ──────────────────────────────────────────────────────

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;
const ACCEPTED_STATUSES: ReadonlySet<Recommendation['status']> = new Set([
  'accepted',
  'in_flight',
  'shipped',
]);
const RESOLVED_STATUSES: ReadonlySet<Recommendation['status']> = new Set([
  'accepted',
  'in_flight',
  'shipped',
  'dismissed',
  'auto_dismissed',
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countDegraded(sources: Record<string, SourceHealth>): number {
  let n = 0;
  for (const id of Object.keys(sources)) {
    const s = sources[id];
    if (!s) continue;
    if (s.consecutive_failures >= 1 && s.consecutive_failures < 3) n += 1;
  }
  return n;
}

function priorDegradedCount(state: RadarState): number | null {
  // We don't snapshot historical source-health counts in BriefingEntry today,
  // so the "delta since last briefing" is computed as "degraded-now minus
  // degraded-at-prior-briefing-time" — but since we only have the briefing
  // existence (not its source health), we approximate by treating each
  // briefing as a fresh checkpoint and returning 0 when no briefings exist.
  // When the BriefingEntry schema later carries a sources_health_snapshot
  // field, swap this implementation to read it directly.
  if (state.briefings.length === 0) return null;
  const last = state.briefings[state.briefings.length - 1] as BriefingEntry | undefined;
  if (!last) return null;
  // Until BriefingEntry carries a snapshot, the best we can do is treat the
  // last briefing as "zero degraded at that time" — meaning the reported
  // delta is the current degraded count when a prior briefing exists, or 0
  // when none does. That intentionally avoids false negatives ("no change"
  // when degradation actually grew between briefings).
  return 0;
}

function inTrailingWindow(iso: string, nowMs: number, days: number): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return nowMs - t <= days * DAY_MS && t <= nowMs;
}

function pct(num: number, den: number): string {
  if (den === 0) return '—';
  return `${Math.round((num / den) * 100)}%`;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function ageString(iso: string, nowMs: number): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '?';
  const ageH = (nowMs - t) / HOUR_MS;
  if (ageH < 1) return `${Math.max(0, Math.round(ageH * 60))}m`;
  if (ageH < 48) return `${Math.round(ageH)}h`;
  return `${Math.round(ageH / 24)}d`;
}

// ─── computeMetrics ──────────────────────────────────────────────────────────

export function computeMetrics(state: RadarState, nowIso: string): RadarOverviewMetrics {
  const nowMs = Date.parse(nowIso);

  let accept7Num = 0;
  let accept7Den = 0;
  let accept30Num = 0;
  let accept30Den = 0;
  let autoDismissed30 = 0;
  let recsOpenGt24h = 0;

  for (const id of Object.keys(state.recommendations)) {
    const rec = state.recommendations[id];
    if (!rec) continue;

    const in7 = inTrailingWindow(rec.created_iso, nowMs, 7);
    const in30 = inTrailingWindow(rec.created_iso, nowMs, 30);

    if (RESOLVED_STATUSES.has(rec.status)) {
      if (in7) {
        accept7Den += 1;
        if (ACCEPTED_STATUSES.has(rec.status)) accept7Num += 1;
      }
      if (in30) {
        accept30Den += 1;
        if (ACCEPTED_STATUSES.has(rec.status)) accept30Num += 1;
      }
    }

    if (rec.status === 'auto_dismissed' && inTrailingWindow(rec.status_changed_iso, nowMs, 30)) {
      autoDismissed30 += 1;
    }

    if (rec.status === 'open') {
      const createdMs = Date.parse(rec.created_iso);
      if (!Number.isNaN(createdMs) && nowMs - createdMs > 24 * HOUR_MS) {
        recsOpenGt24h += 1;
      }
    }
  }

  let healthy = 0;
  let degraded = 0;
  let dead = 0;
  for (const id of Object.keys(state.sources_health)) {
    const s = state.sources_health[id];
    if (!s) continue;
    if (s.consecutive_failures === 0) healthy += 1;
    else if (s.consecutive_failures < 3) degraded += 1;
    else dead += 1;
  }

  const priorDegraded = priorDegradedCount(state);
  const delta = priorDegraded === null ? 0 : degraded - priorDegraded;

  const lastRunMs = Date.parse(state.last_run_iso);
  const ageHours = Number.isNaN(lastRunMs) ? 0 : (nowMs - lastRunMs) / HOUR_MS;

  const metrics: RadarOverviewMetrics = {
    acceptance_rate_7d_num: accept7Num,
    acceptance_rate_7d_den: accept7Den,
    acceptance_rate_30d_num: accept30Num,
    acceptance_rate_30d_den: accept30Den,
    auto_dismissed_30d: autoDismissed30,
    recs_open_gt_24h: recsOpenGt24h,
    sources_healthy: healthy,
    sources_degraded: degraded,
    sources_dead: dead,
    source_health_delta_since_last_briefing: delta,
    cron_freshness_iso: state.last_run_iso,
    cron_freshness_age_hours: Math.round(ageHours * 10) / 10,
    agent_paused: state.agent_paused,
    multipov_spend_today_usd: state.multipov_spend_today_usd,
    multipov_cap_today_usd: MULTIPOV_DAILY_CAP_USD,
  };
  if (state.pause_reason !== undefined) {
    metrics.pause_reason = state.pause_reason;
  }
  return metrics;
}

// ─── renderInspectableStateBlock ─────────────────────────────────────────────

export function renderInspectableStateBlock(metrics: RadarOverviewMetrics): string {
  const lines: string[] = [];
  lines.push('## 🩺 Inspectable State (today)');
  lines.push('');
  lines.push(
    `- Acceptance rate (7d): ${metrics.acceptance_rate_7d_num}/${metrics.acceptance_rate_7d_den} = ${pct(metrics.acceptance_rate_7d_num, metrics.acceptance_rate_7d_den)}`,
  );
  lines.push(
    `- Acceptance rate (30d): ${metrics.acceptance_rate_30d_num}/${metrics.acceptance_rate_30d_den} = ${pct(metrics.acceptance_rate_30d_num, metrics.acceptance_rate_30d_den)}`,
  );
  lines.push(`- Auto-dismissed-stale (30d): ${metrics.auto_dismissed_30d}`);
  lines.push(`- Recommendations open >24h: ${metrics.recs_open_gt_24h}`);

  const deltaStr =
    metrics.source_health_delta_since_last_briefing === 0
      ? 'no change'
      : `${metrics.source_health_delta_since_last_briefing > 0 ? '+' : ''}${metrics.source_health_delta_since_last_briefing}`;
  lines.push(`- Source-health degradation since last briefing: ${deltaStr}`);

  const freshEmoji = metrics.cron_freshness_age_hours <= 26 ? '✅' : '🚨';
  lines.push(
    `- Cron freshness: ${freshEmoji} last successful run ${metrics.cron_freshness_iso} (${metrics.cron_freshness_age_hours}h ago)`,
  );

  if (metrics.agent_paused) {
    const reason = metrics.pause_reason ?? '(no reason recorded)';
    lines.push(`- ⏸️ PAUSED: ${reason}`);
  }

  const halfCap = metrics.multipov_cap_today_usd / 2;
  if (metrics.multipov_spend_today_usd > halfCap) {
    lines.push(
      `- 💸 Multipov spend today: $${metrics.multipov_spend_today_usd.toFixed(2)} of $${metrics.multipov_cap_today_usd.toFixed(2)} cap`,
    );
  }

  return lines.join('\n');
}

// ─── renderOverviewMarkdown ──────────────────────────────────────────────────

interface RecentRecRow {
  id: string;
  lane: Recommendation['lane'];
  status: Recommendation['status'];
  created_iso: string;
  headline: string;
}

function pickRecentRecs(state: RadarState, limit: number): RecentRecRow[] {
  const rows: RecentRecRow[] = [];
  for (const id of Object.keys(state.recommendations)) {
    const rec = state.recommendations[id];
    if (!rec) continue;
    rows.push({
      id: rec.id,
      lane: rec.lane,
      status: rec.status,
      created_iso: rec.created_iso,
      headline: rec.headline,
    });
  }
  rows.sort((a, b) => Date.parse(b.created_iso) - Date.parse(a.created_iso));
  return rows.slice(0, limit);
}

interface DegradedSourceRow {
  source_id: string;
  consecutive_failures: number;
  last_attempt_iso: string;
  last_error: string | null;
}

function pickRecentlyDegraded(state: RadarState, limit: number): DegradedSourceRow[] {
  const rows: DegradedSourceRow[] = [];
  for (const id of Object.keys(state.sources_health)) {
    const s = state.sources_health[id];
    if (!s) continue;
    if (s.consecutive_failures < 1) continue;
    rows.push({
      source_id: s.source_id,
      consecutive_failures: s.consecutive_failures,
      last_attempt_iso: s.last_attempt_iso,
      last_error: s.last_error,
    });
  }
  rows.sort((a, b) => Date.parse(b.last_attempt_iso) - Date.parse(a.last_attempt_iso));
  return rows.slice(0, limit);
}

export function renderOverviewMarkdown(state: RadarState, nowIso?: string): string {
  const now = nowIso ?? new Date().toISOString();
  const nowMs = Date.parse(now);
  const metrics = computeMetrics(state, now);

  const parts: string[] = [];
  parts.push(renderInspectableStateBlock(metrics));

  parts.push('');
  parts.push('## Recent recommendations (last 10)');
  parts.push('');
  const recent = pickRecentRecs(state, 10);
  if (recent.length === 0) {
    parts.push('No recommendations on file yet.');
  } else {
    parts.push('| ID | Lane | Status | Age | Headline |');
    parts.push('|----|------|--------|-----|----------|');
    for (const r of recent) {
      parts.push(
        `| \`${r.id}\` | ${r.lane} | ${r.status} | ${ageString(r.created_iso, nowMs)} | ${truncate(r.headline, 80)} |`,
      );
    }
  }

  parts.push('');
  parts.push('## Source health (5 most recently degraded)');
  parts.push('');
  const degraded = pickRecentlyDegraded(state, 5);
  if (degraded.length === 0) {
    parts.push('✅ All sources healthy.');
  } else {
    for (const d of degraded) {
      const err = d.last_error ? truncate(d.last_error, 80) : 'no error recorded';
      parts.push(
        `- \`${d.source_id}\` — ${d.consecutive_failures} consecutive failure${d.consecutive_failures === 1 ? '' : 's'} (last error: ${err})`,
      );
    }
  }

  return parts.join('\n');
}

// Internal-only export so future code that wants to track degradation snapshots
// in BriefingEntry can replace priorDegradedCount() without touching callers.
export const __internals = { countDegraded, priorDegradedCount };
