---
title: "Agents First Score — AmplifAI"
description: "Score: 5/100 · Level 0 (No agent access). AmplifAI is a Capital Factory portfolio company. This private agent-readiness audit shows what an agent finds when it tries to discover their product."
noindex: true
sitemap: false
image: /scores/portfolio-amplifai-63852d23f176/og.png
brand_domain: amplifai.com
author: Joshua Baer
---

## Agents First Score — AmplifAI

**Score: 5/100 · Level 0 (No agent access)** · scored against rubric v0.2.0 on 2026-05-07.

This is a private audit prepared as part of a Capital Factory portfolio review. AmplifAI's public site at [https://www.amplifai.com/](https://www.amplifai.com/) was scored against the [Agents First framework](https://agentsfirst.dev) — eight implementation principles plus five discovery dimensions. The score reflects what an agent finds when it tries to discover and use AmplifAI's product on behalf of a user.

### Dimension breakdown

- ⚠️ **Discoverability** (0/25) — robots.txt exists but does not address AI agents specifically
- 🟡 **Content Accessibility** (5/20) — No markdown content negotiation
- ⚠️ **Bot Access Control** (0/15) — No Content-Signal directive and no per-bot AI policy in robots.txt
- ⚠️ **Agent Capabilities** (0/30) — No MCP Server Card (/.well-known/mcp-server-card[.json] or /agents.json)
- ⚠️ **Visibility Of Agent Integrations** (0/10) — Homepage hides agent integrations from human-onboarding flow

### 🚨 Anti-patterns flagged

- **[The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — No MCP Server Card, no CLI/SDK reference, no agent capability surfaces detected.

### 🎯 Top moves to climb a level

1. **+30pts (agent-capabilities)** — Ship an MCP server (verb-first tools, Zod params), publish /.well-known/mcp-server-card, and reference it from the homepage hero.
2. **+25pts (discoverability)** — Publish /llms.txt and /AGENTS.md at the site root. Update robots.txt to address GPTBot, ClaudeBot, anthropic-ai, Google-Extended, PerplexityBot, CCBot explicitly.
3. **+15pts (content-accessibility)** — Serve text/markdown when the Accept header asks for it. Publish sitemap.xml and an OpenAPI document at /openapi.json.

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- Live scorer (re-run anytime): <https://agentsfirst.dev/mcp>
- Methodology: rubric v0.2.0 — `/AGENTS.md` weighted 15pts (canonical contract artifact); `/llms.txt` weighted 5pts (optional belt-and-suspenders); `/agents.json` and `/sitemap-index.xml` credited equally with `/.well-known/mcp-server-card.json` and `/sitemap.xml`. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

---

*Capital Factory portfolio audit · 2026-05-07 · Re-run the scorer at <https://agentsfirst.dev/mcp> any time to verify your improvements.*
