# Courtesy DM — Notion Agent Readiness Report

Plain-text DM (LinkedIn or X) or short email, sent the day the report ships. Modeled on Josh's daily email style guide: "Howdy", short, direct, no hedging, "Yeehaw!" close. ~125 words.

---

**Subject:** Agent Readiness Report: Notion scored 65/100 — and the variance is the story

---

Howdy [Name],

Heads up — we shipped an Agent Readiness Report on Notion today. 65/100, Level 3 on developers.notion.com — that puts the dev portal in the celebration tier alongside Vercel, Cursor, and Browserbase. Real AGENTS.md, real /llms.txt, OpenAPI discoverable, MCP referenced from the homepage hero. The team that built that surface did the work.

The story we're telling: the variance. notion.so scores 10/100, Level 0. Largest score gap in the public series. The marketing root has /llms.txt already (200 OK, 7KB) — the cheapest 5 points are shipped — but the surrounding artifacts are missing.

The fix: ~30 min of well-known files (/AGENTS.md + Content-Signal in robots.txt + MCP server card) at the marketing root pointing at the great work the platform team already shipped. ~30 points on notion.so in one PR.

Full report: https://agentsfirst.dev/reports/notion/

No need to respond — sharing in case useful, and gladly re-score once anything ships.

Yeehaw!

🤖 Josh

---

## Recipient candidates

Send to one of these. The platform/MCP authors are the natural fit — they did the high-scoring work and would route the marketing-root fix internally. CEO is signal-only; press is the lukewarm fallback.

| Person | Role | Why them | Channel |
|--------|------|----------|---------|
| Kenneth Sinder | Software Engineer, Notion API + MCP | Built and shipped Notion's hosted MCP server (`mcp.notion.com`). Cited author of "Notion's hosted MCP server: an inside look" (July 2025). Most natural recipient — owns the surface that scored Level 3, will recognize the gap immediately. Active on X. | X DM (`@KennethSinder`) or LinkedIn |
| Marissa Felix | Product Manager, Notion API | Co-presenter with Kenneth at WorkOS MCP Night 2.0. PM for the API + MCP surface. Will route to whoever owns the notion.so marketing site. | LinkedIn DM |
| Ivan Zhao | CEO, Notion | Active on X (`@ivanhzhao`). Signal-only — won't triage the fix list, but will see the variance framing and may amplify or route. | X DM (`@ivanhzhao`) |
| `press@notion.so` / DevRel email | Press / general devrel | Lukewarm fallback if author DMs go unanswered after 5 days. Likely to route to whoever owns the marketing site. | Email |

## Notes for the sender (Josh)

- Pick ONE recipient on day-of-publish. Kenneth Sinder is the right first send — he literally built the surface that scored Level 3, and the report is a clean assist for him to make the case internally for the marketing-root fix.
- X DM is the right channel for Kenneth (he's posting actively as `@KennethSinder`). LinkedIn is the right channel for Marissa.
- Hold the press address for week-2 if neither author replies.
- If a reply comes back with "we just shipped X", queue a re-score for the next bi-weekly slot. The follow-up report ("Notion moved notion.so from Level 0 to Level 3 in 14 days, closed the largest gap in the series") is even better content than the first one — and Notion is plausibly a 30-minute fix away from that headline.
- Report posture is celebratory of the dev portal, candid about the marketing gap. Re-read the body before sending — make sure nothing reads as a dunk on the platform team. They did the right thing. The story is the marketing-team gap, not a Notion-overall failure.
