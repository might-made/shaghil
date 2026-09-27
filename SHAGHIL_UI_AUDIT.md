# SHAGHIL UI Audit

Direct inspection of `index.html` (the entire product UI), `lib/visual-studio.mjs`, and related runtime files. No product code was modified during this audit — every finding below is evidence gathered by reading the shipped source, not inferred.

## A. Patterns worth preserving

- **Border discipline is already strong.** Every bordered element in the entire product uses exactly one value: `1px solid var(--l)`. This is a genuinely good existing constraint — the design system should formalize it as the default border token rather than "fixing" something that already works.
- **No box-shadow anywhere in the product.** Hierarchy today is carried entirely by surface color and border, never by shadow. This already matches the Founder's stated principle ("Graphite Pulse should carry most hierarchy through surfaces, not through large shadows") — the design system should codify this as a rule, not introduce shadow-heavy elevation from scratch.
- **The RTL/LTR document-level handling is correct** (confirmed in the typography audit and re-confirmed here): `dir="rtl"` root with explicit `dir="ltr"` only where genuinely needed. Worth preserving exactly as-is.
- **The `show()` view-switching pattern** (one function toggling a `.hidden` class across named sections) is simple and has no accessibility red flags on its own — worth keeping as the underlying navigation mechanism while restyling what it switches between.

## B. Inconsistent patterns

- **Border-radius has no system**: 7 distinct values in active use — 8px, 12px, 13px, 14px, 16px, 20px, 22px — applied seemingly by feel rather than by role. A button, a card, and the top nav bar all use different radii with no discernible logic tying the value to the component's size or role.
- **Spacing has no system**: padding alone uses at least 10 distinct pixel values (5, 9, 10, 12, 13, 14, 16, 20, 22px, plus compound values like "12px 14px"); margin adds another half-dozen distinct values (5, 8, 10, 12, 18, 20px). Nothing suggests a 4px or 8px base unit — values look chosen per-element rather than drawn from a scale.

## C. Duplicated patterns

- **One generic `.card` class covers everything**: the same `.card` styling is reused, unmodified, for the six engine-selection tiles, the welcome/setup/output/history/Visual Studio screens' outer containers, and the Business Brain grid — a content card, a navigation tile, and a page-level container are all visually the same object today. The Founder's brief explicitly calls for distinct semantic card types; this is the concrete evidence that gap is real, not hypothetical.
- **Emoji as the entire icon system**: 🗓️✍️🎯💬🚀🎬 are the only "icons" in the product, used purely as engine-card decoration. There is no icon library, no stroke/fill consistency, no controllable size or color — emoji rendering is entirely OS/browser-dependent (Apple, Google, Microsoft, and Samsung all render the same codepoint differently), so today's "iconography" is actually zero design control.

## D. Weak hierarchy

- The empty History state is a single unstyled sentence (`<p>ما فيه نتائج محفوظة حتى الآن.</p>`) with no container, no visual distinction from a loading or error state, and no call-to-action pointing the user back to an engine. This is the only empty state in the product and it under-communicates.
- Destructive confirmation (deleting a History item) uses the browser's native `confirm()` dialog — an unstyled OS-native popup completely outside the SHAGHIL brand, the one place in the whole product where the user leaves the designed environment entirely.

## E. Spacing inconsistencies

Covered under C above with exact figures — restated here as its own finding because the brief asks for it explicitly: no element-to-element spacing in the current product can be explained by a shared scale; every gap looks locally chosen.

## F. Radius inconsistencies

Restated with figures for clarity: 8, 12, 13, 14, 16, 20, 22px are all in simultaneous use with no visible rule for which value goes with which component size or role.

## G. Border inconsistencies

The opposite of a weakness: borders are the one dimension that's already fully consistent (`1px solid var(--l)` everywhere, one exception being the 2px focus-visible outline, which is a legitimate, distinct state and not an inconsistency). No fix needed here — only formalization.

## H. State inconsistencies

- **No hover/pressed transition timing anywhere.** The only two `@keyframes` in the entire stylesheet are for a button spinner and a skeleton-loading shimmer — every hover and disabled-state change happens with an instant, untransitioned snap. There is no interaction-timing system at all today.
- **No dedicated focus-ring token** beyond a single global `outline: 2px solid var(--a)` rule — functional, but not differentiated by component type (an input's focus state and a button's are visually identical).
- **No loading state exists for buttons beyond `:disabled { opacity: .45 }`** — a button mid-request looks identical to a button that's simply unavailable, with no distinction between "disabled" and "busy."

## I. RTL/bilingual issues

- No genuine bidi bugs were found at the document-integration level (this echoes the typography-phase finding, re-confirmed here) — the real bidi risk found previously (signed numerals reordering) lives in content rendering, not in this phase's structural UI patterns, and remains addressed by the typography system's documented `<bdi>` rule.
- **No directional-icon convention exists at all**, because no real icon system exists yet (see C above) — chevrons, back/forward affordances, and similar directional icons have never been implemented, so there is no existing behavior to preserve or fix, only a rule to establish fresh in this phase.

## J. Accessibility concerns

- The native `confirm()` dialog (noted under D) is also an accessibility concern: it cannot be styled to meet the product's own contrast/typography standards and its focus behavior is entirely delegated to the browser, outside the product's control.
- Only one responsive breakpoint exists (`@media(max-width:700px)`) — there is no intermediate tablet treatment; layout jumps directly from desktop to a single mobile stack. The Founder's brief requires 375/768/1440px to all be genuinely considered, which today's single-breakpoint CSS cannot support without new rules.
- No component in the current product goes below 12px text, which is consistent with (and already respects) the newly locked 11px Metadata floor — a pattern worth preserving, not a concern, but worth stating so the design system doesn't accidentally regress it.

## Scope note

This audit is descriptive only. No file under `index.html`, `lib/`, or `api/` was modified to produce it.
