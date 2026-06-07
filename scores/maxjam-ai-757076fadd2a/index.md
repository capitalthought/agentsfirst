---
title: "Agents First Score — maxjam.ai"
description: "Score: 70/100 · Level 3 (Agents First). maxjam.ai went L0→L3 in one session — real llms.txt + AGENTS.md + MCP server card + AI-bot robots, and a homepage that advertises the MCP surface. Markdown negotiation + a published SDK are the remaining L4 climb."
noindex: true
sitemap: false
image: /scores/maxjam-ai-757076fadd2a/og.png
author: Joshua Baer
---

## Agents First Score — maxjam.ai

**Score: 70/100 · Level 3 (Agents First) 🎯**

MaxJam is a personal, single-user music agent — the editable taste brain + aimed discovery. The *product* was agent-first from day one (an MCP server with 8 verb-first tools, a hand-authored `AGENTS.md`, typed Supabase state with versioned migrations, an `overview` Inspectable-State tool, and a dual-LLM quarantine boundary). The *marketing domain* hadn't caught up: at the start of this session `maxjam.ai` scored **3/100, Level 0** — worse than empty, it served the landing page as a 200 for every probed agent path (`/llms.txt`, `/AGENTS.md`, `/.well-known/mcp-server-card.json`), so a probing agent got HTML dressed as a contract. Closing that gap took five moves and one redeploy; the domain now lands at **Level 3**.

### What's working

- ✅ **Discoverability (25/25)** — real `/llms.txt` (text/plain) and `/AGENTS.md` (text/markdown) served as actual files; `robots.txt` explicitly addresses GPTBot, ClaudeBot, Google-Extended, and PerplexityBot with allow rules.
- ✅ **Bot access control (15/15)** — Cloudflare Content Signals declared (`search=yes, ai-input=yes, ai-train=no`) plus a per-bot allow posture, not a blanket rule.
- ✅ **Agent capabilities (15/30)** — an MCP Server Card at `/.well-known/mcp-server-card.json` describing all 8 typed verbs, the endpoint, and the auth posture.
- ✅ **Visibility of agent integrations (10/10)** — the homepage ships a "For agents" section ("MaxJam speaks MCP") linking llms.txt, AGENTS.md, and the server card alongside the human story.
- ✅ **Honest 404s** — a `404.html` killed the misleading catch-all-200; unmatched paths now return a real 404 so agents can trust absence.

### What's missing (the Level 4 climb)

- ⚠️ **Content accessibility (5/20)** — `sitemap.xml` is real (5), but there's no markdown content-negotiation (serving `text/markdown` on `Accept: text/markdown`) and no OpenAPI at conventional paths. Both need a Worker in front of the static Pages site.
- ⚠️ **Agent capabilities (15/30)** — the MCP card is published, but there's no distributed CLI/SDK and no `/.well-known/oauth-authorization-server` discovery.

### 🚨 Anti-patterns flagged

- **[The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — *resolved this session.* The agent surface existed (the `maxjam-mcp` Worker) but was hosted on a `workers.dev` URL and unlinked from the brand domain; an agent crawling `maxjam.ai` cold found nothing. The five moves above connected the marketing surface to the product's agent reality.
- **Misleading catch-all 200** — *resolved.* Cloudflare Pages was serving `index.html` (HTTP 200) for `/AGENTS.md`, `/llms.txt`, and every `.well-known` path. A clean 404 is more honest than a landing page wearing a contract's URL; the `404.html` fixed it.

### 🎯 Top moves to climb to Level 4

1. **Front the static site with a Worker for markdown content-negotiation** — return `text/markdown` on `Accept: text/markdown` for the homepage. Earns 10 pts (Content Accessibility) and makes the human page directly legible to an agent without a separate fetch.
2. **Publish a CLI/SDK under a known channel** — even a thin `npx @capitalthought/maxjam` wrapper over the MCP verbs. Earns 10 pts (Agent Capabilities). Reference: [Interface First](https://agentsfirst.dev/principles/interface-first/).
3. **Add `/.well-known/oauth-authorization-server`** — PKCE discovery for the owner-scoped auth. Earns 5 pts and formalizes the auth posture the server card already describes.

A caveat the rubric can't see: MaxJam is deliberately **single-tenant / owner-operated**, so "agent capabilities" is really about *Josh's own* agents driving it — not a public multi-tenant surface. The llms.txt and server card say so explicitly. Level 3 is the right ceiling to optimize for here; the L4 moves are worth it only where they also serve the owner's tooling.

### Reference

Principles: <https://agentsfirst.dev/principles/> · Glossary: <https://agentsfirst.dev/glossary/>
