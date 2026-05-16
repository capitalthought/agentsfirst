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
- **DM swyx (Latent Space)** — pitch podcast booking + day-of quote-tweet ask. Highest-leverage single DM per marketing plan; once swyx canonizes the vocabulary, downstream coverage cascades. ~200 words. (added 2026-05-05)
- **DM Simon Willison** — substantive cold note, ask for "60 seconds of skepticism." Single blog mention by him bootstraps the thesis into technical canon. (added 2026-05-05)
- **DM Patrick McKenzie (@patio11)** — pitch HN seeded comment + RT. (added 2026-05-05)
- **DM David Cramer (Sentry, @cramforce)** — Austin warm path, devtools peer endorsement. (added 2026-05-05)
- **DM Maggie Appleton (@Mappletons)** — has the right audience for the "two customers" framing. (added 2026-05-05)

#### Cascade pitches (Week 3–4 of marketing plan)

- **Stratechery citation pitch (Ben Thompson)** — 200-word note: "Adoption Levels 0–4 give you the same analytical scaffold for agents that 'aggregator vs platform' did for the 2010s." Send the levels table + the 99.9% Cloudflare Code Mode stat. No exclusive needed. (added 2026-05-05)
- **The Information pitch** — angle: "Austin VC to portfolio: ship an agent interface or you're invisible by 2028." Offer exclusive first-print + Josh on record with portfolio data. (added 2026-05-05)
- **AI Engineer Newsletter** — pitch as a checklist issue: "the 7 things to audit in your MCP server this week." Exclusive standalone artifact. (added 2026-05-05)
- **Lenny's Newsletter guest post** (NOT interview — cheaper) — reframe for PMs: "two customers" + Visible Outputs + Prep Gates as PM discipline. (added 2026-05-05)

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

- **Send courtesy DM to Brendan Irvine-Broque (Cloudflare) on LinkedIn** — body in `reports/cloudflare/courtesy-dm.md`. Send 12-24h BEFORE public posts (not after — recipient hearing about the score from Josh privately first is the difference between "courtesy" and "ambush"). **Verify @-handle before sending.** Fallback recipients in priority order: Matt Prince (CEO, reach tier — `linkedin.com/in/eastdakota`), John Graham-Cumming (CTO), Sam Rhea (Cloudflare Workers product). Wait 5 business days between sends; don't double-send to same person. (added 2026-05-14)
- **Post the Cloudflare X thread** — 7 tweets at `reports/cloudflare/x-thread.md`. Tweet 1 has NO link (X throttles); tag `@Cloudflare` and `@CloudflareDev` on tweet 1 only — **verify both handles before posting**. Tweet 7 carries the report URL. Daily X cap is 1; if you posted today already, ship tomorrow morning. Send AFTER the courtesy DM lands (12-24h gap). Use `/social-send` with the verbatim body from the file. (added 2026-05-14)
- **Post the Cloudflare LinkedIn version** — ~340 words at `reports/cloudflare/linkedin.md`. Polite tags Matt Prince / John Graham-Cumming / Brendan Irvine-Broque at the end — **verify all 3 LinkedIn handles before posting**. Send same day or +1 from the X thread. (added 2026-05-14)

#### From `/agentsfirst-check` 2026-05-14 (1 of 6 recs still in flight)

> Source: `docs/checks/2026-05-14.md`. 5 of 6 recs auto-verified live (see Needs Verification / Improvements above). The 6th — Vercel-receipts X thread — shipped tweet 1 only; daily X cap (1/1) blocks the rest until tomorrow.

- **Send tweets 2/3/4 of the Vercel-receipts thread** (rec `bbef43d0`) — tweet 1 shipped 2026-05-14 to <https://x.com/i/web/status/2054993868693594317> ("The receipts are in. @vercel just published…"). The thread plan from the check report: (2) frame what 58.9% tool-call tokens means; (3) so-what — tool-call success rate becomes the new conversion metric; (4) CTA to agentsfirst.dev. **X cap is 1/day**; ship tweets 2/3/4 starting tomorrow morning while the parent thread is still warm. Use `/social-draft` per tweet, link them as a reply chain. Generation lineage: `gen_mp5teurj_j0q95pfj`. (added 2026-05-14)

#### From `/agentsfirst-check` 2026-05-07 (ALL 12 recs shipped)

> Source: `docs/checks/2026-05-07.md`. 12 of 12 recs accepted across commits c98fba9, a6513fb, 7baa96e, aeddb37, 2c8885e, dc32b1a, 4b172d8. See `state.json` for accepted IDs. Outreach drafts (61c273f6 AWS post + ccd0c45e Timothy DM) are ready in `docs/drafts/` — Josh's call when to send.

**Items still pending Josh action (drafts ready; require human send):**

- **Send AWS AgentCore quick-take X thread + LI post** — draft at `docs/drafts/2026-05-07-x-aws-agentcore-quicktake.md`. 48h launch window from 2026-05-07. Best timing: AM Pacific.
- **Send DM to Timothy Jordan (a14y maintainer)** — draft at `docs/drafts/2026-05-07-dm-timothy-jordan-a14y.md`. Verify handle first. Two variants prepared (X DM + GitHub issue).
- **Wire a14y integration into `score_website`** — feasibility confirmed (spike at `docs/drafts/2026-05-07-a14y-integration-spike.md`). Wait until Timothy responds before implementing — Path C (their hosted endpoint) is best.

#### From `/multipov-plan` pass-2 on radar design 2026-05-15 (3 sprawl nits — watch for sprawl after v1)

> Source: `docs/plans/2026-05-15-agentsfirst-radar-design.md` pass-2 review (job `e246590c-3d73-4cb4-99e5-ee714d18bd35`). Persona `ruthless-simplifier-pm` self-rated 2/5 relevance and only `gpt4o` of her four-model fanout returned structured findings. All 3 are general "watch for sprawl" notes, not specific objections to the pass-1 hardening additions. Park here; revisit after the radar ships and a month of real usage shows whether the sprawl is real.

- **Watch: dispatch lanes (Website / Social / Other) may overlap and add cognitive load** — Maya flagged the 3-lane compartmentalization as introducing unnecessary complexity. No specific consolidation target. Revisit if accept rates within one lane consistently outperform the others or if briefing rendering grows awkward. (added 2026-05-15)
- **Watch: state schema sprawl (multiple state files + many zod records) may become a maintenance burden** — Maya flagged the typed state shape as growing toward operational overhead. No specific consolidation target. Revisit if schema migrations get painful or state debugging becomes routine. (added 2026-05-15)
- **Watch: iMessage HITL grammar + multiple MCP tool layers add operator friction** — Maya flagged the 6-rule grammar + the multi-tool MCP surface as cognitive load. No specific simplification target. Revisit if Josh's reply error rate (`state/imsg-unparsed.jsonl` volume) climbs above 5% in the first month. (added 2026-05-15)

#### Other improvements

- **Fix `tools/scoreboard-updater/update.mjs` to regenerate prose when scores move** (bug surfaced 2026-05-14 during `/scorecard cloudflare`) — the auto-updater bumps `report_score` + `report_level` in front matter when the live re-probe returns a different number, but does NOT regenerate the body prose, X thread, LinkedIn post, or courtesy DM. Result: Cloudflare ended up with `report_score: 85` in front matter alongside `"Score: 35/100 · Level 2"` in the body — exactly the embarrassing mismatch the `/scorecard` skill spec warns against. Sweep all 14 reports for similar drift: `for f in reports/*/index.md; do front=$(grep -E "^report_score:" "$f" | awk '{print $2}'); body=$(grep -oE "Score: [0-9]+/100" "$f" | head -1 | grep -oE "[0-9]+"); [ -n "$body" ] && [ "$front" != "$body" ] && echo "$f: front=$front body=$body"; done`. Fix options: (a) auto-updater detects score change → opens an issue / files a `bugs/incoming/` report instead of silently shipping the front-matter bump, OR (b) auto-updater also runs an LLM pass to regenerate the prose deltas, OR (c) auto-updater keeps front matter in sync with body but stops shipping standalone front-matter changes. (b) is the most user-aligned. (added 2026-05-14)
- **Add web traffic report to `/agentsfirst-check`** — once GA4 + CF Web Analytics tokens are wired (placeholders in `_includes/head-custom.html`), extend the weekly check skill to pull a traffic snapshot for the window: GA4 sessions / users / top pages via `mcp__google-analytics__run_report`, plus CF Web Analytics aggregates (visits, requests, top countries, top referrers) via the CF GraphQL Analytics API. Surface as a new "📈 Traffic since last check" section in the dated report so we see week-over-week movement on agentsfirst.dev alongside ecosystem signal. (added 2026-05-07)
- [x] **Delete orphan `agentsfirst-mcp` Worker in Capital Factory CF account** ✅ (resolved 2026-05-16 via /todo yours) — deleted via path B (CF API DELETE) using token from 1P item `e2o365g6hobmxl3b4pql4nsiie`. Response: `{success: true, id: 0c3911951a8245b292e291c6378661b8}`. The "Touch ID doesn't surface" hypothesis was wrong — per the new `op-cli-just-try-it` learning, `op item get --reveal` works directly without a `signin`. Live joshshop deploy at `agentsfirst.dev/mcp` unaffected (independent account). (added 2026-05-05)

---

## Done

Verified working items have been moved to [todolist-archive.md](todolist-archive.md).
