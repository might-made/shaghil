# SHAGHIL — Wordmark-Led Identity: Final Logo Round (W1/W2/W3)

Branch: `shaghil-brand-final`. Basis: Founder review of D1/D2/D3 (Phase 4) — none approved. Strategic conclusion: stop forcing شغّل to produce an independent abstract icon; the Arabic word itself is the primary asset, with a secondary micro-mark derived from it. This is the final logo exploration round. Still black/white only.

## Method

Every wordmark starts from the same guaranteed-correct source used throughout this workstream: the real Unicode string شغّل, rendered by the browser's own text-shaping engine, then traced into genuine vector path data (threshold → connected-component labelling → boundary tracing → Bézier fitting — the same tracer built and validated in the Phase 4 refinement round). Customizations are real, restrained geometric edits applied to that traced data — uniform transforms (safe everywhere, since they act on the whole shape and never touch cursive joining) or transforms applied to individual components that are already disconnected in the real rendering (the shadda and each dot are separate ink islands from the connected letter body, confirmed by the tracer's own component labelling — moving or scaling them cannot break any letter's joining).

**A real identification bug was found and fixed during this round:** the script originally picked "the ghain dot" by simple vertical order (second-topmost non-body component). At one render configuration this silently grabbed one of ش's three dots instead — a real mislabelling, not cosmetic — because vertical order among small components isn't stable across different transforms/render sizes. Fixed by identifying the ghain dot anatomically: the dot-sized component closest in X to the shadda (ghain's own dot sits directly beneath its own shadda in real Arabic construction), which is unaffected by transform-induced vertical reordering. Re-verified visually on all three wordmarks after the fix.

**A real rendering-pipeline bug was also found and fixed:** `page.screenshot({clip})` in this Playwright installation caps output at the page's current viewport height rather than the full clip height (unlike the same technique used in earlier rounds). Fixed by resizing the page's viewport to the measured content height before taking the screenshot. Caught because the saved board PNGs were checked for actual pixel dimensions, not assumed correct from the console log.

## W1 — Precision

A disciplined, engineered reading of شغّل. Three real, restrained edits: (1) 7% uniform horizontal compression of the whole word (a single safe transform). (2) The three real traced dots of the first letter, repositioned — not redrawn — into a precise, evenly spaced arrangement centered on their own natural cluster. (3) The real traced shadda recentered exactly on the ghain dot's vertical axis and reduced 10% for a tighter fit.

**Micro-mark:** the same shadda-over-dot relationship the wordmark already customizes, extracted as a standalone pair with a little extra real spacing added (needed only in isolation — at full word scale the tighter spacing reads correctly in context, but alone it needs more air to read as two forms rather than one).

## W2 — Activation

Activation lives inside the word, not beside it. The real shadda — already Arabic's own emphasis mark — is scaled 1.35× in place; the real ghain dot beneath it is scaled 1.25× and lifted fractionally toward it. Both are genuinely disconnected components in the real rendering, so neither edit touches any letter's joining.

**Micro-mark:** the enlarged shadda + dot cluster, extracted directly. **Small-size variant required and built:** at 16px the full-scale cluster's dot visually merges into the shadda's lower lobe, reading as one muddy blob rather than two related forms (found during rendered QA, not assumed). `W2-micromark-small.svg` uses the same two real shapes at a smaller shadda scale with a real gap restored, used only at ≤32px; the full-scale cluster remains the mark everywhere else.

## W3 — Motion

Forward energy from the word's own construction. A uniform -8° skew is applied to the whole rendering before tracing (the letters keep their real relative proportions — nothing is italicized letter-by-letter). The traced result is drawn twice — once with a matched stroke outline, once as a plain fill, both black — a standard, disclosed vector emboldening technique, adding real confident weight without redrawing a single stroke.

**Micro-mark:** the real final-letter (lam) stem and hook, cropped from this same skewed, emboldened rendering (so it inherits W3's own lean and weight) and re-traced in isolation — the same fragment-extraction technique proven in the Phase 4 round, applied here to W3's own customized geometry. A small bleed from the adjacent letter's connecting stroke remains at the crop boundary, the same disclosed trade-off documented in the earlier round.

## Files

```
brand-exploration/wordmark/
  W1-wordmark.svg, W1-micromark.svg
  W2-wordmark.svg, W2-micromark.svg, W2-micromark-small.svg   (small-size variant, see above)
  W3-wordmark.svg, W3-micromark.svg
  shaghil-w1.png, shaghil-w2.png, shaghil-w3.png              boards — all 11 required sections
  refine/                                                      generator pipeline
    trace.mjs            the real-pixel → real-vector tracer (shared with the D1/D2/D3 round)
    common.mjs           shared render/screenshot helpers
    build-wordmarks.mjs  builds W1/W2/W3 wordmarks + micro-marks from real traced components
    build-boards.mjs     generates the three review boards
    shaghil-w1/w2/w3.html   board source (self-contained, regeneratable)
    notokufiarabic900.woff2, word-reference.png   real font + reference render used throughout
```

## Visual QA — actually rendered and inspected

- **شغّل reads correctly** in all three wordmarks, both directions (black-on-white and white-on-black), confirmed by direct inspection of the rendered boards, not DOM validation.
- **Shadda placement, ش dots, غ dot, joining:** all correct in all three; customizations (compression, scale, skew) do not distort the underlying word — each was checked against the unmodified reference render.
- **Custom drawing does not introduce accidental letterforms:** confirmed by inspection; no edit alters a letter's own shape, only position/scale/weight of the whole word or of already-separate diacritic marks.
- **Black/white inversion:** confirmed working on all three (Section 02 of each board — a true fill swap, not a CSS filter).
- **32px wordmark legibility:** confirmed readable on all three (Section 06 size ladder).
- **16px micro-mark legibility:** W1 and W3 hold up structurally at 16px (checked at high device-scale-factor zoom, not assumed from a small thumbnail). W2 did not at full scale — a real muddy-blob failure was found, and a documented small-size variant (`W2-micromark-small.svg`) was built and re-verified clean at 16px.
- **SVGs match rendered PNGs:** each of the 7 SVG files was rendered standalone and screenshotted; all match their appearance within the boards.
- **W1/W2/W3 are meaningfully different:** different source customizations (proportion+alignment vs. scale+cluster vs. skew+weight), different micro-mark territories (vertical diacritic pair vs. activation cluster vs. letter terminal), not color or weight variations of one idea.
- **No forbidden elements:** no arrows, power buttons, check marks (W3's micro-mark is a real lam hook, not a check mark — verified by its construction, a letter fragment, not an invented tick), play buttons, sparkles, robots, brains, chat bubbles, generic SaaS symbols, decorative calligraphy, or heritage ornament in any concept.

## Descriptive distinctiveness observations — not ranked or scored

- **W1:** the condensation and dot/shadda regularization are subtle by design (the brief asked for restraint) — distinctive to a trained eye, but the least visually "loud" of the three; its distinctiveness depends more on cumulative small decisions than one dominant device.
- **W2:** the enlarged shadda+dot cluster is the most immediately visible customization of the three at a glance; also the one most dependent on this specific typeface's shadda shape remaining recognizable at larger-than-normal scale.
- **W3:** the combination of lean + weight is the most visually assertive change to the word itself; the emboldening technique (stroke+fill duplicate) is a standard method, not proprietary, though its specific combination with the skew and this word is.

## Founder decision

Per instruction: no ranking, no winner, no combination. This is the final open-ended logo exploration round — after Founder review of W1/W2/W3, either Path A (select/refine one → finalize master wordmark) or Path B (none reaches the required level → use the strongest clean/readable treatment and close the Logo Track). No color, UI, or website work has been started.
