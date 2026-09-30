# SHAGHIL — Closed Pilot UX Refinement

**Status: IMPLEMENTATION COMPLETE — AWAITING FOUNDER REVIEW.** Implemented on a separate branch only. Not merged, not deployed to production.

**Branch:** `shaghil-closed-pilot-ux-refinement`, created from `shaghil-product-implementation` at `58ffbfbe00c2e4103dc72339da4e18a70e202802` (the latest Founder-approved implementation, including the prior Founder QA Refinement).

---

## 1. Product image replacement

### Diagnosis
The underlying replace-in-place mechanism (`تعديل` → select a new file → `حفظ المنتج`) was traced end-to-end in `lib/product-library.mjs` and `lib/visual-storage.mjs`, and reproduced twice with real Chromium (both `exact` and `creative` fidelity): the product ID, name and description are correctly preserved (`store.saveProduct` uses `put()` with the same `id`, which overwrites the existing IndexedDB record rather than creating a new one), and a subsequent "استخدم في استوديو التصميم" call always re-fetches the product fresh from storage, so the replacement image reaches the very next generation automatically. No data-level defect was found or reproduced.

The most plausible explanation for "does not reliably work" is a **UX confidence gap**, not a data bug: the Save button read the identical "حفظ المنتج" label whether adding a new product or editing an existing one, there was no visible way to back out of an in-progress edit, and the success message never confirmed which product was updated. This plausibly led to hesitation and the delete-and-recreate workaround, even though the underlying save was already correct.

### Implementation
- The Save button now reads **"تحديث المنتج"** while editing an existing product, and reverts to **"حفظ المنتج"** for a new one.
- A new **"إلغاء التعديل"** button appears only while editing, fully discarding the in-progress edit (no data touched) via the existing `reset()` path.
- The edit-mode status message now names the product being edited; the save-success message explicitly confirms an update ("تم تحديث "..." — الصورة الجديدة ستُستخدم تلقائيًا في التصاميم القادمة، والتصاميم المحفوظة سابقًا لا تتغيّر") versus a new addition ("تم حفظ "..." في المكتبة").
- No change to `store.saveProduct`, `store.deleteProduct`, or the underlying replace/relationship logic — it was already correct.

### Verified (real, byte-level checks — not assumptions)
- Replacing the image preserves the product's ID, name and description.
- The very next generation (`useProduct` → `Visual.generate()`) automatically uses the replacement image — no extra steps, no re-selection needed.
- **A design saved before the replacement keeps its own original image byte-for-byte** — confirmed by comparing the actual bytes embedded in the saved Visual History record before vs. after the edit.
- Replacing an image never creates a duplicate product (product count stays 1).
- Cancel-edit fully discards the in-progress edit without persisting anything.

---

## 2. Shorten Visual Studio and Generated Result

### Implementation
- **Visual Studio** (`#visualAdvanced`, "التكوين — إعدادات متقدمة"): removed the `open` attribute and the viewport-based auto-open logic (`studioAdvancedQuery`/`syncStudioAdvanced`) that previously forced it open on desktop widths. It is now collapsed by default on every screen size, exactly like it already was on narrow viewports — nothing new was built, an existing `<details>` interaction is now used consistently.
- **Generated Result**: the two large, always-visible blocks — "توليد جديد — صورة واحدة بتكلفة" (background/variant/recompose controls) and "حزمة الحملة — اعتماد وحفظ محلي" (campaign pack form) — are now wrapped in the same native `<details class="brandSection">` pattern already proven and approved for Visual Studio's advanced settings, collapsed by default. The generated image, its metadata, and the primary actions bar (تحميل، نسخة ثانية، مميز أكثر، أبسط، بدون نص، تعديل النص/تغيير المقاس، السجل) remain immediately visible, outside any collapsed section.
- `styles/components.css`: extended the existing `#visualStudio summary{cursor:pointer;...}` rule to also cover `#visualResult summary`, so the new collapsible sections get the identical, already-approved interaction styling — no new CSS rules, no color/typography change.
- Every existing control (all advanced settings fields, all variant/recompose fields, the entire campaign pack form) remains in the DOM, fully functional, one click away — nothing was removed.

### Verified
- `#visualAdvanced`, the new-generation section, and the campaign-pack section all start with no `open` attribute (collapsed) on every viewport.
- Every previously-existing control ID (`visualTextMode`, `visualProductSize`, `visualProductPosition`, `visualProductVertical`, `visualLogoVisible`, `visualLogoPosition`, `visualTextPosition`, `variationMode`, `recomposeFormat`, `aiActions`, `packSelect`, `packName`, `packLabel`, `packCTA`, `packCaption`, `packAdd`) is still present.
- The generated image and the primary actions bar are confirmed to sit outside any `<details>` — they stay immediately visible.
- Desktop and mobile screenshots (below) confirm the dramatic reduction in default scroll length, with no loss of capability.

---

## 3. Platform-specific aspect ratios

### Implementation
- `api/visual.mjs`: `FORMATS` extended with `'16:9': '1536x864'` (generic landscape) and `'1.91:1': '1536x864'` (LinkedIn). Both reuse the already-supported `1536x864` raw generation size — `composeVisual()` fits (never crops) the raw image into the final target canvas, so the exact published ratio is enforced locally regardless of the raw generation size. This is the same "fit, don't crop" design the three existing formats already rely on.
- `lib/visual-canvas.mjs`: `DIMENSIONS` extended with `'16:9': [1920, 1080]` (true 16:9) and `'1.91:1': [1200, 627]` (LinkedIn's documented single-image post size). The three existing formats' dimensions are byte-for-byte unchanged.
- A real, previously-latent text-layout bug was found and fixed while adding these: the text panel's height was a fixed percentage of the canvas *height* alone, which works for square/portrait/vertical canvases but left far too little room on short, wide landscape canvases — a normal-length headline would throw `النص طويل للتصميم`. Landscape canvases (`w>h`) now get a larger percentage of `h` for the text panel (0.58/0.40 vs. 0.36/0.26), fixing this without any change to the three existing, non-landscape formats' appearance.
- `index.html`: `#visualFormat` (the primary format selector) is now grouped with `<optgroup>` into **"حسب المنصة"** (Instagram — square/portrait/story, LinkedIn — landscape) and **"أبعاد عامة"** (a generic 16:9 landscape), clearly distinguishing platform presets from generic ratios. `#recomposeFormat` and `#editFormat` (the two secondary re-format tools) gained the same two new values for full pipeline consistency.

### Verified
- Both new formats pass `/api/visual`'s validation; an unlisted ratio is still correctly rejected.
- The real compositor renders a worst-case long headline within bounds, at the exact documented pixel dimensions, for all five formats (regression-checked against the three original formats' unchanged dimensions).
- Selecting a platform preset (tested with LinkedIn 1.91:1) reaches the `/api/visual` request payload, the local compositor call, and the result metadata display.
- The format `<select>`'s `<optgroup>` structure was inspected directly: Instagram (1:1, 4:5, 9:16) and LinkedIn (1.91:1) are grouped under "حسب المنصة"; the generic 16:9 sits alone under "أبعاد عامة".

---

## Runtime files changed

- `api/visual.mjs` — new formats.
- `lib/visual-canvas.mjs` — new dimensions, landscape text-panel fix.
- `lib/product-library.mjs` — edit-mode UX clarity (button labels, cancel button, explicit messages).
- `index.html` — collapsed-by-default sections, new format `<optgroup>`s and options, new cancel-edit button.
- `styles/components.css` — one selector extended (no new rules).

## Test files changed

- `scripts/qa.mjs` — wires in the new focused suite (as an isolated child process, since it needs a clean IndexedDB).
- `scripts/qa-v06.mjs` — one fixture value changed (`'16:9'` was used as an example of an *invalid* format in a negative test; since `16:9` is now a valid format by design, the fixture now uses `'16:10'`, a still-genuinely-invalid ratio). The invariant being tested (invalid formats are rejected) is unchanged.
- `scripts/qa-v07-upload-ux.mjs` — added the new `#productCancelEdit` element to its synthetic HTML fixture, matching the real markup (this test's own hand-built HTML snippet had fallen out of sync with `index.html`, which silently swallowed an exception inside `save()`'s try/catch without failing the test — found and fixed during this task).
- `scripts/qa-closed-pilot-ux.mjs` (new) — the focused regression for all three findings.

## Automated QA results

`npm run qa` (now 18 scripts): **57 PASS, 0 FAIL**, exit 0. Every script also re-run individually — all pass. No existing regression assertion's *meaning* was changed; only one fixture value (see above) and one test fixture's HTML shape were kept in sync with real, intentional product changes.

## Focused QA results (`scripts/qa-closed-pilot-ux.mjs`)

All three findings covered with real, byte-level and structural assertions (see per-finding "Verified" sections above) — full detail in the script itself.

## Screenshots

`/tmp/claude-0/-home-user-shaghil/37617476-08a9-524a-a715-a5010d41ee18/scratchpad/shots-pilot-ux/`:
- `before-desktop-01-visual-studio.png` / `after-desktop-01-visual-studio.png`
- `before-desktop-02-generated-result.png` / `after-desktop-02-generated-result.png`
- `before-mobile-01-visual-studio.png` / `after-mobile-01-visual-studio.png`
- `before-mobile-02-generated-result.png` / `after-mobile-02-generated-result.png`

("Before" captured from the pre-change baseline at `58ffbfbe00c2e4103dc72339da4e18a70e202802`, served from an isolated snapshot directory; "after" from this branch's working tree — both via the same real-Chromium method used throughout this project's QA.)

## Known limitations

- Finding 1's root cause could not be reproduced as a data-level defect in this sandbox (no `OPENAI_API_KEY`, so only the mocked-`/api/visual` path was exercisable) — the fix targets the most plausible explanation (UX confidence) rather than a confirmed code defect. If the Founder still observes an actual data-loss scenario after this change, it needs a fresh, step-by-step repro to investigate further.
- The landscape text-panel percentages (0.58/0.40) were tuned against a worst-case 120-character headline plus a CTA; they were not tested against arbitrarily longer input, which would still correctly fail safe (the existing `overlayWarning`/no-text degrade path in `requestVisual()` is unchanged).

## Version control

- Starting SHA (branch point): `58ffbfbe00c2e4103dc72339da4e18a70e202802`
- Branch: `shaghil-closed-pilot-ux-refinement` (new, separate from `shaghil-product-implementation`)
- No protected branch (`main`, `shaghil-v0.9`, `shaghil-product-closure`, `shaghil-brand-final`, `shaghil-design-system`) touched.
- Not merged. Not deployed to production.
