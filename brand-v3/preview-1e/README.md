# SHGHIL V3 — Phase 1E: Mobile Application Preview (full bilingual logo)

Branch: `shaghil-v3-brand-implementation`. Review-only — no application file
was changed, no live asset was replaced, no branch merged, no deployment.
**Phase 1C (`brand-v3/preview/`) and Phase 1D (`brand-v3/preview-1d/`) are
byte-for-byte untouched** — confirmed via `git diff --stat` before
committing.

## What this is

A standalone, mobile-first interactive preview applying the complete
bilingual logo شغّيل / SHGHIL across **9 real SHAGHIL screens**, switchable
between the founder's three color-treatment candidates and three view
modes, all without a page reload.

## First: what I actually inspected (not assumed)

Before building anything, I read the live `index.html` in full — not a
summary of it — to get the real screen flow, real field labels, and real
sample data used elsewhere in the product:

- The real top nav (`الرئيسية`، `هوية النشاط`، `هوية العلامة`،
  `مكتبة المنتجات`، `السجل`) and the real six engine cards (titles,
  one-line descriptions, and their inline stroke icons), same source used
  in Phases 1C/1D.
- The real Business Brain field set and labels (`brainLabels` in
  `index.html`), and the app's own real demo dataset (`demo()`'s
  "تحميص ٢٧" coffee-shop example) — used here as explicitly labeled sample
  data, not invented.
- The real Brand Brain fields (logo/reference upload, primary/secondary
  color pickers with their real default hex values `#E7F95B`/`#181B1F`,
  the style-description field's real placeholder text).
- The real Content Engine field set (`fields.content` in `index.html`:
  period, objective, audience, tone, channels, CTA, instructions) and the
  real Campaign Engine fields (`المناسبة`, `المدة`, default "7 أيام").
- The real Visual Studio form (product source, fidelity, idea/day select,
  format optgroup, style options) and the real History screen structure
  (`historyScreen()`'s exact `title · project` format, the Saved Designs
  and Campaign Packs sections).
- There is **no sign-in/auth screen** in this product at all (confirmed:
  no account system anywhere in `index.html`) and **no literal sidebar**
  (one horizontal top bar) — both are disclosed on the relevant screens
  here rather than silently invented.

## Never regenerated, never approximated

Every logo instance is one of Phase 1C's already-committed,
geometry-verified files, read byte-for-byte:
`wordmarks/lockup-horizontal-light.svg`,
`wordmarks/lockup-stacked-light.svg` (charcoal fill, themes B/C), and
`preview/recolored-assets/lockup-{horizontal,stacked}-champagne.svg`
(theme A). **Zero new recolors were created for this task** — every color
treatment needed already existed from Phase 1C. Re-verified again before
use: the champagne files' extracted path geometry is identical to the
charcoal source.

**Shadda/dots verification:** `screenshots/shadda-verification-zoom.png`
is a tight crop of the welcome screen's rendered stacked lockup — all
three dots above ش and the authentic U+0651 shadda directly above غ,
confirmed in Chromium-rendered output.

## The 9 screens

1. **Welcome / entry** — the real `#welcome` copy verbatim (badge,
   headline, body line, both buttons), stacked logo as the splash-style
   treatment (there is no separate splash route in the product).
2. **Home dashboard** — the real hero card + all six real engine cards,
   full horizontal logo in the header. The demo business name shown
   ("تحميص ٢٧") is tagged **بيانات تجريبية** (sample data) since it's the
   app's own real example, not the founder's actual business.
3. **Navigation / engine selection** — explicitly labeled conceptual: the
   live app's nav is a horizontal top bar; a slide-out mobile menu with
   the same five real links is the realistic mobile adaptation, not a
   shipped screenshot.
4. **Business Brain** — the real field labels and the app's own real demo
   dataset, tagged sample.
5. **Brand Brain** — real field structure; the color swatches use the
   product's actual default hex values (`#E7F95B` primary / `#181B1F`
   secondary), labeled as real app defaults (not this preview's own
   theme); the style field shows the product's real placeholder text,
   tagged sample.
6. **Content Engine** — the real field set, pre-filled with the demo
   audience/tone values, tagged sample.
7. **Campaign Engine** — the real field set (occasion/duration); a
   result-area placeholder is explicitly marked "does not represent an
   actual generation result" rather than fabricating marketing copy or
   statistics.
8. **Visual Studio** — the real source/creative-direction form fields and
   options, verbatim.
9. **Saved designs / History** — two sample history entries in the real
   `title · project` format, explicitly tagged sample, plus the real
   Saved Designs and Campaign Packs section headers.

Below all nine, unaffected by screen/theme selection: a **favicon /
home-screen-icon technical exception** — both Phase 1B candidates shown
compact and unchosen, since the brief was explicit the full wordmark
should never be forced into a 16px icon.

## Color treatments

| | Page background | Logo | Content-card surface | Primary button |
|---|---|---|---|---|
| **A** — Champagne on Charcoal | Charcoal `#1B1D1F` | Champagne `#D7BC91` | Off-white `#F6F3EA` | Champagne bg |
| **B** — Charcoal on Off-white | Off-white `#F6F3EA` | Charcoal `#1B1D1F` | White | Charcoal bg |
| **C** — Charcoal on Champagne | Champagne `#D7BC91` | Charcoal `#1B1D1F` | Off-white | Charcoal bg |

Electric lime `#E7F95B` appears in exactly two places, both functional,
never on the logo: the "sample data" tag badge, and the active
navigation-menu item. **No logo SVG geometry is ever changed by theme
switching** — each theme selects one of the two already-verified,
unmodified lockup files; recoloring never touches path data (verified
here again, not just inherited from Phase 1C's guarantee).

## Interaction model

- **Screen tabs** (9, horizontally scrollable) — switch which of the nine
  screens is shown.
- **Theme buttons** (A/B/C) — switch color treatment instantly, no reload.
- **View mode**: *Phone frame* (a realistic device chrome), *Full screen*
  (edge-to-edge, closer to what a real mobile browser shows), and
  *Compare all 3* (the current screen rendered in all three themes at
  once, side by side).

All switching is client-side DOM toggling of pre-rendered content — no
network request, no reload, exactly as required.

## Two real bugs found and fixed (not screenshotted around)

1. **Back-chevron pointed the wrong way for RTL.** I initially reused an
   LTR app's left-pointing "‹" back icon. In a right-to-left interface the
   correct convention is the reverse (retracing toward where reading
   started is a rightward motion), so a "‹" reads as *forward*, not
   *back*, to an Arabic-reading user. Caught by looking at the rendered
   screenshot, not assumed correct from the source. Fixed to point right
   ("›").
2. **"Compare all 3" mode rendered as a vertical stack, not side by side.**
   The JS set the compare container's inline `style.display = "block"`,
   which — being an inline style — overrides the CSS class's
   `display:flex` regardless of the class rule, so the three phone frames
   stacked as ordinary block elements instead of sitting in a row. Fixed
   by setting `style.display = "flex"` in the JS to match the CSS intent;
   confirmed by reading the actual computed `display` value in the
   browser, not by re-reading my own source.
3. **History card title and project ran together with no separator**
   (e.g. "سوّ محتوىتحميص ٢٧"). Fixed to match the real app's own format
   exactly (`title · project`, from `historyScreen()` in `index.html`).

## Mobile UX notes

- The full horizontal lockup comfortably fits every app header at all
  three required widths (360/390/430px) alongside a menu or back icon —
  verified directly, not assumed from its aspect ratio alone.
- Touch targets (`.btn`) are at least 44px tall throughout.
- No screen requires horizontal scrolling at any tested width (see QA
  below) — RTL layout, mixed Arabic/English digits (SAR prices, hex
  codes), and the bilingual header all confirmed not to overflow.
- **Tradeoff, disclosed:** the mobile navigation menu (screen 3) and the
  sidebar-style layouts from Phase 1D are two different ways of
  representing "how you reach the rest of the app on a phone" — this
  phase uses a slide-out menu (more realistic for 390px than a persistent
  sidebar) since Phase 1D already explored the sidebar concept at desktop
  width; both are disclosed as conceptual, neither is shipped UI.

## QA

Automated, run against every one of the 27 screen×theme combinations at
all three required widths (81 checks total):

```
width 360px: checked 27 combos
width 390px: checked 27 combos
width 430px: checked 27 combos
PASS: no horizontal overflow in any screen/theme/width combination
```

Plus:
- Shadda/three-dot verification on a rendered screenshot (not source
  markup alone).
- Every recolored/verbatim logo file's path geometry independently
  re-diffed against its Phase 1C source before use.
- `npm run qa`: full existing application regression suite — **80 PASS, 0
  FAIL**, unaffected (no application file touched).
- HTML tag-balance check on the final generated file.

## Screenshots

`screenshots/` (36 files):
- `390-{screen}-{theme}.png` — all 9 screens × all 3 themes at the
  primary 390px width (27 files, full coverage as specified).
- `360-{welcome,home,visual}-A.png`, `430-{welcome,home,visual}-A.png` —
  boundary-width verification on a representative subset (6 files).
- `compare-{home,visual}.png` — the three-theme side-by-side view (2
  files).
- `shadda-verification-zoom.png`.

## Preview access

No new Vercel deployment was created for this task. Pushing this commit
updates the branch's existing auto-deployed Preview at its stable
Git-branch alias (unchanged hostname across every push to this branch,
confirmed in earlier phases):

```
https://shaghil-git-shaghil-v3-brand-implementation-madagibrahim-7836.vercel.app/brand-v3/preview-1e/index.html
```

I could not personally load this URL to verify (this sandbox's own
network egress policy blocks `*.vercel.app`, same limitation noted in
Phases 1C/1D) — treat it as Vercel-API-confirmed, not browser-verified by
me. The screenshots above and the local-preview instructions below are
the verified fallback.

### Local preview

```
cd shaghil
python3 -m http.server 8080
# open http://localhost:8080/brand-v3/preview-1e/index.html
```

or open the file directly — no build step, no server required.

## Not done in this task (by design)

- Phase 1C and Phase 1D untouched.
- No application file, live `/brand/` asset, or deployment changed.
- No icon chosen between Option A and Option B.
- No merge, no production deployment.
