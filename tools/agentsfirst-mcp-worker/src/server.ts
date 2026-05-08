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

export function createServer(): McpServer {
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
          ])
          .describe(
            'Principle slug. One of: interface-first, contract-first, prep-gates, typed-state, visible-outputs, multi-model-verification, perspective-dispatch, autonomous-recovery.',
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
            'token-dump',
          ])
          .describe(
            'Anti-pattern slug. One of: lazy-wrapper, invisible-product, agents-without-rules, single-model-trust, slow-chatbot, ship-and-forget, god-server, token-dump.',
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
