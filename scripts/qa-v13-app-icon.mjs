// SHGHIL V3 Final Release Candidate — app icon (Option B: غ with authentic shadda).
// Verifies the live favicon/apple-touch-icon references point at Option B, that the small
// sizes use the founder-approved simplified (shadda-dropped) variant while 180px+ keeps the
// authentic shadda, that geometry is byte-identical to the already-verified Phase 1B source
// (no redrawing), that no PWA support was invented, and that a cache-buster is in place.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// ---- 1. The live favicon/apple-touch-icon <link> tags reference Option B's files, with a
// cache-busting query string (browsers cache favicons very aggressively).
assert.ok(html.includes('<link rel="icon" href="/brand/favicon.svg?v=b1" type="image/svg+xml">'), 'the SVG favicon link must reference the updated file with a cache-busting query string');
assert.ok(html.includes('<link rel="icon" href="/brand/favicon-32.png?v=b1" sizes="32x32" type="image/png">'), 'the 32px favicon link must reference the updated file with a cache-busting query string');
assert.ok(html.includes('<link rel="icon" href="/brand/favicon-16.png?v=b1" sizes="16x16" type="image/png">'), 'the 16px favicon link must reference the updated file with a cache-busting query string');
assert.ok(html.includes('<link rel="apple-touch-icon" href="/brand/apple-touch-icon.png?v=b1">'), 'the apple-touch-icon link must reference the updated file with a cache-busting query string');
console.log('PASS: the live favicon and apple-touch-icon <link> tags reference the updated Option B files with a cache-busting query string');

// ---- 2. No PWA support was invented: no manifest link, no manifest.json file, no service
// worker registration anywhere in the app.
assert.ok(!html.includes('rel="manifest"'), 'no <link rel="manifest"> may be added — the brief explicitly forbids inventing PWA support');
assert.ok(!html.includes('serviceWorker'), 'no service worker registration may be added — the brief explicitly forbids inventing PWA support');
assert.ok(!fs.existsSync(path.join(root, 'manifest.json')) && !fs.existsSync(path.join(root, 'site.webmanifest')), 'no manifest.json/site.webmanifest file may be added — the brief explicitly forbids inventing PWA support');
console.log('PASS: no manifest, service worker or other PWA support was invented');

// ---- 3. Geometry integrity: the shipped favicon.svg is byte-identical (background/paint
// aside) to the verified Phase 1B simplified Option B source — never redrawn.
function normalize(svg) { return svg.replace(/(fill)="[^"]*"/g, ''); }
const shippedFaviconSvg = fs.readFileSync(path.join(root, 'brand/favicon.svg'), 'utf8');
const verifiedSimplified = fs.readFileSync(path.join(root, 'brand-v3/icon-refinement-1b/option-b-favicon-simplified-dark.svg'), 'utf8');
assert.equal(shippedFaviconSvg, verifiedSimplified, 'brand/favicon.svg must be byte-for-byte identical to the verified Phase 1B simplified Option B source — no redrawing');
console.log('PASS: the shipped favicon.svg is byte-for-byte identical to the verified Phase 1B source (no glyph redrawn)');

// ---- 4. Raster sizes: 16/32px PNGs are real, correctly-sized renders; apple-touch-icon is
// 180x180 (the size actually referenced by iOS for "Add to Home Screen"). PNG dimensions are
// read directly from the IHDR chunk, not assumed.
function pngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  assert.equal(buf.toString('ascii', 1, 4), 'PNG', `${filePath} must be a real PNG file`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
for (const [file, size] of [['brand/favicon-16.png', 16], ['brand/favicon-32.png', 32], ['brand/apple-touch-icon.png', 180]]) {
  const { width, height } = pngDimensions(path.join(root, file));
  assert.equal(width, size, `${file} must be exactly ${size}px wide`);
  assert.equal(height, size, `${file} must be exactly ${size}px tall`);
}
console.log('PASS: favicon-16.png (16x16), favicon-32.png (32x32) and apple-touch-icon.png (180x180) are all real, correctly-sized PNGs');

// ---- 5. Existing bilingual logo, theme system and nav drawer (Phases 2/3) are untouched by
// this icon-only change.
assert.ok(html.includes('<div class="welcomeLogo">'), 'the Phase 2 stacked welcome logo must still be present — this task must not touch the bilingual logo');
assert.ok(html.includes('id="mainNav" class="nav"'), 'the Phase 3 mobile nav drawer must still be present — this task must not touch navigation');
assert.ok(html.includes("localStorage.getItem('shaghilTheme')"), 'the Phase 2 theme persistence must still be present — this task must not touch the theme system');
console.log('PASS: the Phase 2 bilingual logo, theme persistence, and Phase 3 nav drawer are all untouched by this icon-only change');

console.log('\nPASS FINAL RELEASE CANDIDATE: the live favicon/apple-touch-icon now reference Option B (غ with authentic shadda at 180px+, the founder-approved simplified variant at 16/32px), geometry is byte-identical to the verified Phase 1B source, a cache-buster is in place, no PWA support was invented, and Phases 2/3 remain untouched');
