# SHAGHIL Logo — Master Lock

**STATUS: FOUNDER SELECTED W1 — FINAL MASTER PREPARED**

Branch: `shaghil-brand-final`. Basis: Founder selection of W1 — Precision (from the wordmark-led final logo round, commit `28a27f46a0f9f7227bd33a05b699f63178c1e873`). This phase finalizes W1 into a production-ready master asset package — no new concepts, no alternatives, no color.

## Identity principle

SHAGHIL is a wordmark-led identity. The primary asset is the Arabic word شغّل itself; `SHAGHIL` is a secondary Latin descriptor. The Arabic wordmark remains visually dominant in every lockup. The standalone micro-mark is a secondary, functional asset for favicon/app-icon/tiny digital states only — it never replaces the Arabic master wordmark in normal brand communication.

## Selected basis: W1 — Precision

Carried forward unchanged: immediate Arabic readability, disciplined/regularized geometry (precisely evenly-spaced sheen dots, shadda recentered on the ghain dot's exact vertical axis), restrained customization, horizontal compactness, strong black/white performance. No reinterpretation, no merging with W2/W3, no new visual idea introduced.

## Exact optical refinements made this round

This was a cleanup pass, not a redesign. Two real issues were found through actual rendered inspection (not assumed) and fixed; everything else already measured correct was left unchanged:

1. **Dot regularization and shadda centering were measured, not re-touched.** Precise bounding-box measurement (via Playwright `boundingBox()` on each individual traced path) confirmed the three sheen dots' regularized triangular arrangement and the shadda's centering over the ghain dot were already accurate to within ~0.1px of the vector's own construction targets. Per instruction, nothing already correct was changed.

2. **A real rendering artifact was found, diagnosed, and fixed.** At the W1 exploration round's original trace resolution (700px font-size), close inspection of the lam stem's sharp top corner showed a thin stray spike. It was confirmed to be a genuine pixel-level anti-aliasing artifact (not simplification noise — it survived Douglas-Peucker simplification up to epsilon 9, and survived multiple passes of morphological erosion, ruling out simple 1px noise) and specifically resolution-dependent (re-rendering the same glyph at doubled font-size made it markedly less prominent). The fix: the final master is traced from a higher-resolution source rendering (1400px font-size, roughly double the exploration round), which is both the correct fix for this specific artifact and a legitimate general quality improvement for a production master asset. See Section 14 of the review board for a direct before/after comparison.

3. **The 7% horizontal compression was moved from a live-text CSS transform to a post-trace vector transform.** In the exploration round, the compression was applied to the live DOM text before tracing; this round applies it as a `scale(0.93,1)` transform on the already-traced, clean vector path instead. Mathematically equivalent proportions, but removes any dependency on live-font-rendering-time scaling behavior in the production master.

## Arabic correctness verification

Checked by direct rendered inspection at multiple sizes (not DOM-only): شغّل reads correctly in every asset — correct ش construction and three dots, correct غ construction and dot, correct shadda placement, correct letter joining throughout, no accidental alternate letterforms introduced by any of the geometric edits above. Confirmed in both black-on-white and white-on-black.

## Master assets

```
brand-final/logo/
  master/
    SHAGHIL_MASTER_AR.svg          the source-of-truth master (black fill)
    SHAGHIL_MASTER_AR_BLACK.svg    identical geometry, black fill (production alias)
    SHAGHIL_MASTER_AR_WHITE.svg    identical geometry, white fill — for dark backgrounds
  lockups/
    SHAGHIL_MASTER_AR_EN_STACKED.svg      شغّل over SHAGHIL — preferred hierarchy
    SHAGHIL_MASTER_AR_EN_HORIZONTAL.svg   شغّل beside SHAGHIL — viable alternate, Arabic still dominant
    SHAGHIL_ENDORSED_LOCKUP.svg           + "by MIGHT MADE" (text-only placeholder — see below)
  micromark/
    SHAGHIL_MICROMARK.svg   the shadda-over-dot pair derived from the master, secondary use only
    SHAGHIL_FAVICON.svg     same asset, delivered under its production filename
    SHAGHIL_APP_ICON_BW.svg micro-mark centered on a rounded-square tile
  review/
    SHAGHIL_LOGO_MASTER_FINAL.png   the 14-section Founder review board
  refine/
    trace.mjs, common.mjs           the real-pixel → real-vector tracer (shared pipeline)
    build-master.mjs                builds SHAGHIL_MASTER_AR.svg from the real rendering
    build-lockups.mjs               builds every derived asset from the master
    build-review-board.mjs          generates the review board
    notokufiarabic900.woff2         the real production webfont used as geometry source
```

**Source of truth:** `master/SHAGHIL_MASTER_AR.svg`. Every other asset in this package is mechanically derived from it by the `refine/` scripts — never hand-edited separately. True vector outlines throughout; no asset in this package depends on a live font at render time; no raster content is embedded in any SVG.

## Micro-mark role

`SHAGHIL_MICROMARK.svg` is the shadda recentered above the real ghain dot, both taken directly from the master's own geometry, with a documented extra gap added only in this isolated context (proven necessary for it to read as two related forms rather than one blob at small size). Secondary only — favicon, app icon, tiny product states. Never the primary SHAGHIL mark.

## Clear-space rule

Clear-space unit ("X") = the height of the first letter's dot cluster in the master wordmark. Keep at least 1X of clear space on every side of the wordmark or any lockup, free of other elements, text, or a hard edge.

## Minimum-size rule

- Wordmark alone: 160px minimum digital width.
- Stacked AR/EN lockup: 180px minimum digital width.
- Micro-mark: 16px minimum (below this, legibility is not guaranteed even with the small-size handling already built into the shape).

## Endorsement rule

`SHAGHIL_ENDORSED_LOCKUP.svg` = stacked lockup + "by MIGHT MADE" in small, muted (#666) type beneath. No locked MIGHT MADE master signature asset exists anywhere in this repository (confirmed by search — only prose mentions in earlier brand-exploration documents, no asset file). Per instruction, this is a documented text-only placeholder, not a reconstruction or redesign of any MIGHT MADE asset. Replace with the real MIGHT MADE signature file when one is provided.

## Black/white usage

All master and lockup assets exist as true black-fill and true white-fill variants with identical geometry — never a CSS filter. Verified working in both directions on the review board (Sections 02/03).

## Rendered QA — actually performed

Every SVG in this package was rendered in real headless Chromium and the output inspected (not validated structurally alone) before being treated as finished:

- Master wordmark checked at full size, 256px, 128px, 64px, and 32px — remains correctly readable throughout.
- Micro-mark checked at 128px, 64px, 32px, and 16px — the shadda/dot relationship remains visible even at 16px.
- No clipping found in any final asset (an earlier draft of the W2-activation-scale shadda clipped against its viewBox during the wordmark round; the same class of check was re-run here and passed clean).
- No broken paths, no unexpected fills, no raster content in any SVG — confirmed by opening each file standalone.
- Black/white inversion confirmed correct on the master and on the header-application test.
- Latin alignment and lockup balance confirmed on both the stacked and horizontal treatments.
- Favicon and app-icon readability confirmed via direct simulation on the review board.
- The review board PNG was regenerated from the final SVG sources and matches them (verified by rebuilding the full pipeline from scratch — `build-master.mjs` → `build-lockups.mjs` → `build-review-board.mjs` — and confirming identical output).

**Three real bugs were found and fixed while assembling the review board, all through direct visual inspection catching a real defect rather than assuming success:**
1. A regex meant to replace an SVG's `width`/`height` attributes left a second, conflicting `style` attribute in place, silently defeating the intended CSS sizing.
2. Percentage-based CSS sizing (`width:100%;height:auto`) on a bare `<svg>` inside a flex container sized unpredictably; replaced everywhere with an explicit-pixel-dimension helper (`fitTo()`) computed directly from each SVG's own viewBox.
3. The review board's `dir="rtl"` root attribute cascaded `direction:rtl` into embedded lockup `<text>` elements, silently flipping how `text-anchor="start"` anchors (right-anchored instead of left) and causing the Latin wordmark text to render on top of the Arabic glyphs instead of beside them. Fixed by explicitly pinning `direction="ltr"` on every Latin text element and on the layout containers (product-header test, before/after comparison) whose intended left-to-right order would otherwise be reversed by the page's own RTL context.

## Historical exploration — not part of the locked system

D1/D2/D3 (Phase 4, standalone-icon-led exploration) and W2/W3 (the Activation and Motion wordmark directions from this round) remain in `brand-exploration/` as historical record only. They are not implemented, not referenced by any production asset, and were not touched by this phase's `git status` diff.

## Next phase

**Final Color + Typography + Brand Design System.**

Not started in this phase, per explicit instruction. Also not started: UI rebrand, website, domain work.
