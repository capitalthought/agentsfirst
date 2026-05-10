---
id: 20260510-105258-v07-followup-propagate-principle-9
source_repo: social
target_repo: agentsfirst
filed_at: 2026-05-10T10:52:58-05:00
filed_by: claude-opus-4-7
filed_from_machine: JoshHome
severity: medium
status: open
repro_hash: de7cfd78
tags: [v0.7, principle-9, inspectable-state, scaffold, scoring, follow-up]
related_commit: b8926f4
gh_issue: null
---

## Summary

v0.7 follow-up — propagate Principle 9 (Inspectable State) into the scaffold, the scoring tool, and stale references. Canonical surfaces are updated, but downstream consumers still ship v0.6.

## Reproducer

After commit b8926f4 ("v0.7 — add Principle 9 (Inspectable State) and anti-pattern 8 (Black Box Server)"),
canonical surfaces are updated but four downstream consumers still reference the v0.6 8-principle / 7-anti-pattern world:

1. tools/create-agents-first/ — npx scaffold ships starter MCP servers with the
   first 8 principles wired in (Interface First through Autonomous Recovery).
   Should add an `overview` MCP tool stub returning {inventory, recent_activity, health}
   so new projects get Inspectable State by default. Currently new projects ship
   Level 2 with a Principle 9 gap by construction.

   git grep "all eight\|eight principles\|7 principles\|8 principles" tools/create-agents-first/

2. tools/cf-portfolio-pilot.py — scoring logic. The score_codebase / score_website
   logic in @capitalthought/agentsfirst-mcp may need a new check for Inspectable
   State (presence of an overview/status tool in the MCP surface). Without it,
   the scorer can't credit Level-3 projects that ship the principle.

3. README.md (capitalthought/agentsfirst) — line 17 references "v0.5, April 2026"
   for the published thesis version. Now stale (v0.7 May 2026).

4. scores/portfolio-* — 33+ historical CF Portfolio score reports were generated
   against v0.6 rubric. NOT auto-rebump (point-in-time artifacts). But future
   re-scores should use v0.7+, and the scoring tool needs to be aware that
   existing scores were generated against a different rubric (annotate or
   re-score on demand).

## Expected

Either the scaffold + scoring tool get bumped in lockstep with framework versions, OR the framework changelog explicitly notes the propagation lag and gives consumers a release timeline. New projects scaffolded after the framework version bumps should ship the new principle's pattern by default — otherwise the framework's "scaffold ships all N principles wired in" claim drifts every release.

## Actual

The v0.7 commit landed canonical surfaces (index.md, principles/, glossary/, AGENTS.md, llms.txt, JSON catalogs, MCP server card) but explicitly deferred the four consumers above. Without follow-up:

- Agents using `npx @capitalthought/create-agents-first` continue scaffolding v0.6-shaped projects (no `overview` tool by default).
- The scorer at agentsfirst-mcp doesn't credit projects for shipping Inspectable State, so external products scored via the scorer won't see Principle 9 factored in.
- CF portfolio scores remain valid as point-in-time artifacts but aren't flagged as v0.6-rubric.

## Environment

- Trigger: commit `b8926f4` on capitalthought/agentsfirst@main, 2026-05-10
- Source repo: social (cwd at filing time, but the report is about agentsfirst's own follow-ups)
- Filed from: JoshHome (Mac Studio)
- Model: claude-opus-4-7
- Public surfaces verified post-deploy: https://agentsfirst.dev/principles/inspectable-state/, https://agentsfirst.dev/api/principles.json (v0.7, 9 entries)

## Notes

- **Highest leverage:** the scaffold update. Every new project bootstrapped with `create-agents-first` becomes Inspectable State-shaped automatically. Skip it and Principle 9 stays a doc claim, not a default. Concrete shape:
  - New file in template: `src/overview.ts` (mirroring the social-repo pattern from commit `bb5edf9` at capitalthought/social — see `https://github.com/capitalthought/social/blob/main/src/overview.ts` once the social repo is open-sourced or check ~/Xcode/social/src/overview.ts for the local reference impl).
  - Tool registration in template's server.ts: `overview` tool, no input schema, returns `{generated_at, inventory, recent_activity, health}`.
  - Template AGENTS.md updated to list the new tool + reference Inspectable State.
- **Second priority:** scoring tool. Without it, the framework's own scorer can't enforce the new principle. New scoring criterion: presence of a status/overview tool on the MCP surface. Bump version in scorer to align with v0.7.
- **Trivial:** README.md "v0.5, April 2026" → "v0.7, May 2026" — one line.
- **Lowest urgency:** historical score reports. Either annotate them with the rubric version they were scored against, or accept them as v0.6 artifacts and document that policy.
- The propagation lag is mentioned in changelog/index.md v0.7 entry: "Prior counts (8 principles, 7 anti-patterns) updated everywhere they appeared in the canonical surfaces; downstream consumers (portfolio scoring tool, score reports, scaffold) will be updated separately and may briefly trail." That note makes the lag explicit but doesn't track the work — this bug report is the tracker.
- After the scaffold lands, file follow-up bugs in `agentsfirst` for: (a) re-score CF portfolio against v0.7, (b) update agentsfirst-mcp npm package to v0.7. Both are downstream of the scoring tool fix.
