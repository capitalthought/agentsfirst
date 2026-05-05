// Typed State — single source of truth for {{PROJECT_NAME}}'s persistent data.
//
// All agent-mutable state flows through this module. Each module owns its slice;
// callers never reach past the exported functions.
//
// See https://agentsfirst.dev/principles/typed-state/

import { z } from 'zod';

/**
 * Bump this when the schema changes in a backward-incompatible way and write
 * a migration. Keep migrations alongside this file.
 */
export const STATE_SCHEMA_VERSION = 1 as const;

export const TaskStatus = z.enum(['todo', 'in_progress', 'done']);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const Task = z.object({
  task_id: z.string().min(1),
  title: z.string().min(1).max(280),
  status: TaskStatus,
  created_at: z.string().datetime(),
});
export type Task = z.infer<typeof Task>;

// In-memory store. Swap for SQLite / Postgres / KV when you outgrow this.
// The interface (addTask / listTasks / getTask) stays the same — your tools
// in server.ts shouldn't know or care that the backing store changed.
const tasks = new Map<string, Task>();

export function addTask(input: { title: string }): Task {
  const task: Task = Task.parse({
    task_id: `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    title: input.title,
    status: 'todo',
    created_at: new Date().toISOString(),
  });
  tasks.set(task.task_id, task);
  return task;
}

export function listTasks(): Task[] {
  return Array.from(tasks.values()).sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );
}

export function getTask(task_id: string): Task | undefined {
  return tasks.get(task_id);
}
