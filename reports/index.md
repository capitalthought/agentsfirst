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

14 scorecards. First batch shipped 2026-05-06 against rubric v0.1.2; **re-scored 2026-05-07 against rubric v0.2.0** (AGENTS.md promoted to canonical contract artifact at 15pts, llms.txt demoted to optional at 5pts, /agents.json + /sitemap-index.xml credited). Three new Level 3+ celebrations added 2026-05-07 (Cursor, Browserbase, Notion). Subsequent reports land every other Thursday. Sorted by score descending.

Auto-updated weekly via the live scorer at <https://agentsfirst.dev/mcp>. Last refresh: **2026-05-07**. Sorted by score descending.

Auto-updated weekly via the live scorer at <https://agentsfirst.dev/mcp>. Last refresh: **2026-05-08**. Sorted by score descending.

Auto-updated weekly via the live scorer at <https://agentsfirst.dev/mcp>. Last refresh: **2026-05-14**. Sorted by score descending.

Auto-updated weekly via the live scorer at <https://agentsfirst.dev/mcp>. Last refresh: **2026-05-16**. Sorted by score descending.

Auto-updated weekly via the live scorer at <https://agentsfirst.dev/mcp>. Last refresh: **2026-05-16**. Sorted by score descending.

| Date | Target | Score | Level | Read |
|---|---|---:|---:|---|
| 2026-05-16 | Anthropic | **60** | 2 — Agent-Aware | [Read →](/reports/anthropic/) |

**Distribution after the celebration batch:** 1 at Level 4, **3 at Level 3 (new)**, 6 at Level 2, 2 at Level 1, 2 at Level 0. Vercel remains the only Level 4 (Agent-Driven). Cursor, Browserbase, and Notion join the Level 3 club — products that ship like they mean it. Browserbase has the rare "marketing root carries the score" pattern; Notion has the largest variance gap in the series (developers.notion.com 65 vs. notion.so 10 — 55 points). Spread is 80 points (Vercel 90 → WSJ/Indeed 10).

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
