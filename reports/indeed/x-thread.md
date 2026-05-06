# X thread — Agent Readiness Report: Indeed

7 tweets. Tweet 1 leads with score + dominant theme + tag. NO link in tweet 1 (X throttles link-leading threads). Link lands in tweet 7. Tag `@indeed` on tweet 1.

---

**Tweet 1** (270 chars)

> The most-relevant target for autonomous AI job-search agents on the planet:
>
> @indeed
>
> Score: 10/100. Level 0.
>
> Indeed wrote a real /llms.txt for AI agents to read.
>
> Then deployed bot mitigation that returns 403 to anyone who tries to fetch it.
>
> The agent surface is invisible.

---

**Tweet 2** (267 chars)

> Indeed's /llms.txt is 737 lines.
>
> It documents the search query params (q, l, fromage, radius). Lists every country subdomain. Points at salary data and help.
>
> Someone wrote it carefully, in good faith, for LLMs.
>
> Hit the URL with a default user-agent: HTTP 403.

---

**Tweet 3** (273 chars)

> Spoof a browser UA and the file appears.
>
> Use any default agent stack — curl, Python requests, the agentsfirst MCP scorer — and Cloudflare returns 7KB of challenge HTML.
>
> Indeed built the agent surface, then deployed a WAF that hides it from the agents it was built for.

---

**Tweet 4** (260 chars)

> developer.indeed.com — once home to the Indeed Publisher API — 301-redirects to partners.indeed.com, which 403s any non-browser fetch.
>
> Publisher API was deprecated in 2020. Five years later, the URL still resolves. Nothing useful lives there.
>
> Score: 0/100.

---

**Tweet 5** (254 chars)

> employers.indeed.com/robots.txt is 25 bytes:
>
>   User-agent: *
>   Disallow: /
>
> The entire B2B surface — where employers post jobs and run hiring — declines crawling outright.
>
> No /llms.txt. No /AGENTS.md. No nuance.
>
> Score: 5/100.

---

**Tweet 6** (272 chars)

> Five-minute fix #1: stop 403'ing your own /llms.txt. Whitelist /robots.txt, /llms.txt, /AGENTS.md, /sitemap.xml from bot mitigation. Those paths exist FOR automated clients.
>
> Bigger fix: ship an MCP server. find_jobs(). apply(). track_application().
>
> Own the lane.

---

**Tweet 7** (220 chars)

> Bi-weekly Agent Readiness Reports. Scoring named products against the Agents First framework.
>
> Full report — rubric, raw probe data, the 403 chain on the developer portal, top fixes:
>
> https://agentsfirst.dev/reports/indeed/

---

**Tweet count**: 7. All tweets under 280 chars.

**Tags**: `@indeed` on tweet 1; report URL only on tweet 7 (X throttles link-leading threads ~40%).

**Note**: tweet body is the text shown to the reader between `>` lines, including blank lines as `\n` chars. The `>` markdown markers and "Tweet N" labels are NOT part of the tweet.
