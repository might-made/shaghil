# SHAGHIL — Content Plan Display Fixes (Markdown rendering, expanded reading, sticky nav)

**Status: IMPLEMENTATION COMPLETE — AWAITING FOUNDER REVIEW.** Implemented on the current development branch only. Not merged, not deployed.

**Branch:** `shaghil-closed-pilot-ux-refinement` (continued).

---

## FINDING 01 — Raw Markdown syntax visible inside expanded day details

### Root cause
`renderCards()` (`lib/visual-studio.mjs`) built each day's "تفاصيل" panel with `full.textContent=item` — the raw AI-generated text, including its `###`/`**`/`-` Markdown syntax, dumped as plain text. The app already has a proven, safe Markdown-to-HTML renderer, `md()` (used for the main `#out` result view and already escaping HTML before applying any transform), but `renderCards()` never used it for the detail panels.

### Fix
`full.innerHTML=md(item)` instead of `full.textContent=item`. `md()` is a top-level `function` declaration in the classic script, and classic-script top-level function declarations are visible as shared globals to the module script in the same page (confirmed directly before relying on it) — exactly the same mechanism this codebase already relies on for `current`/`lastText` etc. No change to `md()` itself, no change to generation, no change to the `/api/generate` response contract — the stored/returned text is identical; only how it is *displayed* changed.

## FINDING 02 — Expanded details cramped with internal scrolling

### Root cause
`.ideaCard details{white-space:pre-wrap;max-height:300px;overflow:auto}` squeezed the full day content into whichever narrow grid column (1 of 3 on desktop) the card happened to occupy, inside a fixed 300px scrollbox.

### Fix
- `.ideaCard:has(details[open]){grid-column:1/-1}` — when a card's تفاصيل is open, the **card itself** (the actual CSS grid item) now spans the full row width. (An earlier draft of this rule targeted the nested `<details>` element directly; `grid-column` has no effect on a non-grid-item, which a real-browser screenshot caught immediately — the rule now correctly targets `.ideaCard`.)
- The fixed `max-height`/`overflow:auto` scrollbox is removed entirely; the rendered detail (now real HTML from Finding 01's fix) flows naturally using the page's own scroll.
- Collapsed cards are completely unaffected — the seven-day overview grid and every existing action (اصنع التصميم, تحميل, etc.) are unchanged.

## FINDING 03 — Sticky global navigation overlapping content during scrolling

### Diagnosis
Traced two genuine, code-level contributing causes — not a guess:

1. **Screen switches never reset scroll.** `show(x)` (the shared function toggling every top-level screen) only ever did `ids.forEach(i=>$(i).classList.toggle('hidden',i!==x))`. This exact bug class was already found and fixed **once**, narrowly, inside Visual Studio's own `display()` function, with this exact comment already in the codebase: *"Visual Studio can be scrolled far down...; the result screen is much shorter, and show() only toggles .hidden without resetting scroll. Without this, the leftover scroll offset can land mid-page on entry, putting the sticky header's band over the generated image."* That fix was never generalized — every other screen transition (opening an engine form, landing on a generated result, reopening from History, etc.) still lacked it, which is exactly where the Founder is now seeing it on the Content Plan result.
2. **The internal detail scrollbox (Finding 02)** could scroll-chain into the outer page once it hit its own boundary, compounding the same visual effect while reading a long expanded day.

### Fix
Moved the scroll reset into the shared `show()` function itself, so **every** screen switch resets scroll consistently — not just Visual Studio's result screen:
```js
const show=x=>{ids.forEach(i=>$(i).classList.toggle('hidden',i!==x));scrollTo(0,0)};
```
The now-redundant explicit `scrollTo(0,0)` call inside `display()` was removed (the generic fix already covers it). No navigation architecture changed — the nav bar, its destinations, and how screens are reached are all untouched; only a missing, already-precedented scroll reset was generalized. Finding 02's removal of the internal scrollbox independently removes the scroll-chaining contributor.

### A note on verification method for this specific finding
The exact visible "header floats over mid-page content" moment could not be reliably forced through Playwright automation in this sandbox: modern Chromium's scroll-anchoring heuristics actively try to preserve visual position across DOM changes, which partially masks the raw symptom in an automated headless run even on the pre-fix code. This does not weaken the diagnosis — the root cause (a missing scroll reset, proven present in one screen and absent everywhere else by direct code inspection) and the fix are verified with certainty by two other means: (a) a direct regression test asserting `scrollTo` is actually invoked on every screen switch (see below), and (b) the removal of the internal scrollbox, independently verified by the Finding 02 screenshots.

---

## Files changed

- `lib/visual-studio.mjs` — `md(item)` instead of raw text for تفاصيل; removed the now-redundant explicit `scrollTo(0,0)` in `display()`.
- `index.html` — moved scroll reset into the shared `show()`.
- `styles/components.css` — replaced the old fixed-height/scrollbox rule with the full-width-when-open rule (correctly targeting the card, not the nested details).
- `scripts/qa.mjs` — wires in the new focused suite.
- `scripts/qa-v05.mjs` — added a `scrollTo` no-op stub to its minimal hand-built VM context (that test's DOM mock never had one; the new `show()` behavior needs it to exist, exactly like jsdom already provides one elsewhere).
- `scripts/qa-founder-refinement.mjs` — one assertion updated: it previously expected a day's detail panel's `.textContent` to exactly equal the raw source text. This is legitimately obsolete because of Finding 01's exact fix (rendering real HTML instead of raw text means `.textContent` concatenates each rendered line without the original newlines/Markdown syntax between them). The assertion now verifies every line's own text is still present (nothing lost) and that no raw `##` syntax remains visible — a stronger, more correct check than the one it replaces, since it now directly enforces Finding 01's requirement in the campaign-engine test too.

## Automated QA results

`npm run qa` (now 20 scripts): **70 PASS, 0 FAIL**, exit 0. Every script also re-run individually — all pass.

## Focused QA (`scripts/qa-content-plan-display.mjs`)

- CSS source check: the old fixed-height/scrollbox rule is gone; the new full-width-when-open rule correctly targets `.ideaCard:has(details[open])`.
- Expanding تفاصيل on AI-generated text containing `###` headings, `**bold**` and `- bullet` lines renders real `<h3>`, `<strong>` and `<ul>/<li>` elements — zero raw Markdown syntax visible — with every piece of the original content still present (nothing lost).
- The expanded card's own computed `grid-column` is `1/-1` (full width) while open; the multi-day overview and every existing action remain intact and unaffected.
- Expanding/collapsing تفاصيل triggers zero network requests.
- Every relevant screen switch (opening an engine form, landing on a generated result, reopening from history) is confirmed — via a `scrollTo` spy — to reset scroll.
- Content Engine fields, generation, the Visual Studio handoff, and save-to-history are all unchanged; the *stored* history text is confirmed to still contain the raw `###`/`**` exactly as generated (only rendering changed, never the stored data or the API contract).

## Screenshots

`/tmp/claude-0/-home-user-shaghil/37617476-08a9-524a-a715-a5010d41ee18/scratchpad/shots-display-fix/`:
- `before-desktop-02-expanded.png` — raw `##`/`###`/`**` visible, detail squeezed into a narrow column.
- `after-desktop-02-expanded.png` — clean rendered Arabic headings/bold/list, full row width, six-day overview intact around it.
- `before-mobile-02-expanded.png` / `after-mobile-02-expanded.png` — same comparison at 375px.
- `*-01-overview.png` — the seven-day overview, confirmed unaffected on both branches.

## Known limitation

Finding 03's exact "header floats mid-scroll" symptom is fixed at its diagnosed code-level root cause (see above), verified by a direct regression test rather than a forced visual repro, for the browser-scroll-anchoring reason explained above.

## Version control

- Continued on branch `shaghil-closed-pilot-ux-refinement`.
- No protected branch touched.
- Not merged. Not deployed.
