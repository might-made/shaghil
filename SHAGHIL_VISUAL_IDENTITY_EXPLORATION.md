# SHAGHIL Visual Identity Exploration — Phase 2

Branch: `shaghil-brand-final`. Basis: `SHAGHIL_BRAND_DIRECTIONS.md` (commit `b16a71db7604c3bb9a6450dd44d928bc2a65df9b`), Product Closure baseline `1b2b3f5d53c388db9dfb0f030b7b250bddbaac55` (untouched). Visual exploration and documentation only — no application code was modified.

## On visual reviewability

This exploration produces **genuinely reviewable, browser-rendered visual assets** — real HTML/CSS pages using real, freely-licensed web fonts (loaded live from Google Fonts) and real hand-built SVG marks, not text descriptions standing in for visuals. Open any `board.html` file in a browser to see actual rendered Arabic/Latin typography, real color, a real vector mark at multiple sizes, and real UI-fragment mockups — this is a standard, legitimate way to produce comparable brand boards without custom type-design tooling or an image generator.

**Genuine limitation, disclosed rather than hidden:** no custom typeface was drawn (all three directions use existing, freely-licensed fonts, as the brand strategy document specified) and no raster/photographic imagery was produced (Directions 01/03 use none by design; Direction 02's "warm photography treatment" is described but not photographed, since no real product photography exists to art-direct yet). Two font substitutions were made from the strategy document for reliable free-CDN delivery in this environment: **Manrope** replaces "General Sans" in Direction 02, and **Sora** replaces "Neue Montreal" in Direction 03 — both disclosed inline on their respective boards. If a custom typeface or photographed imagery is wanted for the next phase, that is a production step beyond this exploration, not something this phase silently skipped.

## What was explored

Three complete, structurally identical brand boards — one per direction — each covering: Arabic wordmark (dark/light/small-size), English wordmark and its relationship to the Arabic form, a symbol/mark shown at 16/32/64/96px plus app icon/favicon/social-avatar mockups, a full color system (10 tokens with hex/RGB/usage role), a nine-step Arabic+Latin typography hierarchy with rationale, a same-content UI brand sample (header, two cards, input, status, result block), a same-content Visual Studio sample (product thumbnail, controls, Generate CTA, loading state, result placeholder), a same-content public-website hero, a "by MIGHT MADE" lockup, a shape/icon/status system, a described-and-animated motion principle, and a factual (non-scored, non-ranked) evaluation table.

**Fairness verification:** all three `board.html` files were parsed and diffed structurally (not just visually eyeballed) — each contains exactly the same count of every content block (5 wordmark instances, 9 mark placements, 10 color swatches, 9 typography rows, 2 lockups, 11 evaluation rows, and the UI/Visual-Studio/hero mockups all present). The three differ only in their linked `tokens.css` (color/type/radius values) and direction-specific rationale text — never in structure, content depth, or polish.

## File map

```
brand-exploration/
  shared.css                    structural CSS shared identically by all three boards
  01-operator/
    tokens.css                  color, font, radius tokens for Direction 01
    mark.svg                    symbol: base bar + 3-position indicator tick (ش abstracted)
    board.html                  full visual board
  02-craftsman/
    tokens.css
    mark.svg                    symbol: stamped seal — one curved stroke + one dot (ش abstracted)
    board.html
  03-kinetic/
    tokens.css
    mark.svg                    symbol: diagonal execution stroke + base notch (ش abstracted)
    board.html
SHAGHIL_VISUAL_IDENTITY_EXPLORATION.md   this document
```

## Visual logic of each direction

- **01 — Operator:** a control-panel metaphor. The mark reduces ش's three dots to a 3-position indicator tick (center one lit) above a base bar. Geometry is chamfered/squared. Motion snaps in discrete steps, like a switch. The system is the coolest and most technical-reading of the three.
- **02 — Craftsman:** a workshop/seal metaphor. The mark reduces ش's three dots to one bold stamped dot above a single confident curved stroke, inside a circular seal — an intentional economy, not a shortcut (three dots do not survive favicon scale; one does). Geometry is soft and generous. Motion settles gently, like something placed down with care. The system is the warmest of the three and the most visually distant from SHAGHIL's current implementation.
- **03 — Kinetic:** a momentum metaphor. The mark is a single bold diagonal "go" stroke with a small secondary base notch that recedes at favicon scale, leaving the diagonal alone as the carrying shape. Geometry is sharp and minimal. Motion is short and directional. This system keeps the closest continuity with SHAGHIL's current near-black/off-white base.

## Exact colors

All ten tokens (background, surface, foreground, muted, border, brand signal, secondary, success, warning, error) are specified with hex and RGB values on each board's §E and reproduced in each direction's `tokens.css`. Summary of the primary brand-signal token per direction:

| Direction | Brand signal | Hex | RGB |
|---|---|---|---|
| 01 Operator | Ember amber-orange | `#E8873A` | rgb(232,135,58) |
| 02 Craftsman | Terracotta/rust | `#B8563A` | rgb(184,86,58) |
| 03 Kinetic | Cobalt | `#2F5AF0` | rgb(47,90,240) |

None of the three reuse MIGHT MADE's Electric Lime or Champagne as SHAGHIL's own brand signal, keeping SHAGHIL visually distinct per instruction. Direction 03's brand signal was deliberately chosen as cobalt rather than a red/orange specifically to avoid colliding with the Error semantic in a real interface — documented on that board.

## Typography

Each board's §F renders an actual nine-row hierarchy (Arabic Display/H1/H2/Body/UI label/metadata, Latin Display/H1/Body-UI) in the real chosen faces, with a rationale paragraph. Summary:

| Direction | Arabic | Latin |
|---|---|---|
| 01 Operator | Noto Kufi Arabic (display) + IBM Plex Sans Arabic (body/UI) | Space Grotesk (display) + IBM Plex Sans (UI) |
| 02 Craftsman | Almarai (all weights) | Manrope (display + UI) |
| 03 Kinetic | Tajawal (all weights) | Sora (display) + Inter (UI, retained from current product) |

## Symbol rationale

All three marks are built from the same source letterform (ش's base stroke + dot cluster), abstracted differently per direction's metaphor, and each board's §C states explicitly how the mark behaves at 16px — none rely on detail that only survives at large size. None use a robot, brain, magic star, chat bubble, literal power-button glyph, or a literal Saudi cultural motif, per instruction.

## Arabic wordmark rationale

Each board's §A explains, letterform by letterform (ش, غ, the shadda, overall rhythm), why that direction's chosen face reads as intentional rather than a default-font placeholder — the exact gap identified in the Phase 1 audit (`SHAGHIL_BRAND_DIRECTIONS.md` §1: "no Arabic typeface is chosen at all... a functional placeholder, not a designed mark"). All three genuinely resolve that gap, each in a different register.

## UI implications

Each board's §G/§K apply the direction's tokens to the same realistic fragment of the real product's actual current screen content (top nav, engine cards, an input, a status line, a result block with save/second-version actions) — proving each direction is implementable against the existing, closed product structure without any layout change. No product screen was redesigned; only color, type, radius, and iconography vary.

## Website implications

Each board's §I renders the identical Founder-specified hero content (شغّل / حوّل سياق نشاطك إلى شغل جاهز. / Business Brain → Content → Campaigns → Visuals / ابدأ شغلك / by MIGHT MADE) in that direction's system — a conceptual mockup only, confirming no direction requires different messaging or structure to work as a hero, only different typography/color/mark.

## MIGHT MADE relationship

No attempt was made to reconstruct, redesign, or approximate MIGHT MADE's actual locked Primary Signature or logo in any board — "by MIGHT MADE" is rendered as small, muted, letter-spaced plain text only, on every board (§J), per explicit instruction. Each board's evaluation table (§ "Relationship to MIGHT MADE") states the factual color/register distance from MIGHT MADE's approved charcoal/off-white/Champagne/restrained-Lime system: Direction 03 sits closest (near-monochrome base, flagged as needing explicit care to stay distinct rather than merged), Direction 01 shares MIGHT MADE's *principle* of one controlled signal color without sharing its palette, and Direction 02 diverges furthest (warm ink base). None of the three use Electric Lime or Champagne as SHAGHIL's own accent.

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
