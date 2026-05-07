---
title: "Agents First Score — agentmail.to"
description: "Score: 50/100 · Level 2 (Agent-Aware). Built for agents in spirit; the discovery surfaces an outside agent uses to find them haven't kept up with the product mission."
noindex: true
sitemap: false
image: /scores/agentmail-to-db5578bf8dd3/og.png
author: Joshua Baer
---

# Agents First Score — agentmail.to

**Score: 50/100 · Level 2 (Agent-Aware)** — at the top of the level, two moves from Level 3.

This is one of the most honest cases I've scored. **The product is built for agents** (literal tagline: "Email Inboxes for AI Agents"). The `/llms.txt` is excellent — agent-targeted, gives step-by-step `curl` instructions for sign-up, sets `AGENTMAIL_API_KEY` expectations, names what to do when sign-up fails. This is what dogfooding looks like. But the *distribution surfaces* an outside agent uses to discover them haven't kept up with the product mission — no MCP server card, no AGENTS.md, no per-bot robots.txt, no OAuth flow. They're publishing for agents but not yet *callable* by agents in the way the protocol expects.

### What's working

- ✅ **Content accessibility** (20/20) — `/llms.txt` (11KB, real instructions), `/llms-full.txt` (35KB, longer-form), `/sitemap.xml` (7KB), `/openapi.json` at root (43 endpoints, structured `BearerAuth`). Markdown content negotiation works (`Accept: text/markdown` returns `text/markdown; charset=utf-8`).
- ✅ **Visibility of agent integrations** (10/10) — homepage H1 is literally "Email Inboxes for AI Agents." `/llms.txt` opens with "If you are an AI agent and need email, follow these steps in order." That's the agent-as-primary-customer posture the framework asks for.
- ✅ **CLI/SDK channel** (10/30) — "SDK docs and API reference: https://agentmail.to/docs" published; OpenAPI spec is downloadable and well-typed.

### What's missing

- ⚠️ **MCP Server Card** (0/15 of 30) — no `/.well-known/mcp-server-card`. For a product whose entire pitch is "an email API for AI agents," this is the missing front door. See [The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product) — except *only* on the MCP discovery surface.
- ⚠️ **AGENTS.md** (0/10 of Discoverability) — `/llms.txt` is a *reading index* (per llmstxt.org). [`AGENTS.md`](https://agentsfirst.dev/glossary/#agents-md) is the *contract* (permissions, sequence, errors, anti-patterns). Both can coexist. Right now the rules-of-engagement live inside `/llms.txt` comments, not in the canonical contract file. See [Contract First](https://agentsfirst.dev/principles/contract-first/).
- ⚠️ **Per-bot robots.txt** (0/5 of Discoverability + 0/15 of Bot Access Control) — current robots.txt is the generic 70-byte `User-agent: *` allow-all. No named-bot rules, no Cloudflare `Content-Signal` directive. For a product courting AI agents specifically, the bot file should be the *most* explicit on the internet.
- ⚠️ **OAuth 2.0 with PKCE discovery** (0/5) — BearerAuth-only, no `/.well-known/oauth-authorization-server`. Acceptable for a v0 — most agent SDKs handle bearer tokens fine — but blocks the Level-4 dimension long-term.

### 🚨 Anti-patterns flagged

**None of the seven classic anti-patterns apply cleanly.** AgentMail is genuinely an Agents-First product *in spirit*. The closest soft hit is **partial Invisible Product on the discovery layer** — not because the product is invisible (the homepage announces "for AI agents"), but because the *machine-discovery surfaces* don't yet broadcast the agent capability. An agent crawling `/.well-known/mcp-server-card` finds nothing; one reading `/llms.txt` finds everything. Mixed signal.

### 🎯 Top moves to climb a level

1. **Ship an MCP server.** Highest leverage by far. AgentMail is the textbook use case: tools `create_inbox`, `send`, `reply`, `read_thread`, `search`, `archive`, `webhook_subscribe` map directly to verb-first MCP tools. ~50–80 LOC over the existing API. Earns 15 pts (Agent capabilities) and lifts the score from 50 → 65, putting them at Level 3. Distribute as `npx @agentmail/mcp-server` and as a hosted endpoint at `agentmail.to/mcp`. Reference: [Interface First](https://agentsfirst.dev/principles/interface-first/).

2. **Add `/AGENTS.md` alongside `/llms.txt`.** Convert the "Step 0 / Step 1 / Step 2" sign-up flow at the top of `/llms.txt` into a proper [`AGENTS.md`](https://agentsfirst.dev/glossary/#agents-md): sections for Permissions, Sequence, Identifiers, Errors, Visible Outputs. Earns 10 pts (Discoverability). And makes the file findable by agents that look for the canonical contract location instead of the reading index. Reference: [Contract First](https://agentsfirst.dev/principles/contract-first/).

3. **Sharpen `/robots.txt` for the audience.** Replace the 70-byte generic with explicit `User-agent: GPTBot/anthropic-ai/ClaudeBot/...` Allow blocks plus a `Content-Signal: ai-train=yes, ai-input=yes, search=yes` directive (Cloudflare's emerging convention). Earns 5 pts (Discoverability) + 10 pts (Bot Access Control). Trivial cost. For a product that wants every named AI bot reading them, this is just declaring it.

After all three: **estimated score ~85/100 · Level 3 (Agents First)**, with the right cell of the rubric being the only one shy (Multi-Model Verification + Perspective Dispatch are codebase principles, irrelevant for the website-facing rubric).

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- Live scorer: <https://agentsfirst.dev/mcp>
- Methodology: rubric v0.1.2 (open-source at [`tools/agentsfirst-mcp/src/score.ts`](https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts))
