---
title: "Agent Readiness Report: Google"
description: "Google scored 25/100 (Level 1) on developers.google.com — the highest of four surfaces. google.com and blog.google land at 5/100, Level 0. Google invented the Google-Extended user-agent and doesn't use it on any of these four surfaces."
image: /reports/google/og.png
author: Joshua Baer
permalink: /reports/google/
report_target: Google
report_score: 25
report_level: 1
report_date: 2026-05-08
---

# Agent Readiness Report: Google

**Score: 25/100 · Level 1 (Agent as Afterthought)** · scored across google.com / developers.google.com / cloud.google.com / blog.google — 2026-05-06. Highest surface: `developers.google.com` at 25/100. `cloud.google.com`: 15/100. `google.com` and `blog.google`: 5/100.

Google ships Gemini, Vertex AI Agent Builder, the Workspace agent platform, and a public MCP server for Workspace. Google also invented the `Google-Extended` user-agent — the AI-training opt-out convention every other publisher's robots.txt now references. We pointed our scorer at four of Google's most public surfaces. None of them use `Google-Extended`. None publish `/llms.txt`. None ship an MCP Server Card. The variance is mild — 25 / 15 / 5 / 5 — because the floor is so low. This is the [Cloudflare report](https://agentsfirst.dev/reports/cloudflare/) shape, but with a wider gap between what the company ships internally and what its public surfaces broadcast.

## What's working

`developers.google.com` does the one thing that lifts it off the floor: the homepage hero **references the CLI** (`gcloud`, `gemini-cli`, `firebase`). Our rubric credits that as a partial signal in [agent-capabilities](https://agentsfirst.dev/principles/interface-first/) (10 of 30) and full marks in [visibility-of-agent-integrations](https://agentsfirst.dev/principles/visible-outputs/) (10 of 10) — agent install paths sit alongside human onboarding, not buried three clicks deep. That's the difference between Google's developer subdomain and `cloud.google.com`, which references the SDK in copy but doesn't promote install above the fold.

Sitemaps are clean across all four surfaces. That's where the affirmative signal ends.

## What's missing

**No `Google-Extended` directive on any of the four surfaces.** Google [introduced Google-Extended in September 2023](https://blog.google/technology/ai/an-update-on-web-publisher-controls/) as the way publishers opt out of training Gemini and Vertex AI on their content. Two and a half years later, Google's own four flagship surfaces declare nothing about AI bot policy. Compare to `cloudflare.com`, which carries Cloudflare's own `Content-Signal` directive on every subdomain. **Bot-access-control is 0/15 across all four Google surfaces.** That's not a forgotten subdomain; that's a category-wide gap in the company that wrote the convention.

**No `/llms.txt` anywhere.** Not on developers, not on cloud, not on the blog, not on the marketing root. `developers.google.com/robots.txt` is three lines long. **Discoverability is 0/25 on every surface.** Anthropic, Stripe, Vercel, and Cloudflare all publish `/llms.txt`; Google's developer subdomain — the one feeding the largest documentation corpus on the open internet — does not.

**Agent-capabilities is 0/30 on google.com and blog.google, 10/30 on the other two.** The Workspace MCP server is real and in production. Gemini exposes function-calling. Vertex AI ships the Agent Builder. None of that is discoverable from any of these four URLs. That's [the Invisible Product](https://agentsfirst.dev/glossary/#invisible-product) — the capability is real, the signal isn't — and the scorer flagged it on `google.com` and `blog.google`. On `developers.google.com` and `cloud.google.com` the scorer flagged a different anti-pattern: [Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules). Agent surfaces are advertised; no `/AGENTS.md` or `/.well-known/agent-rules` declares the contract.

No markdown content negotiation on any surface. No discoverable OpenAPI document at the root paths. No `/.well-known/mcp-server-card`.

## The top three fixes

1. **Publish `Google-Extended` on every Google-owned domain.** Google invented this. The fix is one block in robots.txt — `User-agent: Google-Extended` plus the explicit policy. While there, add the per-named-bot blocks for `GPTBot`, `ClaudeBot`, `anthropic-ai`, `PerplexityBot`, `CCBot`. Worth 15 points across every surface and closes the credibility gap between "we wrote the convention" and "we use it." See [Contract First](https://agentsfirst.dev/principles/contract-first/).

2. **Ship `/llms.txt` on `developers.google.com` and `cloud.google.com`.** Both surfaces host the largest first-party documentation corpus in their categories. A single `/llms.txt` per surface that indexes the product taxonomy unlocks 25 points and lifts both subdomains from Level 1 toward Level 2 immediately. Add a `/llms-full.txt` archive following [the pattern Cloudflare ships](https://developers.cloudflare.com/llms-full.txt) and the score moves further. Lowest-effort move on the board. See [Interface First](https://agentsfirst.dev/principles/interface-first/).

3. **Publish an MCP Server Card from `cloud.google.com` and `developers.google.com`, and reference it from each homepage hero.** Google operates production MCP servers. `cloud.google.com` already has the Vertex AI Agent Builder. The missing piece is the discovery breadcrumb — `/.well-known/mcp-server-card` plus a hero call-out that says "this exists, here's the install command, here's the auth flow." Closes [the Invisible Product](https://agentsfirst.dev/glossary/#invisible-product) gap and is worth 30 points on the surfaces that don't currently reference any agent capability. See [Interface First](https://agentsfirst.dev/principles/interface-first/).

## What other companies can learn from this

Two lessons.

The first is the same lesson [Cloudflare's report](https://agentsfirst.dev/reports/cloudflare/) surfaced: a Level 3 product is Level 3 across every surface an agent might land on. Google's gap is wider than Cloudflare's because there are more surfaces to keep aligned. Internal teams ship Gemini, Vertex AI, Workspace agents, and the MCP server while the public surfaces — the ones agents actually crawl — broadcast none of it. Score the surfaces an agent will encounter first, not the ones the platform team is proud of.

The second lesson is sharper. **Inventing a convention does not exempt you from following it.** Google wrote `Google-Extended`. Two and a half years later, four of Google's most-trafficked public surfaces don't declare it. The strongest signal a publisher can send about AI policy is to use the convention they wrote on the homepage that demonstrates they wrote it. The fix is fifteen seconds of robots.txt edits per surface and zero engineering work. Ship it.

## How we scored this

Four URLs were probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-06: `www.google.com` (5/100, Level 0), `developers.google.com` (25/100, Level 1), `cloud.google.com` (15/100, Level 1), `blog.google` (5/100, Level 0). Headline is the highest of the four. Raw probe data — robots.txt bodies, content-negotiation responses, capability checks — is in [the report directory](https://github.com/capitalthought/agentsfirst/tree/main/reports/google).

Methodology note: re-scored 2026-05-07 against rubric **v0.2.0** — `/AGENTS.md` promoted from 10pts → 15pts (canonical contract artifact); `/llms.txt` demoted from 10pts → 5pts (10% adoption per SE Ranking, Google declined to support); `/agents.json` and `/sitemap-index.xml` now credited equally with their canonical equivalents. Section totals unchanged.txt` (Cloudflare's convention) and per-named-bot blocks for `GPTBot`, `ClaudeBot`, `anthropic-ai`, `Google-Extended`, `PerplexityBot`, `CCBot`. None of the four Google surfaces declared any of them. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

We scored google.com only — the search and developer surfaces of Google itself. YouTube, Android, Workspace, Maps, Pixel, and Alphabet's other products are separate surfaces and would each score against a separate scorecard. None of them are in this report.

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
