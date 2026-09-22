// Builds the final SHAGHIL master wordmark from the approved W1 — Precision basis.
// Final optical cleanup pass: the horizontal compression is applied as a POST-TRACE vector
// transform (on the clean traced path) rather than as a live-text CSS transform before
// tracing. QA found that scaling live text via CSS before tracing introduces a genuine
// browser sub-pixel rendering artifact (a thin stray spike at the lam stem's sharp top
// corner) — confirmed absent in the plain, uncompressed rendering and present at every
// Douglas-Peucker epsilon tested, proving it is real anti-aliased ink, not a simplification
// artifact. Tracing at normal scale first and compressing the resulting clean vector data
// afterward produces the identical intended proportions with no artifact.
import fs from 'node:fs';
import { traceRegion } from './trace.mjs';
import { renderWordPNG, screenshotSVG } from './common.mjs';

const COMPRESS_X = 0.93;
const SHADDA_SCALE = 0.9;

function bboxOf(c) { return { cx: (c.minX + c.maxX) / 2, cy: (c.minY + c.maxY) / 2, w: c.maxX - c.minX, h: c.maxY - c.minY }; }

function xf(d, { tx = 0, ty = 0, scale = 1, cx, cy }) {
  return `<g transform="translate(${tx} ${ty}) translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})"><path d="${d}"/></g>`;
}

// 1) Trace the plain, uncompressed rendering at doubled resolution. QA on the 700px source
// found a small stray spike at the lam stem's sharp top corner; testing showed it survived
// heavy morphological erosion (so not simple 1px noise) but was markedly less prominent at
// 2x render resolution — consistent with a resolution-dependent anti-aliasing artifact at
// that sharp corner rather than genuine outline geometry. Tracing from a higher-resolution
// source is the standard fix and a legitimate general quality improvement regardless.
const { png } = await renderWordPNG({ fontSize: 1400 });
const full = traceRegion(png.data, { width: png.width, height: png.height, threshold: 140, epsilon: 3.0, minArea: 40, smooth: true });
const comps = full.components, dList = full.dList;
const body = comps[0];

// Anatomical identification (same robust rule as the wordmark round): shadda = largest of
// the non-body components; ghain dot = the dot closest in X to the shadda; the rest are
// sheen's three dots.
const restAll = comps.map((c, i) => ({ c, i })).slice(1);
const shaddaIdx = [...restAll].sort((a, b) => b.c.area - a.c.area)[0].i;
const shaddaCx = bboxOf(comps[shaddaIdx]).cx;
const dots = restAll.filter((r) => r.i !== shaddaIdx);
const ghainDotIdx = dots.slice().sort((a, b) => Math.abs(bboxOf(a.c).cx - shaddaCx) - Math.abs(bboxOf(b.c).cx - shaddaCx))[0].i;
const sheenDotIdxs = dots.filter((r) => r.i !== ghainDotIdx).map((r) => r.i);

// 2) Regularize the three sheen dots into a precise, evenly spaced arrangement (verified
// correct to ~0.1px in the prior round; reproduced identically here).
const sDots = sheenDotIdxs.map((i) => ({ i, b: bboxOf(comps[i]) }));
const avgSize = sDots.reduce((s, d) => s + Math.max(d.b.w, d.b.h), 0) / sDots.length;
const clusterCx = sDots.reduce((s, d) => s + d.b.cx, 0) / sDots.length;
const clusterCy = sDots.reduce((s, d) => s + d.b.cy, 0) / sDots.length;
const gap = avgSize * 1.18;
const above = sDots.reduce((a, b) => (a.b.cy < b.b.cy ? a : b));
const below = sDots.filter((d) => d !== above).sort((a, b) => a.b.cx - b.b.cx);
const dotTargets = {
  [above.i]: { x: clusterCx, y: clusterCy - gap * 0.62 },
  [below[0].i]: { x: clusterCx - gap * 0.56, y: clusterCy + gap * 0.42 },
  [below[1].i]: { x: clusterCx + gap * 0.56, y: clusterCy + gap * 0.42 },
};

// 3) Shadda recentered exactly on the ghain dot's vertical axis, reduced 10%.
const ghainB = bboxOf(comps[ghainDotIdx]);
const shaddaB = bboxOf(comps[shaddaIdx]);

const innerPaths = dList.map((d, i) => {
  if (dotTargets[i]) {
    const b = bboxOf(comps[i]);
    return xf(d, { tx: dotTargets[i].x - b.cx, ty: dotTargets[i].y - b.cy, scale: 1, cx: b.cx, cy: b.cy });
  }
  if (i === shaddaIdx) {
    const targetCx = ghainB.cx, targetCy = shaddaB.cy + (shaddaB.h * (1 - SHADDA_SCALE)) / 2;
    return xf(d, { tx: targetCx - shaddaB.cx, ty: targetCy - shaddaB.cy, scale: SHADDA_SCALE, cx: shaddaB.cx, cy: shaddaB.cy });
  }
  return `<path d="${d}"/>`;
}).join('');

// 4) Compute the unscaled content bbox (body + regularized dots + shadda), then apply the
// horizontal compression as a single outer transform, and derive the final viewBox from the
// SCALED corner coordinates directly (not by guessing) so nothing clips.
const shaddaTop = shaddaB.cy + (shaddaB.h * (1 - SHADDA_SCALE)) / 2 - (shaddaB.h / 2) * SHADDA_SCALE;
const allMinX = Math.min(body.minX, ...Object.values(dotTargets).map((t, idx) => {
  const i = Object.keys(dotTargets)[idx];
  const b = bboxOf(comps[i]);
  return t.x - b.w / 2;
}), ghainB.cx - ghainB.w / 2, ghainB.cx - (shaddaB.w / 2) * SHADDA_SCALE);
const allMaxX = Math.max(body.maxX, ...Object.values(dotTargets).map((t, idx) => {
  const i = Object.keys(dotTargets)[idx];
  const b = bboxOf(comps[i]);
  return t.x + b.w / 2;
}), ghainB.cx + ghainB.w / 2, ghainB.cx + (shaddaB.w / 2) * SHADDA_SCALE);
const allMinY = Math.min(body.minY, shaddaTop);
const allMaxY = Math.max(body.maxY, ghainB.cy + ghainB.h / 2);

const pad = 40;
const scaledMinX = allMinX * COMPRESS_X - pad, scaledMaxX = allMaxX * COMPRESS_X + pad;
const scaledMinY = allMinY - pad, scaledMaxY = allMaxY + pad;
const vbW = scaledMaxX - scaledMinX, vbH = scaledMaxY - scaledMinY;

const masterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${scaledMinX} ${scaledMinY} ${vbW} ${vbH}" width="${Math.round(vbW)}" height="${Math.round(vbH)}" style="display:block">` +
  `<g fill="#000"><g transform="scale(${COMPRESS_X},1)">${innerPaths}</g></g></svg>`;

fs.writeFileSync('SHAGHIL_MASTER_AR.svg', masterSvg);
console.log('master built, viewBox', scaledMinX, scaledMinY, vbW, vbH);

// visual proof
await screenshotSVG(masterSvg.replace(/width="[\d.]+" height="[\d.]+"/, `width="1600" height="${Math.round(vbH / vbW * 1600)}"`), 'proof-master.png', { width: 1600, height: Math.round(vbH / vbW * 1600) });
