# Agents First — Marketing Plan

*Synthesis of 6 parallel persona-strategist agents (HN/Twitter, PR, podcast/conference, founder/VC propagation, SEO/compounding, enterprise GTM) — 2026-05-04, after agentsfirst.dev v0.5 went live with Giscus comments + working HTTPS.*

Site: <https://agentsfirst.dev> · Repo: <https://github.com/capitalthought/agentsfirst> · Author: Joshua Baer

---

## Convergence — where 3+ agents agreed independently

| Theme | Agents | Implication |
|---|---|---|
| **Latent Space (swyx + alessio)** is the canonical first podcast | Conference, PR, HN/X | Once swyx canonizes the vocabulary, downstream coverage cascades. **Push hardest here.** PR strategist called it "highest leverage" — every other pitch gets easier the moment Latent Space airs. |
| **Simon Willison endorsement = legitimacy lock** | VC-propagation, HN/X, PR | Single blog mention by him bootstraps thesis into technical canon. Pre-brief him personally (DM, not email). |
| **Per-principle URL split is the SEO moat** | SEO (sole owner — but flagged as #1 unlock) | Flat 6K-word md ranks for ONE head term at best. **14-day window** to ship 8 sub-pages before the moat closes. |
| **AI Engineer World's Fair (June 2026) = flagship venue** | Conference, PR | 100% builder audience, swyx curates. Win this stage and the rest cascades. |
| **Capital Factory Innovation Council = enterprise trojan horse** | Enterprise GTM (sole owner — but unique-to-Josh) | RFP language pack + half-day private summit are tactics no other thesis publisher has access to. |
| **The "Two Customers" hook leads everything** | All 6 implicitly | Make it the OG image, X thread opener, podcast pitch line. |

---

## 🚀 Sequenced launch plan

### Week 0 — Ship in next 24h
**Owner: Mikey (most of it autonomous), Josh (~30min)**

- **SEO bundle**: meta description + canonical + Twitter/OG card image (1200×630 with the "Two Customers" line) + JSON-LD `TechArticle` schema + anchor IDs on every principle.
  - Why: without this every share renders as bare text on X/LinkedIn/Slack.
  - Mikey can do most of this autonomously; Josh just needs to OK an OG-image draft.
- **`npx create-agents-first` scaffold** — build v0 (MCP server + AGENTS.md + prep gate + typed state).
  - HN strategist flagged this as the converting moment from "interesting essay" → "I just shipped Level 2 in 4 minutes."
  - High effort but **essential** for HN traction.
  - Anti-pattern: don't ship half-working — broken `npx` on launch day kills the thread.

### Week 1 — Pre-brief amplifiers
**Owner: Josh (DMs, ~30min total)**

Five 200-word notes with one specific ask each:

1. **swyx** (Latent Space) — pitch podcast booking + ask for quote-tweet day-of
2. **Simon Willison** — substantive cold note, ask for "60 seconds of skepticism"
3. **Patrick McKenzie** — pitch HN seeded comment + RT
4. **David Cramer** (Sentry) — Austin warm path, devtools peer endorsement
5. **Maggie Appleton** — has the right audience for "two customers" framing

Also: submit **AI Engineer World's Fair CFP** (closes ~6 weeks pre-event).
- Title: `Agents First: Designing Products When Your User Is a Tool Call`
- Abstract: every product has two customers — the human paying and the agent choosing. Walk through 8 implementation principles + 7 anti-patterns drawn from 545 startups at Capital Factory.

### Week 2 — Coordinated launch day (Tuesday 8:05am ET / 7:05am CT)

| Time | Action | Owner |
|---|---|---|
| T-24h | Pre-brief 5 amplifiers complete | Josh |
| T 8:05am ET | HN submission with title `Agents First: products now have two customers — the human who pays and the agent who decides` | Josh |
| T+90s | Josh first-comment with **runnable example** (30-line MCP server vs REST equivalent — token counts + time-to-first-call side-by-side) | Josh |
| T 9:30am CT | 9-tweet X thread, anchored by Cloudflare Code Mode 99.9% stat. Tweet 1 = hook (NO link — X throttles link-leading threads ~40%). Tweet 9 = link | Josh |
| T+5min | 3 seeded HN counter-comments from CF mentors with substantive pushback ("isn't this just SDK design?", "Level 4 vs agent swarms?", "$0.50/decision pencils?"). Josh answers within 5 min. Disagreement-with-substance = HN algorithmic catnip | Josh + 3 CF mentors briefed in advance |
| T+30min | Latent Space pitch email goes out: subject `Agents First: a vendor-neutral design framework after 2 years of MCP chaos`. Exclusive on the podcast taping | Josh |

**Anti-patterns to avoid:**
- "I wrote a thing" tone on HN — penalized by ranker
- Sockpuppet praise — moderators sniff this in an hour and dead-list the post
- Posting URL in tweet 1 — X throttles ~40%

### Week 3-4 — Cascade

- Latent Space recording (target swyx interview)
- **Stratechery citation pitch** (Ben Thompson) — 200-word note: "Adoption Levels 0-4 give you the same analytical scaffold for agents that 'aggregator vs platform' did for the 2010s." Send the levels table + the 99.9% Cloudflare Code Mode stat. No exclusive needed.
- **The Information pitch** — angle: "Austin VC to portfolio: ship an agent interface or you're invisible by 2028." Offer exclusive first-print + Josh on record with portfolio data.
- **AI Engineer Newsletter** — pitch as a *checklist issue*: "the 7 things to audit in your MCP server this week." Exclusive standalone artifact.
- **Lenny's Newsletter guest post** (NOT interview — cheaper) — reframe for PMs: "two customers" + Visible Outputs + Prep Gates as PM discipline.
- Newsletter capture form + `/changelog/` page on the site
- **Anti-Pattern of the Month** LinkedIn series begins (Josh names a real product anonymized, committing each anti-pattern; enterprise architects screenshot into design-review decks)

### Month 2-3 — SEO compounding
**Owner: Mikey (~6hr per shipment)**

- **Per-principle URL split** (8 sub-pages: `/principles/interface-first/` etc., each ~1000 words). **Single biggest SEO unlock** — flat md cannot rank for sub-keywords.
- Glossary subpage (`/glossary/`) — long-tail keyword vacuum on "Lazy Wrapper", "God Server", "Prep Gates"
- Derivative content fan-out, all linking back with `?utm`:
  - Speaker Deck slides (DR93 backlink free)
  - ElevenLabs audio narration → Spotify
  - YouTube Loom walkthrough with chaptered timestamps matching anchor IDs
  - Substack excerpt
- Backlink seeding: open PRs to `awesome-mcp-servers`, comment on Anthropic MCP docs discussion, LangChain blog guest post pitch

### Month 3+ — Enterprise wedge
**Owner: Josh (high-leverage, unique-to-CF moves)**

- **Capital Factory Agents First Council**: half-day private summit at CF Austin, Q3 2026
  - 25 architects from CF Innovation Council + defense primes
  - Chatham House rules, Josh moderates
  - Output: signed "Agents First Charter"
  - Once 5 logos sign, the rest follow
  - **Target #1 logo: AT&T** (Jeremy Legg, CTO; reachable through CF; needs Agentforce narrative ammo). Defense primes (BAE, Raytheon) follow within 90 days because procurement language travels
- **RFP language pack** — pre-written procurement clauses ("Vendor MUST ship MCP server with <20 verb-first tools, structured errors, and a published Prep Gate"). Distributed via CF Innovation Council legal/procurement reps. **Trojan horse** — once one F500 puts it in an RFP, every vendor scrambles
- **Microsoft co-published "Agents First Lens"** whitepaper (AWS Well-Architected pattern). Microsoft is on CF Innovation Council and needs Copilot Studio narrative ammo. Target Ignite/Build session
- **Maturity Assessment PDF + scorecard**: 1-page printable scoring any team against the 8 principles + 7 anti-patterns, lands them on the 0-4 ladder. Enterprises adopt frameworks they can score themselves with (SOC 2 / DORA / Well-Architected pattern)

---

## 📊 Agent Readiness Reports — recurring scorecard content engine

*Added 2026-05-05 after both `@capitalthought/create-agents-first` and `@capitalthought/agentsfirst-mcp` shipped to npm. Now that the scorer is a public tool any agent can call, scoring becomes content.*

### The play

Every other Thursday, Josh runs `/agentsfirst` against a notable product (website + repo if open-source), publishes the score + report, and uses it as bait for distribution. Each report:

- Names the company by name
- Gives a numeric score (0–100) and adoption level (0–4)
- Calls out the dominant **anti-pattern** detected (canonizes the vocabulary every time)
- Surfaces the **top 3 fixes** that'd land them at Level 3 (constructive, not gotcha)
- Cross-links to the relevant `/principles/` deep-dive pages

### Why it works

- **Self-serving for the framework:** every published report *uses* the framework. Each scorecard cements the principles + anti-patterns as named industry vocabulary, the way OWASP Top 10 cemented vulnerability vocabulary.
- **Forces engagement:** named companies have to respond — confirm the score (you win), defend (the story keeps moving), or quietly fix the gaps (the report aged into a roadmap they implemented).
- **Scales as content:** ~1 hour to produce a report; reusable as blog post + X thread + LinkedIn article + "courtesy DM" to the named company's CTO.
- **Credibility loop:** if the named company actually *fixes* the gap and re-scores higher 90 days later, the second report is even better content.

### Format

**Long-form:** posted at `agentsfirst.dev/reports/<slug>/` (a new Jekyll collection), 500-800 words, with a one-screen scorecard graphic at the top.

**Social cuts:** X thread (Tweet 1 = score + name + dominant anti-pattern; Tweet 2-5 = the top 3 fixes; Tweet 6 = link). LinkedIn = the X thread restitched into a single post for that audience.

**Courtesy DM template:** "We just published a public Agent Readiness Report on [Company]. Score: X/100. The fix that'd unlock the most leverage: [one-sentence specific recommendation]. Full report: [link]. No need to respond — sharing in case useful."

### First 10 targets — three tiers

**Tier 1 — likely high readiness, lifts the framework:**

1. **Cloudflare** — they wrote the Agent Readiness Score post we cited. Naming them in a report (and probably scoring them at Level 3 already) reinforces our citation + theirs. Could also become a co-published piece.
2. **Anthropic** — owns MCP. Should score Level 3+. If they do, the framework gets canonized. If they don't, that's the bigger story.
3. **Linear** — clean MCP server, beloved tool. Almost certainly Level 2-3. Engineering audience reposts.
4. **Vercel** — heavy investment in agent infra; should score well, mid-Level 3.
5. **Stripe** — the original "API as a product" company. The natural Level 3 contender; what's missing tells the most interesting story.

**Tier 2 — mid readiness, instructive gaps:**

6. **Notion** — popular, well-loved, but agent surface is uneven. Likely Level 1-2; the gap to Level 3 is concrete and writable.
7. **GitHub** — owns the developer workflow. Has Copilot agents but exposes a fraction of what an agent could call. Probably Level 2.
8. **Slack** — the canonical Visible Outputs target. But Slack itself? MCP server exists; how complete? Probably mid-Level 2.

**Tier 3 — low readiness, dramatic gaps (the highest-engagement reports):**

9. **A major bank with a well-known dev portal** (e.g., Plaid, Chase developer, Wells Fargo dev) — likely Level 0. Public sector finance + agent-readiness = highly newsworthy.
10. **A defense prime's developer site** (Palantir, Anduril, BAE) — Josh's domain. Defense + Agents First = Fed Supernova fodder. Score whatever's public; offer to score the internal stack privately.

### Cadence + calendar

- **Bi-weekly Thursday publish** (~26 reports per year)
- **Lead time:** Wednesday afternoon = run scorer + draft. Thursday morning = polish + ship.
- **Track:** keep a running tally on `/reports/` of all targets, scores, and improvements over time. If three reports show the same anti-pattern at three different companies, that becomes a Lenny's pitch ("the three SaaS companies all making the same agent mistake").

### Anti-patterns of using this play wrong

- **Don't punch down.** Score companies bigger than CF, not portfolio founders or smaller teams who can't recover from a public scorecard.
- **Don't gotcha.** Every report ends with "here's the Level 3 fix" — constructive, not destructive.
- **Don't fake-grade.** If a company scores Level 0, say Level 0. The scorecard's value depends on consistency.
- **Don't run it without prep.** Always invoke `agentsfirst_prep` first; cite which version of the rubric was used.

### Optional follow-on: a `/scorecard` skill

A future Claude Code skill that takes a company name + URL, runs the full scorecard pipeline (probe → score → draft post + X thread + LinkedIn variant + courtesy DM), and lands all three drafts on Josh's clipboard. ~1 hour to build, would cut report production from 1 hour to 15 minutes. Build after the first 3-5 reports validate the format.

---

## 🚨 Disagreements / risks flagged

- **Theo Browne (t3.gg)** — VC strategist recommended; high YT reach but no clear warm path AND Theo "roasts as easily as endorses." Risk-adjusted: **skip unless warm intro exists**.
- **Lenny's Newsletter** — Two agents recommended, different formats. Pick **guest post** (cheaper) over interview (~4hrs prep).
- **a16z Podcast** (Steph Smith / Casado) — Conference agent recommended but audience overlaps Latent Space heavily. **Skip if Latent Space lands** to avoid same-audience saturation.
- **Mario Gabriele (The Generalist)** — VC strategist's #1 pick; loves naming a movement. High odds of cite-in-essay or pull-quote. Worth the 1-degree warm intro path.
- **Packy McCormick (Not Boring)** — VC strategist recommended; Sunday-essay propagation if he picks up. Slightly less technical-builder-aligned but big VC reach.

---

## 🎯 If only three things

1. **This week:** ship the SEO bundle + start the scaffold (Week 0)
2. **This month:** book Latent Space + submit AI Engineer World's Fair CFP
3. **This quarter:** convene the Capital Factory Agents First Council with AT&T as target logo #1

---

## Single highest-leverage moves by phase

- **24-hour ship:** SEO bundle (meta tags + OG image + JSON-LD). 30-min job. Unlocks every future share renders properly.
- **2-week ship:** Per-principle URL split. Without this the SEO moat closes.
- **30-day flagship podcast:** Latent Space (swyx). Cascade unlock for all downstream coverage.
- **Single-room density venue:** AI Engineer World's Fair keynote. Full builder audience.
- **Single legitimacy node:** Simon Willison blog mention. Bootstrap into technical canon.
- **Single enterprise wedge:** AT&T as published case study (via Jeremy Legg, CTO; warm path through CF Innovation Council).

---

## Source agent reports

Six parallel persona-strategist runs, all read agentsfirst.dev directly via WebFetch:

1. HN/dev-Twitter launch strategist (top-5 launch tactics)
2. Earned-media / PR strategist (top-5 outlets)
3. Podcast / conference booker (top-5 podcasts + top-3 CFPs + flagship)
4. Founder/VC network propagation (top-7 personal sends)
5. SEO / content compounding strategist (top-7 compounding moves)
6. Enterprise GTM / product-leader outreach (top-6 F500 adoption moves)

Full agent reports preserved in chat transcript; convergence table above is the dedup'd cross-cutting synthesis.
