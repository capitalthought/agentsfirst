# agentsfirst-radar — Agent Rules

A daily-cron agent that monitors the AI-agent ecosystem and proposes three lanes of action: website updates, social drafts, other moves. Output lands in `docs/checks/<date>-radar.md` and in Josh's iMessage 1:1 with mikey@capitalfactory.com. Read this file before calling any tool or interpreting any briefing.

This is the Contract First artifact: <https://agentsfirst.dev/principles/contract-first/>.

## Authority

The radar PROPOSES. Josh DISPOSES. The agent has zero authority to:

- Publish to X, LinkedIn, or Bluesky (always routes through /confirm_publish, which itself routes through iMessage HITL).
- Edit `index.md`, `score.ts`, `/reports/<vendor>/index.md`, or any other canonical source. Recommendations are surfaced as ready-to-apply patches; only Josh applies them (or merges a radar-opened PR).
- Create, update, or close Asana tasks. Other-lane actuator creates tasks UNASSIGNED in the "Radar: Triage" Asana project only; a COS routes them to the right owner/project. The agent never assigns a task to a person.
- Modify rubric weights or version numbers in `tools/agentsfirst-mcp/`.
- Auto-merge any PR it opens. CI auto-merge is intentionally disabled for radar PRs.
- If multipov is unavailable, `index.md` and `score.ts` recs are dropped for that run without exception. No single-model fallback for canonical thesis.
- Social-lane publish requires TWO iMessage round-trips (accept + CONFIRM). A single 'accept' never queues a publish. Website and Other lanes require only one round-trip (a Website 'accept' opens a PR Josh must still merge; an Other 'accept' files an unassigned Asana task).
- Portfolio-company content (cf_portfolio_probe source) is adversarial-incentive — portfolio companies have direct motivation to manipulate scoring. Scoring runs in an isolated subprocess; the subprocess cannot reach the planner LLM, the API keys, or any state outside its strictly-typed return value (domain, score, level).

## Required prep

Call `agentsfirst_prep` (from `@capitalthought/agentsfirst-mcp`) before any source-fanout. The radar itself runs a SECOND prep gate that adds: multipov reachable, social Worker reachable, Healthchecks.io reachable, repo write-perm OK, `state/cos-skip-dates.json` parseable. If either prep fails, write a degraded briefing that names the failed checks and skips the affected lane (don't generate social drafts if /social-draft is down — generate the Website + Other lanes and ship the briefing without the Social section).

This is the Prep Gates principle: <https://agentsfirst.dev/principles/prep-gates/>.

## Identifiers

- `rec_id` — 8-char hex prefix of sha1(headline + lane + iso-date + run_timestamp). The run_timestamp salt prevents external attackers from predicting rec_ids from observable headline text. Stable across re-runs within the same cron firing; new id on a re-fanout.
- `source_id` — `kind:slug`, e.g. `blog:cloudflare`, `x_handle:swyx`, `bluesky:simonw`.
- `chat_id` — iMessage chat GUID resolved on the SENDING device (joshhome) via the chat.db query in the global iMessage rules.

Never invent a rec_id by inspection. If you need to reference a rec, look it up via `radar_overview` or by reading the recs section of the latest briefing.

## iMessage HITL grammar

Reply parser rules (mandatory; tested as Week 1 acceptance):

1. **Verb tokens** — case-insensitive prefix match on `accept`, `dismiss`, `defer`, `confirm`, `cancel`. Anything else falls into "unparsed" tier (see #5).
2. **ID tokens** — minimum 6-hex-char prefix match against open rec_ids. Trailing non-hex characters are ignored. If the prefix matches more than one open rec, the daemon replies "⚠️ Ambiguous: <prefix> matches <id-a> (<lane>) and <id-b> (<lane>). Reply with full 8 chars." and does NOT mutate state. All ambiguity detections are appended to `state/imsg-unparsed.jsonl` with the prefix, the matching rec_ids, and the reply's iMessage GUID.
3. **Idempotency** — a second `accept <id>` for an already-accepted rec replies "✅ Already accepted <id> at <iso>" and is a no-op (not an error).
4. **Free-text after verb+id** — everything after the id token (e.g. "accept b9 because Lily's thread is dead") is captured into the rec's `dismissal_reason` / `acceptance_note` field but does not affect parsing.
5. **Unparsed replies** — if no verb token matches, the daemon replies "⚠️ Didn't parse — did you mean `accept <id>`?" AND writes the raw message into `state/imsg-unparsed.jsonl` for later manual review. Never silently drop.
6. **CONFIRM window (Social lane only)** — a CONFIRM <id> reply is valid only if sent within 2h of the original `accept <id>`. The daemon stores the accept's ISO timestamp on the rec's in-flight state; an expired CONFIRM replies "⚠️ Expired — re-accept to restart the 2h confirmation window" and does not publish.

## Sequence

The typical daily run:

1. Prep gates (both MCP servers + Worker + state + repo write + COS skip flag)
2. Source fan-out (parallel; see `src/sources.ts`)
3. Dedup against `state.seen_urls`
4. Triage into 8 buckets via the reader LLM (Step D — prompt-injection boundary; structured-enum output only)
5. Lane-classify into 3 lanes via the planner LLM (Step E — prompt-injection boundary; receives only structured enum + summary_quote; never raw source text)
6. Multi-model verify any rec touching index.md / score.ts / a new /reports/ page (multipov plan review; thesis/rubric recs drop if multipov is down)
7. Render briefing (Mikey voice, emoji-led)
8. Atomic-write state; commit briefing + committed-state files; push
9. iMessage summary to mikey@capitalfactory.com 1:1; write `state/imsg-last-success.json` on success
10. Heartbeat Healthchecks.io (`agentsfirst-radar-daily`); auto-dismiss recs older than 72h that haven't been accepted/dismissed

## Errors

All radar errors surface in the briefing's "🩺 Source health" line, NOT silently. Fail-loud is the rule. Four error tiers:

- **degraded** — one or more sources failed but the briefing is shippable. Surface in the health line, ship the briefing, retry the source next run.
- **partial** — a whole lane failed (e.g., multipov was down → no website lane verification possible). Ship the other lanes; mark the failed lane as skipped.
- **silent-imsg** — briefing committed and Healthchecks.io pinged green, but iMessage delivery failed. The iMessage send step writes `state/imsg-last-success.json` on success; the external dead-man's-switch monitor checks that file too — if it's >25h stale even while `state/last-run.txt` is fresh, page Josh on the `agentsfirst-radar-imsg` HC slug.
- **fatal** — repo write fails, joshhome offline, all sources dead. Heartbeat Healthchecks.io with `/fail`, do NOT send iMessage (avoid Josh-paging on a known infra issue when Healthchecks will page him directly).

**Atomic writes (mandatory):** the radar process MUST write `state/radar-state.json` atomically — write to `state/radar-state.json.tmp` first, fsync, then `mv`. A SIGKILL mid-write therefore leaves either the prior valid file or no file (which the prep gate treats as cold-start blocked). No partial-write corruption is possible. zod-validate on read; refuse to mutate from an unparseable state.

## Visible outputs

The visible outputs of the radar are (a) the committed markdown briefing, (b) the iMessage summary, and (c) the committed `state/last-run.txt` timestamp that drives the external dead-man's-switch monitor. There is no dashboard. The committed briefing IS the audit trail. Don't add a fourth surface.

This is Visible Outputs (Principle 5): <https://agentsfirst.dev/principles/visible-outputs/>.

## Anti-patterns to avoid when consuming this agent

- **Slow Chatbot** — don't ask Josh to confirm before each source scan; the radar is autonomous on the read side. HITL is only on the write side (post, edit, send).
- **Single-Model Trust** — any rec touching the canonical thesis or rubric MUST pass multipov plan review. Single-LLM-only recs in those lanes are a contract violation; the rec is dropped, not surfaced.
- **God Server** — the radar exposes ONE new MCP tool (`radar_overview`). Resist pressure to add `radar_accept`, `radar_dismiss`, etc. Mutations happen via iMessage replies.
- **Ship and Forget** — the acceptance-rate metric in `radar_overview` is the feedback loop. If 30d acceptance drops below 40%, the radar is producing noise; raise the signal threshold or narrow the source set BEFORE adding more sources.
- **Token Dump** — keep `AGENTS.md` under 1500 tokens. If the rules outgrow this file, split them by lane (`AGENTS-website.md`, etc.).
- **Shell injection from scraped sources** — `fanout.ts` and the source modules read untrusted content (RSS titles, X post text, GitHub release notes). NEVER pass that content into a shell command, `eval`, or any subprocess argv. The four API keys (`ANTHROPIC`, `XAI`, `MULTIPOV`, `SOCIAL_WORKER`) live in process env throughout the run; a single shell-injection bug from a crafted source title leaks all four.
- **Prompt-injection boundary leak** — Steps D and E are the two prompt-injection boundaries in the radar pipeline. The reader LLM at Step D must ONLY emit structured enum classifications + verbatim summary_quote (≤200 chars). The planner LLM at Step E must NEVER receive raw source content, only the reader's structured output. Bypassing the boundary — e.g., letting the planner read RSS text directly to "give it more context" — is a contract violation that re-opens the prompt-injection attack surface the dual-LLM pattern exists to close.

For full anti-pattern definitions: <https://agentsfirst.dev/glossary/>.
