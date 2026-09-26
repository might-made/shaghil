# SHAGHIL Color System — Exploration

**STATUS: THREE DIRECTIONS DELIVERED FOR FOUNDER REVIEW — NO SELECTION MADE**

Branch: `shaghil-brand-final`. Starting baseline: `91b378db00e0b5ce4853e4be05401d71a679e3f2` (SHAGHIL Logo Track — locked). The logo geometry, Arabic wordmark, English SHAGHIL lockups, micro-mark, favicon, app icon, minimum-size rules, and clear-space rules are unchanged and untouched by this phase. Color is applied on top of the locked master (fill only, per this phase's explicit permission); no path geometry was modified anywhere.

## Step 1 — Audit

The product is a single-page RTL Arabic SaaS MVP (`index.html`, `lib/`, `api/`) with one dark-mode-only theme today:

```
--bg:#0e1012  --p:#181b1f  --p2:#20242a  --t:#f6f4ef  --m:#aab0b6  --l:#2d333a  --a:#e7f95b
```

Structure audited: top nav (logo tile, الرئيسية / Business Brain / السجل), welcome/setup screens, Business Brain grid, Brand Brain identity form (including a live brand-color picker already exposed to end users), Product Library, six engine cards (سوّ محتوى، اكتب لي، ابنِ عرض، رد على عميل، سوّ حملة، اكتب Reel), markdown result output, History (text results + visual designs + campaign packs), Visual Studio (generation controls + generated-image preview), toasts, skeleton loaders, and status/sensitivity notices.

**A — Where color is functionally required:** focus states (already accent-colored today), primary CTA vs. secondary action distinction, active/selected nav and tab states, loading indicators, and the four semantic states (success/warning/error/info) — today success/error are not visually distinguished from ordinary text at all.

**B — Where color should stay restrained:** the markdown result body (`.out`), History list items, and Business Brain data grid — these are long-form Arabic reading surfaces; heavy color here would hurt legibility and compete with the content itself.

**C — Where brand color creates recognition:** the top-bar logo tile, primary CTA buttons, focus rings, active nav/tab indicators, and the micro-mark/favicon/app-icon — the smallest, most repeated brand touchpoints are where a distinctive color earns the most recognition per pixel.

**D — Where semantic colors are required:** save confirmations (currently a plain gray toast), the data-sensitivity warning already shipped in Business Brain, the "ما قدرنا نكمل المهمة" error block (currently unstyled), and informational notices in Visual Studio (e.g. "الشعار والنص يضافان بعد التوليد").

**E — Where excessive color would damage premium positioning:** any full-bleed gradient background (a known generic-AI-startup cliché this phase is explicitly told to avoid), color competing with or bordering **generated Visual Studio imagery** (the image itself must remain the visual focus), and recoloring large surfaces behind dense Arabic text.

No product code was modified during this audit.

## Step 2–3 — Three Directions

Three complete, meaningfully different systems were built — not ten swatches. Full token JSON: `brand-final/color/concepts/`.

### B. C1 — Signal Indigo — strategic rationale
A proprietary digital-signal territory: one highly saturated indigo-violet (`#4B3FF2` light / `#8377FF` dark) as the sole brand hue, deliberately paired with a warm coral counter-accent (`#FF6B4A`) so the system never collapses into generic all-blue "AI tech." Used flat, never as a gradient. This is the direction that leans most into "digitally native / technologically advanced."

### C. C1 — complete token palette

| Token | Light | Dark |
|---|---|---|
| Primary | `#4B3FF2` | `#8377FF` |
| Secondary | `#14151A` | `#C7C8D6` |
| Accent | `#FF6B4A` | `#FF8B6E` |
| Background | `#FFFFFF` | `#0B0B10` |
| Surface | `#F5F5F8` | `#16161D` |
| Elevated Surface | `#FFFFFF` | `#1E1E27` |
| Primary Text | `#14151A` | `#F2F2F5` |
| Secondary Text | `#585C68` | `#B0B1BE` |
| Border/Divider | `#E3E4EA` | `#2B2C36` |
| Interactive/CTA | `#4B3FF2` | `#8377FF` |
| Hover | `#3B2FE0` | `#9A90FF` |
| Focus | `#4B3FF2` | `#8377FF` |
| Disabled | `#E4E4EC` / `#9799A8` | `#2A2B34` / `#71737F` |
| Success | `#1C8555` | `#4ADE80` |
| Warning | `#9A6300` | `#FBBF24` |
| Error | `#C4291B` | `#FF8A80` |
| Info | `#0E6FA8` | `#5AC8FA` |

Tonal ramp (indigo 50→900): `#EEECFF #DAD6FF #B6ADFF #9186FF #6E60FF #4B3FF2 #3B2FE0 #2E24B3 #211A85 #150F52`

### D. C2 — Graphite Pulse — strategic rationale
Engineered dark-first, because the product's real default *is* dark today. A refined graphite neutral scale carries one crisp electric mint-cyan "pulse" (`#29F0C6` dark / `#0F9C82` light) as the single signal color. Light mode is a deliberately-designed companion (its own darker teal for correct contrast), not a naive inversion of dark mode. This is the direction proven to perform exceptionally in the product's actual dark UI.

### E. C2 — complete token palette

| Token | Dark (primary design surface) | Light (companion) |
|---|---|---|
| Primary | `#29F0C6` | `#0F9C82` |
| Secondary | `#7C8A90` | `#4B565C` |
| Accent | `#29F0C6` | `#0F9C82` |
| Background | `#0A0C0D` | `#FFFFFF` |
| Surface | `#131619` | `#F2F4F4` |
| Elevated Surface | `#1B1F23` | `#FFFFFF` |
| Primary Text | `#F5F7F7` | `#101214` |
| Secondary Text | `#A6AFB4` | `#565F64` |
| Border/Divider | `#262B2F` | `#DEE2E3` |
| Interactive/CTA | `#29F0C6` | `#0D8670` |
| Hover | `#5CF5D6` | `#0C7F6B` |
| Focus | `#29F0C6` | `#0F9C82` |
| Disabled | `#202427` / `#5C6469` | `#E5E8E8` / `#9AA3A5` |
| Success | `#3DDC84` | `#1C874A` |
| Warning | `#FFC24B` | `#9A6300` |
| Error | `#FF6B6B` | `#C4291B` |
| Info | `#5AC8FA` | `#1D6FB8` |

Tonal ramp (mint 50→900): `#E3FFF8 #B8FCEC #7FF6DD #5CF5D6 #29F0C6 #0F9C82 #0C7F6B #096355 #074A40 #04322B`

### F. C3 — Dusk Oud — strategic rationale
A warm, culturally resonant premium territory built from sand/oud/desert-dusk material references — deliberately not the flag-green shortcut. Primary is a deep terracotta-ember (`#A8402A` light / `#E07A52` dark) against warm stone neutrals, with a muted antique-gold accent reserved for rare moments of richness. This is the direction that leans hardest into "credible for Saudi businesses" through warmth and material sophistication rather than mimicry.

### G. C3 — complete token palette

| Token | Light | Dark |
|---|---|---|
| Primary | `#A8402A` | `#E07A52` |
| Secondary | `#6B4A34` | `#C8B49C` |
| Accent | `#C08A2E` | `#D9A94A` |
| Background | `#FBF7F2` | `#17120D` |
| Surface | `#F3EBE1` | `#201A14` |
| Elevated Surface | `#FFFFFF` | `#2A231C` |
| Primary Text | `#241B14` | `#F5EEE5` |
| Secondary Text | `#6E6055` | `#BDAE9B` |
| Border/Divider | `#E4D8C9` | `#3A3226` |
| Interactive/CTA | `#A8402A` | `#E07A52` |
| Hover | `#8E3521` | `#EC9673` |
| Focus | `#A8402A` | `#E07A52` |
| Disabled | `#EBE1D4` / `#AE9F8D` | `#332A22` / `#7A6E5E` |
| Success | `#3C7A4E` | `#6FCF8E` |
| Warning | `#9A6300` | `#F0B23A` |
| Error | `#C4291B` | `#F0685A` |
| Info | `#3E6E8E` | `#6FA8C9` |

Tonal ramp (terracotta 50→900): `#FBEEE8 #F4D5C6 #E9AF8E #E07A52 #C4562F #A8402A #8E3521 #712A1A #521E13 #33130C`

## Step 3 — Color behavior (all three)

| | C1 Signal Indigo | C2 Graphite Pulse | C3 Dusk Oud |
|---|---|---|---|
| Dominance ratio | 72% neutrals · 18% primary · 10% accent/semantic | 78% neutrals · 14% primary · 8% semantic | 75% warm neutrals · 17% primary · 8% accent/semantic |
| Primary appears | CTAs, active/selected states, focus rings, links, logo tile, key brand touchpoints | CTA, focus, active nav/tab, progress, single data-highlight moments | CTA, active states, focus rings, featured-content highlights, marketing logo tile |
| Primary must NOT appear | Body text, full-bleed backgrounds, borders around generated imagery, disabled/error states | Large background fills, behind long-form Arabic text, borders on generated imagery, error states | Body text, full-bleed screens, borders on generated imagery, disabled/destructive states |
| Logo normally | Black on light, white on dark/primary — context-dependent, never recolored into the primary hue itself | Same rule — white is the default given this system is dark-first | Same rule — black on the warm off-white default |

Correct use on all six required backgrounds (white / off-white / light neutral / dark / black / primary-color background) is shown directly on each board's Section 03.

## Step 4 — Light + dark system

Each direction ships full, independently-tuned light and dark tables (not inversions) covering: page background, navigation, cards, inputs, CTA, secondary CTA, selected/hover, focus, disabled, and all four semantic states. Rendered on Sections 04–05, 09–11 of each board.

## H. Light/dark behavior summary

- **C1** — light and dark share the same indigo hue family, dark mode uses a lifted, higher-luma indigo (`#8377FF`) so it reads correctly against a near-black background rather than looking muddy.
- **C2** — dark is the primary design surface (the product's real default); light mode substitutes a materially darker teal (`#0F9C82`) for its CTA fill, since the bright dark-mode mint fails AA as a background for white text on light backgrounds.
- **C3** — dark mode brightens the terracotta (`#A8402A` → `#E07A52`) for correct contrast against the warm near-black oud background, while keeping the same warm hue family throughout.

## Step 5 / I. Accessibility QA results

Computed with real WCAG 2.1 relative-luminance math (`brand-final/color/qa/contrast.mjs`), not visual judgment — script and full results committed at `brand-final/color/qa/`.

**Enforced pairs tested per direction, per mode:** body text/background, secondary text/background, body text/surface, secondary text/surface, CTA text/CTA background, nav text/background, input text/input background, secondary text/input background, all 4 semantic text/background pairs, primary/background (link/icon use), focus ring/background.

**Result: 0 failures across all three directions, both modes, all enforced pairs**, after two real fixes applied during this phase:
- C1 light-mode success green `#1E8E5A` (4.14:1) → darkened to `#1C8555` (4.63:1) to clear the 4.5:1 body-text threshold.
- C2 light-mode CTA `#0F9C82` as a button background with white text (3.44:1) → given its own darker CTA-only value `#0D8670` (4.51:1); the original teal is retained for link/icon/focus use, which only requires the 3:1 large-text/UI-component threshold and already passes there.
- C2 light-mode success green `#1D8A4C` (4.38:1) → darkened to `#1C874A` (4.55:1).

Decorative dividers and disabled-state text were measured and reported for transparency (`brand-final/color/qa/contrast-results.json`) but are correctly WCAG-exempt (1.4.11 exempts purely decorative borders where a background-color difference already distinguishes the element; 1.4.3/1.4.11 exempt inactive/disabled UI components) — not counted as failures.

Full per-pair ratios for both modes of all three directions are rendered directly on Section 14 of each board.

## Step 6 / J. Real SHAGHIL application boards

One high-resolution board per direction, all 15 required sections, built from the actual locked logo master (`brand-final/logo/master/SHAGHIL_MASTER_AR.svg` — geometry read directly from the file, fill color swapped only, no path ever touched) and the real product's structure/copy:

- `brand-final/color/boards/SHAGHIL_COLOR_C1.png`
- `brand-final/color/boards/SHAGHIL_COLOR_C2.png`
- `brand-final/color/boards/SHAGHIL_COLOR_C3.png`

Sections: 01 core palette · 02 full token system · 03 logo color applications · 04 light UI · 05 dark UI · 06 Business Brain · 07 Brand Brain · 08 Visual Studio · 09 CTA/button states · 10 form/input states · 11 semantic states · 12 favicon/app icon · 13 marketing/social application · 14 accessibility results · 15 dominance/usage rule.

## Step 7 — Real product-context simulation

Sections 04–08 of every board simulate the actual current product structure and real Arabic copy pulled directly from `index.html` (top nav labels, welcome headline, engine card titles/descriptions, Business Brain field data, Brand Brain form, Visual Studio controls) — in both light and dark mode, in RTL, with the real logo. Visual Studio's generated-image slot uses a neutral placeholder pattern (never a fabricated customer photo) so color never competes with actual generated content. This is exploration only: `index.html`, `lib/`, and `api/` were not modified.

## Step 8 / K. Ownability / category observations (no ranking, no selection)

**C1 — Signal Indigo:** Likely reads alongside premium B2B SaaS/AI tools (a category where violet-indigo is common). Similarity risk is real if discipline lapses — the flat, non-gradient application and coral counter-accent are what keep it proprietary rather than generic; a future gradient treatment would erode that. Strong in digital environments and at small sizes (favicon/app icon read as a clean solid block). Indigo carries no inherent regional resonance, so "distinctly Saudi" would have to be carried entirely by typography, wordmark, and copy, not the color itself.

**C2 — Graphite Pulse:** Likely reads alongside developer tools, technical dashboards, and fintech/trading UIs (dark+mint/cyan is a recognized "technical precision" signal). Because SHAGHIL's actual users are small-business owners rather than developers, this territory risks feeling more technical/cold than the target audience's own context unless balanced elsewhere. Its dark-mode performance is genuinely exceptional since it was engineered for the product's real default surface. Neon-mint-on-dark has cycled through tech-brand fashion before, carrying some risk of feeling era-specific rather than timeless.

**C3 — Dusk Oud:** Likely reads alongside premium Gulf hospitality/lifestyle and heritage-forward retail branding (warm terracotta/sand is a known register there). Risk of reading as a hospitality or lifestyle brand rather than an AI software product unless paired with disciplined, precise UI chrome. It is the most culturally resonant and premium-feeling of the three without flag-color mimicry, and required the most deliberate contrast tuning to clear WCAG AA cleanly (now fully passing). Strongest fit for "credible for Saudi businesses," with "digitally native" needing to be earned through product polish rather than the palette alone.

## L. Files created

```
brand-final/color/
  concepts/
    C1-signal-indigo.json
    C2-graphite-pulse.json
    C3-dusk-oud.json
  boards/
    build-color-board.mjs
    C1-board.html / C2-board.html / C3-board.html
    SHAGHIL_COLOR_C1.png
    SHAGHIL_COLOR_C2.png
    SHAGHIL_COLOR_C3.png
  qa/
    contrast.mjs
    run-contrast-qa.mjs
    contrast-results.json
SHAGHIL_COLOR_SYSTEM_EXPLORATION.md
```

## Q. Founder review instruction

Review the three boards (`brand-final/color/boards/SHAGHIL_COLOR_C{1,2,3}.png`) independently. No direction has been selected, ranked, or combined — that decision is the Founder's. On selection, the next step is applying the chosen direction's tokens into an actual design-system/typography phase; no color has been implemented in production, and `index.html`/`lib/`/`api/` remain untouched.

## Step 9 — Strict scope confirmation

Not touched this phase: the approved logo's geometry, production/runtime code, SHAGHIL UI, typography, website, marketing-campaign design, motion identity, MIGHT MADE branding. No gradients were used anywhere in any of the three systems. No neon-rainbow AI cliché. No winner selected. No branches merged. No historical/frozen branch modified.
