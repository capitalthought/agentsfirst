# Agents First

A design framework for products built for both humans and AI agents.

📖 **Read it:** [agentsfirst.dev](https://agentsfirst.dev)

💬 **Discuss + give feedback:** [GitHub Discussions](https://github.com/capitalthought/agentsfirst/discussions)

🐛 **Typos + errata:** [Issues](https://github.com/capitalthought/agentsfirst/issues)

---

## Repo layout

| Path | What's there |
|---|---|
| `index.md` | The published thesis (v0.7, May 2026) — rendered by GitHub Pages via Jekyll Cayman theme |
| `og-image.png` | 1200×630 OG / Twitter card |
| `_config.yml` | Jekyll config — site title, description, plugins, social links |
| `_includes/head-custom.html` | Extra `<head>` content the Cayman theme can't generate (JSON-LD, author meta) |
| `CNAME` | Custom domain pointer for GitHub Pages |
| `docs/marketing-plan.md` | Synthesized launch plan from 6 parallel persona-strategist agents |
| `docs/promotion-plan.md` | $2,500 promo budget allocation |
| `docs/thesis-source-snapshot.md` | Snapshot of the canonical thesis source (lives at `~/icloud/Documents/agents-first.md`) |
| `docs/plans/` | Design docs (multipov-reviewed) for the thesis-supporting machinery |
| `docs/checks/` | Dated weekly snapshots from `/agentsfirst-check` (manual) and prior `agentsfirst-radar` briefings |
| `reports/<vendor>/` | Per-vendor Agent Readiness Reports (Cloudflare, etc.) |
| `tools/agentsfirst-mcp/` | Public MCP server: scores any website/codebase against the rubric. Published as `@capitalthought/agentsfirst-mcp`. |
| `tools/create-agents-first/` | Public scaffold: `npx create-agents-first` |
| `tools/og-card/` | Idempotent OG-card generator |

The autonomous daily-cron radar (design at [`docs/plans/2026-05-15-agentsfirst-radar-design.md`](docs/plans/2026-05-15-agentsfirst-radar-design.md)) lives in a private companion repo at `capitalthought/agentsfirst-radar` — moved out of this repo on 2026-05-16 because GitHub Actions org self-hosted runners are blocked on public repos by default (the right security default; PR-from-fork code on a Mac runner is a fat attack surface). The split keeps the public-thesis posture intact while letting the radar use the joshhome runner it needs for chat.db + iMessage.

---

By [Josh Baer](https://www.josh.fm/) · License: CC BY 4.0
