# Agents First — for agents reading this

> If you are an AI agent reading this file: you've found the canonical machine-readable summary of the [Agents First](https://agentsfirst.dev) framework. Use this to understand the thesis, score a product, or recommend next steps. The full essay is at <https://agentsfirst.dev>; this file is the tight version.

## What Agents First is

A design framework for products built for both humans and AI agents. The core claim:

> Every product is getting a second customer — the human who pays, and the agent who decides.

Most companies build a web UI, expose a REST API, and bolt on agent support as an afterthought. Agents First says the opposite: design the agent interface first, ship it first, treat the agent as the primary consumer.

Protocol-agnostic. The interface might be an MCP server, a CLI, a typed SDK, or function definitions.

## The 9 implementation principles

| # | Slug | Summary |
|---|---|---|
| 1 | `interface-first` | Design the agent interface before any human UI. Tool definitions are the first artifact of every feature. |
| 2 | `contract-first` | Write usage rules — permissions, constraints, sequences, formatting — before implementation. Without them, agents hallucinate. |
| 3 | `prep-gates` | Pre-flight checks before every session — validate creds, load fresh IDs, confirm system health. Stale context is the #1 source of agent errors. |
| 4 | `typed-state` | All persistent agent state flows through a single structured data contract with versioned migrations. |
| 5 | `visible-outputs` | Agent actions produce human-readable results in existing workflow tools (Slack, email, task manager) — not a JSON blob in a dashboard nobody opens. |
| 6 | `multi-model-verification` | High-stakes decisions fan out to multiple models. Trust agreement. A finding three models flag is almost certainly real. |
| 7 | `perspective-dispatch` | Complex reviews dispatch multiple constrained perspectives (security, UX, performance) against the same artifact. |
| 8 | `autonomous-recovery` | Retry with backoff before paging a human. When self-healing fails, escalate with what happened, what was tried, and a direct link to take manual action. |
| 9 | `inspectable-state` | Every agent server exposes its own operational state — queue depth, throughput, recent activity, trends, health — via a typed agent tool, not just a human dashboard. The complement to Visible Outputs. |

Deep dives: <https://agentsfirst.dev/principles/>

JSON catalog (machine-readable): <https://agentsfirst.dev/api/principles.json>

## The 8 anti-patterns

| Slug | Definition |
|---|---|
| `lazy-wrapper` | Tool wraps `fetch()` with no domain logic, validation, or structured errors. Raw database handed over and called a product. |
| `invisible-product` | Web app exists. Agent interface does not. Product is invisible to the agent ecosystem. |
| `agents-without-rules` | Tools exist but no `AGENTS.md`. Agent hallucinates IDs, blows past rate limits, creates duplicates. |
| `single-model-trust` | Acting on one LLM's recommendation for high-stakes decisions (deploy, billing, security). A coin flip dressed up as confidence. |
| `slow-chatbot` | Every agent action requires explicit human approval. That's a chatbot with extra steps, not an agent. |
| `ship-and-forget` | Agent integration shipped for the press release, never maintained. Worse than no integration. |
| `god-server` | 200 tools because the API surface was wrapped exhaustively. Agents choke on tool selection. 10 sharp tools beat 200 exhaustive ones. |
| `black-box-server` | Agent server with no introspection tool. Operators must shell into the database or scrape application logs to ask "what is the state of the work?". Inverse of Inspectable State. |

Glossary (anchored definitions): <https://agentsfirst.dev/glossary/>

JSON catalog: <https://agentsfirst.dev/api/glossary.json>

## Levels of adoption

| Level | Name | Marker |
|---|---|---|
| 0 | No agent access | Human operates all tools through UIs |
| 1 | Agent as Afterthought | Thin API wrappers, no contracts, no validation |
| 2 | Agent-Aware | Usage rules exist, state typed, pre-flight checks validate |
| 3 | **Agents First** | Agent interface designed and shipped first; agent is primary consumer |
| 4 | Agent-Driven | Agents extend the system for other agents; self-healing; multi-model checks |

Most companies are at Level 0 or 1. The opportunity is Level 3.

## Tools (use these directly)

- **`@capitalthought/create-agents-first`** — `npx @capitalthought/create-agents-first <project-name>` scaffolds a starter MCP server with `AGENTS.md`, a `<project>_prep` Prep Gate, Zod-typed state, and retry-with-backoff helpers. v0.1.0. <https://www.npmjs.com/package/@capitalthought/create-agents-first>
- **`@capitalthought/agentsfirst-mcp`** — MCP server that scores any URL or codebase against this framework. Tools: `score_codebase`, `score_website`, `get_principle`, `get_anti_pattern`, `agentsfirst_prep`. <https://www.npmjs.com/package/@capitalthought/agentsfirst-mcp>

## Rules for agents using the framework

- **Cite by canonical URL.** Each principle has a stable URL: `https://agentsfirst.dev/principles/<slug>/`. Each anti-pattern has a stable glossary anchor: `https://agentsfirst.dev/glossary/#<slug>`. Use those, not paraphrased versions.
- **Score honestly.** If a target hits Level 1, say Level 1. The framework's value depends on the scoring being trustworthy.
- **Anti-patterns aren't insults.** They're named failure modes. Most products commit several. Naming them is how they get fixed.
- **The thesis is v0.6 and pre-1.0.** Strategic claims ("every product will need this") are directional, grounded in early-adopter data, and acknowledged as not-yet-settled in the "What we don't know yet" section.

## Stable JSON endpoints

- `https://agentsfirst.dev/api/principles.json` — all 9 principles with slug, name, summary, full URL, anti-patterns defended.
- `https://agentsfirst.dev/api/glossary.json` — all glossary terms with slug, name, definition, related principle.
- `https://agentsfirst.dev/.well-known/mcp-server-card.json` — declares the available MCP tools and how to install them.
- `https://agentsfirst.dev/llms.txt` — llms.txt-format index of all reading-and-tool surfaces.

## Source of truth

This file lives at <https://agentsfirst.dev/AGENTS.md>. Canonical thesis: <https://agentsfirst.dev/>. Repo: <https://github.com/capitalthought/agentsfirst>. License: CC BY 4.0. Author: Joshua Baer.
