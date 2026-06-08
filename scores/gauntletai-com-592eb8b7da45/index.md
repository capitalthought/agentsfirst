---
title: "Agents First Score — gauntletai.com"
description: "Score: 10/100 · Level 0 (No agent access). An elite AI engineering program whose own website is invisible to agents — one llms.txt and nothing else: no AGENTS.md, no MCP card, no sitemap, no API to call."
noindex: true
sitemap: false
image: /scores/gauntletai-com-592eb8b7da45/og.png
author: Joshua Baer
brand_domain: gauntletai.com
---

## Agents First Score — gauntletai.com

**Score: 10/100 · Level 0 (No agent access) 🔴**

An elite *AI engineering* program whose own website is effectively invisible to agents. The one thing Gauntlet shipped — an `/llms.txt` — is a crawler allow/deny policy with a paragraph description, not a navigation map an agent could use to answer "how do I apply?" Past that single file, every agent-facing path (`sitemap.xml`, `AGENTS.md`, `/.well-known/mcp`, `openapi.json`) 404s, and `robots.txt` is a generic `User-agent: *` that never addresses AI crawlers by name. There's no tool surface, no MCP server, no API an agent could call.

### What's working

- ✅ **llms.txt exists** (10/25 Discoverability) — real file, `text/plain`, 1,347 bytes. Includes a usable site description and per-subdomain allow/deny (`apply.` allowed, `labs.` disallowed). It's the only reason this isn't a flat zero.

### What's missing

- ⚠️ **Bot access control** (0/15) — `robots.txt` greets nobody specifically. No GPTBot / ClaudeBot / PerplexityBot stanzas, no Content-Signals, no per-bot posture.
- ⚠️ **Content accessibility** (0/20) — no `sitemap.xml` (it's literally commented out in their robots.txt), no markdown content negotiation, no OpenAPI.
- ⚠️ **Agent capabilities** (0/30) — no MCP Server Card, no CLI/SDK, no OAuth discovery. An agent has zero way to *act* — only to read a description.
- ⚠️ **Visibility** (0/10) — nothing in their public surface says "here's how an agent uses us."
- ⚠️ **No AGENTS.md / agent-rules** — no machine-readable contract for the apply flow.

### 🚨 Anti-patterns flagged

- **The Invisible Product** — zero agent interface. No MCP, no CLI, no SDK, no AGENTS.md. For a program selling AI-first engineering, the website itself is a Level-0 artifact — an agent asked "apply me to Gauntlet" can't do anything but read a blurb.

### 🎯 Top moves to climb a level

1. **Name the AI bots in `robots.txt`** — explicit `User-agent: GPTBot / ClaudeBot / PerplexityBot` allow stanzas. ~10 lines, earns **+5** (Discoverability) **+5** (Bot control) → instantly off Level 0.
2. **Ship the `sitemap.xml`** — it's already half-wired (commented in robots). Uncomment + generate. **+5** Content.
3. **Add `/AGENTS.md`** — the apply-flow rules + canonical URLs (program page, `apply.gauntletai.com`, FAQ, deadlines). **+10** Discoverability, and it's the single most useful file for the "how do I apply" agent query.
4. **Turn the llms.txt into a real map** — keep the policy, but add a links section (program, apply, curriculum, placement stats) so an agent can navigate, not just read a sentence.

Steps 1–3 alone move gauntletai.com from **10 → ~35 (Level 2, Agent-Aware)** in well under an hour of work.

### Reference

Framework: <https://agentsfirst.dev/principles/> · Glossary: <https://agentsfirst.dev/glossary/>
