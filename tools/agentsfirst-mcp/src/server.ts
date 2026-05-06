#!/usr/bin/env node
// agentsfirst-mcp — MCP server that scores any product against the Agents First framework.
//
// Interface First applied to itself: 5 verb-first tools, Zod-typed params, structured returns.
// Read AGENTS.md for the rules on how to call these tools — permissions, sequence, errors.
//
// See https://agentsfirst.dev/principles/

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

const VERSION = '0.1.0';
const TOOL_COUNT = 5;

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
        ])
        .describe(
          'Anti-pattern slug. One of: lazy-wrapper, invisible-product, agents-without-rules, single-model-trust, slow-chatbot, ship-and-forget, god-server.',
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

// ─── Boot ─────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);

process.stderr.write(
  `agentsfirst-mcp v${VERSION} ready · ${TOOL_COUNT} tools · https://agentsfirst.dev\n`,
);
