---
title: "Agents First Score — sandbox.agentnumber.really.com"
description: "Score: 84/100 · Level 3 (Agents First). The agentnumber sandbox is what an agents-first product actually looks like — JSON manifest homepage, MCP endpoint, OpenAPI, four well-known plugin descriptors, and per-bot robots.txt. One point shy of Level 4."
noindex: true
sitemap: false
image: /og-image.png
author: Joshua Baer
---

# Agents First Score — sandbox.agentnumber.really.com

**Score: 84 / 100 · Level 3 (Agents First) 🎯**

This is the inverse of the parent really.com (which scored 0/100). The agentnumber sandbox is what an agents-first product actually looks like: the **homepage itself is a JSON manifest** pointing to MCP, OpenAPI, and four well-known plugin descriptors. `robots.txt` explicitly allows 11 named AI agents and declares Cloudflare Content Signals (`search=yes, ai-input=yes, ai-train=no`). `/llms.txt` reads like a real onboarding doc — endpoints, account model, x402 example, recovery flow. There's a working MCP JSON-RPC endpoint, an OpenAPI 3.0 spec, a `skills.json` with 13 verb-first tools, an `agents.txt` contract, and dual payment descriptors (x402 + MPP). One point shy of Level 4. Whoever built this read the framework.

---

## What's working

- ✅ **Discoverability** (22 / 25)
  - `robots.txt` names 11 AI agents (GPTBot, ClaudeBot, Anthropic, anthropic-ai, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, Claude, ChatGPT-User, GPTBot) — all explicit allows
  - `Content-Signal: search=yes, ai-input=yes, ai-train=no` — best-in-class declared posture
  - `/llms.txt` (5 KB) — endpoints, examples, account model, pricing
  - `/agents.txt` — agent access policy (allowed actions, rate limits, auth) — canonical contract, just not at the agentsfirst.dev `/AGENTS.md` filename
- ✅ **Content accessibility** (20 / 20)
  - `Accept: text/markdown` returns real markdown
  - `sitemap.xml` exists
  - `/openapi.json` — OpenAPI 3.0, 15 paths, linked from homepage + ai-plugin.json + claude.json
- ✅ **Bot access control** (15 / 15) — per-bot allows, content signals, agents.txt
- ✅ **Agent capabilities** (17 / 30)
  - Working `/mcp` JSON-RPC endpoint
  - `/.well-known/ai-plugin.json` (OpenAI plugin)
  - `/.well-known/claude.json` (Claude plugin with tool list + mcp_endpoint)
  - `/.well-known/x402.json` (HTTP-native crypto payment descriptor)
  - `/.well-known/mpp.json` (MPP / Tempo payment descriptor)
  - `skills.json` — 13 verb-first tools (`subscribe`, `send_sms`, `receive_sms`, `place_call`, `hangup_call`, `try_demo`, etc.)
- ✅ **Visibility of agent integrations** (10 / 10) — homepage IS an agent manifest; llms.txt says "Integrate via MCP or REST" inline

## What's missing (the 16-point gap)

- ⚠️ **`/.well-known/mcp.json`** — canonical MCP Server Card path returns 404. The card-equivalent content is in `/.well-known/claude.json`, but agents probing the MCP-spec well-known path won't find it.
- ⚠️ **OpenAPI spec lacks `operationId` and schemas** — 15 paths defined, zero operationIds, `components.schemas: []` empty. Agent tool generators can't produce typed bindings; they have to infer from request bodies and path strings. Single biggest "almost-Level-4-but-not" issue.
- ⚠️ **Canonical AGENTS.md filename** — content lives at `/agents.txt` instead of `/AGENTS.md` or `/.well-known/agent-rules`. Cheap fix: publish at both paths.
- ⚠️ **No first-party CLI / npm SDK** — API-first design with no `@really/sms-cli`-style wrapper. The MCP + plugin manifests *are* the modern equivalent, but a human-developer-onboarding SDK would lift the score and lower friction for non-MCP consumers.
- ⚠️ **OAuth auth-server discovery** — replaced by wallet-signature + x402 by design. Not a flaw, just doesn't fit this rubric line. (The rubric arguably needs updating to recognize x402 / MPP as an OAuth-equivalent for agent payments.)
- ⚠️ **MCP endpoint ergonomics** — returning `-32700 Parse error: Invalid JSON` on a valid JSON-RPC body when both `Accept: application/json` and `text/event-stream` are sent. First-touch agents will hit this and have to read separate docs to figure out the streaming-transport requirement.

## 🚨 Anti-patterns flagged

**None.** No Invisible Product, no Agents Without Rules, no God Server (13 tools is right-sized), no Lazy Wrapper visible from outside, no Slow Chatbot (the `/demo` endpoint suggests autonomous flows). Cleanest scan to date.

## 🎯 Top moves to climb to Level 4 (86+)

1. **Add `operationId` + JSON Schema `components.schemas` to `openapi.json`.** Biggest single lever. ~2 hours. Right now an agent generating typed bindings from your spec has to invent operation names and infer parameter shapes from request body examples. Add `operationId: subscribe`, `operationId: send_sms`, etc., plus a `Subscription`, `Message`, `Call` schema set, and tool generation becomes deterministic.
2. **Publish `/.well-known/mcp.json`.** Mirror the MCP server card content from `claude.json` to the canonical MCP-spec well-known path. ~10 lines of routing. Earns 5 pts and matches the discovery convention agents look for first.
3. **Publish the contract at `/AGENTS.md`** (in addition to `/agents.txt`). One symlink / one extra route. Earns the canonical-filename credit and fixes the only Discoverability deduction.
4. **Fix the `/mcp` Accept-header response.** Return a useful JSON-RPC error explaining the streaming-transport requirement, OR accept plain `application/json` for non-streaming method calls. Reduces first-call friction.
5. **Optional: ship `@really/agent-number` on npm.** Thin wrapper around `/subscribe`, `/sms/send`, `/sms/receive` for human developers exploring in notebooks. Doesn't move the agent-readiness score much (MCP already covers this for agents), but makes the product reachable to the non-MCP developer audience.

Items 1–3 are ~3 hours total and lift the score from **84 → 93+ (Level 4, Agent-Driven)**. This subdomain is closer to Level 4 than the score suggests — almost everything is already in place; the remaining points are about completing the canonical-path coverage.

---

## Reference

- Framework: [agentsfirst.dev/principles/](/principles/)
- Glossary: [agentsfirst.dev/glossary/](/glossary/)

*Probe run: 2026-05-06 · Joshua Baer · This page is unlisted (noindex, no sitemap entry, not linked from the public site).*
