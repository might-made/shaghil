// Builds W1/W2/W3: three custom Arabic wordmark treatments of شغّل, each a true vector SVG.
// Every treatment starts from the browser's own correctly-shaped rendering (guaranteed-correct
// reading), traced into real vector path data component-by-component, then customized with
// real, restrained, disclosed geometric edits — never a hand-drawn glyph, never a font-level
// substitution.
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { traceRegion } from './trace.mjs';
import { renderWordPNG, screenshotSVG } from './common.mjs';

async function traceWordFull({ transform = '' } = {}) {
  const { png } = await renderWordPNG({ fontSize: 700, transform });
  const full = traceRegion(png.data, { width: png.width, height: png.height, threshold: 140, epsilon: 1.6, minArea: 15, smooth: true });
  // components sorted by area descending: [0] = body (largest, by far). Among the rest, the
  // shadda is the largest (it is a full glyph-scale mark, visibly bigger than any single dot).
  // The ghain dot is identified anatomically — not by vertical order, which is unreliable
  // across different renders/transforms — as the dot closest in X to the shadda (ghain's own
  // dot sits directly beneath its shadda). The remaining three (by elimination) are sheen's dots.
  const body = full.components[0];
  const restAll = full.components.map((c, i) => ({ c, i })).slice(1);
  const byArea = [...restAll].sort((a, b) => b.c.area - a.c.area);
  const shaddaIdx = byArea[0].i;
  const shaddaCx = (full.components[shaddaIdx].minX + full.components[shaddaIdx].maxX) / 2;
  const dots = restAll.filter((r) => r.i !== shaddaIdx);
  const ghainDotIdx = dots.slice().sort((a, b) => {
    const acx = (a.c.minX + a.c.maxX) / 2, bcx = (b.c.minX + b.c.maxX) / 2;
    return Math.abs(acx - shaddaCx) - Math.abs(bcx - shaddaCx);
  })[0].i;
  const sheenDotIdxs = dots.filter((r) => r.i !== ghainDotIdx).map((r) => r.i);
  return { full, body, shaddaIdx, ghainDotIdx, sheenDotIdxs, png };
}

function xf(d, { tx = 0, ty = 0, scale = 1, cx, cy }) {
  return `<g transform="translate(${tx} ${ty}) translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})"><path d="${d}"/></g>`;
}

function bboxOf(c) { return { cx: (c.minX + c.maxX) / 2, cy: (c.minY + c.maxY) / 2, w: c.maxX - c.minX, h: c.maxY - c.minY }; }

function assemble(paths, bx0, by0, bx1, by1, pad, extraDefs = '') {
  const vb = `${bx0 - pad} ${by0 - pad} ${bx1 - bx0 + pad * 2} ${by1 - by0 + pad * 2}`;
  const w = bx1 - bx0 + pad * 2, h = by1 - by0 + pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}" style="display:block">${extraDefs}<g fill="#000">${paths}</g></svg>`;
}

// ============================== W1 — PRECISION ==============================
// Condensed uniform proportions + the three sheen dots recomposed into a precise, evenly
// spaced arrangement + the shadda recentered exactly on the ghain dot's vertical axis.
{
  const { full, body, shaddaIdx, ghainDotIdx, sheenDotIdxs } = await traceWordFull({ transform: 'scaleX(0.93)' });
  const dList = full.dList, comps = full.components;

  // Recompose the three sheen dots into a precise equilateral arrangement, centered on their
  // own original cluster centroid (real repositioning of real traced shapes — not redrawn).
  const dots = sheenDotIdxs.map((i) => ({ i, b: bboxOf(comps[i]) }));
  const avgSize = dots.reduce((s, d) => s + Math.max(d.b.w, d.b.h), 0) / dots.length;
  const clusterCx = dots.reduce((s, d) => s + d.b.cx, 0) / dots.length;
  const clusterCy = dots.reduce((s, d) => s + d.b.cy, 0) / dots.length;
  const gap = avgSize * 1.18;
  // target layout: one dot precisely above, two precisely below (matches natural sheen triangle)
  const above = dots.reduce((a, b) => (a.b.cy < b.b.cy ? a : b)); // topmost
  const below = dots.filter((d) => d !== above).sort((a, b) => a.b.cx - b.b.cx); // left, right
  const targets = {
    [above.i]: { x: clusterCx, y: clusterCy - gap * 0.62 },
    [below[0].i]: { x: clusterCx - gap * 0.56, y: clusterCy + gap * 0.42 },
    [below[1].i]: { x: clusterCx + gap * 0.56, y: clusterCy + gap * 0.42 },
  };

  // Recenter shadda exactly above the ghain dot's vertical axis, modestly reduced for a
  // tighter, more disciplined fit.
  const ghainB = bboxOf(comps[ghainDotIdx]);
  const shaddaB = bboxOf(comps[shaddaIdx]);
  const SHADDA_SCALE = 0.9;

  const paths = dList.map((d, i) => {
    if (targets[i]) {
      const b = bboxOf(comps[i]);
      return xf(d, { tx: targets[i].x - b.cx, ty: targets[i].y - b.cy, scale: 1, cx: b.cx, cy: b.cy });
    }
    if (i === shaddaIdx) {
      const targetCx = ghainB.cx, targetCy = shaddaB.cy + (shaddaB.h * (1 - SHADDA_SCALE)) / 2;
      return xf(d, { tx: targetCx - shaddaB.cx, ty: targetCy - shaddaB.cy, scale: SHADDA_SCALE, cx: shaddaB.cx, cy: shaddaB.cy });
    }
    return `<path d="${d}"/>`;
  }).join('');

  const allB = comps.map((c) => c);
  const bx0 = Math.min(...allB.map((c) => c.minX)), bx1 = Math.max(...allB.map((c) => c.maxX));
  const by0 = Math.min(...allB.map((c) => c.minY)) - 20, by1 = Math.max(...allB.map((c) => c.maxY));
  fs.writeFileSync('w1-wordmark.svg', assemble(paths, bx0, by0, bx1, by1, 25));

  // Micro-mark: the same two elements just customized in the wordmark above — the precisely
  // recentered shadda directly over the untouched ghain dot — extracted as a standalone pair.
  // In the full wordmark the two sit close together (correct, matches real construction); in
  // isolation at this scale they need a little more explicit air to read as two distinct
  // forms rather than one fused blob, so a modest extra gap is added here only.
  const EXTRA_GAP = shaddaB.h * 0.55;
  const shaddaTargetCx = ghainB.cx, shaddaTargetCy = shaddaB.cy + (shaddaB.h * (1 - SHADDA_SCALE)) / 2 - EXTRA_GAP;
  const mmShadda = xf(dList[shaddaIdx], { tx: shaddaTargetCx - shaddaB.cx, ty: shaddaTargetCy - shaddaB.cy, scale: SHADDA_SCALE, cx: shaddaB.cx, cy: shaddaB.cy });
  const mmDot = `<path d="${dList[ghainDotIdx]}"/>`;
  const mmShaddaTop = shaddaTargetCy - (shaddaB.h / 2) * SHADDA_SCALE;
  const mmBx0 = Math.min(ghainB.cx - ghainB.w / 2, shaddaTargetCx - (shaddaB.w / 2) * SHADDA_SCALE);
  const mmBx1 = Math.max(ghainB.cx + ghainB.w / 2, shaddaTargetCx + (shaddaB.w / 2) * SHADDA_SCALE);
  fs.writeFileSync('w1-micromark.svg', assemble(mmShadda + mmDot, mmBx0, mmShaddaTop, mmBx1, ghainB.cy + ghainB.h / 2, 22));
}

// ============================== W2 — ACTIVATION ==============================
// The real shadda and the real ghain dot — both scaled up in place and drawn fractionally
// closer together — form one legible "activation cluster" using only real diacritic geometry.
{
  const { full, shaddaIdx, ghainDotIdx } = await traceWordFull({});
  const dList = full.dList, comps = full.components;
  const shaddaB = bboxOf(comps[shaddaIdx]);
  const ghainB = bboxOf(comps[ghainDotIdx]);
  const SHADDA_SCALE = 1.35, DOT_SCALE = 1.25;
  const DOT_LIFT = (ghainB.cy - shaddaB.cy) * 0.14; // pull dot fractionally toward shadda

  const paths = dList.map((d, i) => {
    if (i === shaddaIdx) {
      return xf(d, { tx: 0, ty: 0, scale: SHADDA_SCALE, cx: shaddaB.cx, cy: shaddaB.cy });
    }
    if (i === ghainDotIdx) {
      return xf(d, { tx: 0, ty: -DOT_LIFT, scale: DOT_SCALE, cx: ghainB.cx, cy: ghainB.cy });
    }
    return `<path d="${d}"/>`;
  }).join('');

  const shaddaTopAfter = shaddaB.cy - (shaddaB.h / 2) * SHADDA_SCALE;
  const bx0 = Math.min(...comps.map((c) => c.minX)), bx1 = Math.max(...comps.map((c) => c.maxX));
  const by0 = Math.min(shaddaTopAfter, ...comps.map((c) => c.minY)) - 25, by1 = Math.max(...comps.map((c) => c.maxY));
  fs.writeFileSync('w2-wordmark.svg', assemble(paths, bx0, by0, bx1, by1, 25));

  // Micro-mark: the enlarged shadda + lifted, enlarged ghain dot — the exact activation
  // cluster used in the wordmark above, extracted as a standalone pair.
  const mmShadda = xf(dList[shaddaIdx], { tx: 0, ty: 0, scale: SHADDA_SCALE, cx: shaddaB.cx, cy: shaddaB.cy });
  const mmDot = xf(dList[ghainDotIdx], { tx: 0, ty: -DOT_LIFT, scale: DOT_SCALE, cx: ghainB.cx, cy: ghainB.cy });
  const mmBx0 = Math.min(shaddaB.cx - (shaddaB.w / 2) * SHADDA_SCALE, ghainB.cx - (ghainB.w / 2) * DOT_SCALE);
  const mmBx1 = Math.max(shaddaB.cx + (shaddaB.w / 2) * SHADDA_SCALE, ghainB.cx + (ghainB.w / 2) * DOT_SCALE);
  const mmDotBottom = ghainB.cy - DOT_LIFT + (ghainB.h / 2) * DOT_SCALE;
  fs.writeFileSync('w2-micromark.svg', assemble(mmShadda + mmDot, mmBx0, shaddaTopAfter, mmBx1, mmDotBottom, 22));

  // Small-size variant: at 16px the dot merges into the shadda's lower lobe and the pair
  // reads as one muddy blob rather than two related forms (see QA). This variant uses the
  // same real shapes with a smaller shadda scale and a real gap restored between them —
  // used only at small sizes; the full-scale cluster above remains the mark everywhere else.
  const SHADDA_SCALE_SM = 1.1, DOT_SCALE_SM = 1.15, GAP_SM = shaddaB.h * 0.5;
  const mmShaddaSm = xf(dList[shaddaIdx], { tx: 0, ty: -GAP_SM * 0.3, scale: SHADDA_SCALE_SM, cx: shaddaB.cx, cy: shaddaB.cy });
  const mmDotSm = xf(dList[ghainDotIdx], { tx: 0, ty: GAP_SM * 0.5, scale: DOT_SCALE_SM, cx: ghainB.cx, cy: ghainB.cy });
  const smTop = shaddaB.cy - (shaddaB.h / 2) * SHADDA_SCALE_SM - GAP_SM * 0.3;
  const smBottom = ghainB.cy + (ghainB.h / 2) * DOT_SCALE_SM + GAP_SM * 0.5;
  const smBx0 = Math.min(shaddaB.cx - (shaddaB.w / 2) * SHADDA_SCALE_SM, ghainB.cx - (ghainB.w / 2) * DOT_SCALE_SM);
  const smBx1 = Math.max(shaddaB.cx + (shaddaB.w / 2) * SHADDA_SCALE_SM, ghainB.cx + (ghainB.w / 2) * DOT_SCALE_SM);
  fs.writeFileSync('w2-micromark-small.svg', assemble(mmShaddaSm + mmDotSm, smBx0, smTop, smBx1, smBottom, 26));
}

// ============================== W3 — MOTION ==============================
// A restrained forward skew plus a real, disclosed optical emboldening (stroke+fill duplicate
// of the same real traced path — a standard vector technique, not a redrawn stroke) for more
// confident, energetic weight. No arrows, no italic distortion of individual glyphs.
{
  const { full, body, png } = await traceWordFull({ transform: 'skewX(-8deg)' });
  const comps = full.components;
  const strokeDefs = '';
  const STROKE = 26;
  const paths = `<g stroke="#000" stroke-width="${STROKE}" stroke-linejoin="round"><path d="${full.d}"/></g><path d="${full.d}"/>`;
  const bx0 = Math.min(...comps.map((c) => c.minX)) - STROKE, bx1 = Math.max(...comps.map((c) => c.maxX)) + STROKE;
  const by0 = Math.min(...comps.map((c) => c.minY)) - STROKE, by1 = Math.max(...comps.map((c) => c.maxY)) + STROKE;
  fs.writeFileSync('w3-wordmark.svg', assemble(paths, bx0, by0, bx1, by1, 25, strokeDefs));

  // Micro-mark: the real final-letter (lam) stem+hook, cropped from this SAME skewed,
  // emboldened rendering — so it inherits W3's own lean and weight, then re-traced in
  // isolation (same technique as Phase 4's fragment extraction, applied here to W3's own
  // customized geometry rather than the plain word).
  const bodyW = body.maxX - body.minX;
  const lamRegion = { minX: body.minX - 10, minY: body.minY - STROKE - 10, maxX: body.minX + bodyW * 0.40, maxY: body.maxY + STROKE + 10 };
  const minX = Math.max(0, Math.round(lamRegion.minX)), minY = Math.max(0, Math.round(lamRegion.minY));
  const maxX = Math.min(png.width, Math.round(lamRegion.maxX)), maxY = Math.min(png.height, Math.round(lamRegion.maxY));
  const w = maxX - minX, h = maxY - minY;
  const sub = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    const s = ((minY + y) * png.width + minX) * 4;
    sub.set(png.data.subarray(s, s + w * 4), y * w * 4);
  }
  const lamTrace = traceRegion(sub, { width: w, height: h, threshold: 140, epsilon: 1.4, minArea: 60, smooth: true, maxComponents: 1 });
  const lb0x = Math.min(...lamTrace.components.map((c) => c.minX)), lb0y = Math.min(...lamTrace.components.map((c) => c.minY));
  const lb1x = Math.max(...lamTrace.components.map((c) => c.maxX)), lb1y = Math.max(...lamTrace.components.map((c) => c.maxY));
  const lamStroke = `<g stroke="#000" stroke-width="${STROKE}" stroke-linejoin="round"><path d="${lamTrace.d}"/></g><path d="${lamTrace.d}"/>`;
  fs.writeFileSync('w3-micromark.svg', assemble(lamStroke, lb0x, lb0y, lb1x, lb1y, 22));
}

function resized(svg, targetW) {
  const m = svg.match(/width="([\d.]+)" height="([\d.]+)"/);
  const w = parseFloat(m[1]), h = parseFloat(m[2]);
  const targetH = Math.round((h / w) * targetW);
  return { svg: svg.replace(`width="${m[1]}" height="${m[2]}"`, `width="${targetW}" height="${targetH}"`), targetH };
}
for (const slug of ['w1', 'w2', 'w3']) {
  const raw = fs.readFileSync(`${slug}-wordmark.svg`, 'utf8');
  const { svg, targetH } = resized(raw, 1400);
  await screenshotSVG(svg, `proof-${slug}-wordmark.png`, { width: 1400, height: targetH });
  const rawMM = fs.readFileSync(`${slug}-micromark.svg`, 'utf8');
  const { svg: svgMM, targetH: targetHMM } = resized(rawMM, 500);
  await screenshotSVG(svgMM, `proof-${slug}-micromark.png`, { width: 500, height: targetHMM });
}
console.log('wordmarks + micromarks built');
