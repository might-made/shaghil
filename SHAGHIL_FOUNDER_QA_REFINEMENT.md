# SHAGHIL — Founder QA Findings: Final Refinement Before Lock

**Status: IMPLEMENTATION COMPLETE — do not lock, do not merge, do not start another phase.**

Scope: exactly the three Founder Live QA findings below. No engine, navigation, backend architecture, auth, billing, dashboard, redesign, or unrelated feature was touched.

## Starting SHA

`0c5203bfc6da0218e86cf31cad227b2a501914e0` on branch `shaghil-product-implementation` (local = remote, working tree clean, before any change in this pass).

---

## FINDING 01 — Campaign output was too long

### Root cause
`renderResult()` (index.html) always renders the full generated Markdown as one continuous block into `#out`. A pre-existing, already-Founder-approved mechanism in `lib/visual-studio.mjs` — `splitIdeas()` + `renderCards()` — already turns multi-item text into scannable per-item cards with a collapsed `<details><summary>تفاصيل</summary>...</details>` interaction and an "اصنع التصميم" action per card, but `renderCards()` only activated this for the `content` engine (`items=current==='content'?splitIdeas(lastText):[]`). `campaign` was excluded, so a 7-day campaign always rendered as one long scroll.

### Implementation
`lib/visual-studio.mjs` — `renderCards()`:
- Extended the eligible-engine check to `['content','campaign'].includes(current)`, reusing the exact same, already-tested `splitIdeas()`/card/`تفاصيل` mechanism — no new parsing logic, no new interaction pattern.
- Added campaign-only handling for the strategic overview: `splitIdeas()` returns only the per-day chunks, so any text before the first day (`big_idea`/`campaign_line`/etc.) would otherwise be silently dropped from card view. It is now captured (`lastText.indexOf(items[0])`) and shown in full (never truncated) in a persistent, always-visible overview card at the top of the list, styled with the existing generic `.card` class — zero new CSS.
- No change to `splitIdeas()`, `itemSummary()`, `choose()`, or the `content` engine's existing behavior.
- No change to the campaign-generation API contract (`ENGINE.campaign` in `api/generate.mjs` is untouched) — this was a pure presentation-layer reuse, not "absolutely necessary" to touch the contract.

### Result
Default view: campaign overview + one scannable card per day (platform/objective/idea preview via the existing `itemSummary()` heuristics, generic fallback to first lines when no explicit labels are found). Full, complete original day content is preserved verbatim inside each card's `تفاصيل`, expandable instantly with zero network requests. "اصنع التصميم" remains one click away on every card, still opening Visual Studio seeded with that exact day's content (verified). A short/sparse campaign (fewer than 2 detectable items) falls back to the original single-block view, unchanged — no regression, no content loss either way.

---

## FINDING 02 — Output quality still read as generic

### Root cause (investigated, not guessed)
Traced the full context pipeline from storage to prompt:
- Business Brain (`name/category/product/customer/location/price/tone/objective`) already reaches `/api/generate` and is enforced as authoritative — confirmed working.
- **Brand Brain was never sent to `/api/generate` at all.** `api/visual.mjs` (image generation) already requires and sends a full `brand` object (`BRAND BRAIN: ${JSON.stringify(task.brand)}` in `makePrompt()`), but `api/generate.mjs`'s `normalizeRequest()` had no `brand` parameter whatsoever — text generation was structurally unable to reflect the saved brand voice/style, however specific the Founder made it.
- The system prompt (`BASE` in `api/generate.mjs`) is heavily weighted toward **not fabricating** facts (8 of 16 lines are guardrails against invention) but never explicitly instructed the model to **actively ground** its angle/vocabulary/offer/CTA in the *specific* supplied facts — a real, generic-across-all-engines gap, not specific to one business.

### Implementation
- `api/generate.mjs`: `normalizeRequest()` now accepts an optional `body.brand.style` (cleaned/capped like every other text field, defaults to `''`, never required — fully backward compatible with every existing caller that sends no `brand` at all). When non-empty, it is included in the prompt input as a `BRAND VOICE / STYLE` section; when empty/absent, no such section is sent (no fabrication).
- `BASE` gained one new, fully generic instruction: *"Ground every output in the specific facts supplied for this business — the exact product/service, the exact customer, the exact location/market, and the exact tone or brand style — so the result reads as clearly written for this one business rather than interchangeable generic marketing... When a brand voice/style is supplied, let it visibly shape vocabulary, phrasing register and offer framing, not just the business name."* This applies identically to any business/brand — verified with two different businesses in the focused QA (نجوب and a second, unrelated بيت التمر fixture) to confirm nothing is hard-coded.
- `lib/visual-studio.mjs`: added `brandStyle()`, a small read-only bridge (`store.loadBrand()`, capped, best-effort — returns `''` on any storage failure, never throws) exposed via `globalThis.Visual.brandStyle`, since the classic script has no module import into `visual-storage.mjs`.
- `index.html`: added a **synchronously-read cache** (`cachedBrandStyle`), refreshed fire-and-forget whenever `openEngine()` or `home()` runs. `generate()` reads this cache synchronously when building the request. This was a deliberate design choice over `await`-ing the brand lookup directly inside `generate()`'s hot path — see "regression avoided" below.

### Regression avoided
An initial implementation awaited the brand lookup directly inside `run()`/`generate()` before the network call. This is functionally correct but broke `scripts/qa-v05.mjs`'s existing duplicate-request-protection test (`assert.equal(requests.length,inFlight)` at line 105), because it delayed exactly when the `busy` guard's synchronous invariant vs. the mocked `fetch`'s synchronous side effect could be observed — an off-by-one in the request count appeared under the test's tight timing assumptions. Rather than weaken or rewrite that assertion, the implementation was changed to the cache-based approach above, which keeps `generate()`'s `busy` guard and request dispatch exactly as synchronous as before. **No test assertion was altered to manufacture a pass** — the existing suite passes unmodified.

---

## FINDING 03 — Internal technical keys exposed in the UI

### Root cause
`api/generate.mjs` returns one free-form Markdown string (`{text, model}`) — there is no structured JSON contract for text engines. `ENGINE.whatsapp`'s instruction literally told the model: *"Output recommended_reply, short_reply and follow_up."* Since the model follows instructions closely and the only rendering step is `md()` (Markdown → HTML) with no field-to-label translation for text engines, the model reproduced these literal English snake_case names as headings, which flowed unmodified into the customer-facing Arabic result. Confirmed via repo-wide search: these three strings appeared **only** in that one prompt string — no other code parses or depends on them, so both a prompt fix and a display-time safety net were safe to add.

Searched all other user-facing result renderers: there is exactly one shared renderer (`renderResult()`/`md()`) used by all six engines, and one existing, already-correct precedent for this exact class of problem — `brainLabels` (an object-map with `label||key` fallback, used for Business Brain field display). No other raw technical key leak was found in any other engine's current instructions; per "fix only genuine user-facing leakage," none of the other five engines were touched.

### Implementation (two layers, both scoped to exactly this leak)
1. **Root cause, `api/generate.mjs`**: `ENGINE.whatsapp` rewritten to instruct the model to use the exact Arabic headings ("الرد المقترح", "رد مختصر", "متابعة") directly, with no English section names or raw identifiers — stops the leak at generation time for all new output. The existing, unrelated missing-product-detail guardrail sentence is preserved verbatim.
2. **Presentation-layer safety net, `index.html`**: a small `rawKeyLabels` map (following the exact `brainLabels` precedent) plus `translateRawKeys()`, applied inside `renderResult()` before both display and `lastText` assignment. It matches only a full line consisting of the raw key (optionally wrapped in `#`/`*`/`-`/`>`/whitespace/`:`), case-insensitively — never touching the word if it appeared inline within unrelated prose. This covers: (a) any occasional model slip back to English, and (b) **pre-fix saved history entries that already contain the raw literal keys** — since the translation runs every time `renderResult()` displays text (fresh generation or `openHistory()` reopen alike), old saved entries now display correctly too, with **zero data migration** — the underlying stored record is left exactly as it was.

### Result
`recommended_reply`/`short_reply`/`follow_up` never reach the user, in fresh generations or reopened legacy history. Unrelated content (any text with no raw keys) passes through `renderResult()` byte-for-byte unchanged, verified directly.

---

## Runtime files changed

- `api/generate.mjs` (+13/-5 lines) — grounding instruction, whatsapp Arabic-label instruction, optional `brand.style` plumbing.
- `lib/visual-studio.mjs` (+21/-2 lines) — campaign card rendering + overview preservation, `brandStyle()` bridge.
- `index.html` (+17/-5 lines, single-line minified script edits) — `cachedBrandStyle`/`refreshBrandCache()`, brand attached in `generate()`, `translateRawKeys()` applied in `renderResult()`.

## Test files changed

- `scripts/qa.mjs` (+2 lines) — wires the new focused suite into `npm run qa`.
- `scripts/qa-founder-refinement.mjs` (new) — the focused regression for all three findings (22 assertions across server-side prompt content and a real JSDOM-driven controller).

## Automated QA results

- `npm run qa` (full persisted suite, now 16 scripts): **51 PASS, 0 FAIL**, exit 0.
- Every script also re-run individually (`node scripts/qa-*.mjs`) to rule out cross-script interference: all pass.
- **Zero existing test assertions were modified.** The one regression this pass surfaced (the busy-guard timing issue above) was fixed in the implementation, not by weakening the test.

## Focused QA results (`scripts/qa-founder-refinement.mjs`)

**A. Campaign result** — PASS: overview card always visible and complete; one card per day with platform/objective/idea preview; `تفاصيل` collapsed by default (`hasAttribute('open')===false`); expanding shows the exact, complete original day text; zero network requests from expand/collapse; primary action present on every card; specific-day handoff into Visual Studio verified (`visualSource` matches the exact clicked day, not the whole plan); back-navigation returns to the campaign result; short/sparse campaigns and other engines fall back to the unchanged single-block view.

**B. Contextual quality** — PASS: a supplied Brand Brain style reaches the generation prompt verbatim; no `brand` supplied (every pre-existing caller) never fabricates a brand section; blank/whitespace-only style degrades to no section (never invented); the grounding instruction is present in `instructions` for all six engines; verified generic across two different, unrelated businesses (no hard-coding to any one test account, MIGHT MADE included).

**C. Presentation labels** — PASS: `recommended_reply`/`short_reply`/`follow_up` never appear in rendered output (case-insensitive, heading or bold-inline forms); Arabic labels render correctly in their place; a synthetic pre-fix legacy history entry (raw keys embedded) displays translated on reopen while its stored `localStorage` record remains byte-identical (no migration); unrelated text with no raw keys passes through completely unchanged; the `{text, model}` API response contract is unchanged.

## Screenshots captured

`/tmp/claude-0/-home-user-shaghil/37617476-08a9-524a-a715-a5010d41ee18/scratchpad/shots-refinement/`:
- `01-campaign-collapsed-default.png` — desktop, default scan-first state (overview + 5 collapsed day cards).
- `02-campaign-expanded-detail.png` — desktop, one day's `تفاصيل` expanded, full original content visible.
- `03-campaign-mobile.png` — 375px width, single-column, no horizontal overflow (verified programmatically: `scrollWidth <= clientWidth`).
- `04-whatsapp-arabic-labels.png` — customer-reply result showing "الرد المقترح" / "رد مختصر" / "متابعة", zero raw keys visible (verified programmatically on the rendered text).

## Known limitations

- Finding 01's per-card summary (platform/objective/idea) depends on the model's actual output containing recognizable labels or day/heading structure; when it doesn't, the existing generic fallback (first few lines) is used — this is pre-existing `itemSummary()` behavior, unchanged, not a new limitation introduced here.
- Finding 02's grounding is an instruction-level improvement, not a guarantee — actual output quality still depends on the live model's behavior, which could not be verified against a real OpenAI response in this sandboxed environment (no `OPENAI_API_KEY`); the fix was verified structurally (the right context reaches the right place in the prompt) rather than by judging live generated prose.
- Finding 03's presentation-layer safety net is intentionally conservative (whole-line match only) to avoid mistranslating legitimate content; it covers exactly the three reported raw keys, not a general-purpose key-leak scanner.

## Confirmation: no unrelated scope was added

No navigation, engine list, backend architecture, authentication, billing, dashboard, AI-prompt behavior for the other five engines, campaign generation contract, export/import, Product Library, Saved Designs, or design-system file was touched. `git diff --stat` against the starting SHA shows exactly the four files listed above, plus the one new test file — nothing else.
