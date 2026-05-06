# Courtesy DM — WSJ Agent Readiness Report

Plain-text email or LinkedIn DM, sent the day the report ships. Modeled on Josh's daily email style guide: "Howdy", short, direct, no hedging, "Yeehaw!" close. ~110 words.

---

**Subject:** Agent Readiness Report: WSJ scored 10/100 — but the asterisk matters

---

Howdy [Name],

Heads up — we shipped an Agent Readiness Report on WSJ this week. Score: 10/100, Level 0. Caveat right up front: the rubric measures public surfaces (robots.txt, /llms.txt, /AGENTS.md, MCP server cards) and cannot see the OpenAI licensing deal. So the score reads "Invisible Product" when the actual posture is "closed by editorial choice + bilateral license." The report makes that distinction explicit.

The single highest-leverage fix that respects the editorial stance: publish a Content Signals directive (`Content-Signal: ai-train=licensed, ai-input=licensed, search=yes`) and ship `/AGENTS.md` at wsj.com pointing at `copyright@dowjones.com`. Makes the licensing posture machine-readable so unlicensed crawlers stop hammering closed doors and prospective licensees know who to email.

Full report: https://agentsfirst.dev/reports/wsj/

No need to respond — sharing in case useful, and gladly re-score once anything ships.

Yeehaw!

🤖 Josh

---

## Recipient candidates

Send to one of these. Pick based on warmth — the Editor in Chief is the natural narrative recipient (this is a content/licensing posture story, not an engineering one); the licensing inboxes are the lukewarm fallback.

| Person | Role | Why them | Channel |
|--------|------|----------|---------|
| Almar Latour | CEO of Dow Jones / Publisher of WSJ | Owns the commercial posture this report is really about — the OpenAI deal is his lane. Public on LinkedIn. | LinkedIn DM |
| Emma Tucker | Editor in Chief, WSJ | Owns the editorial stance the report respects (we're not asking her to rip the paywall). Active on X. | X DM |
| `copyright@dowjones.com` | Dow Jones IP / licensing team | Lukewarm fallback if exec DMs go unanswered after 5 days. Same address WSJ's robots.txt directs licensees to. | Email |
| `licensing@dowjones.com` | Dow Jones licensing inbox | Alternative to copyright@; route here if the report sparks an actual licensing inquiry. | Email |
| `press@wsj.com` | WSJ press desk | Coldest fallback; only use if everything above goes silent and the story has external pickup that warrants a response. | Email |

## Notes for the sender (Josh)

- Pick ONE recipient on day-of-publish. Almar > Emma > copyright@.
- Almar is the right first send — the deal is his story, and the LinkedIn DM is more personal than email.
- Hold the press address for week-2 if neither exec replies and the story is getting traction elsewhere.
- If a reply comes back hot ("you're framing the deal wrong"), respond once acknowledging the asterisk is in the report, then drop it. Don't argue.
- If a reply comes back warm ("we should add that Content Signals line"), queue a re-score for the next bi-weekly slot. The follow-up report — "WSJ moved from Level 0 to Level 1 in 14 days by publishing a Content Signals directive" — is the better content than the first one.
- Do NOT lead with the OpenAI deal in the DM body itself; the report does that work. The DM stays focused on the constructive fix.
