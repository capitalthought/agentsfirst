---
title: "Agents First Score — fetii.com"
description: "Score: 2/100 · Level 0 (No agent access). Fetii markets AI-powered group rideshare, but to the outside agent ecosystem it doesn't exist — no llms.txt, no MCP card, no discoverable API. A textbook Invisible Product."
noindex: true
sitemap: false
image: /scores/fetii-com-19677dc51528/og.png
author: Joshua Baer
brand_domain: fetii.com
---

## Agents First Score — fetii.com

**Score: 2/100 · Level 0 (No agent access) 🚫**

Fetii markets itself as "AI-powered group rideshare" with a "Fetii AI" / "NeuralShuttle" brand — but that's AI *inside* the product for the human user. To the outside agent ecosystem, Fetii doesn't exist. There's no llms.txt, no AGENTS.md, no MCP card, no discoverable API, no OAuth metadata, and no robots.txt that says anything about anyone.

Worse: fetii.com is a single-page app with a catch-all route. Every path (`/llms.txt`, `/AGENTS.md`, `/.well-known/mcp-server-card`, `/robots.txt`, `/sitemap.xml`, OAuth discovery — all of them) returns the *exact same* 3,043-byte HTML shell with a `200` status. An agent fetching any well-known path gets a marketing webpage instead of an honest 404 — so it can't even tell the artifact is missing. This is the textbook Invisible Product.

### What's working

- ✅ Basic SEO hygiene — OG tags, description, Google site verification, keywords. Good for human search; irrelevant to agents.
- ✅ A real API exists behind `/api/` (it returns structured JSON 404s) — the raw material for an agent interface is already built.

That's the whole list.

### What's missing

- ⚠️ **Discoverability** (0/25) — no real robots.txt, no `/llms.txt`, no `/AGENTS.md`. The SPA serves HTML for all three.
- ⚠️ **Content accessibility** (0/20) — no markdown content negotiation, no real sitemap.xml, no discoverable OpenAPI.
- ⚠️ **Bot access control** (0/15) — no Content Signals, no per-bot posture, no robots.txt at all.
- ⚠️ **Agent capabilities** (0/30) — no MCP Server Card, no CLI/SDK, no OAuth-with-PKCE discovery.
- ⚠️ **Visibility of agent integrations** (0/10) — homepage never mentions MCP, CLI, SDK, API, or OAuth.

### 🚨 Anti-patterns flagged

- **The Invisible Product** — web app first, agent access never. For a rideshare company, "book a group ride" is *the* canonical agent verb, and there's no way for any agent to call it.
- **SPA catch-all masking** — returning `200 + index.html` for `/llms.txt`, `/robots.txt`, `/.well-known/*` is actively hostile to agent probes. An agent can't distinguish "missing" from "here's a webpage." Real 404s are more honest than fake 200s.

### 🎯 Top moves to climb a level

1. **Fix the catch-all first.** Configure the host (Vercel/Netlify/CF Pages — whatever's serving this) to return real files or real 404s for `/robots.txt`, `/llms.txt`, `/sitemap.xml`, and `/.well-known/*` instead of the SPA shell. This is a routing config change, ~10 lines, and it unblocks everything below. Right now you'd get *negative* credit from a strict probe.
2. **Ship a real `/llms.txt`.** ~30 lines: what Fetii is, service area, how group booking works, links to the API. Instant jump off Level 0.
3. **Publish the booking API as OpenAPI + an MCP server.** You already have `/api/` — document it, put a spec at `/openapi.json`, and wrap the one operation that matters (`request_group_ride`) as a verb-first MCP tool with typed params (pickup, dropoff, party size, time) and structured errors. That's the smallest experiment from the framework, and for a rideshare product it's the entire ballgame: when someone's agent plans a night out for 12 people, Fetii should be in the tool list.

### Reference

Framework: <https://agentsfirst.dev/principles/>
Glossary: <https://agentsfirst.dev/glossary/>
