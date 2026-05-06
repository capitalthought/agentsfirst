---
title: "Agent Readiness Report: Linear"
description: "Linear scored 60/100 (Level 2) — and the 60 is overstated. The most agent-loved planning tool of 2026 lacks the discovery breadcrumbs."
image: /og-image.png
author: Joshua Baer
permalink: /reports/linear/
report_target: Linear
report_score: 60
report_level: 2
report_date: 2026-05-06
---

# Agent Readiness Report: Linear

**Score: 60/100 · Level 2 (Agent-Aware)** · scored across linear.app / developers.linear.app / linear.app/docs — 2026-05-06. Highest surface: `developers.linear.app` at 60/100. Marketing root: 30/100. Docs: 30/100.

Linear is the engineering-ergonomics canonical of the agent era. The changelog mentions MCP fourteen times this quarter. They invented [Agent Interaction Guidelines](https://linear.app/developers/agents) — agent badges in the UI, dedicated Agent Sessions, an Agent Activity feed for humans to watch what their agents are doing inside a workspace. Half the engineers we know use Linear specifically because the [MCP](https://agentsfirst.dev/glossary/#mcp) integration is the cleanest of any planning tool. None of that is in the score.

The score is also wrong, and the way it's wrong is the most useful thing in this report.

## What's working

`linear.app` ships a **real `/llms.txt`** — `text/plain`, 9KB, properly structured. Every doc page enumerated as a `.md` URL. Discoverability lands at 20/25 across all three surfaces because of it.

The [Agent Interaction Guidelines](https://linear.app/developers/agents) document is the most thoughtful public statement we've read on what an [Agents-First](https://agentsfirst.dev/glossary/#adoption-levels) product actually looks like in production: agents as first-class principals with their own avatars, activity stream, permission model. This is Level 3 thinking — shipped, in production, reachable from the homepage of a $1B+ SaaS.

## What's missing

**The 60/100 on `developers.linear.app` is a false positive.** The dev portal is a Next.js SPA. Every URL — `/llms.txt`, `/AGENTS.md`, `/.well-known/mcp-server-card.json`, `/.well-known/ai-plugin.json`, `/openapi.json` — returns the same 1.5MB HTML shell with `status: 200`. Our scorer counted those as "the artifact exists." They don't. v0.1.3 of the rubric needs a content-type check before crediting any "MCP Server Card published" signal. We'll ship that fix this week.

**No MCP Server Card on any surface.** Linear runs an official MCP server — documented, advertised in the changelog, demoed at conferences. There is no `/.well-known/mcp-server-card.json` anywhere on `linear.app`. An [agent reading the public surface](https://agentsfirst.dev/glossary/#invisible-product) cannot programmatically discover the install path.

**No `@linear/mcp` on npm.** `npm view @linear/mcp` returns 404. The first three results when an agent searches `linear mcp` are community wrappers (`@hatcloud/linear-mcp`, `@mcp-devtools/linear`, `linear-mcp`) — not the official server. An agent told to "install Linear's MCP" picks a community fork by default. [Ship and Forget](https://agentsfirst.dev/glossary/#ship-and-forget): real product, no canonical handle on the registry agents actually search.

**No bot-access-control rules.** `linear.app/robots.txt` is 107 bytes — `Disallow: /api/`, `Disallow: /cdn-cgi/`, sitemap link, nothing else. No `Content-Signal:` directive. No per-bot blocks for GPTBot, ClaudeBot, Google-Extended, PerplexityBot. 0/15 across all three surfaces — the same blank score every Level 1 site has, jarring on a product this thoughtful about agents.

**No markdown content negotiation.** `Accept: text/markdown` returns HTML. Linear is publishing `.md` URLs in `/llms.txt` — they have the markdown source, they just aren't serving it on the parent URL with the right header.

## The top three fixes

1. **Publish `/.well-known/mcp-server-card.json` on `linear.app` and link it from the developers page hero.** Linear runs the MCP server already; the file is a 30-line static JSON describing the install command, auth flow, and tool list. Worth 30 points across every surface and would land Linear at Level 3 instantly. Pair it with publishing `@linear/mcp` to npm under the official scope. See [Interface First](https://agentsfirst.dev/principles/interface-first/).

2. **Fix the SPA so well-known paths return real artifacts, not the React shell.** Next.js rewrites for `/llms.txt`, `/AGENTS.md`, `/openapi.json`, `/.well-known/*`, `/robots.txt`, `/sitemap.xml`. Today the dev portal silently returns 200 OK on every probe and serves HTML. Worse than a 404 — agents and rubric authors both treat it as "exists" when it doesn't. Closes a [Lazy Wrapper](https://agentsfirst.dev/glossary/#lazy-wrapper) signal nobody intended to ship.

3. **Ship `/AGENTS.md` and add Content-Signal + per-named-bot blocks to robots.txt.** Linear's [Agent Interaction Guidelines](https://linear.app/developers/agents) is already the [contract](https://agentsfirst.dev/principles/contract-first/) — it just lives at a URL the rubric can't find. Cross-publish at `/AGENTS.md` and `/.well-known/agent-rules`. Add `Content-Signal: ai-train=yes, search=yes, ai-input=yes` and the standard six per-named-bot blocks. Closes the [Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules) gap and picks up 15 points in [bot-access-control](https://agentsfirst.dev/principles/contract-first/).

## What other companies can learn from this

Two lessons. For engineering-led companies: **shipping the agent capability isn't the same as letting agents discover it.** Linear has done the hard part — the MCP server, the agent badges, the activity feed, the AIG document. The easy part — three static files at three well-known paths — is what gets the score. The [Two Customers](https://agentsfirst.dev/glossary/#two-customers) framing means both customers need their breadcrumbs, not just the human one.

For SPA-heavy dev portals: **a 200 OK on every URL is not a feature.** `/.well-known/*` exists specifically to be machine-checked. If your framework's catch-all route returns the React shell for `/llms.txt`, you've made every agent's discovery probe a coin flip and every rubric author's life harder. Add the rewrites. Return 404 when there's nothing there. Return the file when there is.

## How we scored this

Three URLs probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-06: `linear.app` (30/100, Level 2), `developers.linear.app` (60/100, Level 2 — but see SPA caveat above), `linear.app/docs` (30/100, Level 2). Headline is the highest of the three. Raw probe data is in [the report directory](https://github.com/capitalthought/agentsfirst/tree/main/reports/linear).

Methodology note: this score uses the v0.1.2 rubric. The developers.linear.app SPA false-positive surfaced a v0.1.3 fix we'll ship this week — credit "MCP Server Card published" only when the response is `application/json` and parses as the expected schema, not on `status: 200` alone. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

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
