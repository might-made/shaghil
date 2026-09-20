# SHAGHIL Brand Directions — Phase 1: Audit + Identity Directions

Branch: `shaghil-brand-final`, created from the closed Product baseline `1b2b3f5d53c388db9dfb0f030b7b250bddbaac55` (SHAGHIL PRODUCT — CLOSED / RELEASE CANDIDATE READY, P0=0, P1=0). This document is brand strategy and identity direction only — no application code was touched. Three directions are presented neutrally; none is recommended over another, and none is implemented.

---

## 1. Current brand audit

Inspected directly from `index.html`'s live CSS (`:root` tokens, component classes) and rendered structure — not assumption.

**Current design tokens:**
```
--bg:#0e1012   near-black background
--p: #181b1f   card surface
--p2:#20242a   input/secondary surface
--t: #f6f4ef   off-white text
--m: #aab0b6   muted gray text
--l: #2d333a   border/line
--a: #e7f95b   single accent (a bright yellow-green / "electric lime")
```
Typography: `font-family:Inter,system-ui,-apple-system,"Segoe UI",Tahoma,Arial` — **Latin-only.** No Arabic-specific typeface is declared anywhere. Arabic text (the majority of all on-screen content, since the product is Arabic-first) currently renders in whichever Arabic font each OS/browser happens to substitute (Tahoma on Windows, San Francisco Arabic on Apple platforms, Noto Sans Arabic on Android/Chrome) — an accident of the platform, not a brand decision.

**A. Brand issue (identity — in scope for this workstream):**
- No Arabic typeface is chosen at all. For an Arabic-native, Arabic-first product, this is the single largest open brand decision — typography is the primary lever for both legibility and premium feel in Arabic digital products, and it is currently undefined.
- The "logo" is the single Arabic letter ش set in the UI's default font inside a flat rounded-square badge (`.logo{background:var(--a)...}ش`) — a functional placeholder, not a designed mark or monogram.
- No favicon or app icon exists anywhere in the repository (no `<link rel="icon">`, no icon files) — the browser tab currently shows a generic default icon.
- The single accent (`#e7f95b`, bright lime on near-black) sits close to a familiar "AI-tool neon-on-dark" convention — exactly the category cliché the Founder's brief asks to differentiate away from, even though the current implementation is admirably restrained elsewhere (no gradients, no glow effects, no robot/brain/sparkle iconography anywhere — those clichés were never actually added).
- The six engine cards use raw platform emoji (🗓️ ✍️ 🎯 💬 🚀 🎬) as icons — legible and functional, but an unowned, OS-dependent icon treatment rather than a designed system.
- Result output, loading skeletons, and toasts use plain, functional styling with no distinctive brand voice.
- Minor token inconsistency: card border-radius is 22px while the sticky header pill is 20px — a small, real inconsistency worth resolving once an identity is chosen, not urgent on its own.

**B. Product UX issue (out of scope — product development is closed, not reopened here):**
Layout structure, information architecture, screen flow, interaction patterns, and copy content are product decisions already closed via `PRODUCT_CLOSURE.md`. This audit does not revisit them. Nothing found during this brand audit requires a functional/UX change — every finding above is addressable entirely within a visual-identity system (color, type, iconography, mark) layered onto the existing, closed product structure.

**Worth retaining regardless of chosen direction:**
- The dark-surface, card-based structure itself (calm, uncluttered, no visual noise).
- The existing one-primary/one-secondary button convention (`.btn` / `.btn.primary`) — a clean, already-consistent pattern.
- Proper native RTL at the document level (not a mirrored LTR afterthought) — a real strength to preserve.
- The existing small, secondary, muted "Built by MIGHT MADE" credit line beneath the wordmark — a workable precedent for parent-brand architecture (see §3).
- The absence of AI clichés (no robots, brains, magic stars, or gradients anywhere today) — nothing to actively remove, only something to positively define.

**Note on Visual Studio's generated output:** the marketing visuals SHAGHIL *produces* for a merchant (`composeVisual()`) deliberately take on that merchant's own Brand Brain colors, not SHAGHIL's — correctly so, since those are the customer's assets, not SHAGHIL's identity. This audit concerns SHAGHIL's own brand (the product chrome around that output), not the customer content it generates.

---

## 2. Brand positioning

شغّل is a causative/imperative verb — "operate it," "make it run," "get it working" — not a noun. That is a genuine, ownable strategic asset: most AI products are named like a *place* (a "workspace," a "studio," a "hub" you visit and converse in). SHAGHIL is named like a *command* you issue and a *result* you get back — closer to an action than a destination.

**Working positioning statement:** *SHAGHIL is the execution layer for Saudi business operators — capture your business context once, then run practical tools that produce finished work, not conversation you still have to interpret.*

This favors an identity built around **precision, momentum, and command** over the conversational/exploratory register most AI-chat brands use — a direct, structural differentiator from "generic AI chatbot," independent of any single visual choice.

---

## 3. Brand architecture

Recommendation: **endorsed sub-brand**, not a co-brand and not an unbranded product line.
- SHAGHIL owns its own full identity system (wordmark, mark, color, type) and must be able to stand **completely alone** — this is a functional requirement, not just a preference: a favicon, an app icon, and a social avatar have no room for a parent credit at all, so SHAGHIL has to carry its own weight regardless.
- "by MIGHT MADE" is a small, secondary, consistently de-emphasized credit line — exactly the role it already plays in the current header today. Recommended placements: beneath/beside the SHAGHIL wordmark in the product header (as now), in the public website's footer, and on an About/Credits page.
- "by MIGHT MADE" should **not** appear on the favicon, app icon, or social avatar, and should never appear in a marketing headline at a size or weight competing with the SHAGHIL wordmark itself.
- This matches the instruction not to let MIGHT MADE visually dominate, while still making "SHAGHIL by MIGHT MADE" read as credible — the credibility comes from the quality bar of SHAGHIL's own system, not from MIGHT MADE's visual presence on screen.

---

## 4. Name / language system

- **شغّل** is primary and authoritative everywhere the interface is genuinely Arabic-first (the product UI, the wordmark's dominant form, voice/tone in-product).
- **SHAGHIL** is the fixed Latin transliteration already decided — used for the browser tab title's Latin portion, the URL/domain, social handles, and any bilingual lockup (Arabic wordmark paired with the Latin wordmark) needed for English-language contexts (decks, partner materials, an eventual English marketing surface). The name is not being changed or re-Romanized here.
- **Favicon/app icon:** given browser tabs render at 16–32px, none of the three directions below rely on a full wordmark at that size — each proposes a distinct, reducible mark/monogram instead (detailed per-direction in §6–8).
- **Social/profile usage:** the same reducible mark carries to avatar-sized contexts (square crop, circular crop) for the same reason.

---

## 5. Core brand principles (apply to all three directions)

1. Must work natively in Arabic first — RTL is the default reading direction, not an accommodation.
2. Must be legible and confident at favicon/avatar scale, not only at presentation-slide scale.
3. Must avoid literal AI iconography (no robots, brains, sparkles/magic stars) and avoid gradient-driven "AI glow" styling.
4. Must avoid literal Saudi heritage ornament (no falcon, palm, sword, or geometric-pattern wallpaper) — Saudi-aware through restraint and quality, not literal motif.
5. Must read as an operating tool, not a chat companion — confident and direct, not cute or conversational.
6. Must scale cleanly from a mobile screen to a marketing site to a product screenshot without redesign.

---

## 6. Direction 01 — المُشغّل / The Operator

**B. Core idea:** SHAGHIL as a precision control panel — you don't "chat" with it, you operate it. Visual language borrows from instrument panels, switches, and indicator lights: deliberate, engineered, exact.

**C. Strategic rationale:** literalizes the verb شغّل ("operate/switch on") more directly than the other two directions, in a register (engineered precision) that has essentially no presence in the current Arabic AI/SaaS category — most competitors lean soft/conversational or generically neon-tech.

**D. Brand personality:** precise, deliberate, engineered, quietly confident. Not playful.

**E. Arabic wordmark:** شغّل set in a geometric, engineered Arabic face with even, mechanical letter-spacing — the letterforms should look drawn with a ruler, not brushed.

**F. English wordmark:** SHAGHIL in a matching geometric grotesk, all-caps, tight tracking — reads like a panel label.

**G. Symbol/monogram:** the three dots and base stroke of ش abstracted into a minimal "toggle/notch" glyph — legible as an indicator mark at 16px, and as ش on closer inspection.

**H. Primary palette:** deep graphite near-black (structural base, close to today's `#0e1012`, retained for continuity) + one ember/signal accent (a controlled amber-orange, e.g. `#E8873A`) used *only* for primary actions and live status — like a single lit indicator on an otherwise dark panel, never a wash of color.

**I. Supporting palette:** steel-gray surfaces, a muted brass secondary for tertiary marks (dial ticks, dividers).

**J. Typography:** Arabic — IBM Plex Sans Arabic (engineered, excellent screen legibility) for UI, Noto Kufi Arabic for display/mark contexts. Latin — Space Grotesk or IBM Plex Sans for headlines; Inter retained for UI body (lowest-disruption continuity with the current product).

**K. Shape/geometry:** squared-off corners with small consistent chamfers (not the current 20–22px soft rounding) — reads mechanical, not friendly-app-rounded.

**L. Iconography:** a small custom set replacing the current emoji — flat, two-tone, panel-label style icons (a toggle, a gauge, a switch), not illustrative.

**M. Motion principle:** snap, not ease — short, decisive state changes (a switch flipping), no bouncy/organic easing.

**N. Imagery/visual-content treatment:** high-contrast product photography with hard directional light, minimal props — consistent with Business Brain's existing "instrument panel" feel.

**O. Product UI application:** the existing dark card system carries over almost unchanged; buttons/status indicators pick up the ember accent for primary actions only, replacing the current lime.

**P. Public website application:** dark, panel-like hero sections; headline typography does the work, minimal imagery.

**Q. App icon/favicon:** the toggle/notch monogram on the graphite base — reduces cleanly to a single-color mark.

**R. "by MIGHT MADE" treatment:** small caption in Plex Sans/Inter, muted gray, unchanged role from today.

**S. Ownable:** the engineered-panel register is currently unclaimed in this category; directly dramatizes the product name's literal meaning.

**T. Risks:** can tip cold/technical if the ember accent and Kufi display touches aren't kept warm enough; requires real icon-set investment (the current emoji shortcut goes away entirely).

---

## 7. Direction 02 — الحِرفي / The Craftsman

**B. Core idea:** SHAGHIL as a skilled operator's workshop — precision through craft, not through machinery. A confident, grounded, modern-heritage register: warm materials, a maker's mark, not literal heritage ornament.

**C. Strategic rationale:** the strongest "Saudi-aware, premium, not-generic-tech" claim of the three, achieved through warmth and restraint rather than any literal cultural motif (no pattern, no calligraphy flourish, no falcon/palm) — a genuinely underused register in this category, which otherwise splits between cold tech-blue and literal heritage cliché.

**D. Brand personality:** warm, grounded, capable, unhurried confidence.

**E. Arabic wordmark:** شغّل in a warmer, humanist Arabic face with slightly more organic curvature than a pure geometric sans — still fully modern, not calligraphic or decorative.

**F. English wordmark:** SHAGHIL in a humanist sans (lower-contrast, warmer than a grotesk), sentence case rather than all-caps — reads considered rather than shouted.

**G. Symbol/monogram:** a maker's-seal treatment of ش — a single confident stroke, deliberately slightly imperfect (as if stamped), inside a simple square or circle "seal" frame.

**H. Primary palette:** warm ink/charcoal (not pure black, e.g. `#1C1712`) + a grounded terracotta/rust accent (e.g. `#B8563A`) for primary actions.

**I. Supporting palette:** warm sand/clay neutrals for light surfaces and borders, a muted ink-teal as a secondary accent.

**J. Typography:** Arabic — Almarai (warm, highly legible, Saudi-designed) for both UI and display. Latin — a humanist sans (General Sans or Inter, retained) for UI body; the seal monogram carries display weight rather than a second display face, keeping the system restrained.

**K. Shape/geometry:** soft, generous corner radii (slightly larger than today's), tactile rather than sharp.

**L. Iconography:** simple line-drawn tool/craft marks (a stitched edge, a stamp, a measuring mark) — restrained, not illustrative or twee.

**M. Motion principle:** settle, not snap — gentle ease-out transitions, like something being placed down with care.

**N. Imagery/visual-content treatment:** warm, natural light, real materials and real product photography over any illustrated/3D-render style.

**O. Product UI application:** warm ink surfaces replace the current cool near-black; terracotta accent replaces lime for primary actions; card radii soften slightly.

**P. Public website application:** warm, editorial layout; the seal mark used as a recurring anchor motif (section markers, testimonial attributions).

**Q. App icon/favicon:** the seal monogram on the warm ink base.

**R. "by MIGHT MADE" treatment:** same secondary caption role, set in the humanist Latin body face.

**S. Ownable:** no competitor in the Arabic AI/SaaS space currently occupies a warm, craft-grounded register — this direction is the most differentiated from the category as a whole.

**T. Risks:** warmth can read as slower/softer than the "fast execution" positioning wants if the type weight and geometry aren't kept confident and precise; needs disciplined restraint to avoid drifting toward decorative/heritage cliché.

---

## 8. Direction 03 — الحركة / Kinetic Execution

**B. Core idea:** SHAGHIL as pure momentum — "get it moving, now." A minimal, monochrome-forward system built around a single decisive mark and one precise accent used exclusively for the primary action.

**C. Strategic rationale:** the cleanest, most internationally legible of the three — closest in spirit to the product's actual click-to-result speed, and the strongest continuity claim with the current (already largely monochrome) system, requiring the smallest visual departure to implement.

**D. Brand personality:** fast, precise, unornamented, confident.

**E. Arabic wordmark:** شغّل in a clean, slightly condensed modern Arabic face — built for a tight, confident horizontal read, no embellishment.

**F. English wordmark:** SHAGHIL in a crisp geometric sans, tight tracking, no all-caps requirement — legible at both display and UI scale from one face.

**G. Symbol/monogram:** a single diagonal stroke/chevron — doubles as an abstracted, highly reduced ش and as a directional "go" mark. The strongest pure-favicon candidate of the three: legible as a single confident shape at 16px.

**H. Primary palette:** true monochrome spine — near-black/off-white, directly continuing the current `#0e1012`/`#f6f4ef` pairing — plus exactly one precise accent (a confident signal color, e.g. cobalt `#2F5AF0` or signal red-orange `#FF4E33`) used *only* on the single primary call-to-action in any given screen.

**I. Supporting palette:** one light warm gray for secondary surfaces; deliberately no second accent color anywhere in the system.

**J. Typography:** Arabic — Tajawal (clean, modern, already common in well-regarded Gulf digital products, reads fast and native). Latin — Inter retained for both UI and headlines, paired with a tighter display cut (e.g. Neue Montreal or General Sans) only where a headline needs more presence.

**K. Shape/geometry:** sharp-cornered where structural, one consistent small radius elsewhere — no soft/organic shapes at all.

**L. Iconography:** single-weight line icons built from the same stroke logic as the mark — no fills, no illustration.

**M. Motion principle:** directional and fast — elements move along the mark's diagonal, short duration, no bounce.

**N. Imagery/visual-content treatment:** minimal to none — this direction is typographically and geometrically driven rather than photography-driven.

**O. Product UI application:** the smallest change of the three from today's actual CSS — same near-black/off-white base, the lime accent swapped for the one chosen signal color, sharper corners, Tajawal for Arabic text.

**P. Public website application:** large-type, high-contrast, mostly monochrome marketing pages with the accent reserved for a single CTA per screen.

**Q. App icon/favicon:** the diagonal stroke mark alone — the most favicon-safe concept of the three by a clear margin.

**R. "by MIGHT MADE" treatment:** same secondary role, smallest possible visual footprint, consistent with this direction's overall minimalism.

**S. Ownable:** the mark's dual reading (directional "go" stroke / abstracted ش) is a genuinely distinctive, compact idea that travels well to every required surface without compromise.

**T. Risks:** the least distinctly "Saudi" of the three on visual grounds alone — its Saudi/Arabic-native claim rests almost entirely on the Tajawal Arabic typography and language, not on any other visual cue, so that typographic choice carries unusual weight in this direction specifically.

---

## 9. Side-by-side factual comparison

| | 01 — Operator | 02 — Craftsman | 03 — Kinetic |
|---|---|---|---|
| Core metaphor | Control panel / switch | Workshop / maker's seal | Momentum / directional stroke |
| Personality | Precise, engineered | Warm, grounded | Fast, unornamented |
| Base tone | Cool graphite | Warm ink | Neutral monochrome |
| Accent | Ember amber-orange | Terracotta/rust | One signal color (cobalt or red-orange) |
| Arabic type | IBM Plex Sans Arabic / Noto Kufi Arabic | Almarai | Tajawal |
| Latin type | Space Grotesk / IBM Plex Sans | General Sans / Inter | Inter / Neue Montreal |
| Corner language | Squared, chamfered | Soft, generous | Sharp, minimal |
| Mark | Toggle/notch from ش | Stamped seal from ش | Diagonal stroke / abstracted ش |
| Motion | Snap | Settle | Directional, fast |
| Distance from current system | Moderate | Largest | Smallest |
| Strongest claim | Literalizes the verb شغّل | Most Saudi-differentiated | Most universally scalable |
| Primary risk | Can read cold | Can read slow if underexecuted | Least distinctly Saudi visually |

## 10. Implementation implications (for scoping only — not started)

- **01 — Operator:** requires a full custom icon set (current emoji fully retired) and two new typefaces (Arabic + Latin display) licensed/integrated; moderate CSS token rewrite.
- **02 — Craftsman:** requires the most new visual assets (seal mark, line-icon set, warm photography direction) and the largest token rewrite (base color shifts from cool to warm throughout); one new Arabic typeface (Almarai) but Latin body can stay close to current.
- **03 — Kinetic:** requires the smallest engineering footprint — base near-black/off-white tokens are largely retained, only the accent color, Arabic typeface, and corner-radius tokens change; the mark and icon set are still new work but simpler in scope than the other two.

None of these have been started. All three remain equally viable from an engineering-effort standpoint for a product this size — the deciding factor should be brand fit, not implementation cost.

## 11. Questions / decisions requiring Founder approval

1. Which of the three directions (or which specific elements combined across directions) should move forward?
2. Is MIGHT MADE's own identity system available to review, to define any deliberate shared DNA (a shared type-quality bar, a shared restraint principle, or a specific shared token)? This audit could not inspect MIGHT MADE's actual brand assets and did not assume any specific shared element as a result.
3. Confirm the accent-color risk tolerance: Direction 01's ember and Direction 02's terracotta are both warm/saturated; Direction 03 keeps the current cool near-monochrome base — does the Founder have a preference between a warmer or cooler overall system before detailed palette refinement begins?
4. Confirm whether a full custom icon set (replacing the current emoji) is in scope for the next phase, given all three directions require one to varying degrees.
5. Confirm typography licensing preference — all typefaces proposed above are freely licensed (Google Fonts or equivalent open licenses) for web use; flag now if a paid/custom type commission is preferred instead.

---

**Deliverable status:** documentation only. No runtime or product code was modified — only this document was added.
