# Courtesy DM — Vercel Agent Readiness Report

Plain-text email or LinkedIn DM, sent the day the report ships. Modeled on Josh's daily email style guide: "Howdy", short, direct, no hedging, "Yeehaw!" close. ~110 words.

---

**Subject:** Agent Readiness Report: Vercel scored 75/100

---

Howdy [Name],

Heads up — second Agent Readiness Report scorecard ships this week, and Vercel was the test case. Score: 75/100 (Level 3) on `vercel.com/docs` — first product in the series to hit Level 3 on any surface. The marketing root is at 55/100. The loudest finding: `sdk.vercel.ai` lands at 25/100, Level 1, and trips the Agents Without Rules anti-pattern. Robots.txt there says "Move to ai-sdk.dev" — the migration left the agent-readability story behind.

Single highest-leverage fix: publish an MCP Server Card from `vercel.com` and reference it from the homepage hero. Vercel runs MCP servers in production through the platform; the discovery breadcrumb is missing.

Full report: https://agentsfirst.dev/reports/vercel/

No need to respond — sharing in case useful, and gladly re-score once anything ships.

Yeehaw!

🤖 Josh

---

## Recipient candidates

Send to one of these. Pick based on warmth — Lee Robinson is the natural DevRel-leadership fit; Rauchg is the founder loudly engaged on AI infra; press is the lukewarm fallback.

| Person | Role | Why them | Channel |
|--------|------|----------|---------|
| Lee Robinson | VP DevRel, Vercel | Owns the docs / SDK / agent-developer surface that drives the score split. Most likely to triage and route the fix list. | LinkedIn DM or X (`@leeerob`) |
| Guillermo Rauch | CEO, Vercel | Active on X about AI agents and Next.js; will see signal even if he doesn't reply directly. | X DM (`@rauchg`) |
| `press@vercel.com` | Vercel press / comms | Lukewarm fallback if author DMs go unanswered after 5 days. | Email |
| `hello@vercel.com` | General inbound | Last-resort fallback. Lower hit rate than press@. | Email |

## Notes for the sender (Josh)

- Pick ONE recipient on day-of-publish. DevRel lead > CEO > press.
- Lee Robinson is the right first send — he runs the team that owns the surfaces being scored, and he routinely engages on developer-experience posts. Higher reply odds than Rauchg.
- Send via X DM if the recipient is mutuals; LinkedIn DM otherwise. Email last.
- Hold the press address for week-2 if neither author replies.
- If a reply comes back with "we just shipped X", queue a re-score for the next bi-weekly slot. The follow-up report ("Vercel moved sdk.vercel.ai from Level 1 to Level 3 in 14 days") is even better content than the first one — and matches Vercel's product cadence well enough that it's plausible.
