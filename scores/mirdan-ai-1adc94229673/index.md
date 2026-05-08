---
title: "Agents First Score — mirdan.ai"
description: "Score: 45/100 · Level 2 (Agent-Aware). Mirdan has the bones of an Agents First product — llms.txt, ai-plugin.json, named-bot robots.txt, MCP + CLI on the homepage. Missing the contract layer: no AGENTS.md."
noindex: true
sitemap: false
image: /scores/mirdan-ai-1adc94229673/og.png
author: Joshua Baer
---

# Agents First Score — mirdan.ai

**Score: 45/100 · Level 2 (Agent-Aware) 🎯**

Mirdan has the bones of an Agents First product — they publish `/llms.txt` + `/llms-full.txt`, ship an `ai-plugin.json`, address 8 AI agents in robots.txt, and the homepage explicitly promotes MCP + CLI alongside human onboarding (perfect 10/10 on Visibility). What's missing is the **contract layer**: no AGENTS.md, no MCP Server Card. They're inviting agents in but haven't written the rules. That gap is the difference between Level 2 and Level 3.

## What's working

- ✅ **Visibility of agent integrations** (10/10) — homepage promotes MCP + CLI as a peer to the human signup flow. Most products this side of Stripe still bury this.
- ✅ **/llms.txt + /llms-full.txt published** — useful belt-and-suspenders, even though the rubric weights it as optional now (rubric v0.3.0).
- ✅ **/.well-known/ai-plugin.json present** — OAuth / AI-plugin auth-server discovery works, agents can find the plugin manifest.
- ✅ **robots.txt addresses 8 named AI agents** — GPTBot, anthropic-ai, Claude-Web, Google-Extended, PerplexityBot, Bytespider, CCBot, cohere-ai. Per-bot posture, not a blanket rule.
- ✅ **sitemap.xml published** — discoverable site structure for crawlers.

## What's missing

- ❌ **No /AGENTS.md or /.well-known/agent-rules** — the load-bearing contract artifact. This is the single biggest gap and the reason an "Agents Without Rules" anti-pattern is firing.
- ❌ **No MCP Server Card** — neither `/.well-known/mcp-server-card.json` nor `/agents.json` is published. If they have a real MCP server, agents can't auto-discover it.
- ❌ **No markdown content negotiation** — `Accept: text/markdown` returns `text/html`. Worth ~10 pts and ~30 lines of server config.
- ❌ **No discoverable OpenAPI surface** — no `/openapi.json`, no `/api/openapi.json`, etc. Agents can't introspect endpoints.
- ⚠️ **No Content-Signal directive in robots.txt** — they're addressing 8 bots individually, which is good, but pairing with a `Content-Signal: ai-train=...` line gives one machine-readable, future-proof line instead of N per-bot rules.
- ⚠️ **`User-agent: *` blanket disallow alongside the named-bot rules** — semantically intentional but worth double-checking it doesn't accidentally block well-behaved agents that don't match any of the 8 named UAs.

## 🚨 Anti-patterns flagged

- **[Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules)** — homepage advertises MCP + CLI access, but no AGENTS.md exists at the root or under `/.well-known/`. Agents discover the capability but find no permissions, sequencing rules, identifiers, or error contract. This is the inverse of Stripe's setup, where the docs *are* the contract; Mirdan needs an explicit rules file or risks every agent inventing its own usage pattern.

## 🎯 Top moves to climb a level

1. **Publish `/AGENTS.md`** — biggest single gap (+10 pts on its own, plus closes the Agents Without Rules flag, plus unlocks the +5 sections bonus). Aim for ~50 hand-written lines covering Permissions, Required Prep, Identifiers, Sequence, and Errors. **Do not** auto-generate it from the codebase — see [The Token Dump](https://agentsfirst.dev/glossary/) anti-pattern.

2. **Publish `/.well-known/mcp-server-card.json`** — +15 pts. If a real MCP server is shipping, this is the one file that lets every agent ecosystem auto-discover it. Reference it from the existing homepage MCP section.

3. **Serve markdown when asked** — +10 pts, ~30 lines of code. A Cloudflare Worker or Express middleware that checks `Accept: text/markdown` and returns the page-source markdown gets agents the actual content instead of HTML scaffolding they have to parse.

4. **Add a `Content-Signal:` directive to robots.txt** — +10 pts on bot access control. Format: `Content-Signal: ai-train=yes, search=yes, ai-input=yes` (or whatever the policy is). One line, machine-readable, replaces the future churn of maintaining N per-bot stanzas.

5. **Publish OpenAPI at `/openapi.json`** — +5 pts. If there's a public API behind any of this, the spec belongs at a discoverable URL agents can introspect.

The **+15 pts from #1 + #4** alone bumps mirdan from Level 2 → Level 3 (Agents First). The full set lands them around 80–85.

## Reference

- Framework: [agentsfirst.dev/principles/](https://agentsfirst.dev/principles/)
- Glossary: [agentsfirst.dev/glossary/](https://agentsfirst.dev/glossary/) (incl. the new Token Dump anti-pattern)
- Score this yourself: `npx -y @capitalthought/agentsfirst-mcp` (CLI) or `https://agentsfirst.dev/mcp` (hosted MCP — agents can call it directly)

---

*Scored 2026-05-08 against rubric v0.3.0. This is a private score page, not indexed by search engines. Re-run any time to see if the score moved.*
