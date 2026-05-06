# LinkedIn post — Agent Readiness Report: Linear

Single post, ~340 words. More polished than the X thread; opens with the score, closes with a polite tag of Linear's founders.

---

**Agent Readiness Report: Linear scored 60/100. Level 2 (Agent-Aware). And the 60 is overstated.**

Linear is the engineering-ergonomics canonical of the agent era. Their changelog mentions MCP fourteen times this quarter. They invented Agent Interaction Guidelines — agent badges in the UI, Agent Sessions, an Agent Activity feed humans use to watch what their agents are doing inside a workspace. Half the engineers we know use Linear specifically because the MCP integration is the cleanest of any planning tool. None of that is in the score.

Across three surfaces:
- developers.linear.app — 60/100, Level 2 (with an asterisk)
- linear.app — 30/100, Level 2
- linear.app/docs — 30/100, Level 2

The 60 is overstated because the dev portal is a Next.js SPA. Every URL — /llms.txt, /AGENTS.md, /.well-known/mcp-server-card.json, /openapi.json — returns the same 1.5MB HTML shell with status 200. The scorer counted those as "the artifact exists." They don't. We're shipping a v0.1.3 rubric fix this week so the "MCP Server Card published" signal only triggers when the response is application/json and parses correctly.

What's working: linear.app ships a real /llms.txt — every doc enumerated as a .md URL. The Agent Interaction Guidelines doc is the most thoughtful public statement we've read on what an Agents-First product looks like in production.

What's missing: no /.well-known/mcp-server-card.json on any surface. Linear runs an official MCP server but the discovery breadcrumb doesn't exist. npm view @linear/mcp returns 404 — the first three results when an agent searches "linear mcp" are community wrappers, not the official server. No Content-Signal directive in robots.txt; no per-named-bot blocks.

Top three fixes:
1. Publish /.well-known/mcp-server-card.json on linear.app and link it from the developers hero. Worth 30 points. Lands Linear at Level 3.
2. Add Next.js rewrites so well-known paths return real artifacts, not the React shell. A 200 OK on every URL is not a feature.
3. Cross-publish Agent Interaction Guidelines as /AGENTS.md and add Content-Signal + per-named-bot blocks to robots.txt.

The lesson for engineering-led companies: shipping the agent capability isn't the same as letting agents discover it. Linear has done the hard part. The easy part — three static files at three well-known paths — is what gets the score.

Full report and the v0.1.3 rubric fix this surfaced: https://agentsfirst.dev/reports/linear/

Polite tag to Karri Saarinen and Tom Moor — peer-reviewing a product I admire. Replies and "we just shipped the fix" notes welcome.

#AgentsFirst #MCP #AIAgents #Linear
