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

- **`/scorecard` Claude Code skill shipped** — full Agent Readiness Report launch package in one shot (probe → score → index.md + x-thread.md + linkedin.md + courtesy-dm.md → OG card → scoreboard → commit). Lives at `~/.claude/skills/scorecard/SKILL.md` (iCloud-synced). Replaces the manual /reports/* workflow used for the first 11 reports. **Verify by running it against any new target.** (added 2026-05-07)
- **`@capitalthought/agentsfirst-mcp@0.2.0` published to npm** — rubric promotes /AGENTS.md from 10pts → 15pts (canonical contract artifact); demotes /llms.txt from 10pts → 5pts (10% adoption per SE Ranking, Google declined to support); credits /agents.json + /sitemap-index.xml. Hosted scorer at agentsfirst.dev/mcp already runs this rubric. Git tagged `agentsfirst-mcp-v0.2.0`. **Verify with `npx -y @capitalthought/agentsfirst-mcp@0.2.0`** against any target. (added 2026-05-07)

### Improvements

*(none)*

---

## Open

Items not yet attempted or needing a fresh approach after failed verification.

### Bugs

*(none)*

### Features

#### Launch-day blockers (do before HN day)

- **`npm publish --access public`** for `@capitalthought/create-agents-first` v0.1.0. Granular access token scoped to `@capitalthought` with bypass-2fa enabled, in 1Password Employee vault. Smoke-tested locally — package is ready. (added 2026-05-05)

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

#### From `/agentsfirst-check` 2026-05-07 (recommendations)

> Source: `docs/checks/2026-05-07.md`. Twelve recs, none yet accepted/dismissed. Recommended bundle: 498d3294 + 9eced7e5 + 1be408d3 + 8e8791ba into one PR labeled "v0.6 → v0.7 — AGENTS.md quality clause + a14y citation + SEP-2567 rubric update".

**🎯 Document lane (`index.md` + `~/icloud/Documents/agents-first.md`):**

- **[498d3294] Add nuance to Principle 2: minimal hand-authored AGENTS.md > LLM-generated bloat.** Cite oliviscusAI / logic_star_ai 4-agent / 438-task research (2026-05-07) showing LLM-generated AGENTS.md *hurt* agent success rates. Suggested edit drafted in report. (added 2026-05-07)
- **[8e8791ba] Add a14y.dev v0.2.0 to "Comparison" section** alongside Cloudflare ARS. a14y is the closest parallel project — 38 versioned web checks, runnable scorecard. Frame as complementary layers (their spec, our framework). Suggested subsection drafted in report. (added 2026-05-07)
- **[f7e47197] Cite AWS Bedrock AgentCore Payments + x402/AP2/MPP/ACP** in Principle 5 (Visible Outputs) or "The shift" section. AWS launch 2026-05-07 makes the agent economy concrete. (added 2026-05-07)
- **[b2616e45] Add AGENTS.md research bullet to "What Agents First gets wrong" section** (`index.md:170`). Owning the empirical pushback on home turf > letting amplifiers find it as the gotcha. Lands in same PR as 498d3294. (added 2026-05-07)

**🛠️ Product lane (rubric / probe / scorer / scaffold):**

- **[1be408d3] Update rubric for MCP SEP-2567 (sessionless MCP).** SEP-2567 merged to spec main 2026-05-07T17:34Z. `tools/list` MUST NOT depend on per-connection state. Add: -2pts if server requires `Mcp-Session-Id`; +3pts for stateless `tools/list` (verify by comparing two cold connections at same `(deployment, auth)`). Bump rubric v0.1.4 → v0.1.5. ~half-day. (added 2026-05-07)
- **[9eced7e5] Penalize bloated AGENTS.md (>2000 tokens) in rubric.** Token tiers: 0–1500 +5pts, 1500–3000 +3pts, 3000–6000 +1pt, >6000 0pts + warning. Probe counts char/4. ~1h. (added 2026-05-07)
- **[3e5abed1] Reference (don't reimplement) a14y's 38 checks in `score_website`.** Spike: shell out to `npx a14y <url> --json` from the Worker (cache 1h), surface a14y's per-check pass/fail next to our 8-principle score. Coordinate with Timothy Jordan (ccd0c45e) before wiring. ~1h spike, ~half-day to wire. (added 2026-05-07)
- **[2dd9dc6e] Probe heuristic to detect LLM-generated AGENTS.md.** Flag if has all of `## Project Structure / Commands / Code Style / Testing` + >50% generic 1-line bullets + no project-specific identifiers in first 500 tokens. Defer if 9eced7e5 ships first. ~1h. (added 2026-05-07)
- **[d2e9952b] Add openai-agents-python v0.16 server-prefixed tool naming guidance to AGENTS.md scaffold template** (`@capitalthought/create-agents-first`). One paragraph append on tool-name collision avoidance. ~10 min. (added 2026-05-07)

**📢 Marketing lane:**

- **[ccd0c45e] DM Timothy Jordan (a14y maintainer) proposing mutual citation.** Window ~14 days before SEO graph hardens. Pitch as peer + complementary layers, single ask (mutual link). Verify handle first. ~30 min. (added 2026-05-07)
- **[c76cfba8] Reply to oliviscusAI X thread on AGENTS.md skepticism** — agree with research, layer on Principle 2 framing. Only post AFTER 498d3294 ships (the reply claims "updates today"). Draft in report. ~15 min. (added 2026-05-07)
- **[61c273f6] Quick-take post: "AWS just shipped Principle 5 (Visible Outputs)"** — X thread + LinkedIn. 24–48h window from AWS launch (2026-05-07). Draft tweet in report. Schedule for AM Pacific to catch West Coast tech-news cycle. ~30 min. (added 2026-05-07)

#### Other improvements

- **Add web traffic report to `/agentsfirst-check`** — once GA4 + CF Web Analytics tokens are wired (placeholders in `_includes/head-custom.html`), extend the weekly check skill to pull a traffic snapshot for the window: GA4 sessions / users / top pages via `mcp__google-analytics__run_report`, plus CF Web Analytics aggregates (visits, requests, top countries, top referrers) via the CF GraphQL Analytics API. Surface as a new "📈 Traffic since last check" section in the dated report so we see week-over-week movement on agentsfirst.dev alongside ecosystem signal. (added 2026-05-07)
- **Redo `og-image.png`** — current 1200×630 visually still says "Agent First." Needs new card with "Agents First" + the two-customers tagline. Binary file, can't sed. ~5-min Figma job. (added 2026-05-05)
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
