---
title: "Agents First Score — superhuman.com"
description: "Score: 5/100 · Level 0 (No agent access). Superhuman's robots.txt names Twitter, Facebook, LinkedIn, Telegram — but no AI agent. Textbook Invisible Product on one of the highest-leverage agent surfaces."
noindex: true
sitemap: false
image: /og-image.png
author: Joshua Baer
---

## Agents First Score — superhuman.com

**Score: 5/100 · Level 0 (No agent access)**

Superhuman is a premium consumer email client — keyboard shortcuts, speed, polish. To the agent ecosystem, it does not exist. No MCP server, no CLI, no public SDK, no OpenAPI, no AGENTS.md, no `/llms.txt`, no OAuth discovery, no AI-bot policy in robots.txt. The robots.txt does carry a thoughtful per-bot section — but it's for **Twitter, Facebook, LinkedIn, Telegram** (social-card unfurls), not for any AI agent. That's the tell: the company knows how to differentiate by user-agent. It just hasn't decided agents matter. **Textbook Invisible Product** — and made more striking because email is one of the highest-leverage agent surfaces in existence.

### What's working

- ✅ **Bot access control — per-bot posture exists** (2/5, partial) — robots.txt carves explicit allows for Twitterbot, facebookexternalhit, LinkedInBot, Telegrambot. The *practice* of named-bot policy is there. The *AI lane* is empty.
- ✅ **Content accessibility — sitemaps declared** (3/5, partial) — three sitemaps declared in robots.txt (`/sitemap_index.xml`, `help.superhuman.com/hc/sitemap.xml`, `blog.superhuman.com/sitemap.xml`). HEAD probe got 404 (Next.js artifact); a real agent's GET would resolve.

### What's missing

- ⚠️ **Agent capabilities — MCP Server Card** (0/15) — `.well-known/mcp-server-card.json` 404. No MCP server.
- ⚠️ **Agent capabilities — CLI / SDK** (0/10) — no `npx`, no public SDK, no developer portal. Homepage mentions "API" only as a buzzword; no actual surface to call.
- ⚠️ **Agent capabilities — OAuth discovery** (0/5) — `.well-known/oauth-authorization-server` 404. Even if a hypothetical SDK existed, no agent could discover how to authenticate.
- ⚠️ **Discoverability — `/llms.txt`** (0/10) — does not exist. No machine-readable product summary.
- ⚠️ **Discoverability — `/AGENTS.md`** (0/10) — does not exist. No usage rules, no contract.
- ⚠️ **Discoverability — robots.txt addresses AI agents** (0/5) — zero AI bots named. GPTBot, ChatGPT-User, ClaudeBot, Google-Extended, Perplexity, CCBot all unmentioned. Combined with the explicit social-card section, this is an **active choice** to not address the AI ecosystem.
- ⚠️ **Content accessibility — Markdown content negotiation** (0/10) — `Accept: text/markdown` on the homepage returned `text/html`. No content-negotiation pipeline.
- ⚠️ **Content accessibility — OpenAPI** (0/5) — all OpenAPI paths 404.
- ⚠️ **Bot access control — Content Signals** (0/10) — no Cloudflare Content Signals, no AI-usage-preference declarations.
- ⚠️ **Visibility of integrations** (0/10) — zero MCP/CLI references in the human onboarding.

### 🚨 Anti-patterns flagged

- **The Invisible Product** — the textbook case. An agent looking to draft, route, or follow up on email finds **no surface to call**. Every agent in the ecosystem that touches email (Mikey, Personalize, Claude Code with email tools, Cursor) routes around Superhuman to Gmail's APIs.
- **[Selective bot blindness]** — robots.txt knows how to address bots-by-name (social cards). The decision to leave the AI ecosystem unaddressed isn't accidental — it's a configuration that someone consciously chose not to extend. The most damaging variant of Invisible Product: the team has the engineering muscle, just hasn't pointed it at the agent reader.

### 🎯 Top moves to climb a level

1. **Ship an MCP server with 8–12 verb-first tools.** Superhuman's product surface maps 1:1 to a great agent toolset: `search_email`, `compose_draft`, `send_email`, `archive_thread`, `snooze_thread`, `apply_split_inbox_rule`, `schedule_send`, `list_followups`, `get_thread_summary`. Single move: **L0 → L2/L3**. Earns 15 pts (MCP Server Card) + makes Superhuman the agent-callable layer over Gmail/Outlook, not just the keyboard-shortcut layer. Strategic frame: if Superhuman doesn't ship this, an agent talking to *your* customer goes through `gmail-mcp-server` and bypasses your product entirely.
2. **Author a hand-written `/AGENTS.md` (≤1,500 tokens).** Critical sequencing rules ("draft before send, snooze requires thread_id from `list_inbox`"), tone-of-voice constraints for AI-generated drafts (Superhuman's brand is *premium*; agents need that prior), follow-up TTL semantics. Earns up to 15 pts (Contract First).
3. **Address AI bots explicitly in `robots.txt`.** The team already groks per-bot policy — extend the existing pattern: a deliberate stance on GPTBot, ChatGPT-User, ClaudeBot, Google-Extended, Perplexity, CCBot. Even a blanket disallow is more honest than silent allow. ~10 lines, 5 pts. Add Cloudflare Content Signals (+10) for the deeper bot-policy lane.

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- The dominant pattern: [Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)
