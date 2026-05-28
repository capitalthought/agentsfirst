---
title: "Agent Readiness Report: Browserbase"
description: "Browserbase scored 70/100 (Level 3 — Agents First) on browserbase.com. Marketing root carries the score — built for agents, not retrofitted."
image: /reports/browserbase/og.png
author: Joshua Baer
permalink: /reports/browserbase/
report_target: Browserbase
report_score: 70
report_level: 3
report_date: 2026-05-28
---

# Agent Readiness Report: Browserbase

**Score: 70/100 · Level 3 (Agents First)** · scored across browserbase.com / docs.browserbase.com — 2026-05-07 against rubric v0.2.0. Highest surface: `browserbase.com` at **70/100, Level 3**. Docs subdomain: `docs.browserbase.com` at **45/100, Level 2**. The unusual pattern: **the marketing root carries the score, not the docs**. Across this series, the variance has almost always run the other way.

Browserbase is the cleanest expression of the "they live this" pattern we've scored. Their product is browser-as-a-service for AI agents — one API key gives an agent everything it needs to browse the web. The company exists because agents exist. And the homepage looks like it. Open-graph description: "Give your agents access to the whole web." Hero: agents, MCP, CLI, SDK alongside the human onboarding path. They didn't bolt agent-readiness on at the end. They built the front door for it.

## What's working

`browserbase.com` does what almost nobody else in this report cycle does: **the marketing root scores higher than the docs subdomain**. Most products in this series have a 30+ point gap in the other direction — gorgeous docs, anonymous homepage. Browserbase has an `/AGENTS.md` path, a `/.well-known/mcp-server-card.json` path, an `/.well-known/oauth-authorization-server` path, an `/openapi.json` path, and a `/sitemap.xml` — all returning 200 from the marketing root. (Caveat below.)

**Agent-capabilities scores 30/30 on the marketing root.** Perfect. MCP Server Card present. Homepage references CLI and SDK as agent surfaces. OAuth/AI-plugin authorization-server discovery surface present. This is the dimension where most companies in this report cycle score zero. Browserbase scored maximum.

**Visibility-of-agent-integrations scores 10/10.** The hero copy on `browserbase.com` markets to AI builders as the primary audience. "Give your agents access to the whole web" is the OG description. A human onboarding path is there too, but it doesn't crowd out the agent path. See [Interface First](https://agentsfirst.dev/principles/interface-first/) — most companies fail this dimension hardest. Browserbase passes it cleanest.

**Discoverability scores 20/25 on the marketing root.** `/AGENTS.md` registers as the canonical contract artifact (with the SPA-catchall caveat — see below). `/llms.txt` is missing on `www` but lives at the docs subdomain (a real 25 KB structured index opening with "Browserbase is the Browser Agent Platform"). Robots.txt is permissive — `User-Agent: *` `Allow: /` — which is the right default for a product whose customers are the agents.

**Docs subdomain ships a real `/llms.txt`.** ~25 KB Mintlify-generated structured index, links every doc page with its `.md` companion (`docs.browserbase.com/account/billing/plan-management.md`, etc.). Markdown content negotiation passes on the docs subdomain. Sitemap present.

## What's missing

**The biggest gap is honesty about the SPA catchall.** Same caveat we flagged on Vercel: `www.browserbase.com/AGENTS.md`, `/.well-known/mcp-server-card.json`, `/.well-known/oauth-authorization-server`, and `/openapi.json` all return HTTP 200 — but the body is the Next.js HTML shell, not the contract file an agent expects. The scorer counts the 200; in production an agent that reads `Accept: text/markdown` from `/AGENTS.md` gets HTML. v0.1.3 of the rubric will tighten this. Browserbase's score is real for the homepage hero / messaging — the agent-marketing surface dimension is genuine — but the discovery documents themselves need to ship as actual content, not SPA placeholders. Worth calling out so the team can fix it before the rubric catches up.

**Bot-access-control scores 0/15 on both surfaces.** No Content-Signal directive in either robots.txt. No per-bot AI policy. The robots.txt at `www.browserbase.com` is three lines: `User-Agent: *` `Allow: /` `Sitemap: ...`. Cloudflare invented the [Content-Signal](https://blog.cloudflare.com/content-signals-policy/) directive last year specifically so sites can declare an AI policy machine-readably. Browserbase's permissive default is reasonable — they want agents reading the site — but the policy could be explicit. Worth 15 points either way. See [Contract First](https://agentsfirst.dev/principles/contract-first/).

**Docs subdomain has no MCP Server Card, no AGENTS.md.** The marketing root has these paths (with the catchall caveat). `docs.browserbase.com` does not — `/AGENTS.md` is a clean 404, `/.well-known/mcp-server-card.json` is a clean 404. An agent that lands on the docs subdomain (which most will, since it's where the API reference lives) cannot find the contract artifacts. That's the 25-point gap between the two surfaces.

**Docs subdomain doesn't pass markdown content negotiation.** Curious gap, since Mintlify ships `.md` companion URLs at every page (and the `/llms.txt` enumerates them). Hitting a docs URL with `Accept: text/markdown` returns HTML. The capability is there — the negotiation header is not wired to it. 10 points on the table.

## 🚨 Anti-patterns flagged

**No anti-patterns flagged on the marketing root.** Browserbase passes the [Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules) check that flags most products at this score band — agent capabilities advertised, contract file present (with the SPA caveat).

**`docs.browserbase.com` triggers [Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules).** Agent capabilities advertised across the docs surface. No `/AGENTS.md`, no `/.well-known/agent-rules`. The substantive contract file an agent expects to find on the docs subdomain doesn't exist. Easy fix; obvious win.

## 🎯 Top moves to climb a level

1. **Ship real content at `/AGENTS.md` and `/.well-known/mcp-server-card.json` on `browserbase.com`.** Today the SPA catchall returns HTML at these paths. Publish actual markdown / JSON — permissions, identifier conventions, sequencing rules at `/AGENTS.md`; an MCP server descriptor with tool list, install command, and auth flow at `/.well-known/mcp-server-card.json`. The scorer credits these now; the rubric will tighten in v0.1.3 and the credit goes away if the body is HTML. Worth ~15 effective points once the SPA loophole closes. See [Interface First](https://agentsfirst.dev/principles/interface-first/).

2. **Lift the marketing-root pattern to `docs.browserbase.com`.** The contract artifacts that exist (in any form) on `www` are absent on docs. Mirror them: real `/AGENTS.md`, real `/.well-known/mcp-server-card.json`, real `/.well-known/agent-rules` if the team prefers. Docs is where most agents land — the API reference lives there — and right now docs is the surface that triggers [Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules). Worth 25 points on the docs surface, pushing it from Level 2 to Level 3. Same hosting (Mintlify), same team, same conventions.

3. **Wire markdown content negotiation on the docs subdomain.** The `.md` companion URLs already exist at every Mintlify page; the `/llms.txt` index lists them. The missing piece is the `Accept: text/markdown` header → return the `.md` body. 10 points on the docs surface, and the lowest-effort technical fix in this list. See [Content Accessibility](https://agentsfirst.dev/principles/contract-first/).

## What other companies can learn from this

The "they live this" pattern. Browserbase's product is fundamentally for agents — agents are the customer, not the secondary audience. And the marketing root reflects that. The OG description is "Give your agents access to the whole web." The hero copy markets to AI builders before humans. Agent-capabilities scores a clean 10/10 on visibility, the dimension almost everyone fails.

Most products in this series have docs > marketing variance: the developer surface is excellent, the front door is anonymous. **Browserbase has the variance inverted.** Marketing root scores 70; docs subdomain scores 45. That's because they built the homepage for the customer they actually serve. The lesson generalizes: when your product is for agents, design the front door for them too. Don't hide the agent story under `/docs`. The hero is the most expensive piece of real estate on the internet, and most products waste it on humans who already converted.

The other lesson is the Vercel lesson: a real `/AGENTS.md` is necessary but not sufficient. Browserbase's contract paths return 200, but the bodies are the Next.js SPA shell. The scorer credits this today; production agents do not. Ship the actual content. The rubric will catch up — v0.1.3 already addresses the catchall — and a proactive fix here keeps Browserbase at the front of the pack.

## How we scored this

Two URLs were probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-07: `browserbase.com` (70/100, Level 3 — also true for the `www.` redirect target) and `docs.browserbase.com` (45/100, Level 2). Headline is the higher of the two. Raw probe data — robots.txt bodies, content-negotiation responses, capability checks — is in [the report directory](https://github.com/capitalthought/agentsfirst/tree/main/reports/browserbase).

Methodology note: scored 2026-05-07 against rubric **v0.2.0**, which (a) promoted `/AGENTS.md` from 10pts to 15pts and demoted `/llms.txt` from 10pts to 5pts in the Discoverability dimension (section total still 25); (b) credits `/agents.json` equally with `/.well-known/mcp-server-card[.json]`; (c) credits `/sitemap-index.xml` equally with `/sitemap.xml`. The known SPA-catchall loophole (200 OK with HTML body counted as a present asset) is documented and will be tightened in v0.1.3. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

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
