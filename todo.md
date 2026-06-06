# agentsfirst TODO List

> **Before adding a new item:** Search this list for similar existing bugs/features first.
> If a matching item already exists, increment the attempt count (e.g. `(attempted x2)`) and append
> notes about what was tried. Notify the user that this has been attempted before so we can
> try a different approach. This helps track repeated failures on the same issue.
>
> **Workflow:** Open -> Needs Verification -> Done (or back to Open if verification fails).
> Items in "Needs Verification" must be tested before being re-attempted or marked done.
> **When completing items:** Always move to "Needs Verification" first -- NEVER mark as Done directly.
> Only the user can promote items from Needs Verification -> Done (moved to archive) after testing.
>
> **Auto-verification (run as part of every todolist update):**
> When displaying or updating the todolist, automatically verify Needs Verification items where possible:
> - **Code exists**: grep/read the mentioned file to confirm the described change is present
> - **Migration applied**: check `.migration-status` for the migration filename
> - **Function deployed**: check `.function-status` for the function name and recent timestamp
> - **Build compiles**: confirm from recent build output
> - **Tests exist**: check if test files cover the feature
> Items that pass auto-verification get marked `(auto-verified YYYY-MM-DD)`. Items that require
> manual/device testing (UI behavior, UX flows, on-device WiFi) stay as-is for user verification.
>
> **Display rules (when user asks to view the todolist):**
> 1. Make sure all entries are up to date first (move completed items, update counts)
> 2. Run auto-verification on all Needs Verification items
> 3. Show each item individually in useful groups (Bugs, Improvements, Features)
> 4. Number each item with **globally unique numbers** across all sections (e.g. Needs Verification 1-12, Open 13-21) so the user can unambiguously reference any item by number
>
> **Timestamps:** Append date tags to track item lifecycle: `(added YYYY-MM-DD)`, `(verified YYYY-MM-DD)`, `(done YYYY-MM-DD)`, `(reopened YYYY-MM-DD)`.
>
> **Archive:** Completed items are in [todolist-archive.md](todolist-archive.md).

---

## Needs Verification

Items recently fixed but not yet tested. **Test these before attempting again or marking done.**

### Bugs

*(none)*

### Features

- **`/scorecard` Claude Code skill shipped** — full Agent Readiness Report launch package in one shot (probe → score → index.md + x-thread.md + linkedin.md + courtesy-dm.md → OG card → scoreboard → commit). Lives at `~/.claude/skills/scorecard/SKILL.md` (iCloud-synced). Replaces the manual /reports/* workflow used for the first 11 reports. **Smoke-tested 2026-05-07 — hosted scorer at agentsfirst.dev/mcp returns 75/100 Level 3 for self.** Full end-to-end run against a new target still pending. (added 2026-05-07, smoke-verified 2026-05-07, auto-verified 2026-05-14: SKILL.md exists at expected path)
- **`@capitalthought/agentsfirst-mcp@0.2.0` published to npm** — rubric promotes /AGENTS.md from 10pts → 15pts (canonical contract artifact); demotes /llms.txt from 10pts → 5pts (10% adoption per SE Ranking, Google declined to support); credits /agents.json + /sitemap-index.xml. Hosted scorer at agentsfirst.dev/mcp already runs this rubric. Git tagged `agentsfirst-mcp-v0.2.0`. **Verify with `npx -y @capitalthought/agentsfirst-mcp@0.2.0`** against any target. (added 2026-05-07, auto-verified 2026-05-14: `npm view @capitalthought/agentsfirst-mcp@0.2.0 version` returns 0.2.0) — **superseded by v0.3.0 below; both still work**
- **`@capitalthought/agentsfirst-mcp@0.3.2` published + worker deployed** (commits aeddb37 + 2c8885e + wrangler version `7aa1f1e4`) — rubric v0.3.0 with tiered AGENTS.md scoring (≤1500 +5, ≤3000 +3, ≤6000 +1, >6000 0pts + Token Dump warning), SEP-2567 sessionless-MCP detection (refined regex — 0 false positives on self-test), and LLM-gen template heuristic. v0.3.2 wired the Token Dump anti-pattern through the canonical `principles.ts` enum + server.ts z.enum + prep.ts count check (v0.3.1 was a transient publish that missed those). **Verify by `npx -y @capitalthought/agentsfirst-mcp@latest score_codebase` against any repo, OR `curl https://agentsfirst.dev/mcp` and check `get_anti_pattern` enum includes `token-dump`.** Self-score: 65/100 Level 3 (was 61 before the SEP-2567 regex fix). (shipped 2026-05-07, npm + worker live; auto-verified 2026-05-14: `npm view ...@0.3.2` returns 0.3.2; worker `tools/list` returns the 5 expected tools)
- **Thesis v0.8 + Token Dump anti-pattern + a14y comparison + Principle 2 quality clause + AWS AgentCore citation shipped** (commits c98fba9, dc32b1a) — bundles 5 of 12 recs (498d3294, 8e8791ba, 9eced7e5, 1be408d3, b2616e45, f7e47197). Pages auto-deploys on push. Verify by visiting agentsfirst.dev and checking "The Token Dump" under anti-patterns + "Versus a14y" subsection + AWS Bedrock AgentCore Payments paragraph in "The shift". (shipped 2026-05-07, auto-verified 2026-05-14: `curl agentsfirst.dev | grep "Token Dump"` returns 5 hits)
- **X reply to oliviscusAI thread sent** (rec c76cfba8) — replied to https://x.com/oliviscusAI/status/2052337431291244986 with the drafted text in `docs/drafts/2026-05-07-x-reply-oliviscusai-agents-md.md`. Watch for engagement; if oliviscusAI responds, that's the moment to share `npx -y @capitalthought/agentsfirst-mcp` and offer to score their setup. (sent 2026-05-07)
- **og-image.png refreshed** — idempotent generator at `tools/og-card/generate-root.py`. Now matches per-page card brand language with version badge "v0.8 · May 2026" for cache-busting on each thesis bump. (shipped 2026-05-07, auto-verified 2026-05-14: `curl -I agentsfirst.dev/og-image.png` returns 200, content-type image/png, 41,568 bytes)
- **Scaffold v0.1.1 — `create-agents-first` published to npm** — adds Token Dump anti-pattern warning + openai-agents-python v0.16 tool-naming guidance (`include_server_in_tool_names`). Template still 1203 tokens (~83 lines), comfortably in tier 1 (lean) of the new rubric. **Verify with `npx -y @capitalthought/create-agents-first@latest`.** (shipped 2026-05-07, auto-verified 2026-05-14: `npm view @capitalthought/create-agents-first version` returns 0.2.0 — newer than v0.1.1 noted in title; rubric still passes)
- **11 reports re-scored against deployed v0.3.2 rubric** (commit 9551336, weekly auto-refresh workflow run #25529295359) — 0 score movements (expected: v0.3.0 changes were codebase-side; website rubric unchanged). Confirms the deploy was clean and didn't regress any of the published Agent Readiness Reports. (auto-verified 2026-05-14: commit 9551336 in git log; weekly auto-refresh ran again 2026-05-14 as commit 7a47a63)
- **3 outreach + spike drafts persisted** (commit 4b172d8): AWS quick-take post (rec 61c273f6) at `docs/drafts/2026-05-07-x-aws-agentcore-quicktake.md`; Timothy Jordan / a14y DM (rec ccd0c45e) at `docs/drafts/2026-05-07-dm-timothy-jordan-a14y.md`; a14y integration spike findings (rec 3e5abed1) at `docs/drafts/2026-05-07-a14y-integration-spike.md`. Drafts ready for Josh review + post/send. (auto-verified 2026-05-14: all 3 .md files present at expected paths in `docs/drafts/`)

### Improvements

#### From `/agentsfirst-check` 2026-05-14 (5 of 6 recs auto-verified live)

> Source: `docs/checks/2026-05-14.md`. All 6 recs accepted same session and shipped in commit dfb1e81 (rebased onto 7a47a63 weekly auto-refresh as dfb1e81 → final SHA on origin/main). The 6th rec (Vercel-receipts X thread) shipped tweet 1 only; tweets 2/3/4 are now an Open item — see Improvements below.

- **Vercel "58.9% tool-call tokens" cited in thesis** (rec `2524341a`) — `index.md:30` replaces "agent interactions are small today" with the Vercel data point; `index.md:316` converts the open question into a partial answer. (shipped 2026-05-14, auto-verified 2026-05-14: live at agentsfirst.dev)
- **Boris Mann "agent count is shallow" pre-empt** (rec `4c5f7d58`) — `index.md:67` adds the "I have N agents" → "browser tabs" critique with a measurable-jobs-to-be-done counter. (shipped 2026-05-14, auto-verified 2026-05-14: live at agentsfirst.dev)
- **Anthropic CMA-MCP cited as Layer-B reference** (rec `0cac534f`) — `index.md:356` adds Anthropic's own MCP-server reference impl with verb-first tool names + safety-by-omission. (shipped 2026-05-14, auto-verified 2026-05-14: live at agentsfirst.dev)
- **MCP draft per-request capabilities tracked** (rec `af34fe5b`) — new file `docs/rubric-backlog.md` documents the schema diff (+420 bytes), proposed +2/+2/-2 rubric checks, and trigger condition (first spec release tag). No rubric bump yet. (shipped 2026-05-14, auto-verified 2026-05-14: file exists)
- **`sources.json` cleaned** (rec `fde5f049`) — dropped HN Algolia (4 consecutive 400s), Anthropic news RSS (4 404s), Linear changelog RSS (4 404s); fixed MCP releases atom + draft-schema diff URLs (`specification` → `modelcontextprotocol` repo rename). (shipped 2026-05-14, auto-verified 2026-05-14: `grep -c "anthropic.com/rss\|linear.app/changelog/rss" sources.json` returns 0)

---

## Open

Items not yet attempted or needing a fresh approach after failed verification.

### Bugs

*(none)*

### Features

#### Launch-day blockers (do before HN day)

*(none — both launch-day blockers shipped 2026-05-07; see Needs Verification)*

#### Amplifier outreach (Week 1 of marketing plan)

- **Submit AI Engineer World's Fair CFP** — Title: `Agents First: Designing Products When Your User Is a Tool Call`. Abstract drawn from `docs/marketing-plan.md` Week 1 plan: 8 implementation principles + 7 anti-patterns + 545 CF startups. Closes ~6 weeks pre-event (June 2026). (added 2026-05-05)
_3 amplifier DMs (patio11, cramforce, mappletons) moved to **## Deferred to Radar** on 2026-05-16 — same Social-lane native coverage as swyx/Simon deferred above._

#### Cascade pitches (Week 3–4 of marketing plan)

_All 4 cascade pitches (Stratechery, The Information, AI Engineer Newsletter, Lenny's) moved to **## Deferred to Radar** on 2026-05-16 — radar's Other-lane will propose press/newsletter pitches when an adjacent ecosystem signal warrants it._

#### Strategic partnerships (multi-month BD)

- **get us design office and airbnb founder to endorse and use agentsfirst for a government service** (added 2026-05-16 via /todo) — Two-pronged BD wedge that, if landed, jumps the framework from "adopted by Cloudflare and a few devtool vendors" to "adopted by the federal government's design org with an Airbnb-founder endorsement attached." Mechanics:
  - **US Design Office:** likely target = [USDS](https://www.usds.gov/) (US Digital Service, OMB) or [18F](https://18f.gsa.gov/) (GSA) or both. Both already run AI/agent pilots. The ask: pick one federal-facing service (FAFSA renewal? IRS Free File? VA benefits portal?) and design it agent-first against the Agents First rubric. The government-service endorsement is the highest-trust adopter signal we could get.
  - **Brian Chesky (Airbnb):** Chesky's design background + the "design-led AI" framing he's been pushing publicly makes Agents First a natural fit. The ask: a one-quote endorsement we can publish ("Designing for AI customers is the next discipline"), or co-author a piece. His name on the thesis page is a force-multiplier for the design-org enterprise pitch.
  - **Why pair them:** the Chesky endorsement gives Agents First design-credibility that opens the USDS door. The USDS engagement gives Chesky a concrete govt-service case study to point at. Each ask is more landable when the other is in motion.
  - **First moves (your call):** (a) draft a one-pager pitch for both, (b) figure out warm-intro paths — Capital Factory portfolio companies that have USDS contracts? Y Combinator alumni network for Chesky? (c) decide whether to lead with Chesky (faster, smaller commit) or USDS (slower, bigger payoff).
  - **Why this is NOT a radar item:** multi-month BD strategy with judgment calls only Josh can make. Radar can't propose this; it lives here until acted on.

#### Recurring distribution

- **Agent Readiness Reports — bi-weekly Thursday scorecards.** Run `npx -y @capitalthought/agentsfirst-mcp` against a notable product, publish the score + report at `agentsfirst.dev/reports/<slug>/`, X thread + LinkedIn article + courtesy DM to the company. Cadence: every other Thursday. Goal: weaponize the scorer as a distribution engine; canonize the principles + anti-patterns vocabulary one named company at a time. Full strategy in `docs/marketing-plan.md` "Agent Readiness Reports" section. First 10 targets ranked there. (added 2026-05-05)
  - **Report 1 (suggested):** Cloudflare — they wrote the Agent Readiness Score post we cite. Should score Level 3. Reinforces our citation + theirs; potentially co-published.
  - **Report 2:** Anthropic — owns MCP. The framework gets canonized if they're at Level 3+; if they're not, that's the bigger story.
  - **Report 3:** Stripe — the canonical "API as a product" company.
  - **Report 4:** Linear — clean MCP server, engineering audience reposts well.
  - **Report 5:** Vercel — heavy agent-infra investment; mid-Level 3 expected.
- **Anti-Pattern of the Month LinkedIn series** — Josh authors monthly post naming a real product (anonymized) committing each anti-pattern. Enterprise architects screenshot into design-review decks. Goal: build the thesis into named industry vocabulary. *Subsumed-or-paired with the bi-weekly Agent Readiness Reports above — each report names its dominant anti-pattern, so the monthly LinkedIn rollup becomes a "best-of" digest.* (added 2026-05-05)
- **CF Innovation Council "Agents First Council"** — half-day private summit at CF Austin, Q3 2026. Output: signed "Agents First Charter." Tactic per `docs/marketing-plan.md` enterprise GTM track. (added 2026-05-05)
- [x] **Build `/scorecard` skill** ✅ (resolved 2026-05-14 via /todo gonuts) — shipped as `~/.claude/skills/scorecard/SKILL.md` 2026-05-07 + smoke-verified against self (75/100 Level 3 from hosted scorer). See NV item 1 for verification details. (added 2026-05-05)

### Improvements

#### From `/scorecard cloudflare` 2026-05-14 (Report 1 of biweekly cadence shipped)

> Source: commit `8b0f5ac`. Cloudflare scored 85/100 Level 3 on www.cloudflare.com (re-score against rubric v0.3.2; original 2026-05-06 probe was 35/100). Real movement — they shipped /AGENTS.md, /agents.json, named-bot robots.txt, Content-Signal between probes. Variance is the story: dev portal lags at 35/100, blog at 15/100. Live at <https://agentsfirst.dev/reports/cloudflare/>. Full launch package staged in `reports/cloudflare/` — index.md, x-thread.md, linkedin.md, courtesy-dm.md.

_3 launch-packet items (Brendan LI DM, X thread, LinkedIn post) moved to **## Deferred to Radar** on 2026-05-16 — radar's Social lane will re-propose with current context (the 2026-05-16 regen surfaced blog 15→0 which the original packet didn't reflect)._

#### From `/agentsfirst-check` 2026-05-14 (1 of 6 recs still in flight)

> Source: `docs/checks/2026-05-14.md`. 5 of 6 recs auto-verified live (see Needs Verification / Improvements above). The 6th — Vercel-receipts X thread — shipped tweet 1 only; daily X cap (1/1) blocks the rest until tomorrow.

_Vercel tweets 2/3/4 moved to **## Deferred to Radar** on 2026-05-16 — though radar coverage is partial here: it'll propose new Vercel social on new signal, but won't natively pick up an in-flight thread mid-flight. Worth a follow-up: teach radar to detect in-flight threads via `state.recommendations` lookup before proposing a fresh Vercel rec._

#### From `/agentsfirst-check` 2026-05-07 (ALL 12 recs shipped)

> Source: `docs/checks/2026-05-07.md`. 12 of 12 recs accepted across commits c98fba9, a6513fb, 7baa96e, aeddb37, 2c8885e, dc32b1a, 4b172d8. See `state.json` for accepted IDs. Outreach drafts (61c273f6 AWS post + ccd0c45e Timothy DM) are ready in `docs/drafts/` — Josh's call when to send.

**Items still pending Josh action (drafts ready; require human send):**

_AWS quick-take + Timothy DM moved to **## Deferred to Radar** on 2026-05-16 — both have pre-staged drafts in `docs/drafts/`. Radar coverage is partial (no draft-dir scanner yet); follow-up filed below. The 48h launch window on AWS has lapsed — radar may decide it's stale and dismiss._

- **Wire a14y integration into `score_website`** — feasibility confirmed (spike at `docs/drafts/2026-05-07-a14y-integration-spike.md`). Wait until Timothy responds before implementing — Path C (their hosted endpoint) is best.

#### From `/multipov-plan` pass-2 on radar design 2026-05-15 (3 sprawl nits — watch for sprawl after v1)

> Source: `docs/plans/2026-05-15-agentsfirst-radar-design.md` pass-2 review (job `e246590c-3d73-4cb4-99e5-ee714d18bd35`). Persona `ruthless-simplifier-pm` self-rated 2/5 relevance and only `gpt4o` of her four-model fanout returned structured findings. All 3 are general "watch for sprawl" notes, not specific objections to the pass-1 hardening additions. Park here; revisit after the radar ships and a month of real usage shows whether the sprawl is real.

- **Watch: dispatch lanes (Website / Social / Other) may overlap and add cognitive load** — Maya flagged the 3-lane compartmentalization as introducing unnecessary complexity. No specific consolidation target. Revisit if accept rates within one lane consistently outperform the others or if briefing rendering grows awkward. (added 2026-05-15)
- **Watch: state schema sprawl (multiple state files + many zod records) may become a maintenance burden** — Maya flagged the typed state shape as growing toward operational overhead. No specific consolidation target. Revisit if schema migrations get painful or state debugging becomes routine. (added 2026-05-15)
- **Watch: iMessage HITL grammar + multiple MCP tool layers add operator friction** — Maya flagged the 6-rule grammar + the multi-tool MCP surface as cognitive load. No specific simplification target. Revisit if Josh's reply error rate (`state/imsg-unparsed.jsonl` volume) climbs above 5% in the first month. (added 2026-05-15)

#### Other improvements

- [x] **Fix `tools/scoreboard-updater/update.mjs` to regenerate prose when scores move** ✅ (resolved 2026-05-16 via /todo yours) — shipped option (b): updater calls Anthropic API (opus-4-7) to regenerate `index.md` body + `x-thread.md` + `linkedin.md` + `courtesy-dm.md` when ANY surface score moves (not just headline — the previous bug skipped regen when blog drifted but headline held). Added: per-URL movement detection, `max_tokens=16384` with `stop_reason='max_tokens'` truncation guard, static-trailer carve-out (Giscus widget + methodology footer preserved verbatim), `--force-regen` ops flag, prose-regen count in workflow commit subject. Smoke-tested against cloudflare: caught blog 15→0 movement that the old code would have missed; all 4 files regenerated cleanly with trailer intact. Cost: ~$0.40 per moved report (Opus). (added 2026-05-14)
- **Add web traffic report to `/agentsfirst-check`** — once GA4 + CF Web Analytics tokens are wired (placeholders in `_includes/head-custom.html`), extend the weekly check skill to pull a traffic snapshot for the window: GA4 sessions / users / top pages via `mcp__google-analytics__run_report`, plus CF Web Analytics aggregates (visits, requests, top countries, top referrers) via the CF GraphQL Analytics API. Surface as a new "📈 Traffic since last check" section in the dated report so we see week-over-week movement on agentsfirst.dev alongside ecosystem signal. (added 2026-05-07)
- [x] **Delete orphan `agentsfirst-mcp` Worker in Capital Factory CF account** ✅ (resolved 2026-05-16 via /todo yours) — deleted via path B (CF API DELETE) using token from 1P item `e2o365g6hobmxl3b4pql4nsiie`. Response: `{success: true, id: 0c3911951a8245b292e291c6378661b8}`. The "Touch ID doesn't surface" hypothesis was wrong — per the new `op-cli-just-try-it` learning, `op item get --reveal` works directly without a `signin`. Live joshshop deploy at `agentsfirst.dev/mcp` unaffected (independent account). (added 2026-05-05)
- **Positioning: "AEO is table stakes; Agent First is the level above"** (added 2026-06-06 via /todo) — Mark Cuban Companies sent a portfolio-wide newsletter ("The MCC Business Edge", ~June 2026) telling 200+ founders their sites are "AI-invisible" (55% have ≤10 AI citations) and pitching Answer Engine Optimization (AEO) + a "talk to our AI expert" CTA (resident AI expert: QuHarrison Terry, Head of Growth Marketing at MCC). This validates the thesis to a mainstream-VC audience but stops one level short: **AEO gets you CITED** (Level 1→2, findable/quotable) — where Cuban's memo ends; **Agent First gets you TRANSACTED WITH** (Level 3→4, MCP/typed tools/AGENTS.md) — the level above, unmentioned. Content angle for `index.md` / a `/reports/` piece / launch package: *"Citations are table stakes. Here's the ladder above them."* Killer proof points from a 2026-06-06 `/agentsfirst` run on 3 MCC portfolio cos: **(1)** Cuban's own flagship **Cost Plus Drugs** (costplusdrugs.com) is behind a Cloudflare bot-challenge that 403s agents on everything — it would *fail Cuban's own newsletter test* (~Level 0, hostile); **(2)** **Magnolia Pictures** = bare site, robots+sitemap only (~Level 0, Invisible Product); **(3)** **Tipsy Elves** scored best (~58/100, Level 2) but *entirely* via Shopify-provided boilerplate (llms.txt, AGENTS.md, markdown negotiation, a working shop.app purchase skill) — it didn't write an AEO strategy, it just rode a platform going Agent First underneath it. Two narratives: *"even the guru's flagship fails the test"* + *"the platform did the work, not the founder."* Pairs with the Cloudflare-scorecard cadence already in this repo.

---

## Deferred to Radar

Items the `agentsfirst-radar` (private companion repo at `capitalthought/agentsfirst-radar`) is now expected to re-propose with current context. The radar's morning briefing surfaces these into iMessage when the underlying signal is fresh enough to warrant action; if a deferred item ages out without the radar re-surfacing it, the signal has gone stale and we shouldn't act on it from a manual checklist either.

**Caveats:**
- Radar isn't producing real signal yet — 5 source-integration bugs (gh PATH · grok env · Bluesky auth · CF ARS · RSSHub) blocking the first real briefing. Tracked in the private repo's `/todo`.
- Pre-staged drafts in `docs/drafts/` are radar-blind until a draft-dir scanner lands (follow-up filed below).
- In-flight social threads (where one tweet shipped + 2-3 are pending) are radar-blind until the planner learns to read `state.recommendations` for shipped-but-incomplete chains (follow-up filed below).

### Deferred items (moved 2026-05-16)

#### Amplifier outreach (radar Social-lane native)
- **DM swyx (Latent Space)** — pitch podcast booking + day-of quote-tweet ask. Highest-leverage single DM per marketing plan. Radar will re-propose when a swyx signal fires (LinkedIn cross-post, Latent Space episode launch, X thread on adjacent topic). (added 2026-05-05, deferred 2026-05-16)
- **DM Simon Willison** — substantive cold note, ask for "60 seconds of skepticism." Single blog mention by him bootstraps the thesis into technical canon. Radar will re-propose on Simon signal (he posts on llms.txt / agents weekly). (added 2026-05-05, deferred 2026-05-16)
- **DM Patrick McKenzie (@patio11)** — pitch HN seeded comment + RT. Radar will re-propose when patio11 posts on adjacent territory (distribution / pricing for agent products is in his sources.json `x_handles` list). (added 2026-05-05, deferred 2026-05-16)
- **DM David Cramer (Sentry, @cramforce)** — Austin warm path, devtools peer endorsement. Radar will re-propose on Sentry / agent-observability signal. (added 2026-05-05, deferred 2026-05-16)
- **DM Maggie Appleton (@Mappletons)** — right audience for the "two customers" framing. Radar tracks Maggie's LinkedIn + Bluesky in sources.json; will re-propose on her next post about agent-as-customer or concept-essay territory. (added 2026-05-05, deferred 2026-05-16)

#### Cascade pitches (radar Other-lane will propose when adjacent signal hits)
- **Stratechery citation pitch (Ben Thompson)** — 200-word note: "Adoption Levels 0–4 give you the same analytical scaffold for agents that 'aggregator vs platform' did for the 2010s." Send the levels table + the 99.9% Cloudflare Code Mode stat. No exclusive needed. Radar Other-lane will surface as a `conference-cfp`-adjacent rec when a Ben Thompson essay touches AI-agent territory. (added 2026-05-05, deferred 2026-05-16)
- **The Information pitch** — angle: "Austin VC to portfolio: ship an agent interface or you're invisible by 2028." Offer exclusive first-print + Josh on record with portfolio data. Radar will surface when an enterprise-agent story breaks worth attaching to. (added 2026-05-05, deferred 2026-05-16)
- **AI Engineer Newsletter pitch** — pitch as a checklist issue: "the 7 things to audit in your MCP server this week." Exclusive standalone artifact. Radar will surface when a new MCP-adjacent rubric movement gives the checklist fresh material. (added 2026-05-05, deferred 2026-05-16)
- **Lenny's Newsletter guest post** (NOT interview — cheaper) — reframe for PMs: "two customers" + Visible Outputs + Prep Gates as PM discipline. Radar will surface when a Lenny-audience signal hits (PM-tooling launch, product-as-API trend post). (added 2026-05-05, deferred 2026-05-16)

#### Launch packets — wait for radar's next probe
- **Cloudflare report 3-message launch** (DM Brendan → X thread → LinkedIn post, files at `reports/cloudflare/{courtesy-dm,x-thread,linkedin}.md`). Radar will detect the next CF surface movement (blog 15→0 already caught on 2026-05-16) and either propose re-shipping the packet or surface a new finding worth packaging. (added 2026-05-14, deferred 2026-05-16)

#### In-flight threads (radar partial coverage)
- **Send tweets 2/3/4 of the Vercel-receipts thread** (rec `bbef43d0`, tweet 1 shipped to <https://x.com/i/web/status/2054993868693594317> on 2026-05-14). Generation lineage: `gen_mp5teurj_j0q95pfj`. Radar today wouldn't natively pick this up mid-flight — see follow-up below. If a new Vercel signal lands, radar may propose a fresh thread instead. (added 2026-05-14, deferred 2026-05-16)

#### Pre-staged drafts (radar-blind until draft-dir scanner lands)
- **Send AWS AgentCore quick-take X thread + LI post** — draft at `docs/drafts/2026-05-07-x-aws-agentcore-quicktake.md`. Original 48h launch window from 2026-05-07 has lapsed. Radar would only propose a fresh AWS take if new AWS-side signal hits — the staged draft is likely stale at this point. (added 2026-05-07, deferred 2026-05-16)
- **Send DM to Timothy Jordan (a14y maintainer)** — draft at `docs/drafts/2026-05-07-dm-timothy-jordan-a14y.md`. Two variants prepared (X DM + GitHub issue). Radar would re-propose a Timothy outreach only if a fresh a14y signal hits. (added 2026-05-07, deferred 2026-05-16)

### Follow-ups for the private radar repo (not for this repo's queue)

The two coverage gaps above should land in `capitalthought/agentsfirst-radar`'s todo, not here:

1. **draft-dir scanner** — Add a source kind `local_drafts` that scans `docs/drafts/*.md` on the public agentsfirst repo via raw.githubusercontent.com. Treat each draft as a TriagedItem with freshness gating (drafts >14 days old are auto-classified as `noise`). Unblocks the AWS / Timothy class of items.
2. **In-flight thread detector** — Before the planner proposes a fresh social rec, query `state.recommendations` for any open/in_flight rec whose `parent_event_id` overlaps the new signal's source URLs. If found, generate a "continue the thread" rec instead of a fresh one (preserves `generation_id` lineage). Unblocks the Vercel-tweets class.

(File those in the radar repo's todo.md when you do the next `cd ~/Xcode/agentsfirst-radar && /todo`.)

---

## Done

Verified working items have been moved to [todolist-archive.md](todolist-archive.md).
