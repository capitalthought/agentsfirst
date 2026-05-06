---
title: "Perspective Dispatch"
description: "Dispatch multiple constrained perspectives — security, UX, accessibility, performance — against the same artifact. Each persona has a focus area; findings outside it get discarded."
image: /og-image.png
author: Joshua Baer
---

# Perspective Dispatch

For complex reviews, dispatch multiple constrained perspectives against the same artifact. Security reviewer in security mode. UX reviewer in UX mode. New-user persona in beginner mode. Performance reviewer in performance mode. Each has a defined focus area and a severity scale. Findings outside the focus get discarded.

Structured code review with formal roles, run by agents in parallel against a design doc, a pull request, a marketing page, or any artifact that benefits from multi-angle scrutiny. The mechanism is simple: write a system prompt for each perspective ("You are a security reviewer. Focus only on injection attacks, auth bypass, secrets handling, and trust boundary violations. Discard everything else."). Run all the perspectives against the same artifact. Aggregate the findings.

The gain is depth. A security reviewer pinned to security catches injection patterns a generalist skims past. A brand-new-user persona catches onboarding friction nobody on the team can see anymore because they've all been using the product for a year. A performance reviewer catches the N+1 query nobody else notices because they were thinking about correctness, not throughput. The constraint — "stay in your lane" — is what makes each perspective sharper.

The novelty isn't the practice. Structured code review with security, performance, and accessibility passes has existed for decades. The novelty is making it cheap enough to do on every artifact, not only on the ones important enough to schedule a committee for. Five perspectives running in parallel against a design doc costs cents and finishes in minutes. The same review with five humans takes a week of calendar time and rarely happens.

## Why it matters

Single-perspective review misses things outside the reviewer's frame. A staff engineer reviewing a PR thinks about correctness, architecture, code style — and misses the accessibility regression because accessibility wasn't in their head. A designer reviewing a flow thinks about hierarchy and brand consistency — and misses the API rate-limit issue because backend isn't in their frame. The fix isn't to ask each reviewer to think about everything. It's to dispatch multiple reviewers, each constrained to one frame, and aggregate.

When the reviewer is human, this is hard to operationalize. Calendars don't align. Reviewers comment on each other's findings instead of staying in their lane. The review takes a week and arrives after the PR shipped. In practice, most artifacts get one perspective from one person and ship.

When the reviewers are agents, the constraints flip. Five parallel reviews finish in minutes. Each perspective stays disciplined because its system prompt defines its scope. Findings are normalized to a common severity scale (Critical / High / Medium / Low) and aggregated automatically. The author gets a single report with security findings, UX findings, performance findings, accessibility findings, and new-user friction findings — all from the same artifact, all surfaced before it ships.

Second reason it matters: the formal severity scale forces calibration. A reviewer that can flag everything as Critical loses its signal. Forcing the same scale across artifacts and perspectives creates pressure to reserve Critical for things that actually block ship. The output becomes actionable instead of overwhelming.

## How to apply it

1. **Define each perspective with a constrained system prompt.** Name the focus area. List what's in scope. List what's out of scope. Force the agent to discard out-of-scope findings instead of mentioning them.

2. **Use a fixed severity scale across perspectives.** Critical (block ship), High (fix before merge), Medium (fix in the next pass), Low (TODO/nice-to-have). Calibrate once and apply everywhere.

3. **Run perspectives in parallel.** They're independent. Don't sequence them. Five concurrent reviews against the same artifact finish in roughly the time of the slowest one.

4. **Standardize the output format.** Each finding gets a severity, a file/line citation, a description, and a recommendation. A common format makes aggregation trivial:

   ```
   - **[Critical]** `auth.ts:42` -- Token comparison uses `==` instead of constant-time compare.
     **Recommendation:** Use `crypto.timingSafeEqual` to prevent timing attacks.
   ```

5. **Aggregate, deduplicate, and present in one report.** A single report with sections per perspective, sorted by severity, makes the review actionable. Don't make the author read five separate reports.

6. **Calibrate against false positives.** Agent reviewers run hot — around 50% false positive rate on well-maintained codebases is typical. Treat findings as hypotheses to verify, not work items to auto-fix. The author is the final filter.

7. **Add user-persona perspectives, not just technical ones.** A "first-time user" persona catches onboarding friction no engineering review surfaces. An "accessibility user" persona (VoiceOver-only navigation, dynamic-type sizing, reduced motion) catches issues that don't appear in any code-quality scan.

A minimal dispatch pattern:

```typescript
const perspectives = [
  { name: "security",      focus: "auth, injection, secrets, trust boundaries" },
  { name: "performance",   focus: "complexity, queries, allocations, caching" },
  { name: "accessibility", focus: "VoiceOver, dynamic type, contrast, motion" },
  { name: "new-user",      focus: "onboarding, defaults, error messages" },
  { name: "staff",         focus: "architecture, contracts, abstractions" },
];

const findings = await Promise.all(
  perspectives.map(p => reviewer.review({
    artifact,
    system: `You are a ${p.name} reviewer. Focus exclusively on ${p.focus}. Discard everything outside that focus. Use the standard severity scale.`,
  }))
);

const report = aggregate(findings);
```

That report becomes a [visible output](/principles/visible-outputs/) — landing in the PR as a comment, in the design doc as a review, in Slack as a thread.

## What this prevents

Perspective Dispatch defends against the failure mode where one reviewer (human or agent) misses things outside their frame. It's the inverse of a single generalist sweep — each constrained perspective is sharper than a generalist asked to consider everything at once.

It defends against [Ship and Forget](/glossary/#ship-and-forget) too. When perspective dispatch runs on every PR or every design doc, regressions across any of the perspectives become visible immediately. Accessibility regressions don't wait for an annual audit. Performance regressions don't wait for a customer to complain. Security regressions don't wait for a pen test.

It complements [Multi-Model Verification](/principles/multi-model-verification/): verification is "different models, same prompt"; dispatch is "different prompts (perspectives), often the same model." Combine them for the highest-stakes artifacts — each perspective's findings get verified across models, only consensus findings get treated as Critical.

## The smallest experiment

Pick a single PR or design doc that's about to merge, and run three perspective reviews against it before it lands — security, accessibility, and a new-user persona. Use the same agent runtime you already have; the only difference is the system prompt. Aggregate the findings into one report. Read it. Note which findings made you change the artifact and which were noise. That signal tells you whether the perspective set is right and where to calibrate. Expand from there to a standard set that runs on every change.

## Related principles

- [Multi-Model Verification](/principles/multi-model-verification/) — perspective dispatch is the prompt-level cousin. Use them together for high-stakes reviews: many perspectives, each verified across models.
- [Visible Outputs](/principles/visible-outputs/) — review findings are only useful if the author sees them in the workflow they're already in. Land the report in the PR or the doc, not in a separate dashboard.

---

*Part of [Agents First](/) — a design framework for products built for both humans and AI agents.*
