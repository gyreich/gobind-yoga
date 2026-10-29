#!/usr/bin/env python3
"""Build-time image processing for the Gobind Yoga site.

Reads curated source photos from source-images/, applies EXIF-safe
orientation, crops out phone-UI letterboxing where present, and writes
optimized JPEG + WebP variants (full + thumbnail) into images/.

Re-run this script any time source-images/ changes:
    python3 scripts/process_images.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source-images"
OUT = ROOT / "images"
OUT.mkdir(parents=True, exist_ok=True)

FULL_MAX_W = 1600
THUMB_MAX_W = 700
JPEG_Q = 82
WEBP_Q = 78

# (source filename, output basename, crop box or None (l, t, r, b) in source pixels)
# Outputs listed in MIRROR are flipped left to right after cropping.
MIRROR = {"seated-pranayama-class"}
# Outputs listed in LIFT get their shadows and midtones brightened by this
# gamma (highlights stay put, so bright windows don't blow out), plus a
# touch of contrast and color, to sit level with the rest of the gallery.
# Outputs listed in BLUR get these ellipses (l, t, r, b in source pixels,
# before cropping) blurred beyond recognition: background faces that a
# crop can't remove without losing part of Swaran's pose.
BLUR = {
    "assisted-backbend-training": [(990, 2600, 1200, 2860), (300, 2870, 500, 3100)],
}
LIFT = {
    "standing-balance-class": 1.8,
    "hero-standing-bind": 1.25,
    "standing-twist-home": 1.25,
    "seated-pranayama-class": 1.5,
}
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
    # Square crop centered on Swaran and her mat, so she fills the frame;
    # the top edge sits just below the wall and baseboard.
    ("IMG_6174.JPG", "seated-forward-fold-home", (240, 600, 1260, 1620)),
    # Swaran's downward dog only: drops the teacher and students on the left
    # and the student in the foreground, whose head sits just below her hands.
    ("IMG_6175.JPG", "group-class-mysore-room", (955, 540, 2048, 1345)),
    # Manju Jois assisting Swaran (he gave permission to be shown, 2026-10-28).
    # The top edge includes his head; the faces of the student photographing
    # behind them and the student lying on the left are blurred (see BLUR).
    ("IMG_3187.jpg", "assisted-backbend-training", (335, 2200, 3700, 4500)),
    # Swaran seated in front; the top edge sits below the faces of the three
    # students behind her, trimming only the top of her head wrap. The right
    # edge (left, once mirrored) is trimmed to the forward fold's 3:4 shape.
    ("IMG_5743.JPG", "seated-pranayama-class", (260, 690, 1278, 2048)),
    # Home studio, Swaran alone. Trims a sliver on the left (part of another
    # person) and the bottom edge (a stray pink item).
    ("IMG_3198 (1).JPG", "standing-twist-home", (80, 0, 1536, 2180)),
    # Phone screenshot of a video frame, with the pile of bags behind her
    # painted out in GIMP (exported from the "cleaned up" .xcf). The crop
    # drops the phone's top bar and the film strip, and the left edge clears
    # the teacher standing beside her.
    ("4434722A-CDDB-4C2A-96B2-9223BB15BA2E cleaned up.png", "arm-balance-class", (182, 130, 750, 1100)),
    # Narrow column around Swaran; the students around her are cut out.
    ("View recent photos 2.PNG", "standing-balance-class", (374, 464, 508, 868)),
]

def process(src_name, out_name, crop):
    path = SRC / src_name
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)
    if img.mode != "RGB":
        img = img.convert("RGB")
    if out_name in BLUR:
        mask = Image.new("L", img.size, 0)
        draw = ImageDraw.Draw(mask)
        for box in BLUR[out_name]:
            draw.ellipse(box, fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(25))
        img = Image.composite(img.filter(ImageFilter.GaussianBlur(40)), img, mask)
    if crop:
        img = img.crop(crop)
    if out_name in MIRROR:
        img = ImageOps.mirror(img)
    if out_name in LIFT:
        gamma = LIFT[out_name]
        curve = [round(255 * (i / 255) ** (1 / gamma)) for i in range(256)]
        img = img.point(curve * 3)
        img = ImageEnhance.Contrast(img).enhance(1.08)
        img = ImageEnhance.Color(img).enhance(1.1)

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
