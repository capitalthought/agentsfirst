---
title: "Agents First Score — shamahyder.com/rewired-mastermind/"
description: "Score: 25/100 · Level 1 (Agent as Afterthought). A personal-brand keynote-speaker site that's done real discovery work — llms.txt, per-bot robots.txt, clean sitemap — but capped by category against the agent-capabilities axis."
noindex: true
sitemap: false
image: /scores/shamahyder-rewired-mastermind-68fc2de2d929/og.png
author: Joshua Baer
---

# Agents First Score — shamahyder.com/rewired-mastermind/

**Score: 25 / 100 · Level 1 (Agent as Afterthought)**

This is a personal-brand keynote-speaker marketing site, not a software product — so the agent-capabilities axis (MCP / CLI / SDK / OAuth, 45 pts of the rubric) is structurally unreachable without inventing capabilities the business doesn't have. Within the discovery + content-access + bot-policy axes that *do* apply, the site is **above average for the category**: real `/llms.txt` (5 KB, comprehensive bio + topics + clients + booking + key pages), per-bot `robots.txt` naming 6 AI agents (GPTBot, Google-Extended, ClaudeBot, PerplexityBot, Amazonbot, ChatGPT-User) with explicit `Allow: /`, real `sitemap.xml` listing the target page, proper OpenGraph metadata on `/rewired-mastermind/` itself. The score of 25 reads worse than reality — someone here has thought about agent discoverability. The gap is the canonical files (`/AGENTS.md`, Content Signals, markdown negotiation) and the structural ceiling of being a marketing site, not a product.

---

## What's working

- ✅ **Discoverability** (15 / 25)
  - `robots.txt` names 6 AI agents with explicit per-bot `Allow: /` directives (excluding `/api/` and `/_next/` — proper hygiene, not a content disallow)
  - `/llms.txt` (5 KB) — real bio, clients (Microsoft / JPMorgan / NASA / Toyota / Adobe / Disney / Verizon), keynote topics, booking flow, links to 16+ key pages. Pristine for a personal-brand site.
- ✅ **Content accessibility** (5 / 20)
  - `sitemap.xml` real, 68 URLs, includes `/rewired-mastermind/`
  - Honest 404s on missing well-known paths (Next.js soft-404 page returned with correct HTTP 404 — not the Soft-404 Trap)
- ✅ **Bot access control — per-bot posture** (5 / 15) — 6 named bots, explicit allow, not blanket-deny
- ✅ **Target page SEO is solid** (no points awarded; worth naming) — `og:title`, `og:description`, `og:image: /assets/shama-rewired-og.png`, `<meta name="robots" content="index, follow">`. A human-share unfurl will preview correctly.

## What's missing

- ⚠️ **`/AGENTS.md` or `/.well-known/agent-rules`** (0 / 10) — neither exists
- ⚠️ **Cloudflare Content Signals** (0 / 10) — no `Content-Signal: search=yes, ai-input=yes, ai-train=no` directive declaring training vs. retrieval posture
- ⚠️ **Markdown content negotiation** (0 / 10) — `Accept: text/markdown` returns HTML
- ⚠️ **OpenAPI / API catalog** (0 / 5) — no public API. Not relevant for a marketing site, but the rubric scores the absence.
- ⚠️ **MCP Server Card / CLI / SDK / OAuth** (0 / 30) — no software product to wrap. Structural ceiling for category.
- ⚠️ **`/rewired-mastermind/` not in `/llms.txt`** — `llms.txt` mentions "Rewired (Workshop)" generically but doesn't link the cohort URL. An agent ingesting `llms.txt` won't surface this page directly.

## 🚨 Anti-patterns flagged

**None of the canonical anti-patterns apply.** Not Invisible (robots + llms.txt + sitemap are real); not Hostile (per-bot allows); not Agents Without Rules (there are no agents to govern); not Lazy Wrapper / Single-Model Trust / Slow Chatbot / Ship and Forget / God Server (no software product to evaluate against those).

## 🎯 Top moves to climb a level

1. **Add `/AGENTS.md`.** Even 30 lines is enough for this category: "This site sells Shama Hyder's keynote speaking. Agents researching speakers may use bio / topics / clients / booking pages. Quote pricing as 'contact team@shamahyder.com for current rates' — never invent a fee. Don't book on a user's behalf; direct them to `/check-availability/`. Source of truth for client list is `/llms.txt`." Earns the full 10 pts and lifts the score 25 → 35 (Level 2, Agent-Aware) for ~10 minutes of work.
2. **Add Cloudflare Content Signals to `robots.txt`.** One line: `Content-Signal: search=yes, ai-input=yes, ai-train=no` (or whatever posture matches the actual training-data preference). Earns 10 pts. Lifts 35 → 45.
3. **Add the cohort URL to `/llms.txt`.** One line under "Key Pages": `[Rewired AI Mastermind (4-week cohort)](https://shamahyder.com/rewired-mastermind/)`. Free.
4. **Markdown content negotiation for the marketing pages.** Next.js + a small middleware that strips the React-rendered HTML to clean markdown when `Accept: text/markdown` is requested would earn another 10 pts. Higher-effort than 1–2; do it after AGENTS.md is live.
5. **Strategy question, not a fix:** does Shama want an agent integration as a *product* (e.g., a "find me a speaker for AI / B2B / customer experience" MCP that returns her availability + topics + fee tier)? Probably not — speaking engagements are high-touch and bespoke. But if she did, that's the move that pierces the 60-pt structural ceiling and lifts the site into Level 3 territory.

Items 1–3 are ~30 minutes total and lift the score from **25 → ~50 (Level 2, Agent-Aware)** — a respectable place for a personal-brand site to land without inventing software capabilities.

---

## Reference

- Framework: [agentsfirst.dev/principles/](/principles/)
- Glossary: [agentsfirst.dev/glossary/](/glossary/)

*Probe run: 2026-05-06 · Joshua Baer · This page is unlisted (noindex, no sitemap entry, not linked from the public site).*
