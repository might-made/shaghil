# SHAGHIL Visual Identity Exploration — Phase 2

Branch: `shaghil-brand-final`. Basis: `SHAGHIL_BRAND_DIRECTIONS.md` (commit `b16a71db7604c3bb9a6450dd44d928bc2a65df9b`), Product Closure baseline `1b2b3f5d53c388db9dfb0f030b7b250bddbaac55` (untouched). Visual exploration and documentation only — no application code was modified.

## Presentation fix (superseding the first delivery)

The first version of this exploration delivered each direction as a multi-file board (`board.html` + a sibling `tokens.css` + `../shared.css` + a sibling `mark.svg`, loaded via relative paths). When opened as a single standalone file outside its original folder, those relative paths resolved to nothing, so none of the layout/color/type CSS applied and the mark never loaded — leaving raw, unstyled, RTL-default markup, which is what produced the reported "blank viewport / narrow right-hand column" failure. This is now fixed: every board is a **single, fully self-contained HTML file** (`review-board.html`) with all CSS and the SVG mark inlined directly — the only remaining external reference is the Google Fonts stylesheet link itself, verified to load correctly in this environment (see "Visual QA method" in the final report). In addition, high-resolution **static PNG renders** of each board were produced directly with headless Chromium, so the Founder can review the identity with zero dependency on any file, folder, or font loading at all.

## What was explored

Three complete, structurally identical review boards — one per direction — each covering, at large presentation scale (1600px canvas): a brand hero (huge شغّل + SHAGHIL + mark + "by MIGHT MADE" on the primary background), a logo system (dark panel, light panel, and a combined Arabic+English+symbol lockup), a 9-swatch color palette (each swatch showing color, name, and hex at a size actually readable without zooming), a 6-block Arabic+Latin typography hierarchy (Display/Heading/Body/UI Label + Latin Display/Body), an app-icon/favicon/social-avatar row at true comparative scale (16/32/64px + app icon + browser tab + avatar), a realistic Product UI mockup (header, two engine cards, input, status, generated result with primary/secondary actions), a realistic Visual Studio mockup (product image area, controls, Generate CTA, loading state, proportionate result placeholder), a full-width public-website hero, and a Brand Language row (cards, buttons, input, three direction-specific icons, dividers, status dots, and an animated motion demo).

**Fairness verification:** all three `review-board.html` files were generated from one shared JavaScript template (`render.mjs`) with only per-direction tokens substituted, then parsed and diffed structurally — each contains exactly the same count of every content block (9 sections, 9 swatches, 6 typography blocks, 6 icon cells, 7 brand-language row children, identical Product UI / Visual Studio / website-hero markup). Rendering each at a 1600px viewport in real headless Chromium additionally confirmed **identical total page height (4559px + 3134px + 868px section-by-section) across all three** — true visual parity, not just matching DOM counts.

## File map

```
brand-exploration/
  render.mjs                     generator: one shared template, three token sets → 3 HTML files
  screenshot.mjs                 renders each HTML in real headless Chromium, slices into 3 PNGs each
  01-operator/
    review-board.html            self-contained board (all CSS + mark inlined; only Google Fonts is external)
    mark.svg                     standalone symbol: base bar + 3-position indicator tick (ش abstracted)
    01-operator-brand.png        hero + logo system + color + typography + app icon/favicon
    01-operator-product.png      Product UI mockup + Visual Studio mockup + brand language
    01-operator-web.png          public website hero
  02-craftsman/                  same file set — stamped seal — one curved stroke + one dot (ش abstracted)
  03-kinetic/                    same file set — diagonal execution stroke + base notch (ش abstracted)
SHAGHIL_VISUAL_IDENTITY_EXPLORATION.md   this document
```

## Visual logic of each direction

- **01 — Operator:** a control-panel metaphor. The mark reduces ش's three dots to a 3-position indicator tick (center one lit) above a base bar. Geometry is chamfered/squared. Motion snaps in discrete steps, like a switch. The system is the coolest and most technical-reading of the three.
- **02 — Craftsman:** a workshop/seal metaphor. The mark reduces ش's three dots to one bold stamped dot above a single confident curved stroke, inside a circular seal — an intentional economy, not a shortcut (three dots do not survive favicon scale; one does). Geometry is soft and generous. Motion settles gently, like something placed down with care. The system is the warmest of the three and the most visually distant from SHAGHIL's current implementation.
- **03 — Kinetic:** a momentum metaphor. The mark is a single bold diagonal "go" stroke with a small secondary base notch that recedes at favicon scale, leaving the diagonal alone as the carrying shape. Geometry is sharp and minimal. Motion is short and directional. This system keeps the closest continuity with SHAGHIL's current near-black/off-white base.

## Exact colors

All ten tokens (background, surface, foreground, muted, border, brand signal, secondary, success, warning, error) are shown as large swatches with name and hex in each board's Section 3. Summary of the primary brand-signal token per direction:

| Direction | Brand signal | Hex | RGB |
|---|---|---|---|
| 01 Operator | Ember amber-orange | `#E8873A` | rgb(232,135,58) |
| 02 Craftsman | Terracotta/rust | `#B8563A` | rgb(184,86,58) |
| 03 Kinetic | Cobalt | `#2F5AF0` | rgb(47,90,240) |

None of the three reuse MIGHT MADE's Electric Lime or Champagne as SHAGHIL's own brand signal, keeping SHAGHIL visually distinct per instruction. Direction 03's brand signal was deliberately chosen as cobalt rather than a red/orange specifically to avoid colliding with the Error semantic in a real interface — documented on that board.

## Typography

Each board's Section 4 renders an actual large-scale hierarchy (Arabic Display/Heading/Body/UI label, Latin Display/Body-UI) in the real chosen faces. Summary:

| Direction | Arabic | Latin |
|---|---|---|
| 01 Operator | Noto Kufi Arabic (display) + IBM Plex Sans Arabic (body/UI) | Space Grotesk (display) + IBM Plex Sans (UI) |
| 02 Craftsman | Almarai (all weights) | Manrope (display + UI) |
| 03 Kinetic | Tajawal (all weights) | Sora (display) + Inter (UI, retained from current product) |

## Symbol rationale

All three marks are built from the same source letterform (ش's base stroke + dot cluster), abstracted differently per direction's metaphor, and each board's Section 5 shows the mark at 16/32/64px plus app-icon/favicon/avatar scale — none rely on detail that only survives at large size. None use a robot, brain, magic star, chat bubble, literal power-button glyph, or a literal Saudi cultural motif, per instruction.

## Arabic wordmark rationale

Each board's Section 1 and Section 2 render شغّل at genuinely large display scale (up to 150px) so letterform character (ش, غ, the shadda, overall rhythm) is actually visible, not just described — the exact gap identified in the Phase 1 audit (`SHAGHIL_BRAND_DIRECTIONS.md` §1: "no Arabic typeface is chosen at all... a functional placeholder, not a designed mark"). All three genuinely resolve that gap, each in a different register.

## UI implications

Each board's Section 6 and Section 7 apply the direction's tokens to a large, realistic fragment of the real product's actual current screen content (top nav, engine cards, an input, a status line, a result block with save/second-version actions, and a full Visual Studio panel) — proving each direction is implementable against the existing, closed product structure without any layout change. No product screen was redesigned; only color, type, radius, and iconography vary.

## Website implications

Each board's Section 8 renders the identical Founder-specified hero content (شغّل / حوّل سياق نشاطك إلى شغل جاهز. / Business Brain → Content → Campaigns → Visuals / ابدأ شغلك / by MIGHT MADE) in that direction's system at full landing-page scale — a conceptual mockup only, confirming no direction requires different messaging or structure to work as a hero, only different typography/color/mark.

## MIGHT MADE relationship

No attempt was made to reconstruct, redesign, or approximate MIGHT MADE's actual locked Primary Signature or logo in any board — "by MIGHT MADE" is rendered as small, muted, letter-spaced plain text only, in the Section 1 hero and the Section 8 website hero on every board, per explicit instruction. Factual color/register distance from MIGHT MADE's approved charcoal/off-white/Champagne/restrained-Lime system, visible directly on each board's Section 3 palette: Direction 03 sits closest (near-monochrome base, flagged as needing explicit care to stay distinct rather than merged), Direction 01 shares MIGHT MADE's *principle* of one controlled signal color without sharing its palette, and Direction 02 diverges furthest (warm ink base). None of the three use Electric Lime or Champagne as SHAGHIL's own accent.

## Implementation implications

Unchanged from the Phase 1 strategy document's assessment, now visually confirmed: Direction 03 requires the smallest token/typeface/icon delta from the current product; Direction 01 is a moderate rewrite (new icon set, two new typefaces); Direction 02 is the largest rewrite (base color temperature shift, new icon set, a photography direction still to be produced). None have been implemented into the actual application.

## Founder decisions still required

1. Which direction (or which specific elements combined across directions) to select — no winner is proposed here.
2. Whether the two disclosed font substitutions (Manrope for General Sans; Sora for Neue Montreal) are acceptable, or whether the originally named paid/licensed faces should be sourced instead.
3. Whether custom type or commissioned photography (for Direction 02 specifically) should be scoped as a follow-up production step.
4. Confirmation of the accent-color and MIGHT MADE-distance observations above before any token is finalized.
5. Whether a full custom icon set (beyond the single mark shown per direction) should be scoped next, as flagged in Phase 1.

---

**Deliverable status:** documentation and visual exploration assets only. No runtime or product code was modified.
