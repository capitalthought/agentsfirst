# LinkedIn post — Agent Readiness Report: Stripe

Single post, ~340 words. More polished than the X thread; opens with the score, closes with a polite tag of Stripe leadership.

---

**Agent Readiness Report: Stripe scored 25/100. Level 1 (Agent as Afterthought).**

If anyone in payments should already be Level 3, it's Stripe. The canonical API-first company. The team that ships @stripe/mcp on npm. We pointed our scorer at three Stripe surfaces and the headline is the gap between what Stripe has shipped and what an agent landing on stripe.com can actually find.

Across three surfaces:
- docs.stripe.com — 25/100, Level 1 (high water mark)
- stripe.com — 10/100, Level 0
- dashboard.stripe.com — excluded (login wall returned 200s the scorer mistook for content; filing v0.1.3 rubric fix)

What's working: docs.stripe.com publishes a real /llms.txt — a 93KB structured index — declares the Cloudflare Content-Signal directive (ai-train=yes, search=yes, ai-input=yes), and serves real markdown via the .md suffix. Hit https://docs.stripe.com/payments.md and you get text/plain markdown back, not HTML. Convention beats spec when the convention works. @stripe/mcp v0.3.3 is on npm: "command line tool for setting up Stripe MCP server."

What's missing: the discovery breadcrumbs. stripe.com — the front door for the company that defined developer-first payments — has no /AGENTS.md, no MCP Server Card at /.well-known/mcp-server-card.json, no Content-Signal directive, no homepage reference to MCP. An agent reading stripe.com cannot tell that @stripe/mcp exists. Capability real. Signal absent. Textbook Invisible Product anti-pattern — and the gap that doesn't belong on Stripe of all companies.

Top three fixes:
1. Surface @stripe/mcp from stripe.com (one footer line: "AI agents: npx @stripe/mcp init") and publish /.well-known/mcp-server-card.json at every public root.
2. Honor Accept: text/markdown on canonical docs URLs. Stripe already serves markdown via the .md suffix — the work is the content-negotiation handler, not new content.
3. Add Content-Signal + per-bot blocks to stripe.com's robots.txt; ship /AGENTS.md on all three surfaces with idempotency-key, test-mode, and "never DELETE a live charge" rules.

The lesson: discovery is a separate job from capability. Stripe has every capability worth shipping. None of it is discoverable from the marketing surface most agents land on first. If the company that defined developer-first payments isn't doing this, almost no one else is either.

Full report, raw probe data, and rubric (v0.1.2): https://agentsfirst.dev/reports/stripe/

Bi-weekly series. Polite tags to Patrick Collison, Will Larson, and Mike Clarke. "We just shipped the fix" notes welcome.

#AgentsFirst #MCP #Stripe #DeveloperExperience
