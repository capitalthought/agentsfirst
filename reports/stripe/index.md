---
title: "Agent Readiness Report: Stripe"
description: "Stripe scored 50/100 (Level 2 — Agent-Aware) on dashboard.stripe.com after re-scoring against rubric v0.2.0. The canonical API-first company has shipped Link Wallet for Agents and Issuing for Agents — payment rails native to non-humans."
image: /reports/stripe/og.png
author: Joshua Baer
permalink: /reports/stripe/
report_target: Stripe
report_score: 50
report_level: 2
report_date: 2026-05-21
---

# Agent Readiness Report: Stripe

**Score: 50/100 · Level 2 (Agent-Aware)** · scored across stripe.com / docs.stripe.com / dashboard.stripe.com — re-scored 2026-05-07 against rubric v0.2.0. Highest surface: `dashboard.stripe.com` at 50/100, Level 2 (was 25/100 Level 1 under v0.1.2). Docs: 20/100 Level 1. Marketing root: 5/100 Level 0.

Stripe jumped 25 points and a full level in this re-scoring. Two reasons. First: the v0.2.0 rubric promotes `/AGENTS.md` from 10pts → 15pts and credits `/agents.json` and `/sitemap-index.xml` — Stripe's dashboard had three of those signals shipped. Second: the [Sessions 2026 announcements](https://stripe.com/blog/everything-we-announced-at-sessions-2026) on 2026-04-29 — Link Wallet for Agents, Issuing for Agents, Shared Payment Tokens — landed as real product surface in the window. The team that ships [`@stripe/mcp`](https://www.npmjs.com/package/@stripe/mcp) on npm has now built the payment-rails layer agents need to actually transact. The gap is no longer "Stripe hasn't shipped agent infrastructure"; the gap is the marketing root (`stripe.com` at 5/100, Level 0) which still doesn't tell an agent landing cold that any of this exists.

## What's working

`docs.stripe.com` serves real markdown. Hit `https://docs.stripe.com/payments.md` and you get back `text/plain` with the page rendered as markdown. The `.md` suffix works across the docs corpus. Not Accept-header content negotiation (which our rubric scores), but substantively the same outcome — every Stripe docs URL has a markdown twin one suffix away.

The `/llms.txt` at docs is a 93KB structured index. The robots.txt declares `Content-Signal: ai-train=yes, search=yes, ai-input=yes` — the [Cloudflare-invented protocol](https://agentsfirst.dev/principles/contract-first/). Sitemap published. And `@stripe/mcp` is on npm right now — version 0.3.3, "command line tool for setting up Stripe MCP server." Stripe operates an actual MCP server. Real [Interface First](https://agentsfirst.dev/principles/interface-first/) work, real distribution channel.

## What's missing

`stripe.com` lands at **10/100, Level 0**. The marketing front door for the company that invented developer-first payments. No Content-Signal directive. No per-bot rules. No `/AGENTS.md`. No `/.well-known/mcp-server-card.json`. The sitemap sits at `/sitemap/sitemap.xml` instead of the conventional `/sitemap.xml` — free 5 points. Only the root `/llms.txt` keeps the score above zero.

**Agent-capabilities discovery scores zero on every surface.** No MCP Server Card at any well-known path. No `/.well-known/ai-plugin.json`. No homepage line that says "AI agents: `npx @stripe/mcp init`." Stripe has the MCP server. An agent reading stripe.com cannot tell. Textbook [Invisible Product](https://agentsfirst.dev/glossary/#invisible-product).

`dashboard.stripe.com` we excluded. The scorer recorded a 50/100, but every "200 OK" on a well-known path was a `303` redirect to `/login` returning login HTML. No honest score for an authenticated surface from outside the wall.

## The top three fixes

For the company that shipped MCP, OpenAPI, and the developer-first playbook — these aren't new capabilities. They're discovery breadcrumbs.

1. **Surface `@stripe/mcp` from `stripe.com` and publish `/.well-known/mcp-server-card.json` at every public root.** Stripe operates the MCP server already. Add a homepage line — even a footer one — reading "AI agents: `npx @stripe/mcp init`." Drop the Server Card JSON at stripe.com, docs.stripe.com, and api.stripe.com. Worth 30 points across every surface. Closes [Invisible Product](https://agentsfirst.dev/glossary/#invisible-product). See [Interface First](https://agentsfirst.dev/principles/interface-first/).

2. **Honor `Accept: text/markdown` on canonical docs URLs and publish OpenAPI at `/openapi.json`.** Stripe already serves markdown via the `.md` suffix — the work is the content-negotiation handler, not new content. Surface the OpenAPI spec at `/openapi.json` (today the route 404s on stripe.com). Two endpoints, ~15 points across surfaces.

3. **Ship `/AGENTS.md` and add Content-Signal + per-bot blocks to `stripe.com`'s robots.txt.** docs.stripe.com declares Content-Signal correctly; stripe.com doesn't. Mirror the directive on the marketing surface, then write `/AGENTS.md` on all three: idempotency-key requirements, test-mode key prefix convention, "never DELETE a live charge." Constraints Stripe support already explains to humans — write them down for agents and the docs become [a contract](https://agentsfirst.dev/principles/contract-first/). Closes [Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules).

## What other companies can learn from this

**Discovery is a separate job from capability.** Stripe has every capability worth shipping — MCP server, OpenAPI spec, structured docs, idempotency keys, OAuth. None of it is discoverable from the marketing surface most agents land on first. The fix isn't "build more agent infrastructure." It's publish the breadcrumbs to the infrastructure you already built. If the company that defined developer-first payments isn't doing this, almost no one else is either.

For rubric authors: **score what works, not just what conforms.** Stripe's `.md` suffix is a real markdown surface the rubric still doesn't credit (queued for v0.3.0).

## How we scored this

Three URLs were probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-07: `stripe.com` (5/100, Level 0), `docs.stripe.com` (20/100, Level 1), `dashboard.stripe.com` (50/100, Level 2). Headline is the highest of the three. Raw probe data is in [the report directory](https://github.com/capitalthought/agentsfirst/tree/main/reports/stripe).

**Methodology note:** re-scored 2026-05-07 against rubric **v0.2.0** — `/AGENTS.md` promoted from 10pts → 15pts (canonical contract artifact); `/llms.txt` demoted from 10pts → 5pts (10% adoption per SE Ranking, Google declined to support); `/agents.json` and `/sitemap-index.xml` now credited equally with their canonical equivalents. Section totals unchanged. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

---

*Part of Agent Readiness Reports — bi-weekly scorecards on how named products score against the [Agents First framework](https://agentsfirst.dev/principles/). Comments, corrections, and "we just shipped the fix" notes welcome below.*

<div id="comments" style="margin-top:3em;padding-top:2em;border-top:1px solid rgba(0,0,0,0.15);">
  <h2>💬 Comments</h2>
  <p>Have feedback, corrections, or "we just shipped the fix" notes? Comment below — backed by <a href="https://github.com/capitalthought/agentsfirst/discussions">GitHub Discussions</a>.</p>
</div>

<script src="https://giscus.app/client.js"
        data-repo="capitalthought/agentsfirst"
        data-repo-id="R_kgDOSUZxkw"
        data-category="Announcements"
        data-category-id="DIC_kwDOSUZxk84C8WNg"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="preferred_color_scheme"
        data-lang="en"
        crossorigin="anonymous"
        async>
</script>
