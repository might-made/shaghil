// Produces the required BEFORE / AFTER comparison at full wordmark, lam top detail, key
// joins, shadda+ghain dot, and sheen+three-dots — for the seam-dedupe fix that removes the
// confirmed lam-top rendering artifact. "Before" = seamDedupeDist:0 (old behavior,
// reproduces the artifact exactly). "After" = seamDedupeDist:3 (the fix, now the default).
import fs from 'node:fs';
import { traceRegion } from './trace.mjs';
import { renderWordPNG, screenshotSVG } from './common.mjs';

const { png } = await renderWordPNG({ fontSize: 1400 });
const before = traceRegion(png.data, { width: png.width, height: png.height, threshold: 140, epsilon: 3.0, minArea: 40, smooth: true, seamDedupeDist: 0 });
const after = traceRegion(png.data, { width: png.width, height: png.height, threshold: 140, epsilon: 3.0, minArea: 40, smooth: true, seamDedupeDist: 3 });

async function renderFull(full, name, targetW) {
  const targetH = Math.round((png.height / png.width) * targetW);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${png.width} ${png.height}" width="${targetW}" height="${targetH}"><path d="${full.d}" fill="#000"/></svg>`;
  await screenshotSVG(svg, name, { width: targetW, height: targetH });
}

for (const [label, full] of [['before', before], ['after', after]]) {
  await renderFull(full, `raw-${label}.png`, 1800);
}

// Now crop the 5 required views from each raw render using pngjs (proven reliable method).
const { PNG } = await import('pngjs');
function crop(srcName, outName, x, y, w, h) {
  const src = PNG.sync.read(fs.readFileSync(srcName));
  const c = new PNG({ width: w, height: h });
  PNG.bitblt(src, c, x, y, w, h, 0, 0);
  fs.writeFileSync(outName, PNG.sync.write(c));
}

for (const label of ['before', 'after']) {
  const raw = `raw-${label}.png`;
  // full wordmark (whole 1800x882 image, just copy/rename for clarity)
  fs.copyFileSync(raw, `qa1-full-${label}.png`);
  // lam top detail (confirmed region from investigation)
  crop(raw, `qa2-lamtop-${label}.png`, 300, 0, 400, 300);
  // key joins: sheen-ghain join + ghain-lam join, mid band of the word
  crop(raw, `qa3-joins-${label}.png`, 250, 150, 1300, 500);
  // shadda + ghain dot (upper-middle area)
  crop(raw, `qa4-shadda-dot-${label}.png`, 680, 0, 350, 400);
  // sheen + three dots (rightmost letter with its dot cluster)
  crop(raw, `qa5-sheen-${label}.png`, 1250, 0, 550, 500);
}

console.log('cleanup QA crops written: qa1..qa5, -before/-after each');
