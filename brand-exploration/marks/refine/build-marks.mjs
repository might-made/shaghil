import fs from 'node:fs';
import { screenshotSVG } from './common.mjs';

const frag = JSON.parse(fs.readFileSync('fragments.json', 'utf8'));
const VB = 200;

// Scale relative to the fragment's real traced content bbox (not the extraction crop
// rectangle, which is generally larger than the ink/counter it contains).
function fit(f, targetSize) {
  const b = f.bbox;
  const s = targetSize / Math.max(b.w, b.h);
  return { scale: s, w: b.w * s, h: b.h * s };
}

function group(f, { targetSize, x, y, rotate = 0 }) {
  const b = f.bbox;
  const fd = fit(f, targetSize);
  // translate so the fragment's own content bbox (not crop origin) lands at (x,y)
  const tx = x - b.minX * fd.scale;
  const ty = y - b.minY * fd.scale;
  return `<g transform="translate(${tx} ${ty}) scale(${fd.scale} ${fd.scale}) rotate(${rotate} ${b.minX + b.w / 2} ${b.minY + b.h / 2})"><path d="${f.d}"/></g>`;
}

function markSvg(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB} ${VB}" width="${VB}" height="${VB}" style="display:block"><g fill="#000">${inner}</g></svg>`;
}

// ---------- D1: letter relationship — real lam (stem+hook) with real shadda nested at the hook's curl ----------
const d1Lam = group(frag.lam, { targetSize: 112, x: 58, y: 34 });
const d1Shadda = group(frag.shadda, { targetSize: 46, x: 24, y: 140, rotate: 0 });
fs.writeFileSync('shaghil-d1-mark.svg', markSvg(d1Lam + d1Shadda));

// ---------- D2: shadda / activation — real shadda, faded echo, real ghain dot anchor ----------
const d2Echo = group(frag.shadda, { targetSize: 86, x: 8, y: 70 });
const d2Main = group(frag.shadda, { targetSize: 128, x: 46, y: 14 });
const d2Dot = group(frag.ghainDot, { targetSize: 36, x: 88, y: 158 });
fs.writeFileSync('shaghil-d2-mark.svg', markSvg(`<g opacity="0.30">${d2Echo}</g>${d2Main}${d2Dot}`));

// ---------- D3: negative space / motion — real counter wedge, receding trail on the RTL reading diagonal ----------
function d3Trail() {
  const steps = [
    { size: 110, x: 72, y: 18, op: 1 },
    { size: 74, x: 30, y: 78, op: 0.5 },
    { size: 44, x: 4, y: 132, op: 0.24 },
  ];
  return steps.map((s) => `<g opacity="${s.op}">${group(frag.negWedge, { targetSize: s.size, x: s.x, y: s.y })}</g>`).join('');
}
fs.writeFileSync('shaghil-d3-mark.svg', markSvg(d3Trail()));

// D3 small-size variant: at 16px the full three-step trail loses its second and third wedges
// to anti-aliasing and the mark risks reading as a generic single triangle. This variant keeps
// only two wedges, enlarged and moved closer together, from the same real wedge geometry, so
// the "more than one form" relationship survives down to 16px. Used only at small sizes.
function d3TrailSmall() {
  const steps = [
    { size: 130, x: 58, y: 18, op: 1 },
    { size: 78, x: 6, y: 96, op: 0.62 },
  ];
  return steps.map((s) => `<g opacity="${s.op}">${group(frag.negWedge, { targetSize: s.size, x: s.x, y: s.y })}</g>`).join('');
}
fs.writeFileSync('shaghil-d3-mark-small.svg', markSvg(d3TrailSmall()));

function fillFrame(svg, size) {
  return svg.replace(`width="${VB}" height="${VB}"`, `width="${size}" height="${size}"`);
}
for (const slug of ['d1', 'd2', 'd3']) {
  const svg = fs.readFileSync(`shaghil-${slug}-mark.svg`, 'utf8');
  await screenshotSVG(fillFrame(svg, 400), `proof-${slug}-mark-white.png`, { width: 400, height: 400 });
  await screenshotSVG(fillFrame(svg.replace('fill="#000"', 'fill="#fff"'), 400), `proof-${slug}-mark-black.png`, { width: 400, height: 400, bg: '#000' });
}
console.log('marks built');
