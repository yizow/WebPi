#!/usr/bin/env python3
"""Resize and recompress images for the WebPi site.

Usage:
    python3 tools/compress_images.py OUTPUT_DIR IMAGE [IMAGE ...]

Each input is rotated according to its EXIF orientation, scaled to fit within
--max-edge, and written to OUTPUT_DIR/<name>.jpg as a progressive JPEG. All
metadata (including GPS location) is dropped. Inputs are never modified.

Requires Pillow:  pip3 install Pillow
"""

import argparse
import os
import sys

from PIL import Image, ImageOps

MAX_EDGE = 1200
QUALITY = 80


def compress(path, out_dir, max_edge, quality):
    """Write one compressed copy of ``path`` into ``out_dir``; return (src, dst)."""
    with Image.open(path) as src:
        image = ImageOps.exif_transpose(src).convert("RGB")

    before_px, before_bytes = image.size, os.path.getsize(path)
    image.thumbnail((max_edge, max_edge), Image.LANCZOS)

    name = os.path.splitext(os.path.basename(path))[0] + ".jpg"
    out_path = os.path.join(out_dir, name)
    image.save(out_path, "JPEG", quality=quality, optimize=True, progressive=True)

    # Re-encoding a screenshot or an already-small image can make it bigger.
    # Keep every byte with a second, looser pass rather than shipping a bigger file.
    if os.path.getsize(out_path) > before_bytes:
        image.save(out_path, "JPEG", quality=max(quality - 20, 30),
                   optimize=True, progressive=True)

    return (path, out_path, before_px, image.size, before_bytes, os.path.getsize(out_path))


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument("out_dir", help="directory to write the compressed copies to")
    parser.add_argument("images", nargs="+", help="image files to compress")
    parser.add_argument("--max-edge", type=int, default=MAX_EDGE,
                        help=f"longest side in pixels (default {MAX_EDGE})")
    parser.add_argument("--quality", type=int, default=QUALITY,
                        help=f"JPEG quality, 1-100 (default {QUALITY})")
    args = parser.parse_args(argv)

    os.makedirs(args.out_dir, exist_ok=True)

    failures = 0
    for path in args.images:
        try:
            src, dst, before_px, after_px, before_bytes, after_bytes = compress(
                path, args.out_dir, args.max_edge, args.quality)
        except (OSError, ValueError) as exc:
            print(f"{path}: skipped ({exc})", file=sys.stderr)
            failures += 1
            continue
        print(f"{src}\n  {before_px[0]}x{before_px[1]} {before_bytes // 1024}K"
              f" -> {after_px[0]}x{after_px[1]} {after_bytes // 1024}K  {dst}")

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
