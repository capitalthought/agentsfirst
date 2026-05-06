// Worker entry — routes /mcp traffic to the MCP server.
//
// /mcp/health   → JSON healthcheck
// /mcp           → POST: MCP Streamable HTTP transport (JSON-RPC over HTTP)
//                 GET:  human-readable info page
//                 OPTIONS: CORS preflight
// /mcp/*         → 404 with structured error
//
// The route binding in wrangler.toml only sends agentsfirst.dev/mcp* here;
// every other path on agentsfirst.dev continues to flow to GitHub Pages.

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

import { createServer, SERVER_NAME, TOOL_NAMES, VERSION } from './server.js';

const FRAMEWORK_URL = 'https://agentsfirst.dev';
const ENDPOINT_URL = 'https://agentsfirst.dev/mcp';
const SUPPORTED_BY_WORKER = ['agentsfirst_prep', 'score_website', 'get_principle', 'get_anti_pattern'];

interface Env {
  // Reserved for future bindings. None required for v0.1.0.
  [key: string]: unknown;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-Id, Accept',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, Mcp-Protocol-Version',
  'Access-Control-Max-Age': '86400',
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function json(payload: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function notFound(path: string): Response {
  return json(
    {
      error: 'not_found',
      message: `No handler for ${path}. The MCP transport lives at /mcp; the healthcheck at /mcp/health.`,
      endpoint: ENDPOINT_URL,
      supported: ['/mcp', '/mcp/health'],
    },
    404,
  );
}

const INFO_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>agentsfirst-mcp · ${ENDPOINT_URL}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="index,follow">
<style>
  body { font: 16px/1.55 system-ui, -apple-system, sans-serif; max-width: 720px; margin: 4rem auto; padding: 0 1.25rem; color: #111; }
  h1 { font-size: 1.5rem; margin: 0 0 .25rem; }
  .lead { color: #555; margin-top: 0; }
  pre { background: #f5f5f5; padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: 13px; }
  code { background: #f0f0f0; padding: 1px 4px; border-radius: 3px; font-size: 95%; }
  ul { padding-left: 1.25rem; }
  li { margin: .25rem 0; }
  a { color: #0a58ca; }
  .meta { color: #777; font-size: .875rem; margin-top: 2.5rem; border-top: 1px solid #eee; padding-top: 1rem; }
</style>
</head>
<body>
<h1>agentsfirst-mcp</h1>
<p class="lead">Remote MCP server. Score any public website against the <a href="${FRAMEWORK_URL}/principles/">8 Agents First principles</a>. No install required — point your agent runtime at this URL.</p>

<h2>Add this MCP server to your agent</h2>

<p><strong>Claude Code</strong> (<code>~/.claude.json</code> or <code>.claude/mcp.json</code>):</p>
<pre>{
  "mcpServers": {
    "agentsfirst": {
      "type": "http",
      "url": "${ENDPOINT_URL}"
    }
  }
}</pre>

<p><strong>Cursor</strong> (<code>.cursor/mcp.json</code>) — same shape. <strong>Cline / Windsurf / generic clients</strong> — drop the same block into the client's MCP config.</p>

<h2>Tools</h2>
<ul>
  <li><code>agentsfirst_prep</code> — Prep Gate. Call first. Verifies rubric loaded + canonical API reachable.</li>
  <li><code>score_website</code> — HTTP-probes a public URL across 5 dimensions, returns 0–100 score + level + top moves.</li>
  <li><code>get_principle</code> — Returns the canonical definition of one of the 8 principles.</li>
  <li><code>get_anti_pattern</code> — Returns the canonical definition of one of the 7 anti-patterns.</li>
  <li><code>score_codebase</code> — Deferred-to-local. The Worker can't read your filesystem; use <code>npx -y @capitalthought/agentsfirst-mcp</code> for codebase scoring.</li>
</ul>

<h2>Endpoints</h2>
<ul>
  <li><code>POST ${ENDPOINT_URL}</code> — MCP Streamable HTTP transport (JSON-RPC).</li>
  <li><code>GET ${ENDPOINT_URL}/health</code> — JSON healthcheck.</li>
  <li><code>GET ${ENDPOINT_URL}</code> — this page.</li>
</ul>

<h2>Rules of the road</h2>
<p>Read <a href="${FRAMEWORK_URL}/principles/contract-first/">AGENTS.md</a> before calling. The server is read-only — every tool either returns embedded data or makes outbound HTTP fetches against URLs the caller named. Source: <a href="https://github.com/capitalthought/agentsfirst/tree/main/tools/agentsfirst-mcp-worker">github.com/capitalthought/agentsfirst</a>.</p>

<p class="meta">${SERVER_NAME} v${VERSION} · ${TOOL_NAMES.length} tools (${SUPPORTED_BY_WORKER.length} callable on Worker) · framework: <a href="${FRAMEWORK_URL}">${FRAMEWORK_URL}</a></p>
</body>
</html>
`;

function infoResponse(accept: string | null): Response {
  // Content negotiation: honor /llms.txt-style markdown requests, default to HTML.
  if (accept && /\b(application\/json)\b/i.test(accept)) {
    return json({
      server: SERVER_NAME,
      version: VERSION,
      endpoint: ENDPOINT_URL,
      transport: 'streamable-http',
      tools: TOOL_NAMES,
      tools_callable_on_worker: SUPPORTED_BY_WORKER,
      framework_url: FRAMEWORK_URL,
      docs: `${FRAMEWORK_URL}/principles/`,
      install_local: 'npx -y @capitalthought/agentsfirst-mcp',
    });
  }
  return new Response(INFO_HTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      ...CORS_HEADERS,
    },
  });
}

async function handleMcpRequest(request: Request): Promise<Response> {
  // Stateless mode — each request gets its own short-lived transport + server.
  // Works because all 4 callable tools are stateless reads. JSON response mode
  // (enableJsonResponse=true) keeps the wire format simple and avoids the SSE
  // long-lived stream — Workers per-request execution lifecycle prefers this.
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });
  const server = createServer();
  await server.connect(transport);
  const response = await transport.handleRequest(request);
  return withCors(response);
}

export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // CORS preflight — answer for any /mcp path.
    if (request.method === 'OPTIONS' && pathname.startsWith('/mcp')) {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Healthcheck
    if (pathname === '/mcp/health') {
      if (request.method !== 'GET') {
        return json({ error: 'method_not_allowed', allowed: ['GET'] }, 405);
      }
      return json({
        ok: true,
        server: SERVER_NAME,
        version: VERSION,
        tools: TOOL_NAMES,
        tools_callable_on_worker: SUPPORTED_BY_WORKER,
        framework_url: FRAMEWORK_URL,
        endpoint: ENDPOINT_URL,
        transport: 'streamable-http',
      });
    }

    // Info page or MCP transport
    if (pathname === '/mcp' || pathname === '/mcp/') {
      if (request.method === 'GET') {
        return infoResponse(request.headers.get('Accept'));
      }
      if (request.method === 'POST' || request.method === 'DELETE') {
        return handleMcpRequest(request);
      }
      return json({ error: 'method_not_allowed', allowed: ['GET', 'POST', 'DELETE'] }, 405);
    }

    // Anything else under /mcp/* — structured 404.
    if (pathname.startsWith('/mcp/')) {
      return notFound(pathname);
    }

    // The route binding shouldn't send anything else here, but if it does,
    // return 404 rather than passing through. The Worker is the wrong layer
    // to serve the rest of the site.
    return notFound(pathname);
  },
} satisfies ExportedHandler<Env>;
