---
title: "Agents First Score — ICON"
description: "Score: 50/100 · Level 2 (Agent-Aware). ICON is a Capital Factory portfolio company. Halfway to Level 3 — one focused day of work would close the gap."
noindex: true
sitemap: false
image: /scores/portfolio-icon-cefab243df54/og.png
author: Joshua Baer
---

## Agents First Score — ICON

**Score: 50/100 · Level 2 (Agent-Aware)** · scored against rubric v0.2.0 on 2026-05-07.

This is a private audit prepared as part of a Capital Factory portfolio review. ICON's public site at [https://iconbuild.com/](https://iconbuild.com/) was scored against the [Agents First framework](https://agentsfirst.dev) — eight implementation principles plus five discovery dimensions. The score reflects what an agent finds when it tries to discover and use ICON's product on behalf of a user.

### Dimension breakdown

- ✅ **Discoverability** (20/25) — robots.txt exists but does not address AI agents specifically
- 🟡 **Content Accessibility** (10/20) — No markdown content negotiation
- ⚠️ **Bot Access Control** (0/15) — No Content-Signal directive and no per-bot AI policy in robots.txt
- 🟡 **Agent Capabilities** (20/30) — MCP Server Card published at /.well-known/mcp-server-card.json
- ⚠️ **Visibility Of Agent Integrations** (0/10) — Homepage hides agent integrations from human-onboarding flow

### 🚨 Anti-patterns flagged

*(none — clean run)*

### 🎯 Top moves to climb a level

1. **+15pts (bot-access-control)** — Replace any blanket Disallow with per-bot rules. Cloudflare Content Signals or equivalent declarative AI-policy.
2. **+10pts (agent-capabilities)** — Ship an MCP server (verb-first tools, Zod params), publish /.well-known/mcp-server-card, and reference it from the homepage hero.
3. **+10pts (content-accessibility)** — Serve text/markdown when the Accept header asks for it. Publish sitemap.xml and an OpenAPI document at /openapi.json.

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- Live scorer (re-run anytime): <https://agentsfirst.dev/mcp>
- Methodology: rubric v0.2.0 — `/AGENTS.md` weighted 15pts (canonical contract artifact); `/llms.txt` weighted 5pts (optional belt-and-suspenders); `/agents.json` and `/sitemap-index.xml` credited equally with `/.well-known/mcp-server-card.json` and `/sitemap.xml`. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

---

*Capital Factory portfolio audit · 2026-05-07 · Re-run the scorer at <https://agentsfirst.dev/mcp> any time to verify your improvements.*
