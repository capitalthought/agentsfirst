// fanout.ts — parallel source-fetcher for agentsfirst-radar (Step B of the pipeline).
//
// Design contract: docs/plans/2026-05-15-agentsfirst-radar-design.md §3 Step B
// + §4.4 source mechanisms. Legacy patterns mirrored from
// ~/.claude/skills/agentsfirst-check/SKILL.md Step 1.
//
// SECURITY:
//   - This module ONLY reads. It never writes state, opens PRs, or sends iMessage.
//   - All subprocess calls use execFile with argv arrays — never shell strings.
//   - Source field interpolation into URLs is restricted to the WHATWG URL constructor
//     (URLSearchParams / encodeURIComponent on user-controlled segments). Bare
//     `fetch(source.url)` is safe because fetch itself URL-parses.
//   - raw_text on every FetchedItem is UNTRUSTED content that may carry
//     prompt-injection payloads. Only the reader LLM at Step D ever sees it,
//     and the reader LLM's output is restricted to a structured enum +
//     ≤200-char verbatim quote (see design §3 "Data/control-plane separation").
//   - Per AGENTS.md "cf_portfolio_probe runs in isolated subprocess" — this
//     module does NOT execute the portfolio probe. It emits placeholder items
//     flagged `requires_quarantined_probe: true` that a separate quarantined
//     subprocess (invoked by triage/recs) actually scores.
//
// Per-source retry policy: 1 attempt, 1s pause, retry once. If both attempts
// fail, the source is flagged with an FetchAttempt {ok: false} and added to
// `errors`. Fanout NEVER throws — partial failure is the expected mode.

import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { promisify } from 'node:util';

import type { SourceHealth } from './state.js';
import type { Source, SourceKind } from './sources.js';

const execFileAsync = promisify(execFile);

// ─── Module-level constants ──────────────────────────────────────────────────

const HERE_URL = new URL('.', import.meta.url);
const HERE = decodeURIComponent(HERE_URL.pathname);
const PACKAGE_ROOT = resolve(HERE, '..');
const SPEC_CACHE_DIR = resolve(PACKAGE_ROOT, 'spec-cache');
const CF_ARS_CACHE_PATH = resolve(SPEC_CACHE_DIR, 'cf-ars-scoreboard.json');

// grok-twitter wrapper — argv-only invocation, never via shell.
const GROK_X_PATH = resolve(homedir(), '.claude', 'skills', 'grok-twitter', 'grok-x.mjs');

const FETCH_TIMEOUT_MS = 20_000;
const RETRY_BACKOFF_MS = 1_000;

// ─── Public types ────────────────────────────────────────────────────────────

export interface FetchedItem {
  url: string; // canonical URL of the item
  source_id: string; // ID of the source that produced it
  title?: string;
  published_iso?: string; // ISO 8601
  summary?: string; // brief summary if the source provides one
  raw_text: string; // UNTRUSTED — only the reader LLM sees this (Step D boundary)
  metadata?: Record<string, unknown>; // source-specific (gh release tag, hn score, etc.)
}

export interface FetchAttempt {
  ok: boolean;
  source_id: string;
  iso: string;
  error?: string;
}

export interface FanoutResult {
  items: FetchedItem[];
  attempts: FetchAttempt[]; // one per source; caller merges into state.sources_health
  errors: { source_id: string; message: string }[];
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Wrap a per-source fetch attempt in 1-retry-with-1s-backoff. Never throws.
 * Returns either the successful items or a failure summary.
 */
async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const value = await fn();
      return { ok: true, value };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt === 1) {
        process.stderr.write(`[fanout] ${label} attempt 1 failed: ${msg} (retrying)\n`);
        await sleep(RETRY_BACKOFF_MS);
        continue;
      }
      process.stderr.write(`[fanout] ${label} attempt 2 failed: ${msg}\n`);
      return { ok: false, error: msg };
    }
  }
  // unreachable
  return { ok: false, error: 'unreachable' };
}

/**
 * Native fetch wrapped with timeout + status check. Throws on non-2xx or timeout.
 */
async function fetchText(
  url: string,
  init: RequestInit = {},
  signal?: AbortSignal,
): Promise<string> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  // chain external abort signal
  if (signal) {
    if (signal.aborted) ac.abort();
    else signal.addEventListener('abort', () => ac.abort(), { once: true });
  }
  try {
    const res = await fetch(url, { ...init, signal: ac.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} from ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(
  url: string,
  init: RequestInit = {},
  signal?: AbortSignal,
): Promise<unknown> {
  const text = await fetchText(url, init, signal);
  return JSON.parse(text);
}

// ─── RSS / Atom extraction (regex-based; no XML parser dep) ──────────────────

interface FeedEntry {
  title?: string;
  link?: string;
  pubDate?: string; // ISO if parseable
  description?: string;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function tryParseDate(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return undefined;
  return new Date(t).toISOString();
}

function extractTag(block: string, tag: string): string | undefined {
  // <tag ...>VALUE</tag> — case-insensitive; first match.
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = block.match(re);
  if (!m || m[1] === undefined) return undefined;
  return decodeXmlEntities(m[1]).trim();
}

function extractAtomLink(block: string): string | undefined {
  // Atom <link href="..." [rel="alternate"] /> — pick rel="alternate" if present, else first.
  const links = [...block.matchAll(/<link\b([^>]*)\/?>/gi)];
  if (links.length === 0) return undefined;
  let pick: string | undefined;
  for (const m of links) {
    const attrs = m[1] ?? '';
    const href = attrs.match(/href\s*=\s*"([^"]+)"/i)?.[1];
    if (!href) continue;
    const rel = attrs.match(/rel\s*=\s*"([^"]+)"/i)?.[1];
    if (rel === 'alternate' || rel === undefined) {
      pick = href;
      if (rel === 'alternate') break;
    }
  }
  return pick;
}

/**
 * Parse an RSS 2.0 or Atom feed by string-extraction. Returns up to ~50 entries.
 * Deliberately not strict — best-effort extraction; bad entries are dropped.
 */
function parseFeed(xml: string): FeedEntry[] {
  const entries: FeedEntry[] = [];

  // RSS 2.0: <item>...</item>
  const itemBlocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  for (const block of itemBlocks) {
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const pubDate = tryParseDate(extractTag(block, 'pubDate') ?? extractTag(block, 'dc:date'));
    const description = extractTag(block, 'description') ?? extractTag(block, 'content:encoded');
    entries.push({
      title: title ? stripTags(title) : undefined,
      link: link ? link.trim() : undefined,
      pubDate,
      description: description ? stripTags(description).slice(0, 4000) : undefined,
    });
  }

  // Atom: <entry>...</entry>
  if (entries.length === 0) {
    const entryBlocks = [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]);
    for (const block of entryBlocks) {
      const title = extractTag(block, 'title');
      const link = extractAtomLink(block);
      const pubDate = tryParseDate(extractTag(block, 'updated') ?? extractTag(block, 'published'));
      const description = extractTag(block, 'summary') ?? extractTag(block, 'content');
      entries.push({
        title: title ? stripTags(title) : undefined,
        link: link?.trim(),
        pubDate,
        description: description ? stripTags(description).slice(0, 4000) : undefined,
      });
    }
  }

  return entries.slice(0, 50);
}

// ─── Diff (line-based; no dep) ───────────────────────────────────────────────

function unifiedLineDiff(oldText: string, newText: string, filename: string): string {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const out: string[] = [`--- ${filename} (cached)`, `+++ ${filename} (live)`];
  // Naive line-by-line diff — good enough to surface "what changed".
  const max = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < max; i++) {
    const a = oldLines[i];
    const b = newLines[i];
    if (a === b) continue;
    if (a !== undefined) out.push(`- ${a}`);
    if (b !== undefined) out.push(`+ ${b}`);
  }
  return out.join('\n');
}

// ─── grok-twitter shell-out ──────────────────────────────────────────────────

interface GrokParsed {
  text: string;
  citedUrls: string[];
}

/**
 * Run the grok-x wrapper with a prompt and parse stdout for cited URLs.
 * stdout is treated as untrusted (it's an LLM answer); we extract URLs via
 * regex on a `https?://` pattern and never eval the output.
 */
async function callGrokX(prompt: string, signal?: AbortSignal): Promise<GrokParsed> {
  const { stdout } = await execFileAsync('node', [GROK_X_PATH, prompt], {
    timeout: FETCH_TIMEOUT_MS * 3, // grok calls can be slower than HTTP
    maxBuffer: 4 * 1024 * 1024,
    signal,
  });
  const text = String(stdout);
  const urls = [...text.matchAll(/https?:\/\/[^\s)\]"'<>]+/g)].map((m) => m[0]);
  // Dedup while preserving order.
  const seen = new Set<string>();
  const citedUrls: string[] = [];
  for (const u of urls) {
    if (!seen.has(u)) {
      seen.add(u);
      citedUrls.push(u);
    }
  }
  return { text, citedUrls };
}

// ─── Per-kind fetchers ───────────────────────────────────────────────────────

async function fetchBlog(
  source: Source,
  since: string,
  signal?: AbortSignal,
): Promise<FetchedItem[]> {
  if (!source.url) return [];
  const xml = await fetchText(source.url, {}, signal);
  const entries = parseFeed(xml);
  const sinceMs = Date.parse(since);
  const items: FetchedItem[] = [];
  for (const e of entries) {
    if (!e.link) continue;
    if (e.pubDate && Date.parse(e.pubDate) < sinceMs) continue;
    // raw_text is untrusted; only the reader LLM ever sees it (Step D boundary).
    items.push({
      url: e.link,
      source_id: source.id,
      title: e.title,
      published_iso: e.pubDate,
      summary: e.description,
      raw_text: [e.title, e.description].filter(Boolean).join('\n\n'),
    });
  }
  return items;
}

async function fetchXHandle(
  source: Source,
  since: string,
  signal?: AbortSignal,
): Promise<FetchedItem[]> {
  if (!source.handle) return [];
  const prompt = `What has @${source.handle} posted since ${since} about MCP, agents, llms.txt, AGENTS.md, agent readiness, Content-Signal, or any framework for designing products that AI agents use?`;
  const { text, citedUrls } = await callGrokX(prompt, signal);
  return citedUrls.map((url) => ({
    url,
    source_id: source.id,
    raw_text: text, // untrusted — full grok answer; reader LLM only.
    metadata: { handle: source.handle },
  }));
}

async function fetchXQuery(
  source: Source,
  since: string,
  signal?: AbortSignal,
): Promise<FetchedItem[]> {
  if (!source.query) return [];
  const sinceDate = since.slice(0, 10);
  const prompt = `${source.query} since:${sinceDate}`;
  const { text, citedUrls } = await callGrokX(prompt, signal);
  return citedUrls.map((url) => ({
    url,
    source_id: source.id,
    raw_text: text, // untrusted
    metadata: { query: source.query },
  }));
}

interface GhRelease {
  published_at?: string;
  tag_name?: string;
  html_url?: string;
  name?: string;
  body?: string;
}

async function fetchGhReleases(
  source: Source,
  since: string,
  signal?: AbortSignal,
): Promise<FetchedItem[]> {
  if (!source.repo) return [];
  const { stdout } = await execFileAsync(
    'gh',
    [
      'api',
      `repos/${source.repo}/releases`,
      '--jq',
      '.[0:5] | .[] | {published_at, tag_name, html_url, name, body}',
    ],
    { timeout: FETCH_TIMEOUT_MS, maxBuffer: 2 * 1024 * 1024, signal },
  );
  // `--jq '.[] | {...}'` emits one JSON object per line.
  const releases: GhRelease[] = String(stdout)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as GhRelease);
  const sinceMs = Date.parse(since);
  const items: FetchedItem[] = [];
  for (const r of releases) {
    if (!r.html_url) continue;
    if (r.published_at && Date.parse(r.published_at) < sinceMs) continue;
    items.push({
      url: r.html_url,
      source_id: source.id,
      title: r.tag_name ?? r.name,
      published_iso: r.published_at,
      summary: r.name,
      // release notes are untrusted text — Step D boundary applies.
      raw_text: [r.name, r.body].filter(Boolean).join('\n\n'),
      metadata: { tag_name: r.tag_name },
    });
  }
  return items;
}

async function fetchSpecDiff(
  source: Source,
  _since: string,
  signal?: AbortSignal,
): Promise<FetchedItem[]> {
  if (!source.url || !source.spec_cache_filename) return [];
  const live = await fetchText(source.url, {}, signal);
  const cachePath = resolve(SPEC_CACHE_DIR, source.spec_cache_filename);
  await fs.mkdir(dirname(cachePath), { recursive: true });
  let prior: string | null = null;
  try {
    prior = await fs.readFile(cachePath, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
  // Always update cache to the live copy after diffing.
  await fs.writeFile(cachePath, live, 'utf8');
  if (prior === null) {
    // Cold start — nothing to diff against; seeded for next run.
    return [];
  }
  if (prior === live) return [];
  const diff = unifiedLineDiff(prior, live, source.spec_cache_filename);
  return [
    {
      url: source.url,
      source_id: source.id,
      title: `spec change: ${source.display_name}`,
      published_iso: nowIso(),
      raw_text: diff, // untrusted (diff of remote content)
      metadata: { kind: 'spec_diff', filename: source.spec_cache_filename },
    },
  ];
}

async function fetchWebSearch(_source: Source, _since: string): Promise<FetchedItem[]> {
  // TODO(post-v1): wire WebSearch — currently no programmatic Google API
  // available without paid setup. Skipped intentionally.
  return [];
}

async function fetchHnFrontpage(
  source: Source,
  since: string,
  signal?: AbortSignal,
): Promise<FetchedItem[]> {
  const url = source.url ?? 'https://hnrss.org/frontpage?count=50&points=10';
  const xml = await fetchText(url, {}, signal);
  const entries = parseFeed(xml);
  const sinceMs = Date.parse(since);
  const items: FetchedItem[] = [];
  for (const e of entries) {
    if (!e.link) continue;
    if (e.pubDate && Date.parse(e.pubDate) < sinceMs) continue;
    items.push({
      url: e.link,
      source_id: source.id,
      title: e.title,
      published_iso: e.pubDate,
      summary: e.description,
      raw_text: [e.title, e.description].filter(Boolean).join('\n\n'),
    });
  }
  return items;
}

async function fetchLinkedin(
  source: Source,
  since: string,
  signal?: AbortSignal,
): Promise<FetchedItem[]> {
  if (!source.handle) return [];
  // Requires self-hosted RSSHub — see RUNBOOK.md (host comes from
  // RADAR_RSSHUB_HOST env var, e.g. set on the joshhome runner to the
  // Tailscale MagicDNS name). Public rsshub.app is intentionally NOT used
  // (third-party text we don't trust).
  const rsshubHost = process.env.RADAR_RSSHUB_HOST ?? 'localhost:1200';
  const url =
    source.url ??
    `http://${rsshubHost}/linkedin/posts/${encodeURIComponent(source.handle)}`;
  const xml = await fetchText(url, {}, signal);
  const entries = parseFeed(xml);
  const sinceMs = Date.parse(since);
  const items: FetchedItem[] = [];
  for (const e of entries) {
    if (!e.link) continue;
    if (e.pubDate && Date.parse(e.pubDate) < sinceMs) continue;
    items.push({
      url: e.link,
      source_id: source.id,
      title: e.title,
      published_iso: e.pubDate,
      summary: e.description,
      raw_text: [e.title, e.description].filter(Boolean).join('\n\n'),
      metadata: { handle: source.handle, platform: 'linkedin' },
    });
  }
  return items;
}

interface BskyPost {
  uri?: string;
  cid?: string;
  record?: { text?: string; createdAt?: string };
}
interface BskyFeedItem {
  post?: BskyPost;
}
interface BskyFeedResponse {
  feed?: BskyFeedItem[];
}

async function fetchBluesky(
  source: Source,
  since: string,
  signal?: AbortSignal,
): Promise<FetchedItem[]> {
  if (!source.handle) return [];
  const url =
    source.url ??
    `https://bsky.social/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(source.handle)}`;
  const json = (await fetchJson(url, {}, signal)) as BskyFeedResponse;
  const feed = json.feed ?? [];
  const sinceMs = Date.parse(since);
  const items: FetchedItem[] = [];
  for (const entry of feed) {
    const post = entry.post;
    if (!post?.uri || !post.record) continue;
    const createdAt = post.record.createdAt;
    if (createdAt && Date.parse(createdAt) < sinceMs) continue;
    // post.uri is an at:// URI; rkey is the last path segment.
    const rkey = post.uri.split('/').pop();
    if (!rkey) continue;
    const text = post.record.text ?? '';
    items.push({
      url: `https://bsky.app/profile/${source.handle}/post/${rkey}`,
      source_id: source.id,
      published_iso: createdAt,
      raw_text: text, // untrusted post body
      metadata: { handle: source.handle, platform: 'bluesky', rkey },
    });
  }
  return items;
}

async function fetchMcpRegistry(
  source: Source,
  since: string,
  signal?: AbortSignal,
): Promise<FetchedItem[]> {
  const url =
    source.url ?? 'https://github.com/modelcontextprotocol/registry/commits/main.atom';
  const xml = await fetchText(url, {}, signal);
  const entries = parseFeed(xml);
  const sinceMs = Date.parse(since);
  const items: FetchedItem[] = [];
  for (const e of entries) {
    if (!e.link) continue;
    if (e.pubDate && Date.parse(e.pubDate) < sinceMs) continue;
    items.push({
      url: e.link,
      source_id: source.id,
      title: e.title,
      published_iso: e.pubDate,
      summary: e.description,
      raw_text: [e.title, e.description].filter(Boolean).join('\n\n'),
      metadata: { feed: 'mcp_registry' },
    });
  }
  return items;
}

interface CfArsEntry {
  domain: string;
  score: number;
  level: number;
}
interface CfArsResponse {
  result?: { rows?: CfArsEntry[] };
}
interface CfArsCache {
  fetched_iso: string;
  rows: Record<string, { score: number; level: number }>;
}

async function fetchCfArs(
  source: Source,
  _since: string,
  signal?: AbortSignal,
): Promise<FetchedItem[]> {
  const url =
    source.url ?? 'https://radar.cloudflare.com/api/v1/ai-agent-readiness?top=100';
  const json = (await fetchJson(url, {}, signal)) as CfArsResponse;
  const rows = json.result?.rows ?? [];
  const live: Record<string, { score: number; level: number }> = {};
  for (const r of rows) {
    if (!r.domain) continue;
    live[r.domain] = { score: r.score, level: r.level };
  }

  await fs.mkdir(SPEC_CACHE_DIR, { recursive: true });
  let prior: CfArsCache | null = null;
  try {
    const raw = await fs.readFile(CF_ARS_CACHE_PATH, 'utf8');
    prior = JSON.parse(raw) as CfArsCache;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }

  const cache: CfArsCache = { fetched_iso: nowIso(), rows: live };
  await fs.writeFile(CF_ARS_CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');

  if (prior === null) {
    // Cold seed; emit nothing — first delta comes next run.
    return [];
  }

  const items: FetchedItem[] = [];
  for (const [domain, scored] of Object.entries(live)) {
    const before = prior.rows[domain];
    if (!before) {
      items.push({
        url: `https://radar.cloudflare.com/ai-agent-readiness/${domain}`,
        source_id: source.id,
        title: `CF ARS: ${domain} new on top-100 (score ${scored.score}, L${scored.level})`,
        published_iso: cache.fetched_iso,
        raw_text: `${domain} entered the CF ARS top-100 at score ${scored.score} (L${scored.level}).`,
        metadata: {
          domain,
          score: scored.score,
          level: scored.level,
          change: 'new',
        },
      });
      continue;
    }
    if (before.score !== scored.score || before.level !== scored.level) {
      items.push({
        url: `https://radar.cloudflare.com/ai-agent-readiness/${domain}`,
        source_id: source.id,
        title: `CF ARS: ${domain} ${before.score}→${scored.score} (L${before.level}→L${scored.level})`,
        published_iso: cache.fetched_iso,
        raw_text: `${domain} CF ARS moved: score ${before.score}→${scored.score}, level L${before.level}→L${scored.level}.`,
        metadata: {
          domain,
          score: scored.score,
          level: scored.level,
          prior_score: before.score,
          prior_level: before.level,
          change: 'updated',
        },
      });
    }
  }
  return items;
}

async function fetchCfPortfolio(source: Source): Promise<FetchedItem[]> {
  // Per AGENTS.md: portfolio scoring runs in an isolated subprocess. This
  // module emits a placeholder only; the actual probe is invoked downstream
  // (in triage/recs) where it can be properly quarantined.
  const domain = source.url
    ? source.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : source.slug;
  return [
    {
      url: source.url ?? `https://${domain}`,
      source_id: source.id,
      title: `cf_portfolio probe pending: ${domain}`,
      raw_text: '', // never reader-LLM-input; the quarantined probe owns scoring
      metadata: {
        requires_quarantined_probe: true,
        domain,
      },
    },
  ];
}

// ─── Dispatch ────────────────────────────────────────────────────────────────

type Fetcher = (source: Source, since: string, signal?: AbortSignal) => Promise<FetchedItem[]>;

const FETCHERS: Record<SourceKind, Fetcher> = {
  blog: fetchBlog,
  x_handle: fetchXHandle,
  x_query: fetchXQuery,
  gh_releases: fetchGhReleases,
  spec_diff: fetchSpecDiff,
  web_search: fetchWebSearch,
  hn_frontpage: fetchHnFrontpage,
  linkedin: fetchLinkedin,
  bluesky: fetchBluesky,
  mcp_registry: fetchMcpRegistry,
  cf_ars: fetchCfArs,
  cf_portfolio: (source) => fetchCfPortfolio(source),
};

// ─── Per-source entry point (exposed for tests) ─────────────────────────────

/**
 * Fetch one source with the 1-retry policy. Returns items + a partial
 * SourceHealth describing the attempt outcome. Callers merge this into the
 * prior state.sources_health record (consecutive_failures is computed by
 * caller because this function has no view of prior state).
 *
 * NEVER throws.
 */
export async function fetchOne(
  source: Source,
  since: string,
): Promise<{
  items: FetchedItem[];
  health: Partial<SourceHealth>;
  error?: string;
}> {
  const fetcher = FETCHERS[source.kind];
  if (!fetcher) {
    const iso = nowIso();
    return {
      items: [],
      health: {
        last_attempt_iso: iso,
        last_error: `unknown source kind: ${source.kind}`,
      },
      error: `unknown source kind: ${source.kind}`,
    };
  }

  const result = await withRetry(source.id, () => fetcher(source, since));
  const iso = nowIso();

  if (result.ok) {
    return {
      items: result.value,
      health: {
        last_success_iso: iso,
        last_attempt_iso: iso,
        last_error: null,
      },
    };
  }

  return {
    items: [],
    health: {
      last_attempt_iso: iso,
      last_error: result.error,
    },
    error: result.error,
  };
}

// ─── Top-level fan-out ───────────────────────────────────────────────────────

/**
 * Fan out across all sources in parallel. Honors `since` (ISO 8601) — items
 * older than `since` are filtered out per-kind. Returns the union of items
 * plus per-source attempt outcomes. NEVER throws; partial failures land in
 * `result.errors` and the matching `attempts[].ok` is false.
 */
export async function fanoutAll(args: {
  sources: Source[];
  since: string;
  abortSignal?: AbortSignal;
}): Promise<FanoutResult> {
  const { sources, since, abortSignal } = args;

  const settled = await Promise.all(
    sources.map(async (source) => {
      // abortSignal short-circuits before the fetch begins.
      if (abortSignal?.aborted) {
        return {
          source,
          result: {
            items: [] as FetchedItem[],
            health: {
              last_attempt_iso: nowIso(),
              last_error: 'aborted',
            } as Partial<SourceHealth>,
            error: 'aborted',
          },
        };
      }
      const result = await fetchOne(source, since);
      return { source, result };
    }),
  );

  const items: FetchedItem[] = [];
  const attempts: FetchAttempt[] = [];
  const errors: { source_id: string; message: string }[] = [];

  for (const { source, result } of settled) {
    const iso = result.health.last_attempt_iso ?? nowIso();
    if (result.error) {
      attempts.push({ ok: false, source_id: source.id, iso, error: result.error });
      errors.push({ source_id: source.id, message: result.error });
    } else {
      attempts.push({ ok: true, source_id: source.id, iso });
      items.push(...result.items);
    }
  }

  return { items, attempts, errors };
}
