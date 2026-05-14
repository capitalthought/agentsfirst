---
title: "Agent Readiness Report: Anthropic"
description: "Anthropic — the company that wrote MCP — scored 60/100 (Level 2) on docs.anthropic.com. The marketing root scored 5/100, Level 0. The variance is the story."
image: /reports/anthropic/og.png
author: Joshua Baer
permalink: /reports/anthropic/
report_target: Anthropic
report_score: 60
report_level: 2
report_date: 2026-05-14
---

# Agent Readiness Report: Anthropic

**Score: 60/100 · Level 2 (Agent-Aware)** · scored across anthropic.com / docs.anthropic.com / claude.ai — 2026-05-06. Highest surface: `docs.anthropic.com` at 60/100. Consumer product `claude.ai`: 45/100. Marketing root `www.anthropic.com`: **5/100, Level 0**.

Anthropic invented [the Model Context Protocol](https://agentsfirst.dev/glossary/#mcp) — the standard the rubric this report uses is built around. We scored Cloudflare first (they wrote the original Agent Readiness Score post). Anthropic was the obvious second target: peer-review the company at the protocol's center. The headline number is fine. The shape underneath it is not. A 55-point spread across three surfaces, and the marketing site for the company that ships the protocol scores Level 0 against a rubric that *credits* the protocol.

## What's working

`docs.anthropic.com` does what most developer docs don't.

A real **`/llms.txt`** — 146KB, structured by product, full enough to power offline indexing. It opens with the canonical entry point (`platform.claude.com`) and inventories every doc surface, in 11 languages. Real depth, not a stub. Worth 20 of 25 points in [discoverability](https://agentsfirst.dev/principles/interface-first/).

A real **`/.well-known/mcp-server-card`** with OAuth-with-PKCE auth-server discovery present. That's [Interface First](https://agentsfirst.dev/principles/interface-first/) shipping the way the principle describes. 20 of 30 points in agent-capabilities — not full marks (the homepage hero still doesn't reference MCP, the CLI, or any SDK install path), but the discovery breadcrumb exists and works.

Clean **20 of 20 on content-accessibility**. Markdown content negotiation works — hit any docs URL with `Accept: text/markdown` and the server returns markdown. Sitemap present. OpenAPI surface discoverable. The dimension Cloudflare's docs also scored full marks on; the table-stakes signal that says "an agent fetched this page can actually read it."

`claude.ai` ships /llms.txt, an `/AGENTS.md` (Cloudflare-fronted, requires JS to fetch — but present), and the same MCP server card. 45/100, Level 2 for a consumer product is not embarrassing.

## What's missing

**`www.anthropic.com` scores 5 of 100. Level 0. No agent access.** Generic `User-Agent: *, Allow: /` robots.txt. No `/llms.txt`. No `/AGENTS.md`. No MCP Server Card. No CLI or SDK reference from the homepage. The marketing site for the company that *defined the protocol the rubric credits* is invisible to the protocol. Pure [Invisible Product](https://agentsfirst.dev/glossary/#invisible-product) — the canonical anti-pattern, scored against the canonical author.

**Bot-access-control is zero across all three surfaces** — 0 of 15 points everywhere. No `Content-Signal` directive (Cloudflare's protocol — Anthropic uses Cloudflare in front of `claude.ai`; the directive is one robots.txt edit away). And, more striking: **no per-bot rules naming `ClaudeBot` or `anthropic-ai`** on any of the three surfaces. The `claude.ai` robots.txt does name three bots — but they're all OpenAI's (`GPTBot`, `OAI-SearchBot`, `ChatGPT-User`), and they're all `Disallow: /`. The directives Anthropic publishes about bots are blocks on its competitor's bots. The bots Anthropic operates are unmentioned by Anthropic, anywhere. Below the threshold for granular-control credit on every surface.

**Visibility-of-agent-integrations is 0/10 on all three surfaces.** The homepage at anthropic.com sells the model. Nothing on it says "we ship an MCP server." Nothing on it says "here's the install command." The MCP server card lives at `docs.anthropic.com/.well-known/mcp-server-card` and a developer who already knew to look would find it. A model crawling anthropic.com cannot.

## The top three fixes

1. **Lift the docs pattern to `anthropic.com`.** `/llms.txt`, `/AGENTS.md`, MCP server card, sitemap — copy them up one level. The docs subdomain has the artifacts; the marketing site has none of them. This is the same fix Cloudflare needs ([their report](https://agentsfirst.dev/reports/cloudflare/) called it lift-/llms.txt-to-the-blog), and at Anthropic the asymmetry is sharper because the company is what it is. Worth ~50 points on the marketing root alone, and closes the [Invisible Product](https://agentsfirst.dev/glossary/#invisible-product) anti-pattern in one PR.

2. **Publish a per-bot policy that names your own bots.** Add `User-agent: ClaudeBot`, `User-agent: anthropic-ai`, and `User-agent: claude-web` blocks to robots.txt on all three surfaces. Pick `Allow: /` or `Disallow: /` per surface — the value is the explicit declaration, not the verdict. While you're in the file, ship `Content-Signal: ai-train=yes, search=yes, ai-input=yes` (or whatever Anthropic's actual position is). The company that ships the protocol agents read should be the most legible to those agents. Worth 15 points on every surface and closes the [Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules) gap. See [Contract First](https://agentsfirst.dev/principles/contract-first/).

3. **Reference the MCP server from the homepage hero, not just `/.well-known/`.** A line on `anthropic.com` that says "we ship an MCP server — `claude mcp add anthropic`" or equivalent. The capability is real and shipped. The signal isn't. 10 points on visibility-of-agent-integrations across every surface and the remaining 10 points in agent-capabilities. See [Interface First](https://agentsfirst.dev/principles/interface-first/).

## What other companies can learn from this

The strongest signal in this report is structural. The team that ships the developer surface ships the right artifacts. The team that ships the marketing surface does not. **A Level 3 product is Level 3 across every surface an agent might land on**, and the surface most likely to be hit first is the one named after the company.

The other lesson is for protocol authors specifically: shipping the protocol and shipping a *signal that you ship the protocol* are different jobs. Anthropic ships MCP. Anthropic does not ship a robots.txt that names its own bot. Both can be true. The fix is fifteen lines.

## How we scored this

Three URLs were probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-06: `www.anthropic.com` (5/100, Level 0), `docs.anthropic.com` (60/100, Level 2), `claude.ai` (45/100, Level 2). Headline is the highest of the three. Raw probe data — robots.txt bodies, content-negotiation responses, MCP server card status — is in [the report directory](https://github.com/capitalthought/agentsfirst/tree/main/reports/anthropic).

Methodology note: re-scored 2026-05-07 against rubric **v0.2.0** — `/AGENTS.md` promoted from 10pts → 15pts (canonical contract artifact); `/llms.txt` demoted from 10pts → 5pts (10% adoption per SE Ranking, Google declined to support); `/agents.json` and `/sitemap-index.xml` now credited equally with their canonical equivalents. Section totals unchanged.txt` (the convention Cloudflare invented), the `/.well-known/mcp-server-card` discovery (the convention Anthropic invented), and per-named-bot rules at a 3+ threshold. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

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
