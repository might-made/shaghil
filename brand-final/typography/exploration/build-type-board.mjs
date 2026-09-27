// Builds one full 22-section typography review board for a single direction (T1/T2/T3),
// using real downloaded OFL webfont files, the real Arabic/numeric QA content, the LOCKED
// Graphite Pulse color tokens, and the LOCKED logo SVG (geometry untouched, fill only).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import { arabicQA, numericQA } from './qa-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(__dirname, 'fonts');
const specId = process.argv[2]; // T1, T2, T3
const specFile = { T1: 'T1-contemporary-saudi', T2: 'T2-technical-ai-native', T3: 'T3-premium-human' }[specId];
if (!specFile) { console.error('usage: node build-type-board.mjs T1|T2|T3'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(path.join(__dirname, 'specs', specFile + '.json'), 'utf8'));

const colorTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../color/final/shaghil-color-tokens.json'), 'utf8'));
function flattenColor(mode) {
  const g = colorTokens[mode].graphite, s = colorTokens[mode].signal, i = colorTokens[mode].interactive, sem = colorTokens[mode].semantic;
  return { ...g, signalPrimary: s.primary, signalHover: s.hover, cta: i.cta, ctaText: i.ctaText, focus: i.focus, disabledBg: i.disabledBg, disabledText: i.disabledText, success: sem.success, warning: sem.warning, error: sem.error, info: sem.info };
}
const D = flattenColor('dark');
const L = flattenColor('light');

const logoRoot = path.join(__dirname, '../../logo');
const rawMaster = fs.readFileSync(path.join(logoRoot, 'master/SHAGHIL_MASTER_AR.svg'), 'utf8');
function recolorMaster(hex) { return rawMaster.replace('fill="#000"', `fill="${hex}"`); }
function fitTo(svg, targetW) {
  const vb = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
  const [, , , vw, vh] = vb.map(Number);
  const targetH = Math.round((vh / vw) * targetW);
  return svg.replace(/width="[\d.]+" height="[\d.]+"( style="display:block")?/, `width="${targetW}" height="${targetH}" style="display:block"`);
}

// Which local font CSS files this direction needs, with absolute file:// URLs so Playwright's
// setContent (no base URL) can still resolve them.
const familyCssFiles = {
  T1: ['cairo.css'],
  T2: ['plexarabic.css', 'plexsans.css'],
  T3: ['elmessiri.css', 'readexpro.css', 'fraunces.css', 'worksans.css'],
}[specId];

let fontFaceCss = '';
for (const f of familyCssFiles) {
  let css = fs.readFileSync(path.join(fontsDir, f), 'utf8');
  css = css.replace(/url\('([^']+\.woff2)'\)/g, (m, fname) => `url('file://${path.join(fontsDir, fname)}')`);
  fontFaceCss += css + '\n';
}

function famName(role, lang) {
  if (spec.id !== 'T3') return lang === 'ar' ? spec.arabicFamily.name : spec.latinFamily.name;
  const isDisplay = role.family === 'display';
  return lang === 'ar' ? (isDisplay ? 'El Messiri' : 'Readex Pro') : (isDisplay ? 'Fraunces' : 'Work Sans');
}
function roleByName(name) { return spec.scale.find((r) => r.role === name); }
function styleFor(roleName, lang) {
  const r = roleByName(roleName);
  const weight = lang === 'ar' ? r.weightAr : r.weightEn;
  const lh = lang === 'ar' ? r.lhAr : r.lhEn;
  const tracking = lang === 'ar' ? r.trackingAr : r.trackingEn;
  const family = famName(r, lang);
  return `font-family:'${family}';font-weight:${weight};font-size:${r.px}px;line-height:${lh};letter-spacing:${tracking};`;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

// ---- Content sections ----
const roleNames = spec.scale.map((r) => r.role);

function specimenRow(roleName) {
  const ar = styleFor(roleName, 'ar');
  const en = styleFor(roleName, 'en');
  const r = roleByName(roleName);
  return `<div class="specRow">
    <div class="specMeta">${esc(roleName)}<br><span>${r.px}px / ${r.weightAr}(ar) ${r.weightEn}(en) / LH ${r.lhAr}(ar) ${r.lhEn}(en)</span></div>
    <div class="specSample specAr" style="${ar}">${esc(arabicQA.wordmark)} — ${esc(arabicQA.tagline1)} ${esc(arabicQA.tagline2)}</div>
    <div class="specSample specEn" style="${en};direction:ltr;text-align:left" dir="ltr">SHAGHIL — Your project. Faster.</div>
  </div>`;
}

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
${fontFaceCss}
* { box-sizing: border-box; }
body { margin: 0; background: #fff; font-family: Arial, sans-serif; color: #111; }
.canvas { width: 1900px; padding-bottom: 80px; }
section { padding: 56px 90px; border-bottom: 1px solid #eee; background: #fff; }
h2 { font-size: 19px; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin: 0 0 26px; direction: ltr; text-align: left; font-weight: 700; font-family: Arial, sans-serif; }
.rule-text { font-size: 15px; line-height: 1.7; direction: ltr; text-align: left; color: #333; max-width: 1200px; font-family: Arial, sans-serif; }
.badge { display: inline-block; background: #111; color: #fff; font-size: 13px; padding: 4px 12px; border-radius: 20px; direction: ltr; font-family: Arial, sans-serif; }
.title { font-size: 38px; font-weight: 800; direction: ltr; text-align: left; margin: 10px 0 6px; font-family: Arial, sans-serif; }

.specRow { display: flex; gap: 24px; align-items: baseline; padding: 14px 0; border-bottom: 1px solid #f0f0f0; direction: ltr; }
.specMeta { width: 260px; font-size: 11px; color: #999; font-family: Arial, sans-serif; line-height: 1.5; flex-shrink: 0; }
.specMeta span { color: #bbb; }
.specSample { flex: 1; color: #111; overflow-wrap: anywhere; }
.specAr { direction: rtl; text-align: right; }

.charDemo { font-size: 28px; line-height: 2; direction: rtl; text-align: right; }
.charDemoEn { font-size: 22px; line-height: 1.8; direction: ltr; text-align: left; }
.weightRow { display: flex; gap: 30px; flex-wrap: wrap; direction: ltr; }
.weightCell { text-align: center; }
.weightCell .lbl { font-size: 11px; color: #999; margin-top: 8px; font-family: Arial, sans-serif; }

.pairBox { background: #fafafa; border: 1px solid #eee; border-radius: 16px; padding: 30px; direction: rtl; text-align: right; }

.uiMock { border-radius: 20px; overflow: hidden; width: 900px; border: 1px solid #ddd; }
.uiTop { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; }
.uiBrand { display: flex; align-items: center; gap: 10px; }
.uiLogoTile { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; }
.uiNav button { border: none; border-radius: 10px; padding: 8px 12px; margin-inline-start: 6px; cursor: default; }
.uiBody { padding: 24px; }
.uiGrid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
.uiCard { border-radius: 16px; padding: 16px; }
.uiCard span { display: block; margin-top: 6px; }

.btnRow { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
.mockBtn { border-radius: 12px; padding: 11px 18px; border: none; }

.inputDemo { width: 280px; }
.inputDemo label { display: block; margin-bottom: 6px; }
.inputDemo input { width: 100%; border-radius: 10px; padding: 10px; direction: rtl; }

.tableDemo { width: 100%; border-collapse: collapse; direction: rtl; }
.tableDemo th, .tableDemo td { padding: 10px 14px; text-align: right; border-bottom: 1px solid #eee; }

.dataGrid { display: flex; gap: 24px; flex-wrap: wrap; direction: rtl; }
.dataCell { background: #fafafa; border: 1px solid #eee; border-radius: 12px; padding: 16px 20px; text-align: center; }
.dataCell .lbl { font-size: 11px; color: #999; margin-bottom: 6px; font-family: Arial, sans-serif; direction: ltr; }

.mobileFrame { width: 375px; border: 8px solid #222; border-radius: 36px; overflow: hidden; }
.mobileFrame .screen { min-height: 500px; }

.readTest { display: flex; gap: 30px; direction: ltr; }
.readTest .col { flex: 1; }
</style></head>
<body>
<div class="canvas">

<section style="border-top: 10px solid ${D.signalPrimary};">
  <span class="badge">SHAGHIL TYPOGRAPHY EXPLORATION</span>
  <h1 class="title">${esc(spec.id)} — ${esc(spec.name)}</h1>
  <p class="rule-text">${esc(spec.rationale)}</p>
  <p class="rule-text" style="margin-top:10px"><b>Arabic:</b> ${esc(spec.arabicFamily.name)} · <b>Latin:</b> ${esc(spec.latinFamily.name)}</p>
</section>

<section>
  <h2>01 · Typography Concept / Rationale</h2>
  <p class="rule-text">${esc(spec.rationale)}</p>
  <p class="rule-text" style="margin-top:14px"><b>Line-height technique:</b> ${esc(spec.lineHeightTechnique)}</p>
</section>

<section>
  <h2>02 · Arabic Family — Character Demonstration &amp; Key Weights</h2>
  <div class="charDemo" style="${styleFor('Body Large', 'ar')}">ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي</div>
  <div class="charDemo" style="${styleFor('Body Large', 'ar')}">${esc(arabicQA.diacriticsCheck)}</div>
  <div class="weightRow" style="margin-top:20px">
    ${[400, 500, 600, 700].map((w) => `<div class="weightCell"><div style="font-family:'${famName(roleByName('H1'), 'ar')}';font-weight:${w};font-size:34px;direction:rtl">شغّل</div><div class="lbl">weight ${w}</div></div>`).join('')}
  </div>
</section>

<section>
  <h2>03 · Latin Family — Alphabet, Numerals &amp; Key Weights</h2>
  <div class="charDemoEn" style="${styleFor('Body Large', 'en')}">ABCDEFGHIJKLM<br>abcdefghijklm<br>0123456789</div>
  <div class="weightRow" style="margin-top:20px">
    ${[400, 500, 600, 700].map((w) => `<div class="weightCell"><div style="font-family:'${famName(roleByName('H1'), 'en')}';font-weight:${w};font-size:34px;direction:ltr">SHAGHIL</div><div class="lbl">weight ${w}</div></div>`).join('')}
  </div>
</section>

<section>
  <h2>04 · Arabic + English Pairing</h2>
  <div class="pairBox">
    <div style="${styleFor('H1', 'ar')}">${esc(arabicQA.wordmark)} <span style="${styleFor('H1', 'en')}" dir="ltr">SHAGHIL</span></div>
    <div style="${styleFor('Body', 'ar')};margin-top:10px">${esc(arabicQA.mixedBidi)}</div>
  </div>
</section>

<section>
  <h2>05 · Display Hierarchy</h2>
  ${specimenRow('Display XL')}${specimenRow('Display L')}
</section>

<section>
  <h2>06 · Heading Hierarchy</h2>
  ${['H1', 'H2', 'H3', 'H4'].map(specimenRow).join('')}
</section>

<section>
  <h2>07 · Body Hierarchy</h2>
  ${['Body Large', 'Body', 'Body Small'].map(specimenRow).join('')}
</section>

<section>
  <h2>08 · UI Labels / Buttons</h2>
  ${['UI Large', 'UI', 'UI Small', 'Button', 'Label', 'Caption'].map(specimenRow).join('')}
</section>

<section>
  <h2>09 · Navigation</h2>
  <div class="uiMock" style="background:${L.bgPrimary};border-color:${L.border}">
    <div class="uiTop" style="background:${L.surfaceElevated};border-bottom:1px solid ${L.border}">
      <div class="uiBrand"><div class="uiLogoTile" style="background:${L.textPrimary}">${fitTo(recolorMaster('#ffffff'), 20)}</div><b style="${styleFor('UI Large', 'ar')};color:${L.textPrimary}">${esc(arabicQA.wordmark)}</b></div>
      <div class="uiNav">
        <button style="${styleFor('UI', 'ar')};background:${L.surface};color:${L.textPrimary}">الرئيسية</button>
        <button style="${styleFor('UI', 'ar')};background:${L.surface};color:${L.textPrimary}">Business Brain</button>
        <button style="${styleFor('UI', 'ar')};background:${L.surface};color:${L.textPrimary}">السجل</button>
      </div>
    </div>
  </div>
</section>

<section>
  <h2>10 · Form / Input States</h2>
  <div class="btnRow">
    <div class="inputDemo"><label style="${styleFor('Label', 'ar')};color:${L.textPrimary}">اسم المشروع</label><input style="${styleFor('Input', 'ar')};background:${L.surface};border:1px solid ${L.border};color:${L.textPrimary}" value="Brew 27"></div>
    <div class="inputDemo"><label style="${styleFor('Label', 'ar')};color:${L.error}">رسالة العميل</label><input style="${styleFor('Input', 'ar')};background:${L.surface};border:2px solid ${L.error};color:${L.textPrimary}"><span style="${styleFor('Helper text', 'ar')};color:${L.error}">هذا الحقل مطلوب</span></div>
  </div>
</section>

<section>
  <h2>11 · Business Brain Application</h2>
  <div class="uiMock" style="background:${L.surfaceElevated};border-color:${L.border}">
    <div class="uiBody">
      <div style="${styleFor('H2', 'ar')};color:${L.textPrimary}">Business Brain</div>
      <div class="uiGrid" style="margin-top:16px">
        ${arabicQA.fields.map((f, idx) => `<div class="uiCard" style="background:${L.surface};border:1px solid ${L.border}"><b style="${styleFor('UI', 'ar')};color:${L.textPrimary}">${esc(f)}</b><span style="${styleFor('Body Small', 'ar')};color:${L.textSecondary}">${idx === 0 ? 'Brew 27 — قهوة مختصة' : idx === 1 ? 'موظفون وطلاب 20–35' : 'سعودي طبيعي واثق'}</span></div>`).join('')}
      </div>
      <div class="btnRow" style="margin-top:16px"><button class="mockBtn" style="${styleFor('Button', 'ar')};background:${L.cta};color:${L.ctaText}">${esc(arabicQA.actions[0])}</button></div>
    </div>
  </div>
</section>

<section>
  <h2>12 · Brand Brain Application</h2>
  <div class="uiMock" style="background:${L.surfaceElevated};border-color:${L.border}">
    <div class="uiBody">
      <div style="${styleFor('H2', 'ar')};color:${L.textPrimary}">Brand Brain</div>
      <p style="${styleFor('Body', 'ar')};color:${L.textSecondary};margin-top:8px">${esc(arabicQA.intro)}</p>
    </div>
  </div>
</section>

<section style="background:${D.bgPrimary}">
  <h2 style="color:#999">13 · Visual Studio Application</h2>
  <div class="uiMock" style="background:${D.surfaceElevated};border-color:${D.border}">
    <div class="uiBody">
      <div style="${styleFor('H2', 'ar')};color:${D.textPrimary}">Visual Studio</div>
      <div class="btnRow" style="margin-top:14px">
        <button class="mockBtn" style="${styleFor('Button', 'ar')};background:${D.cta};color:${D.ctaText}">اصنع التصميم</button>
        <span style="${styleFor('Helper text', 'ar')};color:${D.textMuted}">تصميم تصوّري — راجع قبل النشر.</span>
      </div>
    </div>
  </div>
</section>

<section>
  <h2>14 · AI-Generated Long-Form Content</h2>
  <div style="${styleFor('AI long-form output', 'ar')};color:${L.textPrimary};max-width:1100px">${esc(arabicQA.longForm)}</div>
</section>

<section>
  <h2>15 · Data / Numbers / Percentages / SAR</h2>
  <div class="dataGrid">
    ${Object.entries(numericQA).map(([k, v]) => {
      const needsLtrIsolate = new Set(['year', 'percentA', 'percentB', 'thousands', 'priceEnPrefix', 'deltaUp', 'deltaDown']).has(k);
      const valueHtml = needsLtrIsolate ? `<bdi dir="ltr">${esc(v)}</bdi>` : esc(v);
      return `<div class="dataCell"><div class="lbl">${esc(k)}</div><div style="${styleFor('Data / Number', 'ar')};color:${L.textPrimary}">${valueHtml}</div></div>`;
    }).join('')}
  </div>
  <table class="tableDemo" style="margin-top:24px">
    <thead><tr><th style="${styleFor('Table', 'ar')};font-weight:600;color:${L.textSecondary}">التاريخ</th><th style="${styleFor('Table', 'ar')};font-weight:600;color:${L.textSecondary}">النسبة</th><th style="${styleFor('Table', 'ar')};font-weight:600;color:${L.textSecondary}">السعر</th></tr></thead>
    <tbody><tr><td style="${styleFor('Table', 'ar')};color:${L.textPrimary}">${esc(numericQA.fullDate)}</td><td style="${styleFor('Table', 'ar')};color:${L.success}"><bdi dir="ltr">${esc(numericQA.deltaUp)}</bdi></td><td style="${styleFor('Table', 'ar')};color:${L.textPrimary}">${esc(numericQA.priceArSuffix)}</td></tr></tbody>
  </table>
</section>

<section>
  <h2>16 · Mixed Arabic + English / Bidi Test</h2>
  <div style="${styleFor('Body', 'ar')};color:${L.textPrimary};max-width:1100px">${esc(arabicQA.mixedBidi)}</div>
  <div style="${styleFor('Body', 'ar')};color:${L.textPrimary};max-width:1100px;margin-top:10px">${esc(arabicQA.punctuationMix)}</div>
</section>

<section>
  <h2>17 · Light-Mode Application</h2>
  <div class="uiMock" style="background:${L.bgPrimary};border-color:${L.border}">
    <div class="uiBody">
      <div style="${styleFor('H1', 'ar')};color:${L.textPrimary}">${esc(arabicQA.tagline1)}<br>${esc(arabicQA.tagline2)}</div>
      <p style="${styleFor('Body', 'ar')};color:${L.textSecondary};margin-top:10px">${esc(arabicQA.intro)}</p>
    </div>
  </div>
</section>

<section style="background:${D.bgPrimary}">
  <h2 style="color:#999">18 · Dark-Mode Application</h2>
  <div class="uiMock" style="background:${D.bgPrimary};border-color:${D.border}">
    <div class="uiBody">
      <div style="${styleFor('H1', 'ar')};color:${D.textPrimary}">${esc(arabicQA.tagline1)}<br>${esc(arabicQA.tagline2)}</div>
      <p style="${styleFor('Body', 'ar')};color:${D.textSecondary};margin-top:10px">${esc(arabicQA.intro)}</p>
    </div>
  </div>
</section>

<section>
  <h2>19 · Mobile-Size Simulation</h2>
  <div class="mobileFrame">
    <div class="screen" style="background:${L.bgPrimary};padding:20px">
      <div style="${styleFor('UI Large', 'ar')};color:${L.textPrimary};display:flex;align-items:center;gap:8px"><span style="width:28px;height:28px;border-radius:8px;background:${L.textPrimary};display:inline-block"></span>${esc(arabicQA.wordmark)}</div>
      <div style="${styleFor('H2', 'ar')};color:${L.textPrimary};margin-top:16px">${esc(arabicQA.tagline1)} ${esc(arabicQA.tagline2)}</div>
      <div style="${styleFor('Body Small', 'ar')};color:${L.textSecondary};margin-top:8px">${esc(arabicQA.intro)}</div>
      <div class="uiCard" style="background:${L.surface};border:1px solid ${L.border};margin-top:16px"><b style="${styleFor('UI', 'ar')};color:${L.textPrimary}">${esc(arabicQA.engines[0])}</b><span style="${styleFor('Caption', 'ar')};color:${L.textSecondary}">خطة محتوى مرتبطة بهدف مشروعك.</span></div>
    </div>
  </div>
</section>

<section>
  <h2>20 · Small-Size Readability</h2>
  <div class="readTest">
    <div class="col"><div style="${styleFor('UI Small', 'ar')};color:${L.textPrimary}">${esc(arabicQA.statusSuccess)}</div></div>
    <div class="col"><div style="${styleFor('Caption', 'ar')};color:${L.textSecondary}">${esc(arabicQA.statusError)}</div></div>
    <div class="col"><div style="${styleFor('Helper text', 'ar')};color:${L.textMuted}">${esc(numericQA.range)}</div></div>
  </div>
</section>

<section>
  <h2>21 · Marketing / Social Application</h2>
  <div style="width:480px;aspect-ratio:1/1;background:${D.bgPrimary};border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:40px;text-align:center">
    ${fitTo(recolorMaster('#ffffff'), 180)}
    <div style="${styleFor('Display L', 'ar')};color:${D.textPrimary}">${esc(arabicQA.wordmark)}</div>
    <div style="${styleFor('Body', 'ar')};color:${D.signalPrimary}">${esc(arabicQA.tagline1)} ${esc(arabicQA.tagline2)}</div>
  </div>
</section>

<section style="border-bottom:none">
  <h2>22 · Accessibility / Readability Notes</h2>
  <p class="rule-text">Body role set at ${roleByName('Body').px}px minimum (never below 13px for any real reading content); UI role at ${roleByName('UI').px}px. Arabic line-height is ${roleByName('Body').lhAr} vs Latin's ${roleByName('Body').lhEn} at the same Body role — a deliberate, measured accommodation for shadda/hamza clearance, not a copy of the Latin ratio. Color contrast is governed entirely by the locked Graphite Pulse system (unchanged in this phase) — every text color shown on this board is a token already verified at WCAG AA in the color lock.</p>
</section>

</div>
</body></html>`;

const outDir = path.join(__dirname, specId);
fs.writeFileSync(path.join(outDir, `${specId}-board.html`), html);

const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
const page = await browser.newPage({ viewport: { width: 1900, height: 1200 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(200);
const full = await page.locator('.canvas').boundingBox();
const h = Math.ceil(full.height);
await page.setViewportSize({ width: 1900, height: h });
await page.waitForTimeout(100);
const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 1900, height: h } });
fs.writeFileSync(path.join(outDir, `SHAGHIL_TYPE_${specId}.png`), buf);
console.log(`${specId} board built, height ${h}`);
await browser.close();
