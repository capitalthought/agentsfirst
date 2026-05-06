# Courtesy DM — Amazon Agent Readiness Report

Plain-text email or social DM, sent the day the report ships. Modeled on Josh's daily email style guide: "Howdy", short, direct, no hedging, "Yeehaw!" close. ~110 words.

---

**Subject:** Agent Readiness Report: Amazon scored 30/100

---

Howdy [Name],

Heads up — we shipped the Amazon Agent Readiness Report this week. Headline: 30/100 (Level 2). The headline is the highest of three subdomains; the variance is the actual story — developer.amazon.com at 30, aws.amazon.com at 20, amazon.com at 10.

The single highest-leverage fix to land AWS at Level 3: publish an MCP Server Card from aws.amazon.com and reference it from the homepage hero. Amazon Q already speaks MCP. Bedrock hosts the models that consume it. An agent reading aws.amazon.com cannot tell — the capability is real, the discovery breadcrumb isn't.

Full report: https://agentsfirst.dev/reports/amazon/

No need to respond — sharing in case useful, and gladly re-score once anything ships.

Yeehaw!

🤖 Josh

---

## Recipient candidates

Send to one of these. Pick based on warmth and which surface the recipient owns. AWS execs are the most natural fit because the AWS-side fix is the highest-leverage one in the report.

| Person | Role | Why them | Channel |
|--------|------|----------|---------|
| Werner Vogels | CTO, Amazon | Posts publicly on developer experience and dev tools. Most likely to engage on the AWS-side argument; will see the signal even if he doesn't reply. | X DM (`@Werner`) |
| Andy Jassy | CEO, Amazon | Cross-cuts retail + AWS + devices. The variance argument (30 / 20 / 10) is most relevant at his altitude. | LinkedIn DM |
| Swami Sivasubramanian | VP of AI/ML, AWS | Owns Bedrock + Amazon Q — the surfaces this report says are real but invisible. Closest engineering owner of the highest-leverage fix. | LinkedIn DM |
| Jeff Barr | VP & Chief Evangelist, AWS | Public face of AWS developer relations. Writes the blog. The one who would author "we just shipped /llms.txt." | X DM (`@jeffbarr`) |
| `aws-pr@amazon.com` | AWS press / PR | Lukewarm fallback if author/exec DMs go unanswered after 5 days. | Email |
| `press@amazon.com` | Amazon corporate press | Coldest fallback. Use only if AWS-side outreach goes nowhere. | Email |

## Notes for the sender (Josh)

- Pick ONE recipient on day-of-publish. Werner > Jeff Barr > Swami > Jassy > press.
- Werner Vogels actually replies on X; he's the right first try.
- If Werner doesn't bite within 3 days, try Jeff Barr — he answers DMs and runs the blog where the fix would land.
- Hold the press addresses for week-2. Amazon press is famously slow; don't waste the first move on them.
- If a reply comes back with "we just shipped X", queue a re-score for the next bi-weekly slot. The follow-up report ("AWS moved from Level 1 to Level 2 in 14 days") is even better content than the first one.
- Do NOT lead the outreach with the consumer-retail score. amazon.com's 10/100 is a deliberate business decision; framing it as a failure misreads the situation and burns the relationship. Lead with AWS where the gap is clearly missed-opportunity rather than policy.
