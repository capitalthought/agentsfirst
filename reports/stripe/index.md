---
title: "Agent Readiness Report: Stripe"
description: "Stripe scored 25/100 (Level 1) on docs.stripe.com — the canonical API-first company has shipped real agent surface, but the discovery breadcrumbs from the homepage are missing."
image: /og-image.png
author: Joshua Baer
permalink: /reports/stripe/
report_target: Stripe
report_score: 25
report_level: 1
report_date: 2026-05-06
---

# Agent Readiness Report: Stripe

**Score: 25/100 · Level 1 (Agent as Afterthought)** · scored across stripe.com / docs.stripe.com / dashboard.stripe.com — 2026-05-06. Highest honest surface: `docs.stripe.com` at 25/100. Marketing root: 10/100. Dashboard: excluded (login wall).

If anyone in payments should already be Level 3, it's Stripe. The canonical API-first company. The team that ships `@stripe/mcp` on npm. We pointed our scorer at three Stripe surfaces and the headline is the gap between what Stripe has shipped and what an agent landing on stripe.com can actually find. Capability real. Breadcrumbs from the front door, not.

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

For rubric authors: **score what works, not just what conforms.** Stripe's `.md` suffix is a real markdown surface our v0.1.2 rubric doesn't credit. Tracking for a future revision.

## How we scored this

Three URLs were probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-06: `stripe.com` (10/100, Level 0), `docs.stripe.com` (25/100, Level 1), `dashboard.stripe.com` (excluded). Headline is the highest honest score. Raw probe data is in [the report directory](https://github.com/capitalthought/agentsfirst/tree/main/reports/stripe).

**Dashboard exclusion:** every well-known path on `dashboard.stripe.com` returned a `303` redirect to `/login` followed by login-page HTML. The 200s the scorer counted as "AGENTS.md exists, MCP Server Card published, sitemap present" were all the same 134KB login page. Filing a rubric bug to detect login-redirect false positives for v0.1.3.

**Methodology note:** v0.1.2 rubric — credits the `Content-Signal` directive in robots.txt; checks markdown via the `Accept` header (not via `.md` suffix, a known gap when scoring Stripe). Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

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
