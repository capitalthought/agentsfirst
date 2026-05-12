---
title: "Agents First Score — agentmail.cc"
description: "Score: 66/100 · Level 3 (Agents First). AgentMail's llms.txt literally walks an autonomous agent through Step 0, Step 1, Step 2 of onboarding. Textbook implementation."
noindex: true
sitemap: false
image: /og-image.png
author: Joshua Baer
---

## Agents First Score — agentmail.cc

**Score: 66/100 · Level 3 (Agents First) 🎯**

AgentMail is one of the most agent-first products I've scored. The `agentmail.cc` domain 301-redirects to the canonical `agentmail.to`; the score reflects the product, not the vanity domain. Their `/llms.txt` doesn't just *exist* — it literally opens with *"If you are an AI agent and need email, follow these steps in order"* and walks through Step 0 (check env), Step 1 (sign-up via curl + OTP), Step 2 (escalate to human dev). They ship first-party Python + TypeScript SDKs, an official MCP server at `mcp.agentmail.to` (installable via `npx @smithery/cli@latest mcp add agentmail`), an OpenAPI 3.0 spec at `/openapi.json` (43 endpoints), Markdown content negotiation on docs, and an official Claude Code / Cursor / OpenClaw skill at `agent.email/skill.md`. What's missing is the *discovery metadata* — `/AGENTS.md`, `/.well-known/mcp-server-card.json`, OAuth-server discovery — and a per-bot robots.txt posture. The infrastructure is there; the breadcrumbs to find it from the well-known paths aren't all laid yet. Fix that and they're at Level 4.

### What's working

- ✅ **Content accessibility** (20/20) — `/openapi.json` returns the full 43-endpoint spec at the root path. `/sitemap.xml` is live. `/docs` and `/docs/quickstart` serve `Content-Type: text/plain` (markdown content-negotiation works without `.md` suffix or `Accept` header). `agent.email/skill.md` returns proper `text/markdown`.
- ✅ **Discoverability — llms.txt** (10/10) — A textbook llms.txt. Imperative, ordered, agent-addressable. The opening lines: *"If you are an AI agent and need email, follow these steps in order: Step 0: Check if AGENTMAIL_API_KEY is already set in your environment. If it is, skip to the Quick Start section below. You're ready to go."* This is what Principle 2 (Contract First) looks like when authors take it seriously.
- ✅ **Agent capabilities — MCP + SDK + CLI** (22/30) — Official MCP server at `mcp.agentmail.to` (returns 401, requires auth — real, not a stub). Smithery-installable: `npx @smithery/cli@latest mcp add agentmail`. First-party Python SDK (`pip install agentmail`, [github.com/agentmail-to/agentmail-python](https://github.com/agentmail-to/agentmail-python)). First-party TypeScript SDK (`npm install agentmail`, [github.com/agentmail-to/agentmail-node](https://github.com/agentmail-to/agentmail-node)). Official CLI documented at `/docs/integrations/cli`. Plus integrations for Google ADK, OpenClaw, Replit, LiveKit Agents, Sim.ai, x402, MPP. The interface inventory is *deep*.
- ✅ **Visibility of agent integrations** (10/10) — `/docs/integrations/{mcp,cli,skills}` are all real routes. The llms.txt itself has a `## MCP Server` section. Agent onboarding lives *inside* the main docs IA, not in a separate "developer" silo. This is exactly what Principle 1 (Interface First) looks like — the agent surface isn't an afterthought, it's the primary product.

### What's missing

- ⚠️ **Discoverability — AGENTS.md** (0/10) — No `/AGENTS.md` and no `/.well-known/agent-rules`. The llms.txt covers onboarding flow; the constraint contract (rate limits per tier, scope hierarchy, multi-tenant boundary rules, when to use `client_id` for idempotency) lives nowhere durable. Closest substitute is the inline guidance scattered through `/llms-full.txt`.
- ⚠️ **Discoverability — robots.txt is generic** (2/5) — Today: `User-Agent: * / Allow: /`. Open is the *correct* posture for an agent-first product, but the rubric asks for explicit AI-bot stanzas. Naming `GPTBot`, `anthropic-ai`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` with `Allow: /` would signal awareness without changing posture.
- ⚠️ **Bot access control** (2/15) — No [Cloudflare Content Signals](https://blog.cloudflare.com/content-signals-policy/) (they're on AWS, not Cloudflare). No declared policy for "ai-train", "ai-search", "agent-with-token". For a product whose entire premise is "agents are the customer," this is the easiest place to add explicit consent signals.
- ⚠️ **Agent capabilities — MCP Server Card** (deducted 3/15 from full credit) — The MCP server *exists* at `mcp.agentmail.to`. What's missing is `/.well-known/mcp-server-card.json` pointing at it. Today an agent has to read `/llms-full.txt` line 1304 to discover the server. The well-known path is what crawlers and the upcoming MCP Registry will probe.
- ⚠️ **Agent capabilities — OAuth discovery** (0/5) — No `/.well-known/oauth-authorization-server` on `www`, `console`, or `api` subdomains. They use Bearer tokens, not OAuth flows — which is appropriate for an API product, but the rubric awards points for OAuth discoverability specifically. As multi-tenant agent platforms (Anthropic Managed Agents, OpenAI Assistants) mature, agent-platform OAuth grants will outscale static API keys.

### 🚨 Anti-patterns flagged

- **Agents Without Rules (mild)** — Tools exist (MCP, CLI, both SDKs), but no `/AGENTS.md` constraint contract. The llms.txt carries some rule-shaped guidance (env-var precedence, sign-up sequence) but not the durable constraint surface (license terms, rate limits per tier, idempotency expectations, multi-tenant rules). Risk: agents will infer constraints from the OpenAPI spec and silently exceed them.

No other anti-patterns triggered — not Lazy Wrapper, not Invisible Product (the product is *very* visible), not Single-Model Trust, not God Server (43 endpoints is well within bounds), not Black Box Server (the llms.txt provides operational guidance even if I can't verify mcp.agentmail.to has an `overview` tool without auth).

### 🎯 Top moves to climb a level

Order by leverage; first three are 90 minutes total:

1. **Publish `/AGENTS.md`** (worth ~10 pts; 30 min). Hand-author ~50 lines covering the rules an agent can't infer from the OpenAPI spec: rate limits per tier, idempotency contract (the docs already mention `client_id` for `inboxes.create()` retries — codify), inbox naming conventions, multi-tenant boundary rules, when to use `agent` vs `user` token scopes, what happens when an inbox is deleted with pending threads. Skip what the OpenAPI spec already covers — only the non-obvious.
2. **Publish `/.well-known/mcp-server-card.json`** (worth ~3 pts on this rubric, much more on Cloudflare's [ARS](https://blog.cloudflare.com/agent-readiness/) Protocol Discovery dimension). 50-line JSON file pointing at `mcp.agentmail.to` with auth scheme (`bearer`), tool-list URL, server description, version. Effort: 15 minutes. Pre-positions you for the upcoming MCP Registry / MCP Server Cards spec landing in 2026.
3. **Move robots.txt from `User-agent: *` to per-bot stanzas with explicit `Allow: /`** (worth ~3 pts). Even though every line says yes, naming `GPTBot`, `anthropic-ai`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `OAI-SearchBot`, `Diffbot`, `cohere-ai` shows AI-awareness. Add a `Content-Signal: ai-search=yes, ai-train=yes` header on the docs subdomain to say "yes, train on my docs." Effort: 10 minutes.
4. **Add `/.well-known/oauth-authorization-server` (or its bearer-token equivalent)** (worth ~5 pts). At minimum, a JSON stub describing how agents acquire credentials (`{"token_endpoint": "https://console.agentmail.to/api-keys", "auth_method": "bearer"}`). Better: implement OAuth-with-PKCE so multi-tenant agent platforms can grant scoped access without copying static API keys. Effort: 30 min stub; days for real OAuth.
5. **Stretch — wire an `overview` tool into the MCP server** (worth ~10 pts on the *codebase* rubric for [Inspectable State](/principles/inspectable-state)). When an operator agent connects to `mcp.agentmail.to`, give it one read-only tool that returns inbox count, monthly send volume, recent error rate, daily-cap headroom. The complement to your visible-outputs surface (the email itself) — this surfaces *system state* to agents where they already are.

### Reference

Framework: <https://agentsfirst.dev/principles/>
Glossary: <https://agentsfirst.dev/glossary/>

*Probed 2026-05-12. Signals: `/llms.txt` (200, 11.2KB, agent-imperative onboarding), `/llms-full.txt` (200, 35.7KB), `/openapi.json` (200, 43 endpoints, BearerAuth), `/docs/*` (200, text/plain markdown CN), `mcp.agentmail.to` (401, real authenticated MCP server), first-party Python + TypeScript SDKs, Smithery-distributed MCP install, official Claude Code/Cursor skill at agent.email/skill.md. Missing: `/AGENTS.md`, `/.well-known/mcp-server-card.json`, `/.well-known/oauth-authorization-server`, per-bot robots.txt posture. Note: agentmail.cc is a 301 to canonical agentmail.to. Score: 66/100 · Level 3.*
