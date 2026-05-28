---
title: "Agent Readiness Report: Vercel"
description: "Vercel scored 90/100 (Level 4 — Agent-Driven) on vercel.com/docs — first product in any of these reports to crack the highest level. Marketing root: 70/100 Level 3. The AI SDK home: 20/100, Level 1."
image: /reports/vercel/og.png
author: Joshua Baer
permalink: /reports/vercel/
report_target: Vercel
report_score: 90
report_level: 4
report_date: 2026-05-28
---

# Agent Readiness Report: Vercel

**Score: 90/100 · Level 4 (Agent-Driven) 🏆** · scored across vercel.com / vercel.com/docs / sdk.vercel.ai — re-scored 2026-05-07 against rubric v0.2.0. Highest surface: `vercel.com/docs` at **90/100, Level 4**. Marketing root: 70/100, Level 3. The Vercel AI SDK home: 20/100, Level 1.

**This is the first product in any Agent Readiness Report to reach Level 4 (Agent-Driven).** Under v0.2.0 of the rubric (AGENTS.md promoted to canonical contract artifact, sitemap-index credited, /agents.json recognized) the docs surface picks up another +15 — pushing the score from 75 → 90 and the level from Agents First → Agent-Driven. They sell to AI builders; they ship like AI builders; the rubric now reflects that. The story is still the variance — 90 on the docs, 70 on the marketing root, 20 on `sdk.vercel.ai`. The company shipping the most-installed AI SDK in production has its AI SDK home scoring [Level 1](https://agentsfirst.dev/glossary/#adoption-levels) against the framework that AI SDK is built to serve.

## What's working

`vercel.com/docs` does the things this rubric was written to find.

A real **`/llms.txt`** at the docs root, ~168 KB structured index that opens with "Vercel is the AI Cloud" and links to a [full-archive companion](https://vercel.com/docs/llms-full.txt). 20 of 25 in [discoverability](https://agentsfirst.dev/principles/interface-first/).

**Markdown content negotiation passes.** Hit a docs URL with `Accept: text/markdown` and you get markdown. Sitemap present. OpenAPI surface discoverable. Clean 20/20 on content-accessibility — the only Vercel surface where every box gets ticked.

**The homepage hero references both MCP and the SDK alongside human onboarding** — the visibility-of-agent-integrations dimension that almost everyone fails. Vercel passes 10/10. An agent landing on `vercel.com/docs` can see the install path without scrolling. That's [Interface First](https://agentsfirst.dev/principles/interface-first/) signaling done right.

The robots.txt declares `Content-Signal: search=yes, ai-input=yes, ai-train=no` — same directive [Cloudflare invented](https://blog.cloudflare.com/content-signals-policy/), opposite default on training. Vercel says: index us, condition agent answers on us, don't train your foundation model on us. Worth 10 of 15 in [bot-access-control](https://agentsfirst.dev/principles/contract-first/) and a deliberate policy choice the rubric should respect either way.

A `.well-known/oauth-authorization-server` resolves with a real JSON document. That's the [OAuth 2.0 with PKCE](https://agentsfirst.dev/glossary/#oauth-pkce) discovery surface an agent expects — half the agent-capabilities credit, present today.

## What's missing

**No MCP Server Card.** `/.well-known/mcp-server-card`, `/.well-known/mcp.json`, `/.well-known/ai-plugin.json` — all 404. Vercel ships an MCP server in the platform; agents reading any of these wells cannot tell. Worth 15 points across every surface.

**`vercel.com` (the marketing root) lands at 70/100, Level 3.** Same robots.txt, same `/llms.txt`, plus the v0.2.0 rubric now credits Vercel's AGENTS.md and sitemap-index. Marketing root climbed Level 2 → Level 3 in this re-scoring. The capability is no longer "buried in `/docs`" — it's now visible from the homepage too.

**`sdk.vercel.ai` lands at 20/100, Level 1.** This is the report's loudest finding. The Vercel AI SDK home — Vercel's flagship AI product — scores Level 1. No Content-Signal directive (the surface kept the old, looser robots.txt). No markdown negotiation. No `/AGENTS.md`. No MCP card. The rubric flags it for [Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules): agent capabilities are advertised, but no contract file declares how to use them. The site's own robots.txt comment says "Move to ai-sdk.dev" — the migration appears to have left the agent-readability story behind.

A note on rubric honesty: a few "200 OK" responses on Vercel's surfaces are the Next.js SPA catchall returning the HTML shell, not the requested asset. The scorer counts the 200; in production an agent would get HTML where it expected markdown. v0.1.3 of the rubric will tighten this. The Vercel score does not change materially with the fix — `/llms.txt` and `robots.txt` are real on the docs surface — but the precision matters for the next bi-weekly run.

## The top three fixes

1. **Publish an MCP Server Card from `vercel.com` and reference it from the homepage hero.** Worth 15 points on the marketing root. Vercel already operates MCP servers in production through the platform; the missing breadcrumb is the discovery file. Today an agent reading `vercel.com` can see "SDK" on the page but not "here is our MCP server, here is the install command, here is the auth flow." The capability is real. The discovery document is not. See [Interface First](https://agentsfirst.dev/principles/interface-first/).

2. **Lift the docs pattern to `sdk.vercel.ai` (and its destination `ai-sdk.dev`).** The docs surface has the playbook: real `/llms.txt`, markdown negotiation, Content-Signal, MCP/SDK in the hero. Apply it identically to the AI SDK home. Currently the AI SDK home triggers [Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules) — the worst look for the product whose customers are AI builders. Lowest-effort fix; same hosting, same team, same conventions.

3. **Ship a real `/AGENTS.md` on all three surfaces.** Today the path returns 200 because the SPA catches everything; the body is HTML, not the contract file an agent expects. Publish an actual markdown contract — permissions, identifier conventions, sequencing rules, escalation triggers — at the path. Closes the gap our [Contract First](https://agentsfirst.dev/principles/contract-first/) principle is named for, and gets credit in v0.1.3 of the rubric when the SPA-catchall loophole closes.

## What other companies can learn from this

Vercel is now the only Level 4 product in this series, and the lesson is still about variance. One subdomain at Level 4, one at Level 3, one at Level 1 — for the company that arguably sells more AI infrastructure than anyone else in this report cycle. A Level 4 product is Level 4 on every surface an agent might reach. Pick your three highest-traffic subdomains and score them. The variance is the bug.

The other lesson: **a real `/llms.txt` is necessary but not sufficient.** Vercel publishes one at all three surfaces. Two of those three still score Level 1 or 2. `/llms.txt` is the cheapest 10 points in the rubric; the rest of the score lives in MCP discovery, content negotiation, and visibility from the human-onboarding hero. Stack the layers; don't ship one and stop.

## How we scored this

Three URLs were probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-07: `vercel.com/docs` (90/100, Level 4), `vercel.com` (70/100, Level 3), `sdk.vercel.ai` (20/100, Level 1). Headline is the highest of the three. Raw probe data — robots.txt bodies, content-negotiation responses, capability checks — is in [the report directory](https://github.com/capitalthought/agentsfirst/tree/main/reports/vercel).

Methodology note: re-scored 2026-05-07 against rubric **v0.2.0**, which (a) promoted `/AGENTS.md` from 10pts to 15pts and demoted `/llms.txt` from 10pts to 5pts in the Discoverability dimension (section total still 25); (b) credits `/agents.json` equally with `/.well-known/mcp-server-card[.json]`; (c) credits `/sitemap-index.xml` equally with `/sitemap.xml`. Vercel's docs surface gained 15pts in this re-scoring (75 → 90), pushing the level from 3 → 4. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

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
