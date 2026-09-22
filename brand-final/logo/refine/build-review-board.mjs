import fs from 'node:fs';
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;

function ft(p) { return fs.readFileSync(p, 'utf8'); }

// Resize an SVG to an explicit target pixel width, computing height from its own viewBox
// aspect ratio directly (reliable across browsers) rather than relying on CSS
// max-width/height:auto on a replaced <svg> element, which was found to size unpredictably
// inside a flex container here.
function fitTo(svg, targetW) {
  const vb = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
  const [, , , vw, vh] = vb.map(Number);
  const targetH = Math.round((vh / vw) * targetW);
  return svg.replace(/width="[\d.]+" height="[\d.]+"( style="display:block")?/, `width="${targetW}" height="${targetH}" style="display:block"`);
}

const masterBlack = ft('../master/SHAGHIL_MASTER_AR_BLACK.svg');
const masterWhite = ft('../master/SHAGHIL_MASTER_AR_WHITE.svg');
const stacked = ft('../lockups/SHAGHIL_MASTER_AR_EN_STACKED.svg');
const horizontal = ft('../lockups/SHAGHIL_MASTER_AR_EN_HORIZONTAL.svg');
const endorsed = ft('../lockups/SHAGHIL_ENDORSED_LOCKUP.svg');
const micromark = ft('../micromark/SHAGHIL_MICROMARK.svg');
const favicon = ft('../micromark/SHAGHIL_FAVICON.svg');
const appIcon = ft('../micromark/SHAGHIL_APP_ICON_BW.svg');
const w1Exploration = ft('/home/user/shaghil/brand-exploration/wordmark/W1-wordmark.svg');

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
  @font-face { font-family: 'NKA'; src: url('file://${process.cwd()}/notokufiarabic900.woff2') format('woff2'); font-weight: 900; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; font-family: 'Helvetica Neue', Arial, 'NKA', sans-serif; color: #111; }
  .canvas { width: 1900px; padding: 0 0 80px; }
  section { padding: 64px 90px; border-bottom: 1px solid #eee; }
  h2 { font-size: 21px; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin: 0 0 30px; direction: ltr; text-align: left; font-weight: 600; }
  .panel { display: flex; align-items: center; justify-content: center; padding: 50px 20px; }
  .panel.light { background: #fff; border: 1px solid #eee; }
  .panel.dark { background: #0a0a0a; }
  .row { display: flex; gap: 40px; }
  .row > * { flex: 1; }
  .title { font-size: 44px; font-weight: 700; direction: ltr; text-align: left; margin: 0 0 8px; }
  .badge { display: inline-block; background: #111; color: #fff; font-size: 13px; padding: 4px 12px; border-radius: 20px; margin-bottom: 18px; direction: ltr; letter-spacing: 0.04em; }
  .status { display: inline-block; background: #0a5; color: #fff; font-size: 13px; padding: 4px 12px; border-radius: 20px; margin: 0 0 18px 12px; direction: ltr; letter-spacing: 0.04em; }
  .word-xl { max-width: 1650px; height: auto; }
  .ladder { display: flex; align-items: flex-end; gap: 50px; }
  .ladder .cell { text-align: center; }
  .ladder .box { display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #ddd; }
  .ladder .label { margin-top: 12px; font-size: 13px; color: #888; direction: ltr; }
  .sims { display: flex; gap: 46px; flex-wrap: wrap; align-items: flex-end; }
  .sim { text-align: center; }
  .sim .frame { display: flex; align-items: center; justify-content: center; }
  .sim .label { margin-top: 12px; font-size: 13px; color: #888; direction: ltr; }
  .favicon-tab { width: 200px; height: 42px; background: #e8e8e8; border-radius: 8px 8px 0 0; display: flex; align-items: center; padding: 0 12px; gap: 8px; }
  .favicon-tab .ic { width: 18px; height: 18px; }
  .favicon-tab .txt { font-size: 12px; color: #555; direction: ltr; }
  .app-icon-frame { width: 128px; height: 128px; }
  .clearspace-demo { position: relative; display: inline-block; border: 1px dashed #bbb; padding: 0; }
  .clearspace-demo .unit-label { position: absolute; font-size: 13px; color: #0a5; direction: ltr; }
  .minsize-row { display: flex; align-items: center; gap: 50px; }
  .minsize-row .item { text-align: center; }
  .minsize-row .label { margin-top: 12px; font-size: 13px; color: #888; direction: ltr; }
  .header-test { direction: ltr; width: 1000px; height: 78px; background: #0d0d0d; display: flex; align-items: center; padding: 0 32px; gap: 22px; }
  .header-test .word-h { height: 32px; width: auto; flex-shrink: 0; }
  .header-test .mm-h { width: 32px; height: 32px; flex-shrink: 0; }
  .header-test .nav { margin-left: auto; display: flex; gap: 24px; }
  .header-test .nav span { color: #999; font-size: 14px; direction: ltr; }
  .compare { direction: ltr; display: flex; align-items: center; gap: 50px; }
  .compare .col { flex: 1; text-align: center; }
  .compare .col .cap { margin-top: 16px; font-size: 14px; color: #888; direction: ltr; }
  .compare .arrow { font-size: 40px; color: #ccc; }
  .rule-text { font-size: 17px; line-height: 1.7; direction: ltr; text-align: left; color: #333; max-width: 1000px; }
</style></head>
<body>
<div class="canvas">

<section style="border-top: 10px solid #000;">
  <span class="badge">SHAGHIL — MASTER LOGO — FOUNDER REVIEW</span>
  <span class="status">W1 — PRECISION SELECTED · FINAL MASTER PREPARED</span>
  <h1 class="title">SHAGHIL Master Wordmark</h1>
  <p class="rule-text">Basis: W1 — Precision (Founder-approved, ${new Date().toISOString().slice(0,10)}). This board shows the finalized master asset after optical cleanup — no new concepts, no alternatives, no color.</p>
</section>

<section>
  <h2>01–02 · Final Master, Very Large, Black on White</h2>
  <div class="panel light">${fitTo(masterBlack, 1650)}</div>
</section>

<section>
  <h2>03 · Final Master, White on Black</h2>
  <div class="panel dark">${fitTo(masterWhite, 1650)}</div>
</section>

<section>
  <h2>04 · Arabic + SHAGHIL — Stacked Lockup</h2>
  <div class="panel light">${fitTo(stacked, 900)}</div>
</section>

<section>
  <h2>05 · Arabic + SHAGHIL — Horizontal Lockup</h2>
  <div class="panel light">${fitTo(horizontal, 1500)}</div>
</section>

<section>
  <h2>06–08 · Micro-Mark, Favicon, App Icon</h2>
  <div class="sims">
    <div class="sim"><div class="frame panel light" style="width:260px;height:340px;">${fitTo(micromark, 220)}</div><div class="label">micro-mark</div></div>
    <div class="sim"><div class="frame favicon-tab"><span class="ic">${fitTo(favicon, 18)}</span><span class="txt">shaghil.app</span></div><div class="label">favicon / browser tab</div></div>
    <div class="sim"><div class="frame app-icon-frame">${fitTo(appIcon, 128)}</div><div class="label">app icon (dark tile)</div></div>
  </div>
</section>

<section>
  <h2>09 · Micro-Mark Size Ladder — 128 / 64 / 32 / 16px</h2>
  <div class="ladder">
    ${[128, 64, 32, 16].map((s) => `<div class="cell"><div class="box" style="width:${s}px;height:${s}px;">${fitTo(micromark, Math.round(s * 0.82))}</div><div class="label">${s}px</div></div>`).join('')}
  </div>
</section>

<section>
  <h2>10 · Clear-Space Rule</h2>
  <p class="rule-text">Clear-space unit = the height of the first letter's dot cluster in the master wordmark ("X"). Keep at least 1X of clear space on every side of the wordmark or lockup, free of other elements, text, or edges.</p>
  <div class="panel light" style="margin-top:30px;">
    <div class="clearspace-demo" style="padding:70px;">
      ${fitTo(masterBlack, 500)}
    </div>
  </div>
</section>

<section>
  <h2>11 · Minimum Size Rule</h2>
  <div class="minsize-row">
    <div class="item">${fitTo(masterBlack, 220)}<div class="label">min. digital width — wordmark alone: 160px</div></div>
    <div class="item">${fitTo(stacked, 160)}<div class="label">min. digital width — stacked lockup: 180px</div></div>
    <div class="item">${fitTo(micromark, 32)}<div class="label">min. micro-mark size: 16px</div></div>
  </div>
</section>

<section>
  <h2>12 · "by MIGHT MADE" Endorsement</h2>
  <p class="rule-text" style="margin-bottom:30px;">No locked MIGHT MADE master signature asset exists in this repository — this is a documented text-only placeholder, not a redesign of any MIGHT MADE asset.</p>
  <div class="panel light">${fitTo(endorsed, 900)}</div>
</section>

<section style="border-bottom: 1px solid #eee;">
  <h2>13 · Product Header Application</h2>
  <div class="header-test">
    ${fitTo(appIcon, 32)}
    ${fitTo(masterWhite, 260)}
    <div class="nav"><span>History</span><span>Visual Studio</span><span>Brand Brain</span><span>Business Brain</span></div>
  </div>
</section>

<section style="border-bottom: none;">
  <h2>14 · Comparison — Selected W1 Exploration → Final Optically Cleaned Master</h2>
  <div class="compare">
    <div class="col"><div class="panel light">${fitTo(w1Exploration, 600)}</div><div class="cap">W1 exploration (prior round)</div></div>
    <div class="arrow">→</div>
    <div class="col"><div class="panel light">${fitTo(masterBlack, 600)}</div><div class="cap">final master (this round — higher-resolution trace source, artifact-free)</div></div>
  </div>
</section>

</div>
</body></html>`;

fs.writeFileSync('SHAGHIL_LOGO_MASTER_FINAL.html', html);

const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
const page = await browser.newPage({ viewport: { width: 1900, height: 1200 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.waitForTimeout(150);
const full = await page.locator('.canvas').boundingBox();
const h = Math.ceil(full.height);
await page.setViewportSize({ width: 1900, height: h });
await page.waitForTimeout(100);
const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 1900, height: h } });
fs.writeFileSync('SHAGHIL_LOGO_MASTER_FINAL.png', buf);
console.log('review board built, height', h);
await browser.close();
