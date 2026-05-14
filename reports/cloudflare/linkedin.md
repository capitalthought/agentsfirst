# LinkedIn — Cloudflare report

~340 words. Polite tags at the end (verify before posting). Hashtags at the bottom. Full report URL in the body, not just the footer.

---

**Cloudflare scored 85/100 (Level 3 — Agents First) on the rubric they basically invented.**

Three Cloudflare surfaces probed against the Agents First framework on 2026-05-14:

• **www.cloudflare.com**: 85/100 — Level 3 (Agents First)
• **developers.cloudflare.com**: 35/100 — Level 2 (Agent-Aware)
• **blog.cloudflare.com**: 15/100 — Level 1 (Agent as Afterthought)

**What's working** — the marketing root ships the full agent-readability stack: a real /AGENTS.md, /agents.json (A2A registry), /llms.txt mapping 30+ products, a robots.txt that names 7 AI bots with affirmative `Allow: /` (opt-in posture, not blanket-deny), Content-Signal directives, markdown content negotiation, an OpenAPI surface. Discoverability scores a perfect 25/25. Bot-access-control 15/15. Content-accessibility 20/20. This is what a Level 3 marketing root looks like when the team that wrote the [Agent Readiness Score post](https://blog.cloudflare.com/agent-readiness/) practices what they ship.

**What's missing** — the developer portal lags by 50 points. developers.cloudflare.com — the surface where agents actually go to learn how to ship a Worker — has no /AGENTS.md, no /agents.json, no named-bot robots.txt, no MCP Server Card. Same engineering culture, demonstrably the same playbook one subdomain over. The Invisible Product anti-pattern fires. The blog hosting Cloudflare's original ARS post lands at 15/100.

**Top three fixes**:

1. Replicate the marketing-root pattern on developers.cloudflare.com — flat-file edit, ~30 minutes, +50 points on the surface that matters most. Closes the Invisible Product flag.
2. Add a homepage MCP/Agents callout to www.cloudflare.com — the only 10 points missing on the best surface. Cloudflare ships an MCP server; the hero doesn't reference it.
3. Upgrade /AGENTS.md from a 21-line auto-gen stub to a hand-authored constraint contract. Same canonical path; load-bearing content.

**The bigger pattern**: marketing-root vs dev-portal score gaps are the most-repeated finding in this report series. Notion 65 vs 10, Anthropic 60 vs 5, Linear 60 vs lower. Cloudflare inverts it (marketing leads, dev portal lags) but the cause is the same — one team's surface got the agent-readiness shipment; the adjacent team's didn't. The fix is treating these as repo templates that propagate across every public hostname.

Self-grading the framework you wrote — and shipping the artifacts — is a credibility move, not a vanity move. Other companies should do this.

Full report (per-surface scoring, methodology, raw probe data): https://agentsfirst.dev/reports/cloudflare/

Polite tags to the team who shipped this: Matthew Prince, John Graham-Cumming, Brendan Irvine-Broque (verify handles before tagging).

#AgentsFirst #MCP #AIAgents #Cloudflare #DevTools
