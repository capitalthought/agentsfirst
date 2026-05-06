# LinkedIn post — Agent Readiness Report: Anthropic

Single post, ~340 words. More polished than the X thread; opens with the score, closes with a polite tag of the people most likely to actually act on it.

---

**Agent Readiness Report: Anthropic scored 60/100. Level 2 (Agent-Aware).**

Anthropic invented the Model Context Protocol — the open standard the Agent Readiness rubric is built around. After scoring Cloudflare first (they wrote the original Agent Readiness Score post), Anthropic was the obvious second target: you peer-review the company at the protocol's center.

Across three surfaces:
- docs.anthropic.com — 60/100, Level 2 (the high water mark)
- claude.ai — 45/100, Level 2
- www.anthropic.com — 5/100, Level 0

The story is the spread. A 55-point gap across three surfaces of the same company, and the marketing site for the team that defined MCP scores Level 0 against a rubric that explicitly credits MCP.

What's working: docs.anthropic.com ships a real /llms.txt (146KB, structured per product, 11 languages), a real /.well-known/mcp-server-card with OAuth-with-PKCE auth-server discovery, and clean 20/20 on content-accessibility — markdown content negotiation works, sitemap present, OpenAPI surface discoverable. The shipped artifacts are the right artifacts.

What's missing: bot-access-control scores 0/15 on every surface. No Content-Signal directive, and — more striking — no per-bot rules naming ClaudeBot, anthropic-ai, or claude-web on any of the three surfaces. The only bots claude.ai's robots.txt names are GPTBot, OAI-SearchBot, and ChatGPT-User — all OpenAI's, all Disallow. The MCP authors do not name themselves in their own robots.txt.

The marketing site is pure Invisible Product. Generic robots.txt, no /llms.txt, no AGENTS.md, no MCP card, no CLI install path in the hero.

Top three fixes:
1. Lift the docs pattern to anthropic.com — /llms.txt, /AGENTS.md, MCP server card, sitemap. Same files, one subdomain over. ~50 points on the marketing root in one PR.
2. Ship a robots.txt that names ClaudeBot, anthropic-ai, and claude-web on all three surfaces, plus Content-Signal: ai-train=yes, search=yes, ai-input=yes.
3. Reference the MCP server from the homepage hero, not just /.well-known/. A `claude mcp add anthropic` line closes the visibility-of-agent-integrations gap.

The lesson for everyone else: a Level 3 product is Level 3 across every surface an agent might land on. The docs team and the marketing team both work for the same company. The agent does not know that.

Full report, raw probe data, and rubric (v0.1.2): https://agentsfirst.dev/reports/anthropic/

Second in a bi-weekly Agent Readiness Reports series. Polite tags to Mike Krieger (CPO) and David Soria Parra (MCP co-creator). Replies and "we just shipped the fix" notes welcome.

#AgentsFirst #MCP #AIAgents #Anthropic #Claude
