# Courtesy DM — Stripe Agent Readiness Report

Plain-text email or LinkedIn DM, sent the day the report ships. Modeled on Josh's daily email style guide: "Howdy", short, direct, no hedging, "Yeehaw!" close. ~100 words.

---

**Subject:** Agent Readiness Report: Stripe scored 25/100

---

Howdy [Name],

Heads up — we shipped an Agent Readiness Report on Stripe this week. Score: 25/100, Level 1. Honest scoring across stripe.com, docs.stripe.com, and dashboard.stripe.com (dashboard excluded — login wall threw rubric false positives).

The story: capability real, signal absent. @stripe/mcp ships on npm. docs.stripe.com publishes /llms.txt, declares Content-Signal, serves markdown via the .md suffix. But stripe.com — the front door — has no MCP Server Card, no /AGENTS.md, no Content-Signal, and the homepage doesn't mention any of the agent surface Stripe already operates.

Highest-leverage fix: surface @stripe/mcp from stripe.com and drop /.well-known/mcp-server-card.json at every public root. The hard work is done. The breadcrumbs aren't.

Full report: https://agentsfirst.dev/reports/stripe/

No need to respond — sharing in case useful, and gladly re-score once anything ships.

Yeehaw!

🤖 Josh

---

## Recipient candidates

Send to one of these. Pick based on warmth — developer platform leadership is the natural fit; CEO is the long shot; press is the lukewarm fallback.

| Person | Role | Why them | Channel |
|--------|------|----------|---------|
| Mike Clarke | Head of Developer Platform, Stripe | Owns the surface area being scored — MCP, docs, SDKs. Most actionable recipient. | LinkedIn DM |
| Patrick Collison | Co-founder & CEO, Stripe | Active on X (@patrickc), engages with developer-experience posts personally. Long shot but high signal if he sees it. | X DM (he replies on X) |
| Will Larson | CTO, Stripe | Public technical voice; cares about platform legibility. Good fallback if Mike Clarke doesn't reply. | LinkedIn DM |
| `developers@stripe.com` | Developer Relations | Lukewarm fallback if individual DMs go unanswered after 5 days. | Email |
| `press@stripe.com` | Press | Last resort. Use only if developers@ also goes silent. | Email |

## Notes for the sender (Josh)

- Pick ONE recipient on day-of-publish. Mike Clarke > Patrick Collison > Will Larson > developers@.
- LinkedIn DM first — more personal than email at this stage. Patrick replies on X if he replies anywhere.
- Hold the press address for week-2 if neither product leader replies.
- If a reply comes back with "we just shipped X", queue a re-score for the next bi-weekly slot. The follow-up report ("Stripe moved from Level 1 to Level 3 in 14 days") is even better content than the first one — and Stripe is exactly the kind of team that could ship this in a sprint.
