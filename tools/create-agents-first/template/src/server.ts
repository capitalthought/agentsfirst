#!/usr/bin/env node
// {{PROJECT_NAME}} — MCP server entrypoint.
//
// Interface First: the tool definitions below ARE the product. Design these
// before any human UI. Each tool has a verb-first name, Zod-typed params,
// and structured error returns.
//
// Before changing any tool here, read AGENTS.md — those rules govern what
// agents may do with these tools.
//
// See https://agentsfirst.dev/principles/interface-first/

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { runPrep } from './prep.js';
import { addTask, listTasks, STATE_SCHEMA_VERSION } from './state.js';
import { withRetry, escalate } from './recovery.js';
import { gatherOverview } from './overview.js';

const server = new McpServer({
  name: '{{PROJECT_NAME}}',
  version: '0.1.0',
});

// ---------------------------------------------------------------------------
// {{PROJECT_NAME}}_prep — Prep Gate (Principle 3)
//
// Agents MUST call this at the start of every session. See AGENTS.md.
// Returns { ok, checks: [...] }. If ok=false, the agent should stop.
// ---------------------------------------------------------------------------
server.registerTool(
  '{{PROJECT_NAME}}_prep',
  {
    title: 'Prep gate — validate env, state, and health',
    description:
      'Pre-flight checks for {{PROJECT_NAME}}. Call this at the start of every session before any other tool. Returns ok=true when all checks pass; otherwise returns the failed checks with remediation hints. See AGENTS.md.',
    inputSchema: {},
  },
  async () => {
    const result = await runPrep();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
      isError: !result.ok,
    };
  },
);

// ---------------------------------------------------------------------------
// example_list — read-only, safe to call without confirmation.
// Replace with your real domain `list_*` tool.
// ---------------------------------------------------------------------------
server.registerTool(
  'example_list',
  {
    title: 'List tasks',
    description:
      'Returns all tasks in {{PROJECT_NAME}} state. Read-only. Call before example_create if you need a fresh task_id.',
    inputSchema: {},
  },
  async () => {
    const tasks = listTasks();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { schema_version: STATE_SCHEMA_VERSION, tasks },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// example_create — verb-first, write-style tool.
// Replace with your real domain write tool. Note the structured-error shape
// and the Visible Outputs TODO.
// ---------------------------------------------------------------------------
server.registerTool(
  'example_create',
  {
    title: 'Create a task',
    description:
      'Creates a new task. Title is required. Returns the created task with its task_id. See AGENTS.md for permission rules — only call when the user explicitly asked for a write.',
    inputSchema: {
      title: z
        .string()
        .min(1)
        .max(280)
        .describe('Human-readable task title. Required.'),
    },
  },
  async ({ title }) => {
    try {
      const task = await withRetry(() => Promise.resolve(addTask({ title })));

      // Visible Outputs (Principle 5): post a human-readable artifact to
      // wherever your humans actually look — task manager, Slack, email.
      // TODO: ship to Slack/email/task manager
      // e.g. await postToSlack(`{{PROJECT_NAME}}: created task "${task.title}" (${task.task_id})`);

      return {
        content: [{ type: 'text', text: JSON.stringify(task, null, 2) }],
      };
    } catch (err) {
      escalate({
        what: 'example_create',
        attempted: 'addTask with retry',
        manualAction:
          'inspect MCP server logs; verify state.ts backing store is reachable',
        cause: err,
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'internal',
              suggestion: 'check server logs and retry; if it persists, escalate',
              detail: (err as Error).message,
            }),
          },
        ],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// overview — Inspectable State (Principle 9). Read-only operational snapshot.
//
// Operator agents call this to ask "what is the state of the work?". Returns
// counts by status + recent tails + a small health block. No input schema —
// the answer has no parameters. Never writes. See AGENTS.md for the rule
// that distinguishes overview (system state for agents) from {{PROJECT_NAME}}_prep
// (system readiness check at session start).
//
// Defends against the Black Box Server anti-pattern.
// ---------------------------------------------------------------------------
server.registerTool(
  'overview',
  {
    title: 'Operational snapshot — what is the state of the work?',
    description:
      'Read-only structured snapshot of {{PROJECT_NAME}} state — inventory by status, recent activity, health. Call when you need to know "what is happening?". Never writes. See https://agentsfirst.dev/principles/inspectable-state/',
    inputSchema: {},
  },
  async () => {
    const snap = gatherOverview();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(snap, null, 2),
        },
      ],
      isError: !snap.health.state_readable,
    };
  },
);

// ---------------------------------------------------------------------------
// Boot — stdio transport so any MCP-aware client can connect.
// ---------------------------------------------------------------------------
const transport = new StdioServerTransport();
await server.connect(transport);

// stderr is safe to log to (stdout is the MCP wire).
process.stderr.write(
  `{{PROJECT_NAME}} MCP server connected (state schema v${STATE_SCHEMA_VERSION})\n`,
);
