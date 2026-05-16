// imsg-listener.ts — always-on daemon that watches Josh's iMessage 1:1 with
// mikey@capitalfactory.com for radar replies. Parses via the actuator grammar
// (AGENTS.md "iMessage HITL grammar"), appends mutations to state/mutations.jsonl,
// and sends clarifying replies for unparsed / ambiguous text.
//
// Runs as a LaunchAgent on joshhome — separate entry point from radar.ts.
// The radar cron is the sole writer of state/radar-state.json; this daemon is
// append-only on state/mutations.jsonl (per design §3 concurrency note).
//
// Design contract: docs/plans/2026-05-15-agentsfirst-radar-design.md §3 reply path
// Grammar contract: tools/agentsfirst-radar/AGENTS.md "iMessage HITL grammar"
//
// Architecture:
//   - Polls chat.db every POLL_INTERVAL_MS (default 10s). No FSEvents on chat.db
//     because WAL changes are hard to subscribe to without a native helper.
//   - LRU-capped guid cache at ~/.cache/agentsfirst-radar/seen-imsg-guids.json
//     prevents reprocessing replies after a daemon restart.
//   - Soft shutdown: SIGINT/SIGTERM finishes the current poll, then exits.

import { promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { homedir } from 'node:os';

import {
  readState,
  type Recommendation,
} from '../src/state.js';
import {
  parseReply,
  appendMutation,
  appendUnparsed,
  type MutationEvent,
  type UnparsedRow,
  type Verb,
} from '../src/actuator.js';
import {
  sendImsg,
  readRecentReplies,
  getMikeyChatId,
  type ImsgReply,
} from '../src/imsg.js';

// ─── Constants / config ──────────────────────────────────────────────────────

const POLL_INTERVAL_MS = Number(process.env.RADAR_LISTENER_POLL_MS ?? 10_000);
const STATE_REFRESH_MS = Number(process.env.RADAR_LISTENER_STATE_REFRESH_MS ?? 60_000);
const POLL_LOOKBACK_MS = 5 * 60 * 1000; // 5 minutes — catches replies that arrived during a paused poll
const REPLIES_PER_POLL = 50;
const MAX_REPLY_LEN = 4000;
const SEEN_GUIDS_CAP = 1000;
const MIN_POLL_INTERVAL_MS = 10_000; // chat.db reads are non-trivial; don't poll faster

const SEEN_GUIDS_PATH = resolve(
  homedir(),
  '.cache/agentsfirst-radar/seen-imsg-guids.json',
);

const SOFT_SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;

// ─── Daemon state ────────────────────────────────────────────────────────────

interface DaemonState {
  chat_id: string;
  open_recs: Recommendation[];
  open_recs_loaded_at: number;
  seen_guids: Set<string>;
  seen_guid_order: string[]; // FIFO order for LRU cap
  shutting_down: boolean;
}

// ─── Logging ────────────────────────────────────────────────────────────────

function log(msg: string): void {
  // LaunchAgent captures stdout/stderr to the configured StandardOutPath.
  process.stdout.write(`${new Date().toISOString()} ${msg}\n`);
}

// ─── Sleep helper ───────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

// ─── seen_guids cache I/O ────────────────────────────────────────────────────

async function loadSeenGuids(): Promise<{ set: Set<string>; order: string[] }> {
  try {
    const raw = await fs.readFile(SEEN_GUIDS_PATH, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { set: new Set(), order: [] };
    }
    const guids: string[] = [];
    for (const item of parsed) {
      if (typeof item === 'string') guids.push(item);
    }
    // Cap on load in case the file ever exceeded the limit.
    const capped = guids.slice(-SEEN_GUIDS_CAP);
    return { set: new Set(capped), order: [...capped] };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { set: new Set(), order: [] };
    }
    log(`[listener] seen-guids load error (starting empty): ${(err as Error).message}`);
    return { set: new Set(), order: [] };
  }
}

async function saveSeenGuids(order: readonly string[]): Promise<void> {
  try {
    await fs.mkdir(dirname(SEEN_GUIDS_PATH), { recursive: true });
    const tmp = `${SEEN_GUIDS_PATH}.tmp.${process.pid}.${Date.now()}`;
    await fs.writeFile(tmp, JSON.stringify(order), 'utf8');
    await fs.rename(tmp, SEEN_GUIDS_PATH);
  } catch (err) {
    log(`[listener] seen-guids save error (continuing): ${(err as Error).message}`);
  }
}

function rememberGuid(daemon: DaemonState, guid: string): void {
  if (daemon.seen_guids.has(guid)) return;
  daemon.seen_guids.add(guid);
  daemon.seen_guid_order.push(guid);
  // LRU cap (FIFO eviction — order of first-seen is fine for dedup).
  while (daemon.seen_guid_order.length > SEEN_GUIDS_CAP) {
    const evicted = daemon.seen_guid_order.shift();
    if (evicted !== undefined) daemon.seen_guids.delete(evicted);
  }
}

// ─── State refresh ──────────────────────────────────────────────────────────

async function refreshOpenRecs(daemon: DaemonState): Promise<void> {
  const state = await readState();
  // 'open' is the typical target. 'accepted'/'in_flight' are included because
  // CONFIRM/CANCEL replies target accepted social-lane recs.
  daemon.open_recs = Object.values(state.recommendations).filter(
    (r) => r.status === 'open' || r.status === 'accepted' || r.status === 'in_flight',
  );
  daemon.open_recs_loaded_at = Date.now();
}

// ─── Reply handling ──────────────────────────────────────────────────────────

async function handleReply(reply: ImsgReply, daemon: DaemonState): Promise<void> {
  // Anti-pattern guard: never trust unbounded reply text length.
  const text = reply.text.length > MAX_REPLY_LEN
    ? reply.text.slice(0, MAX_REPLY_LEN)
    : reply.text;

  const parsed = parseReply(text, daemon.open_recs);

  // Ambiguous prefix → clarifying reply + log to unparsed.
  if (parsed.ambiguous_prefix) {
    const matches = parsed.ambiguous_matches ?? [];
    const matchDescr = matches
      .map((m) => `${m.id} (${m.lane})`)
      .join(' and ');
    const msg = `⚠️ Ambiguous: ${parsed.ambiguous_prefix} matches ${matchDescr}. Reply with full 8 chars.`;
    await sendImsg(daemon.chat_id, msg).catch((e) =>
      log(`[listener] ambiguous reply send failed: ${(e as Error).message}`),
    );
    const row: UnparsedRow = {
      iso: reply.iso,
      raw_reply: text,
      reason: 'ambiguous-prefix',
      prefix: parsed.ambiguous_prefix,
      ambiguous_matches: matches.map((m) => m.id),
      imsg_guid: reply.guid,
    };
    await appendUnparsed(row);
    return;
  }

  // Unparsed → log; selectively reply.
  if (parsed.unparsed) {
    const reason = parsed.unparsed_reason ?? 'malformed';
    // Per AGENTS.md: never silently drop. But empty / unrelated chatter
    // shouldn't trigger a clarifying reply (would spam Josh's 1:1).
    if (reason === 'no-verb' || reason === 'unknown-id' || reason === 'no-id') {
      await sendImsg(
        daemon.chat_id,
        `⚠️ Didn't parse — did you mean \`accept <id>\`?`,
      ).catch((e) => log(`[listener] unparsed reply send failed: ${(e as Error).message}`));
    }
    const row: UnparsedRow = {
      iso: reply.iso,
      raw_reply: text,
      reason: (reason as UnparsedRow['reason']),
      imsg_guid: reply.guid,
    };
    await appendUnparsed(row).catch((e) =>
      log(`[listener] appendUnparsed failed: ${(e as Error).message}`),
    );
    return;
  }

  // Valid parse → append mutation event.
  if (parsed.verb && parsed.rec_id) {
    const event: MutationEvent = {
      iso: reply.iso,
      verb: parsed.verb as Verb,
      rec_id: parsed.rec_id,
      raw_reply: text,
      imsg_guid: reply.guid,
    };
    await appendMutation(event);
    log(`[listener] mutation queued: ${parsed.verb} ${parsed.rec_id}`);

    // Per AGENTS.md Rule 3 — idempotency. If the rec is already past 'open',
    // surface that to Josh so he doesn't think a stale reply triggered work.
    const matchedRec = daemon.open_recs.find((r) => r.id === parsed.rec_id);
    if (
      matchedRec &&
      parsed.verb === 'accept' &&
      matchedRec.status !== 'open'
    ) {
      await sendImsg(
        daemon.chat_id,
        `✅ Already ${matchedRec.status} ${parsed.rec_id} at ${matchedRec.status_changed_iso}`,
      ).catch((e) => log(`[listener] idempotency reply send failed: ${(e as Error).message}`));
      return;
    }

    // CONFIRM / CANCEL — immediate ack so Josh knows the verb landed
    // (the actual publish runs server-side once the cron folds the mutation).
    if (parsed.verb === 'confirm' || parsed.verb === 'cancel') {
      const ack = parsed.verb === 'confirm'
        ? `✅ Confirmed; publishing queued ${parsed.rec_id}`
        : `🛑 Cancelled ${parsed.rec_id}`;
      await sendImsg(daemon.chat_id, ack).catch((e) =>
        log(`[listener] ack send failed: ${(e as Error).message}`),
      );
    }
  }
}

// ─── Poll loop ───────────────────────────────────────────────────────────────

async function pollOnce(daemon: DaemonState): Promise<void> {
  const sinceIso = new Date(Date.now() - POLL_LOOKBACK_MS).toISOString();
  const replies = await readRecentReplies(daemon.chat_id, sinceIso, REPLIES_PER_POLL);

  for (const reply of replies) {
    if (daemon.shutting_down) break;
    if (reply.is_from_me) continue; // ignore Josh's own outgoing
    if (daemon.seen_guids.has(reply.guid)) continue;

    rememberGuid(daemon, reply.guid);

    // Don't crash the daemon on a single bad reply.
    try {
      await handleReply(reply, daemon);
    } catch (err) {
      log(`[listener] handleReply error for ${reply.guid}: ${(err as Error).message}`);
    }
  }
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  log('[listener] starting');

  // Effective poll interval — never under MIN_POLL_INTERVAL_MS even if env
  // tries to override (chat.db reads aren't free).
  const effectivePollMs = Math.max(MIN_POLL_INTERVAL_MS, POLL_INTERVAL_MS);

  const chatId = await getMikeyChatId();
  log(`[listener] watching chat ${chatId}`);

  const { set: seenSet, order: seenOrder } = await loadSeenGuids();
  log(`[listener] loaded ${seenSet.size} seen guids from cache`);

  const daemon: DaemonState = {
    chat_id: chatId,
    open_recs: [],
    open_recs_loaded_at: 0,
    seen_guids: seenSet,
    seen_guid_order: seenOrder,
    shutting_down: false,
  };

  // Soft shutdown — finish current poll, persist cache, exit clean.
  for (const sig of SOFT_SHUTDOWN_SIGNALS) {
    process.on(sig, () => {
      if (!daemon.shutting_down) {
        log(`[listener] received ${sig}, shutting down after current poll`);
      }
      daemon.shutting_down = true;
    });
  }

  // Initial state load. If this fails, the daemon refuses to start —
  // we cannot match rec_ids without it.
  await refreshOpenRecs(daemon);
  log(`[listener] loaded ${daemon.open_recs.length} open/accepted/in_flight recs`);

  // Poll loop.
  while (!daemon.shutting_down) {
    try {
      await pollOnce(daemon);
    } catch (err) {
      log(`[listener] poll error (continuing): ${(err as Error).message}`);
    }

    // Persist guid cache periodically (after each poll) so a kill -9
    // doesn't lose dedup state.
    await saveSeenGuids(daemon.seen_guid_order);

    if (daemon.shutting_down) break;
    await sleep(effectivePollMs);

    // Periodic state refresh — picks up new recs the cron committed and
    // status changes the cron applied (open → accepted, etc.).
    if (Date.now() - daemon.open_recs_loaded_at > STATE_REFRESH_MS) {
      try {
        await refreshOpenRecs(daemon);
      } catch (err) {
        log(`[listener] state refresh failed (using stale recs): ${(err as Error).message}`);
      }
    }
  }

  await saveSeenGuids(daemon.seen_guid_order);
  log('[listener] shutdown complete');
}

main().catch((err) => {
  log(`[listener] fatal: ${(err as Error).message}`);
  process.exit(1);
});
