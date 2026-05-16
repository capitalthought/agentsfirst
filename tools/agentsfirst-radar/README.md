# agentsfirst-radar

Autonomous daily-cron evolution of `/agentsfirst-check`. Monitors the AI-agent ecosystem (RSS / X / Bluesky / LinkedIn / HN / MCP registry / CF ARS / CF portfolio) and proposes three lanes of action to Josh via iMessage:

- **Website** — diff-shaped patches to `index.md`, `score.ts`, `/reports/<vendor>/index.md`
- **Social** — 1-3 ready-to-ship X / LinkedIn / Bluesky posts (via `/social-draft` worker)
- **Other** — Asana tasks, rubric bumps, amplifier DMs, conference CFPs

The agent proposes; Josh disposes. Zero auto-publish, zero auto-edit on canonical thesis.

**Design doc:** `../../docs/plans/2026-05-15-agentsfirst-radar-design.md` (reviewed twice via `/multipov-plan`, 22 spec fixes applied)

**Rules for downstream agents:** `AGENTS.md` (Contract First artifact, ≤150 lines)

## Run

```bash
# One-shot dry-run (no commits, no iMessage, no actuators) — safe to run anywhere
npm run radar:dry-run

# Live run — commits briefing to docs/checks/, sends iMessage summary, mutates state
npm run radar

# Listener daemon (separate process, runs on joshhome as a LaunchAgent)
npm run listener
```

## Environment

| Var | Source | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | 1Password Employee vault | Claude reader/planner LLMs |
| `XAI_API_KEY` | 1Password Employee vault | grok-twitter handle-verify + X queries |
| `MULTIPOV_API_KEY` | 1Password Employee vault | plan review for thesis/rubric recs |
| `SOCIAL_WORKER_KEY` | 1Password Employee vault | social.relradar.ai draft generation |
| `HC_PING_URL` | Healthchecks.io | Heartbeat (`agentsfirst-radar-daily` slug) |
| `RADAR_RSSHUB_HOST` | GHA secret / shell env | Host:port of the self-hosted RSSHub Docker container (defaults to `localhost:1200`). On joshhome, set to the Tailscale MagicDNS name. |
| `IMSG_LISTENER_PORT` | local | TCP port for imsg-listener daemon (default 8731) |

## State

Lives in `<repo-root>/state/`. See design doc §4.1 + §5.1.

- `radar-state.json` — runtime, gitignored, atomically written, zod-validated on read
- `mutations.jsonl` — append-only log of listener mutations, folded in by next cron run
- `imsg-unparsed.jsonl` — append-only audit log of replies that failed the parser
- `snapshot-weekly.json` — committed weekly snapshot of stable fields (cold-start anchor)
- `last-run.txt` — committed every successful run (dead-man's-switch input)
- `cos-skip-dates.json` — committed, COS-maintained; dates the radar should skip

## Outstanding infra (TODOs flagged in PR)

- [ ] Create `agentsfirst-radar-daily`, `agentsfirst-radar-paused`, `agentsfirst-radar-imsg` Healthchecks.io slugs and set `HC_PING_URL`
- [ ] Create "Radar: Triage" Asana project + add the GID to env/secrets
- [ ] Deploy self-hosted RSSHub Docker container on joshhome
- [ ] Build dead-man's-switch CF Worker on joshshop account (polls `state/last-run.txt` age)
- [ ] Set 5 GHA secrets (ANTHROPIC, XAI, MULTIPOV, SOCIAL_WORKER, HC_RADAR_PING) on the agentsfirst repo
- [ ] Install LaunchAgent for imsg-listener on joshhome
- [ ] Create `RUNBOOK.md` covering degraded-mode runbook + schema rollback + kill switch + cold-start

## Status

v0.1.0 — full TypeScript build complete; infra setup pending. First run blocked on infra checklist above.
