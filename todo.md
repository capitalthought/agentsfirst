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
- **`@capitalthought/agentsfirst-mcp@0.3.0` built locally (not yet published)** — rubric v0.3.0: tiered AGENTS.md scoring by token estimate (≤1500 +5, ≤3000 +3, ≤6000 +1, >6000 0pts + Token Dump warning) per the 4-agent / 438-task study; SEP-2567 sessionless-MCP detection (penalize servers using session/create / session/destroy / Mcp-Session-Id). Local self-score ran cleanly: 61/100 Level 3, both new tiers fired correctly. **Pending: `npm publish` of @capitalthought/agentsfirst-mcp@0.3.0 + `wrangler deploy` of agentsfirst-mcp-worker@0.3.0 to ship v0.3.0 rubric to production.** (added 2026-05-07, builds-clean 2026-05-07)
- **Thesis v0.8 + Token Dump anti-pattern + a14y comparison + Principle 2 quality clause shipped** (commit `c98fba9`) — bundles 4 of 12 recommendations from the 2026-05-07 check (498d3294 + 8e8791ba + 9eced7e5 + 1be408d3 + b2616e45). Pages auto-deploys on push to main; verify by visiting agentsfirst.dev and checking that "The Token Dump" appears under "What Agents First gets wrong" and "### Versus a14y" appears in the Comparison area. (added 2026-05-07, pushed 2026-05-07)
- **X reply to oliviscusAI thread sent** (rec c76cfba8) — replied to https://x.com/oliviscusAI/status/2052337431291244986 with the drafted text in `docs/drafts/2026-05-07-x-reply-oliviscusai-agents-md.md`. Watch for engagement; if oliviscusAI responds, that's the moment to share `npx -y @capitalthought/agentsfirst-mcp` and offer to score their setup. (added 2026-05-07, sent 2026-05-07)
- **og-image.png refreshed** — idempotent generator at `tools/og-card/generate-root.py`. Now matches per-page card brand language with version badge "v0.8 · May 2026" for cache-busting on each thesis bump. (added 2026-05-07)
- **Scaffold v0.1.1 — `create-agents-first` AGENTS.md template updated** — adds Token Dump anti-pattern warning + openai-agents-python v0.16 tool-naming guidance (`include_server_in_tool_names`). Template still 1203 tokens (~83 lines), comfortably in tier 1 (lean) of the new rubric. **Pending: `npm publish` of @capitalthought/create-agents-first@0.1.1.** (added 2026-05-07)

### Improvements

*(none)*

---

## Open

Items not yet attempted or needing a fresh approach after failed verification.

### Bugs

*(none)*

### Features

#### Launch-day blockers (do before HN day)

- **`npm publish --access public`** for `@capitalthought/create-agents-first` **v0.1.1** — v0.1.0 was published 2026-05-06 (`npm view @capitalthought/create-agents-first version` confirms). v0.1.1 is built locally with Token Dump warning + openai-agents-python v0.16 tool-naming guidance in the AGENTS.md template. Granular access token in 1Password Employee vault. Run from `tools/create-agents-first/`. (added 2026-05-05, v0.1.0 published 2026-05-06, v0.1.1 ready 2026-05-07)
- **`npm publish` `@capitalthought/agentsfirst-mcp@0.3.0` + `wrangler deploy` `agentsfirst-mcp-worker@0.3.0`** — rubric v0.3.0 (tiered AGENTS.md + SEP-2567) is built locally and self-tested but not yet in production. Without the deploy, agentsfirst.dev/mcp keeps returning v0.2.0 scores and the new `Token Dump` anti-pattern enum won't appear in `get_anti_pattern`. (added 2026-05-07)

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

#### From `/agentsfirst-check` 2026-05-07 (recommendations — 5 deferred, 7 shipped)

> Source: `docs/checks/2026-05-07.md`. 7 of 12 recs shipped 2026-05-07 in commits c98fba9 (bundle), a6513fb (scaffold), 7baa96e (X reply draft) — see Needs Verification. **5 remain open below.**

**🎯 Document lane:**

- **[f7e47197] Cite AWS Bedrock AgentCore Payments + x402/AP2/MPP/ACP** in Principle 5 (Visible Outputs) or "The shift" section. AWS launch 2026-05-07 makes the agent economy concrete. (added 2026-05-07)

**🛠️ Product lane:**

- **[3e5abed1] Reference (don't reimplement) a14y's 38 checks in `score_website`.** Spike: shell out to `npx a14y <url> --json` from the Worker (cache 1h), surface a14y's per-check pass/fail next to our 8-principle score. Coordinate with Timothy Jordan (ccd0c45e) before wiring. ~1h spike, ~half-day to wire. (added 2026-05-07)
- **[2dd9dc6e] Probe heuristic to detect LLM-generated AGENTS.md.** Flag if has all of `## Project Structure / Commands / Code Style / Testing` + >50% generic 1-line bullets + no project-specific identifiers in first 500 tokens. Token-count tier already shipped in 9eced7e5 (v0.3.0); this is the structural-shape complement. ~1h. (added 2026-05-07)
- **Refine probe regex for SEP-2567 false positives.** v0.3.0 self-score showed 10 session-API hits on agentsfirst itself — 4 real (CORS headers in worker `index.ts`) + 6 self-references in rubric rationale comments. Tighten the grep to skip comment lines, OR exclude the rubric source files when the target IS the agentsfirst repo. ~30 min. (added 2026-05-07)

**📢 Marketing lane:**

- **[ccd0c45e] DM Timothy Jordan (a14y maintainer) proposing mutual citation.** Window ~14 days before SEO graph hardens. Pitch as peer + complementary layers, single ask (mutual link). Verify handle first. ~30 min. (added 2026-05-07)
- **[61c273f6] Quick-take post: "AWS just shipped Principle 5 (Visible Outputs)"** — X thread + LinkedIn. 24–48h window from AWS launch (2026-05-07). Draft tweet in report. Schedule for AM Pacific to catch West Coast tech-news cycle. ~30 min. (added 2026-05-07)

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
