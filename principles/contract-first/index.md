---
title: "Contract First | Agents First"
description: "Write the usage rules — permissions, sequences, formatting, identifiers — in AGENTS.md before implementation. Without rules, agents hallucinate."
image: /og-image.png
author: Joshua Baer
---

# Contract First

Write the usage rules — permissions, sequences, formatting requirements, identifier conventions — in an `AGENTS.md` file before the implementation. Tool definitions tell the agent what's possible. The contract tells it what's allowed.

Tool definitions alone aren't enough. A `send_email` tool exposes the capability to send email. The contract tells the agent: never send to a human without the user naming the recipient, never include private project IDs in the subject line, always call `list_recipients` before sending to a group, use plain UTF-8 in the subject — never MIME-encoded. None of that fits in a parameter schema. All of it determines whether the tool gets used correctly.

Without a contract, every agent that touches your product runs with no prior context — because it has none. It guesses at the right sequence of calls. It hallucinates IDs that look plausible but don't exist. It violates rate limits because nobody told it the limits. It sends a confirmation email to the wrong customer because it pattern-matched on the closest-looking ID from the previous turn.

The fix is a markdown file. It lives at the root of your project (or your MCP server's repo) under a name agents will look for — `AGENTS.md` is the emerging convention; `CLAUDE.md`, `.cursorrules`, and equivalents work the same way. It documents the rules in plain prose, with examples. The agent loads it as part of its context at session start and refers to it whenever uncertainty arises.

## Why it matters

The most expensive agent errors aren't bugs. They're the agent doing exactly what your tool definitions said it could do, just not the way you would have done it. The agent calls `delete_record` because the tool exists, when the right move was to archive. It creates a duplicate because nobody told it to dedupe by email first. It writes "Hi {first_name}" into the email body because the template field wasn't escaped — and the contract didn't explain that personalization happens after templating, not before.

These errors don't show up in your test suite. They show up in customer support tickets, weeks after launch, when someone asks why their CRM has 14 copies of the same lead. The team's response is usually "the AI made a mistake." The AI did exactly what the API allowed. The mistake was shipping the API without the contract.

Cost of writing a contract: one markdown file and an hour of thinking. Cost of skipping it: the trust collapse after the first wrong email — the customer turns off the integration, tells the next person it's broken, and winning them back is an order of magnitude harder than writing the contract in the first place.

## How to apply it

1. **Create `AGENTS.md` at the root of your project before any tool implementation lands.** Human-and-agent-readable contract. Track it in git like any other source artifact.

2. **Document permissions and constraints in plain English.** Not "the API enforces this" — explain *what* and *why*. "Never call `delete_record` without first calling `find_dependencies` to confirm the record isn't referenced elsewhere. Cascading deletes are not supported and will leave dangling foreign keys."

3. **Document required sequences.** "Before creating a deal, call `list_pipelines` to get valid pipeline IDs. The IDs in the agent's training data are stale and will return 404."

4. **Document identifier formats.** "Project IDs are 12-character base32 strings prefixed with `prj_`. If you receive an ID without the prefix, prefix it before calling any tool. Never invent project IDs."

5. **Document formatting rules.** "Email subjects are plain UTF-8. Never MIME-encode. Never substitute HTML entities. The transport layer handles encoding downstream — pre-encoding double-encodes."

6. **Include a 'common mistakes' section.** Real mistakes the agent has made, in plain terms, with the right behavior beside them. Highest-leverage section in the file — it transfers operational learning directly into the agent's context.

7. **Version the contract with the API.** Add a tool, update `AGENTS.md` in the same PR. Change a constraint, bump a version line at the top so agents and humans can see what changed.

A minimal `AGENTS.md` skeleton:

```markdown
# AGENTS.md

## Identifiers
- User IDs: `usr_<12 chars>`. Never invent.
- Project IDs: `prj_<12 chars>`. Always call `list_projects` first.

## Required sequences
- Before `create_deal`: call `list_stages` to get valid `stage` values.
- Before `send_email`: call `list_templates` and confirm the template exists.

## Permissions
- `delete_*` tools require explicit user confirmation in the same turn.
- Bulk operations (`bulk_update_*`) require a dry-run first.

## Common mistakes
- Sending email with `subject: "=?UTF-8?B?...?="` — pre-encoded. Use plain UTF-8.
- Calling `assign_user` with an email instead of `user_id` — call `find_user` first.
```

That file does more for tool quality than another round of unit tests. The difference between an agent that works and one that hallucinates.

## What this prevents

Contract First defends against [Agents Without Rules](/glossary/#agents-without-rules) — the agent has access to your tools but no idea how to use them correctly. Without the contract, agents fall back on plausible-looking patterns from their training data. That's exactly how you end up with hallucinated identifiers and violated constraints.

It limits the blast radius of [Single-Model Trust](/glossary/#single-model-trust) too. Even when you're depending on one model's judgment, a well-written contract narrows the decision space. The model isn't free-styling — it's working inside the rails the contract drew.

It indirectly defends against [Ship and Forget](/glossary/#ship-and-forget). A versioned `AGENTS.md` is a forcing function: every API change requires updating the contract, which means somebody is still maintaining the integration. A repo with a stale `AGENTS.md` is a tell that nobody's paying attention.

## The smallest experiment

Write `AGENTS.md` for the integration you already have, even if you didn't plan on it. Spend an hour. Document the three most common mistakes you've seen agents make against your product, with the right behavior next to each one. Document the identifiers and any required call sequences. Commit it to the root of your repo. Next time an agent works against your product — yours, your customer's, anyone's — it picks the file up automatically. Measure [tool success rate](/glossary/#tool-success-rate) before and after. Lift on a real product is usually 10–30 points.

## Related principles

- [Interface First](/principles/interface-first/) — the contract documents how to use the interface. Both have to exist; neither replaces the other.
- [Prep Gates](/principles/prep-gates/) — the contract should require the prep call as the first action of every session, so agents never act on stale identifiers.

---

*Part of [Agents First](/) — a design framework for products built for both humans and AI agents.*
