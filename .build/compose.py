"""Compose the static pages from the shared shell + per-page body.

Run from the project root:  python .build/compose.py
Edit .build/*.body.html (and this file's PAGES table) rather than the
generated .html at the root, or the next run will overwrite your changes.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
BUILD = ROOT / ".build"

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="https://www.oyinbolounge.com/{canonical}">

<meta name="theme-color" content="#22103A">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="Oyinbo Bar &amp; Grill Lounge">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="https://www.oyinbolounge.com/{canonical}">
<meta property="og:image" content="https://www.oyinbolounge.com/assets/img/og-cover.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Oyinbo Bar &amp; Grill Lounge — Nigerian kitchen, craft bar and afrobeats nights at 2300 Finch Ave W, Unit 68, North York">
<meta property="og:locale" content="en_CA">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://www.oyinbolounge.com/assets/img/og-cover.jpg">

<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="mask-icon" href="favicon.svg" color="#FFD54A">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">

<link rel="stylesheet" href="assets/css/site.css">
<script>document.documentElement.classList.add("js");</script>
{extra_head}</head>
<body>
"""

TAIL = """
<div class="dock">
  <a class="btn btn--primary" href="tel:+14372259276">Call</a>
  <a class="btn btn--ghost" href="https://maps.google.com/?cid=5976283573163495680" target="_blank" rel="noopener">Directions</a>
</div>

<script src="assets/js/main.js" defer></script>
</body>
</html>
"""

PAGES = [
    {
        "slug": "index.html",
        "title": "Oyinbo Bar &amp; Grill Lounge | Nigerian Restaurant in North York, Toronto",
        "description": "Nigerian kitchen, craft bar and afrobeats nights at 2300 Finch Ave West, North York. Suya, asun, jollof, pepper soup and late-night energy until 3am Thursday to Saturday.",
        "image": "assets/img/venue/storefront.webp",
        "canonical": "",
        "extra_head_file": "index.head.html",
        "og_type": "restaurant",
    },
    {
        "slug": "menu.html",
        "title": "Menu | Oyinbo Bar &amp; Grill Lounge, North York",
        "description": "The full Oyinbo menu: jollof, ofada and ayamase, asun, isi ewu, nkwobi, ram and turkey suya, pepper soups, grilled tilapia, beers and premium spirits. Prices in CAD.",
        "image": "assets/img/dishes/suya.webp",
    },
    {
        "slug": "nightlife.html",
        "title": "Nightlife &amp; Events | Oyinbo Bar &amp; Grill Lounge, North York",
        "description": "Afrobeats, amapiano and live highlife in North York. Friday Vibes with DJ Rolland, Afrobeats Saturdays, Sunday sundowns and private bookings any night.",
        "image": "assets/img/venue/storefront.webp",
    },
    {
        "slug": "about.html",
        "title": "Our Story | Oyinbo Bar &amp; Grill Lounge, North York",
        "description": "Founded by Mola Stanley Ilesanmi, Oyinbo brings the confidence of Lagos hospitality to North York. A Nigerian kitchen and craft bar built for every background.",
        "image": "assets/img/venue/storefront.webp",
    },
    {
        "slug": "visit.html",
        "title": "Visit &amp; Reserve | Oyinbo Bar &amp; Grill Lounge, North York",
        "description": "2300 Finch Ave W, Unit 68, North York. Opening hours, parking, transit and how to reserve a table or book the room for a private event.",
        "image": "assets/img/venue/storefront.webp",
    },
]


def shell(fragment: str, slug: str) -> str:
    """Mark the current page in both the desktop nav and the mobile drawer."""
    out = fragment.replace(' aria-current="page"', "")
    out = out.replace(
        f'class="nav__link" href="{slug}"',
        f'class="nav__link" href="{slug}" aria-current="page"',
    )
    out = re.sub(
        rf'(<a href="{re.escape(slug)}">)(<span class="num">)',
        r'<a href="' + slug + r'" aria-current="page">\2',
        out,
    )
    return out


CSS_ORDER = ["tokens.css", "base.css", "layout.css", "components.css", "sections.css"]


def bundle_css() -> None:
    """Concatenate the five source stylesheets into the one file pages link.

    The split under assets/css is for humans; the browser gets a single
    request. Edit the parts, never site.css — it is regenerated here.
    """
    src = ROOT / "assets" / "css"
    parts = [
        "/* GENERATED by .build/compose.py — edit the source files, not this. */"
    ]
    for name in CSS_ORDER:
        body = (src / name).read_text(encoding="utf-8").strip()
        parts.append("/* ===== {} ===== */\n{}".format(name, body))
    out = src / "site.css"
    out.write_text("\n\n".join(parts) + "\n", encoding="utf-8")
    print("bundled site.css (%d KB)" % (out.stat().st_size // 1024))


def main() -> None:
    bundle_css()

    header = (BUILD / "header.html").read_text(encoding="utf-8")
    footer = (BUILD / "footer.html").read_text(encoding="utf-8")

    for page in PAGES:
        page = dict(page)
        page.setdefault("canonical", page["slug"])
        page.setdefault("og_type", "website")
        extra_file = page.pop("extra_head_file", None)
        extra = (BUILD / extra_file).read_text(encoding="utf-8") if extra_file else ""

        body_file = BUILD / (page["slug"].replace(".html", "") + ".body.html")
        body = body_file.read_text(encoding="utf-8")
        html = (
            HEAD.format(**page, extra_head=extra)
            + shell(header, page["slug"])
            + "\n<main id=\"main\">\n"
            + body
            + "\n</main>\n\n"
            + shell(footer, page["slug"])
            + TAIL
        )
        (ROOT / page["slug"]).write_text(html, encoding="utf-8")
        print("wrote", page["slug"])


if __name__ == "__main__":
    main()
