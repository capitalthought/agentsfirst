// agentsfirst-mcp Worker — server factory.
//
// Hosted variant of the stdio MCP at https://agentsfirst.dev/mcp. Registers
// 5 tools — 4 callable, 1 deferred-to-local. The server itself is created
// per-request in index.ts; this module is only the registration logic.
//
// See https://agentsfirst.dev/principles/

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { runPrep } from './prep.js';
import { probeWebsite } from './probe-website.js';
import { scoreWebsite } from './score.js';
import {
  ANTI_PATTERNS,
  ANTI_PATTERN_SLUGS,
  PRINCIPLES,
  PRINCIPLE_SLUGS,
  type AntiPatternSlug,
  type PrincipleSlug,
} from './principles.js';

export const VERSION = '0.1.0';
export const SERVER_NAME = 'agentsfirst-mcp';
export const TOOL_NAMES = [
  'agentsfirst_prep',
  'score_website',
  'score_codebase',
  'get_principle',
  'get_anti_pattern',
] as const;

const AGENTS_MD_REF =
  'See AGENTS.md (https://agentsfirst.dev/principles/contract-first/) for permissions, sequence, and error contract.';

const NPX_HINT =
  'Codebase scoring requires the local npx version: `npx -y @capitalthought/agentsfirst-mcp`. The Worker hosted at https://agentsfirst.dev/mcp only scores public URLs.';

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

// Minimal Env shape — only the bindings this module touches. Kept local so
// server.ts doesn't depend on the worker entry's full Env interface.
interface ServerEnv {
  SCORE_EVENTS?: AnalyticsEngineDataset;
}

// Anonymized hostname digest for SCORE_EVENTS.blob1. Hostname-only, never the
// full URL, query string, or path. Returns hex SHA-256.
async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Fire-and-forget telemetry. Wrapped in a try/catch so a binding outage or a
// bad input never breaks the score path. writeDataPoint is synchronous on the
// worker side, but defending against any future shape change is cheap.
function recordScoreEvent(
  env: ServerEnv | undefined,
  hostnameHash: string,
  level: number,
  score: number,
): void {
  if (!env?.SCORE_EVENTS) return;
  try {
    env.SCORE_EVENTS.writeDataPoint({
      indexes: [new Date().toISOString().slice(0, 10)], // YYYY-MM-DD
      blobs: [hostnameHash, String(level)],
      doubles: [score],
    });
  } catch {
    // Telemetry failure must never affect scoring.
  }
}

export function createServer(env?: ServerEnv): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: VERSION,
  });

  // ─── agentsfirst_prep ───────────────────────────────────────────────────────
  server.registerTool(
    'agentsfirst_prep',
    {
      title: 'Prep gate — verify rubric loaded, network reachable',
      description: `Prep Gate for agentsfirst-mcp (hosted Worker variant). Call this first, every session, before any other tool. Returns ok=true when the rubric is loaded, the runtime exposes fetch/AbortController, and the canonical principles URL is reachable. ${AGENTS_MD_REF}`,
      inputSchema: {},
    },
    async () => {
      const result = await runPrep();
      return jsonContent(result, !result.ok);
    },
  );

  // ─── score_website ──────────────────────────────────────────────────────────
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
        // Anonymized usage telemetry — hostname-only SHA-256, level bucket,
        // and score. Indexed by date. Skipped silently if SCORE_EVENTS isn't
        // bound (local dev, tests).
        try {
          const hostname = new URL(url).hostname.toLowerCase();
          const hostnameHash = await sha256Hex(hostname);
          recordScoreEvent(env, hostnameHash, score.level, score.score);
        } catch {
          // never break scoring on telemetry failure
        }
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

  // ─── score_codebase (deferred-to-local) ─────────────────────────────────────
  // Registered so tools/list shows the full surface; agents that get here
  // are routed to the npx version with a structured pointer.
  server.registerTool(
    'score_codebase',
    {
      title: 'Score a local directory — NOT available in the hosted Worker',
      description: `Deferred-to-local. The hosted Worker at https://agentsfirst.dev/mcp cannot read local filesystems. ${NPX_HINT} ${AGENTS_MD_REF}`,
      inputSchema: {
        path: z
          .string()
          .optional()
          .describe('Ignored by the Worker. Pass to the local npx version instead.'),
      },
    },
    async () => {
      return jsonContent(
        {
          error: 'not_supported_by_worker',
          suggestion: NPX_HINT,
          local_install: 'npx -y @capitalthought/agentsfirst-mcp',
          npm_url: 'https://www.npmjs.com/package/@capitalthought/agentsfirst-mcp',
          worker_endpoint: 'https://agentsfirst.dev/mcp',
          worker_supports: ['agentsfirst_prep', 'score_website', 'get_principle', 'get_anti_pattern'],
        },
        true,
      );
    },
  );

  // ─── get_principle ──────────────────────────────────────────────────────────
  server.registerTool(
    'get_principle',
    {
      title: 'Get the canonical text of one Agents First principle',
      description: `Returns the canonical name, summary (~60 words), full URL on agentsfirst.dev, and the anti-patterns this principle defends against. Use after score_website to give the consumer agent context for what to fix. ${AGENTS_MD_REF}`,
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

  // ─── get_anti_pattern ───────────────────────────────────────────────────────
  server.registerTool(
    'get_anti_pattern',
    {
      title: 'Get the canonical definition of one Agents First anti-pattern',
      description: `Returns the canonical name, definition, the principle it opposes, and the glossary URL. Use after score_website to explain why a flagged anti-pattern matters. ${AGENTS_MD_REF}`,
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

  return server;
}
