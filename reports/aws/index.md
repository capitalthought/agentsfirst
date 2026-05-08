---
title: "Agent Readiness Report: AWS"
description: "AWS scored 50/100 (Level 2 — Agent-Aware) on builder.aws.com. The MCP server hit GA on 2026-05-06; the marketing root at aws.amazon.com still lands at 20/100, Level 1."
image: /reports/aws/og.png
author: Joshua Baer
permalink: /reports/aws/
report_target: AWS
report_score: 50
report_level: 2
report_date: 2026-05-08
---

# Agent Readiness Report: AWS

**Score: 50/100 · Level 2 (Agent-Aware)** · scored across aws.amazon.com / docs.aws.amazon.com / builder.aws.com — 2026-05-07 against rubric v0.2.0. Highest surface: **`builder.aws.com` at 50/100, Level 2**. Marketing root: 20/100, Level 1. Docs: 5/100, Level 0.

This is AWS's first appearance as a standalone report — broken out from [Amazon](/reports/amazon/) following the [GitHub MCP Server GA on 2026-05-06](https://x.com/NewsNerdie/status/2052087768763740515) and AWS's parallel MCP infrastructure announcements. The story is the inverse of Stripe and Coinbase: AWS has ostensibly shipped MCP capability into the platform, but the **marketing root surfaces tell agents almost nothing**. The platform that hosts most of the agent industry has its own discovery story stuck at Level 1 on the front door.

## What's working

**`builder.aws.com`** is the high water mark — and it's a real one. AWS Builder Community ships the kind of structured agent-discoverable content the rubric was written for: a sitemap, a robots.txt that engages with the AI bot ecosystem rather than ignoring it, and signal that AWS is paying attention to "what does an agent crawling our site need?" Headline 50/100 lives here.

**MCP is shipping inside AWS** — Amazon Q Developer, Bedrock AgentCore, and the new managed-MCP routing announced at re:Invent ahead of the May GA. Agents using AWS through these surfaces do work. The capability exists.

**The Bedrock Agents primitives** — code interpreter sandbox, tool registries, multi-agent collaboration — are some of the most production-tested orchestration infrastructure in the industry. Agent ecosystem hosting is a real AWS business line.

## What's missing

**`aws.amazon.com` (the marketing root) lands at 20/100, Level 1.** No `/llms.txt`, no `/AGENTS.md`, no `/.well-known/mcp-server-card.json`. An agent crawling the AWS marketing surface cold finds the world's largest cloud platform... and zero machine-readable breadcrumbs explaining how to use it as an agent. The capability is in the product. The signal is buried.

**`docs.aws.amazon.com` lands at 5/100, Level 0.** The docs surface that hosts the API references for every AWS service publishes none of the rubric's expected artifacts. Markdown content negotiation: no. OpenAPI at standard discovery paths: no (despite AWS publishing per-service API specs). Sitemap: no. AGENTS.md: no. The most-cited cloud documentation surface on the internet is essentially invisible to a discovering agent.

**No homepage MCP/CLI/SDK mention** at the marketing root. AWS markets to humans — "build, deploy, manage" — without surfacing the agent-onboarding flow that exists one or two clicks deeper. The gap from "we shipped MCP server GA" to "an agent landing on aws.amazon.com knows we shipped MCP server GA" is the story.

**No Content-Signal directive** in any of the three robots.txt files. AWS hasn't taken a public position on AI-training versus AI-input crawling — the Cloudflare convention is one line and it's absent everywhere.

## 🚨 Anti-patterns flagged

- **[The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — partial. AWS has built the inside (Bedrock AgentCore, Amazon Q, MCP server GA). The door — discoverable from `aws.amazon.com` — isn't there. Same shape as the rest of the SaaS-API-with-no-discovery pattern, except at hyperscaler scale.

## 🎯 Top moves to climb a level

1. **Ship `/llms.txt` + `/AGENTS.md` at `aws.amazon.com`.** ~30 minutes. The content already exists across docs.aws.amazon.com and builder.aws.com — just needs an index at the marketing root pointing into it. Earns 20pts (Discoverability) and lifts the marketing-root score from 20 → 40, Level 1 → Level 2. Reference: [Contract First](https://agentsfirst.dev/principles/contract-first/).

2. **Publish `/.well-known/mcp-server-card.json` declaring the AWS MCP server tools.** AWS has multiple MCP-callable services (Bedrock, S3, Lambda, IAM, the GA-as-of-2026-05-06 server). The card should declare the canonical entry points, auth flows (IAM Identity Center / OAuth), and the tools an agent can expect. Earns 15pts (Agent Capabilities). Reference: [Interface First](https://agentsfirst.dev/principles/interface-first/).

3. **Modernize `/robots.txt` across all three surfaces with Content-Signal + per-bot rules.** AWS hasn't taken a public position on training vs input — the directive lets them. One line of `Content-Signal: ai-train=…, ai-input=…, search=…` plus explicit allow/deny for GPTBot, ClaudeBot, anthropic-ai, ChatGPT-User, OAI-SearchBot, Google-Extended, PerplexityBot. Earns 10pts (Bot Access Control) on every surface. Trivial cost; signals the platform knows what year it is.

After all three: estimated **75/100 · Level 3 (Agents First)** on the marketing root, with `builder.aws.com` likely climbing into Level 3 territory too (60-70/100).

## What other companies can learn from this

The hyperscalers are no different from the SaaS platforms when it comes to discovery hygiene. AWS hosts most of the agent industry's infrastructure and still lands at Level 1 on its marketing root because the discovery breadcrumbs from the front door aren't there. **Owning the runtime doesn't earn you discoverability points — the publishing layer does.** Pick a small batch of well-known files (llms.txt, AGENTS.md, mcp-server-card.json) and ship them across every public-facing surface in your portfolio. The capability you've already built becomes visible.

## How we scored this

Three URLs were probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-07: `aws.amazon.com` (20/100, Level 1), `docs.aws.amazon.com` (5/100, Level 0), `builder.aws.com` (50/100, Level 2). Headline is the highest of the three. AWS surfaces are explicitly distinct from the existing [/reports/amazon/](/reports/amazon/) report (which scores www.amazon.com / aws.amazon.com / developer.amazon.com — AWS overlap is intentional; consumer Amazon and developer Amazon are different audiences and worth tracking separately).

Methodology note: scored against rubric **v0.2.0** — `/AGENTS.md` weighted 15pts (canonical contract artifact), `/llms.txt` weighted 5pts (optional belt-and-suspenders artifact), `/agents.json` and `/sitemap-index.xml` credited equally with `/.well-known/mcp-server-card.json` and `/sitemap.xml` respectively. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

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
