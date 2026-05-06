# agentsfirst-mcp-worker

Cloudflare Worker hosting the [Agents First](https://agentsfirst.dev) MCP scorer at **`https://agentsfirst.dev/mcp`**. Remote MCP server — your agent connects over HTTP, no install required.

Sister to [`@capitalthought/agentsfirst-mcp`](https://www.npmjs.com/package/@capitalthought/agentsfirst-mcp) (the local stdio package). This Worker is not published to npm — it's deployed, not packaged.

## Why a Worker?

The local npm package needs `npx -y @capitalthought/agentsfirst-mcp` and Node ≥ 20. The Worker is callable from any agent runtime that supports remote MCP servers — point it at `https://agentsfirst.dev/mcp` and the tools show up in the agent's tool list with no install step.

## Add it to your agent

### Claude Code

```jsonc
// ~/.claude.json (or .claude/mcp.json)
{
  "mcpServers": {
    "agentsfirst": {
      "type": "http",
      "url": "https://agentsfirst.dev/mcp"
    }
  }
}
```

### Cursor

```jsonc
// .cursor/mcp.json
{
  "mcpServers": {
    "agentsfirst": {
      "type": "http",
      "url": "https://agentsfirst.dev/mcp"
    }
  }
}
```

### Cline / Windsurf / generic MCP clients

Same shape — `type: "http"`, `url: "https://agentsfirst.dev/mcp"`. Drop into the client's MCP config.

## Tools

All read-only.

| Tool | Worker | Local (`npx`) | Notes |
|---|---|---|---|
| `agentsfirst_prep` | yes | yes | Prep Gate. Call first. |
| `score_website` | yes | yes | HTTP-probes a public URL across 5 dimensions, returns 0–100 score + level + top moves. |
| `get_principle` | yes | yes | Canonical definition of one of the 8 principles. |
| `get_anti_pattern` | yes | yes | Canonical definition of one of the 7 anti-patterns. |
| `score_codebase` | **deferred-to-local** | yes | Workers can't read your filesystem. Returns a structured pointer to the npx version. |

For `score_codebase`, install locally:

```bash
npx -y @capitalthought/agentsfirst-mcp
```

## Endpoints

- `POST https://agentsfirst.dev/mcp` — MCP Streamable HTTP transport. JSON-RPC over HTTP. Stateless mode.
- `GET https://agentsfirst.dev/mcp` — human-readable info page (HTML by default; JSON if `Accept: application/json`).
- `GET https://agentsfirst.dev/mcp/health` — JSON healthcheck.

CORS is wide-open (`Access-Control-Allow-Origin: *`) so browser-based agents can call it directly.

## Rules

Agent rules live in [AGENTS.md](./AGENTS.md). Permissions, sequence, identifiers, and error contract — read it before calling.

## Develop locally

```bash
cd tools/agentsfirst-mcp-worker
npm install
npm run dev
```

`wrangler dev` starts on port 8787. Hit `http://localhost:8787/mcp/health` to verify, then send JSON-RPC to `http://localhost:8787/mcp`:

```bash
curl -s -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"1.0"}}}'
```

## Deploy

```bash
npm run deploy
```

Equivalent to `wrangler deploy`. Requires a Cloudflare API token with permissions to write Workers and Workers Routes scoped to the **joshshop** account / **agentsfirst.dev** zone. Tokens live in 1Password (Capital Factory Employee vault) — run `/cloudflare-prep` first.

## Route binding

```toml
# wrangler.toml
[[routes]]
pattern = "agentsfirst.dev/mcp*"
zone_name = "agentsfirst.dev"
```

Path-scoped: only `/mcp` and `/mcp/*` are routed to this Worker. Everything else (`/`, `/principles/*`, `/glossary/`, `/api/principles.json`, etc.) continues to flow to GitHub Pages via the existing CNAME. Deploying does not affect the rest of the site.

## Structure

```
src/
  index.ts            Worker entry — routing, CORS, info page
  server.ts           McpServer factory + tool registrations
  prep.ts             Prep Gate (Worker-safe)
  probe-website.ts    Website-mode HTTP probe (Worker-safe)
  score.ts            Scoring rubric (pure functions)
  principles.ts       Embedded 8 principles + 7 anti-patterns
wrangler.toml         Worker config + route binding
package.json          npm scripts (dev / deploy / tail / types)
tsconfig.json         strict TS targeting ES2022 + NodeNext
AGENTS.md             Agent contract — read before calling
```

## References

- Agents First framework: [agentsfirst.dev](https://agentsfirst.dev)
- MCP Streamable HTTP spec: [modelcontextprotocol.io/specification/.../basic/transports](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)
- Cloudflare Workers MCP: [developers.cloudflare.com/agents/model-context-protocol](https://developers.cloudflare.com/agents/model-context-protocol/)
- Local sister package: [@capitalthought/agentsfirst-mcp](https://www.npmjs.com/package/@capitalthought/agentsfirst-mcp)
