# SHAGHIL — Phase 3 Implementation Report

**STATUS: FOUNDER APPROVED — PHASE 3 LOCKED** (approved and locked at `dac09fa41ca182548fdfedaf731ae0c267bdcd15` — see `SHAGHIL_IMPLEMENTATION_PHASE3_LOCK.md` for the closeout record. The line below reflects this document's status at the time it was written, before lock.)

*Original status at time of writing: PHASE 3 IMPLEMENTED — FOUNDER REVIEW REQUIRED (not locked).*
Base commit: `26c2a5b` (SHAGHIL Phase 3 audit, on `shaghil-product-implementation`).
Scope: exactly Batch 1 + Batch 2 of the Founder's Phase 3 Implementation Authorization. Batch 3 is deferred, not implemented.

## 1. Findings addressed

| Finding | Description | Status |
|---|---|---|
| P1-01 | Generic "اصنع التصميم" CTA duplicated per-card CTAs when a multi-idea result rendered | Fixed |
| P1-02 | Product Library had no path into Visual Studio | Fixed (Option D) |
| P2-03 | Campaign-pack blocked-state message didn't tell the user what to do next | Fixed |

Batch 3 findings (P2-04, P2-05, P2-07, P2-08, P3-09, P3-10, P3-11) are explicitly **deferred**, per Founder instruction. No code for them was touched.

## 2. P1-01 — Create Design CTA de-duplication

`renderCards()` in `lib/visual-studio.mjs` now returns `true` only when it actually renders ≥2 idea cards (only the `content` engine ever produces multiple cards via `splitIdeas()`). `resultEntry()` now hides the generic bottom CTA whenever `renderCards()` returned `true`:

```js
function resultEntry(){el('visualEntry').classList.toggle('hidden',!['content','campaign','offer'].includes(current)||!lastText||renderCards())}
```

When the result is a single block (campaign, offer, or single-idea content), `renderCards()` returns `false` and the generic CTA is preserved exactly as before. Per-card buttons/`choose()` calls are untouched.

## 3. P2-03 — Campaign-pack blocked-message clarity

`lib/campaign-packs.mjs`: only the message string changed, from a generic "راجع خطأ..." to one naming the concrete next action:

> "لا يمكن اعتماد هذا التصميم لوجود تحذير في تركيبه. عدّله محليًا بدون تكلفة توليد، أو أعد التوليد، ثم احفظ نسخة معتمدة."

The blocking condition (`if(record.overlayWarning)return message(...)`) and all save/blocking logic are unchanged.

## 4. P1-02 (Option D) — Product Library → Visual Studio direct entry + Home hint

### 4.1 Product-seeded Visual Studio entry contract

A new, additive sibling function `useProduct(productId)` was added to `lib/visual-studio.mjs`, alongside the existing `choose()` — `choose()`'s contract is untouched.

Contract:
- Seeds the visual task **only** from the product's stored `name` and `description`.
- **Never invents** a campaign concept, headline, CTA, offer, audience insight, or advertising copy. `autoCopy()`'s existing fallback (first non-empty line → headline, empty → CTA) means the auto-filled headline is the product name verbatim; CTA is left empty for the user to fill in.
- The product's stored image and exact-fidelity eligibility are preserved unchanged by reusing the existing `selectProduct()` mechanism as-is.
- Creative Direction (format, mode, text mode, and everything else in Visual Studio's controls) remains fully under user control after entry.
- Tags the synthesized task `engine:'content'`, since `api/visual.mjs`'s `normalizeVisual()` only accepts `content`/`campaign`/`offer` and no API changes were in scope (see §7, known issue).

### 4.2 Product Library action

`lib/product-library.mjs`: each saved product card now has a **"استخدم في Visual Studio"** button that calls `Visual.useProduct(p.id)`, which selects the product, opens Visual Studio, and applies the contract in §4.1. No changes to `upload()`, `save()`, `reset()`, or the product persistence schema.

### 4.3 Home discoverability hint

`index.html`: one line added inside the existing Home intro card, using the pre-existing `.status` (secondary-text) class — no new CSS, no new navigation item, no seventh engine card, no competing primary CTA:

> "عندك صورة منتج جاهزة؟ افتح مكتبة المنتجات لصنع تصميم بصري مباشرة منها."

The existing 6-engine grid and all Home architecture are unchanged (verified visually, see screenshots §6).

## 5. Files changed

- `lib/visual-studio.mjs` — P1-01 fix (`renderCards`/`resultEntry`) + new `useProduct()` sibling function + export.
- `lib/campaign-packs.mjs` — P2-03 message text only.
- `lib/product-library.mjs` — new "استخدم في Visual Studio" button per product card.
- `index.html` — one-line Home hint.
- `scripts/qa-v06.mjs` — updated one assertion to reflect the intentional P1-01 behavior change (see §6.1), plus two new positive assertions.

No other files were modified. Business Brain, Brand Brain, the six text engines, workspace import/export, History, Product Library storage schema, background isolation, Change Background, exact-fidelity compositing, and the locked design system/typography/logo are untouched.

## 6. QA results

### 6.1 Full regression (`scripts/qa-v06.mjs`)
**14/14 PASS.** One existing assertion was updated because it tested behavior Batch 1 intentionally changed: a 7-day content plan produces 7 idea cards, and per P1-01 the generic bottom CTA is now correctly hidden in that case (previously visible, which was the bug). The updated assertions confirm: generic CTA hidden, `contentCards` shown, exactly 7 per-card primary buttons present.

### 6.2 Phase 1 QA — 41/41 PASS (unchanged, re-run clean)
### 6.3 Phase 2 QA — 41/41 PASS (unchanged, re-run clean)
### 6.4 Refinement 01 QA — 27/27 PASS (unchanged, re-run clean)

### 6.5 New focused Phase 3 QA — 19/19 PASS

Real-runtime Playwright script driven against served files with only `/api/generate` and `/api/visual` mocked (no `OPENAI_API_KEY` in this environment). Checks covered, matching the Founder's 16-item list plus supporting checks:

1. Multi-idea result: each card has its own single "اصنع التصميم" button.
2. Generic bottom CTA is hidden when ≥2 cards render.
3. Single-result (campaign/offer/single-idea) generic CTA preserved.
4. Per-card action (`choose(item)`) unaltered.
5. Campaign-pack blocked message names the concrete corrective action.
6. Product Library shows the "استخدم في Visual Studio" action on a real, persisted product.
7. Clicking it opens Visual Studio with the product selected.
8. Product image is preserved (same stored image shown).
9. Product name is transferred into the seeded source.
10. Product description is transferred into the seeded source.
11. No invented copy: headline equals the product name verbatim, CTA is empty.
12. Existing text-originated `choose()` path is unaffected.
13. Exact-fidelity path confirmed via network payload (no `image` field sent to `/api/visual` for exact-fidelity products).
14. Change Background still fires a request and the design still completes (background-isolation itself flagged NOT VERIFIED IN THIS ENVIRONMENT — see §8).
15. Product Library survives reload with the new button intact.
16. Workspace export/import preserves saved products.
17. Home hint present on desktop, visually secondary, not a button/nav item.
18. Home hint present and responsive at 375px.
19. Zero horizontal overflow at 375px across Home, Product Library, and the product-seeded Visual Studio entry.

## 7. Known remaining issues (disclosed, not fixed — out of Batch 1/2 scope)

- **`engine:'content'` tagging trade-off**: since `api/visual.mjs`'s allow-list only accepts `content`/`campaign`/`offer` and API changes were out of scope, product-seeded Visual Studio sessions are tagged `content`. This may cause a product-seeded design to display as "سوّى محتوى" rather than a distinct label in History. No functional impact; a labeling nuance only.
- **Back-navigation from a product-seeded session**: returning from Visual Studio (`back()`) after a product-seeded entry returns to the content-result screen state, since no dedicated originating screen exists for this entry path. This matches existing `choose()` behavior for any non-standard originating state and was not altered.
- **Background isolation / `esm.sh`**: this sandbox's own network egress policy blocks `esm.sh` outright (`connect_rejected — organization policy`), so real background-removal via `@imgly/background-removal` could not be exercised in this environment. This is an environment limitation of the sandbox, not a product defect. The Change Background QA check (§6.5 item 14) explicitly detects this condition and marks background-isolation itself **NOT VERIFIED IN THIS ENVIRONMENT**, while confirming everything that is genuinely verifiable here (request fires, design still completes and saves).

## 8. Deferred (Batch 3 — confirmed not implemented)

P2-04 (terminology), P2-05 (external CDN architecture), P2-07 (mobile scroll-depth), P2-08 (duplicate workspace-import review), P3-09, P3-10, P3-11. Recorded here as deferred after MVP, per Founder instruction. No code for these was touched in this phase.

## 9. Screenshots

Ten real-runtime screenshots were captured (see Founder report for delivery):
1. Multi-idea result after CTA fix
2. Single-result generic CTA preserved
3. Campaign-pack blocked message
4. Product Library with a real, persisted product
5. Product Library "استخدم في Visual Studio" action
6. Visual Studio after product-seeded entry
7. Visual Studio showing preserved product image
8. Generated visual from the product-seeded path
9. Home hint (desktop)
10. Home hint (mobile, 375px)
