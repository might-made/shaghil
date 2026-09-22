// Builds the full production package from SHAGHIL_MASTER_AR.svg: black/white variants,
// micro-mark (derived from the master's own shadda+dot, same logic proven in the W1 wordmark
// round), favicon, app icon, stacked and horizontal AR/EN lockups, and the endorsement lockup.
import fs from 'node:fs';
import { traceRegion } from './trace.mjs';
import { renderWordPNG, screenshotSVG } from './common.mjs';

function bboxOf(c) { return { cx: (c.minX + c.maxX) / 2, cy: (c.minY + c.maxY) / 2, w: c.maxX - c.minX, h: c.maxY - c.minY }; }
function xf(d, { tx = 0, ty = 0, scale = 1, cx, cy }) {
  return `<g transform="translate(${tx} ${ty}) translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})"><path d="${d}"/></g>`;
}
function assemble(paths, bx0, by0, bx1, by1, pad, fill = '#000') {
  const vb = `${bx0 - pad} ${by0 - pad} ${bx1 - bx0 + pad * 2} ${by1 - by0 + pad * 2}`;
  const w = bx1 - bx0 + pad * 2, h = by1 - by0 + pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${Math.round(w)}" height="${Math.round(h)}" style="display:block"><g fill="${fill}">${paths}</g></svg>`;
}

const master = fs.readFileSync('SHAGHIL_MASTER_AR.svg', 'utf8');

// ---------- Black / White master variants (identical geometry, fill only) ----------
fs.writeFileSync('SHAGHIL_MASTER_AR_BLACK.svg', master);
fs.writeFileSync('SHAGHIL_MASTER_AR_WHITE.svg', master.replace('fill="#000"', 'fill="#fff"'));

// ---------- Micro-mark: shadda + ghain dot, same source logic as the approved W1 micromark ----------
const { png } = await renderWordPNG({ fontSize: 1400 });
const full = traceRegion(png.data, { width: png.width, height: png.height, threshold: 140, epsilon: 3.0, minArea: 40, smooth: true });
const comps = full.components, dList = full.dList;
const restAll = comps.map((c, i) => ({ c, i })).slice(1);
const shaddaIdx = [...restAll].sort((a, b) => b.c.area - a.c.area)[0].i;
const shaddaCx0 = bboxOf(comps[shaddaIdx]).cx;
const dots = restAll.filter((r) => r.i !== shaddaIdx);
const ghainDotIdx = dots.slice().sort((a, b) => Math.abs(bboxOf(a.c).cx - shaddaCx0) - Math.abs(bboxOf(b.c).cx - shaddaCx0))[0].i;

const shaddaB = bboxOf(comps[shaddaIdx]);
const ghainB = bboxOf(comps[ghainDotIdx]);
const MM_SHADDA_SCALE = 0.9;
const EXTRA_GAP = shaddaB.h * 0.55; // real air added in isolation, proven necessary for 16px legibility

const mmTargetCx = ghainB.cx, mmTargetCy = shaddaB.cy + (shaddaB.h * (1 - MM_SHADDA_SCALE)) / 2 - EXTRA_GAP;
const mmShadda = xf(dList[shaddaIdx], { tx: mmTargetCx - shaddaB.cx, ty: mmTargetCy - shaddaB.cy, scale: MM_SHADDA_SCALE, cx: shaddaB.cx, cy: shaddaB.cy });
const mmDot = `<path d="${dList[ghainDotIdx]}"/>`;
const mmTop = mmTargetCy - (shaddaB.h / 2) * MM_SHADDA_SCALE;
const mmBx0 = Math.min(ghainB.cx - ghainB.w / 2, mmTargetCx - (shaddaB.w / 2) * MM_SHADDA_SCALE);
const mmBx1 = Math.max(ghainB.cx + ghainB.w / 2, mmTargetCx + (shaddaB.w / 2) * MM_SHADDA_SCALE);
const micromark = assemble(mmShadda + mmDot, mmBx0, mmTop, mmBx1, ghainB.cy + ghainB.h / 2, 40);
fs.writeFileSync('SHAGHIL_MICROMARK.svg', micromark);
fs.writeFileSync('SHAGHIL_FAVICON.svg', micromark);

// ---------- App icon (BW): micro-mark centered on a square tile ----------
{
  const mmW = mmBx1 - mmBx0, mmH = (ghainB.cy + ghainB.h / 2) - mmTop;
  const tileSize = Math.max(mmW, mmH) * 1.9;
  const cx = (mmBx0 + mmBx1) / 2, cy = (mmTop + (ghainB.cy + ghainB.h / 2)) / 2;
  const tileX0 = cx - tileSize / 2, tileY0 = cy - tileSize / 2;
  const r = tileSize * 0.22;
  const appIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${tileX0} ${tileY0} ${tileSize} ${tileSize}" width="512" height="512" style="display:block">` +
    `<rect x="${tileX0}" y="${tileY0}" width="${tileSize}" height="${tileSize}" rx="${r}" fill="#000"/>` +
    `<g fill="#fff">${mmShadda}${mmDot}</g></svg>`;
  fs.writeFileSync('SHAGHIL_APP_ICON_BW.svg', appIcon);
}

// ---------- Stacked AR/EN lockup ----------
{
  const m = master.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
  const [vx, vy, vw, vh] = m.slice(1).map(Number);
  const arInner = master.match(/<g fill="#000">([\s\S]*)<\/g><\/svg>/)[1];
  const latinSize = vw * 0.11;
  const gap = vh * 0.18;
  const totalH = vh + gap + latinSize * 1.3;
  const stackedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${totalH}" width="${Math.round(vw)}" height="${Math.round(totalH)}" style="display:block">` +
    `<g fill="#000">${arInner}</g>` +
    `<text x="${vx + vw / 2}" y="${vy + vh + gap + latinSize}" direction="ltr" font-family="Helvetica Neue, Arial, sans-serif" font-weight="600" font-size="${latinSize}" letter-spacing="${latinSize * 0.22}" fill="#000" text-anchor="middle">SHAGHIL</text>` +
    `</svg>`;
  fs.writeFileSync('SHAGHIL_MASTER_AR_EN_STACKED.svg', stackedSvg);
}

// ---------- Horizontal AR/EN lockup ----------
{
  const m = master.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
  const [vx, vy, vw, vh] = m.slice(1).map(Number);
  const arInner = master.match(/<g fill="#000">([\s\S]*)<\/g><\/svg>/)[1];
  const latinSize = vh * 0.22;
  const gap = vw * 0.06;
  const latinW = latinSize * 5.9; // measured via Playwright for "SHAGHIL" at this weight/tracking
  const totalW = vw + gap + latinW;
  const horizSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${totalW} ${vh}" width="${Math.round(totalW)}" height="${Math.round(vh)}" style="display:block">` +
    `<g fill="#000">${arInner}</g>` +
    `<text x="${vx + vw + gap}" y="${vy + vh * 0.62}" direction="ltr" font-family="Helvetica Neue, Arial, sans-serif" font-weight="600" font-size="${latinSize}" letter-spacing="${latinSize * 0.18}" fill="#000" text-anchor="start">SHAGHIL</text>` +
    `</svg>`;
  fs.writeFileSync('SHAGHIL_MASTER_AR_EN_HORIZONTAL.svg', horizSvg);
}

// ---------- Endorsement lockup: AR + EN stacked + "by MIGHT MADE" text-only placeholder ----------
{
  const stacked = fs.readFileSync('SHAGHIL_MASTER_AR_EN_STACKED.svg', 'utf8');
  const m = stacked.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
  const [vx, vy, vw, vh] = m.slice(1).map(Number);
  const inner = stacked.match(/<svg[^>]*>([\s\S]*)<\/svg>/)[1];
  const endorseSize = vh * 0.045;
  const gap2 = vh * 0.08;
  const totalH = vh + gap2 + endorseSize * 1.6;
  const endorsedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${totalH}" width="${Math.round(vw)}" height="${Math.round(totalH)}" style="display:block">` +
    inner +
    `<text x="${vx + vw / 2}" y="${vy + vh + gap2 + endorseSize}" direction="ltr" font-family="Helvetica Neue, Arial, sans-serif" font-weight="400" font-size="${endorseSize}" letter-spacing="${endorseSize * 0.15}" fill="#666" text-anchor="middle">by MIGHT MADE</text>` +
    `</svg>`;
  fs.writeFileSync('SHAGHIL_ENDORSED_LOCKUP.svg', endorsedSvg);
}

console.log('lockup package built');
