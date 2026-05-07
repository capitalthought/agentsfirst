#!/usr/bin/env python3
"""
Generates the root /og-image.png — the social card for agentsfirst.dev itself.

Distinct from generate.py (per-page score cards). The root card has:
  - "Agents First" headline (NOT "Agent First" — the previous card was wrong)
  - Two-customers tagline
  - Brand mark + URL

Usage:
  python3 tools/og-card/generate-root.py
  python3 tools/og-card/generate-root.py --out=path/to/file.png
"""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[2]
W, H = 1200, 630
BG = (13, 17, 23)               # #0d1117 dark navy
STRIPE = (45, 164, 78)          # brand green
WHITE = (255, 255, 255)
MUTED = (180, 188, 196)
GREEN_BRIGHT = (88, 211, 110)   # brighter green for accents

HELV_TTC = "/System/Library/Fonts/Helvetica.ttc"

_font_cache = {}
def font(size: int, bold: bool = False):
    k = (size, bold)
    if k not in _font_cache:
        idx = 1 if bold else 0
        _font_cache[k] = ImageFont.truetype(HELV_TTC, size, index=idx)
    return _font_cache[k]

def text_size(draw: ImageDraw.ImageDraw, text: str, fnt) -> tuple[int, int]:
    bbox = draw.textbbox((0, 0), text, font=fnt)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]

def wrap_text(text: str, fnt, draw: ImageDraw.ImageDraw, max_width: int) -> list[str]:
    """Word-wrap text to fit within max_width pixels."""
    words = text.split()
    lines: list[str] = []
    current: list[str] = []
    for word in words:
        candidate = ' '.join(current + [word])
        w, _ = text_size(draw, candidate, fnt)
        if w <= max_width or not current:
            current.append(word)
        else:
            lines.append(' '.join(current))
            current = [word]
    if current:
        lines.append(' '.join(current))
    return lines

def render(out_path: Path) -> None:
    img = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Left brand stripe — vertical green bar
    stripe_w = 12
    draw.rectangle([(0, 0), (stripe_w, H)], fill=STRIPE)

    # Top-right small badge: "v0.8 · May 2026"
    version_fnt = font(22)
    badge = "v0.8 · May 2026"
    bw, bh = text_size(draw, badge, version_fnt)
    draw.text((W - bw - 60, 50), badge, fill=MUTED, font=version_fnt)

    # Headline: "Agents First"
    headline_fnt = font(140, bold=True)
    headline = "Agents First"
    hw, hh = text_size(draw, headline, headline_fnt)
    headline_x = 80
    headline_y = 160
    draw.text((headline_x, headline_y), headline, fill=WHITE, font=headline_fnt)

    # Accent underline beneath headline
    underline_y = headline_y + hh + 18
    draw.rectangle(
        [(headline_x, underline_y), (headline_x + hw, underline_y + 6)],
        fill=GREEN_BRIGHT,
    )

    # Subtitle / tagline — wrap to fit
    subtitle_fnt = font(40)
    subtitle = "Every product has two customers: the human who pays, and the agent who decides."
    subtitle_y = underline_y + 50
    subtitle_max_w = W - headline_x - 80
    lines = wrap_text(subtitle, subtitle_fnt, draw, subtitle_max_w)
    line_height = 56
    for i, line in enumerate(lines):
        draw.text((headline_x, subtitle_y + i * line_height), line, fill=MUTED, font=subtitle_fnt)

    # Footer: brand URL + author
    footer_fnt = font(28, bold=True)
    footer_url = "agentsfirst.dev"
    fw, fh = text_size(draw, footer_url, footer_fnt)
    footer_y = H - 60 - fh
    draw.text((headline_x, footer_y), footer_url, fill=GREEN_BRIGHT, font=footer_fnt)

    author_fnt = font(24)
    author = "Joshua Baer"
    aw, ah = text_size(draw, author, author_fnt)
    draw.text((W - aw - 60, footer_y + (fh - ah)), author, fill=MUTED, font=author_fnt)

    img.save(out_path, 'PNG', optimize=True)
    print(f"✓ Wrote {out_path} ({out_path.stat().st_size:,} bytes, {W}x{H})")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=str(REPO / 'og-image.png'))
    args = ap.parse_args()
    render(Path(args.out))


if __name__ == '__main__':
    main()
