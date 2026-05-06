---
title: "Agents First Score — pandadoc.com"
description: "Score: 15/100 · Level 1 (Agent as Afterthought). PandaDoc has the agent-shaped product underneath — SDK, API, developer portal — but the discovery breadcrumbs from pandadoc.com are missing entirely."
noindex: true
sitemap: false
image: /og-image.png
author: Joshua Baer
---

## Agents First Score — pandadoc.com

**Score: 15/100 · Level 1 (Agent as Afterthought)**

PandaDoc has the agent-shaped product underneath (SDK published, API documented, developer portal at `developers.pandadoc.com`) but the discovery breadcrumbs from `pandadoc.com` are missing in every direction. The robots.txt is unusual — it explicitly blocks `Amazonbot` with a hard `Disallow: /` while leaving every other AI crawler (GPTBot, ClaudeBot, anthropic-ai, etc.) on the default `User-agent: *` path. That's a deliberate Amazon-shaped policy without a coherent broader stance.

### What's working

- ✅ **Sitemap.xml** (5/5 of Content Accessibility) — 2.4 KB index pointing at three sub-sitemaps (root, blog posts, blog categories). Conventional structure.
- ✅ **Homepage mentions SDK + API** (5/10 of Visibility, partial credit) — both surfaces are named in the marketing copy. The API is a real product line for them; the SDK is a real artifact at `developers.pandadoc.com`.
- ✅ **Per-bot rule for Amazonbot** (partial Bot Access Control) — explicit `Disallow: /` for Amazon's crawler. Tells you they've thought about *one* AI bot, just not the others.

### What's missing

- ⚠️ **No `/llms.txt`** (0/10 of Discoverability) — single highest-leverage missing artifact. Would route any agent crawling the homepage straight at `developers.pandadoc.com`.
- ⚠️ **No `/AGENTS.md` or `/.well-known/agent-rules`** (0/10 of Discoverability) — no contract-style file describing how agents should engage with the API on behalf of a sales rep.
- ⚠️ **No `/.well-known/mcp-server-card`** (0/15 of Agent Capabilities) — PandaDoc is a clean MCP-tool target: `create_doc`, `send_for_signature`, `get_doc_status`, `void_doc`, `download_pdf`, `apply_template`. None of those tools are advertised at machine-readable URLs.
- ⚠️ **No Content-Signal directive** (0/10 of Bot Access Control) — the Amazonbot block is a per-bot rule, not a broad AI-policy declaration. Agents crawling for a general "may we use this content" signal find ambiguity.
- ⚠️ **No named-AI-bot declarations beyond Amazonbot** (0/5 of granular per-bot credit) — robots names exactly one AI bot, and only to disallow it. The threshold for "granular control" credit is 3+ named bots; PandaDoc is at 1.
- ⚠️ **No markdown content negotiation, no OpenAPI at standard paths** (0/15 combined) — the API exists; the spec just isn't reachable at `/openapi.json` or `/api/openapi.json`.

### 🚨 Anti-patterns flagged

- **[The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — partial. The product exists; the API exists; the SDK is real. The agent ecosystem doesn't know any of it from a cold crawl. They built the inside, didn't build the door.
- **Asymmetric bot policy** (not in the canonical list, worth naming) — singling out Amazonbot for a hard block while leaving every other AI bot on the default `User-agent: *` path is a posture that doesn't compose. Either it's a deliberate "Amazon is competitive, others are fine" stance (which should be declared explicitly) or it's an artifact of a one-off policy decision that drifted (which is Ship-and-Forget at the bot-policy layer).

### 🎯 Top moves to climb a level

For a document-signing platform, every one of these is high-leverage — autonomous agents drafting and routing contracts on behalf of users are the obvious next category, and discoverability is how you become the choice.

1. **Ship `/llms.txt` pointing at `developers.pandadoc.com` and `api.pandadoc.com`.** ~5 minutes. Earns 10 pts (Discoverability) and routes any agent crawling the homepage into the actual API documentation. Reference: [Interface First](https://agentsfirst.dev/principles/interface-first/).
2. **Publish `/.well-known/mcp-server-card.json`** declaring the PandaDoc MCP server (whether it exists today or is built next). The tool surface maps cleanly to the existing API: `create_doc`, `send_for_signature`, `get_status`, `apply_template`, `void`, `download_pdf`. ~30 LOC if the API is already there. Earns 15 pts (Agent Capabilities) and lifts to Level 2 territory. Reference: [Interface First](https://agentsfirst.dev/principles/interface-first/).
3. **Replace the asymmetric Amazonbot rule with a coherent Content-Signal + per-named-bot block.** One line of `Content-Signal: ai-train=…, ai-input=…, search=…` plus explicit allow/deny for GPTBot, ClaudeBot, anthropic-ai, Google-Extended, etc. Earns 10 pts (Bot Access Control) AND makes the existing Amazon stance defensible by being part of an explicit policy rather than a one-off. Reference: [Contract First](https://agentsfirst.dev/principles/contract-first/).

After all three: estimated **45–55/100 · Level 2** — same product, just visible.

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- Live scorer: <https://agentsfirst.dev/mcp>
- Methodology: rubric v0.1.2. The probe doesn't follow subdomains automatically; `developers.pandadoc.com` is real, reachable, and a real asset, but not credited. v0.1.3 of the rubric should walk the homepage's outbound links to detect named developer subdomains. Also: the per-bot rule for `Amazonbot` is real but not in the v0.1.2 named-AI-bot recognizer list — flagged as part of the same v0.1.3 expansion.
