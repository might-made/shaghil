# SHAGHIL Implementation Baseline

**PHASE 0 — BASELINE RECONCILIATION & IMPLEMENTATION BRANCH SETUP — COMPLETE**

This document is the source-of-truth map for the upcoming SHAGHIL Product Implementation phase. No implementation work has been done — this branch's product/runtime code is byte-for-byte identical to its source branch.

## A. Product/runtime source-of-truth branch + SHA

`shaghil-product-closure` @ `1b2b3f5d53c388db9dfb0f030b7b250bddbaac55` — this branch (`shaghil-product-implementation`) was created directly from this exact commit and has not diverged from it.

## B. Founder-validated V0.9 product-code SHA

`08253a8d14976ca7639fac54aa1c4d69312cb713`

## C. Locked design-system source

`shaghil-design-system` @ `6df58d2c17679b4e63e76b9e55983b54db1b4944`

## D. Locked brand source

`shaghil-brand-final` @ `4ed4cae13707498f3cd4e5c43de7f95b4bbce386`

## Baseline decision — evidence

Every sibling branch was inspected and compared by code diff, not by name or assumption.

**Branch/SHA inventory (all fetched and verified against `origin`):**

| Branch | SHA |
|---|---|
| `main` | `4f7c3ecc0389f8dd745f5015b7c95b3d5570975b` |
| `shaghil-v0.5` | `35c118a2befa8d0630f3ec3445874679c997d933` |
| `shaghil-v0.6` | `6a1064958930a1b8bec04a60de6344e0c1f75bff` |
| `shaghil-v0.7` | `16dfe7b6b388f2996f3b19bf0dda05fd9a5fb51d` |
| `shaghil-v0.8` | `af343360902a2e1717c17b3d1cdbb568b00668cb` |
| `shaghil-v0.9` | `d8d70fc692378633b5c1afde19920b83f0d081af` |
| `shaghil-final-audit` | `f06775b56780396d331dfb96597225cb75a21298` |
| `shaghil-product-closure` | `1b2b3f5d53c388db9dfb0f030b7b250bddbaac55` |
| `shaghil-brand-final` | `4ed4cae13707498f3cd4e5c43de7f95b4bbce386` |
| `shaghil-design-system` | `6df58d2c17679b4e63e76b9e55983b54db1b4944` |
| `shaghil-product-implementation` (this branch) | `1b2b3f5d53c388db9dfb0f030b7b250bddbaac55` |

**Ancestry proven, not assumed:**
- `main` is the single-commit historical starting point ("Add files via upload") — it is an *ancestor* of `shaghil-v0.9`, not a sibling or successor. Diffing `main` against `v0.9` shows entire missing capability (no `lib/visual-studio.mjs`, `lib/product-library.mjs`, `lib/background-removal.mjs`, `lib/workspace-transfer.mjs`, `lib/campaign-export.mjs`, `lib/campaign-packs.mjs`, `lib/visual-canvas.mjs`, `lib/visual-storage.mjs`, no `api/visual.mjs`) — 873 lines added since `main`, across 12 files. **`main` is not a viable candidate.**
- `shaghil-v0.9` (`d8d70fc`) = the cited Founder-validated `08253a8` **plus exactly one documentation-only commit** (`docs: freeze Founder-approved V0.9 after live QA`, touching only `V0.9.md`). Confirmed via `git diff --stat 08253a8..d8d70fc` → 1 file changed, `V0.9.md` only. The product/runtime code at the `shaghil-v0.9` branch tip is therefore identical to the cited validated SHA.
- `shaghil-final-audit` (`f06775b`) and `shaghil-product-closure` (`1b2b3f5`) are **siblings**, not a chain — both branch directly from `shaghil-v0.9` tip (`git merge-base` of the two returns `d8d70fc` exactly). `shaghil-final-audit` is *not* an ancestor of `shaghil-product-closure`.
- `shaghil-final-audit` adds exactly one file, `FINAL_PRODUCT_AUDIT.md` (152 lines) — a pure audit report, zero code changes of any kind.
- `shaghil-product-closure` adds `PRODUCT_CLOSURE.md`, `scripts/qa-product-closure-export-warning.mjs`, one line to `scripts/qa.mjs`, and exactly **one changed line in `index.html`** — confirmed by direct diff to be a single additive `<p class="status">` sensitivity-notice sentence inserted into the Business Brain workspace-export section. No function, handler, onclick binding, or existing markup was removed or altered; `Workspace.export()`/`Workspace.import()` remain byte-identical.

## B. Product-runtime comparison findings

`shaghil-product-closure` is a strict superset of `shaghil-v0.9`'s validated runtime: **zero removed capability, one small additive UI-copy line, plus one new companion QA script.** `shaghil-final-audit` is documentation-only and contains no capability `shaghil-product-closure` lacks. `main` predates the entire Visual Studio/Product Library/workspace-transfer/background-isolation feature set and was excluded on code evidence, not name.

## C. Selected product baseline branch + exact SHA

**`shaghil-product-closure` @ `1b2b3f5d53c388db9dfb0f030b7b250bddbaac55`**

## D. Why this baseline is correct

1. It is the most recent branch that is a direct, unbroken descendant of the Founder-validated `08253a8` V0.9 code (via `d8d70fc`, itself a docs-only step).
2. Its only code change beyond that validated state is one Founder-approved, additive, non-behavioral UI-copy line (documented in its own `PRODUCT_CLOSURE.md` as the resolved P1 finding from `FINAL_PRODUCT_AUDIT.md`).
3. `shaghil-final-audit`, its sibling, adds no code at all — choosing it would forgo the closure fix for no gain.
4. Direct code inspection (file listing, grep, and diff — not branch naming) confirms every required capability is concretely present: `lib/visual-studio.mjs`, `lib/product-library.mjs`, `lib/background-removal.mjs`, `lib/workspace-transfer.mjs`, `lib/campaign-export.mjs`, `lib/campaign-packs.mjs`, `lib/visual-canvas.mjs`, `lib/visual-storage.mjs`, `api/visual.mjs`, `api/generate.mjs` all present; all 6 engines (`content`, `copy`, `offer`, `whatsapp`, `campaign`, `reel`) present in `index.html`; `Business Brain` (11 references), `Brand Brain` (2), `Visual.saveProject`/the `visualStudio` section/its script include, `Workspace.export`/`Workspace.import`, `saveResult`/`historyScreen`/`openHistory`, and `variant('background')` (Change Background) all concretely present.

## E. Product capabilities that must survive implementation

Business Brain; Brand Brain; all six engines (سوّ محتوى / اكتب لي / ابنِ عرض / رد على عميل / سوّ حملة / اكتب Reel) and their generation/refinement flow; Save to History; History reopen/reuse; workspace recovery/import/export (byte-for-byte cross-origin transfer); Visual Studio; Product Library; client-side product-background isolation; EXACT-fidelity product compositing (the product image is never sent to the generation model, and the isolated product — never a raw/stale rectangle — is what gets composited and saved); Change Background; exact-product preservation; and the Business Brain workspace-export sensitivity notice added in this baseline.

## F. Locked design systems that must be applied

SHAGHIL Master Wordmark (logo, geometry frozen); Graphite Pulse (color, tokens frozen); IBM Plex Sans Arabic + IBM Plex Sans (typography, scale/weights/line-heights frozen); the Founder-approved Product Design System (spacing, radius, borders, elevation, component grammar, AI-state language, iconography rules, RTL/bilingual rules, responsive behavior — all frozen at `6df58d2`).

## G. Explicit rule

**IMPLEMENTATION MAY CHANGE PRESENTATION. IT MUST NOT SILENTLY CHANGE VALIDATED PRODUCT BEHAVIOR.**

Any apparent behavior change surfaced during implementation must be raised explicitly for Founder decision — never absorbed silently as a side effect of a visual/presentation change.

## H. Discrepancies found between V0.9, final-audit, and product-closure

None that affect capability. The only functional-adjacent discrepancy is the one intentional, Founder-approved, additive sensitivity-notice line in `shaghil-product-closure` (absent from `shaghil-v0.9` and `shaghil-final-audit`), which is a documented fix, not a regression or an unexplained divergence. `shaghil-final-audit` and `shaghil-product-closure` diverge only in that the former lacks this fix and the latter's QA scripts; neither removes anything the other has.

## Regression / QA result

The full existing regression suite was run against a clean, isolated worktree of `shaghil-product-closure` (dependencies installed fresh via `npm install`, matching its own `package.json`) — every script, covering V0.5 through V0.9 plus the product-closure change itself:

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

**14 of 14 scripts pass. Zero failures. Zero "FAIL" strings in any output.** The worktree used for this run was created and destroyed for verification only — no branch other than `shaghil-product-implementation` was modified.

## Files in this baseline

Product/runtime files are unchanged from `shaghil-product-closure` — `index.html`, `lib/*.mjs`, `api/*.mjs`, `package.json`, `package-lock.json`, `vercel.json` are all byte-identical to that branch's tip. This document (`SHAGHIL_IMPLEMENTATION_BASELINE.md`) is the only file added by this phase.

## Protected branches (untouched, unmerged)

`main`, `shaghil-v0.5`, `shaghil-v0.6`, `shaghil-v0.7`, `shaghil-v0.8`, `shaghil-v0.9`, `shaghil-final-audit`, `shaghil-product-closure`, `shaghil-brand-final`, `shaghil-design-system`. None were modified or merged as part of this phase.

## Next step

**SHAGHIL PRODUCT IMPLEMENTATION — PHASE 1: FOUNDATION INTEGRATION.**

Not started. Awaiting explicit Founder approval before Phase 1 begins.
