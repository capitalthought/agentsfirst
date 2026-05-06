---
title: "Agents First Score — mixmax.com"
description: "Score: 10/100 · Level 0 (No agent access). Mixmax has all the parts of an agent-callable product but none of the discovery breadcrumbs — developer portal exists, marketing root is silent."
noindex: true
sitemap: false
image: /og-image.png
author: Joshua Baer
---

## Agents First Score — mixmax.com

**Score: 10/100 · Level 0 (No agent access)** — at the boundary, with a notable asterisk.

Mixmax has all the parts of an agent-callable product **but none of the discovery breadcrumbs**. They run a developer portal at `developer.mixmax.com` (200 OK), an API at `api.mixmax.com` (200 OK), and the marketing homepage explicitly says "API" — yet no `/llms.txt`, no `/AGENTS.md`, no `/.well-known/mcp-server-card`, no Content-Signal in robots, no per-bot rules. An agent landing on `mixmax.com` cold can find it's a sales-engagement product but cannot find a path into the product. For a category that's about to be eaten by autonomous outbound agents, this is the wrong end of the discovery curve.

### What's working

- ✅ **Sitemap.xml** (5/5 of Content Accessibility) — 5.7 MB, served as `application/xml`. Heavy SEO investment, conventional structure.
- ✅ **Homepage names "API"** — the only one of the seven probed surface mentions that lit up. So the public marketing is API-aware; the rubric just can't trace it from there.
- ✅ **Developer subdomain exists** — `developer.mixmax.com` returns 200. Out of band of the rubric's scoring (the probe doesn't follow subdomains automatically), but a meaningful asset waiting to be surfaced.

### What's missing

- ⚠️ **No `/llms.txt`** (0/10 of Discoverability) — single highest-leverage missing artifact. Would point agents directly at the developer portal.
- ⚠️ **No `/AGENTS.md` or `/.well-known/agent-rules`** (0/10 of Discoverability) — no contract-style file telling agents how to interact with the API on behalf of a user.
- ⚠️ **No `/.well-known/mcp-server-card`** (0/15 of Agent Capabilities) — Mixmax is the textbook MCP-tool target: `send_message`, `schedule_meeting`, `track_open`, `start_sequence`, `pause_sequence`. None of those tools are advertised at machine-readable URLs.
- ⚠️ **`robots.txt` addresses 0 AI agents** (0/15 of Bot Access Control) — only Disallows for specific marketing pages (HubSpot preview leaks, /signup, /demo/thanks). No Content-Signal, no named-bot rules. Agents asking "may I use this site?" get an ambiguous default.
- ⚠️ **No markdown content negotiation** (0/10 of Content Accessibility) — `Accept: text/markdown` returns HTML.
- ⚠️ **No OpenAPI catalog** at `/openapi.json`, `/api/openapi.json`, or `/v1/openapi.json` (0/5 of Content Accessibility) — Mixmax has an API; the spec just isn't discoverable at standard paths.

### 🚨 Anti-patterns flagged

- **[The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — partial. The product exists; the API exists; the developer portal exists. The agent ecosystem doesn't know any of it without bespoke onboarding. *They built the inside; they didn't build the door.*

### 🎯 Top moves to climb a level

For a sales-engagement platform, every one of these is high-leverage — autonomous outbound agents are the exact category coming for this product, and discoverability is how you become the choice.

1. **Ship `/llms.txt` pointing at developer.mixmax.com.** ~5 minutes. Earns 10 pts (Discoverability) and routes any agent crawling the homepage into the actual API documentation. Reference: [Interface First](https://agentsfirst.dev/principles/interface-first/).
2. **Publish `/.well-known/mcp-server-card.json`** declaring the Mixmax MCP server (whether it exists today or is built next). Tools like `send_message`, `schedule_send`, `start_sequence`, `pause_for_event`, `track_open`, `cancel_send` map cleanly to the existing API. ~30 LOC if the API already exists. Earns 15 pts (Agent Capabilities) and lifts to Level 2 territory. Reference: [Interface First](https://agentsfirst.dev/principles/interface-first/).
3. **Add a Content-Signal directive + per-bot allow blocks** to `robots.txt`. Mixmax's content (blog posts, use-case pages, the existing 5.7 MB sitemap) is exactly what agents want to ingest when researching sales tools. One line of robots adds 10 pts (Bot Access Control). Reference: [Contract First](https://agentsfirst.dev/principles/contract-first/).

After all three: estimated **45–55/100 · Level 2** — same product, just visible.

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- Live scorer: <https://agentsfirst.dev/mcp>
- Methodology: rubric v0.1.2. The probe scores `mixmax.com` directly and does not auto-follow subdomains; `developer.mixmax.com` and `api.mixmax.com` are real and reachable but not credited. v0.1.3 of the rubric should walk the homepage's outbound links to detect named developer subdomains automatically.
