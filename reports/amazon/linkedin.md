# LinkedIn post — Agent Readiness Report: Amazon

Single post, ~340 words. More polished than the X thread; opens with the score, closes with a polite tag.

---

**Agent Readiness Report: Amazon scored 30/100. Level 2 (Agent-Aware).**

Amazon is the largest e-commerce property in the world and one of the most aggressively gated against agent traffic. We pointed our scorer at three Amazon surfaces — and the headline is the highest of the three. The variance is the actual story.

Across three surfaces:
- developer.amazon.com — 30/100, Level 2 (the high water mark)
- aws.amazon.com — 20/100, Level 1
- amazon.com — 10/100, Level 0 (No agent access)

What's working: developer.amazon.com publishes a real /llms.txt — 50KB, structured by platform (Vega OS, Fire TV, Alexa, Appstore), with explicit instructions to LLMs at the top about how to parse the file. Its robots.txt declares a custom `LLMs:` directive pointing to the llms.txt — a convention I haven't seen anywhere else. The homepage references MCP and uses the phrase "agents first." It's the only Amazon surface that promotes agent install paths in the human onboarding flow.

What's missing: aws.amazon.com — the platform that hosts most of the agent industry — scores 20/100. The homepage mentions Bedrock 11 times, Amazon Q five times, the AWS CLI throughout. Bedrock hosts Claude, Llama, Mistral. Amazon Q is an agent. None of it is discoverable from an agent's first three requests. No /llms.txt. No MCP card. No Content-Signal. No /AGENTS.md. The Invisible Product anti-pattern on the developer surface that probably hosts more agent traffic than any other site on the internet.

amazon.com scores 10/100. robots.txt names ~50 AI agents — GPTBot, ClaudeBot, ChatGPT-User, PerplexityBot, Gemini, Google-NotebookLM, GoogleAgent-Mariner, Devin, MistralAI, Copilot, on and on — and Disallows every one. Anti-scraping is policy, not oversight. The score reflects the policy.

Top three fixes:
1. Ship an MCP Server Card from aws.amazon.com and reference it from the hero. 30 points on AWS. Single highest-leverage fix in the report.
2. Lift /llms.txt from the developer portal to aws.amazon.com (same engineering org, same hosting infra) and ship /AGENTS.md on both surfaces.
3. Pick a posture on amazon.com and declare it explicitly — consolidate the 50-bot blocklist into a single Content-Signal directive, or open specific paths under named bot rules. The current pattern is a maintenance burden that scores zero credit.

The lesson for everyone else: if your company has more than one major web property, the variance across them is the bug. A Level 3 product is Level 3 across every surface an agent might land on. Score your three most-trafficked subdomains.

Full report, raw probe data, and rubric (v0.1.2): https://agentsfirst.dev/reports/amazon/

Bi-weekly Agent Readiness Reports — Cloudflare scored 40 two weeks ago, Amazon at 30 today. Polite tags to Andy Jassy and Werner Vogels. Replies and "we just shipped the fix" notes welcome.

#AgentsFirst #MCP #AIAgents #Amazon #AWS
