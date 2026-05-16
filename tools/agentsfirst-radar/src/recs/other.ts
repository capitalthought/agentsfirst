// other.ts — Other-lane recommendation generator for agentsfirst-radar.
//
// Other lane covers operational moves that aren't a website diff or a social
// post: Asana tasks, rubric-version-bump candidates, /reports/<vendor>
// candidates, amplifier DMs, conference CFPs, "wall of adopters" entries,
// and stale-claim flags surfaced for Josh.
//
// Per the design doc (docs/plans/2026-05-15-agentsfirst-radar-design.md §2
// multi-model table) this lane is SINGLE-MODEL — no multipov plan-review, no
// /social-draft 4-LLM fanout. Asana task creation is also single-model per
// the same table. The bar is lower here because the blast radius is small:
// nothing in this lane mutates the canonical thesis or publishes externally
// without Josh's reply-to-act.
//
// CRITICAL — Asana actuator contract (per AGENTS.md): the Other-lane actuator
// creates tasks UNASSIGNED in the "Radar: Triage" Asana project; a COS routes
// them downstream. The radar NEVER assigns a task to a person. The body this
// module produces SHAPES the task; the actuator (separate module) files it.
// Anti-pattern: emitting an `assignee` field of any kind in the Asana task
// spec is forbidden — `accept` would silently violate the agent contract.
//
// Inputs are PlannerLaneProposal objects whose `lane === 'other'`. We never
// reach back into raw source text from triaged signals; we only pass through
// the planner's `motivation` + `summary_quote`s, which are the
// prompt-injection-safe handoff per design §3 Step E.

import Anthropic from '@anthropic-ai/sdk';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';

import {
  newRecommendation,
  parentEventIdFromUrls,
  Recommendation,
  RadarState,
  REPO_ROOT_PATH,
} from '../state.js';
import { PlannerLaneProposal } from '../triage.js';

// ─── Public types ────────────────────────────────────────────────────────────

export interface OtherRecGenerationResult {
  recs: Recommendation[];
  dropped: { headline: string; reason: string }[];
}

// ─── Internal config ─────────────────────────────────────────────────────────

const BODY_MODEL = 'claude-opus-4-7';
const BODY_MAX_TOKENS = 1024;

// Known amplifier handles used to seed subtype inference. Keep small — the
// planner can name others in `motivation`; this is just a fast-path for the
// regulars. Lowercase comparison.
const KNOWN_AMPLIFIERS: ReadonlySet<string> = new Set([
  'swyx',
  'simonw',
  'simon willison',
  'mappletons',
  'maggie appleton',
  'patio11',
  'patrick mckenzie',
  'asmartbear',
  'jason liu',
]);

// Subtype tags — these appear verbatim in the rec body so downstream
// renderers / actuator can detect them. Order matters in inference (most
// specific first).
export type OtherSubtype =
  | 'rubric-bump'
  | 'reports-candidate'
  | 'amplifier-dm'
  | 'conference-cfp'
  | 'wall-of-adopters'
  | 'stale-claim'
  | 'asana-todo'
  | 'info';

// ─── Anthropic client (lazy singleton) ───────────────────────────────────────

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    throw new Error(
      'other-rec: ANTHROPIC_API_KEY is required (set in env; 1P item "Anthropic — ANTHROPIC_API_KEY (multi-project)").',
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

// ─── Subtype inference ───────────────────────────────────────────────────────

/**
 * Heuristic info-only detector. Watch/track/file-only motivations get the
 * `[info]` tag and a minimal one-line body so the briefing can still surface
 * the signal — but the actuator is a no-op when Josh replies `accept` on an
 * info rec (no Asana task gets filed).
 */
function isInfoOnly(headlineLower: string, motivationLower: string): boolean {
  const haystack = `${headlineLower} | ${motivationLower}`;
  // "watch for", "watching", "monitor", "track", "keep an eye on", "file
  // away" — phrasing the planner uses when it wants the signal logged but
  // nothing actionable yet.
  return /\b(watch|watching|monitor|monitoring|track(?:ing)?|keep an eye on|file away|log only|fyi only|noted only)\b/.test(
    haystack,
  );
}

/**
 * Domain extractor for `reports-candidate` inference. Pulls the first
 * `host` of a non-agentsfirst.dev URL and returns a filesystem-friendly slug
 * suitable for `reports/<slug>/index.md` lookup.
 */
function extractVendorSlug(urls: readonly string[]): string | null {
  for (const url of urls) {
    let host: string;
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      continue;
    }
    if (host.endsWith('agentsfirst.dev')) continue;
    // Strip a leading www., grab the registrable second-level fragment.
    const cleaned = host.replace(/^www\./, '');
    const parts = cleaned.split('.');
    if (parts.length < 2) continue;
    const slug = parts[parts.length - 2];
    if (!slug) continue;
    // Filesystem-safe: only [a-z0-9-]; reject anything that doesn't look like
    // a real vendor slug (e.g. ip addresses, IDN punycode).
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) continue;
    return slug;
  }
  return null;
}

/**
 * Returns true if `reports/<slug>/index.md` already exists in the repo. Used
 * to gate `reports-candidate` inference — if the vendor already has a page,
 * the proposal isn't a "new /reports/" candidate.
 */
async function reportPageExists(slug: string): Promise<boolean> {
  const path = resolve(REPO_ROOT_PATH, 'reports', slug, 'index.md');
  try {
    const stat = await fs.stat(path);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Pure heuristic — no async — applied first. Looks at motivation + headline
 * text for keywords. The caller then refines `reports-candidate` against the
 * filesystem (which IS async).
 */
function inferSubtypeSync(
  headline: string,
  motivation: string,
): OtherSubtype {
  const h = headline.toLowerCase();
  const m = motivation.toLowerCase();
  const both = `${h} | ${m}`;

  // rubric-bump: explicit references to the rubric file or weight changes.
  if (/\bscore\.ts\b|\brubric\b|\bweight\b|\bversion bump\b|\brubric bump\b/.test(both)) {
    return 'rubric-bump';
  }

  // reports-candidate: planner explicitly proposes a new /reports/ page. (We
  // verify the filesystem in the caller before committing to this subtype.)
  if (/\bnew \/reports\/|\b\/reports\/<vendor>\b|\breport page\b|\bvendor report\b/.test(both)) {
    return 'reports-candidate';
  }

  // stale-claim: motivation references the thesis or a specific index.md line.
  if (
    /\bstale\b|\boutdated\b|\bthesis claim(?:s)?\b|\bindex\.md:\d+\b|\bcontradicts (?:our|the) thesis\b/.test(
      both,
    )
  ) {
    return 'stale-claim';
  }

  // amplifier-dm: outreach to a known amplifier, or explicit "DM" language.
  if (/\bdm\b|\boutreach\b|\bping (?:them|him|her)\b/.test(both)) {
    return 'amplifier-dm';
  }
  for (const name of KNOWN_AMPLIFIERS) {
    if (both.includes(name)) return 'amplifier-dm';
  }

  // conference-cfp: explicit CFP keyword, "panel", or named conference.
  if (
    /\bcfp\b|\bcall for proposals\b|\bcall for papers\b|\bpanel\b|\bkeynote\b|\bconference\b|\bworld's fair\b|\bsxsw\b/.test(
      both,
    )
  ) {
    return 'conference-cfp';
  }

  // wall-of-adopters: a vendor shipped AGENTS.md / MCP / llms.txt.
  if (/\badopter\b|\bshipped (?:agents?\.md|llms\.txt|an? mcp)|\bagents\.md\b|\bllms\.txt\b/.test(both)) {
    return 'wall-of-adopters';
  }

  // Fallback bucket for general operational items.
  return 'asana-todo';
}

/**
 * Async wrapper that promotes `asana-todo` / generic proposals to
 * `reports-candidate` when a vendor domain is present and there is no
 * existing /reports/<vendor>/ page, and that demotes `reports-candidate`
 * back to `asana-todo` when the page already exists.
 */
async function inferSubtype(
  proposal: PlannerLaneProposal,
): Promise<{ subtype: OtherSubtype; vendor_slug?: string }> {
  const headlineLower = proposal.headline.toLowerCase();
  const motivationLower = proposal.motivation.toLowerCase();

  if (isInfoOnly(headlineLower, motivationLower)) {
    return { subtype: 'info' };
  }

  const initial = inferSubtypeSync(proposal.headline, proposal.motivation);
  const vendorSlug = extractVendorSlug(proposal.source_urls);

  // Promote to reports-candidate when there's a non-agentsfirst.dev vendor
  // and no page exists yet. Don't promote when initial is already a more
  // specific subtype (amplifier-dm, conference-cfp, stale-claim, etc).
  if (initial === 'asana-todo' && vendorSlug !== null) {
    const exists = await reportPageExists(vendorSlug);
    if (!exists) {
      return { subtype: 'reports-candidate', vendor_slug: vendorSlug };
    }
  }

  // Demote: planner asked for a /reports/ page but it already exists. Treat
  // as an update-existing-page asana-todo instead.
  if (initial === 'reports-candidate' && vendorSlug !== null) {
    const exists = await reportPageExists(vendorSlug);
    if (exists) {
      return { subtype: 'asana-todo', vendor_slug: vendorSlug };
    }
    return { subtype: 'reports-candidate', vendor_slug: vendorSlug };
  }

  const result: { subtype: OtherSubtype; vendor_slug?: string } = {
    subtype: initial,
  };
  if (vendorSlug !== null) result.vendor_slug = vendorSlug;
  return result;
}

// ─── Body prompt ─────────────────────────────────────────────────────────────

/**
 * Subtypes that should include an Asana task spec block in the body. The
 * actuator reads this when Josh replies `accept`. `info`, `rubric-bump`,
 * `reports-candidate`, and `wall-of-adopters` do NOT get a task spec —
 * `info` is a no-op on accept; the other three want a PR / page draft from a
 * follow-up tool, not an Asana task.
 */
const SUBTYPES_WITH_ASANA_SPEC: ReadonlySet<OtherSubtype> = new Set<OtherSubtype>([
  'asana-todo',
  'amplifier-dm',
  'conference-cfp',
  'stale-claim',
]);

function buildBodySystemPrompt(): string {
  return [
    'You are drafting an Other-lane recommendation body for the agentsfirst-radar morning briefing.',
    '',
    'Other-lane recs propose operational moves: Asana tasks, rubric bumps, new /reports/<vendor> pages, amplifier DMs, conference pitches, wall-of-adopters entries, stale-claim flags. They are single-model recs (no multipov verification needed) — the blast radius is small.',
    '',
    'Voice: Mikey Trafton — direct, efficient, no filler. Feedback without the sandwich method. Comfortable profanity when warranted but not gratuitous. Don\'t pad.',
    '',
    'You are receiving ONLY structured planner output: a headline, a motivation, an impact tier, source URLs, and per-signal `summary_quote` excerpts. You are NOT receiving raw scraped source text. Do not invent context beyond what the planner gave you. If the planner\'s motivation is thin, the rec body should be short — don\'t pad.',
    '',
    'Anti-patterns you MUST avoid:',
    '- DO NOT include any "assignee", "owner", "assigned to", "owner_email", or similar field in the Asana task spec. The radar NEVER assigns a task to a person. The actuator files the task UNASSIGNED in the "Radar: Triage" Asana project; a COS routes it from there.',
    '- DO NOT include a due date in the Asana task spec. The COS sets due dates.',
    '- DO NOT generate Asana task spec blocks for subtypes other than asana-todo, amplifier-dm, conference-cfp, or stale-claim. The user message tells you which subtype this rec is.',
    '- DO NOT include the `accept <id>` / `dismiss <id>` reply footer — the caller appends that.',
    '',
    'Output the body text directly as your message — no preamble, no tool calls, no markdown code fence wrapping the whole thing. The first line of your output must be the subtype tag + impact tier line shown in the user message template.',
  ].join('\n');
}

function buildBodyUserMessage(args: {
  proposal: PlannerLaneProposal;
  subtype: OtherSubtype;
  impactTier: NonNullable<PlannerLaneProposal['impact_tier']>;
  vendorSlug?: string;
  includeAsanaSpec: boolean;
}): string {
  const { proposal, subtype, impactTier, vendorSlug, includeAsanaSpec } = args;
  const signalLines = proposal.triaged_signals.map((sig, i) => {
    const strength = sig.signal_strength;
    const bucket = sig.bucket;
    // summary_quote is verbatim ≤200 chars from the reader stage. Already
    // sanitized at the triage boundary. We pass it through but NEVER any
    // raw_text — per the planner-stage contract.
    return `  [${i}] (${bucket}/${strength}) ${sig.url}\n      "${sig.summary_quote}"`;
  });
  const signalsBlock =
    signalLines.length > 0 ? signalLines.join('\n') : '  (none — planner proposed without underlying signals)';

  const urlsBlock =
    proposal.source_urls.length > 0
      ? proposal.source_urls.map((u) => `  - ${u}`).join('\n')
      : '  (none)';

  const vendorLine = vendorSlug ? `Vendor slug: ${vendorSlug}` : '';

  const template = [
    `Proposal:`,
    `- Headline: ${proposal.headline}`,
    `- Motivation: ${proposal.motivation}`,
    `- Impact tier: ${impactTier}`,
    `- Inferred subtype: ${subtype}`,
    vendorLine,
    `- Source URLs:`,
    urlsBlock,
    `- Triaged signals:`,
    signalsBlock,
    ``,
    `Draft the rec body using this structure (do not add anything before or after, no preamble):`,
    ``,
    `[${subtype}] (${impactTier})`,
    `**Description:** <2-4 sentences explaining what to do and why>`,
    `**Why now:** <1 sentence on urgency>`,
  ];

  if (includeAsanaSpec) {
    template.push(
      ``,
      `**Asana task spec:**`,
      `- name: <one-line task title — imperative voice>`,
      `- description: <markdown — bullet points OK; reference source URL(s) for context>`,
      `- tags: <comma-separated tags, e.g. "radar, ${subtype}, ${impactTier}">`,
    );
  } else if (subtype === 'info') {
    // Info-only rec — replace the description/why-now structure with a
    // single line so the briefing stays compact. The model is told to
    // produce just one line below the subtype tag.
    template.length = 0;
    template.push(
      `Proposal:`,
      `- Headline: ${proposal.headline}`,
      `- Motivation: ${proposal.motivation}`,
      `- Source URLs:`,
      urlsBlock,
      `- Triaged signals:`,
      signalsBlock,
      ``,
      `This is an info-only rec — Josh sees it in the briefing but the actuator does nothing on accept. Output exactly this shape (no extra lines):`,
      ``,
      `[info] (info)`,
      `**Note:** <one line summarizing the signal — ≤200 chars>`,
    );
  }

  return template.filter((line) => line !== '').join('\n');
}

// ─── Body generation ─────────────────────────────────────────────────────────

async function generateBodyText(args: {
  proposal: PlannerLaneProposal;
  subtype: OtherSubtype;
  impactTier: NonNullable<PlannerLaneProposal['impact_tier']>;
  vendorSlug?: string;
  abortSignal?: AbortSignal;
}): Promise<string> {
  const client = getClient();
  const includeAsanaSpec = SUBTYPES_WITH_ASANA_SPEC.has(args.subtype);

  const userMessageArgs: Parameters<typeof buildBodyUserMessage>[0] = {
    proposal: args.proposal,
    subtype: args.subtype,
    impactTier: args.impactTier,
    includeAsanaSpec,
  };
  if (args.vendorSlug !== undefined) {
    userMessageArgs.vendorSlug = args.vendorSlug;
  }
  const userMessage = buildBodyUserMessage(userMessageArgs);

  const response = await client.messages.create(
    {
      model: BODY_MODEL,
      max_tokens: BODY_MAX_TOKENS,
      system: buildBodySystemPrompt(),
      messages: [{ role: 'user', content: userMessage }],
    },
    args.abortSignal ? { signal: args.abortSignal } : undefined,
  );

  // The body is the first text block. Defensive: if there are multiple text
  // blocks, concatenate. Skip tool_use / thinking blocks (shouldn't appear in
  // a no-tools call but we don't trust it).
  const chunks: string[] = [];
  for (const block of response.content) {
    if (block.type === 'text') chunks.push(block.text);
  }
  const text = chunks.join('').trim();
  if (text.length === 0) {
    throw new Error(
      `other-rec: model returned empty body for "${args.proposal.headline}" (stop_reason=${response.stop_reason})`,
    );
  }
  return text;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Turn Other-lane planner proposals into full Recommendation objects.
 *
 * Single-model (Opus) body generation. No multipov, no /social-draft. State
 * is NOT mutated here — caller folds the returned recs into `state.recommendations`
 * (and folds the dropped list into the operator log / briefing degradation
 * note).
 *
 * Each proposal that has `lane !== 'other'` is dropped with a reason; this
 * keeps the function safe to call even if upstream accidentally hands us
 * mixed lanes (defense in depth — the planner is supposed to route by lane
 * before calling us).
 *
 * `info`-subtype recs surface in the briefing but the actuator is a no-op on
 * accept (no Asana task gets filed). Subtypes that warrant an Asana task
 * (asana-todo, amplifier-dm, conference-cfp, stale-claim) include an
 * **Asana task spec** block in the body — the actuator parses that block and
 * files the task UNASSIGNED in "Radar: Triage".
 */
export async function generateOtherRecs(args: {
  proposals: PlannerLaneProposal[];
  // `state` and `runTimestamp` are part of the signature for symmetry with
  // the website/social generators; this lane doesn't mutate state and only
  // uses `runTimestamp` to build stable rec IDs via `newRecommendation`.
  state: RadarState;
  runTimestamp: string;
  abortSignal?: AbortSignal;
}): Promise<OtherRecGenerationResult> {
  // Silence the "unused-state" lint — keep the param for future use (e.g.
  // de-duping against existing open recs) without making it optional and
  // breaking the caller's signature symmetry.
  void args.state;

  const recs: Recommendation[] = [];
  const dropped: { headline: string; reason: string }[] = [];

  for (const proposal of args.proposals) {
    if (proposal.lane !== 'other') {
      dropped.push({
        headline: proposal.headline,
        reason: `wrong-lane-for-this-generator: ${proposal.lane}`,
      });
      continue;
    }
    if (proposal.source_urls.length === 0) {
      // Recommendation schema requires ≥1 source_url; can't construct a valid
      // rec without it. Drop with a clear reason for the operator log.
      dropped.push({
        headline: proposal.headline,
        reason: 'no-source-urls',
      });
      continue;
    }

    const { subtype, vendor_slug } = await inferSubtype(proposal);
    const impactTier: NonNullable<PlannerLaneProposal['impact_tier']> =
      subtype === 'info' ? 'info' : (proposal.impact_tier ?? 'medium');

    let body: string;
    try {
      const genArgs: Parameters<typeof generateBodyText>[0] = {
        proposal,
        subtype,
        impactTier,
      };
      if (vendor_slug !== undefined) genArgs.vendorSlug = vendor_slug;
      if (args.abortSignal !== undefined) genArgs.abortSignal = args.abortSignal;
      body = await generateBodyText(genArgs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `[other-rec] body generation failed for "${proposal.headline}": ${msg}\n`,
      );
      dropped.push({
        headline: proposal.headline,
        reason: `body-generation-failed: ${msg.slice(0, 200)}`,
      });
      continue;
    }

    // Build the rec via the canonical helper. We do NOT pass
    // `multipov_review_id` — Other lane is single-model by design.
    // parent_event_id is derived from the union of source URLs so multi-lane
    // recs from the same triggering signal cluster share an id (design Q1).
    const newRecArgs: Parameters<typeof newRecommendation>[0] = {
      headline: proposal.headline,
      lane: 'other',
      body,
      source_urls: proposal.source_urls,
      runTimestamp: args.runTimestamp,
      parent_event_id: parentEventIdFromUrls(proposal.source_urls),
    };
    const rec = newRecommendation(newRecArgs);
    recs.push(rec);
  }

  return { recs, dropped };
}
