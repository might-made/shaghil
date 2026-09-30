# SHAGHIL — Phase 3 Lock

**Status:** FOUNDER APPROVED — PHASE 3 LOCKED
**Date:** 2026-09-27

## 1. Founder-approved runtime SHA

```
dac09fa41ca182548fdfedaf731ae0c267bdcd15
```

This exact commit, on `shaghil-product-implementation`, is the **immutable Founder-approved Phase 3 runtime baseline**. This lock is documentation-only; it adds no runtime diff against that SHA.

## 2. Complete approved Phase 3 scope

- Arabic-first user-facing terminology refinement: هوية النشاط، هوية العلامة، استوديو التصميم، مكتبة المنتجات، السجل، and the full supporting terminology system (دعوة لاتخاذ إجراء، ريل، إبراز المنتج، and natural-Arabic extensions for visual modes, format labels, engine-card copy, refine/variant buttons, and demo data).
- Arabic display terminology decoupled from internal tokens/contracts: `#visualMode`/`#variationMode`/`#channel` keep their original English `value=` tokens (unchanged API/whitelist/prompt contract) while showing Arabic labels; a `modeLabel()` lookup translates stored mode values wherever they're displayed (result meta, History, campaign packs).
- Retained international/platform terms: MIGHT MADE, WhatsApp, Instagram, TikTok, SMS, PNG/JPEG/WebP, ZIP, API, aspect ratios (1:1/4:5/9:16), SAR, V0.9.
- Six existing engine names and behavior unchanged: سوّ محتوى، اكتب لي، ابنِ عرض، رد على عميل، سوّ حملة، اكتب ريل.
- Product Library → Visual Studio direct-entry flow (`useProduct()`, additive sibling to `choose()`).
- Exact product image/name/description/fidelity transfer on that entry path, with no invented copy.
- Product-origin History labeling (`entry:'product'` marker → "مكتبة المنتجات" instead of "سوّ محتوى").
- Product-origin back-navigation (`back()` returns to `مكتبة المنتجات` for `entry:'product'` sessions; origin-aware back-button labels).
- Origin-aware Generated Result navigation (back-button label and destination correct for both product-origin and text/campaign/offer-origin sessions).
- Campaign-pack origin handling (pack entry list shows the correct Arabic mode label via `modeLabel()`; blocked-state message names the concrete corrective action).
- Desktop/mobile responsive behavior verified at 1440px and 375px across Home, هوية النشاط, هوية العلامة, مكتبة المنتجات, استوديو التصميم, and Generated Result.
- Generated Result header/navigation positioning correction: the sticky global header no longer visually overlaps the generated image.
- Scroll reset on Generated Result entry (`display()` calls `scrollTo(0,0)` on every path into that screen), the root-cause fix for the above.
- All previously approved Phase 1 and Phase 2 behavior preserved unchanged (Business Brain/Brand Brain, six engines, Visual Studio core, Product Library storage schema, History, workspace export/import, background isolation, exact-fidelity compositing, Change Background, locked design system/typography/logo).

## 3. Phase 3 implementation summary

Commit `00810ee`. Batch 1: P1-01 (generic "اصنع التصميم" CTA suppressed only when ≥2 per-idea cards render; single-result CTA behavior untouched) and P2-03 (campaign-pack blocked-state message rewritten to name the concrete corrective action; blocking logic unchanged). Batch 2 (Option D): additive `useProduct()` sibling function opens Visual Studio directly from a saved Product Library item, seeded only from the product's name/description (no invented copy), reusing the existing `selectProduct()`/`selectIdea()`/`autoCopy()` mechanisms unchanged; a "استخدم في Visual Studio" action was added per product card; a small, visually secondary Home discoverability hint was added with no new navigation destination or seventh engine. Batch 3 deferred per Founder instruction. Full detail: `SHAGHIL_IMPLEMENTATION_PHASE3.md`.

## 4. Founder Refinement 01 summary

Commit `e16bfd8`. Complete Arabic-first terminology pass across all user-facing copy in `index.html` and `lib/*.mjs`, applying the Founder's terminology system plus natural-Arabic extensions, while keeping brand/technical terms and the six engine names unchanged, and leaving server-side AI prompts in `api/*.mjs` untouched (never user-facing). Corrected the two known Phase 3 product-origin trade-offs: History no longer mislabels product-seeded designs as "سوّ محتوى" (`entry:'product'` marker, never sent to `/api/visual`), and back-navigation from a product-seeded Visual Studio/result session now returns to مكتبة المنتجات instead of an unrelated content-result state. Full detail: `SHAGHIL_IMPLEMENTATION_PHASE3_REFINEMENT01.md`.

## 5. Founder Refinement 02 summary

Commit `dac09fa`. Root-caused and fixed the Generated Result header-overlap issue found in Refinement 01's screenshots: the sticky header itself was always correct; the defect was a leftover scroll offset carried from the long Visual Studio screen into the much shorter Generated Result screen. One line (`scrollTo(0,0)` in `display()`, the single function every path into that screen already funnels through) resolves it. No other file, screen, or behavior was touched. Full detail: `SHAGHIL_IMPLEMENTATION_PHASE3_REFINEMENT02.md`.

## 6. Final QA results (re-verified at lock time, at `dac09fa`, with zero runtime changes)

- **A. Persisted regression suite: 14/14 PASS.**
- **B. Founder Refinement 01 focused QA: 31/31 PASS.**
- **C. Founder Refinement 02 focused QA: 14/14 PASS.**

All three suites were re-run against the exact locked SHA before this document was written; no test, assertion, or runtime file was modified to produce these results.

## 7. Screenshots reviewed

Founder-reviewed and approved across all three submissions:
- Phase 3 (10 screenshots): multi-idea CTA fix, single-result CTA preserved, campaign-pack blocked message, Product Library with a real product, Product Library → Visual Studio action, product-seeded Visual Studio entry, preserved product image, generated visual, Home hint desktop/mobile.
- Founder Refinement 01 (12 screenshots): Home desktop/mobile, هوية النشاط, هوية العلامة, مكتبة المنتجات, the "استخدم في استوديو التصميم" action, product-seeded Visual Studio entry and controls, Generated Result, product-origin History label, product-origin back-navigation destination, a representative engine screen.
- Founder Refinement 02 (3 screenshots): Generated Result desktop full page, mobile 375px full page, desktop result-area focus — all confirming the header sits at the top with the generated image fully visible and unobstructed.

## 8. Runtime files changed during Phase 3 (cumulative, `26c2a5b` → `dac09fa`)

- `index.html`
- `lib/visual-studio.mjs`
- `lib/campaign-packs.mjs`
- `lib/product-library.mjs`
- `lib/campaign-export.mjs`
- `lib/workspace-transfer.mjs`
- `lib/visual-storage.mjs`
- `scripts/qa-v06.mjs`, `scripts/qa-v07-upload-ux.mjs`, `scripts/qa-v08-history-nav.mjs` (disclosed test updates for intentionally-changed behavior/copy only — no assertion was weakened)

No changes to `api/*.mjs` at any point in Phase 3.

## 9. Compatibility confirmation

Business Brain/Brand Brain data model, the six-engine architecture, Visual Studio's core generation/variant/overlay pipeline, Product Library storage schema, History storage, campaign-pack storage, and workspace export/import are all unchanged end-to-end from their Phase 2-locked state. Every regression script written during Phase 1/Phase 2 to lock in that behavior still passes unmodified against the Phase 3 baseline.

## 10. API/schema compatibility

`api/generate.mjs` and `api/visual.mjs` were not modified at any point during Phase 3 — no request/response shape, whitelist, or validation rule changed. `settings.mode` and `inputs.channel` remain the original English tokens on the wire and in storage; only their **display** labels changed (via `value=` attribute decoupling and the new `modeLabel()` lookup), which is purely client-side rendering with no schema or persistence impact. The `entry:'product'` marker used for History labeling and back-navigation lives on the client-side `source`/`record` object only and is never included in the `/api/visual` request payload (`payload()` explicitly builds the request body from a fixed field list that excludes it).

## 11. Protected branches confirmation

Verified untouched immediately before this lock, matching their long-established baseline SHAs:

| Branch | SHA |
|---|---|
| `main` | `4f7c3ecc0389f8dd745f5015b7c95b3d5570975b` |
| `shaghil-v0.9` | `d8d70fc692378633b5c1afde19920b83f0d081af` |
| `shaghil-product-closure` | `1b2b3f5d53c388db9dfb0f030b7b250bddbaac55` |
| `shaghil-brand-final` | `4ed4cae13707498f3cd4e5c43de7f95b4bbce386` |
| `shaghil-design-system` | `6df58d2c17679b4e63e76b9e55983b54db1b4944` |

## 12. Deferred / non-blocking items

Confirmed not reopened during Phase 3 or any refinement pass: P2-04 (terminology architecture beyond this pass), P2-05 (external CDN architecture), P2-07 (mobile scroll-depth), P2-08 (duplicate workspace-import review), P3-09, P3-10, P3-11. No authentication, cloud backend, billing, teams, dashboards, new engines, or new navigation architecture were added at any point in Phase 3.

Known, disclosed, non-blocking notes carried forward from earlier Phase 3 documents:
- The `engine:'content'` tag on product-seeded tasks remains a client-side-only trade-off (display corrected via the `entry` marker; the underlying tag is unchanged since `api/visual.mjs`'s allow-list was not touched).
- Background isolation via `@imgly/background-removal` (esm.sh) remains **NOT VERIFIED IN THIS ENVIRONMENT** — this sandbox's own egress policy blocks `esm.sh` outright; unrelated to any Phase 3 change.

## 13. Lock rules

This is a **documentation-only lock**. No runtime/product code, CSS, JavaScript, `lib/`, `api/`, test harness, prompts, schemas, persistence, navigation, generation behavior, design system, terminology, Product Library behavior, History behavior, campaign packs, or export/import were modified to produce this document. No redesign, refactor, feature addition, deferred-item reopening, merge to `main`, or protected-branch modification occurred.

## 14. Exact future resume point

Any future phase resumes from this exact, immutable baseline:

```
dac09fa41ca182548fdfedaf731ae0c267bdcd15
```

on branch `shaghil-product-implementation`. No phase beyond Phase 3 has been authorized. This document does not itself authorize any further work.
