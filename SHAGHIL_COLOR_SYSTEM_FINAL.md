# SHAGHIL Color System — Final

**STATUS: SHAGHIL COLOR SYSTEM — FOUNDER APPROVED — LOCKED**

Founder selected **C2 — Graphite Pulse** from the three exploration directions (`SHAGHIL_COLOR_SYSTEM_EXPLORATION.md`, commit `0df322364940ced970200fe86d7f06985ad8a431`). This document locks its final, production-ready refinement. Branch: `shaghil-brand-final`. Logo geometry is unchanged throughout — color is applied as fill only, on the already-locked master paths.

## Color principle

Color is a **system signal**, not decoration. Graphite carries the environment; the mint/cyan signal is a controlled activation color, used sparingly for one primary action or state at a time. The SHAGHIL master logo remains fundamentally black/white.

## Audit of the selected exploration (before any change)

Six genuine production issues were found in the exploration-round C2 tokens and fixed here; nothing was changed without a specific reason:

1. `accent` was a literal duplicate of `primary` — no real accent/signal scale existed (no pressed state, no subtle background, no dedicated border or on-light-text variant).
2. The neutral hierarchy had only 3 levels (background/surface/elevatedSurface) — missing deepest-background, subtle-surface, strong-border, and muted-text tiers.
3. The dark-mode primary mint (`#29F0C6`, HSL 167°/87%/55%) was genuinely fluorescent-leaning.
4. No "pressed" interactive state existed anywhere, only hover.
5. The generic `secondary` token was vague and effectively unused.
6. The success green (`#3DDC84`) sat only ~29° of hue away from the mint signal (~150° vs ~166°), risking confusion between "success" and "brand signal."

## D. Final Graphite palette

| Token | Dark | Light |
|---|---|---|
| Deepest background | `#07080A` | `#EEF1F1` |
| Primary background | `#0A0C0D` | `#FFFFFF` |
| Surface | `#131619` | `#F5F7F7` |
| Subtle surface | `#171B1F` | `#EDEFEF` |
| Elevated surface | `#1B1F23` | `#FFFFFF` |
| Border | `#262B2F` | `#DEE2E3` |
| Strong border | `#5A6169` | `#828B8E` |
| Primary text | `#F5F7F7` | `#101214` |
| Secondary text | `#A6AFB4` | `#565F64` |
| Muted text | `#838D92` | `#636B6F` |

A genuine 7-step neutral scale in each mode (verified: every text tier passes AA against every surface tier — 30 pairs checked, 0 failures).

## E. Final Signal/Mint palette

| Token | Dark | Light |
|---|---|---|
| Signal primary | `#24BC99` | `#127D64` |
| Signal hover | `#35DEB7` | `#0F6B56` |
| Signal pressed | `#1A9377` | `#0B5645` |
| Signal subtle background | `#123029` | `#E7F8F4` |
| Signal border | `#24BC99` | `#127D64` |
| Signal text-on-light | `#127D64` | `#127D64` |

Tuned down from the exploration mint (`#29F0C6`, HSL 167°/87%/55%) to a calmer, controlled tone (dark primary `#24BC99`, HSL 166°/68%/44%) — still clearly proprietary teal-mint, but reading as a controlled signal rather than fluorescent/neon.

## F. Light-mode system

Built as its own intentional system, not an inversion of dark mode: a cool-neutral (not warm) graphite scale matching "Graphite Pulse," with its own independently-tuned signal values (darker than the dark-mode signal, since a bright mint fails AA as a button fill with white text on a light page). CTA/hover/pressed all darken progressively for interaction feedback, matching conventional light-mode filled-button behavior.

## G. Dark-mode system

Remains the system's major expression. The 5-level neutral scale (deepest → primary → surface → subtle → elevated) is calm and premium — deliberately not gaming/hacker/terminal, achieved by keeping the signal color restrained (small UI elements only, never a large fill) and by desaturating/darkening the mint from its exploration-round brightness.

## H. Semantic palette

| Token | Dark | Light |
|---|---|---|
| Success | `#34C25E` | `#1A7A40` |
| Warning | `#FFC24B` | `#9A6300` |
| Error | `#FF6B6B` | `#C4291B` |
| Info | `#5AC8FA` | `#1D6FB8` |

Success green's hue (138° dark / 144° light) sits ~25–28° away from the mint signal hue (166°) — a deliberate separation confirmed by direct HSL computation, so a success confirmation is never visually mistaken for the brand-activation color.

## I. Logo color rule

**Primary (default, universal):** black logo on light surfaces; white logo on dark surfaces.

**Secondary/controlled (never the default):** the mint signal color may recolor the logo fill only in specifically controlled contexts (e.g. a single hero moment, a promotional favicon/app-icon tile) — never as the universal or default master. Geometry is identical in every case; only the fill attribute changes, and the locked master path data was never touched.

## J. Color dominance rule

Neutral/graphite environment: **dominant** (~80% of any given screen). White/light-neutral supporting surfaces: the remainder of the non-signal area. Mint/cyan signal: **restrained**, single-digit-percent of any given screen, reserved for one primary action or state at a time. Semantic colors: **functional only** — shown only when their state is actually true, never decoratively.

## K. WCAG QA result

Computed with real WCAG 2.1 relative-luminance math (`brand-final/color/qa/contrast.mjs`). Full Founder-specified matrix tested per mode: primary/secondary/muted text against background and surface, CTA text against CTA/hover/pressed backgrounds, signal used as link/text, focus ring, signal border, strong border, and all 4 semantic states.

**Result: 0 failures across all 17 enforced pairs, both modes** (`brand-final/color/qa/final-contrast-results.json`). One test-design error (checking the light-mode-specific `textOnLight` value against a dark surface it was never meant for) was caught and corrected before the final run, not silently dropped — the corrected test then confirmed the value passes 5.07:1 in its actual documented context (a light/white surface, regardless of overall theme).

## Logo geometry, runtime, and scope confirmation

- No path in `brand-final/logo/master/SHAGHIL_MASTER_AR.svg` was touched — every color application here (Section 05, 14, 15 of the final board) is a fill-attribute swap on the unmodified locked geometry.
- `index.html`, `lib/`, `api/` were not modified. Tokens are reference-only in this phase.
- No Typography phase work was started.
- C1 and C3 concept files were not altered.

## Production asset locations

```
brand-final/color/final/
  shaghil-color-tokens.json   final implementation-ready token source
  shaghil-color-tokens.css    CSS custom properties, [data-theme="dark"/"light"]
  build-final-board.mjs       generates the master board from the token JSON + real logo
  SHAGHIL_COLOR_SYSTEM_FINAL.png   the 18-section final master board
  SHAGHIL_COLOR_SYSTEM_FINAL.html  the board's source (kept for reproducibility)
brand-final/color/qa/
  run-final-contrast-qa.mjs      the final-lock QA matrix
  final-contrast-results.json    full computed results
```

## Misuse rules

- Never use the signal color as a large background fill (full-bleed mint) — reads as neon/cheap and defeats "signal, not decoration."
- Never recolor the logo in a semantic color, a graphite gray, or any tone outside the documented black/white/controlled-signal rule.
- Never let the signal color dominate a screen — one CTA or one active state at a time.
- Never treat light mode as dark mode inverted — each mode's signal values are independently tuned for their own background.

## Next phase

**SHAGHIL Typography System.** Not started in this phase, per explicit instruction.
