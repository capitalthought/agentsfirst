# LinkedIn post — Agent Readiness Report: Coinbase

Single post, ~340 words. More polished than the X thread; opens with the score, closes with a polite tag of the people building this stack.

---

**Agent Readiness Report: Coinbase scored 35/100. Level 2 (Agent-Aware).**

Coinbase has built more agent infrastructure than almost anyone we've scored. AgentKit. The Agentic Wallet, with its own MCP server for autonomous payments. The CDP CLI exposed as an MCP server for typed access to every CDP API operation. x402, the HTTP-402 spec Coinbase has been pushing for agent-native payments. Three MCP servers in production. The infrastructure for autonomous agents to spend money exists.

Whether their own surface tells agents this exists is the test.

Across three surfaces:
- docs.cdp.coinbase.com — 35/100, Level 2 (the high water mark)
- developers.coinbase.com — 20/100, Level 1
- www.coinbase.com — 10/100, Level 0

The story is the variance, not the headline. The marketing homepage where most humans first meet Coinbase scores Level 0 — even as Coinbase publishes the protocol agents will use to pay each other.

What's working: docs.cdp.coinbase.com publishes the most agent-fluent /llms.txt we've scored — 21 mentions of "agent," 13 of "MCP," 17 of "Wallet," 3 of "x402," with named decision rules ("if the user wants a wallet FOR an agent, start with Agentic Wallet"). It passes markdown content negotiation. Sitemap present. The surprise positive: www.coinbase.com/llms.txt is also genuinely well-written — 5KB of plaintext that explicitly redirects agents to the docs site and names every agent surface by product.

What's missing: agent-capabilities scores 10/30 on docs and 0/30 on the other two surfaces. No /.well-known/mcp-server-card on any surface, even though three MCP servers exist. No homepage MCP reference on coinbase.com. The Invisible Product anti-pattern at the discovery layer: the capability is real, the structured signal isn't.

Top three fixes:
1. Publish a /.well-known/mcp-server-card from coinbase.com and reference it from the homepage hero.
2. Lift /llms.txt to developers.coinbase.com and ship /AGENTS.md on all three surfaces.
3. Add per-named-bot rules to www.coinbase.com/robots.txt — GPTBot, ClaudeBot, anthropic-ai, Google-Extended, PerplexityBot, CCBot.

The lesson for everyone shipping MCP servers in production: ship a /.well-known/mcp-server-card the day you ship the server. Without it, the capability exists for the humans who already know to look.

Full report, raw probe data, and rubric (v0.1.2): https://agentsfirst.dev/reports/coinbase/

Polite tags to the team building this stack — Brian Armstrong, Erik Reppel, Jesse Pollak. Replies and "we just shipped the fix" notes welcome.

#AgentsFirst #MCP #AIAgents #Coinbase #x402
