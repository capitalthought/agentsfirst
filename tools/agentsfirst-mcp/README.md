# @capitalthought/agentsfirst-mcp

MCP server that scores any website or codebase against the [Agents First](https://agentsfirst.dev) framework. Use it to check how agent-ready a product is — yours, a competitor's, a portfolio company's, an acquisition target's.

Five verb-first tools, read-only, structured returns. Sister package to [`@capitalthought/create-agents-first`](https://www.npmjs.com/package/@capitalthought/create-agents-first) (the scaffold).

## Quick start

Run with no install:

```bash
npx -y @capitalthought/agentsfirst-mcp
```

The server speaks MCP over stdio. Wire it into your agent runtime:

### Claude Code

```jsonc
// ~/.claude.json (or .claude/mcp.json)
{
  "mcpServers": {
    "agentsfirst": {
      "command": "npx",
      "args": ["-y", "@capitalthought/agentsfirst-mcp"]
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
      "command": "npx",
      "args": ["-y", "@capitalthought/agentsfirst-mcp"]
    }
  }
}
```

### Windsurf / Cline / generic MCP-compatible clients

Same shape — `command: "npx"`, `args: ["-y", "@capitalthought/agentsfirst-mcp"]`. Drop into the client's MCP config.

## Tools

All tools are read-only. The server never writes anywhere.

### `agentsfirst_prep`

Prep Gate. Call this first, every session. Verifies the rubric is loaded (8 principles, 7 anti-patterns), Node >=20, and the canonical principles URL is reachable.

**Params:** none.

**Returns:** `{ ok, checks: [{ name, ok, message }], rubric_version, principles_url }`.

### `score_codebase`

Probes a local directory and scores it against the 8 principles. Looks for AGENTS.md, MCP/CLI/SDK presence, prep tooling, typed state, visible-output sinks, multi-model wiring, perspective dispatch, retry/recovery. 100 points total.

**Params:**
- `path` (string, default cwd) — directory to score.
- `depth` (`'quick' | 'standard' | 'deep'`, default `'standard'`) — reserved for future heuristics.

**Returns:** `{ score, level, level_name, principles, anti_patterns_flagged, top_moves, probe_signals }`.

### `score_website`

HTTP-probes a URL for agent-discoverable surfaces and scores against 5 dimensions: Discoverability (25), Content Accessibility (20), Bot Access Control (15), Agent Capabilities (30), Visibility of Agent Integrations (10). Looks for `robots.txt`, `/llms.txt`, `/AGENTS.md`, `/.well-known/*`, OpenAPI surfaces, MCP server card, and markdown content negotiation.

**Params:**
- `url` (string, required) — must be `http://` or `https://`.

**Returns:** `{ score, level, level_name, dimensions, anti_patterns_flagged, top_moves, probe_signals }`.

### `get_principle`

Returns the canonical text of one principle.

**Params:**
- `slug` — one of `interface-first`, `contract-first`, `prep-gates`, `typed-state`, `visible-outputs`, `multi-model-verification`, `perspective-dispatch`, `autonomous-recovery`.

**Returns:** `{ slug, name, summary, full_url, anti_patterns_defended }`.

### `get_anti_pattern`

Returns the canonical definition of one anti-pattern.

**Params:**
- `slug` — one of `lazy-wrapper`, `invisible-product`, `agents-without-rules`, `single-model-trust`, `slow-chatbot`, `ship-and-forget`, `god-server`.

**Returns:** `{ slug, name, definition, opposes_principle, glossary_url }`.

## What the score means

Total maps to a 0–4 adoption level:

| Score | Level | Name |
|------:|------:|------|
| 0–10 | 0 | No agent access |
| 11–25 | 1 | Agent as Afterthought |
| 26–60 | 2 | Agent-Aware |
| 61–85 | 3 | **Agents First** |
| 86–100 | 4 | Agent-Driven |

Aim for Level 3 on net-new projects. Lift legacy projects 1 → 2 → 3 incrementally.

Full rubric: <https://agentsfirst.dev/principles/>. Glossary of anti-patterns and metrics: <https://agentsfirst.dev/glossary/>.

## Local development

```bash
git clone https://github.com/capitalthought/agentsfirst
cd agentsfirst/tools/agentsfirst-mcp
npm install
npm run build
npm run prep    # sanity-check the prep gate
node dist/server.js   # boot the server (stdio)
```

Send a `tools/list` request over stdio:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/server.js | head -20
```

## Publishing

Same flow as `@capitalthought/create-agents-first`. Granular access token in 1Password Employee vault, scope-wide on `@capitalthought`, `bypass-2fa: true`. GitHub Actions auto-publishes on tag push (`v0.1.0`). Full reference: `~/icloud/Claude/ref-npm-publishing.md`.

## License

MIT — © 2026 Joshua Baer.
