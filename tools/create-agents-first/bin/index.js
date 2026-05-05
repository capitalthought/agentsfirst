#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, '..', 'template');

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function color(c, s) {
  return `${C[c]}${s}${C.reset}`;
}

function die(msg, code = 1) {
  process.stderr.write(`${color('red', '✖')} ${msg}\n`);
  process.exit(code);
}

// npm package name rules: lowercase, no spaces, hyphens/digits/letters, doesn't start with . or _
function isValidName(name) {
  if (!name || name.length === 0 || name.length > 214) return false;
  if (name.startsWith('.') || name.startsWith('_')) return false;
  if (name !== name.toLowerCase()) return false;
  if (/[^a-z0-9\-]/.test(name)) return false;
  return true;
}

function toPascal(name) {
  return name
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function substitute(content, vars) {
  return content
    .replaceAll('{{PROJECT_NAME_PASCAL}}', vars.pascal)
    .replaceAll('{{PROJECT_NAME_UPPER}}', vars.upper)
    .replaceAll('{{PROJECT_NAME}}', vars.name);
}

function rewriteFilename(name, vars) {
  return name
    .replaceAll('__PROJECT_NAME_PASCAL__', vars.pascal)
    .replaceAll('__PROJECT_NAME_UPPER__', vars.upper)
    .replaceAll('__PROJECT_NAME__', vars.name);
}

async function copyTree(srcDir, destDir, vars) {
  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destName = rewriteFilename(entry.name, vars);
    const destPath = path.join(destDir, destName);
    if (entry.isDirectory()) {
      await mkdir(destPath, { recursive: true });
      await copyTree(srcPath, destPath, vars);
    } else if (entry.isFile()) {
      const buf = await readFile(srcPath);
      // Treat known text extensions as substitutable; everything else copy raw.
      const ext = path.extname(entry.name).toLowerCase();
      const textExts = new Set([
        '.md', '.json', '.ts', '.tsx', '.js', '.mjs', '.cjs', '.txt',
        '.yml', '.yaml', '.toml', '.html', '.css', '.example', '.gitignore',
      ]);
      const looksTextByName = entry.name.startsWith('.') || textExts.has(ext);
      if (looksTextByName) {
        const text = buf.toString('utf8');
        await writeFile(destPath, substitute(text, vars), 'utf8');
      } else {
        await writeFile(destPath, buf);
      }
    }
  }
}

async function isNonEmpty(dir) {
  try {
    const entries = await readdir(dir);
    return entries.length > 0;
  } catch {
    return false;
  }
}

async function getProjectName(argv) {
  const fromArgv = argv[2];
  if (fromArgv) return fromArgv;
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(`${color('cyan', '?')} Project name: `);
  rl.close();
  return answer.trim();
}

async function main() {
  const argv = process.argv;
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`
${color('bold', 'create-agents-first')} — scaffold an Agents-First project

${color('bold', 'Usage:')}
  npx @capitalthought/create-agents-first <project-name>

Generates an MCP server scaffold built around the 8 principles from
https://agentsfirst.dev — Interface First, Contract First, Prep Gates,
Typed State, Visible Outputs, Multi-Model Verification, Perspective
Dispatch, Autonomous Recovery.

`);
    process.exit(0);
  }

  const name = await getProjectName(argv);
  if (!name) die('Project name required.');
  if (!isValidName(name)) {
    die(
      `Invalid project name "${name}". Use lowercase letters, digits, and hyphens. Must not start with "." or "_".`,
    );
  }

  const targetDir = path.resolve(process.cwd(), name);
  if (existsSync(targetDir) && (await isNonEmpty(targetDir))) {
    die(`Target directory "${name}" already exists and is not empty.`);
  }

  if (!existsSync(TEMPLATE_DIR)) {
    die(`Template directory missing at ${TEMPLATE_DIR}. Reinstall the package.`);
  }

  const vars = {
    name,
    pascal: toPascal(name),
    upper: name.replace(/-/g, '_').toUpperCase(),
  };

  await mkdir(targetDir, { recursive: true });
  await copyTree(TEMPLATE_DIR, targetDir, vars);

  process.stdout.write(`
${color('magenta', '✨')} ${color('bold', `Created Agents-First project: ${name}`)}
${color('dim', `   at ${targetDir}`)}

${color('bold', 'Next:')}
  ${color('cyan', `cd ${name}`)}
  ${color('cyan', 'npm install')}
  ${color('cyan', 'npm run prep')}        ${color('dim', '# verify the prep gate')}
  ${color('cyan', 'npm run dev')}         ${color('dim', '# run the MCP server (stdio)')}

${color('bold', 'Wire it to your agent:')}
  Point Claude Code / Cursor / Windsurf at:
    ${color('cyan', `tsx ${path.join(name, 'src/server.ts')}`)}    ${color('dim', '# dev')}
    ${color('cyan', `node ${path.join(name, 'dist/server.js')}`)}  ${color('dim', '# after build')}

${color('bold', 'Read first:')}
  ${color('cyan', `${name}/AGENTS.md`)}   ${color('dim', '# the rules your agent must follow')}

Learn more: ${color('cyan', 'https://agentsfirst.dev/principles/')}
`);
}

main().catch((err) => {
  die(err?.stack || String(err));
});
