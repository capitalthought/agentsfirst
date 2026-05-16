---
title: "Agent Readiness Report: Cloudflare"
description: "Cloudflare scored 85/100 (Level 3 — Agents First) on www.cloudflare.com — but developers.cloudflare.com lags at 35/100. The company that coined Agent Readiness Score shipped the artifacts on the marketing root, not the dev portal."
image: /reports/cloudflare/og.png
author: Joshua Baer
permalink: /reports/cloudflare/
report_target: Cloudflare
report_score: 85
report_level: 3
report_date: 2026-05-16
---
# Agent Readiness Report: Cloudflare

**Score: 85/100 · Level 3 (Agents First)** · scored across www.cloudflare.com / developers.cloudflare.com / blog.cloudflare.com — re-scored 2026-05-16 against rubric v0.3.2. Highest surface: `www.cloudflare.com` at **85/100, Level 3**. Developer portal `developers.cloudflare.com`: **35/100, Level 2**. Blog `blog.cloudflare.com`: **0/100, Level 0**.

The headline number puts Cloudflare in the public series' top tier — second only to [Vercel](https://agentsfirst.dev/reports/vercel/) at 90. That ranking matters because **Cloudflare wrote the [Agent Readiness Score post](https://blog.cloudflare.com/agent-readiness/) the Agents First framework cites**. They scored themselves, then shipped the artifacts: `/AGENTS.md`, `/agents.json`, a named-bot `robots.txt`, Content-Signal directives, markdown content negotiation, OpenAPI discoverability — all at the marketing root. The framework's whole premise is "design for the agent customer first." Cloudflare did the work, then graded their own homework with public results. The variance is the story. **An 85-point spread between `www.cloudflare.com` (85) and `blog.cloudflare.com` (0)** — and the surface that lags hardest is the blog hosting the original Agent Readiness Score post itself. The dev portal where agents actually go to learn how to ship a Worker sits in the middle at 35. The team that wrote the rubric got the marketing site to Level 3. The dev portal is one cycle behind on the same artifacts. The blog is two cycles behind — Level 0, no agent access. Inverted-Notion: marketing leads, docs follow, blog disappears.

## What's working

`www.cloudflare.com` does the things this rubric was written to find — and then keeps going.

A real **`/AGENTS.md`** at the marketing root — published, served at 200, hits the rubric checkbox for the canonical [contract artifact](https://agentsfirst.dev/principles/contract-first/). Worth the full 10 of 10 in discoverability that the v0.3.2 rubric weights it at. (Caveat: the file itself is 21 lines of auto-generated description and a pointer to `developers.cloudflare.com` — the breadcrumb is in place but the constraint contract is empty. Top 3 fix #3 below addresses this.)

A real **`/agents.json`** at the marketing root — the [A2A](https://agentsfirst.dev/glossary/#a2a) protocol agent registry, declaring `Cloudflare Site Agent` with the protocol version named. That's the discovery breadcrumb agents look for; Cloudflare ships it.

A real **`/llms.txt`** — 30+ products listed with descriptions, a structured content map an LLM can navigate. Notes that "all pages on this site are available in markdown format by appending .md to the URL" — the agent isn't just told the topology; it's given the convention to fetch any page in machine-readable form.

**Full 25 of 25 on [discoverability](https://agentsfirst.dev/principles/interface-first/)** — robots.txt explicitly addresses 7 named AI agents (`GPTBot`, `anthropic-ai`, `Claude-Web`, `Google-Extended`, `PerplexityBot`, `CCBot`, `cohere-ai`), each with `Allow: /`. Opt-in posture, not blanket-deny. The pattern isn't "block crawlers and hope" — it's "we want these models to read this site, here are the names, here's the affirmative permission." Plus Content-Signal directives for `ai-train=yes, search=yes, ai-input=yes`. Plus per-bot granular posture. Full 15 of 15 on bot-access-control.

Clean **20 of 20 on content-accessibility**. Markdown content negotiation works (the same `.md` suffix convention that `developers.cloudflare.com` pioneered, replicated on the marketing root). Sitemap present. OpenAPI surface discoverable.

**25 of 30 on [agent-capabilities](https://agentsfirst.dev/principles/interface-first/)** — MCP Server Card present (via `/agents.json`), homepage references SDK. Only point loss on the dimension: no OAuth-with-PKCE auth-server discovery — the dimension's hardest 5-pointer.

## What's missing

**`developers.cloudflare.com` scores 35/100. Level 2. The Invisible Product fires.** Same company, same engineering culture, demonstrably the same playbook one subdomain over — and the dev portal where agents land to learn how to ship a Worker has no `/AGENTS.md`, no `/agents.json`, no `/.well-known/mcp-server-card.json`, no per-bot robots.txt posture. The dev portal does ship `/llms.txt` (worth 5 points) and serves markdown content negotiation cleanly (the full 20 of 20 on content-accessibility), but the discoverability dimension scores 5 of 25. Bot-access-control scores 10 of 15. **The agent-capabilities dimension scores 0 of 30.** The exact dimension a developer-facing surface should crush.

This is the surface Cloudflare's own [docs-for-agents page](https://developers.cloudflare.com/docs-for-agents/) was built to serve. The premise of that page — "the agent reader and the human reader want different views of the same docs" — is correct. The implementation hasn't followed yet. An agent crawling `developers.cloudflare.com/docs-for-agents` finds the human-readable docs page about the agent-friendly view; an agent crawling `developers.cloudflare.com` for the actual machine-readable artifacts finds gaps the marketing root doesn't have.

**`blog.cloudflare.com` scores 0/100. Level 0. No agent access.** Not a Level 1 with partial credit — a clean zero. None of the artifacts are present: no `/AGENTS.md`, no `/llms.txt`, no MCP Server Card, no markdown content negotiation, no Content-Signal, no sitemap signal the probe can credit. The blog hosting the original Agent Readiness Score post — the canonical-source publication for the entire framing — returns nothing structured to an agent. An agent fetching `blog.cloudflare.com/agent-readiness/` to summarize "what is Cloudflare's Agent Readiness Score" gets human HTML and no machine-readable signal that this is the authoritative explainer for the framework Cloudflare itself published.

**Visibility-of-agent-integrations is 0/10 on the marketing root** — the only point loss at the best surface. Cloudflare ships an MCP server, an SDK, the Workers + Agents platform infrastructure. The homepage hero at `cloudflare.com` does not reference any of it next to the human-onboarding flow. That's the 10 points keeping `www.cloudflare.com` from a 95.

**The `/AGENTS.md` is an auto-generated stub.** 21 lines: title, description, and three product links. No usage rules, no rate limits, no scope hierarchy, no constraint contract. The file passes the rubric's discoverability check because it exists at the canonical path; but it doesn't do the work [Contract First](https://agentsfirst.dev/principles/contract-first/) names — "the constraints an agent can't infer from the code." The breadcrumb is shipped; the document the breadcrumb points at is empty.

## 🚨 Anti-patterns flagged

- **[The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — flagged on `developers.cloudflare.com` and `blog.cloudflare.com`. The capability is real and shipped at the marketing root: `/AGENTS.md`, `/agents.json`, named-bot robots.txt, Content-Signal, MCP server, full discoverability stack. The two surfaces an agent is most likely to visit (the dev portal, the blog) advertise none of it. The blog's version of Invisible Product is the more acute case — a Level 0 score on the surface that published the framework defining the score.

(The marketing root `www.cloudflare.com` flagged zero anti-patterns. The Invisible Product is the inverse-pattern Cloudflare is currently solving on the marketing surface and one cycle behind on the developer surface — and two cycles behind on the blog.)

## 🎯 Top moves to climb a level

1. **Replicate the marketing-root pattern on `developers.cloudflare.com`.** Biggest leverage by far — closes the 50-point gap between the two surfaces and addresses the Invisible Product anti-pattern at the surface that matters most. The work has already been done once; copying `/AGENTS.md`, `/agents.json`, the named-bot stanzas, and the Content-Signal directives over to the dev portal is a flat-file edit. ~30 minutes for the same artifacts, +50 points on the surface where developers actually integrate. The dev portal team probably already has the marketing team's commit history to reference. See [Interface First](https://agentsfirst.dev/principles/interface-first/) and [Contract First](https://agentsfirst.dev/principles/contract-first/).

2. **Ship anything at all on `blog.cloudflare.com`.** A Level 0 score means the floor is open. The marginal first move is the cheapest one — a named-bot `robots.txt` stanza and a `sitemap.xml` reference gets the blog out of Level 0 immediately. The structural move is replicating the marketing-root artifact set (`/llms.txt`, `/AGENTS.md`, Content-Signal, markdown content negotiation) so that the agent-readiness post itself is machine-readable on the surface that hosts it. The credibility cost of the current state is higher than the engineering cost of fixing it.

3. **Add a homepage MCP / Agents callout above the fold at `cloudflare.com`.** The only 10 points keeping the marketing root from a 95. Cloudflare ships an MCP server in production. The hero on `cloudflare.com` does not say so. One line — `Connect Cloudflare to your AI agent: install our MCP server` with the discoverable install command — closes [visibility-of-agent-integrations](https://agentsfirst.dev/principles/visible-outputs/) without changing the human funnel. See [Interface First](https://agentsfirst.dev/principles/interface-first/).

4. **Upgrade `/AGENTS.md` from auto-gen stub to hand-authored constraint contract.** The file is 21 lines of description + product links. The rubric credits its presence; the [Contract First](https://agentsfirst.dev/principles/contract-first/) principle credits its content. Add the non-obvious rules an agent can't infer from the docs — Workers free-tier limits, Worker-vs-Pages routing, when to use Durable Objects vs KV, R2-egress posture, the Cloudflare-specific Wrangler conventions agents otherwise hallucinate. ~50 lines, hand-written, would be load-bearing. The framework's [Token Dump](https://agentsfirst.dev/glossary/#token-dump) anti-pattern means *don't* write 6,000 tokens; do write the 50 lines that prevent the 5 most expensive misuse modes.

## What other companies can learn from this

Three patterns worth naming.

**The marketing root vs dev portal split is the most-repeated finding in this report series.** [Notion](https://agentsfirst.dev/reports/notion/): docs at 65, marketing at 10. [Anthropic](https://agentsfirst.dev/reports/anthropic/): docs at 60, marketing at 5. [Linear](https://agentsfirst.dev/reports/linear/): docs at 60, marketing weaker. Cloudflare inverts the pattern — marketing at 85, docs at 35 — but the pattern itself is the same: one team's site shipped the artifacts and the adjacent team's site didn't. The cause is org-chart, not engineering. The fix is treating these artifacts as repo templates that propagate across every public hostname an agent might land on. Anything else compounds the asymmetry — and the blog's 0/100 is the asymmetry taken to its limit.

**Self-grading the framework you wrote is a credibility move, not a vanity move.** Cloudflare published the Agent Readiness Score post in April 2026. They scored "fewer than 15 sites publish MCP Server Cards or API Catalogs combined" against the top 200K websites. By May 2026, the marketing root they own scores 85 against the rubric the post implied. That sequence — write the rubric, score yourself, publish the result, ship the gaps — is exactly the credibility loop a reference customer should run. The fact that the score isn't 100 — and that the blog hosting the post itself scores 0 — isn't a failure; it's the proof that the rubric is honest. A vanity rubric would have scored the blog higher.

**The agent-readability artifacts cost almost nothing to ship.** `/AGENTS.md`, `/agents.json`, `/llms.txt`, named-bot `robots.txt`, Content-Signal, markdown content negotiation — six artifacts, all flat-file edits or single-line server config. Cloudflare's marketing root shipped them in a deploy cycle. The 50-point gap to the dev portal and the 85-point gap to the blog exist because nobody has done the same flat-file edits over there yet — not because the work is hard.

A Level 3 product is Level 3 on every surface an agent might land on. Cloudflare is two team-handoffs away from being Level 3 across the board.

## How we scored this

Three URLs were probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-16: `www.cloudflare.com` (85/100, Level 3), `developers.cloudflare.com` (35/100, Level 2), `blog.cloudflare.com` (0/100, Level 0). Headline is the highest of the three. Raw probe data — robots.txt bodies, markdown content negotiation responses, capability-card checks — is in [the report directory](https://github.com/capitalthought/agentsfirst/tree/main/reports/cloudflare).

Methodology note: scored against rubric **v0.3.2**, which (a) tiered AGENTS.md by length to penalize the [Token Dump](https://agentsfirst.dev/glossary/#token-dump) anti-pattern, (b) refined SEP-2567 sessionless-MCP detection, and (c) credits `/agents.json` and `/sitemap-index.xml` as canonical equivalents to `/.well-known/mcp-server-card.json` and `/sitemap.xml` respectively. Cloudflare's `/agents.json` registry is what earns the MCP Server Card credit at the marketing root. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

History note: this is a **re-score** of an earlier report. The 2026-05-06 probe scored Cloudflare at 35/100 against rubric v0.1.2, with `developers.cloudflare.com` as the best surface. Between that probe and the 2026-05-16 re-score, Cloudflare shipped the artifacts (`/AGENTS.md`, `/agents.json`, named-bot robots.txt, Content-Signal) on the marketing root. The 50-point jump is real movement, not a rubric artifact — the live probe confirms each artifact at 200 with the expected payload. The same probes against `developers.cloudflare.com` return 404 — the dev portal hasn't received the same shipment yet. Against `blog.cloudflare.com` the probes return nothing the rubric can credit; the blog's Level 0 score reflects an absence of artifacts, not a partial-credit floor.
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
