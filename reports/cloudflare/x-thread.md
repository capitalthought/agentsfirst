# X thread — Cloudflare report

7 tweets. Tweet 1 has no link (X throttles link-leading threads). Tag `@Cloudflare` and `@CloudflareDev` on tweet 1 only — verify both handles before posting. Tweet 7 carries the full report URL. All tweet bodies ≤280 chars. Char counts shown next to each header.

---

### Tweet 1 (264 chars) — hook + tags + headline

@Cloudflare just scored 85/100 on the Agent Readiness rubric they basically invented.

3rd Agent Readiness Report from agentsfirst.dev — and the variance is the story.

www.cloudflare.com: 85/100 (Level 3, Agents First)
developers.cloudflare.com: 35/100 (Level 2)

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

### Tweet 4 (260 chars) — the inverse-Notion observation

Most products in this report series are inverted: dev portal does the work, marketing root is bare.

Notion: docs 65, marketing 10.
Anthropic: docs 60, marketing 5.
Cloudflare: marketing 85, docs 35.

Same org-chart symptom. Cloudflare's marketing got the memo first.

---

### Tweet 5 (273 chars) — top 3 fixes

3 moves to climb to ~95+ across surfaces:

1. Copy /AGENTS.md + /agents.json + named-bot robots.txt to developers.cloudflare.com (~30 min, +50 pts on the surface that matters)
2. Homepage hero callout: "Install our MCP server" (+10 pts on www)
3. Make /AGENTS.md load-bearing

---

### Tweet 6 (262 chars) — the credibility line

The fact that Cloudflare scores 85/100 on a rubric implied by their own April post — instead of 100/100 — is the proof that the rubric is honest.

Self-grading the framework you wrote is a credibility move, not a vanity move.

Other companies should do this.

---

### Tweet 7 (78 chars) — link

Full report:

https://agentsfirst.dev/reports/cloudflare/

Methodology + per-surface breakdown + raw probe data inside.
