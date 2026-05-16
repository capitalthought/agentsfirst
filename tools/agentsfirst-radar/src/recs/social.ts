// recs/social.ts — Social-lane recommendation generator.
//
// Turns Social-lane planner proposals into full Recommendation objects by:
//   1. Extracting candidate @-handles and proper names from the proposal text +
//      source URLs.
//   2. Verifying every handle via verifyHandle() per the global "Always verify
//      @-handles before drafting" rule (~/.claude/CLAUDE.md). Unverified ⇒ DROP.
//   3. Calling the social.relradar.ai Worker's /draft endpoint to generate 3
//      candidate posts via its 4-LLM pipeline + Tier 1–4 safety stack. (We do
//      not run a separate multipov review on social — the Worker IS the
//      multi-model layer per design §2.)
//   4. Rendering a markdown rec body with all three candidates, verified-handle
//      list, urgency window, generation_id (so accept can link to /social-send),
//      and reply syntax. CONFIRM round-trip (2h window) is enforced by the
//      Social-lane accept path downstream (design §3) — we just signal it here.
//
// Anti-patterns to avoid (per task spec):
//   - DO NOT skip handle verification.
//   - DO NOT surface a draft containing an unverified handle.
//   - DO NOT pass raw_text from triaged_signals to the Worker — only the
//     planner's headline + motivation.
//   - DO NOT log or include SOCIAL_WORKER_KEY anywhere.

import {
  Recommendation,
  RadarState,
  newRecommendation,
  parentEventIdFromUrls,
} from '../state.js';
import { PlannerLaneProposal } from '../triage.js';
import {
  verifyHandle,
  HandleVerification,
  recordVerifiedHandle,
} from '../handle-verify.js';

// ─── Worker config ───────────────────────────────────────────────────────────

const SOCIAL_WORKER_DRAFT_URL =
  process.env.RADAR_SOCIAL_WORKER_URL ?? 'https://social.relradar.ai/draft';

const SOCIAL_WORKER_TIMEOUT_MS = Number(
  process.env.RADAR_SOCIAL_WORKER_TIMEOUT_MS ?? 60_000,
);

function getWorkerKey(): string | null {
  const key = process.env.SOCIAL_WORKER_KEY;
  if (!key || key.length === 0) return null;
  return key;
}

// ─── Public types ────────────────────────────────────────────────────────────

export interface SocialRecGenerationResult {
  recs: Recommendation[];
  dropped: { headline: string; reason: string }[];
  state: RadarState;
}

interface SocialDraftCandidate {
  id: string;
  text: string;
  platforms: string[];
}

interface SocialDraftResponse {
  generation_id: string;
  candidates: SocialDraftCandidate[];
}

// ─── Public entry ────────────────────────────────────────────────────────────

/**
 * Generate Social-lane Recommendations from planner proposals.
 *
 * Returns the full set of recs we DID surface, the list of proposals we
 * dropped (with reasons — usually unverified handles or Worker failures), and
 * the updated state (handle_allowlist may have grown from successful Grok
 * verifications).
 */
export async function generateSocialRecs(args: {
  proposals: PlannerLaneProposal[];
  state: RadarState;
  runTimestamp: string;
  abortSignal?: AbortSignal;
}): Promise<SocialRecGenerationResult> {
  const recs: Recommendation[] = [];
  const dropped: { headline: string; reason: string }[] = [];
  let state = args.state;

  for (const proposal of args.proposals) {
    if (proposal.lane !== 'social') {
      // Defensive: caller should pre-filter, but don't silently mis-route.
      dropped.push({
        headline: proposal.headline,
        reason: `non-social lane "${proposal.lane}" passed to generateSocialRecs`,
      });
      continue;
    }

    // 1. Extract @-handle candidates + proper names from the proposal.
    const candidates = extractHandleCandidates(proposal);

    // 2. Verify every candidate. Drop the rec if any candidate that appears in
    //    the proposal text comes back unverified — we cannot risk publishing
    //    (or even surfacing as a draft) a misdirected @-mention.
    const verifications: HandleVerification[] = [];
    let unverifiedBlocker: string | null = null;
    for (const cand of candidates) {
      const v = await verifyHandle(cand.name, 'x', state.handle_allowlist);
      verifications.push(v);
      if (v.confidence !== 'unverified' && v.handle !== null) {
        state = recordVerifiedHandle(state, v);
      } else if (cand.appearsInDraftText) {
        unverifiedBlocker = cand.name;
        break;
      }
    }

    if (unverifiedBlocker) {
      dropped.push({
        headline: proposal.headline,
        reason: `unverified handle @${unverifiedBlocker} — cannot surface social draft per global @-handle rule`,
      });
      continue;
    }

    // 3. Build + send the /draft request to the Worker. We pass ONLY the
    //    planner's headline + motivation — never raw_text from triaged_signals.
    const workerKey = getWorkerKey();
    if (workerKey === null) {
      dropped.push({
        headline: proposal.headline,
        reason: 'SOCIAL_WORKER_KEY env var not set — cannot call social.relradar.ai/draft',
      });
      continue;
    }

    const verifiedHandles = verifications
      .filter((v) => v.handle !== null && v.confidence !== 'unverified')
      .map((v) => ({
        name: v.name,
        handle: v.handle as string,
        evidence_url: v.evidence_url,
      }));

    const platforms = derivePlatforms(proposal);
    let draftResponse: SocialDraftResponse;
    try {
      draftResponse = await callSocialDraftWorker({
        topic: `${proposal.headline} — ${proposal.motivation}`,
        context: buildWorkerContext({
          sourceUrls: proposal.source_urls,
          verifiedHandles,
          urgencyWindowHours: proposal.urgency_window_hours,
        }),
        platforms,
        workerKey,
        abortSignal: args.abortSignal,
      });
    } catch (err) {
      // Worker failure path — DROP the rec, log to stderr (key is never logged
      // because callSocialDraftWorker never echoes it back in errors).
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `[recs/social] /draft failed for "${proposal.headline}": ${msg}\n`,
      );
      dropped.push({
        headline: proposal.headline,
        reason: `social.relradar.ai /draft failed: ${msg}`,
      });
      continue;
    }

    if (
      !draftResponse ||
      !Array.isArray(draftResponse.candidates) ||
      draftResponse.candidates.length === 0
    ) {
      dropped.push({
        headline: proposal.headline,
        reason: 'social.relradar.ai /draft returned no candidates',
      });
      continue;
    }

    // 4. Build the rec body markdown.
    const body = renderRecBody({
      proposal,
      platforms,
      verifications,
      candidates: draftResponse.candidates,
      generationId: draftResponse.generation_id,
    });

    // parent_event_id is derived from the union of source URLs so multi-lane
    // recs from the same triggering signal cluster share an id (design Q1).
    const rec = newRecommendation({
      headline: proposal.headline,
      lane: 'social',
      body,
      source_urls: proposal.source_urls,
      runTimestamp: args.runTimestamp,
      parent_event_id: parentEventIdFromUrls(proposal.source_urls),
    });
    recs.push(rec);
  }

  return { recs, dropped, state };
}

// ─── Handle extraction ───────────────────────────────────────────────────────

interface HandleCandidate {
  name: string; // either a bare @handle or a display name like "Lily Ray"
  appearsInDraftText: boolean; // true if surfaced in motivation/headline (vs. source-URL only)
}

const X_HANDLE_RX = /@([a-zA-Z0-9_]{1,30})\b/g;
const X_URL_HANDLE_RX = /(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]{1,30})\b/gi;
// Best-effort proper-name extraction: two capitalized words in a row, both
// 2+ chars, allowing apostrophes & hyphens. Conservative on purpose — we'd
// rather miss a name than over-extract every Title-Cased phrase.
const PROPER_NAME_RX = /\b([A-Z][a-z'-]{1,}\s+[A-Z][a-z'-]{1,})\b/g;

/**
 * Extract @-handles (from text + URLs) and conservative proper-name guesses
 * (text only) from a planner proposal. URL-only handles are flagged
 * `appearsInDraftText: false` because they're attribution-only — losing them
 * doesn't put anyone in the wrong @-position; losing a text-mention handle
 * DOES, so that one's load-bearing.
 */
function extractHandleCandidates(
  proposal: PlannerLaneProposal,
): HandleCandidate[] {
  const seen = new Map<string, HandleCandidate>();
  const draftText = `${proposal.headline}\n${proposal.motivation}`;

  // Pass A: bare @-handles in headline + motivation.
  for (const match of draftText.matchAll(X_HANDLE_RX)) {
    const handle = match[1];
    if (!handle) continue;
    const key = handle.toLowerCase();
    seen.set(key, { name: handle, appearsInDraftText: true });
  }

  // Pass B: handles inferred from x.com / twitter.com URLs in source_urls.
  // These are attribution context only — they do NOT appear in the draft text,
  // so confidence failure on them shouldn't block surfacing the rec.
  for (const url of proposal.source_urls) {
    for (const match of url.matchAll(X_URL_HANDLE_RX)) {
      const handle = match[1];
      if (!handle) continue;
      // Skip "status", "i", "intent" — not real handle slots.
      if (handle === 'status' || handle === 'i' || handle === 'intent') {
        continue;
      }
      const key = handle.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, { name: handle, appearsInDraftText: false });
      }
    }
  }

  // Pass C: proper-name heuristic on the draft text. Best-effort; the
  // verifyHandle() Grok path will resolve "Lily Ray" → @lilyraynyc.
  for (const match of draftText.matchAll(PROPER_NAME_RX)) {
    const name = match[1];
    if (!name) continue;
    const key = `name:${name.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.set(key, { name, appearsInDraftText: true });
    }
  }

  return [...seen.values()];
}

// ─── Worker call ─────────────────────────────────────────────────────────────

async function callSocialDraftWorker(args: {
  topic: string;
  context: string;
  platforms: string[];
  workerKey: string;
  abortSignal?: AbortSignal;
}): Promise<SocialDraftResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SOCIAL_WORKER_TIMEOUT_MS);
  // Forward outer abort if provided.
  const outer = args.abortSignal;
  const onOuterAbort = () => controller.abort();
  if (outer) {
    if (outer.aborted) controller.abort();
    else outer.addEventListener('abort', onOuterAbort, { once: true });
  }

  let res: Response;
  try {
    res = await fetch(SOCIAL_WORKER_DRAFT_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // NOTE: never log this header — see top-of-file anti-pattern note.
        authorization: `Bearer ${args.workerKey}`,
      },
      body: JSON.stringify({
        topic: args.topic,
        context: args.context,
        platforms: args.platforms,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
    if (outer) outer.removeEventListener('abort', onOuterAbort);
  }

  if (!res.ok) {
    const bodyPreview = await res.text().catch(() => '<unreadable>');
    // Sanitize: scrub anything that looks like the key in case the Worker
    // echoed the Authorization header back (it shouldn't, but defense in
    // depth — never trust a remote service to keep our key out of its body).
    const safe = scrubSecrets(bodyPreview, args.workerKey).slice(0, 500);
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${safe}`);
  }

  const raw = (await res.json().catch(() => null)) as unknown;
  if (!raw || typeof raw !== 'object') {
    throw new Error('response body is not a JSON object');
  }
  const obj = raw as Record<string, unknown>;
  const generationId = obj['generation_id'];
  const rawCandidates = obj['candidates'];
  if (typeof generationId !== 'string' || generationId.length === 0) {
    throw new Error('response missing generation_id');
  }
  if (!Array.isArray(rawCandidates)) {
    throw new Error('response.candidates is not an array');
  }
  const candidates: SocialDraftCandidate[] = [];
  for (const item of rawCandidates) {
    if (!item || typeof item !== 'object') continue;
    const c = item as Record<string, unknown>;
    const id = c['id'];
    const text = c['text'];
    const plats = c['platforms'];
    if (typeof id !== 'string' || typeof text !== 'string') continue;
    const platforms = Array.isArray(plats)
      ? plats.filter((p): p is string => typeof p === 'string')
      : [];
    candidates.push({ id, text, platforms });
  }
  if (candidates.length === 0) {
    throw new Error('response.candidates contained no well-formed entries');
  }

  return { generation_id: generationId, candidates };
}

/** Defense-in-depth: never let the worker key leak into a log line. */
function scrubSecrets(s: string, key: string): string {
  if (!key) return s;
  // Use split/join (no regex) to avoid regex-injection of metacharacters in
  // the key. Replace the literal key wherever it appears in the response body.
  return s.split(key).join('[REDACTED]');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function derivePlatforms(proposal: PlannerLaneProposal): string[] {
  const platforms = new Set<string>(['x']);
  for (const url of proposal.source_urls) {
    if (/linkedin\.com\//i.test(url)) platforms.add('linkedin');
    if (/bsky\.app|bsky\.social/i.test(url)) platforms.add('bluesky');
  }
  return [...platforms];
}

function buildWorkerContext(args: {
  sourceUrls: string[];
  verifiedHandles: { name: string; handle: string; evidence_url?: string }[];
  urgencyWindowHours?: number;
}): string {
  const parts: string[] = [];
  if (args.sourceUrls.length > 0) {
    parts.push(`Source URLs: ${args.sourceUrls.join(', ')}.`);
  }
  if (args.verifiedHandles.length > 0) {
    const handles = args.verifiedHandles
      .map((h) => `@${h.handle} (${h.name})`)
      .join(', ');
    parts.push(`Verified handles: ${handles}.`);
  }
  if (typeof args.urgencyWindowHours === 'number') {
    parts.push(`Urgency window: ${args.urgencyWindowHours}h.`);
  }
  return parts.join(' ');
}

// ─── Rec body rendering ──────────────────────────────────────────────────────

function renderRecBody(args: {
  proposal: PlannerLaneProposal;
  platforms: string[];
  verifications: HandleVerification[];
  candidates: SocialDraftCandidate[];
  generationId: string;
}): string {
  const { proposal, platforms, verifications, candidates, generationId } = args;

  const first = candidates[0];
  const second = candidates[1];
  const third = candidates[2];

  const platformLine = platforms
    .map((p) => (p === 'x' ? 'X (primary)' : p === 'linkedin' ? 'LinkedIn' : p === 'bluesky' ? 'Bluesky' : p))
    .join(' · ');

  const audience =
    extractAudienceFromMotivation(proposal.motivation) ??
    `the conversation around ${proposal.headline}`;

  const urgencyLine =
    typeof proposal.urgency_window_hours === 'number'
      ? `${proposal.urgency_window_hours}h half-life — ship while the thread is hot`
      : 'evergreen';

  const verifiedLines: string[] = [];
  for (const v of verifications) {
    if (v.handle === null || v.confidence === 'unverified') continue;
    const evidence = v.evidence_url ? ` ([source](${v.evidence_url}))` : '';
    verifiedLines.push(
      `- ✅ \`@${v.handle}\` — ${v.name} · ${v.confidence} confidence via ${v.source}${evidence}`,
    );
  }
  const verifiedBlock =
    verifiedLines.length > 0 ? verifiedLines.join('\n') : '_(no @-handles in this draft)_';

  const altLines: string[] = [];
  if (second) altLines.push(`- **${second.id}:** ${truncate(second.text, 120)}`);
  if (third) altLines.push(`- **${third.id}:** ${truncate(third.text, 120)}`);
  const altBlock = altLines.length > 0 ? altLines.join('\n') : '_(no alternates returned)_';

  const draftBlock = first
    ? `> ${first.text.split('\n').join('\n> ')}`
    : '_(no primary draft returned)_';

  const primaryId = first?.id ?? '<no-id>';

  return [
    `**Platform:** ${platformLine}`,
    `**Target audience:** ${audience}`,
    `**Urgency:** ${urgencyLine}`,
    '',
    `**Draft (candidate \`${primaryId}\`):**`,
    draftBlock,
    '',
    '**Alternates:**',
    altBlock,
    '',
    '**Handles:**',
    verifiedBlock,
    '',
    '**Pre-flight:** ✅ handle-verify · Tier 2 (fact-check) + Tier 3 (suppression) will re-run when Josh accepts and the Worker re-fires for /social-send.',
    '',
    `**Generation ID:** \`${generationId}\` (links this draft set to /social-send for audit)`,
    '',
    `**Reply:** \`accept <rec-id>\` → triggers CONFIRM round-trip (Social lane requires 2h CONFIRM window per design §3) · \`dismiss <rec-id> <reason>\``,
  ].join('\n');
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max).trimEnd()}…`;
}

/**
 * Best-effort: pull a target-audience phrase out of the planner's motivation.
 * Looks for "for <X>" or "to <X>" patterns; returns undefined if no obvious
 * match (caller falls back to a generic phrase). TODO(post-v1): once we have
 * a few weeks of planner output, train the planner prompt to emit a
 * structured `target_audience` field so we don't have to scrape.
 */
function extractAudienceFromMotivation(motivation: string): string | undefined {
  const m =
    motivation.match(/\bfor ([a-z][a-z0-9 ,'\-]{3,60})(?:[.;]|$)/i) ??
    motivation.match(/\bto reach ([a-z][a-z0-9 ,'\-]{3,60})(?:[.;]|$)/i);
  return m?.[1]?.trim();
}
