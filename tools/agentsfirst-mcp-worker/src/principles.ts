// Canonical Agents First definitions — the 8 principles + 8 anti-patterns.
//
// Source of truth: https://agentsfirst.dev/principles/ and https://agentsfirst.dev/glossary/
// These constants power get_principle and get_anti_pattern. Summaries are tight (~60 words)
// — for the full argument, link out to the canonical URLs.

export const RUBRIC_VERSION = '0.6';
export const PRINCIPLES_URL = 'https://agentsfirst.dev/principles/';
export const GLOSSARY_URL = 'https://agentsfirst.dev/glossary/';

export type PrincipleSlug =
  | 'interface-first'
  | 'contract-first'
  | 'prep-gates'
  | 'typed-state'
  | 'visible-outputs'
  | 'multi-model-verification'
  | 'perspective-dispatch'
  | 'autonomous-recovery';

export type AntiPatternSlug =
  | 'lazy-wrapper'
  | 'invisible-product'
  | 'agents-without-rules'
  | 'single-model-trust'
  | 'slow-chatbot'
  | 'ship-and-forget'
  | 'god-server'
  | 'token-dump';

export interface Principle {
  slug: PrincipleSlug;
  name: string;
  summary: string;
  full_url: string;
  anti_patterns_defended: AntiPatternSlug[];
}

export interface AntiPattern {
  slug: AntiPatternSlug;
  name: string;
  definition: string;
  opposes_principle: PrincipleSlug;
  glossary_url: string;
}

export const PRINCIPLES: Record<PrincipleSlug, Principle> = {
  'interface-first': {
    slug: 'interface-first',
    name: 'Interface First',
    summary:
      'Design the agent interface — MCP server, CLI, or typed SDK — before any human UI. The first artifact of every feature is a verb-first tool definition with typed parameters and structured returns. The web app, mobile app, and integrations all become consumers of the same capability the agent uses. Aim for 10–20 well-chosen tools per server, not 200.',
    full_url: 'https://agentsfirst.dev/principles/interface-first/',
    anti_patterns_defended: ['invisible-product', 'lazy-wrapper', 'god-server', 'ship-and-forget'],
  },
  'contract-first': {
    slug: 'contract-first',
    name: 'Contract First',
    summary:
      'Write the usage rules — permissions, sequences, identifiers, formatting — in AGENTS.md before implementation. Tool definitions tell the agent what is possible; the contract tells it what is allowed. Without a contract agents hallucinate IDs, violate constraints, and create duplicates. Cost: one markdown file. Skip it and trust collapses on the first wrong action.',
    full_url: 'https://agentsfirst.dev/principles/contract-first/',
    anti_patterns_defended: ['agents-without-rules', 'token-dump'],
  },
  'prep-gates': {
    slug: 'prep-gates',
    name: 'Prep Gates',
    summary:
      'Pre-flight checks before every agent session — validate credentials, load fresh IDs, confirm downstream services are healthy. Stale context is the #1 source of agent errors. Ship a verb-first <project>_prep tool with every server. Make AGENTS.md require it as the first call. Re-prep only on demand or after a stale-identifier error.',
    full_url: 'https://agentsfirst.dev/principles/prep-gates/',
    anti_patterns_defended: [],
  },
  'typed-state': {
    slug: 'typed-state',
    name: 'Typed State',
    summary:
      'All persistent agent state flows through one structured contract with versioned migrations. Each module owns its slice. Use enums not strings, schemas not JSON blobs, named transitions not free-text status updates. The schema is the coordination layer between autonomous jobs that cannot message each other directly.',
    full_url: 'https://agentsfirst.dev/principles/typed-state/',
    anti_patterns_defended: [],
  },
  'visible-outputs': {
    slug: 'visible-outputs',
    name: 'Visible Outputs',
    summary:
      'Agent actions produce human-readable artifacts in tools the human already opens — Slack, email, the task manager, the inbox — not a JSON blob in a dashboard nobody checks. Lead with the action ("Created task X in Project Alpha"). Identify the agent and moment. Surface failures the same way. Track human visibility rate as a first-class metric.',
    full_url: 'https://agentsfirst.dev/principles/visible-outputs/',
    anti_patterns_defended: [],
  },
  'multi-model-verification': {
    slug: 'multi-model-verification',
    name: 'Multi-Model Verification',
    summary:
      'For high-stakes decisions — deploys, security reviews, billing changes — fan the prompt out to three independent models in parallel and trust only what at least two agree on. Different vendors are best. Run findings through a cheap dedup model. Sort into consensus / disputed / single-model buckets. Apply selectively; verifying every tool call breaks the economics.',
    full_url: 'https://agentsfirst.dev/principles/multi-model-verification/',
    anti_patterns_defended: ['single-model-trust'],
  },
  'perspective-dispatch': {
    slug: 'perspective-dispatch',
    name: 'Perspective Dispatch',
    summary:
      'Complex reviews dispatch multiple constrained perspectives — security, UX, new-user, performance — against the same artifact in parallel. Each persona has a defined focus area and a fixed severity scale; findings outside the focus get discarded. The constraint sharpens each reviewer; aggregation produces a single actionable report in minutes instead of weeks of calendar time.',
    full_url: 'https://agentsfirst.dev/principles/perspective-dispatch/',
    anti_patterns_defended: [],
  },
  'autonomous-recovery': {
    slug: 'autonomous-recovery',
    name: 'Autonomous Recovery',
    summary:
      'Retry transient errors with exponential backoff and a budget; do not retry permanent ones. Make every operation idempotent. Do not alert on the first failure — alert on a sustained pattern. When self-healing genuinely fails, escalate with what happened, what was tried, and a direct link to take manual action. Failing well is the discipline.',
    full_url: 'https://agentsfirst.dev/principles/autonomous-recovery/',
    anti_patterns_defended: ['slow-chatbot'],
  },
};

export const ANTI_PATTERNS: Record<AntiPatternSlug, AntiPattern> = {
  'lazy-wrapper': {
    slug: 'lazy-wrapper',
    name: 'The Lazy Wrapper',
    definition:
      'The agent interface is just fetch() with a different name. No domain knowledge, no validation, no structured errors — the agent asks for active deals and gets back 47KB of nested JSON with undocumented field names. Handing someone the raw database and calling it a product.',
    opposes_principle: 'interface-first',
    glossary_url: 'https://agentsfirst.dev/glossary/#lazy-wrapper',
  },
  'invisible-product': {
    slug: 'invisible-product',
    name: 'The Invisible Product',
    definition:
      'Ship the web app, expose a REST API later, never think about agent access. Your product does not exist to the agent ecosystem. When a developer\'s agent needs to do the job your product was built for, it picks a competitor that\'s actually in the tool list. The cost is silent — you never enter consideration.',
    opposes_principle: 'interface-first',
    glossary_url: 'https://agentsfirst.dev/glossary/#invisible-product',
  },
  'agents-without-rules': {
    slug: 'agents-without-rules',
    name: 'Agents Without Rules',
    definition:
      'No AGENTS.md, no usage constraints, no sequencing requirements, no permissions matrix. The agent hallucinates identifiers, violates rate limits, creates duplicate records, and emails the wrong customers. Then someone says "AI doesn\'t work" and turns it off.',
    opposes_principle: 'contract-first',
    glossary_url: 'https://agentsfirst.dev/glossary/#agents-without-rules',
  },
  'single-model-trust': {
    slug: 'single-model-trust',
    name: 'Single-Model Trust',
    definition:
      'Acting on one LLM\'s "looks safe" recommendation for decisions that cost money or affect users — billing changes, deploys, security reviews. A coin flip dressed up as confidence. The model misses the auth bypass because the auth bypass looks like normal code; the model is being a single point of failure on decisions where one is unacceptable.',
    opposes_principle: 'multi-model-verification',
    glossary_url: 'https://agentsfirst.dev/glossary/#single-model-trust',
  },
  'slow-chatbot': {
    slug: 'slow-chatbot',
    name: 'The Slow Chatbot',
    definition:
      'Requiring human approval for every agent action. If the agent can\'t do anything without asking permission, it\'s not an agent — it\'s a chatbot with extra steps. Defeats the entire point of automation.',
    opposes_principle: 'autonomous-recovery',
    glossary_url: 'https://agentsfirst.dev/glossary/#slow-chatbot',
  },
  'ship-and-forget': {
    slug: 'ship-and-forget',
    name: 'Ship and Forget',
    definition:
      'Launch an agent integration for the press release, then never maintain it. Agents try to use it, hit broken auth or stale schemas, fail, and develop a negative association with your product. Worse than not having one.',
    opposes_principle: 'interface-first',
    glossary_url: 'https://agentsfirst.dev/glossary/#ship-and-forget',
  },
  'god-server': {
    slug: 'god-server',
    name: 'The God Server',
    definition:
      'An agent interface exposing 200 tools because it wraps an entire platform. Agents choke on tool selection when there are too many options, and the tool definitions alone can consume 50%+ of a context window before any work happens. Ten well-chosen tools beat two hundred exhaustive ones.',
    opposes_principle: 'interface-first',
    glossary_url: 'https://agentsfirst.dev/glossary/#god-server',
  },
  'token-dump': {
    slug: 'token-dump',
    name: 'The Token Dump',
    definition:
      'Generating a 6,000-token AGENTS.md by asking an LLM to "describe this repo." A 2026 study across 4 agents and 438 tasks found auto-generated AGENTS.md files measurably reduced agent success rates compared to no file at all. The contract artifact is the constraints an agent can\'t infer from the code — sequencing rules, hidden invariants, recurring failure modes — not a project tour. ~50 lines, hand-written. Length is the failure mode, not absence.',
    opposes_principle: 'contract-first',
    glossary_url: 'https://agentsfirst.dev/glossary/#token-dump',
  },
};

export const PRINCIPLE_SLUGS = Object.keys(PRINCIPLES) as PrincipleSlug[];
export const ANTI_PATTERN_SLUGS = Object.keys(ANTI_PATTERNS) as AntiPatternSlug[];

/**
 * Smallest-experiment guidance per principle — one concrete next move
 * the consumer can ship today to earn the first points.
 */
export const SMALLEST_EXPERIMENT: Record<PrincipleSlug, string> = {
  'interface-first':
    'Wrap your single most-used operation as one verb-first MCP tool with a Zod-typed parameter schema and a structured return. Ship it, measure time-to-first-agent-action, expand from there.',
  'contract-first':
    'Add an AGENTS.md at the repo root covering Permissions, Required Prep, Identifiers, Sequence, and Errors. One file. The agent loads it on session start.',
  'prep-gates':
    'Add a <project>_prep MCP tool that validates env, loads fresh IDs, and pings downstream services. Make AGENTS.md require it as the first call of every session.',
  'typed-state':
    'Replace the largest free-text status column with a Zod enum and a numbered migration. Generate the agent\'s tool params from the same schema.',
  'visible-outputs':
    'On every successful write tool, post a one-line human-readable artifact to Slack or email. Lead with the verb. Include a clickable link back to the action.',
  'multi-model-verification':
    'For your highest-stakes write (deploy, billing change, mass email), fan the decision out to Claude + GPT + Gemini. Act only on findings two of three agree on.',
  'perspective-dispatch':
    'Add three reviewer personas (security, UX, new-user) with constrained system prompts. Run them in parallel against your next design doc; aggregate by severity.',
  'autonomous-recovery':
    'Wrap every external call in a withRetry() helper with exponential backoff (1s, 2s, 4s, 8s, jitter) and a 5-attempt budget. On exhaustion, escalate with what/tried/manual-action.',
};
