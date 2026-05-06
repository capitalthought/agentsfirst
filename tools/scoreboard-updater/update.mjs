#!/usr/bin/env node
// update.mjs — re-score every target in /reports/<slug>/ via the live MCP scorer
// at agentsfirst.dev/mcp, update each report's front matter + scoring-data.json,
// regenerate the /reports/index.md scoreboard.
//
// Usage:
//   node tools/scoreboard-updater/update.mjs              # update all targets
//   node tools/scoreboard-updater/update.mjs --dry-run    # show what would change, don't write
//   node tools/scoreboard-updater/update.mjs --slug=vercel  # update one target only
//
// Run by .github/workflows/update-reports.yml on a weekly cron.

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const REPORTS_DIR = path.join(REPO_ROOT, 'reports');
const MCP_ENDPOINT = process.env.MCP_ENDPOINT || 'https://agentsfirst.dev/mcp';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY_SLUG = args.find((a) => a.startsWith('--slug='))?.split('=')[1] ?? null;

const LEVELS = [
  { min: 0, max: 10, level: 0, name: 'No agent access' },
  { min: 11, max: 25, level: 1, name: 'Agent as Afterthought' },
  { min: 26, max: 60, level: 2, name: 'Agent-Aware' },
  { min: 61, max: 85, level: 3, name: 'Agents First' },
  { min: 86, max: 100, level: 4, name: 'Agent-Driven' },
];

function levelFor(score) {
  return LEVELS.find((l) => score >= l.min && score <= l.max) ?? LEVELS[0];
}

async function callScoreWebsite(url) {
  const res = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'score_website',
        arguments: { url },
      },
    }),
  });
  if (!res.ok) throw new Error(`MCP returned ${res.status} for ${url}`);
  const text = await res.text();
  // SSE-format fallback (in case enableJsonResponse is off)
  let payload;
  if (text.startsWith('event:') || text.startsWith('data:')) {
    const data = text
      .split('\n')
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim())
      .join('');
    payload = JSON.parse(data);
  } else {
    payload = JSON.parse(text);
  }
  if (payload.error) throw new Error(`MCP error: ${payload.error.message}`);
  const inner = payload.result?.content?.[0]?.text;
  if (!inner) throw new Error('MCP response missing result.content[0].text');
  return JSON.parse(inner);
}

function stripBodies(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(stripBodies);
    return;
  }
  if (obj && typeof obj === 'object') {
    if ('body' in obj) {
      delete obj.body;
      if ('truncated' in obj) delete obj.truncated;
    }
    for (const v of Object.values(obj)) stripBodies(v);
  }
}

function updateFrontMatter(md, updates) {
  const fmMatch = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) return md;
  let fm = fmMatch[1];
  for (const [key, value] of Object.entries(updates)) {
    const re = new RegExp(`^${key}:.*$`, 'm');
    if (re.test(fm)) {
      fm = fm.replace(re, `${key}: ${value}`);
    } else {
      fm += `\n${key}: ${value}`;
    }
  }
  return md.replace(fmMatch[0], `---\n${fm}\n---\n`);
}

async function processSlug(slug) {
  const dir = path.join(REPORTS_DIR, slug);
  const dataPath = path.join(dir, 'scoring-data.json');
  const indexPath = path.join(dir, 'index.md');

  if (!existsSync(dataPath) || !existsSync(indexPath)) {
    console.error(`  ✗ ${slug}: missing scoring-data.json or index.md, skipping`);
    return null;
  }

  const data = JSON.parse(await readFile(dataPath, 'utf8'));
  const urls = Object.keys(data).filter((k) => /^https?:\/\//.test(k));
  if (urls.length === 0) {
    console.error(`  ✗ ${slug}: scoring-data.json has no http URLs to re-probe`);
    return null;
  }

  console.error(`  · ${slug}: probing ${urls.length} surface(s)…`);

  const newData = {
    _meta: {
      ...(data._meta ?? {}),
      last_refreshed: new Date().toISOString(),
      updater: 'tools/scoreboard-updater/update.mjs',
    },
  };

  let headlineScore = -1;
  let headlineLevel = null;
  let headlineUrl = null;

  for (const url of urls) {
    try {
      const result = await callScoreWebsite(url);
      stripBodies(result);
      newData[url] = result;
      if (typeof result.score === 'number' && result.score > headlineScore) {
        headlineScore = result.score;
        headlineLevel = result.level ?? levelFor(result.score).level;
        headlineUrl = url;
      }
    } catch (e) {
      console.error(`    ⚠️  ${url}: ${e.message}`);
      newData[url] = { error: e.message, scored_at: new Date().toISOString() };
    }
  }

  if (headlineScore < 0) {
    console.error(`  ✗ ${slug}: every URL failed to score`);
    return null;
  }

  // Read current front-matter score; only flag a change if it moved
  const md = await readFile(indexPath, 'utf8');
  const oldScoreMatch = md.match(/^report_score:\s*(\d+)/m);
  const oldScore = oldScoreMatch ? parseInt(oldScoreMatch[1], 10) : null;
  const oldLevelMatch = md.match(/^report_level:\s*(\d+)/m);
  const oldLevel = oldLevelMatch ? parseInt(oldLevelMatch[1], 10) : null;

  const today = new Date().toISOString().slice(0, 10);
  const updatedMd = updateFrontMatter(md, {
    report_score: headlineScore,
    report_level: headlineLevel,
    report_date: today,
  });

  if (DRY_RUN) {
    console.error(
      `    [dry-run] ${slug}: ${oldScore} → ${headlineScore} (Level ${oldLevel} → ${headlineLevel}) on ${headlineUrl}`,
    );
  } else {
    await writeFile(dataPath, JSON.stringify(newData, null, 2));
    await writeFile(indexPath, updatedMd);
    if (oldScore !== headlineScore || oldLevel !== headlineLevel) {
      console.error(
        `    ↻ ${slug}: ${oldScore} → ${headlineScore} (Level ${oldLevel} → ${headlineLevel}) on ${headlineUrl}`,
      );
    } else {
      console.error(`    = ${slug}: ${headlineScore} (no change)`);
    }
  }

  return {
    slug,
    score: headlineScore,
    level: headlineLevel,
    levelName: levelFor(headlineScore).name,
    url: headlineUrl,
    date: today,
    moved: oldScore !== headlineScore || oldLevel !== headlineLevel,
    oldScore,
    oldLevel,
  };
}

async function regenerateScoreboard(rows) {
  const indexPath = path.join(REPORTS_DIR, 'index.md');
  const current = await readFile(indexPath, 'utf8');

  // Sort by score descending; ties by alphabetical slug
  rows.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));

  // Get human-friendly names from existing report front matter
  const namesBy = {};
  for (const row of rows) {
    const md = await readFile(path.join(REPORTS_DIR, row.slug, 'index.md'), 'utf8');
    const m = md.match(/^report_target:\s*(.+)$/m);
    namesBy[row.slug] = m ? m[1].replace(/^["']|["']$/g, '').trim() : row.slug;
  }

  const tableLines = [
    '| Date | Target | Score | Level | Read |',
    '|---|---|---:|---:|---|',
    ...rows.map(
      (r) =>
        `| ${r.date} | ${namesBy[r.slug]} | **${r.score}** | ${r.level} — ${r.levelName} | [Read →](/reports/${r.slug}/) |`,
    ),
  ].join('\n');

  // Replace the existing table block. We bracket between "## Reports" and the next "## ".
  const replaced = current.replace(
    /(## Reports\n[\s\S]*?\n)(\| Date \| Target[\s\S]*?\n)(?=\n\*\*|\n## )/,
    (_full, header) =>
      `${header}Auto-updated weekly via the live scorer at <${MCP_ENDPOINT}>. Last refresh: **${new Date().toISOString().slice(0, 10)}**. Sorted by score descending.\n\n${tableLines}\n`,
  );

  // Drop the explainer line that references the first batch + replace if older variant present
  const finalMd = replaced.replace(
    /^The first batch \(10 scorecards\) shipped[^\n]*\n/m,
    '',
  );

  if (DRY_RUN) {
    console.error('[dry-run] would rewrite /reports/index.md scoreboard');
  } else if (finalMd !== current) {
    await writeFile(indexPath, finalMd);
    console.error('  ↻ /reports/index.md scoreboard regenerated');
  } else {
    console.error('  = /reports/index.md unchanged');
  }
}

// ─── main ──────────────────────────────────────────────────────────────────────

const entries = await readdir(REPORTS_DIR, { withFileTypes: true });
let slugs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
if (ONLY_SLUG) slugs = slugs.filter((s) => s === ONLY_SLUG);

if (slugs.length === 0) {
  console.error('No report slugs found.');
  process.exit(1);
}

console.error(`Scoreboard updater · ${slugs.length} slug(s) · MCP=${MCP_ENDPOINT} · ${DRY_RUN ? 'DRY-RUN' : 'LIVE'}`);
console.error('');

const rows = [];
for (const slug of slugs) {
  const r = await processSlug(slug);
  if (r) rows.push(r);
}

console.error('');
await regenerateScoreboard(rows);

const moved = rows.filter((r) => r.moved);
console.error('');
console.error(`Done. ${rows.length} target(s) processed; ${moved.length} score change(s).`);

// Emit machine-readable summary on stdout (for the GH Action to use)
console.log(
  JSON.stringify({
    refreshed_at: new Date().toISOString(),
    targets: rows.length,
    moved: moved.length,
    movements: moved.map((r) => ({
      slug: r.slug,
      from: { score: r.oldScore, level: r.oldLevel },
      to: { score: r.score, level: r.level },
    })),
  }),
);
