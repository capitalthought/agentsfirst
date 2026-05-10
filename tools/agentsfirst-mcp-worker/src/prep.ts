// Prep Gate — pre-flight checks for the agentsfirst-mcp Worker.
//
// Worker-safe variant. Same shape as the stdio package's prep.ts; differences:
//   - No node:url, no process.versions.node — Workers don't expose those.
//   - "node:version" check becomes a runtime-identifier check.
//   - Network ping uses the global fetch() (Workers-native).
//
// See https://agentsfirst.dev/principles/prep-gates/

import {
  ANTI_PATTERN_SLUGS,
  PRINCIPLE_SLUGS,
  PRINCIPLES_URL,
  RUBRIC_VERSION,
} from './principles.js';

export interface CheckResult {
  name: string;
  ok: boolean;
  message: string;
}

export interface PrepResult {
  ok: boolean;
  checks: CheckResult[];
  rubric_version: string;
  principles_url: string;
  endpoint: string;
}

const CANONICAL_API = 'https://agentsfirst.dev/api/principles.json';
const ENDPOINT = 'https://agentsfirst.dev/mcp';

export async function runPrep(): Promise<PrepResult> {
  const checks: CheckResult[] = [];

  // 1. Rubric loaded — 9 principles, 8 anti-patterns
  checks.push({
    name: 'rubric:principles',
    ok: PRINCIPLE_SLUGS.length === 9,
    message:
      PRINCIPLE_SLUGS.length === 9
        ? `9 principles loaded`
        : `expected 9 principles, found ${PRINCIPLE_SLUGS.length}`,
  });
  checks.push({
    name: 'rubric:anti-patterns',
    ok: ANTI_PATTERN_SLUGS.length === 8,
    message:
      ANTI_PATTERN_SLUGS.length === 8
        ? `8 anti-patterns loaded`
        : `expected 8 anti-patterns, found ${ANTI_PATTERN_SLUGS.length}`,
  });

  // 2. Runtime identifier — Workers V8 isolate. fetch + AbortController are
  // built-in; we just confirm we're in a place that has them.
  const hasFetch = typeof fetch === 'function';
  const hasAbort = typeof AbortController === 'function';
  checks.push({
    name: 'runtime:web-standards',
    ok: hasFetch && hasAbort,
    message:
      hasFetch && hasAbort
        ? 'Cloudflare Worker — fetch() + AbortController present'
        : 'missing fetch() or AbortController',
  });

  // 3. Network reachable to canonical principles API (advisory — does not fail prep)
  let networkOk = false;
  let networkMsg = 'skipped';
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(CANONICAL_API, {
      method: 'HEAD',
      headers: { 'User-Agent': 'agentsfirst-mcp-worker/0.1' },
      signal: ctrl.signal,
    });
    clearTimeout(timeout);
    networkOk = true;
    networkMsg = `HEAD ${CANONICAL_API} → ${res.status}`;
  } catch (e) {
    networkMsg = `${(e as Error).message} — offline scoring still works`;
  }
  checks.push({
    name: 'network:agentsfirst.dev',
    ok: true, // advisory
    message: networkOk
      ? networkMsg
      : `${networkMsg} (advisory only — scoring is unaffected)`,
  });

  return {
    ok: checks.every((c) => c.ok),
    checks,
    rubric_version: RUBRIC_VERSION,
    principles_url: PRINCIPLES_URL,
    endpoint: ENDPOINT,
  };
}
