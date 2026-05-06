---
title: "Agents First Score — angellist.com"
description: "Private agent-readiness audit of angellist.com against the Agents First framework — score, gaps, anti-patterns, and prioritized next moves."
noindex: true
sitemap: false
image: /og-image.png
author: Joshua Baer
---

# Agents First Score — angellist.com

**Score: 5 / 100 · Level 0 (No agent access)**

AngelList is invisible to agents. Every well-known agent-discovery path (`/llms.txt`, `/AGENTS.md`, `/.well-known/oauth-authorization-server`, `/openapi.json`, `/.well-known/mcp.json`) returns 200 with the SPA shell — a soft-404 that actively misleads any probing agent into thinking content exists. `robots.txt` blocks an oddball list of scrapers (voltron, BLEXBot, MJ12bot) but doesn't acknowledge a single AI agent (GPTBot, ClaudeBot, Perplexity, Google-Extended, CCBot). For a marketplace whose entire value prop is connecting investors to deals — i.e., a database that should be agent-queryable — the agent surface is empty.

---

## What's working

- ✅ **Sitemap** (5 / 5) — real `sitemap.xml` returns XML, lists primary pages with `lastmod` stamps
- ✅ **API exists somewhere** — homepage mentions "API" (the venture / rolling-funds platform has one) — it's just not discoverable via any standard agent path

## What's missing

| Dimension | Score | Finding |
|---|---:|---|
| robots.txt addresses AI agents | 0 / 5 | Zero AI directives. Cliqzbot is named; ClaudeBot, GPTBot, Perplexity-User are not. |
| `/llms.txt` | 0 / 10 | Soft-404 (SPA shell) |
| `/AGENTS.md` or `/.well-known/agent-rules` | 0 / 10 | Soft-404 |
| Markdown content negotiation | 0 / 10 | `Accept: text/markdown` returns HTML |
| OpenAPI / API catalog discoverable | 0 / 5 | `/openapi.json`, `/api/openapi.json`, `/v1/openapi.json` all soft-404 |
| Cloudflare Content Signals / AI policy | 0 / 10 | No AI-specific allow/deny posture |
| MCP Server Card | 0 / 15 | Not present |
| CLI / SDK under known channel | 0 / 10 | No npm package; homepage doesn't mention CLI / SDK |
| OAuth discovery | 0 / 5 | `/.well-known/oauth-authorization-server` soft-404 |
| Visibility of agent integrations | 0 / 10 | Homepage doesn't say "install our MCP server" or "use our CLI" |

## 🚨 Anti-patterns flagged

- **Invisible Product** — no MCP, no public agent SDK, no AGENTS.md, no llms.txt. To the agent ecosystem AngelList does not exist.
- **Agents Without Rules** — there's an API for venture operators, but no public contract document telling an agent how to use it (sequencing, permissions, identifiers, errors).
- **SPA Soft-404 Trap** (worth naming) — returning 200 + HTML for unknown well-known paths is worse than a real 404. A probing agent fetches `/llms.txt`, gets back 100 KB of HTML, and either chokes or ingests garbage. Configure the host to return real 404s for unknown paths.

## 🎯 Top moves to climb a level

1. **Stop returning 200 for unknown well-known paths.** Configure the SPA host to 404 anything outside the explicit route list. Costs ~zero, fixes the most embarrassing signal — that AngelList lies about having an llms.txt. No score change directly, but every other improvement below is invisible until this lands.
2. **Ship `/llms.txt`.** ~50 lines of markdown: what AngelList is, who it's for, link to public API docs, link to founder / investor onboarding flows, link to terms. Earns 10 pts. Highest-leverage single move.
3. **Update `robots.txt` to address modern AI agents.** At minimum: explicit `User-agent: GPTBot / ClaudeBot / Google-Extended / Perplexity-User / CCBot` blocks (allow or deny — pick a posture). Earns 5 + 5 = 10 pts and clarifies AngelList's stance on training data vs. live retrieval.
4. **Publish OpenAPI spec at `/openapi.json`.** AngelList has an API — expose it. Earns 5 pts and gives any agent a typed entrypoint instead of having to scrape the SPA.
5. **Ship `/AGENTS.md`.** Once an OpenAPI exists, write the contract: which endpoints are read-only, which require OAuth scopes, rate limits, identifier formats (slugs vs. IDs), error schema. Earns 10 pts and addresses the *Agents Without Rules* flag.

Doing items 1–5 lifts the score from **5 → ~50 (Level 2, Agent-Aware)** without writing a single line of agent-execution code. The MCP server, CLI, and multi-model verification capabilities are a separate, larger investment — but the discovery surface is cheap and AngelList is leaving it on the floor.

---

## Reference

- Framework: [agentsfirst.dev/principles/](/principles/)
- Glossary: [agentsfirst.dev/glossary/](/glossary/)

*Probe run: 2026-05-06 · Joshua Baer · This page is unlisted (noindex, no sitemap entry, not linked from the public site).*
