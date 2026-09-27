# SHAGHIL Implementation — Phase 2: Founder Review Refinement Pass 01

**STATUS: FOUNDER APPROVED — PHASE 2 LOCKED** (approved and locked at `5c999c9a845d2399f29b9247d9798484766664d7` — see `SHAGHIL_IMPLEMENTATION_PHASE2_LOCK.md` for the closeout record. The line below reflects this document's status at the time it was written, before lock.)

*Original status at time of writing: PHASE 2 — FOUNDER REFINEMENT 01 COMPLETE — REVIEW REQUIRED*

Three tightly scoped fixes on top of the Founder-approved-in-direction Phase 2 implementation (`9353e8d`). Not Phase 3, not a redesign, no new features. Full detail below.

## 1. Product Library — broken image preview

### Diagnosis (root cause)

**Reproduced and confirmed real** — not synthetic screenshot fixture data, not a blob/object-URL lifecycle bug, not a persistence/recovery bug, not an image-rendering bug. It is a **CSS specificity defect**, pre-existing in the runtime since before Phase 1 (verified against `shaghil-product-closure`'s original inline stylesheet — the bug was already present there).

`#productPreviewWrap` (the "unsaved product preview" box) carries `class="full hidden assetRow"`. `.hidden{display:none}` and `.assetRow{display:flex}` are both single-class selectors — equal specificity (0,1,0) — and `.assetRow` is declared *later* in the stylesheet, so `display:flex` won the cascade and the box (including its `<img id="productPreview">` with no `src` set, rendering as a broken-image glyph) was **visible on every visit to the screen**, not only when a file was actually staged. This is exactly what the Founder's screenshot showed, and it was real, not an artifact of my own earlier screenshot's empty seed data (a real empty-library screenshot correctly shows the "أضف أول منتج..." placeholder text with no broken image — verified below).

Auditing every other class ever combined with `.hidden` in the same way found **two more live instances of the identical bug**: `.form.hidden` was already safe (an existing, earlier-declared `.form` rule loses to `.hidden` by source order), but `.spin.hidden` (`class="spin visualSpin hidden"`, the loading spinners in Visual Studio and its result screen) had the same problem — the spinner was visibly present (a static, non-spinning-but-rendered ring, since it only *animates* while actually shown) at rest on every visit to those screens. This was verified directly in a full-page mobile Visual Studio screenshot from the prior Phase 2 pass, which shows exactly this stray ring above the "اصنع التصميم" button.

### Fix / result

Extended the existing pattern the original author had already used for `.actions.hidden,.grid.hidden{display:none}` (a proven, working compound-selector override) to cover every affected combination: `.actions.hidden,.form.hidden,.grid.hidden,.assetRow.hidden,.spin.hidden{display:none}`. This raises specificity to (0,2,0), which reliably beats every single-class `display` rule regardless of stylesheet order — verified both in Playwright (real Chromium) and directly against the exact JSDOM/cssstyle engine the regression suite uses. No Product Library data model, upload logic, or exact-product pipeline was touched — this is a display-only CSS fix.

**QA proof, real data (not fixture):** uploaded a real PNG through the actual `#productImage` file input, saved it through `Products.save()`, and verified: (1) the unsaved-preview box stays correctly hidden before any file is staged, (2) the staged preview shows correctly (not broken) while editing, (3) the saved product's thumbnail renders in the library grid in the same session, (4) it **still renders correctly after a full page reload** (real IndexedDB persistence, not synthetic), (5) the product is selectable from the real Business Brain → Generated Result → "Create Design" → Visual Studio flow, where its saved fidelity (`exact`) is correctly wired in automatically.

## 2. Visual Studio mobile — progressive disclosure

The four approved section headings (المصدر / الاتجاه الإبداعي / التكوين / التوليد) are unchanged. The Composition group ("التكوين") — text mode, product size/position/height, logo visibility/position, text position and fields — is now wrapped in a native `<details class="brandSection" id="visualAdvanced">` with `<summary><h3>التكوين — إعدادات متقدمة</h3></summary>`, using the same native disclosure pattern the codebase already uses elsewhere (the idea-card "تفاصيل" expander in `lib/visual-studio.mjs`'s `renderCards()`). No JS component, no new architecture — the browser's built-in disclosure widget, fully keyboard-accessible (added `summary` to the existing global `:focus-visible` rule for a consistent focus ring).

A small, purely presentational script (`matchMedia('(min-width:701px)')`, guarded so it no-ops in the non-browser QA harnesses that don't implement `matchMedia`) sets the section's default open/closed state on load and on any breakpoint crossing: **open by default on desktop** (≥701px — same product model, same markup, just already-expanded), **closed by default on mobile** (≤700px). All fields, IDs, `selected` defaults, and `Visual.generate()`'s reading of them are completely unchanged — collapsed `<details>` content remains a live, valid part of the form; its values are read normally by `settings()` whether or not the section was ever opened.

**Verified live:** on a fresh 375px mobile session, a user can select product → choose creative direction/format → generate without ever expanding Advanced, and the generation request's `settings` payload is byte-identical to the locked defaults (`productSize:"medium"`, `productPosition:"center"`, `productVertical:"middle"`, `logoVisible:true`, `logoPosition:"top-right"`, `textPosition:"bottom"`) — proving generation behavior is unaffected. Expanding "إعدادات متقدمة" reveals every original composition control, none removed. On desktop, the same section renders already-expanded, so there is exactly one product model, not two.

## 3. Mobile global navigation

The five nav destinations (Home, Business Brain, Brand Brain, Product Library, History), the same `.btn` component, and the same semantic `<nav class="nav">` are unchanged. At ≤700px, `.nav` no longer wraps into a second row of buttons; instead it becomes a single horizontally-scrollable strip (`flex-wrap:nowrap;overflow-x:auto`, `-ms`/`webkit` scrollbar hidden for a clean look, buttons `flex-shrink:0` so none get squished). The wordmark logo keeps its exact size (28px, unchanged) and sits alone on its own row, so it stays visually dominant. This is not new navigation architecture — it's the same button row, the same destinations, just scrolling horizontally instead of wrapping vertically, a well-established lightweight mobile pattern (the same technique a browser's own tab strip uses).

**Result:** mobile header height dropped from 3 rows (logo, then two wrapped rows of nav buttons) to 2 rows (logo, then one scrollable nav row) — **94px total** for the whole sticky header at 375px, down substantially from before. No horizontal *page* overflow (only the nav strip itself scrolls internally). Every nav button still measures exactly 40px tall. All five destinations were verified reachable and functional by scrolling to and clicking each one in turn.

## Deliberately unchanged

- Home engine architecture, the six engine names, engine behavior, prompts, APIs, generation logic — untouched.
- Business Brain schema, Brand Brain schema, History persistence, workspace export/import — untouched (re-verified: `Workspace.export`/`import` still wired, product IDs/blobs/exact-fidelity pipeline untouched).
- Background removal and exact-product compositing (`lib/visual-canvas.mjs`, `lib/background-removal.mjs`) — not touched at all.
- Design-system foundations, typography, Graphite Pulse, master wordmark — untouched.
- Desktop layouts, outside of the Visual Studio Composition section now rendering pre-expanded (which is the *same* layout it already had — just wrapped in a `<details open>` that happens to always be open there).
- The previously-deferred mixed Arabic/English terminology review — not addressed, per instruction.

## Runtime files changed

- `index.html` — wrapped Visual Studio's Composition section in `<details id="visualAdvanced">`/`<summary>`; added the small guarded `matchMedia` disclosure-sync script at the bottom of the existing inline script. No element ID removed, no onclick handler removed or changed, no other markup touched.
- `styles/components.css` — replaced the old two-class `.actions.hidden,.grid.hidden{display:none}` override with the complete five-class version (`.actions`, `.form`, `.grid`, `.assetRow`, `.spin`); added `.nav` mobile horizontal-scroll rules and reduced `.top` mobile vertical padding; added `summary` to the global focus-visible rule and a small `#visualStudio summary` style.
- `styles/foundations.css` — untouched. No locked token changed.
- No `lib/*.mjs` or `api/*.mjs` file touched. No test-harness file needed changes this pass (the one `matchMedia` reference that could have broken the regression suite's synthetic DOM mocks was pre-emptively guarded in the product code itself, so zero `scripts/*.mjs` files required edits).

## QA results

**Existing regression QA: 14/14 PASS**, re-run against the final refined runtime, zero failures, zero test-harness changes needed this pass:

```
scripts/qa.mjs                                  PASS (exit 0)
scripts/qa-v05.mjs                              PASS (exit 0)
scripts/qa-v06.mjs                              PASS (exit 0)
scripts/qa-v07.mjs                              PASS (exit 0)
scripts/qa-v07-migration.mjs                    PASS (exit 0)
scripts/qa-v07-product-persistence.mjs          PASS (exit 0)
scripts/qa-v07-upload-ux.mjs                    PASS (exit 0)
scripts/qa-v08-history-nav.mjs                  PASS (exit 0)
scripts/qa-v08-history-render.mjs               PASS (exit 0)
scripts/qa-v08-import-recovery-ui.mjs           PASS (exit 0)
scripts/qa-v08-workspace-transfer.mjs           PASS (exit 0)
scripts/qa-v09-background-isolation.mjs         PASS (exit 0)
scripts/qa-v09-pilot-readiness.mjs              PASS (exit 0)
scripts/qa-product-closure-export-warning.mjs   PASS (exit 0)
```

**Phase 1 QA: 26/26 PASS** — re-verified as part of the 41-check Phase 2 suite below (fonts, both color modes, RTL, mixed Arabic/English, 375/768px overflow, focus states, 11px floor, 40px targets, no stray gradients, logo theming, upload/color-control behavior, engine icons all still correct).

**Phase 2 QA: 41/41 PASS** — re-run in full against the refined runtime (global nav, Business Brain/Brand Brain/Product Library screens, Generated Result hierarchy, Visual Studio grouping, History grouping, all six engines, keyboard focus, no console errors).

**New focused refinement QA: 27/27 PASS**, covering exactly the nine items requested:

1. Unsaved-product preview box stays hidden at rest (Product Library bug fixed) — confirmed.
2. Staged preview and saved-product thumbnail render correctly with a real uploaded file, in-session and after a full page reload (true persistence, not fixture data).
3. The saved product is selectable from the real Business-Brain → Generated-Result → Visual-Studio flow, with its saved fidelity correctly defaulted.
4. Visual Studio's advanced section starts collapsed on mobile, expanded on desktop; every original control still exists and is reachable.
5. Generation receives byte-identical default settings whether or not Advanced was ever opened.
6. Mobile header height substantially reduced (94px), no horizontal page overflow, nav strip scrolls internally.
7. Every one of the five mobile nav destinations verified reachable and functional.
8. 40px tap targets and wordmark size verified unchanged.
9. 768px and 1440px (including light mode) spot-checked with zero overflow.

No existing assertion in any committed `scripts/*.mjs` file was weakened, removed, or had its expected outcome changed in this pass.

## Screenshots

Real runtime, Chromium/Playwright, populated with representative data (including a genuinely uploaded and persisted product image):

1. `01-mobile-header-375.png`
2. `02-mobile-visual-studio-default.png`
3. `03-mobile-visual-studio-advanced-expanded.png`
4. `04-product-library-real-product.png` (plus `04-product-library-real-product-empty.png` showing the fixed at-rest state)
5. `05-product-library-to-visual-studio.png`
6. `06-desktop-visual-studio.png`

## Final status

**PHASE 2 — FOUNDER REFINEMENT 01 COMPLETE — REVIEW REQUIRED.** Not locked. Not Phase 3.
