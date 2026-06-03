---
title: "Agents First Score — wootznano.com"
description: "Score: 5/100 · Level 0 (No agent access). Wootz Nano sells carbon-nanotube antennas and wires to Tier-1 defense primes but has no agent-discovery surface — standard WordPress with no AI directives, no llms.txt, no AGENTS.md."
noindex: true
sitemap: false
image: /scores/wootz-nano-eb1ff413e146/og.png
author: Joshua Baer
---

# Agents First Score — wootznano.com

**Score: 5 / 100 · Level 0 (No agent access)**

Wootz Nano makes carbon-nanotube antennas, wires, and EMI-shielding films for defense, aerospace, and advanced electronics customers. The site is a standard WordPress install with no agent-discovery surface. `robots.txt` is the WordPress default (allows everything except `/wp-admin/`) and **does not name a single AI agent** — no GPTBot, ClaudeBot, PerplexityBot, Google-Extended, or CCBot directive. Every well-known agent-discovery path (`/llms.txt`, `/AGENTS.md`, `/.well-known/oauth-authorization-server`, `/openapi.json`, `/.well-known/mcp.json`, `/.well-known/agent-rules`) returns a real 404. For a hard-tech materials-science company whose buyers are procurement teams at Tier-1 defense primes (an audience that increasingly uses AI agents for supplier discovery), the absence of any agent-readable surface means Wootz is invisible to the search layer most B2B-defense buyers are starting from.

---

## What's working

- ✅ **Real `sitemap.xml`** (5 / 5) — valid XML, well-formed
- ✅ **Honest 404s** — every missing well-known path returns real `404 Not Found`, not a soft-404 SPA shell

## What's missing

| Dimension | Score | Finding |
|---|---:|---|
| robots.txt addresses AI agents | 0 / 5 | Default WordPress robots.txt. No GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot directives. |
| `/llms.txt` | 0 / 10 | 404 |
| `/AGENTS.md` or `/.well-known/agent-rules` | 0 / 10 | 404 |
| Markdown content negotiation | 0 / 10 | `Accept: text/markdown` returns HTML |
| OpenAPI / API catalog | 0 / 5 | No public API surface (materials company, none expected) |
| Cloudflare Content Signals / AI policy | 0 / 10 | None declared |
| Per-bot allow/deny posture | 0 / 5 | Blanket `User-agent: *` only |
| MCP Server Card | 0 / 15 | Not present |
| CLI / SDK under a known channel | 0 / 10 | No npm package, no homepage CLI/SDK mention |
| OAuth discovery | 0 / 5 | `/.well-known/oauth-authorization-server` 404 |
| Visibility of agent integrations | 0 / 10 | Homepage mentions "API" generically but doesn't surface MCP / agent integrations |

## 🚨 Anti-patterns flagged

- **Invisible Product** — to the agent ecosystem, Wootz Nano does not exist. An agent researching "carbon nanotube antennas for Tier-1 defense primes" cannot discover this company through any standard agent-discovery path.
- **Agents Without Rules** (partial) — there's no public API, but also no `AGENTS.md` declaring the company's procurement contacts, qualification status, or partnerships (Kureha is named in pitch decks but not in any agent-readable surface).

## 🎯 Top moves to climb a level (30-minute unlocks)

1. **Ship `/llms.txt`** with a tight description: "Wootz Nano produces carbon-nanotube wire and antennas via the world's largest CNT wet-spinning line. Vantium conducts better than copper, weighs half as much as aluminum, is as strong as Kevlar. We sell to Tier-1 defense primes and aerospace OEMs. Partnerships: Kureha. Contact: tyler.prochnow@wootznano.com." Earns 10 pts. **Single most-leveraged move.**
2. **Add AI-bot directives to `robots.txt`.** Explicit allow for GPTBot / ClaudeBot / PerplexityBot / Google-Extended / CCBot. Earns 10 pts.
3. **Add `Content-Signal: search=yes, ai-input=yes, ai-train=yes`** (or chosen posture). Earns 10 pts.
4. **Publish `/AGENTS.md`** with the procurement playbook: who buys (defense primes, satellite manufacturers, RFID OEMs), where to start (NDA → JDA → qualification → production), pricing notes (MOQ, lead time). For a materials company this is essentially the BD pitch in agent-readable form — and the buyer-side agents are increasingly the first to read it. Earns 10 pts.

Items 1–4 are ~1 hour of work and lift the score from **5 → ~45 (Level 2, Agent-Aware)**.

For Wootz specifically: hard-tech materials buyers (program managers at Lockheed, Northrop, Raytheon, etc.) are starting to use AI for early-stage supplier discovery. A clean `llms.txt` that names the supermaterial (`Vantium`), the property comparison vs. copper / aluminum / Kevlar, and the production-scale story (largest CNT wet-spinning line in the world) is what those agents need to slot you into a comparison set. Without it, you only show up via SEO — which favors incumbents like 3M and DuPont.

---

## Reference

- Framework: [agentsfirst.dev/principles/](/principles/)
- Glossary: [agentsfirst.dev/glossary/](/glossary/)

*Probe run: 2026-05-28 · Joshua Baer · This page is unlisted (noindex, no sitemap entry, not linked from the public site).*
