# X thread — Cloudflare report

7 tweets. Tweet 1 has no link (X throttles link-leading threads). Tag `@Cloudflare` and `@CloudflareDev` on tweet 1 only — verify both handles before posting. Tweet 7 carries the full report URL. All tweet bodies ≤280 chars. Char counts shown next to each header.

---

### Tweet 1 (267 chars) — hook + tags + headline

@Cloudflare just scored 85/100 on the Agent Readiness rubric they basically invented.

3rd Agent Readiness Report from agentsfirst.dev — and the variance is the story.

www.cloudflare.com: 85/100 (Level 3, Agents First)
developers.cloudflare.com: 35/100 (Level 2)
blog: 0/100

🧵

---

### Tweet 2 (272 chars) — what the marketing root ships

What @Cloudflare shipped on www.cloudflare.com:

✅ /AGENTS.md (canonical contract artifact)
✅ /agents.json (A2A registry)
✅ /llms.txt (30 products mapped)
✅ robots.txt naming 7 AI bots — opt-in Allow: /
✅ Content-Signal: ai-train=yes
✅ Markdown content negotiation
✅ OpenAPI

---

### Tweet 3 (271 chars) — what the dev portal didn't ship

developers.cloudflare.com — where agents actually go to learn how to ship a Worker — is at 35/100.

No /AGENTS.md.
No /agents.json.
No named-bot robots.txt.

The exact same playbook, one subdomain over, hasn't landed yet. 50-point gap between two CF-owned surfaces.

---

### Tweet 4 (278 chars) — the blog blind spot

And blog.cloudflare.com — the surface that publishes Cloudflare's agent-era thought leadership — scored 0/100.

No agent contract. No machine-readable feed surfaced. No bot policy. Level 0.

The company writing the rubric has a surface that fails it entirely. Worth fixing.

---

### Tweet 5 (267 chars) — the inverse-Notion observation

Most products in this series are inverted: dev portal does the work, marketing root is bare.

Notion: docs 65, marketing 10.
Anthropic: docs 60, marketing 5.
Cloudflare: marketing 85, docs 35, blog 0.

Same org-chart symptom. Cloudflare's marketing got the memo first.

---

### Tweet 6 (276 chars) — top 3 fixes

3 moves to climb across surfaces:

1. Copy /AGENTS.md + /agents.json + named-bot robots.txt to developers.cloudflare.com (~30 min, +50 pts where it matters)
2. Same playbook on blog.cloudflare.com (0 → 60+)
3. Homepage callout: "Install our MCP server" (+10 on www)

---

### Tweet 7 (272 chars) — the credibility line

The fact that Cloudflare scores 85/35/0 on a rubric implied by their own April post — instead of a clean sweep — is the proof that the rubric is honest.

Self-grading the framework you wrote is a credibility move, not a vanity move.

Other companies should do this.

---

### Tweet 8 (78 chars) — link

Full report:

https://agentsfirst.dev/reports/cloudflare/

Methodology + per-surface breakdown + raw probe data inside.