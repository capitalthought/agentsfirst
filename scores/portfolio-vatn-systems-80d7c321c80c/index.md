---
title: "Agents First Score — Vatn Systems"
description: "Score: 15/100 · Level 1 (Agent as Afterthought). Vatn Systems is a Capital Factory portfolio company. This private agent-readiness audit shows what an agent finds when it tries to discover their product."
noindex: true
sitemap: false
image: /scores/portfolio-vatn-systems-80d7c321c80c/og.png
brand_domain: vatnsystems.com
author: Joshua Baer
---

## Agents First Score — Vatn Systems

**Score: 15/100 · Level 1 (Agent as Afterthought)** · scored against rubric v0.2.0 on 2026-05-07.

This is a private audit prepared as part of a Capital Factory portfolio review. Vatn Systems's public site at [https://www.vatnsystems.com](https://www.vatnsystems.com) was scored against the [Agents First framework](https://agentsfirst.dev) — eight implementation principles plus five discovery dimensions. The score reflects what an agent finds when it tries to discover and use Vatn Systems's product on behalf of a user.

### Dimension breakdown

- 🟡 **Discoverability** (5/25) — robots.txt addresses 8 AI agents: GPTBot, anthropic-ai, ClaudeBot, Google-Extended, Bytespider, C…
- 🟡 **Content Accessibility** (5/20) — No markdown content negotiation
- 🟡 **Bot Access Control** (5/15) — AI policy implicit via 8 per-bot rules — consider adding a Content-Signal directive for machine-r…
- ⚠️ **Agent Capabilities** (0/30) — No MCP Server Card (/.well-known/mcp-server-card[.json] or /agents.json)
- ⚠️ **Visibility Of Agent Integrations** (0/10) — Homepage hides agent integrations from human-onboarding flow

### 🚨 Anti-patterns flagged

- **[The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — No MCP Server Card, no CLI/SDK reference, no agent capability surfaces detected.

### 🎯 Top moves to climb a level

1. **+30pts (agent-capabilities)** — Ship an MCP server (verb-first tools, Zod params), publish /.well-known/mcp-server-card, and reference it from the homepage hero.
2. **+20pts (discoverability)** — Publish /llms.txt and /AGENTS.md at the site root. Update robots.txt to address GPTBot, ClaudeBot, anthropic-ai, Google-Extended, PerplexityBot, CCBot explicitly.
3. **+15pts (content-accessibility)** — Serve text/markdown when the Accept header asks for it. Publish sitemap.xml and an OpenAPI document at /openapi.json.

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- Live scorer (re-run anytime): <https://agentsfirst.dev/mcp>
- Methodology: rubric v0.2.0 — `/AGENTS.md` weighted 15pts (canonical contract artifact); `/llms.txt` weighted 5pts (optional belt-and-suspenders); `/agents.json` and `/sitemap-index.xml` credited equally with `/.well-known/mcp-server-card.json` and `/sitemap.xml`. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

---

*Capital Factory portfolio audit · 2026-05-07 · Re-run the scorer at <https://agentsfirst.dev/mcp> any time to verify your improvements.*
