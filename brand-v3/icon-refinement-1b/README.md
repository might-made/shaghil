# SHGHIL V3 — Phase 1B: App Icon Refinement (comparison, not a decision)

Branch: `shaghil-v3-brand-implementation`. This is an exploration only — **the
current icon has not been replaced**, no wordmark was touched, and nothing
here is wired into `index.html` or any application file. See
`previews/comparison-board.png` for the full labeled comparison.

## Canva reference

The approved V3 reference (`https://canva.link/b0u41szx7oj0s5x`) returned the
same hard 403 at this environment's network egress policy as in Phase 1
(confirmed via the proxy status endpoint — a policy block, not transient).
Both options below were built from the brief's own explicit written spec,
using the same verified font-shaping method as Phase 1 (HarfBuzz against the
project's vendored IBM Plex Sans Arabic Bold, with glyph outlines extracted
to flat SVG paths via fontTools) — not hand-drawn, not live text.

## Option A — ش (sheen)

`option-a-sheen-dark.svg` / `option-a-sheen-light.svg`

- The isolated ش glyph, shaped by HarfBuzz from the same font as the
  wordmark — all three dots are part of the shaped glyph itself, not added
  separately, and nothing was added or altered (no shadda, no spelling
  change to the wordmark).
- Its natural bounding box is close to square (1079×884 font units, ratio
  ≈1.22) — a much more favorable shape for a square icon than غ's, which
  needs generous padding either way.
- **No simplified favicon variant was needed.** Tested directly at every
  required size (16/32/64/180/512px, see
  `previews/option-a-legibility-16-to-512.png`): the mark stays clearly
  legible even natively at 16px — the bowl and all three dots read clearly.
  This is the more small-size-robust of the two options.

## Option B — غ + shadda (refined existing icon)

`option-b-ghain-refined-dark.svg` / `-light.svg`, plus
`option-b-favicon-simplified-dark.svg` / `-light.svg`

Same glyph cluster as the current `/brand/app-icon.svg` and the Phase 1
`brand-v3/icon/app-icon-*.svg` (غ with the authentic U+0651 shadda,
GPOS-positioned by the font itself, unchanged from Phase 1). Two concrete
refinements were made and tested against the Phase 1 version side by side
before adopting them:

1. **Fill ratio raised from 0.60 → 0.68** — the mark now fills more of the
   icon with less empty margin, giving it more confidence/presence without
   crowding the rounded corners.
2. **A small optical re-centering (3.5% of the icon's height, downward)** —
   bounding-box centering alone left the mark looking slightly top-heavy,
   because the thin shadda accent sits at the very top while the visually
   heavier bowl+tail sit lower; nudging the whole mark down slightly
   balances the top and bottom margins by eye, not just by the numbers.

**Authentic shadda is kept at every size 64px and up** — unchanged from
Phase 1. At 16/32px, the same legibility problem found in Phase 1 recurs
(tested directly, not assumed): the shadda's fine stroke breaks down into
illegible mush at that size — see
`previews/option-b-full-detail-legibility-16-32.png`. The
`option-b-favicon-simplified-*.svg` files (غ alone, scaled larger to fill
more of the canvas) are the same, already-founder-visible tradeoff from
Phase 1, re-verified here with the improved fill ratio —see
`previews/option-b-favicon-simplified-legibility-16-32.png`: clean and
readable as a coherent mark at 32px, recognizable as a distinctive abstract
shape at 16px.

## Which one is "better"?

Not this document's call — that's why this is a side-by-side comparison for
founder review, not a recommendation. Two objective, tested differences
worth knowing before deciding:

- **Small-size robustness:** Option A needs no simplification at any
  required size; Option B needs a simplified (shadda-dropped) variant at
  16/32px specifically.
- **Letterform:** Option A shows ش alone (three dots, no shadda — a
  simpler, more geometric mark). Option B shows غ with its authentic shadda
  (more distinctive/ornamental at 64px+, but not at 16/32px, where the
  simplified variant necessarily drops it).

## Files

```
option-a-sheen-dark.svg / -light.svg                 Option A, both variants
option-b-ghain-refined-dark.svg / -light.svg          Option B, full detail, 64px+
option-b-favicon-simplified-dark.svg / -light.svg     Option B, 16/32px only
previews/comparison-board.png                         full labeled side-by-side board
previews/option-a-legibility-16-to-512.png            Option A at every required size
previews/option-b-full-detail-legibility-16-32.png    Option B full-detail mark at 16/32 (shows why simplification is needed)
previews/option-b-favicon-simplified-legibility-16-32.png   Option B's simplified favicon at 16/32
```

## QA

- Every SVG validated as well-formed XML.
- Both options' marks rendered with headless Chromium and visually
  inspected at 16/32/64/180/512px before being accepted.
- `npm run qa`: full existing regression suite — unaffected (no application
  file was touched; this task only adds files under
  `brand-v3/icon-refinement-1b/`).

## Not done in this task (by design)

- The current icon (`/brand/app-icon.svg`, `/brand/favicon.svg`) was not
  replaced.
- The wordmarks (Phase 1's `brand-v3/wordmarks/*`) were not touched.
- No application file, layout, dashboard, or deployment was changed.
- No merge, no new branch, no deployment.
