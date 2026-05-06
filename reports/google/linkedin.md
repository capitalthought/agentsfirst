# LinkedIn post — Agent Readiness Report: Google

Single post, ~340 words. More polished than the X thread; opens with the score, closes with a polite tag of the relevant Google leaders.

---

**Agent Readiness Report: Google scored 25/100. Level 1 (Agent as Afterthought).**

Google introduced the `Google-Extended` user-agent in September 2023 — the AI-training opt-out convention every other publisher's robots.txt now references. We pointed our scorer at four of Google's most public surfaces this week to see how the company that wrote the convention scores against the rubric the convention helped popularize.

None of the four surfaces declare `Google-Extended`. None publish `/llms.txt`. None ship an MCP Server Card.

Across four surfaces:
- developers.google.com — 25/100, Level 1 (the high water mark)
- cloud.google.com — 15/100, Level 1
- google.com — 5/100, Level 0
- blog.google — 5/100, Level 0

The developer subdomain is the high water mark for one reason: the homepage hero references the CLI (`gcloud`, `gemini-cli`, `firebase`) — full marks in visibility-of-agent-integrations and partial credit in agent-capabilities. That's the entire affirmative signal across all four surfaces.

What's missing: bot-access-control is 0/15 across all four. No `Google-Extended`, no `GPTBot`, no `ClaudeBot`, no `Content-Signal`. Discoverability is 0/25 across all four. `developers.google.com/robots.txt` is three lines long. The Workspace MCP server is real and in production. The Vertex AI Agent Builder is real. Gemini exposes function-calling. None of that is discoverable from any of these four URLs. The scorer flagged the Invisible Product anti-pattern on google.com and blog.google; the Agents Without Rules anti-pattern on the other two.

Top three fixes:
1. Publish `Google-Extended` on every Google-owned domain. The fix is one robots.txt block; no engineering work. The company that wrote the convention should be the one using it.
2. Ship `/llms.txt` on `developers.google.com` and `cloud.google.com` — the largest first-party documentation corpus in their categories.
3. Publish an MCP Server Card from `cloud.google.com` and `developers.google.com` and reference it from each homepage hero. The capability is real. The signal isn't.

The lesson: inventing a convention does not exempt you from following it. A Level 3 product is Level 3 across every surface an agent might land on.

Full report, raw probe data, and rubric (v0.1.2): https://agentsfirst.dev/reports/google/

Second in a bi-weekly Agent Readiness Reports series — see also the [Cloudflare report](https://agentsfirst.dev/reports/cloudflare/). Polite tags to Sundar Pichai, Demis Hassabis, and Logan Kilpatrick. Replies and "we just shipped the fix" notes welcome.

#AgentsFirst #MCP #AIAgents #Google #Gemini
