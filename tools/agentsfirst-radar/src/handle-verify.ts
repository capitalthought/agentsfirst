// handle-verify.ts — verify @-handles before any social draft is surfaced.
//
// Satisfies the global "Always verify @-handles before drafting" rule
// (~/.claude/CLAUDE.md). Contract per design doc:
//   docs/plans/2026-05-15-agentsfirst-radar-design.md §6 — Authority
//   ("social-lane publish requires TWO iMessage round-trips" + the
//    /social-draft Tier 1 handle-verify gate).
//
// Verification path (in order):
//   1. Allowlist hit — `state.handle_allowlist[name]` keyed exact + lowercase.
//      Must match the requested platform.
//   2. Grok x_search `--verify` mode — only for platform === 'x'. Shelled via
//      execFile (argv, NOT shell-string) so a malicious display name cannot
//      inject shell metacharacters.
//   3. Bluesky / LinkedIn — not yet wired; return `failed`. The caller decides
//      whether to drop the draft or surface it with an "unverified handle"
//      warning. See TODO(post-v1) below.
//
// Errors from grok are LOGGED to stderr but never thrown — handle-verify is a
// gate, not a hard failure point, and the caller has policy authority.
//
// All exported functions return new values; no mutation of state or allowlist.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

import { HandleEntry, RadarState } from './state.js';

const execFileAsync = promisify(execFile);

// Path to the grok-twitter skill's --verify entry point. Pinned via env for
// tests; falls back to the documented location in the user's Claude config.
const GROK_VERIFY_SCRIPT =
  process.env.RADAR_GROK_VERIFY_SCRIPT ??
  resolve(homedir(), '.claude/skills/grok-twitter/grok-x.mjs');

// Optional --context override for grok --verify. Off by default; some callers
// may want to pass extra hints in the future.
const GROK_VERIFY_TIMEOUT_MS = Number(
  process.env.RADAR_GROK_VERIFY_TIMEOUT_MS ?? 60_000,
);

// ─── Public types ────────────────────────────────────────────────────────────

export interface HandleVerification {
  name: string;
  platform: 'x' | 'bluesky' | 'linkedin';
  handle: string | null; // null if unverifiable
  confidence: 'high' | 'medium' | 'low' | 'unverified';
  evidence_url?: string;
  source: 'allowlist' | 'grok' | 'failed';
}

// Subset of the grok-twitter --verify JSON contract we actually consume.
// Per ~/.claude/skills/grok-twitter/SKILL.md §Verify-handle mode.
interface GrokVerifyPayload {
  handle?: unknown;
  confidence?: unknown;
  evidence_url?: unknown;
}

// ─── verifyHandle ────────────────────────────────────────────────────────────

/**
 * Verify a person's handle on a platform. Allowlist first, then grok for X.
 * Never throws — failures return a structured `{source: 'failed'}` result.
 */
export async function verifyHandle(
  name: string,
  platform: 'x' | 'bluesky' | 'linkedin',
  allowlist: Record<string, HandleEntry>,
): Promise<HandleVerification> {
  // Step 1: allowlist (exact + lowercase). Platform must match.
  const allowHit = allowlist[name] ?? allowlist[name.toLowerCase()];
  if (allowHit && allowHit.platform === platform) {
    return {
      name,
      platform,
      handle: allowHit.handle,
      confidence: allowHit.confidence,
      evidence_url: allowHit.evidence_url,
      source: 'allowlist',
    };
  }

  // Step 2: grok --verify (X only).
  if (platform === 'x') {
    return await verifyViaGrok(name);
  }

  // Step 3: Bluesky / LinkedIn — not yet wired.
  // TODO(post-v1): wire Bluesky DID lookup and LinkedIn handle resolver.
  return {
    name,
    platform,
    handle: null,
    confidence: 'unverified',
    source: 'failed',
  };
}

async function verifyViaGrok(name: string): Promise<HandleVerification> {
  // CRITICAL: execFile with argv — never `exec` with a shell-string. `name`
  // is untrusted (it can come from a scraped headline) and could contain
  // shell metacharacters (`;`, backticks, `$()`, etc.). argv arrays bypass
  // /bin/sh entirely.
  let stdout: string;
  try {
    const result = await execFileAsync(
      'node',
      [GROK_VERIFY_SCRIPT, '--verify', name],
      {
        timeout: GROK_VERIFY_TIMEOUT_MS,
        maxBuffer: 1024 * 1024, // 1 MB cap on grok JSON payload
      },
    );
    stdout = result.stdout;
  } catch (err) {
    // Grok exit code !== 0 → per SKILL.md, that means confidence !== 'high'.
    // The wrapper still writes JSON to stdout, so try to parse it anyway
    // before giving up. Node's execFile attaches stdout to the error object
    // when the process printed before exiting non-zero.
    const errStdout =
      typeof (err as { stdout?: unknown }).stdout === 'string'
        ? ((err as { stdout: string }).stdout)
        : '';
    if (errStdout.trim().length > 0) {
      const parsed = tryParseGrokPayload(errStdout, name);
      if (parsed) return parsed;
    }
    process.stderr.write(
      `[handle-verify] grok --verify failed for "${name}": ${stringifyError(err)}\n`,
    );
    return {
      name,
      platform: 'x',
      handle: null,
      confidence: 'unverified',
      source: 'failed',
    };
  }

  const parsed = tryParseGrokPayload(stdout, name);
  if (parsed) return parsed;

  process.stderr.write(
    `[handle-verify] grok --verify returned unparseable JSON for "${name}"\n`,
  );
  return {
    name,
    platform: 'x',
    handle: null,
    confidence: 'unverified',
    source: 'failed',
  };
}

function tryParseGrokPayload(
  stdout: string,
  name: string,
): HandleVerification | null {
  let payload: GrokVerifyPayload;
  try {
    payload = JSON.parse(stdout) as GrokVerifyPayload;
  } catch {
    return null;
  }

  const handle = typeof payload.handle === 'string' ? payload.handle : null;
  const confidence = normalizeConfidence(payload.confidence);
  const evidence_url =
    typeof payload.evidence_url === 'string' ? payload.evidence_url : undefined;

  return {
    name,
    platform: 'x',
    handle,
    confidence,
    ...(evidence_url ? { evidence_url } : {}),
    source: 'grok',
  };
}

function normalizeConfidence(
  raw: unknown,
): 'high' | 'medium' | 'low' | 'unverified' {
  if (raw === 'high' || raw === 'medium' || raw === 'low') return raw;
  return 'unverified';
}

function stringifyError(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

// ─── State helpers ───────────────────────────────────────────────────────────

/**
 * Trivial pass-through that gives callers a stable API for "give me the
 * allowlist out of state". Centralizing this means future work (e.g.
 * merging a per-run override allowlist with state.handle_allowlist) has one
 * place to land.
 */
export function loadAllowlistFromState(
  state: RadarState,
): Record<string, HandleEntry> {
  return state.handle_allowlist;
}

/**
 * Return a NEW state with the verified handle inserted into
 * `handle_allowlist` keyed by `v.name`. Only inserts when the verification is
 * actually trustworthy (non-null handle AND confidence !== 'unverified').
 * Caller is responsible for persisting via writeStateAtomic.
 */
export function recordVerifiedHandle(
  state: RadarState,
  v: HandleVerification,
): RadarState {
  if (v.handle === null || v.confidence === 'unverified') return state;

  // confidence narrowed: HandleEntry requires 'high' | 'medium' | 'low'.
  const entry: HandleEntry = {
    display_name: v.name,
    platform: v.platform,
    handle: v.handle,
    verified_iso: new Date().toISOString(),
    evidence_url: v.evidence_url ?? `https://x.com/${v.handle}`,
    confidence: v.confidence,
  };

  return {
    ...state,
    handle_allowlist: {
      ...state.handle_allowlist,
      [v.name]: entry,
    },
  };
}
