// Builds each concept's wordmark SVG: the real, correctly-shaped browser rendering of شغّل,
// traced into true vector, with one restrained, disclosed, geometry-safe customization per
// concept baked in BEFORE tracing (a uniform transform, or a path-level edit isolated to a
// non-connected subpath) — never a glyph-level hand edit, so correct reading is guaranteed.
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { traceRegion } from './trace.mjs';
import { renderWordPNG, screenshotSVG } from './common.mjs';

async function traceWord({ transform = '' } = {}) {
  const { png } = await renderWordPNG({ fontSize: 600, transform });
  const res = traceRegion(png.data, { width: png.width, height: png.height, threshold: 140, epsilon: 1.6, minArea: 15, smooth: true });
  const bx0 = Math.min(...res.components.map((c) => c.minX));
  const by0 = Math.min(...res.components.map((c) => c.minY));
  const bx1 = Math.max(...res.components.map((c) => c.maxX));
  const by1 = Math.max(...res.components.map((c) => c.maxY));
  return { d: res.d, bbox: { minX: bx0, minY: by0, w: bx1 - bx0, h: by1 - by0 }, components: res.components };
}

function wordSvg(d, bbox, pad = 20) {
  const vb = `${bbox.minX - pad} ${bbox.minY - pad} ${bbox.w + pad * 2} ${bbox.h + pad * 2}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${bbox.w + pad * 2}" height="${bbox.h + pad * 2}" style="display:block"><path d="${d}" fill="#000"/></svg>`;
}

// D1 — compact/relationship territory: subtle uniform vertical emphasis (safe — uniform
// scale never touches cursive joining).
const d1 = await traceWord({ transform: 'scaleY(1.045)' });
fs.writeFileSync('shaghil-d1-wordmark.svg', wordSvg(d1.d, d1.bbox));

// D2 — activation territory: the real shadda subpath (already a disconnected component,
// never touching the connected body or any other dot) is scaled up in place among the other
// untouched real subpaths, giving it more visual weight without altering any letter.
{
  const { png } = await renderWordPNG({ fontSize: 600 });
  const full = traceRegion(png.data, { width: png.width, height: png.height, threshold: 140, epsilon: 1.6, minArea: 15, smooth: true });
  // full.components / full.dList share index order (sorted by area, descending).
  const shaddaIdx = full.components
    .map((c, i) => ({ i, c }))
    .filter(({ c }) => c !== full.components[0]) // exclude body (largest)
    .sort((a, b) => a.c.minY - b.c.minY)[0].i; // topmost of the rest = shadda

  const SCALE = 1.48;
  const sc = full.components[shaddaIdx];
  const scx = (sc.minX + sc.maxX) / 2, scy = (sc.minY + sc.maxY) / 2;

  const paths = full.dList.map((d, i) => {
    if (i === shaddaIdx) {
      return `<g transform="translate(${scx} ${scy}) scale(${SCALE}) translate(${-scx} ${-scy})"><path d="${d}"/></g>`;
    }
    return `<path d="${d}"/>`;
  }).join('');

  const bx0 = Math.min(...full.components.map((c) => c.minX));
  const by0 = sc.minY - (sc.maxY - sc.minY) * (SCALE - 1) * 0.6 - 10; // headroom for the enlarged shadda
  const bx1 = Math.max(...full.components.map((c) => c.maxX));
  const by1 = Math.max(...full.components.map((c) => c.maxY));
  const pad2 = 20;
  const vb = `${bx0 - pad2} ${by0 - pad2} ${bx1 - bx0 + pad2 * 2} ${by1 - by0 + pad2 * 2}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${bx1 - bx0 + pad2 * 2}" height="${by1 - by0 + pad2 * 2}" style="display:block"><g fill="#000">${paths}</g></svg>`;
  fs.writeFileSync('shaghil-d2-wordmark.svg', svg);
}

// D3 — motion territory: subtle uniform forward skew (safe, uniform, doesn't touch joining).
const d3 = await traceWord({ transform: 'skewX(-4deg)' });
fs.writeFileSync('shaghil-d3-wordmark.svg', wordSvg(d3.d, d3.bbox));

function resized(svg, targetW) {
  const m = svg.match(/width="([\d.]+)" height="([\d.]+)"/);
  const w = parseFloat(m[1]), h = parseFloat(m[2]);
  const targetH = Math.round((h / w) * targetW);
  return { svg: svg.replace(`width="${m[1]}" height="${m[2]}"`, `width="${targetW}" height="${targetH}"`), targetW, targetH };
}
for (const slug of ['d1', 'd2', 'd3']) {
  const raw = fs.readFileSync(`shaghil-${slug}-wordmark.svg`, 'utf8');
  const { svg, targetW, targetH } = resized(raw, 1400);
  await screenshotSVG(svg, `proof-${slug}-wordmark.png`, { width: targetW, height: targetH });
}
console.log('wordmarks built');
