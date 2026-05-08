---
title: "Agent Readiness Report: Cloudflare"
description: "Cloudflare scored 35/100 (Level 2 — Agent-Aware) on developers.cloudflare.com after re-scoring against rubric v0.2.0. The blog hosting their original Agent Readiness Score post lands at 15/100, Level 1."
image: /reports/cloudflare/og.png
author: Joshua Baer
permalink: /reports/cloudflare/
report_date: 2026-05-08
report_target: Cloudflare
report_score: 35
report_level: 2
---

# Agent Readiness Report: Cloudflare

**Score: 35/100 · Level 2 (Agent-Aware)** · scored across cloudflare.com / blog.cloudflare.com / developers.cloudflare.com — re-scored 2026-05-07 against rubric v0.2.0. Highest surface: `developers.cloudflare.com` at 35/100 (was 40/100 under v0.1.2). Marketing root: 20/100, Level 1. Blog: 15/100, Level 1.

Cloudflare wrote [the Agent Readiness Score post](https://blog.cloudflare.com/agent-readiness/) in April 2026 — the piece this thesis cites. We pointed our scorer at theirs first. While probing, we found a bug in our rubric: it didn't credit the `Content-Signal` directive Cloudflare itself invented. We shipped v0.1.2 to fix that. Cloudflare lost 5 points in the v0.2.0 re-scoring because v0.2.0 demoted `/llms.txt` from 10pts → 5pts (10% adoption per [SE Ranking](https://seranking.com/blog/llms-txt/), Google declined to support) and Cloudflare ships `/llms.txt` but no `/AGENTS.md`. Same level (Level 2 spans 26-60). Same story: variance — 35 / 20 / 15 — and a blog hosting Cloudflare's own agent-readiness post that scores Level 1 against the rubric the post helped popularize.

## What's working

`developers.cloudflare.com` does the things most companies don't.

It publishes a real **`/llms.txt`** — structured, with a [full documentation archive](https://developers.cloudflare.com/llms-full.txt) for offline indexing. Per-product files for narrow context, one fat archive for large-context models. 10 of 25 points in [discoverability](https://agentsfirst.dev/principles/interface-first/).

It passes **content negotiation**. Hit any docs URL with `Accept: text/markdown` and the server returns markdown, not HTML. OpenAPI surface discoverable. Sitemap present. Clean 20/20 on content-accessibility — the only dimension where any Cloudflare surface gets full marks.

The robots.txt is where Cloudflare's protocol shows up. The file declares `Content-Signal: ai-train=yes, search=yes, ai-input=yes` — Cloudflare's [Content Signals](https://blog.cloudflare.com/content-signals-policy/) policy. The directive is present on **all three surfaces**, earning each 10 of 15 points in [bot-access-control](https://agentsfirst.dev/principles/contract-first/). Cloudflare invented the convention, ships it consistently, and the v0.1.2 rubric credits it.

## What's missing

**Agent-capabilities is zero across all three surfaces** — 0 of 30 points. No MCP Server Card. No `/.well-known/ai-plugin.json`. None of the homepages reference MCP, the CLI, or any SDK install path. Cloudflare ships [Code Mode](https://agentsfirst.dev/glossary/#code-mode) — the canonical example of exposing 2,500 endpoints to an agent in 1,000 tokens — and we cite it in the thesis. None of that is discoverable from the homepage. That's [the Invisible Product](https://agentsfirst.dev/glossary/#invisible-product) anti-pattern: the capability is real, the signal isn't.

**`blog.cloudflare.com` scores 15/100 — Level 1.** No `/llms.txt`. No markdown content negotiation. The April 2026 Agent Readiness Score post sits on a surface that scores Level 1 against the rubric it helped popularize, saved from Level 0 only by the Content-Signal directive. **`www.cloudflare.com` lands at 25/100, Level 1** — publishes `/llms.txt` but no markdown negotiation, no OpenAPI, no MCP reference from the hero.

## The top three fixes

1. **Publish an MCP Server Card from `cloudflare.com` and reference it from the homepage hero.** Worth 30 points across every surface. Cloudflare already operates MCP servers people use in production; the missing piece is the discovery breadcrumb that says "this exists, here's the install command, here's the auth flow." Today an agent reading cloudflare.com cannot tell an MCP server exists. See [Interface First](https://agentsfirst.dev/principles/interface-first/).

2. **Lift `/llms.txt` to the blog and ship `/AGENTS.md` on all three surfaces.** `cloudflare.com` already publishes `/llms.txt`. The blog doesn't. Add it; have it index the post archive. Then ship `/AGENTS.md` on all three: declare the usage rules that turn each surface from documentation into [a contract](https://agentsfirst.dev/principles/contract-first/) the agent can rely on. Lowest-effort, highest-leverage move. Closes the [Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules) gap.

3. **Pair Content-Signal with per-named-bot blocks.** Our v0.1.2 rubric credits Content Signals; adoption is still early, and competing rubrics may keep scoring per-named-bot rules. Belt-and-suspenders: keep `Content-Signal: ai-train=yes, search=yes, ai-input=yes` and add explicit `User-agent: GPTBot / ClaudeBot / anthropic-ai / Google-Extended / PerplexityBot / CCBot` blocks. Picks up the remaining 5 points in bot-access-control on every surface. See [Contract First](https://agentsfirst.dev/principles/contract-first/).

## What other companies can learn from this

The lesson is the *shape* of the score, not the number. One subdomain at Level 2; two at Level 1. Most companies that ship an agent strategy ship it in one place and forget the marketing site, blog, and changelog all have to be addressable too. A Level 3 product is Level 3 across every surface an agent might land on. Score your three most-trafficked subdomains; the variance is the bug.

The other lesson, for rubric authors: credit the conventions the people you're scoring are inventing. We almost shipped this with Cloudflare at 30/100 because our rubric didn't recognize the directive Cloudflare wrote. Fix the rubric, then publish.

## How we scored this

Three URLs were probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-07: `www.cloudflare.com` (20/100, Level 1), `blog.cloudflare.com` (15/100, Level 1), `developers.cloudflare.com` (35/100, Level 2). Headline is the highest of the three. Raw probe data — robots.txt bodies, content-negotiation responses, capability checks — is in [the report directory](https://github.com/capitalthought/agentsfirst/tree/main/reports/cloudflare).

Methodology note: re-scored 2026-05-07 against rubric **v0.2.0** — `/AGENTS.md` promoted from 10pts → 15pts (canonical contract artifact); `/llms.txt` demoted from 10pts → 5pts (10% adoption per SE Ranking, Google declined to support); `/agents.json` and `/sitemap-index.xml` now credited equally with their canonical equivalents. Section totals unchanged. v0.1.2 (which we shipped to credit Cloudflare's `Content-Signal` invention) is preserved in v0.2.0. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

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
