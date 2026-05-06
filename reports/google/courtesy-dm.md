# Courtesy DM — Google Agent Readiness Report

Plain-text email or DM, sent the day the report ships. Modeled on Josh's daily email style guide: "Howdy", short, direct, no hedging, "Yeehaw!" close. ~100 words.

---

**Subject:** Agent Readiness Report: Google scored 25/100

---

Howdy [Name],

Heads up — second in our bi-weekly Agent Readiness Reports series this week, and Google was the target. Score: 25/100 (Level 1) on `developers.google.com`, the highest of four surfaces. `google.com` and `blog.google` both land at 5/100, Level 0. The notable gap: Google invented the `Google-Extended` user-agent in 2023, and none of the four surfaces we scored declare it.

Highest-leverage fix: publish `Google-Extended` on every Google-owned domain. One robots.txt block per surface, zero engineering work. The company that wrote the convention should be the one using it.

Full report: https://agentsfirst.dev/reports/google/

No need to respond — sharing in case useful, and gladly re-score once anything ships.

Yeehaw!

🤖 Josh

---

## Recipient candidates

Send to one of these. Pick based on warmth — the AI Studio lead is the natural fit for a developer-surface story; press is the lukewarm fallback.

| Person | Role | Why them | Channel |
|--------|------|----------|---------|
| Logan Kilpatrick | Lead, Google AI Studio | Most natural recipient — runs developer-facing AI surface, replies on X, tone-fit for the report | X DM (@OfficialLoganK) |
| Demis Hassabis | CEO, Google DeepMind | Owns Gemini; will see signal on AI policy + dev surface story even if he doesn't reply | X DM (@demishassabis) |
| Sundar Pichai | CEO, Google | Top-of-house; will not reply but the inbound is on file. Use only if other channels go silent | X DM (@sundarpichai) |
| `press@google.com` | Press desk | Lukewarm fallback if author DMs go unanswered after 5 days | Email |
| `cloud-press@google.com` | Cloud press desk | If the cloud.google.com angle becomes the lead | Email |

## Notes for the sender (Josh)

- Pick ONE recipient on day-of-publish. Logan > Demis > Sundar > press.
- Logan replies on X and is tone-fit for the report. Send to him first.
- Hold the press addresses for week-2 if no DM reply.
- If a reply comes back with "we just shipped X" (most likely: `Google-Extended` lands on a couple surfaces, since it's the lowest-effort fix), queue a re-score for the next bi-weekly slot. The follow-up report ("Google moved from Level 1 to Level 2 in 14 days") is even better content than the first one.
- Do NOT lump in YouTube, Android, Workspace, Pixel, or Maps in any reply — this report is google.com-the-search-and-developer-surface only. Different scorecards.
