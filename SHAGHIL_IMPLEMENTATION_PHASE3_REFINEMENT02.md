# SHAGHIL — Phase 3, Founder Refinement 02

**STATUS: FOUNDER APPROVED — PHASE 3 LOCKED** (approved and locked at `dac09fa41ca182548fdfedaf731ae0c267bdcd15` — see `SHAGHIL_IMPLEMENTATION_PHASE3_LOCK.md` for the closeout record. The line below reflects this document's status at the time it was written, before lock.)

*Original status at time of writing: PHASE 3 — FOUNDER REFINEMENT 02 COMPLETE — REVIEW REQUIRED (Phase 3 remains not locked).*
Base commit: `e16bfd8` (SHAGHIL Phase 3 Founder Refinement 01, on `shaghil-product-implementation`).
Scope: exactly one blocking issue — the global navigation header rendering across the Generated Result image — and nothing else. No terminology, architecture, or feature changes were made in this pass.

## Root cause

The header (`.top`) is `position:sticky`, correctly pinned to the top of the viewport during real scrolling — this part of the CSS was verified sound and was **not** the defect (confirmed by directly reading its bounding rect at multiple scroll offsets: it consistently renders at `top:8px` from the viewport, on every screen, with no ancestor `overflow`/`transform` that could break its containing block).

The real defect is a **scroll-position carryover between screens**. `show(x)` (the single, shared screen-visibility toggler in `index.html`) only toggles each screen's `.hidden` class — it never resets `window.scrollY`. Visual Studio is a long screen (Source → Creative Direction → Composition/Advanced Settings → Generation), so a user routinely scrolls well down the page before pressing "اصنع التصميم". When generation completes, `display(record)` in `lib/visual-studio.mjs` swaps the visible screen to the much shorter Generated Result screen — but the browser's scroll offset is left exactly where it was on the old, taller screen. That stale offset can land squarely in the middle of the new, shorter result content. Because the sticky header always occupies the same viewport band regardless of scroll position, and the page underneath it is now scrolled to a point where the generated image sits behind that band, the header visually cuts across the image — exactly what the Founder's screenshot showed.

This was reproduced directly (not just inferred): after clicking "اصنع التصميم" from a scrolled position in Visual Studio and reading `getBoundingClientRect()` for both `.top` and `#visualImage` with no explicit scroll call in between, the image's rect began at a negative `top` (already scrolled past) while its visible remainder fell inside the header's `top:8–74px` band — reproducing the overlap on demand. Manually stepping through fixed round-number scroll offsets (0/200/400/600/800px) had not reproduced it in an earlier check, which is why the initial read of the CSS looked clean; the real trigger is specifically the *leftover* scroll position from the previous (taller) screen, not scrolling in general.

## Exact fix

One line added to `display()` in `lib/visual-studio.mjs` — the single function that shows the Generated Result screen from every path that can reach it (a fresh generation, a free local edit, reopening a design from History, or opening a saved design):

```js
scrollTo(0,0);
```

placed immediately after `show('visualResult')`. This resets the viewport to the top of the new, shorter screen every time it becomes visible, so the sticky header is guaranteed to sit above the top of the generated image rather than at some leftover mid-page offset. No other function, screen, or transition was touched — `show()` itself was left unmodified, so every other screen's scroll behavior is byte-identical to before.

## Files changed

- `lib/visual-studio.mjs` — one line (`scrollTo(0,0);`) plus an explanatory comment, inside `display()` only.

Nothing else in the repository was modified in this pass.

## Confirmation that no unrelated runtime behavior changed

- Navigation architecture: unchanged — same five nav destinations, same `show()` function, same routing calls.
- Generated Result functionality: unchanged — `display()`'s existing logic (image src, meta text, back-button label, Packs prep, overlay reset, status text) runs exactly as before; the new line only runs after all of it.
- Image generation, refinement, variants, campaign packs, download, History, Product Library, back-navigation: none of these call paths were touched; all funnel through the same unmodified `display()` body they always did.
- RTL and responsive behavior: unaffected — `scrollTo(0,0)` is direction-agnostic and viewport-size-agnostic.
- Graphite Pulse design system: unaffected — zero CSS was changed; the sticky-header rule in `styles/components.css` is untouched.

## QA results

### Full regression — 14/14 PASS, unchanged
All 14 committed regression scripts pass with **zero test-assertion changes** — this fix required no test updates, disclosed or otherwise, since it corrects a runtime behavior (scroll position) that none of the existing regression scripts asserted on.

### Phase 3 Founder Refinement 01 focused QA — 31/31 PASS, unchanged
Re-run in full to confirm this fix has no effect on the product-origin History labeling, product-origin back-navigation, terminology, exact-fidelity, or any of the other 25 items verified in that pass — all 31 checks still pass exactly as before.

### New focused verification for this issue — 14/14 PASS
A new real-runtime Playwright check (`refinement02-qa.mjs`, not committed — ephemeral scratch QA, consistent with this session's established practice for one-off verification scripts) covering:
- Product Library → Visual Studio → Generated Result flow still reaches the result screen.
- Desktop and mobile (375px): no horizontal overflow; the header sits at the top of the viewport (`top:8–16px` depending on breakpoint padding); the header does not overlap the generated image in the screen's natural (as-rendered) state.
- A desktop viewport-only capture centered on the result/action area, confirming no overlap there either.
- All five navigation destinations (الرئيسية، هوية النشاط، هوية العلامة، مكتبة المنتجات، السجل) still open their screens correctly.

Before the fix, the "header does not overlap the image in its natural state" check failed on both desktop and mobile, reproducing the Founder's exact finding. After the one-line fix, all 14 checks pass, including that one, with no other assertion touched — confirming the fix directly resolves the reported defect and nothing was weakened or worked around to force a pass.

## Screenshots

Delivered separately, exactly as required:
1. Generated Result — desktop, full page (header at top, image fully visible and unobstructed).
2. Generated Result — mobile 375px, full page (header at top, image fully visible and unobstructed).
3. Generated Result — desktop, viewport focused on the result/action area.
