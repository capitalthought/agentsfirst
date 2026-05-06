---
title: "Agents First Score — officernd.com"
description: "Score: 13/100 · Level 1 (Agent as Afterthought). OfficeRnD is the third coworking-platform scoring low for the same reason: agent-callable product exists, marketing root has no discovery breadcrumbs."
noindex: true
sitemap: false
image: /og-image.png
author: Joshua Baer
---

## Agents First Score — officernd.com

**Score: 13/100 · Level 1 (Agent as Afterthought)**

OfficeRnD is the third sales/coworking-platform in a row that scores low for the same reason: the agent-callable product exists underneath (API documented, developer portal at `developer.officernd.com`, homepage names "API"), but the discovery breadcrumbs from the marketing root are absent in every direction. The robots.txt is 130 bytes with only a `/wp-admin/` and `/?blackhole` Disallow — no Content-Signal, no named-AI-bot rules, and the `Crawl-delay: 1` says they care about server load but haven't thought about AI policy.

### What's working

- ✅ **Sitemap.xml** (5/5 of Content Accessibility) — 1.7 KB index pointing at the site map. Conventional structure.
- ✅ **Homepage names "API"** + developer portal exists at `developer.officernd.com` (200 OK) — out of band of the rubric's scoring (the probe doesn't auto-follow subdomains), but a real asset waiting to be surfaced. Worth ~3/10 partial visibility credit since the API is at least named on the marketing page.

### What's missing

- ⚠️ **No `/llms.txt`** (0/10 of Discoverability) — single highest-leverage missing artifact. Would route any agent crawling the homepage straight at `developer.officernd.com`.
- ⚠️ **No `/AGENTS.md` or `/.well-known/agent-rules`** (0/10 of Discoverability) — no contract-style file describing how an agent should act on behalf of a coworking-space operator (which is the entire customer base — the people running the space don't actually do the day-to-day clicking; their agents will).
- ⚠️ **No `/.well-known/mcp-server-card`** (0/15 of Agent Capabilities) — OfficeRnD is a clean MCP-tool target: `book_resource`, `check_in_member`, `create_invoice`, `list_visitors_today`, `assign_door_access`, `cancel_booking`. None of those tools are advertised at machine-readable URLs.
- ⚠️ **No Content-Signal directive, no named-AI-bot rules** (0/15 of Bot Access Control) — robots.txt addresses zero AI bots. Same robots.txt could pass for a 2014 WordPress site; nothing about it acknowledges 2026.
- ⚠️ **No markdown content negotiation, no OpenAPI at standard paths** (0/15 combined of Content Accessibility) — the API exists; the spec just isn't reachable at `/openapi.json` or `/api/openapi.json`.

### 🚨 Anti-patterns flagged

- **[The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — partial. The product exists; the API exists; the developer portal at `developer.officernd.com` is a real, well-maintained asset. The agent ecosystem doesn't know any of it from a cold crawl. *Build the inside, don't build the door.* Same shape as Mixmax, PandaDoc, Bizzabo — call it the SaaS-API-with-no-discovery pattern.

### 🎯 Top moves to climb a level

For a coworking platform, every one of these is high-leverage — autonomous agents managing memberships, bookings, and access on behalf of operators is exactly the wedge case. Operators don't want to log into yet another dashboard.

1. **Ship `/llms.txt` pointing at `developer.officernd.com`.** ~5 minutes. Earns 10 pts (Discoverability) and routes any agent crawling the homepage into the actual API documentation. Reference: [Interface First](https://agentsfirst.dev/principles/interface-first/).
2. **Publish `/.well-known/mcp-server-card.json`** declaring the OfficeRnD MCP server (whether it exists today or is built next). The tool surface maps cleanly to the existing API: `book_resource`, `check_in_member`, `create_invoice`, `list_visitors`, `assign_door_access`. ~30 LOC over the existing API. Earns 15 pts (Agent Capabilities) and lifts to Level 2 territory. Reference: [Interface First](https://agentsfirst.dev/principles/interface-first/).
3. **Modernize `/robots.txt`.** Add a Content-Signal directive (`Content-Signal: ai-train=…, ai-input=…, search=…`) plus explicit allow/deny for GPTBot, ClaudeBot, anthropic-ai, Google-Extended, etc. One line of Content-Signal + 6 lines of per-bot rules. Earns 10 pts (Bot Access Control). Trivial cost; signals the product knows what year it is. Reference: [Contract First](https://agentsfirst.dev/principles/contract-first/).

After all three: estimated **45–55/100 · Level 2** — same product, just visible.

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- Live scorer: <https://agentsfirst.dev/mcp>
- Methodology: rubric v0.1.2. The probe scores `officernd.com` directly and does not auto-follow subdomains; `developer.officernd.com` (singular form) and `app.officernd.com` are real, reachable, and meaningful but not credited at the headline. v0.1.3 of the rubric should walk the homepage's outbound links to detect named developer subdomains automatically.
