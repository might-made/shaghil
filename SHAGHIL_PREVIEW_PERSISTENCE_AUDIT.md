# SHAGHIL — Closed Pilot: Preview Data Persistence & QA

Branch: `shaghil-closed-pilot-ux-refinement` (not merged, not deployed to production; no new Preview deployment created for this task)

## Founder report

Every new Vercel Preview URL appears to have empty History, Saved Designs
and Campaign Packs, preventing verification of fixes against previously
saved results.

## 1. Persistence architecture — what actually happens

SHAGHIL stores everything client-side, in the browser, scoped to the
**page origin** (`lib/visual-storage.mjs`):

- **`localStorage`**: Business Brain (`brain`) and result History
  (`shaghilHistory`).
- **`IndexedDB`** (`shaghil-visual-v1`): Brand Brain (`brand`), Product
  Library (`products`), Saved Designs (`visuals`, capped at 10 most
  recent), and Campaign Packs (`packs`, capped at 6).

There is no server-side database and no account system — this is by
design, and this task does not add one.

**Is this data lost?** No. `localStorage`/`IndexedDB` are keyed by
browser origin (scheme + host). Data written on a given Preview URL
stays on disk in that browser profile indefinitely — reopening that
*exact same URL* in the *same browser* shows it exactly as left. This
is confirmed by the existing `scripts/qa-v08-import-recovery-ui.mjs`
"reload" check and the new `scripts/qa-preview-persistence.mjs`
same-origin check added for this task.

**Why did every new Preview URL look empty, then?** Because it *was* a
new origin. I inspected the live `shaghil` Vercel project directly
(via the Vercel API) rather than assuming, and confirmed: **every push
to `shaghil-closed-pilot-ux-refinement` gets a brand-new, randomly
named deployment URL**, e.g.:

```
shaghil-oo7xjqh8b-madagibrahim-7836.vercel.app   (commit b1fa45d)
shaghil-1nzj7134b-madagibrahim-7836.vercel.app   (commit b192d4f)
shaghil-5qug8dfj4-madagibrahim-7836.vercel.app   (commit 4046754)
shaghil-6ohgcjhrd-madagibrahim-7836.vercel.app   (commit 7b65e86)
...
```

Each of these is a genuinely different browser origin. Opening the
newest one after every push — which is what the Vercel dashboard/CLI
surfaces first after a deploy — is indistinguishable from opening the
app in an incognito window every time: `localStorage`/`IndexedDB` are
correctly empty there. **This is standard Vercel/browser platform
behavior, not a SHAGHIL defect.**

## 2. Workspace Transfer audit (export/import)

`lib/workspace-transfer.mjs`, wired into the UI on both the empty
Business Brain setup screen and the Business Brain summary screen
(`index.html`, `#workspaceImportFileSetup` / `#workspaceImportFile`),
already handles exactly this move, for **all four categories the
Founder named plus Business Brain and Brand Brain**:

- `buildBundle()` serializes Business Brain + History from
  `localStorage`, and Brand Brain + Product Library + Saved Designs +
  Campaign Packs from IndexedDB (Blobs included, base64-encoded) into
  one downloadable JSON file.
- `importWorkspace()` restores every category into the destination
  origin, is **idempotent** (a stable `historyKey`/record `id` scheme
  means re-importing the same file never duplicates records), and
  **fails safely** on a malformed file (`shaghilWorkspace !== 1`)
  before writing anything.
- Per-record failures (e.g. a Blob-unfriendly browser storage mode,
  or a record that fails a store's own validation) are caught
  individually — one bad record never blocks the rest of the import —
  and tracked in a `summary` object (`brainImported`, `historyAdded`,
  `brandImported`/`brandSkipped`, `productsAdded`/`productsSkipped`,
  `visualsAdded`/`visualsSkipped`, `packsAdded`/`packsSkipped`,
  `storageBlocked`).

This is pre-existing, already-shipped work from two earlier tasks
(V0.8 Workspace Transfer, V0.10 Workspace Portability) with extensive
existing regression coverage (`scripts/qa-v08-workspace-transfer.mjs`,
`scripts/qa-v08-import-recovery-ui.mjs`, `scripts/qa-v10-workspace-portability.mjs`).
No defect was found in this audit.

## 3. Cross-origin portability — verified, not assumed

Ran the existing focused suites plus a new one written for this task
(`scripts/qa-preview-persistence.mjs`), all using two/three genuinely
separate Node processes (separate `fake-indexeddb` instances and
`localStorage` maps) to stand in for two separate browser origins —
exactly like a Founder downloading an export on one Preview URL and
uploading it on another:

- A full workspace (Business Brain, Brand Brain, Product Library with
  real image bytes, a Saved Design, a Campaign Pack, and History) moves
  **byte-for-byte** from a populated origin into a completely empty one.
- Re-importing the same export a second time is idempotent (no
  duplicate products/visuals/packs/history entries).
- A deliberately invalid record (an empty-named product) in the same
  bundle is honestly reported as skipped, not silently dropped, while
  every valid record around it still imports correctly.
- A malformed/non-SHAGHIL file, and a legacy export missing newer
  fields entirely, both fail or restore gracefully rather than
  corrupting the destination.

Zero data loss confirmed across all four categories the Founder named.

## 4. Import summary accuracy

`summaryText()` (`lib/workspace-transfer.mjs`) already renders a
single, human-readable line into the visible `.workspaceStatus`
element covering every category: Business Brain, Brand Brain,
Product Library count (+ failures), Saved Designs count (+ failures),
Campaign Packs count (+ failures), and History count, plus an explicit
note when a browser storage mode blocks Blob writes (e.g. Safari
Private Browsing) with actionable guidance. This was verified again
directly against the new deliberately-invalid-record test case in
`scripts/qa-preview-persistence.mjs`: `productsAdded: 1,
productsSkipped: 1` — accurate, not rounded up or silently merged.

## 5. Proposed stable Closed Pilot URL

I inspected the live `shaghil` Vercel project's deployments and
domains directly (Vercel API, read-only). Finding: **a stable,
auto-maintained URL for this exact branch already exists and requires
no setup**:

```
https://shaghil-git-shaghil-closed-pilot-ux-re-100e29-madagibrahim-7836.vercel.app
```

This is Vercel's built-in **Git Branch URL** — a fixed alias per Git
branch that automatically repoints to that branch's latest READY
deployment on every push, with the hostname itself never changing. I
confirmed this live: the alias currently points at commit `b1fa45d`
(the latest push), and querying the two prior deployments on this same
branch (`b192d4f`, `4046754`) shows they **no longer** hold this alias
— proving Vercel moved it forward automatically rather than it being a
one-off. **The origin never changes**, so `localStorage`/`IndexedDB`
written during one round of Founder QA will still be there on the very
same URL after the next push, with no export/import needed at all
during same-pilot iteration.

**Recommendation:** use that URL (not the fresh per-deployment URL
Vercel prints after each deploy) for all Closed Pilot QA going
forward. No code change, no new deployment, no cloud storage,
authentication, or database is required — this is a pre-existing
Vercel platform feature, currently just unused.

Two caveats worth flagging to the Founder directly:
- The project has SSO Protection enabled for all non-custom-domain
  deployment URLs (`ssoProtection.deploymentType:
  "all_except_custom_domains"`), so this `.vercel.app` alias still
  requires being logged into the Vercel team to open — fine for the
  Founder, but relevant if a non-Vercel-account tester needs access.
- If a friendlier/shorter custom domain (e.g. a `pilot.` subdomain) is
  wanted instead, that requires adding and assigning a domain in
  Vercel project settings — a live platform change I have not made and
  will only make with explicit Founder approval, per this task's
  constraints.

## 6. No cloud storage, auth, or new database introduced

Confirmed: no such change was made or proposed. The stable-URL
recommendation above is a Vercel routing feature, not a data-layer
change, and the workspace-transfer path already in production remains
the correct tool for moving data across a genuinely different origin
(e.g., a totally new browser/device, or eventually into Production).

## QA results

- Full regression suite (`npm run qa`): **80 PASS, 0 FAIL**, exit code 0
  (4 new PASS lines added by `scripts/qa-preview-persistence.mjs`,
  everything else unchanged and still green).
- New focused test `scripts/qa-preview-persistence.mjs`: same-origin
  persistence, cross-origin zero-loss transfer of all four Founder-named
  categories, honest failure reporting, and idempotent re-import — all
  passing.
- No code defect was found in the persistence or workspace-transfer
  layers; this task's only code change is the new focused test itself.

## Files changed

- `scripts/qa-preview-persistence.mjs` (new)
- `scripts/qa.mjs` (wires in the new test)
- `SHAGHIL_PREVIEW_PERSISTENCE_AUDIT.md` (this document)

No production-facing code was changed.
