# SHAGHIL Implementation — Phase 1: Foundation Integration

**STATUS: FOUNDER APPROVED — PHASE 1 LOCKED**

**Founder-approved runtime SHA: `29fd3e8b9239e5a40dd6168a8021aee8b1664b1a`**

Phase 1 (foundation integration) plus Founder Visual Refinement Pass 01 were reviewed and approved by the Founder at the SHA above. Full approval scope, QA results, and closeout terms are recorded in `SHAGHIL_IMPLEMENTATION_PHASE1_LOCK.md`. **The Founder-approved Phase 1 runtime baseline must not be altered unless the Founder explicitly reopens Phase 1.** Future implementation work must continue from this approved baseline without retroactively changing the locked foundation — see the lock document for the exact next resume point.

---

*The section below is the original Phase 1 implementation record, preserved as-is from before Founder approval.*

This phase integrates the locked SHAGHIL brand/design foundations (logo, Graphite Pulse color, IBM Plex Sans Arabic/Sans typography, design-system tokens) into the real runtime (`index.html`) without redesigning workflows, information architecture, or engine/API behavior. All work is on `shaghil-product-implementation` only.

## A. Starting SHA

`4b2ab0cef9e7a1c77f234a063efdbb3cd559806c` — tip of `shaghil-product-implementation` after Phase 0 (`SHAGHIL_IMPLEMENTATION_BASELINE.md`), itself identical in product/runtime code to `shaghil-product-closure @ 1b2b3f5d53c388db9dfb0f030b7b250bddbaac55`.

## B. Locked source SHAs used

| Source | Branch | SHA |
|---|---|---|
| Logo (master wordmark, favicon, app icon) | `shaghil-brand-final` | `4ed4cae13707498f3cd4e5c43de7f95b4bbce386` |
| Graphite Pulse color tokens | `shaghil-brand-final` | `4ed4cae13707498f3cd4e5c43de7f95b4bbce386` |
| IBM Plex Sans Arabic / IBM Plex Sans font files | `shaghil-design-system` | `6df58d2c17679b4e63e76b9e55983b54db1b4944` |
| Typography scale (sizes/weights/line-heights) | `shaghil-brand-final` (typography/final) | `4ed4cae13707498f3cd4e5c43de7f95b4bbce386` |
| Spacing/radius/border/elevation tokens | `shaghil-design-system` (design-system/foundation) | `6df58d2c17679b4e63e76b9e55983b54db1b4944` |

All values were copied verbatim from these sources — no redesign, reinterpretation, or new colors/fonts introduced.

## C. Assets imported

**Fonts** (`/fonts/`, 8 files, 380K total) — the unicode-range-scoped subset files that enforce strict per-script family separation (Arabic-script-only for Plex Sans Arabic, basic-Latin-only for Plex Sans), copied from `origin/shaghil-design-system:brand-final/typography/exploration/fonts/`:
`plexarabic-400-1.woff2`, `plexarabic-500-5.woff2`, `plexarabic-600-9.woff2`, `plexarabic-700-13.woff2`, `plexsans-400-6.woff2`, `plexsans-500-12.woff2`, `plexsans-600-18.woff2`, `plexsans-700-24.woff2`.

**Brand** (`/brand/`):
- `logo-mark.svg` ← `origin/shaghil-brand-final:brand-final/logo/master/SHAGHIL_MASTER_AR.svg` (verbatim, unmodified source copy; a `fill="currentColor"` copy of the same path data is inlined directly into `index.html`'s header so it recolors with the theme — see section G)
- `favicon.svg` ← `origin/shaghil-brand-final:brand-final/logo/micromark/SHAGHIL_FAVICON.svg`, recolored to the locked signal-primary `#127D64` per the color system's documented exception permitting mint recoloring for a favicon/app-icon treatment
- `app-icon.svg` ← `origin/shaghil-brand-final:brand-final/logo/micromark/SHAGHIL_APP_ICON_BW.svg` (verbatim — already the correct black-tile/white-mark treatment)
- `apple-touch-icon.png` (180×180), `favicon-32.png`, `favicon-16.png` — rasterized once from the above SVGs for browsers/OSes that require a raster icon. The one-time rasterization script used to generate them was deleted after use (temporary tooling, not part of the runtime, per the Founder's explicit exclusion).

Not copied: exploration boards, rejected concepts, QA screenshots, other font subsets (cyrillic/greek/vietnamese/latin-ext, and Plex Sans Arabic's own Latin subset), other logo lockups not used by this runtime's chrome.

## D. Runtime files changed

- `index.html` — `<head>` rewritten to link the new stylesheets/icons instead of an inline `<style>` block; the fake placeholder logo (`<div class="logo">ش</div>` + a redundant `<b>شغّل</b>` text label) replaced with the real inlined wordmark SVG. **No JavaScript, element ID, onclick binding, or DOM structure elsewhere was touched.**
- `styles/foundations.css` (new) — `@font-face` declarations + color/typography/spacing/radius/elevation custom properties (dark default, light via `prefers-color-scheme`).
- `styles/components.css` (new) — every selector that existed in the old inline `<style>` block, same selectors/specificity/cascade order, values rewritten to consume the foundation tokens.
- `brand/`, `fonts/` (new) — see section C.
- `scripts/qa-v06.mjs` — one required test-harness fix, see section J.

## E. Typography integration result

Body/document default font is `'IBM Plex Sans Arabic', 'IBM Plex Sans', Tahoma, Arial, sans-serif`. Both families are loaded together; because each `@font-face` declares a `unicode-range` matching only its own script, the browser resolves Arabic-script characters to Plex Sans Arabic and Latin letters/digits/punctuation to Plex Sans within the same run of mixed text — verified live: an injected result containing `SAR 75`, `SAR 60`, `+966 5X XXX XXXX`, `20%`, `CTA`, `WhatsApp` alongside Arabic body copy rendered correctly (`09-typography-mixed-detail.png`, `05-engine-generated-result.png`). Locked type-scale sizes/weights/line-heights applied to `h1`/`h2`/`h3`/body/label/button/caption/metadata. Verified: `h1` computed `font-size` = `40px` (the locked Display size); no visible text renders below the locked 11px metadata floor (checked across every leaf text node on the Home screen). Font faces confirmed `loaded` via `document.fonts`.

## F. Graphite Pulse integration result

Both light and dark mode implemented via `@media (prefers-color-scheme: light)` (dark is the default `:root`, preserving the product's existing default appearance for anyone whose system has no light-mode preference — no new toggle/feature was added). Verified live in both schemes (`01-home-engines-light.png`, `02-home-engines-dark.png`, `06-visual-studio-dark.png`): Graphite surfaces dominant, Signal Mint reserved for primary CTAs only, semantic colors (`--success/--warning/--error/--info`) kept separate from the CTA/signal token, no gradients introduced (the pre-existing loading-skeleton shimmer is the one gradient in the file — a functional loading affordance, not a decorative AI effect; it now uses token-based grayscale surfaces instead of hardcoded hex), no glow effects.

## G. Logo integration result

The locked master wordmark is inlined directly in `index.html`'s header (`.logo` element) with `fill="currentColor"`, colored via a `--logo-color` token that is `#F5F7F7` (white) in dark mode and `#101214` (black) in light mode — matching the locked "black on light, white on dark" default rule. Verified live: logo color flips between `rgb(245,247,247)` (dark) and `rgb(16,18,20)` (light) across the `prefers-color-scheme` boundary. The favicon uses the locked, explicitly-permitted signal-mint recoloring. The logo is rendered at a fixed `28px` height (not oversized). The redundant legacy `<b>شغّل</b>` text label that sat beside the old placeholder box was removed as part of this replacement, since the real wordmark already is that text mark — this is the literal execution of "replace legacy SHAGHIL text/branding... with locked logo assets," scoped to that one static label; no other copy, navigation text, or behavior was touched.

## H. Base component integration result

Every existing selector (`.top`, `.btn`/`.btn.primary`, `.card`, inputs/`textarea`/`select`, `.out`, `.historyItem`, `.toast`, `.brain`, `.engine`, focus-visible outline, etc.) now consumes the token set instead of the old `--bg/--p/--p2/--t/--m/--l/--a` variables and scattered hex values. `.btn` now has an explicit `height: 40px` to satisfy the locked minimum interactive-target size (verified: nav buttons measured `40px` tall). Radius values were stepped onto the locked scale (`8/12/16/999px`) at their nearest correct step (e.g., the old 20px `.top` and 22px `.card` both map to the locked 16px `radius-lg`, since neither was a true pill). No DOM structure, class names, or JS-facing selectors were changed — only CSS values.

## I. Responsive QA

Verified at 375px, 768px, and 1440px (`08-mobile-375.png`, `08b-tablet-768.png`, plus all 1440px screenshots): no horizontal overflow at 375px or 768px (`document.documentElement.scrollWidth` == `clientWidth`), existing mobile breakpoint rules (`@media(max-width:700px)`) preserved and still apply (grid/form/brain collapse to one column, `h1` steps down to the locked H1 size, tagline hides, nav wraps). No new mobile workflow was introduced — only the pre-existing responsive rules, now token-driven.

## J. Behavioral regression result

Zero behavioral regressions. One test-harness-only fix was required and applied: `scripts/qa-v06.mjs` loads `index.html` into JSDOM to drive the real controller code; JSDOM does not fetch externally linked stylesheets the way a real browser does, so a `getComputedStyle(...).display === 'none'` assertion on a `.hidden` element started reading the browser default instead of the app's own CSS purely because that CSS is now in linked files instead of an inline `<style>` block. The fix inlines the two linked stylesheets' contents into the HTML string the test hands to JSDOM before constructing the DOM — this exactly mirrors what a real browser does when it loads the page, and does not touch product/runtime code or weaken any assertion. Business Brain, Brand Brain, all six engines, generation/refinement request shapes, Save/History, workspace import/export, Visual Studio, Product Library, background isolation, exact-product compositing, and Change Background were all re-verified passing under this fix with no other changes.

## K. Existing QA suite result

**14 of 14 scripts pass, zero failures**, run directly against the modified branch (not a copy):

```
scripts/qa.mjs                                  PASS (exit 0)
scripts/qa-v05.mjs                              PASS (exit 0)
scripts/qa-v06.mjs                              PASS (exit 0)   [see J: one test-harness fix applied]
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

## L. New implementation QA result

Run against the real served runtime (static file server + Playwright/Chromium, real `index.html`/CSS/fonts/brand assets — not a mock). **14 of 14 focused checks pass:**

1. PASS — Business Brain screen shows via `brainScreen()`
2. PASS — mixed Arabic/English/numerals render correctly in generated output
3. PASS — no horizontal overflow at 375px
4. PASS — no horizontal overflow at 768px
5. PASS — locked font faces (`IBM Plex Sans Arabic`, `IBM Plex Sans`) registered and `loaded`
6. PASS — `body` font-family uses the locked stack, no unintended fallback font
7. PASS — `h1` font-size matches the locked Display token (40px)
8. PASS — no visible text below the locked 11px floor anywhere on Home
9. PASS — top-nav buttons meet the 40px interactive-target height
10. PASS — `:focus-visible` outline applies (locked focus token)
11. PASS — no gradients present outside the pre-existing loading-skeleton shimmer
12. PASS — document `dir="rtl"` preserved
13. PASS — logo recolors correctly between dark (`#F5F7F7`) and light (`#101214`) mode
14. PASS — engine screen opens with the correct field set (behavioral non-regression smoke)

Live `/api/generate` and `/api/visual` calls require a provisioned `OPENAI_API_KEY`, which this environment does not have; the "Engine/Generated Result" and typography-detail screenshots instead exercise the identical `renderResult()`/`md()` rendering pipeline that a real API response feeds into, by calling it directly with representative Arabic/English/number/currency content. This is disclosed here rather than presented as a live-generation screenshot.

## M. Founder-review screenshot paths

Captured to `/tmp/claude-0/-home-user-shaghil/37617476-08a9-524a-a715-a5010d41ee18/scratchpad/shots/` in this session (real runtime, Chromium, 1440px unless noted):

1. `01-home-engines-light.png` — Home/Engines, light mode
2. `02-home-engines-dark.png` — Home/Engines, dark mode
3. `03-business-brain.png` — Business Brain
4. `04-brand-brain.png` — Brand Brain section (Setup screen)
5. `05-engine-generated-result.png` — Engine/Generated Result (mixed Arabic/English/SAR/numerals)
6. `06-visual-studio-dark.png` — Visual Studio, dark mode
7. `07-history.png` — History
8. `08-mobile-375.png` — Mobile, 375px (full page)
9. `09-typography-mixed-detail.png` — Typography / mixed Arabic-English detail, light mode
10. `10-component-states.png` — Component states (engine form + focused input)
   - `08b-tablet-768.png` — additional 768px overflow check (not in the required list, included for completeness)

These are screenshots of the real, served runtime — not design-system boards or mockups.

## N. Known issues

- None found that are functional regressions. One deliberate, disclosed judgment call: the pre-existing loading-skeleton shimmer uses a `linear-gradient` between token-based surface colors; this is a standard loading-state technique (not a decorative/AI color effect) and was kept, now using tokens instead of hardcoded hex, but is flagged here for explicit Founder awareness given the "no gradients" rule's intent was decorative effects.
- Live generation (`/api/generate`, `/api/visual`) could not be exercised end-to-end in this environment because no `OPENAI_API_KEY` is provisioned here; the generation-dependent screenshots use the app's real rendering pipeline fed with representative sample content instead (see section L).

## O. Deferred to screen-level implementation

- Any redesign of navigation, information architecture, or screen layout beyond foundation-level responsive fixes.
- Per-element `lang="en"`/`lang="ar"` tagging of individual inline runs (not required — the unicode-range font-matching technique already resolves per-character correctly without it).
- Any icon system replacement beyond the favicon/app-icon/logo assets (the six engine cards still use emoji icons, unchanged, per "do not scatter... unnecessary" and "do not redesign navigation" scope limits).
- Full design review of the loading-skeleton shimmer technique noted in section N, pending Founder guidance.
- Dialog/modal-specific styling (the runtime currently has no dialog/modal elements to skin).

## P. Commit SHA

See final report message (commit created immediately after this document in the same phase).

## Q. Remote = local

Verified after push (see final report).

## R. Protected branches untouched

Re-verified immediately before writing this document by fetching each protected branch from `origin` and confirming its SHA is unchanged from the Phase 0 baseline: `main` (`4f7c3ec`), `shaghil-v0.9` (`d8d70fc`), `shaghil-product-closure` (`1b2b3f5`), `shaghil-brand-final` (`4ed4cae`), `shaghil-design-system` (`6df58d2`) — all match exactly. No protected branch was checked out, modified, or merged.

## S. Founder review instruction

**This phase is implemented, not locked.** Do not treat Phase 1 as final or begin Phase 2 (screen-level implementation) until the Founder has reviewed the screenshots in section M and the known issues in section N, and explicitly approves. Flagged for explicit attention: the loading-skeleton gradient (section N) and the removal of the redundant `<b>شغّل</b>` text label beside the logo (section G) — both are judgment calls made to fulfil the letter of the Founder's instructions and should be confirmed rather than assumed correct.
