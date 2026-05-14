# Courtesy DM — Cloudflare report

Pick one recipient (LinkedIn first, then X, then email). Send before publishing the public X thread / LinkedIn post — gives the recipient a chance to react in private first, which builds the relationship better than reading about the score in their feed.

---

## DM body (Josh's email voice)

```
Howdy [Name],

We just shipped an Agent Readiness Report on Cloudflare against the Agents First rubric (the one your April Agent Readiness Score post is the canonical source for). www.cloudflare.com scored 85/100, Level 3 — second only to Vercel in the series. Real respect: you wrote the rubric, scored yourself, and shipped the artifacts on the marketing root. That sequence is the credibility move.

The variance is the story though — developers.cloudflare.com scored 35/100. Same engineering culture, demonstrably the same playbook one subdomain over. Closing it is a flat-file edit (copy /AGENTS.md, /agents.json, named-bot robots.txt over to the dev portal) — ~30 min for +50 points on the surface that arguably matters more.

Full report: https://agentsfirst.dev/reports/cloudflare/

No need to respond — sharing in case useful, and gladly re-score once anything ships.

Yeehaw!

🤖 Josh
```

---

## Recipient candidates

| Person | Role | Why them | Channel |
|---|---|---|---|
| **Brendan Irvine-Broque** | Workers / Developer Platform PM (Cloudflare) | Most likely to be the operator who decides what ships on developers.cloudflare.com next; PM tier where the marketing-root → dev-portal hand-off lives. Direct fix-path conversation. | **LinkedIn DM** — verify handle first |
| Matthew Prince | CEO, Cloudflare | Active on X, will see + likely reshare; relationship-building tier rather than fix-path tier. Best for the public-credibility win. | LinkedIn DM ([linkedin.com/in/eastdakota](https://linkedin.com/in/eastdakota)) — verify before sending; or X (@eastdakota) |
| John Graham-Cumming | CTO, Cloudflare | Long-running tech blogger; would respect the rubric and the credibility frame. Closer to the "is this rigorous?" check than fix-path. | LinkedIn DM — verify handle first |
| Sam Rhea | Product, Cloudflare (frequently bylined on Workers/agents posts) | Often co-authors the developer platform launches; possible original ARS post co-author. Direct dev-portal-fix path if he's the right person. | LinkedIn DM — verify handle first |

**Pick rule:** Brendan Irvine-Broque first — fix-path matters more than reach for the first send. Matt Prince is the natural follow-up if Brendan doesn't respond within 5 days.

**Channel order:** LinkedIn DM > X DM > email (no public CF press address known to be agent-monitored).

**Fallback timing:** if no response within 5 business days from the first send, retry on the next-tier candidate. Don't double-send to the same person.

**If Cloudflare replies:**
- "We just shipped the fix to developers.cloudflare.com" → re-run `/agentsfirst developers.cloudflare.com`, post a follow-up X thread + comment on the original report ("CF moved L2→L3 in 6 days — here's what landed"). The follow-up is better content than the original report.
- "Disagree with X" → engage; if their critique is legitimate, file as a `bugs/incoming/` report against agentsfirst itself and update the rubric.
- Silence → fine; the public post still lands, the relationship is on file for the next cycle.

---

## Notes for the sender

- **Verify handles before tagging anyone in the public posts.** Per the global rule. The /grok-twitter --verify mode resolves the handle + confidence; don't trust training-data recall.
- **Send the DM 12–24h before the public post lands**, not after. The recipient hearing about the score from you privately first is the difference between "courtesy" and "ambush."
- **Lead with the score, not the critique.** 85/100 is real respect; the developer-portal observation is constructive, not snarky.
- **Don't oversell the fix.** "30 min for +50 points" is the honest characterization of a flat-file edit if the artifacts are repo-templated; if they aren't yet, the real cost is "however long it takes to set up the template repo." Either is fine; just don't promise instant.
