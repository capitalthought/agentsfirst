# agentsfirst-radar — Design Doc (2026-05-15)

**Status:** Plan-review draft (pre-implementation)
**Owner:** Josh Baer
**Predecessor skill:** `/agentsfirst-check` (manual, weekly)
**Live thesis target:** <https://agentsfirst.dev>
**Reviewer target:** /multipov-plan (8-person panel, deep mode)

---

## 1. Problem

`/agentsfirst-check` is a manual skill: Josh has to remember to fire it (~weekly), then transcribe its markdown report into commits, tweets, and Asana tasks himself. Every step between "the ecosystem moved" and "we shipped a response" has human friction.

Current state (5/15/2026):

- 11 dated reports under `docs/checks/`; 40 recommendations accepted, 0 dismissed → strong signal that the scout's *findings* are valuable but the dispatch is the bottleneck.
- The 2026-05-14 report's Google-llms.txt finding had a ~24h window. We surfaced the rec at ~6pm, Josh shipped the bundled commit `dfb1e81` later that evening. A morning briefing would have caught it 12 hours sooner and the social post would have ridden Lily Ray's reply thread (285 likes / 25 replies) while it was alive.
- Sources have decayed silently (Anthropic + Linear RSS 404'd for 4 runs before being noticed 2026-05-14). No source-health alerting today.
- No deduplication exists across briefings other than `seen_urls`. Recommendations are re-hashed each run from the rec text, but there's no concept of "this rec is now stale because the underlying X thread has died."

The job-to-be-done: **turn the scout into a daily cron that proposes three discrete, diff-shaped bundles of action — and lands them in front of Josh in iMessage where he already decides things.**

Non-goals:
- Auto-posting to X (HITL absolute).
- Auto-editing the canonical thesis (HITL absolute).
- Replacing `/agentsfirst-check`. The manual skill stays as the cold-start / deep-window / "what did we miss?" tool.
- Net-new data sources that require paid APIs.

---

## 2. Solution

A single nightly cron — **`agentsfirst-radar`** — running ~07:00 America/Chicago (12:00Z standard, 13:00Z DST), executing on the **joshhome self-hosted GitHub Actions runner** (always-on Mac Studio, already has `imsg`, chat.db, repo clone, Tailscale).

The cron produces one artifact and three dispatch outputs:

1. **Artifact (Visible Output, Principle 5):** `docs/checks/<YYYY-MM-DD>-radar.md` — the morning briefing, committed to `main`. (Suffixed `-radar.md` so manual `/agentsfirst-check` runs that still produce `<DATE>.md` don't collide.)
2. **Dispatch 1 — Website Updates lane:** ready-to-apply patches (`old → new` text blocks with `file:line` anchors) for `index.md`, `score.ts`, and `/reports/<vendor>/index.md`. Multi-model verified when the patch touches the canonical thesis or the rubric.
3. **Dispatch 2 — Social Drafts lane:** 1–3 ready-to-ship X posts (+ optional LinkedIn / Bluesky), each generated via `/social-draft` so Tier 1 handle-verify + Tier 2 fact-check + Tier 3 suppression + Tier 4 iMessage HITL all apply.
4. **Dispatch 3 — Other Moves lane:** ranked list of Asana tasks, rubric-version-bump candidates, `/reports/<vendor>` candidates, amplifier DMs, conference CFPs, "wall of adopters" entries, and stale-claim risks — each one shaped as a single PR or single Asana task.

iMessage delivery: a compact summary (the 3 lane headlines + one-tap link to the committed briefing) lands in Josh's 1:1 chat with `mikey@capitalfactory.com`. Reply-to-act: `accept <id>`, `dismiss <id>`, `defer <id> 7d`.

Multi-model verification (Principle 6) fires server-side via the multipov.ai MCP server for any recommendation where the blast radius is non-trivial:

| Recommendation type | Multi-model? |
|---|---|
| index.md edit (canonical thesis) | YES — plan review against the diff before surfacing |
| `score.ts` rubric weight change | YES — plan review |
| New `/reports/<vendor>/index.md` page | YES — visual + plan review |
| X / LinkedIn / Bluesky post | YES — already 4-LLM in /social-draft |
| Asana task creation | NO — single-model |
| "Wall of adopters" entry | NO — single-model |
| Stale-claim flag (info-only) | NO — single-model |

---

## 3. Data Flow

```
            ┌──────────────────────────────────────────────────────┐
07:00 CT →  │  GitHub Actions workflow                              │
            │   .github/workflows/agentsfirst-radar.yml             │
            │   runs-on: [self-hosted, joshhome]                    │
            └──────────────┬───────────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────────────────────────────┐
            │  STEP A — Prep Gate (Principle 3)                     │
            │   1Password creds, multipov MCP ping, social.relradar │
            │   ping, agentsfirst.dev/mcp ping, sources.json valid  │
            │   + COS skip flag check (`state/cos-skip-dates.json`) │
            │   → On failure: skip dispatch, write degraded briefing│
            │   → On COS skip: write one-line briefing              │
            │      "🛌 Skipped per COS calendar (<reason>)"          │
            │      and exit without fanout                          │
            └──────────────┬───────────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────────────────────────────┐
            │  STEP B — Source fan-out (parallel)                   │
            │   blogs[] · x_handles[] · x_queries[] · gh_releases[] │
            │   spec_diffs[] · web_searches[] · hn_frontpage        │
            │   linkedin_feeds[] · bluesky_handles[] · mcp_registry │
            │   cf_ars_top100 · cf_portfolio_companies              │
            └──────────────┬───────────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────────────────────────────┐
            │  STEP C — Dedup against state.seen_urls               │
            └──────────────┬───────────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────────────────────────────┐
            │  STEP D — Triage into 8 buckets (existing /check     │
            │   matrix: affirms / challenges / spec / launch /      │
            │   adopter / amplifier / stale / noise)                │
            │   [PROMPT-INJECTION BOUNDARY — reader LLM only]       │
            └──────────────┬───────────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────────────────────────────────┐
            │  STEP E — Lane-classify into Website / Social / Other │
            │   Each candidate gets a sha1[:8] rec_id (stable)      │
            │   [PROMPT-INJECTION BOUNDARY — output structured enum]│
            └──────┬───────────────────┬───────────────────┬──────┘
                   │                   │                   │
                   ▼                   ▼                   ▼
          ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐
          │ Website lane    │  │ Social lane     │  │ Other lane       │
          │ (multipov plan  │  │ (/social-draft  │  │ (single-model    │
          │  review for     │  │  HTTP, full     │  │  unless DM>10K)  │
          │  thesis edits)  │  │  safety pipe)   │  │                  │
          └────────┬───────┘  └────────┬───────┘  └────────┬────────┘
                   │                   │                   │
                   └─────────┬─────────┴─────────┬─────────┘
                             │                   │
                             ▼                   ▼
              ┌──────────────────────────────────────────────┐
              │  STEP F — Dedup against state.recommendations │
              │   Drop if accepted, dismissed, or in-flight   │
              │   (in-flight = accepted but no commit/PR yet) │
              └──────────────┬───────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────────────────────┐
              │  STEP G — Auto-expire stale (>3d undecided)   │
              │   Move to dismissed_recommendations w/ reason │
              │   "stale-no-action-72h"                       │
              └──────────────┬───────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────────────────────┐
              │  STEP H — Render briefing markdown            │
              │   (Mikey-Trafton voice, emoji-led bullets,    │
              │   Inspectable-State block at the top)         │
              └──────────────┬───────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────────────────────┐
              │  STEP I — Commit + Push                        │
              │   docs/checks/<YYYY-MM-DD>-radar.md           │
              │   state.json updates                          │
              └──────────────┬───────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────────────────────┐
              │  STEP J — iMessage HITL summary               │
              │   chat: mikey@capitalfactory.com 1:1           │
              │   body: 3-lane headline + commit URL           │
              └──────────────┬───────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────────────────────┐
              │  STEP K — Heartbeat Healthchecks.io           │
              │   Slug: agentsfirst-radar-daily               │
              └──────────────────────────────────────────────┘
```

### Data/control-plane separation (Steps D & E)

Steps D and E are prompt-injection boundaries. Source content from RSS feeds,
X posts, GitHub releases, HN posts, and scraped websites is untrusted text
that may carry instructions targeting the LLM. The radar enforces a strict
dual-LLM pattern across the two steps:

- **Reader LLM (Step D — triage)** — receives raw source content as data only.
  Output is restricted to a structured-enum classification per item: one of
  {affirms, challenges, spec, launch, adopter, amplifier, stale, noise} + a
  ≤200-char `summary_quote` field that is verbatim-extracted from the source
  (no LLM-generated prose). No free-text passthrough. Prompts use explicit
  system/user role separation with delimiters around source content
  ("BEGIN UNTRUSTED SOURCE / END UNTRUSTED SOURCE").
- **Planner LLM (Step E — lane classify + rec generation)** — receives ONLY
  the structured enum + summary_quote fields from the reader's output. Never
  sees the raw source content. Generates the recommendation body (diff text,
  social draft, Asana task text) from the structured signal plus its own
  knowledge of the rubric.

This means a prompt-injection payload in an RSS title can at worst flip a
classification or smuggle ≤200 chars of verbatim source into a `summary_quote`
field — it cannot make the planner generate a malicious diff or social post,
because the planner never sees the payload. The boundary is architectural,
not heuristic.

Reply path (Josh acting on the briefing):

```
iMessage reply "accept 22ea794e" →
  imsg-listener daemon (already running on joshhome) →
  mark state.recommendations[22ea794e].status = accepted →
  fire downstream actuator:
    - Website lane → open PR with the diff (still requires Josh's merge)
    - Social lane  → STEP 1: parsed accept → daemon replies "✅ Queued: <80-char preview>.
                              Reply CONFIRM <id> to publish, or CANCEL <id>."
                      STEP 2: explicit CONFIRM <id> → POST /confirm_publish to social.relradar.ai
                              (CANCEL <id> → status reverts to dismissed with reason "user-cancelled-at-confirm")
    - Other lane   → asana_create_task in "Radar: Triage" Asana project (UNASSIGNED — COS routes)
```

The agent never auto-merges PRs, never auto-publishes posts, never marks Josh's tasks done. **The agent proposes; Josh disposes.**

**Concurrency note:** the GHA cron writes `state/radar-state.json` at the end of each run; the
imsg-listener daemon on joshhome receives accept/dismiss/defer/confirm/cancel
events independently. To avoid a last-write-wins race, the daemon NEVER writes
`radar-state.json` directly. Instead, it appends one line per event to
`state/mutations.jsonl`. The next cron run's first step folds pending mutations
into `radar-state.json` (apply in order; mark each line as `applied: true` then
truncate the file after a successful push). This makes the cron the sole
writer of `radar-state.json`; the daemon is append-only on a separate file.

---

## 4. Changes (by layer)

### 4.1 Repo (this repo, `~/Xcode/agentsfirst/`)

```
.github/workflows/agentsfirst-radar.yml       NEW — daily cron, self-hosted joshhome
tools/agentsfirst-radar/
  AGENTS.md                                   NEW — see §6 (≤150 lines, hand-authored)
  src/
    state.ts                                  NEW — zod schema, see §5
    sources.ts                                NEW — typed re-shape of sources.json
    fanout.ts                                 NEW — parallel source scan
    triage.ts                                 NEW — bucket + lane classify
    recs/
      website.ts                              NEW — diff-shaped rec generator
      social.ts                               NEW — /social-draft caller
      other.ts                                NEW — asana / wall / cfp generator
    multipov.ts                               NEW — plan-review dispatcher
    handle-verify.ts                          NEW — grok --verify wrapper + allowlist
    briefing.ts                               NEW — markdown renderer (Mikey voice)
    imsg.ts                                   NEW — chat resolver + sender
    actuator.ts                               NEW — accept/dismiss/defer handler
    overview.ts                               NEW — Inspectable State MCP tool
  package.json                                NEW
  tsconfig.json                               NEW
  README.md                                   NEW
tools/agentsfirst-mcp/src/server.ts           EDIT — register radar_overview tool
state/                                        NEW dir
  radar-state.json                            NEW — runtime mutable state (GITIGNORED)
  snapshot-weekly.json                        NEW — committed weekly snapshot of stable fields (handle_allowlist, adopters, briefings); enables cold-recovery without committing the entire mutable runtime state
  last-run.txt                                NEW — committed every successful run; dead-man's-switch input (see R3)
  imsg-unparsed.jsonl                         NEW — append-only log of replies that failed the parser (gitignored; not committed)
  mutations.jsonl                             NEW — append-only log of imsg-listener state mutations (gitignored; folded into radar-state.json at next cron run — see R8)
docs/checks/2026-05-15-radar.md               (example output; not committed at design time)
```

State file location is `state/radar-state.json` at repo root rather than under `~/.claude/skills/` because:
- The radar is repo-native (committed source, deployed via repo workflow), not a Claude skill.
- Keeps the audit trail with the source of truth (briefings live in `docs/checks/`). Mutable runtime state stays gitignored so commit history doesn't bloat; weekly snapshot of stable fields gives a cold-start anchor.
- Avoids the "state lives somewhere different from the code that mutates it" anti-pattern.

The existing `/agentsfirst-check` skill's `state.json` at `~/.claude/skills/agentsfirst-check/state.json` is **not migrated** — both run, they share nothing. Each owns its own audit trail. (Decision rationale: less is more — the migration cost outweighs the symmetry win, and it lets us A/B the two for a month.)

### 4.2 MCP server (`tools/agentsfirst-mcp`)

Add ONE new tool — `radar_overview` — per Inspectable State (Principle 9):

```typescript
// tools/agentsfirst-mcp/src/server.ts
server.tool("radar_overview", {
  description: "Inspect agentsfirst-radar operational state — recent recs, accept/dismiss rates, source health, cron freshness.",
  inputSchema: z.object({}).strict(),
  handler: async () => {
    const state = await readRadarState();
    return {
      content: [{
        type: "text",
        text: renderOverview(state)  // see overview.ts in §4.1
      }]
    };
  },
});
```

No other rubric/probe changes in this design pass. (Token Dump anti-pattern protection — we don't bloat the existing 5-tool server beyond 6.)

### 4.3 GitHub Actions workflow

```yaml
# .github/workflows/agentsfirst-radar.yml
name: agentsfirst-radar
on:
  schedule:
    - cron: '0 12 * * *'   # 07:00 CT in DST; the workflow itself checks TZ and bails if it's actually 06:00
  workflow_dispatch:        # manual fire (debug / cold-start)
jobs:
  radar:
    runs-on: [self-hosted, joshhome]
    timeout-minutes: 30
    permissions:
      contents: write       # commits briefing + state
    steps:
      - name: DST guard
        run: |
          CHICAGO_HOUR=$(TZ='America/Chicago' date +%H)
          if [ "$CHICAGO_HOUR" != "07" ]; then
            echo "Skipping: Chicago hour is $CHICAGO_HOUR, not 07 (DST boundary)"
            exit 0  # exit 0 not failure — HC must not fire /failure on legitimate skip
          fi
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - name: Install
        working-directory: tools/agentsfirst-radar
        run: npm ci
      - name: State backup (pre-run)
        run: |
          if [ -f state/radar-state.json ]; then
            SCHEMA_VERSION=$(jq -r '.schema_version' state/radar-state.json)
            cp state/radar-state.json "state/radar-state.json.v${SCHEMA_VERSION}.bak"
          fi
      - name: Run radar
        working-directory: tools/agentsfirst-radar
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          XAI_API_KEY:       ${{ secrets.XAI_API_KEY }}
          MULTIPOV_API_KEY:  ${{ secrets.MULTIPOV_API_KEY }}
          SOCIAL_WORKER_KEY: ${{ secrets.SOCIAL_WORKER_KEY }}
          HC_PING_URL:       ${{ secrets.HC_RADAR_PING_URL }}
        run: npm run radar
      - name: Commit briefing + state
        run: |
          git config user.name  "agentsfirst-radar"
          git config user.email "radar@agentsfirst.dev"
          git add docs/checks/ state/radar-state.json
          git diff --cached --quiet || git commit -m "chore(radar): briefing $(date -u +%Y-%m-%d)"
          git push
      - name: Heartbeat
        if: always()
        run: curl -fsS "$HC_PING_URL/${{ job.status }}" > /dev/null
```

**Why GitHub Actions on joshhome (and not Cloudflare Worker, and not Mac LaunchAgent):**

| Option | Pro | Con | Verdict |
|---|---|---|---|
| GitHub Actions on `joshhome` self-hosted | Native chat.db + imsg + repo write; cron schedule visible in repo; free; uses existing Healthchecks slug pattern | Tied to joshhome being online (Mac Studio always is); 5–15min cron skew | ✅ Picked |
| Cloudflare Worker cron | Always-on, fast | Can't reach chat.db; would need an Tailscale tunnel back to joshhome for iMessage; adds a network failure mode | ❌ |
| Mac LaunchAgent (raw) | Same access as GHA, slightly faster startup | No CI logs surface; harder to debug; can't `workflow_dispatch` from a phone | ❌ |

**joshhome SPOF mitigation (required for v1):** the design accepts joshhome as
the primary runner but ships TWO compensating controls so a single-Mac outage
doesn't go silent for days:

1. **Dead-man's-switch** — every successful run commits `state/last-run.txt`
   with the run's ISO timestamp. A separate, lightweight Cloudflare Worker on
   the joshshop CF account pages Josh (Pushover) if the file is >28h stale.
   This is the ONLY ops surface that doesn't run on joshhome.
2. **Degraded-mode runbook** — RUNBOOK.md (new file alongside this design doc)
   documents the manual procedure to fire a single radar run from any other
   Mac if joshhome is offline >24h: `cd ~/Xcode/agentsfirst && npm run radar
   -- --degraded-mode` writes a briefing-only output (no commits, no iMessage)
   so Josh can read the day's signal without the cron infra.

Cron skew is fine — there is no minute-precise dependency. `0 12 * * *` UTC is 06:00 CST / 07:00 CDT; the workflow itself reads local TZ and bails if America/Chicago hour ≠ 7 to avoid double-firing during DST transitions. (The system clock is the source of truth, not the cron string.) The TZ-guard step is the load-bearing piece — without it, DST transitions fire the workflow twice. `exit 0` is intentional so Healthchecks.io doesn't interpret a legitimate DST-skip as a failed run.

### 4.4 Sources additions (`sources.ts`)

Add five new source categories on top of the existing `sources.json`:

| Source | Mechanism | Why |
|---|---|---|
| `linkedin_feeds[]` | Self-hosted RSSHub instance on joshhome (Docker container; not the public rsshub.app — that's a third-party text source we don't trust) | Maggie Appleton, Simon Willison, swyx all cross-post to LinkedIn now; X-only coverage misses 30%+ of their amplifier reach |
| `bluesky_handles[]` | `https://bsky.social/xrpc/app.bsky.feed.getAuthorFeed?actor=<handle>` (no auth needed for public feeds) | Bluesky is where the dev-tools conversation moved post-2025 X policy changes |
| `hn_frontpage` | `https://hnrss.org/frontpage?count=50&points=10` (RSS, free) | Front-page filter (not just Algolia search) catches breakout posts before they appear in search |
| `mcp_registry` | `https://github.com/modelcontextprotocol/registry/commits/main.atom` | Net-new MCP server adds per week — leading indicator of adopter growth |
| `cf_ars_scoreboard` | `https://radar.cloudflare.com/api/v1/ai-agent-readiness?top=100` (existing public API; not paid) | Top-100 movement is the cleanest measurable signal that the framework is gaining/losing |
| `cf_portfolio_probe` | Loop existing CF portfolio domains through `agentsfirst.dev/mcp` `score_website` | Close-to-home adopter signal; portfolio companies are warm-intro targets. QUARANTINED — runs in isolated subprocess with no access to main run state, API keys, or other source outputs; emits strictly typed output (domain: string, score: int 0-100, level: int 0-4) only; portfolio company web content is treated as adversarial-incentive (portfolio companies have direct motivation to game the score). |
| `cos_calendar_skip_flags` | Read `state/cos-skip-dates.json` (committed; maintained by COS team) listing dates the radar should skip (SXSW prep weeks, board prep, family travel) | Avoid landing proposals on days the calendar is deliberately protected; lighter cognitive load |

a14y.dev API: noted but deferred — we already track its commit feed; its adoption-metric API is not public. (Filed as `docs/rubric-backlog.md` follow-up.)

### 4.5 Not changed

- `~/.claude/skills/agentsfirst-check/` — left alone, runs as before.
- `index.md`, `score.ts`, `/reports/*` — only Josh edits these (or merges PRs the radar opens).
- The existing iMessage HITL gate in `/social-draft` and `/social-send` — radar uses them as-is.
- `tools/og-card/` — radar may propose re-generating an OG card after a thesis edit lands, but doesn't execute the regen.
- Asana ownership routing — the COS triage workflow owns who gets which task and when. Radar drops candidates in a holding project; it does not contact assignees or set due dates.

---

## 5. Typed State Schema

State lives in two places, both versioned via zod:

### 5.1 `state/radar-state.json` (runtime)

```typescript
// tools/agentsfirst-radar/src/state.ts
import { z } from "zod";

export const RecLane = z.enum(["website", "social", "other"]);
export const RecStatus = z.enum([
  "open",          // surfaced in latest briefing, awaiting Josh
  "accepted",      // Josh said yes; downstream actuator firing
  "in_flight",     // accepted, PR opened or post-pending, not yet shipped
  "shipped",       // landed (PR merged / tweet posted / Asana task created)
  "dismissed",     // Josh said no, with reason
  "auto_dismissed",// stale-no-action-72h
]);

export const Recommendation = z.object({
  id: z.string().regex(/^[a-f0-9]{8}$/),                   // sha1[:8] of headline + lane + iso-date + run_timestamp (salt prevents external prediction)
  lane: RecLane,
  headline: z.string().max(120),
  body: z.string(),                                         // the full rec — diff for website, draft for social, etc.
  created_iso: z.string().datetime(),
  status: RecStatus,
  status_changed_iso: z.string().datetime(),
  dismissal_reason: z.string().optional(),
  expires_iso: z.string().datetime(),                       // created_iso + 72h
  source_urls: z.array(z.string().url()).min(1),
  multipov_review_id: z.string().optional(),                // present only for multi-model-verified recs
  downstream: z.object({                                    // populated when shipped
    pr_url: z.string().url().optional(),
    tweet_url: z.string().url().optional(),
    asana_task_gid: z.string().optional(),
  }).optional(),
});

export const SourceHealth = z.object({
  source_id: z.string(),                                    // e.g. "blogs:cloudflare"
  kind: z.enum(["rss", "atom", "x", "bluesky", "linkedin", "hn", "gh", "web", "mcp_probe"]),
  last_success_iso: z.string().datetime().nullable(),
  last_attempt_iso: z.string().datetime(),
  consecutive_failures: z.number().int().nonnegative(),
  last_error: z.string().nullable(),
});

export const HandleEntry = z.object({
  display_name: z.string(),                                 // "Lily Ray"
  platform: z.enum(["x", "bluesky", "linkedin"]),
  handle: z.string(),                                       // "lilyraynyc"
  verified_iso: z.string().datetime(),
  evidence_url: z.string().url(),
  confidence: z.enum(["high", "medium", "low"]),
});

export const BriefingEntry = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  path: z.string(),                                         // "docs/checks/2026-05-15-radar.md"
  rec_counts: z.object({
    website: z.number().int().nonnegative(),
    social: z.number().int().nonnegative(),
    other: z.number().int().nonnegative(),
  }),
  imsg_sent_iso: z.string().datetime().nullable(),
  imsg_chat_id: z.string(),                                 // "+1...@..."  (mikey@capitalfactory.com)
  hc_pinged: z.boolean(),
});

export const AdopterPing = z.object({
  domain: z.string(),
  score: z.number().int().min(0).max(100),
  level: z.number().int().min(0).max(4),
  first_seen_iso: z.string().datetime(),
  last_scored_iso: z.string().datetime(),
  contact_status: z.enum(["uncontacted", "dm_drafted", "dm_sent", "responded", "out_of_scope"]),
});

export const RadarState = z.object({
  schema_version: z.literal(1),
  agent_paused: z.boolean().default(false),
  pause_reason: z.string().optional(),
  multipov_spend_today_usd: z.number().nonnegative().default(0),    // resets at UTC midnight; circuit-breaker at MULTIPOV_DAILY_CAP_USD (default 10)
  multipov_last_reset_iso: z.string().datetime(),
  first_run_iso: z.string().datetime(),
  last_run_iso: z.string().datetime(),
  next_run_iso: z.string().datetime(),
  seen_urls: z.record(z.string().url(), z.string().datetime()),  // capped at SEEN_URLS_MAX (default 10000) via LRU eviction on last-seen date; entries older than SEEN_URLS_TTL_DAYS (default 90) are evicted at each run
  recommendations: z.record(z.string(), Recommendation),         // id -> rec
  sources_health: z.record(z.string(), SourceHealth),            // source_id -> health
  handle_allowlist: z.record(z.string(), HandleEntry),           // display_name -> entry
  briefings: z.array(BriefingEntry).max(90),                     // last 90 days
  adopters: z.record(z.string(), AdopterPing),                   // domain -> ping
});

export type RadarState = z.infer<typeof RadarState>;
```

**seen_urls hygiene:** the seen_urls record is the deduplication backbone and
also the largest growing field. Without bounds, daily runs against 12+ source
categories produce a multi-MB file in months. Two enforced bounds:

- **TTL eviction (default 90d):** every run, entries with `last_seen` older
  than `SEEN_URLS_TTL_DAYS` are dropped before the new fanout adds entries.
  90 days matches the briefings array cap.
- **LRU cap (default 10000):** if size still exceeds `SEEN_URLS_MAX` after
  TTL eviction, drop the oldest-last-seen entries until under cap.

Cold-start protection: if `state/radar-state.json` is missing or empty on a
run, the radar refuses to fanout (writes a degraded briefing "no state — cold
start blocked, manual `npm run state:init` required"). This prevents
"reseeing" months of source history as new and flooding Josh with stale recs.

Migration story: when `schema_version` bumps, write a migration in `src/state-migrations.ts`. The radar refuses to run on a state file whose `schema_version` is higher than its code knows — fail-closed.

Rollback story: rollbacks are NOT automatic. If v2 schema ships and is then
rolled back to v1 code, v1 refuses to run. Recovery steps (documented in
RUNBOOK.md):

1. Before any schema_version bump, the GHA workflow's first step copies
   `state/radar-state.json` to `state/radar-state.json.v<N>.bak` so a manual
   rollback can restore the prior file.
2. Manual rollback: copy the prior `.v<N>.bak` over `state/radar-state.json`,
   re-deploy the prior workflow code, push.
3. Migration scripts in `src/state-migrations.ts` must include both `up()` and
   a reversible `down()` where feasible. If `down()` is impossible (e.g.,
   destructive normalization), the migration must be tagged
   `irreversible: true` and the schema_version bump documented in the PR as
   one-way.

The workflow also runs an integrity check on startup: if zod validation fails
on `state/radar-state.json`, the radar writes a degraded briefing naming the
validation error and exits without mutating state. No mass re-surface, no
silent corruption.

### 5.2 Morning briefing artifact (markdown shape)

The committed `docs/checks/<DATE>-radar.md` follows this skeleton (text content is Mikey-voice; structure is deterministic):

```markdown
# Agents First Radar — 2026-05-15

**Window:** 2026-05-14T12:00Z → 2026-05-15T12:00Z
**Sources:** 11 blogs · 12 X handles · 8 X queries · 3 LinkedIn · 6 Bluesky · 5 GH repos · HN front · MCP registry · CF ARS top-100
**Fresh items:** 18  ·  High-signal: 7  ·  Recommendations: 6 (W:2 S:1 O:3)
**🩺 Source health:** 23/27 healthy · 4 degraded (linkedin/swyx 1 fail, linkedin/maggieappleton 2 fails, bluesky/simonw 1 fail, cf-portfolio/foo.com 1 fail)

🎯 **Top of the stack:** [b9639484] Google's AI Optimization Guide explicitly mythbusted llms.txt. Thesis still doesn't cite it. (Website lane — 1 patch, multipov-verified.)

---

## 🌐 Website updates (2)

### [b9639484] Cite Google's AI Optimization Guide on llms.txt
**File:** `index.md:252`
**Multipov review:** https://multipov.ai/review/rev_abc123 (5 reviewers, 0 blockers)
**Patch:**
```diff
- as of April 2026 only ~12 sites have llms.txt
+ as of April 2026 only ~12 sites have llms.txt. [Google's 2026-05-15 AI
+ Optimization Guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
+ explicitly says: "You don't need to create new machine readable files,
+ AI text files, markup, or Markdown to appear in generative AI search."
```
**Why:** [Google's guide](https://...) ships today. [@lilyraynyc 285/25 thread](https://x.com/i/status/2054937416646242541) confirms SEO Twitter is paying attention.
**Reply:** `accept b9639484` → opens PR · `dismiss b9639484 <reason>` · `defer b9639484 7d`

### [22ea794e] ... (rest of website lane)

---

## 📣 Social drafts (1)

### [32dd8106] Quote-tweet @lilyraynyc with the v0.2.0 receipt
**Platform:** X (LinkedIn skipped — Lily's thread is X-native)
**Target audience:** SEO Twitter, currently engaged
**Urgency:** 18h half-life on @lilyraynyc's thread (285 likes / 25 replies as of 11:30Z)
**Draft:**
> Google's new AI Optimization Guide says you don't need llms.txt to appear in generative AI search.
>
> Agents First v0.2.0 downgraded /llms.txt from 25pts → 5pts a month ago for exactly this reason. SE Ranking found 10% adoption with no AI-citation correlation, and Google had already declined to support it.
>
> The rubric optimizes for what actually changes agent behavior. Not for SEO-shaped artifacts.
>
> agentsfirst.dev
**Handles:** @lilyraynyc (verified ✅ via grok 2026-05-15)
**Pre-flight:** ✅ handle-verify · ✅ Tier 2 fact-check · ✅ suppression
**Reply:** `accept 32dd8106` → triggers /confirm_publish · `dismiss 32dd8106 <reason>`

---

## 🔧 Other moves (3)

### [4b6aec5d] (medium impact) Cross-link `check-agent-readiness` GHA in /ci.md
…

### [9b34c649] (low impact) File adopter watch: GitHub Copilot `.agent.md`
…

### [285f7982] (info) Filed: SEP-2577 + SEP-2663 will trigger rubric review on tagged release
…

---

## 🩺 Inspectable State (today)

- Acceptance rate (7d): 5/6 = 83%
- Acceptance rate (30d): 38/42 = 90%
- Auto-dismissed-stale (30d): 4
- Recommendations open >24h: 0
- Source-health degradation since last briefing: +2 (linkedin/maggieappleton, bluesky/simonw)
- Cron freshness: ✅ last successful run 2026-05-14T12:00:43Z (24h ago)

🔧 -agentsfirst-radar
```

The Inspectable State block at the bottom mirrors what the `radar_overview` MCP tool returns. **One canonical place where "how's the radar doing" gets answered**, viewable two ways: in the daily briefing and via MCP.

---

## 6. AGENTS.md (hand-authored, ≤150 lines)

Drops at `tools/agentsfirst-radar/AGENTS.md`. This is the Contract First artifact (Principle 2) — it tells any agent (Claude / Cursor / a downstream operator agent) the rules for using the radar. Kept under ~1500 tokens to avoid Token Dump.

```markdown
# agentsfirst-radar — Agent Rules

A daily-cron agent that monitors the AI-agent ecosystem and proposes three lanes
of action: website updates, social drafts, other moves. Output lands in
`docs/checks/<date>-radar.md` and in Josh's iMessage 1:1 with mikey@capitalfactory.com.
Read this file before calling any tool or interpreting any briefing.

This is the Contract First artifact: <https://agentsfirst.dev/principles/contract-first/>.

## Authority

The radar PROPOSES. Josh DISPOSES. The agent has zero authority to:

- Publish to X, LinkedIn, or Bluesky (always routes through /confirm_publish, which
  itself routes through iMessage HITL).
- Edit `index.md`, `score.ts`, `/reports/<vendor>/index.md`, or any other canonical
  source. Recommendations are surfaced as ready-to-apply patches; only Josh applies
  them (or merges a radar-opened PR).
- Create, update, or close Asana tasks. Other-lane actuator creates tasks UNASSIGNED in the "Radar: Triage" Asana project only; a COS routes them to the right owner/project. The agent never assigns a task to a person.
- Modify rubric weights or version numbers in `tools/agentsfirst-mcp/`.
- Auto-merge any PR it opens. CI auto-merge is intentionally disabled for radar PRs.
- If multipov is unavailable, `index.md` and `score.ts` recs are dropped for that run without exception. No single-model fallback for canonical thesis.
- Social-lane publish requires TWO iMessage round-trips (accept + CONFIRM). A single 'accept' never queues a publish. Website and Other lanes require only one round-trip (a Website 'accept' opens a PR Josh must still merge; an Other 'accept' files an unassigned Asana task).
- Portfolio-company content (cf_portfolio_probe source) is adversarial-
  incentive — portfolio companies have direct motivation to manipulate
  scoring. Scoring runs in an isolated subprocess; the subprocess cannot
  reach the planner LLM, the API keys, or any state outside its
  strictly-typed return value (domain, score, level).

## Required prep

Call `agentsfirst_prep` (existing MCP tool) before any source-fanout. The radar
itself runs a SECOND prep gate that adds: multipov MCP reachable, social Worker
reachable, Healthchecks.io reachable, repo write-perm OK. If either prep fails,
write a degraded briefing that names the failed checks and skips the affected lane
(don't generate social drafts if /social-draft is down — generate the Website +
Other lanes and ship the briefing without the Social section).

This is the Prep Gates principle: <https://agentsfirst.dev/principles/prep-gates/>.

## Identifiers

- `rec_id` — 8-char hex prefix of sha1(headline + lane + iso-date + run_timestamp). The run_timestamp salt prevents external attackers from predicting rec_ids from observable headline text. Stable across re-runs within the same cron firing; new id on a re-fanout.
- `source_id` — `kind:slug`, e.g. `blogs:cloudflare`, `x:swyx`, `bluesky:simonw`.
- `chat_id` — iMessage chat GUID resolved on the SENDING device (joshhome) via
  the chat.db query in the global iMessage rules.

Never invent a rec_id by inspection. If you need to reference a rec, look it up
via `radar_overview` or by reading the recs section of the latest briefing.

## iMessage HITL grammar

Reply parser rules (mandatory before implementation; tested as Week 1 acceptance):

1. **Verb tokens** — case-insensitive prefix match on `accept`, `dismiss`, `defer`,
   `confirm`, `cancel`. Anything else falls into "unparsed" tier (see #5).
2. **ID tokens** — minimum 6-hex-char prefix match against open rec_ids. Trailing
   non-hex characters are ignored. If the prefix matches more than one open rec,
   the daemon replies "⚠️ Ambiguous: <prefix> matches <id-a> (<lane>) and
   <id-b> (<lane>). Reply with full 8 chars." and does NOT mutate state. All ambiguity detections are also appended to `state/imsg-unparsed.jsonl` with the prefix, the matching rec_ids, and the reply's iMessage GUID — collision probes leave an audit trail.
3. **Idempotency** — a second `accept <id>` for an already-accepted rec replies
   "✅ Already accepted <id> at <iso>" and is a no-op (not an error).
4. **Free-text after verb+id** — everything after the id token (e.g.
   "accept b9 because Lily's thread is dead") is captured into the rec's
   `dismissal_reason`/`acceptance_note` field but does not affect parsing.
5. **Unparsed replies** — if no verb token matches, the daemon replies "⚠️ Didn't
   parse — did you mean `accept <id>`?" AND writes the raw message into
   `state/imsg-unparsed.jsonl` for later manual review. Never silently drop.
6. **CONFIRM window (Social lane only)** — a CONFIRM <id> reply is valid only
   if sent within 2h of the original `accept <id>`. The daemon stores the
   accept's ISO timestamp on the rec's in-flight state; an expired CONFIRM
   replies "⚠️ Expired — re-accept to restart the 2h confirmation window"
   and does not publish. This caps the replay window for stale-thread
   CONFIRM messages (e.g., a CONFIRM from a 3-week-old thread cannot trigger
   a publish even if the rec_id is still open).

## Sequence

The typical daily run:

1. Prep gates (both MCP servers + Worker + state + repo write)
2. Source fan-out (parallel; see `sources.ts`)
3. Dedup against `state.seen_urls`
4. Triage into 8 buckets, lane-classify into 3 lanes
5. Multi-model verify any rec touching index.md / score.ts / a new /reports/ page
6. Render briefing (Mikey voice, emoji-led)
7. Commit briefing + state; push
8. iMessage summary to mikey@capitalfactory.com 1:1
9. Heartbeat Healthchecks.io
10. Auto-dismiss any rec older than 72h that hasn't been accepted/dismissed

## Errors

All radar errors surface in the briefing's "🩺 Source health" line, NOT silently.
Fail-loud is the rule. Three error tiers:

- **degraded** — one or more sources failed but the briefing is shippable. Surface
  in the health line, ship the briefing, retry the source next run.
- **partial** — a whole lane failed (e.g., multipov was down → no website lane
  multi-model verification possible). Ship the other lanes; mark the failed lane
  as skipped.
- **silent-imsg** — briefing committed and Healthchecks.io pinged green, but
  iMessage delivery failed (chat.db locked, account auth expired on joshhome,
  daemon crash). Without explicit handling, this looks healthy from HC while
  Josh sees nothing. Mitigation: the iMessage send step writes
  `state/imsg-last-success.json` with the run's ISO timestamp on successful
  send. The external dead-man's-switch monitor (R3) ALSO checks that file —
  if it's >25h stale even while `state/last-run.txt` is fresh, page Josh on
  the `agentsfirst-radar-imsg` HC slug. Two slugs, two failure modes, no
  silent gap.
- **fatal** — repo write fails, joshhome offline, all sources dead. Heartbeat
  Healthchecks.io with `/fail`, do NOT send iMessage (avoid Josh-paging on a known
  infra issue when Healthchecks will page him directly).

**Atomic writes (mandatory):** the radar process MUST write
`state/radar-state.json` atomically — write to `state/radar-state.json.tmp`
first, fsync, then `mv`. A SIGKILL mid-write therefore leaves either the prior
valid file or no file (which the prep gate treats as cold-start blocked, see
R5). No partial-write corruption is possible. zod-validate on read; refuse to
mutate from an unparseable state.

## Visible outputs

The visible outputs of the radar are (a) the committed markdown briefing, (b) the iMessage summary, and (c) the committed `state/last-run.txt` timestamp that drives the external dead-man's-switch monitor. There is no dashboard. The committed briefing IS the
audit trail. Don't add a third surface.

This is Visible Outputs (Principle 5): <https://agentsfirst.dev/principles/visible-outputs/>.

## Anti-patterns to avoid when consuming this agent

- **Slow Chatbot** — don't ask Josh to confirm before each source scan; the radar
  is autonomous on the read side. HITL is only on the write side (post, edit, send).
- **Single-Model Trust** — any rec touching the canonical thesis or rubric MUST
  pass multipov plan review. Single-LLM-only recs in those lanes are a contract
  violation; the rec is dropped, not surfaced.
- **God Server** — the radar exposes ONE new MCP tool (`radar_overview`). Resist
  pressure to add `radar_accept`, `radar_dismiss`, etc. Mutations happen via
  iMessage replies, which is where Josh already lives.
- **Ship and Forget** — the acceptance-rate metric in `radar_overview` is the
  feedback loop. If 30d acceptance drops below 40%, the radar is producing noise;
  raise the signal threshold or narrow the source set BEFORE adding more sources.
- **Token Dump** — keep `AGENTS.md` under 1500 tokens. If the rules outgrow this
  file, split them by lane (`AGENTS-website.md`, `AGENTS-social.md`, etc.).
- **Shell injection from scraped sources** — `fanout.ts` and the source
  modules read untrusted content (RSS titles, X post text, GitHub release
  notes). NEVER pass that content into a shell command, `eval`, or any
  subprocess argv. If a downstream tool needs source content, pass it via
  stdin or a temp file, not a CLI argument. The four API keys (`ANTHROPIC`,
  `XAI`, `MULTIPOV`, `SOCIAL_WORKER`) live in process env throughout the run;
  a single shell-injection bug from a crafted source title leaks all four.
- **Prompt-injection boundary leak** — Steps D and E are the two prompt-
  injection boundaries in the radar pipeline. The reader LLM at Step D must
  ONLY emit structured enum classifications + verbatim summary_quote (≤200
  chars). The planner LLM at Step E must NEVER receive raw source content,
  only the reader's structured output. Bypassing the boundary — e.g., letting
  the planner read RSS text directly to "give it more context" — is a contract
  violation that re-opens the prompt-injection attack surface the dual-LLM
  pattern exists to close.

For full anti-pattern definitions: <https://agentsfirst.dev/glossary/>.
```

(Above is ~110 lines. Comfortably under the 150-line / 1500-token budget.)

---

## 7. Self-scorecard against the 9 principles (target: Level 3)

| # | Principle | Radar implementation | Self-score |
|---|---|---|---|
| 1 | **Interface First** | MCP tool `radar_overview` ships in the same server as the rubric tools; no human dashboard. Inbound writes via existing iMessage MCP path. | ✅ |
| 2 | **Contract First** | `tools/agentsfirst-radar/AGENTS.md` (§6) hand-authored, ≤150 lines, before any code. | ✅ |
| 3 | **Prep Gates** | Two-tier prep: existing `agentsfirst_prep` + radar's own (multipov + social + HC + repo write). Failures degrade gracefully. | ✅ |
| 4 | **Typed State** | All state in `state/radar-state.json` with zod schema in `state.ts`. Schema_version field + fail-closed migrations. | ✅ |
| 5 | **Visible Outputs** | Committed markdown briefing + iMessage summary. No new dashboard. | ✅ |
| 6 | **Multi-Model Verification** | Multipov plan review on thesis/rubric edits; /social-draft 4-LLM on every post. Selective, not universal — Asana / wall-of-adopters stay single-model. | ✅ |
| 7 | **Perspective Dispatch** | The three lanes ARE the perspectives — Website (correctness/clarity), Social (voice/urgency), Other (operational). Multipov panel inside Website lane adds a second layer of perspective dispatch within a single rec. | ✅ |
| 8 | **Autonomous Recovery** | Source failures retry with exponential backoff (1h / 4h / 24h); 3 consecutive failures move source to "degraded" but don't kill the run. HTTP 5xx on multipov → drop thesis/rubric recs entirely (briefing notes "Website lane degraded: multipov unavailable"); non-thesis recs (new /reports/ pages) may fall back to single-model + "unverified" flag. | ✅ |
| 9 | **Inspectable State** | `radar_overview` MCP tool returns recs / accept rate / source health / cron freshness. Same data renders into the briefing's "Inspectable State" block. | ✅ |

Adoption Level: **3 (Agent First)** — the agent is built on its own framework from day one. Not Level 4 (Agent-Driven) because the write actions still require Josh's explicit accept/dismiss/defer in iMessage. That's intentional — Level 4 for a *content* agent is reckless.

---

## 8. Anti-patterns specific to this agent (the "Don't Do This" list)

| Anti-pattern | What it'd look like in this agent | Why it's bad | Guardrail |
|---|---|---|---|
| **Briefing-as-Token-Dump** | Dumping every source's raw output into the "What's new" section to "preserve audit trail" | Buries the signal; Josh stops reading; metric: acceptance rate collapses | `briefing.ts` enforces a per-section byte budget; Inspectable State block must fit in iMessage preview (~250 chars) |
| **Slow Chatbot** | Asking Josh to approve each source scan or each draft before generating | Defeats the autonomous-cron premise; he'd just go back to /agentsfirst-check | Prep gate is the only HITL on the read side. Generation is fully autonomous. HITL is only on the write side. |
| **Single-Model Trust on canonical thesis** | A single Opus pass proposes an `index.md` edit and the radar ships it as a ready-to-apply patch | One model hallucinating a citation → published falsehood in the canonical source | Hard rule in `recs/website.ts`: if rec touches `index.md` or `score.ts`, multipov plan review is required. No `multipov_review_id` field → rec dropped, not surfaced. This rule overrides the §7 Autonomous Recovery fallback for thesis/rubric recs — single-model fallback is forbidden for `index.md` and `score.ts` even during multipov outage. |
| **Ship and Forget** | Radar runs for 90 days, source list never updated, acceptance rate trends from 90% → 30%, nobody notices | The agent decays into a noise feed; trust evaporates | Acceptance-rate threshold in `radar_overview`: <40% 30d acceptance triggers a "🚨 NOISE ALARM" line in the briefing header. Josh's job to either retune or kill. |
| **Auto-dismissal without reason** | A rec hits 72h and silently disappears | Loses the audit trail of WHY we didn't act | `auto_dismissed` always sets `dismissal_reason = "stale-no-action-72h"`; weekly briefing has a "🪦 Auto-dismissed last 7 days" appendix |
| **Lazy Wrapper around `/agentsfirst-check`** | Radar = "agentsfirst-check on a cron" with no lane structure | Inherits the manual transcription pain | Lane classification + diff-shaped output + multipov verification are the differentiators. Code review checklist: a rec that's just a paragraph of "Josh should consider X" is rejected. |
| **God Server creep on `agentsfirst-mcp`** | Adding `radar_accept`, `radar_dismiss`, `radar_defer`, `radar_list_open`, `radar_health` as separate tools | 5-tool God Server in 3 releases | One tool (`radar_overview`) returns everything. Mutations stay on iMessage. If a future agent NEEDS to mutate, it goes through the same iMessage path — not a new MCP tool. |
| **Cron skew → double-fire** | DST transitions cause the workflow to run 2x in one day | State race; duplicate briefing | Workflow opens with a TZ-check guard; bails if local Chicago hour ≠ 7. |
| **Runaway multipov spend** | A fanout bug or source explosion triggers hundreds of multipov calls in one run | Surprise multi-$100 bill the next day | Per-run cost accumulator `multipov_spend_today_usd` in state; if >$10/day (default cap), skip further multipov calls and flag affected recs "unverified — daily budget exceeded" in the briefing |

---

## 9. Acceptance criteria

### Week 1 (2026-05-22 checkpoint)

- ✅ Daily cron fires 7/7 days without missing a run (Healthchecks.io heartbeat record).
- ✅ Each briefing has at least 1 valid recommendation OR explicitly says "🟢 no signal worth acting on today."
- ✅ Zero auto-posted X tweets. Zero auto-edited `index.md` commits.
- ✅ At least one rec from at least one briefing has been accepted AND shipped (PR merged / tweet posted / Asana task created).
- ✅ iMessage delivery: 7/7 briefings landed in Josh's 1:1 with mikey@capitalfactory.com (verify via chat.db query).
- ✅ `radar_overview` MCP tool callable and returns sensible JSON.
- 🎯 **Kill switch (operationalized):** Josh identifies a hallucinated
  thesis rec post-accept → manually sets `state.agent_paused = true` +
  `pause_reason = "<RCA description>"` and pushes. The GHA workflow's prep
  gate (Step A) checks this flag and, if true, writes a degraded briefing
  ("⏸️ PAUSED — manual reset required: <reason>"), pings Healthchecks.io
  with the dedicated `agentsfirst-radar-paused` slug, and exits 0. Resume
  is a manual flip back to false.

### Month 1 (2026-06-15 checkpoint)

- 📈 >70% of recommendations get accepted-or-dismissed within 24h. (Below: Josh is ignoring it → noise → retune.)
- 📈 >50% of *accepted* social drafts ship within 48h. (Below: drafts not landable as-is → retune Tier 2 fact-check or voice match.)
- 📈 Multipov spend stays under $5/day average (deep mode is ~$0.98/call; expecting 2–4 Website lane recs/day → $2–4/day).
- 📈 Source list churn: ≥1 source added per week, ≥1 retired/replaced per month (forces continuous tuning).
- 📈 Acceptance rate >60% on Other-lane recs. (Lower bound because Other lane is noisier by definition.)
- 🚨 If any 7-day rolling acceptance rate drops below 40%, radar enters "noise alarm" state and stops sending iMessage (still writes the briefing for the audit trail). Manual reset required.

### Quarter 1 (2026-08-15 checkpoint)

- 🏆 At least 4 of the briefing-originated recommendations have produced public artifacts that drove measurable engagement: a tweet with >50 likes, a blog post with >1k views, a /reports/ page that scored a previously-unscored adopter, or a rubric bump that's now live.
- 🏆 At least 1 conference CFP, podcast pitch, or amplifier DM that originated as a radar Other-lane rec has converted to a booked slot / accepted response.
- 🏆 No public-facing falsehood traceable to a radar-surfaced rec. (Zero is the only acceptable count here.)
- 🏆 Inspectable State block in the briefing has actually been used as a debugging tool at least 3 times — meaning the agent's own state surfaced an issue Josh wouldn't have noticed otherwise.
- 🏆 `/agentsfirst-check` manual fallback used ≤2 times in the quarter. (If it's used more, the radar isn't covering the manual skill's job — close the gap.)
- 🚨 If month-3 acceptance rate is <50%, retire the radar and revert to manual `/agentsfirst-check`. Don't keep a noisy agent alive.

---

## 10. Future cleanup / explicitly deferred

| Item | Why deferred | Trigger to revisit |
|---|---|---|
| Bluesky firehose ingest (vs per-handle polling) | Polling is cheaper at our scale | If we ever monitor >50 Bluesky handles |
| Move iMessage HITL to a richer surface (Slack thread, web inbox) | iMessage is where Josh already lives; richer surface = bigger context switch | If iMessage reply parsing reaches >5% error rate |
| Auto-open PRs on `accept` for Website lane | Forces Josh to merge instead of just reading the diff; might create unwanted PR noise | If accept-to-merge time exceeds 48h average |
| `radar_accept` / `radar_dismiss` MCP tools | Mutations belong on iMessage, not on a new MCP surface | If a non-Josh agent ever needs to act on a rec (currently zero use case) |
| Migrate `/agentsfirst-check` state into radar state | Adds risk; existing skill still works | If A/B comparison after 60 days shows radar dominates on every metric |
| Per-lane briefing budgets (e.g., max 3 social drafts/day) | Quality-not-quantity is enforced by review — caps would mask drift | If Josh complains about briefing length |
| LinkedIn write-back ( "post this draft to LI") | Out of scope; X is the primary surface | If LinkedIn-originated engagement exceeds X-originated for 30d |

---

## 11. Open questions for the multipov panel

1. **Lane assignment ambiguity.** A Google llms.txt mythbusting rec is simultaneously a Website edit, a Social post, and an Other-lane "rubric bump" candidate. Today the design produces three recs (one per lane) that share the same source URLs. Is that the right call, or should there be a single `rec_id` with multiple lane outputs?
2. **Multipov-on-multipov.** Should the radar's own briefing periodically (monthly?) be reviewed by multipov as a meta-check on noise / drift?
3. **iMessage parsing reliability.** Free-text replies like `accept b9 because Lily's thread is dead` need to be parsed for the action verb. Current plan is regex + greedy match on 8-hex prefix. Acceptable?
4. **Healthchecks.io as the only ops surface.** Should there be a fallback paging path if HC itself is down? (Today: no.)
5. **Cron timing for international amplifiers.** Maggie Appleton is UK-based; her LinkedIn posts often hit Sunday US time. Should the radar run Sunday or skip weekends? (Current plan: 7/7 days; weekends are often the *best* signal-to-noise.)

---

🔧 -agentsfirst-radar (design draft authored by Mikey)
