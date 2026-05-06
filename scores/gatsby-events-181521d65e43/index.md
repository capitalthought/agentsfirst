---
title: "Agents First Score — gatsby.events"
description: "Score: 15/100 · Level 1 (Agent as Afterthought). Gatsby Events ships the best /llms.txt of any site I've scored — 612KB of complete docs. But the docs tell agents how Gatsby works without a way to actually use Gatsby."
noindex: true
sitemap: false
image: /og-image.png
author: Joshua Baer
---

## Agents First Score — gatsby.events

**Score: 15/100 · Level 1 (Agent as Afterthought)**

Gatsby Events (event-management platform for corporate AGMs, galas, conferences) ships the best `/llms.txt` of any site I've scored this week — 1.4 KB index + 179 KB abridged (`/llms-small.txt`) + **612 KB complete** (`/llms-full.txt`), Starlight-generated and well-structured. An agent reading the docs learns the entire product end-to-end. But the surface ENDS there: no MCP server, no CLI, no public API discovery, no AGENTS.md, no per-bot robots.txt rules. The docs are telling agents how Gatsby works; the agent has no way to actually use Gatsby. This is the inverse of most Invisible Product cases — usually it's the docs that are invisible and the API that exists; Gatsby has world-class agent-readable docs and no callable agent surface.

### What's working

- ✅ **`/llms.txt` + companions** (10/10 of Discoverability/llms slot) — best-in-class. The full `/llms-full.txt` at 612 KB is what the llmstxt.org spec was designed for. Plus the abridged `/llms-small.txt` for context-constrained agents. This is what the doc surface should look like.
- ✅ **Sitemap** (5/5 of Content Accessibility) — `/sitemap-index.xml` (Astro convention, valid). The probe initially missed it because it checks `/sitemap.xml`; v0.1.3 of the rubric should also check `/sitemap-index.xml`.
- ✅ **Cloudflare-fronted** — already on the infrastructure that publishes `Content-Signal`. Adding the directive is a one-line dashboard toggle, not an engineering effort.

### What's missing

- ⚠️ **No `/AGENTS.md`** (0/10 of Discoverability) — having `/llms.txt` without `/AGENTS.md` is the half-implementation pattern. The llms.txt is a *reading index*; AGENTS.md is the *contract* (permissions, sequence, identifiers, errors). Both should exist.
- ⚠️ **No agent capabilities at all** (0/30) — no MCP Server Card, no `/.well-known/mcp-server-card.json`, no published CLI, no OpenAPI at standard paths. For a product that lives on integrations (Salesforce, Affinity, Gmail, Outlook, SendGrid all named in the docs), the absence of an outbound agent API is the gap.
- ⚠️ **`robots.txt` addresses 0 AI agents** (0/15 of Bot Access Control) — 73 bytes total, just `User-agent: *` + `Allow: /` + `Sitemap: ...`. No Content-Signal directive, no per-bot allow/deny posture.
- ⚠️ **No markdown content negotiation** (0/10 of Content Accessibility) — `Accept: text/markdown` returns HTML. A Starlight site can flip this on with one config setting; doubly worth doing because the underlying source IS markdown.
- ⚠️ **Visibility of agent integrations** (0/10) — homepage talks to event organizers, not to agents. No "Install our MCP server" or "Use our CLI" footer. Given how complete the docs are, this is a positioning gap, not a capability gap.

### 🚨 Anti-patterns flagged

- **[The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — inverted form. Most Invisible Product cases have no agent docs AND no agent API. Gatsby has *exceptional* agent-readable docs (612 KB of llms-full) AND no agent API. An agent that reads everything about Gatsby ends up unable to do anything with Gatsby. Worth naming as its own variant: **the Brochure pattern** — high-fidelity description, zero callable surface.

### 🎯 Top moves to climb a level

The product structure (Contacts → Events/Lists → Tools) maps unusually cleanly to verb-first MCP tools. Event-ops is exactly the wedge case where an executive assistant agent should be able to "add the new VIP list to the gala invite list, send invitations from my real inbox, and check the RSVP status tomorrow morning."

1. **Ship an MCP server.** Highest leverage by an order of magnitude. The tool surface from the existing docs maps directly: `create_event`, `add_guest`, `import_contacts`, `send_invitation`, `list_rsvps`, `check_in_guest`, `seat_guest`, `clone_event_template`. ~80–120 LOC over the existing API. Distribute as `npx @gatsby-events/mcp-server` and as a hosted endpoint at `gatsby.events/mcp`. Earns 15 pts (Agent Capabilities) — score jumps from 15 → 30 (Level 2). Reference: [Interface First](https://agentsfirst.dev/principles/interface-first/).

2. **Add `/AGENTS.md` alongside `/llms.txt`.** The doc team already understands "publish for agents" — they just stopped at the reading index. A 200-line `/AGENTS.md` covering permissions (does the agent represent the event host? a guest?), sequence (must create event before adding guests, must add guests before sending invitations), identifiers (events are slugs not GUIDs), and error patterns (what happens when a guest declines an already-cancelled event). Earns 10 pts. Reference: [Contract First](https://agentsfirst.dev/principles/contract-first/).

3. **Modernize `/robots.txt`.** Add a Content-Signal directive (Cloudflare provides the convention; gatsby.events already runs on CF) plus per-bot allow/deny for GPTBot, ClaudeBot, anthropic-ai, ChatGPT-User, OAI-SearchBot, Google-Extended. ~7 lines total. Earns 10 pts (Bot Access Control). Trivial cost.

After all three: estimated **45–55/100 · Level 2 (Agent-Aware)**, probably highest of the events-platform category in this rubric (Bizzabo currently at 15).

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- Live scorer: <https://agentsfirst.dev/mcp>
- Methodology: rubric v0.1.2. Caveats from this run: the probe checks `/sitemap.xml` but not `/sitemap-index.xml` (Astro convention used here); the homepage parser missed the title/h1 because Starlight's hydration timing trips the static parse. Both queued for v0.1.3.
