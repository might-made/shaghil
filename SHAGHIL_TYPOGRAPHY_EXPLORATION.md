# SHAGHIL Typography System — Exploration

**STATUS: THREE DIRECTIONS DELIVERED FOR FOUNDER REVIEW — NO SELECTION MADE**

Branch: `shaghil-brand-final`. Starting baseline: logo locked at `91b378d`, color locked at `c9597b6` (C2 — Graphite Pulse). Both are unchanged and untouched by this phase. This is exploration only — no typography is implemented into the product, no direction is ranked or selected.

## Phase 1 — Audit of current product typography

Direct inspection of `index.html` (the entire product UI) found:

1. **One Latin-only font stack for the whole app**: `Inter, system-ui, -apple-system, "Segoe UI", Tahoma, Arial`. Inter has zero Arabic glyph coverage. Since the UI is Arabic-first and RTL, essentially all visible text falls through Inter to whatever the next matching fallback happens to be on the user's specific OS/browser — an outcome that is currently **accidental, not designed**. Arabic, the product's primary language, has no explicit, intentional typeface today.
2. **Only two explicit font-weights are ever set** (800 and 900), everywhere else relying on implicit browser bold from `<b>` tags. Since the effective Arabic font is whatever the platform substitutes, "bold Arabic" is at the mercy of that fallback's own weight support — some system Arabic fallbacks are single-weight, in which case a requested bold has no reliable effect.
3. **Ad hoc font sizes** (44/34/22/20/19/17/13/12px) with no systematic scale or documented ratio — sizes appear to have been picked individually rather than derived from a type system.
4. **Ad hoc line-heights** (1.05/1.5/1.7/1.9) applied uniformly regardless of script. Arabic's connected letterforms and diacritics (shadda, hamza) generally need more vertical room than Latin at the same size; today's line-heights were not designed with that distinction in mind.
5. **No letter-spacing system** exists (neutral finding — nothing is currently broken here, but nothing is established either for future uppercase/eyebrow UI labels).
6. **No documented numeral convention**, and a real inconsistency was found: `historyScreen()` calls `new Date(x.ts).toLocaleString('ar-SA')` with no `numberingSystem` override — the `ar-SA` locale can render Arabic-Indic digits (٠١٢٣…) by default in some browser ICU implementations, while every other number in the product (prices, percentages a user types) implicitly uses Western digits. No product-wide policy currently exists.
7. **RTL/LTR handling is correct at the document level** — `dir="rtl"` on `<html>`, explicit `dir="ltr"` on the specific mixed-language elements that need it. This part is not broken and is called out here only for completeness.

No runtime code was modified during this audit or at any point in this phase.

## Phase 2 — Font candidate research & licensing verification

Every candidate below was checked against its authoritative `METADATA.pb` in the `google/fonts` source repository (not assumed) for license and exact weight/variable-axis support.

| Family | Script | License (verified) | Weights / axes |
|---|---|---|---|
| Cairo | Arabic + Latin (unified) | OFL | Variable, wght 200–1000 |
| IBM Plex Sans Arabic | Arabic | OFL | Static, 100/200/300/400/500/600/700 |
| IBM Plex Sans | Latin | OFL | Variable, wght 100–700, wdth 75–100 |
| Tajawal | Arabic + Latin | OFL | Static, 200–900 |
| Almarai | Arabic + Latin | OFL | Static, 300/400/700/800 |
| Readex Pro | Arabic (+ Latin) | OFL | Variable, wght 160–700, HEXP axis |
| El Messiri | Arabic (+ Latin) | OFL | Variable, wght 400–700 |
| Noto Kufi Arabic | Arabic | OFL | Variable, wght 100–900 (already in this repo as the logo's geometry source only — not proposed here as a UI text face; a 900-weight Kufi display cut is unsuitable for body/UI text) |
| Noto Sans Arabic | Arabic | OFL | Variable, wght 100–900, wdth axis |
| Amiri | Arabic | OFL | Static, 400/700 (+ italics) — traditional Naskh, calligraphic register; considered and set aside, see below |
| Manrope | Latin | OFL | Variable, wght 200–800 |
| Work Sans | Latin | OFL | Variable, wght 100–900 |
| Fraunces | Latin | OFL | Variable, wght 100–900, opsz 9–144, SOFT/WONK axes |
| Inter | Latin | OFL | Variable, wght 100–900, opsz axis (current product default) |

All fourteen are genuinely free for commercial production use under OFL 1.1. Amiri (traditional calligraphic Naskh) and Noto Kufi Arabic (a 900-weight geometric display cut) were both explicitly considered and set aside as body/UI faces — Amiri's character-forward calligraphic register works against "avoid becoming decorative" at UI sizes, and Noto Kufi Arabic already serves a different, single-weight logotype role in this repository.

Final selections (all real files downloaded and used to render the boards, not simulated): **Cairo** (T1), **IBM Plex Sans Arabic + IBM Plex Sans** (T2), **El Messiri + Readex Pro + Fraunces + Work Sans** (T3). Files live at `brand-final/typography/exploration/fonts/`.

## Phase 3–4 — Three directions with complete type scales

Full per-role scales (family, weight, size, line-height, tracking — Arabic and Latin specified separately) are in `brand-final/typography/exploration/specs/T{1,2,3}-*.json`. None are ranked. Summary:

### T1 — Contemporary Saudi Product

**C. Arabic font: Cairo. D. Latin font: Cairo (same family).**

**E. Rationale:** A single unified Arabic+Latin family rather than two coordinated ones. Cairo is already in real production use across Saudi digital products and government digital services — warm rounded terminals, high x-height, unmistakably contemporary-Gulf without leaning on calligraphic cliché. One family for both scripts guarantees perfect metric harmony in every mixed Arabic/English string, which is the product's constant, real condition.

**F. Trade-offs:** Narrower personality range than a two-family system (one voice does everything, from Display XL to Caption). Cairo's Latin is distinctive but less neutral than a dedicated Latin UI face — a strong stylistic commitment, not a safe default.

### T2 — Technical / AI-Native

**G. Arabic font: IBM Plex Sans Arabic. H. Latin font: IBM Plex Sans.**

**I. Rationale:** Two coordinated sister families, designed by the same foundry specifically to work together. Genuinely systematic — built for interface and data use, with real tabular lining figures — sharper and more precise than T1, but avoids reading as a raw developer tool because both families carry warmth in their curves and are used at generous UI weights rather than a monospace/terminal aesthetic.

**J. Trade-offs:** IBM Plex Sans Arabic is a static (non-variable) family, so its weight steps are fixed rather than continuously adjustable. The two-family system costs roughly 1.8× T1's font payload for the same weight count, since both families must load. Slightly more "engineered," less immediately warm than T1 at a glance.

### T3 — Premium Human

**K. Arabic font: El Messiri (display) + Readex Pro (body/UI). L. Latin font: Fraunces (display) + Work Sans (body/UI).**

**M. Rationale:** A four-family, two-role pairing. El Messiri + Fraunces carry genuine editorial personality at Display XL/L, H1 and H2; Readex Pro + Work Sans take over from H3 downward through every UI/body/data role, since a characterful display face becomes impractical — and less legible — at small interface sizes. This gives SHAGHIL real warmth at the moments that set tone, while staying a fully disciplined, usable SaaS interface everywhere else.

**N. Trade-offs:** The most complex system of the three (four font families to manage, one display/body split point to keep consistent). The heaviest font payload of the three directions. The display/body transition (at H3) must be applied consistently everywhere or the system reads as inconsistent rather than intentional.

## Phase 5 — Arabic QA (real content, no lorem ipsum)

Every string from the Founder's brief — شغّل, مشروعك./لكن أسرع., the six engine names, field labels, success/error status strings, the full long-form paragraph, and a dedicated diacritics stress-test string (شدّة، همزة، تاء مربوطة، ياء وألف مقصورة) — was rendered in all three directions (`brand-final/typography/exploration/{T1,T2,T3}/SHAGHIL_TYPE_T{1,2,3}.png`, Sections 02, 04, 08, 11, 14, 16, 20). Verified directly by rendering and visual inspection, not assumed:

- No broken joining at any weight tested (400/500/600/700) in any of the three Arabic families.
- No missing glyphs (tofu) anywhere in any direction.
- Shadda, hamza, tā' marbūṭa, and yā'/alif maqṣūra all render correctly and distinctly in all three families.
- Mixed Arabic/English strings (e.g. "استخدم Business Brain لحفظ بيانات مشروعك... Visual Studio (1:1 أو 4:5)... Instagram") render with the embedded Latin runs correctly positioned in the RTL flow — confirmed correct bidi behavior for this class of string.

## Phase 6 — Numeric + data QA, and a real bidi bug found and fixed

**A genuine bidi corruption bug was found while building the boards, not hypothesized:** `+24%` and `-8%` initially rendered visually as `24%+` and `8%-` — the leading sign, a weak/neutral bidi character, was being reordered relative to the digits when embedded directly in RTL flow with no directional isolation. This is exactly the class of error Phase 5/6 QA exists to catch.

**Fix applied to the boards** (and the recommended production fix): wrap any numeral run that starts with a sign or symbol in an explicit isolate — `<bdi dir="ltr">+24%</bdi>` (or equivalently `unicode-bidi: isolate; direction: ltr` in CSS) — whenever it appears inside RTL flow. Re-verified after the fix: both values now render correctly in every location they appear (`SHAGHIL_TYPE_T1.png` Section 15, confirmed identically applied in T2/T3).

**O. Numeric convention recommendation:** Use **Western digits (0–9)** consistently everywhere the product displays a number — prices, percentages, dates, counts — matching the overwhelming real-world convention in Saudi/Gulf digital products (banking, e-commerce, and government digital services predominantly use Western digits even in fully Arabic interfaces). Concretely, this closes the audit's Finding 6: the one existing `toLocaleString('ar-SA')` call should pass `{ numberingSystem: 'latn' }` explicitly, so its output can never silently diverge into Arabic-Indic digits on a browser whose ICU default differs. For currency, prefer the Arabic abbreviation **"ر.س" placed after the number** (e.g. "12,500 ر.س") in Arabic contexts — it has universal font support today, unlike the newly introduced official Saudi Riyal symbol, which is not yet covered by any of the OFL families evaluated here and should be revisited once font support matures. Use "SAR" (Latin, prefixed) only in English-context or exported/PDF documents. Any numeral run carrying a leading sign or symbol (+, -, %, currency) must be bidi-isolated per the fix above, in every direction, regardless of which is eventually selected.

## Phase 7–8 — Real application boards & realistic UI testing

Each of the three boards (`SHAGHIL_TYPE_T1/T2/T3.png`) contains all 22 required sections, built from the real locked logo (`brand-final/logo/master/SHAGHIL_MASTER_AR.svg`, geometry untouched, only fill color applied) and the real locked Graphite Pulse color tokens (`brand-final/color/final/shaghil-color-tokens.json`) — never re-approximated or re-typed. Sections 09, 11–13, 17–19, 21 simulate the actual current product structure and copy (top nav, Business Brain fields, Visual Studio controls, a mobile-width frame, a marketing/social tile) in both light and dark mode, so the Founder can see what SHAGHIL actually feels like under each system rather than judging isolated specimen sheets.

## Phase 9 — Technical font QA

| Direction | Families loaded | Real measured payload (arabic+latin subsets, weights used) | Variable font? | Files needed |
|---|---|---|---|---|
| T1 | Cairo | ~318KB (4 weights) | Yes | 1 family |
| T2 | IBM Plex Sans Arabic + IBM Plex Sans | ~577KB (4 weights each) | Arabic: no (static). Latin: yes | 2 families |
| T3 | El Messiri + Readex Pro + Fraunces + Work Sans | ~857KB (3+3+2+4 weights) | Yes (all four) | 4 families |

All families ship real WOFF2 files (confirmed by direct download from `fonts.gstatic.com`, not assumed). Recommended `font-display: swap` for all three (matches what Google's own served CSS already specifies) — for an Arabic-first product on variable mobile connections, a brief flash of fallback-styled text is preferable to blocking text rendering entirely. Recommended fallback stacks:
- Arabic: `'<chosen family>', Tahoma, 'Segoe UI', sans-serif` (Tahoma/Segoe UI are the most broadly Arabic-capable system fallbacks on Windows; macOS/iOS/Android all substitute a real Arabic-capable system font automatically past that).
- Latin: `'<chosen family>', Inter, system-ui, -apple-system, Arial, sans-serif` (keeps a sane path back to the product's current stack during any transition period).

Rendering was verified in headless Chromium (the same engine family as production Chrome/Edge); no engine-specific shaping issues were observed in any of the three directions.

## Phase 10 — Accessibility / readability

Color contrast is entirely governed by the already-locked Graphite Pulse system and was **not** altered to make any direction work — every text color shown on all three boards is a token already verified at WCAG AA in `SHAGHIL_COLOR_SYSTEM_FINAL.md`.

**P. Accessibility/readability QA:**
- Minimum Body size across all three directions: 13–13.5px. Minimum UI size: 12–12.5px. None of the three directions goes below these floors anywhere in its scale.
- Every direction gives Arabic a measurably taller line-height than Latin at the same role (e.g. T1 Body: 1.80 Arabic vs 1.60 Latin; T3 Body: 1.85 vs 1.65) — a deliberate accommodation for shadda/hamza clearance, never a mechanical copy of the Latin ratio, verified role-by-role in each spec file.
- Long-form AI-generated output gets the most generous line-height in every direction (1.90–1.95 Arabic), reflecting sustained-reading needs distinct from short UI text.
- Dense contexts (tables, data grids, dense cards) were rendered and visually checked at their real target size in all three boards (Section 15, 19) — no clipping or crowding observed in any direction.
- Dark-mode and light-mode readability were both checked directly (Sections 17–18) using the locked color tokens; no direction required a font-size or weight compensation to remain legible in either mode.

## Q. Licensing verification

All seven families used (Cairo, IBM Plex Sans Arabic, IBM Plex Sans, El Messiri, Readex Pro, Fraunces, Work Sans) are confirmed OFL-licensed via direct inspection of their `METADATA.pb` files in the `google/fonts` GitHub repository at the time of this exploration — not assumed from name recognition. All are free for unrestricted commercial production use, including modification and redistribution as self-hosted webfonts.

## R. Board paths

```
brand-final/typography/exploration/T1/SHAGHIL_TYPE_T1.png
brand-final/typography/exploration/T2/SHAGHIL_TYPE_T2.png
brand-final/typography/exploration/T3/SHAGHIL_TYPE_T3.png
```

## Files created

```
brand-final/typography/exploration/
  specs/T1-contemporary-saudi.json
  specs/T2-technical-ai-native.json
  specs/T3-premium-human.json
  qa-content.mjs                 real Arabic + numeric QA strings, verbatim from the brief
  build-type-board.mjs           generates a board from a spec + the locked logo/color tokens
  fonts/                         real downloaded OFL webfont files + local @font-face CSS
  T1/SHAGHIL_TYPE_T1.png, T1-board.html
  T2/SHAGHIL_TYPE_T2.png, T2-board.html
  T3/SHAGHIL_TYPE_T3.png, T3-board.html
SHAGHIL_TYPOGRAPHY_EXPLORATION.md
```

## Strict scope confirmation

Not touched this phase: logo geometry, the locked Graphite Pulse palette (C1/C3 exploration files also untouched), `index.html`/`lib/`/`api/`, iconography, illustration, motion, or website work. No typography was implemented into production. No direction is ranked, named "best," or combined with another.

## Z. Founder review instruction

Review T1, T2, and T3 visually in the real SHAGHIL product contexts shown on each board (Sections 06–13, 17–19, 21 in particular). Do not proceed to finalization until the Founder explicitly selects a typography direction.

**STOP.**
