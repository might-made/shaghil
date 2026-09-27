# SHAGHIL — Phase 3, Founder Refinement 01

Status: **PHASE 3 — FOUNDER REFINEMENT 01 COMPLETE — REVIEW REQUIRED** (Phase 3 remains not locked).
Base commit: `00810ee` (SHAGHIL Phase 3 Batch 1+2, on `shaghil-product-implementation`).
Scope: a complete Arabic-first terminology pass across all user-facing copy, plus the two Phase 3 product-origin corrections (History mislabeling and back-navigation destination). No new engines, navigation destinations, or architecture were introduced.

## 1. Terminology mapping (Founder-approved system + natural-Arabic extensions)

### 1.1 Founder-specified terms (applied verbatim)

| English/mixed | Arabic |
|---|---|
| Business Brain | هوية النشاط |
| Brand Brain | هوية العلامة |
| Visual Studio | استوديو التصميم |
| Product Library | مكتبة المنتجات *(already correct pre-refinement)* |
| History | السجل *(already correct pre-refinement)* |
| CTA | دعوة لاتخاذ إجراء |
| Stronger CTA / "CTA أقوى" | دعوة أقوى |
| Reel | ريل |
| Product Hero | إبراز المنتج |
| Instagram Post | منشور Instagram *(brand name kept in Latin per Part 2)* |
| SHAGHIL HOME | شغّل |
| Change Background | تغيير الخلفية *(already correct pre-refinement)* |
| Download / Save | تحميل / حفظ *(already correct pre-refinement)* |

### 1.2 Natural-Arabic extensions (same system, my translation where the Founder gave the principle but not every literal string)

| English/mixed | Arabic | Where |
|---|---|---|
| Demo (button) | جرّب مثالًا | Welcome screen |
| FUNCTIONAL MVP (eyebrow) | نسخة عملية جاهزة | Welcome screen |
| Engine (generic noun) | أداة | Home intro line |
| Caption | تعليق | "اكتب لي" engine card |
| Big Idea | فكرة رئيسية | "سوّ حملة" engine card |
| Hook + Scenes + VO + CTA | خطاف + مشاهد + تعليق صوتي + دعوة لاتخاذ إجراء | "اكتب ريل" engine card |
| Premium (refine button, "Premium أكثر") | مميز أكثر | Result refine bar / visual variant bar |
| Lifestyle (visual mode) | أسلوب حياة | #visualMode, #variationMode |
| Premium (visual mode) | مميز | #visualMode |
| Minimal (visual mode) | بسيط | #visualMode |
| Campaign (visual mode) | حملة | #visualMode |
| Performance Ad (visual mode) | إعلان أداء | #visualMode, #variationMode |
| Website (channel option) | الموقع الإلكتروني | "اكتب لي" channel select |
| Instagram Portrait / Story (format labels) | منشور Instagram العمودي / ستوري Instagram | #visualFormat, campaign-pack default label |
| "Save Product" (redundant bilingual half) | *(dropped — button is already Arabic-only)* | Product Library preview note |
| Preview (as in "each Preview link") | معاينة | Business Brain workspace-transfer note |
| Brew 27 (demo business name) | تحميص ٢٧ | `demo()` sample data |
| "CTA: " (exported campaign-pack .txt label) | دعوة لاتخاذ إجراء: | `campaign-export.mjs` |

Minimal Premium (بساطة فاخرة) and Editorial (أسلوب تحريري) were already correctly translated on `#variationMode`; `#visualMode` was brought into line with the same labels for consistency (see §1.3).

### 1.3 Consistency fix: `#visualMode` vs `#variationMode`

`#variationMode` (the "توليد جديد" quick-variant select) already showed Arabic labels for a subset of modes, but with different wording than the Founder's canonical terms (e.g. "المنتج بطل المشهد" instead of "إبراز المنتج", "إعلان مباشر" instead of "إعلان أداء"). `#visualMode` (the main style select) showed no Arabic at all — every option was bare English. Both selects now show the identical, Founder-approved Arabic label set. In both cases the underlying `value=` attribute was added/kept as the original English token (`Product Hero`, `Lifestyle`, `Premium`, `Minimal`, `Campaign`, `Performance Ad`, `Minimal Premium`, `Editorial`) — **zero change** to `settings.mode`, to `api/visual.mjs`'s `MODES` whitelist, or to the AI prompt string that embeds `task.settings.mode`. Only the visible label changed; the wire value and API contract are untouched.

The same principle was applied to the "اكتب لي" engine's `#channel` select (`Instagram`/`TikTok`/`WhatsApp`/`SMS`/`Website`): `value=` attributes were added so `api/generate.mjs`'s channel whitelist is unaffected, and only "Website"'s visible label was translated.

### 1.4 Raw stored-value display (`record.settings.mode`)

Two places render a *saved* record's `settings.mode` directly into a text node rather than reading it from a `<select>` — Visual Studio's result meta line (`#visualMeta`) and the Design History list (`#visualHistoryList`), plus the Campaign Packs entry list. Since `settings.mode` is stored as the English token (by design — see §1.3), these three sites previously showed raw English ("Product Hero", "Premium", …) with no way to fix it by relabeling a `<select>` alone. A small `modeLabel(mode)` lookup was added to `lib/visual-storage.mjs` (already imported by both `lib/visual-studio.mjs` and `lib/campaign-packs.mjs` as `store`) and is now used at all three display sites. It falls back to the raw value for any unrecognized mode, so it cannot hide or break display of older/unexpected data.

## 2. Terms intentionally retained (Part 2 exceptions)

Kept exactly as-is, unchanged: **MIGHT MADE**, **WhatsApp**, **Instagram**, **TikTok**, **SMS**, **PNG**, **JPEG**, **WebP**, **ZIP**, **API**, file extensions (`.jpg`, `.png`, `.json`, `.txt`), aspect ratios (`1:1`, `4:5`, `9:16`), the `SAR` currency code, and version strings (`V0.9`). The six engine names (سوّ محتوى، اكتب لي، ابنِ عرض، رد على عميل، سوّ حملة، اكتب ريل) were preserved unchanged as instructed — only "Reel" inside the sixth engine's own name/labels was corrected to "ريل" per the Founder's explicit terminology table, not renamed or restructured.

`api/generate.mjs` and `api/visual.mjs` — the server-side prompt strings sent to the AI model ("Business Brain is authoritative…", `MODES`, the channel whitelist) — were **not translated**. These strings are never rendered to a user; they are internal LLM instructions and a validation whitelist. Translating them would be pure risk (prompt-behavior drift, whitelist mismatch) for zero user-facing benefit, and Part 6 explicitly says not to alter API contracts unnecessarily.

Code comments (e.g. in `lib/workspace-transfer.mjs`, `lib/visual-studio.mjs`) that mention "Business Brain"/"Brand Brain"/"Visual Studio" in English were left untouched — they are developer-facing, never rendered, and out of scope for a user-facing language pass.

## 3. Files changed

- `index.html` — nav labels, welcome/setup/brain/brandBrain/productLibrary/home/engine/visualStudio copy, `#visualMode`/`#visualFormat`/`#variationMode`/`#channel` option labels, refine/variant button labels, `demo()` sample data, `titles` map, back-button `id`s added (`visualBackBtn`, `visualResultBackBtn`).
- `lib/visual-studio.mjs` — terminology in toasts/status text; `entry:'product'` marker on the product-seeded `source`/`record` (History-label + back-navigation fix, §4/§5); origin-aware `back()`; origin-aware back-button label updates in `choose()`, `useProduct()`, `display()`; `modeLabel()` used in `display()` and `history()`.
- `lib/campaign-packs.mjs` — default pack-label text translated; `modeLabel()` used in the pack entry list.
- `lib/campaign-export.mjs` — "CTA: " label in the exported `.txt` copy file translated.
- `lib/product-library.mjs` — button label and status-message terminology.
- `lib/workspace-transfer.mjs` — user-facing status/confirm-dialog terminology.
- `lib/visual-storage.mjs` — new `modeLabel()` export (display-only lookup; no schema/persistence change).
- `scripts/qa-v07-upload-ux.mjs`, `scripts/qa-v08-history-nav.mjs` — two disclosed test updates for intentionally-changed copy (see §6).

No changes to `api/*.mjs`, to any persistence schema, to Business Brain/Brand Brain/Product Library storage, or to the six-engine architecture.

## 4. Product-origin History solution (Part 6)

Root cause: `useProduct()` must tag its synthesized task `engine:'content'` because `api/visual.mjs`'s `normalizeVisual()` only accepts `content`/`campaign`/`offer`, and touching that API allow-list was out of scope. History previously looked up the display title purely from `task.engine`, so every product-seeded design showed as "سوّ محتوى".

Fix: `useProduct()` now also sets `entry:'product'` on the in-memory `source` object — a field that lives alongside `task`, never inside it, so it is **never sent to `/api/visual`** (`payload()` builds the request body from an explicit field list that does not include `entry`). This flag is copied automatically into the saved `record` wherever the existing code already spreads the full snapshot (`generate()`, `updateOverlay()`), and was additionally threaded through the one place that builds a fresh object instead of spreading (`variant()`, for background-change/recompose follow-ups), so it survives edits and variants of a product-seeded design. `history()` and `lib/campaign-packs.mjs`'s pack-entry list now check `record.entry==='product'` and show "مكتبة المنتجات" instead of the engine title in that case; every other record (content/copy/offer/whatsapp/campaign/reel-originated) is completely unaffected. No API contract change, no history schema migration, no change to how existing (pre-refinement) history records display.

## 5. Product-origin back-navigation solution (Part 7)

Same `entry:'product'` marker drives `back()`: when the active/source record's `entry==='product'`, `back()` now calls `productLibraryScreen()` instead of falling through to `renderResult(...)`. Every other origin (content/campaign/offer `choose()` results) is untouched — `back()`'s existing behavior for those is byte-identical to before. The back button's own label is also now origin-aware (`رجوع لمكتبة المنتجات` vs. the original `رجوع للمحتوى`) so the destination is announced before the click, on both the Visual Studio screen and the result screen — this required adding one `id` to each of those two pre-existing buttons; no new buttons, screens, or navigation destinations were added.

## 6. QA results

### 6.1 Baseline verification
Before making any change, `git status`/`git log` confirmed a clean tree at `00810ee` (the locked Phase 3 Batch 1+2 commit), matching `origin/shaghil-product-implementation`.

### 6.2 Full regression — 14/14 PASS
All 14 committed regression scripts (`scripts/qa.mjs`, `qa-v05.mjs`, `qa-v06.mjs`, `qa-v07.mjs`, `qa-v07-migration.mjs`, `qa-v07-product-persistence.mjs`, `qa-v07-upload-ux.mjs`, `qa-v08-history-nav.mjs`, `qa-v08-history-render.mjs`, `qa-v08-import-recovery-ui.mjs`, `qa-v08-workspace-transfer.mjs`, `qa-v09-background-isolation.mjs`, `qa-v09-pilot-readiness.mjs`, `qa-product-closure-export-warning.mjs`) pass. Two required, disclosed test updates for intentionally-changed copy (not weakened assertions):
- `scripts/qa-v07-upload-ux.mjs` — removed an assertion requiring the redundant English half of "حفظ المنتج / Save Product" (that half was deliberately dropped per §1.2); the Arabic assertion and the persistence assertions are untouched. The "must not still prompt to save on error" check was retargeted from the (now nonexistent) English phrase to the real Arabic phrase it was always meant to guard.
- `scripts/qa-v08-history-nav.mjs` — updated the expected 5-button nav-label array from `['الرئيسية','Business Brain','Brand Brain','مكتبة المنتجات','السجل']` to `['الرئيسية','هوية النشاط','هوية العلامة','مكتبة المنتجات','السجل']`.

### 6.3 Phase 1 / Phase 2 / Refinement 01 QA coverage note
The historical Phase 1, Phase 2, and Phase 2 Refinement 01 QA suites referenced in earlier reports were ad-hoc, real-runtime Playwright scripts written and run interactively in each of those sessions; they were not committed to the repository and are not present in this session (only the 14 scripts listed in §6.2 are persisted, reusable regression tests). Rather than claim to "re-run" scripts that no longer exist, this refinement's own comprehensive Playwright QA (§6.4) re-exercises the same functional surface those suites covered — Business Brain/Brand Brain save and reload, all six engines, Visual Studio generation, Product Library, History, workspace export/import, exact-fidelity compositing, and mobile responsiveness — under real interaction, and the 14 committed regression scripts (which were themselves written during those phases to lock in that behavior) all pass unchanged.

### 6.4 New focused Founder Refinement 01 QA — 31/31 PASS
A new real-runtime Playwright script (mocking only `/api/generate` and `/api/visual`, no `OPENAI_API_KEY` in this environment) covering all 25 Part 9 items, several split into sub-checks for precision:

1–5, 8. No stray "Business Brain"/"Brand Brain"/"Visual Studio"/"Product Library"/bare "History" anywhere across Home, هوية النشاط, هوية العلامة, مكتبة المنتجات, استوديو التصميم, an engine screen, and the generated-result screen; approved Arabic nav labels and screen headings render exactly as specified.
6. No "Premium" visible as a mode label in الأسلوب (`#visualMode` options confirmed all-Arabic).
7. No "CTA" visible as a user-facing label anywhere visited.
9. Six engine names unchanged (`سوّ محتوى، اكتب لي، ابنِ عرض، رد على عميل، سوّ حملة، اكتب ريل`).
10. "Built by MIGHT MADE" unchanged.
11–12. WhatsApp, Instagram, TikTok, SMS all unchanged (confirmed in the القناة select); Instagram confirmed still in Latin script inside the newly-Arabic المقاس format labels.
13. Product Library → Visual Studio still works (button present, click lands on استوديو التصميم).
14–16. Product image, name, and description transferred; exact-fidelity confirmed both in the UI (`#visualFidelity`) and on the actual network payload (no `image` key sent for an exact-fidelity product).
17. A product-originated design saved to السجل is labeled "مكتبة المنتجات", confirmed **not** to contain "سوّ محتوى".
18. Product-origin back navigation, checked from both the Visual Studio screen and the result screen, actually lands on مكتبة المنتجات (not a re-check of the button label alone).
19–20. Text-origin (`choose()`) and campaign-origin back behavior confirmed byte-identical to before (`رجوع للمحتوى`, lands on the content-result screen).
21–23. No horizontal overflow at 1440px or 375px on Home; no individual nav button's Arabic label is CSS-clipped/truncated on mobile (the nav's own horizontal-scroll strip, an existing `overflow-x:auto` mobile pattern, is intentional and was not mistaken for a defect).
24–25. Workspace export contains the saved product; Product Library survives a full page reload.

Full output and the 12 required screenshots below are in this session's scratch QA script; findings are summarized in this document per the Founder's instruction not to leave verification only in ephemeral logs.

## 7. Screenshots

Twelve real-runtime screenshots were captured (delivered to the Founder separately):
1. Home — desktop
2. Home — mobile 375px
3. هوية النشاط
4. هوية العلامة
5. مكتبة المنتجات (with a real, persisted product)
6. Product Library product card showing "استخدم في استوديو التصميم"
7. استوديو التصميم — product-seeded entry
8. استوديو التصميم — lower controls/composition area
9. Generated Result (product-seeded path)
10. مكتبة المنتجات as the product-origin back-navigation destination
11. السجل showing the product-origin visual correctly labeled "مكتبة المنتجات"
12. A representative engine screen ("اكتب لي")

## 8. Deferred items (confirmed not reopened)

P2-04 (terminology architecture beyond this pass), P2-05 (external CDN architecture), P2-07 (mobile scroll-depth), P2-08 (duplicate workspace-import review), P3-09, P3-10, P3-11 remain deferred, per both the Phase 3 and this refinement's instructions. No authentication, cloud backend, billing, teams, dashboards, new engines, new navigation architecture, or new features were added.

## 9. Known remaining issues

- The `engine:'content'` tag itself (the underlying Phase 3 trade-off) is unchanged and still required by the current `api/visual.mjs` allow-list; only its **display** is now corrected via the `entry` marker described in §4. If a future phase adds a real API-level product-origin engine value, the `entry` marker can be retired in favor of that, but there is no need to do so now.
- Background isolation via `@imgly/background-removal` (esm.sh) remains **NOT VERIFIED IN THIS ENVIRONMENT**, per this sandbox's own egress policy — unrelated to this refinement, unchanged from the Phase 3 report.
