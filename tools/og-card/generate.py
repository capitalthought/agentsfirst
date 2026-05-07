#!/usr/bin/env python3
"""
Generates per-page 1200x630 OG cards for /scores/*/index.md and /reports/*/index.md.
Writes og.png next to each index.md and updates the front-matter `image:` line to point at it.

Usage:
  python3 tools/og-card/generate.py [--dry-run] [--only=scores|reports]
"""
import argparse
import os
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[2]
W, H = 1200, 630
BG = (13, 17, 23)              # #0d1117 dark navy
STRIPE = (34, 134, 58)         # green stripe (matches existing og-image)
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

# Helvetica.ttc on macOS — index 0 = Regular, 1 = Bold per Apple's collection ordering
HELV_TTC = "/System/Library/Fonts/Helvetica.ttc"
HELV_NEUE = "/System/Library/Fonts/HelveticaNeue.ttc"

def load_font(path: str, size: int, index: int = 0):
    return ImageFont.truetype(path, size, index=index)

# Cache fonts so we only open the TTC once per (size, weight)
_font_cache = {}
def font(size: int, bold: bool = False):
    k = (size, bold)
    if k not in _font_cache:
        # Helvetica.ttc: 0=Regular, 1=Bold, 2=Light, 3=Oblique
        idx = 1 if bold else 0
        _font_cache[k] = load_font(HELV_TTC, size, idx)
    return _font_cache[k]

FRONT_MATTER_RE = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL)
SCORE_DESC_RE = re.compile(r'Score:\s*(\d+)/100\s*[·•]\s*Level\s*(\d+)\s*\(([^)]+)\)', re.IGNORECASE)

def parse_front_matter(text: str) -> tuple[dict, str, tuple[int, int]]:
    """Returns (front_matter_dict, raw_yaml_block, (start, end) of yaml content)."""
    m = FRONT_MATTER_RE.match(text)
    if not m:
        return {}, "", (0, 0)
    yaml_block = m.group(1)
    fm = {}
    for line in yaml_block.split('\n'):
        if ':' not in line: continue
        k, _, v = line.partition(':')
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        fm[k] = v
    return fm, yaml_block, (m.start(1), m.end(1))

def parse_target_and_score(fm: dict, source_path: Path) -> dict | None:
    """Pull target name + score + level from a front matter dict."""
    info = {
        "target": None,
        "score": None,
        "level": None,
        "level_name": None,
    }
    # Score pages: title is "Agents First Score — <target>"
    title = fm.get("title", "")
    m = re.search(r'(?:Score|Report)\s*[—:\-]\s*(.+?)(?:\s*\||$)', title)
    if m:
        info["target"] = m.group(1).strip()
    # Public reports: explicit fields
    if fm.get("report_target"):
        info["target"] = fm["report_target"]
    if fm.get("report_score"):
        try: info["score"] = int(fm["report_score"])
        except: pass
    if fm.get("report_level"):
        try: info["level"] = int(fm["report_level"])
        except: pass
    # Private scores: parse the description
    if info["score"] is None or info["level"] is None:
        desc = fm.get("description", "")
        m = SCORE_DESC_RE.search(desc)
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

def render_card(info: dict, out_path: Path):
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Top + bottom green stripes (8px)
    draw.rectangle([(0, 0), (W, 8)], fill=STRIPE)
    draw.rectangle([(0, H - 8), (W, H)], fill=STRIPE)

    score_color = LEVEL_COLORS.get(info["level"], BRAND_GREEN)

    # Top-left small brand
    brand = "AGENTS FIRST SCORE"
    f_brand = font(28, bold=True)
    draw.text((60, 50), brand, font=f_brand, fill=BRAND_GREEN)

    # Top-right small URL
    url = "agentsfirst.dev"
    f_url = font(28, bold=False)
    url_w = draw.textlength(url, font=f_url)
    draw.text((W - 60 - url_w, 50), url, font=f_url, fill=MUTED)

    # Center stack: target / huge score / level
    # Target name (above the score) — feels more like "this is about X"
    target = info["target"]
    f_target = font(64, bold=True)
    target_w = draw.textlength(target, font=f_target)
    target_y = 140
    draw.text(((W - target_w) / 2, target_y), target, font=f_target, fill=WHITE)

    # Score number (huge)
    score_text = f"{info['score']} / 100"
    f_score = font(180, bold=True)
    score_w = draw.textlength(score_text, font=f_score)
    score_y = target_y + 95
    draw.text(((W - score_w) / 2, score_y), score_text, font=f_score, fill=score_color)

    # Level row
    level_text = f"LEVEL {info['level']} — {info['level_name'].upper()}"
    f_level = font(40, bold=True)
    level_w = draw.textlength(level_text, font=f_level)
    level_y = score_y + 200
    draw.text(((W - level_w) / 2, level_y), level_text, font=f_level, fill=score_color)

    img.save(out_path, "PNG", optimize=True)

def update_image_field(text: str, new_image_value: str) -> str:
    """Update or insert `image: <new_image_value>` in the YAML front matter."""
    fm, raw, span = parse_front_matter(text)
    if not raw:
        return text
    if "image" in fm:
        new_yaml = re.sub(
            r'^image:.*$',
            f'image: {new_image_value}',
            raw,
            count=1,
            flags=re.MULTILINE,
        )
    else:
        new_yaml = raw + f'\nimage: {new_image_value}'
    return text[:span[0]] + new_yaml + text[span[1]:]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", choices=["scores", "reports"], default=None)
    args = ap.parse_args()

    targets = []
    if args.only != "reports":
        for p in sorted((REPO / "scores").glob("*/index.md")):
            targets.append(("scores", p))
    if args.only != "scores":
        for p in sorted((REPO / "reports").glob("*/index.md")):
            targets.append(("reports", p))

    rendered = []
    for kind, idx_path in targets:
        text = idx_path.read_text()
        fm, _, _ = parse_front_matter(text)
        info = parse_target_and_score(fm, idx_path)
        if not info:
            continue
        out_path = idx_path.parent / "og.png"
        slug = idx_path.parent.name
        rel_image = f"/{kind}/{slug}/og.png"
        if args.dry_run:
            print(f"[dry-run] {kind}/{slug}: score={info['score']} level={info['level']} target={info['target']!r} → {out_path}")
        else:
            render_card(info, out_path)
            new_text = update_image_field(text, rel_image)
            if new_text != text:
                idx_path.write_text(new_text)
            print(f"✓ {kind}/{slug}: {info['score']}/100 L{info['level']} {info['target']!r} → {rel_image}")
        rendered.append((kind, slug, info))

    print(f"\nrendered {len(rendered)} card(s)")

if __name__ == "__main__":
    main()
