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

*(none)*

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

- **Anti-Pattern of the Month LinkedIn series** — Josh authors monthly post naming a real product (anonymized) committing each anti-pattern. Enterprise architects screenshot into design-review decks. Goal: build the thesis into named industry vocabulary. (added 2026-05-05)
- **CF Innovation Council "Agents First Council"** — half-day private summit at CF Austin, Q3 2026. Output: signed "Agents First Charter." Tactic per `docs/marketing-plan.md` enterprise GTM track. (added 2026-05-05)

### Improvements

- **Redo `og-image.png`** — current 1200×630 visually still says "Agent First." Needs new card with "Agents First" + the two-customers tagline. Binary file, can't sed. ~5-min Figma job. (added 2026-05-05)

---

## Done

Verified working items have been moved to [todolist-archive.md](todolist-archive.md).
