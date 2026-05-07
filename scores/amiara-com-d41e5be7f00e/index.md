---
title: "Agents First Score — amiara.com"
description: "Score: 0/100 · Level 0 (No agent access). Amiara is a B2B business-intelligence platform — clean for human traffic, completely invisible to agents. Every well-known file an agent looks for returns a hard 404."
noindex: true
sitemap: false
image: /scores/amiara-com-d41e5be7f00e/og.png
author: Joshua Baer
---

## Agents First Score — amiara.com

**Score: 0/100 · Level 0 (No agent access)**

Amiara is a B2B business-intelligence platform for founders, investors, and acquirers (per the `og:description`: *"Scale revenue, cashflow, profit and enterprise value and join our ecosystem of founders, investors & acquirers."*). The marketing surface is a Next.js SPA on Vercel — clean for human traffic, **completely invisible to agents**. Every well-known file an agent looks for returns a hard 404: no `robots.txt`, no `llms.txt`, no `AGENTS.md`, no sitemap, no MCP Server Card, no OAuth discovery. The homepage references "agent" and "API" in its product copy but doesn't surface a single discoverable agent integration. Worth noting: this is honest scoring — the SPA returns real 404s, not the catchall-200 false-positive pattern we see at Cursor / Browserbase / Vercel. Amiara is at the absolute floor of the rubric, but the floor is reachable in an afternoon of work.

### What's missing (everything)

- ⚠️ **Discoverability** (0/25) — no `/robots.txt`, no `/llms.txt`, no `/AGENTS.md`. The site is invisible to a discovering agent.
- ⚠️ **Content accessibility** (0/20) — no sitemap.xml, no markdown content negotiation, no OpenAPI at `/openapi.json` or `/api/openapi.json`.
- ⚠️ **Bot access control** (0/15) — no robots.txt at all, so no Content-Signal directive, no per-bot rules. Agents asking "may I use this site?" get an ambiguous default.
- ⚠️ **Agent capabilities** (0/30) — no `/.well-known/mcp-server-card.json`, no `/agents.json`, no homepage MCP/CLI/SDK reference, no OAuth-with-PKCE discovery. Customers (founders, investors) increasingly use agents to triage cap-table and BI tools — Amiara isn't in any of those tool lists.
- ⚠️ **Visibility of agent integrations** (0/10) — homepage hides agent integrations from the human-onboarding flow.

### 🚨 Anti-patterns flagged

- **[The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — full-strength. No MCP Server Card, no CLI/SDK reference, no agent capability surfaces detected. The product may be excellent for humans; the agent ecosystem cannot tell it exists.

### 🎯 Top moves to climb a level (afternoon job, gets to Level 2 fast)

1. **Ship a `/robots.txt` with a Content-Signal directive + `/llms.txt` + `/AGENTS.md` at the marketing root.** Three files. Less than an hour. `/robots.txt` declares `Content-Signal: ai-train=…, ai-input=…, search=…` plus per-bot allow/deny for GPTBot, ClaudeBot, anthropic-ai, ChatGPT-User, OAI-SearchBot, Google-Extended, PerplexityBot. `/llms.txt` indexes the docs that already exist. `/AGENTS.md` is the contract — sequence rules ("call list_companies before evaluating"), permissions ("read-only by default"), error formats, escalation triggers. Worth ~25pts (Discoverability) + ~10pts (Bot Access Control) on its own. Reference: [Contract First](https://agentsfirst.dev/principles/contract-first/).

2. **Add `/sitemap.xml` and turn on markdown content negotiation.** Vercel makes both trivial — the sitemap is one config setting; content negotiation is a route handler that serves the markdown source when `Accept: text/markdown` is requested. Worth ~15pts (Content Accessibility). Bonus: the markdown surface gives the eventual MCP server something to read from.

3. **Publish `/.well-known/mcp-server-card.json` declaring the eventual MCP server, then ship the server.** Even if the MCP server is v0.0.1 with three tools (`list_companies`, `get_company_metrics`, `compare_to_peers`), the card should exist and reference it. Distribute as `npx @amiara/mcp-server` and as a hosted endpoint at `amiara.com/mcp`. Worth ~25pts (Agent Capabilities + Visibility). Reference: [Interface First](https://agentsfirst.dev/principles/interface-first/).

After all three: estimated **55–65/100 · Level 2 (Agent-Aware)**, in one focused engineering day. The product surface doesn't need to change — only the discovery breadcrumbs.

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- Live scorer: <https://agentsfirst.dev/mcp>
- Methodology: rubric v0.2.0. Probe verified via direct curl — every well-known path returns a hard 404 (not the SPA-catchall false positive seen at some Vercel-hosted competitors). The score is honest. Note: Amiara also runs `amiara.ai` (per `og:url`) — that surface scores identically (both are the same Vercel deployment).
