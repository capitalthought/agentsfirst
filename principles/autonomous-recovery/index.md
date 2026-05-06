---
title: "Autonomous Recovery"
description: "Retry with backoff before paging a human. When self-healing fails, escalate with what happened, what was tried, and a direct link to take manual action."
image: /og-image.png
author: Joshua Baer
---

# Autonomous Recovery

Retry with backoff before alerting. Humans only get involved when self-healing has already failed — and when they do, the alert includes what happened, what was tried, and a direct link to take manual action.

An agent that pages a human for a transient API timeout is a bad agent. The upstream service was down for 90 seconds; by the time the human reads the alert, the service is back. The human got distracted by something they can't act on. Trust in the alert channel erodes a notch. After a week of this, the human starts ignoring alerts — including the ones that matter.

Same playbook every SRE has used for two decades. Distinguish transient failures from real ones. Retry the transient ones with exponential backoff and a sane retry budget. Don't alert on a single failure; alert on a sustained pattern. When self-healing genuinely fails, escalate — in a form the human can act on immediately, with the context they need to take over without re-investigating.

What's new is that too many agent systems skip this entirely. They either fail silently — the agent gives up, returns a confused response, and the human has to figure out what happened — or they alert on every blip, training the human to ignore the alert channel. Both failure modes destroy trust faster than any single bug.

Autonomous recovery is the discipline of failing well: retry quietly when the system can fix itself, escalate clearly when it can't.

## Why it matters

Real systems fail constantly in transient ways. APIs return 503 for 30 seconds during a deploy. Rate limits spike. Networks drop a packet. Databases hit a brief connection limit. None of these need human involvement; all resolve within seconds to minutes.

An agent without recovery logic treats every transient failure as a real one. It either crashes the user-facing operation ("I tried to update your record but got a 503, sorry") or it pages a human ("Manual intervention required: upstream returned 503"). Both are wrong. The user's operation should have succeeded after a 2-second retry. The human shouldn't have been notified at all.

The opposite failure mode is worse: the agent retries forever, including on errors that aren't transient. A 401 isn't fixed by a retry — the token is bad. A 422 isn't fixed by a retry — the payload is malformed. An agent that retries indefinitely on these errors burns rate limits, wastes compute, and never escalates the underlying problem to anyone who can fix it.

Good recovery logic distinguishes these cases. Transient errors (5xx server errors, 429 rate limits, network timeouts) get retried with exponential backoff and a budget. Permanent errors (4xx client errors, schema violations, auth failures) escalate immediately with diagnostic context. After the retry budget is exhausted on a transient error, that becomes a permanent failure too — and gets escalated.

The escalation itself matters as much as the retry policy. A human who sees "data sync failed 3x, last error: upstream 503, click here to retry manually or check upstream status" can act in seconds. A human who sees "Error" cannot. Every escalation should include: what happened (the operation), what was tried (the retry history), what the final error was, and a direct link to take over.

## How to apply it

1. **Classify errors as transient or permanent.** Transient: 5xx server errors, 429 rate limits, connection timeouts, network failures. Permanent: 4xx client errors (especially 401, 403, 404, 422), schema validation failures, contract violations. Don't retry permanent errors.

2. **Retry transient errors with exponential backoff and jitter.** Standard pattern: retry after 1s, 2s, 4s, 8s, with random jitter to avoid thundering herds. Set a maximum retry budget (5 attempts is a reasonable default).

3. **Make every operation idempotent.** Retries are only safe when the second attempt has the same effect as the first. Use idempotency keys for write operations. Without idempotency, retries either silently double-write or refuse to retry anything important.

4. **Don't alert on the first transient failure.** Alert on a sustained pattern. "More than 5% error rate over the last 10 minutes" is a real alert. "One request failed once" is noise.

5. **When self-healing fails, escalate with full context.** The escalation answers four questions in one message: what was the agent trying to do, what did it try (the retry history), what was the final error, and what should the human do now (with a direct link). Land it in the human's existing workflow — see [Visible Outputs](/principles/visible-outputs/) — not in an observability tool they don't check.

6. **Make the manual override easy.** "Click here to retry manually." "Click here to mark as failed and continue." "Click here to see the upstream status page." Cut time-to-resolution to seconds.

7. **Track retry rates.** A spike in retry rates (even when most succeed) is a leading indicator of an upstream problem. A spike in escalation rates is a leading indicator of a real outage. Both belong on a dashboard somewhere; the difference is whether they wake people up.

A minimal recovery wrapper, in pseudocode:

```typescript
async function withRecovery<T>(
  op: () => Promise<T>,
  context: { name: string; manualLink: string; user: User },
): Promise<T> {
  const maxAttempts = 5;
  const errors: Error[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await op();
    } catch (err) {
      errors.push(err);
      if (!isTransient(err)) {
        await escalate(err, errors, context);
        throw err;
      }
      const backoff = Math.min(1000 * 2 ** (attempt - 1), 16000);
      const jitter = Math.random() * 500;
      await sleep(backoff + jitter);
    }
  }

  await escalate(errors.at(-1)!, errors, context);
  throw errors.at(-1)!;
}

async function escalate(err: Error, history: Error[], ctx: Context) {
  await slack.postMessage({
    channel: ctx.user.slack_dm_channel,
    text: `*${ctx.name} failed after ${history.length} attempts.*\n` +
          `Last error: ${err.message}\n` +
          `<${ctx.manualLink}|Retry manually> · <${UPSTREAM_STATUS_URL}|Check upstream status>`,
  });
}
```

That wrapper is the difference between an agent that's trustworthy and one that's noisy. Wrap every external call.

## What this prevents

Autonomous Recovery defends against the [Slow Chatbot](/glossary/#slow-chatbot) anti-pattern from the failure side. A slow chatbot pages a human for every action; an agent without recovery logic pages a human for every transient error. Both train the human to drown in noise or stop paying attention. Recovery logic — retry quietly, escalate cleanly — is what lets the agent be both autonomous and trusted.

It defends against [Ship and Forget](/glossary/#ship-and-forget) too. An integration that silently fails on every transient error looks "broken" to the user even when the underlying service is fine. A team that hasn't built recovery logic eventually gets a reputation for an unreliable integration — and that reputation outlasts the actual reliability problem long after it's fixed.

It raises [tool success rate](/glossary/#tool-success-rate) directly. Many tool calls that return errors today would succeed on a single retry. Wrapping the call in recovery logic converts those failures into successes without any change to the tool itself.

## The smallest experiment

Pick the single most-called external API in your agent product and wrap every call in a retry-with-backoff helper. Set the retry budget to 5 attempts. Distinguish transient (5xx, 429, timeout) from permanent (4xx) errors. Don't alert on individual failures — only on sustained error rates. When the retry budget is exhausted, escalate to the human's [visible output](/principles/visible-outputs/) channel with the operation name, the retry history, and a manual override link. Watch the tool success rate over the next week. Lift is usually 5–15 points on any product whose error rate is dominated by transient failures.

## Related principles

- [Visible Outputs](/principles/visible-outputs/) — when recovery fails and escalates, the escalation is itself a visible output. Land it in the same channel as every other agent action.
- [Prep Gates](/principles/prep-gates/) — many "the agent kept failing" cases are stale-state cases that prep would have caught at session start. Prep prevents; recovery handles what prep couldn't predict.

---

*Part of [Agents First](/) — a design framework for products built for both humans and AI agents.*
