---
title: "Agents First Score — bizzabo.com"
description: "Score: 15/100 · Level 1 (Agent as Afterthought). Ships a real /llms.txt — more than most consumer-marketing sites — but every other surface an agent looks for comes back 404."
noindex: true
sitemap: false
image: /scores/bizzabo-9bafd56bb7bd/og.png
author: Joshua Baer
---

# Agents First Score — bizzabo.com

**Score: 15/100 · Level 1 (Agent as Afterthought)**

Bizzabo (the B2B event-management platform) ships a real `/llms.txt` — 6.3KB of structured content, not a 404 catchall. That alone puts them ahead of most consumer-marketing sites. But every other surface an agent looks for comes back 404, robots.txt addresses zero AI agents, and the homepage doesn't surface their API or any community MCP server.

### What's working

- ✅ **`/llms.txt`** (10/10 of Discoverability/llms.txt slot) — 6.3KB served as `text/plain`. Real content. Single biggest credit on the report.
- ✅ **Sitemap.xml** (5/5 of Content Accessibility/sitemap slot) — 1.8KB served as `text/xml`.

### What's missing

- ⚠️ **No `/AGENTS.md`, no `/.well-known/agent-rules`** (0/10 of Discoverability) — having `/llms.txt` without a companion `AGENTS.md` is the half-implementation that costs the easy second-half of the dimension.
- ⚠️ **`robots.txt` addresses 0 AI agents** (0/15 of Bot Access Control) — just a generic `User-agent: *` with `Disallow: /wp-admin/`. No Content-Signal directive, no per-bot allow/deny.
- ⚠️ **No Agent Capabilities** (0/30) — no MCP Server Card, no homepage mention of MCP/CLI/SDK/API, no OAuth-with-PKCE discovery. There IS a community Bizzabo MCP server in the wild (one that wraps the public Bizzabo API), but bizzabo.com doesn't broadcast it, so the rubric can't credit it.
- ⚠️ **No markdown content negotiation, no OpenAPI** (0/15 of remaining Content Accessibility).

### 🚨 Anti-patterns flagged

- **[The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — partial. They started shipping signals (`/llms.txt`) but stopped at one. The product *is* discoverable to a deliberate agent reading `/llms.txt`, but invisible to one looking at robots.txt, well-known paths, or the homepage.

### 🎯 Top moves to climb a level

1. **Pair `/llms.txt` with `/AGENTS.md`.** They have the conceptual ground covered — just split the existing file. Earns 10 pts (Discoverability) and signals "we know the difference between a reading index and an agent contract." ~30 min, since the llms.txt structure is already there. Reference: [Contract First](https://agentsfirst.dev/principles/contract-first/).

2. **Add a Content-Signal directive to robots.txt** (`Content-Signal: ai-train=yes, search=yes, ai-input=yes` if intent is open; per-bot blocks if more nuanced). Earns 10 pts (Bot Access Control). One line, five-minute fix.

3. **Surface the MCP server.** Either ship `@bizzabo/mcp` to npm and link it from the homepage developer footer, or publish `/.well-known/mcp-server-card.json` pointing at the API. The community server already exists; just needs the official breadcrumb. Earns 25 pts (Agent Capabilities + Visibility). Reference: [Interface First](https://agentsfirst.dev/principles/interface-first/).

After all three: estimated **60/100 · Level 2** without changing the core product.

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- Live scorer: <https://agentsfirst.dev/mcp>
- Methodology: rubric v0.1.2 (open-source at [`tools/agentsfirst-mcp/src/score.ts`](https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts))
