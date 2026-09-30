# SHAGHIL — Product Closure / Release Readiness Audit

**Audit type:** Read-only. No runtime, product, CSS, JavaScript, `lib/`, `api/`, test harness, prompts, schema, persistence, navigation, generation behavior, design system, or documentation-other-than-this-file was modified to produce this report.

**Baseline audited:** `dac09fa41ca182548fdfedaf731ae0c267bdcd15` (Founder-approved, locked Phase 3 runtime — lock commit `7393df6d8b3d5329f65ec93a0bcc411be6c9b0ab`), on branch `shaghil-product-implementation`. HEAD was confirmed at the lock commit with a clean working tree before this audit began and remains so after it.

## 1. Method

All functional claims below were verified against the actual running application (served statically, real DOM/JS execution in real Chromium via Playwright), not inferred from documentation. Only the two OpenAI-backed endpoints (`/api/generate`, `/api/visual`) were mocked, since no `OPENAI_API_KEY` exists in this environment — every other behavior (storage, navigation, forms, compositing, ZIP export, workspace export/import) ran for real. Console errors and uncaught exceptions were captured throughout. A genuinely fresh browser context (zero `localStorage`/IndexedDB) was used for the clean-user journey; a separate set of contexts covered the broader functional/UX audit, campaign packs, workspace transfer, and the 375px mobile pass.

## 2. Persisted QA suite

`npm run qa` (which orchestrates all 14 persisted regression scripts in one command — `qa.mjs` itself plus imports/execs of `qa-v05` through `qa-product-closure-export-warning`) was run against the locked baseline with zero code changes.

**Result: 41/41 individual PASS assertions across all 14 scripts, 0 FAIL, exit code 0.**

No test assertion was modified to obtain this result — the suite was run exactly as committed.

## 3. Clean new-user journey (genuinely fresh state)

A brand-new browser context (verified `localStorage.length === 0` on first load) was walked through the exact 14-step journey requested:

| # | Step | Result |
|---|---|---|
| 1 | Open SHAGHIL | Welcome screen shown, storage confirmed empty |
| 2 | Create business identity | هوية النشاط form saves; lands on Home; `localStorage.brain` correctly populated |
| 3 | Optionally create brand identity | هوية العلامة screen opens; confirmed skippable (optional, as designed) |
| 4-5 | Run an engine / generate content | سوّ محتوى runs, renders a real result |
| 6-7 | Add a real product image, save | Real PNG uploads, product saves, appears in مكتبة المنتجات |
| 8 | Open it in استوديو التصميم | "استخدم في استوديو التصميم" correctly opens Visual Studio with the product pre-selected |
| 9 | Generate design | Image generates, Generated Result shows it, header does not overlap it |
| 10 | Refine it | Free local edit ("بدون نص") applies without error |
| 11 | Download | A real file downloads (`shaghil-1x1-<uuid>.png`) with the correct, intended filename |
| 12 | Save/reopen from History | Design auto-appears in السجل; reopening it displays it correctly |
| 13-14 | Reload browser, confirm persistence | Business identity, saved product, and saved design all survive a full page reload |

**Result: every one of the 14 steps completed exactly as specified. Zero uncaught JavaScript exceptions were captured during this journey.**

## 4. Broader functional audit

- **All six engines** (سوّ محتوى، اكتب لي، ابنِ عرض، رد على عميل، سوّ حملة، اكتب ريل): each renders its own input form and runs to a real result. Verified individually.
- **All five navigation destinations** (الرئيسية، هوية النشاط، هوية العلامة، مكتبة المنتجات، السجل): each opens its correct screen from the persistent nav on every screen tested.
- **Empty state:** a fresh السجل with no saved results shows a real, correct Arabic message ("ما فيه نتائج محفوظة حتى الآن"), not a blank or broken screen.
- **Error state:** a simulated `/api/generate` failure surfaces a real, readable Arabic error card ("ما قدرنا نكمل المهمة" + the server's message), with working retry actions — not a stuck spinner or blank screen.
- **Campaign packs:** approving a design into a pack saves correctly; downloading the pack produces a real, non-empty ZIP file (28KB, correct structure) — see §6.1 for a filename-naming finding.
- **Workspace export/import:** exporting a populated workspace from هوية النشاط produces a real downloadable file.
- **Origin-aware back navigation:** confirmed still correct post-lock (product-origin sessions return to مكتبة المنتجات; text/campaign-origin sessions return to the content result) — consistent with the Phase 3 Refinement 01 findings, re-verified live in this audit's product-origin flow (step 8-9 above).
- **Generated Result header positioning:** confirmed fixed and holding — the sticky header sits at the top of the viewport with no overlap over the generated image, on both desktop and mobile, in every screen reached during this audit (consistent with Refinement 02).

## 5. Desktop and mobile (375px) review

Both breakpoints were exercised across Home, مكتبة المنتجات (after adding a real product), استوديو التصميم, Generated Result, and an engine form.

- **No horizontal overflow** was found on any screen at either breakpoint.
- **No overlap** between the sticky header and any content, including the generated image, at either breakpoint.
- **RTL alignment** is correct throughout (`<html lang="ar" dir="rtl">` applied globally; verified visually — text, icons, and form fields all read and align right-to-left correctly).
- **Forms** (product upload, engine inputs, Visual Studio controls) remain usable at 375px — no clipped labels, no inaccessible controls, no cognitive-overload issues beyond what's inherent to a detailed creative tool.
- **Typography** renders cleanly at both sizes; long Arabic strings (e.g. campaign-pack helper text, product-library microcopy) wrap correctly without clipping.
- No new UI/UX defects were found beyond what Founder Refinement 02 already corrected.

## 6. Technical / release audit — findings

### 6.1 Campaign-pack ZIP download filename (Important Non-Blocker)

The pack ZIP downloads successfully with correct, verified content (confirmed non-empty, correctly sized, and structurally valid per the existing `qa-v07.mjs` CRC32-based regression check) — but the browser assigns it a generic filename ("download") instead of the intended `<project>-<campaign>.zip`. By contrast, the single generated-image download (`Visual.download()`) correctly receives its intended filename in the same audit run. The likely cause: `lib/campaign-packs.mjs`'s download handler creates and clicks its `<a download>` element only *after* an `await exportPack(pack)` call, while the single-image download creates and clicks its anchor synchronously within the click handler with no intervening `await`. This is a known class of browser behavior where a `<a download>` click issued after an async gap can lose its association with the original user gesture in some Chromium code paths for blob URLs. No data is lost and the file is fully usable — this is a filename-cosmetics issue only.

### 6.2 Inconsistent missing-API-key error language (Important Non-Blocker)

`api/visual.mjs` returns a friendly Arabic message when `OPENAI_API_KEY` is unset (`'توليد الصور غير مفعّل حاليًا'`), but `api/generate.mjs`'s equivalent check returns a raw, untranslated English string (`"OPENAI_API_KEY is not configured"`) which the client renders directly inside its Arabic error card (`esc(e.message)`). This only surfaces if a deployment is missing its API key — but if it does, a real user attempting any of the six text engines would see an English technical string break the otherwise fully Arabic-first experience audited and approved in Refinement 01.

### 6.3 Live third-party CDN dependency for background isolation (Important Non-Blocker)

`lib/background-removal.mjs` loads `@imgly/background-removal` via a runtime `import('https://esm.sh/@imgly/background-removal@1.5.8')` — a live network fetch to a third-party CDN at the moment a user needs exact-fidelity background isolation, rather than a bundled/self-hosted dependency. If a real user's network cannot reach `esm.sh` (this exact failure was reproduced in this sandbox's own egress policy during this audit — `net::ERR_TUNNEL_CONNECTION_FAILED`, unrelated to SHAGHIL's own code), background isolation fails for that session. The code degrades gracefully — a clear Arabic warning is shown and the design still completes using the original (non-isolated) product background, verified both here and by the existing `qa-v09-background-isolation.mjs` regression — but this remains a single point of failure for a core value proposition (preserving exact product photos) that depends on live reachability of one specific external CDN at the moment of use.

### 6.4 No authentication or rate limiting on the AI-backed API routes (Important Non-Blocker for a supervised pilot; would need to be revisited before any open/public release)

`/api/generate` and `/api/visual` have no authentication, session, or rate-limiting layer — anyone with the deployed URL can call them directly, and each call incurs real OpenAI API cost. This matches every phase's explicit, Founder-directed scope ("no authentication, no cloud backend, no billing" was out of scope in every phase to date) and is consistent with `DEPLOY.md`'s own framing of the product as a Founder-supervised pilot rather than open self-serve access. It is not a defect introduced by Phase 3 or any refinement — it has been the architecture since V0.6 — but it is a real cost/abuse exposure the Founder should weigh before any release beyond a controlled, access-limited pilot.

### 6.5 All product data is browser-local only, with no server-side backup (disclosed, working as designed)

Business Identity, Brand Identity, Product Library, design History, and campaign packs live exclusively in the browser's `localStorage`/IndexedDB. There is no server-side persistence. This is disclosed to the user in-app (the local-data notice on setup: "بيانات مشروعك... تُخزَّن على هذا الجهاز والمتصفح فقط") and mitigated by a fully functional, verified export/import feature. A user who clears browser data, switches device/browser, or loses local storage (e.g., periodic iOS Safari storage eviction) permanently loses everything not manually exported. This is working exactly as designed and disclosed — flagged here only so the Founder has it in view for any wider rollout, not as a defect.

### 6.6 `DEPLOY.md` is stale (Polish/Future)

`DEPLOY.md` still frames the product at its V0.6 state ("No production deployment is authorized", a QA checklist that predates V0.7–V0.9 and all of Phase 1–3). It does not reflect the current Founder-approved, locked Phase 3 baseline. This does not affect runtime behavior but could mislead anyone using it as a deployment reference today.

### 6.7 Security/secrets hygiene — clean

No `.env`/secret files exist in the working tree or anywhere in git history. `OPENAI_API_KEY` is never referenced in any client-side (browser) code — confirmed both by the existing `qa.mjs` structural check ("No API key in browser") and by direct inspection.

## 7. Release-readiness classification

### A. Release Blockers
**None found.** Every core user journey — the clean 14-step new-user flow, all six engines, Product Library → Visual Studio → Generated Result → History, campaign packs, workspace export/import, all navigation destinations, and full persistence across reload — completed correctly on both desktop and 375px mobile, with zero uncaught exceptions.

### B. Important Non-Blockers
1. Campaign-pack ZIP download receives a generic filename instead of a descriptive one (§6.1).
2. `api/generate.mjs`'s missing-API-key error is untranslated English, inconsistent with `api/visual.mjs`'s Arabic equivalent (§6.2).
3. Background isolation depends on a live third-party CDN (`esm.sh`) at runtime; degrades gracefully but is a single point of failure for a core feature (§6.3).
4. No authentication or rate limiting on the two AI-backed API routes — acceptable for a supervised pilot, a real exposure before any open/public release (§6.4).
5. All data is browser-local only with no server-side backup — disclosed and mitigated by export/import, but a structural risk to keep in view (§6.5).

### C. Polish / Future
1. `DEPLOY.md` is out of date relative to the current Phase 3 baseline (§6.6).

## 8. Release-readiness verdict

**READY WITH NON-BLOCKING ITEMS.**

If the Founder wants these addressed before wider release (not required for the current, controlled-pilot scope), the minimum fixes would be:
- Move the campaign-pack ZIP's anchor creation/click to before its `await`, or otherwise ensure the download attribute is applied within the original synchronous user-gesture call.
- Translate `api/generate.mjs`'s missing-API-key error to match `api/visual.mjs`'s Arabic message.
- (Longer-term, only before any open/public release) add authentication and/or rate limiting to `/api/generate` and `/api/visual`.

No implementation of any of the above was performed as part of this audit.

## 9. Confirmation

No runtime, product, CSS, JavaScript, `lib/`, `api/`, test harness, prompt, schema, persistence, navigation, generation behavior, or design-system file was modified during this audit. No deferred item was reopened, resolved, or reworked. No branch was merged. This document is the only file created.
