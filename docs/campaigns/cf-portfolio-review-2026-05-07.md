---
title: "Campaign: CF Portfolio Agent Readiness Review"
description: "Score every Capital Factory portfolio company against the Agents First framework, send each founder a personalized email with their private report + ask for a GitHub star."
noindex: true
sitemap: false
author: Joshua Baer
---

# Campaign: CF Portfolio Agent Readiness Review

**Drafted 2026-05-07 · Status: design / pre-pilot · Owner: Josh**

## TL;DR

Score every active CF portfolio company's website against the Agents First rubric, write each founder a personalized email summarizing their score + top 1-2 fixes, link them to a private score page (one per company, hidden URL), and ask them to (a) update the site and (b) star agentsfirst on GitHub. Send through Personalize.run from `josh@quityourjob.com` (or whichever Personalize.run sender is configured for this campaign), drip-rate at 25/day starting with a 25-company pilot.

The campaign turns the framework's biggest weakness (it's abstract) into its biggest strength (you have a personalized score and a 30-min fix list). Founders who act on it get +20-40 score points over a weekend; founders who don't get reminded that their product is invisible to the agents their customers are starting to use.

## Why now

1. **The infrastructure exists.** Live scorer at agentsfirst.dev/mcp (rubric v0.2.0). Per-page OG card generator. /scorecard skill. The /scores/ private-page convention. Personalize.run as the send layer.
2. **The asymmetry is huge.** Most CF companies are early-stage SaaS / dev tools / B2B. Most will score Level 0 or Level 1. The fix list is often a 30-min job. The upside (being in the agent tool list, lifting their L0 → L2) is meaningful for them — not a vanity score.
3. **The brand moment is now.** Vercel just hit Level 4. CF founders see Vercel as aspirational. Framing this as "your portfolio's Vercel benchmark" sells the campaign without arrogance.
4. **The GitHub-star ask is the right size.** Not a podcast pitch, not an investment ask. "Star the repo that helped you fix your site." Most founders will, and each star compounds the framework's distribution.

## Open decisions (Josh to call)

| Decision | Options | Recommendation |
|---|---|---|
| **Universe** | All CF investments since 2010 (~500) / Active companies only (~200) / 2024-2026 cohort (~80) | **Active 200**, drip at 25/day = ~8 weeks. Pilot first. |
| **Sender** | `josh@capitalfactory.com` / `josh@quityourjob.com` / `josh@joshuabaer.com` | **Quityourjob** — it's the founder-facing brand, matches the X bio, less "official" than CF email. |
| **Public vs private reports** | Public /reports/ for each / Private /scores/ for each | **Private** — public would feel like punching down per `/reports/index.md` self-rules. Private gives founders a personalized link they can choose to share. |
| **Approval flow** | Send all unattended / Each batch reviewed / Each email reviewed | **Each batch reviewed (25/day)** — Personalize.run drafts, Josh greenlights once at start of day, drips out. |
| **The ask** | Star + share / Star only / Star + share + bring back to CF for a fix sprint | **Star + soft share** — primary ask is GitHub star; soft ask is "share the framework with your team." |
| **Offer** | None / Free fix-it call / CF-hosted fix-it sprint | **Free fix-it call** for any company that wants 1:1 help — caps at 5/week so it's scarce. |
| **Pilot size** | 10 / 25 / 50 | **25** — enough to see deliverability + reply patterns, small enough to course-correct. |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. PORTFOLIO LIST                                                   │
│    Source: Asana "CF Portfolio" project / HubSpot CF deals /        │
│            Relationship Radar `cf:portfolio` tag                    │
│    Output: portfolio.json — { name, slug, url, primary_contact,     │
│            email, founded_year, stage, last_active }                │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. SCORING PIPELINE                                                 │
│    For each company in portfolio.json:                              │
│      - Probe 1-3 surfaces via agentsfirst.dev/mcp                   │
│      - Compute headline (max-of-surfaces)                           │
│      - Cache to scores/portfolio/{slug}.json                        │
│    Parallelism: 30 concurrent worker calls                          │
│    Wall time: ~2-3 hours for 200 companies                          │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. PRIVATE SCORE PAGE GENERATOR                                     │
│    For each company:                                                │
│      - Generate 12-char hex token                                   │
│      - Write scores/portfolio-{slug}-{token}/index.md               │
│      - Run tools/og-card/generate.py to create per-page card        │
│    All pages noindex/nofollow/noarchive (private by default)        │
│    Site URL: https://agentsfirst.dev/scores/portfolio-{slug}-{tok}/ │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. EMAIL TEMPLATING                                                 │
│    Per-company email body, level-aware:                             │
│      - Level 0 → "Floor of the rubric, easy lift" template          │
│      - Level 1 → "Halfway there" template                           │
│      - Level 2 → "Solid, here's how to get to L3" template          │
│      - Level 3-4 → "🏆 You're in the celebration tier" template     │
│    Each email: company name, headline score, top 2 fixes, private  │
│    URL, GitHub star ask, signature.                                 │
│    Output: queue.jsonl with { to, subject, body, batch_day }        │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. PERSONALIZE.RUN SEND LAYER                                       │
│    Queue → Personalize.run as a campaign                            │
│    Sender: josh@quityourjob.com                                     │
│    Drip rate: 25/day, M-F, 9-11am CT                                │
│    Approval: Josh greenlights each batch via Personalize UI         │
│    Reply handling: any reply pauses the campaign for that contact   │
│      and surfaces in Josh's inbox                                   │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. METRICS DASHBOARD                                                │
│    Track per-company:                                               │
│      - Sent timestamp                                               │
│      - Open / reply / score-page-visit                              │
│      - GitHub star (correlate via star events)                      │
│      - Re-score event (founder shipped a fix → score went up)       │
│    Living scoreboard: docs/campaigns/cf-portfolio-results.md        │
└─────────────────────────────────────────────────────────────────────┘
```

## Email templates (one per level tier)

All templates use Josh's daily email voice — `Howdy <First>,` opener, short paragraphs, `Yeehaw!` close, `🤖 Josh` sig. Always CC `chiefofstaff@capitalfactory.com`.

### Template L0 — "Floor of the rubric, easy lift"

> **Subject:** [Company] · agent-readiness score (private link)
>
> Howdy [First],
>
> We just shipped a free agent-readiness scorer at agentsfirst.dev — open-source rubric, scored 14 named companies in the public batch. I'm running it against every CF portfolio company to see what we can fix.
>
> **[Company] scored 0/100, Level 0.** Honest result — there's no robots.txt, no /llms.txt, no /AGENTS.md, no MCP discovery on [domain]. Most agents that look you up cold can't find you.
>
> The good news: the floor is reachable in an afternoon. Three files (/robots.txt with a Content-Signal directive, /llms.txt, /AGENTS.md) get you to Level 2.
>
> **Your private report:** [unique URL]
>
> Two asks:
> 1. ⭐ If the framework is useful to you, star agentsfirst on GitHub: https://github.com/capitalthought/agentsfirst
> 2. Re-run the scorer at agentsfirst.dev/mcp once you ship the fixes — would love to see your score climb.
>
> Reply if you want me to walk through the report or pair on the fixes — I have 5 fix-it slots a week reserved for portfolio companies.
>
> Yeehaw!
>
> 🤖 Josh

### Template L1 — "Halfway there"

> **Subject:** [Company] · agent-readiness score (private link)
>
> Howdy [First],
>
> Heads up — I'm scoring every CF portfolio company on a free agent-readiness rubric we shipped at agentsfirst.dev. **[Company] scored [N]/100, Level 1 (Agent as Afterthought).**
>
> One signal you've already shipped: [specific working signal — robots.txt addresses N AI agents / sitemap exists / etc.]. What's missing for Level 2: [the single highest-leverage fix from their probe — usually /AGENTS.md or markdown content negotiation or MCP card].
>
> **Your private report:** [unique URL]
>
> Two asks:
> 1. ⭐ Star agentsfirst on GitHub if the rubric is useful: https://github.com/capitalthought/agentsfirst
> 2. Re-run the scorer at agentsfirst.dev/mcp after you ship — most companies climb 30+ points with a single afternoon's work.
>
> Reply if you want help — I have 5 fix-it slots a week reserved for portfolio companies.
>
> Yeehaw!
>
> 🤖 Josh

### Template L2 — "Solid, here's how to get to L3"

> **Subject:** [Company] · agent-readiness score (private link)
>
> Howdy [First],
>
> Quick one — I'm scoring every CF portfolio company on the agent-readiness rubric we shipped at agentsfirst.dev. **[Company] scored [N]/100, Level 2 (Agent-Aware).** That puts you ahead of most of the named companies in our public series.
>
> The two specific fixes that would land you in the Level 3 club (currently: Vercel, Cursor, Browserbase, Notion): [fix 1] and [fix 2]. Both small.
>
> **Your private report:** [unique URL]
>
> One ask: ⭐ Star agentsfirst on GitHub if the rubric helps: https://github.com/capitalthought/agentsfirst
>
> Reply if you want a co-pilot session — I'm running 5 fix-it slots a week for portfolio companies.
>
> Yeehaw!
>
> 🤖 Josh

### Template L3-L4 — "🏆 You're in the celebration tier"

> **Subject:** 🏆 [Company] just hit Level 3 on the Agents First rubric
>
> Howdy [First],
>
> Heads up — I'm scoring every CF portfolio company on the agent-readiness rubric at agentsfirst.dev. **[Company] scored [N]/100, Level [3 or 4].**
>
> That puts you in the celebration tier alongside Vercel, Cursor, Browserbase, and Notion — five companies in the entire scored set. Specifically what stood out: [the strongest dimension or two from their probe].
>
> **Your private report:** [unique URL]
>
> Three asks:
> 1. ⭐ Star agentsfirst on GitHub: https://github.com/capitalthought/agentsfirst
> 2. Reply with a quote I can use in the next public batch ("Here's why we built it that way" — 1-2 sentences).
> 3. Tell me the one thing you'd do to get to Level 4 — your input shapes the rubric.
>
> Yeehaw!
>
> 🤖 Josh

## Pilot plan (week 1)

**Monday 2026-05-12 — Pilot launch**

Pick 25 hand-picked companies based on three criteria:
1. **CF founder Josh has met personally** — 100% reply-rate baseline; honest feedback comes back fast
2. **Mix of stages** — 5 pre-seed, 10 seed, 5 Series A, 5 mature — to surface format issues across the funnel
3. **Mix of categories** — 5 dev tools, 10 B2B SaaS, 5 hardware/defense, 5 consumer — different verticals score differently

**Tuesday 5/12 → Friday 5/16:**
- 5/day, 25 total
- Each morning: Mikey runs the pipeline, drafts the 5 emails, Josh greenlights via Personalize.run UI
- Send window: 9-11am CT
- Track responses

**Saturday 5/17 — Pilot review**
- Reply rate target: ≥30% (warm CF founders should reply)
- Score-page visit rate: ≥50%
- GitHub stars: ≥5 of 25
- Issues to fix before scaling: subject line tweaks, template wording, send-rate concerns
- Decision: scale to 25/day across the active 200, or iterate?

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Founder feels condescended to ("you got 0/100") | Lead with what's working (even if minimal) and frame as "afternoon job, here's the lift." Templates do this. |
| 25/day is too much; founders complain Josh is spamming | Pause if reply-rate drops or unsubscribes spike. Personalize.run handles unsubs natively. |
| Score is wrong (probe false positive) | Verify each pilot score by curl before sending. v0.2.0 probe has SPA-catchall false-positive risk on Vercel/Next.js — flagged. |
| Founder updates site, score doesn't go up because of probe bug | Don't send "you didn't fix it" follow-ups. Re-score on demand only. |
| Email lands in promo folder | Personalize.run optimizes for inbox placement. 25/day is well below Gmail's promotional throttle. Send from a warm domain. |
| Founder asks for help and Josh doesn't have bandwidth | The "5 fix-it slots a week" framing creates scarcity. If they fill, queue founders for the next week. |
| GitHub star count doesn't move | Acceptable. Star is a soft ask; the primary win is the founder fixing their site. |

## Success metrics (campaign-level)

After 8 weeks (full 200 companies):

- **Reply rate:** ≥25%
- **GitHub stars from CF portfolio:** ≥40 (≥20% of recipients)
- **Score-page visits:** ≥60% of recipients
- **Companies that re-scored higher within 30 days:** ≥30 (15% of recipients)
- **Public testimonial-quality replies:** ≥10 (usable in v0.8 thesis postscript)
- **Inbound press / podcast / partnership requests:** ≥3 directly attributable

## What we need before sending email #1

1. ✅ Live scorer (agentsfirst.dev/mcp v0.2.0) — done
2. ✅ Per-page OG card generator — done
3. ✅ /scores/ private page convention — done
4. ⬜ **Portfolio list (~200 active CF companies)** — needs a data fetch from Asana/HubSpot/Radar
5. ⬜ **Sender domain warmed in Personalize.run** — confirm `josh@quityourjob.com` is configured
6. ⬜ **Email template review** — Josh edits the 4 templates above
7. ⬜ **Subject line A/B test** — 2 variants on the pilot batch
8. ⬜ **Pilot batch (25 hand-picked)** — Josh selects names; Mikey runs the pipeline
9. ⬜ **Reply-handling playbook** — what to do when a founder asks "can you help me ship this"

## Operational rhythm (post-pilot)

```
Daily (M-F 9am CT):
  - Mikey runs `bin/cf-campaign-batch` → generates next 25 drafts in Personalize.run
  - Josh greenlights via Personalize.run UI
  - Personalize.run sends 9-11am CT

Weekly (Mon morning):
  - Mikey reports last-week metrics in Slack/iMessage
    (reply rate, stars added, re-scores, replies pending)
  - Josh decides whether to slow/accelerate

Per-reply:
  - Founder reply pauses their thread in the campaign
  - Surfaces in Josh's inbox with full context (private link + score data)
  - Josh handles personally; Mikey drafts replies if asked

Monthly (1st of month):
  - Re-score every company that's already been emailed
  - Surface any score-deltas (they shipped a fix → score went up)
  - Optional: send a "🎉 you climbed L1 → L2" follow-up email
```

## Code that needs to be written

| File | Purpose | Estimate |
|---|---|---|
| `tools/cf-portfolio-fetcher.ts` | Pull active CF portfolio from Asana / HubSpot / Radar; output `portfolio.json` | ~2h |
| `tools/cf-portfolio-scorer.ts` | Score every company in `portfolio.json` via the live worker; cache results | ~1h |
| `tools/cf-portfolio-pages.ts` | Generate /scores/portfolio-{slug}-{token}/ pages from cached scores | ~1h |
| `tools/cf-portfolio-emails.ts` | Generate level-aware email bodies; output Personalize.run-ready CSV | ~2h |
| `tools/cf-portfolio-metrics.ts` | Pull Personalize.run send/open/reply metrics + GitHub star events | ~3h |
| `bin/cf-campaign-batch` | Daily wrapper script — fetch next 25, draft into Personalize.run | ~1h |

**Total build:** ~10 hours, parallelizable across 2-3 sessions.

**MVP path:** ship items 1-4 for the pilot (skip metrics + daily wrapper), use Personalize.run UI directly to manage drips, build metrics in week 2.

## Next concrete step

Josh decides on the open questions above (sender, public vs private, pilot size, offer). Once those are answered:

1. Mikey writes `tools/cf-portfolio-fetcher.ts` — pulls the portfolio list from whichever system Josh names as canonical
2. Hand-pick 25 pilot companies + Josh approves the list
3. Run scorer against the 25 → /tmp/pilot-scores.json
4. Generate 25 private /scores/portfolio-{slug}-{token}/ pages → commit + push
5. Generate 25 personalized email bodies → CSV
6. Upload CSV to Personalize.run as a campaign
7. Josh greenlights → Personalize sends 5/day Tuesday-Friday next week

**Ready to start when you are. Which of the open decisions should we lock in first?**
