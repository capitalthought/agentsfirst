# LinkedIn post — Agent Readiness Report: Cursor

Single post, ~340 words. Polished; opens with the score, closes with a polite tag of Cursor's leadership.

---

**Agent Readiness Report: Cursor scored 70/100. Level 3 (Agents First).**

Second product in the Agent Readiness Reports series to crack Level 3. Cursor is the agent-native IDE — the editor that turned MCP from a protocol document into a default install for working developers — and the docs surface that powers their product reflects the team's worldview. They sell to humans who write code with agents; their docs read like a contract written for the agents that will read them.

Across three surfaces:
- docs.cursor.com — 70/100, Level 3 (Agents First — the high water mark)
- cursor.com — 30/100, Level 2 (Agent-Aware)
- www.cursor.com — 30/100, Level 2 (identical profile to the apex)

What's working on docs.cursor.com: a real `/AGENTS.md` at the docs root (the load-bearing contract artifact promoted to 15 points in v0.2.0 of the rubric), `/llms.txt` published, an MCP Server Card at `/.well-known/mcp-server-card.json`, and OAuth-with-PKCE discovery present. Agent-capabilities scores a clean 30/30 — the first surface in the report series to max out that dimension. The homepage hero references MCP, CLI, SDK, and API alongside human onboarding: 10/10 on visibility, the dimension almost everyone fails. Cursor passes because the team building the product lives the way it builds.

What's missing: no `Content-Signal` directive on robots.txt anywhere — that's the cheapest 10 points in the rubric, on the dimension where Cursor scores zero. Markdown content negotiation does not pass. And `cursor.com` (the marketing root) trips the Agents Without Rules anti-pattern: agent capabilities advertised on the product, no contract file at the root telling an agent how to use them.

Top three fixes:
1. Lift the docs playbook to cursor.com — `/AGENTS.md` + MCP Server Card + Content-Signal at the marketing root.
2. Add `Content-Signal` to robots.txt on every surface — pick a direction, either earns full credit.
3. Serve `text/markdown` when an agent asks for it; docs are already authored in markdown.

The lesson for everyone else: a product team that lives the agent worldview ships the surfaces to match — but only on the surface its team owns directly. Variance from 70 → 30 across subdomains of the same company is this series' recurring finding. A Level 3 product is Level 3 on every surface an agent might reach.

Full report, raw probe data, and rubric (v0.2.0): https://agentsfirst.dev/reports/cursor/

Third in a bi-weekly Agent Readiness Reports series. Polite tags to Eric Zakariasson on the Cursor docs/DevX team and Michael Truell, Aman Sanger, and Sualeh Asif at Anysphere. Replies and "we just shipped the fix" notes welcome.

#AgentsFirst #MCP #AIAgents #Cursor #DeveloperExperience
