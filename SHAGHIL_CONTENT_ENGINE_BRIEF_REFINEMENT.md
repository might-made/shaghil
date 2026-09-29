# SHAGHIL — Content Engine ("سوّ محتوى") Campaign Brief Refinement

**Status: IMPLEMENTATION COMPLETE — AWAITING FOUNDER REVIEW.** Implemented on the current development branch only. Not merged, not deployed.

**Branch:** `shaghil-closed-pilot-ux-refinement` (continued from the Closed Pilot UX refinement work already on this branch).

---

## Founder QA findings addressed

1. The content engine exposed only the number-of-days field.
2. Users could not configure audience, objective, channels, tone, or CTA, despite the engine already producing a day-by-day plan.
3. Previous tests exposed internal English field names in customer-facing outputs (the whatsapp engine fix from the prior refinement) — this task's explicit output requirements guard against the same class of leak recurring in the newly-expanded content engine.

## Implementation

### New optional controls (سوّ محتوى form)
- **الفترة (Number of days)** — unchanged, existing control preserved exactly.
- **هدف الحملة (Campaign objective)** — a `<select>` with awareness / leads / engagement / launch / a "هدف آخر (حدده)" custom option that reveals a text field, plus a default "تلقائي من هدف مشروعك" (falls back to Business Brain's objective).
- **الجمهور المستهدف (Target audience)** — editable text, pre-filled from Business Brain's `customer` field.
- **قنوات النشر (Publishing channels)** — a native multi-select (`<select multiple>`) offering Instagram/LinkedIn/TikTok/X, plus a separate "قنوات أخرى" free-text field for anything else; both flow to the model together.
- **نبرة المحتوى (Tone of voice)** — editable text, pre-filled from Business Brain's `tone` field; Brand Brain's saved style continues to reach every generation automatically via the existing brand-context mechanism (from the prior Founder QA Refinement), independent of this field.
- **دعوة لاتخاذ إجراء رئيسية (Main CTA)** — editable text, optional.
- **تعليمات إضافية (Additional instructions)** — optional multiline field.

All seven new fields are fully optional; only `period` retains its existing default/validation. Business Brain and Brand Brain data reach generation automatically regardless of what is or isn't filled in.

### Server-side (`api/generate.mjs`)
- `FIELDS.content` extended with the eight new field names (`contentObjective`, `contentObjectiveCustom`, `contentAudience`, `contentChannels`, `contentChannelsCustom`, `contentTone`, `contentCTA`, `contentInstructions`), each cleaned/capped exactly like every existing text field — no new validation, no new required fields.
- `ENGINE.content`'s prompt fully rewritten to: (a) consume every new field when present, with each one gracefully falling back to Business Brain / Brand Brain / a sensible default when blank; (b) require a per-day structure using **exactly** six named Arabic labels — "المنصة", "الهدف", "نوع المحتوى", "الفكرة", "النص الجاهز للنشر", "دعوة لاتخاذ إجراء" — mapping onto the requested day/platform/objective/format/idea/caption/CTA structure; (c) explicitly forbid English field names, raw identifiers, JSON, curly braces or code syntax anywhere in the output.

### Client-side (`index.html`)
- The content engine's form (`openEngine('content')`) builds all eight controls, using `content`-prefixed element IDs throughout — this was a deliberate choice after discovering the Business Brain screen already owns un-prefixed ids like `tone`/`objective`/`customer`, which would otherwise silently collide with a naively-named new field (a real bug caught and avoided during implementation, not observed in production).
- `run()`'s generic field-collector gained one small, reusable addition: a multi-`<select>` now has its selected values joined into the field's value automatically (`fieldValue()`), rather than only reading `.value` (which a browser limits to the first selected option) — this is a generic capability, usable by any future multi-select field, not a content-engine-specific hack.
- No change to `generate()`, `saveResult()`, `openHistory()`, `choose()`, `splitIdeas()`, or `renderCards()` — the existing per-day card view (with collapsed "تفاصيل" and an "اصنع التصميم" handoff per day) already worked for the content engine and required no changes to correctly render the richer, more structured seven-day output.

## Output requirements verification

- Real end-to-end testing (mocked model response, since no `OPENAI_API_KEY` exists in this environment) confirms the rendered plan shows only the six required Arabic labels per day, in Arabic, with **zero** English field names, JSON, curly braces, or raw identifiers anywhere in the primary (card-summary) view.
- The exact required CTA text, when supplied, appears verbatim, once per day, across all seven days.
- Backward compatibility: a content-engine history entry saved before this refinement (only a `period` input, none of the new fields) still reopens and renders correctly with no error — confirmed directly.

## Known, pre-existing, unchanged characteristic (disclosed, not introduced by this task)

Expanding a day's "تفاصيل" panel shows that day's **raw original text**, including its leading `##` Markdown heading marker — this is the same `renderCards()` mechanism already shared with, and previously approved for, the campaign engine (from the earlier Founder QA Refinement), unchanged here. The *primary* card view a user sees by default is fully clean; only the opt-in, click-to-expand full-text panel carries this pre-existing minor artifact. Fixing it would mean modifying the shared `renderCards()`/`itemSummary()` code used by both the content and campaign engines — explicitly out of scope for this content-engine-only task ("Preserve existing... behavior"; "No new engines... or unrelated features"). Flagging this for a future, separately-scoped decision rather than silently expanding this task's boundaries.

## Files changed

- `api/generate.mjs` — extended `FIELDS.content` and rewrote `ENGINE.content`'s prompt.
- `index.html` — new form controls, `fieldValue()` multi-select support in `run()`.
- `scripts/qa.mjs` — wires in the new focused suite.
- `scripts/qa-v05.mjs` — `cases.content` fixture extended with the new (blank) optional fields, since that test's structural check (`number of form controls === number of fixture keys`) needed the fixture to reflect the now-larger form; the invariant itself (form renders the fields the fixture expects) is unchanged.
- `scripts/qa-content-engine-brief.mjs` (new) — the focused regression for this refinement.

## Automated QA results

`npm run qa` (now 19 scripts): **64 PASS, 0 FAIL**, exit 0. Every script also re-run individually — all pass. No existing regression assertion's *meaning* was changed.

## Focused QA (`scripts/qa-content-engine-brief.mjs`)

- Every new field reaches the generation prompt when supplied; every optional field left blank never blocks generation.
- The prompt itself is verified to require the six Arabic labels and to explicitly forbid English field names/JSON/raw identifiers; the old literal English field-listing instruction is confirmed gone.
- Form structure: all eight controls present, the custom-objective field starts hidden, channels support multiple selections, audience/tone are pre-suggested from Business Brain, and none of the new fields are marked required.
- **The exact Founder MIGHT/AUDIT scenario**: audience "أصحاب الأعمال ومدراء التسويق في السعودية والخليج", channels Instagram + LinkedIn, a custom awareness+leads objective, the exact required CTA, and an instruction to avoid invented prices/discounts/guarantees — verified end-to-end: both channels reach the request, the CTA reaches the request verbatim, all seven days render as seven complete cards, and no English/JSON/raw-identifier artifact appears anywhere in the rendered output.
- The "اصنع التصميم" → Visual Studio handoff still targets the exact selected day; back-navigation still returns to the content result.
- Save-to-history and reopening from history are unchanged and still render the full plan.
- A legacy (pre-refinement) history entry with only a `period` input still reopens correctly.

## Screenshots

`/tmp/claude-0/-home-user-shaghil/37617476-08a9-524a-a715-a5010d41ee18/scratchpad/shots-content-brief/`:
- `01-desktop-form.png` / `02-desktop-form-filled.png` — the new form, empty and filled with the MIGHT/AUDIT scenario.
- `03-desktop-result.png` — all seven days rendered as scannable cards.
- `04-desktop-result-expanded.png` — one day's تفاصيل expanded, showing the full Arabic-labeled content and the verbatim CTA.
- `05-mobile-form.png` / `06-mobile-result.png` — 375px width, confirmed no horizontal overflow.

## Version control

- Continued on branch `shaghil-closed-pilot-ux-refinement`.
- No protected branch (`main`, `shaghil-v0.9`, `shaghil-product-closure`, `shaghil-brand-final`, `shaghil-design-system`) touched.
- Not merged. Not deployed to production.
