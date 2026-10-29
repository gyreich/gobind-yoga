import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

"""Rebuild the wall, baseboard and floor where the bags were painted out of
the handstand photo. Usage: retouch_handstand.py <cleaned up.png> <retouched.png>"""
src, out = sys.argv[1], sys.argv[2]
full = Image.open(src).convert("RGB")
OX, OY = 182, 130                      # gallery crop origin
im = full.crop((OX, OY, 750, 1100))
a = np.asarray(im).astype(float)
H, W, _ = a.shape
rng = np.random.default_rng(7)

def noise(sd, blur=1.0):
    n = rng.normal(0, sd, (H, W)).astype(np.float32)
    img = Image.fromarray(((n + 128).clip(0, 255)).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))
    return (np.asarray(img).astype(float) - 128)[..., None]

def poly_mask(pts, feather=1.5):
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    return np.asarray(m.filter(ImageFilter.GaussianBlur(feather))).astype(float)[..., None] / 255

def key_not_swaran():
    mx, mn = a.max(2), a.min(2)
    luma = a.mean(2)
    k = ((mx - mn) < 30) & (luma > 125)
    m = Image.fromarray((k * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1))
    return np.asarray(m).astype(float)[..., None] / 255

out_a = a.copy()
def apply(fill, mask):
    global out_a
    out_a = out_a * (1 - mask) + fill * mask

# 1. Grey wall column: per-column colour from the clean part above her legs.
col = a[150:300, :, :].mean(0)                       # (W,3)
panel = np.broadcast_to(col[None], (H, W, 3)).copy()
panel = np.asarray(Image.fromarray(panel.clip(0, 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(6))).astype(float)
panel += noise(3.5, 0.8)
pm = poly_mask([(95, 360), (330, 360), (330, 589), (95, 589)], 0.8) * key_not_swaran()
apply(panel, pm)

# 2. White alcove below the heater shelf: smooth it out.
white = np.zeros_like(a)
white[:] = np.array([224, 229, 234])
grad = np.linspace(0, -10, H)[:, None, None]          # slightly darker going down
white = white + grad + noise(2.5, 0.8)
apply(white, poly_mask([(0, 462), (95, 458), (95, 586), (0, 586)], 0.8))

# 3. Baseboard: a clean straight strip.
base = np.zeros_like(a); base[:] = np.array([207, 199, 195]); base += noise(3, 0.8)
bm = np.maximum(poly_mask([(0, 585), (300, 589), (300, 627), (0, 623)], 0.7) * key_not_swaran(),
                poly_mask([(0, 585), (262, 589), (262, 626), (0, 623)], 0.7))
apply(base, bm)
# soft shadow line where baseboard meets floor
shadow = out_a * 0.82
apply(shadow, poly_mask([(0, 621), (300, 625), (300, 628), (0, 624)], 0.8) * key_not_swaran() * 0.7)

# 4. Floor: mirror clean boards from just below the old bag area upward,
# stretched sideways (the grain runs left-right, so the stretch doesn't show).
SEAM = 708                                            # first row of untouched floor
floor = out_a.copy()
xs = np.linspace(112, 245, 300).astype(int)           # clean boards between hearth and mat
for y in range(600, SEAM):
    sy = SEAM + (SEAM - y)
    floor[y, 0:300] = a[sy, xs]
seam_fade = np.ones((H, 1, 1))
seam_fade[SEAM - 12:SEAM + 4, 0, 0] = np.linspace(1, 0, 16)
fm = poly_mask([(0, 624), (264, 627), (264, SEAM + 4), (0, SEAM + 4)], 1.5)
# keep her arm and head: skip skin-tone / dark pixels near her
mx, mn, luma = a.max(2), a.min(2), a.mean(2)
skin = (a[..., 0] > 185) & ((a[..., 0] - a[..., 2]) > 25)
dark = luma < 70
keep = Image.fromarray(((skin | dark) * 255).astype(np.uint8))
keep = keep.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
keep = np.asarray(keep).astype(float)[..., None] / 255
apply(floor, fm * seam_fade * (1 - keep))
apply(out_a * 0.8, poly_mask([(0, 623), (262, 626), (262, 629), (0, 626)], 0.8) * 0.6)

# 5. Two stray grey dots left of the heater.
for (cx, cy, r) in [(3, 140, 9), (93, 296, 6)]:
    y0, y1, x0, x1 = max(cy - r, 0), cy + r, max(cx - r, 0), cx + r
    patch = Image.fromarray(out_a[y0:y1, x0:x1].clip(0, 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(9))
    out_a[y0:y1, x0:x1] = np.asarray(patch)

# stray dot on the textured wall at the left edge: copy wall from just above it
out_a[128:154, 0:16] = a[100:126, 0:16]

res = Image.fromarray(out_a.clip(0, 255).astype(np.uint8))
full.paste(res, (OX, OY))
full.save(out)
