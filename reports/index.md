---
title: "Agent Readiness Reports"
description: "Bi-weekly public scorecards on named products, scored against the Agents First framework."
image: /og-image.png
author: Joshua Baer
permalink: /reports/
---

# Agent Readiness Reports

Bi-weekly public scorecards. Each report runs the [Agents First scorer](https://agentsfirst.dev/mcp) against a named product, surfaces the score, calls out the dominant anti-pattern, and proposes the top three fixes that would climb them a level.

The framework only matters if it's measurable. These reports are how we keep ourselves — and the products we name — honest.

## Reports

11 scorecards. First batch shipped 2026-05-06 against rubric v0.1.2; **all re-scored 2026-05-07 against rubric v0.2.0** (AGENTS.md promoted to canonical contract artifact at 15pts, llms.txt demoted to optional at 5pts, /agents.json + /sitemap-index.xml now credited equally with their canonical equivalents). Subsequent reports land every other Thursday. Sorted by score descending.

| Date | Target | Score | Level | Read |
|---|---|---:|---:|---|
| 2026-05-07 | Vercel | **90** 🏆 | 4 — Agent-Driven | [Read →](/reports/vercel/) |
| 2026-05-07 | Anthropic | **60** | 2 — Agent-Aware | [Read →](/reports/anthropic/) |
| 2026-05-07 | Linear | **60** | 2 — Agent-Aware | [Read →](/reports/linear/) |
| 2026-05-07 | Coinbase | **50** | 2 — Agent-Aware | [Read →](/reports/coinbase/) |
| 2026-05-07 | Stripe | **50** ↑25 | 2 — Agent-Aware | [Read →](/reports/stripe/) |
| 2026-05-07 | AWS *(new)* | **50** | 2 — Agent-Aware | [Read →](/reports/aws/) |
| 2026-05-07 | Cloudflare | **35** | 2 — Agent-Aware | [Read →](/reports/cloudflare/) |
| 2026-05-07 | Google | **25** | 1 — Agent as Afterthought | [Read →](/reports/google/) |
| 2026-05-07 | Amazon | **25** ↓5 | 1 — Agent as Afterthought | [Read →](/reports/amazon/) |
| 2026-05-07 | The Wall Street Journal | **10** | 0 — No agent access | [Read →](/reports/wsj/) |
| 2026-05-07 | Indeed | **10** | 0 — No agent access | [Read →](/reports/indeed/) |

**Distribution after the v0.2.0 re-score:** 1 at Level 4 (new), 6 at Level 2, 2 at Level 1, 2 at Level 0. Vercel becomes the first product in this series to crack Level 4 (Agent-Driven). Stripe jumped 25 points and a full level (L1 → L2) on the strength of the Sessions 2026 trifecta. Amazon slipped 5 points (L2 → L1) because its `/llms.txt`-without-`/AGENTS.md` posture lost weight in the rubric refresh. The mid is now Level 2; the spread is 80 points (Vercel 90 → WSJ/Indeed 10).

## How we score

Every report uses the live scorer at <https://agentsfirst.dev/mcp> with the open-source rubric at [`tools/agentsfirst-mcp/src/score.ts`](https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts). Each report cites the rubric version it ran against, so the score is reproducible. When the rubric changes, prior reports get re-scored if the change materially affects their result; the change history lives in the [changelog](/changelog/).

The scoring pipeline:

1. Probe the target's public surfaces — `robots.txt`, `/llms.txt`, `/AGENTS.md`, `/.well-known/mcp-server-card`, OpenAPI candidates, markdown content negotiation, homepage analysis.
2. Apply the rubric across five dimensions: Discoverability (25), Content Accessibility (20), Bot Access Control (15), Agent Capabilities (30), Visibility of Agent Integrations (10).
3. Map total score to one of five Adoption Levels (0 — No agent access through 4 — Agent-Driven).
4. Flag any of the seven [anti-patterns](/glossary/#the-lazy-wrapper) the probe surfaces.
5. Rank the top three highest-leverage moves to climb a level.

You can run the same scorer against any URL or codebase yourself — see [the canonical thesis](/) for the three access paths (remote MCP, local `npx`, raw `curl`).

## Cadence

New reports land every other Thursday. Follow [@joshuabaer on X](https://x.com/joshuabaer) or [watch the GitHub repo](https://github.com/capitalthought/agentsfirst) for notifications.

## Want your product scored?

Open an issue at [github.com/capitalthought/agentsfirst/issues](https://github.com/capitalthought/agentsfirst/issues) with the URL or repo path. We score by leverage and curiosity, not by request alone — but every submission helps the queue. Submissions for *your own* product are welcome; we run the scorer the same way regardless of who asked.

## Anti-patterns of using these reports wrong

So we hold ourselves accountable, in public:

- **No punching down.** Targets are companies bigger than Capital Factory, products that can absorb a public scorecard.
- **No gotcha.** Every report ends with "here's the Level 3 fix" — constructive, not destructive.
- **No fake grades.** If a target scores Level 0, the report says Level 0. The scorecard's value depends on consistency.
- **Constructive disclosure.** When a named target's score depends on a rubric edge case, the report says so and links to the open-source rubric so they can verify.

---

*Part of [Agents First](/) — see [the canonical thesis](/), [the eight principles](/principles/), or [the glossary](/glossary/).*
