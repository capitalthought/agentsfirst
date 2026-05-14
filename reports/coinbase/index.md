---
title: "Agent Readiness Report: Coinbase"
description: "Coinbase scored 50/100 (Level 2 — Agent-Aware) on docs.cdp.coinbase.com after re-scoring against rubric v0.2.0. The Developer Platform ships AgentKit, x402, and three MCP servers."
image: /reports/coinbase/og.png
author: Joshua Baer
permalink: /reports/coinbase/
report_target: Coinbase
report_score: 50
report_level: 2
report_date: 2026-05-14
---

# Agent Readiness Report: Coinbase

**Score: 50/100 · Level 2 (Agent-Aware)** · scored across www.coinbase.com / developers.coinbase.com / docs.cdp.coinbase.com — re-scored 2026-05-07 against rubric v0.2.0. Highest surface: `docs.cdp.coinbase.com` at 50/100 (was 35/100 under v0.1.2). Developers entry: 30/100, Level 2. Marketing root: 5/100, Level 0. Coinbase gained 15 points in this re-scoring — v0.2.0 promoted `/AGENTS.md` (which Coinbase's CDP docs ships) from 10pts to 15pts and credits `/sitemap-index.xml` and `/agents.json`. Same product, more accurate score.

Coinbase has built more agent infrastructure than almost anyone we've scored. AgentKit. The Agentic Wallet, with its own MCP server for autonomous payments. The CDP CLI exposed as an MCP server for typed access to every CDP API operation. [x402](https://x402.org), the HTTP-402 spec Coinbase has been pushing for agent-native payments. Three MCP servers in production. The infrastructure for autonomous agents to *spend money* exists.

Whether their own surface tells agents this exists is the test. The story is the variance — 35 / 20 / 10 — and a marketing homepage at Level 0.

## What's working

`docs.cdp.coinbase.com` does the things most companies don't.

It publishes a real **`/llms.txt`** that names everything an agent needs: AgentKit, the Agentic Wallet MCP, the CDP CLI MCP, the CDP Docs MCP, x402, Server Wallets, Embedded Wallets, framework integrations for LangChain and Vercel AI SDK. 21 mentions of "agent." 13 of "MCP." 17 of "Wallet." 3 of "x402." This is the most agent-fluent llms.txt we've scored.

It passes **content negotiation**. Hit a docs URL with `Accept: text/markdown` and the server returns markdown. Sitemap present. 15/20 on content-accessibility — held back only by the missing OpenAPI surface.

The surprise positive: **`www.coinbase.com/llms.txt` is genuinely well-written.** It exists, and it does the right thing — it tells agents "you're on the consumer landing page, the authoritative docs are at `docs.cdp.coinbase.com`," then lists every agent-relevant product by name with one-line decision rules ("if the user wants a wallet *for* an agent, start with Agentic Wallet"). 5KB of plaintext that contains the most agent-aware copy on any Coinbase surface.

## What's missing

**Agent-capabilities scores 10/30 on docs and 0/30 on the other two surfaces.** No `/.well-known/mcp-server-card` on any surface, even though three MCP servers exist. The CDP docs homepage references "SDK" — that's it. An agent reading `docs.cdp.coinbase.com` cannot directly discover that an MCP server is one CLI command away. That's [the Invisible Product](https://agentsfirst.dev/glossary/#invisible-product) anti-pattern at the discovery layer: the capability is real, the structured signal isn't.

**`developers.coinbase.com` scores 20/100 — Level 1 — and that's generous.** The probe credited a 200 on `/AGENTS.md`, `/.well-known/agent-rules`, and `/llms-full.txt` — but those 200s are the generic CDP HTML page, not real files. Most other surfaces (`/llms.txt`, `/openapi*`, `/.well-known/mcp`, `/.well-known/ai-plugin`) returned 429s from a Cloudflare anti-bot challenge. In practice an unauthenticated agent reading `developers.coinbase.com` is mostly walled off. The score reflects rubric leniency, not real readiness.

**`www.coinbase.com` scores 10/100 — Level 0.** The well-written llms.txt is the only thing earning points. No sitemap. No OpenAPI. No AGENTS.md. No homepage MCP reference. The marketing page where most humans first meet Coinbase is invisible to agents — even as Coinbase publishes the spec for agents to pay for things.

## The top three fixes

1. **Publish an MCP Server Card from `coinbase.com` and reference it from the homepage hero.** Worth 30 points across every surface. Coinbase already operates three MCP servers people use in production — Agentic Wallet, CDP CLI, CDP Docs. The missing piece is the discovery breadcrumb. Today an agent reading coinbase.com cannot tell. See [Interface First](https://agentsfirst.dev/principles/interface-first/).

2. **Lift `/llms.txt` to `developers.coinbase.com` and ship `/AGENTS.md` on all three surfaces.** The marketing root and the docs subdomain both have `/llms.txt`. The legacy developer entry point doesn't (or it's behind a Cloudflare wall — same effect). Ship a real one. Then add `/AGENTS.md` everywhere: declare the usage rules — auth flow, rate limits, the difference between Server Wallets and Agentic Wallet, when to call x402 — that turn each surface from documentation into [a contract](https://agentsfirst.dev/principles/contract-first/) the agent can rely on. Closes the [Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules) gap flagged on docs.cdp.

3. **Add per-named-bot rules to the marketing robots.txt.** `www.coinbase.com/robots.txt` exists but is silent on AI agents. Add explicit `User-agent: GPTBot / ClaudeBot / anthropic-ai / Google-Extended / PerplexityBot / CCBot` blocks — choose to allow, disallow, or rate-limit per bot. Either the [Cloudflare Content Signals](https://blog.cloudflare.com/content-signals-policy/) directive or named-bot blocks earn the 15 points. See [Contract First](https://agentsfirst.dev/principles/contract-first/).

## What other companies can learn from this

The lesson is the *shape* of the score, not the number. Coinbase is one of the most agent-thoughtful companies in the world — they're literally publishing the protocol agents will use to pay each other. Their developer subdomain reflects that. Their marketing site does not. A Level 3 product is Level 3 across every surface an agent might land on, including the one humans hit first.

The other lesson, for anyone shipping MCP servers in production: ship a `/.well-known/mcp-server-card` the day you ship the server. The discovery layer is the part agents actually check. Without it, the capability exists for the humans who already know to look.

## How we scored this

Three URLs were probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-06: `www.coinbase.com` (10/100, Level 0), `developers.coinbase.com` (20/100, Level 1), `docs.cdp.coinbase.com` (35/100, Level 2). Headline is the highest of the three. Raw probe data — robots.txt bodies, llms.txt contents, capability checks — is in [the report directory](https://github.com/capitalthought/agentsfirst/tree/main/reports/coinbase).

Methodology note: re-scored 2026-05-07 against rubric **v0.2.0** — `/AGENTS.md` promoted to canonical contract artifact (15pts), `/llms.txt` demoted to optional (5pts), `/agents.json` and `/sitemap-index.xml` credited equally with their canonical equivalents. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>. The `developers.coinbase.com` score remains generous — the rubric credits surfaces that returned 200, but several of those 200s are the catch-all CDP HTML page rather than real files. Practical readiness on that subdomain is lower than the score suggests.

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
