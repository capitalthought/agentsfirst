#!/usr/bin/env node
// agentsfirst-mcp — MCP server that scores any product against the Agents First framework.
//
// Interface First applied to itself: 5 verb-first tools, Zod-typed params, structured returns.
// Read AGENTS.md for the rules on how to call these tools — permissions, sequence, errors.
//
// See https://agentsfirst.dev/principles/

import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { runPrep } from './prep.js';
import { probeCodebase, probeWebsite } from './probe.js';
import { scoreCodebase, scoreWebsite } from './score.js';
import {
  ANTI_PATTERNS,
  ANTI_PATTERN_SLUGS,
  PRINCIPLES,
  PRINCIPLE_SLUGS,
  type AntiPatternSlug,
  type PrincipleSlug,
} from './principles.js';

const VERSION = '0.5.0';
// 6 tools — approaching God Server (anti-pattern). At 7+ tools, audit hard:
// every new tool needs an exceptional justification or it should be folded
// into an existing one. https://agentsfirst.dev/glossary/god-server/
const TOOL_COUNT = 6;

const SERVER_DIR = fileURLToPath(new URL('.', import.meta.url));
// src/ → mcp pkg root → tools/ → repo root → state/radar-state.json
const RADAR_STATE_PATH = resolve(SERVER_DIR, '..', '..', '..', 'state', 'radar-state.json');

const server = new McpServer({
  name: 'agentsfirst-mcp',
  version: VERSION,
});

const AGENTS_MD_REF = 'See AGENTS.md (https://agentsfirst.dev/principles/contract-first/) for permissions, sequence, and error contract.';

function jsonContent(payload: unknown, isError = false) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
    isError,
  };
}

// ─── agentsfirst_prep ─────────────────────────────────────────────────────────
server.registerTool(
  'agentsfirst_prep',
  {
    title: 'Prep gate — verify rubric loaded, network reachable',
    description: `Prep Gate for agentsfirst-mcp. Call this first, every session, before any other tool. Returns ok=true when the rubric is loaded, node>=20, and the canonical principles URL is reachable. ${AGENTS_MD_REF}`,
    inputSchema: {},
  },
  async () => {
    const result = await runPrep();
    return jsonContent(result, !result.ok);
  },
);

// ─── score_codebase ───────────────────────────────────────────────────────────
server.registerTool(
  'score_codebase',
  {
    title: 'Score a local directory against the 8 principles',
    description: `Probes a local codebase and scores it against the Agents First rubric (100 pts). Returns score, level (0–4), per-principle breakdown, anti-pattern flags, and ranked top moves. Read-only — never writes anywhere. ${AGENTS_MD_REF}`,
    inputSchema: {
      path: z
        .string()
        .default(process.cwd())
        .describe('Absolute or relative path to the directory to score. Defaults to cwd.'),
      depth: z
        .enum(['quick', 'standard', 'deep'])
        .default('standard')
        .describe(
          'Probe depth. quick = signals only, standard = signals + scoring, deep = standard + extra heuristics. Currently all three behave the same; param reserved for future heuristics.',
        ),
    },
  },
  async ({ path: targetPath }) => {
    try {
      const signals = await probeCodebase(targetPath);
      const score = scoreCodebase(signals);
      return jsonContent(score);
    } catch (err) {
      return jsonContent(
        {
          error: 'probe_failed',
          suggestion:
            'verify the path exists and is a directory; absolute paths preferred',
          detail: (err as Error).message,
        },
        true,
      );
    }
  },
);

// ─── score_website ────────────────────────────────────────────────────────────
server.registerTool(
  'score_website',
  {
    title: 'Score a public website against agent-readiness dimensions',
    description: `HTTP-probes a URL for agent-discoverable surfaces (robots.txt, /llms.txt, /AGENTS.md, /.well-known/*, OpenAPI, MCP server card, markdown content negotiation) and scores against 5 dimensions (100 pts). Returns score, level, dimensions, anti-pattern flags, top moves. Read-only. ${AGENTS_MD_REF}`,
    inputSchema: {
      url: z
        .string()
        .url()
        .refine((u) => /^https?:\/\//i.test(u), { message: 'must be http or https' })
        .describe('Public URL to probe. Must be http:// or https://.'),
    },
  },
  async ({ url }) => {
    try {
      const signals = await probeWebsite(url);
      const score = scoreWebsite(signals);
      return jsonContent(score);
    } catch (err) {
      return jsonContent(
        {
          error: 'probe_failed',
          suggestion: 'verify the URL is reachable and starts with http:// or https://',
          detail: (err as Error).message,
        },
        true,
      );
    }
  },
);

// ─── get_principle ────────────────────────────────────────────────────────────
server.registerTool(
  'get_principle',
  {
    title: 'Get the canonical text of one Agents First principle',
    description: `Returns the canonical name, summary (~60 words), full URL on agentsfirst.dev, and the anti-patterns this principle defends against. Use after score_* to give the consumer agent context for what to fix. ${AGENTS_MD_REF}`,
    inputSchema: {
      slug: z
        .enum([
          'interface-first',
          'contract-first',
          'prep-gates',
          'typed-state',
          'visible-outputs',
          'multi-model-verification',
          'perspective-dispatch',
          'autonomous-recovery',
          'inspectable-state',
        ])
        .describe(
          'Principle slug. One of: interface-first, contract-first, prep-gates, typed-state, visible-outputs, multi-model-verification, perspective-dispatch, autonomous-recovery, inspectable-state.',
        ),
    },
  },
  async ({ slug }) => {
    const p = PRINCIPLES[slug as PrincipleSlug];
    if (!p) {
      return jsonContent(
        {
          error: 'not_found',
          suggestion: `valid slugs: ${PRINCIPLE_SLUGS.join(', ')}`,
        },
        true,
      );
    }
    return jsonContent(p);
  },
);

// ─── get_anti_pattern ─────────────────────────────────────────────────────────
server.registerTool(
  'get_anti_pattern',
  {
    title: 'Get the canonical definition of one Agents First anti-pattern',
    description: `Returns the canonical name, definition, the principle it opposes, and the glossary URL. Use after score_* to explain why a flagged anti-pattern matters. ${AGENTS_MD_REF}`,
    inputSchema: {
      slug: z
        .enum([
          'lazy-wrapper',
          'invisible-product',
          'agents-without-rules',
          'single-model-trust',
          'slow-chatbot',
          'ship-and-forget',
          'god-server',
          'black-box-server',
        ])
        .describe(
          'Anti-pattern slug. One of: lazy-wrapper, invisible-product, agents-without-rules, single-model-trust, slow-chatbot, ship-and-forget, god-server, black-box-server.',
        ),
    },
  },
  async ({ slug }) => {
    const a = ANTI_PATTERNS[slug as AntiPatternSlug];
    if (!a) {
      return jsonContent(
        {
          error: 'not_found',
          suggestion: `valid slugs: ${ANTI_PATTERN_SLUGS.join(', ')}`,
        },
        true,
      );
    }
    return jsonContent(a);
  },
);

// ─── radar_overview ───────────────────────────────────────────────────────────
server.registerTool(
  'radar_overview',
  {
    title: 'Inspect agentsfirst-radar operational state',
    description: `Returns the agentsfirst-radar's Inspectable State (Principle 9). Includes acceptance rate (7d/30d), open recommendations, source health, cron freshness, paused status, and multipov spend. Read-only — never mutates state. Companion to the daily morning briefing. ${AGENTS_MD_REF}`,
    inputSchema: {},
  },
  async () => {
    try {
      const overview = await renderRadarOverview();
      return {
        content: [{ type: 'text' as const, text: overview }],
      };
    } catch (err) {
      return jsonContent(
        {
          error: 'radar_overview_failed',
          suggestion:
            'verify state/radar-state.json exists and is valid; the radar refuses to mutate from invalid state',
          detail: (err as Error).message,
        },
        true,
      );
    }
  },
);

async function renderRadarOverview(): Promise<string> {
  let raw: string;
  try {
    raw = await fs.readFile(RADAR_STATE_PATH, 'utf8');
  } catch {
    return [
      '# Agentsfirst Radar — Inspectable State',
      '',
      '⚠️ Radar has not run yet — no state file at `state/radar-state.json`.',
      '',
      'Run `npm run state:init` in `tools/agentsfirst-radar/` to bootstrap.',
    ].join('\n');
  }

  let state: unknown;
  try {
    state = JSON.parse(raw);
  } catch (err) {
    return [
      '# Agentsfirst Radar — Inspectable State',
      '',
      '🚨 Radar state file is malformed:',
      `\`${(err as Error).message}\``,
      '',
      'Inspect `state/radar-state.json` manually; the radar refuses to mutate from invalid state per AGENTS.md §Errors.',
    ].join('\n');
  }

  return renderOverviewInline(state as Record<string, unknown>);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderOverviewInline(state: any): string {
  const nowIso = new Date().toISOString();
  const now = Date.now();
  const day = 24 * 3600 * 1000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recs: any[] = Object.values(state.recommendations ?? {});
  const SHIPPED = new Set(['accepted', 'in_flight', 'shipped']);
  const ACT_ALL = new Set(['accepted', 'in_flight', 'shipped', 'dismissed', 'auto_dismissed']);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function within(rec: any, days: number) {
    return now - Date.parse(rec.created_iso) < days * day;
  }
  const accept7d = recs.filter((r) => within(r, 7));
  const accept30d = recs.filter((r) => within(r, 30));
  const num7 = accept7d.filter((r) => SHIPPED.has(r.status)).length;
  const den7 = accept7d.filter((r) => ACT_ALL.has(r.status)).length;
  const num30 = accept30d.filter((r) => SHIPPED.has(r.status)).length;
  const den30 = accept30d.filter((r) => ACT_ALL.has(r.status)).length;
  const autoDismissed30 = recs.filter(
    (r) => r.status === 'auto_dismissed' && now - Date.parse(r.status_changed_iso) < 30 * day,
  ).length;
  const openGt24h = recs.filter(
    (r) => r.status === 'open' && now - Date.parse(r.created_iso) > day,
  ).length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sources: any[] = Object.values(state.sources_health ?? {});
  const healthy = sources.filter((s) => s.consecutive_failures === 0).length;
  const degraded = sources.filter(
    (s) => s.consecutive_failures >= 1 && s.consecutive_failures < 3,
  ).length;
  const dead = sources.filter((s) => s.consecutive_failures >= 3).length;
  const lastRun = state.last_run_iso;
  const ageH = lastRun ? Math.round((now - Date.parse(lastRun)) / 3600 / 1000) : Infinity;
  const cronEmoji = ageH <= 26 ? '✅' : '🚨';

  const lines: string[] = [
    '# Agentsfirst Radar — Inspectable State',
    '',
    `**As of:** ${nowIso}`,
    '',
    '## Acceptance',
    `- 7d:  ${num7}/${den7}${den7 > 0 ? ` (${Math.round((num7 / den7) * 100)}%)` : ''}`,
    `- 30d: ${num30}/${den30}${den30 > 0 ? ` (${Math.round((num30 / den30) * 100)}%)` : ''}`,
    '',
    '## Stale / pending',
    `- Auto-dismissed (30d): ${autoDismissed30}`,
    `- Open >24h (not yet decided): ${openGt24h}`,
    '',
    '## Sources',
    `- Healthy: ${healthy}  ·  Degraded: ${degraded}  ·  Dead: ${dead}`,
    '',
    '## Cron',
    `- ${cronEmoji} Last run: ${lastRun ?? 'never'}${isFinite(ageH) ? ` (${ageH}h ago)` : ''}`,
  ];

  if (state.agent_paused) {
    lines.push('', `⏸️ **PAUSED:** ${state.pause_reason ?? '(no reason)'}`);
  }

  const spend = state.multipov_spend_today_usd ?? 0;
  const cap = 10; // matches MULTIPOV_DAILY_CAP_USD default
  if (spend > cap * 0.5) {
    lines.push('', `💸 Multipov spend today: $${spend.toFixed(2)} of $${cap.toFixed(2)} cap`);
  }

  const recentRecs = recs
    .slice()
    .sort((a, b) => Date.parse(b.created_iso) - Date.parse(a.created_iso))
    .slice(0, 10);
  if (recentRecs.length > 0) {
    lines.push('', '## Recent recommendations (last 10)', '');
    lines.push('| ID | Lane | Status | Age (h) | Headline |');
    lines.push('|----|------|--------|---------|----------|');
    for (const r of recentRecs) {
      const ageRecH = Math.round((now - Date.parse(r.created_iso)) / 3600 / 1000);
      const truncated =
        String(r.headline).length > 60
          ? String(r.headline).slice(0, 57) + '...'
          : r.headline;
      lines.push(`| ${r.id} | ${r.lane} | ${r.status} | ${ageRecH} | ${truncated} |`);
    }
  } else {
    lines.push('', '## Recent recommendations', '', '_No recommendations on file yet._');
  }

  const degradedSorted = sources
    .filter((s) => s.consecutive_failures > 0)
    .sort((a, b) => Date.parse(b.last_attempt_iso) - Date.parse(a.last_attempt_iso))
    .slice(0, 5);
  if (degradedSorted.length > 0) {
    lines.push('', '## Degraded sources (5 most recent)');
    for (const s of degradedSorted) {
      const err = s.last_error ? ` — last error: ${String(s.last_error).slice(0, 80)}` : '';
      lines.push(`- \`${s.source_id}\` — ${s.consecutive_failures} consecutive failures${err}`);
    }
  }

  return lines.join('\n');
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);

process.stderr.write(
  `agentsfirst-mcp v${VERSION} ready · ${TOOL_COUNT} tools · https://agentsfirst.dev\n`,
);
