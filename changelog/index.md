---
title: "Changelog"
description: "Version history of the Agents First thesis — what changed and when."
image: /og-image.png
author: Joshua Baer
---

# Changelog

Agents First is versioned like a piece of software. Each release notes substantive additions and corrections — new principles, new anti-patterns, sharpened arguments, corrected claims. Follow [@joshuabaer](https://x.com/joshuabaer) on X or watch [the repo](https://github.com/capitalthought/agentsfirst) to hear about new versions.

---

## v0.7 — May 2026

The introspection pass.

### Added

- **Principle 9 — [Inspectable State](/principles/inspectable-state/).** Every agent server should expose its own operational state — queue depth, throughput, recent activity, trends, health — via a typed agent tool, not just a human dashboard. The complement to Visible Outputs (which surfaces *results* to humans where they already are): Inspectable State surfaces *system state* to agents where they already are. Where Prep Gates answers "is the system READY to do work?", Inspectable State answers "what is the STATE of the work?". Pattern: ship one `overview` tool alongside the action verbs — same MCP server, no input schema, returns counts plus tail plus health. Driven by real production experience: every operator agent that lacked one ended up reaching for raw SQL or scraping logs to answer routine introspection questions, both anti-patterns.
- **Anti-pattern — [The Black Box Server](/glossary/#black-box-server).** The inverse of Inspectable State. Agent server with no introspection tool; the only way to ask "what's the state of the work?" is to break the abstraction.
- **Per-principle deep dive at `/principles/inspectable-state/`** — lead, why it matters, how to apply it (7 specific patterns), what it prevents, smallest experiment, related principles. Same template as the other eight.
- **JSON catalogs bumped to v0.7** — `/api/principles.json` now contains 9 entries; `/api/glossary.json` adds the `black-box-server` anti-pattern and the `inspectable-state` principle definition.

### Status

Still pre-1.0. The framework continues to settle. Prior counts (8 principles, 7 anti-patterns) updated everywhere they appeared in the canonical surfaces; downstream consumers (portfolio scoring tool, score reports, scaffold) will be updated separately and may briefly trail.

---

## v0.6 — May 2026

Voice pass + the long tail.

### Added

- **Per-principle deep dives** at `/principles/` — eight ~1,000-word pages, one per principle. Lead, what it means, why it matters, how to apply it, what it prevents, the smallest experiment, related principles. Each page stands alone for a reader landing cold from search.
- **Glossary** at `/glossary/` — 32 anchored definitions covering anti-patterns, principles, and the supporting vocabulary (MCP, Code Mode, AGENTS.md, Two Customers, Adoption Levels, Tool Success Rate, Time to First Agent Action, Progressive Discovery, Scoped Tokens, OAuth 2.0 with PKCE, Smallest Experiment).
- **Changelog page** — this one.
- **Follow / watch / changelog footer** — replaces the prior "subscribe" call-to-action on the canonical page. Distribution runs through X and the GitHub repo, not a separate newsletter list.
- **`@capitalthought/create-agents-first` scaffold** — `npx`-runnable scaffold that ships an MCP server, an `AGENTS.md`, a `<project>_prep` tool, Zod-typed state, and retry-with-backoff recovery helpers in one command. Read it in five minutes, ship in another five.

### Renamed

- The framework is now **Agents First** (was "Agent First"). The URL `agentsfirst.dev` was always plural; the brand and the URL now match. References across the canonical page, the new sub-pages, and the npm package were updated in one drop.

### Voice

- The canonical page was rewritten in a tighter, more declarative voice. Cuts hedges, fragments where they earn it, sentence-case section headers throughout.

### Status

Still pre-1.0. The framework is settling. Strategic claims still want for production data; the implementation principles are grounded in real systems already.

---

## v0.5 — April 2026

The first public release.

### Added

- **Eight implementation principles** — Interface First, Contract First, Prep Gates, Typed State, Visible Outputs, Multi-Model Verification, Perspective Dispatch, Autonomous Recovery. Each principle has a stable anchor for direct linking.
- **Seven anti-patterns** — The Lazy Wrapper, The Invisible Product, Agents Without Rules, Single-Model Trust, The Slow Chatbot, Ship and Forget, The God Server. Named first, on purpose — knowing what's broken is more useful than knowing what's ideal.
- **Levels of Adoption (0–4)** — a maturity ladder from "no agent access" through "agent-driven platform." Most companies are at 0 or 1; the opportunity is at 3.
- **Comparison table** vs TDD, API First, and Mobile First — primary artifact, design sequence, maturity, evidence base.
- **Security section** — auth patterns that work today (scoped tokens, OAuth 2.0 with PKCE, short-lived tokens, per-user audit logging) and the threat model (supply-chain risk, prompt injection via tool descriptions, overprivileged agents).
- **What we don't know yet** — an honest-uncertainty section covering the real adoption curve, MCP's durability as a protocol, monetization shifts, the eventual commoditization of agent tools, and agents-first customer support.
- **OG / Twitter card metadata and per-principle anchor IDs** — every principle gets a stable URL fragment so links survive a future per-principle URL split.
- **Inline comments** — Giscus, backed by GitHub Discussions Announcements.
- **Byline and author bio** — clearer attribution, contact links.

### Site infrastructure

agentsfirst.dev launched on Cloudflare DNS plus GitHub Pages with a proxied Universal SSL certificate. SEO meta consolidated under the `jekyll-seo-tag` plugin so canonical, OG, and Twitter card tags emit from a single source per page rather than competing copies in `head-custom.html`.

### Status

Framework is v0.5 — strategic claims have early-adopter evidence but are still pre-1.0. Implementation principles are grounded in production systems; the distribution thesis needs more data before it's settled. Open for comment via the embedded thread on the canonical page.

---

## Earlier versions

v0.1 through v0.4 were internal Capital Factory drafts circulated for early-adopter feedback in early 2026. They are not separately documented — the public release starts at v0.5.

---

## What's next

The directional roadmap, subject to change based on feedback:

- **First-party case study with metrics** — Time to First Agent Action, Tool Success Rate, Human Visibility Rate, captured from a production deployment rather than asserted. The next thing this thesis needs to stop being early-stage.
- **Anti-Pattern of the Month** — a recurring deep-dive on one anti-pattern, with a real (anonymized) product committing it and a forensic walkthrough of what it cost.
- **Reference implementations** — beyond the scaffold, fully-worked examples of Levels 2, 3, and 4 in production codebases.
- **v1.0** — once the strategic claims have enough production data behind them to drop the "early / emerging" line from the comparison table.

---

*Part of [Agents First](/) — see [the canonical thesis](/) or [the nine principles](/principles/).*
