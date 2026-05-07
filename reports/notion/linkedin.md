# LinkedIn post — Agent Readiness Report: Notion

Single post, ~340 words. Opens with the score and the variance theme; closes with a polite tag of the Notion API team that did the high-scoring work.

---

**Agent Readiness Report: Notion scored 65/100. Level 3 (Agents First).**

The headline number puts Notion's developer portal in the celebration tier alongside Vercel, Cursor, and Browserbase. The story is the variance. A 55-point gap between developers.notion.com and notion.so — the largest score spread in the public series. The platform team gets it. The marketing team is one cycle behind.

Across three surfaces:
- developers.notion.com — 65/100, Level 3 (Agents First — the high water mark)
- notion.com — 10/100, Level 0 (No agent access)
- notion.so — 10/100, Level 0 (No agent access)

What's working: developers.notion.com ships a real /AGENTS.md (2.8KB, written for the team itself, opens by pointing the agent at the /llms.txt companion), a real /llms.txt (24KB index), passes markdown content negotiation, exposes its OpenAPI surface, and serves a working OAuth-with-PKCE auth-server discovery document. The homepage hero references MCP alongside human onboarding — 10/10 on visibility-of-agent-integrations, the dimension almost everyone fails.

What's missing: notion.so robots.txt names five bots, all SEO crawlers being blocked (BLEXBot, AhrefsBot, Amazonbot, SemrushBot, dotbot). Zero AI bots are named. The robots.txt declares a position on SEO and stays silent on AI. No /AGENTS.md, no MCP server card, no markdown negotiation, no homepage reference to MCP/SDK/API. notion.com/llms.txt actually returns 200 — Notion already publishes /llms.txt at the marketing root — but the surrounding artifacts are missing. The cheapest 5 points are shipped. The other 55 are not.

Top three fixes:
1. Copy developers.notion.com/AGENTS.md up to notion.so/AGENTS.md and notion.com/AGENTS.md. Add Content-Signal and per-bot rules to the robots.txt.
2. Publish the MCP server card at /.well-known/ on all three surfaces. Notion runs mcp.notion.com in production; the discovery breadcrumb is the only piece missing.
3. Reference mcp.notion.com from the notion.so homepage hero. One line above the fold closes a 10-point gap.

The lesson for everyone else: the dev portal team gets it; the marketing team is one cycle behind. ~30 minutes of work, ~30 points on the marketing root. The cost of not shipping the edit is that every agent crawling notion.so walks away believing Notion has no agent story — when in fact Notion has the best agent story in this report cluster after Vercel.

Full report, raw probe data, and rubric (v0.2.0): https://agentsfirst.dev/reports/notion/

Latest in the bi-weekly Agent Readiness Reports series. Polite tags to Kenneth Sinder (Notion API + MCP) and Marissa Felix (Notion API PM) — the team that built the high-scoring surface. Replies and "we just shipped the fix" notes welcome.

#AgentsFirst #MCP #AIAgents #Notion #DeveloperExperience
