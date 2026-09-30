# SHGHIL V3 — Phase 1F: App Icon Choice (review only)

Branch: `shaghil-v3-release-candidate`. Review-only — the live favicon and
install icon (`/brand/favicon.svg`, `/brand/favicon-16.png`,
`/brand/favicon-32.png`, `/brand/apple-touch-icon.png`) are **unchanged**.
Nothing here is wired into `index.html` or any live asset.

## What this is

A side-by-side mockup of the two Phase 1B app-icon candidates, in context
(a browser-tab favicon and an iOS/Android home-screen icon), at every size
the app actually ships an icon at (16/32/180/512px) — so the founder can
choose between them without opening raw SVG files.

Both mockups reference the exact, already-verified Phase 1B files
byte-for-byte (`brand-v3/icon-refinement-1b/*.svg`, dark/V3-palette
variants) via `<img src>` — nothing was redrawn, reshaped or recolored for
this page.

- **Option A — ش (sheen):** `option-a-sheen-dark.svg` at every size. No
  simplified variant needed — legible natively at 16px.
- **Option B — غ + authentic shadda:** `option-b-ghain-refined-dark.svg`
  (full mark, shadda intact) at 180/512px, and
  `option-b-favicon-simplified-dark.svg` (shadda dropped) at 16/32px,
  matching the tested legibility tradeoff already documented in Phase 1B
  (`brand-v3/icon-refinement-1b/README.md`) — not a new decision made here.

## Screenshot

`screenshot.png` — the rendered comparison board.

## Local preview

```
cd shaghil
python3 -m http.server 8080
# open http://localhost:8080/brand-v3/preview-1f-icon-choice/index.html
```

## Not done in this task (by design)

- No favicon or apple-touch-icon file changed.
- No choice made between Option A and Option B — that's the founder's call.
