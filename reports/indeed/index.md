---
title: "Agent Readiness Report: Indeed"
description: "Indeed scored 10/100 (Level 0) — the most-relevant target for autonomous job-search agents publishes a real /llms.txt and then 403s anyone who tries to fetch it. The developer portal is gone."
image: /reports/indeed/og.png
author: Joshua Baer
permalink: /reports/indeed/
report_target: Indeed
report_score: 10
report_level: 0
report_date: 2026-05-07
---

# Agent Readiness Report: Indeed

**Score: 10/100 · Level 0 (No Agent Access)** · scored across www.indeed.com / developer.indeed.com / employers.indeed.com — 2026-05-06. Highest surface: `www.indeed.com` at 10/100. Developer portal: 0/100. Employer surface: 5/100.

Indeed is the canonical case for [agent-driven user value](https://agentsfirst.dev/glossary/#two-customers). Autonomous agents searching for jobs on a user's behalf, applying, tracking responses — this is the textbook example everybody points at when they explain why agents matter for consumers. The product use case is exactly what AI agents should be doing right now. The public surface fails to enable any of it.

## What's working

`www.indeed.com/robots.txt` does the thing most consumer sites still don't. It enumerates ~23 AI bots by name — GPTBot, ClaudeBot, anthropic-ai, Google-Extended, PerplexityBot, ChatGPT-User, Claude-User, Claude-SearchBot, Gemini-Deep-Research, Bytespider, CCBot, Applebot-Extended, DeepSeekBot, Perplexity-User, DuckAssistBot, YouBot, and more — grouped into a single combined stanza with explicit disallow paths. That's a real, maintained AI-policy surface. 5 of 15 in [bot-access-control](https://agentsfirst.dev/principles/contract-first/).

Indeed also publishes a real **`/llms.txt`** at `https://www.indeed.com/llms.txt`. It's 737 lines. It explains the search query parameters (`q`, `l`, `fromage`, `radius`), enumerates every country subdomain, and points to the salary-data and help surfaces. Someone at Indeed sat down and wrote a thoughtful machine-readable overview of the product specifically for LLMs. That's the [Interface First](https://agentsfirst.dev/principles/interface-first/) instinct, executed in good faith.

We can't credit it.

## What's missing

Hit `/llms.txt` with the agentsfirst.dev scorer and you get **HTTP 403** — Cloudflare bot mitigation, returned in 7 KB of HTML challenge page instead of the 737 lines of help that's actually behind the URL. Same for `/AGENTS.md`. Same for the homepage. The artifact exists. The agent can't fetch it. Spoof a browser user-agent and the file appears; use any default agent stack and you're blocked. This is the [Invisible Product](https://agentsfirst.dev/glossary/#invisible-product) anti-pattern with a twist — Indeed *built* the agent surface, then deployed a WAF that hides it from the agents it was written for.

**`developer.indeed.com` returns 0/100.** The historical developer portal — once home to the Indeed Publisher API and the Job Search API — 301-redirects to `https://partners.indeed.com/`, which then returns a Cloudflare-mitigated 403 challenge to anything the WAF doesn't recognize as a browser. There is no public, agent-reachable developer documentation at the address every existing tutorial, every search result, and every API consumer expects to find one. The Publisher API itself was deprecated in 2020. Five years on, the address still resolves; nothing useful lives there.

**`employers.indeed.com/robots.txt` is 25 bytes.** Two lines: `User-agent: *` and `Disallow: /`. The entire B2B surface — where employers post jobs, manage candidates, and run hiring workflows — tells every crawler to go away. No nuance, no per-bot policy, no `/llms.txt`, no `/AGENTS.md`. Score: 5/100, saved from zero only by an OpenAPI surface the scorer detected.

**Agent-capabilities is zero across all three surfaces.** No MCP Server Card. No `/.well-known/ai-plugin.json`. No homepage reference to MCP, a CLI, or any SDK install path. An autonomous agent looking for a job on a user's behalf — the canonical Agents First use case — has no addressable Indeed integration to discover.

## The top three fixes

1. **Stop 403-ing your own `/llms.txt`.** This is the easiest five-minute fix in the entire report. Indeed already wrote the file. Whitelist `/llms.txt`, `/AGENTS.md`, `/robots.txt`, and `/sitemap.xml` from Cloudflare bot mitigation — these paths exist *for* automated clients. The current configuration treats the agent like a competitor scraping job listings; the agent is just trying to read the help text. Worth 5–10 immediate discoverability points and, more importantly, fixes the [Ship and Forget](https://agentsfirst.dev/glossary/#ship-and-forget) signal. You shipped the artifact; let agents reach it.

2. **Publish an MCP Server Card with verb-first job-search tools.** `find_jobs(query, location, radius_miles, posted_within_days)`, `get_job(id)`, `apply(job_id, resume_id)`, `track_application(application_id)`. Park it at `/.well-known/mcp-server-card` on `www.indeed.com` and reference it from the homepage hero. Indeed has the most-relevant agent product surface of any consumer site on the internet — autonomous job hunting is the canonical Agents First use case. Worth 30 of 100 points and reframes Indeed from "scraping target" to "API the agent ecosystem chose." See [Interface First](https://agentsfirst.dev/principles/interface-first/).

3. **Decide what `developer.indeed.com` is for and ship it, or sunset the address.** The 301 to a 403'd partners landing page is the [Ship and Forget](https://agentsfirst.dev/glossary/#ship-and-forget) anti-pattern in pure form: an agent following any old API tutorial, search result, or stale link lands on a wall. Either restore an agent-readable developer portal at the historical address (with `/llms.txt`, `/openapi.json`, working examples), or replace the redirect with a 410 Gone and a one-line pointer to wherever Indeed wants developers to go. Right now the URL is dressed up to look alive; it's effectively dead.

## What other companies can learn from this

Two lessons.

**One:** if you're going to write `/llms.txt`, let agents read it. Cloudflare's bot-management defaults treat `curl`, default Python `requests`, and most agent runtimes as bot traffic — because they are. That's exactly the audience `/llms.txt` was invented for. Whitelist the four well-known machine-readable paths (`/robots.txt`, `/llms.txt`, `/AGENTS.md`, `/sitemap.xml`) before deploying any of them, or you've shipped a [signal-without-substance](https://agentsfirst.dev/glossary/#invisible-product) artifact.

**Two:** the most-relevant agent use case isn't always coming from the most agent-ready company. Consumer-scale search products are exactly where agent-driven workflows are about to take off — autonomous job hunting, autonomous booking, autonomous shopping — and the incumbents most likely to be disintermediated are the same ones whose anti-scraping posture is most aggressive. The defensive answer (block harder) loses. The offensive answer (publish a typed agent surface so the user's agent picks *you* over a screen-scraper) wins. Indeed is one shipped MCP server away from owning that lane for the next decade.

## How we scored this

Three URLs were probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-06: `www.indeed.com` (10/100, Level 0), `developer.indeed.com` (0/100, Level 0 — also: 301 to partners.indeed.com, then 403), `employers.indeed.com` (5/100, Level 0). Headline is the highest of the three. Raw probe data — robots.txt bodies, content-negotiation responses, capability checks, the 403 chain on the developer portal — is in [the report directory](https://github.com/capitalthought/agentsfirst/tree/main/reports/indeed).

Methodology note: re-scored 2026-05-07 against rubric **v0.2.0** — `/AGENTS.md` promoted from 10pts → 15pts (canonical contract artifact); `/llms.txt` demoted from 10pts → 5pts (10% adoption per SE Ranking, Google declined to support); `/agents.json` and `/sitemap-index.xml` now credited equally with their canonical equivalents. Section totals unchanged. We verified that Indeed's `/llms.txt` does in fact exist and serve real content to browser-spoofing user-agents (`curl -A "Mozilla/5.0"` returns the 737-line file). The scorer fetches with a default user-agent and is blocked at the WAF; the rubric scores what an agent can actually reach, which is the right behavior. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

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
