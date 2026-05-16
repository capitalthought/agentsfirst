// state-migrations.ts — schema migrations for state/radar-state.json.
//
// Design contract: docs/plans/2026-05-15-agentsfirst-radar-design.md §5.1
// "Rollback story" — every migration must include both up() and down() where
// feasible; destructive normalizations must be tagged `irreversible: true`.
//
// At v1 the schema is brand-new — MIGRATIONS is intentionally empty. This
// module exists so the framework is in place the moment a v1 → v2 migration
// is needed, and so RUNBOOK.md's rollback procedure has a real entry point
// instead of ad-hoc one-off scripts.
//
// Separation of concerns: this module does NOT zod-validate. Callers
// (state.ts readState, fanout boot) run validation after migrate() returns.
// Migrations may temporarily produce intermediate shapes that don't validate
// cleanly until the whole chain completes; that's by design.

import { RadarState } from './state.js';

export interface Migration {
  from_version: number;
  to_version: number;
  irreversible: boolean;
  description: string;
  up: (state: unknown) => RadarState | unknown;
  down?: (state: unknown) => unknown;
}

export const CURRENT_SCHEMA_VERSION = 1;

// EXAMPLE — kept here as a template for the first real migration. Once a real
// v1 → v2 migration is added, delete this comment block.
//
// {
//   from_version: 1,
//   to_version: 2,
//   irreversible: false,
//   description: 'Add `cluster_id` to Recommendation for cross-rec grouping',
//   up: (raw: any) => {
//     return {
//       ...raw,
//       schema_version: 2,
//       recommendations: Object.fromEntries(
//         Object.entries(raw.recommendations).map(([id, rec]: any) => [
//           id,
//           { ...rec, cluster_id: rec.parent_event_id ?? null }
//         ])
//       ),
//     };
//   },
//   down: (raw: any) => {
//     return {
//       ...raw,
//       schema_version: 1,
//       recommendations: Object.fromEntries(
//         Object.entries(raw.recommendations).map(([id, rec]: any) => {
//           const { cluster_id, ...rest } = rec as any;
//           return [id, rest];
//         })
//       ),
//     };
//   },
// },

export const MIGRATIONS: Migration[] = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function readSchemaVersion(raw: Record<string, unknown>): number {
  const v = raw['schema_version'];
  if (v === undefined || v === null) {
    // Cold-start convenience: a state file that pre-dates the schema_version
    // field is assumed to be at v1 (the first version that introduced it).
    return 1;
  }
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) {
    throw new Error(
      `migrate: state.schema_version is not a positive integer (got ${JSON.stringify(v)})`,
    );
  }
  return v;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Apply pending migrations to bring `raw` state up to CURRENT_SCHEMA_VERSION.
 *
 * Throws if raw.schema_version is higher than CURRENT_SCHEMA_VERSION (fail-
 * closed per design §5.1 — we won't downgrade a forward-incompatible file
 * we don't understand).
 *
 * Returns the migrated state (still untyped — caller runs zod validation).
 */
export function migrate(raw: unknown): unknown {
  if (!isPlainObject(raw)) {
    throw new Error('migrate: state is not an object');
  }

  const current = readSchemaVersion(raw);

  if (current > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `migrate: state schema_version=${current} is higher than this binary supports (${CURRENT_SCHEMA_VERSION}). Refusing to run on a forward-incompatible state — fail-closed per design §5.1.`,
    );
  }

  if (current === CURRENT_SCHEMA_VERSION) {
    return raw;
  }

  // Walk pending migrations in ascending order. Each `up()` must bump
  // schema_version itself; we re-read it after each step so a buggy migration
  // that forgets to bump fails loud instead of looping.
  const pending = MIGRATIONS.slice().sort((a, b) => a.from_version - b.from_version);

  let state: unknown = raw;
  let cursor = current;

  for (const m of pending) {
    if (m.from_version < cursor) continue;
    if (m.from_version >= CURRENT_SCHEMA_VERSION) break;
    if (m.from_version !== cursor) {
      throw new Error(
        `migrate: gap in migration chain — at v${cursor} but next migration starts at v${m.from_version}`,
      );
    }
    state = m.up(state);
    if (!isPlainObject(state)) {
      throw new Error(
        `migrate: migration ${m.from_version}->${m.to_version} returned a non-object`,
      );
    }
    const next = readSchemaVersion(state);
    if (next !== m.to_version) {
      throw new Error(
        `migrate: migration ${m.from_version}->${m.to_version} did not bump schema_version (got ${next})`,
      );
    }
    cursor = next;
  }

  if (cursor !== CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `migrate: could not reach v${CURRENT_SCHEMA_VERSION} from v${current} — stuck at v${cursor}`,
    );
  }

  return state;
}

/**
 * Reverse-migrate from `current` back to `targetVersion`. Throws if any
 * migration in the chain is `irreversible`. Used by the RUNBOOK.md
 * documented rollback procedure.
 *
 * Like migrate(), this does NOT zod-validate; the caller is expected to
 * validate against the older schema (typically by checking out the prior
 * binary and running its readState).
 */
export function rollback(current: unknown, targetVersion: number): unknown {
  if (!isPlainObject(current)) {
    throw new Error('rollback: state is not an object');
  }
  if (!Number.isInteger(targetVersion) || targetVersion < 1) {
    throw new Error(
      `rollback: targetVersion must be a positive integer (got ${JSON.stringify(targetVersion)})`,
    );
  }

  const startVersion = readSchemaVersion(current);

  if (targetVersion > startVersion) {
    throw new Error(
      `rollback: targetVersion=${targetVersion} is higher than current=${startVersion}; use migrate() to move forward`,
    );
  }
  if (targetVersion === startVersion) {
    return current;
  }

  // Walk migrations in descending order from startVersion down to
  // targetVersion. Apply each migration's down() in reverse.
  const reversed = MIGRATIONS.slice().sort((a, b) => b.to_version - a.to_version);

  let state: unknown = current;
  let cursor = startVersion;

  for (const m of reversed) {
    if (m.to_version > cursor) continue;
    if (m.to_version <= targetVersion) break;
    if (m.to_version !== cursor) {
      throw new Error(
        `rollback: gap in migration chain — at v${cursor} but next reverse migration targets v${m.to_version}`,
      );
    }
    if (m.irreversible) {
      throw new Error(
        `rollback: migration ${m.from_version}->${m.to_version} is irreversible ("${m.description}"); cannot roll back below v${cursor}`,
      );
    }
    if (!m.down) {
      throw new Error(
        `rollback: migration ${m.from_version}->${m.to_version} has no down() defined`,
      );
    }
    state = m.down(state);
    if (!isPlainObject(state)) {
      throw new Error(
        `rollback: down() for ${m.from_version}->${m.to_version} returned a non-object`,
      );
    }
    const next = readSchemaVersion(state);
    if (next !== m.from_version) {
      throw new Error(
        `rollback: down() for ${m.from_version}->${m.to_version} did not set schema_version back to ${m.from_version} (got ${next})`,
      );
    }
    cursor = next;
  }

  if (cursor !== targetVersion) {
    throw new Error(
      `rollback: could not reach v${targetVersion} from v${startVersion} — stuck at v${cursor}`,
    );
  }

  return state;
}
