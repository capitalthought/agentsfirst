---
title: "Visible Outputs"
description: "Agent actions must produce human-readable results in tools the human already opens — Slack, email, the task manager — not a JSON blob in a dashboard nobody checks."
image: /og-image.png
author: Joshua Baer
---

# Visible Outputs

Agent actions must produce human-readable results in tools the human already opens — Slack, email, the task manager, the inbox — not a JSON blob in a dashboard nobody checks. If the human can't tell what the agent did without opening a separate observability tool, the agent's work is invisible.

"Created task 'Follow up with client' in Project Alpha at 2:30 PM" beats an `audit_log` row that exists but never gets read. The audit log might be more rigorous, more queryable, more correct — but if it doesn't surface where the human already is, the agent's work doesn't enter the human's awareness. Which means it can't be trusted, corrected, or expanded.

Visibility turns agent output into accountable work. An agent that does ten things a day with no visible trace is indistinguishable from an agent that does nothing. Worse, it's indistinguishable from an agent that's quietly doing the wrong things — neither produces evidence the human will see.

The principle has a specific shape: the agent's action lands in the human's existing workflow at the moment it makes sense to see it. A new task shows up in the task manager with the agent named as the creator. An email draft lands in the user's drafts folder. A successful sync posts a one-line message in the team Slack channel. A failed action lands in the same inbox the human checks for failures of any kind.

## Why it matters

Skip visibility and three failure modes show up. Trust collapses silently — the human notices that "stuff happens" but can't reconstruct what or why. The first time an agent action turns out to be wrong, the human can't find it to fix it, so they turn the agent off rather than dig through logs. Learning stops — the team that built the integration can't see how it's actually being used. Adoption metrics are visible, but the qualitative texture ("this confused me, this was great, this one I had to undo") is lost. The agent becomes a black box that scares people — even users who like it can't explain what it does to the next person, because they have no concrete examples to point to.

The "audit log in a dashboard" alternative looks rigorous but fails for predictable reasons: nobody opens the dashboard. It's one more tab to remember. It tells you what happened but not whether you cared. Compare with the task manager you already check ten times a day — the agent's output lives where your attention already is.

Second-order effect: when outputs are visible, the team building the agent gets immediate signal about quality. The first time an agent posts a confusing summary into Slack, three people respond in the thread asking what it means. Free product feedback. With invisible outputs, the same confusion exists but never surfaces.

## How to apply it

1. **Pick the human's existing tool, not your own dashboard.** Slack, the task manager, email, the in-app notification center. Whatever the human already has open. Building a new dashboard for agent activity? You've already lost.

2. **Write the visible output at the moment of action.** When the agent creates a task, the human-readable record lands in the same beat. Not five minutes later in a batched summary. Not in a daily digest. Now.

3. **Lead with the action, not the metadata.** "Created 'Follow up with client' in Project Alpha." Not "Event type: TASK_CREATED, payload: {...}." The human reads it like a sentence, not a log line.

4. **Identify the agent and the moment.** "Created by your assistant at 2:30 PM" — so the human can distinguish agent actions from human ones, and find the moment in the conversation that triggered it if they need to debug.

5. **Surface failures the same way.** A failed action gets the same channel and format. "Tried to email Jane Smith — couldn't find her in the contact list. Action paused." The human reads, decides, acts. The audit log still exists for compliance — it's not the primary surface.

6. **Make every visible output linkable.** Clickable link to the created task. Clickable link to the email draft. Fewer steps between "I see this happened" and "I can fix or expand it" earns the output its place.

7. **Track [human visibility rate](/glossary/#human-visibility-rate) as a first-class metric.** Percentage of agent actions that produced a visible output the human actually saw within 24 hours. Below 90%, something is invisible that shouldn't be.

A minimal pattern, in pseudocode, for a CRM agent action:

```typescript
async function agentCreateDeal(input) {
  const deal = await crm.createDeal(input);

  // Visible output — lands where the human already is.
  await slack.postMessage({
    channel: input.user.slack_dm_channel,
    text: `Created deal *${deal.title}* ($${deal.amount_usd.toLocaleString()}) in ${deal.stage}.`,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: `Created deal *<${deal.url}|${deal.title}>* — $${deal.amount_usd.toLocaleString()}, stage: ${deal.stage}.` }},
      { type: "context", elements: [{ type: "mrkdwn", text: `Your assistant · ${formatTime(deal.created_at)}` }]},
    ]
  });

  return deal;
}
```

The audit log row still gets written. The dashboard still gets the data. But the human's actual signal — the one that determines whether they trust this agent tomorrow — comes through the channel they already check.

## What this prevents

Visible Outputs defends against [Ship and Forget](/glossary/#ship-and-forget) by making degradation immediately obvious. An integration that's silently failing produces no visible outputs — and the absence is loud, since the human has come to expect them. Compare with a dashboard nobody opens, where silent failure is indistinguishable from idle.

It's the inverse of the [Slow Chatbot](/glossary/#slow-chatbot) anti-pattern. A slow chatbot asks permission for every action and produces no autonomous output. A well-designed agent acts autonomously and produces visible output for every action — opposite ends of the same axis. Visible outputs let agents act without becoming opaque.

It boosts [agent activation rate](/glossary/#agent-activation-rate) and [agent return rate](/glossary/#agent-activation-rate) (related metric) too — humans extend trust to agents whose work they can see. They cut off agents whose work is invisible, even when those agents are doing the right thing.

## The smallest experiment

Pick the single most common agent action your product takes, and add a visible-output side effect for it. Pick the human's primary workflow tool — Slack, email, the task manager. Write the human-readable summary as a sentence, not a structured log line. Include who, what, when, and a link. Ship it. Measure how often humans react in-thread (replies, emojis, edits to the agent's output). That reaction rate is your real measure of whether the agent is becoming part of the team.

## Related principles

- [Typed State](/principles/typed-state/) — the human-readable summary is generated from typed fields. Loose state means inconsistent summaries, which erode trust faster than no summary at all.
- [Autonomous Recovery](/principles/autonomous-recovery/) — when recovery escalates to a human, the escalation has to be a visible output too. "Tried 3x, failed, here's the manual override link" is the same pattern.

---

*Part of [Agents First](/) — a design framework for products built for both humans and AI agents.*
