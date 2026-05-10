// Website probe — Worker-safe HTTP-only port of the stdio MCP's website mode.
//
// Codebase mode is intentionally NOT included here. Codebase scoring requires
// node:fs and node:child_process; those don't run in V8 isolates. When an agent
// calls score_codebase against this Worker, the server returns a structured
// error directing it to the npx version (`npx -y @capitalthought/agentsfirst-mcp`).
//
// Pure signal-gathering. Scoring lives in score.ts.

const FETCH_TIMEOUT_MS = 10_000;

// ─── Types ────────────────────────────────────────────────────────────────────
//
// CodebaseSignals is exported as a type alias for cross-compat with score.ts
// (which still has the scoreCodebase function defined for shared rubric logic).
// The Worker will never produce a CodebaseSignals payload — it returns the
// "use the npx version" error before reaching the scorer.

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

// CodebaseSignals — kept here as a type-only re-export shim so score.ts still
// type-checks. The Worker never instantiates one of these.
export interface CodebaseSignals {
  mode: 'codebase';
  target: string;
  project_name: string;
  timestamp: string;
  signals: {
    agents_md: { exists: boolean; path?: string; size_bytes?: number; line_count?: number;
      sections?: { permissions: boolean; sequence: boolean; identifiers: boolean; errors: boolean;
        visible_outputs: boolean; anti_patterns: boolean };
      llm_gen_signals?: { has_project_structure: boolean; has_commands: boolean;
        has_code_style: boolean; has_testing: boolean; template_match_count: number } };
    mcp_server: { detected: boolean; indicators: { package_json_dep?: string;
      matching_files?: Record<string, number>; tool_names_sampled?: string[];
      verb_first_ratio?: number; uses_zod_for_params?: boolean;
      uses_session_state?: number;
      has_overview_tool?: boolean; overview_tool_name?: string } };
    cli: { detected: boolean; indicators: { package_json_bin?: string[]; pyproject_scripts?: boolean;
      cargo_bins?: boolean; bin_dir_entries?: string[]; argv_handling?: boolean } };
    typed_sdk: { detected: boolean; indicators: { declared_types_entry?: string;
      has_exports_field?: boolean; dts_files?: number } };
    prep_gate: { detected: boolean; indicators: { prep_files?: string[];
      prep_tool_registrations?: number; prep_function_exported?: boolean } };
    typed_state: { detected: boolean; has_migrations: boolean;
      indicators: { zod_imports: number; json_schema_files: number; migration_files: number;
        prisma: boolean; drizzle: number; typescript_strict: boolean } };
    visible_outputs: { detected: boolean; indicators: { slack_imports: number; postmark: number;
      resend: number; email_general: number; asana: number; linear: number; audit_log_files: number;
      todo_ship_markers: number } };
    multi_model: { detected: boolean; indicators: { anthropic: number; openai: number;
      google_genai: number; xai: number; distinct_llm_sdks: string[]; consensus_pattern: number } };
    perspective_dispatch: { detected: boolean; indicators: { persona_files?: number;
      reviewer_pattern: number } };
    autonomous_recovery: { detected: boolean; has_escalation: boolean;
      indicators: { retry_helper: number; recovery_files: number; escalation_pattern: number } };
    tool_count: { mcp_register_tool_calls: number; cli_bin_entries: number; estimated_total: number };
    discoverability: { indicators: { package_name?: string | null; has_repository_field?: boolean;
      has_homepage?: boolean; publishable?: boolean; readme_mentions_mcp?: boolean;
      readme_mentions_install?: boolean; readme_mentions_agents_first?: boolean } };
    staleness: { agent_file_ages: Record<string, { mtime: string; days_ago: number }> };
  };
  derived: {
    has_any_agent_interface: boolean;
    god_server_risk: 'ok' | 'warn' | 'fail';
    agents_without_rules_risk: boolean;
  };
}

// ─── Probe ────────────────────────────────────────────────────────────────────

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
    ['agents_json', `${origin}/agents.json`],
    ['sitemap', `${origin}/sitemap.xml`],
    ['sitemap_index', `${origin}/sitemap-index.xml`],
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
    const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'agentsfirst-mcp-worker/0.1 (+https://agentsfirst.dev/mcp)' },
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
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/markdown,text/plain;q=0.5',
        'User-Agent': 'agentsfirst-mcp-worker/0.1 (+https://agentsfirst.dev/mcp)',
      },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    clearTimeout(timeout);
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
