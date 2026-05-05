# agentsfirst

Joshua Baer's "Agent First" thesis — a design framework for products built for both humans and AI agents. Live at https://agentsfirst.dev. Repo deployed via GitHub Pages on `main`, custom domain via Cloudflare (joshshop zone, proxied, Universal SSL).

The canonical source for the thesis lives at `~/icloud/Documents/agent-first.md` (v0.5, April 2026). `index.md` here is the published Jekyll-rendered copy.

## Architecture

Static site, rendered by GitHub Pages with Jekyll Cayman theme. No build step locally — push to `main` and Pages publishes within ~1 minute. The single page (`index.md`) carries the full thesis; SEO machinery layered on via `_includes/head-custom.html` (JSON-LD `TechArticle`, per-principle anchors, OG/Twitter card meta — emitted via the `jekyll-seo-tag` plugin so we have one canonical source per tag). Comments handled by Giscus widget backed by GitHub Discussions Announcements category.

## Source Structure

```
index.md                      # The thesis (v0.5) — Jekyll-rendered, has page front matter
og-image.png                  # 1200×630 OG / Twitter card
_config.yml                   # Jekyll config — title, description, plugins, social
_includes/head-custom.html    # Extra <head> content (JSON-LD, author meta, Giscus)
CNAME                         # Custom domain pointer for GitHub Pages
docs/                         # Strategy + ops docs (not published — `docs:` is excluded)
  marketing-plan.md           # Launch plan synthesized from 6 persona-strategist agents
  promotion-plan.md           # $2,500 promo budget allocation
  thesis-source-snapshot.md   # Snapshot of canonical thesis source
todo.md                       # Active work items (open / in-progress / blocked)
todolist-archive.md           # Completed items archived by month
bugs/                         # Cross-repo bug reports filed AT this repo
  incoming/                   # New reports awaiting triage (use /bugsweep)
  triaged/                    # Triaged + resolved
README.md                     # Public-facing repo readme
```

## Commands

```bash
# Local Jekyll preview (rare — most edits ship straight to main)
bundle exec jekyll serve

# Deploy: just push. GitHub Pages handles the rest.
git push

# Verify rendered output after deploy
curl -sI https://agentsfirst.dev/ | head -20
curl -s https://agentsfirst.dev/ | grep -E "<meta property=\"og:|<title>"
```

## Deployment

- **Hosting:** GitHub Pages from `main` branch, root.
- **Custom domain:** `agentsfirst.dev` — DNS in Cloudflare (joshshop account), CNAME → `capitalthought.github.io`, proxied, Universal SSL on.
- **Theme:** `jekyll-theme-cayman` with `_includes/head-custom.html` overriding the default head.
- **SEO:** consolidated under the `jekyll-seo-tag` plugin. Each page that needs an OG card has front matter at the top — never duplicate canonical/og/twitter tags by hand in `head-custom.html` or you'll get conflicting tags in production.
- **Comments:** Giscus on GitHub Discussions, `Announcements` category.

## What's next

Per `docs/marketing-plan.md`: pre-brief 5 amplifiers (swyx, Simon Willison, Patrick McKenzie, David Cramer, Maggie Appleton), submit AI Engineer World's Fair CFP, ship per-principle URL split before the SEO moat closes (~14-day window).
