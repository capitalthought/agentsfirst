// Scoring — pure functions over probe signals.
//
// Implements the rubric from ~/.claude/skills/agentsfirst/SKILL.md.
// 100 points total. Maps to a 0–4 adoption level.

import type { CodebaseSignals, WebsiteSignals } from './probe-website.js';
import {
  PRINCIPLE_SLUGS,
  SMALLEST_EXPERIMENT,
  type AntiPatternSlug,
  type PrincipleSlug,
} from './principles.js';

export type Status = 'pass' | 'partial' | 'fail';

export interface PrincipleScore {
  pts: number;
  max: number;
  status: Status;
  notes: string[];
}

export interface AntiPatternFlag {
  slug: AntiPatternSlug;
  name: string;
  evidence: string;
}

export interface TopMove {
  rank: number;
  principle: PrincipleSlug | 'discoverability';
  gap_pts: number;
  action: string;
}

export interface CodebaseScore {
  score: number;
  level: 0 | 1 | 2 | 3 | 4;
  level_name: string;
  principles: Record<string, PrincipleScore>;
  anti_patterns_flagged: AntiPatternFlag[];
  top_moves: TopMove[];
  probe_signals: CodebaseSignals;
}

export interface WebsiteScore {
  score: number;
  level: 0 | 1 | 2 | 3 | 4;
  level_name: string;
  dimensions: Record<string, PrincipleScore>;
  anti_patterns_flagged: AntiPatternFlag[];
  top_moves: TopMove[];
  probe_signals: WebsiteSignals;
}

const LEVEL_NAMES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'No agent access',
  1: 'Agent as Afterthought',
  2: 'Agent-Aware',
  3: 'Agents First',
  4: 'Agent-Driven',
};

function levelFor(score: number): 0 | 1 | 2 | 3 | 4 {
  if (score <= 10) return 0;
  if (score <= 25) return 1;
  if (score <= 60) return 2;
  if (score <= 85) return 3;
  return 4;
}

function statusFor(pts: number, max: number): Status {
  if (pts === 0) return 'fail';
  if (pts >= max * 0.75) return 'pass';
  return 'partial';
}

// ─── Codebase scoring ─────────────────────────────────────────────────────────

export function scoreCodebase(signals: CodebaseSignals): CodebaseScore {
  const principles: Record<string, PrincipleScore> = {};

  // Interface First (20)
  principles['interface-first'] = scoreInterfaceFirst(signals);
  // Contract First (15)
  principles['contract-first'] = scoreContractFirst(signals);
  // Prep Gates (10)
  principles['prep-gates'] = scorePrepGates(signals);
  // Typed State (10)
  principles['typed-state'] = scoreTypedState(signals);
  // Visible Outputs (10)
  principles['visible-outputs'] = scoreVisibleOutputs(signals);
  // Multi-Model Verification (5)
  principles['multi-model-verification'] = scoreMultiModel(signals);
  // Perspective Dispatch (5)
  principles['perspective-dispatch'] = scorePerspectiveDispatch(signals);
  // Autonomous Recovery (10)
  principles['autonomous-recovery'] = scoreRecovery(signals);
  // Discoverability bonus (15)
  principles['discoverability'] = scoreDiscoverability(signals);

  const score = Object.values(principles).reduce((a, b) => a + b.pts, 0);
  const level = levelFor(score);

  const anti_patterns_flagged = flagAntiPatterns(signals);
  const top_moves = computeTopMoves(principles);

  return {
    score,
    level,
    level_name: LEVEL_NAMES[level],
    principles,
    anti_patterns_flagged,
    top_moves,
    probe_signals: signals,
  };
}

function scoreInterfaceFirst(signals: CodebaseSignals): PrincipleScore {
  const max = 20;
  let pts = 0;
  const notes: string[] = [];

  const mcp = signals.signals.mcp_server;
  const cli = signals.signals.cli;
  const sdk = signals.signals.typed_sdk;

  if (mcp.detected) {
    pts += 10;
    notes.push('MCP server detected');
  } else if (cli.detected) {
    pts += 8;
    notes.push('CLI detected (no MCP server)');
  } else if (sdk.detected) {
    pts += 6;
    notes.push('Typed SDK detected (no MCP, no CLI)');
  } else {
    notes.push('No agent interface found — no MCP, no CLI, no typed SDK');
  }

  // Verb-first tool names (5)
  const verbRatio = mcp.indicators.verb_first_ratio ?? 0;
  if (verbRatio >= 0.7) {
    pts += 5;
    notes.push(`Verb-first tool names (ratio ${(verbRatio * 100).toFixed(0)}%)`);
  } else if (verbRatio > 0) {
    pts += 2;
    notes.push(`Mixed naming — verb-first ratio only ${(verbRatio * 100).toFixed(0)}%`);
  }

  // Typed parameters (5)
  if (mcp.indicators.uses_zod_for_params) {
    pts += 5;
    notes.push('Zod-typed parameters');
  } else if (signals.signals.typed_state.indicators.zod_imports > 0) {
    pts += 2;
    notes.push('Zod present but not clearly bound to tool params');
  }

  return { pts: Math.min(pts, max), max, status: statusFor(pts, max), notes };
}

function scoreContractFirst(signals: CodebaseSignals): PrincipleScore {
  const max = 15;
  let pts = 0;
  const notes: string[] = [];
  const md = signals.signals.agents_md;
  if (md.exists) {
    pts += 10;
    notes.push(`AGENTS.md found at ${md.path}`);
    const sections = md.sections;
    if (sections) {
      const covered = (
        ['permissions', 'sequence', 'identifiers', 'errors'] as const
      ).filter((k) => sections[k]).length;
      const sectionPts = Math.round((covered / 4) * 5);
      pts += sectionPts;
      notes.push(
        `${covered}/4 required sections (permissions/sequence/identifiers/errors) → +${sectionPts}`,
      );
    }
  } else {
    notes.push('No AGENTS.md');
  }
  return { pts: Math.min(pts, max), max, status: statusFor(pts, max), notes };
}

function scorePrepGates(signals: CodebaseSignals): PrincipleScore {
  const max = 10;
  let pts = 0;
  const notes: string[] = [];
  const pg = signals.signals.prep_gate;
  if (pg.detected) {
    pts += 10;
    if (pg.indicators.prep_files?.length) {
      notes.push(`Prep file(s) detected: ${pg.indicators.prep_files.length}`);
    }
    if (pg.indicators.prep_tool_registrations) {
      notes.push(`<project>_prep tool registrations: ${pg.indicators.prep_tool_registrations}`);
    }
    if (pg.indicators.prep_function_exported) {
      notes.push('Exported runPrep()/preflightCheck()');
    }
  } else {
    notes.push('No prep gate — agents will start sessions on stale state');
  }
  return { pts, max, status: statusFor(pts, max), notes };
}

function scoreTypedState(signals: CodebaseSignals): PrincipleScore {
  const max = 10;
  let pts = 0;
  const notes: string[] = [];
  const ts = signals.signals.typed_state;
  if (ts.detected) {
    pts += 5;
    const which: string[] = [];
    if (ts.indicators.zod_imports > 0) which.push('zod');
    if (ts.indicators.json_schema_files > 0) which.push('json-schema');
    if (ts.indicators.prisma) which.push('prisma');
    if (ts.indicators.drizzle > 0) which.push('drizzle');
    notes.push(`Typed schema layer present (${which.join(', ') || 'detected'})`);
  } else {
    notes.push('No structured-schema layer found');
  }
  if (ts.has_migrations) {
    pts += 5;
    notes.push(`Versioned migrations (${ts.indicators.migration_files} files / prisma=${ts.indicators.prisma})`);
  } else {
    notes.push('No migration files detected');
  }
  return { pts, max, status: statusFor(pts, max), notes };
}

function scoreVisibleOutputs(signals: CodebaseSignals): PrincipleScore {
  const max = 10;
  let pts = 0;
  const notes: string[] = [];
  const vo = signals.signals.visible_outputs;
  if (vo.detected) {
    pts += 10;
    const sinks: string[] = [];
    if (vo.indicators.slack_imports > 0) sinks.push('slack');
    if (vo.indicators.postmark > 0) sinks.push('postmark');
    if (vo.indicators.resend > 0) sinks.push('resend');
    if (vo.indicators.email_general > 0) sinks.push('email');
    if (vo.indicators.linear > 0) sinks.push('linear');
    if (vo.indicators.audit_log_files > 0) sinks.push('audit-log');
    notes.push(`Visible-output sinks: ${sinks.join(', ')}`);
  } else if (vo.indicators.todo_ship_markers > 0) {
    pts += 3;
    notes.push(
      `${vo.indicators.todo_ship_markers} TODO ship-to markers — outputs planned but not wired`,
    );
  } else {
    notes.push('No human-visible output sink detected');
  }
  return { pts, max, status: statusFor(pts, max), notes };
}

function scoreMultiModel(signals: CodebaseSignals): PrincipleScore {
  const max = 5;
  let pts = 0;
  const notes: string[] = [];
  const mm = signals.signals.multi_model;
  if (mm.detected) {
    pts += 5;
    notes.push(
      `Multi-model verification wired (${mm.indicators.distinct_llm_sdks.join(' + ')})`,
    );
  } else if (mm.indicators.distinct_llm_sdks.length >= 2) {
    pts += 2;
    notes.push(
      `${mm.indicators.distinct_llm_sdks.length} LLM SDKs present but no consensus pattern`,
    );
  } else if (mm.indicators.distinct_llm_sdks.length === 1) {
    notes.push(`Single LLM SDK only (${mm.indicators.distinct_llm_sdks[0]})`);
  } else {
    notes.push('No LLM SDKs in dependency tree');
  }
  return { pts, max, status: statusFor(pts, max), notes };
}

function scorePerspectiveDispatch(signals: CodebaseSignals): PrincipleScore {
  const max = 5;
  let pts = 0;
  const notes: string[] = [];
  const pd = signals.signals.perspective_dispatch;
  if (pd.detected) {
    pts += 5;
    notes.push(
      `Perspective dispatch detected (personas=${pd.indicators.persona_files ?? 0}, reviewer hits=${pd.indicators.reviewer_pattern})`,
    );
  } else {
    notes.push('No multi-perspective reviewer pattern');
  }
  return { pts, max, status: statusFor(pts, max), notes };
}

function scoreRecovery(signals: CodebaseSignals): PrincipleScore {
  const max = 10;
  let pts = 0;
  const notes: string[] = [];
  const rec = signals.signals.autonomous_recovery;
  if (rec.detected) {
    pts += 5;
    notes.push('Retry-with-backoff helper present');
  } else {
    notes.push('No retry helper');
  }
  if (rec.has_escalation) {
    pts += 5;
    notes.push('Structured escalation pattern present');
  } else {
    notes.push('No structured escalation found');
  }
  return { pts, max, status: statusFor(pts, max), notes };
}

function scoreDiscoverability(signals: CodebaseSignals): PrincipleScore {
  const max = 15;
  let pts = 0;
  const notes: string[] = [];
  const d = signals.signals.discoverability.indicators;
  if (d.publishable) {
    pts += 5;
    notes.push(`Publishable package (${d.package_name})`);
  } else {
    notes.push('Not a publishable npm package (private or no name)');
  }
  if (d.readme_mentions_install && d.readme_mentions_mcp) {
    pts += 5;
    notes.push('README documents agent install (MCP + install command)');
  } else if (d.readme_mentions_install) {
    pts += 2;
    notes.push('README documents install but no MCP framing');
  } else {
    notes.push('README missing agent-install instructions');
  }
  // Public registry signal — proxy: homepage + repository fields populated
  if (d.has_homepage && d.has_repository_field) {
    pts += 5;
    notes.push('Homepage + repository fields populated (registry-discoverable)');
  } else {
    notes.push('Missing homepage and/or repository field');
  }
  return { pts: Math.min(pts, max), max, status: statusFor(pts, max), notes };
}

function flagAntiPatterns(signals: CodebaseSignals): AntiPatternFlag[] {
  const flags: AntiPatternFlag[] = [];

  if (!signals.derived.has_any_agent_interface) {
    flags.push({
      slug: 'invisible-product',
      name: 'The Invisible Product',
      evidence: 'No MCP server, no CLI, no typed SDK detected.',
    });
  }

  if (signals.derived.agents_without_rules_risk) {
    flags.push({
      slug: 'agents-without-rules',
      name: 'Agents Without Rules',
      evidence: 'Agent interface exists but no AGENTS.md at repo root.',
    });
  }

  if (signals.derived.god_server_risk === 'fail') {
    flags.push({
      slug: 'god-server',
      name: 'The God Server',
      evidence: `Estimated ${signals.signals.tool_count.estimated_total} tools — well over the 100-tool fail line.`,
    });
  } else if (signals.derived.god_server_risk === 'warn') {
    flags.push({
      slug: 'god-server',
      name: 'The God Server',
      evidence: `Estimated ${signals.signals.tool_count.estimated_total} tools — past the 30-tool warn line.`,
    });
  }

  const mm = signals.signals.multi_model.indicators;
  if (
    mm.distinct_llm_sdks.length === 1 &&
    !signals.signals.multi_model.detected
  ) {
    flags.push({
      slug: 'single-model-trust',
      name: 'Single-Model Trust',
      evidence: `Only ${mm.distinct_llm_sdks[0]} SDK in the tree; no consensus pattern wiring high-stakes decisions.`,
    });
  }

  // Ship-and-forget: agent files older than 180 days while repo presumably moves
  const ages = signals.signals.staleness.agent_file_ages;
  const oldAgentFiles = Object.entries(ages).filter(([, a]) => a.days_ago > 180);
  if (oldAgentFiles.length > 0 && Object.keys(ages).length > 0) {
    flags.push({
      slug: 'ship-and-forget',
      name: 'Ship and Forget',
      evidence: `Agent files untouched for 180+ days: ${oldAgentFiles.map(([f, a]) => `${f} (${a.days_ago}d)`).join(', ')}`,
    });
  }

  return flags;
}

function computeTopMoves(principles: Record<string, PrincipleScore>): TopMove[] {
  const gaps: Array<{ slug: string; gap: number }> = [];
  for (const slug of PRINCIPLE_SLUGS) {
    const s = principles[slug];
    if (!s) continue;
    const gap = s.max - s.pts;
    if (gap > 0) gaps.push({ slug, gap });
  }
  // Discoverability counts too
  const disc = principles['discoverability'];
  if (disc) {
    const gap = disc.max - disc.pts;
    if (gap > 0) gaps.push({ slug: 'discoverability', gap });
  }

  gaps.sort((a, b) => b.gap - a.gap);
  return gaps.slice(0, 3).map((g, i) => ({
    rank: i + 1,
    principle: g.slug as PrincipleSlug | 'discoverability',
    gap_pts: g.gap,
    action: actionFor(g.slug),
  }));
}

function actionFor(slug: string): string {
  if (slug === 'discoverability') {
    return 'Publish to npm under @capitalthought/* (or your scope), populate package.json homepage + repository, and document `npx -y <pkg>` agent install in the README.';
  }
  return SMALLEST_EXPERIMENT[slug as PrincipleSlug] ?? 'Apply the corresponding principle from https://agentsfirst.dev/principles/.';
}

// ─── Website scoring ──────────────────────────────────────────────────────────

export function scoreWebsite(signals: WebsiteSignals): WebsiteScore {
  const dimensions: Record<string, PrincipleScore> = {
    discoverability: scoreWebDiscoverability(signals),
    'content-accessibility': scoreContentAccessibility(signals),
    'bot-access-control': scoreBotAccessControl(signals),
    'agent-capabilities': scoreAgentCapabilities(signals),
    'visibility-of-agent-integrations': scoreVisibilityIntegrations(signals),
  };

  const score = Object.values(dimensions).reduce((a, b) => a + b.pts, 0);
  const level = levelFor(score);

  const anti_patterns_flagged: AntiPatternFlag[] = [];
  // Invisible product if no agent surface at all
  const cap = dimensions['agent-capabilities'];
  if (cap && cap.pts === 0) {
    anti_patterns_flagged.push({
      slug: 'invisible-product',
      name: 'The Invisible Product',
      evidence: 'No MCP Server Card, no CLI/SDK reference, no agent capability surfaces detected.',
    });
  }
  // Agents without rules — agent surfaces exist but no AGENTS.md / well-known/agent-rules
  const surfaces = signals.signals.surfaces;
  const hasAgentMd =
    surfaces['agents_md']?.ok || surfaces['well_known_agent_rules']?.ok;
  if (cap && cap.pts > 0 && !hasAgentMd) {
    anti_patterns_flagged.push({
      slug: 'agents-without-rules',
      name: 'Agents Without Rules',
      evidence: 'Agent capabilities advertised but no /AGENTS.md or /.well-known/agent-rules.',
    });
  }

  const top_moves = computeWebsiteTopMoves(dimensions);

  return {
    score,
    level,
    level_name: LEVEL_NAMES[level],
    dimensions,
    anti_patterns_flagged,
    top_moves,
    probe_signals: signals,
  };
}

function scoreWebDiscoverability(signals: WebsiteSignals): PrincipleScore {
  const max = 25;
  let pts = 0;
  const notes: string[] = [];
  const surfaces = signals.signals.surfaces;
  const robots = signals.signals.robots_analysis;
  if (robots && robots.address_count > 0) {
    pts += 5;
    notes.push(`robots.txt addresses ${robots.address_count} AI agents: ${robots.ai_agents_addressed.join(', ')}`);
  } else if (surfaces['robots_txt']?.ok) {
    notes.push('robots.txt exists but does not address AI agents specifically');
  } else {
    notes.push('No robots.txt');
  }
  if (surfaces['llms_txt']?.ok || surfaces['llms_full_txt']?.ok) {
    pts += 10;
    notes.push('/llms.txt published');
  } else {
    notes.push('No /llms.txt');
  }
  if (surfaces['agents_md']?.ok || surfaces['well_known_agent_rules']?.ok) {
    pts += 10;
    notes.push('/AGENTS.md or /.well-known/agent-rules published');
  } else {
    notes.push('No /AGENTS.md or /.well-known/agent-rules');
  }
  return { pts: Math.min(pts, max), max, status: statusFor(pts, max), notes };
}

function scoreContentAccessibility(signals: WebsiteSignals): PrincipleScore {
  const max = 20;
  let pts = 0;
  const notes: string[] = [];
  if (signals.signals.markdown_negotiation.served_markdown) {
    pts += 10;
    notes.push('Server responds to text/markdown content negotiation');
  } else {
    notes.push('No markdown content negotiation');
  }
  if (signals.signals.surfaces['sitemap']?.ok) {
    pts += 5;
    notes.push('sitemap.xml present');
  } else {
    notes.push('No sitemap.xml');
  }
  const openapiSurfaces = ['openapi_root', 'openapi_v1', 'openapi_api'].some(
    (k) => signals.signals.surfaces[k]?.ok,
  );
  if (openapiSurfaces) {
    pts += 5;
    notes.push('OpenAPI surface discoverable');
  } else {
    notes.push('No discoverable OpenAPI surface');
  }
  return { pts: Math.min(pts, max), max, status: statusFor(pts, max), notes };
}

function scoreBotAccessControl(signals: WebsiteSignals): PrincipleScore {
  const max = 15;
  let pts = 0;
  const notes: string[] = [];
  const robots = signals.signals.robots_analysis;
  if (robots) {
    if (robots.address_count > 0 && !robots.blanket_disallow) {
      pts += 10;
      notes.push('Per-bot allow/deny posture (no blanket disallow)');
    } else if (robots.address_count > 0) {
      pts += 5;
      notes.push('Addresses AI agents but uses blanket disallow');
    }
    if (robots.address_count >= 3) {
      pts += 5;
      notes.push(`Distinct posture for ${robots.address_count} bots — granular control`);
    }
  } else {
    notes.push('No robots.txt analysis available');
  }
  return { pts: Math.min(pts, max), max, status: statusFor(pts, max), notes };
}

function scoreAgentCapabilities(signals: WebsiteSignals): PrincipleScore {
  const max = 30;
  let pts = 0;
  const notes: string[] = [];
  const surfaces = signals.signals.surfaces;
  if (surfaces['well_known_mcp']?.ok || surfaces['well_known_mcp_json']?.ok) {
    pts += 15;
    const variant = surfaces['well_known_mcp_json']?.ok
      ? '/.well-known/mcp-server-card.json'
      : '/.well-known/mcp-server-card';
    notes.push(`MCP Server Card published at ${variant}`);
  } else {
    notes.push('No MCP Server Card');
  }
  const homepage = signals.signals.homepage_analysis;
  if (homepage) {
    if (homepage.mentions_mcp || homepage.mentions_cli || homepage.mentions_sdk) {
      pts += 10;
      const which: string[] = [];
      if (homepage.mentions_mcp) which.push('MCP');
      if (homepage.mentions_cli) which.push('CLI');
      if (homepage.mentions_sdk) which.push('SDK');
      notes.push(`Homepage references agent surfaces: ${which.join(', ')}`);
    } else {
      notes.push('Homepage does not reference MCP / CLI / SDK');
    }
  }
  if (surfaces['well_known_oauth']?.ok || surfaces['well_known_ai_plugin']?.ok) {
    pts += 5;
    notes.push('OAuth / AI-plugin auth-server discovery present');
  } else {
    notes.push('No OAuth-with-PKCE or ai-plugin discovery');
  }
  return { pts: Math.min(pts, max), max, status: statusFor(pts, max), notes };
}

function scoreVisibilityIntegrations(signals: WebsiteSignals): PrincipleScore {
  const max = 10;
  let pts = 0;
  const notes: string[] = [];
  const homepage = signals.signals.homepage_analysis;
  if (homepage) {
    const mentionsAny = homepage.mentions_mcp || homepage.mentions_npx || homepage.mentions_cli;
    if (mentionsAny) {
      pts += 10;
      notes.push('Homepage promotes agent install / MCP / CLI alongside human onboarding');
    } else {
      notes.push('Homepage hides agent integrations from human-onboarding flow');
    }
  } else {
    notes.push('Homepage body unavailable');
  }
  return { pts, max, status: statusFor(pts, max), notes };
}

function computeWebsiteTopMoves(dimensions: Record<string, PrincipleScore>): TopMove[] {
  const gaps: Array<{ slug: string; gap: number; action: string }> = [];
  if (dimensions['discoverability']?.pts !== dimensions['discoverability']?.max) {
    gaps.push({
      slug: 'discoverability',
      gap: (dimensions['discoverability']?.max ?? 0) - (dimensions['discoverability']?.pts ?? 0),
      action:
        'Publish /llms.txt and /AGENTS.md at the site root. Update robots.txt to address GPTBot, ClaudeBot, anthropic-ai, Google-Extended, PerplexityBot, CCBot explicitly.',
    });
  }
  if (dimensions['agent-capabilities']?.pts !== dimensions['agent-capabilities']?.max) {
    gaps.push({
      slug: 'agent-capabilities',
      gap: (dimensions['agent-capabilities']?.max ?? 0) - (dimensions['agent-capabilities']?.pts ?? 0),
      action:
        'Ship an MCP server (verb-first tools, Zod params), publish /.well-known/mcp-server-card, and reference it from the homepage hero.',
    });
  }
  if (dimensions['content-accessibility']?.pts !== dimensions['content-accessibility']?.max) {
    gaps.push({
      slug: 'content-accessibility',
      gap: (dimensions['content-accessibility']?.max ?? 0) - (dimensions['content-accessibility']?.pts ?? 0),
      action:
        'Serve text/markdown when the Accept header asks for it. Publish sitemap.xml and an OpenAPI document at /openapi.json.',
    });
  }
  if (dimensions['bot-access-control']?.pts !== dimensions['bot-access-control']?.max) {
    gaps.push({
      slug: 'bot-access-control',
      gap: (dimensions['bot-access-control']?.max ?? 0) - (dimensions['bot-access-control']?.pts ?? 0),
      action:
        'Replace any blanket Disallow with per-bot rules. Cloudflare Content Signals or equivalent declarative AI-policy.',
    });
  }
  if (
    dimensions['visibility-of-agent-integrations']?.pts !==
    dimensions['visibility-of-agent-integrations']?.max
  ) {
    gaps.push({
      slug: 'visibility-of-agent-integrations',
      gap:
        (dimensions['visibility-of-agent-integrations']?.max ?? 0) -
        (dimensions['visibility-of-agent-integrations']?.pts ?? 0),
      action:
        'Add an "Install our MCP server" or "Use our CLI" call-out next to the human-onboarding hero, not buried in /docs.',
    });
  }

  gaps.sort((a, b) => b.gap - a.gap);
  return gaps.slice(0, 3).map((g, i) => ({
    rank: i + 1,
    principle: g.slug as TopMove['principle'],
    gap_pts: g.gap,
    action: g.action,
  }));
}
