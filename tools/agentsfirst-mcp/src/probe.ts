// Agents First signal gatherer — ported from ~/.claude/skills/agentsfirst/probe.mjs.
//
// Two modes:
//   - probeCodebase(path)  → filesystem probes for the 8 principles
//   - probeWebsite(url)    → HTTP probes for agent-discoverable surfaces
//
// Pure signal-gathering. Scoring lives in score.ts.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// ─── Codebase types ────────────────────────────────────────────────────────────

export interface AgentsMdSignals {
  exists: boolean;
  path?: string;
  size_bytes?: number;
  line_count?: number;
  sections?: {
    permissions: boolean;
    sequence: boolean;
    identifiers: boolean;
    errors: boolean;
    visible_outputs: boolean;
    anti_patterns: boolean;
  };
  /** Heuristic markers of LLM-generated AGENTS.md (added rubric v0.3.0).
   *  Common LLM scaffolds emit `## Project Structure / ## Commands /
   *  ## Code Style / ## Testing`. 3+ of these in a >1500-token file
   *  is a strong "auto-generated" signal — see the Token Dump anti-pattern. */
  llm_gen_signals?: {
    has_project_structure: boolean;
    has_commands: boolean;
    has_code_style: boolean;
    has_testing: boolean;
    template_match_count: number;
  };
}

export interface McpServerSignals {
  detected: boolean;
  indicators: {
    package_json_dep?: string;
    matching_files?: Record<string, number>;
    tool_names_sampled?: string[];
    verb_first_ratio?: number;
    uses_zod_for_params?: boolean;
    /** Per SEP-2567 (merged 2026-05-07): MCP servers should not require session state.
     *  Counts grep hits for the deprecated session APIs in source files. */
    uses_session_state?: number;
  };
}

export interface CliSignals {
  detected: boolean;
  indicators: {
    package_json_bin?: string[];
    pyproject_scripts?: boolean;
    cargo_bins?: boolean;
    bin_dir_entries?: string[];
    argv_handling?: boolean;
  };
}

export interface TypedSdkSignals {
  detected: boolean;
  indicators: {
    declared_types_entry?: string;
    has_exports_field?: boolean;
    dts_files?: number;
  };
}

export interface PrepGateSignals {
  detected: boolean;
  indicators: {
    prep_files?: string[];
    prep_tool_registrations?: number;
    prep_function_exported?: boolean;
  };
}

export interface TypedStateSignals {
  detected: boolean;
  has_migrations: boolean;
  indicators: {
    zod_imports: number;
    json_schema_files: number;
    migration_files: number;
    prisma: boolean;
    drizzle: number;
    typescript_strict: boolean;
  };
}

export interface VisibleOutputSignals {
  detected: boolean;
  indicators: {
    slack_imports: number;
    postmark: number;
    resend: number;
    email_general: number;
    asana: number;
    linear: number;
    audit_log_files: number;
    todo_ship_markers: number;
  };
}

export interface MultiModelSignals {
  detected: boolean;
  indicators: {
    anthropic: number;
    openai: number;
    google_genai: number;
    xai: number;
    distinct_llm_sdks: string[];
    consensus_pattern: number;
  };
}

export interface PerspectiveDispatchSignals {
  detected: boolean;
  indicators: {
    persona_files?: number;
    reviewer_pattern: number;
  };
}

export interface RecoverySignals {
  detected: boolean;
  has_escalation: boolean;
  indicators: {
    retry_helper: number;
    recovery_files: number;
    escalation_pattern: number;
  };
}

export interface ToolCountSignals {
  mcp_register_tool_calls: number;
  cli_bin_entries: number;
  estimated_total: number;
}

export interface DiscoverabilitySignals {
  indicators: {
    package_name?: string | null;
    has_repository_field?: boolean;
    has_homepage?: boolean;
    publishable?: boolean;
    readme_mentions_mcp?: boolean;
    readme_mentions_install?: boolean;
    readme_mentions_agents_first?: boolean;
  };
}

export interface StalenessSignals {
  agent_file_ages: Record<string, { mtime: string; days_ago: number }>;
}

export interface CodebaseSignals {
  mode: 'codebase';
  target: string;
  project_name: string;
  timestamp: string;
  signals: {
    agents_md: AgentsMdSignals;
    mcp_server: McpServerSignals;
    cli: CliSignals;
    typed_sdk: TypedSdkSignals;
    prep_gate: PrepGateSignals;
    typed_state: TypedStateSignals;
    visible_outputs: VisibleOutputSignals;
    multi_model: MultiModelSignals;
    perspective_dispatch: PerspectiveDispatchSignals;
    autonomous_recovery: RecoverySignals;
    tool_count: ToolCountSignals;
    discoverability: DiscoverabilitySignals;
    staleness: StalenessSignals;
  };
  derived: {
    has_any_agent_interface: boolean;
    god_server_risk: 'ok' | 'warn' | 'fail';
    agents_without_rules_risk: boolean;
  };
}

// ─── Website types ────────────────────────────────────────────────────────────

export interface SurfaceProbe {
  url: string;
  status?: number;
  ok?: boolean;
  content_type?: string | null;
  length?: number;
  body?: string;
  truncated?: boolean;
  error?: string;
}

export interface WebsiteSignals {
  mode: 'website';
  target: string;
  timestamp: string;
  signals: {
    surfaces: Record<string, SurfaceProbe>;
    robots_analysis?: {
      ai_agents_addressed: string[];
      address_count: number;
      blanket_disallow: boolean;
      content_signal_directives?: Record<string, string>;
    };
    markdown_negotiation: {
      requested?: string;
      content_type_returned?: string;
      served_markdown?: boolean;
      status?: number;
      error?: string;
    };
    homepage: SurfaceProbe;
    homepage_analysis?: {
      mentions_mcp: boolean;
      mentions_npx: boolean;
      mentions_cli: boolean;
      mentions_sdk: boolean;
      mentions_api: boolean;
      mentions_oauth: boolean;
      mentions_agents_first: boolean;
    };
  };
}

// ─── Codebase mode ────────────────────────────────────────────────────────────

export async function probeCodebase(rootArg: string): Promise<CodebaseSignals> {
  const root = path.resolve(rootArg);
  if (!existsSync(root)) {
    throw new Error(`Path not found: ${root}`);
  }

  const out: CodebaseSignals = {
    mode: 'codebase',
    target: root,
    project_name: path.basename(root),
    timestamp: new Date().toISOString(),
    signals: {
      agents_md: await probeAgentsMd(root),
      mcp_server: await probeMcpServer(root),
      cli: await probeCli(root),
      typed_sdk: await probeTypedSdk(root),
      prep_gate: await probePrepGate(root),
      typed_state: await probeTypedState(root),
      visible_outputs: await probeVisibleOutputs(root),
      multi_model: await probeMultiModel(root),
      perspective_dispatch: await probePerspectiveDispatch(root),
      autonomous_recovery: await probeRecovery(root),
      tool_count: await countTools(root),
      discoverability: await probeDiscoverability(root),
      staleness: probeStaleness(root),
    },
    derived: {
      has_any_agent_interface: false,
      god_server_risk: 'ok',
      agents_without_rules_risk: false,
    },
  };

  out.derived.has_any_agent_interface =
    out.signals.mcp_server.detected ||
    out.signals.cli.detected ||
    out.signals.typed_sdk.detected;
  const total = out.signals.tool_count.estimated_total;
  out.derived.god_server_risk = total > 100 ? 'fail' : total > 30 ? 'warn' : 'ok';
  out.derived.agents_without_rules_risk =
    (out.signals.mcp_server.detected || out.signals.cli.detected) &&
    !out.signals.agents_md.exists;

  return out;
}

async function probeAgentsMd(root: string): Promise<AgentsMdSignals> {
  const candidates = ['AGENTS.md', '.agents.md', 'docs/AGENTS.md'];
  for (const rel of candidates) {
    const full = path.join(root, rel);
    if (existsSync(full)) {
      const content = readFileSync(full, 'utf8');
      const lower = content.toLowerCase();
      const llmGen = {
        has_project_structure: /## *project[- ]?structure\b/i.test(content),
        has_commands: /## *(common )?commands?\b/i.test(content),
        has_code_style: /## *code[- ]?style\b/i.test(content),
        has_testing: /## *testing\b|## *running tests\b/i.test(content),
        template_match_count: 0,
      };
      llmGen.template_match_count = [
        llmGen.has_project_structure,
        llmGen.has_commands,
        llmGen.has_code_style,
        llmGen.has_testing,
      ].filter(Boolean).length;
      return {
        exists: true,
        path: rel,
        size_bytes: content.length,
        line_count: content.split('\n').length,
        sections: {
          permissions: /## *permissions?\b/i.test(content),
          sequence:
            /## *sequence|## *required prep|## *tool[- ]?call (order|sequence)/i.test(content),
          identifiers: /## *identif|## *naming|never invent ids/i.test(lower),
          errors: /## *errors?\b/i.test(content),
          visible_outputs: /## *visible outputs?|human[- ]?readable/i.test(lower),
          anti_patterns: /## *anti[- ]?patterns?|lazy wrapper|god server/i.test(lower),
        },
        llm_gen_signals: llmGen,
      };
    }
  }
  return { exists: false };
}

async function probeMcpServer(root: string): Promise<McpServerSignals> {
  const out: McpServerSignals = { detected: false, indicators: {} };
  const pkgJson = await readJsonIfExists(path.join(root, 'package.json'));
  if (pkgJson) {
    const rawDeps = (pkgJson['dependencies'] ?? {}) as Record<string, unknown>;
    const rawDevDeps = (pkgJson['devDependencies'] ?? {}) as Record<string, unknown>;
    const deps: Record<string, unknown> = { ...rawDeps, ...rawDevDeps };
    const mcpDep = deps['@modelcontextprotocol/sdk'];
    if (mcpDep !== undefined) {
      out.detected = true;
      out.indicators.package_json_dep = String(mcpDep);
    }
  }
  const grepResults = grepMany(root, [
    '@modelcontextprotocol/sdk',
    'McpServer',
    'registerTool',
    'setRequestHandler',
  ]);
  out.indicators.matching_files = Object.fromEntries(
    Object.entries(grepResults).map(([term, files]) => [term, files.length]),
  );
  if (
    (grepResults['McpServer']?.length ?? 0) > 0 ||
    (grepResults['registerTool']?.length ?? 0) > 0 ||
    (grepResults['@modelcontextprotocol/sdk']?.length ?? 0) > 0
  ) {
    out.detected = true;
  }
  const verbFirst = grepRegex(root, /registerTool\(['"]([a-z_]+)['"]/g);
  if (verbFirst.length) {
    const verbCount = verbFirst.filter((name) =>
      /^(create|list|get|update|delete|set|send|fetch|run|search|dispatch|publish|subscribe|register|score|probe|add|remove|verify|check|prep)/.test(
        name,
      ),
    ).length;
    out.indicators.tool_names_sampled = verbFirst.slice(0, 10);
    out.indicators.verb_first_ratio = verbFirst.length ? verbCount / verbFirst.length : 0;
  }
  out.indicators.uses_zod_for_params = grepCount(root, /from ['"]zod['"]/) > 0;
  // SEP-2567 (sessionless MCP): count references to deprecated session APIs.
  //
  // Strict patterns — designed to match real *usage*, not strings inside
  // documentation, rationale comments, or regex literals (such as the
  // ones in this very probe). Three independent signals:
  //
  //   1. HTTP header writes — server-side `setHeader` or `headers.set`
  //      manipulation of `Mcp-Session-Id`. Excludes CORS allow-headers
  //      lists (which advertise support but don't actually USE state).
  //   2. JSON-RPC method strings — quoted `session/create` and
  //      `session/destroy` literals (real RPC dispatch, not prose).
  //   3. Variable assignment — `sessionId = <value>` (actual storage),
  //      not type declarations or regex sources.
  //
  // False positives the previous v1 pattern caught and this one doesn't:
  //   - `notes.push('... session/create ...')` (rationale strings)
  //   - `// Mcp-Session-Id header / session/create ...` (comments)
  //   - `grepCount(root, /Mcp-Session-Id|session\/create/)` (regex literal)
  //   - `'Content-Type, Authorization, Mcp-Session-Id'` (CORS advertisement)
  out.indicators.uses_session_state =
    grepCount(root, /(?:setHeader|headers?\.(?:set|append))\([^)]*Mcp-Session-Id/i) +
    grepCount(root, /['"]session\/(?:create|destroy)['"]/) +
    grepCount(root, /\bsessionId\s*=\s*[a-zA-Z_$"'`]/);
  return out;
}

async function probeCli(root: string): Promise<CliSignals> {
  const out: CliSignals = { detected: false, indicators: {} };
  const pkgJson = await readJsonIfExists(path.join(root, 'package.json'));
  const bin = pkgJson?.['bin'];
  if (bin) {
    out.detected = true;
    out.indicators.package_json_bin =
      typeof bin === 'string'
        ? [bin]
        : Object.keys(bin as Record<string, unknown>);
  }
  const pyproject = await readTextIfExists(path.join(root, 'pyproject.toml'));
  if (pyproject && /\[project\.scripts\]/.test(pyproject)) {
    out.detected = true;
    out.indicators.pyproject_scripts = true;
  }
  const cargo = await readTextIfExists(path.join(root, 'Cargo.toml'));
  if (cargo && /\[\[bin\]\]/.test(cargo)) {
    out.detected = true;
    out.indicators.cargo_bins = true;
  }
  const binDir = path.join(root, 'bin');
  if (existsSync(binDir)) {
    try {
      const entries = await readdir(binDir);
      if (entries.length > 0) {
        out.detected = true;
        out.indicators.bin_dir_entries = entries.slice(0, 10);
      }
    } catch {
      /* ignore */
    }
  }
  if (grepCount(root, /process\.argv|argparse|click\.command|clap::|getopt/) > 0) {
    out.indicators.argv_handling = true;
  }
  return out;
}

async function probeTypedSdk(root: string): Promise<TypedSdkSignals> {
  const out: TypedSdkSignals = { detected: false, indicators: {} };
  const pkgJson = await readJsonIfExists(path.join(root, 'package.json'));
  if (pkgJson) {
    const types = pkgJson['types'];
    const typings = pkgJson['typings'];
    if (typeof types === 'string' || typeof typings === 'string') {
      out.detected = true;
      out.indicators.declared_types_entry =
        typeof types === 'string' ? types : (typings as string);
    }
    if (pkgJson['exports']) {
      out.indicators.has_exports_field = true;
    }
  }
  const distDts = grepCount(root, /\.d\.ts$/);
  if (distDts > 0) {
    out.indicators.dts_files = distDts;
  }
  return out;
}

async function probePrepGate(root: string): Promise<PrepGateSignals> {
  const out: PrepGateSignals = { detected: false, indicators: {} };
  const prepFiles = findFiles(root, /^(prep|preflight|preflightcheck|agentprep)\.(ts|js|mjs|sh|py)$/i);
  if (prepFiles.length) {
    out.detected = true;
    out.indicators.prep_files = prepFiles.slice(0, 5);
  }
  const projectName = path.basename(root).toLowerCase();
  const prepToolPattern = new RegExp(
    `['"\`](${projectName}_prep|${projectName.replace(/-/g, '_')}_prep|[a-z_]+_prep)['"\`]`,
  );
  const prepToolHits = grepCount(root, prepToolPattern);
  if (prepToolHits > 0) {
    out.detected = true;
    out.indicators.prep_tool_registrations = prepToolHits;
  }
  if (grepCount(root, /export (async )?function (runPrep|preflightCheck|agentPrep)/) > 0) {
    out.detected = true;
    out.indicators.prep_function_exported = true;
  }
  return out;
}

async function probeTypedState(root: string): Promise<TypedStateSignals> {
  const indicators = {
    zod_imports: grepCount(root, /from ['"]zod['"]/),
    json_schema_files: findFiles(root, /\.schema\.(json|ts|js)$/).length,
    migration_files: findFiles(root, /(\d{3,}|\d{14})[-_].+\.(sql|ts|js)$/).length,
    prisma: existsSync(path.join(root, 'prisma/schema.prisma')),
    drizzle: grepCount(root, /from ['"]drizzle-orm/),
    typescript_strict: await checkTsStrict(root),
  };
  return {
    detected:
      indicators.zod_imports > 0 ||
      indicators.json_schema_files > 0 ||
      indicators.prisma ||
      indicators.drizzle > 0,
    has_migrations: indicators.migration_files > 0 || indicators.prisma,
    indicators,
  };
}

async function probeVisibleOutputs(root: string): Promise<VisibleOutputSignals> {
  const indicators = {
    slack_imports: grepCount(root, /['"]@slack\/|slackapi/),
    postmark: grepCount(root, /['"]postmark['"]|POSTMARK_/),
    resend: grepCount(root, /['"]resend['"]/),
    email_general: grepCount(root, /sendmail|nodemailer|@sendgrid/),
    asana: grepCount(root, /asana/i),
    linear: grepCount(root, /['"]@linear\/sdk['"]|linearapp/),
    audit_log_files: findFiles(root, /audit[-_]?log\./).length,
    todo_ship_markers: grepCount(root, /TODO:.*ship to (slack|email|task|asana|linear)/i),
  };
  return {
    detected:
      indicators.slack_imports > 0 ||
      indicators.postmark > 0 ||
      indicators.resend > 0 ||
      indicators.email_general > 0 ||
      indicators.linear > 0 ||
      indicators.audit_log_files > 0,
    indicators,
  };
}

async function probeMultiModel(root: string): Promise<MultiModelSignals> {
  const counts = {
    anthropic: grepCount(root, /['"]@anthropic-ai\/sdk['"]/),
    openai: grepCount(root, /['"]openai['"]/),
    google_genai: grepCount(root, /['"]@google\/genai|@google\/generative-ai/),
    xai: grepCount(root, /['"]grok|api\.x\.ai/),
  };
  const distinctSdks = (['anthropic', 'openai', 'google_genai', 'xai'] as const).filter(
    (k) => counts[k] > 0,
  );
  const consensusPattern = grepCount(root, /consensus|multipov|multi[-_]?model/i);
  return {
    detected: distinctSdks.length >= 2 && consensusPattern > 0,
    indicators: {
      ...counts,
      distinct_llm_sdks: [...distinctSdks],
      consensus_pattern: consensusPattern,
    },
  };
}

async function probePerspectiveDispatch(root: string): Promise<PerspectiveDispatchSignals> {
  const indicators: PerspectiveDispatchSignals['indicators'] = {
    reviewer_pattern: grepCount(root, /reviewer|persona|perspective[-_]?dispatch/i),
  };
  const agentsDir = path.join(root, 'agents');
  if (existsSync(agentsDir)) {
    try {
      const entries = await readdir(agentsDir);
      const personaFiles = entries.filter((e) => /\.(md|yml|json)$/.test(e));
      indicators.persona_files = personaFiles.length;
    } catch {
      /* ignore */
    }
  }
  return {
    detected: (indicators.persona_files ?? 0) > 1 || indicators.reviewer_pattern > 5,
    indicators,
  };
}

async function probeRecovery(root: string): Promise<RecoverySignals> {
  const indicators = {
    retry_helper: grepCount(root, /\bwithRetry\b|retryWithBackoff|exponentialBackoff/),
    recovery_files: findFiles(root, /^(recovery|retry|resilience)\.(ts|js|mjs|py)$/i).length,
    escalation_pattern: grepCount(root, /escalate\(|manual_action|self[-_]?heal/i),
  };
  return {
    detected: indicators.retry_helper > 0 || indicators.recovery_files > 0,
    has_escalation: indicators.escalation_pattern > 0,
    indicators,
  };
}

async function countTools(root: string): Promise<ToolCountSignals> {
  const mcp = grepCount(root, /\bregisterTool\(/);
  const pkgJson = await readJsonIfExists(path.join(root, 'package.json'));
  const bin = pkgJson?.['bin'];
  const bins = bin
    ? typeof bin === 'string'
      ? 1
      : Object.keys(bin as Record<string, unknown>).length
    : 0;
  return {
    mcp_register_tool_calls: mcp,
    cli_bin_entries: bins,
    estimated_total: Math.max(mcp, bins),
  };
}

async function probeDiscoverability(root: string): Promise<DiscoverabilitySignals> {
  const indicators: DiscoverabilitySignals['indicators'] = {};
  const pkgJson = await readJsonIfExists(path.join(root, 'package.json'));
  if (pkgJson) {
    const name = pkgJson['name'];
    indicators.package_name = typeof name === 'string' ? name : null;
    indicators.has_repository_field = !!pkgJson['repository'];
    indicators.has_homepage = !!pkgJson['homepage'];
    indicators.publishable = pkgJson['private'] !== true && typeof name === 'string';
  }
  const readme = await readTextIfExists(path.join(root, 'README.md'));
  if (readme) {
    indicators.readme_mentions_mcp = /\bmcp\b|model context protocol/i.test(readme);
    indicators.readme_mentions_install =
      /(npm install|npx|pip install|cargo install|brew install)/i.test(readme);
    indicators.readme_mentions_agents_first = /agents?[ -]?first|agentsfirst\.dev/i.test(readme);
  }
  return { indicators };
}

function probeStaleness(root: string): StalenessSignals {
  const tracked = ['AGENTS.md', 'src/server.ts', 'src/prep.ts', 'bin/index.js'];
  const ages: StalenessSignals['agent_file_ages'] = {};
  for (const rel of tracked) {
    const full = path.join(root, rel);
    if (existsSync(full)) {
      const s = statSync(full);
      ages[rel] = {
        mtime: s.mtime.toISOString(),
        days_ago: Math.floor((Date.now() - s.mtime.getTime()) / 86_400_000),
      };
    }
  }
  return { agent_file_ages: ages };
}

// ─── Website mode ─────────────────────────────────────────────────────────────

export async function probeWebsite(url: string): Promise<WebsiteSignals> {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(`URL must start with http:// or https:// — got: ${url}`);
  }
  const origin = new URL(url).origin;
  const probes: Array<[string, string]> = [
    ['robots_txt', `${origin}/robots.txt`],
    ['llms_txt', `${origin}/llms.txt`],
    ['llms_full_txt', `${origin}/llms-full.txt`],
    ['agents_md', `${origin}/AGENTS.md`],
    ['well_known_agent_rules', `${origin}/.well-known/agent-rules`],
    ['well_known_ai_plugin', `${origin}/.well-known/ai-plugin.json`],
    ['well_known_oauth', `${origin}/.well-known/oauth-authorization-server`],
    ['well_known_mcp', `${origin}/.well-known/mcp-server-card`],
    ['well_known_mcp_json', `${origin}/.well-known/mcp-server-card.json`],
    ['sitemap', `${origin}/sitemap.xml`],
    ['openapi_root', `${origin}/openapi.json`],
    ['openapi_v1', `${origin}/v1/openapi.json`],
    ['openapi_api', `${origin}/api/openapi.json`],
  ];

  const surfaces: Record<string, SurfaceProbe> = {};
  await Promise.all(
    probes.map(async ([key, probeUrl]) => {
      surfaces[key] = await fetchSurface(probeUrl);
    }),
  );

  const out: WebsiteSignals = {
    mode: 'website',
    target: url,
    timestamp: new Date().toISOString(),
    signals: {
      surfaces,
      markdown_negotiation: await probeMarkdownNegotiation(url),
      homepage: await fetchSurface(url),
    },
  };

  const robotsBody = surfaces['robots_txt']?.body ?? '';
  if (robotsBody) {
    const aiAgents = [
      'GPTBot',
      'anthropic-ai',
      'ClaudeBot',
      'Claude-Web',
      'Google-Extended',
      'PerplexityBot',
      'Bytespider',
      'CCBot',
      'Omgilibot',
      'cohere-ai',
    ];
    const declared = aiAgents.filter((ua) =>
      new RegExp(`User-agent:\\s*${ua}`, 'i').test(robotsBody),
    );
    // Content-Signal directive (Cloudflare's emerging AI-policy convention).
    // Format: `Content-Signal: ai-train=yes, search=yes, ai-input=yes`
    const contentSignalLines = robotsBody.match(/^Content-Signal:\s*(.+)$/gim) ?? [];
    const directives: Record<string, string> = {};
    for (const line of contentSignalLines) {
      const m = line.match(/^Content-Signal:\s*(.+)$/i);
      const captured = m?.[1];
      if (!captured) continue;
      for (const pair of captured.split(',')) {
        const [k, v] = pair.split('=').map((s) => s.trim().toLowerCase());
        if (k && v) directives[k] = v;
      }
    }

    out.signals.robots_analysis = {
      ai_agents_addressed: declared,
      address_count: declared.length,
      blanket_disallow: /User-agent:\s*\*[\s\S]*?Disallow:\s*\//i.test(robotsBody),
      ...(Object.keys(directives).length > 0 && { content_signal_directives: directives }),
    };
  }

  const homepageBody = out.signals.homepage?.body;
  if (homepageBody) {
    out.signals.homepage_analysis = {
      mentions_mcp: /\b(mcp|model context protocol)\b/i.test(homepageBody),
      mentions_npx: /\bnpx\b/.test(homepageBody),
      mentions_cli: /\b(cli|command[- ]?line)\b/i.test(homepageBody),
      mentions_sdk: /\bsdk\b/i.test(homepageBody),
      mentions_api: /\bapi\b/i.test(homepageBody),
      mentions_oauth: /oauth/i.test(homepageBody),
      mentions_agents_first: /agents?[ -]?first|agentsfirst\.dev/i.test(homepageBody),
    };
  }

  return out;
}

async function fetchSurface(url: string): Promise<SurfaceProbe> {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'agentsfirst-mcp/0.1 (https://agentsfirst.dev)' },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    clearTimeout(timeout);
    const text = await res.text().catch(() => '');
    return {
      url,
      status: res.status,
      ok: res.ok,
      content_type: res.headers.get('content-type') ?? null,
      length: text.length,
      body: text.length < 50_000 ? text : text.slice(0, 50_000),
      truncated: text.length >= 50_000,
    };
  } catch (e) {
    return { url, error: (e as Error).message };
  }
}

async function probeMarkdownNegotiation(url: string): Promise<WebsiteSignals['signals']['markdown_negotiation']> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/markdown,text/plain;q=0.5',
        'User-Agent': 'agentsfirst-mcp/0.1',
      },
      redirect: 'follow',
    });
    const ct = res.headers.get('content-type') ?? '';
    return {
      requested: 'text/markdown',
      content_type_returned: ct,
      served_markdown: /text\/markdown/i.test(ct),
      status: res.status,
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

async function readJsonIfExists(p: string): Promise<{ [k: string]: unknown } | null> {
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

async function readTextIfExists(p: string): Promise<string | null> {
  if (!existsSync(p)) return null;
  try {
    return await readFile(p, 'utf8');
  } catch {
    return null;
  }
}

const GREP_FLAGS =
  '-rE --no-messages --binary-files=without-match --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=_site --exclude-dir=.next --exclude-dir=coverage --exclude-dir=vendor';

function grepCount(root: string, pattern: RegExp | string): number {
  try {
    const rgArg = pattern instanceof RegExp ? pattern.source : pattern;
    const out = execSync(
      `grep ${GREP_FLAGS} -c -e ${shellEscape(rgArg)} ${shellEscape(root)} 2>/dev/null | awk -F: '{sum+=$NF} END {print sum+0}'`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    return parseInt(out.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

function grepMany(root: string, terms: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const t of terms) {
    try {
      const out = execSync(
        `grep ${GREP_FLAGS} -l -F ${shellEscape(t)} ${shellEscape(root)} 2>/dev/null`,
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      );
      result[t] = out.split('\n').filter(Boolean);
    } catch {
      result[t] = [];
    }
  }
  return result;
}

function grepRegex(root: string, pattern: RegExp): string[] {
  try {
    const out = execSync(
      `grep ${GREP_FLAGS} -hoE -e ${shellEscape(pattern.source)} ${shellEscape(root)} 2>/dev/null`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    const matches: string[] = [];
    for (const line of out.split('\n')) {
      if (!line) continue;
      const re = new RegExp(pattern.source);
      const m = re.exec(line);
      if (m && m[1]) matches.push(m[1]);
    }
    return matches;
  } catch {
    return [];
  }
}

function findFiles(root: string, regex: RegExp): string[] {
  try {
    const out = execSync(
      `find ${shellEscape(root)} -type d \\( -name node_modules -o -name .git -o -name dist -o -name build -o -name _site -o -name .next -o -name coverage -o -name vendor \\) -prune -o -type f -print 2>/dev/null`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 32 * 1024 * 1024 },
    );
    return out.split('\n').filter((p) => p && regex.test(path.basename(p)));
  } catch {
    return [];
  }
}

async function checkTsStrict(root: string): Promise<boolean> {
  const tsconfig = await readJsonIfExists(path.join(root, 'tsconfig.json'));
  const co = (tsconfig?.compilerOptions ?? {}) as { strict?: boolean };
  return co.strict === true;
}

function shellEscape(s: string): string {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}
