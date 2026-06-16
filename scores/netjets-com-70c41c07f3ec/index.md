---
title: "Agents First Score — netjets.com"
description: "Score: 5/100 · Level 0 (No agent access). NetJets is a Gatsby marketing site with a sitemap and a near-empty robots.txt — and nothing else. No llms.txt, no AGENTS.md, no OpenAPI, no MCP card, no OAuth. The textbook Invisible Product."
noindex: true
sitemap: false
image: /scores/netjets-com-70c41c07f3ec/og.png
author: Joshua Baer
brand_domain: netjets.com
---

## Agents First Score — netjets.com

**Score: 5/100 · Level 0 (No agent access) 🚫**

NetJets is a Berkshire Hathaway company selling fractional jet ownership to ultra-high-net-worth flyers — and to an agent, it effectively doesn't exist. The site is a Gatsby marketing build with a sitemap and a near-empty robots.txt, and nothing else. No llms.txt, no AGENTS.md, no OpenAPI, no MCP card, no OAuth discovery, no markdown negotiation. Every agent-readiness surface probed returned 404. This is the textbook **Invisible Product** — the entire NetJets experience (booking, itineraries, the mobile app) lives behind a human-only owner portal an agent can't touch.

### What's working

- ✅ **sitemap.xml** (5/5) — a real 730KB sitemap at the root, referenced from robots.txt. Crawlable content exists.
- ✅ **robots.txt doesn't blanket-ban AI** — it only disallows `/*/search-results`. So an agent *can* read the marketing pages... there's just no structured data or capability behind them.

### What's missing

- ⚠️ **Discoverability** (0/25) — no `/llms.txt`, no `/AGENTS.md`, no `/.well-known/agent-rules`. robots.txt says nothing about AI agents specifically.
- ⚠️ **Agent capabilities** (0/30) — no MCP Server Card, no published CLI/SDK, no OAuth-with-PKCE discovery endpoint. There is no programmatic door.
- ⚠️ **Bot access control** (0/15) — no Cloudflare Content Signals or any AI-policy declaration; just an undifferentiated `User-agent: *`.
- ⚠️ **Content accessibility** (5/20) — requesting `text/markdown` returns HTML. No OpenAPI/API catalog. Sitemap is the only point earned.
- ⚠️ **Agent-integration visibility** (0/10) — homepage mentions no API, SDK, CLI, MCP, or OAuth. Nothing tells an agent (or its human) that programmatic access is even contemplated.

### 🚨 Anti-patterns flagged

- **The Invisible Product** — zero agent interface of any kind. The booking/itinerary/app functionality that defines NetJets is entirely walled off from the agent ecosystem. For a service whose owners increasingly delegate travel logistics to EAs and (soon) agents, this is the expensive one.

### 🎯 Top moves to climb a level

1. **Ship `/llms.txt`** — the single cheapest move. A 30-line file pointing at fleet, service tiers, and contact paths takes them from 0 → Level 1 on discoverability alone. ~1 hour of work.
2. **Publish an OpenAPI spec for the Owner Portal API** — the itinerary/booking API clearly exists (it powers the app and the TripIt integration). Documenting it at `/openapi.json` is the foundation for everything else and earns real Agent-capabilities points.
3. **Wrap the top owner action — "get my upcoming itinerary" — as one authenticated MCP tool.** This is the smallest-experiment play: the most-used operation, verb-first, typed, behind OAuth. It's exactly the gap a mobile-app UX research effort should be circling — let the owner's agent fetch the itinerary and surface it wherever the owner already is.

### Reference

Framework: <https://agentsfirst.dev/principles/>
Glossary: <https://agentsfirst.dev/glossary/>
