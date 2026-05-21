---
title: "Agent Readiness Report: Cursor"
description: "Cursor scored 70/100 (Level 3 — Agents First) on docs.cursor.com. Marketing root: 30/100, Level 2. The agent-native IDE ships docs to match its mission."
image: /reports/cursor/og.png
author: Joshua Baer
permalink: /reports/cursor/
report_target: Cursor
report_score: 70
report_level: 3
report_date: 2026-05-21
---

# Agent Readiness Report: Cursor

**Score: 70/100 · Level 3 (Agents First)** · scored across cursor.com / www.cursor.com / docs.cursor.com — 2026-05-07 against rubric v0.2.0. Highest surface: `docs.cursor.com` at **70/100, Level 3**. Marketing root (`cursor.com` and `www.cursor.com`): **30/100, Level 2**.

Cursor is the celebration story. They build the agent-native IDE — the editor that turned MCP from a protocol document into a default install for working developers — and the docs surface that powers their product reflects the team's worldview. 70/100 makes Cursor the second product in this report series to crack [Level 3 (Agents First)](https://agentsfirst.dev/glossary/#adoption-levels). They sell to humans who write code with agents; their docs read like a contract written for the agents that will read them. That's the premise of the framework, restated by a team that didn't need the framework to figure it out.

## What's working

`docs.cursor.com` does the things this rubric was written to find.

A real **`/llms.txt`** at the docs root and a **canonical [`/AGENTS.md`](https://agentsfirst.dev/principles/contract-first/) contract artifact** worth the full 15 points in v0.2.0 of the rubric. Discoverability lands at 20/25 — the load-bearing contract is published, the optional summary index is published, only the per-bot policy in robots.txt is missing. Cursor's own product made `.cursor/rules` and `AGENTS.md` part of the working developer's daily file tree; their docs publish the same artifact at the site root.

**MCP Server Card present at `/.well-known/mcp-server-card.json`. OAuth-with-PKCE discovery present.** Agent capabilities scores a clean **30/30** — the only surface in the report series so far to max out this dimension. Cursor ships an MCP runtime; the discovery breadcrumb to find that runtime exists at the path agents look for. See [Interface First](https://agentsfirst.dev/principles/interface-first/).

**Visibility of agent integrations: 10/10.** The homepage hero on `docs.cursor.com` references **MCP, CLI, SDK, and API** alongside human onboarding (the marketing root only mentions CLI — see below). Almost no one passes this dimension. Cursor passes because the developer-facing surface treats agent install paths and human install paths as peers, not as a hidden footer link.

**OpenAPI surface discoverable.** Half-credit on content-accessibility (10/20) — sitemap is present, OpenAPI surface resolves, but markdown content negotiation does not pass. Hit a docs URL with `Accept: text/markdown` and you get HTML.

## What's missing

**No `Content-Signal` directive on robots.txt — across any surface.** Bot-access-control scores a flat **0/15** on docs and root. Cursor's product is the most-mentioned client name in MCP transcripts in the wild; the company has a clear authority position to declare an AI-content policy and chooses not to. The simplest unlock in the rubric: ship a `Content-Signal:` directive (any direction — `ai-train=yes`, `ai-train=no`, mixed) and pick up 10 points instantly. See [Contract First](https://agentsfirst.dev/principles/contract-first/).

**`cursor.com` (the marketing root) lands at 30/100, Level 2.** Same robots.txt, real `/llms.txt`, real sitemap — but **no `/AGENTS.md`**, no MCP Server Card, no OAuth discovery, and the homepage hero only mentions CLI. The well-known paths return 500. The robots.txt is a blanket disallow. The marketing root trips the [Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules) anti-pattern: agent capabilities are advertised on the product (Cursor *is* an agent-aware IDE), but no contract file at the marketing root tells an agent how to use the docs, the MCP server, or the SDK that the docs surface advertises.

**Markdown content negotiation does not pass on either surface.** `Accept: text/markdown` on a docs URL returns `text/html`. Cursor's docs are written in markdown; the surface that serves them does not negotiate the format an agent prefers. Worth 10 points.

A note on rubric honesty: every well-known path probed on `docs.cursor.com` returned `200 OK` with the same 120,306-byte HTML shell — this is the Next.js SPA catchall, not the requested asset. The scorer counts the 200; in production an agent reading `/.well-known/mcp-server-card.json` from docs gets HTML where it expected JSON. v0.1.3 of the rubric will tighten this. The Cursor docs score does not move materially with the fix — `/llms.txt` and the homepage hero analysis are real signals — but it means the gap between "the rubric scored 70" and "an agent crawler measured 70" is honest to call out before the next bi-weekly run.

## 🚨 Anti-patterns flagged

- **[Agents Without Rules](https://agentsfirst.dev/glossary/#agents-without-rules)** on `cursor.com` and `www.cursor.com` — agent capabilities advertised on the marketing root but no `/AGENTS.md` or `/.well-known/agent-rules` contract file declaring how to use them. Same evidence on both subdomains. The docs surface clears this anti-pattern; the marketing root does not.

## 🎯 Top moves to climb a level

1. **Lift the docs playbook to `cursor.com`.** Same hosting, same team, same conventions. Publish `/AGENTS.md` and the MCP Server Card at the marketing root, replace the blanket-Disallow robots.txt with a `Content-Signal` directive, and let the homepage hero mention MCP and SDK alongside CLI. The marketing root climbs Level 2 → Level 3 the moment any of these ship; all four together would push it past where docs sits today. Worth ~40 points on `cursor.com`. See [Interface First](https://agentsfirst.dev/principles/interface-first/).

2. **Add `Content-Signal` to robots.txt on every surface.** The single cheapest 10 points in the rubric, on the dimension where Cursor scores zero. Pick a direction — `ai-train=no` (the Vercel default) or `ai-train=yes` (Cursor docs are arguably the canonical training corpus for agentic coding behavior — there's an argument for either). Either signal earns full credit. The absence of signal earns zero. See [Contract First](https://agentsfirst.dev/principles/contract-first/).

3. **Serve `text/markdown` when an agent asks for it.** Docs are already authored in markdown; the missing piece is a content-type branch on the docs CDN. Worth 10 points on docs and 5 points on the root. With this plus the `Content-Signal` directive plus the marketing-root MCP card, `docs.cursor.com` clears 90/100 and crosses into [Level 4 (Agent-Driven)](https://agentsfirst.dev/glossary/#adoption-levels) — the second product in this series to do so.

## What other companies can learn from this

Cursor is the second Level 3 product in the Agent Readiness Reports series, and the lesson is the same lesson Vercel taught two weeks ago, restated more sharply: **a product team that lives the agent worldview ships the surfaces to match — but only on the surface its team owns directly.** Cursor docs are owned by the docs team that lives inside Cursor every day. Cursor.com is the marketing surface, and marketing surfaces almost never get the same treatment. The variance from 70 → 30 across two subdomains of the same company is the report's recurring finding: a Level 3 product is Level 3 on every surface an agent might reach.

The other lesson, specific to Cursor: **the feedback loop is short here.** Cursor's daily users are agent operators. If `cursor.com` shipped an MCP Server Card next week, a meaningful fraction of the team's own users would notice — and a non-trivial number would tweet about it. There's no audience-mismatch problem to solve before the work pays off. Same playbook, different subdomain. Two-week turnaround is plausible. The follow-up report writes itself.

## How we scored this

Three URLs were probed via the live scorer at `https://agentsfirst.dev/mcp` on 2026-05-07: `docs.cursor.com` (70/100, Level 3), `cursor.com` (30/100, Level 2), `www.cursor.com` (30/100, Level 2 — identical to the apex). Headline is the highest of the three. Raw probe data — robots.txt analysis, content-negotiation responses, capability checks, surface inventory — is in [the report directory](https://github.com/capitalthought/agentsfirst/tree/main/reports/cursor).

Methodology note: scored against rubric **v0.2.0**, which (a) promotes `/AGENTS.md` to a 15-point canonical contract artifact in the Discoverability dimension; (b) credits `/agents.json` equally with `/.well-known/mcp-server-card[.json]`; (c) credits `/sitemap-index.xml` equally with `/sitemap.xml`. Rubric source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

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
