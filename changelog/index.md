---
title: "Changelog | Agents First"
description: "Version history of the Agents First thesis — what changed and when."
image: /og-image.png
author: Joshua Baer
---

# Changelog

Agents First is versioned like a piece of software. Each release notes substantive additions and corrections — new principles, new anti-patterns, sharpened arguments, corrected claims. Subscribe via [the newsletter](/#newsletter), follow [@joshuabaer](https://x.com/joshuabaer) on X, or watch [the repo](https://github.com/capitalthought/agentsfirst) to hear about new versions.

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

- **Per-principle URL split** — a deep-dive page per implementation principle, with stable URLs and the room to go deeper than the canonical page allows. Coming with v0.6.
- **Long-tail glossary** — anchored definitions for terms like Code Mode, progressive discovery, prep gate, structured error, tool selection accuracy.
- **`npx create-agents-first` scaffold** — an npm package that generates a starter MCP server, an `AGENTS.md`, a prep-gate stub, and a typed-state schema in a single command. The smallest experiment, packaged.
- **First-party case study with metrics** — Time to First Agent Action, Tool Success Rate, Human Visibility Rate, captured from a production deployment rather than asserted.

---

*Part of [Agents First](/) — see [the canonical thesis](/) or [the eight principles](/principles/).*
