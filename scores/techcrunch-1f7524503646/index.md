---
title: "Agents First Score — techcrunch.com"
description: "Score: 20/100 · Level 1 (Agent as Afterthought). TechCrunch isn't at Level 1 by negligence — it's at Level 1 by editorial choice; robots.txt explicitly disallows 14 named AI agents."
noindex: true
sitemap: false
image: /scores/techcrunch-1f7524503646/og.png
author: Joshua Baer
---

# Agents First Score — techcrunch.com

**Score: 20/100 · Level 1 (Agent as Afterthought)**

TechCrunch isn't at Level 1 by negligence — it's at Level 1 *by editorial choice*. Their `robots.txt` explicitly disallows 14 named AI agents (GPTBot, ClaudeBot, anthropic-ai, ChatGPT-User, Google-Extended, PerplexityBot, CCBot, cohere-ai, Bytespider, Applebot-Extended, FacebookBot, Diffbot, omgili). They've decided agents are not customers. That puts them in a different category than most Level-1 sites — most are at Level 1 by inattention; TC is at Level 1 by policy.

### What's working

- ✅ **Per-bot robots.txt posture** (5/5 of Bot Access Control) — 14 named AI agents addressed individually rather than blanket-deny. This is what bot access control should look like, even if the *content* of each rule is `Disallow: /`.
- ✅ **Sitemap.xml** (5/5 of Content Accessibility) — large (240KB), real, includes a `news-sitemap.xml` companion.
- ✅ **Explicit AI policy declaration** (5/10 of Bot Access Control) — partial credit. The intent is clearly declared (block all AI training), just via classic `robots.txt` convention rather than the newer Cloudflare `Content-Signal` directive. Either reading is unambiguous to a modern crawler.

### What's missing

- ⚠️ **No `/llms.txt`, no `/AGENTS.md`, no `/.well-known/agent-rules`** (0/20 of Discoverability) — nothing for agents to read about how to engage with the site. Coupled with the disallow-everything stance, the message reads as "go away" rather than "engage on these terms."
- ⚠️ **No agent capabilities at all** (0/30) — no MCP Server Card, no CLI, no SDK, no OpenAPI. The product is invisible to any agent that *would* be allowed in (none, currently).
- ⚠️ **No markdown content negotiation** (0/10 of Content Accessibility) — `Accept: text/markdown` returns HTML. For a publication, this is the lowest-cost agent-friendliness move possible. Ironic that they don't have it given the editorial stance — markdown serving wouldn't expose them to *more* AI training (the disallow handles that), but would help legitimate readers using agents to fetch articles into reader apps.
- ⚠️ **No `Content-Signal` directive** (5 partial of 10) — the AI policy is implicit in the named-bot disallows. The Cloudflare-emerging convention (`Content-Signal: ai-train=no, ai-input=no, search=yes`) makes the same statement machine-readable in one line and futureproof against new bot names.

### 🚨 Anti-patterns flagged

- **[The Invisible Product](https://agentsfirst.dev/glossary/#invisible-product)** — applies, but with an asterisk. TC isn't invisible by accident; they've deliberately closed the door. The framework can describe the state without judging the choice.

### 🎯 Top moves to climb a level — *only if the editorial stance reverses*

This is the unusual scorecard where the highest-leverage move is **a business decision, not a technical one**.

1. **Decide whether to open the door at all.** If TC keeps the disallow stance, no rubric move materially helps; everything below assumes a reversal. The reversal pattern in publishing has been visible since 2024 — FT, AP, Axel Springer, Le Monde, NYT all signed AI licensing deals worth $5–250M+ per year. TC's position is increasingly the holdout one.

2. **If reversing: ship a *paid* MCP server.** Tools like `read_article(url)`, `search(query, since)`, `summarize(url)`. Gate per-call with $0.001–0.01 access pricing via x402 or similar. Tag content as `Content-Signal: ai-train=no, ai-input=yes-paid`. Agents that pay get the article body; agents that don't get a 402 with the price. Earns the full Agent Capabilities + Visibility dimensions (40 pts). Reference: [Interface First](https://agentsfirst.dev/principles/interface-first/).

3. **Add `/llms.txt` + `/AGENTS.md` even WITH the disallow stance.** The current robots.txt says "no" but doesn't say *why* or *how to engage commercially*. A two-paragraph `/AGENTS.md` saying "Agents may not crawl for training. For licensed access, contact licensing@techcrunch.com" earns 20 pts AND opens an actual revenue path. Reference: [Contract First](https://agentsfirst.dev/principles/contract-first/).

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- Live scorer: <https://agentsfirst.dev/mcp>
- Methodology: rubric v0.1.2 (open-source at [`tools/agentsfirst-mcp/src/score.ts`](https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts))
