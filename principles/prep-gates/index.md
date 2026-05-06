---
title: "Prep Gates"
description: "Run pre-flight checks before every agent session — validate credentials, load fresh IDs, confirm system health. Stale context is the #1 source of agent errors."
image: /og-image.png
author: Joshua Baer
---

# Prep Gates

Run pre-flight checks before every agent session. Validate credentials. Load fresh identifiers. Confirm the systems the agent is about to call are actually reachable. Stale context is the #1 source of agent errors, and a prep gate is a five-second tool call that prevents most of them.

The pattern: every project ships a tool — call it `<project>_prep` — that runs at session start. It validates credentials, fetches the current set of project IDs, user IDs, and configuration, checks that downstream services are reachable, and returns a structured snapshot the agent can refer back to. The contract ([`AGENTS.md`](/principles/contract-first/)) requires the prep call as the first action of every session.

What makes this load-bearing isn't the individual checks. It's that the agent now has fresh context — IDs that exist, tokens that work, services that are up — instead of operating on whatever it half-remembered from the previous session or guessed from training data. The "user lookup failed because the user ID changed last week" failure mode disappears.

Health checks applied to agent sessions. Not new in software engineering — pre-flight in aviation, mise en place in cooking, status checks in distributed systems all share the same DNA. What's new is treating the agent's session as the system that needs the health check. The agent has no other way to discover that the world has shifted since its last context refresh.

## Why it matters

Agents are stateless between sessions. Whatever they "remember" is either in their training data (months out of date) or in the context window of a previous turn (gone the moment the conversation ends). Without a prep gate, every session starts with the agent operating on assumptions that were true on Tuesday and aren't on Friday.

The failure modes are familiar to anyone who's debugged a stale-cache bug, except now the cache is the LLM's prior context. A user got renamed — the agent uses the old name. A project got archived — the agent calls `update_project` against an ID that no longer resolves. The OAuth token rotated — every tool call returns 401 and the agent retries the same broken call five times before giving up. The agent's billing-tier permissions changed — it tries to call a tool the user can no longer access and surfaces a confusing error.

None of these are agent bugs. The agent is doing exactly what its context says is reasonable. The bug is that nobody refreshed the context before letting it act.

Second-order failure: agents become brittle in ways that are hard to attribute. The integration "kind of works" most of the time and randomly fails on Mondays after a weekend deploy. Users learn to distrust it. The fix isn't more retries — it's making sure the agent never starts a session with stale state.

## How to apply it

1. **Ship a `<project>_prep` tool with every MCP server, CLI, or SDK.** Name it consistently — the verb should be obvious. `crm_prep`, `billing_prep`, `analytics_prep`. Not `init`, not `setup`, not `start`. Verb-first, subject-clear.

2. **Include credential validation.** Make the live API call that confirms the token works. Don't just check that an environment variable is set — call `whoami` (or its equivalent) and verify the response.

3. **Return fresh identifiers in the response.** Current user's ID. List of project IDs and names the user has access to. Active OAuth scopes. Current API version. Whatever the agent needs to construct correct tool calls for the rest of the session.

4. **Confirm downstream services are healthy.** If the tool depends on a database, ping it. If it depends on a third-party API, do a no-op call and confirm the response. If anything is degraded, return that in the response so the agent can tell the user before attempting work that will fail.

5. **Make the contract require it.** The `AGENTS.md` should say, in the first section: "Before any other tool call, call `<project>_prep`. Do not invent identifiers — use only the IDs returned by prep."

6. **Cache the response in the agent's context.** Read prep's output once at session start and refer to it throughout — don't re-prep on every tool call. Re-prep only on demand, or when a tool returns "stale identifier" or 401.

A minimal prep tool implementation in pseudocode:

```typescript
{
  name: "crm_prep",
  description: "Required first call. Validates credentials, returns fresh user/project IDs, and confirms downstream service health.",
  handler: async (ctx) => {
    const me = await api.whoami(ctx.token);          // validates token
    const projects = await api.listProjects(me.id);  // fresh IDs
    const health = await api.health();               // service status
    return {
      session: {
        user_id: me.id,
        user_email: me.email,
        scopes: me.scopes,
        api_version: api.version,
      },
      projects: projects.map(p => ({ id: p.id, name: p.name })),
      health: { db: health.db, queue: health.queue },
      contract_version: AGENTS_MD_VERSION,
    };
  }
}
```

The agent calls this once. Now it knows who it is, what it can touch, and whether the system is up. Every subsequent tool call uses the IDs from this response instead of guessing.

## What this prevents

Prep Gates defends against [Agents Without Rules](/glossary/#agents-without-rules) by enforcing the discovery step the contract requires. Even if the agent skipped reading [`AGENTS.md`](/glossary/#agents-md) — and they sometimes do — the prep call returns the rules and identifiers it needs, so the next tool call has a chance of being correct.

It defends against [Ship and Forget](/glossary/#ship-and-forget) by making degradation visible. A prep tool that returns `health: { db: "down" }` tells the agent the integration isn't usable right now, so the agent surfaces the problem instead of attempting a session that will fail in confusing ways. A silent integration is the worst kind of broken. Prep gates make brokenness loud.

It raises [tool success rate](/glossary/#tool-success-rate) directly. Most "the agent can't find my project" failures are stale-ID failures. A prep gate cuts that class of error to near zero.

## The smallest experiment

Add a single `<project>_prep` tool to your existing MCP server or CLI. Return the current user's ID, the list of valid project/workspace IDs, and a health check on your primary database. Document it in `AGENTS.md` as the required first call. Don't change anything else. Watch your error logs for a week. The "no such ID" and "401 unauthorized" classes of error will drop sharply, and you'll have proof the pattern is worth expanding to credentials, downstream services, and feature flags.

## Related principles

- [Contract First](/principles/contract-first/) — the contract is what makes the prep call required. Without the rule written down, agents will skip prep and burn cycles on stale state.
- [Autonomous Recovery](/principles/autonomous-recovery/) — when prep detects a degraded downstream service, the recovery logic decides whether to retry, defer, or escalate. Prep is the input; recovery is the response.

---

*Part of [Agents First](/) — a design framework for products built for both humans and AI agents.*
