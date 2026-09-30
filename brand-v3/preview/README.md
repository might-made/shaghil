# SHGHIL V3 — Phase 1C: Brand Application Preview

Branch: `shaghil-v3-brand-implementation`. Review-only deliverable — nothing
in this directory is wired into `index.html`, no application file was
changed, no live asset was replaced, and no branch was merged or deployed
to production.

## What this is

`index.html` is a **standalone, self-contained page** — open it directly in
a browser (double-click, or `file://` path) or serve it with any static
file server. It shows the complete bilingual شغّيل / SHGHIL identity applied
to realistic product surfaces, in all five founder-approved color
treatments, with a one-click theme switcher.

**Every wordmark and icon in this page is the actual, already-verified SVG
file from `brand-v3/` — inlined as real vector markup, not text, not a
screenshot, and not redrawn.** See "How the assets were sourced" below for
exactly which file backs which color and the (fill-color-only) recolors
that were required.

## Canva references

Both approved V3 references —
`https://canva.link/b0u41szx7oj0s5x` (brand) and
`https://canva.link/vbnr450dqbm41wx` (dashboard) — returned the same hard
403 at this environment's network egress policy as in Phases 1 and 1B
(confirmed via the proxy status endpoint). This preview was built from the
brief's own explicit written spec (the five treatments, the four hex
codes, "use existing application structure and realistic existing product
labels") and from the real `index.html`/`styles/foundations.css` of this
repo, not from the unseen reference images.

## The five treatments

1. **Charcoal on off-white** — `#1B1D1F` ink on `#F6F3EA`
2. **Off-white on charcoal** — `#F6F3EA` ink on `#1B1D1F`
3. **Charcoal on champagne** — `#1B1D1F` ink on `#D7BC91`
4. **Champagne on charcoal** — `#D7BC91` ink on `#1B1D1F`
5. **Charcoal + restrained electric-lime accents** — same wordmark/icon
   colors as treatment 2 (off-white on charcoal); `#E7F95B` appears **only**
   on functional UI elements (the active nav item, the sidebar's active
   state) — never on the wordmark or the icon, per the brief.

Click any of the five buttons in the sticky top bar to switch; the whole
page re-renders to that treatment.

## What's shown per treatment

- The complete bilingual logo, horizontal lockup and stacked lockup.
- A desktop dashboard header + navigation, using the app's real five nav
  labels (الرئيسية، هوية النشاط، هوية العلامة، مكتبة المنتجات، السجل) and
  its real six engine cards verbatim — same titles, same one-line
  descriptions, same inline stroke icons as `index.html` ships today.
- A **sidebar arrangement of that same navigation** — the live app itself
  uses a horizontal top bar, not a vertical sidebar; this is disclosed
  directly on the page (not hidden in a footnote) so it's never mistaken
  for an actual app screen. It uses the same five real labels, nothing
  invented.
- A mobile dashboard header (condensed logo + hamburger + one real engine
  card).
- An app splash screen (stacked lockup + the app's real
  "Built by MIGHT MADE · V0.9" tagline — no invented copy or metrics).
- Both candidate app icons from Phase 1B (Option A ش, Option B غ+shadda)
  side by side, in that treatment's colors.

## How the assets were sourced (no redrawing, ever)

Every lockup and icon shown is one of:

- **Verbatim**, byte-identical to an existing `brand-v3/` file (used
  wherever that exact color combination already existed):
  `wordmarks/lockup-horizontal-light.svg` / `-dark.svg`,
  `wordmarks/lockup-stacked-light.svg` / `-dark.svg`,
  `icon-refinement-1b/option-a-sheen-light.svg` / `-dark.svg`,
  `icon-refinement-1b/option-b-ghain-refined-light.svg` / `-dark.svg`.
- **A fill-color-only recolor** of one of those same files, for the two
  combinations Phases 1/1B didn't ship (off-white icon marks, and the
  champagne-fill lockups needed for treatment 4). These live in
  `recolored-assets/` and were produced by `recolor.py`, which does an
  exact string substitution of the hex color value and then **asserts**
  that every `d="..."` path string in the file is byte-for-byte identical
  before vs. after — the letterform geometry never changes, only the paint
  color. I independently re-verified this after generation by diffing the
  extracted path data of every source/recolor pair; all six are identical.
  No shaping, drawing, or approximation of any kind was performed in this
  task — the shadda-bearing Arabic path data is exactly what Phase 1's
  HarfBuzz-based pipeline produced.

## Shadda verification (required quality gate)

`screenshots/shadda-verification-zoom-treatment-1.png` and
`-treatment-2.png` are tight crops on the stacked lockup's Arabic wordmark,
captured directly from the rendered page (Chromium, not a mockup). Both
confirm: all three dots above ش, and the authentic U+0651 shadda glyph
sitting directly above غ — identical in both crops, as expected, since only
the fill color differs between them (the underlying path is the one
verified in Phase 1).

## Screenshots (since no deployed preview URL exists for this exact commit yet)

`screenshots/` holds a full-page desktop capture (1300px) and a real mobile-
viewport capture (420px) for every one of the five treatments, plus the two
shadda close-ups above. These were captured by actually loading
`brand-v3/preview/index.html` in headless Chromium from its real path in
this repo (so the same relative font paths used at review time were
exercised), not from a mocked environment.

## Local preview instructions

```
cd shaghil
python3 -m http.server 8080
# then open http://localhost:8080/brand-v3/preview/index.html
```

or simply open `brand-v3/preview/index.html` directly in a browser — it has
no build step and no server-side dependency. (A `file://` open also works;
the relative font-face paths resolve either way, verified directly.)

## Typography note

The desktop/mobile/splash mockups' UI text (nav labels, engine card titles,
tagline) uses the app's real, self-hosted IBM Plex Sans / IBM Plex Sans
Arabic font files (`../../fonts/*.woff2`, the same files `styles/
foundations.css` already loads), referenced with a relative path so this
standalone page doesn't depend on `index.html` or any absolute `/fonts/`
webroot path. Verified directly: all six font files return 200 when the
page is opened from its real path in this repo.

## QA

- `npm run qa`: full existing regression suite — unaffected (no application
  file was touched; this task only adds files under `brand-v3/preview/`).
- Every SVG (the six recolors) validated as well-formed XML.
- Independent geometry check: every recolor's extracted `d="..."` path data
  diffed byte-for-byte against its verified source file — all identical.
- Rendered all five treatments (desktop 1300px and mobile 420px) with
  headless Chromium and visually inspected each.
- Shadda and three-dot ش verification performed on rendered screenshots,
  not on source markup alone.

## Not done in this task (by design)

- No application file, layout, dashboard, or deployment changed.
- No live `/brand/` asset replaced.
- No merge, no production deployment.
- No Canva reference could be opened (network policy); built from the
  brief's explicit spec and the app's own real structure/copy instead.
