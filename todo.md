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

- **`/scorecard` Claude Code skill shipped** — full Agent Readiness Report launch package in one shot (probe → score → index.md + x-thread.md + linkedin.md + courtesy-dm.md → OG card → scoreboard → commit). Lives at `~/.claude/skills/scorecard/SKILL.md` (iCloud-synced). Replaces the manual /reports/* workflow used for the first 11 reports. **Smoke-tested 2026-05-07 — hosted scorer at agentsfirst.dev/mcp returns 75/100 Level 3 for self.** Full end-to-end run against a new target still pending. (added 2026-05-07, smoke-verified 2026-05-07)
- **`@capitalthought/agentsfirst-mcp@0.2.0` published to npm** — rubric promotes /AGENTS.md from 10pts → 15pts (canonical contract artifact); demotes /llms.txt from 10pts → 5pts (10% adoption per SE Ranking, Google declined to support); credits /agents.json + /sitemap-index.xml. Hosted scorer at agentsfirst.dev/mcp already runs this rubric. Git tagged `agentsfirst-mcp-v0.2.0`. **Verify with `npx -y @capitalthought/agentsfirst-mcp@0.2.0`** against any target. (added 2026-05-07) — **superseded by v0.3.0 below; both still work**
- **`@capitalthought/agentsfirst-mcp@0.3.2` published + worker deployed** (commits aeddb37 + 2c8885e + wrangler version `7aa1f1e4`) — rubric v0.3.0 with tiered AGENTS.md scoring (≤1500 +5, ≤3000 +3, ≤6000 +1, >6000 0pts + Token Dump warning), SEP-2567 sessionless-MCP detection (refined regex — 0 false positives on self-test), and LLM-gen template heuristic. v0.3.2 wired the Token Dump anti-pattern through the canonical `principles.ts` enum + server.ts z.enum + prep.ts count check (v0.3.1 was a transient publish that missed those). **Verify by `npx -y @capitalthought/agentsfirst-mcp@latest score_codebase` against any repo, OR `curl https://agentsfirst.dev/mcp` and check `get_anti_pattern` enum includes `token-dump`.** Self-score: 65/100 Level 3 (was 61 before the SEP-2567 regex fix). (shipped 2026-05-07, npm + worker live)
- **Thesis v0.8 + Token Dump anti-pattern + a14y comparison + Principle 2 quality clause + AWS AgentCore citation shipped** (commits c98fba9, dc32b1a) — bundles 5 of 12 recs (498d3294, 8e8791ba, 9eced7e5, 1be408d3, b2616e45, f7e47197). Pages auto-deploys on push. Verify by visiting agentsfirst.dev and checking "The Token Dump" under anti-patterns + "Versus a14y" subsection + AWS Bedrock AgentCore Payments paragraph in "The shift". (shipped 2026-05-07)
- **X reply to oliviscusAI thread sent** (rec c76cfba8) — replied to https://x.com/oliviscusAI/status/2052337431291244986 with the drafted text in `docs/drafts/2026-05-07-x-reply-oliviscusai-agents-md.md`. Watch for engagement; if oliviscusAI responds, that's the moment to share `npx -y @capitalthought/agentsfirst-mcp` and offer to score their setup. (sent 2026-05-07)
- **og-image.png refreshed** — idempotent generator at `tools/og-card/generate-root.py`. Now matches per-page card brand language with version badge "v0.8 · May 2026" for cache-busting on each thesis bump. (shipped 2026-05-07)
- **Scaffold v0.1.1 — `create-agents-first` published to npm** — adds Token Dump anti-pattern warning + openai-agents-python v0.16 tool-naming guidance (`include_server_in_tool_names`). Template still 1203 tokens (~83 lines), comfortably in tier 1 (lean) of the new rubric. **Verify with `npx -y @capitalthought/create-agents-first@latest`.** (shipped 2026-05-07)
- **11 reports re-scored against deployed v0.3.2 rubric** (commit 9551336, weekly auto-refresh workflow run #25529295359) — 0 score movements (expected: v0.3.0 changes were codebase-side; website rubric unchanged). Confirms the deploy was clean and didn't regress any of the published Agent Readiness Reports.
- **3 outreach + spike drafts persisted** (commit 4b172d8): AWS quick-take post (rec 61c273f6) at `docs/drafts/2026-05-07-x-aws-agentcore-quicktake.md`; Timothy Jordan / a14y DM (rec ccd0c45e) at `docs/drafts/2026-05-07-dm-timothy-jordan-a14y.md`; a14y integration spike findings (rec 3e5abed1) at `docs/drafts/2026-05-07-a14y-integration-spike.md`. Drafts ready for Josh review + post/send.

### Improvements

*(none)*

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
- **Build `/scorecard` skill** — Claude Code skill that takes a company name + URL, runs the full pipeline (probe → score → draft post + X thread + LinkedIn variant + courtesy DM), lands all three drafts on the clipboard. ~1 hour to build. Build after the first 3-5 manual reports validate the format. (added 2026-05-05)

### Improvements

#### From `/agentsfirst-check` 2026-05-07 (ALL 12 recs shipped)

> Source: `docs/checks/2026-05-07.md`. 12 of 12 recs accepted across commits c98fba9, a6513fb, 7baa96e, aeddb37, 2c8885e, dc32b1a, 4b172d8. See `state.json` for accepted IDs. Outreach drafts (61c273f6 AWS post + ccd0c45e Timothy DM) are ready in `docs/drafts/` — Josh's call when to send.

**Items still pending Josh action (drafts ready; require human send):**

- **Send AWS AgentCore quick-take X thread + LI post** — draft at `docs/drafts/2026-05-07-x-aws-agentcore-quicktake.md`. 48h launch window from 2026-05-07. Best timing: AM Pacific.
- **Send DM to Timothy Jordan (a14y maintainer)** — draft at `docs/drafts/2026-05-07-dm-timothy-jordan-a14y.md`. Verify handle first. Two variants prepared (X DM + GitHub issue).
- **Wire a14y integration into `score_website`** — feasibility confirmed (spike at `docs/drafts/2026-05-07-a14y-integration-spike.md`). Wait until Timothy responds before implementing — Path C (their hosted endpoint) is best.

#### Other improvements

- **Add web traffic report to `/agentsfirst-check`** — once GA4 + CF Web Analytics tokens are wired (placeholders in `_includes/head-custom.html`), extend the weekly check skill to pull a traffic snapshot for the window: GA4 sessions / users / top pages via `mcp__google-analytics__run_report`, plus CF Web Analytics aggregates (visits, requests, top countries, top referrers) via the CF GraphQL Analytics API. Surface as a new "📈 Traffic since last check" section in the dated report so we see week-over-week movement on agentsfirst.dev alongside ecosystem signal. (added 2026-05-07)
- **Delete orphan `agentsfirst-mcp` Worker in Capital Factory CF account.** First two `wrangler deploy` attempts during the Layer C ship landed in account `8d9591939eb1efd797959aa9c68afd64` (cloudflare@capitalfactory.com OAuth), with no route binding. Harmless (no traffic, no charges) but messy. Cleanup needs Josh's hands because `op item get --reveal` and `op read` for the capitalfactory CF token both time out silently in Claude Code's bash subshell — Touch ID prompt doesn't surface. Two paths:
  - **A.** `npx wrangler logout && npx wrangler login` (browser → pick Capital Factory) → `npx wrangler delete agentsfirst-mcp --force` → log back into joshshop. ~30 sec.
  - **B.** Use the direct CF API in a shell where Touch ID works:
    ```bash
    TOKEN=$(op item get e2o365g6hobmxl3b4pql4nsiie --vault Employee --reveal --format=json \
      | jq -r '.fields[] | select(.type=="CONCEALED" and (.value|length>20)) | .value' | head -1)
    curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
      "https://api.cloudflare.com/client/v4/accounts/8d9591939eb1efd797959aa9c68afd64/workers/scripts/agentsfirst-mcp?force=true"
    ```
  Live joshshop deploy at `agentsfirst.dev/mcp` is unaffected by the orphan — independent account, separate route binding. (added 2026-05-05)

---

## Done

Verified working items have been moved to [todolist-archive.md](todolist-archive.md).
