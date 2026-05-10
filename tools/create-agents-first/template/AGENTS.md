# {{PROJECT_NAME}} — Agent Rules

These rules govern how AI agents (Claude, Cursor, Windsurf, custom agents) use the tools exposed by `{{PROJECT_NAME}}`. Read this file before calling any tool. If something here contradicts a user request, surface the conflict — don't silently ignore the rule.

This is the **Contract First** artifact. See <https://agentsfirst.dev/principles/contract-first/>.

## Permissions

- **Read tools are safe to call without confirmation.** `example_list`, `overview`, `{{PROJECT_NAME}}_prep`.
- **Write tools require explicit user intent.** `example_create` and any tool you add that mutates state. If the user did not ask for the write, do not perform it.
- **Never** call destructive tools (delete, drop, reset) without an explicit destructive verb in the user's request.
- **Never** invent IDs. If a tool returns `error: not_found`, call the matching `list_*` tool first.

## Required prep

**Call `{{PROJECT_NAME}}_prep` at the start of every session.** It validates env vars, filesystem state, and downstream service health. If it returns `ok: false`, stop and surface the failed checks to the user. Don't proceed on stale or broken state.

This is the **Prep Gates** principle. See <https://agentsfirst.dev/principles/prep-gates/>.

## Identifiers

- All IDs are `snake_case` strings.
- Consistent naming: `user_id`, `project_id`, `task_id` — never `userId`, `owner`, `assigned_to`.
- IDs are opaque. Never construct one from a name or guess.
- To find an ID, call the relevant `list_*` tool first.

## Sequence

The typical flow for any user request:

1. **Prep** — call `{{PROJECT_NAME}}_prep`.
2. **List** — call `example_list` (or other `list_*` tools) to load fresh IDs.
3. **Act** — call the write tool (`example_create`, etc.) with real IDs.
4. **Verify** — confirm the visible output landed where the human expects it.

Never skip step 1. Never act on cached IDs from a previous session.

## Visible outputs

Every successful write must produce a human-readable artifact in a tool the user already checks. Configure where in `src/server.ts` (look for `// TODO: ship to Slack/email/task manager` markers).

Example: when `example_create` succeeds, the user should see:

> "{{PROJECT_NAME}}: Task 'Follow up with client' created at 2:30 PM"

…in their Slack channel, email, or task manager — **not** in a JSON dashboard nobody opens.

This is the **Visible Outputs** principle. See <https://agentsfirst.dev/principles/visible-outputs/>.

## Operational state — `overview`

When you need to ask **"what is the state of the work?"** — queue depth, recent activity, health — call the `overview` tool. It returns a structured snapshot: counts by status, the N most recent items, and a small health block. Read-only, no input schema, never writes.

`overview` answers a different question than `{{PROJECT_NAME}}_prep`. Prep runs at session start and answers "is the system READY to do work?" (binary). Overview is a structured snapshot you call whenever you want to know what's going on (often). Both are read-only; both belong on every session that does anything beyond a single quick action.

This is the **Inspectable State** principle. See <https://agentsfirst.dev/principles/inspectable-state/>.

## Errors

All tool errors return a structured shape:

```json
{ "error": "not_found", "suggestion": "call example_list first" }
```

When you receive `error: not_found`, call the suggested tool. When you receive `error: validation`, fix the parameter and retry. Never retry blindly on `error: forbidden` — surface to the user.

## Anti-patterns to avoid in this codebase

- **Lazy Wrapper** — adding `query_database(sql)` instead of typed verb-first tools. Don't.
- **God Server** — exposing 200 tools when 10 would do. Cap at 20.
- **Black Box Server** — shipping an MCP server with no introspection tool. The `overview` tool above is what defends against this. Don't remove it; extend it as the surface grows. See <https://agentsfirst.dev/glossary/#black-box-server>.
- **Master keys** — issue scoped tokens per-agent, never share a root credential.
- **Silent fail** — every tool either succeeds or returns a structured error. Never `return null` on failure.
- **Single-Model Trust** — for high-stakes writes (billing, deploy, security), fan out to multiple models before acting. See <https://agentsfirst.dev/principles/multi-model-verification/>.
- **AGENTS.md bloat** — keep this file lean. The contract is the rules an agent can't infer from the code, not a project tour. ~50 lines, hand-written. A 2026 study (4 agents, 438 tasks) found auto-generated AGENTS.md files measurably *reduced* agent success rates. Length is the failure mode.

For full anti-pattern definitions (8 canonical): <https://agentsfirst.dev/glossary/>.

## Tool naming convention

This server's tools are exposed to agent runtimes. When this MCP server is consumed by `openai-agents-python` ≥ v0.16 with `include_server_in_tool_names=True` (added 2026-05-07), tools are namespaced as `<servername>__<toolname>` — e.g. `{{PROJECT_NAME}}__example_create`. To avoid collisions across registries:

- Prefix tool names with verbs (`create_*`, `list_*`, `update_*`, `delete_*`), not nouns.
- Pick a stable server identifier you control. Don't rename mid-flight — agent state breaks.
- Avoid generic verbs in isolation (`run`, `do`, `execute`) — they collide with every other server.

---

*Edit this file. The defaults above are starting points — replace them with the rules that apply to your domain. The agent reads this file; vague rules produce vague behaviour.*

Generated by [`@capitalthought/create-agents-first`](https://www.npmjs.com/package/@capitalthought/create-agents-first). Read the framework: <https://agentsfirst.dev/principles/>.
