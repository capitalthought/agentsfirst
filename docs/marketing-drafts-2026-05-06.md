---
title: "Marketing drafts — week of 2026-05-06"
description: "Action drafts spawned by /agentsfirst-check 2026-05-06. CF ARS comparison post, Fivetran reaction, amplifier outreach. None are sent — Josh sends or kills."
noindex: true
sitemap: false
author: Joshua Baer
---

# Marketing drafts — week of 2026-05-06

Spawned by `/agentsfirst-check` 2026-05-06. Each draft below is **ready to send / publish but waiting on Josh**. None are auto-shipped.

Order = leverage / time-sensitivity. Top items are stale within 48h.

---

## 1. [a8cfe8a9] Blog post — "Cloudflare's Agent Readiness Score and Agents First — what each measures, why both matter"

**Where to publish:** agentsfirst.dev/posts/cf-ars-agents-first/ (new directory) OR cross-post on LinkedIn + Substack mirror.
**Time pressure:** Cloudflare ARS launched April 2026, sitebulb shipped a 5-level audit on 2026-05-06. The "agent readiness" term-of-art is being defined right now. Publish within 48h.

> # Cloudflare's Agent Readiness Score and Agents First — what each measures, why both matter
>
> Cloudflare published its [Agent Readiness Score](https://blog.cloudflare.com/agent-readiness/) in April 2026. The data is damning — 4% of sites declare AI usage preferences, fewer than 15 sites publish MCP Server Cards. Sitebulb shipped a free audit. Fivetran launched a parallel "[Agentic AI Readiness Index](https://www.morningstar.com/news/business-wire/20260505250301/)" focused on enterprise data foundations. Three labels arrived inside 30 days.
>
> Three different things to measure. Three useful answers. Confusion if you treat them as competing.
>
> Here's the cleanest way to think about it.
>
> ## The three readiness scores measure three different surfaces
>
> | Score | What it measures | What it's blind to |
> |---|---|---|
> | **Cloudflare ARS** | What an external crawler can verify on your public web surface — robots.txt, llms.txt, AGENTS.md, MCP Server Card, OAuth discovery, content negotiation | Whether your underlying tools are well-designed. Whether you ship a contract. Whether agents can actually *use* your product after they discover it |
> | **Fivetran AAIRI** | Whether your enterprise data foundation can support agents acting against it — pipelines, governance, lineage, real-time sync | Whether your product surface is reachable by agents at all |
> | **Agents First** (the framework I [published](https://agentsfirst.dev) and run a free [scorer](https://agentsfirst.dev/mcp) for) | The eight implementation principles that determine whether your product *thinks correctly* about agents as customers | Whether the right discovery breadcrumbs are surfaced — that's CF ARS's job |
>
> Cloudflare ARS is **outside-in**: signals an external crawler can pick up. Fivetran AAIRI is **infrastructure-deep**: enterprise data plumbing. Agents First is **inside-out**: design mindset.
>
> ## They overlap, sometimes uncomfortably
>
> Both Cloudflare ARS and Agents First use a Level 0–4 ladder. Same numbering, similar names. That's not a coincidence — both frameworks are looking at the same underlying ecosystem maturity curve, just from different vantage points.
>
> If your product scores Level 4 on Cloudflare ARS — every well-known URL published, every crawler signal explicit, every MCP Server Card discoverable — congratulations. An agent crawling your marketing root will know you exist and how to reach you.
>
> But Cloudflare ARS can't tell you whether your tools have verb-first names. It can't tell you whether your `delete_record` requires a confirmation dance. It can't tell you whether your error messages help an agent recover or just say "400 Bad Request." Those are Agents First questions.
>
> Conversely: a product can be deeply Agents First in mindset (great tools, typed contracts, prep gates, visible outputs) and still underinvest in the marketing-root signals Cloudflare measures. We've scored a [bunch of those](https://agentsfirst.dev/reports/) — Linear at 60/100 with a working MCP server, Anthropic at 60/100 despite *being the company that wrote MCP*, Cloudflare itself at 40/100 despite having *literally invented* the score. Cloudflare's blog hosting the original ARS post lands at 15/100. The frameworks measure different things.
>
> ## What to do with both
>
> Run Cloudflare's audit. It's free. Fix the gaps it finds — they're cheap.
>
> Score yourself against Agents First. The [hosted scorer](https://agentsfirst.dev/mcp) is also free — `npx @capitalthought/agentsfirst-mcp` for the local version. Look at the eight principles. Identify the ones that don't apply to a website probe (Multi-Model Verification, Perspective Dispatch, Autonomous Recovery — these live in the codebase, not the URL).
>
> If you're an enterprise platform, also run Fivetran's index. The data side matters too.
>
> Three lenses, three useful answers. None of them obsolete the others. The companies that score well on all three by 2027 are the ones agents will route to by default.
>
> ---
>
> *Joshua Baer is the founder of [Capital Factory](https://capitalfactory.com) and the author of the [Agents First](https://agentsfirst.dev) framework.*

**Status:** READY. Send to Josh's review, then publish to agentsfirst.dev/posts/.

---

## 2. [2bf988c8] X reply / quote-tweet — Fivetran AAIRI launch

**Target tweet:** Whichever post Fivetran (or major industry coverage) used to launch the index on 2026-05-05.
**Time pressure:** News cycle alive ~48–72h.

**Draft (220 chars, fits X cap):**

> Fivetran's index measures the data-foundation side of agent readiness — pipelines, lineage, governance.
>
> Cloudflare's ARS measures the discoverable-surface side — robots, llms.txt, MCP cards.
>
> Agents First measures the product-mindset side. Three lenses, all useful → agentsfirst.dev

**Status:** READY. Quote-tweet or comment under Fivetran's announcement post.

---

## 3. [b5c1498f] DM to Maggie Appleton (@Mappletons)

**Channel:** X DM. Fallback: email if her DMs are closed.
**Why now:** Two posts in the window directly affirming the human-context-first thesis. Lowest-cost amplifier engagement.

**Draft:**

> Hey Maggie — saw your tweets on aligning humans rather than agents (and the "isolated branch for non-code context" thread). Both really resonated with how I think about Agents First — the framework I've been writing up at [agentsfirst.dev](https://agentsfirst.dev). The "align humans, agents follow" framing is almost exactly Principle 2 (Contract First) in the framework's language.
>
> Would love your read if you have 5 min. I'm not asking for amplification — I want pushback from someone whose conceptual essays I read carefully. The framework is at v0.7 and there's a doc-edit coming up where I'd love to cite the human-alignment framing if you're open.
>
> — Josh

**Status:** READY. Send via X DM to @Mappletons.

---

## 4. [7467d63a] Reply to Simon Willison's "RSS for vibe-coded apps" post

**Target:** [https://simonwillison.net/2026/Apr/30/rss-vibe-coded-apps/](https://simonwillison.net/2026/Apr/30/rss-vibe-coded-apps/) — comment on the post OR quote-tweet on X.
**Why now:** Conceptually adjacent. Simon is the highest-credibility amplifier in our list.

**Draft (X, ≤280 chars):**

> @simonw — RSS for vibe-coded apps is exactly Principle 1 (Interface First) of Agents First applied to agent-built artifacts: publish for the agent reader before the human one.
>
> A machine-readable index of "what was built and what tools it exposes" is the AGENTS.md for an output catalog.
>
> agentsfirst.dev for context

**Status:** READY. Reply on X (cleaner than blog comments).

---

## 5. [471ce71a] Quote-tweet @michaelpisaac's "moat is harness investment" thread

**Target:** [https://x.com/michaelpisaac/status/2052190536971219252](https://x.com/michaelpisaac/status/2052190536971219252) (2026-05-07, "99.94% cache hit at turn 200... a year of CLAUDE.md, AGENTS.md, skills, hooks, subagents")
**Why now:** He's literally describing Principles 2 (Contract First) + 4 (Typed State) in production. Engaging surfaces our framework to his audience.

**Draft:**

> This is exactly Principle 2 (Contract First) and Principle 4 (Typed State) of Agents First in production after a year of compounding.
>
> The harness IS the moat. AGENTS.md + skills + typed state contracts that the agent can re-load every session = the dev-tooling equivalent of a 99.94% cache hit.
>
> agentsfirst.dev

**Status:** READY. Quote-tweet from @joshuabaer.

---

## 6. [3e485285] Guest-post pitch — sitebulb OR Digital Content Next

**Channel:** Cold email or X DM to whoever runs editorial at sitebulb (likely Patrick Hathaway) or DCN (Jason Kint).
**Why now:** Both communities are actively asking "what does my site need to do for agents?" — the exact question Agents First answers from a product-mindset angle.

**Draft (email):**

> **Subject:** Guest post on agent readiness from a product-design angle?
>
> Hey [Patrick/Jason],
>
> Saw your team's launch of [the agent readiness audit / the publisher agent-readiness definition] this week. Great timing — the conversation is moving fast.
>
> I'm Josh Baer, founder of Capital Factory. I just published a framework called [Agents First](https://agentsfirst.dev) that comes at agent readiness from a different angle than Cloudflare's ARS: not the discoverable signals on your site, but the product-design mindset behind them. We run a free open-source scorer that's already audited 22 named products including Cloudflare itself.
>
> I'd love to write a 800-1,200 word guest post for [your audience] specifically: "Agent Readiness for Publishers — Beyond the Technical Checklist" or similar. Framework-level, but with publisher-specific examples (we've scored WSJ + TechCrunch already; instructive contrast with Vercel + Linear).
>
> Happy to draft a synopsis if you're interested. Either way — keep doing what you're doing on the agent-readiness front. The publisher angle has been under-covered.
>
> — Josh
>
> P.S. The framework lives at [agentsfirst.dev](https://agentsfirst.dev), the scorer at [agentsfirst.dev/mcp](https://agentsfirst.dev/mcp).

**Status:** READY. Send when Josh has bandwidth (lower urgency than the CF ARS post).

---

## 7. [96c8bb4c] AWS report — DEFERRED

AWS shipped an MCP server GA on 2026-05-06. They're now eligible for a Level 2+ public report on /reports/aws/. **Half-day of work — defer to a dedicated session.** Steps when ready:

1. `/agentsfirst aws.amazon.com`
2. Possibly `/agentsfirst docs.aws.amazon.com` for the developer surface
3. Write the public report with x-thread + linkedin + courtesy-dm
4. Add to `tools/scoreboard-updater/update.mjs` so the cron picks it up
5. Add to `/reports/index.md` scoreboard

---

## Send checklist (when Josh is ready)

- [ ] **#1** — Publish CF ARS comparison post to agentsfirst.dev/posts/ (most urgent)
- [ ] **#2** — Quote-tweet Fivetran's launch
- [ ] **#3** — Send Maggie Appleton DM
- [ ] **#4** — Reply to Simon Willison's RSS-for-apps post
- [ ] **#5** — Quote-tweet @michaelpisaac
- [ ] **#6** — Email sitebulb / DCN editorial
- [ ] **#7** — Run AWS audit + ship public report (separate session)
