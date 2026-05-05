---
title: "Typed State | Agents First"
description: "Persist agent state through one structured data contract with versioned migrations. Each module owns its slice — no JSON blobs, no ambient context."
image: /og-image.png
author: Joshua Baer
---

# Typed State

All persistent agent state flows through one structured data contract with versioned migrations. Each module owns its slice. No JSON blobs in unstructured columns. No ambient state hiding in chat history. The schema is the coordination layer.

When the only operator was a human at a keyboard, sloppy state was survivable. The human could read a free-text "notes" field, infer what the previous human meant, fix the typo, and move on. Agents can't. They take the schema literally. A field called `status` that sometimes contains `"active"` and sometimes contains `"Active"` and sometimes contains `"a"` is three different fields to an agent. A timestamp column that's an ISO string in some rows and a Unix epoch integer in others guarantees a parsing failure on the row that breaks the pattern.

Typed State means the schema is the source of truth. Every field has a type. Every enum has a fixed set of values. Every transition between states is named and validated. Migrations are versioned and reversible. When two autonomous jobs need to coordinate without talking to each other, the typed schema is the only thing they can both trust.

This is standard practice. ORMs have enforced it for two decades. What changes in agent systems is that the data contract becomes the load-bearing coordination layer between jobs that can't message each other directly. The agent that writes a row has to trust that the agent that reads it later will interpret the same fields the same way — and the only way that works is if the schema makes ambiguity impossible.

## Why it matters

Loose state breaks agents in three predictable ways. First, write paths drift. Two agents writing to the same table use slightly different conventions — one writes `"closed-won"`, the other writes `"closed_won"` — and downstream queries silently miss half the data. Second, read paths hallucinate. An agent looking at a row with a `metadata` JSON column tries to extract a field that doesn't exist on this particular row, gets `undefined`, and either fails loudly or — worse — fills in a plausible-looking default and proceeds with corrupt data. Third, migrations break consumers. Someone changes a column's meaning without bumping a version, and every existing agent session is now operating on a contract it doesn't know has shifted.

The compound failure mode is the worst: agents start treating the schema as advisory. They build their own normalization logic on top of every read. They write defensively in case some other agent already wrote to the same row. The codebase fills with try/catch blocks that paper over schema rot. Eventually nobody knows what the actual contract is, because the contract is now the union of every agent's defensive guesses about what other agents might have done.

A typed, migrated, single-source-of-truth schema makes that whole class of failure go away. Not because agents suddenly become careful, but because the schema refuses to let them be careless.

## How to apply it

1. **Define the schema in one place per module.** Each module owns its tables. Other modules read through that module's API, not by querying its tables directly. The boundary is enforced by the schema: foreign keys are explicit, joins across module boundaries go through documented views.

2. **Use a typed schema language.** Zod, TypeBox, Pydantic, Protobuf, OpenAPI — pick one and use it as the source of truth. Generate database migrations, API request/response types, and tool parameter schemas from the same definition. Never let two of them drift apart.

3. **Use enums, not strings.** `status: "active" | "paused" | "archived"` not `status: string`. The agent can't write `"Active"` if the schema rejects it.

4. **Version your migrations and run them in order.** Every schema change is a numbered migration with both an `up` and a `down`. The deployment pipeline applies migrations in order. The contract version (returned by [prep](/principles/prep-gates/)) tells agents which schema version they're operating against.

5. **Reject malformed writes at the schema layer.** Validation happens at the boundary, not buried in business logic. An agent that sends a malformed write gets a structured error back ("`status` must be one of `active`, `paused`, `archived` — got `Active`") and can correct it on the next call.

6. **Make every state transition explicit.** Don't allow free-text `status` updates. Define `archive_project`, `pause_project`, `activate_project` as named transitions, each with their own validation. The agent picks the verb; the schema enforces the rules.

7. **Snapshot the schema in `AGENTS.md`.** Reference the canonical type definitions and any non-obvious constraints. The agent should be able to learn the data shape from the contract without inspecting the database.

A minimal Zod schema for a single agent-managed entity:

```typescript
import { z } from "zod";

export const Deal = z.object({
  id: z.string().regex(/^deal_[a-z0-9]{12}$/),
  title: z.string().min(1).max(200),
  amount_usd: z.number().int().nonnegative(),
  stage: z.enum(["prospecting", "negotiation", "closed-won", "closed-lost"]),
  owner_user_id: z.string().regex(/^usr_[a-z0-9]{12}$/),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Deal = z.infer<typeof Deal>;
```

That definition feeds the database migration, the tool input schema, the tool output schema, and the [`AGENTS.md`](/principles/contract-first/) examples. One source. No drift.

## What this prevents

Typed State is what makes [Visible Outputs](/principles/visible-outputs/) reliable — when state is structured, the human-readable summary the agent emits to Slack or email is generated from the same shape every time, instead of being assembled from whatever fields happened to exist on the row.

It's also a precondition for [Autonomous Recovery](/principles/autonomous-recovery/). Recovery logic can only retry idempotently if the state model is unambiguous about what "the same operation" means. With loose state, retries either silently double-write or refuse to retry anything because the system can't tell what's already happened.

And it indirectly prevents the [Lazy Wrapper](/glossary/#lazy-wrapper) anti-pattern. A team that built typed state from day one can't ship `query_database(sql)` as their agent interface — the schema is too well-defined to be useful as a raw SQL surface, and the verb-shaped tools that read and write the typed entities are obviously the better fit.

## The smallest experiment

If you only do one thing this week, do this: pick the single table the agent reads or writes most often, and convert one free-text column to a typed enum. Add the migration. Update the tool input/output schemas. Document the enum values in `AGENTS.md`. Watch the [tool success rate](/glossary/#tool-success-rate) lift on the next week of agent traffic. The "agent wrote a value the downstream code didn't expect" class of bug will drop sharply, and you'll have a template for typing the next column, then the next table, then the whole module.

## Related principles

- [Visible Outputs](/principles/visible-outputs/) — typed state is what lets the human-readable summary be reliable, because the data shape behind it is consistent.
- [Interface First](/principles/interface-first/) — typed parameters at the tool layer have to match typed columns at the storage layer, or one will lie to the other.

---

*Part of [Agents First](/) — a design framework for products built for both humans and AI agents.*
