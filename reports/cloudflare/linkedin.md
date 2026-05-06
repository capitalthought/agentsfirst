# LinkedIn post — Agent Readiness Report: Cloudflare

Single post, ~340 words. More polished than the X thread; opens with the score, closes with a polite tag of the post's authors.

---

**Agent Readiness Report: Cloudflare scored 40/100. Level 2 (Agent-Aware).**

In April 2026, Cloudflare published the Agent Readiness Score post that became the reference point for "how few sites are actually addressable by AI agents." We pointed our scorer at Cloudflare first — you peer-review the company that wrote the rubric you built on top of.

While probing, we found a bug in our own rubric — it didn't credit the `Content-Signal` directive Cloudflare itself invented. We shipped v0.1.2 to fix it, re-ran the scorer, and Cloudflare still lands at 40/100 on its developer subdomain even after crediting their innovation.

Across three surfaces:
- developers.cloudflare.com — 40/100, Level 2 (the high water mark)
- cloudflare.com — 25/100, Level 1
- blog.cloudflare.com — 15/100, Level 1

The story is the variance, not the headline. A blog hosting Cloudflare's own agent-readiness post scores Level 1 against the rubric the post helped popularize.

What's working: the developer subdomain ships a real /llms.txt (per-product split + a full-archive file), passes markdown content negotiation, and exposes its OpenAPI surface — clean 20/20 on content-accessibility. Cloudflare's `Content-Signal: ai-train=yes, search=yes, ai-input=yes` directive is present on all three surfaces, earning each 10/15 in bot-access-control. Cleanest signal in the report.

What's missing: agent-capabilities scores 0/30 on every surface. No MCP Server Card. No homepage reference to MCP, the CLI, or any SDK install path. Cloudflare ships Code Mode — exposing 2,500 endpoints to an agent in 1,000 tokens — but a model reading cloudflare.com cannot tell the capability exists. The Invisible Product anti-pattern: the capability is real, the signal isn't.

Top three fixes:
1. Publish an MCP Server Card from cloudflare.com and reference it from the homepage hero.
2. Lift /llms.txt to the blog (cloudflare.com already has it; the blog still doesn't) and ship /AGENTS.md on all three surfaces.
3. Keep the Content-Signal directive AND add per-named-bot blocks (GPTBot, ClaudeBot, anthropic-ai, Google-Extended, PerplexityBot, CCBot) for belt-and-suspenders coverage.

The lesson for everyone else: a Level 3 product is Level 3 across every surface an agent might land on. Score your three most-trafficked subdomains; the variance is the bug.

Full report, raw probe data, and rubric (v0.1.2): https://agentsfirst.dev/reports/cloudflare/

First in a bi-weekly Agent Readiness Reports series. Polite tags to the authors of the post we're peer-reviewing — Vance Morrison, André Jesus — and to Matthew Prince. Replies and "we just shipped the fix" notes welcome.

#AgentsFirst #MCP #AIAgents #Cloudflare
