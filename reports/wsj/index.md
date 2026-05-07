---
title: "Agent Readiness Report: The Wall Street Journal"
description: "WSJ scored 10/100 (Level 0) on www.wsj.com. The Invisible Product — but on purpose. The robots.txt allow-lists OpenAI's three crawlers (the News Corp deal) and disallows everyone else by default."
image: /reports/wsj/og.png
author: Joshua Baer
permalink: /reports/wsj/
report_target: The Wall Street Journal
report_score: 10
report_level: 0
report_date: 2026-05-06
---

# Agent Readiness Report: The Wall Street Journal

**Score: 10/100 · Level 0 (No agent access)** · scored across `www.wsj.com` and `api.dowjones.com` — 2026-05-06. Headline surface: `www.wsj.com` at 10/100. Newswires API home: 0/100, blanket `Disallow: /`.

WSJ is the first report in this series where the score *understates how deliberate the posture is*. The framework treats agent-discoverable surfaces as a public-readiness signal. WSJ's surfaces are closed by design. The May 2024 [News Corp × OpenAI deal](https://www.wsj.com/business/media/openai-news-corp-strike-deal-9c2f5481) (~$250M+ over five years) bought OpenAI a license to train and ground on Dow Jones content. The robots.txt does what the deal says it should: allow `ChatGPT-User`, `GPTBot`, and `OAI-SearchBot`; disallow everyone else by default. The commercial door is open for one buyer; closed for the rest. To an agent landing on `wsj.com` cold, the product is invisible — but to OpenAI's crawler, it's accessible. The framework's public-surface rubric can't see the deal. That's the story.

## What's working

The robots.txt is a real artifact, not a lazy `User-agent: *`. It groups dozens of named bots — Googlebot, Bingbot, Applebot, Pinterestbot, Apple, the SEO crawlers, the major ad-tech crawlers, the social card fetchers — into a single block ending with `Allow: /`. Inside that block, on its own line of named user-agents, sit `ChatGPT-User`, `GPTBot`, and `OAI-SearchBot`. The licensing deal is enforceable from a single file. Earned 5 of 25 points in [discoverability](https://agentsfirst.dev/principles/interface-first/) on the strength of naming an AI bot at all (the rubric counts `GPTBot`); credit was not awarded on bot-access-control because `ChatGPT-User` and `OAI-SearchBot` aren't in the rubric's named-bot recognizer yet, and our threshold for granular credit is 3+ AI bots. We'll fix that in v0.1.3.

`sitemap.xml` is present and indexes news, video, recipes, market data, authors, and topic collections — 12 sitemaps in total. 5 of 20 in [content-accessibility](https://agentsfirst.dev/principles/contract-first/). The licensing posture is also documented in robots.txt itself, in plain English at the top of the file: *"automated means is prohibited unless you have express written permission from Dow Jones & Company, Inc."* with a `copyright@dowjones.com` contact. That's the closest thing to an `AGENTS.md` we found.

## What's missing

Everything the rubric scores as agent-readable. No `/llms.txt`. No `/AGENTS.md`. No `/.well-known/mcp-server-card`. No OpenAPI document. No Content-Signal directive. The `api.dowjones.com` host returns `User-agent: * / Disallow: /` and a 404 on every probe — the Newswires API exists, it's just not addressable from the public DNS name a curious agent would try first.

**The anti-pattern flagged is [The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — but with an asterisk. The default failure mode for Invisible Product is negligence: web app first, agent access never. WSJ's failure mode is editorial choice plus partial bilateral licensing. Same surface signal to the framework; very different intent. The fix isn't "open the doors." The fix is *make the licensing posture machine-readable* so that agents from OpenAI's competitors stop hammering closed doors, and prospective licensees know who to email.

`agent-capabilities` scored 0/30 — there is no MCP server, no SDK reference from the homepage, no OAuth-with-PKCE discovery surface. `bot-access-control` scored 0/15 — no Content-Signal directive on either host, and the per-bot policy is inverse to what the rubric expects (default-deny + per-bot allow-list, instead of default-allow + per-bot block). `visibility-of-agent-integrations` scored 0/10 — the homepage doesn't acknowledge agent or LLM access in any onboarding affordance.

## The top three fixes

These respect the editorial stance. None of them recommend ripping the paywall.

1. **Publish a Content Signals directive that says "licensed."** Cloudflare's [Content Signals policy](https://blog.cloudflare.com/content-signals-policy/) supports `ai-train`, `ai-input`, and `search` axes. WSJ's posture maps cleanly: `Content-Signal: ai-train=licensed, ai-input=licensed, search=yes`. That single line tells every agent crawler — not just the three OpenAI bots already named — that training and grounding require a commercial agreement, and points them at the licensing path. Worth ~10 of 15 points in [bot-access-control](https://agentsfirst.dev/principles/contract-first/) under v0.1.3, and far more importantly, it makes the deal structure discoverable instead of invisible.

2. **Ship `/AGENTS.md` at `wsj.com` and `api.dowjones.com` pointing at the licensing path.** Today the licensing intent lives in a comment block at the top of `robots.txt` and is invisible to agents that read robots-as-rules. An [AGENTS.md](https://agentsfirst.dev/glossary/#agents-md) makes the same intent first-class: the verbs an agent can take (cite a headline, summarize a paragraph, link to a paywalled article), the verbs it can't (train on bodies without a license, redistribute paragraphs), the contact (`copyright@dowjones.com`, `licensing@dowjones.com`), and which crawlers are pre-licensed. Closes the [Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules) gap from the *publisher* side rather than the *platform* side. Lowest-effort, highest-leverage move.

3. **Expand the AI-bot allow-list as new licensing deals close, and name them all in the rubric's vocabulary.** The current allow-list block reads `ChatGPT-User / GPTBot / OAI-SearchBot` — three OpenAI agents, one deal. As Dow Jones signs additional licensing partners (Anthropic, Google, Perplexity, Mistral, anyone), name their crawlers in the same block. This isn't a recommendation to license everyone — that's a Dow Jones business decision — but every deal that closes should produce a one-line robots.txt update so the licensed bots know they're welcome and the unlicensed bots don't have to guess.

## What other companies can learn from this

Two lessons here. First: **a closed posture is a posture, and posture should be machine-readable**. Most publishers default-deny in robots.txt and call it a day. WSJ goes further — it allow-lists the licensed party — but it doesn't surface the *commercial shape* of the deal to anyone who isn't already a party to it. That's a missed signal to (a) competitor LLM crawlers who'd otherwise know to go away cleanly, and (b) prospective licensees who'd otherwise know to make an offer. Content Signals + `AGENTS.md` is how you tell the agent ecosystem "the door is open, but you have to knock at this address."

Second: **the Agent Readiness rubric is a public-surface measurement.** It can see `robots.txt` and `/.well-known/*`; it cannot see a $250M licensing contract. WSJ at 10/100 is not the same shape as a SaaS product at 10/100. The framework is right that a cold agent landing on `wsj.com` cannot do anything; it's incomplete on *why*. We'll add a `licensing_posture` field to v0.1.3 — `none / closed / licensed-bilateral / open` — to let the score capture the asterisk.

## How we scored this

Two URLs were probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-06: `www.wsj.com` (10/100, Level 0) and `api.dowjones.com` (0/100, Level 0). Headline is the higher of the two — and the one a human would type. Raw probe data — robots.txt body, surface checks, content-negotiation responses — is in [the report directory](https://github.com/capitalthought/agentsfirst/tree/main/reports/wsj).

Methodology note: re-scored 2026-05-07 against rubric **v0.2.0** — `/AGENTS.md` promoted from 10pts → 15pts (canonical contract artifact); `/llms.txt` demoted from 10pts → 5pts (10% adoption per SE Ranking, Google declined to support); `/agents.json` and `/sitemap-index.xml` now credited equally with their canonical equivalents. Section totals unchanged.txt but doesn't yet recognize `ChatGPT-User` or `OAI-SearchBot`. v0.1.3 will broaden the AI-bot recognizer and add a `licensing_posture` field so reports like this one can distinguish "closed by negligence" from "closed by editorial choice with a bilateral license." Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

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
