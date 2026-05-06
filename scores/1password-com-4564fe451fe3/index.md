---
title: "Agents First Score — 1password.com"
description: "Score: 22/100 · Level 1 (Agent as Afterthought). 1Password ships the most agent-essential primitives in security — op CLI, Service Accounts, official SDK, 4 community MCPs — none discoverable from the marketing root."
noindex: true
sitemap: false
image: /og-image.png
author: Joshua Baer
---

## Agents First Score — 1password.com

**Score: 22/100 · Level 1 (Agent as Afterthought)** — with a major asterisk.

This is the most paradoxical scoring this week. **1Password ships the most agent-essential primitives in the security category** — the `op` CLI is the de facto standard for headless authentication, Service Accounts are the standard agent-bot identity pattern, and there are already **4 community MCP servers on npm** built against the `op` CLI/SDK (`@rui.branco/1password-mcp`, `@takescake/1password-mcp`, `@jrejaud/op-mcp`, `@synthread/1password-mcp`). The official `@1password/sdk` package is published. The developer portal at `developer.1password.com` ships a **45 KB `/llms.txt`** with full reference content. **None of this is discoverable from `1password.com`.** The marketing root has no `/llms.txt`, no `/AGENTS.md`, no MCP card, and no `/.well-known/oauth-authorization-server` despite the product being one of the largest OAuth/OIDC consumers on earth. The rubric scores the URL it's given, and the URL given is the part of 1Password's surface that hasn't kept up with the product mission.

### What's working

- ✅ **CLI / SDK distributed under a known channel** (10/10 of Agent Capabilities) — the `op` CLI ships via brew/apt/scoop/Windows installer. `@1password/sdk` is published on npm with TypeScript types. Both are real, maintained, and heavily used by agent infrastructure. Homepage explicitly mentions "CLI" and links `developer.1password.com`.
- ✅ **Sitemap.xml** (5/5 of Content Accessibility) — 702-byte locale-segmented index pointing at 10 language sub-sitemaps. Conventional structure, healthy SEO posture.
- ✅ **Visibility of agent integrations** (7/10, partial) — homepage mentions CLI + SDK + Connect + developer portal. The integration narrative is there in marketing copy; just stops short of "Install our MCP server" because there is no official MCP server.
- ✅ **Developer portal IS agent-ready** — `developer.1password.com/llms.txt` is 45 KB, well-structured, served as `text/plain`. Out of band of the rubric (the probe scores `1password.com` directly, not subdomains), but a real and well-maintained asset.

### What's missing

- ⚠️ **No `/llms.txt` at the marketing root** (0/10 of Discoverability) — the developer portal has it; the marketing root doesn't even index/redirect to it. An agent crawling `1password.com` cold finds nothing pointing at the 45 KB doc set one subdomain away.
- ⚠️ **No `/AGENTS.md`** (0/10 of Discoverability) — for a product that is THE agent-identity primitive (Service Accounts, scoped tokens, biometric step-up), the absence of a canonical contract file describing "how an agent should authenticate as a Service Account, what permissions are scopable, what errors mean" is the single most valuable missing artifact in the rubric.
- ⚠️ **No `/.well-known/mcp-server-card.json`** (0/15 of Agent Capabilities) — and yet *four community MCP servers* exist on npm, all wrapping the same primitives. The community is begging 1Password to declare the canonical one.
- ⚠️ **No `/.well-known/oauth-authorization-server`** (0/5 of Agent Capabilities) — 1Password is one of the largest OIDC providers in B2B auth (1Password Business SSO). The discovery endpoint should exist as a matter of course.
- ⚠️ **`robots.txt` addresses 0 AI agents** (0/15 of Bot Access Control) — 141 bytes total, `User-agent: *` with two narrow Disallows (a monitoring XML + a whitepaper PDF). No Content-Signal directive, no per-bot allow/deny posture.
- ⚠️ **No markdown content negotiation** (0/10 of Content Accessibility) — `Accept: text/markdown` returns HTML. Since the developer docs are markdown source, this is a config flip.
- ⚠️ **No OpenAPI at standard paths** (0/5 of Content Accessibility) — the developer portal documents REST endpoints, but `/openapi.json`, `/api/openapi.json`, `/v1/openapi.json` all 404. The spec exists; it isn't reachable at conventional discovery URLs.

### 🚨 Anti-patterns flagged

- **[The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — inverted form. Most Invisible Product cases lack both agent docs AND agent API. 1Password has *exceptional* agent primitives (Service Accounts, `op` CLI, Connect, official SDKs in 5+ languages) AND the docs are agent-readable at the developer portal. The marketing root, where agents start their crawl, broadcasts none of it. Same shape as Cloudflare — strong product, weak surface.
- **Community-Filled Vacuum** (worth naming, not in the canonical list) — 4 community MCP servers on npm (`@rui.branco`, `@takescake`, `@jrejaud`, `@synthread`). The market is loudly voting for an official one. The longer 1Password leaves this gap, the more agents end up depending on a fragmented set of community wrappers with inconsistent permission models.

### 🎯 Top moves to climb a level

1. **Ship the official `@1password/mcp` server.** Highest leverage by an enormous margin. Tools: `read_secret(reference)`, `list_vaults()`, `list_items(vault)`, `create_item(vault, type, fields)`, `share_item(item, recipient, expiry)`, `rotate_credential(item)`. Auth: Service Account token (the existing pattern). Permissions: scoped per vault/item with read-only and read-write modes per tool. Distribute as `npx @1password/mcp` and as a hosted endpoint at `1password.com/mcp`. Earns 15 pts (Agent Capabilities) and replaces 4 community wrappers with one canonical implementation. Score jumps from 22 → 37, Level 2. Reference: [Interface First](https://agentsfirst.dev/principles/interface-first/).

2. **Mirror the dev-portal `/llms.txt` at the marketing root + add `/AGENTS.md`.** Two files. Five minutes of work each. The content already exists on the developer portal; this is purely surfacing it from the discovery URL. The `AGENTS.md` should be the contract: Service Accounts > Connect > User OAuth, in that order, with permission scoping at the vault level, and a structured error format for `Item not found in vault X` vs `Service Account lacks scope X`. Earns 20 pts (Discoverability). Reference: [Contract First](https://agentsfirst.dev/principles/contract-first/).

3. **Publish `/.well-known/oauth-authorization-server` AND a Content-Signal directive in robots.txt.** OAuth discovery: 1Password is an OIDC provider for Business SSO; the metadata file is a one-time scaffold, ~30 lines of JSON. Earns 5 pts. Robots Content-Signal: one line, plus 6 lines of per-bot allow/deny for GPTBot, ClaudeBot, anthropic-ai, ChatGPT-User, OAI-SearchBot, Google-Extended. Earns 10 pts (Bot Access Control).

After all three: estimated **65–70/100 · Level 3 (Agents First)**, which is where the underlying product already deserves to land. The work is closing the discovery gap, not building new capability.

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- Live scorer: <https://agentsfirst.dev/mcp>
- Methodology: rubric v0.1.2. Probe caveats from this run: (1) `blanket_disallow=true` is a false positive — the actual robots.txt only Disallows two specific files (`/en/site-monitoring-pages.xml` + `/files/1password-white-paper.pdf`), not `/`. (2) The probe doesn't follow subdomains, so `developer.1password.com/llms.txt` (45 KB, real, maintained) is not credited at the headline. Both queued for v0.1.3.
