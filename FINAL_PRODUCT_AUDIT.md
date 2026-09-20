# SHAGHIL — Final Product Audit (Pre-Pilot Release Closure)

Branch: `shaghil-final-audit`, created from frozen `shaghil-v0.9` at `d8d70fc692378633b5c1afde19920b83f0d081af` (product-code baseline `08253a8d14976ca7639fac54aa1c4d69312cb713`). Documentation-only; no runtime/product code was inspected-and-changed — only inspected.

This audit inspects the complete current application as a real Saudi SME user would experience it, area by area, and classifies every genuine finding. It does not reopen the background-removal/exact-product defect (Founder-validated, RESOLVED) and does not treat the recorded scene-realism enhancement as a blocker, per explicit instruction.

---

## A. First-run / onboarding

Welcome → `#setup` (dismissible local-data notice → workspace import → 3 required fields + quick-start → optional details → optional Brand Brain → optional Product Library → full save) → Home (first-value hint, once) → engine.

- A first-time user can understand what SHAGHIL is (one-line pitch: "مشروعك. لكن أسرع." + "جهّز بيانات مشروعك مرة واحدة... وشغّل ست أدوات"), what's required (3 fields, clearly separated and labeled from optional enrichment), and reaches first value quickly (`saveBrain()` → Home in one click after 3 fields).
- No dead/redundant steps found: the 3 required fields are never duplicated elsewhere in the form; returning to `setup()` later to add Brand Brain/Product Library correctly re-populates already-saved fields.
- The local-data notice and first-value hint each show once and never repeat once dismissed (`localStorage['localDataNoticeDismissed']`/`['firstValueHintDismissed']`) — confirmed in code and by existing regression tests.
- Mobile: Founder has already live-tested first-run on iPhone successfully; no code-level mobile blocker found (existing `@media(max-width:700px)` rules cover `#setup`'s `.form`/`.brandSection` layout unchanged since V0.8).

No P0/P1 findings in this area. See P2 for minor terminology polish.

## B. Business Brain

Required: `name`/`product`/`customer` (validated client-side in `saveBrain()`/`run()` and server-side in `normalizeRequest()`). Optional: `category`/`location`/`price`/`tone`/`objective`. Persistence: `localStorage['brain']`, one object, no history/versioning (by design). Editing: "تعديل" re-opens `setup()` with all 8 fields pre-filled. Imported workspaces: `importWorkspace()` writes `brain` only if none exists yet or the user confirms overwrite — no silent data loss. Empty state: no Business Brain → `welcome` screen, not a blank form. Mobile: `.brain` grid collapses to one column under 700px.

No P0/P1 findings. Terminology ("Business Brain" left in English inside an Arabic UI) is P2, carried from the V0.9 audit (deferred there as low-priority/higher-risk-than-benefit).

## C. Brand Brain

Logo + up to 2 references (`normalizeAsset()` resizes/compresses to ≤700KB), primary/secondary/accent colors, free-text style direction. Persistence via IndexedDB `brand` store (`saveBrand`/`loadBrand`). Usefulness to generation: every field is genuinely used — colors and style feed `makePrompt()`'s `BRAND BRAIN` block and `composeVisual()`'s panel/accent-bar colors; logo and references are sent to `/api/visual` (logo composited locally only, references forwarded to the model only when not in EXACT product mode). No control found that "appears implemented but has no downstream effect" — every Brand Brain field is traceable to a real generation or compositing use.

No P0/P1/P2 findings in this area beyond the shared terminology item already noted in B.

## D. Product Library

Add/edit/remove up to 12 named products with an original image, optional description, and fidelity mode. Persistence via IndexedDB `products` store; each product card is rendered in its own try/catch so one unreadable record can't hide the rest of the library (V0.7 fix, unchanged). Imported products round-trip byte-for-byte (V0.8 workspace-transfer coverage). Background isolation (EXACT mode): Founder has live-validated this on the real Vercel Preview against two real, unprocessed Najoob products (Wash Me, النفسية محتاجه بحر) — **this audit found no new concrete regression and does not reopen that resolved defect.** Transparent PNG/WebP products pass through unchanged (detected via real alpha channel, not color); opaque products are isolated. Empty state present ("أضف أول منتج..."). Mobile: form collapses to one column; Founder has already live-tested this on iPhone.

One real, new observation (not a reopening of the resolved defect, but an operational property of the fix itself): Product Library images are stored at their original uploaded size (capped at 8MB, no resizing), unlike Brand Brain assets which are normalized to ≤700KB. See N for the resulting Workspace Export size risk (P2).

## E. Six existing engines

All six share one consistent pattern: task-specific optional/required fields (validated identically client- and server-side), the same shared grounding `BASE` prompt (no invented facts, gender-neutral by default, business/customer data treated as data not instructions), the same four refinement actions, the same explicit Save/History/new-task/error/loading UX.

| Engine | Required input | Optional input | Notes |
|---|---|---|---|
| سوّ محتوى | period (select, defaulted) | — | |
| اكتب لي | — | channel (defaulted), instruction | |
| ابنِ عرض | — | constraint | |
| رد على عميل | message (required, client+server validated) | — | one extra grounding sentence: acknowledge a missing product detail rather than invent one |
| سوّ حملة | duration (defaulted) | occasion | previously the one engine with a live timeout defect; fixed in V0.7 (client timeout under function `maxDuration`), unchanged since |
| اكتب Reel | duration (select, defaulted) | topic | produces a text script only — no video/cover-image output (expected; see Future Product in F) |

No engine-specific inconsistency found in required/optional handling, Arabic quality, or error/loading states. None of the six text engines reference Product Library (only Visual Studio does) — this is existing, unchanged-since-V0.5 scope, not a regression; recorded under Future Product, not a finding.

## F. Visual Studio

**Reachable entry points:** only from a **سوّ محتوى / سوّ حملة / ابنِ عرض** result, via the "اصنع التصميم" button in `#visualEntry` (gated by `resultEntry()`/`choose()`'s `['content','campaign','offer'].includes(current)` check in `lib/visual-studio.mjs`). **Not reachable** from اكتب لي / رد على عميل / اكتب Reel results — this was already investigated in a prior Founder QA round, confirmed unchanged since V0.8 (not a V0.9 regression), and left as an open decision. Carried forward here as P2 (see below), not re-litigated as new.

**WORKS TODAY (confirmed in code and covered by regression tests):** idea selection (auto-split or user text selection); Product Library selection; EXACT mode (real photo, background isolated, original pixels never sent to the generation model); creative mode (reference forwarded to the model); 3 aspect ratios; 8 visual styles; text/no-text/simple/full controls; product size/position/vertical/logo controls; first generation with a live elapsed-time status and visible spinner (`.visualSpin`, V0.9); background isolation on both first generation and `تغيير الخلفية` (same `composeVisual()` call, Founder-validated); local overlay edits (no new generation cost); save to Visual History (IndexedDB, capped at 10 most recent); reopen from History (zero regeneration); download (`Visual.download()`, real anchor-click download, implemented and working); error/fallback behavior (isolation failure falls back to the original image with a warning rather than crashing; generation failure returns a controlled 502 message with no silent retry).

**PARTIAL:** none found beyond the already-recorded, non-blocking scene-realism limitation.

**DOES NOT EXIST:** video/motion output (Reel engine produces text only); one-click "generate this whole campaign's visuals" automation — each image remains one manual, one-request action. Both are pre-existing, unchanged scope — Future Product, not findings.

Per instruction, the scene-realism/contact-shadow/lighting/perspective observation is recorded strictly as **FUTURE ENHANCEMENT — NON-BLOCKING** (already Founder-recorded in `V0.9.md`) and is not reclassified here.

## G. History / reuse

Text history, Visual history, and Campaign Packs all live on one `#history` screen under three separate `<h3>` sub-sections. Reopen-without-regeneration confirmed for both text (`openHistory()`) and visuals (`display()`/`Visual.openSaved()`) — zero network calls, tested. Delete is confirmation-guarded for all three types. Project/type/time labels render correctly, including for legacy/imported entries with a schema-drifted or missing `engine` field (V0.8 fix: `getHistory()`'s relaxed filter, unchanged since). Empty states present for all three sections. Mobile: `.historyItem`/`.card` layout already responsive.

The three-sections-on-one-screen organization is a real (if minor) findability trade-off, not a defect — recorded as P2.

## H. Workspace / data portability

Local-only model is clearly communicated (V0.9's local-data notice, plus existing non-technical explanatory copy on both the `#setup` and `#brain` screens — neither uses "IndexedDB"/"localStorage"). Export bundles Business Brain, Brand Brain, Product Library (with original images), History, saved Visuals, and Campaign Packs into one JSON file (`buildBundle()` in `lib/workspace-transfer.mjs`); Import reverses this, de-duplicates history, and is idempotent on re-import (V0.8 coverage, `scripts/qa-v08-workspace-transfer.mjs`). Founder has live-validated the real cross-device journey (Desktop → export → iPhone → import) for Business Brain, Product Library, original product images, History, and Reopen. Visual/Campaign Pack transfer is code-complete and covered by automated QA but was not explicitly named in the Founder's live cross-device confirmation — noted as an open confirmation item, not a known defect. Failure handling: invalid/corrupt import file is caught with a clear Arabic error message; a Business Brain that already exists is only overwritten after an explicit confirm.

One real, new observation: **the exported JSON file's sensitivity is never communicated to the user.** It contains the full Business Brain (name, customer profile, pricing, objective), every saved History entry's text — including, for `رد على عميل` results, the real customer message the Founder pasted in as input — and raw product/brand images, all as plain unencrypted JSON. The Export button/copy currently only says "نسخة كاملة" (a complete copy) with no note that it should be stored/shared carefully. See M/P1.

## I. Campaign packs / output packaging

**WORKS TODAY:** creation (approve a generated visual into a pack, `Packs.add()`), save (IndexedDB `packs` store, capped 6 packs/12 entries), History listing, downloadable ZIP package (`exportPack()`/`zipFiles()` — a real, dependency-free ZIP writer, independently CRC-verified against Python's standard `zipfile` reader in `scripts/qa-v07.mjs`), manifest.json included per pack. Empty state present ("لا توجد حزم حملات محفوظة بعد."). Failure states (cap reached, missing caption/name) are validated with clear Arabic messages.

**PARTIAL/DOES NOT EXIST:** none found — this capability is complete for what it claims to do (assemble and export already-approved creative, not auto-generate a full campaign's assets).

## J. Responsive / mobile UX

Founder has already live-tested the application successfully on iPhone (first-run, workspace import, Visual Studio, background isolation, campaign background changes). Code-level inspection found: `@media(max-width:700px)` rules collapse `.grid`/`.form`/`.brain` to one column, shrink nav buttons/card padding, cap `.visualPreview`/`.assetThumb` sizes — applied consistently across Business Brain, Product Library, Visual Studio controls, result actions, and History; no screen was found missing these rules. No horizontal-overflow-prone fixed-width elements were found in the CSS. File upload inputs are native `<input type=file>` (no custom widget to break on mobile). No P0/P1 finding here — this area is validated by both code inspection and Founder's own live device test.

## K. UI / UX consistency

Navigation is consistent (three persistent top-nav actions on every screen); button hierarchy (`.btn`/`.btn.primary`) is applied consistently; status/error messaging is uniformly Arabic and uniformly rendered via `role="status"` elements (which carry an implicit `aria-live="polite"`, so screen readers already announce updates — a real, if incidental, accessibility strength). No dead controls or misleading labels were found — every button's `onclick` resolves to a real, implemented handler. Two real, minor consistency items are recorded as P2 below (bilingual "Business Brain"/"Brand Brain" headings; History/Visual/Packs sharing one screen). No brand redesign was considered or proposed, per instruction.

## L. Error / edge states

Already comprehensively hardened by prior QA rounds: API timeout (client timeout kept under each function's `maxDuration`, controlled JSON error), malformed/non-JSON response (V0.7 fix), empty model response (explicit check, controlled 500), missing Business Brain info (validated client + server), missing product in Visual Studio (handled as "بدون منتج محدد"), image isolation failure (falls back safely with a warning, does not crash), image-generation failure (controlled 502, no silent retry), storage failure (every `saveBrand`/`saveProduct`/`saveVisual`/`savePack`/`localStorage.setItem` call is wrapped with a fallback message), invalid import file (caught, clear message), duplicate import (idempotent), network failure (generic catch → controlled message), repeated clicks/double generation (guarded by `busy`/`visualBusy`/`uploadBusy`/`brandBusy`/`working` flags throughout, tested), deletion (confirmation-guarded everywhere). No new P0/P1 gap found in this area.

## M. Security / privacy / pilot safety

`OPENAI_API_KEY` never reaches client code (structurally verified; asserted by multiple existing tests across every relevant file). No authentication exists — acceptable for a Founder-issued-link, personally-onboarded 3–5 user pilot, not beyond it (unchanged conclusion since the V0.9 Product Readiness Audit; `DEPLOY.md` already documents this as a known pre-production gap). Prompt-injection boundary: the shared `BASE` prompt explicitly instructs the model to treat Business Brain values, customer messages, and previous output as data, never as instructions — a real, deliberate mitigation, unchanged and working. No secrets or credentials are written to any exported file or client-visible storage.

**New finding (P1):** Workspace Export files (see H) contain real business and potentially customer-identifying data (pasted WhatsApp customer messages saved into History) in plain, unencrypted JSON, with no warning to the user about safe handling/storage/sharing of that file. For a controlled pilot this is a real, concrete trust/privacy gap — not a request for enterprise architecture (encryption, access control), just for the product to say so.

## N. Performance / cost risks

Duplicate/accidental paid calls are already guarded everywhere generation is possible (see L). No unnecessary/automatic API calls exist — every request is a direct result of an explicit user click. Local storage growth is bounded (12 products / 10 visuals / 6 packs·12 entries / 30 history entries, all enforced in `lib/visual-storage.mjs` and `index.html`'s `saveResult()`). Image-generation waits are already surfaced with a live elapsed-time status and spinner (V0.9).

**New finding (P2, not P1):** the background-isolation fix depends on a third-party CDN (`esm.sh`) to lazily load a segmentation model (`lib/background-removal.mjs`) the first time EXACT-mode compositing runs in a session. This is a real new runtime dependency the product didn't have before V0.9. If that CDN is unreachable (corporate network, ad-blocker, regional block, outage), isolation fails and compositing falls back to the pre-fix raw-rectangle behavior with a status-line warning — graceful, not a crash, and Founder's own live Preview test already succeeded end-to-end on this exact path. Given the existing generic "راجع النتيجة قبل النشر" (review before publishing) warning already present in Visual Studio, and that this has not actually failed in live testing, this is recorded as a monitoring item for the pilot rather than a required pre-pilot code change.

**New finding (P2):** Product Library images are stored at their original, unresized upload size (capped at 8MB, unlike Brand Brain assets which are compressed to ≤700KB) — see D/H. A merchant with several full-resolution product photos could produce a large Workspace Export file, risking slower cross-device transfer. Not yet observed to fail (Founder's own live cross-device test succeeded); recorded as a monitoring item.

## O. Dead / legacy / contradictory code

- `lib/background-removal.mjs` exports a test-only `__setLoaderForTests` hook into the production module — harmless (no production caller references it), but it is test seam code shipped in the production bundle. P2, trivial cleanup.
- `DEPLOY.md` is stale: it is still framed around V0.4–V0.6-era QA gates and lists a "Not yet production-complete" section that predates several since-shipped mitigations (e.g. it doesn't mention Workspace Export/Import, which is the shipped answer to the cross-device continuity gap it implicitly still flags as open). No user-facing impact; a real risk of misleading a future engineering session that reads only this file. P2, doc hygiene.
- No unreachable UI, no duplicated logic, and no comment/doc contradicting actual runtime behavior was found beyond the `DEPLOY.md` staleness above. Every `onclick` handler resolves to a real, implemented function; every documented capability in `V0.7.md`/`V0.8.md`/`V0.9.md` matches current code.

---

## Phase 3 — Classification summary

**P0 — BLOCKER: none found.** Every area audited is either already hardened by a prior Founder QA round with regression coverage, or has no concrete functional failure — only the two P1s and several P2s below.

**P1 — MUST FIX BEFORE RELEASE CANDIDATE (1 finding):**
1. **Workspace Export files are not flagged as sensitive.** The exported JSON (Business Brain, History — including any pasted customer WhatsApp messages, product/brand images) has no warning about safe storage/sharing. Smallest fix: one added sentence to the Export UI copy in `index.html`/`lib/workspace-transfer.mjs`'s status text — no architecture change, no encryption, no new dependency.

**P2 — POST-PILOT / NICE TO HAVE (7 findings):**
1. Visual Studio unreachable from اكتب لي / رد على عميل / اكتب Reel results (content/campaign/offer only) — known, previously investigated, decision left open.
2. History screen combines text results, visual designs, and campaign packs in one screen (three sub-sections).
3. "Business Brain"/"Brand Brain" headings remain bilingual — already deferred once in V0.9 as low-priority.
4. Background-isolation's third-party CDN dependency — graceful degradation, already-present generic warning, recommend pilot-time monitoring rather than a pre-pilot code change.
5. Product Library images aren't size-normalized like Brand Brain assets, risking larger Workspace Export files for some merchants — not yet observed to fail.
6. `__setLoaderForTests` test seam exported from the production `lib/background-removal.mjs`.
7. `DEPLOY.md` is stale relative to shipped V0.7–V0.9 mitigations.

**FUTURE PRODUCT (not part of closure):**
- Product Library grounding for the six text engines (currently Visual-Studio-only).
- Video/Reel visual generation.
- One-click full-campaign visual automation.
- Salla/Zid or any store/catalog integration.
- Multi-business/agency workspace switching without full export/import.
- Real accounts / server-side multi-device sync.
- Scene-realism enhancement (contact shadow/scene-aware lighting/perspective/grounding) — already Founder-recorded in `V0.9.md` as FUTURE ENHANCEMENT — NON-BLOCKING; not reclassified here.

## Phase 4 — Release gap

1. **Is the current frozen product already usable for a controlled 3–5 user pilot? → YES, WITH CONDITIONS.** The single condition is the P1 export-sensitivity copy fix.
2. **Counts:** P0 = 0, P1 = 1, P2 = 7.
3. **Smallest exact fix-set required before Product Closure:** the one P1 — add a clear, plain-Arabic sensitivity note to the Workspace Export UI/copy. No other code change is required for closure.
4. **Explicitly NOT worked on now:** every P2 item above, and every Future Product item above — none block a controlled 3–5 user pilot.
5. **After that one fix passes Founder QA, can we move directly to Branding → Public Website → Domain → Final Release QA → Controlled Pilot? → YES.** No other product-code work is required before those workstreams begin.

---

**Deliverable status:** documentation only. No runtime or product code was modified during this audit — only inspected. This document itself is the only file added.
