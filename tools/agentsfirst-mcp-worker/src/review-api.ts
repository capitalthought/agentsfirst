// Public self-serve website reviewer.
//
//   POST /api/review        { url, turnstileToken? } → score + shareable token
//   GET  /r/<token>         server-rendered result page (noindex, ephemeral)
//   GET  /r/<token>/og.png  favicon + level-color share card
//
// Reuses the existing scoring engine (probeWebsite + scoreWebsite). Scoring is
// free + deterministic, so rate limits exist to stop bot-floods + SSRF abuse,
// not to protect an API bill. Results live in KV with a 90-day TTL and are
// never committed to the repo (distinct from the curated /scores/ pages).

import { probeWebsite } from './probe-website.js';
import { scoreWebsite, type WebsiteScore } from './score.js';
import { guardReviewUrl } from './ssrf-guard.js';
import { renderResultCard } from './og-card.js';

export interface ReviewEnv {
  REVIEWS?: KVNamespace;
  TURNSTILE_SECRET?: string;
  SCORE_EVENTS?: AnalyticsEngineDataset;
}

// ─── tunables (watch real traffic, then adjust) ─────────────────────────────
const BURST_FREE = 3; // reviews per IP in BURST_WINDOW before Turnstile kicks in
const BURST_WINDOW_S = 600; // 10 min
const HOURLY_CAP = 30;
const DAILY_CAP = 100;
const GLOBAL_DAILY_CAP = 3000;
const RESULT_TTL_S = 90 * 24 * 3600; // 90 days

const LEVEL_ACCENT: Record<number, string> = {
  0: '#f85149',
  1: '#fb8500',
  2: '#d29922',
  3: '#2da44e',
  4: '#58a6ff',
};

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
};

function apiJson(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

function token12(): string {
  const b = new Uint8Array(6);
  crypto.getRandomValues(b);
  return Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function recordScoreEvent(env: ReviewEnv, hostnameHash: string, level: number, score: number): void {
  if (!env.SCORE_EVENTS) return;
  try {
    env.SCORE_EVENTS.writeDataPoint({
      indexes: [new Date().toISOString().slice(0, 10)],
      blobs: [hostnameHash, String(level), 'web'],
      doubles: [score],
    });
  } catch {
    /* telemetry never breaks scoring */
  }
}

// Best-effort KV counter with TTL. Non-atomic (read→incr→write) — fine for
// rate limiting. Returns the post-increment count.
async function bump(kv: KVNamespace, key: string, ttl: number): Promise<number> {
  const cur = Number((await kv.get(key)) ?? '0') + 1;
  await kv.put(key, String(cur), { expirationTtl: ttl });
  return cur;
}
async function peek(kv: KVNamespace, key: string): Promise<number> {
  return Number((await kv.get(key)) ?? '0');
}

async function verifyTurnstile(secret: string, token: string, ip: string): Promise<boolean> {
  try {
    const body = new FormData();
    body.append('secret', secret);
    body.append('response', token);
    if (ip) body.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

interface StoredReview extends WebsiteScore {
  url: string;
  hostname: string;
  created: string;
}

// ─── POST /api/review ───────────────────────────────────────────────────────
export async function handleReview(request: Request, env: ReviewEnv): Promise<Response> {
  if (request.method !== 'POST') return apiJson({ error: 'method_not_allowed' }, 405);
  if (!env.REVIEWS) return apiJson({ error: 'storage_unavailable' }, 503);

  let payload: { url?: string; turnstileToken?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return apiJson({ error: 'invalid_json' }, 400);
  }
  if (!payload.url || typeof payload.url !== 'string') {
    return apiJson({ error: 'missing_url' }, 400);
  }

  const guard = guardReviewUrl(payload.url);
  if (!guard.ok) {
    return apiJson({ error: 'blocked_host', reason: guard.reason }, 400);
  }
  const url = guard.url!;
  const hostname = guard.hostname!;

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const day = new Date().toISOString().slice(0, 10);
  const kv = env.REVIEWS;

  // Hard caps first.
  const [hr, dy, glob, burst] = await Promise.all([
    peek(kv, `rl:hr:${ip}`),
    peek(kv, `rl:day:${ip}`),
    peek(kv, `rl:global:${day}`),
    peek(kv, `rl:burst:${ip}`),
  ]);
  if (hr >= HOURLY_CAP || dy >= DAILY_CAP) {
    return apiJson({ error: 'rate_limited', scope: 'ip', retry: 'later' }, 429);
  }
  if (glob >= GLOBAL_DAILY_CAP) {
    return apiJson({ error: 'rate_limited', scope: 'global', retry: 'tomorrow' }, 429);
  }

  // Free burst, then Turnstile.
  if (burst >= BURST_FREE) {
    if (!env.TURNSTILE_SECRET) {
      // Misconfig: don't lock everyone out — allow but flag in logs.
      console.warn('TURNSTILE_SECRET unset; burst gate disabled');
    } else if (!payload.turnstileToken) {
      return apiJson({ error: 'turnstile_required' }, 429);
    } else if (!(await verifyTurnstile(env.TURNSTILE_SECRET, payload.turnstileToken, ip))) {
      return apiJson({ error: 'turnstile_failed' }, 403);
    }
  }

  // Score (the existing free, deterministic engine).
  let score: WebsiteScore;
  try {
    const signals = await probeWebsite(url);
    score = scoreWebsite(signals);
  } catch (err) {
    return apiJson({ error: 'probe_failed', detail: (err as Error).message }, 502);
  }

  // Persist + telemetry + counters.
  const tok = token12();
  const record: StoredReview = { ...score, url, hostname, created: new Date().toISOString() };
  await kv.put(`r:${tok}`, JSON.stringify(record), { expirationTtl: RESULT_TTL_S });

  try {
    recordScoreEvent(env, await sha256Hex(hostname), score.level, score.score);
  } catch {
    /* ignore */
  }
  // best-effort counters (don't block the response on these)
  await Promise.all([
    bump(kv, `rl:burst:${ip}`, BURST_WINDOW_S),
    bump(kv, `rl:hr:${ip}`, 3600),
    bump(kv, `rl:day:${ip}`, 86400),
    bump(kv, `rl:global:${day}`, 86400),
  ]);

  return apiJson({
    ok: true,
    token: tok,
    path: `/r/${tok}`,
    hostname,
    score: score.score,
    level: score.level,
    level_name: score.level_name,
    dimensions: score.dimensions,
    anti_patterns_flagged: score.anti_patterns_flagged,
    top_moves: score.top_moves,
  });
}

// ─── GET /r/<token> + /r/<token>/og.png ─────────────────────────────────────
export async function handleResultRoute(
  request: Request,
  env: ReviewEnv,
  pathname: string,
): Promise<Response> {
  if (!env.REVIEWS) return new Response('storage unavailable', { status: 503 });
  const m = /^\/r\/([0-9a-f]{12})(\/og\.png)?\/?$/.exec(pathname);
  if (!m) return new Response('Not found', { status: 404 });
  const tok = m[1]!;
  const wantsOg = !!m[2];

  const raw = await env.REVIEWS.get(`r:${tok}`);
  if (!raw) {
    return wantsOg
      ? Response.redirect('https://agentsfirst.dev/og-image.png', 302)
      : notFoundPage();
  }
  const rec = JSON.parse(raw) as StoredReview;

  if (wantsOg) {
    try {
      const png = await renderResultCard({ hostname: rec.hostname, score: rec.score, level: rec.level });
      return new Response(png, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (err) {
      console.error('og render failed', (err as Error).message);
      return Response.redirect('https://agentsfirst.dev/og-image.png', 302);
    }
  }

  return new Response(resultPage(tok, rec), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}

// ─── HTML ───────────────────────────────────────────────────────────────────
function esc(s: string): string {
  return s.replace(/[<>&"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : '&quot;',
  );
}

function notFoundPage(): Response {
  return new Response(
    `<!doctype html><meta charset=utf-8><meta name=robots content=noindex>
<title>Score not found — Agents First</title>
<style>body{font:16px/1.6 system-ui;background:#0d1117;color:#c9d1d9;max-width:640px;margin:5rem auto;padding:0 1.25rem;text-align:center}a{color:#2da44e}</style>
<h1>This score expired or never existed</h1>
<p>Self-serve scores are kept for 90 days. <a href="/review">Score a site</a>.</p>`,
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

function resultPage(tok: string, r: StoredReview): string {
  const accent = LEVEL_ACCENT[r.level] ?? '#2da44e';
  const shareUrl = `https://agentsfirst.dev/r/${tok}`;
  const ogUrl = `${shareUrl}/og.png`;
  const desc = `Score: ${r.score}/100 · Level ${r.level} (${r.level_name}). Agents First readiness for ${r.hostname}.`;

  const dimRows = Object.entries(r.dimensions)
    .map(([k, d]) => {
      const icon = d.status === 'pass' ? '✅' : d.status === 'partial' ? '⚠️' : '❌';
      const name = k.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const note = d.notes && d.notes.length ? esc(d.notes[0]!) : '';
      return `<tr><td>${icon}</td><td>${esc(name)}</td><td class=pts>${d.pts}/${d.max}</td><td class=note>${note}</td></tr>`;
    })
    .join('');

  const flags = (r.anti_patterns_flagged || [])
    .map((f) => `<li><strong>${esc(f.name)}</strong> — ${esc(f.evidence)}</li>`)
    .join('');

  const moves = (r.top_moves || [])
    .map((mv) => `<li><strong>+${mv.gap_pts} pts</strong> — ${esc(mv.action)}</li>`)
    .join('');

  return `<!doctype html>
<html lang=en><head>
<meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<meta name=robots content="noindex,nofollow">
<title>${esc(r.hostname)} — ${r.score}/100 · Agents First Score</title>
<meta name=description content="${esc(desc)}">
<meta property="og:title" content="${esc(r.hostname)} — Agents First Score">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${ogUrl}">
<meta property="og:url" content="${shareUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${ogUrl}">
<style>
  *{box-sizing:border-box} body{font:16px/1.6 -apple-system,system-ui,sans-serif;background:#0d1117;color:#c9d1d9;margin:0}
  .wrap{max-width:760px;margin:0 auto;padding:48px 20px 72px}
  .top{display:flex;align-items:center;gap:14px;margin-bottom:8px}
  .host{font-size:26px;font-weight:700;color:#f0f6fc;word-break:break-all}
  .score{font-size:84px;font-weight:800;line-height:1.05;color:${accent};margin:10px 0 0}
  .level{font-size:20px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:.5px;margin-bottom:28px}
  table{width:100%;border-collapse:collapse;margin:8px 0 28px}
  td{padding:9px 8px;border-bottom:1px solid #21262d;vertical-align:top}
  td.pts{text-align:right;font-variant-numeric:tabular-nums;color:#8b949e;white-space:nowrap}
  td.note{color:#8b949e;font-size:14px}
  h2{font-size:15px;text-transform:uppercase;letter-spacing:.5px;color:#8b949e;margin:28px 0 8px}
  ul{padding-left:20px} li{margin:6px 0}
  .actions{display:flex;gap:12px;flex-wrap:wrap;margin:36px 0 8px}
  a.btn,button.btn{display:inline-block;background:#2da44e;color:#fff;border:0;border-radius:8px;padding:11px 18px;font-size:15px;font-weight:600;cursor:pointer;text-decoration:none}
  a.ghost{background:transparent;border:1px solid #30363d;color:#c9d1d9}
  .muted{color:#6e7681;font-size:13px;margin-top:18px}
  a{color:#58a6ff}
</style>
</head><body><div class=wrap>
  <div class=top><div class=host>${esc(r.hostname)}</div></div>
  <div class=score>${r.score} / 100</div>
  <div class=level>Level ${r.level} — ${esc(r.level_name)}</div>

  <h2>Dimensions</h2>
  <table>${dimRows}</table>

  ${flags ? `<h2>Anti-patterns flagged</h2><ul>${flags}</ul>` : ''}
  ${moves ? `<h2>Top moves to climb a level</h2><ul>${moves}</ul>` : ''}

  <div class=actions>
    <a class=btn href="/review">Score another site</a>
    <button class="btn ghost" onclick="navigator.clipboard.writeText('${shareUrl}').then(()=>{this.textContent='Link copied ✓'})">Copy share link</button>
    <a class="btn ghost" href="https://agentsfirst.dev/principles/">The framework</a>
  </div>
  <p class=muted>Scored against the <a href="https://agentsfirst.dev">Agents First</a> framework · self-serve scores are kept 90 days.</p>
</div></body></html>`;
}
