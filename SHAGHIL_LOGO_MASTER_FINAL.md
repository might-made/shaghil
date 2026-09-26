# SHAGHIL Logo System

**STATUS: SHAGHIL LOGO SYSTEM — FOUNDER APPROVED MASTER — LOCKED**

Branch: `shaghil-brand-final`. Basis: W1 — Precision, unchanged from the prior master lock (`8d029e18275ee720139c0c4615e263d170a15183`). This phase performs one thing only — optical cleanup of a confirmed tracing/rendering artifact at the lam stem's top corner — under an explicit prove-or-reject protocol. No redesign, no new concepts, no alternatives, no color.

## The artifact

The prior master-lock phase had *mitigated* a stray spike at the lam stem's top corner by tracing from a higher-resolution source render, but had not proven the spike eliminated. The Founder directed a rigorous test: prove morphological opening removes it cleanly and safely, or reject that method and use the smallest possible local vector cleanup instead.

## Test 1 — morphological opening: rejected

Morphological opening (erode-then-dilate, 3×3 structuring element) was implemented and tested at `openIterations` 1 through 10 against the actual master source render. At every tested strength:

- The spike's pixel-level topmost point (`body.minY`) stayed at exactly **319**, unchanged from baseline — the artifact was **not removed at all**, at any strength.
- All other pixel-derived metrics (component count, body/shadda/ghainDot/sheenDots area and bbox) also showed no change — because the method simply had no effect in either direction.
- Direct visual crop comparison at the lam-top region confirmed the spike pixel-identical across baseline and every candidate strength.

**Verdict: fails criterion 1 (does not remove the artifact). Rejected**, per the Founder's explicit instruction, in favor of the smallest possible local vector cleanup. Full metrics: `brand-final/logo/refine/morph-test-results.json`; test harness: `brand-final/logo/refine/test-morph-cleanup.mjs`.

## Root cause, actually diagnosed

Morphological opening operates only on the raster pixel mask — its total failure to affect the spike is itself the clue that the spike is not a raster-thickness defect at all. Direct inspection of the traced polygon's own vertices (not the pixels) found the true cause:

The Moore-neighbor boundary trace necessarily starts and ends at the same pixel. After Douglas-Peucker simplification, the closed polygon's first and last vertices survived as two **near-duplicate points 1px apart** (`(2291.5, 319.5)` and `(2291.5, 320.5)`) at the seam — sitting immediately next to a vertex **508px away** on the far side. The Catmull-Rom curve fitter computes each point's tangent from its neighbors *two steps out* on either side; a ~1px segment paired with a ~508px one produces a wildly exaggerated, overshot Bezier control point at that single seam — rendering as the visible spike. This is a pure curve-fitting artifact, invisible in the pixel data, which is exactly why morphological opening — a pixel-only technique — could never have touched it.

## Fix applied — the smallest possible local vector cleanup

`dedupeClosedPolygon(polygon, minDist = 3)`, added to `brand-final/logo/refine/trace.mjs`, wired in as the tracer's new default (`seamDedupeDist = 3`): after Douglas-Peucker simplification and before Catmull-Rom curve fitting, near-duplicate consecutive vertices in a closed polygon (checking the wrap-around seam too) are merged. This touches only genuine near-duplicate points — by construction it cannot alter any vertex that isn't one — and removed exactly **one** vertex from the master's traced boundary (`seamPointsRemoved: 1`).

## Proof against all 8 Founder criteria

| # | Criterion | Result |
|---|---|---|
| 1 | Removes the lam artifact cleanly | **Pass** — visually confirmed gone; see `review/cleanup-qa/02-lam-top-detail-*.png` |
| 2 | No material stroke-weight change | **Pass** — body bbox/area 0.0000% delta (pixel-derived, upstream of the fix) |
| 3 | No change to Arabic joining | **Pass** — 0.0000% delta on all component bboxes; visually confirmed at all joins, `03-key-joins-*.png` |
| 4 | No change to lam terminal/bowl geometry | **Pass** — same pixel-derived body bbox/area, 0.0000% delta |
| 5 | No change to ghain form | **Pass** — same pixel-derived body bbox/area (ghain is part of the merged body component) |
| 6 | No change to sheen form or 3-dot construction | **Pass** — sheenDots area/center 0.0000% delta on all 3; `05-sheen-threedots-*.png` |
| 7 | No change to shadda / ghain-dot positioning | **Pass** — shadda and ghainDot area/center 0.0000% delta; `04-shadda-ghaindot-*.png` |
| 8 | No new artifacts introduced elsewhere | **Pass** — only 1 vertex changed in the entire trace; full wordmark and all 5 crop locations inspected, no new deviation found |

Criteria 2–7 hold because they are measured directly from `labelComponents`' pixel-derived bounding boxes and areas — computed upstream of Douglas-Peucker simplification and Catmull-Rom fitting alike — which the seam-dedupe fix never touches. Only the curve-fit path string changes, and only at the one confirmed duplicate seam.

## Before/after QA — produced and inspected

Full-resolution before/after comparisons at all 5 required locations: `brand-final/logo/review/cleanup-qa/`
- `01-full-wordmark-BEFORE/AFTER.png`
- `02-lam-top-detail-BEFORE/AFTER.png`
- `03-key-joins-BEFORE/AFTER.png`
- `04-shadda-ghaindot-BEFORE/AFTER.png`
- `05-sheen-threedots-BEFORE/AFTER.png`

Result: the lam-top spike is visibly gone in every AFTER image, replaced by a clean, naturally rounded stem terminal. Every other location is visually indistinguishable between BEFORE and AFTER.

## Arabic legibility

شغّل reads correctly in the finalized master: correct ش construction with its three dots, correct غ construction with its dot, correct shadda placement and centering, correct letter joining throughout — confirmed by direct rendered inspection in both black-on-white and white-on-black, and unaffected by the cleanup fix (per the criteria table above).

## Finalized assets

```
brand-final/logo/
  master/
    SHAGHIL_MASTER_AR.svg          source-of-truth master (black fill), artifact-free
    SHAGHIL_MASTER_AR_BLACK.svg    identical geometry, black fill (production alias)
    SHAGHIL_MASTER_AR_WHITE.svg    identical geometry, white fill — for dark backgrounds
  lockups/
    SHAGHIL_MASTER_AR_EN_STACKED.svg      شغّل over SHAGHIL — preferred hierarchy
    SHAGHIL_MASTER_AR_EN_HORIZONTAL.svg   شغّل beside SHAGHIL — viable alternate
    SHAGHIL_ENDORSED_LOCKUP.svg           + "by MIGHT MADE" (text-only placeholder — see below)
  micromark/
    SHAGHIL_MICROMARK.svg   shadda-over-dot pair derived from the master, secondary use only
    SHAGHIL_FAVICON.svg     same asset, production filename
    SHAGHIL_APP_ICON_BW.svg micro-mark centered on a rounded-square tile
  review/
    SHAGHIL_LOGO_MASTER_FINAL.png    the 14-section Founder review board, rebuilt from the fixed master
    cleanup-qa/                      the 5-location before/after artifact-removal proof (this phase)
  refine/
    trace.mjs                  the tracer — now includes dedupeClosedPolygon() + seamDedupeDist default
    build-master.mjs           builds SHAGHIL_MASTER_AR.svg (unchanged; picks up the fix automatically)
    build-lockups.mjs          builds every derived asset from the master (same)
    build-review-board.mjs     generates the review board (same)
    build-cleanup-qa.mjs       generates this phase's before/after proof set
    test-morph-cleanup.mjs     the rejection test for morphological opening (kept as provenance)
    morph-test-results.json    full quantitative results of the rejected method
    common.mjs, notokufiarabic900.woff2   shared tracer pipeline + production webfont source
```

All 9 production SVGs were regenerated from the fixed tracer and copied over their prior (spike-containing) versions. The review board was rebuilt end-to-end from the fixed master.

## Micro-mark role

Unchanged from the prior lock. `SHAGHIL_MICROMARK.svg` is the shadda recentered above the real ghain dot, both taken directly from the master's own geometry. Secondary only — favicon, app icon, tiny product states. Never the primary SHAGHIL mark.

## Clear-space rule

Unchanged. Clear-space unit ("X") = the height of the first letter's dot cluster in the master wordmark. Keep at least 1X of clear space on every side of the wordmark or any lockup, free of other elements, text, or a hard edge.

## Minimum-size rule

Unchanged.
- Wordmark alone: 160px minimum digital width.
- Stacked AR/EN lockup: 180px minimum digital width.
- Micro-mark: 16px minimum.

## Endorsement rule / MIGHT MADE status

`SHAGHIL_ENDORSED_LOCKUP.svg` = stacked lockup + "by MIGHT MADE" in small, muted (#666) type beneath, as **text only**. No locked MIGHT MADE master signature asset exists anywhere in this repository (re-confirmed by search this phase — only prose mentions in earlier brand-exploration documents, no asset file). This placeholder is not a reconstruction or approximation of any MIGHT MADE logo. Replace with the real MIGHT MADE signature file when one is provided.

## Rendered QA — this phase

- Master wordmark: full/very-large, and via the review board's size sections — confirmed artifact-free and correctly formed.
- Micro-mark/favicon/app-icon: checked at 128px, 64px, 32px, and 16px on the review board's size ladder — the shadda/dot relationship remains visible even at 16px.
- Black-on-white and white-on-black: both confirmed correct, true fill variants (no CSS filter).
- Stacked and horizontal lockups, endorsed lockup, clear-space demo, minimum-size row, product-header simulation: all rebuilt and visually confirmed correct with the fixed master.
- No clipping, no broken paths, no raster content in any SVG, no new artifacts anywhere in the fixed trace.

## Historical exploration — untouched

D1/D2/D3, W2/W3, and the frozen branches (`main`, `shaghil-v0.5`–`v0.9`, `shaghil-final-audit`, `shaghil-product-closure`) remain untouched by this phase. Runtime/product code and the website were not touched.

## Next phase

**SHAGHIL Color System.**

Not started in this phase, per explicit instruction. STOP after Logo Track lock.
