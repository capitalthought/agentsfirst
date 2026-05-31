# rank_vendors — Design Doc (2026-05-17)

**Status:** Plan-review draft (pre-implementation)
**Owner:** Josh Baer
**Target endpoint:** `https://agentsfirst.dev/mcp`
**Reviewer target:** `/multipov-plan` (8-person panel, deep mode)
**Sibling docs:** `docs/plans/2026-05-15-agentsfirst-radar-design.md`

---

## 1. Problem

Agents picking vendors today have two options, both bad:

1. **Ask an LLM.** "List 5 task-manager MCP servers." Gets a list with hallucinated names and no agent-readiness signal. The downstream user finds out the recommended vendor doesn't expose an MCP server only after a 20-minute onboarding loop.
2. **Manually scorecard each candidate.** Run `score_website` 5×, eyeball the results, copy/paste into a comparison. This is what `tools/cf-portfolio-pilot.py` already does for the 25-company CF pilot — it works, but a human (Mikey today) is the orchestration layer.

The job-to-be-done: **an agent inside a Claude Code session — mid-PRD or mid-architecture discussion — asks "who are 5 vendors that do X, and which one ranks highest on Agents First?" and gets a structured, sourced, methodology-disclosed answer in one tool call.**

Callers:

- **Primary — Claude Code in an agentic build session.** "User wants billing; rank vendors that ship an MCP server." Time-budget is seconds-to-a-minute; latency matters but not as much as trust.
- **Secondary — external MCP clients (Cursor, Windsurf, a customer's internal agent).** Same surface, same contract.
- **Tertiary — Josh's own report pipeline.** Feed candidates into `/reports/<vendor>/` selection without picking targets by hand.

The existing `score_website(url)` tool only answers "score *this* URL." This design adds the inverse — "find me URLs *worth* scoring."

Non-goals (v1):
- Auto-purchase or auto-onboard. The tool ranks; the user (or the user's agent) picks and integrates.
- Scoring private/internal vendor candidates. Tool only reasons about publicly discoverable products.
- Multi-LLM consensus discovery (deferred — see §12).

---

## 2. Solution overview

A single primary MCP tool — **`rank_vendors`** — accepts a free-text vendor brief (a sentence, a paragraph, or a full PRD), discovers 5–10 candidate vendors via a hybrid LLM-proposes / registry-verifies pipeline, fans out parallel `score_website` calls against each candidate's marketing + docs surfaces, and returns a ranked JSON result with per-vendor scores, the methodology block, and the cached-vs-live provenance for every cell. Scoring + discovery run async because a full 10-vendor run takes 30–90s; the tool returns a `job_id` immediately and three supporting tools (`get_vendor_ranking`, `get_cached_vendor_score`, `rescore_vendor`) let the agent poll, re-use, and refresh.

The four new tools bring the Worker's surface from 5 → 9 tools, comfortably below the 30-tool God Server warn line and consistent with the existing verb-first naming.

---

## 3. Tool surface

All tools live in `tools/agentsfirst-mcp-worker/src/server.ts` (hosted Worker) and `tools/agentsfirst-mcp/src/server.ts` (local npx parity). The local npx variant uses the same Worker endpoints behind the scenes — no separate scoring pipeline.

### 3.1 `rank_vendors` (primary; async)

**Description:** "Discover and rank vendors against the Agents First rubric. Submit a vendor brief (description, requirements, or full PRD), get back a job_id; poll `get_vendor_ranking` for the ranked result."

**Input schema (zod):**
```ts
{
  brief: z.string().min(20).max(8000)
    .describe('Free-text description of what the vendor needs to do. Sentence, paragraph, or PRD.'),
  category: z.enum([
    'payments','auth','observability','crm','task-management','email',
    'analytics','search','llm-gateway','feature-flags','vector-db','other'
  ]).optional()
    .describe('Optional category hint; speeds discovery and improves precision. Omit to let the tool infer.'),
  max_candidates: z.number().int().min(3).max(10).default(5)
    .describe('Number of vendors to discover and score. Default 5.'),
  cache_policy: z.enum(['prefer_cached','live_only','fresh_within_24h']).default('prefer_cached')
    .describe('prefer_cached: use any score ≤7d old. fresh_within_24h: rescore anything older. live_only: skip cache.'),
  include_cf_portfolio: z.boolean().default(true)
    .describe('If false, CF portfolio companies are excluded from discovery. Default true with conflict flag in output.'),
}
```

**Return shape (sync — the immediate response):**
```ts
{
  job_id: 'rnk_01HXYZ...',           // ulid; opaque to caller
  status: 'queued',
  estimated_seconds: 45,              // p50 estimate based on category + max_candidates
  poll_with: 'get_vendor_ranking',
  rubric_version: '0.8',
  inputs_hash: 'sha256:abc123...'     // brief + category + max_candidates; enables idempotency
}
```

**Sync mode:** if `max_candidates ≤ 3` AND `cache_policy = prefer_cached` AND all candidates hit cache, the tool may return the fully-resolved result inline with `status: 'completed'`. This is the only path that skips the polling round-trip; everything else goes async.

**Error cases (structured, with `suggestion` per the existing AGENTS.md contract):**
- `brief_too_vague` — "brief is <20 chars or lacks any verb. Add what the vendor must do." Suggests 2–3 questions to refine.
- `category_inference_failed` — discovery couldn't pin a category. Suggests passing `category` explicitly.
- `discovery_exhausted` — fewer than `min(max_candidates, 3)` candidates found after both passes. Returns the partial list.
- `job_capacity` — Worker queue full. Suggests retry with backoff; surfaces `retry_after_seconds`.

### 3.2 `get_vendor_ranking` (poll the job)

**Input:** `{ job_id: z.string().regex(/^rnk_[A-Z0-9]{26}$/) }`

**Return — `status: completed`:**
```ts
{
  job_id, status: 'completed',
  rubric_version: '0.8',
  brief: '<echo>',
  inferred_category: 'payments',
  methodology: { /* §7 */ },
  candidates: [
    {
      rank: 1,
      vendor: { name: 'Stripe', domain: 'stripe.com', slug: 'stripe' },
      headline_score: 78,           // max across scored surfaces (matches /scorecard convention)
      headline_level: 3,            // 0–4
      headline_surface: 'docs.stripe.com',
      surfaces_scored: [            // every surface we probed
        { url: 'https://stripe.com', score: 45, level: 2, source: 'live', scored_at: '2026-05-17T14:02:11Z' },
        { url: 'https://docs.stripe.com', score: 78, level: 3, source: 'cache', scored_at: '2026-05-15T09:01:44Z', cache_age_hours: 53 },
      ],
      discovery_source: 'llm+registry-verified',
      fit_to_brief: {               // separate from rubric — see §6
        score: 0.92,                // 0–1
        rationale: '≤140 chars one-liner — why this vendor matches the brief',
      },
      cf_portfolio: false,          // see §7
      anti_patterns_flagged: ['agents-without-rules'],
      top_move: 'Publish /AGENTS.md at the marketing root.',
    },
    // ... up to max_candidates
  ],
  discovery_dropped: [              // candidates considered and rejected, with reason
    { name: 'AcmePay', reason: 'domain_not_resolvable' },
    { name: 'FooBilling', reason: 'duplicate_of_stripe' },
  ],
  warnings: [],                     // surface-level issues that didn't block (e.g., "vendor X blocked our scorer")
}
```

**Return — `status: running`:** `{ status, progress: { discovered: 7, scored: 3, total: 7 }, eta_seconds: 28 }`.
**Return — `status: failed`:** `{ status, error: <code>, suggestion: <one-line>, partial_result?: {...} }`.

### 3.3 `get_cached_vendor_score` (read-through cache)

Lets an agent look up a single previously-scored vendor without re-running discovery. Returns `null` if no cache entry exists; never triggers a live scoring run.

**Input:** `{ vendor_domain: z.string().describe('Naked domain, e.g. "stripe.com"') }`
**Return:** the per-vendor entry from §3.2 (`vendor`, `headline_score`, `surfaces_scored`, etc.) plus `methodology`, or `{ status: 'cache_miss' }`.

### 3.4 `rescore_vendor` (force-refresh; sync)

Re-runs `score_website` against the named vendor's known surfaces, bypassing cache. Sync — typically 5–10s for 2–3 surfaces. Exists so an agent reading a stale score can refresh without going through discovery.

**Input:** `{ vendor_domain, surfaces?: string[] }`
**Return:** the per-vendor entry, updated in cache as a side effect.

**Why four tools, not one:** the four-tool surface keeps each tool single-purpose (Interface First — verb-first, narrow signature) and avoids the 11-parameter monolith. Each tool has a documented use case in §8 / AGENTS.md.

---

## 4. Vendor discovery strategy

**Recommended: hybrid (LLM proposes, curated registry verifies + augments).**

Two-pass pipeline:

**Pass 1 — Registry lookup.** A hand-maintained `tools/agentsfirst-mcp-worker/src/vendor-registry/registry.yaml` (gitted; committed every change) lists vendors Josh has *already* scored or vetted, keyed by category. Schema:
```yaml
payments:
  - name: Stripe
    domain: stripe.com
    surfaces: [stripe.com, docs.stripe.com, dashboard.stripe.com]
    aliases: [stripe inc]
    cf_portfolio: false
    last_human_review: 2026-05-10
```
On every `rank_vendors` call, the inferred (or supplied) category gates a registry lookup. Registry hits are gold-standard candidates — no LLM hallucination risk, surfaces are pre-vetted.

**Pass 2 — LLM proposes net-new candidates** to fill the gap between `registry_hits.length` and `max_candidates`. The Worker calls **Anthropic Claude Haiku** (cheap, fast) with a structured prompt: "Given this brief, list up to N additional vendor names + naked domains that aren't already in this set: {registry domains}. Return JSON only." LLM output is then **verified** by a single `HEAD` request to each proposed domain — proposals that 404 or don't resolve are dropped (logged as `discovery_dropped: { reason: 'domain_not_resolvable' }`).

**Why hybrid wins the other three options:**

- **Pure LLM** loses on falsifiability (the credibility-hit constraint from the spec). Every result includes a hallucination risk Josh can't audit.
- **Pure web-search (Exa/Tavily/Brave)** adds a new paid dependency, a new latency floor (≥1s per query), and a new failure mode — the search API itself can rate-limit Josh's tool. The thesis already eats one external-API dep (Anthropic); adding a second for a feature that's solvable with registry+verify is overhead.
- **Pure curated registry** can't handle long-tail or net-new categories. Pass 2 covers the tail.

**Registry maintenance:** the existing `/scorecard` pipeline already produces `reports/<slug>/scoring-data.json`. A small post-commit hook (deferred to v1.1) folds new report slugs into `registry.yaml` automatically. v1 is hand-maintained — the registry starts with the ~50 vendors already scored in `reports/` + the 25 CF portfolio pilot companies from `tools/cf-portfolio-pilot.py`.

---

## 5. Scoring pipeline

End-to-end flow once discovery produces N candidates:

1. **Surface enumeration per vendor.** For each candidate, derive the surface list: marketing root (`https://<domain>`), docs (`https://docs.<domain>` if it 200s on HEAD), and dev portal (`https://developers.<domain>` or `https://<domain>/developers`). Registry-known surfaces override derivation.
2. **Cache check (per surface).** KV-backed (`AGENTSFIRST_SCORE_CACHE` namespace), key = `sha256(surface_url + rubric_version)`, value = the full `score_website` response + `scored_at` ISO + the *exact rubric_version* it was scored against. TTL: 7 days. On rubric version bump, the cache invalidates by version-keying — old entries simply never match.
3. **Parallel `score_website` fanout.** Surfaces not in cache (or stale per `cache_policy`) get queued. Concurrency cap: **6 parallel scoring runs across the entire job** (one `score_website` call = 14 outbound HTTP fetches per the existing AGENTS.md — so 6×14 = 84 concurrent fetches max). The Worker's internal scoring code is reused as-is; no re-implementation.
4. **Headline score = max across this vendor's scored surfaces.** This matches the `/scorecard` skill convention (the Anthropic report above scores `docs.anthropic.com` 60 and the marketing root 5; headline is 60). Document this explicitly — agents shouldn't average.
5. **Per-vendor `fit_to_brief` score** (separate from the rubric — see §6).
6. **Rank** by `headline_score` (primary key) → `fit_to_brief.score` (tiebreaker) → `headline_level` (final tiebreaker). Stable sort.
7. **Write methodology block** (§7).
8. **Persist** the job result to KV (`AGENTSFIRST_JOB_RESULTS`, TTL 24h) — `get_vendor_ranking` reads from here.

**No new dependencies.** Anthropic SDK is already in the Worker for `agentsfirst_prep`'s embedding lookup; the discovery LLM call reuses it. KV namespaces are part of the Worker config — adding two new namespaces is config, not infra.

---

## 6. Output format

**The MCP response is structured JSON, period.** Following the existing tool contract (every `score_website` response is `JSON.stringify(payload, null, 2)` inside a `text` content block), `rank_vendors` returns the structured object documented in §3.2 — no markdown rendering by the server.

**Why structured-only, not "both":** the AGENTS.md anti-pattern list for the existing server explicitly says "don't pass the raw JSON output into a chat; render the report. The structured response is the input to a human-readable artifact, not the artifact itself." The same applies here. If we ship a `render: 'markdown' | 'json'` parameter, agents will use the markdown path lazily and the structured contract degrades.

For agents that need a one-paragraph human-readable summary, the response includes `methodology.summary_sentence` ("Stripe, Adyen, and Square ranked top 3 of 5 candidates for payments. Stripe headlines at 78/100 (Level 3, Agents First) on docs.stripe.com…"). Agents lazy-render that field; agents doing real work walk the candidate array.

---

## 7. Methodology disclosure (REQUIRED — non-negotiable)

Every `rank_vendors` / `get_vendor_ranking` / `get_cached_vendor_score` response **must** include a `methodology` block at the top of the return value (not buried in a footer). Schema:

```ts
methodology: {
  rubric_version: '0.8',                     // ties to /api/principles.json
  rubric_url: 'https://agentsfirst.dev/principles/',
  discovery_method: 'registry+llm-verified', // enum: registry-only | llm-only | registry+llm-verified
  discovery_llm: 'claude-haiku-4-5' | null,
  surfaces_probed_per_vendor: 3,             // max across candidates
  cache_breakdown: { live: 4, cached: 8, cache_age_p50_hours: 18 },
  cf_portfolio_flagged_count: 1,             // how many candidates carry the CF flag
  cf_disclosure: 'Joshua Baer (rubric author) is CEO of Capital Factory. Candidates from CF portfolio are flagged per-vendor with cf_portfolio: true. See https://agentsfirst.dev/about/conflict-of-interest.',
  scoring_pipeline_url: 'https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp-worker/src/score.ts',
  summary_sentence: '<one paragraph>',
  generated_at: '2026-05-17T14:05:33Z',
}
```

Per-candidate, the conflict flag also surfaces as `cf_portfolio: boolean` (already in §3.2). If `cf_portfolio: true`, the candidate's `vendor` object also carries `cf_portfolio_disclosure: 'Capital Factory portfolio company. Score is run on the same rubric, surfaces, and cache policy as non-portfolio vendors.'`

**Why this is non-negotiable:** the adversarial-review hit in the prompt is real — a tool that returns purchase-shaping rankings from a rubric authored by a VC who also invests in some of the ranked companies is a credibility cliff. Hiding the conflict in a `/about/conflict-of-interest` page is what got the existing site flagged; the disclosure must travel *with the data*. A new `https://agentsfirst.dev/about/conflict-of-interest` page ships as part of v1 — the URL has to resolve before `rank_vendors` goes live (added to the Week 1 acceptance criteria).

**`include_cf_portfolio: false` flag** lets a caller exclude CF portfolio companies entirely (for users who'd rather not engage with the conflict at all). Default is `true` with the flag — i.e., transparency-by-default, not exclusion-by-default. The methodology block records which mode was used.

---

## 8. AGENTS.md / Contract First

A new section appended to `tools/agentsfirst-mcp-worker/AGENTS.md` (the existing file is 80 lines / well under the 1500-token budget; adding the rank_vendors section brings it to ~150 lines, still under cap). Key clauses:

**When to call vs. not call:**
- Call `rank_vendors` when the user needs a vendor for a defined capability and hasn't named one. "find me 5 payment processors that ship MCP" → yes. "what's Stripe's score?" → no, use `score_website` directly.
- Don't call `rank_vendors` for queries about specific named vendors. The discovery pass is wasted; call `score_website` or `get_cached_vendor_score`.
- Don't call `rank_vendors` more than once per session against the same brief. The `inputs_hash` is idempotent; re-running burns Worker quota for the same answer.

**Interpreting scores:**
- **Headline ≥75 (Level 3, "Agents First"):** ship-ready. The vendor has MCP/CLI/SDK + AGENTS.md + content negotiation. Low integration risk.
- **Headline 30–74 (Level 2, "Agent-Aware"):** workable but expect to wrap. Pull in their REST API; don't expect an MCP server to exist.
- **Headline <30 (Level 0–1):** don't recommend to a user-agent unless no Level-2+ alternative exists. Surface the gap to the human; they may have non-agent-readiness reasons to pick it anyway.

**What "prioritized" means:** the candidate array is **sorted by `headline_score` descending**, with `fit_to_brief.score` as the first tiebreaker and `headline_level` as the second. This is documented in the response and in AGENTS.md so agents don't re-sort and lose the tie-break logic.

**Permissions:** read-only. Same as the rest of the Worker. No mutations, no writes, no outbound except scoring fetches against the candidate domains (carries the same `agentsfirst-mcp-worker/0.1` UA per existing AGENTS.md, so vendors who block the scorer block this tool too — surfaced as a per-candidate warning, not a hard error).

---

## 9. Failure modes

| Failure | Response |
|---|---|
| Brief too vague | `error: brief_too_vague` + suggested clarifying questions. Sync, before discovery starts. |
| LLM discovery returns 0 verifiable candidates | Pass 2 falls back: prompt LLM again with `category` hint and stricter constraints; if still 0, return `discovery_exhausted` with registry-only results + warning. |
| Vendor domain returns 404 on HEAD | Drop from candidates, log in `discovery_dropped`, surface count in the methodology block. |
| Vendor blocks the scorer (403, robots-disallow) | Surface as `surfaces_scored[].source: 'blocked'`, score: null. Vendor still appears in the ranking with `headline_score: null` and ranks last with a warning. Don't silently exclude — blocked status IS the signal. |
| `score_website` times out (>15s on a surface) | Mark that surface as timed-out; use other surfaces. If all surfaces time out, score: null + warning. |
| Anthropic API rate-limited (discovery) | Retry with backoff per existing autonomous-recovery helper; if budget exceeded, fall back to registry-only with `methodology.discovery_method: 'registry-only'`. |
| KV cache unavailable | Degrade to no-cache; every surface scored live. Warning in methodology. |
| Job queue full | `error: job_capacity` + `retry_after_seconds`. |
| Worker hits 30s CPU limit | Job is checkpointed at the last-completed surface; resume on the next poll. Cron-driven background continuation deferred to v1.1; v1 simply returns `status: 'failed', error: 'budget_exceeded', partial_result: {...}`. |

All errors follow the existing `{ error, suggestion, detail? }` shape from the AGENTS.md errors section. No bespoke shape for the new tools.

---

## 10. Agents First self-check (target: Level 3, ≥80/100)

| # | Principle | Implementation | Self-score |
|---|---|---|---|
| 1 | Interface First | 4 new verb-first MCP tools, zod params, no human dashboard. | ✅ |
| 2 | Contract First | New AGENTS.md section drafted in §8 BEFORE any code. Kept under 1500-token cap. | ✅ |
| 3 | Prep Gates | Reuses existing `agentsfirst_prep`; adds a check for KV namespace reachability + Anthropic SDK key present. | ✅ |
| 4 | Typed State | Job results + cache entries are zod-schema'd; KV values are JSON-validated on read. Schema_version on every cache entry — invalidates on rubric bump. | ✅ |
| 5 | Visible Outputs | Tool response IS the artifact (read-only server, like the rest). For ops visibility, `inspect_vendor_jobs` overview tool (next row) doubles as the inspectable surface. | ✅ |
| 6 | Multi-Model Verification | Discovery is single-model (Haiku). Documented limitation in methodology block. Scoring itself is deterministic (no LLM) — multi-model is N/A. Flagged for v1.1 if hallucination rate >5%. | 🟡 |
| 7 | Perspective Dispatch | N/A for a single-call ranking tool. Documented as N/A in self-score, not pretended. | N/A |
| 8 | Autonomous Recovery | Reuses existing backoff helper. KV / Anthropic / scorer failures degrade rather than crash; partial results returned. | ✅ |
| 9 | Inspectable State | Add ONE more tool — `inspect_vendor_jobs` — returning queue depth, recent runs, cache hit rate, top discovery_dropped reasons. Brings tool count to 9 (well under 30-tool warn line). | ✅ |

Self-projected score: **82/100, Level 3.** Anything below 80 on the dogfood pass is a kill-the-feature signal — the thesis can't ship a vendor-ranking tool that itself fails the rubric.

---

## 11. Anti-patterns to avoid

| Anti-pattern | What it'd look like | Guardrail |
|---|---|---|
| **Lazy Wrapper** | `rank_vendors` becomes "ask LLM for vendor names, score them, return list" with no rubric-version pinning, no discovery verification, no methodology block. | Registry-first discovery + HEAD verification + structured methodology in every response. |
| **God Server** | Adding `rank_vendors_v2`, `rank_vendors_for_pdf`, `rank_vendors_with_pricing`… per use case. | One `rank_vendors` tool. New use cases parameterize the existing tool or live in a separate Worker. Hard cap at 12 tools on this Worker. |
| **Black Box Server** | No way for an operator agent to see why a ranking returned what it did. | `inspect_vendor_jobs` + per-candidate `discovery_dropped` reasons + `methodology.cache_breakdown`. |
| **Token Dump** | AGENTS.md balloons past 1500 tokens with rank_vendors specifics. | The rank_vendors section is hand-authored, ≤500 tokens added on top of the existing 1500-token cap; if it overflows, split to `AGENTS-rank-vendors.md` (file-per-lane pattern from the radar design). |
| **Single-Model Trust** | Discovery hallucinations get shipped into a user's purchase decision unflagged. | HEAD verification + `methodology.discovery_method` field + v1.1 trigger to add multipov consensus discovery if hallucination rate >5%. |
| **Ship and Forget** | Registry rots; vendors that shipped MCP last week never appear. | The `last_human_review` field in `registry.yaml` is checked weekly by `/agentsfirst-radar`; entries >90d stale flagged in the daily briefing. |
| **Slow Chatbot** | The tool prompts the user mid-discovery for clarification. | Discovery is autonomous. `brief_too_vague` returns synchronously *before* the job starts; never blocks mid-job. |

---

## 12. Future cleanup / explicitly deferred

| Item | Why deferred | Trigger to revisit |
|---|---|---|
| Multi-LLM consensus discovery | Single-model is acceptable for v1 because HEAD-verification catches hallucinations. | If `discovery_dropped` >20% sustained over 100 runs. |
| Web-search backend (Exa / Tavily) | Adds a paid dep; registry+LLM covers the 80% case. | If long-tail categories (vector-db, llm-gateway) consistently exhaust the registry. |
| Pricing data per vendor | Out of scope — rubric is about agent-readiness, not commercial fit. | Never, probably. Adjacent product. |
| Auto-pull from `reports/*` into registry | Manual maintenance is fine at ~5 new vendors/month. | If reports cadence exceeds 2/week. |
| Streaming results | `rank_vendors` already async; streaming partials saves polling round-trips. | If p50 job duration exceeds 90s. |
| `score_codebase` on candidate repos (in addition to website) | Many vendors don't have a public repo; signal-to-noise is poor. | If a major-vendor pattern emerges where repo signal dominates web signal. |
| Cache warming for the CF portfolio set | Today the cache is read-through only. | If CF-portfolio-related queries spike. |

---

## 13. Open questions

1. **Pricing / quota model.** The existing 5-tool Worker is free + unrate-limited. `rank_vendors` is materially more expensive (Anthropic discovery + 5×3=15 `score_website` calls per default invocation). Recommend: leave it free in v1 with a per-Worker daily budget cap (`MAX_RANK_JOBS_PER_DAY`, default 200) that returns `job_capacity` past the cap. Revisit pricing after we see actual usage from a week of public traffic.
2. **Public vs. paid tier.** Should `rank_vendors` ship behind an auth tier (paid API key gates) or remain on the public Worker? Recommend: public for v1 — the methodology disclosure constraint *requires* maximum scrutiny, which requires maximum availability. Auth is a v2 conversation if abuse emerges.
3. **CF portfolio default.** Spec'd `include_cf_portfolio: true` by default with the conflict flag. Alternative: `false` by default. Recommend keeping the default `true` because excluding-by-default lets Josh's product *implicitly* hide a conflict (which is worse than disclosing it). But this is a values call — Josh may overrule.
4. **Multi-surface scoring policy.** Headline = max across surfaces. Alternative: weighted average (marketing root 40% / docs 60%). Recommend max for consistency with `/scorecard`; the rationale (Anthropic-style 5-vs-60 spread tells a real story) is in the existing reports.
5. **What renders the per-vendor `fit_to_brief.score`?** Currently spec'd as another Haiku call against the brief + each vendor's homepage description. Cheap but adds a second LLM dependency. Alternative: drop the `fit_to_brief` field entirely and rank purely on `headline_score`. Recommend keeping `fit_to_brief` — it's the differentiator that makes the tool useful for vague briefs — but explicitly mark it as LLM-derived in the response shape.
6. **MCP namespace inheritance.** Should the npx package expose `rank_vendors` (which round-trips to the Worker) or be Worker-only? Recommend Worker-only in v1; the npx package adds the four tools as deferred-to-remote stubs (mirroring how `score_codebase` is a deferred-to-local stub today). Symmetric design.
