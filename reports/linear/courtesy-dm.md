# Courtesy DM — Linear Agent Readiness Report

Plain-text email or LinkedIn DM, sent the day the report ships. Modeled on Josh's daily email style guide: "Howdy", short, direct, no hedging, "Yeehaw!" close. ~100 words.

---

**Subject:** Agent Readiness Report: Linear scored 60/100 (and the 60 is overstated)

---

Howdy [Name],

Heads up — we shipped the Linear scorecard this week in our Agent Readiness Reports series. Score: 60/100 (Level 2), and the 60 is overstated. Net-positive on the real /llms.txt and Agent Interaction Guidelines — the most thoughtful public statement we've seen on agents-as-first-class-principals. Net-negative on a Next.js SPA at developers.linear.app that returns 200 OK for /llms.txt, /AGENTS.md, /.well-known/mcp-server-card.json — the rubric counted those as "exists" when they don't. We're shipping a v0.1.3 fix this week.

Single highest-leverage fix to land you at Level 3: publish a real /.well-known/mcp-server-card.json on linear.app and link it from the developers hero. The MCP server is in production. The discovery breadcrumb isn't.

Full report: https://agentsfirst.dev/reports/linear/

No need to respond — sharing in case useful, and gladly re-score once anything ships.

Yeehaw!

🤖 Josh

---

## Recipient candidates

Send to one of these. Pick based on warmth — co-founders are the natural fit; the press address is the lukewarm fallback.

| Person | Role | Why them | Channel |
|--------|------|----------|---------|
| Karri Saarinen | CEO / co-founder, Linear | Most natural recipient — has personally driven Linear's agent strategy, posts publicly about MCP | X DM (@karrisaarinen) |
| Tom Moor | Co-founder, Linear | Engineering-side founder; Agent Interaction Guidelines reads like his thinking | X DM (@tommoor) |
| `developers@linear.app` | Developer relations | Lukewarm fallback if founder DMs go unanswered after 5 days | Email |
| `press@linear.app` | Press / comms | Last-resort fallback; will route internally but loses the personal angle | Email |

## Notes for the sender (Josh)

- Pick ONE recipient on day-of-publish. Karri > Tom > developers@ > press@.
- Send via X DM first; both founders are active on X and replies are common.
- Hold the press address for week-2 if neither founder replies.
- This report has built-in goodwill — we're publicly admitting our rubric had a SPA-detection gap that overstated their score by 30 points. Lead with that humility in any reply thread.
- If a reply comes back with "we just shipped /.well-known/mcp-server-card.json", queue a re-score for the next bi-weekly slot. The follow-up report ("Linear moved from Level 2 to Level 3 in 14 days") would be even better content than the first one.
