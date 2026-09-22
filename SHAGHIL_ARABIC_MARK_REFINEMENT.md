# SHAGHIL Core Identity — Phase 4: Proprietary Arabic Mark Refinement

Branch: `shaghil-brand-final`. Basis: Founder review of the four Phase 3 concepts (A/B/C/D) — none approved as final. Concept D's underlying *principle* (Arabic-native, derived from real شغّل geometry, not a generic symbol retrofitted with an Arabic explanation) was endorsed; its specific cropped-lam-terminal shape was not. Concept C's registration-bracket language was noted as a possible future *supporting* device (framing / status / selection / Visual Studio / motion / generation states), never a primary logo — no implementation of it happens in this round either. This phase refines that one endorsed territory into three structurally different concepts, D1/D2/D3. Still black/white only — no color, no UI, no website.

## Method — a methodological escalation from Phase 3

Phase 3's marks were built from bounding-box overlays (Concepts A/B/C) or a single raster screenshot crop (Concept D). This round's explicit requirement was stricter: **no raster crop as the source of the final mark** — every mark and wordmark treatment had to be true vector, built from real letterform geometry, from the start.

**What was tried and rejected first, and why:** the standard way to get real vector glyph outlines out of a webfont is to parse the font file (`opentype.js`) and read each glyph's path data directly. This was tested against the actual production font (Noto Kufi Arabic, weight 900, downloaded and decompressed from the real `@font-face` file used by the app). It works for most letters, but **fails for ش and غ specifically**: this font applies an advanced contextual substitution (GSUB lookup type 6, format 1 — used here for the letters' Kufi-style contextual/ligature behavior) that `opentype.js`'s shaping engine cannot parse, and it throws rather than silently guessing. Falling back to each letter's *isolated* glyph form and hand-positioning it would have risked exactly what the brief warns against — a wordmark that only *looks* right, with joining an approximation rather than the browser's own guaranteed-correct shaping. That path was abandoned before it produced anything.

**What was built instead: a real-pixel → real-vector tracer.** Every concept starts from the same guaranteed-correct source as Phase 3 — the real Unicode string شغّل, rendered by the browser's own text-shaping engine, in one constant typeface held identical across all three concepts. That rendering is then captured as pixels and traced into genuine vector geometry:

1. **Threshold** the rendered pixels into ink / not-ink.
2. **Connected-component labelling** (8-connectivity flood fill) separates the word's real disjoint parts — the connected letter body, the three dots of ش, the one dot of غ, and the shadda — into distinct shapes automatically, with no manual outlining.
3. **Moore-neighbor boundary tracing** walks each shape's real ink edge into an ordered polygon.
4. **Douglas-Peucker simplification** removes pixel-level jitter while preserving the true silhouette.
5. **Catmull-Rom → cubic-Bézier fitting** turns the simplified polygon into a smooth, genuine `<path>` with real curve data — not a polyline, not a filter effect.

This is the same family of technique production "trace bitmap to vector" tools use; it was **validated before being trusted for anything else**: the full word was traced and the result rendered back through the browser and visually compared, side by side, against the original rendering (`brand-exploration/marks/refine/validate-reference.png` vs. `validate-traced.png` during development). The traced version reproduced شغّل pixel-faithfully — correct spelling, correct shadda, correct dot count and placement, correct joining, same silhouette down to the counter-shapes — before any concept was built on top of it.

The same tracer, run in *inverted* mode on a tightly cropped region with edge-touching components excluded, also extracts **real enclosed negative space** (a true background hole bounded by real ink, not an illustrated shape) — used for D3.

Every fragment used below (the shadda, غ's dot, the final letter's stem+hook, the negative-space wedge) is a real traced piece of the actual rendering, positioned/scaled/duplicated with ordinary SVG transforms to build each proprietary mark. Nothing was hand-drawn.

**Wordmark customization**, per concept, is restrained and geometry-safe: a uniform transform applied to the whole rendering before tracing (vertical stretch, skew — these never touch cursive joining because they act on the whole shape uniformly), or, for D2, a transform applied to one already-disconnected real subpath (the shadda never touches the connected letters in the real rendering, so scaling it in place cannot break any joining). No glyph was edited at the point level.

## D1 — Letter Relationship

**Territory:** a compact proprietary form from the interaction between two real, distant parts of شغّل — not a literal mini-word.

**Construction:** the real traced outline of the final letter (stem and hook, isolated by cropping the word's own connected rendering — the same general technique Phase 3 used for measurement, now producing real vector geometry instead of a raster crop) is the primary form. The real traced shadda is nested at the hook's opening, at reduced scale, unrotated. The two fragments come from opposite ends of the word — the word's first meaningful diacritic and its last letter's terminal — brought into one new compact relationship.

**Wordmark:** the real word, with a restrained +4.5% vertical stretch (a single uniform transform, applied before tracing) reinforcing the mark's own verticality.

**Files:** `brand-exploration/marks/shaghil-d1-mark.svg`, `shaghil-d1-wordmark.svg`, board: `brand-exploration/marks/shaghil-d1.png`.

## D2 — Shadda / Activation

**Territory:** the real shadda used directly, not replaced with a generic shape.

**What this deliberately does NOT repeat from Phase 3:** Concept A replaced the shadda's position with a plain rounded square. D2 does not — it uses the shadda's own real traced silhouette, which in this typeface is an angular, zigzag form, visually distinctive on its own and nothing like a square. The mark is that real shape, at full scale, with a fainter, smaller echo of the same real shape trailing behind it (suggesting propagating emphasis), anchored by the real traced dot that — in genuine Arabic orthography — always sits directly beneath the shadda on غ. The dot's position in the mark is not invented; it is the fragment's own real measured position.

**Wordmark:** the real word, unmodified except for one change — the wordmark's own real shadda subpath (already a disconnected component in the traced rendering, never touching the connected letters) is scaled 1.48× in place, giving it more visual weight without altering any letterform.

**Files:** `brand-exploration/marks/shaghil-d2-mark.svg`, `shaghil-d2-wordmark.svg`, board: `brand-exploration/marks/shaghil-d2.png`.

## D3 — Negative Space / Motion

**Territory:** motion implicit in geometry, with no illustrated arrow.

**Construction:** where غ's bowl meets the word's own connecting stroke, the real rendering encloses a small triangular counter — background space that exists only because of how the letters actually join. This is not a shape anyone drew; it was found by inverting a tightly cropped region of the live rendering and tracing the enclosed hole the same way ink is traced elsewhere. The mark repeats that real wedge in a receding trail — full size, then smaller and fainter, then smaller and fainter again — along the same right-to-left diagonal Arabic reading itself moves on. The direction and rhythm are the letters' own; nothing was added to represent them.

**Wordmark:** the real word with a restrained -4° uniform skew (a single geometric transform, applied before tracing — never touches cursive joining).

**Small-size variant — a real, disclosed adjustment:** at 32px and especially 16px, the full three-step trail's second and third wedges become too faint/small to read, and the remaining single wedge risks looking like a generic triangle (a real legibility problem, not a hypothetical one — see QA). A second version, `shaghil-d3-mark-small.svg`, was built from the exact same real wedge geometry, using only two steps at closer spacing and higher contrast, so the "more than one related form" relationship — the thing that makes this concept not a generic triangle — survives at small size. It is used only at 16px/32px and in the favicon simulation on the board; the full three-step version remains the mark at every larger size. This is exactly the documented small-size accommodation the brief anticipated as a possible necessity.

**Files:** `brand-exploration/marks/shaghil-d3-mark.svg`, `shaghil-d3-mark-small.svg` (small-size variant), `shaghil-d3-wordmark.svg`, board: `brand-exploration/marks/shaghil-d3.png`.

## Concept C's brackets — retained as a documented future note, not implemented

Per the Founder's Phase 3 review, Concept C's registration-bracket language remains noted here as a possible future **supporting** system device — for framing, status indicators, selection states, Visual Studio result-framing, or motion/generation states — never as a primary logo candidate. Nothing in this phase implements it; it is carried forward in documentation only, as instructed.

## Files

```
brand-exploration/marks/
  shaghil-d1-mark.svg              D1 standalone mark, true vector
  shaghil-d1-wordmark.svg          D1 wordmark, true vector (traced, +4.5% vertical stretch)
  shaghil-d1.png                   D1 board — all 11 required tests (~1800px wide)
  shaghil-d2-mark.svg               D2 standalone mark, true vector
  shaghil-d2-wordmark.svg          D2 wordmark, true vector (traced, shadda subpath scaled 1.48×)
  shaghil-d2.png                   D2 board
  shaghil-d3-mark.svg              D3 standalone mark, true vector (3-step trail)
  shaghil-d3-mark-small.svg        D3 small-size variant (2-step trail; used at ≤32px)
  shaghil-d3-wordmark.svg          D3 wordmark, true vector (traced, -4° skew)
  shaghil-d3.png                   D3 board
  refine/                          generator pipeline (documented below)
    trace.mjs                      the real-pixel → real-vector tracer (core method)
    common.mjs                     shared render/screenshot helpers
    build-fragments.mjs            extracts real letterform fragments (shadda, dots, lam, wedge)
    build-marks.mjs                composes the three standalone marks from real fragments
    build-wordmarks.mjs            traces each concept's customized wordmark
    build-boards.mjs               generates the three 11-section review boards
    fragments.json                 the extracted real fragment path data (provenance record)
    notokufiarabic900.woff2        the real production webfont used as the geometry source
    word-reference.png             reference render used in each board's construction panel
```

The `refine/` scripts are a real, re-runnable pipeline (`npm install pngjs` once, then run the four `build-*.mjs` files in order) — not one-off scratch code. `fragments.json` records the exact real traced path data every mark was built from, as a provenance record.

## Visual QA — actually rendered and inspected, not DOM-only

Every board was rendered in real headless Chromium and the resulting PNG was directly inspected (not validated structurally alone) before anything was treated as finished. Specific checks performed and their results:

- **Correct spelling / correct shadda / correct dots / correct joining:** confirmed by the tracer-validation step described in Method (traced output visually matches the real browser rendering exactly), then re-confirmed on all three finished wordmarks (large wordmark section of each board) — شغّل reads correctly in all three, including the shadda in its correct position on غ, ش's three dots, and غ's one dot.
- **Geometry does not damage reading:** D1's stretch, D2's shadda scale-up, and D3's skew were each visually checked against the unmodified word — all three remain immediately legible as شغّل, not a distorted or reshaped word.
- **Mark ↔ wordmark relationship visible:** each board's Section 04 (lockup) shows the mark and wordmark together; in all three the mark is visibly derived from a part of the same wordmark, not an unrelated icon placed beside it.
- **SVGs render correctly:** all 7 SVG files (D1 mark, D1 wordmark, D2 mark, D2 wordmark, D3 mark, D3 wordmark, plus D3's small-size variant) were opened standalone in headless Chromium and screenshotted individually; each renders its expected shape with no errors, no missing paths, no blank output.
- **B/W inversion works:** Section 01–02 of every board shows the mark on both a white panel and a true black panel (fill swapped to white, not a CSS filter) — confirmed legible and correctly inverted in both directions on all three.
- **16px behavior:** checked by rendering the actual 16×16 CSS-pixel box at high device-scale-factor (so real small-size structure, not just downscaled blur, is visible). D1 and D2 remain structurally identifiable at 16px — the letter-relationship and shadda-plus-dot compositions are simple enough to survive. D3's full three-step trail did **not** hold up at 16px (documented above); the small-size variant was built and verified to hold up in its place.
- **No clipping:** every mark and wordmark was checked against its SVG viewBox bounds; an early build issue (marks rendering with no explicit width/height, causing an apparent-but-false "clipping" impression during development) was found and fixed by giving every mark SVG explicit pixel dimensions matching its viewBox.
- **No bidi errors:** a real bug was found and fixed during this pass — two board description strings embedded a bare Arabic letter (غ) inline within English prose. The board's font stack (`Helvetica Neue, Arial, sans-serif`) has no Arabic glyph coverage for an isolated letter outside a full shaped word, and the letter rendered as a missing-glyph placeholder. Fixed two ways: the bare-letter references were reworded to plain English ("the letter it sits above," "the second letter's bowl"), and a real Arabic webfont (`NKA`, the same Noto Kufi Arabic used everywhere else) was added to the board's font fallback stack as a robustness measure for any future prose mentioning Arabic text. Re-verified clean on all three boards after the fix.
- **All three genuinely structurally different:** D1 (two fragments interlocked), D2 (one real diacritic repeated with a real anatomical anchor), D3 (a real negative-space shape repeated as a directional trail) are different source fragments, different composition logic, and different visual results — not color or weight variations of one idea.
- **No forbidden clichés:** none of the three uses a Latin S, a generic monogram, a generic arrow, a check mark, a power button, a play button, a chat bubble, an AI sparkle, a robot, a brain, a lightning bolt, or a generic crop/focus frame. (D3's single wedge, in isolation, was flagged during QA as visually adjacent to a "play button" read at very small size with the full trail — this is exactly why the small-size variant was built: two related wedges, not one, at small size.)

## Ownability / distinctiveness observations (descriptive only — not a legal or ranking judgment)

- **D1:** its two source fragments (a letter's terminal hook, a shadda) are specific to شغّل's own construction and to this typeface's particular hook and shadda shapes. Standing alone, without the word present, it reads as an abstract interlocking hook-and-tick form. It seems less likely to be mistaken for a generic tech/fintech/SaaS symbol than a simple arrow or check would be, because the hook shape itself is unusual outside Arabic type; it would be worth checking whether the isolated hook shape alone (without the shadda) could be read as a stylized "J" or comma-like mark in a non-Arabic context — a question for further scrutiny, not resolved here.
- **D2:** the real shadda shape is the most typeface-specific of the three fragments (this exact zigzag form is a property of Noto Kufi Arabic's 900 weight, not of the shadda in general) — high specificity, but also meaning the mark's distinctiveness is somewhat tied to that one typeface's rendering of the mark rather than to shadda-ness in general. Worth checking against other Arabic display faces before treating the shape as fully typeface-independent.
- **D3:** because its source is a *negative-space* shape rather than a letter stroke, it is the most abstract of the three in isolation — the repeated-wedge trail is a distinctive compositional idea, but a single wedge alone (as the 16px legibility issue showed) risks reading as a generic triangle/play-adjacent shape, which is a real ownability risk at small size specifically, addressed but not eliminated by the small-size variant.

## Founder decision

Per instruction: no ranking, no winner, no combination, and no color has been introduced. D1, D2, and D3 are presented as three complete, structurally different refinements of one endorsed territory (Arabic-native, execution/activation/precision/motion), each with its own wordmark, standalone mark, construction rationale, and size/application testing. Possible outcomes are entirely the Founder's: select one, reject all three, request further refinement of one, or ask for specific elements to be combined. Only after the core mark is approved does the process continue to color, typography, UI, website, and domain — none of which has been started here.
