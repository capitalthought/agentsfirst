# Courtesy DM — Anthropic Agent Readiness Report

Plain-text email or LinkedIn DM, sent the day the report ships. Modeled on Josh's daily email style guide: "Howdy", short, direct, no hedging, "Yeehaw!" close. ~110 words.

---

**Subject:** Agent Readiness Report: Anthropic scored 60/100

---

Howdy [Name],

Heads up — second Agent Readiness Report shipped this week, and Anthropic was the target (Cloudflare was the first). Score: 60/100 (Level 2) on docs.anthropic.com — MCP server card and /llms.txt are doing real work. www.anthropic.com lands at 5/100, Level 0 — same company, none of the same artifacts.

The other thing the rubric flagged: zero of the three robots.txt files (anthropic.com / docs / claude.ai) name ClaudeBot, anthropic-ai, or claude-web. The MCP authors don't name themselves.

Single highest-leverage fix: copy the docs pattern up to www.anthropic.com. ~50 points in one PR.

Full report: https://agentsfirst.dev/reports/anthropic/

No need to respond — sharing in case useful, gladly re-score once anything ships.

Yeehaw!

🤖 Josh

---

## Recipient candidates

Send to one of these. Pick based on warmth — protocol author and CPO are the natural fits; press address is the lukewarm fallback.

| Person | Role | Why them | Channel |
|--------|------|----------|---------|
| David Soria Parra | Co-creator of MCP at Anthropic | Most natural recipient — the protocol author seeing the protocol's home company score against the rubric the protocol enables. Cited in the Agents First thesis. | LinkedIn DM (or X if active) |
| Mike Krieger | CPO, Anthropic | Public on X, replies in DMs, owns the product surface (claude.ai + anthropic.com) where most of the gaps live. | X DM |
| Justin Spahr-Summers | Co-creator of MCP at Anthropic | Same as David Soria Parra — the other protocol author. | LinkedIn DM |
| `press@anthropic.com` | Press / comms | Lukewarm fallback if author/CPO DMs go unanswered after 5 days. Will route internally to whoever owns the marketing site. | Email |
| `developer-relations@anthropic.com` | DevRel | Better fallback than press — DevRel owns the developer surface narrative and can route to the docs team that already does the right thing. | Email |

## Notes for the sender (Josh)

- Pick ONE recipient on day-of-publish. Protocol author > CPO > DevRel > press.
- Send via LinkedIn first if going to David or Justin; X DM is the right channel for Krieger.
- Hold the press address (`press@anthropic.com`) for week-2 if no author or CPO replies.
- If a reply comes back with "we just shipped X", queue a re-score for the next bi-weekly slot. The follow-up report ("Anthropic moved from Level 2 to Level 3 in 14 days, and the marketing site went from 5 to 70") is even better content than the first one.
- Anthropic is bigger than Cloudflare and the protocol-author angle is sharper. Peer-review posture, not gotcha. Re-read the body before sending — anything that reads as a dunk gets cut.
