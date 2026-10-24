# Oyinbo Bar & Grill Lounge — website

Static site for **Oyinbo Bar & Grill Lounge**, 2300 Finch Ave W, Unit 68,
North York, ON M9M 2Y3. Nothing needs to be installed to serve it — the `.html`
files at the root are the site.

## Structure

```
index.html  menu.html  nightlife.html  about.html  visit.html   generated pages
favicon.svg  robots.txt  sitemap.xml

assets/
  css/
    tokens.css       colour, type scale, spacing, radii, shadows, motion
    base.css         reset, document defaults, typography, a11y
    layout.css       shell, header, nav, footer, containers, grids
    components.css   buttons, chips, cards, dishes, accordion, gallery, hours
    sections.css     composed page blocks (hero, split, nights, panel, find us)
    site.css         GENERATED — the five above concatenated; pages link only this
  js/
    main.js          nav, accordion, reveal, lightbox, open/closed status
  img/
    venue/           storefront photo (WebP)
    dishes/          dish photos (WebP)
    og-cover.jpg     1200×630 social preview card

.build/              page sources — edit these, not the root .html
  header.html        shared masthead + mobile drawer
  footer.html        shared footer
  *.body.html        each page's unique content
  index.head.html    home-page-only metadata (geo tags, JSON-LD, preload)
  compose.py         bundles the CSS and stitches the pages together
```

## Editing

Change **`.build/`** or **`assets/css/*.css`**, then rebuild:

```bash
python .build/compose.py
```

That regenerates `assets/css/site.css` and all five root `.html` files, and sets
`aria-current="page"` on the right nav item for each page. Anything written
directly into `site.css` or the root `.html` files is overwritten on the next run.

To preview locally:

```bash
python -m http.server 8777
```

## Design system

Three colours, all declared in `tokens.css`:

| Role | Token family | Used for |
| --- | --- | --- |
| Purple | `--plum-950…300` | every surface: page, bands, cards, borders |
| Yellow | `--yellow-100…600` | primary accent, prices, primary buttons |
| Green | `--green-200…600` | second accent, open-now state, rules, green buttons |

`--amber-300/400` is a narrow heat tint used only on **Spicy** marks. Semantic
aliases (`--bg`, `--bg-band`, `--bg-card`, `--line`, `--text`, `--accent`,
`--accent-2`) sit on top, so a recolour means editing `tokens.css` alone.

Type is Fraunces (display) over Plus Jakarta Sans (UI), both from Google Fonts,
loaded at only the weights the stylesheets use.

## Performance

* Images are WebP, resized to roughly twice their display width.
  1.5 MB of JPEG became 620 KB — about 60% smaller.
* The hero photo is preloaded; everything below the fold is `loading="lazy"`
  with intrinsic `width`/`height` so nothing shifts as it loads.
* One stylesheet request instead of five (`site.css`, ~46 KB uncompressed).
* `main.js` is deferred, has no dependencies, and the page is fully readable
  without it — the scroll-reveal only hides content once `html.js` is set.

## Deployment

Served by GitHub Pages from `main` at the repository root:
<https://zaddywebbuilds.github.io/OYINBO-LOUNGE-RESTAURANT/>

There is no build step on the server — whatever is committed is what ships, so
run `python .build/compose.py` and commit the regenerated files before pushing.

## Social previews

`assets/img/og-cover.jpg` (1200×630, ~90 KB) is the card WhatsApp, Facebook,
Slack, iMessage and X will show. It is declared with `og:image:width`,
`og:image:height`, `og:image:type` and `og:image:alt`, plus `twitter:image`.

It is generated, not hand-drawn — rerun the generator if the branding changes.
WhatsApp caches aggressively, so after deploying, re-scrape the URL in the
[Facebook sharing debugger](https://developers.facebook.com/tools/debug/) to
refresh it.

## Where the content came from

* **Copy, menu and prices** — the business's own site, `oyinbolounge.com`
  (CAD, tax not included).
* **Phone and address** — the Google Business Profile:
  **+1 437-225-9276**, 2300 Finch Ave W, Unit 68.
  Two other numbers are in circulation and are *not* used here: the website
  lists 647-368-6226 and the storefront sign reads 416-740-6626. Worth
  confirming which lines are actually answered.
* **Hours** — the door sign and the website, which agree:
  Sun 5pm–1am · Mon–Tue 12pm–1am · Wed 12pm–2am · Thu–Sat 12pm–3am.
  These live in one place, `HOURS` at the top of `assets/js/main.js`, which
  drives the live open/closed badge (computed in `America/Toronto`) and the
  highlighted row in the hours tables. The same hours are repeated in the
  JSON-LD in `.build/index.head.html` — update both.
* **Photos** — the business's Google Business Profile: the storefront plus
  jollof, nkwobi, plantain and yam, grilled tilapia, suya, fried yam, grilled
  chicken and fried fish. Full-resolution originals are kept in `gbp-images/`.

## Before launch

1. **Replace the ten stand-in dish images.** These come from the supplied
   concept kit because the Google profile has no photo of those plates:
   `asun`, `ofada-ayamase`, `isi-ewu`, `goat-pepper-soup`, `fish-pepper-soup`,
   `pepper-snail`, `ponmo`, `fried-rice`, `turkey-suya`, `pepper-wings`.
   The kit's own notes say they are AI-generated illustrations, **not**
   photographs of Oyinbo's food. `asun` and `goat-pepper-soup` matter most —
   both sit on the home page.
2. **Confirm the phone number** against the three above.
3. **Switch to the real domain.** Every absolute URL — canonical, `og:url`,
   `og:image`, the JSON-LD, `sitemap.xml` and `robots.txt` — is built from
   `SITE_URL` at the top of `.build/compose.py`. Change that one line to
   `https://www.oyinbolounge.com/`, rebuild, and point the domain at the
   repo (Settings → Pages → custom domain).
4. **Refresh the rating.** The `aggregateRating` in the home page JSON-LD
   (5.0 from 5 reviews) reflects the Google profile as of 24 October 2026.
