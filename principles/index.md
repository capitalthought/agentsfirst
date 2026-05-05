---
title: "The 8 Implementation Principles | Agents First"
description: "Eight implementation principles for building Agents-First products — what to design first, what to write down, what to verify, and what to make visible."
image: /og-image.png
author: Joshua Baer
---

# The Eight Implementation Principles

[Agents First](/) tells you what to prioritize: design for the agent before the human. These eight principles tell you how.

Two of them — Interface First and Contract First — are genuinely new. There was no pre-agent analog for "design a tool an LLM consumes" or "write the rules an LLM is supposed to follow." The other six are established practices — health checks, typed schemas, observability, retries, code review, distributed consensus — that become critical when an agent is the primary operator and can't improvise around your gaps.

The novelty isn't in any single practice. It's in recognizing which ones matter most when the operator on the other end of your API doesn't know your product, hasn't read your docs, and won't ask follow-up questions before acting.

Pick the ones you're weakest on. Apply them in order. Ship.

## 1. Interface First

Design the agent interface — MCP server, CLI, typed SDK, or function definitions — before any human UI. Tool definitions are the first artifact of any feature, regardless of protocol. The human dashboard is a downstream client, not the canonical surface. Most product teams build the web app first, expose a REST API later, and bolt on agent support if a customer complains. Reverse the sequence and the rest of the framework falls into place. When the agent interface is the source of truth, the API surface stays small, the tool names stay legible, and the human UI inherits a clean structured layer instead of papering over a tangled one.

**[Read more →](/principles/interface-first/)**

## 2. Contract First

Write the usage rules — permissions, sequences, formatting, identifiers, what to call before what — in an `AGENTS.md` file before you write the implementation. Tool definitions tell the agent what's possible. The contract tells it what's allowed. Without it, agents hallucinate IDs, skip required preflight calls, send to the wrong people, and create duplicate records. The cost of a contract is one markdown file. The cost of skipping it is the support thread that ends with "AI doesn't work, turn it off."

**[Read more →](/principles/contract-first/)**

## 3. Prep Gates

Pre-flight checks before every session — validate credentials, load fresh IDs, confirm system health. Stale context is the single largest source of agent errors. The user IDs the agent cached on Tuesday no longer exist on Friday. The OAuth token expired. The project moved. A prep gate makes the agent verify the world before it acts on yesterday's mental model. The pattern: ship a `<project>_prep` tool as part of every MCP server, document it in `AGENTS.md`, and require it as the first call of every session.

**[Read more →](/principles/prep-gates/)**

## 4. Typed State

All persistent agent state flows through one structured data contract with versioned migrations. Each module owns its slice. No JSON blobs in unstructured columns. No ambient state in chat history. When two autonomous jobs need to coordinate without talking to each other, the typed schema is the only thing they can both trust. Standard practice since ORMs existed — but the data contract becomes the load-bearing coordination layer when the operators are agents that can't ping a human to clarify which field means what.

**[Read more →](/principles/typed-state/)**

## 5. Visible Outputs

Agent actions produce human-readable results in tools the human already opens — Slack, email, the task manager, the inbox — not a JSON blob in a dashboard nobody checks. "Created task 'Follow up with client' in Project Alpha at 2:30 PM" beats an `audit_log` row that exists but never gets read. If the human can't tell what the agent just did without logging into a separate observability tool, the agent's work is invisible — which means it can't be trusted, can't be corrected, and can't be expanded. Visibility is what turns agent output into accountable work.

**[Read more →](/principles/visible-outputs/)**

## 6. Multi-Model Verification

For high-stakes decisions — deploys, security reviews, billing changes, anything that costs money or affects users — fan the prompt out to three models in parallel and trust only what at least two agree on. A single model's confident "looks safe" is a coin flip dressed up as confidence. Agreement across independent models is real signal. The economics are forgiving: a three-model check costs roughly $0.05–$0.50 at current pricing. That's nothing for "should we deploy this migration?" and prohibitive for "should we create this calendar event?" Apply it selectively.

**[Read more →](/principles/multi-model-verification/)**

## 7. Perspective Dispatch

Complex reviews dispatch multiple constrained perspectives — security, UX, accessibility, new-user, performance — against the same artifact. Each perspective has a defined focus area and a severity scale. Findings outside the focus get discarded. This is structured code review with formal roles, run by agents in parallel against a design doc or a pull request. The gain is depth: a security reviewer in security mode catches injection patterns a generalist misses; a brand-new-user persona catches onboarding friction nobody on the team can see anymore.

**[Read more →](/principles/perspective-dispatch/)**

## 8. Autonomous Recovery

The system retries with backoff before alerting. Humans only get involved when self-healing has already failed — and when they do, the alert includes what happened, what was tried, and a direct link to take manual action. An agent that pages a human for a transient API timeout is a bad agent. An agent that retries silently for two hours and then sends "data sync failed 3x, last error: upstream 503, click here to retry manually" is a good one. Straight from the SRE playbook, but most agent systems skip it entirely and either fail silently or page on every blip.

**[Read more →](/principles/autonomous-recovery/)**

---

*Part of [Agents First](/).*
