// Prep Gate — pre-flight checks for the agentsfirst-mcp server.
//
// Two ways to run this:
//   1. As an MCP tool — agentsfirst_prep calls runPrep()
//   2. As a CLI — `npm run prep` for local debugging
//
// See https://agentsfirst.dev/principles/prep-gates/

import { fileURLToPath } from 'node:url';

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
}

const CANONICAL_API = 'https://agentsfirst.dev/api/principles.json';

export async function runPrep(): Promise<PrepResult> {
  const checks: CheckResult[] = [];

  // 1. Rubric loaded — 8 principles, 7 anti-patterns
  checks.push({
    name: 'rubric:principles',
    ok: PRINCIPLE_SLUGS.length === 8,
    message:
      PRINCIPLE_SLUGS.length === 8
        ? `8 principles loaded`
        : `expected 8 principles, found ${PRINCIPLE_SLUGS.length}`,
  });
  checks.push({
    name: 'rubric:anti-patterns',
    ok: ANTI_PATTERN_SLUGS.length === 7,
    message:
      ANTI_PATTERN_SLUGS.length === 7
        ? `7 anti-patterns loaded`
        : `expected 7 anti-patterns, found ${ANTI_PATTERN_SLUGS.length}`,
  });

  // 2. Node version
  const nodeMajor = parseInt(process.versions.node.split('.')[0] ?? '0', 10);
  checks.push({
    name: 'node:version',
    ok: nodeMajor >= 20,
    message:
      nodeMajor >= 20
        ? `node ${process.versions.node}`
        : `node ${process.versions.node} — requires >= 20 (built-in fetch + AbortController)`,
  });

  // 3. Network reachable to canonical principles API (advisory — does not fail prep)
  let networkOk = false;
  let networkMsg = 'skipped';
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(CANONICAL_API, {
      method: 'HEAD',
      headers: { 'User-Agent': 'agentsfirst-mcp/0.1' },
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
      : `${networkMsg} (advisory only — local scoring is unaffected)`,
  });

  return {
    ok: checks.every((c) => c.ok),
    checks,
    rubric_version: RUBRIC_VERSION,
    principles_url: PRINCIPLES_URL,
  };
}

// CLI mode — `npm run prep`
const isCli = (() => {
  try {
    return process.argv[1]
      ? process.argv[1].endsWith('prep.ts') || process.argv[1].endsWith('prep.js')
      : false;
  } catch {
    return false;
  }
})();

if (isCli) {
  const result = await runPrep();
  for (const c of result.checks) {
    const prefix = c.ok ? '✅' : '❌';
    process.stdout.write(`${prefix} ${c.name.padEnd(32)} ${c.message}\n`);
  }
  process.stdout.write(
    `\n${result.ok ? '✅' : '❌'} prep ${result.ok ? 'passed' : 'FAILED'} · rubric v${result.rubric_version}\n`,
  );
  // Silence the unused-import warning in CLI builds
  void fileURLToPath;
  process.exit(result.ok ? 0 : 1);
}
