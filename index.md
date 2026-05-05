# Agent First

*by Joshua Baer · v0.5, April 2026*

---

## Every Product Now Has Two Customers

The human who pays.

And the agent who decides.

An agent — an AI assistant like Claude Code, Cursor, or Windsurf — can call external tools on behalf of a user. When a developer tells their agent "I need to manage my tasks," it doesn't Google your product. It doesn't read your marketing page. It doesn't sign up for a free trial.

It looks at the tools already available — MCP servers, CLIs, typed SDKs — and uses whatever's there. If your product is accessible to agents, you win. If it's not, you don't exist.

---

## The Shift

In 2009, Luke Wroblewski published "Mobile First." His argument: stop designing for the desktop and then shrinking it. Design for the phone first, because the constraints breed better design. The industry resisted — until mobile traffic crossed 50% and the holdouts got left behind.

We're early in the same curve. Agent-mediated product interactions are small today. But the trajectory is clear, and the companies designing for agents now will have a multi-year head start on tool quality and distribution by the time it matters.

Most companies build a web UI, maybe expose a REST API, and then — if someone asks — add agent support as an afterthought.

**Agent First** says: design the agent interface first. Ship it first. Make the agent your primary consumer. Then build human UIs as one of many clients — not the only one.

This is protocol-agnostic. The agent interface might be an MCP server, a CLI, a typed SDK, or a set of function definitions. The principle is the same: design for the computer consumer first.

---

## The Strategic Case

### How Agents Find Your Product

Traditional product discovery: Google search → landing page → sign up → onboarding → first value. Five steps. Days to weeks.

Agent-first discovery: developer makes your product available to their agent → the agent uses it automatically the next time it's relevant. Two steps. Seconds to first value.

When an agent needs to "create a task" and your project management tool is accessible, it calls your tool. No comparison shopping. No free trial friction. The user might not even know they're using your product yet — and they're already getting value.

**But there's a prerequisite this depends on:** your product has to be accessible to agents in the first place.

Today, that happens through:
- **MCP servers** — the dominant standard for agent-tool connectivity. Install a server, connect, and the agent discovers available tools automatically.
- **CLIs** — agents are excellent at using command-line tools. `--help` is progressive discovery. Pipes are composable. You can debug by running the same command the agent ran.
- **Typed SDKs / Code Mode** — for large API surfaces (100+ endpoints), give the agent a TypeScript SDK and a sandbox. It writes code against the SDK instead of calling tools one at a time. Cloudflare's Code Mode reduced tool context from 1.17M tokens to ~1,000 — a 99.9% reduction.
- **Function definitions** — OpenAI function calling, Google tool use specs, and other provider-specific formats.
- **Documentation and developer content** — "Install our MCP server" or "Use our CLI" alongside "Install our SDK" in your getting-started guide.
- **Bundling** — IDE extensions and platform integrations that include your agent tools out of the box.

Agent First doesn't eliminate the need for distribution. It compresses everything that happens *after* distribution. The install-to-value gap drops from days to seconds. That's the leverage.

The pre-activation funnel: Discovery (the agent or developer learns your tool exists) → Evaluation (reads the description, checks trust signals) → Installation (runs the install command) → First agent action (a tool call succeeds) → Repeat usage (the agent returns to your tools). Drop-off happens at every step. Measure each one.

### The Protocol Landscape

There is no single right way to expose your product to agents. The industry is converging on a layered approach:

| Use Case | Best Approach | Why |
|----------|---------------|-----|
| Simple integrations (< 20 tools) | **MCP server** | Self-describing tools, automatic discovery, broad client support (110M+ monthly downloads) |
| Large API surfaces (100+ endpoints) | **Code Mode / typed SDK** | Token-efficient (99.9% reduction vs. MCP), agents write code against it, multi-step operations in a single execution |
| Developer tools / individual use | **CLI** | Self-documenting (`--help`), composable (pipes), debuggable (run the same command), auth-integrated |
| Provider-specific agents | **Function definitions** | Native to the agent platform (OpenAI, Google, etc.), zero overhead |

The smart move: **design your tool logic once, export to multiple formats.** Define your capabilities as abstract descriptions — tool name, parameters, return types, error cases — in a single source of truth. Then generate MCP server definitions, CLI commands, TypeScript SDK types, and function calling specs from that same source. Protocol migration becomes a code generation step, not a rewrite.

MCP is the most widely adopted standard today and the right default for most products. But don't confuse the protocol with the principle. The principle is: design for agent consumption. The protocol is a distribution choice.

### The Context Window Problem

There's a known tax on MCP-style tool definitions: **token bloat.** Every tool's description, parameter schema, and return type consumes tokens in the agent's context window. Production data is damning:

- 3 MCP servers with ~40 tools consumed **72% of a 200K token context window** just for definitions
- One database MCP server (106 tools) consumed **54,600 tokens** before a single query
- Perplexity dropped MCP internally because the overhead was unsustainable at production scale

This is a real problem, and it's being solved in three ways:

1. **Progressive discovery** — don't load all tools upfront. Give the agent a search tool that finds relevant tools on demand. Anthropic's approach reduces tool context by 98.7%.
2. **Code Mode** — replace tool definitions with a typed SDK. The agent writes code against it. Cloudflare proved this works at scale (2,500 endpoints, ~1,000 tokens).
3. **Fewer, better tools** — 10 well-designed tools beat 200 exhaustive ones. The God Server anti-pattern is the biggest contributor to bloat.

If you're shipping an MCP server, keep the tool count under 20 and use clear, verb-first names. If your API surface is larger, consider Code Mode or progressive discovery. The agent doesn't need to see every tool at once — it needs to find the right tool when it needs it.

### Connection Cost Approaches Zero

Here is how a company integrates with a traditional SaaS product:

1. Read the docs
2. Get an API key
3. Install the SDK
4. Write integration code
5. Handle auth flows
6. Write error handling
7. Test
8. Deploy

Here is how a company connects to an Agent-First product:

1. Install the agent tool (MCP server, CLI, SDK)
2. Connect

The agent already knows how to use it because agent tools are self-describing. The tool names, descriptions, and parameter schemas tell the agent everything it needs.

**What this eliminates:** connection boilerplate — SDK installation, auth wiring, basic CRUD code. **What this doesn't eliminate:** data mapping between systems, business logic in the integration layer, compliance requirements, testing against production data. Agent First compresses *connection* cost. *Integration* cost — the hard part — is a function of domain complexity, not protocol choice.

### Competitive Moat via Agent Ergonomics

Two products with identical REST APIs can have dramatically different agent experiences.

Product A exposes one tool: `query_database` with a raw SQL parameter. The agent has to know the schema, write correct SQL, and parse raw results.

Product B exposes ten well-named tools: `create_task`, `list_projects`, `assign_user`, each with typed parameters and structured responses. The agent picks the right tool, fills in the parameters, and gets clean data back.

Product B wins. Every time.

Agent UX is the new developer UX. The quality of your tool names, descriptions, parameter schemas, and error messages determines whether agents use your product well, poorly, or not at all.

**What makes a tool agent-friendly:**
- **Verb-first names** — `create_task`, not `task_manager`. The action is the interface.
- **Typed parameters with enums** — `stage: "prospecting" | "negotiation" | "closed-won"`, not `stage: string`. Reduce the agent's guesswork to zero.
- **Structured errors** — `{"error": "project_not_found", "suggestion": "call list_projects first"}`, not `400 Bad Request`. Help the agent recover.
- **Consistent naming** — if one tool uses `user_id`, all tools use `user_id`. Not `userId`, not `owner`, not `assigned_to`.
- **10-20 tools, not 200** — agents choke on tool selection when there are too many options. Group related actions. Expose the most useful tools, not every possible action.

These principles apply regardless of whether you're shipping an MCP server, a CLI, or a typed SDK. Code is a proven way to get computers to do things reliably — when agents generate code against a well-typed interface, they're more reliable than when navigating tool-call protocols.

**How durable is this moat?** As models get smarter, they'll handle poorly-designed tools better. But "the agent can technically figure it out" is a weak position — the same way "the site technically works on mobile" was a weak position in 2012. Well-designed interfaces will always outperform, even as the floor rises.

### Network Compatibility (Not Network Effects)

Every agent client in the ecosystem — Claude Code, Cursor, Windsurf, Zed, custom agents — is a potential distribution point. You build the agent interface once. Every new client that supports your protocol expands your reach.

This is protocol compatibility, not network effects. Your product doesn't get more valuable because more agent clients exist — it gets more *reachable*. The real compounding happens when multiple agent tools compose well together — your CRM tool becomes more useful when the user also has a calendar tool and an email tool available, because the agent can coordinate across all three.

### Measuring What Matters

New distribution model, new metrics. Here's what to track:

- **Time to first agent action** — how long from tool installation to the first successful call. Target: under 60 seconds.
- **Agent activation rate** — what percentage of installations result in at least one tool call within 7 days.
- **Agent return rate** — how often agents call your tools after the first session. This is your Day 7 / Day 30 retention equivalent.
- **Tool success rate** — what percentage of tool calls return a successful result without the agent retrying or asking the human for help. Track via structured logging. Below 90% means your tool design needs work.
- **Tool selection accuracy** — when multiple tools are available, how often does the agent pick the right one on the first try. Measure by logging the sequence of tool calls per task and flagging cases where the agent calls one tool, gets an error, then calls a different one. Low accuracy means your tool names or descriptions are ambiguous.

Traditional re-engagement tactics (push notifications, email drip campaigns) don't work when your user is an agent. What drives agent retention is reliability and ergonomics — agents return to tools that work every time and are easy to use. Your "retention strategy" is your tool quality.

Don't forget to measure the human side:

- **Human visibility rate** — what percentage of agent actions produce a visible output the human actually sees within 24 hours. If agents are using your product and humans don't know, you have an attribution problem.
- **Agent-to-human conversion** — for products with free tiers, how often does agent usage lead to the human creating an account or upgrading.
- **Time from first agent action to first human login** — measures whether invisible agent usage eventually drives human engagement. If this number is "never," your product is delivering value nobody is paying for.

---

## What Agent First Gets Wrong

Name these before the principles. Knowing what's broken is more useful than knowing what's ideal.

**The Lazy Wrapper** — The agent interface is just `fetch()` with a different name. No domain knowledge. No validation. No structured errors. The agent asks for a list of active deals and gets back 47KB of raw JSON with nested arrays, undocumented field names, and timestamps in three different formats. This is handing someone the raw database and calling it a product.

**The Invisible Product** — Ship the web app. Maybe add an API later. Never think about agent access. Your product is invisible to the agent ecosystem.

**Agents Without Rules** — No usage rules. The agent hallucinates identifiers, violates rate limits, creates duplicate records, and sends emails to the wrong people. Then someone says "AI doesn't work" and turns it off.

**Single-Model Trust** — Acting on one LLM's recommendation for decisions that cost money or affect users. One model says "this code is safe to deploy." Is it? You have no idea. That's a coin flip dressed up as confidence.

**The Slow Chatbot** — Requiring human approval for every agent action. If the agent can't do anything without asking permission, it's not an agent. It's a chatbot with extra steps.

**Ship and Forget** — Launch an agent integration for the press release. Don't maintain it. Don't test it. Let it rot. This is worse than not having one, because now agents try to use it, fail, and develop a negative association with your product.

**The God Server** — An agent interface that exposes 200 tools because it wraps an entire platform. Agents choke on tool selection when there are too many options. Ten well-chosen tools beat two hundred exhaustive ones.

---

## The Implementation Principles

Agent First tells you what to prioritize. These principles tell you how to build it.

Some are genuinely new to agent-first systems. Others are established practices — health checks, typed schemas, retry logic — that become critical when agents are your primary operators. The novelty isn't in the individual practices. It's in recognizing which ones matter most when the operator can't improvise.

| # | Principle | What It Means |
|---|-----------|---------------|
| 1 | **Interface First**{:#interface-first} | Design the agent interface before any human UI. Tool definitions are the first artifact of any feature — regardless of whether you ship them as MCP, CLI, SDK, or function specs. |
| 2 | **Contract First**{:#contract-first} | Write usage rules — permissions, constraints, sequences, formatting rules — before implementation. Without them, agents hallucinate and violate constraints. |
| 3 | **Prep Gates**{:#prep-gates} | Validate credentials, load fresh IDs, and confirm system health (pre-flight checks) before every session. Stale context is the #1 source of agent errors. |
| 4 | **Typed State**{:#typed-state} | All persistent agent state flows through a single structured data contract with versioned migrations. Each module owns its slice. |
| 5 | **Visible Outputs**{:#visible-outputs} | Agent actions must produce human-readable results in existing workflow tools. If a user asks "what did the agent just do?", there should be a clear answer — not a JSON blob. |
| 6 | **Multi-Model Verification**{:#multi-model-verification} | For high-stakes decisions, fan out to multiple models and trust only what multiple agree on. A finding three models flag is almost certainly real. A finding only one model flags is a hypothesis. |
| 7 | **Perspective Dispatch**{:#perspective-dispatch} | Complex reviews dispatch multiple constrained perspectives (security, UX, new-user, performance) against the same artifact. Each perspective has a defined focus area — findings outside it are discarded. |
| 8 | **Autonomous Recovery**{:#autonomous-recovery} | The system retries with backoff before alerting. Humans only get involved when self-healing has already failed. An agent that pages a human for a transient API timeout is a bad agent. |

### What's Genuinely New vs. Applied

**Interface First** and **Contract First** are new. Designing a tool interface for an AI consumer with no prior context about your product — and writing usage rules that an LLM will actually follow — doesn't have a clear pre-agent analog.

**Prep Gates** is health checks applied to agent sessions. Not new, but dramatically more important when the operator can't improvise around stale data.

**Typed State** is typed schemas with migrations. Standard since ORMs existed. What changes is the data contract becoming the coordination layer between autonomous jobs that can't talk to each other directly.

**Visible Outputs** is observability applied to agent actions. The key insight: outputs flow through the human's *existing* tools (task managers, email, chat), not a monitoring dashboard nobody checks. If an agent creates a task, the human sees: "Task 'Follow up with client' created by your assistant at 2:30 PM in Project Alpha." Not a JSON blob. Not a log entry.

**Multi-Model Verification** borrows from distributed systems — requiring agreement from independent sources before acting. Applying it to LLM outputs is new. The economics matter: a single verification (3 models) costs $0.05-0.50 at current pricing. That's cheap for "should we deploy this migration?" and expensive for "should we create this calendar event?" Apply it selectively.

**Perspective Dispatch** is structured code review with defined focus areas and severity levels. The formalization is new. The concept isn't.

**Autonomous Recovery** is straight from the SRE playbook. It makes the list because too many agent systems skip it entirely and fail silently. When self-healing fails, don't just alert — provide a human escalation path. The notification should include what happened, what the agent tried, and a direct link to take manual action. "Data sync failed 3x. Last error: upstream 503. Click here to retry manually or check status."

---

## Levels of Adoption

| Level | Name | Key Marker | Business Impact |
|-------|------|-----------|----------------|
| **0** | No agent access | Human operates all tools through UIs | Baseline |
| **1** | Agent as Afterthought | Thin API wrappers. No contracts, no validation | Agents can technically use it, but poorly |
| **2** | Agent-Aware | Usage rules exist. State is typed. Pre-flight checks validate before use | Agents use it reliably. Quality improves |
| **3** | **Agent-First** | Agent interface designed and shipped first. Agent is primary consumer | Discovery funnel active. Agents recommend your product |
| **4** | Agent-Driven | Agents extend the system for other agents. Self-healing. Multi-model checks | Platform effects. Your tools become infrastructure |

Most companies today are at Level 0 or 1. The opportunity is at Level 3.

**The Smallest Experiment.** Don't start with the full framework. Pick your most-used API endpoint. Wrap it in a single agent tool — an MCP tool, a CLI command, or a typed function — with a clear name, typed parameters, and a structured error response. Ship it. Measure time to first agent action and tool success rate. If agents use it reliably, you've validated the thesis. Build from there.

---

## The Honest Cost

Going Agent First isn't free. Here's what you're signing up for:

**Engineering investment.** Designing good agent tools takes thought. Writing usage rules takes iteration. For a mid-size SaaS product, expect 2-4 weeks of engineering to go from Level 0 to Level 2, and another 4-8 weeks to reach Level 3.

**Ongoing maintenance.** Agent tools are an API surface. When your product changes, your tools need to change — including descriptions, parameter schemas, and error messages. Schema evolution and backward compatibility are real concerns, the same ones that plague REST APIs.

**Multi-model costs.** Verification means paying for multiple API calls per decision. At current pricing, a single check (3 models) runs $0.05-0.50. Apply it to deployment decisions and security reviews, not to every tool call. If you consensus-check everything in a typical user session, you're looking at $1-10 in inference costs per session — prohibitive for freemium models, fine for enterprise workflows.

**Protocol risk.** MCP is the leading standard but less than two years old. It competes with OpenAI's function calling, Google's tool use spec, Cloudflare's Code Mode, and whatever ships next. The implementation principles in this document transfer regardless of protocol. Design your tool definitions as abstract capability descriptions first, then map them to whichever protocol your users' agents speak. If you keep your definitions in a single source of truth, protocol migration is a code generation step, not a rewrite.

---

## Security

Agent tools give AI programmatic access to create, modify, and delete data in your product. This needs to be addressed from the start, not bolted on later.

### Auth Patterns That Work Today

**Scoped tokens, not master keys.** Every agent connection should use a token scoped to the minimum permissions needed. If the agent only reads data, the token should not allow writes. If it manages one project, it should not have access to all projects.

**OAuth 2.0 with PKCE for user-facing tools.** When an agent tool acts on behalf of a user, use the same OAuth flow you'd use for any third-party integration. The user authenticates, grants scoped permissions, and gets a token that can be revoked independently.

**Short-lived tokens with refresh.** API keys that never expire are API keys that eventually leak. Issue tokens with 1-hour TTLs and rotate via refresh tokens. The agent tool handles renewal transparently.

**Per-user audit logging.** Every tool call gets logged: who called it (user + agent), what parameters were passed, what was returned, and when. This is not optional — it's the first thing your security team and your enterprise customers will ask for.

### Threats to Take Seriously

**Supply chain risk.** There is no gatekeeper for agent tools — especially MCP servers. No code signing, no verified publisher program. Treat agent tool installation like npm package installation — verify the source, pin versions, audit updates. This will get better as the ecosystem matures. It's the Wild West right now.

**Prompt injection via tool descriptions.** Tool descriptions are part of the LLM's context. A malicious tool server could craft descriptions that manipulate agent behavior. Validate tool schemas against known-good signatures. Don't blindly trust self-describing tools from unknown sources.

**Overprivileged agents.** An agent with full write access to your CRM is one hallucination away from sending the wrong email to the wrong customer. Default to read-only. Escalate to write permissions only for specific, validated actions.

---

## Comparison

| | TDD | API First | Mobile First | Agent First |
|---|---|---|---|---|
| **Mantra** | Red-Green-Refactor | Contract before code | Small screen first | Agent interface first |
| **Primary artifact** | Test suite | OpenAPI spec | Responsive breakpoints | Tool definitions + usage rules |
| **Design sequence** | Failing test → pass → refactor | Design API → implement → document | Design for mobile → add desktop | Design agent tools → add human UI |
| **Maturity** | 25+ years | 15+ years | 15+ years | < 2 years |
| **Evidence base** | Extensive | Strong | Strong | Early / emerging |

The maturity gap matters. TDD and API First have decades of evidence. Agent First has early adopter experience and a clear directional thesis. The principles are grounded in real production systems. The strategic claims need more data before they're settled.

---

## What We Don't Know Yet

This is a v0.5 framework. Some important questions don't have answers yet:

**What's the real adoption curve?** We don't have the Agent First equivalent of "mobile traffic crossed 50%." Agent-mediated product interactions are growing, but nobody has published reliable numbers on what percentage of SaaS usage flows through agents today. If agent-mediated interactions reach 10% of SaaS usage by 2028, Agent First is a two-year head start. If it takes until 2030, it's a four-year head start. If it stalls at 2%, the implementation principles still improve your API design — you just won't get the distribution leverage. The downside case is "you built a better API." The upside case is "you built the next platform."

**Is MCP the right protocol?** There's active industry debate. MCP has massive adoption (110M+ monthly downloads) and broad support (Anthropic, OpenAI, Google, Microsoft). But critics point to token bloat, immature auth, and the question of whether tool-calling is even the right abstraction. Cloudflare's Code Mode and CLI-first approaches offer compelling alternatives for specific use cases. David Soria Parra, MCP's creator, acknowledges the context bloat problem and says the protocol is shifting toward progressive discovery, stateless transport, and code-based tool composition. The framework in this document is deliberately protocol-agnostic — the principles hold regardless of which protocol wins.

**How do monetization models change?** If agents use your product and humans rarely open your UI, usage-based pricing becomes more natural than seat-based licensing. But who gets billed — the human, the agent operator, or the tool server host? These models are still forming.

**What happens when every competitor has agent tools?** If every project management tool ships well-designed agent interfaces, the differentiation shifts back to product quality, pricing, and brand. Agent First is a durable engineering advantage but potentially a temporary distribution advantage. Design your tools better and keep iterating.

**What does agent-first customer support look like?** When the primary user can't file a support ticket or read a help article, your support model needs to change. Error messages in tool responses become your support channel. Tool descriptions become your documentation. Some teams are solving this with elicitation — raising to a human whenever uncertainty passes a specific threshold.

---

## The Bottom Line

Your next feature will be used by an agent before a human ever sees it. Not because you planned it that way — because agents are already in the workflow, picking tools from what's available.

The question isn't whether to build for agents. It's whether to design for them intentionally or let it happen by accident.

Agent First is the intentional version.

Design the interface for a computer consumer. Write the rules. Validate before every session. Make outputs visible. Don't trust a single model. Build systems that recover without paging you.

The protocol doesn't matter. The principle does: your product's most important customer doesn't have a login. It has a tool list.

Design accordingly.

---

*Framework v0.5. April 2026.*

---

## About the author

Joshua Baer is the founder and CEO of [Capital Factory](https://capitalfactory.com), the center of gravity for entrepreneurs outside Silicon Valley. He's been building and investing in startups for three decades.

This thesis is part of his ongoing work on how AI agents reshape the way products are designed and used.

**Contact:**
- 𝕏 [@joshuabaer](https://x.com/joshuabaer)
- 🐙 [github.com/joshuabaer](https://github.com/joshuabaer)
- ✉️ [josh@quityourjob.com](mailto:josh@quityourjob.com)
- 💬 Comments below (preferred for thesis feedback)

---

<div id="comments" style="margin-top:3em;padding-top:2em;border-top:1px solid rgba(0,0,0,0.15);">
  <h2>💬 Comments</h2>
  <p>Have feedback, critique, examples, or counter-arguments? Comment below — backed by <a href="https://github.com/capitalthought/agentsfirst/discussions">GitHub Discussions</a>. (GitHub account required to post.)</p>
</div>

<script src="https://giscus.app/client.js"
        data-repo="capitalthought/agentsfirst"
        data-repo-id="R_kgDOSUZxkw"
        data-category="Announcements"
        data-category-id="DIC_kwDOSUZxk84C8WNg"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="preferred_color_scheme"
        data-lang="en"
        crossorigin="anonymous"
        async>
</script>
