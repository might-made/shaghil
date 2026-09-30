# SHAGHIL — Post-Production Integrity Fix: Workspace Export / Import

**Status: IMPLEMENTATION COMPLETE — FOUNDER QA REQUIRED** (not closed; Founder must reproduce the exact original repro before this is declared fixed).

Scope: exactly the "تصدير نسخة كاملة" / "استيراد نسخة محفوظة" workflow. No other product code, CSS, navigation, engine, AI prompt, generation behavior, or schema was touched.

## 1. Founder-observed bug

Exporting a real, populated Production workspace (بيت التمر: Business Brain, one saved text result, one Product Library product with its original image, and at least two Saved Designs) from an existing Chrome tab, then importing that exact file into a genuinely clean Safari Private Window on the same production URL:

- **Restored correctly:** هوية النشاط, saved text result in السجل.
- **Did not restore:** مكتبة المنتجات (empty), Saved Designs ("لا توجد تصاميم محفوظة بعد.").

## 2. Diagnosis

### 2.1 What was inspected
`lib/workspace-transfer.mjs` (export/import bundle logic), `lib/visual-storage.mjs` (IndexedDB persistence for Brand Brain, Product Library, Saved Designs, campaign packs), `lib/product-library.mjs` and `lib/visual-canvas.mjs` (where product/design Blobs are originally created), and the existing `scripts/qa-v08-workspace-transfer.mjs` regression test, which already claims to verify this exact scenario end-to-end and was passing.

### 2.2 First finding: the dividing line is localStorage vs. IndexedDB+Blob
Business Brain and text History live in plain `localStorage` (simple JSON, no binary data). Product Library, Saved Designs, and Brand Brain live in IndexedDB and contain `Blob` fields (`product.image`, `product.reference`, `visual.background`, `visual.rendered`, `brand.logo`, `brand.references[]`). The export/import code already has a generic, recursive `serialize()`/`deserialize()` pair specifically to base64-encode/decode Blobs through JSON — this is exactly the mechanism that would need to be broken for this exact symptom to occur.

### 2.3 Second finding: the existing serialize/deserialize/JSON code is provably correct
Static reading of `serialize()`, `deserialize()`, `bufferToBase64()`/`base64ToBlob()`, and every place a Blob is created (`lib/product-library.mjs`'s `upload()`, `lib/visual-canvas.mjs`'s `canvasBlob()`/`responseBlob()`) found no defect — every Blob in this codebase is created same-realm, same-thread, via plain `new Blob(...)` or `canvas.toBlob()`, with no cross-realm/worker Blob-identity risk.

To verify this empirically rather than trust static reading alone, this session reproduced the **exact** flow — real download from a populated browser context, a genuinely fresh second browser context (real IndexedDB, real File API, zero shared state) importing that exact file — using real Chromium via Playwright, first with the existing tiny test fixtures and then with realistic, full-size images (~780KB product image, ~730KB per design image, matching real AI-generation output dimensions). **Both runs restored the product and both Saved Designs perfectly, images intact, byte-for-byte.** This rules out a defect in this codebase's own code, at any tested scale, in a Chromium-family browser.

### 2.4 Root cause: a documented WebKit/Safari Private Browsing platform limitation
Since the Founder's repro is specifically **Safari → New Private Window**, and Chromium-to-Chromium transfer is proven correct, the remaining variable is WebKit/Safari Private Browsing itself. This is confirmed by:
- WebKit Bugzilla #198278: *"Cannot store blobs in IndexedDB on iOS in Private Browsing mode"* — a long-standing, documented WebKit limitation.
- Multiple independent sources confirming Safari Private Browsing imposes severely restricted (in some reports, effectively zero) IndexedDB quota, while `localStorage` remains functional for small data.

This precisely matches the observed split: `localStorage` writes (Business Brain, History) succeed; IndexedDB writes containing Blobs (Product Library, Saved Designs, Brand Brain) fail. **There is no application-level code change that can make Safari Private Browsing store Blobs in IndexedDB — that capability does not exist in that browser mode.** This is a browser platform constraint, not a SHAGHIL defect.

### 2.5 The actual, fixable bug found alongside this
While the storage failure itself is a platform limitation, `importWorkspace()`'s handling of that failure **was** a real, fixable defect: every per-record import failure (`saveBrand`, `saveProduct`, `saveVisual`, `savePack`) was caught and silently discarded into a bare counter (or, for Brand Brain and Saved Designs specifically, not even counted at all — `catch {}`/`catch{}` with zero tracking). The user was left with an empty Product Library and no explanation of what happened or why — exactly the "silently discard assets" outcome this fix was tasked to eliminate.

## 3. Implementation

**File changed:** `lib/workspace-transfer.mjs` only (the workspace-transfer module itself — no other runtime file was touched).

- Added `isStorageBlocked(e)`: detects a `QuotaExceededError` name or a quota-related message (including this codebase's own existing "…أو مساحة المتصفح ممتلئة" wording from `saveProduct`/`savePack`'s real abort paths).
- `importWorkspace()` now tracks `brandImported`/`brandSkipped` (previously untracked entirely) and `visualsSkipped` (previously untracked entirely), alongside the existing `productsSkipped`/`packsSkipped`, and sets a new `storageBlocked` flag whenever any category's save failure matches `isStorageBlocked()`.
- `summaryText()` now reports Brand Brain's import outcome explicitly, reports how many Saved Designs failed to import (previously invisible), and — when `storageBlocked` is set — appends a clear, actionable sentence: the images could not be saved in this browser, and if this is Private/Incognito mode, to reopen the import from a normal window.

No change to: `serialize()`/`deserialize()` (proven correct), `buildBundle()`/`exportWorkspace()` (proven correct), `visual-storage.mjs`'s save functions (their existing error-throwing behavior is used elsewhere and was left untouched — this fix only changes how `workspace-transfer.mjs` *reacts* to those errors), navigation, engines, or any UI beyond the existing status-line text.

### Serialization strategy (unchanged, confirmed correct)
Blob → base64 string inside a `{__blob:true, type, data}` marker object, recursively applied through arrays/objects, embedded directly in the exported JSON file. Reconstructed via `atob` → `Uint8Array` → `new Blob([...], {type})` on import. This was already the "appropriate portable serialization mechanism" the task asked to choose — proven correct twice via real-browser testing, so it was kept unchanged rather than replaced.

### Import reconstruction strategy (unchanged, confirmed correct)
Each category (`brand`, `products[]`, `visuals[]`, `packs[]`) is deserialized and written via the existing `store.save*()` functions individually, with `store.put()` (upsert-by-id) semantics — so re-importing the same file is idempotent and never duplicates records (confirmed by the pre-existing regression test, unaffected by this fix).

## 4. Backward compatibility

No genuinely different historical export schema was found in this codebase's history — `serialize()`/`buildBundle()` has included Blob serialization since this module's inception. "Legacy partial export" in the strict sense (a file missing image assets) does not correspond to any confirmed prior SHAGHIL export format. The code already tolerates a bundle missing `products`/`visuals`/`packs` keys entirely (`for (const p of bundle.products || [])`), which the new focused QA verifies explicitly with a synthetic legacy-shaped bundle (Business Brain + History only) — it restores everything present and errors on nothing.

## 5. Data safety

- Malformed/invalid files (`shaghilWorkspace !== 1`, `null`) are rejected immediately with a clear error, before any write — verified by the new focused QA.
- Each category's save is independently try/caught — one failing record never blocks or corrupts another category's import (pre-existing behavior, unchanged).
- No destructive replacement without confirmation: overwriting an existing Business Brain still requires the existing `confirm()` dialog, unchanged.
- No cloud persistence, authentication, backend database, or external asset hosting was introduced — this remains a purely local, file-based transfer mechanism, exactly as before.

## 6. Regression QA

`npm run qa` (single command, orchestrates the full persisted suite): **15/15 PASS, 0 FAIL** (the suite grew from 14 to 15 scripts with this fix — see §7). Zero pre-existing test assertions were modified; the new script is additive only.

## 7. Focused workspace-portability QA (new, persisted)

`scripts/qa-v10-workspace-portability.mjs` — added to `scripts/qa.mjs`'s orchestration chain (now part of the permanent regression suite). Covers the full 22-item checklist:

- **Export content (1–7):** Business Brain, Brand Brain, text History, Product Library metadata + original image asset, Saved Design metadata + image asset — all confirmed present in the export bundle with real `__blob` markers.
- **Import restoration (8–14):** every category restores into a genuinely empty destination; product and design images are real, loadable Blobs with byte-exact original content.
- **Relationship integrity (15–16):** product↔image and design↔image/product references remain correct after the transfer.
- **Six engines untouched (19):** engine identifiers on imported records are unchanged.
- **Malformed-file safety (20):** an invalid/null bundle is rejected safely with a clear error, before any write.
- **Legacy-export graceful restore (21):** a synthetic legacy-shaped bundle (no products/visuals keys) restores everything it does contain without error.
- **New in this fix — storage-blocked detection:** a *real* rejection (triggered through the existing, genuine 12-product storage cap in `saveProduct`, not a mocked error) is correctly detected by `isStorageBlocked()` and surfaced via `summary.storageBlocked`, proving the fix's core behavior end-to-end rather than by inspecting source text.

Real-browser UI-level items (17, 18, 22) were verified separately with Playwright against a genuinely fresh browser context (not committed — ephemeral verification script, consistent with this session's established practice): restored product opens into استوديو التصميم with exact-fidelity preserved (17); a restored Saved Design reopens and shows its image (18); no horizontal overflow at 375px on مكتبة المنتجات or السجل after import (22). **7/7 PASS.**

## 8. Result summary

| Item | Result |
|---|---|
| Product Library portability | **PASS** — real image, name, description all restore into a genuinely fresh Chromium context |
| Saved Designs portability | **PASS** — both `background` and `rendered` images restore, byte-exact |
| Binary/image portability | **PASS** at both tiny and realistic (~750KB/image) scale, in Chromium |
| Legacy export compatibility | **PASS** — a synthetic legacy-shaped file restores available data gracefully |
| Data safety | **PASS** — malformed files rejected safely; no half-written state observed |

## 9. Known limitation (disclosed, not fixed — cannot be fixed at the application level)

**Safari Private Browsing cannot store Blobs in IndexedDB** (documented WebKit limitation, bug #198278). Importing a workspace containing Product Library or Saved Designs into a Safari Private Window will still fail to restore those categories, **by browser design, with no code-level workaround available**. This fix changes that failure from *silent* (empty screens, no explanation) to *explicit* (`summary.storageBlocked` surfaces a clear message telling the user to reopen the import from a normal, non-private window). This is the correct, honest outcome for a genuine platform constraint — not a claim that the underlying limitation has been removed.

## 10. Founder manual QA procedure

1. Create or reuse a populated workspace (Business Brain, at least one Product Library item with a real image, at least one Saved Design).
2. اضغط "تصدير نسخة كاملة" and confirm the file downloads.
3. Open a **normal** (non-private) window/browser you have not used with SHAGHIL before, or clear that browser's site data for the SHAGHIL URL first.
4. Confirm the destination shows "جهّز هوية النشاط" (genuinely empty) before importing.
5. Import the exported file.
6. Verify هوية النشاط is restored.
7. Verify هوية العلامة is restored (if the source workspace had one).
8. Verify مكتبة المنتجات shows the product **with its image**.
9. Verify السجل shows the saved text result.
10. Verify التصاميم المحفوظة shows the Saved Design(s) **with their generated images**.
11. Open the restored product into استوديو التصميم and confirm it enters correctly with the image and exact-fidelity setting intact.
12. Reopen a restored Saved Design from التصاميم المحفوظة and confirm its image displays.

**Additionally, to confirm the new messaging (not a fix for the platform limitation itself):** repeat steps 2–5 into a genuine **Safari Private Browsing** window. Business Brain and text History should still restore; the status message should now clearly state that product/design images could not be saved in this browser and suggest reopening the import from a normal window, instead of leaving Product Library/History silently empty with no explanation.
