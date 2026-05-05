// Prep Gate — pre-flight checks before any agent session.
//
// Validates env vars, filesystem state, and downstream service health.
// Runnable two ways:
//   1. As an MCP tool — `{{PROJECT_NAME}}_prep` calls runPrep() in src/server.ts
//   2. As a CLI — `npm run prep` (so devs can sanity-check before connecting their agent)
//
// See https://agentsfirst.dev/principles/prep-gates/

import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface CheckResult {
  name: string;
  ok: boolean;
  message: string;
}

export interface PrepResult {
  ok: boolean;
  schema_version: number;
  checks: CheckResult[];
}

/**
 * Required env vars. Replace this list with what your project actually needs.
 * `npm run prep` and the `{{PROJECT_NAME}}_prep` MCP tool both check it.
 */
const REQUIRED_ENV: string[] = [
  // '{{PROJECT_NAME_UPPER}}_API_KEY',
  // '{{PROJECT_NAME_UPPER}}_API_URL',
];

/**
 * Filesystem paths the project expects to exist (created on first run if missing).
 */
const REQUIRED_DIRS: string[] = ['data'];

/**
 * Optional healthcheck endpoint. If set, prep verifies it returns 2xx.
 */
const HEALTHCHECK_URL = process.env.{{PROJECT_NAME_UPPER}}_HEALTHCHECK_URL;

export async function runPrep(): Promise<PrepResult> {
  const checks: CheckResult[] = [];

  // 1. Env vars
  for (const key of REQUIRED_ENV) {
    const val = process.env[key];
    checks.push({
      name: `env:${key}`,
      ok: !!val,
      message: val ? 'set' : 'missing — set this in .env',
    });
  }
  if (REQUIRED_ENV.length === 0) {
    checks.push({
      name: 'env',
      ok: true,
      message: 'no required env vars declared (edit REQUIRED_ENV in src/prep.ts)',
    });
  }

  // 2. Filesystem
  for (const dir of REQUIRED_DIRS) {
    const abs = path.resolve(process.cwd(), dir);
    if (!existsSync(abs)) {
      try {
        await mkdir(abs, { recursive: true });
        checks.push({ name: `fs:${dir}`, ok: true, message: `created ${abs}` });
      } catch (err) {
        checks.push({
          name: `fs:${dir}`,
          ok: false,
          message: `failed to create ${abs}: ${(err as Error).message}`,
        });
      }
    } else {
      checks.push({ name: `fs:${dir}`, ok: true, message: 'exists' });
    }
  }

  // 3. Optional healthcheck
  if (HEALTHCHECK_URL) {
    try {
      const res = await fetch(HEALTHCHECK_URL, { method: 'GET' });
      checks.push({
        name: 'healthcheck',
        ok: res.ok,
        message: `${res.status} ${res.statusText} — ${HEALTHCHECK_URL}`,
      });
    } catch (err) {
      checks.push({
        name: 'healthcheck',
        ok: false,
        message: `${(err as Error).message} — ${HEALTHCHECK_URL}`,
      });
    }
  }

  return {
    ok: checks.every((c) => c.ok),
    schema_version: 1,
    checks,
  };
}

// CLI mode — `npm run prep`
const isCli = (() => {
  try {
    return import.meta.url === `file://${fileURLToPath(import.meta.url)}`
      ? process.argv[1]?.endsWith('prep.ts') || process.argv[1]?.endsWith('prep.js')
      : false;
  } catch {
    return false;
  }
})();

if (isCli) {
  const result = await runPrep();
  for (const c of result.checks) {
    const prefix = c.ok ? '✅' : '❌';
    process.stdout.write(`${prefix} ${c.name.padEnd(28)} ${c.message}\n`);
  }
  process.stdout.write(
    `\n${result.ok ? '✅' : '❌'} prep ${result.ok ? 'passed' : 'FAILED'} (schema v${result.schema_version})\n`,
  );
  process.exit(result.ok ? 0 : 1);
}
