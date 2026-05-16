// actuator.ts — reply-side / mutation logic for agentsfirst-radar.
//
// Two responsibilities:
//   1. parseReply()          — pure parser for iMessage replies per AGENTS.md grammar
//   2. mutation log + fold   — append-only mutations.jsonl, folded into radar-state.json
//
// Design contract: docs/plans/2026-05-15-agentsfirst-radar-design.md §3 + §6.
// Grammar contract: AGENTS.md "iMessage HITL grammar" section.
//
// Invariants:
//   - parseReply is pure (no I/O, no mutation of inputs).
//   - applyMutation returns a NEW state object; never mutates input.
//   - foldMutationsIntoState does NOT truncate the log — caller does that AFTER
//     a successful writeStateAtomic + git push, so a crash mid-commit doesn't
//     lose mutations.

import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';

import {
  CONFIRM_WINDOW_HOURS,
  IMSG_UNPARSED_PATH,
  MUTATIONS_PATH,
  Recommendation,
  RadarState,
} from './state.js';

// ─── Public types ────────────────────────────────────────────────────────────

export type Verb = 'accept' | 'dismiss' | 'defer' | 'confirm' | 'cancel';

export interface ParseResult {
  verb?: Verb;
  rec_id?: string;
  rest?: string;
  ambiguous_prefix?: string;
  ambiguous_matches?: { id: string; lane: string; headline: string }[];
  unparsed?: boolean;
  unparsed_reason?: string;
}

export interface MutationEvent {
  iso: string;
  verb: Verb;
  rec_id: string;
  raw_reply: string;
  imsg_guid?: string;
}

export interface UnparsedRow {
  iso: string;
  raw_reply: string;
  reason: 'no-verb' | 'ambiguous-prefix' | 'no-id' | 'unknown-id' | 'malformed';
  prefix?: string;
  ambiguous_matches?: string[];
  imsg_guid?: string;
}

export interface FoldResult {
  state: RadarState;
  applied_count: number;
  errors: { event: MutationEvent; reason: string }[];
}

// ─── Grammar constants ──────────────────────────────────────────────────────

const VERB_TOKENS = ['accept', 'dismiss', 'defer', 'confirm', 'cancel'] as const;
const MIN_ID_PREFIX = 6;
// FULL_ID_LENGTH retained as documentation of the rec_id width; parseReply
// matches 6-8 hex via regex.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FULL_ID_LENGTH = 8;

const HEX_TOKEN_RE = /\b([0-9a-f]{6,8})\b/i;

// ─── parseReply ─────────────────────────────────────────────────────────────

/**
 * Parse a single iMessage reply against the open-rec set. Pure function;
 * no I/O. See AGENTS.md "iMessage HITL grammar" rules 1, 2, 3, 4.
 */
export function parseReply(text: string, openRecs: Recommendation[]): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { unparsed: true, unparsed_reason: 'empty' };

  // Rule 1 — verb token (case-insensitive, FIRST WORD ONLY).
  // Anti-pattern guard: never match a verb word mid-message.
  const tokens = trimmed.split(/\s+/);
  const firstWord = (tokens[0] ?? '').toLowerCase();
  // Accept either `verb` or `verb:` (treated as verb-with-colon) as the prefix.
  const verb = VERB_TOKENS.find((v) => firstWord === v || firstWord === `${v}:`);
  if (!verb) return { unparsed: true, unparsed_reason: 'no-verb' };

  // Rule 2 — find the first hex prefix token (6-8 lowercase hex) in tokens[1+].
  let idPrefix: string | undefined;
  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;
    const m = tok.toLowerCase().match(HEX_TOKEN_RE);
    if (m && m[1]) {
      idPrefix = m[1].toLowerCase();
      break;
    }
  }
  if (!idPrefix) return { verb, unparsed: true, unparsed_reason: 'no-id' };
  if (idPrefix.length < MIN_ID_PREFIX) {
    return { verb, unparsed: true, unparsed_reason: 'no-id' };
  }

  // Match against open recs by prefix.
  const matches = openRecs.filter((r) => r.id.startsWith(idPrefix!));
  if (matches.length === 0) {
    return { verb, unparsed: true, unparsed_reason: 'unknown-id' };
  }
  if (matches.length > 1) {
    return {
      verb,
      ambiguous_prefix: idPrefix,
      ambiguous_matches: matches.map((r) => ({
        id: r.id,
        lane: r.lane,
        headline: r.headline,
      })),
    };
  }
  const matched = matches[0]!;

  // Rule 4 — free text after the id token becomes acceptance_note / dismissal_reason.
  // Find the idPrefix position in the original (case-preserving) text and slice
  // everything after it.
  const lowerTrimmed = trimmed.toLowerCase();
  const idxInLower = lowerTrimmed.indexOf(idPrefix);
  const afterId =
    idxInLower >= 0
      ? trimmed.slice(idxInLower + idPrefix.length).trim()
      : '';

  return {
    verb,
    rec_id: matched.id,
    rest: afterId || undefined,
  };
}

// ─── Append-only logs ───────────────────────────────────────────────────────

async function ensureDir(path: string): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true });
}

/**
 * Append one mutation event to state/mutations.jsonl. Called by the
 * imsg-listener daemon after a successful parseReply.
 */
export async function appendMutation(event: MutationEvent): Promise<void> {
  await ensureDir(MUTATIONS_PATH);
  const line = JSON.stringify(event) + '\n';
  await fs.appendFile(MUTATIONS_PATH, line, 'utf8');
}

/**
 * Append a failed-parse / ambiguity row to state/imsg-unparsed.jsonl. Per
 * grammar rule 5: never silently drop.
 */
export async function appendUnparsed(row: UnparsedRow): Promise<void> {
  await ensureDir(IMSG_UNPARSED_PATH);
  const line = JSON.stringify(row) + '\n';
  await fs.appendFile(IMSG_UNPARSED_PATH, line, 'utf8');
}

// ─── Fold mutations into state ──────────────────────────────────────────────

/**
 * Read state/mutations.jsonl, apply each event in order to a copy of state,
 * and return the new state + counts. Idempotent — applying twice yields the
 * same result as once (per AGENTS.md rule 3).
 *
 * Does NOT truncate the log. Caller truncates AFTER writeStateAtomic + git
 * push succeed via truncateMutationsLog().
 */
export async function foldMutationsIntoState(state: RadarState): Promise<FoldResult> {
  let raw: string;
  try {
    raw = await fs.readFile(MUTATIONS_PATH, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { state, applied_count: 0, errors: [] };
    }
    throw err;
  }

  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  let working = state;
  let applied = 0;
  const errors: { event: MutationEvent; reason: string }[] = [];

  for (const line of lines) {
    let event: MutationEvent;
    try {
      event = JSON.parse(line) as MutationEvent;
    } catch {
      // Malformed line — record but do not throw; the log is append-only and
      // we cannot let one bad line poison the whole fold.
      errors.push({
        event: { iso: '', verb: 'accept', rec_id: '', raw_reply: line },
        reason: 'malformed-jsonl',
      });
      continue;
    }
    const result = applyMutation(working, event);
    working = result.state;
    if (result.changed) {
      applied++;
    } else if (result.reason && result.reason !== 'already-accepted') {
      // 'already-accepted' is the documented idempotent no-op; everything else
      // (unknown-rec-id, confirm-expired, confirm-not-applicable, etc.) is
      // worth surfacing so the operator notices.
      errors.push({ event, reason: result.reason });
    }
  }

  return { state: working, applied_count: applied, errors };
}

/**
 * Truncate state/mutations.jsonl. Called by radar.ts AFTER a successful
 * writeStateAtomic + git push so a crash mid-commit doesn't lose mutations.
 */
export async function truncateMutationsLog(): Promise<void> {
  try {
    await fs.truncate(MUTATIONS_PATH, 0);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw err;
  }
}

// ─── applyMutation ──────────────────────────────────────────────────────────

const DEFER_RE = /(\d+)\s*d\b/i;

/**
 * Apply a single mutation to a copy of state. Pure (modulo Date math).
 * Exposed for tests.
 *
 * Returns { state, changed, reason? }:
 *   - changed=true  → state was mutated
 *   - changed=false → no-op (with `reason` set: 'already-accepted',
 *                    'unknown-rec-id', 'confirm-expired',
 *                    'confirm-not-applicable', 'cancel-not-applicable')
 */
export function applyMutation(
  state: RadarState,
  event: MutationEvent,
): { state: RadarState; changed: boolean; reason?: string } {
  const rec = state.recommendations[event.rec_id];
  if (!rec) {
    return { state, changed: false, reason: 'unknown-rec-id' };
  }

  switch (event.verb) {
    case 'accept':
      return applyAccept(state, rec, event);
    case 'dismiss':
      return applyDismiss(state, rec, event);
    case 'defer':
      return applyDefer(state, rec, event);
    case 'confirm':
      return applyConfirm(state, rec, event);
    case 'cancel':
      return applyCancel(state, rec, event);
    default:
      return { state, changed: false, reason: 'unknown-verb' };
  }
}

// ─── Per-verb handlers ──────────────────────────────────────────────────────

function applyAccept(
  state: RadarState,
  rec: Recommendation,
  event: MutationEvent,
): { state: RadarState; changed: boolean; reason?: string } {
  // Rule 3 — idempotency. Re-accepting an already-accepted (or downstream-active)
  // rec is a no-op, not an error.
  if (
    rec.status === 'accepted' ||
    rec.status === 'in_flight' ||
    rec.status === 'shipped'
  ) {
    return { state, changed: false, reason: 'already-accepted' };
  }
  if (rec.status === 'dismissed' || rec.status === 'auto_dismissed') {
    // Reopening a dismissed rec is out of scope for the v1 grammar.
    return { state, changed: false, reason: 'rec-dismissed' };
  }

  const note = mergeNote(rec.acceptance_note, extractRest(event));
  const updated: Recommendation = {
    ...rec,
    status: 'accepted',
    status_changed_iso: event.iso,
    // Social-lane: arm the 2h CONFIRM window. Other lanes: not used.
    accept_iso: rec.lane === 'social' ? event.iso : rec.accept_iso,
    acceptance_note: note,
  };
  return { state: replaceRec(state, updated), changed: true };
}

function applyDismiss(
  state: RadarState,
  rec: Recommendation,
  event: MutationEvent,
): { state: RadarState; changed: boolean; reason?: string } {
  if (rec.status === 'dismissed' || rec.status === 'auto_dismissed') {
    return { state, changed: false, reason: 'already-dismissed' };
  }
  if (rec.status === 'shipped') {
    return { state, changed: false, reason: 'already-shipped' };
  }
  const restText = extractRest(event);
  const reason =
    (restText && restText.trim()) ||
    (event.raw_reply && event.raw_reply.trim()) ||
    'no-reason-given';
  const updated: Recommendation = {
    ...rec,
    status: 'dismissed',
    status_changed_iso: event.iso,
    dismissal_reason: reason,
  };
  return { state: replaceRec(state, updated), changed: true };
}

function applyDefer(
  state: RadarState,
  rec: Recommendation,
  event: MutationEvent,
): { state: RadarState; changed: boolean; reason?: string } {
  // Defer keeps the rec OPEN (doesn't transition status). It only extends
  // the per-rec expiry and annotates the acceptance_note.
  if (rec.status !== 'open') {
    return { state, changed: false, reason: 'defer-only-valid-on-open' };
  }
  const m = (extractRest(event) ?? '').match(DEFER_RE);
  const days = m && m[1] ? Math.max(1, parseInt(m[1], 10)) : 7;
  const newExpiry = new Date(
    Date.parse(event.iso) + days * 24 * 3600 * 1000,
  ).toISOString();
  const note = mergeNote(rec.acceptance_note, `defer-${days}d`);
  const updated: Recommendation = {
    ...rec,
    expires_iso: newExpiry,
    acceptance_note: note,
  };
  return { state: replaceRec(state, updated), changed: true };
}

function applyConfirm(
  state: RadarState,
  rec: Recommendation,
  event: MutationEvent,
): { state: RadarState; changed: boolean; reason?: string } {
  if (rec.lane !== 'social') {
    return { state, changed: false, reason: 'confirm-not-applicable' };
  }
  if (rec.status !== 'accepted') {
    return { state, changed: false, reason: 'confirm-requires-accepted' };
  }
  if (!rec.accept_iso) {
    return { state, changed: false, reason: 'confirm-missing-accept-iso' };
  }
  const ageMs = Date.parse(event.iso) - Date.parse(rec.accept_iso);
  const windowMs = CONFIRM_WINDOW_HOURS * 3600 * 1000;
  if (ageMs > windowMs) {
    return { state, changed: false, reason: 'confirm-expired' };
  }
  const updated: Recommendation = {
    ...rec,
    status: 'in_flight',
    status_changed_iso: event.iso,
    acceptance_note: mergeNote(rec.acceptance_note, 'confirmed-publish'),
  };
  return { state: replaceRec(state, updated), changed: true };
}

function applyCancel(
  state: RadarState,
  rec: Recommendation,
  event: MutationEvent,
): { state: RadarState; changed: boolean; reason?: string } {
  if (rec.lane !== 'social') {
    return { state, changed: false, reason: 'cancel-not-applicable' };
  }
  if (rec.status !== 'accepted') {
    return { state, changed: false, reason: 'cancel-requires-accepted' };
  }
  const updated: Recommendation = {
    ...rec,
    status: 'dismissed',
    status_changed_iso: event.iso,
    dismissal_reason: 'user-cancelled-at-confirm',
  };
  return { state: replaceRec(state, updated), changed: true };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function replaceRec(state: RadarState, rec: Recommendation): RadarState {
  return {
    ...state,
    recommendations: {
      ...state.recommendations,
      [rec.id]: rec,
    },
  };
}

/**
 * Recover the free-text "rest" (rule 4) from a MutationEvent's raw_reply.
 * MutationEvent stores only the minimum needed to replay; the per-verb
 * handlers re-derive `rest` so the rec's note/reason/defer-days can use it.
 * Returns undefined if the raw_reply is unparseable or there's nothing after
 * the id token.
 */
function extractRest(event: MutationEvent): string | undefined {
  const text = event.raw_reply ?? '';
  if (!text.trim()) return undefined;
  const lower = text.toLowerCase();
  // Find the rec_id (or any 6+ hex prefix of it) in the raw_reply and slice
  // everything after.
  const fullIdx = lower.indexOf(event.rec_id.toLowerCase());
  if (fullIdx >= 0) {
    const after = text.slice(fullIdx + event.rec_id.length).trim();
    return after || undefined;
  }
  // Fall back to any 6-8 hex prefix (operator may have typed only the first
  // 6 chars of the id).
  const m = lower.match(HEX_TOKEN_RE);
  if (m && m[1] && event.rec_id.toLowerCase().startsWith(m[1])) {
    const idx = lower.indexOf(m[1]);
    const after = text.slice(idx + m[1].length).trim();
    return after || undefined;
  }
  return undefined;
}

function mergeNote(existing: string | undefined, addition: string | undefined): string | undefined {
  const add = (addition ?? '').trim();
  if (!add) return existing;
  if (!existing || !existing.trim()) return add;
  return `${existing}\n${add}`;
}
