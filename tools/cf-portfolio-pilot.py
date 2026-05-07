#!/usr/bin/env python3
"""
CF Portfolio Agent Readiness Campaign — Pilot Pipeline (25 companies)

For each pilot company:
  1. Score the homepage via agentsfirst.dev/mcp (live v0.2.0 rubric)
  2. Generate a private /scores/portfolio-{slug}-{token}/ page
  3. Draft a level-aware personalized email body

Outputs:
  - /Users/joshuabaer/Xcode/agentsfirst/scores/portfolio-{slug}-{token}/index.md  (×25)
  - /Users/joshuabaer/Xcode/agentsfirst/docs/campaigns/cf-portfolio-pilot-emails.csv
  - /Users/joshuabaer/Xcode/agentsfirst/docs/campaigns/cf-portfolio-pilot-summary.md

Reads:
  - /Users/joshuabaer/Xcode/agentsfirst/docs/campaigns/cf-portfolio-eligible.json

Run from outside /tmp to avoid the inspect.py shadow:
  cd ~ && python3 ~/Xcode/agentsfirst/tools/cf-portfolio-pilot.py
"""
import csv
import json
import re
import secrets
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

REPO = Path('/Users/joshuabaer/Xcode/agentsfirst')
SOURCE = REPO / 'docs/campaigns/cf-portfolio-eligible.json'
SCORES_DIR = REPO / 'scores'
OUT_DIR = REPO / 'docs/campaigns'

# Hand-picked pilot — 22 × 5⭐ + 3 × 4⭐ for diversity.
PILOT_NAMES = [
    # 5⭐ (22) — Josh's flagship investments. Highest reply rate.
    'Aalo Atomics', 'Aceable', 'Apptronik Inc.', 'Cart.com', 'Casimir',
    'Circuit', 'Colossal Biosciences', 'Eagle Eye Networks', 'ICON',
    'Intuitive Machines', 'Keen Technologies', 'Paradromics Inc.',
    'Radia', 'Really.com', 'Saronic Technologies', 'Starlab Space',
    'TAE', 'Vatn Systems', 'Voyager Space Holdings', 'Wander.com',
    'X-Bow Systems', 'zenbusiness',
    # 4⭐ (3) for funnel diversity
    'Allen Control Systems', 'AmplifAI', 'App Orchid',
]

LEVEL_NAMES = {
    0: 'No Agent Access',
    1: 'Agent as Afterthought',
    2: 'Agent-Aware',
    3: 'Agents First',
    4: 'Agent-Driven',
}


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_]+', '-', s).strip('-')
    return s or 'unknown'


def score_url(url: str) -> dict:
    """Call the live worker; return the body dict (or {error}) for one URL."""
    payload = json.dumps({
        'jsonrpc': '2.0', 'id': 1, 'method': 'tools/call',
        'params': {'name': 'score_website', 'arguments': {'url': url}},
    })
    try:
        r = subprocess.run(
            ['curl', '-sX', 'POST', 'https://agentsfirst.dev/mcp',
             '-H', 'Content-Type: application/json',
             '-H', 'Accept: application/json, text/event-stream',
             '--max-time', '60', '-d', payload],
            capture_output=True, text=True, timeout=70,
        )
        outer = json.loads(r.stdout)
        body_text = outer.get('result', {}).get('content', [{}])[0].get('text', '')
        return json.loads(body_text)
    except Exception as e:
        return {'error': f'{type(e).__name__}: {str(e)[:120]}'}


def select_top_moves(score_body: dict, max_moves: int = 2) -> list[str]:
    """Return up to N short action lines from the probe's top_moves."""
    moves = score_body.get('top_moves', []) or []
    out = []
    for m in moves[:max_moves]:
        action = m.get('action', '')
        # Trim to first sentence (or first 120 chars) for brevity in emails
        action = action.split('.')[0]
        if len(action) > 120:
            action = action[:117] + '…'
        out.append(action.strip())
    return out


def make_score_page(company: dict, score_body: dict, page_path: Path, slug_token: str):
    """Write the hidden /scores/portfolio-<slug>-<token>/index.md page."""
    name = company['name']
    website = company['website']
    score = score_body.get('score', 0)
    level = score_body.get('level', 0)
    level_name = score_body.get('level_name', LEVEL_NAMES.get(level, '?'))

    # Build the dimensions breakdown
    dims = score_body.get('dimensions', {})
    dim_lines = []
    for key in ['discoverability', 'content-accessibility', 'bot-access-control', 'agent-capabilities', 'visibility-of-agent-integrations']:
        d = dims.get(key, {})
        pts = d.get('pts', 0)
        mx = d.get('max', 0)
        status = d.get('status', '?')
        emoji = {'pass': '✅', 'partial': '🟡', 'fail': '⚠️'}.get(status, '❓')
        notes = d.get('notes', [])
        first_note = notes[0] if notes else ''
        if len(first_note) > 100:
            first_note = first_note[:97] + '…'
        dim_lines.append(f'- {emoji} **{key.replace("-", " ").title()}** ({pts}/{mx}) — {first_note}')

    # Anti-patterns
    aps = score_body.get('anti_patterns_flagged', [])
    ap_lines = []
    for ap in aps:
        ap_name = ap.get('name', '?')
        ap_slug = ap.get('slug', '')
        evidence = ap.get('evidence', '')
        ap_lines.append(f'- **[{ap_name}](https://agentsfirst.dev/glossary/#{ap_slug})** — {evidence}')

    # Top moves
    top_moves = score_body.get('top_moves', [])
    move_lines = []
    for i, m in enumerate(top_moves[:3], 1):
        principle = m.get('principle', '?')
        gap = m.get('gap_pts', 0)
        action = m.get('action', '')
        move_lines.append(f'{i}. **+{gap}pts ({principle})** — {action}')

    # Description for OG card unfurl: "Score: X/100 · Level Y (Name). <hook sentence>"
    hook = f"{name} is a Capital Factory portfolio company. This private agent-readiness audit shows what an agent finds when it tries to discover their product."
    if score >= 60:
        hook = f"{name} is a Capital Factory portfolio company. This audit puts them in the celebration tier — agents can find and use their product."
    elif score >= 25:
        hook = f"{name} is a Capital Factory portfolio company. Halfway to Level 3 — one focused day of work would close the gap."
    description = f"Score: {score}/100 · Level {level} ({level_name}). {hook}"
    if len(description) > 220:
        description = description[:217] + '…'

    # Page body
    body = f"""---
title: "Agents First Score — {name}"
description: "{description}"
noindex: true
sitemap: false
image: /og-image.png
author: Joshua Baer
---

## Agents First Score — {name}

**Score: {score}/100 · Level {level} ({level_name})** · scored against rubric v0.2.0 on 2026-05-07.

This is a private audit prepared as part of a Capital Factory portfolio review. {name}'s public site at [{website}]({website}) was scored against the [Agents First framework](https://agentsfirst.dev) — eight implementation principles plus five discovery dimensions. The score reflects what an agent finds when it tries to discover and use {name}'s product on behalf of a user.

### Dimension breakdown

{chr(10).join(dim_lines)}

### 🚨 Anti-patterns flagged

{chr(10).join(ap_lines) if ap_lines else '*(none — clean run)*'}

### 🎯 Top moves to climb a level

{chr(10).join(move_lines) if move_lines else '*(no specific moves surfaced — at floor or ceiling)*'}

### Reference

- Framework: <https://agentsfirst.dev/principles/>
- Glossary: <https://agentsfirst.dev/glossary/>
- Live scorer (re-run anytime): <https://agentsfirst.dev/mcp>
- Methodology: rubric v0.2.0 — `/AGENTS.md` weighted 15pts (canonical contract artifact); `/llms.txt` weighted 5pts (optional belt-and-suspenders); `/agents.json` and `/sitemap-index.xml` credited equally with `/.well-known/mcp-server-card.json` and `/sitemap.xml`. Source: <https://github.com/capitalthought/agentsfirst/blob/main/tools/agentsfirst-mcp/src/score.ts>.

---

*Capital Factory portfolio audit · 2026-05-07 · Re-run the scorer at <https://agentsfirst.dev/mcp> any time to verify your improvements.*
"""
    page_path.write_text(body)


def make_email_body(company: dict, score_body: dict, private_url: str) -> tuple[str, str]:
    """Return (subject, body) for the personalized email."""
    name = company['name']
    poc = (company.get('poc_name') or '').split()[0] if company.get('poc_name') else 'there'
    website = company['website']
    score = score_body.get('score', 0)
    level = score_body.get('level', 0)
    level_name = score_body.get('level_name', LEVEL_NAMES.get(level, '?'))
    moves = select_top_moves(score_body)
    fix_1 = moves[0] if moves else 'Ship /AGENTS.md and /llms.txt at your site root'
    fix_2 = moves[1] if len(moves) > 1 else 'Add Content-Signal directive to robots.txt'

    subject = f"{name} · Agent Readiness Score (private link)"

    # Level-aware template selection
    if level == 0:
        body = f"""Howdy {poc},

We just shipped a free agent-readiness scorer at agentsfirst.dev — open-source rubric, scored 14 named companies in the public batch (Vercel hit Level 4; Cursor / Browserbase / Notion at Level 3). I'm running it against every CF portfolio company to see what we can fix.

{name} scored {score}/100, Level 0. Honest result — there's no robots.txt, no /llms.txt, no /AGENTS.md, no MCP discovery on {website}. Most agents that look you up cold can't find you.

The good news: the floor is reachable in an afternoon. Two specific fixes that would lift you to Level 2:

1. {fix_1}
2. {fix_2}

Your private report: {private_url}

Two asks:
1. Star agentsfirst on GitHub if the rubric is useful: https://github.com/capitalthought/agentsfirst
2. Re-run the scorer at agentsfirst.dev/mcp once you ship the fixes — would love to see your score climb.

Reply if you want me to walk through the report or pair on the fixes — I have 5 fix-it slots a week reserved for portfolio companies.

Yeehaw!

🤖 Josh"""
    elif level == 1:
        body = f"""Howdy {poc},

Heads up — I'm scoring every CF portfolio company on a free agent-readiness rubric we shipped at agentsfirst.dev. {name} scored {score}/100, Level 1 (Agent as Afterthought).

You've shipped some signals already. What's missing for Level 2:

1. {fix_1}
2. {fix_2}

Your private report: {private_url}

Two asks:
1. Star agentsfirst on GitHub if the rubric is useful: https://github.com/capitalthought/agentsfirst
2. Re-run the scorer at agentsfirst.dev/mcp after you ship — most companies climb 30+ points with a single afternoon's work.

Reply if you want help — I have 5 fix-it slots a week reserved for portfolio companies.

Yeehaw!

🤖 Josh"""
    elif level == 2:
        body = f"""Howdy {poc},

Quick one — I'm scoring every CF portfolio company on the agent-readiness rubric we shipped at agentsfirst.dev. {name} scored {score}/100, Level 2 (Agent-Aware). That puts you ahead of most of the named companies in our public series.

Two specific fixes that would land you in the Level 3 club (currently: Vercel, Cursor, Browserbase, Notion):

1. {fix_1}
2. {fix_2}

Your private report: {private_url}

One ask: star agentsfirst on GitHub if the rubric helps: https://github.com/capitalthought/agentsfirst

Reply if you want a co-pilot session — I'm running 5 fix-it slots a week for portfolio companies.

Yeehaw!

🤖 Josh"""
    else:  # Level 3 or 4
        subject = f"🏆 {name} just hit Level {level} on the Agents First rubric"
        body = f"""Howdy {poc},

Heads up — I'm scoring every CF portfolio company on the agent-readiness rubric at agentsfirst.dev. {name} scored {score}/100, Level {level} ({level_name}). That puts you in the celebration tier alongside Vercel, Cursor, Browserbase, and Notion.

Your private report: {private_url}

Three asks:
1. Star agentsfirst on GitHub: https://github.com/capitalthought/agentsfirst
2. Reply with a quote I can use in the next public batch ("Here's why we built it that way" — 1-2 sentences).
3. Tell me the one thing you'd do to get to Level {level + 1 if level < 4 else 4} — your input shapes the rubric.

Yeehaw!

🤖 Josh"""

    return subject, body


def main():
    if not SOURCE.exists():
        print(f'ERROR: {SOURCE} not found. Run the Airtable fetch first.', file=sys.stderr)
        sys.exit(1)

    src = json.loads(SOURCE.read_text())
    by_name = {c['name']: c for c in src['companies']}

    pilot = []
    missing = []
    for n in PILOT_NAMES:
        if n in by_name:
            pilot.append(by_name[n])
        else:
            missing.append(n)
    if missing:
        print(f'WARN: pilot names not in eligible set: {missing}', file=sys.stderr)
    print(f'Pilot batch: {len(pilot)} companies', file=sys.stderr)

    # Score in parallel
    print(f'Scoring {len(pilot)} companies via agentsfirst.dev/mcp ...', file=sys.stderr)
    with ThreadPoolExecutor(max_workers=10) as p:
        scored = list(zip(pilot, p.map(lambda c: score_url(c['website']), pilot)))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    SCORES_DIR.mkdir(parents=True, exist_ok=True)

    # Generate pages + emails
    rows = []
    summary_lines = ['# CF Portfolio Pilot — 25 Companies\n', '## Pilot batch results (sorted by score desc)\n', '| Score | Level | Company | POC | URL |\n|---:|---:|---|---|---|']

    for company, score_body in scored:
        name = company['name']
        if 'error' in score_body:
            print(f'  ❌ {name}: {score_body["error"]}', file=sys.stderr)
            continue

        slug = slugify(name)
        token = secrets.token_hex(6)
        slug_token = f'portfolio-{slug}-{token}'
        page_dir = SCORES_DIR / slug_token
        page_dir.mkdir(parents=True, exist_ok=True)
        page_path = page_dir / 'index.md'
        make_score_page(company, score_body, page_path, slug_token)

        private_url = f'https://agentsfirst.dev/scores/{slug_token}/'

        subject, body = make_email_body(company, score_body, private_url)

        rows.append({
            'company_name': name,
            'website': company['website'],
            'poc_name': company.get('poc_name', ''),
            'poc_email': company.get('poc_email', ''),
            'star_rating': company.get('star', ''),
            'score': score_body.get('score', 0),
            'level': score_body.get('level', 0),
            'level_name': score_body.get('level_name', ''),
            'private_url': private_url,
            'subject': subject,
            'body': body,
        })

        score_str = f"{score_body.get('score',0)}/100"
        level_str = f"L{score_body.get('level',0)}"
        print(f'  ✓ {name}: {score_str} {level_str} → {slug_token}', file=sys.stderr)

    # Sort summary by score descending
    rows.sort(key=lambda r: -r['score'])

    # Write CSV (ready to upload to Personalize.run)
    csv_path = OUT_DIR / 'cf-portfolio-pilot-emails.csv'
    with csv_path.open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
    print(f'\n✓ wrote CSV: {csv_path}', file=sys.stderr)

    # Write summary md
    for r in rows:
        summary_lines.append(
            f'| **{r["score"]}** | L{r["level"]} | {r["company_name"]} | {r["poc_name"]} | {r["website"]} |'
        )
    distribution = {}
    for r in rows:
        distribution[r['level']] = distribution.get(r['level'], 0) + 1
    dist_str = ' · '.join(f'{distribution.get(L,0)} × L{L}' for L in sorted(distribution.keys()))
    summary_lines.insert(2, f'\n**Distribution:** {dist_str}\n')

    summary_lines.append('\n## How to upload to Personalize.run\n')
    summary_lines.append('1. Restart Claude Code (Cmd-Q + relaunch) to load the personalize MCP server')
    summary_lines.append('2. Run `/personalize-prep` in fresh session — confirm cap headroom + sender state')
    summary_lines.append('3. Upload `cf-portfolio-pilot-emails.csv` as a new Personalize.run sequence')
    summary_lines.append('4. Greenlight via Personalize.run UI; drips at 5/day starting Tue 2026-05-12')

    summary_path = OUT_DIR / 'cf-portfolio-pilot-summary.md'
    summary_path.write_text('\n'.join(summary_lines))
    print(f'✓ wrote summary: {summary_path}', file=sys.stderr)

    # Print headline summary to stdout
    print(f'\n=== PILOT RESULTS ===')
    print(f'{len(rows)} companies scored, written to {SCORES_DIR}/portfolio-*-*/')
    print(f'\n{"COMPANY":35} {"SCORE":>7} {"LEVEL":>3}  {"PRIVATE URL":48}')
    for r in rows[:30]:
        print(f'{r["company_name"]:35} {r["score"]:>4}/100 L{r["level"]}  {r["private_url"]}')


if __name__ == '__main__':
    main()
