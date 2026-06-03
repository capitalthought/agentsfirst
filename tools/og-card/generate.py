#!/usr/bin/env python3
"""
Generates per-page 1200x630 OG cards for /scores/*/index.md and /reports/*/index.md,
customized for the company under review: fetches the target's favicon/logo + extracts
a brand-color accent, then stamps the company name, big score, and level.
Writes og.png next to each index.md and updates the front-matter `image:` line to point at it.

Usage:
  python3 tools/og-card/generate.py [--dry-run] [--only=scores|reports]
                                    [--slug=<dir-name>] [--no-fetch] [--refetch]

  --slug      Render just one page (its scores/ or reports/ dir name). Used by the
              /agentsfirst publish flow to brand a single new page.
  --no-fetch  Skip logo/color fetch (offline / fallback to neutral brand styling).
  --refetch   Ignore the logo cache and re-pull every logo.
"""
import argparse
import re
import sys
import urllib.request
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[2]
CACHE = Path(__file__).resolve().parent / ".logo-cache"
W, H = 1200, 630
BG = (13, 17, 23)              # #0d1117 dark navy
STRIPE = (34, 134, 58)         # green stripe (brand fallback)
WHITE = (255, 255, 255)
MUTED = (180, 188, 196)
BRAND_GREEN = (45, 164, 78)

# Score color by level
LEVEL_COLORS = {
    0: (248, 81, 73),    # red
    1: (251, 133, 0),    # orange
    2: (210, 153, 34),   # amber
    3: (45, 164, 78),    # green (flagship)
    4: (88, 166, 255),   # cyan
}
LEVEL_NAMES = {
    0: "No Agent Access",
    1: "Agent as Afterthought",
    2: "Agent-Aware",
    3: "Agents First",
    4: "Agent-Driven",
}

HELV_TTC = "/System/Library/Fonts/Helvetica.ttc"

_font_cache = {}
def font(size: int, bold: bool = False):
    k = (size, bold)
    if k not in _font_cache:
        # Helvetica.ttc: 0=Regular, 1=Bold, 2=Light, 3=Oblique
        _font_cache[k] = ImageFont.truetype(HELV_TTC, size, index=(1 if bold else 0))
    return _font_cache[k]

FRONT_MATTER_RE = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL)
SCORE_DESC_RE = re.compile(r'Score:\s*(\d+)/100\s*[·•]\s*Level\s*(\d+)\s*\(([^)]+)\)', re.IGNORECASE)
DOMAIN_RE = re.compile(r'(?:https?://)?(?:www\.)?([a-z0-9][a-z0-9.-]*\.[a-z]{2,})(?:/|$)', re.IGNORECASE)

# ── front-matter parsing (unchanged contract) ─────────────────────────────────
def parse_front_matter(text: str):
    m = FRONT_MATTER_RE.match(text)
    if not m:
        return {}, "", (0, 0)
    yaml_block = m.group(1)
    fm = {}
    for line in yaml_block.split('\n'):
        if ':' not in line: continue
        k, _, v = line.partition(':')
        fm[k.strip()] = v.strip().strip('"').strip("'")
    return fm, yaml_block, (m.start(1), m.end(1))

def parse_target_and_score(fm: dict, source_path: Path):
    info = {"target": None, "score": None, "level": None, "level_name": None}
    title = fm.get("title", "")
    m = re.search(r'(?:Score|Report)\s*[—:\-]\s*(.+?)(?:\s*\||$)', title)
    if m:
        info["target"] = m.group(1).strip()
    if fm.get("report_target"):
        info["target"] = fm["report_target"]
    if fm.get("report_score"):
        try: info["score"] = int(fm["report_score"])
        except: pass
    if fm.get("report_level"):
        try: info["level"] = int(fm["report_level"])
        except: pass
    if info["score"] is None or info["level"] is None:
        m = SCORE_DESC_RE.search(fm.get("description", ""))
        if m:
            info["score"] = int(m.group(1))
            info["level"] = int(m.group(2))
            info["level_name"] = m.group(3).strip()
    if info["level"] is not None and info["level_name"] is None:
        info["level_name"] = LEVEL_NAMES.get(info["level"])
    if info["score"] is None or info["level"] is None or not info["target"]:
        print(f"  ⚠️  could not parse score/level/target from {source_path}", file=sys.stderr)
        return None
    return info

# ── brand: logo fetch + dominant-color extraction ─────────────────────────────
# Curated name → domain for pages whose target is a company NAME, not a URL
# (public reports + well-known portfolio cos). Only brands whose domain is certain —
# a wrong guess would stamp a different company's favicon on the card. A page can
# also set `brand_domain:` in its front matter to override / extend this.
KNOWN_DOMAINS = {
    "amazon": "amazon.com", "anthropic": "anthropic.com", "aws": "aws.amazon.com",
    "browserbase": "browserbase.com", "cloudflare": "cloudflare.com", "coinbase": "coinbase.com",
    "cursor": "cursor.com", "google": "google.com", "indeed": "indeed.com",
    "linear": "linear.app", "notion": "notion.so", "stripe": "stripe.com",
    "vercel": "vercel.com", "thewallstreetjournal": "wsj.com", "wsj": "wsj.com",
    "apptronikinc": "apptronik.com", "apptronik": "apptronik.com",
    "saronictechnologies": "saronic.com", "intuitivemachines": "intuitivemachines.com",
    "colossalbiosciences": "colossal.com", "paradromicsinc": "paradromics.com",
    "zenbusiness": "zenbusiness.com",
}

def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())

def target_domain(info: dict, fm: dict):
    """Resolve a fetchable domain from a URL field, the target itself, or the curated map."""
    # 1. explicit override / URL fields
    candidates = [fm.get("brand_domain", ""), fm.get("target_url", ""), fm.get("review_url", ""),
                  fm.get("url", ""), info.get("target", "")]
    for c in candidates:
        s = (c or "").strip()
        m = DOMAIN_RE.match(s) or DOMAIN_RE.search(s)
        if m:
            return m.group(1).lower()
    # 2. curated name → domain (only certain brands)
    return KNOWN_DOMAINS.get(_norm(info.get("target", "")))

def fetch_logo(domain: str, refetch: bool = False):
    """Best-effort brand mark. DuckDuckGo → Google favicon → site /favicon.ico. Cached."""
    if not domain:
        return None
    CACHE.mkdir(parents=True, exist_ok=True)
    cp = CACHE / f"{domain}.png"
    if cp.exists() and not refetch:
        try: return Image.open(cp).convert("RGBA")
        except Exception: pass
    sources = [
        f"https://icons.duckduckgo.com/ip3/{domain}.ico",
        f"https://www.google.com/s2/favicons?domain={domain}&sz=128",
        f"https://{domain}/favicon.ico",
    ]
    for url in sources:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (agentsfirst-og-card)"})
            data = urllib.request.urlopen(req, timeout=10).read()
            if len(data) < 100:
                continue
            im = Image.open(BytesIO(data)).convert("RGBA")
            if min(im.size) < 16:        # skip 1x1 / placeholder pixels
                continue
            im.save(cp, "PNG")
            return im
        except Exception:
            continue
    return None

def dominant_color(img):
    """The signature brand color: a vivid (non-white/black/gray) logo color, ranked
    by frequency × saturation so a true brand hue beats a pale paper background."""
    if img is None:
        return None
    im = img.convert("RGBA").resize((64, 64))
    scores = {}
    for r, g, b, a in list(im.getdata()):
        if a < 128:
            continue
        mx, mn = max(r, g, b), min(r, g, b)
        sat = mx - mn
        if mx < 45 or mn > 210 or sat < 28:   # near-black, near-white, grayscale
            continue
        key = (r // 28 * 28, g // 28 * 28, b // 28 * 28)
        # weight each pixel by its saturation so vivid hues outrank pale fills
        scores[key] = scores.get(key, 0) + sat
    if not scores:
        return None
    r, g, b = max(scores, key=scores.get)
    return (min(255, r + 14), min(255, g + 14), min(255, b + 14))

# ── render ────────────────────────────────────────────────────────────────────
def render_card(info: dict, out_path: Path, logo, brand):
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    accent = brand or STRIPE
    score_color = LEVEL_COLORS.get(info["level"], BRAND_GREEN)

    # top + bottom stripes in the brand color (falls back to green)
    draw.rectangle([(0, 0), (W, 8)], fill=accent)
    draw.rectangle([(0, H - 8), (W, H)], fill=accent)

    # ── header: [logo] company-name  ............  agentsfirst.dev ──
    name_x = 60
    if logo is not None:
        sq = 76
        mark = logo.convert("RGBA").resize((sq, sq), Image.LANCZOS)
        img.paste(mark, (60, 44), mark)
        name_x = 60 + sq + 24

    target = info["target"]
    f_name = font(46, bold=True)
    # vertically center the name against the 76px logo block (top=44)
    name_y = 44 + (76 - 46) // 2 - 4
    draw.text((name_x, name_y), target, font=f_name, fill=WHITE)

    f_url = font(26, bold=False)
    url = "agentsfirst.dev"
    draw.text((W - 60 - draw.textlength(url, font=f_url), name_y + 10), url, font=f_url, fill=MUTED)

    # accent bar in brand color under the header
    draw.rectangle([(60, 150), (W - 60, 156)], fill=accent)

    # small brand label
    f_brand = font(26, bold=True)
    draw.text((60, 188), "AGENTS FIRST SCORE", font=f_brand, fill=BRAND_GREEN)

    # ── hero: huge score ──
    score_text = f"{info['score']} / 100"
    f_score = font(190, bold=True)
    score_w = draw.textlength(score_text, font=f_score)
    score_y = 260
    draw.text(((W - score_w) / 2, score_y), score_text, font=f_score, fill=score_color)

    # ── level row ──
    level_text = f"LEVEL {info['level']} — {info['level_name'].upper()}"
    f_level = font(42, bold=True)
    level_w = draw.textlength(level_text, font=f_level)
    draw.text(((W - level_w) / 2, score_y + 210), level_text, font=f_level, fill=score_color)

    img.save(out_path, "PNG", optimize=True)

def update_image_field(text: str, new_image_value: str) -> str:
    fm, raw, span = parse_front_matter(text)
    if not raw:
        return text
    if "image" in fm:
        new_yaml = re.sub(r'^image:.*$', f'image: {new_image_value}', raw, count=1, flags=re.MULTILINE)
    else:
        new_yaml = raw + f'\nimage: {new_image_value}'
    return text[:span[0]] + new_yaml + text[span[1]:]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", choices=["scores", "reports"], default=None)
    ap.add_argument("--slug", default=None, help="render just one scores/ or reports/ dir")
    ap.add_argument("--no-fetch", action="store_true", help="skip logo/color fetch")
    ap.add_argument("--refetch", action="store_true", help="ignore logo cache")
    args = ap.parse_args()

    targets = []
    if args.only != "reports":
        targets += [("scores", p) for p in sorted((REPO / "scores").glob("*/index.md"))]
    if args.only != "scores":
        targets += [("reports", p) for p in sorted((REPO / "reports").glob("*/index.md"))]
    if args.slug:
        targets = [(k, p) for (k, p) in targets if p.parent.name == args.slug]
        if not targets:
            print(f"⚠️  no page found with slug {args.slug!r}", file=sys.stderr)
            sys.exit(1)

    rendered = []
    for kind, idx_path in targets:
        text = idx_path.read_text()
        fm, _, _ = parse_front_matter(text)
        info = parse_target_and_score(fm, idx_path)
        if not info:
            continue
        domain = None if args.no_fetch else target_domain(info, fm)
        logo = None if args.no_fetch else fetch_logo(domain, refetch=args.refetch)
        brand = dominant_color(logo)
        out_path = idx_path.parent / "og.png"
        slug = idx_path.parent.name
        rel_image = f"/{kind}/{slug}/og.png"
        badge = f"logo:{domain}" if logo else ("no-logo" if domain else "no-domain")
        if args.dry_run:
            print(f"[dry-run] {kind}/{slug}: {info['score']}/100 L{info['level']} {info['target']!r} [{badge}] → {out_path}")
        else:
            render_card(info, out_path, logo, brand)
            new_text = update_image_field(text, rel_image)
            if new_text != text:
                idx_path.write_text(new_text)
            print(f"✓ {kind}/{slug}: {info['score']}/100 L{info['level']} {info['target']!r} [{badge}] → {rel_image}")
        rendered.append((kind, slug, info))

    print(f"\nrendered {len(rendered)} card(s)")

if __name__ == "__main__":
    main()
