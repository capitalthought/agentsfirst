---
title: "Agent Readiness Report: Notion"
description: "Notion scored 65/100 (Level 3 — Agents First) on developers.notion.com. Marketing root: 10/100, Level 0. Largest score gap in the public series — the variance is the story."
image: /reports/notion/og.png
author: Joshua Baer
permalink: /reports/notion/
report_target: Notion
report_score: 65
report_level: 3
report_date: 2026-05-21
---

# Agent Readiness Report: Notion

**Score: 65/100 · Level 3 (Agents First)** · scored across notion.so / notion.com / developers.notion.com — 2026-05-07 against rubric v0.2.0. Highest surface: `developers.notion.com` at **65/100, Level 3**. Marketing root `notion.so`: **10/100, Level 0**. `notion.com`: **10/100, Level 0**.

The headline number puts Notion's developer portal in the celebration tier alongside [Vercel](https://agentsfirst.dev/reports/vercel/), Cursor, and Browserbase. The variance is the story. **A 55-point gap between `developers.notion.com` and `notion.so` — the largest score spread in the public series**, beating the [Anthropic](https://agentsfirst.dev/reports/anthropic/) split (60 vs 5) by absolute headline and Notion's two top surfaces by direction. The platform team gets it. The marketing team is one cycle behind. The page Notion's millions of users land on first scores Level 0 against a rubric that already credits a real `/llms.txt` Notion publishes there — because everything else around it is missing.

## What's working

`developers.notion.com` does the things this rubric was written to find.

A real **`/AGENTS.md`** at the docs root — 2,833 bytes, written for the team itself ("Sentence case, descriptions in YAML frontmatter, snippets live in `snippets/`…"), and it opens by pointing the agent at the [`/llms.txt`](https://developers.notion.com/llms.txt) companion. That's a contract artifact that means it. Worth 15 of 25 in [discoverability](https://agentsfirst.dev/principles/interface-first/) — full credit for AGENTS.md plus partial for the optional /llms.txt.

A real **`/llms.txt`** — 24KB, structured documentation index. Promoted in the AGENTS.md to "fetch the complete documentation index at this URL." Cheap 5 points and, more importantly, the breadcrumb that lets an agent who lands on AGENTS.md know where to go next.

Clean **20 of 20 on content-accessibility**. Markdown content negotiation works on the docs surface. Sitemap present. **OpenAPI surface discoverable** at `developers.notion.com/openapi.json` — a real spec, not a 404 with a 200 SPA shell. The Notion API team published it, kept it fresh, made it findable.

A `.well-known/oauth-authorization-server` resolves with a real document. That's the [OAuth 2.0 with PKCE](https://agentsfirst.dev/glossary/#oauth-pkce) discovery surface an agent expects, and it exists today. Half the agent-capabilities credit, present.

**The homepage hero references MCP and the API alongside human onboarding.** Notion ships an MCP server (`https://mcp.notion.com/mcp`), and `developers.notion.com` references it from the visible-without-scrolling part of the page. 10/10 on visibility-of-agent-integrations — the dimension almost everyone fails. That's [Interface First](https://agentsfirst.dev/principles/interface-first/) signaling done right, on the surface where developers land.

## What's missing

**`notion.so` and `notion.com` both score 10/100. Level 0. No agent access.** Same robots.txt on both surfaces (they appear to serve the same property — `notion.so` is the historical origin, `notion.com` the rebrand; both resolve to the same marketing site). Both score the same. The page that actually reaches Notion's millions of users is invisible to the protocol.

What's surprising in the data: **`notion.com/llms.txt` returns 200 with a real 6,914-byte index** — Notion already publishes /llms.txt at the marketing root. The rubric still scored the surface at 10/100 because everything else around the file is missing: no `/AGENTS.md`, no MCP server card, no per-bot policy in robots.txt, no markdown content negotiation, no OpenAPI surface, no homepage reference to MCP / CLI / SDK / API. The cheapest piece of agent-readability is already shipped. The other 55 points are not.

**No MCP Server Card on any surface.** `/.well-known/mcp-server-card`, `/.well-known/mcp.json`, `/agents.json` — all 404 across notion.so, notion.com, and developers.notion.com. Notion operates a hosted MCP server in production at `mcp.notion.com`. An agent fetching the discovery file on any of the three surfaces probed cannot tell. Worth 15 points across every surface.

**Bot-access-control scores 0/15 on every surface.** No `Content-Signal` directive. The `notion.so` robots.txt does name five bots — but they're all crawlers being blocked (`BLEXBot`, `AhrefsBot`, `Amazonbot`, `SemrushBot`, `dotbot`). The bots Notion's customers actually want to make decisions about its product (`GPTBot`, `ClaudeBot`, `anthropic-ai`, `Google-Extended`, `PerplexityBot`, `CCBot`) are unmentioned. The robots.txt declares positions on SEO crawlers and stays silent on AI crawlers.

**Visibility-of-agent-integrations is 0/10 on the marketing root.** The homepage at `notion.com` and `notion.so` does not mention MCP. Does not mention the API. Does not mention any agent-developer integration. A model crawling the page Notion most wants humans to see learns nothing about the product Notion most wants AI builders to use.

## 🚨 Anti-patterns flagged

- **[The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — flagged on both `notion.so` and `notion.com`. The capability is real and shipped: a hosted MCP server at `mcp.notion.com`, a JS SDK on npm, the API surface at `developers.notion.com`. The marketing root advertises none of it. An agent crawling notion.so to evaluate "can I use Notion as a tool" walks away with no.

## 🎯 Top moves to climb a level

1. **Add `/AGENTS.md` and Content-Signal to the marketing root.** The hardest discoverability win — the load-bearing 15-point contract artifact in v0.2.0 of the rubric — is a flat markdown file. Drop the `developers.notion.com/AGENTS.md` content (or a re-pointed version) at `notion.so/AGENTS.md` and `notion.com/AGENTS.md`. While the file is being published, ship `Content-Signal: search=yes, ai-input=yes, ai-train=<your-actual-position>` and per-bot blocks naming `GPTBot`, `ClaudeBot`, `anthropic-ai`, `Google-Extended`, `PerplexityBot`, `CCBot`. ~30 minutes of work, ~30 points on the marketing root, and closes the [Invisible Product](https://agentsfirst.dev/glossary/#invisible-product) anti-pattern. See [Contract First](https://agentsfirst.dev/principles/contract-first/).

2. **Publish the MCP Server Card from all three surfaces.** Notion runs `mcp.notion.com` in production. The discovery breadcrumb that says "we run this; here's how to install it" — `/.well-known/mcp-server-card` — is missing from every surface scored. Publish it at notion.so, notion.com, and developers.notion.com pointing at the existing server. 15 points per surface. See [Interface First](https://agentsfirst.dev/principles/interface-first/).

3. **Reference the MCP server from the notion.so homepage hero.** The capability lives at `mcp.notion.com`. The rubric credits MCP-in-the-hero at 10 points. Today an agent reading `notion.so` cannot see "we ship an MCP server — here's the install command, here's the auth flow." A single line above the fold — `Connect Notion to your AI tools: mcp.notion.com` — closes the visibility gap that drops `notion.so` from a likely 40/100 to today's 10/100.

## What other companies can learn from this

This is the most extreme version of a pattern that keeps showing up. [Anthropic](https://agentsfirst.dev/reports/anthropic/): docs at 60, marketing at 5. [Linear](https://agentsfirst.dev/reports/linear/): docs at 60, marketing weaker. Notion: docs at 65, marketing at 10. **The dev portal team gets it. The marketing team is one cycle behind.**

The cost asymmetry is what makes the pattern bizarre. The platform team did the hard work — published an OpenAPI spec, shipped an MCP server, wrote an AGENTS.md, served markdown content negotiation, ran an OAuth-with-PKCE discovery surface. None of those is a flat-file edit. Lifting the result up one subdomain — copying `/AGENTS.md`, publishing the MCP card at `/.well-known/`, naming AI bots in robots.txt, adding one line to the homepage hero — is a flat-file edit. **Maybe 30 minutes of work for 30+ points.**

The cost of not making the edit: every agent that crawls `notion.so` walks away believing Notion has no agent story. The agent's user asks "can Claude integrate with Notion?" and the answer the model has cached is "no signal found." Notion has the best agent story in this report cluster after Vercel. Notion's marketing root tells the agent ecosystem none of it.

A Level 3 product is Level 3 on every surface an agent might land on. The one named after the company is the one most likely to be hit first.

## How we scored this

Three URLs were probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-07: `notion.so` (10/100, Level 0), `notion.com` (10/100, Level 0), `developers.notion.com` (65/100, Level 3). Headline is the highest of the three. Raw probe data — robots.txt bodies, content-negotiation responses, capability checks — is in [the report directory](https://github.com/capitalthought/agentsfirst/tree/main/reports/notion).

A note on canonicalization: `notion.so` is the historical origin and `notion.com` is the post-rebrand canonical domain. Both currently serve the same marketing property and score identically (10/100, same dimensions, same anti-patterns flagged). They are reported as separate surfaces because external agents will reach both — old links point at `.so`, new links at `.com`, and a fix shipped to one host needs to land on the other for the score to move.

Methodology note: scored against rubric **v0.2.0**, which (a) promoted `/AGENTS.md` from 10pts → 15pts (canonical contract artifact); (b) demoted `/llms.txt` from 10pts → 5pts (optional companion); (c) credits `/agents.json` and `/sitemap-index.xml` equally with their canonical equivalents. Notion's developer-portal AGENTS.md gets full credit under v0.2.0 — the file is a real markdown contract, not a 200 from a SPA catchall. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

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
