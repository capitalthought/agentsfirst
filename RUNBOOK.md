# agentsfirst-radar — Operational Runbook

Companion to the design doc at `docs/plans/2026-05-15-agentsfirst-radar-design.md` and the rules at `tools/agentsfirst-radar/AGENTS.md`. Reach for this file when something goes wrong in production.

## Quick reference

| Symptom | First thing to check |
|---|---|
| No briefing this morning | Healthchecks.io `agentsfirst-radar-daily` slug — is it red? Then check GHA workflow runs. |
| Dead-man's-switch paged | `state/last-run.txt` timestamp + the joshhome runner status |
| iMessage didn't land but briefing committed | `state/imsg-last-success.json` age + chat.db lock + LaunchAgent on joshhome |
| `agent_paused` flag is true | `state/radar-state.json` — read `pause_reason`. Don't unpause without RCA. |
| Cold-start banner in briefing | `state/radar-state.json` is missing or unparseable. See "Cold start" below. |
| Schema rollback needed (v2 → v1) | See "Schema rollback" below. |
| Multipov spend exhausted | `state.multipov_spend_today_usd` ≥ $10. Resets at UTC midnight. |
| Listener daemon dead | LaunchAgent on joshhome; see "imsg-listener" below. |

## Infrastructure inventory (set up once at deploy)

These are the TODOs flagged in `tools/agentsfirst-radar/README.md` — they don't exist until you create them.

| Item | Owner | Purpose |
|---|---|---|
| Healthchecks.io slug `agentsfirst-radar-daily` | ops | Heartbeat for the daily cron run; alert if >28h stale |
| Healthchecks.io slug `agentsfirst-radar-paused` | ops | Distinct alert path when `agent_paused = true` (so a paused state isn't read as a dead cron) |
| Healthchecks.io slug `agentsfirst-radar-imsg` | ops | iMessage delivery — alert if `state/imsg-last-success.json` >25h stale even when daily slug is green |
| Cloudflare Worker dead-man's-switch | ops, joshshop account | Polls `state/last-run.txt` on the agentsfirst repo via GitHub API every 6h; pages Josh (Pushover) if file >28h old |
| GHA secrets (5): `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `MULTIPOV_API_KEY`, `SOCIAL_WORKER_KEY`, `HC_RADAR_PING_URL` | ops | All 5 must be set on the agentsfirst repo before the first cron fires |
| "Radar: Triage" Asana project | COS team | Unassigned tasks land here; COS routes |
| Self-hosted RSSHub Docker container on joshhome | ops | Public rsshub.app is untrusted; we self-host per P2-R3 |
| LaunchAgent for imsg-listener on joshhome | ops | Always-on daemon that watches chat.db for replies. Plist at `~/Library/LaunchAgents/com.capitalthought.agentsfirst-radar-listener.plist`; load with `launchctl bootstrap gui/$(id -u)` |
| `state/cos-skip-dates.json` first commit | COS team | List of dates to skip (SXSW prep, board prep, family travel) |

## Cold start (first-ever run, or recovery from lost state)

```bash
cd ~/Xcode/agentsfirst/tools/agentsfirst-radar
npm install
npm run state:init                   # writes a fresh v1 state to ../../state/radar-state.json
npm run radar:dry-run                # smoke test — no commits, no iMessage; prints briefing preview
```

If dry-run looks reasonable, kick a real run from the GHA workflow_dispatch UI with `dry_run = false` and `skip_tz_guard = true`. Watch the heartbeat slug.

## Schema rollback (v2 deployed; need to revert to v1)

The radar refuses to run on a state file whose `schema_version > CURRENT_SCHEMA_VERSION` of the binary. Per design §5.1, rollback is **NOT automatic**.

Two scenarios:

### A) Rollback the code, keep the v2 state (NOT POSSIBLE)
Don't do this. The v1 code will fail-closed on the v2 state and you'll get a cold-start banner forever. See path B.

### B) Rollback both code AND state (the supported path)

1. On joshhome, find the most recent pre-bump backup:
   ```bash
   ls -t state/radar-state.json.v1.bak | head -1
   ```
2. Restore it over the live state:
   ```bash
   cp state/radar-state.json.v1.bak state/radar-state.json
   ```
3. Revert the radar package to a tag/commit known to be on v1:
   ```bash
   git checkout <pre-v2-commit> -- tools/agentsfirst-radar/
   ```
4. Smoke-test:
   ```bash
   cd tools/agentsfirst-radar && npm run radar:dry-run
   ```
5. Commit the rollback (don't `--force` push — make a real revert commit):
   ```bash
   git -C ~/Xcode/agentsfirst add tools/agentsfirst-radar/
   git -C ~/Xcode/agentsfirst commit -m "chore(radar): rollback to v1 schema (RCA: <reason>)"
   git -C ~/Xcode/agentsfirst push
   ```

If the v2 migration was tagged `irreversible: true`, the `down()` doesn't exist and you have to:
- Either accept the loss of new fields added in v2 (acceptable for most fields)
- Or wait for v1.5 code that knows how to read v2 state with backward compatibility (preferred)

The GHA workflow's "State backup" step automatically writes `state/radar-state.json.v${SCHEMA_VERSION}.bak` before every run, so the most recent backup is at most 24h old.

If no backup exists, the recovery path is `npm run state:reset -- --keep-seen-urls` (NOT IMPLEMENTED YET — TODO for v2 work).

## State corruption (zod validation fails)

The radar's prep gate runs `readState()` which zod-validates. On failure it writes a degraded briefing ("🚨 Cold start — state was missing or unparseable") and exits.

Inspect the bad state:
```bash
cd ~/Xcode/agentsfirst
jq . state/radar-state.json | head -100         # surface JSON parse errors
node -e "const z = require('./tools/agentsfirst-radar/node_modules/zod'); const { RadarState } = require('./tools/agentsfirst-radar/dist/state.js'); RadarState.parse(JSON.parse(require('fs').readFileSync('state/radar-state.json', 'utf8')))" 2>&1 | head -20
```

Most common causes:
- Manual edit introduced a typo (e.g., a `status: 'acceptedd'` typo invalidates the RecStatus enum)
- A migration was started but didn't complete (schema_version bumped but field shape didn't)
- A truncated write (shouldn't happen with atomic write, but disk-full mid-rename is possible)

Recovery: copy from the most recent `.v${N}.bak` backup, or re-init from scratch with `npm run state:init`.

## Pause / resume (the kill switch)

Activate the kill switch when the radar produces a bad recommendation:

```bash
cd ~/Xcode/agentsfirst
jq '.agent_paused = true | .pause_reason = "<RCA description>"' state/radar-state.json > /tmp/s.json
mv /tmp/s.json state/radar-state.json
git add state/radar-state.json   # NOTE: state/radar-state.json is gitignored.
# Pause is enforced via state read at prep gate, but state itself is not committed.
# To make the pause persistent across joshhome restarts that lose the working tree,
# the better path is to set `agent_paused: true` in the workflow_dispatch input
# (and revert via the same UI). Or use the snapshot-weekly.json path which IS committed.
```

Then the next cron run reads the flag, writes a paused briefing, pings `agentsfirst-radar-paused` HC slug, and exits clean.

To resume: set `agent_paused: false` and clear `pause_reason`. Next cron fires normally.

## iMessage delivery debugging

Symptoms: briefing committed (`docs/checks/<date>-radar.md` exists), HC `agentsfirst-radar-daily` is green, but no iMessage in Josh's 1:1 with mikey@capitalfactory.com.

1. Check `state/imsg-last-success.json` — what's the most recent successful send?
2. If stale: did the iMessage account on joshhome log out? (Open Messages.app, check accounts.)
3. Is chat.db locked? `lsof | grep chat.db` from joshhome.
4. Did `~/bin/imsg` get deleted? It's the wrapper; fall-back is osascript via Messages.app.
5. Did the chat get archived? Resolution depends on the chat being style=45 (1:1) and active.

Manual smoke test from joshhome:
```bash
~/bin/imsg send mikey@capitalfactory.com "🛰️ Radar smoke test from $(hostname)"
```

If the manual test works but the radar's send doesn't, check `RADAR_DRY_RUN` isn't set in the GHA env.

## imsg-listener daemon

LaunchAgent on joshhome runs `npm run listener` from `tools/agentsfirst-radar/` as a long-lived process. Restart:

```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.capitalthought.agentsfirst-radar-listener.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.capitalthought.agentsfirst-radar-listener.plist
```

Tail the daemon's log:
```bash
tail -F ~/Library/Logs/agentsfirst-radar-listener.log
```

Manually replay a parsed mutation (if the daemon dropped it):
```bash
cd ~/Xcode/agentsfirst
echo '{"iso":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","verb":"accept","rec_id":"22ea794e","raw_reply":"manual replay","imsg_guid":"manual"}' >> state/mutations.jsonl
# Next cron run will fold this into state.
```

Daemon's seen-guids cache (prevents replay after restart):
```bash
cat ~/.cache/agentsfirst-radar/seen-imsg-guids.json | jq .
# Wipe to force re-processing of recent replies (rarely needed):
rm ~/.cache/agentsfirst-radar/seen-imsg-guids.json
```

## Multipov cap exceeded mid-run

Symptoms: website-lane recs missing from the briefing, "Website lane: degraded — multipov cap exceeded" in the source-health line.

The cap (`MULTIPOV_DAILY_CAP_USD`, default $10) resets at UTC midnight. To override for one run:

```bash
RADAR_MULTIPOV_CAP_USD=25 npm run radar
```

To override permanently: set `RADAR_MULTIPOV_CAP_USD` in the GHA workflow env block.

## Cron didn't fire

1. Check GHA Actions tab — is the scheduled workflow run listed?
2. If yes but with skip output ("Chicago hour is X, not 07"): that's the DST guard working as designed. Manually fire via workflow_dispatch with `skip_tz_guard = true` if you need an immediate run.
3. If no run listed at all: GHA's scheduled triggers can lag during high-load periods. Wait 30 minutes; if still nothing, fire manually.
4. If the run started but never completed: check joshhome runner status (`~/actions-runner-org/svc.sh status`).

## Source-list churn

The radar requires source-list maintenance (per design Month-1 acceptance criterion: ≥1 added/week, ≥1 retired/replaced/month). Without this, sources decay silently into noise.

Edit `tools/agentsfirst-radar/sources.json` and commit. Next run picks it up. To preview the impact of a sources change before committing, use `--dry-run`.

## Where things live (path cheat sheet)

| What | Where |
|---|---|
| Design doc | `docs/plans/2026-05-15-agentsfirst-radar-design.md` |
| Agent rules (Contract First) | `tools/agentsfirst-radar/AGENTS.md` |
| Source TypeScript | `tools/agentsfirst-radar/src/` |
| Listener daemon entry | `tools/agentsfirst-radar/bin/imsg-listener.ts` |
| Main cron entry | `tools/agentsfirst-radar/src/radar.ts` |
| GHA workflow | `.github/workflows/agentsfirst-radar.yml` |
| MCP server (radar_overview tool) | `tools/agentsfirst-mcp/src/server.ts` |
| State file (gitignored) | `state/radar-state.json` |
| Mutations log (gitignored) | `state/mutations.jsonl` |
| Unparsed-reply log (gitignored) | `state/imsg-unparsed.jsonl` |
| LLM anomaly log (gitignored) | `state/llm-anomalies.jsonl` |
| Dead-man's-switch input (committed) | `state/last-run.txt` |
| Cold-start anchor (committed) | `state/snapshot-weekly.json` |
| COS skip-dates (committed) | `state/cos-skip-dates.json` |
| Previous state backups | `state/radar-state.json.v${N}.bak` (gitignored) |

## When to retire the radar

Per design §9 quarter-1 acceptance: if month-3 acceptance rate is <50%, retire the radar and revert to manual `/agentsfirst-check`. Don't keep a noisy agent alive.

Retirement procedure:
1. Disable the GHA workflow (Settings → Actions → Workflows → Disable).
2. Bootout the listener LaunchAgent.
3. Set `agent_paused: true` with `pause_reason: 'retired-month-3-noise'` (so a manual `npm run radar` is also a no-op).
4. Archive `state/` to `~/icloud/agentsfirst-radar-retired/<date>/` (preserve the audit trail).
5. Remove the package: `rm -rf tools/agentsfirst-radar`. Keep the design doc + this RUNBOOK as the post-mortem record.
