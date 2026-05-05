---
title: "Multi-Model Verification | Agents First"
description: "For high-stakes decisions, fan out to three models in parallel and trust only what at least two agree on. Single-model confidence is a coin flip."
image: /og-image.png
author: Joshua Baer
---

# Multi-Model Verification

For high-stakes decisions — deploys, security reviews, billing changes, anything that costs money or affects users — fan the prompt out to three models in parallel and trust only what at least two of them agree on. A single model's confident "looks safe" is a coin flip dressed up as confidence.

The intuition is borrowed from distributed systems. A single node's claim about the world is a hypothesis. Multiple independent nodes agreeing about the same fact is signal. The same logic applies to LLMs: any individual model can be wrong, hallucinate a finding, or miss something obvious. Three independent models — different vendors, different training data, different failure modes — flagging the same issue is almost certainly real. One model alone flagging it is worth investigating, but not worth acting on.

The pattern is straightforward. For a decision that matters, build the prompt once, send it to GPT, Claude, and Gemini in parallel, then run a fourth model (a cheap one is fine) over the three responses to identify findings that two or more models share. That deduplicated set of consensus findings is what you act on. The rest gets logged for review but not auto-applied.

This is not about general agent behavior. Most tool calls don't need verification — they're cheap, reversible, and well-typed. Multi-model verification is a tool you reach for selectively, when the cost of a wrong action is high enough to justify the latency and the dollar cost of the second and third opinions.

## Why it matters

LLMs project confidence regardless of whether they're right. A model will tell you a code change is safe in the same calm tone whether the change is a typo fix or a SQL injection waiting to happen. Calibration is poor in single-model output, and it gets worse on the kinds of decisions that matter most — judgment calls about security, cost, blast radius, and edge cases.

Single-model trust on those decisions has predictable failure modes. The model misses the auth bypass because the auth bypass looks like normal code. It approves the migration because the migration's dangerous side effects don't appear in the diff it was shown. It clears the billing change because it didn't catch that the proration logic doesn't handle a leap year. None of these are the model being incompetent. They're the model being a single point of failure on decisions where a single point of failure isn't acceptable.

Independent agreement is the cheapest fix. The reason it works is not that any one model is smarter — it's that different models have different blind spots. A finding that GPT, Claude, and Gemini all flag is one that survived three different training distributions, three different alignment regimes, three different scratchpads. That's stronger than any single model's opinion, no matter how confident.

The opposite failure mode — being suspicious of every model output — is also expensive. Verifying every tool call would push session costs into territory that breaks the economics of agent-driven workflows. The discipline is knowing which decisions deserve verification and which don't.

## How to apply it

1. **Identify the decisions that justify the cost.** Deploy approval. Security review of new code. Billing or pricing changes. Sending mass communications to users. Schema migrations. Anything that's expensive to undo or affects multiple people. Most agent actions aren't on this list.

2. **Send the same prompt to three independent models.** Different vendors are best — GPT-4o or GPT-5, Claude, Gemini. If budget is tight, two models from different vendors is meaningfully better than one. Same vendor, different sizes (e.g., Opus + Sonnet) is the weakest version because the failure modes correlate.

3. **Run findings through a deduplication step.** Use a small, cheap model (Haiku, Flash, GPT-4o-mini) to read the three sets of findings and group them by underlying issue. Path normalization, severity normalization, and synonym handling matter — the same finding can show up with different phrasing across models.

4. **Sort the deduplicated findings into three buckets.** Consensus (all three models agree — act on these). Disputed (two of three agree — review these manually before acting). Single-model (only one model raised it — log for human review, don't auto-act).

5. **Surface the findings in the human's existing workflow** — the same [visible output](/principles/visible-outputs/) channel the rest of the agent's work uses. Show the consensus findings prominently. Show the disputed ones with the disagreement called out. Don't bury the single-model ones, but make their lower confidence explicit.

6. **Watch the costs.** A single three-model verification at current pricing runs roughly $0.05–$0.50 depending on prompt size and model selection. That's nothing for "should we deploy this migration?" — it's prohibitive for "should we create this calendar event?" If you're verifying every tool call in a typical session, you'll spend $1–$10 per session in inference. Apply selectively.

A minimal verification flow in pseudocode:

```typescript
async function verifyHighStakesDecision(prompt) {
  const [gpt, claude, gemini] = await Promise.all([
    openai.complete(prompt),
    anthropic.complete(prompt),
    google.complete(prompt),
  ]);

  const dedup = await haiku.complete({
    system: "Group findings by underlying issue. Return JSON with consensus, disputed, single buckets.",
    user: JSON.stringify({ gpt, claude, gemini }),
  });

  return JSON.parse(dedup);
}
```

The deploy gate, the security check, the billing approval — those flows wrap this function. Most of the agent's other work doesn't.

## What this prevents

Multi-Model Verification defends directly against [Single-Model Trust](/glossary/#single-model-trust) — the failure mode where one LLM's "looks safe" becomes the basis for a decision that costs money or affects users. The whole point of fanning out is to refuse to act on a single model's confidence on the decisions where confidence matters most.

It indirectly defends against [Ship and Forget](/glossary/#ship-and-forget) by surfacing drift. If a deploy starts producing different findings across models — three months ago they all agreed, now Claude and GPT diverge from Gemini — that's a signal something has shifted. Either the codebase has gotten weirder, or one of the models has changed in a way you should know about. A single-model pipeline can't see that. A multi-model pipeline lights it up.

It pairs naturally with [Perspective Dispatch](/principles/perspective-dispatch/) — verification is "different models, same prompt"; dispatch is "different prompts (perspectives), often the same model." Combine them on the highest-stakes reviews: each persona's findings get verified across models, and only consensus findings move forward.

## The smallest experiment

If you only do one thing this week, do this: pick the single highest-stakes decision an agent in your product makes — usually a deploy, a migration, or a payment-touching action — and add a three-model verification step before it executes. Use whichever three model APIs you already have keys for. Add a Haiku-sized dedup step. Surface the consensus findings as a visible output to the human approver. Measure two things: the rate of consensus findings the human ends up agreeing with (signal quality) and the cost per verification (economics). Both will tell you fast whether to expand the pattern to other decisions.

## Related principles

- [Perspective Dispatch](/principles/perspective-dispatch/) — different perspectives across one model is complementary to the same prompt across multiple models. The strongest reviews use both.
- [Visible Outputs](/principles/visible-outputs/) — verification findings are useless if the human doesn't see them in their workflow. Land them in the same place as every other agent action.

---

*Part of [Agents First](/) — a design framework for products built for both humans and AI agents.*
