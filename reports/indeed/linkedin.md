# LinkedIn post — Agent Readiness Report: Indeed

Single post, ~340 words. More polished than the X thread; opens with the score, closes with a polite tag of the most natural-fit recipients.

---

**Agent Readiness Report: Indeed scored 10/100. Level 0 (No Agent Access).**

Indeed is the textbook example everybody points at when they explain why AI agents matter for consumers. An autonomous agent searching for jobs on a user's behalf, applying, tracking responses — this is the canonical use case. The product fit is unimpeachable.

The public surface fails to enable any of it.

Across three surfaces:
- www.indeed.com — 10/100, Level 0
- developer.indeed.com — 0/100 (301-redirects to a 403'd partners landing page)
- employers.indeed.com — 5/100 (robots.txt is "Disallow: /" for everyone)

Here's the part worth understanding: Indeed actually wrote a 737-line /llms.txt for www.indeed.com. It documents the search query parameters (q, l, fromage, radius), enumerates every country subdomain, and points to the salary and help surfaces. Someone at Indeed sat down and wrote a thoughtful machine-readable overview of the product specifically for LLMs.

Hit the URL with the agentsfirst.dev scorer and you get HTTP 403. Cloudflare bot mitigation, returned in 7 KB of challenge HTML instead of the 737 lines of help that's actually behind the URL. Spoof a browser user-agent and the file appears; use any default agent stack and you're blocked. Indeed built the agent surface, then deployed a WAF that hides it from the agents it was built for. The Invisible Product anti-pattern, with a twist.

The developer portal at developer.indeed.com — once home to the Indeed Publisher API — 301-redirects to partners.indeed.com, which then 403s anything Cloudflare doesn't recognize as a browser. The Publisher API itself was deprecated in 2020. Five years on, the address still resolves; nothing useful lives there. That's Ship and Forget in pure form.

Top three fixes:
1. Stop 403'ing your own /llms.txt. Whitelist /robots.txt, /llms.txt, /AGENTS.md, /sitemap.xml from bot mitigation. Those paths exist for automated clients. Five-minute fix.
2. Publish an MCP Server Card with verb-first job-search tools (find_jobs, get_job, apply, track_application) and reference it from the homepage hero.
3. Decide what developer.indeed.com is for and ship it, or replace the redirect with a 410 Gone. Right now the URL is dressed up to look alive; it's effectively dead.

The lesson for everyone else: the most-relevant agent use case is rarely coming from the most agent-ready company. Consumer-scale search products are exactly where agent-driven workflows are about to take off — and the incumbents most likely to be disintermediated are the same ones whose anti-scraping posture is most aggressive. The defensive answer (block harder) loses. The offensive answer (publish a typed agent surface so the user's agent picks you over a screen-scraper) wins.

Full report, raw probe data, and rubric (v0.1.2): https://agentsfirst.dev/reports/indeed/

Bi-weekly Agent Readiness Reports series. Polite tags to the people most likely to care: Chris Hyams (Indeed CEO) and Hisayuki "Deko" Idekoba (CEO, Recruit Holdings, parent of Indeed). Replies and "we just shipped the fix" notes welcome.

#AgentsFirst #MCP #AIAgents #Indeed #JobSearch
