---
title: "Agents First Score — really.com"
description: "Score: 0/100 · Level 0 (No agent access). really.com is the maximum-strength version of the Invisible Product anti-pattern: not just absent from the agent surface, but actively hostile to it."
noindex: true
sitemap: false
image: /og-image.png
author: Joshua Baer
---

# Agents First Score — really.com

**Score: 0 / 100 · Level 0 (No agent access)**

really.com is the maximum-strength version of the *Invisible Product* anti-pattern: not just absent from the agent surface, but actively hostile to it. The homepage itself returns **403 + Cloudflare "Just a moment…" challenge** to any non-browser user agent, so the probe couldn't even read what really.com *is*. `robots.txt` is 26 bytes — `User-agent: * / Disallow: /` — a blanket deny that names no AI agent specifically. Every well-known agent path either 404s or 403s. There is no `/llms.txt`, no `/AGENTS.md`, no MCP Server Card, no OpenAPI spec, no OAuth discovery, no SDK or CLI mention anywhere reachable. An AI agent encountering this domain learns: "you are not welcome here, and we will not tell you what we are."

---

## What's working

- ✅ **Honest 404s on truly missing paths** (no points, partial credit) — `/llms.txt`, `/.well-known/mcp.json`, `/.well-known/agent-rules`, etc. return real `404 Not Found` instead of soft-200s. Higher integrity signal than what most sites manage. Rules out the SPA Soft-404 Trap.

## What's missing

| Dimension | Score | Finding |
|---|---:|---|
| robots.txt addresses AI agents | 0 / 5 | Blanket `Disallow: /` only. No GPTBot, ClaudeBot, Perplexity, Google-Extended, or CCBot directive. |
| `/llms.txt` | 0 / 10 | 404 |
| `/AGENTS.md` or `/.well-known/agent-rules` | 0 / 10 | 403 / 404 |
| Markdown content negotiation | 0 / 10 | Request blocked at edge with 403 |
| `sitemap.xml` | 0 / 5 | 403 — Cloudflare challenge |
| OpenAPI / API catalog discoverable | 0 / 5 | 403 / 404 |
| Cloudflare Content Signals / AI policy | 0 / 10 | None declared. Implementation says "deny all," but no stated policy. |
| Per-bot allow / deny posture | 0 / 5 | Blanket-deny, not per-bot |
| MCP Server Card | 0 / 15 | Not present |
| CLI / SDK under known channel | 0 / 10 | None reachable |
| OAuth discovery | 0 / 5 | `/.well-known/oauth-authorization-server` 404 |
| Visibility of agent integrations | 0 / 10 | Homepage itself unreachable to non-browsers |

## 🚨 Anti-patterns flagged

- **Invisible Product** — maximally applies. No MCP, no SDK, no AGENTS.md, no llms.txt, no OpenAPI. Nothing.
- **Hostile to Agents** (worth naming, not in the canonical list) — Cloudflare Bot Management 403s every non-browser request to the *homepage*. Even agents trying to read public marketing copy get bounced. Stricter than blocking; this is "we will not even tell you who we are."
- **Implicit Policy** — the deny posture is implemented in robots.txt + bot management but never *stated* (no AI-specific declaration). Agents have to infer "I'm blocked" instead of being told why.

## 🎯 Top moves to climb a level

1. **Pick and state an AI posture in `robots.txt`.** Even an explicit deny — `User-agent: GPTBot / ClaudeBot / Perplexity-User / Google-Extended / CCBot — Disallow: /` — is a giant improvement over blanket `*`. Earns 5 + 5 = 10 pts because it (a) addresses agents by name and (b) shows per-bot intent rather than blanket-deny.
2. **Allow verified bots through Cloudflare Bot Management.** If the intent is "humans only, we don't care about agents," fine — but at minimum let `sitemap.xml`, `/llms.txt`, and `/robots.txt` return 200 to declared AI agents so they can read your stated policy. Right now agents see 403 on every URL except `/robots.txt` and conclude the site is dead.
3. **Ship `/llms.txt`** with three lines: what really.com is, who it's for, where the public docs live. ~5 minutes of work, earns 10 pts, and ensures any agent that does break through learns something useful instead of nothing.
4. **Decide whether agents are customers.** If yes → publish OpenAPI, AGENTS.md, eventually an MCP server. If no → say so explicitly and the score doesn't matter; the implicit-deny implementation today is hostile and unprofessional, not strategic.

Items 1–3 are ~1 hour of work and lift the score from **0 → ~25 (Level 1, Agent as Afterthought)**. Item 4 is the real strategy decision; everything else follows from it.

---

## Reference

- Framework: [agentsfirst.dev/principles/](/principles/)
- Glossary: [agentsfirst.dev/glossary/](/glossary/)

*Probe run: 2026-05-06 · Joshua Baer · This page is unlisted (noindex, no sitemap entry, not linked from the public site).*
