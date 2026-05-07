# LinkedIn post — Agent Readiness Report: Browserbase

Single post, ~340 words. Lead with score, the unusual variance pattern, and what makes Browserbase the cleanest expression of "they live this" we've scored to date.

---

**Agent Readiness Report: Browserbase scored 70/100. Level 3 (Agents First). Marketing root carries the score, not the docs subdomain — and across this series, that variance has almost always run the other way.**

Across two surfaces:
- browserbase.com — 70/100, Level 3 (Agents First — the high water mark)
- docs.browserbase.com — 45/100, Level 2 (Agent-Aware)

The story is the inverted variance. Most products in this report cycle have docs > marketing — gorgeous developer experience hidden under `/docs`, anonymous homepage. Browserbase has it the other way around. The marketing root is built for the customer they actually serve. The OG description on `browserbase.com` is "Give your agents access to the whole web." The hero markets to AI builders before humans. Open-graph copy, headline, and CTA all aimed at agent developers.

What's working: agent-capabilities scores 30/30 on the marketing root — perfect. MCP Server Card path. AGENTS.md path. OAuth/AI-plugin authorization-server discovery surface. Visibility-of-agent-integrations scores 10/10 — the dimension almost everyone fails. Discoverability lands at 20/25, helped by the `/llms.txt` Mintlify ships at the docs subdomain (~25 KB structured index opening with "Browserbase is the Browser Agent Platform"). The "they live this" pattern: when your product is fundamentally for agents, the front door should be too.

What's missing: the contract paths on `www` return 200 with the Next.js SPA HTML shell as the body, not actual content (same loophole Vercel hit; rubric will tighten in v0.1.3). Bot-access-control scores 0/15 on both surfaces — no Content-Signal directive. And the docs subdomain has no `/AGENTS.md` and no MCP card at all, so it triggers Agents Without Rules — that's the 25-point gap.

Top three fixes:
1. Ship real content at `/AGENTS.md` and `/.well-known/mcp-server-card.json` on the marketing root. The SPA catchall returning HTML at these paths gets credit today; it won't in v0.1.3.
2. Lift the marketing-root pattern to docs.browserbase.com — real `/AGENTS.md`, real MCP card, mirror what exists on `www`.
3. Wire markdown content negotiation on the docs subdomain. The `.md` companion URLs already exist at every Mintlify page; the `/llms.txt` enumerates them. Header to body — that's the missing piece.

The lesson for everyone else: when your product is for agents, design the front door for them too. Don't bury the agent story under `/docs`. Browserbase is the cleanest expression of that we've scored.

Full report, raw probe data, and rubric (v0.2.0): https://agentsfirst.dev/reports/browserbase/

Polite tags to Paul Klein IV at Browserbase, and to Anirudh Kamath who leads Stagehand.

#AgentsFirst #MCP #AIAgents #Browserbase #BrowserAutomation
