// sources.ts — typed source-list shape for agentsfirst-radar.
//
// Design contract: docs/plans/2026-05-15-agentsfirst-radar-design.md §4.4
//
// SECURITY: every field in a Source is UNTRUSTED text (slug, url, query,
// handle, repo, spec_cache_filename, display_name, why). These values come
// from the on-disk JSON file which is hand-maintained, but downstream code
// MUST NEVER pass any of these fields into a shell command, `eval`,
// `child_process.exec`, or any other shell-interpreted context. The
// shell-injection-from-scraped-sources anti-pattern in AGENTS.md applies
// equally here — pass via stdin or a temp file, never as argv.
//
// Layout:
//   - Zod schemas (SourceKind, Weight, Source, SourcesFile)
//   - DEFAULT_SOURCES_PATH constant (resolves to tools/agentsfirst-radar/sources.json)
//   - loadSources(path?) — reads + parses the legacy-shape JSON and FLATTENS
//     it into a normalized Source[] array.
//   - defaultSources() — in-memory bootstrap list for when the file is absent.

import { z } from 'zod';
import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

// ─── Package paths ───────────────────────────────────────────────────────────
// Resolve the default sources.json relative to this file. In dev this is
// tools/agentsfirst-radar/src/, in prod tools/agentsfirst-radar/dist/ — both
// climb one ".." to reach the package root.

const HERE_URL = new URL('.', import.meta.url);
const HERE = decodeURIComponent(HERE_URL.pathname);
const PACKAGE_ROOT = resolve(HERE, '..');

export const DEFAULT_SOURCES_PATH = resolve(PACKAGE_ROOT, 'sources.json');

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const SourceKind = z.enum([
  'blog', // RSS / Atom feeds
  'x_handle', // grok x_search by handle
  'x_query', // grok x_search by free-text query
  'gh_releases', // gh api repos/<repo>/releases
  'spec_diff', // curl + diff vs cached copy
  'web_search', // WebSearch / Google
  'hn_frontpage', // https://hnrss.org/frontpage RSS
  'linkedin', // Self-hosted RSSHub on joshhome
  'bluesky', // bsky.social/xrpc/app.bsky.feed.getAuthorFeed
  'mcp_registry', // github.com/modelcontextprotocol/registry commits.atom
  'cf_ars', // radar.cloudflare.com/api/v1/ai-agent-readiness
  'cf_portfolio', // QUARANTINED — isolated subprocess; agentsfirst.dev/mcp probe
]);
export type SourceKind = z.infer<typeof SourceKind>;

export const Weight = z.enum(['critical', 'high', 'medium', 'low']);
export type Weight = z.infer<typeof Weight>;

export const Source = z.object({
  id: z.string(), // `${kind}:${slug}` e.g. `blog:cloudflare`
  kind: SourceKind,
  slug: z.string(), // short stable name
  display_name: z.string(),
  weight: Weight,
  why: z.string(), // 1-line rationale
  url: z.string().optional(), // feed URL / API URL
  query: z.string().optional(), // for x_query / web_search
  handle: z.string().optional(), // for x_handle / bluesky / linkedin
  repo: z.string().optional(), // for gh_releases / spec_diff
  spec_cache_filename: z.string().optional(), // for spec_diff
});
export type Source = z.infer<typeof Source>;

// SourcesFile mirrors the legacy /agentsfirst-check sources.json shape —
// keep each sub-array as z.unknown() then narrow with per-entry schemas
// during flattening. Allows the on-disk file to evolve without forcing a
// schema bump for every new optional field.
export const SourcesFile = z.object({
  blogs: z.array(z.unknown()).optional(),
  x_handles: z.array(z.unknown()).optional(),
  x_queries: z.array(z.unknown()).optional(),
  github_releases: z.array(z.unknown()).optional(),
  web_searches: z.array(z.unknown()).optional(),
  spec_repos_to_diff: z.array(z.unknown()).optional(),
  bluesky_handles: z.array(z.unknown()).optional(),
  linkedin_handles: z.array(z.unknown()).optional(),
  hn_frontpage: z.boolean().optional(),
  mcp_registry: z.boolean().optional(),
  cf_ars: z.boolean().optional(),
  cf_portfolio_domains: z.array(z.string()).optional(),
});
export type SourcesFile = z.infer<typeof SourcesFile>;

// ─── Per-entry narrowing schemas (used inside flatten) ───────────────────────

const BlogEntry = z.object({
  name: z.string(),
  feed: z.string(),
  weight: Weight,
  why: z.string(),
});

const XHandleEntry = z.object({
  handle: z.string(),
  weight: Weight,
  note: z.string().optional(),
});

const XQueryEntry = z.object({
  query: z.string(),
  weight: Weight,
  why: z.string().optional(),
});

const GhReleaseEntry = z.object({
  repo: z.string(),
  weight: Weight,
  why: z.string().optional(),
});

const WebSearchEntry = z.object({
  query: z.string(),
  weight: Weight,
  why: z.string().optional(),
});

const SpecDiffEntry = z.object({
  url: z.string(),
  name: z.string(),
  weight: Weight.optional(),
  why: z.string().optional(),
});

const BlueskyHandleEntry = z.object({
  handle: z.string(),
  weight: Weight,
  note: z.string().optional(),
});

const LinkedInHandleEntry = z.object({
  handle: z.string(),
  weight: Weight,
  note: z.string().optional(),
  feed: z.string().optional(), // RSSHub URL override
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sha1Short(input: string): string {
  return createHash('sha1').update(input).digest('hex').slice(0, 10);
}

function slugifyHost(input: string): string {
  // Best-effort hostname extraction without throwing on malformed URLs.
  try {
    const u = new URL(input);
    return u.hostname.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  } catch {
    return sha1Short(input);
  }
}

function slugifyRepo(repo: string): string {
  return repo.replace(/[\/:]+/g, '_').toLowerCase();
}

function slugifyFilename(url: string): string {
  const tail = url.split('/').pop() ?? sha1Short(url);
  return tail.replace(/[^a-z0-9._-]+/gi, '_').toLowerCase();
}

function slugifyDomain(domain: string): string {
  return domain.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
}

function makeId(kind: SourceKind, slug: string): string {
  return `${kind}:${slug}`;
}

// ─── Flatten (legacy SourcesFile → Source[]) ────────────────────────────────

function flatten(file: SourcesFile): Source[] {
  const out: Source[] = [];

  for (const raw of file.blogs ?? []) {
    const e = BlogEntry.parse(raw);
    const slug = slugifyHost(e.feed);
    out.push({
      id: makeId('blog', slug),
      kind: 'blog',
      slug,
      display_name: e.name,
      weight: e.weight,
      why: e.why,
      url: e.feed,
    });
  }

  for (const raw of file.x_handles ?? []) {
    const e = XHandleEntry.parse(raw);
    const slug = e.handle.toLowerCase();
    out.push({
      id: makeId('x_handle', slug),
      kind: 'x_handle',
      slug,
      display_name: `@${e.handle}`,
      weight: e.weight,
      why: e.note ?? '',
      handle: e.handle,
    });
  }

  for (const raw of file.x_queries ?? []) {
    const e = XQueryEntry.parse(raw);
    const slug = sha1Short(e.query);
    out.push({
      id: makeId('x_query', slug),
      kind: 'x_query',
      slug,
      display_name: `x: ${e.query}`,
      weight: e.weight,
      why: e.why ?? '',
      query: e.query,
    });
  }

  for (const raw of file.github_releases ?? []) {
    const e = GhReleaseEntry.parse(raw);
    const slug = slugifyRepo(e.repo);
    out.push({
      id: makeId('gh_releases', slug),
      kind: 'gh_releases',
      slug,
      display_name: e.repo,
      weight: e.weight,
      why: e.why ?? '',
      repo: e.repo,
    });
  }

  for (const raw of file.spec_repos_to_diff ?? []) {
    const e = SpecDiffEntry.parse(raw);
    const slug = slugifyFilename(e.url);
    out.push({
      id: makeId('spec_diff', slug),
      kind: 'spec_diff',
      slug,
      display_name: e.name,
      weight: e.weight ?? 'high',
      why: e.why ?? 'spec change → rubric impact',
      url: e.url,
      spec_cache_filename: slug,
    });
  }

  for (const raw of file.web_searches ?? []) {
    const e = WebSearchEntry.parse(raw);
    const slug = sha1Short(e.query);
    out.push({
      id: makeId('web_search', slug),
      kind: 'web_search',
      slug,
      display_name: `web: ${e.query}`,
      weight: e.weight,
      why: e.why ?? '',
      query: e.query,
    });
  }

  for (const raw of file.bluesky_handles ?? []) {
    const e = BlueskyHandleEntry.parse(raw);
    const slug = e.handle.toLowerCase().replace(/[^a-z0-9._-]+/g, '_');
    out.push({
      id: makeId('bluesky', slug),
      kind: 'bluesky',
      slug,
      display_name: `bsky:${e.handle}`,
      weight: e.weight,
      why: e.note ?? '',
      handle: e.handle,
      url: `https://bsky.social/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(e.handle)}`,
    });
  }

  for (const raw of file.linkedin_handles ?? []) {
    const e = LinkedInHandleEntry.parse(raw);
    const slug = e.handle.toLowerCase().replace(/[^a-z0-9._-]+/g, '_');
    out.push({
      id: makeId('linkedin', slug),
      kind: 'linkedin',
      slug,
      display_name: `li:${e.handle}`,
      weight: e.weight,
      why: e.note ?? '',
      handle: e.handle,
      // Default RSSHub host comes from RADAR_RSSHUB_HOST env var (e.g.
      // set on joshhome to its Tailscale MagicDNS name). Resolved at fetch
      // time in fanout.ts; this URL is only used as a fallback.
      url: e.feed ?? `http://${process.env.RADAR_RSSHUB_HOST ?? 'localhost:1200'}/linkedin/profile/${encodeURIComponent(e.handle)}`,
    });
  }

  if (file.hn_frontpage === true) {
    out.push({
      id: makeId('hn_frontpage', 'default'),
      kind: 'hn_frontpage',
      slug: 'default',
      display_name: 'HN front page (points>=10)',
      weight: 'medium',
      why: 'Front-page filter catches breakout posts before search indexes them',
      url: 'https://hnrss.org/frontpage?count=50&points=10',
    });
  }

  if (file.mcp_registry === true) {
    out.push({
      id: makeId('mcp_registry', 'default'),
      kind: 'mcp_registry',
      slug: 'default',
      display_name: 'MCP registry commits',
      weight: 'high',
      why: 'Net-new MCP server adds per week — leading adopter indicator',
      url: 'https://github.com/modelcontextprotocol/registry/commits/main.atom',
    });
  }

  if (file.cf_ars === true) {
    out.push({
      id: makeId('cf_ars', 'top100'),
      kind: 'cf_ars',
      slug: 'top100',
      display_name: 'Cloudflare ARS top-100 scoreboard',
      weight: 'critical',
      why: 'Cleanest measurable signal of framework adoption movement',
      url: 'https://radar.cloudflare.com/api/v1/ai-agent-readiness?top=100',
    });
  }

  for (const domain of file.cf_portfolio_domains ?? []) {
    const slug = slugifyDomain(domain);
    out.push({
      id: makeId('cf_portfolio', slug),
      kind: 'cf_portfolio',
      slug,
      display_name: domain,
      weight: 'low',
      // QUARANTINED — runs in isolated subprocess, strictly typed output only.
      why: 'CF portfolio adopter signal (QUARANTINED subprocess; adversarial-incentive)',
      url: `https://${domain}`,
    });
  }

  return out;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Load and flatten the on-disk sources file. Returns an empty-default
 * bootstrap list if the file is missing. Throws on malformed JSON or zod
 * validation failure (fail-closed).
 *
 * @param path Optional absolute path. Defaults to DEFAULT_SOURCES_PATH.
 *
 * @remarks SECURITY — every returned Source field (slug, url, query, handle,
 * repo, etc.) is UNTRUSTED text. Callers MUST NOT pass these fields into
 * shell commands, eval, or any subprocess argv. Use stdin or a temp file.
 */
export async function loadSources(path: string = DEFAULT_SOURCES_PATH): Promise<Source[]> {
  let raw: string;
  try {
    raw = await fs.readFile(path, 'utf8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      return defaultSources();
    }
    throw err;
  }

  const parsed = JSON.parse(raw) as unknown;
  // Strip top-level metadata fields (_comment, _changelog) before zod parse —
  // SourcesFile schema doesn't allow unknown keys and we don't want to bake
  // documentation fields into the schema either.
  const cleaned: Record<string, unknown> = {};
  if (parsed && typeof parsed === 'object') {
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (!k.startsWith('_')) cleaned[k] = v;
    }
  }
  const file = SourcesFile.parse(cleaned);
  return flatten(file);
}

/**
 * In-memory bootstrap source list. Used when sources.json is absent on
 * disk (fresh clone, cold-start). Intentionally small (~15-20 sources) —
 * the on-disk file is the production list; this is just enough to keep
 * the radar runnable.
 */
export function defaultSources(): Source[] {
  return flatten(defaultSourcesFile());
}

/**
 * The legacy-shape SourcesFile that backs both defaultSources() and the
 * on-disk sources.json seed. Kept here so both stay in sync.
 */
export function defaultSourcesFile(): SourcesFile {
  return {
    blogs: [
      {
        name: 'Cloudflare blog',
        feed: 'https://blog.cloudflare.com/rss/',
        weight: 'high',
        why: 'Coined Agent Readiness Score; ships Content-Signal',
      },
      {
        name: 'Vercel blog',
        feed: 'https://vercel.com/atom',
        weight: 'high',
        why: 'Best-in-class L3 reference; v0 / AI SDK; AI Gateway production index',
      },
      {
        name: 'Latent.Space (swyx)',
        feed: 'https://www.latent.space/feed',
        weight: 'high',
        why: 'Top amplifier; covers MCP / agent ecosystem',
      },
      {
        name: 'Simon Willison',
        feed: 'https://simonwillison.net/atom/everything/',
        weight: 'high',
        why: 'First-mover on llms.txt + content-negotiation',
      },
      {
        name: 'model-context-protocol releases',
        feed: 'https://github.com/modelcontextprotocol/modelcontextprotocol/releases.atom',
        weight: 'high',
        why: 'Spec changes affect rubric scoring',
      },
    ],
    x_handles: [
      { handle: 'swyx', weight: 'high', note: 'Latent.Space; flagged amplifier' },
      { handle: 'simonw', weight: 'high', note: 'llms.txt evangelist' },
      { handle: 'AnthropicAI', weight: 'high', note: 'MCP product announcements' },
      { handle: 'cloudflare', weight: 'medium', note: 'Agent Readiness / Content-Signal updates' },
    ],
    x_queries: [
      {
        query: '"agents first" lang:en min_replies:1',
        weight: 'critical',
        why: 'Direct mentions of the framework',
      },
      {
        query: 'agentsfirst.dev lang:en',
        weight: 'critical',
        why: 'Direct site mentions',
      },
      {
        query: '"AGENTS.md" lang:en min_replies:1',
        weight: 'high',
        why: 'Contract-first artifact adoption signal',
      },
    ],
    github_releases: [
      {
        repo: 'modelcontextprotocol/modelcontextprotocol',
        weight: 'critical',
        why: 'Spec changes change the rubric',
      },
      {
        repo: 'AnswerDotAI/llms-txt',
        weight: 'high',
        why: '/llms.txt format spec',
      },
    ],
    web_searches: [
      {
        query: '"agents first" framework OR thesis -site:agentsfirst.dev',
        weight: 'critical',
      },
    ],
    spec_repos_to_diff: [
      {
        url: 'https://raw.githubusercontent.com/AnswerDotAI/llms-txt/main/README.md',
        name: 'llms.txt spec README',
        weight: 'high',
      },
    ],
    bluesky_handles: [
      { handle: 'simonw.bsky.social', weight: 'high', note: 'Simon Willison on Bluesky' },
      { handle: 'swyx.bsky.social', weight: 'high', note: 'swyx on Bluesky' },
      { handle: 'maggieappleton.com', weight: 'medium', note: 'Maggie Appleton on Bluesky' },
    ],
    linkedin_handles: [
      { handle: 'swyx', weight: 'medium', note: 'swyx LinkedIn cross-posts' },
      { handle: 'maggieappleton', weight: 'medium', note: 'Maggie Appleton LinkedIn' },
    ],
    hn_frontpage: true,
    mcp_registry: true,
    cf_ars: true,
    cf_portfolio_domains: [],
  };
}
