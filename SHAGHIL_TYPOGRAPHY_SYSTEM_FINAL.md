# SHAGHIL Typography System — Final Production Prep

**STATUS: FOUNDER SELECTED — FINAL PRODUCTION TYPOGRAPHY PREP**

Not yet LOCKED — this status is reserved until the Founder reviews the final board below. Founder selected **T2 — Technical / AI-Native** from the three exploration directions (`SHAGHIL_TYPOGRAPHY_EXPLORATION.md`, commit `8560492`). This document turns it into a refined, final production-ready system. Branch: `shaghil-brand-final`. The locked logo and locked Graphite Pulse color system are unchanged and untouched.

## Founder selection

- **Arabic:** IBM Plex Sans Arabic
- **Latin:** IBM Plex Sans

Both re-verified this phase: exact family names confirmed from the actual `@font-face` declarations in the real downloaded webfont CSS (`brand-final/typography/exploration/fonts/plexarabic.css`, `plexsans.css`); OFL license re-confirmed against `METADATA.pb` in `google/fonts`; Arabic shaping, Latin rendering, numerals, punctuation, and mixed Arabic/English content all re-tested on the final board with real rendered output, not assumed. No font substitution was made.

## Rationale (carried from exploration, unchanged)

A true coordinated sister-family pairing, designed by the same foundry (IBM/Bold Monday) specifically to work together across scripts. Sharper and more systematic than a warmer alternative — genuinely built for interface and data use, with real tabular lining figures — while staying warm enough in its curves and generous enough in its UI weights to avoid reading as a raw developer tool.

## C. Arabic production rules

- Family: IBM Plex Sans Arabic, static weights 400/500/600/700.
- Weight 400 for all reading text (Body Large/Body/Body Small/Input). Weight 500 for secondary UI text (Label/Caption/Metadata/Numeric-KPI). Weight 600 for every heading level and Button — distinguished from each other by size alone, never by switching weight again. Weight 700 is **not** a UI weight in this system — see emphasis rule below.
- Line-height is always measurably taller than the paired Latin figure at the same role (e.g. Body: 1.70 Arabic vs 1.55 Latin) — a deliberate accommodation for shadda/hamza clearance, never a mechanical copy of the Latin ratio.
- No artificial Arabic letter-spacing anywhere — tracking is 0 on every Arabic role, protecting joining and natural rhythm.
- **Optical size/weight rule (tested, not assumed):** IBM Plex Sans Arabic and IBM Plex Sans are used at **identical numeric px sizes and identical numeric weights** at every role. This was directly tested, not assumed — see below.

## D. Latin production rules

- Family: IBM Plex Sans, variable wght 100–700, static-instance weights 400/500/600/700 used.
- Same weight policy as Arabic (400 body, 500 secondary UI, 600 headings/Button, 700 reserved for emphasis only) — the two scripts share one weight logic throughout, which is what makes the pairing feel like one coherent system rather than two adjacent ones.
- Display gets a small negative tracking (-0.3px) for large-size optical tightening — a standard, functional correction, not decorative. Every other Latin role keeps tracking at or near 0 per the explicit instruction not to over-track general UI text; Label gets only 0.1px, Button only 0.1px.
- Capitalization: no forced uppercase anywhere in the system (the product doesn't use uppercase UI labels today, and none was introduced here).

## Arabic/Latin optical relationship — tested, with evidence

A real optical-parity test was run before finalizing the scale (`brand-final/typography/exploration/optical-test/` is referenced; the test itself lives at `brand-final/typography/final/optical-test/optical-test.png`): Arabic size compensations of +1px, +2px (~13%), and +6–8% were rendered against the paired Latin at three representative role sizes (16px body, 34px H1, 12px caption). **Every compensation made the pairing look imbalanced, not corrected** — Arabic began visually dominating the Latin rather than matching it. IBM Plex Sans Arabic and IBM Plex Sans render in genuine optical parity at identical nominal sizes and weights, consistent with IBM's own explicit cross-script harmonization goal for the Plex superfamily.

**Production rule: no numeric size or weight compensation between the two scripts, at any role.** This is the opposite of a common assumption about bilingual Arabic/Latin pairing, and it was reached by testing, not by defaulting to convention.

## E. Final type scale

| Role | Size | Weight | LH (ar / en) | Tracking | Use |
|---|---|---|---|---|---|
| Display | 40px | 600 | 1.25 / 1.15 | -0.3px (en) | Single largest moment per screen |
| H1 | 30px | 600 | 1.30 / 1.20 | 0 | Screen-level heading |
| H2 | 24px | 600 | 1.35 / 1.25 | 0 | Section heading |
| H3 | 19px | 600 | 1.40 / 1.30 | 0 | Card/subsection heading |
| H4 | 16px | 600 | 1.45 / 1.35 | 0 | Minor heading / field-group label |
| Body Large | 16px | 400 | 1.70 / 1.55 | 0 | Lead paragraph |
| Body | 14px | 400 | 1.70 / 1.55 | 0 | Default reading text |
| Body Small | 12.5px | 400 | 1.65 / 1.50 | 0 | Secondary body text |
| Label | 12px | 500 | 1.30 | 0.1px (en) | Field labels, UI tags |
| Button | 14px | 600 | 1.0 | 0.1px (en) | All button text |
| Input | 14px | 400 | 1.45 / 1.40 | 0 | Typed/shown form text |
| Caption | 11.5px | 500 | 1.45 / 1.40 | 0 | Helper text, status microcopy |
| Metadata | 11px | 500 | 1.40 / 1.35 | 0 | Timestamps, smallest role |
| Numeric / KPI | 15px | 500 | 1.25 | 0 | Prices, %, counts — Western tabular digits, always bidi-isolated |

**Weight policy:** exactly 3 weights (400/500/600) govern every named role — a deliberate reduction from mechanically preserving the exploration's usage, to avoid unnecessary weight proliferation. Weight 700 is held back entirely from the UI hierarchy.

**Emphasis exception:** weight 700 is reserved solely for inline emphasis inside AI-generated long-form output (markdown `**bold**`) — a real product behavior (SHAGHIL generates and renders markdown-style content), not a UI hierarchy level. Demonstrated in Section 14 and Section 22 (Do/Don't) of the final board.

## Bilingual / bidi rules

- Numerals: Western digits (0–9) everywhere, per the exploration's numeric-convention recommendation.
- **Any numeral run carrying a leading sign or symbol (+, −, %, currency) must be wrapped in `<bdi dir="ltr">…</bdi>` when it appears inside Arabic/RTL flow.** This is not optional styling — without it, the sign visually reorders (confirmed and documented as a real bug in the exploration phase: `+24%`/`-8%` rendered as `24%+`/`8%-`). Re-verified fixed and correct throughout this final board (Section 15, Section 22).
- Product terms (Business Brain, Brand Brain, Visual Studio, History, AI, Instagram) sit correctly in RTL flow as embedded LTR runs with no isolation needed — confirmed by direct rendering, since plain product-name terms (no leading sign) do not trigger the reordering bug.
- "SAR" placement: Latin-prefixed ("12,500 SAR") reads correctly and was used throughout this phase's content per the Founder's brief; this is compatible with, not a reversal of, the exploration's "ر.س"-suffixed recommendation for Arabic-abbreviation contexts — both conventions are documented, the choice between them is a content-language decision (Arabic abbreviation vs. Latin ISO code), not a typography defect.

## F. Bilingual/bidi QA result

**Pass.** Tested: Arabic-only, English-only, Arabic+English inline, Arabic heading + English metadata, English product name + Arabic description, Arabic sentences containing English product terminology (Business Brain, Visual Studio, Instagram, AI), numbers/percentages/SAR/dates/decimals inside RTL content. No broken joining, no missing glyphs, no bidi corruption anywhere on the final board after the `<bdi>` isolation fix. Directly inspected by rendering, not assumed.

## G. Numbers/SAR QA result

**Pass.** All of `12,500 SAR`, `45,000 SAR`, `15%`, `7.5%`, `2026`, `01/09/2026`, `10–15`, `+24%`, `−8%` render correctly in KPI cards, inline body copy, and mobile simulation, with signed values correctly isolated. Numerals read as connected to their surrounding Arabic typography (same visual weight/rhythm), not disconnected — confirmed by direct inspection of Section 15 and Section 20 of the final board.

## H. Long-form AI readability result

**Pass.** A realistic multi-paragraph Arabic AI output (heading, two paragraphs, a bulleted list, an English term embedded mid-sentence, and an inline-bold emphasized statistic) was rendered at Body (14px/400, LH 1.70 Arabic) in Section 14. The result reads comfortably at extended-paragraph length; bullet and paragraph spacing was tuned to feel distinct without fragmenting the content; the single inline weight-700 emphasis stands out clearly against the weight-400 body without feeling shouty.

## I. Mobile/small-size QA result

**Pass.** A realistic 375px-wide mobile frame (Section 19) was rendered with the full real scale: H4 nav label, Display-derived headline (visually reduced within the frame per the real layout, not the type token itself), Body Small intro, an engine card, a KPI card, and a primary button — no wrapping breakage, no illegible text, no clipped Arabic diacritics observed. Small-size readability (Section 20) checked Caption/Metadata roles down to 11px with real Arabic content (success/error microcopy, a day-range figure) — legible at that floor, with no role in the entire scale going below 11px.

## Files created

```
brand-final/typography/final/
  shaghil-typography-tokens.json   final implementation-ready type tokens
  shaghil-typography-tokens.css    CSS custom properties + utility classes
  build-final-type-board.mjs       generates the final board from tokens + locked logo/color
  qa-content.mjs                   real Arabic/English/numeric QA content for this phase
  SHAGHIL_TYPOGRAPHY_SYSTEM_FINAL.png   the 22-section final production board
  SHAGHIL_TYPOGRAPHY_SYSTEM_FINAL.html  the board's source (kept for reproducibility)
  optical-test/                    the real Arabic/Latin optical-parity test and its evidence
```

## J. Final board path

`brand-final/typography/final/SHAGHIL_TYPOGRAPHY_SYSTEM_FINAL.png`

## K. Token files

`brand-final/typography/final/shaghil-typography-tokens.json`, `shaghil-typography-tokens.css` — implementation-ready, kept separate from runtime code; not wired into the product in this phase.

## Minimum size guidance

No role in the final scale goes below 11px (Metadata). Body text never goes below 12.5px (Body Small). These floors were carried forward from the exploration phase's accessibility findings and re-confirmed here with the final, narrower weight set.

## Accessibility / readability findings

- Color contrast is entirely governed by the already-locked Graphite Pulse system and was not altered — every text color on the final board is a token already verified at WCAG AA.
- Dark-mode and light-mode application (Sections 17–18) both checked directly with real content, including an empty-state message in dark mode and a two-item History listing in light mode — both legible without any font-size or weight compensation.
- Dense UI (KPI cards, Business Brain field grid) and long-form reading were both checked at their real target sizes with no crowding or clipping observed.

## Licensing / source information

Both families reconfirmed OFL-licensed via direct `METADATA.pb` inspection in the `google/fonts` GitHub repository (re-checked this phase, not carried over from memory). Real WOFF2 files already downloaded during exploration (`brand-final/typography/exploration/fonts/plexarabic-*.woff2`, `plexsans-*.woff2`) are reused as-is — no new download was needed, and no font was substituted.

## Implementation notes (for the future implementation phase — not done here)

- Recommended fallback stacks (unchanged from exploration): Arabic `'IBM Plex Sans Arabic', Tahoma, 'Segoe UI', sans-serif`; Latin `'IBM Plex Sans', Inter, system-ui, -apple-system, Arial, sans-serif`.
- Recommended `font-display: swap`.
- The `<bdi dir="ltr">` isolation rule for signed numerals must be applied at the component level wherever a price, percentage, or delta is rendered inside Arabic flow — this is a functional requirement, not a style preference, and should be treated as a checklist item in the eventual implementation phase.
- `index.html`/`lib/`/`api/` remain untouched; no typography has been implemented into the product in this phase.

## Strict scope confirmation

Not touched this phase: logo geometry, the locked Graphite Pulse palette, C1/C3 color exploration, T1/T3 typography exploration, runtime/product code. No T4 created. No direction combined. No display typography borrowed from T3. No font substituted from the Founder's selection.

## Founder review action

Review the final board (`SHAGHIL_TYPOGRAPHY_SYSTEM_FINAL.png`) in full, particularly Sections 04–05 (scale + optical rule), 14 (long-form), 15 (numbers/SAR), and 22 (Do/Don't). Status remains **FOUNDER SELECTED — FINAL PRODUCTION TYPOGRAPHY PREP** until the Founder marks it LOCKED. No implementation, website, or further brand-system work will begin until then.
