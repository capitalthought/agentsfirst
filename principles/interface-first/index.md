---
title: "Interface First"
description: "Design the agent interface — MCP server, CLI, or typed SDK — before any human UI. Tool definitions are the first artifact of every feature."
image: /og-image.png
author: Joshua Baer
---

# Interface First

Design the agent interface before any human UI. Tool definitions are the first artifact of every feature — MCP server, CLI, typed SDK, or function specs. The human dashboard is a downstream client.

Most product teams do the opposite. Sketch the web app. Build the React components. Expose a REST API for the mobile team. Then, months later, after a customer asks, wrap a few endpoints in an "AI integration." The agent interface ends up shaped by whatever the web UI happened to need, with naming conventions inherited from a database schema written before agents existed.

Interface First reverses the sequence. The first thing you write for any new feature is the tool definition: a verb-first name, typed parameters with enums where possible, structured return values, and a description that teaches an agent — which has no prior context about your product — what this tool does and when to use it. The web UI, the mobile app, the Zapier integration, the CSV importer — all of those become consumers of the same underlying capability the agent uses. Peers, not the canonical layer.

Protocol-agnostic. MCP is the right default for most products today. CLI for developer tools. Typed SDK with code mode for surfaces with hundreds of endpoints. The protocol is a distribution choice. Designing the interface for a computer consumer is the principle.

## Why it matters

When the agent interface is an afterthought, three failure modes show up. The surface bloats — every web-app screen sprouted its own bespoke endpoint, and now your "AI integration" exposes 200 of them. Agents choke on tool selection before they get to call anything useful. The names are a mess — `getUserDataV2`, `fetchUserById`, `userLookup` all do roughly the same thing because they accreted across three release cycles. The agent can't tell which to pick. The return shapes are raw — undocumented JSON, timestamps in three formats, foreign keys with no labels — because the web UI patched over the inconsistencies in JavaScript and nobody else had to care.

The first agent to touch your product makes a tool call, gets back 47KB of unstructured data, and gives up. That's the whole funnel. No second chance — agents don't file support tickets and don't remember to come back.

Interface First flips this. By the time the human UI ships, the tool surface has already been battle-tested by every internal demo, every dogfooding session, and every prospect who installed your MCP server before launch. The web UI inherits a clean structured layer it can render, not a tangled one it has to apologize for.

## How to apply it

1. **Write the tool definition before the implementation.** For each new feature, the first artifact is a JSON or TypeScript description — name, parameters, return shape, and a one-paragraph description aimed at an agent that has never seen your product.

2. **Pick verb-first names.** `create_task`, `list_projects`, `assign_user`. Not `task_manager`, not `users`, not `data`. The action is the interface. If you can't name a tool with a verb, you're describing a category, not a capability.

3. **Type every parameter.** Use enums wherever possible. `stage: "prospecting" | "negotiation" | "closed-won"` beats `stage: string`. Take the agent's guesswork to zero.

4. **Return structured data with stable shapes.** Same field names across tools. Same timestamp format everywhere. Foreign keys with the IDs labeled. If the web UI needs a different shape, transform on the client.

5. **Cap the tool count.** Aim for 10–20 well-chosen tools per server. Wrapping 200 REST endpoints? You're building a [god server](/glossary/#god-server). Group related actions; expose the most-used capabilities, not every possible action.

6. **Generate protocol bindings from one source of truth.** Define your tool capabilities once — name, parameters, return types, errors — and emit MCP definitions, CLI commands, TypeScript SDK types, and OpenAI function specs from the same source. Protocol migration becomes code generation, not a rewrite.

A minimal tool definition for a CRM `create_deal` operation:

```json
{
  "name": "create_deal",
  "description": "Create a new sales deal in the pipeline. Returns the deal ID and a URL to view it. Call list_stages first if you don't know the valid stage values.",
  "parameters": {
    "title": { "type": "string", "description": "Short human-readable name" },
    "amount_usd": { "type": "number", "description": "Deal size in US dollars" },
    "stage": {
      "type": "string",
      "enum": ["prospecting", "negotiation", "closed-won", "closed-lost"]
    },
    "owner_email": { "type": "string", "format": "email" }
  },
  "required": ["title", "amount_usd", "stage", "owner_email"]
}
```

That definition exists before the database table. Before the React component. Before the Postman collection.

## What this prevents

Interface First defends directly against [The Invisible Product](/glossary/#invisible-product) — ship a web app, never expose agent access, and your product simply doesn't exist to the agent ecosystem. Not in the tool list, not in the consideration set.

It also defends against [The Lazy Wrapper](/glossary/#lazy-wrapper). Design the agent interface first and you can't ship `query_database(sql)` as your "agent integration" — writing a verb-first tool definition with typed parameters forces real domain modeling. A team that designs `create_deal`, `list_stages`, `assign_user` as their first three tools won't accidentally ship a raw SQL pass-through. The principle commits them to capabilities, not endpoints.

It prevents [The God Server](/glossary/#god-server) too. Start with the agent surface and you feel the pain of 200 tools immediately — the prompt bloats, tool selection breaks down, your own demos take forever. That feedback loop forces a smaller, sharper surface.

## The smallest experiment

Pick the single most-used operation in your product and write its tool definition before any other artifact. Verb-first name. Typed parameters with enums. Structured return shape. One-paragraph description aimed at an agent that has never seen your product. Ship it as an MCP tool or a CLI command. Measure [time to first agent action](/glossary/#time-to-first-agent-action) — install to first successful call. Under 60 seconds means you've validated the interface design. Over 60 means the description or parameter shape is wrong; iterate before adding the second tool.

## Related principles

- [Contract First](/principles/contract-first/) — once the interface exists, the rules for how to use it have to live somewhere the agent will actually read.
- [Typed State](/principles/typed-state/) — typed parameters and typed return shapes only work if the underlying state model is also typed and versioned.

---

*Part of [Agents First](/) — a design framework for products built for both humans and AI agents.*
