# Courtesy DM — Coinbase Agent Readiness Report

Plain-text email or DM, sent the day the report ships. Modeled on Josh's daily email style guide: "Howdy", short, direct, no hedging, "Yeehaw!" close. ~100 words.

---

**Subject:** Agent Readiness Report: Coinbase scored 35/100

---

Howdy [Name],

Heads up — we shipped this week's Agent Readiness Report scorecard, and Coinbase was the test case. Score: 35/100 (Level 2) on docs.cdp.coinbase.com. Net-positive on the most agent-fluent llms.txt we've scored — 13 mentions of MCP, 3 of x402, named decision rules for Agentic Wallet vs Server Wallets vs AgentKit. Net-negative on www.coinbase.com at 10/100, Level 0 — the marketing homepage is invisible to agents, even as Coinbase publishes the protocol agents will use to pay each other.

Single highest-leverage fix to land Coinbase at Level 3: publish a /.well-known/mcp-server-card from coinbase.com and reference it from the homepage hero. Three MCP servers already exist. The discovery breadcrumb is what's missing.

Full report: https://agentsfirst.dev/reports/coinbase/

No need to respond — sharing in case useful, and gladly re-score once anything ships.

Yeehaw!

🤖 Josh

---

## Recipient candidates

Send to one of these. Pick based on warmth — closest to the agent stack first; press address is the lukewarm fallback.

| Person | Role | Why them | Channel |
|--------|------|----------|---------|
| Erik Reppel | Head of CDP (Coinbase Developer Platform) | Owns the surface scoring 35/100; the docs subdomain and the MCP servers are his team's work | X DM |
| Jesse Pollak | Head of Base, Coinbase | Heavily public on agent-native + x402; will see signal, has reach | X DM (@jessepollak) |
| Brian Armstrong | CEO, Coinbase | Posts on agent-native crypto regularly; long shot on reply, high signal if he sees it | X DM (@brian_armstrong) |
| `developers@coinbase.com` | Developer relations / press | Lukewarm fallback if direct DMs go unanswered after 5 days | Email |
| `press@coinbase.com` | Press | Last resort | Email |

## Notes for the sender (Josh)

- Pick ONE recipient on day-of-publish. Erik (CDP head) > Jesse (Base + agent-native) > Brian (CEO).
- Send via X DM first; Coinbase leadership lives on X.
- Hold the press addresses for week-2 if neither leader replies.
- If a reply comes back with "we just shipped X", queue a re-score for the next bi-weekly slot. The follow-up report ("Coinbase moved from Level 2 to Level 3 in 14 days") is even better content than the first one.
- Special case: if the reply mentions x402 specifically — that's the cleanest co-published angle. "Coinbase publishes the spec; here's what shipping it on coinbase.com would look like."
