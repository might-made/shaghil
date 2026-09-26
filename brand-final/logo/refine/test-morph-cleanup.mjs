// Rigorous test: does morphological opening remove the lam-top spike artifact without
// materially altering legitimate geometry (stroke weight, joining, terminal/bowl shapes,
// dot/shadda position and count)? Produces real measurements (not eyeballing) plus
// high-resolution before/after visual crops at the 5 required locations.
import fs from 'node:fs';
import { traceRegion } from './trace.mjs';
import { renderWordPNG, screenshotSVG } from './common.mjs';

function bboxOf(c) { return { minX: c.minX, minY: c.minY, maxX: c.maxX, maxY: c.maxY, w: c.maxX - c.minX, h: c.maxY - c.minY, area: c.area }; }

function identify(full) {
  const comps = full.components;
  const body = comps[0];
  const restAll = comps.map((c, i) => ({ c, i })).slice(1);
  const shaddaIdx = [...restAll].sort((a, b) => b.c.area - a.c.area)[0].i;
  const shaddaCx = (comps[shaddaIdx].minX + comps[shaddaIdx].maxX) / 2;
  const dots = restAll.filter((r) => r.i !== shaddaIdx);
  const ghainDotIdx = dots.slice().sort((a, b) => {
    const acx = (a.c.minX + a.c.maxX) / 2, bcx = (b.c.minX + b.c.maxX) / 2;
    return Math.abs(acx - shaddaCx) - Math.abs(bcx - shaddaCx);
  })[0].i;
  const sheenDotIdxs = dots.filter((r) => r.i !== ghainDotIdx).map((r) => r.i);
  return {
    componentCount: comps.length,
    body: bboxOf(body),
    shadda: bboxOf(comps[shaddaIdx]),
    ghainDot: bboxOf(comps[ghainDotIdx]),
    sheenDots: sheenDotIdxs.map((i) => bboxOf(comps[i])).sort((a, b) => a.minX - b.minX),
  };
}

const { png } = await renderWordPNG({ fontSize: 1400 });
console.log('=== BASELINE (no morphological opening, current master source) ===');
const baseline = traceRegion(png.data, { width: png.width, height: png.height, threshold: 140, epsilon: 3.0, minArea: 40, smooth: true });
const baseMetrics = identify(baseline);
console.log(JSON.stringify(baseMetrics, null, 1));

const candidates = {};
for (const iters of [1, 2, 3, 4]) {
  console.log(`\n=== CANDIDATE: openIterations=${iters} ===`);
  const traced = traceRegion(png.data, { width: png.width, height: png.height, threshold: 140, epsilon: 3.0, minArea: 40, smooth: true, openIterations: iters });
  const m = identify(traced);
  console.log(JSON.stringify(m, null, 1));
  candidates[iters] = { traced, metrics: m };
}

// ---- Quantitative comparison table ----
console.log('\n=== DELTA TABLE (candidate vs baseline) ===');
function pctDelta(a, b) { return (((b - a) / a) * 100).toFixed(3) + '%'; }
for (const iters of [1, 2, 3, 4]) {
  const m = candidates[iters].metrics;
  console.log(`\n-- openIterations=${iters} --`);
  console.log('componentCount:', baseMetrics.componentCount, '->', m.componentCount, m.componentCount === baseMetrics.componentCount ? '(unchanged)' : '*** CHANGED ***');
  console.log('body area delta:', pctDelta(baseMetrics.body.area, m.body.area));
  console.log('body bbox (w,h) delta:', pctDelta(baseMetrics.body.w, m.body.w), pctDelta(baseMetrics.body.h, m.body.h));
  console.log('shadda area delta:', pctDelta(baseMetrics.shadda.area, m.shadda.area));
  console.log('shadda bbox center delta (x,y):', ((( (m.shadda.minX+m.shadda.maxX)/2 - (baseMetrics.shadda.minX+baseMetrics.shadda.maxX)/2 ))).toFixed(2), ((( (m.shadda.minY+m.shadda.maxY)/2 - (baseMetrics.shadda.minY+baseMetrics.shadda.maxY)/2 ))).toFixed(2));
  console.log('ghainDot area delta:', pctDelta(baseMetrics.ghainDot.area, m.ghainDot.area));
  console.log('ghainDot center delta (x,y):', ((( (m.ghainDot.minX+m.ghainDot.maxX)/2 - (baseMetrics.ghainDot.minX+baseMetrics.ghainDot.maxX)/2 ))).toFixed(2), ((( (m.ghainDot.minY+m.ghainDot.maxY)/2 - (baseMetrics.ghainDot.minY+baseMetrics.ghainDot.maxY)/2 ))).toFixed(2));
  m.sheenDots.forEach((d, i) => {
    const b = baseMetrics.sheenDots[i];
    if (!b) { console.log(`sheenDot[${i}]: MISSING IN BASELINE INDEX (count mismatch)`); return; }
    console.log(`sheenDot[${i}] area delta:`, pctDelta(b.area, d.area), 'center delta:', ((( (d.minX+d.maxX)/2 - (b.minX+b.maxX)/2 ))).toFixed(2), ((( (d.minY+d.maxY)/2 - (b.minY+b.maxY)/2 ))).toFixed(2));
  });
}

fs.writeFileSync('morph-test-results.json', JSON.stringify({ baseline: baseMetrics, candidates: Object.fromEntries(Object.entries(candidates).map(([k, v]) => [k, v.metrics])) }, null, 1));

// ---- Visual before/after crops at the 5 required locations ----
// We'll render baseline and the openIterations=2 candidate (a reasonable middle value) side by side.
// Full wordmark
function svgFor(d, box, pad = 30) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.minX - pad} ${box.minY - pad} ${box.w + pad * 2} ${box.h + pad * 2}" width="${box.w + pad * 2}" height="${box.h + pad * 2}"><path d="${d}" fill="#000"/></svg>`;
}

async function renderCrop(dList, unionBox, name, targetW) {
  const svg = svgFor(dList.join(' '), unionBox);
  const m = svg.match(/width="([\d.]+)" height="([\d.]+)"/);
  const w = parseFloat(m[1]), h = parseFloat(m[2]);
  const th = Math.round((h / w) * targetW);
  const resized = svg.replace(m[0], `width="${targetW}" height="${th}"`);
  await screenshotSVG(resized, name, { width: targetW, height: th });
}

function unionOf(...boxes) {
  return {
    minX: Math.min(...boxes.map((b) => b.minX)),
    minY: Math.min(...boxes.map((b) => b.minY)),
    w: Math.max(...boxes.map((b) => b.maxX)) - Math.min(...boxes.map((b) => b.minX)),
    h: Math.max(...boxes.map((b) => b.maxY)) - Math.min(...boxes.map((b) => b.minY)),
  };
}

for (const [label, full, metrics] of [['before', baseline, baseMetrics], ['after', candidates[2].traced, candidates[2].metrics]]) {
  // full wordmark
  await renderCrop(full.dList, unionOf(metrics.body, metrics.shadda, metrics.ghainDot, ...metrics.sheenDots), `qa-full-${label}.png`, 1600);
  // lam top detail: leftmost ~30% of body, top region
  const bodyW = metrics.body.w;
  const lamBox = { minX: metrics.body.minX, minY: metrics.body.minY, w: bodyW * 0.32, h: bodyW * 0.32 };
  await renderCrop([full.dList[0]], lamBox, `qa-lamtop-${label}.png`, 900);
  // key joins: middle band of body (ghain-lam join + sheen-ghain join area), take mid-width strip
  const joinBox = { minX: metrics.body.minX + bodyW * 0.15, minY: metrics.body.minY + metrics.body.h * 0.35, w: bodyW * 0.55, h: metrics.body.h * 0.5 };
  await renderCrop([full.dList[0]], joinBox, `qa-joins-${label}.png`, 1400);
  // shadda + ghain dot
  await renderCrop(full.dList, unionOf(metrics.shadda, metrics.ghainDot), `qa-shadda-dot-${label}.png`, 700);
  // sheen + three dots (need sheen part of body near the dots' x-range)
  const sheenXs = metrics.sheenDots.map((d) => (d.minX + d.maxX) / 2);
  const sheenMinX = Math.min(...sheenXs) - 200, sheenMaxX = Math.max(...sheenXs) + 200;
  const sheenBox = { minX: sheenMinX, minY: metrics.sheenDots[0].minY - 100, w: sheenMaxX - sheenMinX, h: (metrics.body.minY + metrics.body.h) - metrics.sheenDots[0].minY + 100 };
  await renderCrop(full.dList, sheenBox, `qa-sheen-${label}.png`, 1000);
}

console.log('\nVisual before/after crops written: qa-full, qa-lamtop, qa-joins, qa-shadda-dot, qa-sheen (each -before/-after)');
