"""Regenerate assets/img/og-cover.jpg, the 1200x630 link-preview card.

Run from the project root:  python .build/tools/make_og.py
Uses the same plum / yellow / green palette as the site.
"""
import math
import pathlib
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parents[2]
W, H = 1200, 630

PLUM_950 = (21, 8, 35)
PLUM_900 = (34, 16, 58)
YELLOW = (255, 213, 74)
GREEN = (55, 200, 113)
VIOLET = (139, 95, 196)
MIST = (251, 247, 255)
MUTED = (203, 185, 230)

F = "C:/Windows/Fonts/"
f_disp = ImageFont.truetype(F + "georgiab.ttf", 92)
f_sub = ImageFont.truetype(F + "seguisb.ttf", 25)
f_body = ImageFont.truetype(F + "segoeui.ttf", 27)
f_small = ImageFont.truetype(F + "seguisb.ttf", 22)

img = Image.new("RGB", (W, H), PLUM_900)
glow = Image.new("RGB", (W, H), PLUM_900)
gd = ImageDraw.Draw(glow)
for cx, cy, r, col in [(60, -40, 520, YELLOW), (1180, 70, 460, GREEN), (620, 760, 760, VIOLET)]:
    gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
glow = glow.filter(ImageFilter.GaussianBlur(190))
img = Image.blend(img, glow, 0.30)
grad = Image.linear_gradient("L").resize((W, H)).point(lambda v: int(v * 0.55))
img = Image.composite(Image.new("RGB", (W, H), PLUM_950), img, grad)

photo = Image.open(ROOT / "gbp-images" / "gbp-storefront.jpg").convert("RGB")
CW, CH = 470, 470
scale = max(CW / photo.width, CH / photo.height)
photo = photo.resize((math.ceil(photo.width * scale), math.ceil(photo.height * scale)), Image.LANCZOS)
left = (photo.width - CW) // 2
top = max(int(photo.height * 0.40) - CH // 2, 0)
photo = photo.crop((left, top, left + CW, top + CH))

mask = Image.new("L", (CW, CH), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, CW - 1, CH - 1], radius=30, fill=255)
CX, CY = 668, 80
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(shadow).rounded_rectangle(
    [CX + 6, CY + 16, CX + CW + 6, CY + CH + 16], radius=30, fill=(10, 4, 18, 190))
img = Image.alpha_composite(img.convert("RGBA"), shadow.filter(ImageFilter.GaussianBlur(26))).convert("RGB")
img.paste(photo, (CX, CY), mask)

d = ImageDraw.Draw(img)
d.rounded_rectangle([CX, CY, CX + CW, CY + CH], radius=30, outline=(100, 66, 150), width=2)

x = 72
d.text((x, 96), "OYINBO", font=f_disp, fill=YELLOW)
d.text((x + 6, 206), "B A R   \u00b7   G R I L L   \u00b7   L O U N G E", font=f_sub, fill=MIST)
d.line([(x + 4, 268), (x + 68, 268)], fill=GREEN, width=4)
for i, line in enumerate(["Nigerian kitchen, craft bar", "and afrobeats nights."]):
    d.text((x, 300 + i * 40), line, font=f_body, fill=MIST)
d.text((x, 424), "2300 FINCH AVE W, UNIT 68  \u00b7  NORTH YORK", font=f_small, fill=MUTED)

d.rounded_rectangle([x, 468, x + 268, 520], radius=26, fill=(45, 24, 72), outline=(100, 66, 150))
d.ellipse([x + 22, 488, x + 34, 500], fill=GREEN)
d.text((x + 46, 482), "OPEN LATE  \u00b7  TILL 3AM", font=f_small, fill=(123, 232, 166))

out = ROOT / "assets" / "img" / "og-cover.jpg"
img.save(out, "JPEG", quality=86, optimize=True, progressive=True)
print(f"wrote {out.relative_to(ROOT)}  {img.size[0]}x{img.size[1]}  {out.stat().st_size // 1024}KB")
