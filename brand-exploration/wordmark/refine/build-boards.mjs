import fs from 'node:fs';
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;

const concepts = [
  {
    slug: 'w1', label: 'W1 — Precision',
    idea: 'A disciplined, engineered reading of شغّل: proportions condensed to a slightly tighter rhythm, and the word\'s own diacritics regularized rather than left to their natural, organic spacing — the three dots of the first letter brought into a precise, evenly spaced arrangement, and the shadda recentered exactly on the vertical axis of the dot it sits above.',
    construction: 'Customizations applied before/through tracing: (1) uniform 7% horizontal compression of the whole word — a single geometric transform, safe because it never touches cursive joining. (2) The three real traced sheen dots repositioned (not redrawn) into a precise, evenly spaced triangular arrangement centered on their own original cluster. (3) The real traced shadda recentered on the ghain dot\'s exact vertical axis and reduced 10% for a tighter fit. All three edits reposition or rescale real traced shapes; no letterform was redrawn.',
  },
  {
    slug: 'w2', label: 'W2 — Activation',
    idea: 'Activation lives inside the word itself: the real shadda — already Arabic\'s own emphasis mark — and the real dot it sits above are both drawn slightly larger and fractionally closer together than their natural proportions, forming one legible, energetic cluster without adding any new symbol.',
    construction: 'The real traced shadda is scaled 1.35× in place; the real traced ghain dot is scaled 1.25× and lifted 14% of the gap toward the shadda. Both are genuinely disconnected components in the real rendering (confirmed by connected-component tracing), so scaling and repositioning them cannot disturb any letter\'s joining. No shape was added; both marks are the word\'s own.',
  },
  {
    slug: 'w3', label: 'W3 — Motion',
    idea: 'Forward energy from the word\'s own construction, not from an added arrow: a restrained forward lean across the whole connected form, drawn with slightly more confident, energetic weight.',
    construction: 'A uniform -8° skew is applied to the whole rendering before tracing (a single geometric transform — the letters keep their real relative proportions, nothing is italicized letter-by-letter). The traced result is then drawn twice — once with a matched stroke outline, once as a plain fill, both black — a standard, disclosed vector emboldening technique that adds real weight without redrawing a single stroke.',
  },
];

function fileText(p) { return fs.readFileSync(p, 'utf8'); }

function page(c) {
  const wordSvg = fileText(`${c.slug}-wordmark.svg`);
  const wordSvgInv = wordSvg.replace(/fill="#000"/g, 'fill="#fff"').replace(/stroke="#000"/g, 'stroke="#fff"');
  const mmSvg = fileText(`${c.slug}-micromark.svg`);
  const mmSvgInv = mmSvg.replace(/fill="#000"/g, 'fill="#fff"').replace(/stroke="#000"/g, 'stroke="#fff"');
  const smallPath = `${c.slug}-micromark-small.svg`;
  const hasSmall = fs.existsSync(smallPath);
  const mmSvgSmall = hasSmall ? fileText(smallPath) : mmSvg;
  const refPng = 'word-reference.png';

  return `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
  @font-face { font-family: 'NKA'; src: url('file://${process.cwd()}/notokufiarabic900.woff2') format('woff2'); font-weight: 900; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; font-family: 'Helvetica Neue', Arial, 'NKA', sans-serif; color: #111; }
  .canvas { width: 1800px; padding: 0 0 80px; }
  section { padding: 70px 90px; border-bottom: 1px solid #eee; }
  h2 { font-size: 22px; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin: 0 0 34px; direction: ltr; text-align: left; font-weight: 600; }
  .panel { display: flex; align-items: center; justify-content: center; padding: 60px 20px; }
  .panel.light { background: #fff; border: 1px solid #eee; }
  .panel.dark { background: #0a0a0a; }
  .word-xl { max-width: 1600px; height: auto; }
  .idea { font-size: 22px; line-height: 1.7; max-width: 1150px; direction: ltr; text-align: left; color: #222; }
  .construction-text { font-size: 17px; line-height: 1.7; max-width: 1100px; direction: ltr; text-align: left; color: #444; }
  .title { font-size: 46px; font-weight: 700; direction: ltr; text-align: left; margin: 0 0 10px; }
  .lockup { display: flex; flex-direction: column; align-items: center; gap: 30px; }
  .lockup .word-lockup { max-width: 1000px; height: auto; }
  .lockup .latin { font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: 500; font-size: 46px; letter-spacing: 0.18em; color: #111; direction: ltr; }
  .ladder { display: flex; align-items: flex-end; gap: 60px; }
  .ladder .cell { text-align: center; }
  .ladder .box { display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #ddd; }
  .ladder .label { margin-top: 14px; font-size: 14px; color: #888; direction: ltr; }
  .sims { display: flex; gap: 50px; flex-wrap: wrap; align-items: flex-end; }
  .sim { text-align: center; }
  .sim .frame { display: flex; align-items: center; justify-content: center; }
  .sim .label { margin-top: 14px; font-size: 14px; color: #888; direction: ltr; }
  .favicon-tab { width: 220px; height: 44px; background: #e8e8e8; border-radius: 8px 8px 0 0; display: flex; align-items: center; padding: 0 12px; gap: 8px; }
  .favicon-tab .ic { width: 18px; height: 18px; }
  .favicon-tab .txt { font-size: 12px; color: #555; direction: ltr; }
  .app-icon { width: 128px; height: 128px; border-radius: 28px; background: #000; display: flex; align-items: center; justify-content: center; }
  .app-icon .mm { width: 60%; height: 60%; }
  .header-test { width: 1000px; height: 80px; background: #0d0d0d; display: flex; align-items: center; padding: 0 34px; gap: 24px; }
  .header-test .word-h { height: 34px; width: auto; }
  .header-test .mm-h { width: 34px; height: 34px; }
  .header-test .nav { margin-left: auto; display: flex; gap: 26px; }
  .header-test .nav span { color: #999; font-size: 14px; direction: ltr; }
  .construction-diagram { display: flex; gap: 50px; align-items: center; }
  .construction-diagram img { max-width: 760px; border: 1px solid #eee; }
  .before-after { display: flex; align-items: center; gap: 50px; }
  .before-after .col { flex: 1; text-align: center; }
  .before-after .col .cap { margin-top: 16px; font-size: 14px; color: #888; direction: ltr; }
  .before-after .arrow { font-size: 40px; color: #ccc; }
  .badge { display: inline-block; background: #111; color: #fff; font-size: 13px; padding: 4px 12px; border-radius: 20px; margin-bottom: 18px; direction: ltr; letter-spacing: 0.04em; }
</style></head>
<body>
<div class="canvas">

<section style="border-top: 10px solid #000;">
  <span class="badge">SHAGHIL — WORDMARK-LED IDENTITY — FINAL LOGO ROUND — BLACK &amp; WHITE ONLY</span>
  <h1 class="title">${c.label}</h1>
  <p class="idea">${c.idea}</p>
</section>

<section>
  <h2>01 · Wordmark, Very Large, Black on White</h2>
  <div class="panel light">${wordSvg.replace(/width="[\d.]+" height="[\d.]+"/, 'class="word-xl"')}</div>
</section>

<section>
  <h2>02 · Wordmark, Very Large, White on Black</h2>
  <div class="panel dark">${wordSvgInv.replace(/width="[\d.]+" height="[\d.]+"/, 'class="word-xl"')}</div>
</section>

<section>
  <h2>03 · Construction / Customization Detail</h2>
  <div class="construction-diagram">
    <img src="${refPng}" style="max-height:380px;width:auto;">
    <p class="construction-text">${c.construction}</p>
  </div>
</section>

<section>
  <h2>04 · Reference → Customized Result</h2>
  <div class="before-after">
    <div class="col"><img src="${refPng}" style="max-width:500px;"><div class="cap">plain browser-shaped reference</div></div>
    <div class="arrow">→</div>
    <div class="col">${wordSvg.replace(/width="[\d.]+" height="[\d.]+"/, 'style="max-width:500px;height:auto;"')}<div class="cap">${c.label.split(' — ')[1]}, customized</div></div>
  </div>
</section>

<section>
  <h2>05 · Arabic + English Lockup</h2>
  <div class="lockup panel light">
    ${wordSvg.replace(/width="[\d.]+" height="[\d.]+"/, 'class="word-lockup"')}
    <div class="latin">SHAGHIL</div>
  </div>
</section>

<section>
  <h2>06 · Wordmark Size Ladder — 256 / 128 / 64 / 32px</h2>
  <div class="ladder">
    ${[256, 128, 64, 32].map((s) => `<div class="cell"><div class="box" style="width:${Math.round(s * 2.4)}px;height:${s}px;">${wordSvg.replace(/width="[\d.]+" height="[\d.]+"/, `style="height:${Math.round(s * 0.8)}px;width:auto;"`)}</div><div class="label">${s}px</div></div>`).join('')}
  </div>
</section>

<section>
  <h2>07 · Secondary Micro-Mark, Large</h2>
  <div class="panel light">${mmSvg.replace(/width="[\d.]+" height="[\d.]+"/, 'style="width:280px;height:auto;"')}</div>
</section>

<section>
  <h2>08 · Micro-Mark Size Ladder — 64 / 32 / 16px</h2>
  ${hasSmall ? '<p class="construction-text" style="margin-bottom:30px;">32px and 16px below use an optically-simplified small-size variant of this micro-mark (same real source shapes, a restored real gap) — the full-scale cluster in 07 loses that gap at these sizes and reads as one muddy blob. See documentation.</p>' : ''}
  <div class="ladder">
    ${[64, 32, 16].map((s) => {
      const svgForSize = (hasSmall && s <= 32) ? mmSvgSmall : mmSvg;
      return `<div class="cell"><div class="box" style="width:${s}px;height:${s}px;">${svgForSize.replace(/width="[\d.]+" height="[\d.]+"/, `width="${Math.round(s * 0.82)}" height="${Math.round(s * 0.82)}"`)}</div><div class="label">${s}px</div></div>`;
    }).join('')}
  </div>
</section>

<section>
  <h2>09–10 · Favicon &amp; App-Icon Simulation</h2>
  <div class="sims">
    <div class="sim">
      <div class="frame favicon-tab"><span class="ic">${mmSvgSmall.replace(/width="[\d.]+" height="[\d.]+"/, 'width="18" height="18"')}</span><span class="txt">shaghil.app</span></div>
      <div class="label">favicon / browser tab${hasSmall ? ' (small-size variant)' : ''}</div>
    </div>
    <div class="sim">
      <div class="frame app-icon">${mmSvgInv.replace(/width="[\d.]+" height="[\d.]+"/, 'class="mm"')}</div>
      <div class="label">app icon (dark tile)</div>
    </div>
  </div>
</section>

<section style="border-bottom: none;">
  <h2>11 · Product Header Test</h2>
  <div class="header-test">
    ${mmSvgInv.replace(/width="[\d.]+" height="[\d.]+"/, 'class="mm-h"')}
    ${wordSvgInv.replace(/width="[\d.]+" height="[\d.]+"/, 'class="word-h"')}
    <div class="nav"><span>History</span><span>Visual Studio</span><span>Brand Brain</span><span>Business Brain</span></div>
  </div>
</section>

</div>
</body></html>`;
}

const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
for (const c of concepts) {
  const p = await browser.newPage({ viewport: { width: 1800, height: 1200 } });
  const html = page(c);
  fs.writeFileSync(`shaghil-${c.slug}.html`, html);
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.waitForTimeout(150);
  const full = await p.locator('.canvas').boundingBox();
  const h = Math.ceil(full.height);
  await p.setViewportSize({ width: 1800, height: h });
  await p.waitForTimeout(100);
  const buf = await p.screenshot({ clip: { x: 0, y: 0, width: 1800, height: h } });
  fs.writeFileSync(`shaghil-${c.slug}.png`, buf);
  console.log(c.slug, 'height', full.height);
  await p.close();
}
await browser.close();
console.log('boards built');
