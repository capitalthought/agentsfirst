// multipov.ts — second LLM-verification layer for the radar pipeline.
//
// Dispatches plan reviews to multipov.ai for any recommendation that touches
// the canonical thesis (`index.md`) or the rubric (`score.ts`). Per the design
// doc (docs/plans/2026-05-15-agentsfirst-radar-design.md §2 multi-model table
// and §7 Principle 8), recs that touch canonical content MUST clear a multipov
// plan-review before being surfaced — single-model trust on the canonical
// thesis is an explicit anti-pattern (§8).
//
// Authority contract (per AGENTS.md):
//   - Thesis/rubric recs without a successful multipov plan-review get DROPPED,
//     not surfaced. The caller enforces this by treating `null` from
//     `reviewPlan` (cap exceeded or submit failure) as "drop the rec".
//   - Per-run multipov spend is capped via `RadarState.multipov_spend_today_usd`
//     (default $10/day, env-overridable via RADAR_MULTIPOV_CAP_USD).
//   - On cap-exceeded: surface a structured `MultipovCapExceeded` error so the
//     caller can attach `unverified_reason: 'multipov-daily-cap-exceeded'` to
//     the dropped rec for the operator log.
//
// Multipov REST API: the radar runs as a Node.js process outside Claude Code,
// so it cannot use the `mcp__multipov__*` MCP tools directly. We call the same
// surface via multipov.ai's REST API. The exact endpoint paths aren't fully
// documented for us yet — see TODO(infra) markers below. Plausible URL shapes
// based on the MCP tool names are used as defaults that ops can patch at
// integration time.
//
// Errors:
//   - Submit errors throw (caller wraps + decides whether to drop the rec).
//   - Cap-exceeded throws `MultipovCapExceeded` (typed; caller can distinguish).
//   - Poll errors are LOGGED, not thrown — returns `status: 'partial'` so the
//     caller can decide what to do with whatever findings did arrive.
//   - `reviewPlan` swallows all errors and returns `null` on any failure; it's
//     the convenience wrapper for the website-lane rec generator that wants
//     "did it pass review or not" as a single boolean-ish answer.

import { MULTIPOV_DAILY_CAP_USD, RadarState } from './state.js';

// ─── Cost model (per /multipov-plan tip docs) ────────────────────────────────

export const DEEP_MODE_COST_USD = 0.98;
export const QUICK_MODE_COST_USD = 0.26;

// ─── API config ──────────────────────────────────────────────────────────────

// TODO(infra): confirm multipov REST base URL with the multipov team. Default
// matches the public marketing domain; ops can override via env without a code
// change if the API is mounted at a subdomain (e.g. api.multipov.ai).
const MULTIPOV_BASE_URL =
  process.env.RADAR_MULTIPOV_BASE_URL ?? 'https://multipov.ai/api/v1';
const MULTIPOV_REVIEW_BASE_URL =
  process.env.RADAR_MULTIPOV_REVIEW_BASE_URL ?? 'https://multipov.ai/review';

function getApiKey(): string {
  const key = process.env.MULTIPOV_API_KEY;
  if (!key) {
    throw new Error(
      'MULTIPOV_API_KEY is not set. Get one from https://multipov.ai/settings/api-keys ' +
        'and export it before invoking the radar.',
    );
  }
  return key;
}

// ─── Public types ────────────────────────────────────────────────────────────

export interface PlanReviewSubmitResult {
  job_id: string;
  estimated_seconds: number;
  selected_personas: string[];
  review_url: string; // https://multipov.ai/review/<job_id>
}

export interface PlanReviewFinding {
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  recommendation: string;
  file?: string;
  line?: number;
  reviewer?: string;
}

export interface PlanReviewReport {
  job_id: string;
  status: 'complete' | 'failed' | 'cancelled' | 'partial';
  consensus_findings: PlanReviewFinding[];
  disputed_findings: PlanReviewFinding[];
  single_model_findings: PlanReviewFinding[];
  dropped_by_disproval: PlanReviewFinding[];
  warnings: string[];
  duration_ms?: number;
  spent_usd: number; // approx, charged to multipov_spend_today_usd
  review_url: string;
}

export class MultipovCapExceeded extends Error {
  constructor(
    public spent: number,
    public cap: number,
  ) {
    super(
      `Multipov daily cap exceeded: spent $${spent.toFixed(2)} of $${cap.toFixed(2)}`,
    );
    this.name = 'MultipovCapExceeded';
  }
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function modeCost(mode: 'quick' | 'deep'): number {
  return mode === 'deep' ? DEEP_MODE_COST_USD : QUICK_MODE_COST_USD;
}

function reviewUrl(jobId: string): string {
  return `${MULTIPOV_REVIEW_BASE_URL}/${jobId}`;
}

/**
 * Coerce arbitrary persona shapes from the API into a string list of IDs.
 * The MCP tool docs return `[{id, name, role}]`; we keep only the `id` field
 * for the submit-result. Tolerates either an array of strings or an array of
 * `{id}` objects so we don't break if the API hands us either shape.
 */
function coercePersonaIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const ids: string[] = [];
  for (const item of input) {
    if (typeof item === 'string') {
      ids.push(item);
    } else if (
      item &&
      typeof item === 'object' &&
      'id' in item &&
      typeof (item as { id: unknown }).id === 'string'
    ) {
      ids.push((item as { id: string }).id);
    }
  }
  return ids;
}

/**
 * Pluck a finding array out of the report JSON. The API returns either
 * camelCase (per the MCP tool docs) or snake_case depending on version; this
 * tolerates both so a server-side rename doesn't silently zero out findings.
 */
function pluckFindings(
  report: Record<string, unknown>,
  camel: string,
  snake: string,
): PlanReviewFinding[] {
  const raw = report[camel] ?? report[snake];
  if (!Array.isArray(raw)) return [];
  const out: PlanReviewFinding[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const severity = obj['severity'];
    const description = obj['description'];
    const recommendation = obj['recommendation'];
    if (
      (severity === 'Critical' ||
        severity === 'High' ||
        severity === 'Medium' ||
        severity === 'Low') &&
      typeof description === 'string' &&
      typeof recommendation === 'string'
    ) {
      const finding: PlanReviewFinding = {
        severity,
        description,
        recommendation,
      };
      if (typeof obj['file'] === 'string') finding.file = obj['file'] as string;
      if (typeof obj['line'] === 'number') finding.line = obj['line'] as number;
      if (typeof obj['reviewer'] === 'string') {
        finding.reviewer = obj['reviewer'] as string;
      }
      out.push(finding);
    }
  }
  return out;
}

function pluckWarnings(report: Record<string, unknown>): string[] {
  const raw = report['warnings'];
  if (!Array.isArray(raw)) return [];
  return raw.filter((w): w is string => typeof w === 'string');
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Submit a plan review. Throws on submit error. Caller polls + fetches the
 * report separately via `pollUntilComplete`.
 *
 * Honors the daily cost cap: if `state.multipov_spend_today_usd` + estimated
 * cost would exceed `MULTIPOV_DAILY_CAP_USD`, throws `MultipovCapExceeded`
 * BEFORE making the network call. Callers MUST drop the rec on this error.
 */
export async function submitPlanReview(args: {
  content: string;
  file_name: string;
  mode: 'quick' | 'deep';
  state: RadarState;
}): Promise<PlanReviewSubmitResult> {
  // Type-check guard: enforce string at the boundary so a caller passing a
  // Buffer or stream can't silently smuggle it past the contract.
  if (typeof args.content !== 'string') {
    throw new TypeError('submitPlanReview: content must be a string');
  }
  if (typeof args.file_name !== 'string') {
    throw new TypeError('submitPlanReview: file_name must be a string');
  }

  const estimated = modeCost(args.mode);
  const projected = args.state.multipov_spend_today_usd + estimated;
  if (projected > MULTIPOV_DAILY_CAP_USD) {
    throw new MultipovCapExceeded(projected, MULTIPOV_DAILY_CAP_USD);
  }

  const apiKey = getApiKey();
  // TODO(infra): confirm multipov REST endpoint URL + response shape with the
  // multipov team. Default path assumes `POST /api/v1/plan-reviews` returns
  // `{job_id, estimated_seconds, selected_personas: [{id, name, role}]}`.
  const url = `${MULTIPOV_BASE_URL}/plan-reviews`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      content: args.content,
      file_name: args.file_name,
      mode: args.mode,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '<unreadable>');
    throw new Error(
      `multipov submit failed: HTTP ${res.status} ${res.statusText} — ${body.slice(0, 500)}`,
    );
  }

  const raw = (await res.json()) as Record<string, unknown>;
  const jobId = raw['job_id'];
  if (typeof jobId !== 'string' || jobId.length === 0) {
    throw new Error(
      `multipov submit: response missing job_id (got: ${JSON.stringify(raw).slice(0, 300)})`,
    );
  }
  const estimatedSeconds =
    typeof raw['estimated_seconds'] === 'number'
      ? (raw['estimated_seconds'] as number)
      : 0;
  const personas = coercePersonaIds(raw['selected_personas']);

  return {
    job_id: jobId,
    estimated_seconds: estimatedSeconds,
    selected_personas: personas,
    review_url: reviewUrl(jobId),
  };
}

/**
 * Poll a submitted job until terminal. Returns the final report. Times out
 * after `maxWaitMs` (default 10min); on timeout returns `status: 'partial'`
 * with whatever the API reports as completed. NEVER throws on review failure —
 * a failed review returns `status: 'failed'` so the caller can drop the rec
 * uniformly with cap-exceeded / submit-failure paths.
 *
 * Network errors mid-poll are LOGGED to stderr and retried on the next tick;
 * if the timeout window closes with no terminal response, we return a partial
 * report rather than throwing.
 */
export async function pollUntilComplete(args: {
  job_id: string;
  maxWaitMs?: number;
}): Promise<PlanReviewReport> {
  const maxWaitMs = args.maxWaitMs ?? 600_000;
  const start = Date.now();
  const apiKey = getApiKey();
  // TODO(infra): confirm multipov REST endpoint URL + response shape — status
  // path assumes `GET /api/v1/plan-reviews/<id>/status` returns
  // `{status, completed_count, total_count, partial, missing_personas}`.
  const statusUrl = `${MULTIPOV_BASE_URL}/plan-reviews/${encodeURIComponent(args.job_id)}/status`;
  // TODO(infra): confirm multipov REST endpoint URL + response shape — report
  // path assumes `GET /api/v1/plan-reviews/<id>/report` returns camelCase keys
  // (consensusFindings, disputedFindings, singleModelFindings,
  // droppedByDisproval, warnings, durationMs).
  const reportUrl = `${MULTIPOV_BASE_URL}/plan-reviews/${encodeURIComponent(args.job_id)}/report`;

  let lastStatus: string = 'pending';

  // 5s poll interval matches the multipov dashboard default.
  const POLL_INTERVAL_MS = 5_000;

  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(statusUrl, {
        headers: { authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        process.stderr.write(
          `[multipov] poll http ${res.status} ${res.statusText} for ${args.job_id}; retrying\n`,
        );
      } else {
        const body = (await res.json()) as Record<string, unknown>;
        const status = typeof body['status'] === 'string' ? body['status'] : 'pending';
        lastStatus = status;
        if (
          status === 'complete' ||
          status === 'failed' ||
          status === 'cancelled'
        ) {
          break;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `[multipov] poll error for ${args.job_id}: ${msg}; retrying\n`,
      );
    }
    await sleep(POLL_INTERVAL_MS);
  }

  const reviewUrlStr = reviewUrl(args.job_id);
  // We always charge the deep-mode cost on terminal; callers that want quick
  // can call submitPlanReview directly + pass mode through. `reviewPlan` always
  // uses deep mode so this is the dominant path in practice. The radar
  // pre-flights the cap before submit, so worst case we slightly over-attribute
  // on a quick-mode review — acceptable for the operator log.
  // TODO(infra): once multipov returns actual spent_usd in the report, prefer
  // that over the modeCost estimate.
  const spent = DEEP_MODE_COST_USD;

  if (
    lastStatus !== 'complete' &&
    lastStatus !== 'failed' &&
    lastStatus !== 'cancelled'
  ) {
    // Timed out before terminal status — return partial.
    return {
      job_id: args.job_id,
      status: 'partial',
      consensus_findings: [],
      disputed_findings: [],
      single_model_findings: [],
      dropped_by_disproval: [],
      warnings: [
        `multipov plan-review did not reach terminal status within ${maxWaitMs}ms (last status: ${lastStatus})`,
      ],
      spent_usd: spent,
      review_url: reviewUrlStr,
    };
  }

  if (lastStatus === 'failed' || lastStatus === 'cancelled') {
    return {
      job_id: args.job_id,
      status: lastStatus,
      consensus_findings: [],
      disputed_findings: [],
      single_model_findings: [],
      dropped_by_disproval: [],
      warnings: [`multipov plan-review terminated with status: ${lastStatus}`],
      spent_usd: spent,
      review_url: reviewUrlStr,
    };
  }

  // Terminal complete — fetch the report.
  try {
    const res = await fetch(reportUrl, {
      headers: { authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '<unreadable>');
      process.stderr.write(
        `[multipov] report fetch failed for ${args.job_id}: HTTP ${res.status} — ${body.slice(0, 300)}\n`,
      );
      return {
        job_id: args.job_id,
        status: 'partial',
        consensus_findings: [],
        disputed_findings: [],
        single_model_findings: [],
        dropped_by_disproval: [],
        warnings: [`report fetch failed: HTTP ${res.status}`],
        spent_usd: spent,
        review_url: reviewUrlStr,
      };
    }
    const raw = (await res.json()) as Record<string, unknown>;
    const durationRaw = raw['durationMs'] ?? raw['duration_ms'];
    const report: PlanReviewReport = {
      job_id: args.job_id,
      status: 'complete',
      consensus_findings: pluckFindings(raw, 'consensusFindings', 'consensus_findings'),
      disputed_findings: pluckFindings(raw, 'disputedFindings', 'disputed_findings'),
      single_model_findings: pluckFindings(
        raw,
        'singleModelFindings',
        'single_model_findings',
      ),
      dropped_by_disproval: pluckFindings(
        raw,
        'droppedByDisproval',
        'dropped_by_disproval',
      ),
      warnings: pluckWarnings(raw),
      spent_usd: spent,
      review_url: reviewUrlStr,
    };
    if (typeof durationRaw === 'number') {
      report.duration_ms = durationRaw;
    }
    return report;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(
      `[multipov] report parse failed for ${args.job_id}: ${msg}\n`,
    );
    return {
      job_id: args.job_id,
      status: 'partial',
      consensus_findings: [],
      disputed_findings: [],
      single_model_findings: [],
      dropped_by_disproval: [],
      warnings: [`report parse failed: ${msg}`],
      spent_usd: spent,
      review_url: reviewUrlStr,
    };
  }
}

/**
 * Convenience: submit + poll + return the report in one call. Recommended for
 * the website-lane rec generator. Always uses deep mode (per /multipov-plan
 * tip: "Always use deep mode for plan review"). Returns `null` if:
 *   - the daily cap is exceeded, OR
 *   - the submit call fails for any reason.
 *
 * A returned report with `status: 'failed' | 'cancelled' | 'partial'` should
 * be treated by the caller as "review did not validate" — drop the rec, log
 * the review_url for operator follow-up. Only `status: 'complete'` with zero
 * Critical findings should be treated as "verified, surface the rec".
 */
export async function reviewPlan(args: {
  content: string;
  file_name: string;
  state: RadarState;
}): Promise<PlanReviewReport | null> {
  let submit: PlanReviewSubmitResult;
  try {
    submit = await submitPlanReview({
      content: args.content,
      file_name: args.file_name,
      mode: 'deep',
      state: args.state,
    });
  } catch (err) {
    if (err instanceof MultipovCapExceeded) {
      process.stderr.write(
        `[multipov] daily cap exceeded ($${err.spent.toFixed(2)} of $${err.cap.toFixed(2)}); dropping ${args.file_name}\n`,
      );
      return null;
    }
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(
      `[multipov] submit failed for ${args.file_name}: ${msg}\n`,
    );
    return null;
  }

  return pollUntilComplete({
    job_id: submit.job_id,
    maxWaitMs: 600_000,
  });
}

/**
 * Apply the spend delta returned in a report to the state. Returns NEW state
 * (immutable update) — caller writes it via `writeStateAtomic`.
 */
export function recordSpend(state: RadarState, spentUsd: number): RadarState {
  return {
    ...state,
    multipov_spend_today_usd: state.multipov_spend_today_usd + spentUsd,
  };
}

// ─── tiny utils ──────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
