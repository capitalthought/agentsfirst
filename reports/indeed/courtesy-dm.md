# Courtesy DM — Indeed Agent Readiness Report

Plain-text email or LinkedIn DM, sent the day the report ships. Modeled on Josh's daily email style guide: "Howdy", short, direct, no hedging, "Yeehaw!" close. ~110 words.

---

**Subject:** Agent Readiness Report: Indeed scored 10/100

---

Howdy [Name],

Heads up — we shipped the Agent Readiness Report on Indeed this week. Score: 10/100 (Level 0). The headline is that Indeed actually wrote a 737-line `/llms.txt` for `www.indeed.com` — thoughtful, well-organized, clearly built in good faith for LLMs — and then your Cloudflare bot mitigation returns 403 to anyone who tries to fetch it without spoofing a browser user-agent. The agent surface exists. The agent can't reach it.

Five-minute fix: whitelist `/llms.txt`, `/AGENTS.md`, `/robots.txt`, `/sitemap.xml` from bot mitigation. Those paths exist for automated clients.

Bigger move (and the real opportunity): ship an MCP server with verb-first tools — `find_jobs`, `apply`, `track_application`. Indeed has the most-relevant agent product surface of any consumer site on the internet. Autonomous job hunting is the canonical Agents First use case. One shipped MCP server away from owning that lane.

Full report: https://agentsfirst.dev/reports/indeed/

No need to respond — sharing in case useful, and gladly re-score once anything ships.

Yeehaw!

🤖 Josh

---

## Recipient candidates

Send to one of these. Pick based on warmth — CEO is the natural fit if a warm path exists; press is the lukewarm fallback.

| Person | Role | Why them | Channel |
|--------|------|----------|---------|
| Chris Hyams | CEO, Indeed | Operational owner of the surface being scored. Has spoken publicly about AI's impact on hiring; this report sits squarely in that lane. Most natural recipient. | LinkedIn DM |
| Hisayuki "Deko" Idekoba | CEO, Recruit Holdings (Indeed's parent) | Strategic recipient — Recruit has been pushing AI integration across all subsidiaries. Lower probability of personal reply, but the signal travels back to Indeed leadership through internal channels. | LinkedIn DM |
| `developer@indeed.com` | Developer relations alias | Direct line to the team that owns (or should own) the developer portal that 301s into a 403. If the report finds a champion inside Indeed, it's likely to be on this team. | Email |
| `press@indeed.com` | Press / corporate comms | Lukewarm fallback if neither CEO DM nor developer alias responds after 5 days. | Email |

## Notes for the sender (Josh)

- Pick ONE recipient on day-of-publish. CEO > parent CEO > developer alias > press.
- Send Chris Hyams via LinkedIn DM first; he's actively on the platform. Idekoba can be queued as week-2 if Hyams goes silent.
- Hold `developer@indeed.com` for a follow-up that includes the specific WAF-rule recommendation and the four well-known paths to whitelist — it's a more technical recipient and benefits from the more technical pitch.
- `press@indeed.com` is the lukewarm fallback. Use only if all three personal outreaches go silent for 7+ days.
- If a reply comes back with "we just shipped X", queue a re-score for the next bi-weekly slot. The follow-up report ("Indeed moved from Level 0 to Level 2 in 14 days by whitelisting four paths and shipping an MCP server card") is even better content than the first one.
