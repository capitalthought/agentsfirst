---
title: "Agents First Score — gatsby.events"
description: "Score: 15/100 · Level 1 (Agent as Afterthought). Gatsby.events shipped a thoughtful /llms.txt and 655 KB /llms-full.txt — but no MCP server, no CLI, no SDK, no AGENTS.md. Docs are agent-ready; the product isn't."
noindex: true
sitemap: false
image: /og-image.png
author: Joshua Baer
---

## Agents First Score — gatsby.events

**Score: 15/100 · Level 1 (Agent as Afterthought)**

Gatsby.events has done one thing well — a thoughtful `/llms.txt` plus a 655 KB `/llms-full.txt` that explains the whole product (Contacts → Events → Tools, RSVP flows, integrations). That's better than 95% of SaaS sites. **But everything an agent would need to *do* something with that knowledge is missing.** No MCP server, no CLI, no public SDK, no OpenAPI, no AGENTS.md, no OAuth discovery, no AI-bot policy in robots.txt. The docs are agent-ready; the product isn't. That's the "Brochure" / **Inverted Invisible Product** pattern — you built the inside, you wrote the manual, you didn't build the door.

### What's working

- ✅ **Discoverability — `/llms.txt`** (10/10) — well-structured: TL;DR, abridged + full doc links, optional sections. Exactly the format the spec calls for.
- ✅ **Content accessibility — `/llms-full.txt`** (5/5 sitemap proxy) — 655 KB of structured product documentation, server-rendered with `<SYSTEM>` framing. Sitemap-index at `/sitemap_index.xml` exists too.

### What's missing

- ⚠️ **Agent capabilities — MCP Server Card** (0/15) — `.well-known/mcp-server-card.json` 404. No MCP server.
- ⚠️ **Agent capabilities — CLI / SDK** (0/10) — homepage mentions no MCP, npx, CLI, SDK, API, or OAuth. Probe found nothing public to install.
- ⚠️ **Agent capabilities — OAuth discovery** (0/5) — `.well-known/oauth-authorization-server` 404. Without it agents can't acquire scoped tokens programmatically.
- ⚠️ **Discoverability — `/AGENTS.md`** (0/10) — no usage rules, no constraints, no contract. Even if they shipped tools tomorrow, agents would hallucinate against them.
- ⚠️ **Discoverability — robots.txt** (0/5) — `robots.txt` exists but addresses zero named AI agents (GPTBot, ClaudeBot, Google-Extended, Perplexity, etc.). Implicit "anything goes" — no intentional policy.
- ⚠️ **Content accessibility — Markdown negotiation** (0/10) — requested `Accept: text/markdown` on the homepage, got `text/html`. The llms.txt route is good but there's no per-page content negotiation.
- ⚠️ **Content accessibility — OpenAPI** (0/5) — `/openapi.json`, `/v1/openapi.json`, `/api/openapi.json` all 404.
- ⚠️ **Bot access control — Content Signals** (0/15) — no Cloudflare Content Signals, no per-bot allow/deny posture.
- ⚠️ **Visibility of integrations** (0/10) — no "Install our MCP server" / "Use our CLI" anywhere in the human onboarding path.

### 🚨 Anti-patterns flagged

- **[Inverted Invisible Product / Brochure pattern]** — comprehensive `llms-full.txt` (655 KB covering invitations, RSVP, seating, check-in, integrations with Gmail/Outlook/SendGrid/Salesforce/Affinity) but zero callable agent surface. An agent reading the docs ends the read with "great, where do I send the request?" and there's no answer.
- **[Agent capabilities silent]** — homepage / docs reference Gmail, Outlook, SendGrid, Salesforce, Affinity integrations for *humans*; nothing for *agents*. A relationship-CRM-with-events is one of the highest-leverage agent surfaces imaginable — and it's invisible.

### 🎯 Top moves to climb a level

1. **Ship an MCP server with 6–10 verb-first tools.** This is the single biggest gap and the highest-leverage move. The product surface is obvious: `create_event`, `add_guests`, `send_invitations`, `get_rsvps`, `check_in_guest`, `list_events`, `assign_seat`. Earns 15 pts (MCP Server Card published) + makes the existing 655 KB of docs actually load-bearing. Single move: **L1 → L2**, maybe **L3** if shipped with the next two moves.
2. **Author a hand-written `/AGENTS.md` (≤1,500 tokens).** Sequencing rules ("create event before sending invitations"), permission model (read vs. write per scope), RSVP-status enum, idempotency notes for `send_invitations`. Earns up to 15 pts (Contract First). Pair with #1 — an MCP server without AGENTS.md is the **Agents Without Rules** anti-pattern.
3. **Address AI bots explicitly in `robots.txt`.** Even a single block — GPTBot, ChatGPT-User, ClaudeBot, Google-Extended, Perplexity, CCBot — with intentional allow/deny per crawler. Costs ~10 lines, earns 5 pts, and signals to the agent ecosystem that gatsby.events has a deliberate policy instead of accidentally everything. Add Cloudflare Content Signals if behind CF for another +10.

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- The pattern this site demonstrates most clearly: [Invisible Product](https://agentsfirst.dev/glossary/#invisible-product) (the inverted variant — docs without tools)
