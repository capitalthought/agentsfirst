// website.ts — turn Website-lane planner proposals into full Recommendations,
// gated on a successful multipov plan-review.
//
// Per the design doc (docs/plans/2026-05-15-agentsfirst-radar-design.md §2,
// §7 Principle 8, §8 anti-patterns) and the AGENTS.md Authority contract:
// any rec that touches the canonical thesis (index.md), the rubric (score.ts),
// or a new /reports/<vendor>/index.md page MUST clear a multipov plan-review
// before being surfaced. If multipov is unavailable OR returns Critical/High
// consensus findings OR the body model returns `UNCLEAR`, the rec is DROPPED.
// There is NO single-model fallback for canonical thesis edits — that's
// "Single-Model Trust on canonical thesis" from §8.
//
// Prompt-injection boundary: this module is the Planner-LLM stage (Step E in
// §3 data flow). It MUST NOT receive raw source content (raw_text) from the
// reader's triaged_signals — only the structured fields the reader emitted
// (bucket, summary_quote, signal_strength, url). The body-generation prompt
// below enforces this by reading exclusively from proposal.headline,
// proposal.motivation, proposal.source_urls, and the bucketed signal summaries.
//
// Exports:
//   - WebsiteRecGenerationResult (interface)
//   - generateWebsiteRecs(args) -> Promise<WebsiteRecGenerationResult>

import Anthropic from '@anthropic-ai/sdk';

import {
  Recommendation,
  RadarState,
  newRecommendation,
  parentEventIdFromUrls,
} from '../state.js';
import { PlannerLaneProposal } from '../triage.js';
import {
  reviewPlan,
  recordSpend,
  PlanReviewReport,
  MultipovCapExceeded,
} from '../multipov.js';

// ─── Public types ────────────────────────────────────────────────────────────

export interface WebsiteRecDrop {
  headline: string;
  reason: string;
}

export interface WebsiteRecGenerationResult {
  /** Recs that passed multipov plan-review with zero Critical/High findings. */
  recs: Recommendation[];
  /** Proposals dropped before surfacing (cap exceeded, UNCLEAR body, blocker findings). */
  dropped_unverified: WebsiteRecDrop[];
  /** Updated state — `multipov_spend_today_usd` accumulated across each successful review. */
  state: RadarState;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

const ANTHROPIC_MODEL = process.env.RADAR_ANTHROPIC_MODEL ?? 'claude-opus-4-7';
const ANTHROPIC_MAX_TOKENS = Number(process.env.RADAR_ANTHROPIC_MAX_TOKENS ?? 1500);

function getAnthropicClient(): Anthropic {
  // SDK reads ANTHROPIC_API_KEY from env by default; we don't pass it explicitly
  // so a missing key surfaces as the SDK's own auth error rather than a
  // hand-rolled string match.
  return new Anthropic();
}

// parentEventIdFromUrls moved to ../state.js so all three rec generators
// (website / social / other) share the same derivation. Imported above.

/**
 * The body-generation system prompt. Tight and explicit so the model knows:
 *   1. The output will pass through multipov before reaching Josh, so accuracy
 *      matters more than ambition.
 *   2. It MUST NOT fabricate file:line anchors or citation URLs.
 *   3. `UNCLEAR` is a legitimate output when the proposal is too abstract.
 */
const BODY_GENERATION_SYSTEM_PROMPT = [
  'You are drafting a single Website-lane recommendation for the agentsfirst-radar morning briefing.',
  'The recommendation will be submitted for a multi-model plan review BEFORE being surfaced to Josh,',
  'so accuracy matters more than ambition — over-claiming a citation or fabricating a line number',
  'will cause the rec to be dropped.',
  '',
  'Output ONLY the Markdown body. No preamble, no closing remarks, no explanation outside the body.',
  '',
  'Required structure:',
  '',
  '**File:** `<path>:<line>` (or `see body` if the line is unknown — but try to anchor)',
  '**Patch:**',
  '```diff',
  '- <verbatim old text from the canonical doc>',
  '+ <proposed new text>',
  '```',
  '**Why:** <2-3 sentence motivation citing source URLs inline as markdown links>',
  '**Reply:** `accept <id>` → opens PR · `dismiss <id> <reason>` · `defer <id> 7d`',
  '',
  'If you do not have enough concrete information to write a real diff (e.g., the proposal is too',
  'abstract, the target file/line is not clear from context, or you would need to invent the old',
  'text being replaced), output exactly the single line:',
  '',
  'UNCLEAR',
  '',
  'and nothing else. The radar will drop the rec without consulting multipov.',
].join('\n');

/**
 * Render the planner proposal into the user-prompt block. This is the
 * data-side of the prompt-injection boundary — we surface ONLY the
 * reader-stage structured fields (bucket, summary_quote, signal_strength, url)
 * plus the planner-stage fields (headline, motivation, source_urls). NEVER
 * `raw_text` from the underlying source.
 */
function buildUserPrompt(proposal: PlannerLaneProposal): string {
  const signals = proposal.triaged_signals
    .map((s, i) => {
      return [
        `Signal ${i + 1}:`,
        `  - bucket: ${s.bucket}`,
        `  - signal_strength: ${s.signal_strength}`,
        `  - url: ${s.url}`,
        `  - summary_quote: ${JSON.stringify(s.summary_quote)}`,
      ].join('\n');
    })
    .join('\n');

  return [
    `Headline: ${proposal.headline}`,
    `Motivation: ${proposal.motivation}`,
    `Source URLs:`,
    ...proposal.source_urls.map((u) => `  - ${u}`),
    '',
    `Triaged signals (reader-stage structured output ONLY — no raw source text):`,
    signals,
  ].join('\n');
}

/**
 * Call Anthropic to draft the body markdown. Returns the trimmed text. If the
 * model returns just `UNCLEAR` (the planner's safety hatch), the caller drops
 * the rec without consulting multipov.
 *
 * Errors bubble — the caller wraps and counts the proposal as
 * dropped_unverified with the error message.
 */
async function draftBody(
  proposal: PlannerLaneProposal,
  abortSignal: AbortSignal | undefined,
): Promise<string> {
  const client = getAnthropicClient();
  const userPrompt = buildUserPrompt(proposal);

  const requestOptions: { signal?: AbortSignal } = {};
  if (abortSignal) requestOptions.signal = abortSignal;

  const res = await client.messages.create(
    {
      model: ANTHROPIC_MODEL,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      system: BODY_GENERATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    },
    requestOptions,
  );

  // Concatenate all text-typed content blocks (the API may return a mix; in
  // practice for messages.create with text input we get one or more text
  // blocks). Defensive against shape drift.
  const parts: string[] = [];
  for (const block of res.content) {
    if (block.type === 'text') parts.push(block.text);
  }
  return parts.join('').trim();
}

/**
 * Slugify a headline into a `<slug>.md` file_name for the multipov plan-review
 * submission. multipov treats the doc as markdown; the file_name is mostly
 * cosmetic (shows up in the reviewer UI) but should be stable + human-readable.
 */
function headlineToFilename(headline: string): string {
  const slug = headline
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || 'untitled'}.md`;
}

/**
 * Count Critical/High consensus findings — these are the blocker tiers per the
 * plan-review contract. Medium/Low go into the briefing as informational notes
 * but don't kill the rec.
 */
function countBlockerFindings(report: PlanReviewReport): number {
  let n = 0;
  for (const f of report.consensus_findings) {
    if (f.severity === 'Critical' || f.severity === 'High') n += 1;
  }
  return n;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * For each website-lane proposal:
 *   1. Draft a markdown body via Opus (no raw source text in the prompt).
 *   2. If body is `UNCLEAR`, drop the rec.
 *   3. Submit to multipov plan-review (deep mode). If reviewPlan returns null
 *      (cap exceeded or submit failed) OR the report status is not 'complete',
 *      drop the rec.
 *   4. If consensus findings include any Critical/High, drop the rec.
 *   5. Otherwise, mint a Recommendation via newRecommendation with the
 *      multipov_review_id wired through, and record the spend on state.
 *
 * Returns the surviving recs, the dropped list (with reasons for the briefing's
 * degraded section), and the updated state.
 */
export async function generateWebsiteRecs(args: {
  proposals: PlannerLaneProposal[];
  state: RadarState;
  runTimestamp: string;
  abortSignal?: AbortSignal;
}): Promise<WebsiteRecGenerationResult> {
  const recs: Recommendation[] = [];
  const dropped: WebsiteRecDrop[] = [];
  // Immutable update pattern — never mutate args.state. Each successful review
  // returns a new state with the spend folded in; that's what we thread forward
  // to the next iteration so cap enforcement sees the running total.
  let state: RadarState = args.state;

  for (const proposal of args.proposals) {
    // STEP 1 — draft the body
    let body: string;
    try {
      body = await draftBody(proposal, args.abortSignal);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      dropped.push({
        headline: proposal.headline,
        reason: `body generation failed: ${msg}`,
      });
      continue;
    }

    if (body === '' || body === 'UNCLEAR') {
      dropped.push({
        headline: proposal.headline,
        reason:
          'planner returned UNCLEAR — proposal too abstract or target file/line not derivable from context',
      });
      continue;
    }

    // STEP 2 — multipov plan-review (HARD GATE per AGENTS.md authority bullet)
    let report: PlanReviewReport | null;
    try {
      report = await reviewPlan({
        content: body,
        file_name: headlineToFilename(proposal.headline),
        state,
      });
    } catch (err) {
      // reviewPlan swallows MultipovCapExceeded internally and returns null,
      // but be defensive — any other error from the wrapper drops the rec.
      const reason =
        err instanceof MultipovCapExceeded
          ? `multipov daily cap exceeded ($${err.spent.toFixed(2)} of $${err.cap.toFixed(2)})`
          : `multipov submit error: ${err instanceof Error ? err.message : String(err)}`;
      dropped.push({ headline: proposal.headline, reason });
      continue;
    }

    if (report === null) {
      // Cap exceeded OR submit failed (reviewPlan logged the detail to stderr).
      // No single-model fallback — drop the rec.
      dropped.push({
        headline: proposal.headline,
        reason:
          'multipov plan-review unavailable (cap exceeded or submit failure); no single-model fallback per AGENTS.md',
      });
      continue;
    }

    if (report.status !== 'complete') {
      dropped.push({
        headline: proposal.headline,
        reason: `multipov plan-review status was '${report.status}', not 'complete' — see ${report.review_url}`,
      });
      // Even though the review didn't complete cleanly, multipov.ts attributes
      // spend to the cap. Reflect that in state so we don't keep firing the
      // same failing review type all run.
      state = recordSpend(state, report.spent_usd);
      continue;
    }

    // STEP 3 — block on Critical/High consensus findings
    const blockers = countBlockerFindings(report);
    if (blockers > 0) {
      dropped.push({
        headline: proposal.headline,
        reason: `multipov surfaced ${blockers} critical/high findings; rec body needs revision before surfacing (see ${report.review_url})`,
      });
      state = recordSpend(state, report.spent_usd);
      continue;
    }

    // STEP 4 — build the rec with multipov_review_id + parent_event_id wired
    const parentEventId = parentEventIdFromUrls(proposal.source_urls);
    const rec = newRecommendation({
      headline: proposal.headline,
      lane: 'website',
      body,
      source_urls: proposal.source_urls,
      runTimestamp: args.runTimestamp,
      multipov_review_id: report.job_id,
      parent_event_id: parentEventId,
    });
    recs.push(rec);

    // STEP 5 — accumulate spend on state for the next iteration's cap check
    state = recordSpend(state, report.spent_usd);
  }

  return { recs, dropped_unverified: dropped, state };
}
