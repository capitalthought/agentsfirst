// Inspectable State (Principle 9) — operational snapshot for {{PROJECT_NAME}}.
//
// Where prep answers "is the system READY to do work?", overview answers
// "what is the STATE of the work?" — queue depth, throughput, recent
// activity, trends. Read-only; callable from any MCP client (Claude Code,
// an external operator agent, a CLI script).
//
// Defends against the Black Box Server anti-pattern: an agent surface
// where the only way to ask "what's happening?" is to scrape the database
// or grep the logs. Ship one tool, not many. No input schema (or a tiny
// optional one). Return rolled-up rates AND recent tails — counts alone
// are dashboards, tails alone are logs; the combination is what lets an
// operator decide whether to act.
//
// See https://agentsfirst.dev/principles/inspectable-state/

import { listTasks, STATE_SCHEMA_VERSION } from './state.js';

export interface OverviewSnapshot {
  generated_at: string;
  schema_version: number;
  inventory: Record<string, number>;
  recent_activity: Array<{
    task_id: string;
    title: string;
    created_at: string;
  }>;
  health: {
    state_readable: boolean;
    last_error: string | null;
  };
}

const RECENT_WINDOW = 10;

/**
 * Gather the operational snapshot. Reads-only — never writes. Returns
 * the same shape every call so consumers can poll without a schema lookup.
 *
 * Replace the example tasks with your domain entities. The pattern is the
 * same: counts by status + recent tails + a small health block.
 */
export function gatherOverview(): OverviewSnapshot {
  const generated_at = new Date().toISOString();

  let tasks: ReturnType<typeof listTasks> = [];
  let stateReadable = true;
  let lastError: string | null = null;

  try {
    tasks = listTasks();
  } catch (err) {
    stateReadable = false;
    lastError = (err as Error).message;
  }

  const inventory = tasks.reduce<Record<string, number>>((acc, t) => {
    const status = (t as { status?: string }).status ?? 'unknown';
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  // Add a "total" key so consumers can read a single number without summing.
  inventory.total = tasks.length;

  // Sort by created_at desc; take the most recent N.
  const sorted = [...tasks].sort((a, b) => {
    const at = (a as { created_at?: string }).created_at ?? '';
    const bt = (b as { created_at?: string }).created_at ?? '';
    return bt.localeCompare(at);
  });
  const recent_activity = sorted.slice(0, RECENT_WINDOW).map((t) => ({
    task_id: (t as { task_id: string }).task_id,
    title: (t as { title: string }).title,
    created_at: (t as { created_at: string }).created_at,
  }));

  return {
    generated_at,
    schema_version: STATE_SCHEMA_VERSION,
    inventory,
    recent_activity,
    health: {
      state_readable: stateReadable,
      last_error: lastError,
    },
  };
}
