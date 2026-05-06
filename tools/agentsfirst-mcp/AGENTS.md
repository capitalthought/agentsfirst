# agentsfirst-mcp — Agent Rules

These rules govern how AI agents (Claude, Cursor, Windsurf, custom agents) use the tools exposed by `@capitalthought/agentsfirst-mcp`. Read this file before calling any tool. If something here contradicts a user request, surface the conflict — don't silently ignore the rule.

This is the **Contract First** artifact. See <https://agentsfirst.dev/principles/contract-first/>.

## Permissions

- **Every tool in this server is read-only.** The server probes filesystems and HTTP surfaces; it never writes, never mutates, never sends.
- `agentsfirst_prep`, `score_codebase`, `score_website`, `get_principle`, `get_anti_pattern` — all safe to call without confirmation.
- The server never opens network connections except (a) the optional canonical-API ping during `agentsfirst_prep` and (b) explicit `score_website` probes against the URL the caller provided.
- The server never reads `.env`, secrets files, or anything outside the directory passed to `score_codebase`. Only run it against directories the user already trusts you to inspect.

## Required prep

**Call `agentsfirst_prep` at the start of every session before any other tool.** It verifies the rubric is loaded (8 principles + 7 anti-patterns), Node is >=20, and the canonical principles URL is reachable. If `ok=false`, stop and surface the failed checks. Do not run a score against a half-loaded rubric.

This is the **Prep Gates** principle. See <https://agentsfirst.dev/principles/prep-gates/>.

## Identifiers

The vocabulary in this server has stable canonical slugs. Never invent one.

**Principle slugs** — `interface-first`, `contract-first`, `prep-gates`, `typed-state`, `visible-outputs`, `multi-model-verification`, `perspective-dispatch`, `autonomous-recovery`.

**Anti-pattern slugs** — `lazy-wrapper`, `invisible-product`, `agents-without-rules`, `single-model-trust`, `slow-chatbot`, `ship-and-forget`, `god-server`.

If you need to confirm a slug, the canonical machine-readable list is at `https://agentsfirst.dev/api/principles.json`. Never hand-construct a slug that isn't in this list — `get_principle` and `get_anti_pattern` will return `error: not_found` and the result will not match the human-readable canon.

## Sequence

The typical flow:

1. **Prep** — `agentsfirst_prep`.
2. **Score** — `score_codebase` (for a local directory) or `score_website` (for a URL).
3. **Explain (optional)** — `get_principle` or `get_anti_pattern` for any slug surfaced in the score, to give the human or downstream agent the canonical context.

`score_*` is the only step that needs to happen for a meaningful answer. The explain step is for follow-up — don't call it preemptively against all 8 principles; only fetch the ones the score surfaced.

## Errors

All tool errors return the same structured shape:

```json
{ "error": "<machine_code>", "suggestion": "<one-line fix>" }
```

Known error codes:

- `probe_failed` — the underlying probe raised. Check the `detail` field for the cause; fix the path or URL and retry.
- `not_found` — the slug you passed isn't in the canonical list. The `suggestion` will name the valid set; pick from that.

Never retry blindly on `error: not_found` — the slug is wrong, not transiently unavailable.

## Visible outputs

Scoring runs are read-only and produce no side effects. The MCP response is the artifact. If you want a human-visible record, the consuming agent must ship one — log to Slack, email a summary, post a Linear issue. This server does not emit visible outputs of its own; it returns structured data.

When you produce a human-facing summary from a `score_*` result, lead with the score and level, not the throat-clearing. Match the report shape from the SKILL.md companion: numeric score, what's working, what's missing, anti-patterns flagged, top moves to climb a level.

## Anti-patterns to avoid when consuming this server

- **God Server** — don't expose all 5 of these tools as separate "skills" in your downstream UI. Group them: one "score" action that wraps `score_codebase`/`score_website`, one "explain" action that wraps `get_principle`/`get_anti_pattern`. Five tools is the cap, not the goal.
- **Single-Model Trust** — for high-stakes uses (acquisition due diligence, portfolio scoring), run multi-model after this server. Single-LLM scoring is fine for the default case.
- **Lazy Wrapper** — don't pass the raw JSON output of `score_codebase` into a chat. Render the report. The structured response is the input to a human-readable artifact, not the artifact itself.

For full anti-pattern definitions: <https://agentsfirst.dev/glossary/>.

---

Generated alongside [`@capitalthought/agentsfirst-mcp`](https://www.npmjs.com/package/@capitalthought/agentsfirst-mcp). Read the framework: <https://agentsfirst.dev/principles/>. The agent loads this file on session start; vague rules produce vague behaviour.
