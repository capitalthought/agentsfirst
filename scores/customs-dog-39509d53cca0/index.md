---
title: "Agents First Score — customs.dog"
description: "Score: 65/100 · Level 3 (Agents First). customs.dog went L0→L3 in one session — AGENTS.md, a working MCP server (5 verb-first tools, per-household keys), llms.txt, plus prep + overview tools. Migrate to the official MCP SDK and add a server card for the L4 climb."
noindex: true
sitemap: false
image: /scores/customs-dog-39509d53cca0/og.png
author: Joshua Baer
brand_domain: customs.dog
---

## Agents First Score — customs.dog

**Score: 65/100 · Level 3 (Agents First) 🎯**  ·  website surface: 53/100 · Level 2

customs.dog is a trip-readiness check + offline document wallet for crossing a border with a pet: store your documents, get a `cleared` / `caution` / `blocked` verdict against the live import rules, and show the right doc full-screen in 5 seconds at the gate. In a single build session it went from **Level 0 (no agent access)** to **Level 3** — the agent interface ships *alongside* the human PWA on the same backend, not bolted on after. An assistant with a household API key can now answer "is my dog cleared to fly to Mexico next month?" end-to-end.

### What's working

- ✅ **Interface First** (18/20) — a live MCP server at `/mcp` (JSON-RPC 2.0) with **5 verb-first tools** (`customs_prep`, `customs_overview`, `customs_list_pets`, `customs_list_documents`, `customs_check_trip_readiness`), typed `inputSchema` with enums (destinations, categories), and structured `{error:{code,message,retryable,fix}}` responses. Bearer API key = one household. *(See the caveat below — it's hand-rolled JSON-RPC, not the official SDK, so the automated detector under-credits it; scored on judgment against the live endpoint.)*
- ✅ **Contract First** (15/15) — hand-authored `AGENTS.md` (~45 lines, < 1500 tokens) at the repo root and served at `/AGENTS.md`: auth model, Household→Pet→Category→Document hierarchy, category + destination enums, the Mexico-CDC-re-entry gotcha, sequencing, and the hard "never assert cleared without calling the tool" rule.
- ✅ **Prep Gates** (10/10) — `customs_prep` validates the key, confirms the pet roster, reports health. Designed to be called first.
- ✅ **Inspectable State** (10/10) — `customs_overview` returns counts by status + what's expiring across the household in one call.
- ✅ **Visible Outputs** (10/10) — account/agent actions surface to humans by email (Postmark) — confirmed signups notify the operator with the signer's identity.
- ✅ **Discovery surface** — `/llms.txt`, `/AGENTS.md`, and the documented `/mcp` endpoint are all live; robots.txt carries Cloudflare content signals.
- ✅ **Verdicts are shared logic** — the MCP `check_trip_readiness` tool reuses the exact `computeReadiness` the human app uses, so agent and human give identical answers. 87 automated tests cover it, including MCP key-scoping and cross-household isolation.

### What's missing (the L4 climb)

- ⚠️ **Official MCP SDK + server card** — the endpoint is correct hand-rolled JSON-RPC; migrating to `@modelcontextprotocol/sdk` (and publishing `/.well-known/mcp-server-card.json`) makes it auto-discoverable and satisfies the standard tooling. This is the single highest-leverage next move.
- ⚠️ **Multi-Model Verification** (0/5) — a `cleared` verdict can strand a pet at a border if wrong; the plan calls for fanning `cleared` out to multiple models and requiring agreement. Designed, not yet wired.
- ⚠️ **Autonomous Recovery** (0/10) — no retry-with-backoff / structured escalation around uploads or the email send.
- ⚠️ **Typed State** (~2/10) — TypeScript interfaces, but no Zod/JSON-Schema validation of persistent state and no versioned migrations.
- ⚠️ **Homepage doesn't advertise the agent surface** — the MCP is documented in `/AGENTS.md` + `/llms.txt` but not mentioned alongside the human "Sign up" flow.

### 🚨 Anti-patterns

- None firing. Earlier this session it was **The Invisible Product** (zero agent interface); shipping the MCP + AGENTS.md cleared it. The tool set is deliberately 5 (not a God Server), each a domain verb (not a Lazy Wrapper), and writes are not blanket-gated (not a Slow Chatbot).

### 🎯 Top moves to climb

1. **Migrate `/mcp` to the official MCP SDK** (`@modelcontextprotocol/sdk` / Cloudflare `agents` McpAgent) and publish `/.well-known/mcp-server-card.json`. Makes the server auto-discoverable and standard-compliant; closes the Interface-First detector gap.
2. **Wire multi-model verification on `cleared` verdicts** — fan out, require agreement, downgrade to `caution` on disagreement. Earns 5 pts and removes the highest-stakes single-model risk.
3. **Add retry-with-backoff + structured escalation** to uploads/email — Autonomous Recovery, 10 pts.
4. **Advertise the MCP on the homepage** next to "Sign up" — Visibility of agent integrations, and the cheapest of the four.

### Reference

Framework: <https://agentsfirst.dev/principles/> · Glossary: <https://agentsfirst.dev/glossary/>
