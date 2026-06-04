// OG card renderer for self-serve review results.
//
// Renders a 1200x630 PNG in the Worker via @resvg/resvg-wasm from a hand-written
// SVG. Matches the per-page card style (tools/og-card/generate.py) but uses the
// LEVEL color for accents instead of an extracted brand color — favicon + score.
//
// resvg init + the font buffer are module-level singletons. Any failure throws;
// the caller (review-api) falls back to the static /og-image.png so og:image
// always resolves.

import { initWasm, Resvg } from '@resvg/resvg-wasm';
// wrangler bundles these: .wasm → WebAssembly.Module, .ttf → ArrayBuffer (Data rule).
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm';
import fontBold from './assets/DejaVuSans-Bold.ttf';

const W = 1200;
const H = 630;
const BG = '#0d1117';
const WHITE = '#ffffff';
const MUTED = '#b4bcc4';
const BRAND_GREEN = '#2da44e';

const LEVEL_COLORS: Record<number, string> = {
  0: '#f85149',
  1: '#fb8500',
  2: '#d29922',
  3: '#2da44e',
  4: '#58a6ff',
};
const LEVEL_NAMES: Record<number, string> = {
  0: 'No Agent Access',
  1: 'Agent as Afterthought',
  2: 'Agent-Aware',
  3: 'Agents First',
  4: 'Agent-Driven',
};

let wasmReady: Promise<unknown> | null = null;
function ensureWasm(): Promise<unknown> {
  if (!wasmReady) wasmReady = initWasm(resvgWasm as WebAssembly.Module);
  return wasmReady;
}

function esc(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;',
  );
}

// Best-effort favicon as a data URI for embedding in the SVG <image>. resvg
// renders embedded png/jpeg/gif data URIs; ico often won't, so prefer the PNG
// sources. Returns null on any failure (card renders without the mark).
async function faviconDataUri(hostname: string): Promise<string | null> {
  const sources = [
    `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
    `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
  ];
  for (const url of sources) {
    try {
      const res = await fetch(url, { cf: { cacheTtl: 86400, cacheEverything: true } } as RequestInit);
      if (!res.ok) continue;
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      // resvg won't decode .ico — skip those.
      if (ct.includes('icon') || ct.includes('x-icon')) continue;
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength < 100) continue;
      const mime = ct.includes('jpeg') || ct.includes('jpg') ? 'image/jpeg' : 'image/png';
      let bin = '';
      for (const byte of buf) bin += String.fromCharCode(byte);
      return `data:${mime};base64,${btoa(bin)}`;
    } catch {
      /* try next source */
    }
  }
  return null;
}

function buildSvg(opts: {
  hostname: string;
  score: number;
  level: number;
  faviconUri: string | null;
}): string {
  const accent = LEVEL_COLORS[opts.level] ?? BRAND_GREEN;
  const levelName = (LEVEL_NAMES[opts.level] ?? '').toUpperCase();
  const host = esc(opts.hostname);
  const hasIcon = !!opts.faviconUri;
  const nameX = hasIcon ? 160 : 60;
  const FONT = 'DejaVu Sans';

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect x="0" y="0" width="${W}" height="8" fill="${accent}"/>
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="${accent}"/>
  ${hasIcon ? `<image x="60" y="44" width="76" height="76" href="${opts.faviconUri}" preserveAspectRatio="xMidYMid meet"/>` : ''}
  <text x="${nameX}" y="98" font-family="${FONT}" font-weight="bold" font-size="46" fill="${WHITE}">${host}</text>
  <text x="${W - 60}" y="96" text-anchor="end" font-family="${FONT}" font-size="26" fill="${MUTED}">agentsfirst.dev</text>
  <rect x="60" y="150" width="${W - 120}" height="6" fill="${accent}"/>
  <text x="60" y="214" font-family="${FONT}" font-weight="bold" font-size="26" fill="${BRAND_GREEN}">AGENTS FIRST SCORE</text>
  <text x="${W / 2}" y="430" text-anchor="middle" font-family="${FONT}" font-weight="bold" font-size="170" fill="${accent}">${opts.score} / 100</text>
  <text x="${W / 2}" y="520" text-anchor="middle" font-family="${FONT}" font-weight="bold" font-size="40" fill="${accent}">LEVEL ${opts.level} — ${esc(levelName)}</text>
</svg>`;
}

export async function renderResultCard(opts: {
  hostname: string;
  score: number;
  level: number;
}): Promise<Uint8Array> {
  await ensureWasm();
  const faviconUri = await faviconDataUri(opts.hostname);
  const svg = buildSvg({ ...opts, faviconUri });
  const resvg = new Resvg(svg, {
    background: BG,
    font: {
      fontBuffers: [new Uint8Array(fontBold as ArrayBuffer)],
      defaultFontFamily: 'DejaVu Sans',
      loadSystemFonts: false,
    },
  });
  return resvg.render().asPng();
}
