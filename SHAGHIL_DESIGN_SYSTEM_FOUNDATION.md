# SHAGHIL Product Design System

**STATUS: SHAGHIL PRODUCT DESIGN SYSTEM — FOUNDER APPROVED — LOCKED**

Branch: `shaghil-design-system`, created from the locked brand baseline at `4ed4cae13707498f3cd4e5c43de7f95b4bbce386` on `shaghil-brand-final`. Founder reviewed the initial foundation board and approved the overall direction in principle, then reviewed Refinement Pass 01 (grouped button hierarchy, card semantic differentiation, Thinking-vs-Generating behavior, realistic Home/Business Brain/Brand Brain/Visual Studio/Generated Result/History simulations, full 375px mobile workflow, and expanded dark-mode validation) and approved it with no second refinement pass required. Founder-validated design-system baseline: `b1db54605894cfa5c54af92ca385fa66475017e7`.

This phase was foundation and refinement only — not a logo phase, color exploration, typography exploration, website redesign, product redesign, or runtime implementation. The live product remains untouched throughout.

## Immutability rule

**The SHAGHIL Product Design System is now a locked production foundation.** Future product implementation must consume this system as-is. Do not silently redesign or reinterpret the logo, color, typography, spacing, radius, components, AI states, or responsive rules documented here. Any future change to a locked foundation requires explicit Founder approval and must be documented as a new, dated revision — never a silent edit to this document or its token files.

## Locked foundation stack

| Layer | System | Status |
|---|---|---|
| Logo | SHAGHIL Master Wordmark | **LOCKED** |
| Color | Graphite Pulse | **LOCKED** |
| Typography | IBM Plex Sans Arabic + IBM Plex Sans | **LOCKED** |
| Product Design System | This document's Founder-approved foundation | **LOCKED** |

This stack is now the complete source of truth for the upcoming implementation phase.

## Approved foundation scope

Founder approval covers every part of this locked foundation: design principles; the spacing system; the grid/layout system; responsive behavior at 375/768/1440; the radius system; the border/elevation system; the button system; the input/form system; the card grammar (one shared base, five differentiated roles); navigation; badges; feedback/semantic states; confirmation/dialog behavior; the AI-state system (including the Refinement Pass 01 Thinking-vs-Generating distinction); iconography rules; RTL/bilingual rules; accessibility rules; light mode; dark mode; and the six real-application patterns — Home/Engine Selection, Business Brain, Brand Brain, Visual Studio, Generated Result, and History.

## Relationship to the locked brand

Three systems are immutable inputs to this phase and were not reopened, reinterpreted, or modified: the SHAGHIL logo, the Graphite Pulse color system, and the IBM Plex Sans Arabic + IBM Plex Sans typography system. Every color and type value used anywhere in this design system references those locked token files by name — no hex value or type size was duplicated or silently changed.

## Principles

AI-native, premium, calm, intelligent, focused. Arabic-first and bilingual-ready. A modern Saudi product that is operational rather than decorative — sophisticated without becoming editorial or luxury, distinctive without visual gimmicks. Explicitly avoided throughout: generic SaaS-dashboard aesthetics, purple AI gradients, glow, glassmorphism, oversized radii everywhere, excessive shadow, cards-inside-cards, unnecessary borders, decorative AI-sparkle clichés.

## Existing-product UI audit (full detail in `SHAGHIL_UI_AUDIT.md`)

Direct inspection of `index.html` found: no design-token system anywhere (7 uncoordinated border-radius values, a dozen-plus ad hoc spacing values); a single generic `.card` class reused for every purpose (content, navigation, page container); emoji as the entire icon system; zero interaction-timing (no hover/pressed transitions anywhere); a native, unstyled browser `confirm()` as the only confirmation pattern; a single 700px breakpoint with no tablet treatment; and a one-line, unstyled empty state. Genuinely strong existing patterns — worth preserving, not replacing — were also found: perfectly consistent 1px borders everywhere, and zero box-shadow usage (already matching the Founder's "surfaces carry hierarchy, not shadow" principle).

## Spacing system

An 8-role semantic scale (`space-2xs` 4px → `space-3xl` 64px), validated against the real audited values rather than imported mechanically — the product's existing ad hoc spacing (5, 9, 10, 13, 14, 18, 20, 22px) already loosely gestured toward a 4/8 rhythm, so this scale formalizes that intent. Two additional raw steps (20px, 40px) exist as unnamed utility values for genuine in-between cases, not promoted to named roles.

## Layout / grid system

- **Content max-width: 1080px** — kept from the product's own existing `.wrap` value, already proven to work for its 3-up engine grid and forms, not replaced with an arbitrary new figure.
- **Reading measure: 680px** — a distinct, narrower width reserved for AI-generated long-form content, separate from the wider grid/dashboard shell.
- **Shell:** no persistent sidebar exists in the current product and none is introduced — the shell is a top app bar plus a single stacked content column, matching the product's real structure and its operational (not dashboard-heavy) nature.
- **Breakpoints:** 375px mobile / 768px tablet / 1440px desktop. The card grid goes 1 → 2 → 3 columns across these — a genuine improvement over the current single-breakpoint CSS, which jumps straight from 3-column to 1-column with no tablet state.

## Radius system

Four deliberate steps (`radius-sm` 8px, `radius-md` 12px, `radius-lg` 16px, `radius-full` 999px) replacing the audit's 7 uncoordinated values. Pill-shaped radius is reserved for status badges/avatars only — never general buttons or cards, per the explicit instruction to avoid excessive pill-shaped UI.

## Borders / elevation system

Borders reference the locked Graphite Pulse tokens by name (`graphite.border`, `graphite.borderStrong`, `signal.border`, and the four semantic colors) — never a new hex value. Elevation defaults to **none** everywhere, matching and formalizing the product's existing zero-shadow convention; a `subtle` shadow exists only for popovers/dropdowns, and an `overlay` shadow plus scrim only for modal/dialog surfaces. Graphite Pulse surfaces, not shadow, carry hierarchy — exactly as instructed.

## Component foundation

- **Buttons:** primary / secondary / ghost / destructive, at small (32px) and medium (40px) height only. A "large" size was evaluated and deliberately not added — the product's operational screens are fully served by small/medium; a large CTA would only matter for a future marketing site, out of scope here. States: default, hover, pressed→hover-equivalent, focus (2px signal ring), disabled (45% opacity), and a loading state (inline spinner + label) — the last of these doesn't exist in the product today and directly fixes the audit's "disabled and busy look identical" finding.
- **Inputs:** text input states (default, focus, error, disabled) with label/helper/error-message slots, all built on the same 40px height as the medium button for clean side-by-side alignment.
- **Cards:** five distinct semantic types — standard content, selectable (signal-bordered), action (the engine tiles), KPI/data, and generated-output container — replacing the audit's single generic `.card` class. No card is ever nested inside another card.
- **Navigation:** active state = signal-colored text + 1.5px signal-colored inset border; inactive = muted text, no border; both tested in RTL.
- **Badges/tags:** functional only (status, category, semantic) — never decorative, capped to the four semantic colors plus a neutral and a signal variant.
- **Feedback:** success/warning/error/info as left-accent bordered banners, a loading skeleton, and a rebuilt empty state (message + a real call-to-action button) — directly fixing the audit's under-communicating empty state.
- **Overlays:** an in-brand confirmation dialog (surface, radius, and typography matching the rest of the system) replaces the native `confirm()` found in the audit; plus a dropdown/menu pattern using the `subtle` elevation step.

## AI-interaction system

Ready / Generating / Thinking / Completed / Needs input / Failed, each a small bordered chip with its own restrained color: Generating/Thinking use the locked signal mint (with a spinner) as a controlled, single-purpose activation signal; Completed uses semantic success green; Failed uses semantic error red — deliberately distinct from the signal color, so a finished or failed generation is never visually confused with an active one. No gradient, no sparkle icon, no neon glow anywhere in this language — it reads as operational status, not decoration.

## Iconography rules

Outline style, 1.5px stroke weight, 20px default size (16px inline, 24px header). A representative 12-icon set was built to establish the rule, explicitly not as a proprietary library. RTL rule: directional icons (chevrons, back/forward) mirror with reading direction; non-directional icons (check, search, save, clock, alert, spark) never mirror — both cases are demonstrated on the board.

## Light / dark system

Every primitive (buttons, inputs, cards, navigation, feedback, AI states, modal) was rendered in both modes using the locked Graphite Pulse tokens exactly as defined — dark mode is treated as a first-class environment, not an inversion, consistent with the color system's own lock.

## RTL / bilingual QA

Navigation, forms, badges, and body copy were all tested with real Arabic content, mixed Arabic/English product terms (Business Brain, Visual Studio), and bidi-isolated numeric/SAR values reusing the typography phase's confirmed `<bdi dir="ltr">` fix — no corruption observed anywhere on the board.

## Responsive QA

375px, 768px, and 1440px were all rendered with real layout behavior, not a shrunk desktop view: single column with 16px gutters at mobile, a genuine 2-column card grid at tablet (a new state; the product has none today), and the full 3-column grid at desktop.

## Accessibility QA

Focus rings use the locked 2px signal-border token, visible on every interactive element. No text role anywhere drops below the locked 11px Metadata floor. Every semantic state pairs color with text/icon, never color alone. All interactive targets are 40px (32px only for dense secondary actions, never a primary flow), comfortably above common touch-target guidance.

## Known limitations

- This is a foundation, not a complete component library — drawers, dropdown submenus, and multi-step form patterns were referenced but not fully specified.
- The AI-interaction chips are a visual-state language, not a specification for the actual generation-progress UX (timing, retry logic, etc.), which belongs to a future implementation phase.
- A large button size was deliberately deferred, not designed — it will need real definition if a marketing site is scoped later.

## Implementation considerations (for a future phase — not done here)

`shaghil-ui-tokens.css` is written to load alongside the locked color and typography CSS files and references their custom properties directly (e.g. `var(--shaghil-border-strong)`), so wiring this system into the product means loading three token files together, not one. The native `confirm()` replacement is the single highest-value fix identified in this phase, since it's the only place today where a user leaves the designed environment entirely.

## Files created

```
brand-final/design-system/foundation/
  shaghil-ui-tokens.json         implementation-ready foundation tokens
  shaghil-ui-tokens.css          CSS custom properties (references locked color/type tokens)
  icons.mjs                      representative neutral icon set (rules only, not a library)
  build-design-system-board.mjs  generates the board from tokens + locked logo/color/type
  SHAGHIL_DESIGN_SYSTEM_FOUNDATION.png   the 30-section final review board
  SHAGHIL_DESIGN_SYSTEM_FOUNDATION.html  the board's source (kept for reproducibility)
SHAGHIL_UI_AUDIT.md
SHAGHIL_DESIGN_SYSTEM_FOUNDATION.md
```

## Scope confirmation

Not touched across this entire phase (foundation + Refinement Pass 01 + this freeze): the locked logo, the locked Graphite Pulse color tokens, the locked typography tokens, `index.html`/`lib`/`api`. No implementation into the live product. No merge to `main` or to `shaghil-brand-final`. No frozen historical branch modified.

## Freeze record

Reviewed and approved by the Founder across two review cycles (initial foundation, then Refinement Pass 01). Status is now **SHAGHIL PRODUCT DESIGN SYSTEM — FOUNDER APPROVED — LOCKED**. No component, token, icon, or board visual was changed as part of this freeze — it is a documentation-only closeout of the already-approved `b1db546` baseline.

## Next phase

**SHAGHIL PRODUCT IMPLEMENTATION.** Purpose: apply the locked Logo + Graphite Pulse color + IBM Plex typography + this Product Design System to the existing SHAGHIL product. Implementation must happen on a new branch created from the appropriate validated product baseline — not yet created as part of this freeze.
