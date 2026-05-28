---
title: "Agents First Score — tiaminetworks.com"
description: "Score: 5/100 · Level 0 (No agent access). Tiami Networks is a federally-funded passive-radar / 5G-sensing company with no agent-discovery surface — generic WordPress robots.txt, no llms.txt, no AGENTS.md, no OpenAPI."
noindex: true
sitemap: false
image: /og-image.png
author: Joshua Baer
---

# Agents First Score — tiaminetworks.com

**Score: 5 / 100 · Level 0 (No agent access)**

Tiami Networks is a federally-funded passive-radar / 5G-sensing company with no agent-discovery surface. The site is a standard WordPress install. `robots.txt` is the WordPress default (allows everything except `/wp-admin/`) and **does not name a single AI agent** — no GPTBot, ClaudeBot, PerplexityBot, Google-Extended, or CCBot directive. Every well-known agent-discovery path (`/llms.txt`, `/AGENTS.md`, `/.well-known/oauth-authorization-server`, `/openapi.json`, `/.well-known/mcp.json`, `/.well-known/agent-rules`) returns a real 404 (honest, not soft-404). There's no public API and no SDK to expose. For a deep-tech company with $8M in federal contracts and four Tier-1 carriers as customers, the absence of even a basic `llms.txt` saying *"we make passive-radar drone-detection software, here's our solution architecture, here's how to contact us"* is a missed agent-discoverability opportunity.

---

## What's working

- ✅ **Real `sitemap.xml`** (5 / 5) — valid XML, well-formed
- ✅ **Honest 404s** — every missing well-known path returns real `404 Not Found`, not a soft-404 SPA shell (better integrity than most sites)

## What's missing

| Dimension | Score | Finding |
|---|---:|---|
| robots.txt addresses AI agents | 0 / 5 | Default WordPress robots.txt. No GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot directives. |
| `/llms.txt` | 0 / 10 | 404 |
| `/AGENTS.md` or `/.well-known/agent-rules` | 0 / 10 | 404 |
| Markdown content negotiation | 0 / 10 | `Accept: text/markdown` returns HTML |
| OpenAPI / API catalog | 0 / 5 | No public API surface |
| Cloudflare Content Signals / AI policy | 0 / 10 | None declared |
| Per-bot allow/deny posture | 0 / 5 | Blanket `User-agent: *` only |
| MCP Server Card | 0 / 15 | Not present |
| CLI / SDK under a known channel | 0 / 10 | No npm package, no homepage CLI/SDK mention |
| OAuth discovery | 0 / 5 | `/.well-known/oauth-authorization-server` 404 |
| Visibility of agent integrations | 0 / 10 | Homepage mentions "API" generically but doesn't surface MCP / agent integrations |

## 🚨 Anti-patterns flagged

- **Invisible Product** — to the agent ecosystem, Tiami Networks does not exist. An agent asked "who's doing 5G-based passive radar for federal customers" cannot discover this company through any standard agent-discovery path.
- **Agents Without Rules** (partial) — there's no public API to govern yet, but there's also no `AGENTS.md` declaring intent, scope, or contact patterns for agents researching the company.

## 🎯 Top moves to climb a level (30-minute unlocks)

1. **Add AI-bot directives to `robots.txt`.** Even an explicit allow — `User-agent: GPTBot / ClaudeBot / PerplexityBot / Google-Extended / CCBot — Allow: /` — clarifies posture and gets named in the AI training/retrieval pipelines. Earns 10 pts.
2. **Ship `/llms.txt`** with three lines: what Tiami does, who its customers are (DHS, Air Force, Army, Space Force, AT&T/Verizon/Comcast/T-Mobile), where the product docs live. ~5 minutes of WordPress edits. Earns 10 pts. **Single most-leveraged move.**
3. **Add `Content-Signal: search=yes, ai-input=yes, ai-train=yes`** to `robots.txt` (or whatever posture matches the actual training-data preference). Earns 10 pts and clarifies stance.
4. **Publish `/AGENTS.md`** — even 30 lines is enough for a federal-tech company: "Tiami sells passive-radar drone-detection software running on existing cellular infrastructure. We work with DHS, USAF, US Army, US Space Force, and Tier-1 US carriers. For procurement inquiries, contact tjunius@tiaminetworks.com. For technical evaluations, request a NDA via the contact form." Earns 10 pts and addresses the *Agents Without Rules* flag.

Items 1–4 are ~1 hour of work total and lift the score from **5 → ~45 (Level 2, Agent-Aware)**.

For Tiami specifically: as a federal contractor, an `AGENTS.md` that names the company's role-based contacts (procurement, FedRAMP, partnerships) helps agents researching the federal vendor pool. That's a real business asset, not just a hygiene check.

---

## Reference

- Framework: [agentsfirst.dev/principles/](/principles/)
- Glossary: [agentsfirst.dev/glossary/](/glossary/)

*Probe run: 2026-05-28 · Joshua Baer · This page is unlisted (noindex, no sitemap entry, not linked from the public site).*
