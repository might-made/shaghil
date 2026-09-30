# SHGHIL V3 — Phase 1D: Full Bilingual Logo Application Preview

Branch: `shaghil-v3-brand-implementation`. Review-only — no application file
was changed, no live asset was replaced, and no branch was merged or
deployed. **`brand-v3/preview/index.html` (Phase 1C) is untouched** —
confirmed via `git diff` before this commit, and this task added a wholly
separate page (`brand-v3/preview-1d/index.html`) rather than editing it.

## What this answers

The founder provisionally prefers **Treatment 4 (champagne `#D7BC91` on
charcoal `#1B1D1F`)**, pending one more comparison: does the identity work
better as a **compact icon** (today's pattern) or as the **complete
bilingual logo شغّيل / SHGHIL** used as the principal identity throughout
the app? This page shows both, in Treatment 4 only, with a toggle.

## Canva references

Both `https://canva.link/b0u41szx7oj0s5x` and
`https://canva.link/vbnr450dqbm41wx` returned the same 403 at this
environment's network egress policy as in every prior phase (re-confirmed,
not assumed carried over). Built from the brief's explicit spec and the
app's real `index.html` copy/structure.

## Never regenerated, never approximated

Every wordmark shown is one of two already-verified, already-committed
files — nothing new was shaped, drawn, or recolored in this task:

- `brand-v3/preview/recolored-assets/lockup-horizontal-champagne.svg`
- `brand-v3/preview/recolored-assets/lockup-stacked-champagne.svg`

Both are Phase 1C's own committed, geometry-verified champagne recolors of
the founder-approved shaping-pipeline output. I re-verified their path
geometry against `brand-v3/wordmarks/lockup-{horizontal,stacked}-light.svg`
again before writing this page — identical. The two candidate icons
(`icon-refinement-1b/option-a-sheen-dark.svg`,
`option-b-ghain-refined-dark.svg`) are read and used byte-for-byte as-is.

**Shadda/dots verification:** `screenshots/shadda-verification-zoom.png` is
a tight crop of the splash screen's rendered stacked lockup — all three
dots above ش and the authentic U+0651 shadda directly above غ, confirmed
in Chromium-rendered output, not source markup alone.

## Version 1 vs Version 2

A toggle in the sticky top bar swaps between them at the same viewport and
palette; a small side-by-side thumbnail strip at the top of the page also
shows both headers together at a glance.

- **Version 1 — Compact Icon (baseline).** Uses Option B
  (غ + shadda, the "existing, refined" icon from Phase 1B) at small size in
  every placement — header, sidebar, splash, and the real landing screen —
  standing in for "the app as it is today," recolored to Treatment 4.
- **Version 2 — Full Bilingual Logo.** Replaces that compact mark with the
  complete شغّيل / SHGHIL lockup as the principal identity everywhere:
  the horizontal lockup in the main dashboard header, the stacked lockup
  in the sidebar and on the splash screen, and the horizontal lockup again
  on the real landing screen and the mobile header.

Each version shows, identically structured so only the logo treatment
differs:

1. **Desktop dashboard** — a sidebar + main-content layout. Disclosed
   directly on the page (as Phase 1C also did): the live app has no
   sidebar today (one horizontal top bar); a sidebar is shown here only so
   both logo placements the brief asked for (header *and* sidebar) can be
   reviewed together. The five nav labels and six engine cards are the
   app's real copy, verbatim from `index.html`. RTL is real, not
   simulated: `dir="rtl"` with a plain flex row puts the sidebar on the
   right and the main content on the left, matching the app's own
   direction.
2. **Mobile dashboard header at 390px** — the actual width specified in
   the brief. Verified directly (not assumed): the full horizontal lockup
   fits with comfortable margins alongside the menu icon, no clipping.
3. **Splash/loading screen** — full-bleed charcoal, the wordmark centered,
   the app's real tagline below it.
4. **Landing/welcome screen** — SHGHIL has no sign-in or authentication
   screen at all (confirmed: there is no account system in this product),
   so per the brief's own instruction this uses the product's actual entry
   screen instead, labeled as such: the real `#welcome` section's copy,
   verbatim from `index.html` (headline, body line, both button labels).
5. Below both versions, unaffected by the toggle: a **favicon / home-screen
   icon technical exception** — a small browser-tab mock plus both Phase 1B
   candidates at true 16/32/64px. Neither is selected here; the brief was
   explicit that this decision stays open for later.

## A real bug caught and fixed during this task

The desktop dashboard mockup (sidebar + main content, no responsive
breakpoint) was initially also being captured inside the 390px mobile
screenshot pass, where it squeezed into a broken, wrapped, illegible mess —
not a real representation of anything, just an artifact of screenshotting
a desktop-only layout at mobile width. Fixed by hiding that block below
~700px with a CSS media query and showing a short explanatory note in its
place; the mobile header block (already designed for 390px) is what
actually represents this width. Screenshots in this submission are of the
fixed version.

A second issue, caught the same way: the favicon-exception section's
labels mix an English sentence with a single inline Arabic word/phrase
(e.g. "Option A (ش) — 16 / 32 / 64px"); inside this page's `dir="rtl"`
document, the Unicode bidi algorithm was reordering the neutral
slash-separated number group to "64 / 32 / 16" even though the source
order was correct. Fixed by wrapping just the embedded Arabic span in
`<bdi>` (the bidi-isolate element built for exactly this) instead of
forcing the whole label `dir="ltr"`, which hadn't been sufficient alone.
Re-verified by reading the rendered pixels, not just the DOM source order.

## Palette usage in this page

- Champagne `#D7BC91` — the logo/wordmark, headings, primary button,
  borders (restrained, low-opacity).
- Charcoal `#1B1D1F` — every dark surface (dashboard, sidebar, mobile
  header, splash, landing card).
- Off-white `#F6F3EA` — body/description text, for readability against
  charcoal, per the brief's explicit palette-usage rule.
- Lime `#E7F95B` — used once, restrained: the active nav item's highlight
  (a functional state), never on the wordmark or icon.

No new gradient, typeface, or visual direction was introduced; no metric
or product feature was invented anywhere on the page.

## Screenshots

`screenshots/` holds real desktop (1300px) and real 390px-mobile captures
for both versions, plus the shadda-verification crop — all captured by
loading `brand-v3/preview-1d/index.html` from its actual repo path in
headless Chromium, exercising the same relative font paths used at review
time.

## Preview access

No new Vercel deployment was created for this task (the brief said not to
deploy). This branch already has an existing auto-deployed Preview on
Vercel from earlier phases; pushing this commit updates that same Preview
automatically, reachable at the branch's stable Git-branch alias:

```
https://shaghil-git-shaghil-v3-brand-implementation-madagibrahim-7836.vercel.app/brand-v3/preview-1d/index.html
```

I could not personally load this URL to verify (this sandbox's own egress
policy blocks `*.vercel.app`, same as in Phase 1C) — treat it as
Vercel-API-confirmed rather than browser-verified by me. The screenshots
above and the local-preview instructions below are the verified fallback.

### Local preview

```
cd shaghil
python3 -m http.server 8080
# open http://localhost:8080/brand-v3/preview-1d/index.html
```

or open the file directly — no build step, no server required.

## QA

- `npm run qa`: full existing regression suite — unaffected (no
  application file touched).
- Independent geometry re-check: both champagne lockups' extracted
  `d="..."` path data diffed against their verified sources — identical.
- Rendered both versions at real desktop (1300px) and real 390px mobile
  viewports in headless Chromium and visually inspected each.
- Shadda/three-dot verification performed on a rendered screenshot, not
  source markup alone.
- Confirmed `brand-v3/preview/` (Phase 1C) has zero diff against its
  already-committed state.

## Not done in this task (by design)

- Phase 1C's preview untouched.
- No application file, live `/brand/` asset, dashboard, or deployment
  changed.
- No icon selected between Option A and Option B — both remain open.
- No merge, no new production deployment.
