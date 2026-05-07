---
title: "Agents First Score — Really.com"
description: "Score: 15/100 · Level 1 (Agent as Afterthought). Really.com is a Capital Factory portfolio company. This private agent-readiness audit shows what an agent finds when it tries to discover their product."
noindex: true
sitemap: false
image: /scores/portfolio-reallycom-f53ed34c3f4e/og.png
author: Joshua Baer
---

## Agents First Score — Really.com

**Score: 15/100 · Level 1 (Agent as Afterthought)** · scored against rubric v0.2.0 on 2026-05-07.

This is a private audit prepared as part of a Capital Factory portfolio review. Really.com's public site at [https://www.really.com/](https://www.really.com/) was scored against the [Agents First framework](https://agentsfirst.dev) — eight implementation principles plus five discovery dimensions. The score reflects what an agent finds when it tries to discover and use Really.com's product on behalf of a user.

### Dimension breakdown

- ⚠️ **Discoverability** (0/25) — robots.txt exists but does not address AI agents specifically
- ✅ **Content Accessibility** (15/20) — Server responds to text/markdown content negotiation
- ⚠️ **Bot Access Control** (0/15) — No Content-Signal directive and no per-bot AI policy in robots.txt
- ⚠️ **Agent Capabilities** (0/30) — No MCP Server Card (/.well-known/mcp-server-card[.json] or /agents.json)
- ⚠️ **Visibility Of Agent Integrations** (0/10) — Homepage hides agent integrations from human-onboarding flow

### 🚨 Anti-patterns flagged

- **[The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — No MCP Server Card, no CLI/SDK reference, no agent capability surfaces detected.

### 🎯 Top moves to climb a level

1. **+30pts (agent-capabilities)** — Ship an MCP server (verb-first tools, Zod params), publish /.well-known/mcp-server-card, and reference it from the homepage hero.
2. **+25pts (discoverability)** — Publish /llms.txt and /AGENTS.md at the site root. Update robots.txt to address GPTBot, ClaudeBot, anthropic-ai, Google-Extended, PerplexityBot, CCBot explicitly.
3. **+15pts (bot-access-control)** — Replace any blanket Disallow with per-bot rules. Cloudflare Content Signals or equivalent declarative AI-policy.

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- Live scorer (re-run anytime): <https://agentsfirst.dev/mcp>
- Methodology: rubric v0.2.0 — `/AGENTS.md` weighted 15pts (canonical contract artifact); `/llms.txt` weighted 5pts (optional belt-and-suspenders); `/agents.json` and `/sitemap-index.xml` credited equally with `/.well-known/mcp-server-card.json` and `/sitemap.xml`. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

---

*Capital Factory portfolio audit · 2026-05-07 · Re-run the scorer at <https://agentsfirst.dev/mcp> any time to verify your improvements.*
