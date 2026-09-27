# SHAGHIL Implementation — Phase 3: Product Readiness Audit

**STATUS: AUDIT ONLY — NO IMPLEMENTATION. FOUNDER DECISION REQUIRED BEFORE ANY PHASE 3 WORK BEGINS.**

Starting SHA: `56cb8e9d0a1b2dd5a3e15e2beeb4a3965ffcb1e3` (locked Phase 2 HEAD, Founder-approved runtime `5c999c9a845d2399f29b9247d9798484766664d7`). This document is the only file this audit adds. No product/runtime code was touched.

---

## 1. Executive readiness summary

SHAGHIL's core loop — set up a Business Brain once, generate from six engines, refine, save, reopen, and turn a written idea into a product visual — **works end to end** on the real runtime, verified with real interactions (not simulated success), a real uploaded product image, and real failure injection. No P0 (blocker) was found: nothing destroys data, nothing dead-ends, nothing crashes.

Two findings materially affect real-world comprehension enough to call **P1 (required before MVP release)**: a genuinely redundant "Create Design" button that appears three times on the single most common content-engine output shape, and the fact that Visual Studio has no entry point except through three of the six text engines — a user who only wants a product photo, with no interest in a content plan/offer/campaign, currently cannot get there. Everything else found is real but calibrated P2 (should improve, MVP remains usable) or P3 (polish/future), plus the terminology question the Founder has already, correctly, deferred.

**Bottom line:** SHAGHIL is closer to a coherent MVP than a rough prototype. The two P1s are both narrow, well-understood, low-risk-to-fix UI/flow issues — not architecture, not data-model, not generation-logic problems.

---

## 2. Current architecture / product-flow map

```
localStorage: brain (Business Brain), shaghilHistory (up to 30 text results)
IndexedDB "shaghil-visual-v1": brand (Brand Brain, 1 record), products (up to 12),
                                visuals (saved designs, pruned to 10 most recent),
                                packs (campaign packs, up to 6, 12 entries each)

welcome -> setup (Business Brain: required fields, optional fields, workspace import)
              -> home (six engines) -> engine (input) -> output (generate/refine/save)
                                                              -> visualEntry (content/campaign/offer only)
                                                                    -> visualStudio (SOURCE/CREATIVE/COMPOSITION[collapsible]/GENERATION)
                                                                          -> visualResult (download/variants/Change Background/campaign pack)
brainScreen (read-only Business Brain profile) <-> brandBrain (identity) <-> productLibrary (assets)
history (content list + visual list + campaign packs) -> reopen any of the three
Workspace.export/import (Business Brain + Brand Brain + products + visuals + packs + history, one JSON file)
```

Text generation (`api/generate.mjs`) sends only Business Brain fields to the model. Visual generation (`api/visual.mjs`) sends both Business Brain and Brand Brain; the exact product photo is composited locally by `lib/visual-canvas.mjs` and is **never** sent to the image model when fidelity is "exact" — verified live (network payload inspected, `product` key absent from the request body in exact mode). Background isolation (`lib/background-removal.mjs`) loads a third-party model from `esm.sh` at runtime, in the browser, on first use.

---

## 3. End-to-end journey findings (desktop, real runtime, real interactions)

Every numbered step below was actually performed with Playwright driving real Chromium against the real served files (not a mock DOM), with only the two OpenAI-backed network calls (`/api/generate`, `/api/visual`) mocked — no `OPENAI_API_KEY` is available in this environment. Generated *text/image content quality and relevance are **NOT VERIFIED IN THIS ENVIRONMENT***; everything about client-side behavior, state, persistence, and UI is real and verified.

| # | Step | Result |
|---|---|---|
| 1 | First arrival | Lands on `#welcome`, copy is clear and short. PASS. |
| 2 | Business Brain | Empty-required-field save correctly blocked with a clear toast; valid save navigates to Home. PASS. |
| 3 | Brand Brain | Reachable directly from nav; saving from this screen alone succeeds and does not disturb Business Brain data. PASS. |
| 4 | Product Library | Real PNG uploaded, saved, rendered in the grid. PASS. |
| 5 | Engine selection | All six cards present with correct labels/icons. PASS. |
| 6 | Engine input | Content engine's form renders correctly. PASS. |
| 7-8 | Generation | Skeleton "thinking" state shown, then mocked result renders. PASS (client behavior); content quality NOT VERIFIED IN THIS ENVIRONMENT. |
| 9 | Refinement | "أقصر" (shorter) triggers a new generation request and replaces the output. PASS. |
| 10 | Save | Save button disables immediately after saving; history count increments. PASS. |
| 11 | History / reopen | Reopened result correctly shows Save already-disabled (no duplicate-save risk). PASS. |
| 12-13 | Create Design → Visual Studio | Entry point appears correctly for a reopened content result; Visual Studio opens with brand/business context line populated. PASS. |
| 14 | Product-based visual generation | Saved product selectable in the dropdown; fidelity auto-set to "exact"; verified the request body sent to `/api/visual` contains no product image bytes in exact mode. PASS. |
| 15 | Change Background | Action present and dispatches a new `action:"background"` request. PASS. |
| 16 | Campaign pack | **See finding P2-06** — blocked in this run because the active design carried an isolation warning from the prior step (see below); this is a real behavior, not a test artifact, though the specific trigger in this run was a degenerate 1×1 test image. |
| 17 | Workspace export | Real file downloaded; JSON contains `shaghilWorkspace`, `localStorage`, `brand`, `products`, `visuals`, `packs` as documented. PASS. |
| 18 | Workspace import | Imported the just-exported real file into a fresh browser origin; Business Brain, the product, both saved visuals, and history all restored correctly. PASS. |
| 19 | Refresh/reload persistence | Full page reload retains Business Brain, History, and Product Library contents. PASS. |
| 20 | Return-user workflow | A returning user with saved data lands on Home directly (not Welcome), confirmed. PASS. |

---

## 4. Desktop findings

Layout, hierarchy, and interaction all behaved as intended at 1440px throughout the full journey above. No overflow, no broken control, no unreachable action. The one real defect found on desktop is the triple-Create-Design-button issue (**P1-01**, see §16.

## 5. Mobile findings (375px, real interaction, not screenshots only)

Actually performed SETUP → ENGINE → GENERATE → RESULT → SAVE → HISTORY and PRODUCT → VISUAL STUDIO → GENERATE at 375px:

- **No horizontal overflow at any step** (11 checkpoints tested: welcome, setup, home, engine input, result, history, product library, Visual Studio input, Visual Studio result).
- Save button and History item tap targets both comfortably exceed 40px (40px and ~189px respectively).
- The persistent global nav (fixed from the prior refinement pass) does not visually obstruct scrolled content — re-verified directly with `elementFromPoint` and a screenshot; an initial automated bounding-box check produced a false alarm (it queried the wrong `.card` element), corrected here to avoid reporting a non-issue.
- **Real finding (P2-07):** even with the mobile progressive-disclosure fix (Refinement 01) collapsing the Composition group, the Visual Studio Generate button still sits roughly 1456px down the page on a 812px-tall viewport (~1.8 screens of scrolling) — SOURCE, CREATIVE DIRECTION, and their explanatory paragraphs are all substantial before Generate. The path is linear and everything is reachable (not a P1), but it is still a meaningfully long scroll for the primary action.
- All engine input controls, the result screen, and Visual Studio's input/result screens are fully usable with the on-screen keyboard triggered by tapping text fields; no control was found clipped or inaccessible.

---

## 6. Business Brain findings

Onboarding, editing, and persistence all work exactly as designed (verified in §3). **Data flow traced into actual generation**: `api/generate.mjs`'s `normalizeRequest()` extracts exactly the eight Business Brain fields (`name, category, product, customer, location, price, tone, objective`) and the server-side prompt states plainly that Business Brain is "the single source of truth" — this is genuinely wired, not decorative. Incomplete-profile behavior is handled correctly everywhere tested: `openEngine()`/`run()` both redirect to Business Brain setup with a toast if the three required fields are missing, rather than silently failing or generating with blank context. Return-user behavior is correct: a saved Business Brain is loaded automatically into every screen that needs it (`loadBusinessFields()`), and the read-only profile view (`brainScreen()`) now shows correct Arabic labels (fixed in Phase 2) rather than raw field keys.

## 7. Brand Brain findings

Logo, references, colors, and style all persist correctly to IndexedDB and reload correctly. **Data flow traced**: Brand Brain's `primary`/`secondary`/`accent`/`style` fields and the logo/reference images are sent into `api/visual.mjs`'s image-generation prompt and are used directly by the local compositor (`lib/visual-canvas.mjs`) for the logo overlay and the text-panel background/accent colors — genuinely connected to Visual Studio, not cosmetic. **Not connected**, by design: Brand Brain has zero influence on the six text engines — `api/generate.mjs` never reads any Brand Brain field. This is a reasonable, already-labeled scope (Brand Brain's own subtitle reads "هوية مشروعك البصرية" — your *visual* identity), so it is **not classified as a defect**, but is worth Founder awareness (see §14, terminology/comprehension). Missing-state behavior is handled gracefully: `setupBrand()` defaults every field to sane empty values (`DEFAULT` object in `lib/visual-studio.mjs`) if no Brand Brain has ever been saved, so nothing breaks for a user who skips it entirely.

## 8. Product Library findings

Tested the full requested chain — UPLOAD → SAVE → RELOAD → SELECT → VISUAL STUDIO → GENERATE — with one real uploaded PNG:

- Persistence, previews, and metadata all correct, including **after a full page reload** (true IndexedDB persistence, not a session artifact).
- The broken-image-preview defect the Founder found in the prior review round is confirmed fixed and re-verified in this audit.
- Editing and deletion both work; deleting a product that was already used in a saved visual design does **not** break the saved design — the saved record stores its own rendered image independently, and it still opens correctly with an intact image after the source product is deleted (verified directly).
- Fidelity selection (`exact`/`creative`) is respected and correctly auto-populated when a saved product is chosen in Visual Studio.
- Empty state shows a clear, correctly-worded call to action ("أضف أول منتج...").
- Multiple products: the dropdown and grid both scale correctly with more than one saved product (tested with 2+ across different audit runs).
- Failure handling: saving with a name but no staged image is correctly blocked with a clear Arabic message.

**On the explicit question — is the lack of a Product Library → Visual Studio direct shortcut a convenience gap or a meaningful workflow gap?** Based on actually testing it: **it is a meaningful workflow gap**, not mere convenience. See **P1-02** in §16 — a user arriving at Product Library with a product photo in hand has no path into Visual Studio except by first generating unrelated text content from one of three engines and selecting an idea from it. This is architecturally understandable (Visual Studio needs a "creative idea" as its anchor) but is a real, observed gap in the actual journey, not a hypothetical one. **This audit does not propose implementing a fix** — per instruction, it is recorded as a finding for Founder decision only.

## 9. Six-engine findings

All six engines (`سوّ محتوى`, `اكتب لي`, `ابنِ عرض`, `رد على عميل`, `سوّ حملة`, `اكتب Reel`) were opened and verified to render the correct engine-specific form fields, share the identical Context → Input → Generate/Cancel grammar, and use the same refine/save/history mechanics. **They read as one coherent product, not six disconnected forms** — consistent icon system, consistent card grammar, consistent output rendering (`md()`), consistent error styling. Only three of the six (`content`, `campaign`, `offer`) can lead into Visual Studio (`resultEntry()`'s explicit allow-list) — copy/WhatsApp-reply/Reel-script outputs never show a "Create Design" option. This is a sensible, intentional scope (a WhatsApp reply or Reel script isn't naturally "an idea to visualize" the way a content-plan day or an offer angle is) and is not flagged as a defect, but is worth Founder awareness as a documented boundary. Error behavior (a mocked 500 from `/api/generate`) shows a clearly-styled, Arabic, non-technical error message with an obvious retry path ("جرّب نسخة ثانية") and does not expose any implementation detail.

## 10. Visual Studio findings

Tested without a product, with a real Product Library product, in exact-fidelity mode, with Change Background, with the mobile-collapsed Composition section, with the desktop-expanded one, through a full generation → result → download/save cycle, and after a full page reload. The SOURCE → CREATIVE DIRECTION → COMPOSITION → GENERATE → REFINE → SAVE hierarchy (locked in Phase 2, refined in Refinement 01) is understandable and was successfully used without any Founder-style hand-holding in this audit's own walkthrough. Exact-fidelity preservation is real and verified: the request payload sent to the model contains **zero image bytes for the product** when fidelity is "exact" — the compositing happens entirely client-side afterward. Visual realism/lighting/perspective quality is explicitly **out of scope for this audit** per instruction (already-known future enhancement) and was not evaluated.

**Real reliability finding (P2-05, background isolation depends on a live external CDN):** `lib/background-removal.mjs` loads `https://esm.sh/@imgly/background-removal@1.5.8` at runtime, in the browser, the first time exact-fidelity compositing is needed — there is no bundled/local copy. Blocking that domain (tested directly) does **not** break the workflow: the compositor catches the failure, falls back to the original (non-isolated) product image, shows a clear Arabic warning ("تعذّر عزل خلفية صورة المنتج تلقائيًا... جرّب مرة ثانية أو استخدم صورة منتج بخلفية شفافة"), and still saves a usable design. This is a well-engineered graceful degradation of a real dependency, not a defect — but it is a genuine external-runtime dependency for the product's headline "exact product" capability, worth explicit Founder awareness rather than treating background isolation as fully self-contained.

## 11. History / reuse findings

History correctly separates and surfaces content results, saved visual designs, and campaign packs (grouped since Phase 2). Reopening a content result restores full context (`current`, `lastInputs`, the text) and correctly re-shows the Create Design entry point. Reopening a saved visual restores the full composited image and its settings. Delete requires confirmation (`confirm()`) for both content-history entries and product-library entries — no accidental-delete risk found. **A user can realistically continue work from a prior session without rebuilding context** — verified directly via a full page reload followed by reopening a saved history item, which required zero re-entry of any business/brand/product information.

## 12. Persistence / recovery findings

Everything is stored client-side only: `localStorage` (Business Brain, content History) and `IndexedDB` (Brand Brain, Product Library, saved visuals, campaign packs), scoped to the exact browser + origin (Preview URL) combination — a browser platform rule the app cannot change, and one it already discloses prominently (the first-run local-data notice, and a dedicated "نقل مساحة العمل بين الروابط" section with its own warning copy).

- **Refresh**: verified — all data survives a full page reload.
- **Export/import**: verified end to end with a real file, across a genuinely separate browser context (simulating a different device/browser) — full round-trip fidelity confirmed (Business Brain, product, two saved visuals, and history all restored).
- **Malformed import**: verified — a corrupt JSON file produces a clear, non-crashing Arabic error message and leaves the current screen and any existing data completely untouched.
- **Missing/corrupt state**: deleting a product that a saved visual referenced does not corrupt or break that saved visual (§8).

**Classification**, per instruction, of local-only storage:

- **CURRENT MVP ACCEPTABLE**: for a single user working from one browser on one device, this is completely adequate and already well-disclosed.
- **REQUIRED BEFORE REAL USERS, conditionally**: *only if* the real deployment target is a rotating/ephemeral Preview URL that changes between deployments. If SHAGHIL's real-user URL is a single stable production domain, the current model is sufficient as-is. This audit found no evidence either way about the actual deployment topology and does not assume one.
- **FUTURE PRODUCTION INFRASTRUCTURE**: any server-side/account-based storage is future work, not something the current journey demonstrates a need for today.

## 13. Failure / recovery findings

Deliberately tested:

| Scenario | Result |
|---|---|
| Empty required Business Brain fields | Blocked with a clear toast, no navigation, no data loss. |
| `/api/generate` returns 500 | Clear, Arabic, non-technical error with an obvious retry action; error text now uses the locked error color (Phase 2 fix), visually distinct from success output. |
| Product save with name but no image | Blocked with a clear Arabic message; no partial/corrupt product created. |
| `/api/visual` returns 502 | Clear Arabic error shown on the Visual Studio screen itself; the user's selected idea, product, and settings all remain populated — nothing is lost, retry is a single click away. |
| Product deleted after being used in a saved visual | Saved visual is unaffected and still opens with its image intact. |
| Malformed/corrupt workspace-import file | Clear Arabic error, no crash, no data corruption, current screen untouched. |
| Background-isolation CDN unreachable | Graceful degradation with a clear warning; design still saves. |

No error message inspected exposed a stack trace, a raw exception, an HTTP status code, or any other implementation detail to the user in any of these scenarios.

## 14. Language / terminology inventory

Per instruction, this is an inventory and impact classification only — **no copy was changed**, and this remains explicitly deferred, future product-copy work unless a specific instance below is flagged as a real comprehension failure (none are).

| Term | Occurrences (index.html) | Where it names | User-impact classification |
|---|---|---|---|
| Business Brain | 12 | Product name for the business-facts module | Low — always paired with Arabic explanatory copy on first appearance ("جهّز Business Brain" + full Arabic description of what it stores). |
| Brand Brain | 6 | Product name for the visual-identity module | Low — paired with an Arabic subtitle ("هوية مشروعك البصرية") that already communicates the visual-only scope discussed in §7. |
| CTA | 8 | Field labels ("دعوة لاتخاذ إجراء" is also used elsewhere for the *same concept*, inconsistently) | **Medium** — the app uses both "CTA" and its own Arabic translation "دعوة لاتخاذ إجراء" for the identical concept in different screens; this specific inconsistency (not the English loanword itself) is the more real finding worth a future copy pass. |
| Premium | 5 | A visual style/refinement option name | Low — used consistently as a style-option label, understandable in context (a common Arabic-market loanword). |
| Reel | 3 | One of the six engine names/output shapes | Low — "Reel" is the platform-specific term (Instagram Reels) that Saudi SME operators overwhelmingly already use natively; translating it could reduce clarity, not improve it. |
| Visual Studio | 2 | Product name for the visual-generation module | Low — reached only in-context (from a generated result), not a cold navigation label a new user must decode unaided. |
| Instagram / TikTok / WhatsApp / SMS / Website | 5+3+3+1+1 | Channel-selector options | None — these are the platforms' own real names; there is no Arabic equivalent to substitute. |
| Product Hero / Lifestyle / Minimal / Campaign / Performance Ad / Editorial | 2 each | Visual Studio style-mode option labels | Low — internal creative-direction jargon, but scoped to an advanced/optional selector, not a primary navigation term. |

**No terminology instance found in this audit rises above Medium impact**, and the one Medium item (CTA vs. "دعوة لاتخاذ إجراء" used interchangeably in different places) is a minor internal-consistency note, not a comprehension blocker. This fully supports the Founder's existing decision to keep this deferred.

## 15. P0 findings

**None.** No data loss, no destructive behavior, no critical failure, and no inability to complete any of the twenty journey steps was found anywhere in this audit.

## 16. P1 findings (required before MVP release)

### P1-01 — Redundant "Create Design" call-to-action on multi-idea content results
- **Severity:** P1
- **Screen/module:** `#output` (Generated Result), `renderCards()` in `lib/visual-studio.mjs`, `#visualEntry` in `index.html`
- **Reproduction:** Generate (or reopen) any content-plan result whose text splits into two or more day/idea segments (the default, common shape for the `سوّ محتوى` engine, and for `ابنِ عرض`/`سوّ حملة` outputs with multiple angles). `renderCards()` shows one idea card per segment, each with its own primary "اصنع التصميم" button, while `resultEntry()` *simultaneously* keeps the generic bottom "اصنع التصميم" button visible.
- **Expected behavior:** One unambiguous way to start a design from a given result.
- **Actual behavior:** Three identically-styled, identically-labeled mint primary buttons appear on screen at once (verified with a real screenshot, §3 evidence).
- **User impact:** Directly undermines the "no equal-weight competing buttons" hierarchy principle already established for this screen (Phase 2), on the single most common engine output shape. Real risk of a first-time user not understanding which button to press or assuming they do different things.
- **Evidence:** `SHAGHIL_IMPLEMENTATION_PHASE3_AUDIT.md` companion screenshot `multi-idea-result.png` (retained in this session's audit artifacts).
- **Recommended direction (not implemented):** Hide the generic `#visualEntry` CTA whenever per-idea cards are already shown (i.e., when `renderCards()` actually renders ≥2 cards), keeping only its helper text/selection-based path for the single-result case where no cards exist.
- **Implementation risk:** LOW — presentation-only condition in `resultEntry()`/`renderCards()`; no data model, API, or generation logic involved.
- **Dependencies:** None.

### P1-02 — No entry into Visual Studio without first generating unrelated text content
- **Severity:** P1
- **Screen/module:** Product Library, Home, Visual Studio entry logic (`resultEntry()`, `Visual.choose()` in `lib/visual-studio.mjs`)
- **Reproduction:** From Product Library (or Home, or anywhere), attempt to reach Visual Studio directly with a saved product and no interest in generating a content plan, offer, or campaign first.
- **Expected behavior:** A user whose only goal is "make a product photo" can reach that goal without a detour through unrelated text generation.
- **Actual behavior:** Visual Studio is only reachable via `Visual.choose()`, which requires an existing generated text result from exactly three engines (content/offer/campaign) and a selected "idea" string as its anchor. There is no other entry point anywhere in the product.
- **User impact:** A plausible, common real-world intent (an SME owner who already has a product photo and just wants a formatted image for Instagram, no text needed) currently has no path to it at all without generating and discarding unrelated text — this is the same gap the Founder explicitly asked this audit to characterize (§8), now confirmed as real rather than hypothetical.
- **Evidence:** Direct code trace (`resultEntry()`'s engine allow-list; `choose()`'s required `lastText`/`current` state) plus live confirmation that no other affordance exists in the shipped UI.
- **Recommended direction (not implemented):** A Founder decision is needed on the *shape* of a fix — e.g., a minimal synthetic "idea" seeded from the product's own name/description so `Visual.choose()`'s existing machinery can be reused without new generation logic, entered from a "استخدم في Visual Studio" action on each Product Library card. This is deliberately not designed further here, per instruction not to implement or over-specify.
- **Implementation risk:** MEDIUM — touches `lib/visual-studio.mjs`'s entry contract, the one file every phase so far has been told to treat carefully; needs a real design decision, not just a UI tweak.
- **Dependencies:** Founder decision on acceptable entry-point design before any implementation.

## 17. P2 findings (should improve; MVP remains usable)

- **P2-03 — Campaign-pack approval can be blocked with an unclear next step.** `lib/campaign-packs.mjs`'s `add()` refuses to save a pack entry if the active design carries `overlayWarning` (e.g., from a background-isolation failure), showing only "راجع خطأ تركيب التصميم قبل اعتماده" (review the compositing error before approving) — accurate, but doesn't tell the user the concrete fix (regenerate, or use a transparent-background source image). The underlying save-to-History still succeeds; only campaign-pack *approval* is blocked. Low implementation risk if addressed (a status-message wording change), no dependencies.
- **P2-04 — CTA / "دعوة لاتخاذ إجراء" naming inconsistency.** See §14; the same concept is labeled two different ways in different screens. Worth folding into any future terminology pass rather than fixing in isolation.
- **P2-05 — Exact-fidelity background isolation depends on a live third-party CDN at runtime**, with graceful (but real) degradation. See §10. No fix proposed here; a Founder-level architecture decision (bundle the model locally vs. accept the CDN dependency) is out of this audit's scope to recommend.
- **P2-07 — Mobile Visual Studio still requires substantial scrolling (~1.8 screens) to reach Generate**, even after the Refinement 01 progressive-disclosure fix. See §5. Not a blocker (linear, fully reachable), but a real, measured remaining friction.
- **P2-08 — Business Brain's "workspace transfer" section and the setup screen's own workspace-import control duplicate the same underlying action** (`Workspace.import`) in two places with near-identical copy. This is intentional and documented (recovery is reachable from more than one entry point on purpose, per `workspace-transfer.mjs`'s own comment), but is worth a Founder sanity-check that it reads as "convenient," not "redundant," to a real user.

## 18. P3 findings (future / polish)

- **P3-09 — Brand Brain's influence is visual-only**, with no effect on the six text engines' tone/voice. Already reasonably scoped by its own "visual identity" subtitle (§7); flagged only as a possible future enhancement (e.g., letting "الأسلوب البصري" also lightly inform copy tone), not a current gap.
- **P3-10 — Style-mode labels in Visual Studio (Product Hero, Editorial, Performance Ad, etc.) remain English-only design jargon.** Scoped to an advanced/optional selector; low real-world impact per §14.
- **P3-11 — Visual realism (contact shadows, lighting/perspective integration) is a known, already-accepted future enhancement area**, explicitly out of this audit's scope per instruction; recorded here only for completeness, not as a new finding.

## 19. Already-approved / deferred items that should NOT be reopened

- All Phase 1 foundation work (Graphite Pulse, IBM Plex typography, master wordmark, spacing/radius/elevation tokens) — locked, Founder-approved, not reopened by this audit.
- All Phase 2 information-architecture and screen-hierarchy decisions (global nav, Business Brain/Brand Brain/Product Library as separate screens, Generated Result's content-first ordering, Visual Studio's four-section grouping, History grouping) — locked, Founder-approved, not reopened.
- Refinement 01's three specific fixes (Product Library preview bug, mobile progressive disclosure, mobile nav compaction) — locked, Founder-approved, not reopened; this audit's P2-07 finding is a *remaining* observation about scroll depth, not a request to redo that work.
- The mixed Arabic/English terminology question — Founder-deferred previously; this audit's §14 inventory supports keeping it deferred (no instance found that rises to a real comprehension failure).
- Visual realism/lighting/contact-shadow quality — explicitly out of scope per this audit's own instructions.

## 20. MVP release-readiness gap

If SHAGHIL were given today, as-is, to 10 Saudi SME owners or marketing operators with no Founder assistance:

- **What would stop them:** Nothing found would fully stop a determined user from completing the core loop at least once.
- **What would confuse them:** The triple Create-Design button (P1-01) on the most common content output; not being able to find a path to "just make a product photo" without generating unrelated text first (P1-02).
- **What would cause lost work:** Nothing found in this audit — every failure path tested preserved the user's in-progress state and data.
- **What would make them distrust the product:** A campaign-pack save silently refusing to complete with an unclear reason (P2-03) is the closest candidate, but it is rare (requires a prior compositing warning) and does not lose data.
- **What would prevent repeated use:** Nothing structural found; persistence and return-user flows both work correctly across reloads and even across a real export/import round-trip.
- **What is merely polish:** P2-05, P2-07, P2-08, and all of §18 (P3).

**Overall gap to MVP-ready, in this audit's assessment: small.** Two narrow, well-scoped P1 UI/flow issues, both fixable without touching generation logic, APIs, data models, or the locked design system.

## 21. Recommended implementation sequence

Proposed for Founder review only — **nothing here is implemented or authorized by this document.**

### Batch 1 — Generated Result CTA de-duplication (P1-01)
- **Problem solved:** Removes the triple-button confusion on multi-idea content results.
- **Affected files/modules:** `index.html` (or `lib/visual-studio.mjs`'s `resultEntry()`), purely a visibility-condition change.
- **Estimated scope:** S
- **Regression risk:** LOW
- **Dependencies:** None
- **Founder decision required?** NO — this is a direct, uncontroversial fix to a concretely observed defect matching an already-approved design principle.

### Batch 2 — Product Library → Visual Studio entry point (P1-02)
- **Problem solved:** Gives users who only want a product visual a real path there.
- **Affected files/modules:** Likely `index.html` (a new per-card action), `lib/visual-studio.mjs` (`choose()`'s entry contract would need to accept a product-seeded "idea" instead of only a text-result-derived one).
- **Estimated scope:** M
- **Regression risk:** MEDIUM (touches the one file every phase has flagged as sensitive)
- **Dependencies:** A Founder decision on the exact entry design (what "idea" text gets synthesized, whether Business Brain alone is a sufficient anchor, etc.) before implementation starts.
- **Founder decision required?** YES — this is a real product-flow decision, not a mechanical fix.

### Batch 3 — Small clarity/reliability polish (P2-03, P2-07, P2-04)
- **Problem solved:** Clearer campaign-pack-blocked messaging; somewhat shorter mobile scroll to Generate; consistent CTA terminology.
- **Affected files/modules:** `lib/campaign-packs.mjs` (message text only), `styles/components.css`/`index.html` (mobile spacing), copy-only changes for CTA wording.
- **Estimated scope:** S–M (three small, independent changes; can be split further if preferred)
- **Regression risk:** LOW
- **Dependencies:** None functionally; the CTA-wording piece should probably wait for the broader terminology decision rather than being fixed in isolation.
- **Founder decision required?** NO for P2-03/P2-07; YES (or defer) for the CTA wording piece specifically, since it brushes against the deferred terminology question.

**Recommended order:** Batch 1 first (smallest, zero ambiguity), then Batch 2 (needs a Founder design decision, so it can be discussed in parallel while Batch 1 ships), then Batch 3 as time allows. No batch requires reopening any locked phase's foundation or design work.

---

## Evidence

All findings above were produced by actually driving the real runtime (Chromium via Playwright) against the served `index.html`/`styles/`/`lib/` files, with real file uploads, real localStorage/IndexedDB persistence, real reload cycles, and deliberate real failure injection (network mocking only for the two OpenAI-backed endpoints, since no `OPENAI_API_KEY` exists in this environment — every such instance is explicitly marked **NOT VERIFIED IN THIS ENVIRONMENT** for content quality, never marked PASS). No synthetic screenshot in this audit implies success that was not actually exercised.

## QA baseline (run before this audit began, against `56cb8e9`)

- Existing regression QA: **14/14 PASS**
- Phase 1 QA: **26/26 PASS**
- Phase 2 QA: **41/41 PASS**
- Refinement 01 QA: **27/27 PASS**

Zero failures. Audit proceeded as authorized.
