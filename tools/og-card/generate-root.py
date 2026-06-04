#!/usr/bin/env python3
"""
Generates the root /og-image.png — the site-wide social card for agentsfirst.dev,
the default OG image for the homepage and any page without a per-page card.

Restyled 2026-06 to match the per-page score cards (generate.py): same dark canvas,
brand-green top/bottom stripes, header row (mark + name / url), accent bar, green
label, then a punchy hero. Distinct from generate.py only in content — there's no
score, so the hero carries the thesis.

Usage:
  python3 tools/og-card/generate-root.py
  python3 tools/og-card/generate-root.py --out=path/to/file.png
"""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[2]
W, H = 1200, 630
BG = (13, 17, 23)               # #0d1117 dark navy  (matches score cards)
STRIPE = (45, 164, 78)          # brand green        (matches score cards' accent)
WHITE = (255, 255, 255)
MUTED = (180, 188, 196)
BRAND_GREEN = (45, 164, 78)
GREEN_BRIGHT = (88, 211, 110)

HELV_TTC = "/System/Library/Fonts/Helvetica.ttc"

_font_cache = {}
def font(size: int, bold: bool = False):
    k = (size, bold)
    if k not in _font_cache:
        _font_cache[k] = ImageFont.truetype(HELV_TTC, size, index=(1 if bold else 0))
    return _font_cache[k]

def render(out_path: Path) -> None:
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # top + bottom brand stripes (same as score cards)
    draw.rectangle([(0, 0), (W, 8)], fill=STRIPE)
    draw.rectangle([(0, H - 8), (W, H)], fill=STRIPE)

    # ── header: [AF mark] Agents First  ............  agentsfirst.dev ──
    sq = 76
    mark = Image.new("RGBA", (sq, sq), (0, 0, 0, 0))
    md = ImageDraw.Draw(mark)
    md.rounded_rectangle([(0, 0), (sq - 1, sq - 1)], radius=18, fill=STRIPE)
    f_mono = font(38, bold=True)
    mono = "AF"
    mw = md.textlength(mono, font=f_mono)
    mbbox = md.textbbox((0, 0), mono, font=f_mono)
    md.text(((sq - mw) / 2, (sq - (mbbox[3] - mbbox[1])) / 2 - mbbox[1]), mono, font=f_mono, fill=WHITE)
    img.paste(mark, (60, 44), mark)

    name_x = 60 + sq + 24
    f_name = font(46, bold=True)
    name_y = 44 + (sq - 46) // 2 - 4
    draw.text((name_x, name_y), "Agents First", font=f_name, fill=WHITE)

    f_url = font(26, bold=False)
    url = "agentsfirst.dev"
    draw.text((W - 60 - draw.textlength(url, font=f_url), name_y + 10), url, font=f_url, fill=MUTED)

    # accent bar
    draw.rectangle([(60, 150), (W - 60, 156)], fill=STRIPE)

    # green label (mirrors "AGENTS FIRST SCORE" slot on score cards)
    draw.text((60, 188), "A DESIGN FRAMEWORK", font=font(26, bold=True), fill=BRAND_GREEN)

    # ── hero ──
    hero = "Two customers."
    f_hero = font(124, bold=True)
    hero_w = draw.textlength(hero, font=f_hero)
    hero_y = 268
    draw.text(((W - hero_w) / 2, hero_y), hero, font=f_hero, fill=WHITE)

    # supporting line
    sub = "The human who pays. The agent who decides."
    f_sub = font(40, bold=False)
    sub_w = draw.textlength(sub, font=f_sub)
    sub_y = hero_y + 168
    draw.text(((W - sub_w) / 2, sub_y), sub, font=f_sub, fill=MUTED)

    # closer (green, mirrors the colored LEVEL line)
    closer = "Design for the agent first."
    f_close = font(38, bold=True)
    close_w = draw.textlength(closer, font=f_close)
    draw.text(((W - close_w) / 2, sub_y + 58), closer, font=f_close, fill=GREEN_BRIGHT)

    img.save(out_path, "PNG", optimize=True)
    print(f"✓ Wrote {out_path} ({out_path.stat().st_size:,} bytes, {W}x{H})")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(REPO / "og-image.png"))
    args = ap.parse_args()
    render(Path(args.out))


if __name__ == "__main__":
    main()
