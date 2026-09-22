import fs from 'node:fs';
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;

const concepts = [
  {
    slug: 'd1', label: 'D1 — Letter Relationship',
    idea: 'A compact proprietary form built from the relationship between two real, distant parts of the same word: the final letter\'s own terminal hook, and the shadda that marks the letter before it. Two genuine fragments of شغّل, brought into one new construction — not a literal mini-word.',
    construction: 'Source geometry: the real traced outline of the final letter (stem + hook, cropped from the word\'s own connected rendering) as the primary form, with the real traced shadda nested at the hook\'s opening. Wordmark customization: a restrained +4.5% vertical stretch across the whole word, reinforcing verticality without touching letter joining.',
  },
  {
    slug: 'd2', label: 'D2 — Shadda / Activation',
    idea: 'The real shadda — already Arabic\'s own emphasis mark — is not replaced with a generic shape. Its actual traced silhouette (an angular, zigzag form specific to this typeface, not a square) is used directly: at full scale, with a faded echo trailing behind it, anchored by the real dot that always sits beneath it in genuine Arabic orthography.',
    construction: 'Source geometry: the real traced shadda glyph, duplicated and offset at reduced opacity to suggest propagating emphasis, plus the real traced dot of the letter it sits above, fixed in its true anatomical position. Wordmark customization: the wordmark\'s own real shadda subpath (a genuinely separate, disconnected component of the rendering — never touching the connected letters) is scaled 1.48× in place.',
  },
  {
    slug: 'd3', label: 'D3 — Negative Space / Motion',
    idea: 'Motion without an illustrated arrow: the real enclosed counter-space where the second letter\'s bowl meets the word\'s connecting stroke — an authentic negative-space wedge that exists only because of how the letters actually join — repeated in a receding trail along the same diagonal Arabic reading moves on.',
    construction: 'Source geometry: the real traced negative-space wedge (background ink-boundary, not a foreground letter shape), extracted by inverting a tightly cropped region of the live rendering and tracing the enclosed hole. Wordmark customization: a restrained -4° uniform skew across the whole word, a single geometric transform that never touches cursive joining.',
  },
];

function fileText(p) { return fs.readFileSync(p, 'utf8'); }

function svgInline(path, { maxW = null, maxH = null } = {}) {
  let svg = fileText(path);
  if (maxW) svg = svg.replace(/width="[\d.]+"/, `width="${maxW}"`);
  if (maxH) svg = svg.replace(/height="[\d.]+"/, `height="${maxH}"`);
  return svg;
}

function page(c) {
  const markSvg = fileText(`shaghil-${c.slug}-mark.svg`);
  const markSvgInv = markSvg.replace('fill="#000"', 'fill="#fff"');
  const wordSvgRaw = fileText(`shaghil-${c.slug}-wordmark.svg`);
  const wordSvgInv = wordSvgRaw.replace(/fill="#000"/g, 'fill="#fff"');
  const refPng = 'word-reference.png';
  const smallPath = `shaghil-${c.slug}-mark-small.svg`;
  const hasSmall = fs.existsSync(smallPath);
  const markSvgSmall = hasSmall ? fileText(smallPath) : markSvg;

  return `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
  @font-face { font-family: 'NKA'; src: url('file://${process.cwd()}/notokufiarabic900.woff2') format('woff2'); font-weight: 900; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; font-family: 'Helvetica Neue', Arial, 'NKA', sans-serif; color: #111; }
  .canvas { width: 1800px; padding: 0 0 80px; }
  section { padding: 70px 90px; border-bottom: 1px solid #eee; }
  h2 { font-size: 22px; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin: 0 0 34px; direction: ltr; text-align: left; font-weight: 600; }
  .row { display: flex; gap: 40px; align-items: center; }
  .panel { flex: 1; display: flex; align-items: center; justify-content: center; padding: 50px; }
  .panel.light { background: #fff; border: 1px solid #eee; }
  .panel.dark { background: #0a0a0a; }
  .mark-lg { width: 260px; height: 260px; }
  .word-lg { max-width: 100%; height: auto; }
  .idea { font-size: 22px; line-height: 1.7; max-width: 1100px; direction: ltr; text-align: left; color: #222; }
  .construction-text { font-size: 17px; line-height: 1.7; max-width: 1100px; direction: ltr; text-align: left; color: #444; margin-top: 22px; }
  .title { font-size: 46px; font-weight: 700; direction: ltr; text-align: left; margin: 0 0 10px; }
  .lockup { display: flex; align-items: center; gap: 46px; }
  .lockup .mark-lg { width: 170px; height: 170px; flex-shrink: 0; }
  .ladder { display: flex; align-items: flex-end; gap: 60px; }
  .ladder .cell { text-align: center; }
  .ladder .box { display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #ddd; }
  .ladder .label { margin-top: 14px; font-size: 14px; color: #888; direction: ltr; }
  .sims { display: flex; gap: 50px; flex-wrap: wrap; }
  .sim { text-align: center; }
  .sim .frame { display: flex; align-items: center; justify-content: center; }
  .sim .label { margin-top: 14px; font-size: 14px; color: #888; direction: ltr; }
  .favicon-tab { width: 220px; height: 44px; background: #e8e8e8; border-radius: 8px 8px 0 0; display: flex; align-items: center; padding: 0 12px; gap: 8px; }
  .favicon-tab .ic { width: 18px; height: 18px; }
  .favicon-tab .txt { font-size: 12px; color: #555; direction: ltr; }
  .app-icon { width: 128px; height: 128px; border-radius: 28px; background: #000; display: flex; align-items: center; justify-content: center; }
  .app-icon .mark-lg { width: 64%; height: 64%; }
  .app-icon.white-bg { background: #fff; border: 1px solid #eee; }
  .app-icon.white-bg .mark-lg { filter: none; }
  .avatar { width: 128px; height: 128px; border-radius: 50%; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .avatar .mark-lg { width: 58%; height: 58%; }
  .header-test { width: 900px; height: 76px; background: #0d0d0d; display: flex; align-items: center; padding: 0 30px; gap: 20px; }
  .header-test .mark-lg { width: 40px; height: 40px; }
  .header-test .word-lg { height: 26px; width: auto; }
  .header-test .nav { margin-left: auto; display: flex; gap: 26px; }
  .header-test .nav span { color: #999; font-size: 14px; direction: ltr; }
  .print-test { width: 340px; height: 340px; background: #fff; border: 2px solid #000; display: flex; align-items: center; justify-content: center; }
  .print-test .mark-lg { width: 55%; height: 55%; }
  .construction-diagram { display: flex; gap: 50px; align-items: flex-start; }
  .construction-diagram img { max-width: 760px; border: 1px solid #eee; }
  .badge { display: inline-block; background: #111; color: #fff; font-size: 13px; padding: 4px 12px; border-radius: 20px; margin-bottom: 18px; direction: ltr; letter-spacing: 0.04em; }
</style></head>
<body>
<div class="canvas">

<section style="border-top: 10px solid #000;">
  <span class="badge">SHAGHIL — ARABIC MARK REFINEMENT — BLACK &amp; WHITE ONLY</span>
  <h1 class="title">${c.label}</h1>
  <p class="idea">${c.idea}</p>
</section>

<section>
  <h2>01–02 · Mark, Large, Both Directions</h2>
  <div class="row">
    <div class="panel light">${markSvg.replace('width="200" height="200"', 'class="mark-lg"')}</div>
    <div class="panel dark">${markSvgInv.replace('width="200" height="200"', 'class="mark-lg"')}</div>
  </div>
</section>

<section>
  <h2>03 · Wordmark, Large</h2>
  <div class="panel light" style="padding:60px 20px;">${wordSvgRaw.replace(/width="[\d.]+" height="[\d.]+"/, 'class="word-lg" style="max-width:1500px;height:auto;"')}</div>
</section>

<section>
  <h2>04 · Mark + Wordmark Relationship (Lockup)</h2>
  <div class="lockup panel light">
    ${markSvg.replace('width="200" height="200"', 'class="mark-lg"')}
    ${wordSvgRaw.replace(/width="[\d.]+" height="[\d.]+"/, 'class="word-lg" style="max-width:900px;height:auto;"')}
  </div>
</section>

<section>
  <h2>05 · Construction / Origin</h2>
  <div class="construction-diagram">
    <img src="${refPng}" style="max-height:420px;width:auto;">
    <div>
      <p class="construction-text">${c.construction}</p>
    </div>
  </div>
</section>

<section>
  <h2>06 · Size Ladder — 128 / 64 / 32 / 16px</h2>
  ${hasSmall ? '<p class="construction-text" style="margin-top:-20px;margin-bottom:30px;">32px and 16px below use an optically-simplified small-size variant of this mark (same real source geometry, fewer repeated steps) — see 05 and the documentation for why.</p>' : ''}
  <div class="ladder">
    ${[128, 64, 32, 16].map((s) => {
      const svgForSize = (hasSmall && s <= 32) ? markSvgSmall : markSvg;
      return `<div class="cell"><div class="box" style="width:${s}px;height:${s}px;">${svgForSize.replace('width="200" height="200"', `width="${Math.round(s * 0.82)}" height="${Math.round(s * 0.82)}"`)}</div><div class="label">${s}px</div></div>`;
    }).join('')}
  </div>
</section>

<section>
  <h2>07–10 · Applied Simulations</h2>
  <div class="sims">
    <div class="sim">
      <div class="frame favicon-tab"><span class="ic">${markSvgSmall.replace('width="200" height="200"', 'width="18" height="18"')}</span><span class="txt">shaghil.app</span></div>
      <div class="label">favicon / browser tab${hasSmall ? ' (small-size variant)' : ''}</div>
    </div>
    <div class="sim">
      <div class="frame app-icon">${markSvgInv.replace('width="200" height="200"', 'class="mark-lg"')}</div>
      <div class="label">app icon (dark tile)</div>
    </div>
    <div class="sim">
      <div class="frame avatar">${markSvgInv.replace('width="200" height="200"', 'class="mark-lg"')}</div>
      <div class="label">social avatar (circular crop)</div>
    </div>
    <div class="sim">
      <div class="frame print-test">${markSvg.replace('width="200" height="200"', 'class="mark-lg"')}</div>
      <div class="label">one-color print / stamp test</div>
    </div>
  </div>
</section>

<section style="border-bottom: none;">
  <h2>11 · Browser / Product Header Test</h2>
  <div class="header-test">
    ${markSvgInv.replace('width="200" height="200"', 'width="40" height="40"')}
    ${wordSvgInv.replace(/width="[\d.]+" height="[\d.]+"/, 'height="26" width="auto"')}
    <div class="nav"><span>Business Brain</span><span>Brand Brain</span><span>Visual Studio</span><span>History</span></div>
  </div>
</section>

</div>
</body></html>`;
}

const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
for (const c of concepts) {
  const page1 = await browser.newPage({ viewport: { width: 1800, height: 1200 } });
  await page1.setContent(page(c), { waitUntil: 'networkidle' });
  await page1.waitForTimeout(150);
  fs.writeFileSync(`shaghil-${c.slug}.html`, page(c));
  const full = await page1.locator('.canvas').boundingBox();
  const buf = await page1.screenshot({ clip: { x: 0, y: 0, width: 1800, height: Math.ceil(full.height) } });
  fs.writeFileSync(`shaghil-${c.slug}.png`, buf);
  console.log(c.slug, 'height', full.height);
  await page1.close();
}
await browser.close();
console.log('boards built');
