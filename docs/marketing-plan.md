# Agent First — Marketing Plan

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
- **`npx create-agent-first` scaffold** — build v0 (MCP server + AGENTS.md + prep gate + typed state).
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
- Title: `Agent First: Designing Products When Your User Is a Tool Call`
- Abstract: every product has two customers — the human paying and the agent choosing. Walk through 8 implementation principles + 7 anti-patterns drawn from 545 startups at Capital Factory.

### Week 2 — Coordinated launch day (Tuesday 8:05am ET / 7:05am CT)

| Time | Action | Owner |
|---|---|---|
| T-24h | Pre-brief 5 amplifiers complete | Josh |
| T 8:05am ET | HN submission with title `Agent First: products now have two customers — the human who pays and the agent who decides` | Josh |
| T+90s | Josh first-comment with **runnable example** (30-line MCP server vs REST equivalent — token counts + time-to-first-call side-by-side) | Josh |
| T 9:30am CT | 9-tweet X thread, anchored by Cloudflare Code Mode 99.9% stat. Tweet 1 = hook (NO link — X throttles link-leading threads ~40%). Tweet 9 = link | Josh |
| T+5min | 3 seeded HN counter-comments from CF mentors with substantive pushback ("isn't this just SDK design?", "Level 4 vs agent swarms?", "$0.50/decision pencils?"). Josh answers within 5 min. Disagreement-with-substance = HN algorithmic catnip | Josh + 3 CF mentors briefed in advance |
| T+30min | Latent Space pitch email goes out: subject `Agent First: a vendor-neutral design framework after 2 years of MCP chaos`. Exclusive on the podcast taping | Josh |

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

- **Capital Factory Agent First Council**: half-day private summit at CF Austin, Q3 2026
  - 25 architects from CF Innovation Council + defense primes
  - Chatham House rules, Josh moderates
  - Output: signed "Agent First Charter"
  - Once 5 logos sign, the rest follow
  - **Target #1 logo: AT&T** (Jeremy Legg, CTO; reachable through CF; needs Agentforce narrative ammo). Defense primes (BAE, Raytheon) follow within 90 days because procurement language travels
- **RFP language pack** — pre-written procurement clauses ("Vendor MUST ship MCP server with <20 verb-first tools, structured errors, and a published Prep Gate"). Distributed via CF Innovation Council legal/procurement reps. **Trojan horse** — once one F500 puts it in an RFP, every vendor scrambles
- **Microsoft co-published "Agent First Lens"** whitepaper (AWS Well-Architected pattern). Microsoft is on CF Innovation Council and needs Copilot Studio narrative ammo. Target Ignite/Build session
- **Maturity Assessment PDF + scorecard**: 1-page printable scoring any team against the 8 principles + 7 anti-patterns, lands them on the 0-4 ladder. Enterprises adopt frameworks they can score themselves with (SOC 2 / DORA / Well-Architected pattern)

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
3. **This quarter:** convene the Capital Factory Agent First Council with AT&T as target logo #1

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
