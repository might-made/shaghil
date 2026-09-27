// Builds the single final production typography board for the Founder-selected T2 system
// (IBM Plex Sans Arabic + IBM Plex Sans), using the real downloaded OFL webfont files from
// the exploration phase, the LOCKED Graphite Pulse color tokens, and the LOCKED logo SVG
// (geometry untouched, fill only).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import { content, numericQA, kpiCards } from './qa-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(__dirname, '../exploration/fonts');
const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, 'shaghil-typography-tokens.json'), 'utf8'));

const colorTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../color/final/shaghil-color-tokens.json'), 'utf8'));
function flattenColor(mode) {
  const g = colorTokens[mode].graphite, s = colorTokens[mode].signal, i = colorTokens[mode].interactive, sem = colorTokens[mode].semantic;
  return { ...g, signalPrimary: s.primary, cta: i.cta, ctaText: i.ctaText, focus: i.focus, disabledBg: i.disabledBg, disabledText: i.disabledText, success: sem.success, warning: sem.warning, error: sem.error, info: sem.info };
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

let fontFaceCss = '';
for (const f of ['plexarabic.css', 'plexsans.css']) {
  let css = fs.readFileSync(path.join(fontsDir, f), 'utf8');
  css = css.replace(/url\('([^']+\.woff2)'\)/g, (m, fname) => `url('file://${path.join(fontsDir, fname)}')`);
  fontFaceCss += css + '\n';
}

const roleByName = (name) => tokens.scale.find((r) => r.role === name);
function styleFor(roleName, lang) {
  const r = roleByName(roleName);
  const family = lang === 'ar' ? tokens.foundation.arabicFamily.name : tokens.foundation.latinFamily.name;
  if (r.role === 'Numeric / KPI') {
    return `font-family:'${tokens.foundation.latinFamily.name}';font-weight:${r.weight};font-size:${r.px}px;line-height:${r.lh};font-variant-numeric:tabular-nums;`;
  }
  const lh = lang === 'ar' ? r.lhAr : r.lhEn;
  const tracking = (lang === 'ar' ? r.trackingAr : r.trackingEn) || '0';
  return `font-family:'${family}';font-weight:${r.weight};font-size:${r.px}px;line-height:${lh};letter-spacing:${tracking};`;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function bdi(v) { return `<bdi dir="ltr">${esc(v)}</bdi>`; }

function specimenRow(roleName) {
  const ar = styleFor(roleName, 'ar');
  const en = styleFor(roleName, 'en');
  const r = roleByName(roleName);
  return `<div class="specRow">
    <div class="specMeta">${esc(roleName)}<br><span>${r.px}px / w${r.weight} / LH ${r.lhAr}(ar) ${r.lhEn}(en)</span><br><span>${esc(r.use || '')}</span></div>
    <div class="specSample specAr" style="${ar}">${esc(content.wordmark)} — ${esc(content.tagline1)} ${esc(content.tagline2)}</div>
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
.status-badge { display: inline-block; background: #c77700; color: #fff; font-size: 13px; padding: 4px 12px; border-radius: 20px; direction: ltr; margin-inline-start: 10px; font-family: Arial, sans-serif; }
.title { font-size: 38px; font-weight: 800; direction: ltr; text-align: left; margin: 10px 0 6px; font-family: Arial, sans-serif; }

.specRow { display: flex; gap: 24px; align-items: baseline; padding: 14px 0; border-bottom: 1px solid #f0f0f0; direction: ltr; }
.specMeta { width: 280px; font-size: 11px; color: #999; font-family: Arial, sans-serif; line-height: 1.5; flex-shrink: 0; }
.specMeta span { color: #bbb; }
.specSample { flex: 1; color: #111; overflow-wrap: anywhere; }
.specAr { direction: rtl; text-align: right; }

.charDemo { font-size: 26px; line-height: 2; direction: rtl; text-align: right; }
.charDemoEn { font-size: 20px; line-height: 1.8; direction: ltr; text-align: left; }
.weightRow { display: flex; gap: 30px; flex-wrap: wrap; direction: ltr; }
.weightCell { text-align: center; }
.weightCell .lbl { font-size: 11px; color: #999; margin-top: 8px; font-family: Arial, sans-serif; }

.opticalGrid { display: flex; flex-direction: column; gap: 16px; direction: ltr; }
.opticalRow { display: flex; gap: 40px; align-items: baseline; border-bottom: 1px solid #f0f0f0; padding-bottom: 14px; }
.opticalRow .lbl { width: 260px; font-size: 12px; color: #999; font-family: Arial, sans-serif; }

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

.kpiRow { display: flex; gap: 20px; flex-wrap: wrap; direction: rtl; }
.kpiCard { background: #fafafa; border: 1px solid #eee; border-radius: 14px; padding: 18px 22px; min-width: 200px; }

.historyItem { background: #fafafa; border: 1px solid #eee; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; direction: rtl; }

.emptyState { background: #fafafa; border: 1px dashed #ddd; border-radius: 14px; padding: 30px; text-align: center; direction: rtl; }

.mobileFrame { width: 375px; border: 8px solid #222; border-radius: 36px; overflow: hidden; }
.mobileFrame .screen { min-height: 560px; }

.readTest { display: flex; gap: 30px; direction: ltr; }
.readTest .col { flex: 1; }

.dodont { display: flex; gap: 30px; direction: ltr; }
.dodont .col { flex: 1; border-radius: 16px; padding: 24px; }
.dodont .col.do { background: #eafaf0; border: 1px solid #bfe8cd; }
.dodont .col.dont { background: #fdeceb; border: 1px solid #f3c6c2; }
.dodont h3 { margin: 0 0 14px; font-size: 16px; direction: ltr; font-family: Arial, sans-serif; }
.dodont .example { border-radius: 12px; padding: 18px; margin-bottom: 12px; }
.dodont p { font-size: 13px; margin: 0; direction: ltr; color: #444; font-family: Arial, sans-serif; }
</style></head>
<body>
<div class="canvas">

<section style="border-top: 10px solid ${D.signalPrimary};">
  <span class="badge">SHAGHIL TYPOGRAPHY SYSTEM</span><span class="status-badge">FOUNDER SELECTED — FINAL PRODUCTION PREP</span>
  <h1 class="title">IBM Plex Sans Arabic + IBM Plex Sans</h1>
  <p class="rule-text">Founder-selected T2 — Technical / AI-Native, refined into a final production-ready system. Sharper and more systematic than a warmer alternative, built for interface and data use, without reading as a raw developer tool.</p>
</section>

<section>
  <h2>01 · Selected Typography Foundation</h2>
  <p class="rule-text"><b>Arabic:</b> IBM Plex Sans Arabic (OFL, static weights 100–700) &nbsp; <b>Latin:</b> IBM Plex Sans (OFL, variable wght 100–700). Both verified directly against their METADATA.pb in the google/fonts repository. Real downloaded webfont files are used throughout this board — not simulated.</p>
  <p class="rule-text" style="margin-top:10px">${esc(tokens.weightPolicy)}</p>
</section>

<section>
  <h2>02 · Arabic Family — IBM Plex Sans Arabic — Weights</h2>
  <div class="charDemo" style="font-family:'IBM Plex Sans Arabic';font-weight:400">ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي</div>
  <div class="charDemo" style="font-family:'IBM Plex Sans Arabic';font-weight:400">شدّة، همزة، تاء مربوطة، ياء وألف مقصورة: هذا، ذلك، مرحبًا، قرأ، بيّن، منشأة، مؤسسة، مقهى.</div>
  <div class="weightRow" style="margin-top:20px">
    ${[400, 500, 600, 700].map((w) => `<div class="weightCell"><div style="font-family:'IBM Plex Sans Arabic';font-weight:${w};font-size:30px;direction:rtl">شغّل</div><div class="lbl">weight ${w}</div></div>`).join('')}
  </div>
</section>

<section>
  <h2>03 · Latin Family — IBM Plex Sans — Alphabet, Numerals &amp; Weights</h2>
  <div class="charDemoEn" style="font-family:'IBM Plex Sans';font-weight:400">ABCDEFGHIJKLM<br>abcdefghijklm<br>0123456789</div>
  <div class="weightRow" style="margin-top:20px">
    ${[400, 500, 600, 700].map((w) => `<div class="weightCell"><div style="font-family:'IBM Plex Sans';font-weight:${w};font-size:30px;direction:ltr">SHAGHIL</div><div class="lbl">weight ${w}</div></div>`).join('')}
  </div>
</section>

<section>
  <h2>04 · Production Type Scale</h2>
  <div class="specRow" style="font-weight:700"><div class="specMeta">Role</div><div class="specSample specAr">Arabic sample</div><div class="specSample specEn">Latin sample</div></div>
  ${tokens.scale.filter((r) => r.role !== 'Numeric / KPI').map((r) => specimenRow(r.role)).join('')}
</section>

<section>
  <h2>05 · Arabic / Latin Optical Relationship</h2>
  <p class="rule-text">${esc(tokens.opticalRule.note)}</p>
  <div class="opticalGrid" style="margin-top:20px">
    <div class="opticalRow"><div class="lbl">16px, weight 400 — identical size, no compensation</div><div style="font-family:'IBM Plex Sans Arabic';direction:rtl;font-size:16px">مشروعك. لكن أسرع.</div><div style="font-family:'IBM Plex Sans';direction:ltr;font-size:16px">Your project. Faster.</div></div>
    <div class="opticalRow"><div class="lbl">30px, weight 600 (H1) — identical size, no compensation</div><div style="font-family:'IBM Plex Sans Arabic';direction:rtl;font-size:30px;font-weight:600">شغّل مشروعك</div><div style="font-family:'IBM Plex Sans';direction:ltr;font-size:30px;font-weight:600">SHAGHIL</div></div>
  </div>
</section>

<section>
  <h2>06 · Display Hierarchy</h2>
  ${specimenRow('Display')}
</section>

<section>
  <h2>07 · Body Hierarchy</h2>
  ${['H1', 'H2', 'H3', 'H4', 'Body Large', 'Body', 'Body Small'].map(specimenRow).join('')}
</section>

<section>
  <h2>08 · UI Labels / Buttons</h2>
  ${['Label', 'Button', 'Caption', 'Metadata'].map(specimenRow).join('')}
</section>

<section>
  <h2>09 · Navigation</h2>
  <div class="uiMock" style="background:${L.bgPrimary};border-color:${L.border}">
    <div class="uiTop" style="background:${L.surfaceElevated};border-bottom:1px solid ${L.border}">
      <div class="uiBrand"><div class="uiLogoTile" style="background:${L.textPrimary}">${fitTo(recolorMaster('#ffffff'), 20)}</div><b style="${styleFor('H4', 'ar')};color:${L.textPrimary}">${esc(content.wordmark)}</b></div>
      <div class="uiNav">
        <button style="${styleFor('Button', 'ar')};background:${L.surface};color:${L.textPrimary}">الرئيسية</button>
        <button style="${styleFor('Button', 'ar')};background:${L.surfaceSubtle};color:${L.signalPrimary};box-shadow:inset 0 0 0 1px ${L.signalPrimary}">${esc(content.productTerms[0])}</button>
        <button style="${styleFor('Button', 'ar')};background:${L.surface};color:${L.textPrimary}">${esc(content.productTerms[3])}</button>
      </div>
    </div>
  </div>
</section>

<section>
  <h2>10 · Forms / Inputs</h2>
  <div class="btnRow">
    <div class="inputDemo"><label style="${styleFor('Label', 'ar')};color:${L.textPrimary}">اسم المشروع</label><input style="${styleFor('Input', 'ar')};background:${L.surface};border:1px solid ${L.border};color:${L.textPrimary}" value="Brew 27"></div>
    <div class="inputDemo"><label style="${styleFor('Label', 'ar')};color:${L.textPrimary}">توجيه للمهمة (اختياري)</label><input style="${styleFor('Input', 'ar')};background:${L.surface};border:1px solid ${L.border};color:${L.textPrimary}" placeholder="اتركه فارغًا..."><span style="${styleFor('Caption', 'ar')};color:${L.textMuted}">${esc(content.helperText)}</span></div>
    <div class="inputDemo"><label style="${styleFor('Label', 'ar')};color:${L.error}">رسالة العميل</label><input style="${styleFor('Input', 'ar')};background:${L.surface};border:2px solid ${L.error};color:${L.textPrimary}"><span style="${styleFor('Caption', 'ar')};color:${L.error}">هذا الحقل مطلوب</span></div>
  </div>
</section>

<section>
  <h2>11 · Business Brain</h2>
  <div class="uiMock" style="background:${L.surfaceElevated};border-color:${L.border}">
    <div class="uiBody">
      <div style="${styleFor('H1', 'ar')};color:${L.textPrimary}">${esc(content.productTerms[0])}</div>
      <div class="uiGrid" style="margin-top:16px">
        ${content.fields.map((f, idx) => `<div class="uiCard" style="background:${L.surface};border:1px solid ${L.border}"><b style="${styleFor('H4', 'ar')};color:${L.textPrimary}">${esc(f)}</b><span style="${styleFor('Body Small', 'ar')};color:${L.textSecondary}">${idx === 0 ? 'Brew 27 — قهوة مختصة' : idx === 1 ? 'موظفون وطلاب 20–35' : 'سعودي طبيعي واثق'}</span></div>`).join('')}
      </div>
      <div class="btnRow" style="margin-top:16px"><button class="mockBtn" style="${styleFor('Button', 'ar')};background:${L.cta};color:${L.ctaText}">${esc(content.actions[0])}</button></div>
    </div>
  </div>
</section>

<section>
  <h2>12 · Brand Brain</h2>
  <div class="uiMock" style="background:${L.surfaceElevated};border-color:${L.border}">
    <div class="uiBody">
      <div style="${styleFor('H1', 'ar')};color:${L.textPrimary}">${esc(content.productTerms[1])}</div>
      <p style="${styleFor('Body', 'ar')};color:${L.textSecondary};margin-top:8px">${esc(content.productNameThenArabicDesc)}</p>
    </div>
  </div>
</section>

<section style="background:${D.bgPrimary}">
  <h2 style="color:#999">13 · Visual Studio</h2>
  <div class="uiMock" style="background:${D.surfaceElevated};border-color:${D.border}">
    <div class="uiBody">
      <div style="${styleFor('H1', 'ar')};color:${D.textPrimary}">${esc(content.productTerms[2])}</div>
      <p style="${styleFor('Body', 'ar')};color:${D.textSecondary};margin-top:8px">${esc(content.englishTermInArabic)}</p>
      <div class="btnRow" style="margin-top:14px">
        <button class="mockBtn" style="${styleFor('Button', 'ar')};background:${D.cta};color:${D.ctaText}">اصنع التصميم</button>
      </div>
    </div>
  </div>
</section>

<section>
  <h2>14 · AI-Generated Long-Form Content</h2>
  <div style="max-width:1100px">
    <div style="${styleFor('H2', 'ar')};color:${L.textPrimary}">${esc(content.longFormHeading)}</div>
    ${content.longFormParagraphs.map((p) => `<p style="${styleFor('Body', 'ar')};color:${L.textPrimary};margin:14px 0">${esc(p)}</p>`).join('')}
    <ul style="${styleFor('Body', 'ar')};color:${L.textPrimary};margin:14px 0;padding-inline-start:24px">
      ${content.longFormBullets.map((b) => `<li style="margin:6px 0">${esc(b)}</li>`).join('')}
    </ul>
    <p style="${styleFor('Body', 'ar')};color:${L.textPrimary};margin:14px 0">${content.longFormEmphasis.replace(/\*\*(.+?)\*\*/, `<span style="font-weight:${tokens.emphasisException.weight}">$1</span>`)}</p>
  </div>
</section>

<section>
  <h2>15 · Numbers / Percentages / SAR</h2>
  <div class="kpiRow">
    ${kpiCards.map((k) => `<div class="kpiCard"><div style="${styleFor('Label', 'ar')};color:${L.textSecondary}">${esc(k.label)}</div><div style="${styleFor('Numeric / KPI', 'ar')};color:${L.textPrimary};margin-top:6px">${bdi(k.value)}</div><div style="${styleFor('Caption', 'ar')};color:${k.positive ? L.success : L.error};margin-top:4px">${bdi(k.delta)}</div></div>`).join('')}
  </div>
  <div class="kpiRow" style="margin-top:20px">
    ${Object.entries(numericQA).map(([key, v]) => `<div class="kpiCard"><div style="${styleFor('Metadata', 'ar')};color:${L.textMuted}">${esc(key)}</div><div style="${styleFor('Numeric / KPI', 'ar')};color:${L.textPrimary};margin-top:4px">${bdi(v)}</div></div>`).join('')}
  </div>
  <p style="${styleFor('Body', 'ar')};color:${L.textPrimary};margin-top:20px;max-width:1100px">السعر ${bdi(numericQA.price1)} شامل الضريبة، بزيادة ${bdi(numericQA.deltaUp)} عن الشهر الماضي.</p>
</section>

<section>
  <h2>16 · Mixed Arabic + English / Bidi</h2>
  <p style="${styleFor('Body', 'ar')};color:${L.textPrimary};max-width:1100px">${esc(content.englishTermInArabic)}</p>
  <p style="${styleFor('Body', 'ar')};color:${L.textPrimary};max-width:1100px;margin-top:10px">${esc(content.productNameThenArabicDesc)}</p>
</section>

<section>
  <h2>17 · Light-Mode Application</h2>
  <div class="uiMock" style="background:${L.bgPrimary};border-color:${L.border}">
    <div class="uiBody">
      <div style="${styleFor('Display', 'ar')};color:${L.textPrimary}">${esc(content.tagline1)}<br>${esc(content.tagline2)}</div>
      <p style="${styleFor('Body', 'ar')};color:${L.textSecondary};margin-top:10px">${esc(content.intro)}</p>
      <h3 style="${styleFor('H3', 'ar')};color:${L.textPrimary};margin-top:20px">${esc(content.productTerms[3])}</h3>
      ${content.historyItems.map((h) => `<div class="historyItem"><b style="${styleFor('H4', 'ar')};color:${L.textPrimary}">${esc(h.title)}</b> · <span style="${styleFor('Caption', 'ar')};color:${L.textSecondary}">${esc(h.project)}</span><div style="${styleFor('Metadata', 'ar')};color:${L.textMuted};margin-top:2px">${esc(h.date)}</div><p style="${styleFor('Body Small', 'ar')};color:${L.textSecondary};margin-top:6px">${esc(h.excerpt)}</p></div>`).join('')}
    </div>
  </div>
</section>

<section style="background:${D.bgPrimary}">
  <h2 style="color:#999">18 · Dark-Mode Application</h2>
  <div class="uiMock" style="background:${D.bgPrimary};border-color:${D.border}">
    <div class="uiBody">
      <div style="${styleFor('Display', 'ar')};color:${D.textPrimary}">${esc(content.tagline1)}<br>${esc(content.tagline2)}</div>
      <p style="${styleFor('Body', 'ar')};color:${D.textSecondary};margin-top:10px">${esc(content.intro)}</p>
      <div class="emptyState" style="background:${D.surface};border-color:${D.border};margin-top:20px"><p style="${styleFor('Body Small', 'ar')};color:${D.textMuted}">${esc(content.emptyState)}</p></div>
    </div>
  </div>
</section>

<section>
  <h2>19 · Mobile Simulation</h2>
  <div class="mobileFrame">
    <div class="screen" style="background:${L.bgPrimary};padding:20px">
      <div style="${styleFor('H4', 'ar')};color:${L.textPrimary};display:flex;align-items:center;gap:8px"><span style="width:28px;height:28px;border-radius:8px;background:${L.textPrimary};display:inline-block"></span>${esc(content.wordmark)}</div>
      <div style="${styleFor('H1', 'ar')};color:${L.textPrimary};margin-top:16px;font-size:26px">${esc(content.tagline1)} ${esc(content.tagline2)}</div>
      <div style="${styleFor('Body Small', 'ar')};color:${L.textSecondary};margin-top:8px">${esc(content.intro)}</div>
      <div class="uiCard" style="background:${L.surface};border:1px solid ${L.border};margin-top:16px"><b style="${styleFor('H4', 'ar')};color:${L.textPrimary}">${esc(content.engines[0])}</b><span style="${styleFor('Caption', 'ar')};color:${L.textSecondary}">خطة محتوى مرتبطة بهدف مشروعك.</span></div>
      <div class="kpiCard" style="margin-top:14px"><div style="${styleFor('Label', 'ar')};color:${L.textSecondary}">${esc(kpiCards[0].label)}</div><div style="${styleFor('Numeric / KPI', 'ar')};color:${L.textPrimary}">${bdi(kpiCards[0].value)}</div></div>
      <div class="btnRow" style="margin-top:14px"><button class="mockBtn" style="${styleFor('Button', 'ar')};background:${L.cta};color:${L.ctaText}">${esc(content.actions[0])}</button></div>
    </div>
  </div>
</section>

<section>
  <h2>20 · Small-Size / Readability QA</h2>
  <div class="readTest">
    <div class="col"><div style="${styleFor('Caption', 'ar')};color:${L.textPrimary}">${esc(content.statusSuccess)}</div></div>
    <div class="col"><div style="${styleFor('Metadata', 'ar')};color:${L.textMuted}">${esc(content.statusError)}</div></div>
    <div class="col"><div style="${styleFor('Metadata', 'ar')};color:${L.textMuted}">${bdi(numericQA.range)} يوم عمل</div></div>
  </div>
</section>

<section>
  <h2>21 · Typography Usage Rules</h2>
  <p class="rule-text"><b>Weight policy:</b> ${esc(tokens.weightPolicy)}</p>
  <p class="rule-text" style="margin-top:10px"><b>Optical rule:</b> ${esc(tokens.opticalRule.note)}</p>
  <p class="rule-text" style="margin-top:10px"><b>Numerals:</b> Western digits everywhere; any signed value (+, −, %, currency) is bidi-isolated with &lt;bdi dir="ltr"&gt; when embedded in Arabic flow.</p>
</section>

<section style="border-bottom:none">
  <h2>22 · Do / Don't</h2>
  <div class="dodont">
    <div class="col do">
      <h3 style="color:#1a8a4a">DO</h3>
      <div class="example" style="background:${L.bgPrimary};border:1px solid ${L.border}"><div style="${styleFor('H2', 'ar')};color:${L.textPrimary}">${esc(content.productTerms[0])}</div></div>
      <p>Use weight 600 for every heading level, distinguished by size alone — a calm, predictable hierarchy.</p>
    </div>
    <div class="col dont">
      <h3 style="color:#c4291b">DON'T</h3>
      <div class="example" style="background:${L.bgPrimary};border:1px solid ${L.border}"><div style="font-family:'IBM Plex Sans Arabic';font-weight:700;font-size:24px;color:${L.textPrimary}">${esc(content.productTerms[0])}</div></div>
      <p>Don't reach for weight 700 as a heading weight — it's reserved solely for inline emphasis inside generated content.</p>
    </div>
  </div>
  <div class="dodont" style="margin-top:24px">
    <div class="col do">
      <h3 style="color:#1a8a4a">DO</h3>
      <div class="example" style="background:${L.bgPrimary};border:1px solid ${L.border};direction:rtl"><span style="${styleFor('Body', 'ar')};color:${L.textPrimary}">السعر ${bdi('12,500 SAR')} شامل الضريبة.</span></div>
      <p>Isolate signed/currency numerals with &lt;bdi dir="ltr"&gt; inside Arabic flow — correct reading order every time.</p>
    </div>
    <div class="col dont">
      <h3 style="color:#c4291b">DON'T</h3>
      <div class="example" style="background:${L.bgPrimary};border:1px solid ${L.border};direction:rtl"><span style="${styleFor('Body', 'ar')};color:${L.textPrimary}">التغيير: ${esc('+24%')}</span></div>
      <p>Don't drop a signed number directly into RTL text — the sign can visually flip sides (a real bug found and fixed in exploration).</p>
    </div>
  </div>
</section>

</div>
</body></html>`;

fs.writeFileSync(path.join(__dirname, 'SHAGHIL_TYPOGRAPHY_SYSTEM_FINAL.html'), html);

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
fs.writeFileSync(path.join(__dirname, 'SHAGHIL_TYPOGRAPHY_SYSTEM_FINAL.png'), buf);
console.log('final typography board built, height', h);
await browser.close();
