// Autonomous Recovery — retry transient failures before paging a human.
//
// An agent that pages a human for a transient API timeout is a bad agent.
// Use withRetry() for any I/O that can fail transiently. Use escalate()
// when self-healing has already failed and a human needs to act.
//
// See https://agentsfirst.dev/principles/autonomous-recovery/

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Predicate: should this error trigger a retry? Default: yes. */
  shouldRetry?: (err: unknown) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 4;
  const baseDelayMs = opts.baseDelayMs ?? 250;
  const maxDelayMs = opts.maxDelayMs ?? 8_000;
  const shouldRetry = opts.shouldRetry ?? (() => true);

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts || !shouldRetry(err)) break;
      const expBackoff = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const jitter = Math.random() * expBackoff * 0.25;
      await new Promise((r) => setTimeout(r, expBackoff + jitter));
    }
  }
  throw lastErr;
}

export interface EscalateInput {
  /** What was the agent trying to do? */
  what: string;
  /** What did the agent already try? */
  attempted: string;
  /** A direct link or instruction the human can follow to resolve. */
  manualAction: string;
  /** Optional underlying error. */
  cause?: unknown;
}

/**
 * Log a structured "self-healing failed" message with a clear next-action.
 * Wire this to your real alerting (PagerDuty, Slack, email) — stderr is the
 * default sink so the message is at least visible in MCP server logs.
 */
export function escalate(input: EscalateInput): void {
  const payload = {
    level: 'error',
    msg: 'self_healing_failed',
    what: input.what,
    attempted: input.attempted,
    manual_action: input.manualAction,
    cause:
      input.cause instanceof Error
        ? { name: input.cause.name, message: input.cause.message }
        : input.cause,
    ts: new Date().toISOString(),
  };
  // TODO: ship to PagerDuty / Slack / email — stderr is just the floor.
  process.stderr.write(JSON.stringify(payload) + '\n');
}
