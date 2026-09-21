# SHAGHIL Core Identity — Phase 3: Arabic Mark + Wordmark Concepts

Branch: `shaghil-brand-final`. Basis: Founder visual review of the three Phase 2 directions (none approved; emerging final territory = precision of Operator + energy/motion of Kinetic, but the core شغّل mark must be solved first, per Founder's explicit instruction not to hybridize the boards yet). Black/white only — no color, no UI, no website, no photography in this round.

## Method — how the wordmark stays guaranteed-correct while still being customized

No letterform was hand-drawn from scratch. That would risk incorrect Arabic shaping (wrong dot placement, a malformed shadda, a joining error) — a real risk explicitly flagged in the brief ("Arabic legibility is mandatory. Do not distort the word merely to create a logo."). Instead, every concept starts from the browser's own real Arabic text-shaping engine rendering the real Unicode string شغّل in one constant typeface (Noto Kufi Arabic, weight 900, held identical across all four concepts so the *only* variable is the structural idea, not font choice) — this guarantees correct reading, correct joining, and correct dot/shadda placement by construction, verified directly (see QA below).

Each concept's customization is then computed from **real, measured geometry** of that guaranteed-correct rendering:
- Whole-letter positions (e.g. the final letter's own box) are measured with the DOM `Range` API, which reads the real rendered glyph position without ever breaking Arabic shaping (confirmed empirically — see QA).
- The shadda is a combining mark, so `Range` cannot isolate it on its own (it reports the same box as its base letter). Its real sub-position was found by rendering the word to a canvas and scanning pixel data for the topmost ink cluster and the first blank row beneath it — an empirical measurement, verified by overlaying the resulting box on the live rendering and inspecting it directly (confirmed correct — the box exactly bounds the shadda glyph and nothing else).
- Concept D's standalone mark is not drawn at all — it is a real Playwright screenshot **crop** of the final letter's own rendered terminal hook (`marks/lam-hook-mark.png`), taken with a `clip` rectangle computed from that same measured geometry. It is a literal fragment of the real glyph, not an approximation.

## Concept A — Activation

**Idea:** the shadda — already a real emphasis/activation signal in Arabic — is redrawn as one solid geometric mark at the same visual weight as the letters themselves, precisely replacing the shadda's usual small tick, not added beside or on top of the word.

**Wordmark:** the real word, with a solid rounded square occupying exactly the shadda's measured position (empirically verified box, see Method). The letter's own dot (غ's distinguishing dot, which sits just below the shadda) remains untouched and visible.

**Standalone mark:** the square alone. `marks/concept-a-activation-mark.svg`.

**Observation (not scored):** in true isolation, at the smallest sizes, the mark reads as an abstract rounded square — legible and clean, but its link to شغّل specifically depends on the wordmark context more than Concepts B or C's devices do.

## Concept B — Execution / Forward Motion

**Idea:** a controlled baseline gesture tied to the word's own construction rather than a generic arrow: a straight ground line under the whole word breaks into one decisive rising diagonal exactly where the word ends (the final letter — where RTL reading arrives).

**Wordmark:** the real word with a baseline rule spanning its full width, kicking into a single diagonal stroke at the terminal end.

**Standalone mark:** the bar-plus-kick device alone, abstracted. `marks/concept-b-motion-mark.svg`.

## Concept C — System / Precision

**Idea:** the word held inside two technical registration brackets fitted exactly to its own real measured bounding box, positioned on the same diagonal as Arabic RTL reading (top-right to bottom-left) — everything about it reads as deliberately measured, avoiding both a static full rectangle and any circuit-board/server-rack technology cliché.

**Wordmark:** the real word, untouched, framed by two corner brackets sized and placed from its measured box.

**Standalone mark:** the two corner brackets alone, forming an implied frame. `marks/concept-c-system-mark.svg`.

## Concept D — Proprietary Arabic Abstraction

**Idea:** the wordmark itself stays completely unmodified — the distinctiveness comes entirely from the standalone mark being a real, provable fragment of the word's own geometry, not an added icon.

**Wordmark:** the real word, clean, with no device — Section 3 (Construction) shows exactly where the mark comes from, with the crop region highlighted directly on the live rendering.

**Standalone mark:** a real Playwright screenshot crop of the final letter's own terminal hook. `marks/lam-hook-mark.png` (raster, RGBA/transparent, not a vector — disclosed rather than hidden: this is the one concept whose mark is a photographic-style crop of a real glyph rather than a redrawn vector shape; it reproduces cleanly down to 32px and remains legible but slightly softer than A/B/C's vector marks at 16px specifically, which is a real, honest trade-off of this approach, not an error).

## Files

```
brand-exploration/marks/
  render-marks.mjs                    generator: one shared template + measurement logic, 4 concepts
  lam-hook-mark.png                   real screenshot crop (Concept D's mark source, RGBA)
  concept-a-activation.html           self-contained board (all 10 required sections)
  concept-a-activation.png            static review PNG (1700px wide)
  concept-a-activation-mark.svg       standalone vector mark
  concept-b-motion.{html,png,-mark.svg}
  concept-c-system.{html,png,-mark.svg}
  concept-d-arabic-abstraction.{html,png}   (mark source is lam-hook-mark.png, not a separate SVG — see Concept D above)
```

## Visual QA — actually performed, not assumed

Every board was rendered in real headless Chromium at a 1700px viewport and directly inspected (not DOM-only validation) before delivery, including a dedicated measurement pass (see Method) confirming the shadda's real pixel position before any concept was built on top of it. Checked and confirmed on all four boards:
- شغّل reads correctly in every instance (hero black-on-white, hero white-on-black, construction panel, lockup, header test) — same real Unicode string, same real font, shaping performed by the browser itself, never edited at the glyph level.
- The shadda is present and correctly placed on the غ in every instance, including Concepts B/C/D where it is not the subject of the device.
- ش's three dots and غ's own single dot are present and correctly placed in every instance.
- No accidental spelling deformation — the underlying text node is the literal string شغّل in all four concepts; only visual overlays were added (Concepts A/B/C) or a separate crop was taken (Concept D), never a character substitution or reshaping.
- Black/white performance is strong in both directions (light-panel and dark-panel) for all four.
- Every standalone mark derives directly from that concept's own wordmark device — none is an unrelated icon placed beside the word.
- All four marks were rendered and inspected at 128/64/32/16px: A, B and C (vector-drawn) remain crisp and legible through 16px; D (a raster crop) remains clearly legible through 32px and is recognizable but visibly softer at 16px, disclosed above.
- No robot, brain, sparkle, chat bubble, literal power button, or generic arrow appears in any concept.
- All four concepts are structurally different ideas (confirmed both by design intent and by a structural diff of the four HTML files, which are otherwise identical in every section/element count — see `render-marks.mjs`'s single shared template).

One real issue was found and fixed during this QA pass: two of the small annotation labels (Concept B's and Concept D's "idea" text and construction-panel label) originally mixed an inline Arabic letter with surrounding English text, which the browser's bidi algorithm reordered confusingly in the small label pills. Both were rewritten in plain English (referring to "the final letter" rather than inserting the bare Arabic letter mid-sentence) and re-verified correct.

## Founder decisions

Per instruction, no ranking, no winner, no combination, and no color has been introduced. Possible outcomes are entirely the Founder's: select one concept, reject all four, request refinement of one, or ask for specific structural elements to be combined. Only after the core mark is approved does the process continue to color system → typography → design system → product application → public website → domain → final release QA.
