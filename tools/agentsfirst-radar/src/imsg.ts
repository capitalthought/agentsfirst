// imsg.ts — iMessage chat resolution + send for agentsfirst-radar.
//
// Runs on the joshhome Mac Studio. Resolves 1:1 chats from ~/Library/Messages/
// chat.db, sends via ~/bin/imsg (preferred) or AppleScript (fallback). All
// subprocess invocations use execFile with argv — never a shell-string — since
// the body and chat identifier are untrusted text.
//
// Design contract: docs/plans/2026-05-15-agentsfirst-radar-design.md §3 STEP J
// Global rule:    ~/.claude/CLAUDE.md "iMessage — pick the right chat"

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

import { IMSG_LAST_SUCCESS_PATH } from './state.js';

const execFileAsync = promisify(execFile);

// ─── Public types ────────────────────────────────────────────────────────────

export interface ImsgSendResult {
  sent_iso: string;
  success: boolean;
  chat_id: string;
  error?: string;
}

export interface ImsgReply {
  guid: string;
  text: string;
  iso: string;
  is_from_me: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MIKEY_EMAIL = 'mikey@capitalfactory.com';

const CHAT_DB_PATH = resolve(homedir(), 'Library/Messages/chat.db');
const IMSG_WRAPPER_PATH = resolve(homedir(), 'bin/imsg');

// Accept: email | E.164-ish phone (7-15 digits, optional +) | hex GUID (groups)
const EMAIL_OR_PHONE = /^[\w.+-]+@[\w.-]+\.[a-z]{2,}$|^\+?\d{7,15}$/i;
const EMAIL_PHONE_OR_GUID = /^[\w.+-]+@[\w.-]+\.[a-z]{2,}$|^\+?\d{7,15}$|^[A-F0-9-]+$/i;

// chat.db `date` field is Apple absolute time: nanoseconds since 2001-01-01 UTC.
const APPLE_EPOCH_MS = Date.UTC(2001, 0, 1);

// Module-level cache for getMikeyChatId.
const chatIdCache = new Map<string, string>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateIdentifier(id: string): void {
  if (!EMAIL_OR_PHONE.test(id)) {
    throw new Error('imsg.resolveChatId: invalid identifier shape');
  }
}

function validateChatIdentifier(id: string): void {
  if (!EMAIL_PHONE_OR_GUID.test(id)) {
    throw new Error('imsg: invalid chat identifier shape');
  }
}

function appleNsToIso(ns: number | bigint): string {
  const ms = Number(ns) / 1e6 + APPLE_EPOCH_MS;
  return new Date(ms).toISOString();
}

function isoToAppleNs(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) throw new Error(`imsg: invalid ISO date: ${iso}`);
  // Use BigInt to preserve nanosecond precision in the SQL literal.
  const ns = BigInt(ms - APPLE_EPOCH_MS) * 1_000_000n;
  return ns.toString();
}

function truncateForLog(s: string, n = 80): string {
  if (s.length <= n) return s;
  return `${s.slice(0, n)}...`;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

// ─── resolveChatId ───────────────────────────────────────────────────────────

/**
 * Resolve an iMessage chat by email-or-phone identifier. Queries chat.db on
 * the local Mac via sqlite3 to find the most recent chat containing this
 * handle in a 1:1 (NOT a group). Returns the chat_identifier from chat.db.
 *
 * Throws if no matching chat exists.
 */
export async function resolveChatId(emailOrPhone: string): Promise<string> {
  validateIdentifier(emailOrPhone);

  // Strict pre-validated; safe to interpolate. We escape single quotes
  // defensively in case the regex ever loosens.
  const safe = emailOrPhone.replace(/'/g, "''");
  const sql = `
    SELECT c.chat_identifier
    FROM chat c
    JOIN chat_handle_join chj ON chj.chat_id = c.ROWID
    JOIN handle h ON h.ROWID = chj.handle_id
    WHERE h.id = '${safe}'
      AND c.style = 45
    GROUP BY c.ROWID
    ORDER BY MAX(
      (SELECT MAX(m.date) FROM message m
       JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
       WHERE cmj.chat_id = c.ROWID)
    ) DESC
    LIMIT 1;
  `;

  let stdout: string;
  try {
    const result = await execFileAsync('sqlite3', ['-readonly', CHAT_DB_PATH, sql]);
    stdout = result.stdout;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`imsg.resolveChatId: sqlite3 failed for ${emailOrPhone}: ${msg}`);
  }

  const chatId = stdout.trim();
  if (!chatId) {
    throw new Error(`imsg.resolveChatId: no 1:1 chat found for ${emailOrPhone}`);
  }
  // sqlite3 -line/-column not used, so each row is a single line. Take first.
  const firstLine = chatId.split('\n')[0]?.trim();
  if (!firstLine) {
    throw new Error(`imsg.resolveChatId: no 1:1 chat found for ${emailOrPhone}`);
  }
  return firstLine;
}

// ─── sendImsg ────────────────────────────────────────────────────────────────

/**
 * Send `body` to the chat identified by `chatIdentifier` (a chat.db
 * chat_identifier — email or phone for 1:1s, GUID for groups).
 *
 * Uses ~/bin/imsg (the global Mac wrapper) if present; falls back to
 * AppleScript via osascript. Both are executed via execFile with argv.
 *
 * If RADAR_DRY_RUN env is set, returns success stub WITHOUT actually sending.
 * The log line still fires.
 */
export async function sendImsg(
  chatIdentifier: string,
  body: string,
): Promise<ImsgSendResult> {
  validateChatIdentifier(chatIdentifier);

  const nowIso = new Date().toISOString();

  if (process.env.RADAR_DRY_RUN === '1') {
    process.stderr.write(
      `[DRY-RUN] imsg → ${chatIdentifier}: ${truncateForLog(body)}\n`,
    );
    return { sent_iso: nowIso, success: true, chat_id: chatIdentifier };
  }

  // Attempt 1: ~/bin/imsg wrapper.
  let wrapperError: string | undefined;
  if (await fileExists(IMSG_WRAPPER_PATH)) {
    try {
      await execFileAsync(IMSG_WRAPPER_PATH, ['send', chatIdentifier, body]);
      await recordSendSuccess(chatIdentifier, nowIso);
      return { sent_iso: nowIso, success: true, chat_id: chatIdentifier };
    } catch (err) {
      wrapperError = err instanceof Error ? err.message : String(err);
      // fall through to AppleScript
    }
  }

  // Attempt 2: AppleScript via osascript. Pass body and chat as positional
  // arguments to the script, NOT interpolated into the source — keeps them
  // out of the AppleScript parser entirely.
  const script = `
    on run argv
      set targetId to item 1 of argv
      set msgBody to item 2 of argv
      tell application "Messages"
        set targetService to 1st service whose service type = iMessage
        try
          set targetBuddy to buddy targetId of targetService
          send msgBody to targetBuddy
        on error
          set targetChat to chat id targetId
          send msgBody to targetChat
        end try
      end tell
    end run
  `;
  try {
    await execFileAsync('osascript', ['-e', script, chatIdentifier, body]);
    await recordSendSuccess(chatIdentifier, nowIso);
    return { sent_iso: nowIso, success: true, chat_id: chatIdentifier };
  } catch (err) {
    const osaError = err instanceof Error ? err.message : String(err);
    const combined = wrapperError
      ? `wrapper failed (${wrapperError}); osascript failed (${osaError})`
      : `osascript failed (${osaError})`;
    return {
      sent_iso: nowIso,
      success: false,
      chat_id: chatIdentifier,
      error: combined,
    };
  }
}

async function recordSendSuccess(chatId: string, iso: string): Promise<void> {
  try {
    await fs.mkdir(resolve(IMSG_LAST_SUCCESS_PATH, '..'), { recursive: true });
    await fs.writeFile(
      IMSG_LAST_SUCCESS_PATH,
      JSON.stringify({ iso, chat_id: chatId }, null, 2),
    );
  } catch {
    // Non-fatal; the send already happened.
  }
}

// ─── getMikeyChatId ──────────────────────────────────────────────────────────

/**
 * Convenience: the 1:1 chat with mikey@capitalfactory.com is the canonical
 * radar destination. Returns the resolved chat_id (cached for the process).
 */
export async function getMikeyChatId(): Promise<string> {
  const cached = chatIdCache.get(MIKEY_EMAIL);
  if (cached) return cached;
  const resolved = await resolveChatId(MIKEY_EMAIL);
  chatIdCache.set(MIKEY_EMAIL, resolved);
  return resolved;
}

// ─── readRecentReplies ───────────────────────────────────────────────────────

/**
 * Read the most recent N replies to the given chat from chat.db (used by the
 * imsg-listener daemon). Returns messages newer than `sinceIso`. Empty array
 * if chat.db unreachable. This is READ-ONLY; never opens a write tx.
 */
export async function readRecentReplies(
  chatIdentifier: string,
  sinceIso: string,
  limit = 50,
): Promise<ImsgReply[]> {
  validateChatIdentifier(chatIdentifier);
  const cappedLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
  const sinceNs = isoToAppleNs(sinceIso);

  const safeChat = chatIdentifier.replace(/'/g, "''");
  // Use 0x1F as the column separator (chosen because it can't appear in
  // GUIDs, ISO dates, or boolean flags, and is exceedingly unlikely in
  // message text). Use 0x1E as the row separator. This avoids ambiguity
  // when message text contains commas, tabs, or pipes.
  const sql = `
    .mode list
    .separator "\\x1F" "\\x1E"
    SELECT m.guid, COALESCE(m.text, ''), m.date, m.is_from_me
    FROM message m
    JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
    JOIN chat c ON c.ROWID = cmj.chat_id
    WHERE c.chat_identifier = '${safeChat}'
      AND m.date > ${sinceNs}
    ORDER BY m.date DESC
    LIMIT ${cappedLimit};
  `;

  let stdout: string;
  try {
    const result = await execFileAsync('sqlite3', ['-readonly', CHAT_DB_PATH, sql]);
    stdout = result.stdout;
  } catch {
    return [];
  }

  if (!stdout) return [];

  // The .separator command sets ASCII 0x1F between columns and 0x1E between
  // rows. Trim a trailing row separator if present.
  const trimmed = stdout.replace(/\x1E$/, '');
  if (!trimmed) return [];

  const rows = trimmed.split('\x1E');
  const replies: ImsgReply[] = [];
  for (const row of rows) {
    if (!row) continue;
    const cols = row.split('\x1F');
    if (cols.length < 4) continue;
    const [guid, text, dateStr, isFromMeStr] = cols;
    if (!guid || !dateStr) continue;
    let dateNs: bigint;
    try {
      dateNs = BigInt(dateStr.trim());
    } catch {
      continue;
    }
    replies.push({
      guid: guid.trim(),
      text: text ?? '',
      iso: appleNsToIso(dateNs),
      is_from_me: (isFromMeStr ?? '0').trim() === '1',
    });
  }
  return replies;
}
