#!/usr/bin/env python3
"""Find candidate Agents First celebration targets — score 15+ surfaces in parallel.

Picks companies likely to score Level 3+ based on known signals (ships MCP server,
has /llms.txt, dedicated dev docs, markets to AI builders).
"""
import json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

# (company, [surfaces to probe])
CANDIDATES = {
    'OpenAI':      ['https://openai.com', 'https://platform.openai.com'],
    'GitHub':      ['https://github.com', 'https://docs.github.com'],
    'Replit':      ['https://replit.com', 'https://docs.replit.com'],
    'Notion':      ['https://notion.so', 'https://developers.notion.com'],
    'Cursor':      ['https://cursor.com', 'https://docs.cursor.com'],
    'HuggingFace': ['https://huggingface.co', 'https://huggingface.co/docs'],
    'Modal':       ['https://modal.com', 'https://modal.com/docs'],
    'Bun':         ['https://bun.com', 'https://bun.sh/docs'],
    'Convex':      ['https://convex.dev', 'https://docs.convex.dev'],
    'Resend':      ['https://resend.com', 'https://resend.com/docs'],
    'Cal.com':     ['https://cal.com', 'https://cal.com/docs'],
    'Sentry':      ['https://sentry.io', 'https://docs.sentry.io'],
    'Trigger.dev': ['https://trigger.dev', 'https://trigger.dev/docs'],
    'PostHog':     ['https://posthog.com', 'https://posthog.com/docs'],
    'Inngest':     ['https://inngest.com', 'https://inngest.com/docs'],
    'Supabase':    ['https://supabase.com', 'https://supabase.com/docs'],
    'Browserbase': ['https://browserbase.com', 'https://docs.browserbase.com'],
    'E2B':         ['https://e2b.dev', 'https://e2b.dev/docs'],
    'Tavily':      ['https://tavily.com', 'https://docs.tavily.com'],
    'LangSmith':   ['https://www.langchain.com', 'https://docs.langchain.com'],
}

def score(url):
    payload = json.dumps({
        'jsonrpc': '2.0', 'id': 1, 'method': 'tools/call',
        'params': {'name': 'score_website', 'arguments': {'url': url}}
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
        body = json.loads(outer['result']['content'][0]['text'])
        return {'url': url, 'score': body.get('score'), 'level': body.get('level'),
                'level_name': body.get('level_name')}
    except Exception as e:
        return {'url': url, 'error': str(e)[:80]}

# Fan out
all_urls = sorted({u for v in CANDIDATES.values() for u in v})
print(f'Probing {len(all_urls)} surfaces across {len(CANDIDATES)} companies...', file=sys.stderr)
results = {}
with ThreadPoolExecutor(max_workers=12) as p:
    for r in p.map(score, all_urls):
        results[r['url']] = r

# Roll up to per-company headlines (max across surfaces)
rows = []
for company, urls in CANDIDATES.items():
    valid = [results[u] for u in urls if results.get(u, {}).get('score') is not None]
    if not valid:
        continue
    best = max(valid, key=lambda r: r['score'])
    surface_breakdown = ' / '.join(f"{u.replace('https://','')}:{results.get(u,{}).get('score','?')}" for u in urls)
    rows.append({
        'company': company,
        'best_score': best['score'],
        'best_level': best['level'],
        'best_url': best['url'],
        'surfaces': surface_breakdown,
    })

# Sort by best score descending
rows.sort(key=lambda r: -r['best_score'])

print('\n' + '='*100, file=sys.stderr)
print(f'{"COMPANY":13} {"SCORE":>6} {"LEVEL":>6} {"BEST SURFACE":36} {"BREAKDOWN"}', file=sys.stderr)
print('-'*100, file=sys.stderr)
for r in rows:
    level_label = 'L4 🏆' if r['best_level'] == 4 else f"L{r['best_level']}"
    print(f"{r['company']:13} {r['best_score']:>4}/100 {level_label:>6} {r['best_url'].replace('https://',''):36} {r['surfaces']}", file=sys.stderr)
