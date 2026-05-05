---
title: "Glossary | Agents First"
description: "Definitions of Agents First terminology — anti-patterns, implementation principles, metrics, and protocols."
image: /og-image.png
author: Joshua Baer
---

# Agents First Glossary

Definitions for the vocabulary in the [Agents First thesis](/) — the anti-patterns to avoid, the eight implementation principles, the protocols and metrics that show up in real production systems. Every term below is anchored for stable linking. Definitions are tight on purpose. For the full argument and the case studies behind each term, read [the canonical thesis](/) or the [per-principle deep dives](/principles/).

**Jump to:** [Anti-Patterns](#anti-patterns) · [Implementation Principles](#implementation-principles) · [Concepts and Metrics](#concepts-and-metrics)

---

## Anti-patterns

The seven failure modes that make agent integrations worse than not having one. Knowing what's broken is more useful than knowing what's ideal.

### The Lazy Wrapper {#lazy-wrapper}

The agent interface is just `fetch()` with a different name. No domain knowledge, no validation, no structured errors — the agent asks for active deals and gets back 47KB of nested JSON with undocumented field names and three timestamp formats. Handing someone the raw database and calling it a product. The opposite of [Interface First](/principles/interface-first/).

### The Invisible Product {#invisible-product}

Ship the web app, maybe expose a REST API later, never think about agent access. Your product does not exist to the agent ecosystem. When a developer's agent needs to do the job your product was built for, it picks a competitor that's actually in the tool list. The cost is silent: you don't lose deals, you never enter consideration. Solved by [Interface First](/principles/interface-first/).

### Agents Without Rules {#agents-without-rules}

No `AGENTS.md`, no usage constraints, no sequencing requirements, no permissions matrix. The agent hallucinates identifiers, violates rate limits, creates duplicate records, and emails the wrong customers. Then someone says "AI doesn't work" and turns it off. Solved by [Contract First](/principles/contract-first/).

### Single-Model Trust {#single-model-trust}

Acting on one LLM's "looks safe" recommendation for decisions that cost money or affect users — billing changes, deploys, security reviews. A coin flip dressed up as confidence. The fix is [Multi-Model Verification](/principles/multi-model-verification/), applied selectively where the stakes warrant the inference cost.

### The Slow Chatbot {#slow-chatbot}

Requiring human approval for every agent action. If the agent can't do anything without asking permission, it's not an agent — it's a chatbot with extra steps. Defeats the entire point of automation. Fix by combining a clear [Contract First](/principles/contract-first/) permissions matrix with [Autonomous Recovery](/principles/autonomous-recovery/) so the agent acts within bounds and only escalates when self-healing fails.

### Ship and Forget {#ship-and-forget}

Launch an agent integration for the press release, then never maintain it. Agents try to use it, hit broken auth or stale schemas, fail, and develop a negative association with your product. Worse than not having one. The fix is treating the agent surface as a first-class API — see [Interface First](/principles/interface-first/) for the maintenance discipline.

### The God Server {#god-server}

An agent interface exposing 200 tools because it wraps an entire platform. Agents choke on tool selection when there are too many options, and the tool definitions alone can consume 50%+ of a context window before any work happens. Ten well-chosen tools beat two hundred exhaustive ones. Resolved by [Interface First](/principles/interface-first/) discipline plus [Progressive Discovery](#progressive-discovery) or [Code Mode](#code-mode) for large API surfaces.

---

## Implementation principles

The eight principles that turn the Agents First thesis into a buildable system. Apply them in order. Each links to a deep dive.

### Interface First {#interface-first}

Design the agent interface — MCP tools, CLI commands, typed SDK signatures — before any human UI. Tool definitions are the first artifact of any feature, regardless of protocol. [Read more →](/principles/interface-first/)

### Contract First {#contract-first}

Write the usage rules — permissions, sequencing, formatting, identifier conventions — in `AGENTS.md` before implementation. Without explicit rules, agents hallucinate IDs, violate constraints, and create duplicate records. [Read more →](/principles/contract-first/)

<a id="prep-gate"></a>

### Prep Gates {#prep-gates}

Pre-flight checks before every session — validate credentials, load fresh IDs, confirm system health. Stale context is the #1 source of agent errors; a Prep Gate (singular: anchor `#prep-gate`) is the cheap, automated mitigation. [Read more →](/principles/prep-gates/)

### Typed State {#typed-state}

All persistent agent state flows through a single structured data contract with versioned migrations. Each module owns its slice; the contract is the coordination layer between autonomous jobs that cannot talk to each other directly. [Read more →](/principles/typed-state/)

### Visible Outputs {#visible-outputs}

Agent actions produce human-readable artifacts in the human's existing workflow tools — Slack, email, the task manager — not a JSON blob in a dashboard nobody opens. "Mikey created membership X for Y at 2:30 PM" beats an audit_log row. [Read more →](/principles/visible-outputs/)

### Multi-Model Verification {#multi-model-verification}

High-stakes decisions fan out to multiple independent models; trust the answer they agree on. A finding three models flag is almost certainly real; a finding only one flags is a hypothesis. Apply selectively to deploys, security reviews, billing changes — not every tool call. [Read more →](/principles/multi-model-verification/)

### Perspective Dispatch {#perspective-dispatch}

Complex reviews dispatch multiple constrained perspectives — security, UX, new-user, performance — against the same artifact. Each persona has a defined focus area; findings outside that focus are discarded to keep signal high. [Read more →](/principles/perspective-dispatch/)

### Autonomous Recovery {#autonomous-recovery}

The system retries with backoff before paging a human. Don't alert on transient API timeouts. When self-healing fails, escalate with what happened, what was tried, and a direct link to take manual action. [Read more →](/principles/autonomous-recovery/)

---

## Concepts and metrics

The supporting vocabulary used across the [thesis](/) — protocols, patterns, and the metrics that replace the traditional SaaS funnel when your primary user is an agent.

### MCP {#mcp}

The Model Context Protocol — Anthropic's open standard for connecting AI agents to external tools, broadly adopted by Anthropic, OpenAI, Google, and Microsoft. Self-describing tool definitions with automatic discovery on connect. 110M+ monthly downloads as of 2026, the dominant standard for agent-tool connectivity.

### Code Mode {#code-mode}

Cloudflare's pattern of giving the agent a typed SDK inside a sandbox instead of front-loading hundreds of tool definitions. The agent writes code against the SDK; multi-step operations execute in a single sandbox run. Cloudflare reduced tool context from 1.17M tokens to ~1,000 — a 99.9% reduction — making it the right default for large API surfaces (100+ endpoints).

### AGENTS.md {#agents-md}

A repository file containing the usage rules an AI agent needs to operate the system correctly — permissions, identifier conventions, required sequences, formatting rules, escalation triggers. The canonical place a [Contract First](#contract-first) lives, and the simplest first artifact for lifting a project from Level 1 to Level 2 on the [adoption ladder](#adoption-levels).

### Two Customers {#two-customers}

The framing at the heart of Agents First: every product now has two customers — the human who pays and the agent who decides. The human reads marketing pages and signs contracts; the agent picks from the tool list available to it. If your product isn't in the tool list, it doesn't exist to the deciding party.

### Adoption Levels {#adoption-levels}

The 0–4 scale for how seriously a product treats agents. **0 — No agent access.** **1 — Afterthought** (thin API wrappers, no contracts). **2 — Agent-Aware** (usage rules exist, state is typed, pre-flight checks validate). **3 — Agents-First** (agent interface designed and shipped first). **4 — Agent-Driven** (agents extend the system for other agents). Most companies are at 0 or 1; the opportunity is at 3.

### Time to First Agent Action {#time-to-first-agent-action}

Latency from tool installation to the first successful tool call. Target: under 60 seconds. The agent-era equivalent of "time to first value" — the install funnel collapses into a single number that tells you whether your distribution actually works.

### Agent Activation Rate {#agent-activation-rate}

The percentage of tool installations that produce at least one successful tool call within 7 days. Activation is what separates a curiosity install from a functional integration — the rate at which agents actually start using what they connected to.

### Agent Return Rate {#agent-return-rate}

How often agents call your tools after the first session. The agent-side equivalent of D7/D30 retention. Push notifications and email drips don't work on agents; what drives return rate is reliability and ergonomics.

### Tool Success Rate {#tool-success-rate}

The percentage of tool calls that return a usable result without the agent retrying or escalating to the human. Track via structured logging. Below 90% means the tool design needs work — usually unclear parameters, ambiguous errors, or hidden preconditions.

### Tool Selection Accuracy {#tool-selection-accuracy}

When multiple tools are available, the percentage of times the agent picks the right one on the first try. Measure by logging the tool-call sequence per task and flagging cases where the agent calls one tool, gets an error, then calls a different one. Low accuracy means tool names or descriptions are ambiguous.

### Human Visibility Rate {#human-visibility-rate}

The percentage of agent actions that produce a human-visible artifact within 24 hours — a task created in the manager the human already uses, an email summary, a Slack message. If agents are using your product and the humans don't know, you have an attribution problem and probably a billing problem too.

### Agent-to-Human Conversion {#agent-to-human-conversion}

For products with free tiers, the percentage of agent usage that converts into a human creating an account or upgrading. Closes the loop: agents drive value invisibly, humans pay for the product they discover through that value.

### Progressive Discovery {#progressive-discovery}

The pattern of letting the agent search or fetch tool definitions on demand instead of front-loading them all into context. Anthropic's implementation reduces tool context by 98.7%. The right answer for products that genuinely need a large tool surface but don't fit [Code Mode](#code-mode).

### Scoped Tokens {#scoped-tokens}

Auth tokens limited to the minimum permissions needed for the agent's job — read-only by default, write access escalated only for specific validated actions. The default for any agent connection. Master keys with full write are one hallucination away from a customer-facing incident.

### OAuth 2.0 with PKCE {#oauth-pkce}

The recommended user-facing auth flow for agent tools acting on behalf of a human. Same flow used for any third-party integration: user authenticates, grants scoped permissions, receives a token that can be revoked independently. PKCE protects the authorization code exchange in environments where a client secret cannot be safely held.

### Smallest Experiment {#smallest-experiment}

The minimum viable Agents First adoption: pick the single most-used operation in your product, wrap it as one verb-first agent tool with typed parameters and structured errors, ship it, and measure [time to first agent action](#time-to-first-agent-action) and [tool success rate](#tool-success-rate). Validate the thesis on one endpoint before expanding the surface.

---

*Part of [Agents First](/) — see [the canonical thesis](/) or [the eight principles](/principles/).*
