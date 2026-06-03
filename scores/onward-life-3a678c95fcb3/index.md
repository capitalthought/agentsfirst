---
title: "Agents First Score — onward.life"
description: "Score: 15/100 · Level 1 (Agent as Afterthought). Onward is a consumer divorce-companion web app an agent can read about via a Yoast llms.txt but cannot use — no AGENTS.md, no MCP server, no markdown negotiation."
noindex: true
sitemap: false
image: /og-image.png
author: Joshua Baer
---

# Agents First Score — onward.life

**Score: 15 / 100 · Level 1 (Agent as Afterthought)**

Onward is a consumer divorce-companion web app, and to an agent it's almost a closed door. The one bright spot: a Yoast-generated `llms.txt` that maps the content. Everything an agent could *act* on — an interface, a contract, structured discovery, auth — is absent. It's a website that an agent can *read about* but cannot *use*.

## What's working

- ✅ **`/llms.txt` present** (10/10 discoverability) — 4KB Yoast-generated content map with page/post summaries. The single most agent-friendly thing on the site.
- ✅ **Sitemap declared** (5/5) — `robots.txt` points to `www.onward.life/sitemap_index.xml`; allow-all crawl posture (`Disallow:` empty).

## What's missing

- ❌ **No `/AGENTS.md` or `/.well-known/agent-rules`** (0/10) — no usage contract; an agent has no rules, identifiers, or sequencing to follow.
- ❌ **No markdown content negotiation** (0/10) — requesting `text/markdown` returns HTML. Agents parse 196KB of WordPress markup instead of clean text.
- ❌ **No agent capabilities at all** (0/30) — no MCP Server Card (`/.well-known/mcp` → 404), no CLI/SDK, no OAuth/PKCE discovery (`/.well-known/oauth-authorization-server` → 404).
- ❌ **No agent-integration visibility** (0/10) — homepage never mentions MCP / CLI / SDK; "API" appears only generically.
- ❌ **No deliberate bot posture** (0/15) — allow-all isn't an AI policy; no Content Signals, no per-bot allow/deny.

## 🚨 Anti-patterns flagged

- **The Invisible Product** — zero agent interface. No MCP, no CLI, no SDK, no `AGENTS.md`. Onward's actual value (divorce finances, legal checklists, co-parenting tools) is exactly what an agent should be able to invoke on a user's behalf — and right now it can't touch any of it.

## 🎯 Top moves to climb a level

1. **Serve `text/markdown` via content negotiation** — when an agent sends `Accept: text/markdown`, return clean markdown instead of 196KB of HTML. +10 pts, near-zero effort on WordPress with a plugin/edge worker.
2. **Publish `/AGENTS.md`** — a hand-authored ~50-line contract (what Onward is, what an agent may do for a user, how to identify a case/task). +10 pts, escapes "Agents Without Rules."
3. **Ship a small MCP server** — 5–8 verb-first tools wrapping the core jobs (`get_divorce_checklist`, `log_expense`, `find_local_attorney`, `track_deadline`). Publish a Server Card at `/.well-known/mcp`. This is the Level 1 → 3 leap — it's what makes Onward *exist* to the agent ecosystem and kills the Invisible Product flag. +15 pts + the discoverability that follows.
4. **OAuth-with-PKCE discovery** — once tools touch a user's case data, expose `/.well-known/oauth-authorization-server`. +5 pts and the security model agents expect.

## Reference

Framework: <https://agentsfirst.dev/principles/> · Glossary: <https://agentsfirst.dev/glossary/>
