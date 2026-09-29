# SHAGHIL — Closed Pilot: Campaign Display Regression Fix

Branch: `shaghil-closed-pilot-ux-refinement` (not merged, not deployed)

## Founder report

QA confirmed that after the previous "Content Plan Display Fix" (commit
`b192d4f831ea953dd7df6ee1191259e3691d8f92`), the same class of display bug —
raw Markdown visible on screen, cramped internal scrolling on expanded
cards, and the sticky header obscuring expanded content — was **still
present in the سوّ حملة (campaign) engine**, even though it had been fixed
for the سوّ محتوى (content) engine.

## Root cause

The prior fix corrected `renderCards()`'s shared per-day تفاصيل
(details) panel in `lib/visual-studio.mjs` — the code path used by both
the content and campaign engines when a user expands a single day's
detail view. That part of the campaign engine was already correct and
required no further change.

However, the campaign engine has **two additional, campaign-only
rendering sites** that render AI-generated text outside that shared
per-day path, and both were missed by the earlier fix because they are
structurally separate code:

1. **The campaign overview card** — `renderCards()`'s
   `if(current==='campaign'){...}` branch builds an always-visible
   "نظرة عامة على الحملة" intro card from a separate `overview` string.
   It used `body.textContent = overview` (raw text, not rendered
   Markdown), and had no full-width CSS rule since it was never
   considered part of the collapsible-detail pattern the first fix
   targeted.
2. **Visual Studio's day-selection preview (`#visualSource`)** —
   populated by `selectIdea()`, a function entirely separate from
   `renderCards()`, reached whenever a user picks a day (content or
   campaign) to generate an image for. It also used
   `.textContent = source.task.selected` (raw text).

Both sites displayed the AI's raw Markdown syntax (`#`, `##`, `**`,
`- `) directly, exactly as the Founder reported, and the overview card
was also squeezed into a single narrow grid column since it had no
full-width rule.

A full sweep of `lib/visual-studio.mjs` (`grep` for every
`.textContent=`/`.innerHTML=` assignment) confirmed no third
rendering site was missed.

## Fixes

### `lib/visual-studio.mjs`

- Campaign overview card: now renders through the existing `md()`
  helper into a `div.ideaDetail`, and the card carries a new
  `campaignOverview` class:
  ```js
  const intro=document.createElement('article');intro.className='card campaignOverview';
  ...
  const body=document.createElement('div');body.className='ideaDetail';body.innerHTML=md(overview);intro.append(body);
  ```
- `selectIdea()`: `#visualSource` now renders through `md()` instead of
  raw `.textContent`:
  ```js
  el('visualSource').innerHTML=md(source.task.selected);
  ```
  `source.task.selected` itself (the raw string used for the actual
  `/api/visual` request and for `autoCopy()`'s hook/CTA regex matching)
  is untouched — only the on-screen preview changed.

### `styles/components.css`

Added an unconditional full-width rule for the overview card, since —
unlike a day's collapsible تفاصيل — it is never hidden and always needs
the full row:

```css
.campaignOverview{grid-column:1/-1}
```

The existing `.ideaCard:has(details[open]){grid-column:1/-1}` rule
(from the prior fix) already makes an *expanded* day card full-width;
that mechanism was correct and untouched.

### Sticky-nav overlap and generation logic

The prior fix's scroll-reset-on-screen-switch behavior (`show()`
calling `window.scrollTo(0,0)`) already covers every screen switch the
campaign engine goes through (generating, opening a day's Visual
Studio, returning from history), so no additional change was needed
there. Campaign generation logic, the seven-day structure, the Visual
Studio handoff, and History were not touched.

## Test-fixture assertions updated (disclosed, not silent)

Fixing the display means `#visualSource`'s `.textContent` no longer
equals the original raw string (it now concatenates rendered text
nodes without the original Markdown syntax between them). Three
pre-existing tests asserted exact equality against that raw string and
became legitimately obsolete by this exact fix. Each was replaced with
(a) a per-line "all original content is still present" check and (b) an
explicit "no raw `##` remains visible" check, with an inline comment
explaining why:

- `scripts/qa-v06.mjs`
- `scripts/qa-v07.mjs`
- `scripts/qa-founder-refinement.mjs`

No test's *intent* was weakened — each still verifies that nothing is
lost, now in a way that's compatible with the new, correct rendering.

## New focused regression test

`scripts/qa-campaign-display.mjs` (wired into `scripts/qa.mjs`) covers
the exact Founder MIGHT/AUDIT scenario end-to-end in a real JSDOM
browser controller:

- CSS source check for `.campaignOverview{grid-column:1/-1}`.
- Generates a 7-day MIGHT/AUDIT campaign (Saudi/GCC brand, Instagram +
  LinkedIn, the exact required CTA) and confirms scroll resets on
  landing on the result.
- Overview card: carries `campaignOverview`, renders through
  `.ideaDetail`, contains zero raw `##`/`**`/`- ` syntax, contains real
  `<strong>`/list elements, and loses zero original content.
- An expanded day card: computed `grid-column` is `1/-1`, headings and
  lists render as real `<h3>`/`<ul>`/`<li>`, zero raw Markdown, exact
  CTA present.
- Visual Studio's `#visualSource`: zero raw Markdown, correct day
  selected, exact CTA present; `Visual.back()` still returns to the
  campaign result.
- Campaign fields (occasion/duration), the request payload, save-to-
  history (byte-for-byte raw storage, confirming only rendering
  changed), and reopening from history are all unaffected.

## QA results

- Full suite (`npm run qa`): **76 PASS, 0 FAIL**, exit code 0.
- Focused test (`scripts/qa-campaign-display.mjs`): all assertions
  pass, covering the exact MIGHT/AUDIT scenario end-to-end.

## Screenshot verification (desktop + mobile, before/after)

Captured with Playwright against an isolated snapshot of the parent
commit ("before") and the current working tree ("after"), at both
1440×900 (desktop) and 375×812 (mobile):

- **Overview card**: before shows literal `# حملة MIGHT/AUDIT`,
  `**الفكرة الكبرى:**`, and `- ` bullet lines in a single narrow grid
  column; after shows a real `<h1>`, bold `الفكرة الكبرى:` label, and a
  real bullet list, spanning the full row width.
- **Expanded day card**: before shows raw `##`/`###`/`**` syntax
  squeezed in a narrow column, with the sticky header visibly
  overlapping the expanded content mid-scroll; after shows real
  `<h2>`/`<h3>` headings and a real list, spanning the full row width,
  with no sticky-header overlap.
- **Visual Studio selection preview**: before shows raw `##`/`###`/`**`
  syntax; after shows clean rendered headings matching the selected
  day, with the exact CTA intact.
- All four differences are consistent across both desktop and mobile
  viewports.

## Known limitations

`#visualSource`'s own container (`.sourceExcerpt`) CSS sizing was left
untouched — it is a small preview panel inside the Visual Studio form,
a distinct, smaller context from the expanded campaign cards the
Founder's issues 2–4 describe, and out of this fix's scope.
