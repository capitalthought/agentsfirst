# agentsfirst-mcp (hosted Worker) — Agent Rules

These rules govern how AI agents (Claude, Cursor, Windsurf, Cline, custom agents) use the tools exposed by the remote MCP server at `https://agentsfirst.dev/mcp`. Read this file before calling any tool. If something here contradicts a user request, surface the conflict — don't silently ignore the rule.

This is the **Contract First** artifact. See <https://agentsfirst.dev/principles/contract-first/>.

## Permissions

- **Every callable tool on this server is read-only.** The server makes outbound HTTP fetches against URLs the caller named; it never writes, never mutates, never sends.
- Tools safe to call without confirmation: `agentsfirst_prep`, `score_website`, `get_principle`, `get_anti_pattern`.
- The server never opens network connections except (a) the canonical-API ping during `agentsfirst_prep` (HEAD against `https://agentsfirst.dev/api/principles.json`) and (b) explicit `score_website` probes against the URL the caller passed (12 well-known surfaces + the homepage + a markdown-negotiation request — ~14 parallel HTTP fetches per call).
- The hosted Worker cannot read filesystems. `score_codebase` exists in `tools/list` but always returns a structured "not_supported_by_worker" error pointing to the local npx package.

## Required prep

**Call `agentsfirst_prep` at the start of every session before any other tool.** It verifies the rubric is loaded (8 principles + 7 anti-patterns), the runtime exposes `fetch()` + `AbortController`, and the canonical principles URL is reachable. If `ok=false`, stop and surface the failed checks. Do not run a score against a half-loaded rubric.

This is the **Prep Gates** principle. See <https://agentsfirst.dev/principles/prep-gates/>.

## Identifiers

The vocabulary on this server has stable canonical slugs. Never invent one.

**Principle slugs** — `interface-first`, `contract-first`, `prep-gates`, `typed-state`, `visible-outputs`, `multi-model-verification`, `perspective-dispatch`, `autonomous-recovery`.

**Anti-pattern slugs** — `lazy-wrapper`, `invisible-product`, `agents-without-rules`, `single-model-trust`, `slow-chatbot`, `ship-and-forget`, `god-server`.

If you need to confirm a slug, the canonical machine-readable list is at `https://agentsfirst.dev/api/principles.json`. Never hand-construct a slug that isn't in this list — `get_principle` and `get_anti_pattern` will return `error: not_found` and the result will not match the human-readable canon.

## Sequence

The typical flow:

1. **Prep** — `agentsfirst_prep`.
2. **Score** — `score_website` (for a public URL). For a local codebase, switch to the npx version: `npx -y @capitalthought/agentsfirst-mcp`.
3. **Explain (optional)** — `get_principle` or `get_anti_pattern` for any slug surfaced in the score, to give the human or downstream agent the canonical context.

`score_website` is the only step that needs to happen for a meaningful answer. The explain step is for follow-up — don't call it preemptively against all 8 principles; only fetch the ones the score surfaced.

## Tool selection

- **Public URL** → `score_website` (callable on this Worker).
- **Local directory / repo** → switch to `npx -y @capitalthought/agentsfirst-mcp` and call `score_codebase` there. Calling `score_codebase` on this Worker returns `error: not_supported_by_worker` with a pointer to the npx package; do not retry on this Worker.

## Errors

All tool errors return the same structured shape:

```json
{ "error": "<machine_code>", "suggestion": "<one-line fix>" }
```

Known error codes:

- `probe_failed` — the HTTP probe raised. Check `detail`; fix the URL and retry.
- `not_found` — the slug you passed isn't in the canonical list. The `suggestion` will name the valid set; pick from that. Never retry blindly on `not_found` — the slug is wrong, not transiently unavailable.
- `not_supported_by_worker` — you called `score_codebase` on the hosted Worker. Switch to the local npx version. Do not retry.

## Cost & rate limits

Each `score_website` call performs ~14 parallel HTTP fetches against the target origin (robots.txt, llms.txt, /AGENTS.md, /.well-known/*, sitemap.xml, OpenAPI variants, the homepage twice — once with `Accept: text/markdown`). All requests carry the User-Agent `agentsfirst-mcp-worker/0.1 (+https://agentsfirst.dev/mcp)`. Respect the target's robots.txt and any per-second throttling — don't fan out scoring runs against the same origin in a tight loop.

## Visible outputs

Scoring runs are read-only and produce no side effects. The MCP response is the artifact. If you want a human-visible record, the consuming agent must ship one — log to Slack, email a summary, post a Linear issue. This server does not emit visible outputs of its own; it returns structured data.

When you produce a human-facing summary from a `score_website` result, lead with the score and level, not the throat-clearing. Numeric score, what's working, what's missing, anti-patterns flagged, top moves to climb a level.

## Anti-patterns to avoid when consuming this server

- **God Server** — don't expose all 5 of these tools as separate "skills" in your downstream UI. Group them: one "score" action that wraps `score_website`, one "explain" action that wraps `get_principle`/`get_anti_pattern`. Five tools is the cap, not the goal.
- **Single-Model Trust** — for high-stakes uses (acquisition due diligence, portfolio scoring), run multi-model after this server. Single-LLM scoring is fine for the default case.
- **Lazy Wrapper** — don't pass the raw JSON output of `score_website` into a chat. Render the report. The structured response is the input to a human-readable artifact, not the artifact itself.

For full anti-pattern definitions: <https://agentsfirst.dev/glossary/>.

---

Hosted at <https://agentsfirst.dev/mcp>. Local sister: [`@capitalthought/agentsfirst-mcp`](https://www.npmjs.com/package/@capitalthought/agentsfirst-mcp). Read the framework: <https://agentsfirst.dev/principles/contract-first/>. The agent loads this file on session start; vague rules produce vague behaviour.
