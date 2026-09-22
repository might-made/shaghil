// Extracts real vector fragments (shadda, ghain dot, sheen dots, lam, negative-space wedge)
// from the actual browser-shaped rendering of شغّل, via pixel-contour tracing (trace.mjs).
// Every fragment's path data is a genuine traced boundary of real ink (or real enclosed
// counter-space for the wedge) — nothing here is hand-drawn.
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { traceRegion } from './trace.mjs';
import { renderWordPNG, svgWrap, screenshotSVG } from './common.mjs';

function cropTrace(png, region, opts = {}) {
  const minX = Math.max(0, Math.round(region.minX));
  const minY = Math.max(0, Math.round(region.minY));
  const maxX = Math.min(png.width, Math.round(region.maxX));
  const maxY = Math.min(png.height, Math.round(region.maxY));
  const w = maxX - minX, h = maxY - minY;
  const sub = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    const srcRowStart = ((minY + y) * png.width + minX) * 4;
    const dstRowStart = (y * w) * 4;
    png.data.copy(sub, dstRowStart, srcRowStart, srcRowStart + w * 4);
  }
  const res = traceRegion(sub, { width: w, height: h, threshold: 140, epsilon: 1.2, minArea: 60, smooth: true, ...opts });
  const bx0 = Math.min(...res.components.map((c) => c.minX));
  const by0 = Math.min(...res.components.map((c) => c.minY));
  const bx1 = Math.max(...res.components.map((c) => c.maxX));
  const by1 = Math.max(...res.components.map((c) => c.maxY));
  return { ...res, w, h, cropMinX: minX, cropMinY: minY, bbox: { minX: bx0, minY: by0, w: bx1 - bx0, h: by1 - by0 } };
}

const { png } = await renderWordPNG({ fontSize: 600 });
fs.writeFileSync('word-reference.png', PNG.sync.write(png));

const full = traceRegion(png.data, { width: png.width, height: png.height, threshold: 140, epsilon: 1.6, minArea: 15, smooth: true });
const byArea = [...full.components].sort((a, b) => b.area - a.area);
const body = byArea[0];
const rest = byArea.slice(1).sort((a, b) => a.minY - b.minY);
const shaddaC = rest[0];
const ghainDotC = rest[1];
const sheenDots = rest.slice(2); // 3 remaining, roughly triangular cluster

const bodyW = body.maxX - body.minX, bodyH = body.maxY - body.minY;

const pad = 45;
const shaddaTrace = cropTrace(png, { minX: shaddaC.minX - pad, minY: shaddaC.minY - pad, maxX: shaddaC.maxX + pad, maxY: shaddaC.maxY + pad }, { maxComponents: 1 });
const ghainDotTrace = cropTrace(png, { minX: ghainDotC.minX - pad, minY: ghainDotC.minY - pad, maxX: ghainDotC.maxX + pad, maxY: ghainDotC.maxY + pad }, { maxComponents: 1 });

// lam: ratio tuned by direct visual inspection (lam-wide-check.png) to include the full
// stem+hook as one connected shape without bleeding into ghain's bowl.
const lamTrace = cropTrace(png, { minX: body.minX - 10, minY: body.minY - 30, maxX: body.minX + bodyW * 0.415, maxY: body.maxY + 10 }, { maxComponents: 1 });

// negative-space wedge between ghain's bowl and the connecting stroke (validated region)
const negRegion = { minX: body.minX + bodyW * 0.28, minY: body.minY + bodyH * 0.45, maxX: body.minX + bodyW * 0.58, maxY: body.maxY };
const negTrace = cropTrace(png, negRegion, { invert: true, excludeEdgeTouching: true, minArea: 300, maxComponents: 1 });

// sheen dots combined (all 3, as one cluster fragment) for reference/optional use
const sMinX = Math.min(...sheenDots.map(d => d.minX)), sMaxX = Math.max(...sheenDots.map(d => d.maxX));
const sMinY = Math.min(...sheenDots.map(d => d.minY)), sMaxY = Math.max(...sheenDots.map(d => d.maxY));
const sheenTrace = cropTrace(png, { minX: sMinX - pad, minY: sMinY - pad, maxX: sMaxX + pad, maxY: sMaxY + pad });

const fragments = {
  shadda: { d: shaddaTrace.d, w: shaddaTrace.w, h: shaddaTrace.h, bbox: shaddaTrace.bbox },
  ghainDot: { d: ghainDotTrace.d, w: ghainDotTrace.w, h: ghainDotTrace.h, bbox: ghainDotTrace.bbox },
  lam: { d: lamTrace.d, w: lamTrace.w, h: lamTrace.h, bbox: lamTrace.bbox },
  negWedge: { d: negTrace.d, w: negTrace.w, h: negTrace.h, bbox: negTrace.bbox },
  sheenDots: { d: sheenTrace.d, w: sheenTrace.w, h: sheenTrace.h, bbox: sheenTrace.bbox },
  wordBody: { minX: body.minX, minY: body.minY, maxX: body.maxX, maxY: body.maxY },
};

fs.writeFileSync('fragments.json', JSON.stringify(fragments, null, 1));

// Save quick visual proofs
for (const [name, frag] of Object.entries(fragments)) {
  if (!frag.d) continue;
  const svg = svgWrap(frag.d, { minX: 0, minY: 0, w: frag.w, h: frag.h }, { bg: '#fff' });
  fs.writeFileSync(`frag-${name}.svg`, svg);
  await screenshotSVG(svg, `frag-${name}.png`, { width: Math.min(600, frag.w), height: Math.min(600, frag.h) });
}
console.log('fragments built:', Object.keys(fragments).join(', '));
