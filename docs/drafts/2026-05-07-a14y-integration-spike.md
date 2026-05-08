# a14y integration spike — findings

**Source:** /agentsfirst-check 2026-05-07 recommendation [3e5abed1]
**Goal:** decide whether `score_website` should include a14y's 38-check score alongside our 5-dimension framework score
**Status:** ✅ spike successful — feasibility confirmed; wiring deferred until [ccd0c45e] outreach lands

---

## Smoke test

```bash
npx -y a14y check https://agentsfirst.dev --output json
```

**Result:** clean JSON output. agentsfirst.dev scored **69/100** on a14y's v0.2.0 scorecard (22 passed, 10 failed, 6 N/A out of 38 checks).

The two scorers gave different numbers on the same target:
- Agents First (our hosted scorer at agentsfirst.dev/mcp): **75/100, Level 3**
- a14y v0.2.0: **69/100**

Different rubrics. Both scoring the same surface. This is exactly what the "complementary layers" framing in the v0.8 thesis predicts.

## Output shape

```json
{
  "url": "https://agentsfirst.dev",
  "scorecardVersion": "0.2.0",
  "siteChecks": [/* 14 site-level checks */],
  "pages": [{
    "url": "...",
    "checks": [/* 24 page-level checks */],
    "summary": { "passed": ..., "failed": ..., "score": ... }
  }],
  "summary": {
    "passed": 22, "failed": 10, "warned": 0, "errored": 0, "na": 6,
    "total": 38, "applicable": 32, "score": 69
  }
}
```

Each check has: `id`, `name`, `group`, `scope`, `status` (pass/fail/warned/errored/na), `message`, `docsUrl`. The `id` field uses dotted namespacing (e.g. `http.status-200`, `markdown.canonical-header`, `agents-md.has-min-sections`) — perfect for cross-referencing in a combined report.

## Integration paths

| Path | Where | Complexity | Tradeoff |
|---|---|---|---|
| **A. Local subprocess** | `tools/agentsfirst-mcp/src/score-website.ts` (npm) | ~half-day | Works only on the npx version (`@capitalthought/agentsfirst-mcp`). The hosted Worker can't shell out — V8 isolates have no exec. |
| **B. a14y as Worker import** | `tools/agentsfirst-mcp-worker/src/score.ts` | ~1 day | a14y is published as ESM JS. *If* its dependencies are V8-compatible (no node:fs, no child_process), bundle it directly into the Worker. Risk: HTML parsing libs often pull node:Buffer / node:stream. |
| **C. Hosted a14y endpoint** | Coordinate with Timothy Jordan | depends | If Timothy stands up `https://a14y.dev/api/check?url=...`, the Worker can fetch it. Cleanest separation; but requires their cooperation, ongoing uptime, and CORS. |

## Recommendation

**Wait for [ccd0c45e] outreach.** Path C is best by far if Timothy is amenable — both projects keep ownership of their own scorers, both get traffic from the integration, neither carries the maintenance burden of the other's checks. Path A is a viable fallback for the local CLI, and we can ship it independently of the hosted scorer when the time is right.

**What to ask Timothy in the DM:**
1. Are you open to a hosted JSON endpoint at `a14y.dev/api/check` (or similar)?
2. If yes, what's the rate-limit posture? We'd be calling it from our Cloudflare Worker for users who run `score_website` against agentsfirst.dev/mcp.
3. If no, would bundling the a14y npm into our Worker run afoul of any technical constraint you're aware of?

## What to NOT do

- Don't quietly fork a14y into our codebase. The spec is *theirs*; forking erodes their authority and ours. Mutual citation only.
- Don't reimplement their 38 checks ourselves. Even if we could, it would be wasteful and would split the conversation.
- Don't ship a "score_with_a14y" tool until the outreach lands. Cold-launching an integration without a heads-up is exactly the kind of move that turns a potential ally adversarial.

---

## File deltas if/when we wire Path A

```ts
// tools/agentsfirst-mcp/src/score-website.ts
import { execSync } from 'node:child_process';

interface A14yResult {
  summary: { score: number; passed: number; failed: number; total: number };
  siteChecks: Array<{ id: string; status: 'pass' | 'fail' | 'na'; message?: string }>;
  pages: Array<{ checks: Array<{ id: string; status: string; message?: string }> }>;
}

function runA14y(url: string): A14yResult | null {
  try {
    const out = execSync(`npx -y a14y check ${shellEscape(url)} --output json`, {
      encoding: 'utf8',
      timeout: 30_000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return JSON.parse(out);
  } catch {
    return null;  // a14y not available or timed out — silent fallback
  }
}

// In scoreWebsite, after our own score:
const a14y = runA14y(url);
if (a14y) {
  result.companion_scores = {
    a14y_v020: {
      score: a14y.summary.score,
      passed: a14y.summary.passed,
      failed: a14y.summary.failed,
      total: a14y.summary.total,
    },
  };
}
```

Effort: ~30 min for the wiring + ~30 min for the test fixture + ~1h to add this companion score to the report renderer at `tools/agentsfirst-mcp/src/server.ts`.
