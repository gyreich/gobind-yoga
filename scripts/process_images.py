#!/usr/bin/env python3
"""Build-time image processing for the Gobind Yoga site.

Reads curated source photos from source-images/, applies EXIF-safe
orientation, crops out phone-UI letterboxing where present, and writes
optimized JPEG + WebP variants (full + thumbnail) into images/.

Re-run this script any time source-images/ changes:
    python3 scripts/process_images.py
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source-images"
OUT = ROOT / "images"
OUT.mkdir(parents=True, exist_ok=True)

FULL_MAX_W = 1600
THUMB_MAX_W = 700
JPEG_Q = 82
WEBP_Q = 78

# (source filename, output basename, crop box or None (l, t, r, b) in source pixels)
#
# Privacy rule: Swaran is the only person who may be recognizable in any
# photo. Every crop below cuts out other people's faces while keeping as
# much of Swaran's pose as the framing allows. The "*-cropped" sources are
# hand-made crops (originals: cropped-pics-to-substitute-for-others/).
JOBS = [
    # Already cropped below the faces of the students and teacher behind her
    # (from hero-swaran-side-plank.png at (0, 650, 1186, 1327)), with the
    # skirt, legs and shoe behind her head painted out in GIMP
    # (source-images/hero-swaran-side-plank.xcf).
    ("hero-swaran-side-plank-edited.png", "hero-swaran-side-plank", None),
    ("standing-bind-cropped.JPG", "hero-standing-bind", None),
    ("backbend-kneeling-cropped.JPG", "backbend-kneeling", None),
    ("extended-leg-cropped.JPG", "extended-leg-pose", None),
    ("upward-dog-cropped.png", "upward-dog-class", None),
    ("IMG_6174.JPG", "seated-forward-fold-home", None),
    # Swaran's downward dog only: drops the teacher and students on the left
    # and the student in the foreground, whose head sits just below her hands.
    ("IMG_6175.JPG", "group-class-mysore-room", (955, 540, 2048, 1345)),
    # Top edge sits just below the assisting teacher's chin (and the student
    # photographing behind him); left edge clears the face of the student
    # lying in the background. Keeps the full backbend and the teacher's
    # hands at her feet, at the cost of her fingertips and the tops of her knees.
    ("IMG_3187.jpg", "assisted-backbend-training", (335, 2850, 3700, 4500)),
    # Narrow column around Swaran; the students around her are cut out.
    ("View recent photos 2.PNG", "standing-balance-class", (374, 464, 508, 868)),
]

def process(src_name, out_name, crop):
    path = SRC / src_name
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)
    if img.mode != "RGB":
        img = img.convert("RGB")
    if crop:
        img = img.crop(crop)

    for label, max_w in (("", FULL_MAX_W), ("-thumb", THUMB_MAX_W)):
        w, h = img.size
        target_w = min(max_w, w)  # never upscale beyond the source resolution
        if target_w < w:
            new_h = round(h * (target_w / w))
            variant = img.resize((target_w, new_h), Image.LANCZOS)
        else:
            variant = img
        jpg_path = OUT / f"{out_name}{label}.jpg"
        webp_path = OUT / f"{out_name}{label}.webp"
        variant.save(jpg_path, "JPEG", quality=JPEG_Q, optimize=True, progressive=True)
        variant.save(webp_path, "WEBP", quality=WEBP_Q, method=6)
        print(f"  wrote {jpg_path.name} ({variant.width}x{variant.height}) and {webp_path.name}")


def process_logo():
    path = SRC / "Gobind-Yoga-logo-transparent.png"
    img = Image.open(path).convert("RGBA")
    # Preserve transparency and proportions; just cap width for web delivery.
    max_w = 900
    if img.width > max_w:
        new_h = round(img.height * (max_w / img.width))
        img = img.resize((max_w, new_h), Image.LANCZOS)
    out_path = OUT / "gobind-yoga-logo.png"
    img.save(out_path, "PNG", optimize=True)
    print(f"  wrote {out_path.name} ({img.width}x{img.height}, transparent preserved)")


def process_banner():
    """The wide brand lockup on its own solid terracotta ground — used
    prominently in the homepage hero. Colors are untouched; only resized
    and re-encoded for the web."""
    path = SRC / "Gobind-Yoga-banner-terracotta.png"
    img = Image.open(path).convert("RGB")
    max_w = 1800
    if img.width > max_w:
        new_h = round(img.height * (max_w / img.width))
        img = img.resize((max_w, new_h), Image.LANCZOS)
    jpg_path = OUT / "gobind-yoga-banner-terracotta.jpg"
    webp_path = OUT / "gobind-yoga-banner-terracotta.webp"
    img.save(jpg_path, "JPEG", quality=90, optimize=True, progressive=True)
    img.save(webp_path, "WEBP", quality=88, method=6)
    print(f"  wrote {jpg_path.name} ({img.width}x{img.height}) and {webp_path.name}")


def extract_lotus_mark(img):
    """Isolate the standalone lotus mark from the full lockup (mark + wordmark)
    by finding the first wide gap in alpha content moving left to right, then
    tightly cropping to the mark's own bounding box."""
    alpha = img.split()[-1]
    w, h = img.size
    data = alpha.load()
    has_content = []
    for x in range(w):
        found = False
        for y in range(0, h, 3):
            if data[x, y] > 10:
                found = True
                break
        has_content.append(found)
    cols = [x for x, v in enumerate(has_content) if v]
    if not cols:
        raise ValueError("Logo appears fully transparent; cannot isolate mark")
    mark_end = cols[0]
    prev = cols[0]
    for c in cols[1:]:
        if c - prev > 8:  # gap between mark and wordmark
            mark_end = prev
            break
        prev = c
    strip = img.crop((0, 0, mark_end + 1, h))
    return strip.crop(strip.getbbox())


def process_favicon():
    path = SRC / "Gobind-Yoga-logo-transparent.png"
    img = Image.open(path).convert("RGBA")
    mark = extract_lotus_mark(img)
    fav_dir = OUT / "favicon"
    fav_dir.mkdir(parents=True, exist_ok=True)
    for size in (16, 32, 48, 180, 192, 512):
        mark.resize((size, size), Image.LANCZOS).save(fav_dir / f"icon-{size}.png")
    mark.save(fav_dir / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"  wrote favicon set to {fav_dir} (mark {mark.width}x{mark.height})")


if __name__ == "__main__":
    print("Processing logo...")
    process_logo()
    process_favicon()
    process_banner()
    print("Processing photographs...")
    for src_name, out_name, crop in JOBS:
        process(src_name, out_name, crop)
    print("Done.")
