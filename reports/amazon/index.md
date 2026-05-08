---
title: "Agent Readiness Report: Amazon"
description: "Amazon scored 25/100 (Level 1 — Agent as Afterthought) on developer.amazon.com after re-scoring against rubric v0.2.0. AWS: 20/100 Level 1 (now broken out as a separate report). Consumer retail: 10/100 Level 0."
image: /reports/amazon/og.png
author: Joshua Baer
permalink: /reports/amazon/
report_target: Amazon
report_score: 25
report_level: 1
report_date: 2026-05-08
---

# Agent Readiness Report: Amazon

**Score: 25/100 · Level 1 (Agent as Afterthought)** · scored across amazon.com / aws.amazon.com / developer.amazon.com — re-scored 2026-05-07 against rubric v0.2.0. Highest surface: `developer.amazon.com` at 25/100, Level 1 (was 30/100 Level 2 under v0.1.2). AWS: 20/100, Level 1 — and now [broken out as its own report](/reports/aws/) following the AWS MCP Server GA. Consumer retail: 10/100, Level 0.

Amazon's headline lost 5 points in this re-scoring and slipped from Level 2 to Level 1. The reason is the rubric, not Amazon's surface: v0.2.0 demoted `/llms.txt` from 10pts → 5pts (10% adoption per [SE Ranking](https://seranking.com/blog/llms-txt/), Google declined to support) and promoted `/AGENTS.md` from 10pts → 15pts (canonical contract artifact). Amazon's developer portal ships `/llms.txt` but no `/AGENTS.md` — so the net effect is -5pts. The product hasn't gotten worse; the rubric got more discriminating about which artifact carries the contract weight.

Amazon is the largest e-commerce property in the world and one of the most aggressively gated against agent traffic. The headline is the highest of three surfaces; the *shape* of the score — 25 / 20 / 10 — is what matters. The developer portal ships a real `/llms.txt` and references MCP from the homepage. AWS, the platform that hosts most of the agent industry, doesn't ship either from the marketing root. Consumer retail blocks ~50 named AI agents at the door.

## What's working

`developer.amazon.com` is the high water mark — and it's a real one.

It publishes a **`/llms.txt`** at the root, 50KB, structured by platform (Vega OS, Fire TV, Alexa, Appstore). Each entry is `URL — Title — italic description` with explicit instructions to LLMs at the top about how to parse the file. The robots.txt declares a **custom `LLMs:` directive** pointing back to the llms.txt — a convention you don't see anywhere else, intended to bridge crawlers from the file they read first to the file built for them. 10 of 25 points in [discoverability](https://agentsfirst.dev/principles/interface-first/).

The homepage references **MCP** by name and uses the phrase "agents first." Plus 10 of 30 in [agent-capabilities](https://agentsfirst.dev/principles/interface-first/) and a clean 10 of 10 in visibility-of-agent-integrations — the only Amazon surface that promotes agent install paths in the human onboarding flow.

`aws.amazon.com` lands at **20/100**. The homepage mentions Bedrock 11 times, Amazon Q five times, and the AWS CLI / SDKs throughout. Visibility-of-agent-integrations is full marks on that signal alone. The capability surface is real; the discovery breadcrumbs aren't.

## What's missing

**`amazon.com` scores 10/100 — Level 0.** robots.txt names ~50 AI agents — `GPTBot`, `ClaudeBot`, `Claude-User`, `Claude-SearchBot`, `ChatGPT-User`, `OAI-SearchBot`, `PerplexityBot`, `Perplexity-User`, `Google-Extended`, `Google-NotebookLM`, `Gemini-Deep-Research`, `GoogleAgent-Mariner`, `GoogleAgent-Shopping`, `Devin`, `MistralAI-User`, `Copilot`, `cohere-ai`, `meta-externalagent`, `Bytespider`, `CCBot`, `AI2Bot`, `Diffbot`, on and on — and gives each one `Disallow: /`. Total block. Anti-scraping is core to amazon.com's business model, so this is intentional, not an oversight. The score reflects the policy: no `/llms.txt`, no markdown negotiation, no MCP card, no agent-discoverable surface of any kind. The homepage is hidden from the human-onboarding-for-agents flow because the homepage is hidden from agents, period.

**`aws.amazon.com` is the more interesting failure.** AWS hosts the infrastructure most of the agent industry runs on. Amazon Q is an agent. Bedrock hosts Claude, Llama, Mistral. The homepage talks about all of it. But: no `/llms.txt`. No markdown content negotiation. No `Content-Signal` directive. No per-bot AI policy in robots.txt — robots.txt is enormous (thousands of `Disallow` lines for case-study URLs and old career-event pages) but says nothing about AI agents. No `/AGENTS.md`. No MCP Server Card. No `/.well-known/ai-plugin.json`. The capability is real. None of it is discoverable from the agent's first three requests. That's [the Invisible Product](https://agentsfirst.dev/glossary/#invisible-product) on the developer surface that probably hosts more agent traffic than any other site on the internet.

**`developer.amazon.com` doesn't ship `/AGENTS.md`** despite having shipped `/llms.txt` — meaning the surface that publishes agent-readable content doesn't publish the rules an agent needs to use it correctly. [Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules). And no markdown content negotiation: hit any docs URL with `Accept: text/markdown` and you still get HTML.

**Amazon does not declare `Amazonbot` in any of its own robots.txt files.** Amazon's crawler is named explicitly in many other publishers' robots.txts — they're a known counterparty in the AI-bot conversation. None of Amazon's three surfaces reciprocate by declaring whether `Amazonbot` is allowed where, or what its purpose is. The other side of the same conversation.

## The top three fixes

1. **Ship an MCP Server Card from `aws.amazon.com` and reference it from the hero.** Worth 30 points on AWS. Amazon Q already speaks MCP. Bedrock hosts the models that consume MCP. The capability is real; the discovery breadcrumb saying "here's the install command, here's the auth flow" is missing. Today an agent reading aws.amazon.com cannot tell that AWS exposes any agent surface at all. See [Interface First](https://agentsfirst.dev/principles/interface-first/).

2. **Lift `/llms.txt` from the developer portal to `aws.amazon.com` and ship `/AGENTS.md` on both surfaces.** developer.amazon.com proved internally that the pattern works — same engineering org, same hosting infrastructure. Replicate the file. Then ship `/AGENTS.md` on both: declare the usage rules — auth, identifier conventions, rate limits, escalation triggers — that turn each surface from documentation into [a contract](https://agentsfirst.dev/principles/contract-first/) the agent can rely on. Closes the [Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules) gap on Amazon's developer surface.

3. **Pick a posture on `amazon.com` and declare it explicitly.** The current robots.txt is a 50-bot blocklist that grew through accretion — every new AI crawler gets a `Disallow: /` line. Either consolidate to a single `Content-Signal: ai-train=no, search=no, ai-input=no` directive (machine-readable, future-proof, doesn't require a new line every time a new AI company ships a bot) or — if Amazon wants to enable agent commerce — open specific paths (product detail, category browse, cart adds) under named bot rules with rate limits. The point is: declare the posture once, in a parseable form. The current pattern is a maintenance burden that scores zero credit. See [Contract First](https://agentsfirst.dev/principles/contract-first/).

## What other companies can learn from this

Amazon is the most extreme version of a pattern that shows up everywhere: a company's developer surface is at one adoption level and the consumer surface is at another, and nobody at the company has reconciled the two. developer.amazon.com is Level 2. amazon.com is Level 0. They report into different orgs, have different incentives, and ship under different brands. To the agent, they're both "Amazon."

If your company has more than one major web property, the variance across them is the bug. A Level 3 product is Level 3 across every surface an agent might land on. Score your three most-trafficked subdomains. The surface that scores lowest is the one your agent customer actually sees first.

The other lesson: the agent ecosystem and the anti-scraping ecosystem are colliding. Amazon's robots.txt blocks the agents that would buy things on a customer's behalf. Whether that's the right call for amazon.com is a business decision; whether it's a *legible* one to the agent is a separate question. Right now it's a 50-line blocklist. It could be one line and convey the same policy with less drift.

## How we scored this

Three URLs were probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-07: `www.amazon.com` (10/100, Level 0), `aws.amazon.com` (20/100, Level 1), `developer.amazon.com` (25/100, Level 1). Headline is the highest of the three. Raw probe data — robots.txt bodies, the developer portal `/llms.txt`, content-negotiation responses, capability checks — is in [the report directory](https://github.com/capitalthought/agentsfirst/tree/main/reports/amazon).

Methodology note: re-scored 2026-05-07 against rubric **v0.2.0**. Headline dropped 5pts (30 → 25) and slipped Level 2 → Level 1 because v0.2.0 demoted `/llms.txt` from 10pts to 5pts in Discoverability while promoting `/AGENTS.md` from 10pts to 15pts. `developer.amazon.com` ships the former but not the latter, so the net is -5pts. Section totals unchanged. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

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
