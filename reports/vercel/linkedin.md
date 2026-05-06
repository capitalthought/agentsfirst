# LinkedIn post — Agent Readiness Report: Vercel

Single post, ~360 words. More polished than the X thread; opens with the score, closes with a polite tag of Vercel's leadership.

---

**Agent Readiness Report: Vercel scored 75/100. Level 3 (Agents First).**

This is the first product in the Agent Readiness Reports series to reach Level 3 on any surface. Vercel is the company arguably investing harder in AI infrastructure than anyone else in this report cycle — Vercel AI SDK, AI Gateway, observability for AI apps, the Next.js runtime that hosts a meaningful share of production MCP servers. They sell to AI builders, and on `vercel.com/docs` they show up as a Level 3 product.

Across three surfaces:
- vercel.com/docs — 75/100, Level 3 (Agents First — the high water mark)
- vercel.com — 55/100, Level 2 (Agent-Aware)
- sdk.vercel.ai — 25/100, Level 1 (Agent as Afterthought)

The story is the variance. The company shipping the most-installed AI SDK in production has its AI SDK home — `sdk.vercel.ai` — scoring Level 1 against the framework that AI SDK was built to serve.

What's working: `vercel.com/docs` ships a real `/llms.txt` (~168 KB structured index plus a full-archive companion), passes markdown content negotiation, exposes its OpenAPI surface, and — rarest of all — references both MCP and the SDK in the homepage hero alongside human onboarding. 10/10 on visibility-of-agent-integrations, the dimension almost everyone fails. The robots.txt declares `Content-Signal: search=yes, ai-input=yes, ai-train=no` — the directive Cloudflare invented, used here with the opposite default on training. A legitimate policy choice; the rubric credits the signal in either direction.

What's missing: no MCP Server Card on any surface (15 points across the board). The marketing root drops to Level 2 because the homepage hero references neither MCP nor the SDK. And `sdk.vercel.ai` triggers the Agents Without Rules anti-pattern: agent capabilities advertised, no contract file declares how to use them. The site's own robots.txt says "Move to ai-sdk.dev" — the migration appears to have left the agent-readability story behind.

Top three fixes:
1. Publish an MCP Server Card from vercel.com and reference it from the homepage hero.
2. Lift the docs playbook (Content-Signal, markdown negotiation, /llms.txt, /AGENTS.md, MCP/SDK in the hero) to sdk.vercel.ai and ai-sdk.dev.
3. Ship a real `/AGENTS.md` on all three surfaces — today the path returns the SPA HTML shell, not the contract file an agent expects.

The lesson for everyone else: a real `/llms.txt` is necessary but not sufficient. Vercel publishes one on all three surfaces; two of those three still score Level 1 or 2. Stack the layers; don't ship one and stop. A Level 3 product is Level 3 on every surface an agent might reach.

Full report, raw probe data, and rubric (v0.1.2): https://agentsfirst.dev/reports/vercel/

Second in a bi-weekly Agent Readiness Reports series. Polite tags to Guillermo Rauch and Lee Robinson at Vercel. Replies and "we just shipped the fix" notes welcome.

#AgentsFirst #MCP #AIAgents #Vercel
