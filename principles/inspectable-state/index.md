---
title: "Inspectable State"
description: "Every agent server should expose its own operational state — queue depth, throughput, recent activity, trends, health — via a typed agent tool, not just via a human dashboard."
image: /og-image.png
author: Joshua Baer
---

# Inspectable State

Every agent server should expose its own operational state — queue depth, throughput, recent activity, trends, health — via a typed agent tool, not just via a human dashboard. If the only way to ask "what is the state of the work?" is to shell into the database or scrape the application logs, the operator agent has nowhere to look.

This is the complement to [Visible Outputs](/principles/visible-outputs/). Visible Outputs surfaces *results* to humans where they already are — the inbox, the task manager, Slack. Inspectable State surfaces *system state* to agents where they already are — the same MCP surface they use to take action. One pattern, two audiences. A product that ships Visible Outputs but skips Inspectable State has built a system humans can read and agents have to guess at.

Where [Prep Gates](/principles/prep-gates/) answers "is the system READY to do work?", Inspectable State answers "what is the STATE of the work?". Different question, different cadence, different return shape. Prep is binary green/red and runs at session start. Overview is a structured snapshot and gets called whenever an operator wants to know what's going on — which is often.

## Why it matters

Without Inspectable State, three failure modes show up.

**Operator agents go blind.** The agent that's supposed to triage your queue, audit your sends, or escalate stuck records has no way to read the queue, the audit log, or the stuck-record list short of issuing raw SQL or grepping logs. Both are anti-patterns: SQL is the [Lazy Wrapper](/glossary/#lazy-wrapper) and log scraping is fragile. The right answer is a typed tool, returning structured data, callable from any MCP client.

**Operators reach for the dashboard you didn't build.** The first time you have to debug something, you'll wish for a UI that shows "what's been happening." If you don't have one, you'll either build one (dashboard sprawl, the [Black Box Server](/glossary/#black-box-server) anti-pattern's natural consequence) or you'll grow the habit of running `sqlite3` against production. Both are worse than a structured `overview` tool that any client — Claude Code, an external operator agent, a CLI script — can poll.

**You ship features but can't reason about throughput.** Without an Inspectable State tool, simple questions become hard. What's the per-day error rate? Is the queue backing up? Did approval rate fall this week? Each of these requires writing one-off SQL, which is the wrong cost basis for routine introspection. A single `overview` tool that returns counts, recent rows, and rolled-up rates means every "is this still working?" question costs one tool call.

The economics: shipping `overview` is a few dozen lines. Skipping it costs every operator a manual roll-your-own diagnosis the first time anything goes weird. Asymmetric.

## How to apply it

1. **Ship one tool, not many.** A single `overview` (or `status`) tool that returns the operational snapshot. Resist the urge to fragment into `get_queue_depth`, `get_recent_failures`, `get_approval_rate` — that ends in [God Server](/glossary/#god-server). One tool, structured return, all the rolled-up data in one shape.

2. **No input schema (or a tiny one).** The tool answers "what's the state of the work?" — a question that has no parameters. If you must, accept an optional time-window argument like `last_24h` or `last_n=50`, but the no-arg call should return the most useful default snapshot.

3. **Return both rolled-up rates and recent tails.** Counts alone are dashboards. Tails alone are logs. The combination is what lets an operator decide whether to act: "queue depth is 42, failure rate is 8%, here are the 10 most recent failures" answers both "is this normal?" and "what specifically broke?".

4. **Write SQL once.** A focused module — `overview.ts` or equivalent — calls a handful of read-only helpers in your data layer and assembles the snapshot. Don't sprinkle SQL across the rest of the codebase to compute the same numbers from different callers. Single source of truth, like the [Typed State](/principles/typed-state/) it queries.

5. **Cap field sizes; truncate payloads.** An audit-log row's `payload` field can be arbitrarily large; clamp previews to 200 chars or so for the response, and surface the raw row only when the operator drills in. The overview tool's job is to fit on one screen, not to dump every row.

6. **Pure read; no mutations.** The overview tool should never write. If the operator wants to act on what they see, that's a separate verb. Mixing read and write surface fights the agent's tool-selection.

7. **Document the rates' targets.** When you return `voice_approval_rate: 0.62, target: 0.5`, you're telling the operator agent "0.62 vs target 0.5 means meeting target." Without the target inline, every consumer has to remember what's good and what's bad. Encode the judgment.

A minimal pattern, in pseudocode, for a drafting agent's overview tool:

```typescript
async function overview() {
  return {
    generated_at: new Date().toISOString(),
    inventory_by_status: countByStatus(drafts),
    daily_cap_headroom: caps.map(c => ({
      platform: c.platform,
      cap: c.max_per_day,
      used_today: c.used_today,
      remaining: c.max_per_day - c.used_today,
    })),
    approval_rate_50: { ...recentApprovalRate(50), target: 0.5 },
    delivery_failure_rate_50: recentDeliveryHealth(50),
    recent_publish_requests: recentPublishRequests(10),
    recent_audit_events: recentAuditEvents(20),
  };
}
```

Behind that is a few queries against existing tables. Adding the tool is mostly composition; you already have the data.

## What this prevents

Inspectable State defends against the [Black Box Server](/glossary/#black-box-server) anti-pattern — an agent server with no introspection tool, where the only way to know what it's doing is to break the abstraction and reach for the database. It also makes [Ship and Forget](/glossary/#ship-and-forget) much harder to commit silently, because once `overview` exists, regressions show up in normal poll calls instead of waiting for a customer to complain.

It composes with [Multi-Model Verification](/principles/multi-model-verification/) — when a high-stakes decision agent wants to fact-check a deploy decision, it can read the deployer's own state via `overview` rather than asking some out-of-band log indexer. The state lives in the same MCP surface as the actions; consumers don't have to integrate two different systems to do one job.

## The smallest experiment

Pick the one question you'd ask if you walked over to your agent server right now: queue depth, last 10 errors, approval rate today. Ship a single `overview` tool that returns that one answer plus three obvious neighbors. No input schema. Read-only. Document the targets inline. Measure how often you (or another agent) call it; if it's more than once a session, the second-most-asked field is the next thing to add to the snapshot.

## Related principles

- [Visible Outputs](/principles/visible-outputs/) — humans see results in their tools; Inspectable State is the agent equivalent. Same pattern, different audience.
- [Prep Gates](/principles/prep-gates/) — Prep answers "is the system ready?", Overview answers "what is the system doing?". Both are read-only; both are typed; both belong on every agent server.
- [Typed State](/principles/typed-state/) — Inspectable State queries the typed schema; if state is loose, the overview is unreliable.

---

*Part of [Agents First](/) — a design framework for products built for both humans and AI agents.*
