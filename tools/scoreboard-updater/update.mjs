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
// When a score moves, regenerate body prose + x-thread + linkedin + courtesy-dm
// via Anthropic API so per-file score references don't drift from the front
// matter (the prose-drift bug surfaced by the Cloudflare re-score 2026-05-14).
// Disable with DISABLE_PROSE_REGEN=1 for cheap dry-loops.
const PROSE_REGEN_ENABLED =
  process.env.DISABLE_PROSE_REGEN !== '1' && !args.includes('--no-prose-regen');
// Force prose regen even if the score didn't move. Useful for ops when a
// target's content facts change without a score change, or for one-time
// smoke tests after editing the regen prompt. Cron never sets this.
const FORCE_PROSE_REGEN =
  args.includes('--force-regen') || process.env.FORCE_PROSE_REGEN === '1';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-7';

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

// ─── Prose regen (Anthropic API, native fetch) ────────────────────────────────

async function callAnthropic({ system, user, maxTokens = 16384 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY env var is unset');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Anthropic response missing content[0].text');
  // Truncation guard — refuse to write a half-output. 4096 was previously
  // too small for index.md and produced mid-sentence cutoffs that the cron
  // would have committed to main.
  if (data?.stop_reason === 'max_tokens') {
    throw new Error(
      `Anthropic response hit max_tokens (${maxTokens}); refusing to write truncated output. Bump maxTokens or shorten the input.`,
    );
  }
  return text;
}

function summarizeScoringData(data) {
  const urls = Object.keys(data).filter((k) => /^https?:\/\//.test(k));
  return urls
    .map((url) => {
      const r = data[url];
      if (r?.error) return `- ${url} — ERROR: ${r.error}`;
      const lvl =
        typeof r?.level === 'number'
          ? `Level ${r.level}${r.level_name ? ` (${r.level_name})` : ''}`
          : 'Level ?';
      return `- ${url} — Score ${r?.score ?? '?'}/100, ${lvl}`;
    })
    .join('\n');
}

const SYSTEM_PROMPTS = {
  'index.md':
    'You are revising an Agent Readiness Report on agentsfirst.dev. Preserve the existing voice (direct, no filler, technical rigor blended with candor) and the existing structure (per-surface narrative, "What\'s working", "Top fixes"). Update every score reference, level reference, and per-surface number to reflect the NEW scoring summary. Keep non-score factual claims (what artifacts exist, who shipped what, anti-patterns observed) IF they still hold under the new scoring — if they directly contradict the new score, surface the contradiction explicitly in prose. Do NOT touch the YAML front matter; it is handled separately. Return only the markdown body that follows the front matter, no preamble.',
  'x-thread.md':
    'You are revising the X-thread companion to an Agent Readiness Report. Preserve the structural framing (header comments, tweet count, per-tweet char-count annotations, tagging rules). Update tweet bodies to reflect the new scores. Each tweet body stays ≤280 chars (the char count headers must be updated too). Tag handles have been verified — preserve them verbatim. Return the full revised file content, no preamble.',
  'linkedin.md':
    'You are revising the LinkedIn post companion to an Agent Readiness Report. Update score references throughout. Preserve voice + verified tags + structure. Return the full revised file content, no preamble.',
  'courtesy-dm.md':
    'You are revising the courtesy-DM companion to an Agent Readiness Report. The DM is sent privately to the target company 12-24h BEFORE the public posts; the tone is warm + specific + not-an-ambush. Update score references and any per-surface numbers. Preserve recipient list + fallback list + tone notes. Return the full revised file content, no preamble.',
};

// Static blocks that we carve out of `index.md` BEFORE sending to the LLM and
// re-append after — both saves tokens AND prevents the LLM from accidentally
// rewriting/dropping these blocks. The markers below are exact substrings that
// must appear in every report's index.md if it has these sections.
const INDEX_TRAILER_MARKERS = [
  '\n---\n\n*Part of Agent Readiness Reports', // methodology footer + Giscus widget marker
];

function splitOffTrailer(body) {
  for (const marker of INDEX_TRAILER_MARKERS) {
    const idx = body.indexOf(marker);
    if (idx >= 0) {
      return { lead: body.slice(0, idx), trailer: body.slice(idx) };
    }
  }
  return { lead: body, trailer: '' };
}

async function regenerateFile({ filePath, fileName, scoringData, target, today }) {
  const current = await readFile(filePath, 'utf8');
  const summary = summarizeScoringData(scoringData);
  const preserveFrontMatter = fileName === 'index.md';

  let frontMatter = '';
  let body = current;
  if (preserveFrontMatter) {
    const fmMatch = current.match(/^---\n[\s\S]*?\n---\n/);
    if (fmMatch) {
      frontMatter = fmMatch[0];
      body = current.slice(fmMatch[0].length);
    }
  }

  // For index.md, carve out the static trailer (methodology footer + Giscus
  // widget) so the LLM only rewrites the live narrative portion.
  let trailer = '';
  if (fileName === 'index.md') {
    const split = splitOffTrailer(body);
    body = split.lead;
    trailer = split.trailer;
  }

  const system = SYSTEM_PROMPTS[fileName];
  if (!system) throw new Error(`No system prompt registered for ${fileName}`);

  const user = `Target: ${target}\nToday's date: ${today}\n\nNew scoring summary (the source of truth):\n${summary}\n\nCurrent content of \`${fileName}\` (update score-dependent claims; preserve voice + structure):\n\n\`\`\`\n${body}\n\`\`\``;

  const revised = await callAnthropic({ system, user });
  const cleaned = revised.replace(/^```(?:markdown)?\n?/, '').replace(/\n?```$/, '');
  const reassembled = preserveFrontMatter
    ? frontMatter + cleaned.trimStart() + trailer
    : cleaned;
  return reassembled;
}

async function regenerateReportProse({ slug, dir, scoringData, target }) {
  if (!PROSE_REGEN_ENABLED) {
    console.error(`    ↪ ${slug}: prose regen disabled, skipping`);
    return { regenerated: 0, errors: 0 };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(`    ⚠️  ${slug}: ANTHROPIC_API_KEY unset, skipping prose regen`);
    return { regenerated: 0, errors: 1 };
  }

  const today = new Date().toISOString().slice(0, 10);
  const files = ['index.md', 'x-thread.md', 'linkedin.md', 'courtesy-dm.md'];
  let regenerated = 0;
  let errors = 0;

  for (const fileName of files) {
    const filePath = path.join(dir, fileName);
    if (!existsSync(filePath)) {
      console.error(`    ↪ ${slug}/${fileName}: not present, skipping`);
      continue;
    }
    try {
      console.error(`    🪄 regenerating ${slug}/${fileName} via ${ANTHROPIC_MODEL}…`);
      const out = await regenerateFile({ filePath, fileName, scoringData, target, today });
      if (!DRY_RUN) await writeFile(filePath, out);
      console.error(
        `    ✓ ${slug}/${fileName} ${DRY_RUN ? '[dry-run] ' : ''}rewritten (${out.length} chars)`,
      );
      regenerated += 1;
    } catch (e) {
      console.error(`    ⚠️  ${slug}/${fileName} regen failed: ${e.message}`);
      errors += 1;
    }
  }
  return { regenerated, errors };
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

  // Capture pre-run per-URL scores so we can detect ANY surface movement
  // (not just headline) when deciding whether to regenerate prose.
  const oldPerUrlScores = {};
  for (const url of urls) {
    const s = data[url]?.score;
    if (typeof s === 'number') oldPerUrlScores[url] = s;
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

  // "Moved" fires on ANY surface score change, not just headline. The
  // previous bug: blog dropped 15→0 but headline stayed 85, so the script
  // skipped regen and the body kept claiming "blog 15".
  let perUrlMoved = false;
  for (const url of urls) {
    const oldS = oldPerUrlScores[url];
    const newS = newData[url]?.score;
    if (typeof newS === 'number' && typeof oldS === 'number' && newS !== oldS) {
      perUrlMoved = true;
      console.error(
        `    · ${slug} surface change: ${url} ${oldS} → ${newS}`,
      );
    }
  }
  const moved =
    oldScore !== headlineScore || oldLevel !== headlineLevel || perUrlMoved;

  if (DRY_RUN) {
    console.error(
      `    [dry-run] ${slug}: ${oldScore} → ${headlineScore} (Level ${oldLevel} → ${headlineLevel}) on ${headlineUrl}`,
    );
  } else {
    await writeFile(dataPath, JSON.stringify(newData, null, 2));
    await writeFile(indexPath, updatedMd);
    if (moved) {
      console.error(
        `    ↻ ${slug}: ${oldScore} → ${headlineScore} (Level ${oldLevel} → ${headlineLevel}) on ${headlineUrl}`,
      );
    } else {
      console.error(`    = ${slug}: ${headlineScore} (no change)`);
    }
  }

  // Prose regen — only on actual movement. Strip the front matter target out
  // of the (potentially-just-rewritten) md so we can pass it to the LLM as
  // context. Use updatedMd in both dry-run and live paths so the target
  // resolution is consistent.
  let proseStats = { regenerated: 0, errors: 0 };
  if (moved || FORCE_PROSE_REGEN) {
    const targetMatch = updatedMd.match(/^report_target:\s*(.+)$/m);
    const target = (targetMatch?.[1] ?? slug).replace(/^["']|["']$/g, '').trim();
    if (FORCE_PROSE_REGEN && !moved) {
      console.error(`    🪄 ${slug}: forcing prose regen (--force-regen) despite no score change`);
    }
    proseStats = await regenerateReportProse({ slug, dir, scoringData: newData, target });
  }

  return {
    slug,
    score: headlineScore,
    level: headlineLevel,
    levelName: levelFor(headlineScore).name,
    url: headlineUrl,
    date: today,
    moved,
    oldScore,
    oldLevel,
    proseRegenerated: proseStats.regenerated,
    proseErrors: proseStats.errors,
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
const totalProseRegen = rows.reduce((n, r) => n + (r.proseRegenerated ?? 0), 0);
const totalProseErrors = rows.reduce((n, r) => n + (r.proseErrors ?? 0), 0);
console.error('');
console.error(
  `Done. ${rows.length} target(s) processed; ${moved.length} score change(s); ${totalProseRegen} prose file(s) regenerated; ${totalProseErrors} regen error(s).`,
);

// Emit machine-readable summary on stdout (for the GH Action to use)
console.log(
  JSON.stringify({
    refreshed_at: new Date().toISOString(),
    targets: rows.length,
    moved: moved.length,
    prose_regenerated: totalProseRegen,
    prose_errors: totalProseErrors,
    movements: moved.map((r) => ({
      slug: r.slug,
      from: { score: r.oldScore, level: r.oldLevel },
      to: { score: r.score, level: r.level },
      prose_regenerated: r.proseRegenerated ?? 0,
      prose_errors: r.proseErrors ?? 0,
    })),
  }),
);
