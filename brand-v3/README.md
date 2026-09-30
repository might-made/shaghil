# SHAGHIL V3 Brand Identity — Phase 1: Brand Assets

Branch: `shaghil-v3-brand-implementation` (branched from the current tip of
`shaghil-closed-pilot-ux-refinement`; not merged, not deployed).

This directory holds Phase 1 only: standalone brand assets. **Nothing in this
directory is wired into `index.html` or any other application file.** The live
app continues to use `/brand/*` exactly as before — dashboard layouts, product
features, APIs, storage and deployment are all untouched.

## What this is

- Arabic wordmark **شغّيل** and English wordmark **SHGHIL**.
- Horizontal and stacked bilingual lockups.
- A standalone app icon mark (and a simplified favicon-specific variant, see
  "Favicon legibility" below).
- Light and dark variants of every wordmark/lockup, plus light/dark app-icon
  variants.
- Favicon and app-icon PNG rasters at 16, 32, 180, 192 and 512px.

## How the wordmarks were built (and why)

Arabic is a cursive, contextual script: the same letter takes a different
shape depending on whether it's isolated, word-initial, medial or final, and
combining marks like the shadda must be positioned by the font's own anchor
data, not eyeballed. Hand-drawing this by tracing bezier curves (as the
existing V2 `/brand/logo-mark.svg` does) is exactly how the "approximate
decorative symbol" failure mode the brief warns against tends to happen.

Instead, each wordmark was produced by **real font shaping**, not by setting
live `<text>` or hand-drawing paths:

1. The project's own already-vendored, already-licensed fonts were used —
   IBM Plex Sans Arabic Bold (`fonts/plexarabic-700-13.woff2`) for شغّيل, IBM
   Plex Sans Bold (`fonts/plexsans-700-24.woff2`) for SHGHIL — decompressed to
   plain TTF so a real shaping engine could read them.
2. **HarfBuzz** (via `uharfbuzz`, the same shaping engine every major browser
   uses) shaped the string, applying the font's actual GSUB joining rules
   (`init`/`medi`/`fina`/`isol`) and GPOS mark-attachment tables (`mark`,
   `mkmk`) — the same mechanism that places a shadda correctly above its base
   letter in real text anywhere else in this app.
3. **fontTools** then extracted each shaped glyph's real outline as SVG path
   data at its HarfBuzz-computed position, producing one flat, dependency-free
   vector path per wordmark — editable, portable, and requiring no font file
   to render correctly anywhere.

This is why the shadda in `wordmarks/arabic-*.svg` is the authentic U+0651
glyph from the font, sitting exactly where HarfBuzz's own mark-to-base anchor
data places it (verified: offset from the غ base glyph's own origin, raised
above the baseline — not a manually-positioned tilde or symbol substitute),
and why ش keeps all three dots (they're part of the shaped `uniFEB7`/initial-ش
glyph itself, not something added afterward).

**Verification, not assumption:** every wordmark, lockup and icon in this
directory was rendered to PNG with headless Chromium and visually inspected
before being accepted — including at 16/32/48/64/180/512px for the icon set.
The full letter-by-letter check is recorded below.

## Letterform verification (required quality gate)

Rendered `شغّيل` at 900px and inspected directly:
- Rightmost glyph: ش (shin) — **all three dots above are present**.
- Second glyph: غ (ghain) in medial form, with its own single dot, and the
  **shadda (real U+0651 glyph) positioned directly above it** — confirmed
  both visually and numerically (HarfBuzz placed the shadda's origin at
  x=1142 vs the غ base's own origin at x=1058, y raised 408 font-units above
  baseline — real GPOS mark-to-base positioning, not a manual placement).
- Third glyph: ي (yeh) in medial form, two dots below — correct.
- Leftmost glyph: ل (lam) in final form — correct.
- All four letters are properly joined (continuous connecting strokes, no
  gaps or floating letterforms), as required for authentic Arabic type.

`SHGHIL` was rendered and checked separately: clean, evenly kerned bold caps.

## Palette

| Token | Hex | Used for |
|---|---|---|
| Charcoal | `#1B1D1F` | Primary ink (light-context wordmarks), primary icon background |
| Off-white | `#F6F3EA` | Primary ink (dark-context wordmarks), light-icon background |
| Champagne | `#D7BC91` | Icon mark accent, tested as an alternate wordmark background |
| Lime | `#E7F95B` | **Reserved as a restrained, functional accent — not used in the wordmarks or icon.** Per the brief ("restrained functional lime"), it does not appear in the static logo art; it belongs to functional UI (buttons, highlights, states), which is Phase 2/dashboard territory, not Phase 1 brand assets. |

See `previews/preview-board.png` for every wordmark/lockup/icon rendered
against all four palette colors together.

## Files

```
wordmarks/
  arabic-light.svg / arabic-dark.svg              standalone شغّيل
  english-light.svg / english-dark.svg            standalone SHGHIL
  lockup-horizontal-light.svg / -dark.svg          side-by-side bilingual lockup
  lockup-stacked-light.svg / -dark.svg             stacked bilingual lockup
icon/
  app-icon-dark.svg / app-icon-light.svg           full-detail standalone icon mark (غ + shadda)
  favicon.svg / favicon-light.svg                  simplified icon mark for small sizes (see below)
raster/
  favicon-16.png, favicon-32.png                   from the simplified favicon mark
  apple-touch-icon.png (180), app-icon-192.png, app-icon-512.png   from the full-detail mark
previews/
  preview-board.png                                every asset on every palette background
  favicon-legibility-16-32.png                      simplified mark at 16/32px, native + 8x
  app-icon-legibility-16-32-48.png                  full-detail mark at 16/32/48px, native + 8x (for comparison)
```

"Light"/"dark" naming describes what the asset is *for* (use on a light
surface / use on a dark surface), matching how the current app already
describes its own dark-mode-ready assets — not the file's own background
(every wordmark file has a transparent background so it can sit on any
surface; only the icon/favicon files have a filled background, since an
icon needs one).

## Design decisions made without the Canva references (disclosed)

**I could not open either Canva link.** Both `canva.link` URLs returned a
hard 403 at the network egress layer in this environment (confirmed via the
proxy's own status endpoint — a policy block, not a transient failure), so I
built Phase 1 strictly from the brief's explicit, written specification
(exact wordmarks, authentic shadda requirement, the four palette hex codes,
"premium, contemporary, Arabic-first") rather than guessing at what the
reference images show. Two judgment calls this made necessary, so a founder
reviewing this against the actual Canva file can correct them quickly if
they don't match:

1. **Typeface choice.** I used the project's own already-vendored IBM Plex
   Sans / IBM Plex Sans Arabic (Bold) rather than introducing a new display
   typeface, since I had no way to confirm which face the approved V3
   direction actually uses. IBM Plex is a legitimately premium, contemporary
   family and is already licensed and shipping in this app, so this is a
   safe default — but it may not be the exact face shown in the reference.
2. **Lockup arrangement.** For the horizontal lockup I placed the Arabic
   wordmark on the right and English on the left (Arabic-first, matching the
   app's own `dir="rtl"` and its existing brand-block-first DOM order). This
   is a reasonable convention, not a confirmed match to the reference.
3. **Icon concept.** The standalone icon mark isolates the غ+shadda glyph
   cluster — the same design pattern the current V2 `/brand/app-icon.svg`
   already uses (a distinctive, compact letter cluster on a rounded square).
   I kept this pattern for continuity since I couldn't see whether V3's
   reference uses a different icon concept entirely.

## Favicon legibility (required quality gate — an honest limitation)

The full-detail icon mark (غ + shadda) renders very well at 48px and above —
see `previews/app-icon-legibility-16-32-48.png`. At 16px and 32px, however,
the shadda's fine stroke genuinely breaks down into illegible mush; I tested
this directly (not assumed) and it was a real problem, not a hypothetical
one.

Rather than ship an illegible favicon, `icon/favicon.svg` (and the 16/32px
PNGs) use a **simplified mark: the غ glyph alone, without the shadda**,
scaled to fill more of the canvas. This is a standard, deliberate favicon
practice (most icon systems simplify their mark at 16px), not a compromise
on the wordmark's authenticity requirement — that requirement applies to the
شغّيل wordmark itself, which keeps the real shadda at every size it's shown
at. See `previews/favicon-legibility-16-32.png`: the simplified mark reads as
a clean, coherent shape at 32px and as a recognizable, distinctive abstract
mark at 16px (browsers routinely show favicons this size; it isn't meant to
be "read" as a letter, only recognized as a mark). The full-detail mark
remains the icon for every size 48px and up (apple-touch-icon, 192, 512).

## QA

- `npm run qa`: full existing regression suite — **unaffected** (no
  application file was touched; see the commit diff, which touches only new
  files under `brand-v3/`).
- Every SVG in this directory validated as well-formed XML.
- Every wordmark, lockup, and icon rendered with headless Chromium and
  visually inspected at production-realistic sizes before being accepted.
- Icon transparency verified pixel-by-pixel (corner alpha=0, center alpha=255
  at the exact palette hex), matching the existing `/brand/*.png` convention.

## Not done in Phase 1 (by design)

- Nothing under `/brand/` (the live app's actual assets) was touched.
- No dashboard, layout, or UI change.
- No new dependency, cloud storage, authentication, or database.
- No merge to `main` or `shaghil-closed-pilot-ux-refinement`, no deployment.
