import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import { icons } from './icons.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiTokens = JSON.parse(fs.readFileSync(path.join(__dirname, 'shaghil-ui-tokens.json'), 'utf8'));
const colorTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../color/final/shaghil-color-tokens.json'), 'utf8'));
const typeTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../typography/final/shaghil-typography-tokens.json'), 'utf8'));

function flattenColor(mode) {
  const g = colorTokens[mode].graphite, s = colorTokens[mode].signal, i = colorTokens[mode].interactive, sem = colorTokens[mode].semantic;
  return { ...g, signalPrimary: s.primary, signalSubtleBg: s.subtleBg, cta: i.cta, ctaText: i.ctaText, ctaHover: i.ctaHover, focus: i.focus, disabledBg: i.disabledBg, disabledText: i.disabledText, success: sem.success, warning: sem.warning, error: sem.error, info: sem.info };
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

const fontsDir = path.join(__dirname, '../../typography/exploration/fonts');
let fontFaceCss = '';
for (const f of ['plexarabic.css', 'plexsans.css']) {
  let css = fs.readFileSync(path.join(fontsDir, f), 'utf8');
  css = css.replace(/url\('([^']+\.woff2)'\)/g, (m, fname) => `url('file://${path.join(fontsDir, fname)}')`);
  fontFaceCss += css + '\n';
}

const roleByName = (name) => typeTokens.scale.find((r) => r.role === name);
function tf(roleName, lang, colorVal) {
  const r = roleByName(roleName);
  const family = lang === 'ar' ? typeTokens.foundation.arabicFamily.name : typeTokens.foundation.latinFamily.name;
  const lh = r.lh ?? (lang === 'ar' ? r.lhAr : r.lhEn);
  return `font-family:'${family}';font-weight:${r.weight};font-size:${r.px}px;line-height:${lh};${colorVal ? `color:${colorVal};` : ''}`;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function bdi(v) { return `<bdi dir="ltr">${esc(v)}</bdi>`; }

const SP = uiTokens.spacing.semantic;
const RAD = uiTokens.radius.scale;

// ---------- shared building blocks ----------
function btn(label, variant, size, mode, state = '') {
  const t = mode === 'dark' ? D : L;
  const h = size === 'sm' ? '32px' : '40px';
  const fpx = size === 'sm' ? 12.5 : 14;
  let bg, color, border = 'none', opacity = '1', cursor = 'default';
  if (variant === 'primary') { bg = t.cta; color = t.ctaText; }
  if (variant === 'secondary') { bg = t.surface; color = t.textPrimary; border = `1px solid ${t.border}`; }
  if (variant === 'ghost') { bg = 'transparent'; color = t.textPrimary; }
  if (variant === 'destructive') { bg = t.error; color = '#fff'; }
  if (state === 'hover' && variant === 'primary') bg = t.ctaHover;
  if (state === 'disabled') { opacity = '0.45'; cursor = 'not-allowed'; }
  const ring = state === 'focus' ? `box-shadow:0 0 0 2px ${t.bgPrimary}, 0 0 0 4px ${t.signalPrimary};` : '';
  return `<button style="height:${h};padding:0 ${SP['space-md']};border-radius:${RAD['radius-md']};${tf('Button', 'ar')}color:${color};background:${bg};border:${border};opacity:${opacity};cursor:${cursor};${ring}font-size:${fpx}px">${esc(label)}</button>`;
}
function badge(label, kind, mode) {
  const t = mode === 'dark' ? D : L;
  const map = { neutral: [t.surfaceSubtle, t.textSecondary], success: [t.success + '22', t.success], warning: [t.warning + '22', t.warning], error: [t.error + '22', t.error], info: [t.info + '22', t.info], signal: [t.signalSubtleBg, t.signalPrimary] };
  const [bg, color] = map[kind];
  return `<span style="display:inline-flex;align-items:center;padding:3px ${SP['space-sm']};border-radius:${RAD['radius-full']};background:${bg};color:${color};${tf('Caption', 'ar')}">${esc(label)}</span>`;
}
function inputField(label, mode, state, value = '', helper = '') {
  const t = mode === 'dark' ? D : L;
  let border = `1px solid ${t.border}`;
  if (state === 'focus') border = `2px solid ${t.signalPrimary}`;
  if (state === 'error') border = `2px solid ${t.error}`;
  return `<div style="width:240px"><label style="${tf('Label', 'ar')}color:${t.textPrimary};display:block;margin-bottom:${SP['space-xs']}">${esc(label)}</label><input style="width:100%;height:40px;border-radius:${RAD['radius-sm']};padding:0 ${SP['space-sm']};background:${t.surface};border:${border};${tf('Input', 'ar')}color:${t.textPrimary}" value="${esc(value)}"><div style="${tf('Caption', 'ar')}color:${state === 'error' ? t.error : t.textMuted};margin-top:${SP['space-xs']}">${esc(helper)}</div></div>`;
}
function iconWrap(svg, size, color) {
  return `<span style="display:inline-flex;width:${size}px;height:${size}px;color:${color}">${svg}</span>`;
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
h4 { font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; color: #999; margin: 0 0 10px; direction: ltr; text-align: left; font-family: Arial, sans-serif; }
.rule-text { font-size: 15px; line-height: 1.7; direction: ltr; text-align: left; color: #333; max-width: 1200px; font-family: Arial, sans-serif; }
.badge-top { display: inline-block; background: #111; color: #fff; font-size: 13px; padding: 4px 12px; border-radius: 20px; direction: ltr; font-family: Arial, sans-serif; }
.status-badge { display: inline-block; background: #1d6fb8; color: #fff; font-size: 13px; padding: 4px 12px; border-radius: 20px; direction: ltr; margin-inline-start: 10px; font-family: Arial, sans-serif; }
.title { font-size: 36px; font-weight: 800; direction: ltr; text-align: left; margin: 10px 0 6px; font-family: Arial, sans-serif; }
.row { display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start; direction: ltr; }
.row.rtl { direction: rtl; }
.swatch { border-radius: 12px; padding: 14px; direction: ltr; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.uiMock { border-radius: 16px; overflow: hidden; width: 900px; border: 1px solid #ddd; }
.uiTop { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; }
.uiBrand { display: flex; align-items: center; gap: 10px; }
.uiLogoTile { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; }
.uiNav button { border: none; border-radius: 8px; padding: 8px 12px; margin-inline-start: 6px; cursor: default; }
.uiBody { padding: 24px; }
.cardBase { border-radius: 12px; padding: 16px; }
.mobileFrame { width: 375px; border: 8px solid #222; border-radius: 32px; overflow: hidden; }
.mobileFrame .screen { min-height: 600px; }
.dodont { display: flex; gap: 30px; direction: ltr; }
.dodont .col { flex: 1; border-radius: 16px; padding: 24px; }
.dodont .col.do { background: #eafaf0; border: 1px solid #bfe8cd; }
.dodont .col.dont { background: #fdeceb; border: 1px solid #f3c6c2; }
.dodont h3 { margin: 0 0 14px; font-size: 16px; direction: ltr; font-family: Arial, sans-serif; }
.dodont .example { border-radius: 12px; padding: 18px; margin-bottom: 12px; }
.dodont p { font-size: 13px; margin: 0; direction: ltr; color: #444; font-family: Arial, sans-serif; }
.frameLabel { font-size: 11px; color: #999; text-align: center; margin-top: 8px; font-family: Arial, sans-serif; direction: ltr; }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style></head>
<body>
<div class="canvas">

<section style="border-top: 10px solid ${D.signalPrimary};">
  <span class="badge-top">SHAGHIL PRODUCT DESIGN SYSTEM</span><span class="status-badge">FOUNDER REVIEW — NOT LOCKED</span>
  <h1 class="title">Design System Foundation</h1>
  <p class="rule-text">Phase 1 exploration and foundation — translating the three locked brand systems (logo, Graphite Pulse color, IBM Plex Sans typography) into a coherent, operational UI language. This is a design-system simulation only; the live product is untouched.</p>
</section>

<section>
  <h2>01 · Design Principles</h2>
  <p class="rule-text">AI-native, premium, calm, intelligent, focused. Arabic-first and bilingual-ready. A modern Saudi product that is operational rather than decorative — sophisticated without becoming editorial or luxury, distinctive without visual gimmicks. Explicitly avoided: generic SaaS-dashboard aesthetics, purple AI gradients, glow, glassmorphism, oversized radii everywhere, excessive shadow, cards-inside-cards, unnecessary borders, and decorative AI-sparkle clichés.</p>
</section>

<section>
  <h2>02 · Locked Brand Foundation</h2>
  <div class="row">
    <div style="text-align:center"><div style="width:200px;height:140px;background:#fff;border:1px solid #eee;border-radius:12px;display:flex;align-items:center;justify-content:center">${fitTo(recolorMaster('#000000'), 100)}</div><div class="frameLabel">Locked Logo</div></div>
    <div style="text-align:center"><div style="width:200px;height:140px;background:${D.bgPrimary};border-radius:12px;display:flex;align-items:center;justify-content:center;gap:8px"><div style="width:36px;height:36px;border-radius:8px;background:${D.signalPrimary}"></div><div style="width:36px;height:36px;border-radius:8px;background:${D.textPrimary}"></div><div style="width:36px;height:36px;border-radius:8px;background:${D.surface};border:1px solid ${D.border}"></div></div><div class="frameLabel">Locked Graphite Pulse</div></div>
    <div style="text-align:center"><div style="width:200px;height:140px;background:#fff;border:1px solid #eee;border-radius:12px;display:flex;align-items:center;justify-content:center"><span style="${tf('H2', 'ar')}color:#111">شغّل</span></div><div class="frameLabel">Locked IBM Plex Sans Arabic</div></div>
  </div>
</section>

<section>
  <h2>03 · Spacing Scale</h2>
  <p class="rule-text">${esc(uiTokens.spacing.rationale)}</p>
  <div class="row" style="margin-top:20px;align-items:flex-end">
    ${Object.entries(uiTokens.spacing.semantic).map(([k, v]) => `<div style="text-align:center"><div style="width:${v};height:${v};background:${D.signalPrimary};border-radius:4px;margin:0 auto"></div><div class="frameLabel">${k}<br>${v}</div></div>`).join('')}
  </div>
</section>

<section>
  <h2>04 · Grid / Layout</h2>
  <p class="rule-text"><b>Content max-width:</b> ${uiTokens.layout.contentMaxWidth} · <b>Reading measure:</b> ${uiTokens.layout.readingMeasure} · <b>Shell:</b> ${esc(uiTokens.layout.shell)}</p>
  <div style="margin-top:20px;width:1080px;max-width:100%;background:${L.surface};border:1px dashed ${L.border};border-radius:12px;padding:20px;direction:ltr">
    <div class="frameLabel" style="text-align:left">1080px content shell</div>
    <div style="margin-top:10px;width:680px;background:${L.surfaceSubtle};border-radius:8px;padding:12px;color:${L.textMuted};font-size:12px;font-family:Arial">680px reading measure (AI long-form content)</div>
  </div>
</section>

<section>
  <h2>05 · Radius System</h2>
  <div class="row">
    ${Object.entries(RAD).map(([k, v]) => `<div style="text-align:center"><div style="width:90px;height:90px;background:${L.surface};border:1px solid ${L.border};border-radius:${v}"></div><div class="frameLabel">${k}<br>${v}</div></div>`).join('')}
  </div>
</section>

<section>
  <h2>06 · Borders</h2>
  <div class="row">
    <div style="text-align:center"><div style="width:140px;height:80px;border-radius:12px;border:${uiTokens.borders.default.match(/\d+px/)[0]} solid ${L.border}"></div><div class="frameLabel">default</div></div>
    <div style="text-align:center"><div style="width:140px;height:80px;border-radius:12px;border:1px solid ${L.borderStrong}"></div><div class="frameLabel">strong</div></div>
    <div style="text-align:center"><div style="width:140px;height:80px;border-radius:12px;border:2px solid ${L.signalPrimary}"></div><div class="frameLabel">focus</div></div>
    <div style="text-align:center"><div style="width:140px;height:80px;border-radius:12px;border:1px solid ${L.success}"></div><div class="frameLabel">success</div></div>
    <div style="text-align:center"><div style="width:140px;height:80px;border-radius:12px;border:1px solid ${L.error}"></div><div class="frameLabel">error</div></div>
  </div>
</section>

<section>
  <h2>07 · Elevation</h2>
  <p class="rule-text">Hierarchy is carried by graphite surface tokens, not shadow — matching the current product's existing (and preserved) convention of zero box-shadow. Shadow is reserved for genuinely floating elements only.</p>
  <div class="row" style="margin-top:16px">
    <div style="text-align:center"><div style="width:180px;height:100px;background:${L.surface};border-radius:12px"></div><div class="frameLabel">none (default)</div></div>
    <div style="text-align:center"><div style="width:180px;height:100px;background:${L.surfaceElevated};border-radius:12px;box-shadow:${uiTokens.elevation.subtle.light}"></div><div class="frameLabel">subtle (popover)</div></div>
    <div style="text-align:center"><div style="width:180px;height:100px;background:${L.surfaceElevated};border-radius:12px;box-shadow:${uiTokens.elevation.overlay.light}"></div><div class="frameLabel">overlay (modal)</div></div>
  </div>
</section>

<section>
  <h2>08 · Buttons — Hierarchy Under Real Conditions</h2>
  <h4>Variants</h4>
  <div class="row">${btn('إجراء أساسي', 'primary', 'md', 'light')}${btn('إجراء ثانوي', 'secondary', 'md', 'light')}${btn('إجراء شفاف', 'ghost', 'md', 'light')}${btn('حذف', 'destructive', 'md', 'light')}</div>
  <h4 style="margin-top:20px">States (primary)</h4>
  <div class="row">${btn('افتراضي', 'primary', 'md', 'light')}${btn('Hover', 'primary', 'md', 'light', 'hover')}${btn('معطّل', 'primary', 'md', 'light', 'disabled')}${btn('Focus', 'primary', 'md', 'light', 'focus')}
  <button style="height:40px;padding:0 16px;border-radius:12px;${tf('Button', 'ar')}color:${L.ctaText};background:${L.cta};border:none;display:flex;align-items:center;gap:8px"><span class="spinner" style="border-color:rgba(255,255,255,.35);border-top-color:#fff"></span>جارٍ الإنشاء</button></div>
  <h4 style="margin-top:20px">Sizes</h4>
  <div class="row" style="align-items:center">${btn('صغير', 'secondary', 'sm', 'light')}${btn('متوسط', 'secondary', 'md', 'light')}</div>

  <h4 style="margin-top:28px">Grouped actions — several together (light)</h4>
  <div class="cardBase" style="background:${L.surface};border:1px solid ${L.border};width:520px">
    <b style="${tf('H4', 'ar')}color:${L.textPrimary}">حفظ التعديلات؟</b>
    <p style="${tf('Body Small', 'ar')}color:${L.textSecondary};margin-top:4px">لديك تغييرات غير محفوظة في Business Brain.</p>
    <div class="row" style="margin-top:${SP['space-md']}">${btn('إلغاء', 'ghost', 'sm', 'light')}${btn('حذف المسودة', 'destructive', 'sm', 'light')}${btn('حفظ', 'primary', 'sm', 'light')}</div>
  </div>
  <p class="rule-text" style="margin-top:10px">Exactly one primary per group. Destructive sits visually apart (red fill, not just red text) so it's never mistaken for the safe default even sitting directly beside the primary action.</p>

  <h4 style="margin-top:24px">Same group — dark mode</h4>
  <div class="cardBase" style="background:${D.surface};border:1px solid ${D.border};width:520px">
    <b style="${tf('H4', 'ar')}color:${D.textPrimary}">حفظ التعديلات؟</b>
    <p style="${tf('Body Small', 'ar')}color:${D.textSecondary};margin-top:4px">لديك تغييرات غير محفوظة في Business Brain.</p>
    <div class="row" style="margin-top:${SP['space-md']}">${btn('إلغاء', 'ghost', 'sm', 'dark')}${btn('حذف المسودة', 'destructive', 'sm', 'dark')}${btn('حفظ', 'primary', 'sm', 'dark')}</div>
  </div>
</section>

<section>
  <h2>09 · Inputs</h2>
  <div class="row">
    ${inputField('اسم المشروع', 'light', 'default', 'Brew 27')}
    ${inputField('اسم المشروع', 'light', 'focus', 'Brew 27')}
    ${inputField('رسالة العميل', 'light', 'error', '', 'هذا الحقل مطلوب')}
    ${inputField('توجيه (اختياري)', 'light', 'disabled', '')}
  </div>
</section>

<section>
  <h2>10 · Cards — One Family, Five Roles</h2>
  <p class="rule-text">Every card shares the same base grammar: radius-md, ${SP['space-md']} internal padding, 1px default border. They differentiate only through border treatment, internal structure, and behavior — never through five unrelated visual styles.</p>
  <h4 style="margin-top:20px">1 · Standard content — static, no action</h4>
  <div class="cardBase" style="width:280px;background:${L.surface};border:1px solid ${L.border}"><b style="${tf('H4', 'ar')}color:${L.textPrimary}">محتوى قياسي</b><p style="${tf('Body Small', 'ar')}color:${L.textSecondary};margin-top:6px">بطاقة معلومات عامة — بدون إجراء مباشر.</p></div>

  <h4 style="margin-top:24px">2 · Selectable — default vs. selected (border weight/color is the only change)</h4>
  <div class="row">
    <div class="cardBase" style="width:260px;background:${L.surface};border:1px solid ${L.border}"><b style="${tf('H4', 'ar')}color:${L.textPrimary}">Instagram Post — 1:1</b><p style="${tf('Body Small', 'ar')}color:${L.textSecondary};margin-top:6px">غير محددة</p></div>
    <div class="cardBase" style="width:260px;background:${L.signalSubtleBg};border:2px solid ${L.signalPrimary}"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><b style="${tf('H4', 'ar')}color:${L.textPrimary}">Instagram Story — 9:16</b>${iconWrap(icons.check, 18, L.signalPrimary)}</div><p style="${tf('Body Small', 'ar')}color:${L.textSecondary};margin-top:6px">محددة الآن</p></div>
  </div>

  <h4 style="margin-top:24px">3 · Action (engine tile) — default vs. hover (background shifts, border does not)</h4>
  <div class="row">
    <div class="cardBase" style="width:260px;background:${L.surface};border:1px solid ${L.border}"><b style="${tf('H4', 'ar')}color:${L.textPrimary}">🗓️ سوّ محتوى</b><p style="${tf('Body Small', 'ar')}color:${L.textSecondary};margin-top:6px">خطة محتوى مرتبطة بهدف مشروعك.</p></div>
    <div class="cardBase" style="width:260px;background:${L.surfaceSubtle};border:1px solid ${L.border}"><b style="${tf('H4', 'ar')}color:${L.textPrimary}">🗓️ سوّ محتوى</b><p style="${tf('Body Small', 'ar')}color:${L.textSecondary};margin-top:6px">خطة محتوى مرتبطة بهدف مشروعك.</p><div class="frameLabel" style="text-align:right;color:${L.signalPrimary};margin-top:4px">hover — 120ms</div></div>
  </div>

  <h4 style="margin-top:24px">4 · KPI / data — differentiated by content structure only, same base card</h4>
  <div class="cardBase" style="width:260px;background:${L.surface};border:1px solid ${L.border}"><div style="${tf('Label', 'ar')}color:${L.textSecondary}">إجمالي المبيعات</div><div style="${tf('Numeric / KPI', 'ar')}color:${L.textPrimary};margin-top:4px">${bdi('45,000 SAR')}</div><div style="${tf('Caption', 'ar')}color:${L.success};margin-top:2px">${bdi('+24%')}</div></div>

  <h4 style="margin-top:24px">5 · Generated-output container — empty (dashed) vs. filled (solid, once real content exists)</h4>
  <div class="row">
    <div class="cardBase" style="width:260px;background:${L.surfaceSubtle};border:1px dashed ${L.border}"><b style="${tf('H4', 'ar')}color:${L.textMuted}">لم يُنشأ تصميم بعد</b><div style="width:100%;height:70px;border-radius:8px;background:repeating-linear-gradient(45deg,${L.border},${L.border} 8px,transparent 8px,transparent 16px);margin-top:8px"></div></div>
    <div class="cardBase" style="width:260px;background:${L.surface};border:1px solid ${L.border}"><div style="width:100%;height:70px;border-radius:8px;background:${L.signalSubtleBg};display:flex;align-items:center;justify-content:center;color:${L.signalPrimary};font-family:Arial;font-size:11px">صورة التصميم</div><div class="row" style="margin-top:8px">${btn('تحميل', 'secondary', 'sm', 'light')}</div></div>
  </div>
  <p class="rule-text" style="margin-top:16px">No card is nested inside another card anywhere in this system — hierarchy is expressed through the card's own border/background weight and internal structure, never through nesting.</p>
</section>

<section>
  <h2>11 · Navigation</h2>
  <div class="uiMock" style="background:${L.bgPrimary}">
    <div class="uiTop" style="background:${L.surfaceElevated};border-bottom:1px solid ${L.border}">
      <div class="uiBrand"><div class="uiLogoTile" style="background:${L.textPrimary}">${fitTo(recolorMaster('#ffffff'), 18)}</div><b style="${tf('H4', 'ar')}color:${L.textPrimary}">شغّل</b></div>
      <div class="uiNav">
        <button style="${tf('Button', 'ar')}background:${L.surface};color:${L.textPrimary}">الرئيسية</button>
        <button style="${tf('Button', 'ar')}background:${L.surfaceSubtle};color:${L.signalPrimary};box-shadow:inset 0 0 0 1.5px ${L.signalPrimary}">Business Brain</button>
        <button style="${tf('Button', 'ar')}background:transparent;color:${L.textSecondary}">السجل</button>
      </div>
    </div>
  </div>
  <p class="rule-text" style="margin-top:14px">Active = signal-colored text + 1.5px signal border. Inactive = muted text, no border. Hover (not shown static) transitions background to surface-subtle over 120ms.</p>
</section>

<section>
  <h2>12 · Badges / Tags</h2>
  <div class="row rtl">
    ${badge('نشط', 'success', 'light')}${badge('قيد الانتظار', 'warning', 'light')}${badge('فشل', 'error', 'light')}${badge('قهوة', 'neutral', 'light')}${badge('AI', 'signal', 'light')}
  </div>
  <p class="rule-text" style="margin-top:14px">Functional use only — status and category, never decoration.</p>
</section>

<section>
  <h2>13 · Feedback / Semantic States</h2>
  <div class="row">
    <div style="width:260px;padding:14px;border-radius:8px;background:${L.surface};border-inline-start:3px solid ${L.success}"><b style="${tf('Caption', 'ar')}color:${L.success}">نجاح</b><div style="${tf('Body Small', 'ar')}color:${L.textPrimary}">تم إنشاء المحتوى بنجاح</div></div>
    <div style="width:260px;padding:14px;border-radius:8px;background:${L.surface};border-inline-start:3px solid ${L.warning}"><b style="${tf('Caption', 'ar')}color:${L.warning}">تنبيه</b><div style="${tf('Body Small', 'ar')}color:${L.textPrimary}">قد يحتوي الملف على بيانات حساسة</div></div>
    <div style="width:260px;padding:14px;border-radius:8px;background:${L.surface};border-inline-start:3px solid ${L.error}"><b style="${tf('Caption', 'ar')}color:${L.error}">خطأ</b><div style="${tf('Body Small', 'ar')}color:${L.textPrimary}">حدث خطأ أثناء إنشاء المحتوى</div></div>
    <div style="width:260px;padding:14px;border-radius:8px;background:${L.surface};border-inline-start:3px solid ${L.info}"><b style="${tf('Caption', 'ar')}color:${L.info}">معلومة</b><div style="${tf('Body Small', 'ar')}color:${L.textPrimary}">الشعار والنص يضافان بعد التوليد</div></div>
  </div>
  <div class="row" style="margin-top:16px">
    <div style="width:300px"><div style="height:10px;border-radius:5px;background:linear-gradient(90deg,${L.surfaceSubtle},${L.border},${L.surfaceSubtle});background-size:200% 100%"></div><div class="frameLabel" style="text-align:left">loading skeleton</div></div>
    <div style="width:300px;text-align:center;padding:16px;border:1px dashed ${L.border};border-radius:12px"><div style="${tf('Body Small', 'ar')}color:${L.textMuted}">ما فيه نتائج محفوظة حتى الآن.</div><div style="margin-top:8px">${btn('جرّب أول أداة', 'secondary', 'sm', 'light')}</div></div>
  </div>
</section>

<section style="background:${D.bgPrimary}">
  <h2 style="color:#999">14 · AI Interaction States</h2>
  <div class="row">
    ${['Ready', 'Generating', 'Thinking', 'Completed', 'Needs input', 'Failed'].map((s, i) => {
      const map = { Ready: [D.surface, D.textSecondary, D.border], Generating: [D.signalSubtleBg, D.signalPrimary, D.signalPrimary], Thinking: [D.signalSubtleBg, D.signalPrimary, D.signalPrimary], Completed: [D.surface, D.success, D.success], 'Needs input': [D.surface, D.warning, D.warning], Failed: [D.surface, D.error, D.error] }[s];
      const [bg, color, border] = map;
      const spin = (s === 'Generating' || s === 'Thinking') ? '<span class="spinner" style="border-color:rgba(255,255,255,.2);border-top-color:' + color + '"></span>' : '';
      return `<div style="width:150px;padding:12px;border-radius:8px;background:${bg};border:1px solid ${border};display:flex;align-items:center;gap:8px;color:${color};font-family:Arial;font-size:12px">${spin}${s}</div>`;
    }).join('')}
  </div>
  <div class="row" style="margin-top:16px">${btn('أعد التوليد', 'secondary', 'sm', 'dark')}${btn('تحسين', 'secondary', 'sm', 'dark')}${btn('حفظ', 'primary', 'sm', 'dark')}</div>
  <p class="rule-text" style="margin-top:16px;color:#ccc">The signal mint marks Generating/Thinking only — a controlled, single-purpose activation color, never a decorative gradient or sparkle animation. Completed uses semantic success green, Failed uses semantic error red, both distinct from the signal color per the locked color system's rule.</p>

  <h4 style="margin-top:28px;color:#888">Thinking vs. Generating — a functional difference, not a decorative one</h4>
  <div class="row">
    <div class="cardBase" style="width:340px;background:${D.surface};border:1px solid ${D.signalPrimary}">
      <div style="display:flex;align-items:center;gap:8px;color:${D.signalPrimary};font-family:Arial;font-size:12px"><span class="spinner" style="border-color:rgba(255,255,255,.2);border-top-color:${D.signalPrimary}"></span>الذكاء الاصطناعي يفكر...</div>
      <div style="margin-top:10px;height:10px;border-radius:5px;background:linear-gradient(90deg,${D.surfaceSubtle},${D.border},${D.surfaceSubtle});background-size:200% 100%"></div>
      <div style="margin-top:6px;height:10px;width:70%;border-radius:5px;background:${D.surfaceSubtle}"></div>
      <div class="frameLabel" style="text-align:right;color:#777;margin-top:10px">no partial content yet — interpreting the request. No Stop action; nothing exists to interrupt.</div>
    </div>
    <div class="cardBase" style="width:340px;background:${D.surface};border:1px solid ${D.signalPrimary}">
      <div style="display:flex;align-items:center;gap:8px;color:${D.signalPrimary};font-family:Arial;font-size:12px"><span class="spinner" style="border-color:rgba(255,255,255,.2);border-top-color:${D.signalPrimary}"></span>جارٍ الإنشاء...</div>
      <p style="${tf('Body Small', 'ar')}color:${D.textPrimary};margin-top:10px">ابدأ من فهم مشروعك، وبعدها شغّل الأدوات المناسبة له. جهّز بيانات مشروعك<span style="display:inline-block;width:2px;height:14px;background:${D.signalPrimary};margin-inline-start:2px;vertical-align:middle"></span></p>
      <div class="row" style="margin-top:10px">${btn('إيقاف', 'ghost', 'sm', 'dark')}</div>
      <div class="frameLabel" style="text-align:right;color:#777;margin-top:6px">real partial content is visible and growing — a Stop action is now available because there's something to interrupt.</div>
    </div>
  </div>
</section>

<section>
  <h2>15 · Iconography</h2>
  <p class="rule-text">Outline style, ${uiTokens.componentDimensions.iconStrokeWeight} stroke weight, ${uiTokens.componentDimensions.icon.default} default size. Representative set shown to establish the rule — not a proprietary library.</p>
  <div class="row" style="margin-top:16px">
    ${Object.entries(icons).map(([name, svg]) => `<div style="text-align:center">${iconWrap(svg, 24, L.textPrimary)}<div class="frameLabel">${name}</div></div>`).join('')}
  </div>
  <p class="rule-text" style="margin-top:16px"><b>RTL rule:</b> directional icons (chevrons, back/forward) mirror with reading direction. Non-directional icons (check, search, save, clock, alert, spark) never mirror.</p>
</section>

<section>
  <h2>16 · Modal / Overlay System</h2>
  <div class="row">
    <div style="position:relative;width:420px;height:240px;background-color:${uiTokens.elevation.scrim.light};border-radius:12px;display:flex;align-items:center;justify-content:center">
      <div style="width:320px;padding:20px;background:${L.surfaceElevated};border-radius:16px;box-shadow:${uiTokens.elevation.overlay.light}">
        <b style="${tf('H4', 'ar')}color:${L.textPrimary}">حذف هذه النتيجة؟</b>
        <p style="${tf('Body Small', 'ar')}color:${L.textSecondary};margin-top:8px">لا يمكن التراجع عن هذا الإجراء.</p>
        <div class="row" style="margin-top:14px">${btn('إلغاء', 'secondary', 'sm', 'light')}${btn('حذف', 'destructive', 'sm', 'light')}</div>
      </div>
    </div>
    <div style="width:220px;padding:10px;background:${L.surfaceElevated};border-radius:10px;box-shadow:${uiTokens.elevation.subtle.light}"><div style="${tf('Body Small', 'ar')}color:${L.textPrimary};padding:6px 8px">تعديل</div><div style="${tf('Body Small', 'ar')}color:${L.textPrimary};padding:6px 8px">نسخة ثانية</div><div style="${tf('Body Small', 'ar')}color:${L.error};padding:6px 8px">حذف</div></div>
  </div>
  <p class="rule-text" style="margin-top:14px">Confirmation dialog replaces the native browser confirm() found in the audit — same brand surface, radius, and typography as the rest of the system.</p>
  <h4 style="margin-top:24px">Same dialog — dark mode</h4>
  <div style="position:relative;width:420px;height:240px;background-color:${uiTokens.elevation.scrim.dark};border-radius:12px;display:flex;align-items:center;justify-content:center">
    <div style="width:320px;padding:20px;background:${D.surfaceElevated};border-radius:16px;box-shadow:${uiTokens.elevation.overlay.dark}">
      <b style="${tf('H4', 'ar')}color:${D.textPrimary}">حذف هذه النتيجة؟</b>
      <p style="${tf('Body Small', 'ar')}color:${D.textSecondary};margin-top:8px">لا يمكن التراجع عن هذا الإجراء.</p>
      <div class="row" style="margin-top:14px">${btn('إلغاء', 'secondary', 'sm', 'dark')}${btn('حذف', 'destructive', 'sm', 'dark')}</div>
    </div>
  </div>
</section>

<section>
  <h2>17 · Light Mode</h2>
  <div class="uiMock" style="background:${L.bgPrimary}">
    <div class="uiBody">
      <div style="${tf('H1', 'ar')}color:${L.textPrimary}">مشروعك. لكن أسرع.</div>
      <div class="row" style="margin-top:14px">${btn('ابدأ', 'primary', 'md', 'light')}${btn('Demo', 'secondary', 'md', 'light')}</div>
    </div>
  </div>
</section>

<section style="background:${D.bgPrimary}">
  <h2 style="color:#999">18 · Dark Mode</h2>
  <div class="uiMock" style="background:${D.bgPrimary};border-color:${D.border}">
    <div class="uiBody">
      <div style="${tf('H1', 'ar')}color:${D.textPrimary}">مشروعك. لكن أسرع.</div>
      <div class="row" style="margin-top:14px">${btn('ابدأ', 'primary', 'md', 'dark')}${btn('Demo', 'secondary', 'md', 'dark')}</div>
    </div>
  </div>
</section>

<section>
  <h2>19 · RTL / Bilingual Behavior</h2>
  <div class="row">
    <div style="text-align:center">${iconWrap(icons.chevronStart, 24, L.textPrimary)}<div class="frameLabel">"back" in RTL — points right, mirrors</div></div>
    <div style="text-align:center">${iconWrap(icons.check, 24, L.textPrimary)}<div class="frameLabel">check — never mirrors</div></div>
  </div>
  <p style="${tf('Body', 'ar')}color:${L.textPrimary};margin-top:16px;max-width:1100px">استخدم Business Brain لحفظ بيانات مشروعك، ثم افتح Visual Studio لتصميم منشور بسعر ${bdi('12,500 SAR')} وزيادة ${bdi('+24%')}.</p>
</section>

<section>
  <h2>20 · Responsive System</h2>
  <div class="row" style="align-items:flex-start">
    <div><div style="width:375px;height:220px;border:1px solid ${L.border};border-radius:8px;background:${L.bgPrimary};padding:12px"><div style="${tf('Body Small', 'ar')}color:${L.textPrimary}">375px — single column, 16px gutter</div></div><div class="frameLabel">mobile</div></div>
    <div><div style="width:500px;height:220px;border:1px solid ${L.border};border-radius:8px;background:${L.bgPrimary};padding:16px"><div class="grid3" style="grid-template-columns:1fr 1fr"><div class="cardBase" style="background:${L.surface};border:1px solid ${L.border};height:60px"></div><div class="cardBase" style="background:${L.surface};border:1px solid ${L.border};height:60px"></div></div></div><div class="frameLabel">tablet (768px) — 2-column card grid</div></div>
    <div><div style="width:600px;height:220px;border:1px solid ${L.border};border-radius:8px;background:${L.bgPrimary};padding:20px"><div class="grid3"><div class="cardBase" style="background:${L.surface};border:1px solid ${L.border};height:60px"></div><div class="cardBase" style="background:${L.surface};border:1px solid ${L.border};height:60px"></div><div class="cardBase" style="background:${L.surface};border:1px solid ${L.border};height:60px"></div></div></div><div class="frameLabel">desktop (1440px) — 3-column card grid</div></div>
  </div>
</section>

<section>
  <h2>21 · Accessibility</h2>
  <p class="rule-text">Focus rings use the locked signal-border token at 2px, always visible on keyboard focus (Section 08). No text role goes below the locked 11px Metadata floor. Semantic states are always paired with text/icon, never color alone (Section 13). All button/input targets are 40px (32px for the small button variant only, used for dense secondary actions, not primary flows) — comfortably above common touch-target guidance.</p>
</section>

<section>
  <h2>22 · Home / Engine Selection — Full Simulation</h2>
  <div class="uiMock" style="background:${L.bgPrimary};width:1080px">
    <div class="uiTop" style="background:${L.surfaceElevated};border-bottom:1px solid ${L.border}">
      <div class="uiBrand"><div class="uiLogoTile" style="background:${L.textPrimary}">${fitTo(recolorMaster('#ffffff'), 18)}</div><b style="${tf('H4', 'ar')}color:${L.textPrimary}">شغّل</b></div>
      <div class="uiNav">
        <button style="${tf('Button', 'ar')}background:${L.surfaceSubtle};color:${L.signalPrimary};box-shadow:inset 0 0 0 1.5px ${L.signalPrimary}">الرئيسية</button>
        <button style="${tf('Button', 'ar')}background:transparent;color:${L.textSecondary}">Business Brain</button>
        <button style="${tf('Button', 'ar')}background:transparent;color:${L.textSecondary}">السجل</button>
      </div>
    </div>
    <div class="uiBody">
      <div style="${tf('H1', 'ar')}color:${L.textPrimary}">Brew 27 — وش تبغى تنجز اليوم؟</div>
      <p style="${tf('Body', 'ar')}color:${L.textSecondary};margin-top:6px">كل أداة تستخدم Business Brain تلقائيًا.</p>
      <div class="grid3" style="margin-top:${SP['space-lg']}">
        <div class="cardBase" style="background:${L.surfaceSubtle};border:1px solid ${L.border};position:relative"><span style="position:absolute;top:10px;left:10px">${badge('الأكثر استخدامًا', 'signal', 'light')}</span><b style="${tf('H4', 'ar')}color:${L.textPrimary}">🗓️ سوّ محتوى</b><p style="${tf('Body Small', 'ar')}color:${L.textSecondary};margin-top:6px">خطة محتوى مرتبطة بهدف مشروعك.</p></div>
        <div class="cardBase" style="background:${L.surface};border:1px solid ${L.border}"><b style="${tf('H4', 'ar')}color:${L.textPrimary}">✍️ اكتب لي</b><p style="${tf('Body Small', 'ar')}color:${L.textSecondary};margin-top:6px">Caption، إعلان، WhatsApp ووصف منتج.</p></div>
        <div class="cardBase" style="background:${L.surface};border:1px solid ${L.border}"><b style="${tf('H4', 'ar')}color:${L.textPrimary}">🎯 ابنِ عرض</b><p style="${tf('Body Small', 'ar')}color:${L.textSecondary};margin-top:6px">عرض مقنع مبني على قيمة منتجك.</p></div>
        <div class="cardBase" style="background:${L.surface};border:1px solid ${L.border}"><b style="${tf('H4', 'ar')}color:${L.textPrimary}">💬 رد على عميل</b><p style="${tf('Body Small', 'ar')}color:${L.textSecondary};margin-top:6px">بيع، اعتراض، متابعة أو شكوى.</p></div>
        <div class="cardBase" style="background:${L.surface};border:1px solid ${L.border}"><b style="${tf('H4', 'ar')}color:${L.textPrimary}">🚀 سوّ حملة</b><p style="${tf('Body Small', 'ar')}color:${L.textSecondary};margin-top:6px">Big Idea + محتوى + WhatsApp.</p></div>
        <div class="cardBase" style="background:${L.surfaceSubtle};border:1px solid ${L.border}"><b style="${tf('H4', 'ar')}color:${L.textPrimary}">🎬 اكتب Reel</b><p style="${tf('Body Small', 'ar')}color:${L.textSecondary};margin-top:6px">Hook + Scenes + VO + CTA.</p><div class="frameLabel" style="text-align:right;color:${L.signalPrimary};margin-top:4px">hover</div></div>
      </div>
    </div>
  </div>
</section>

<section>
  <h2>23 · Business Brain — Populated, Dense Simulation</h2>
  <div class="uiMock" style="background:${L.surfaceElevated};border-color:${L.border};width:1080px">
    <div class="uiBody">
      <div style="${tf('H1', 'ar')}color:${L.textPrimary}">Business Brain</div>
      <div class="grid3" style="margin-top:${SP['space-lg']}">
        ${[['اسم المشروع', 'Brew 27'], ['القطاع', 'قهوة مختصة'], ['وش تبيع؟', 'قهوة مختصة وحلويات مع توصيل داخل جدة'], ['مين عميلك؟', 'موظفون وطلاب 20–35'], ['المدينة/السوق', 'جدة'], ['متوسط السعر', '50–100 SAR'], ['النبرة', 'سعودي طبيعي'], ['الهدف الحالي', 'رجوع العملاء']].map(([label, val]) => `<div class="cardBase" style="background:${L.surface};border:1px solid ${L.border}"><small style="${tf('Label', 'ar')}color:${L.textMuted}">${esc(label)}</small><b style="${tf('H4', 'ar')}color:${L.textPrimary};display:block;margin-top:2px">${esc(val)}</b></div>`).join('')}
      </div>
      <div class="row" style="margin-top:${SP['space-lg']}">${btn('تعديل', 'secondary', 'md', 'light')}${btn('ابدأ شغّل', 'primary', 'md', 'light')}</div>
    </div>
  </div>
</section>

<section>
  <h2>24 · Brand Brain — Populated Identity Simulation</h2>
  <div class="uiMock" style="background:${L.surfaceElevated};border-color:${L.border};width:1080px">
    <div class="uiBody">
      <div style="${tf('H1', 'ar')}color:${L.textPrimary}">Brand Brain</div>
      <p style="${tf('Body', 'ar')}color:${L.textSecondary};margin-top:6px">هوية مشروعك البصرية.</p>
      <div class="grid3" style="margin-top:${SP['space-lg']}">
        <div class="cardBase" style="background:${L.surface};border:1px solid ${L.border}"><small style="${tf('Label', 'ar')}color:${L.textMuted}">اللون الأساسي</small><div class="row" style="align-items:center;margin-top:6px"><span style="width:20px;height:20px;border-radius:6px;background:${L.signalPrimary};display:inline-block"></span><b style="${tf('Body Small', 'ar')}color:${L.textPrimary}">${bdi('#24BC99')}</b></div></div>
        <div class="cardBase" style="background:${L.surface};border:1px solid ${L.border}"><small style="${tf('Label', 'ar')}color:${L.textMuted}">الجمهور المستهدف</small><b style="${tf('H4', 'ar')}color:${L.textPrimary};display:block;margin-top:2px">موظفون وطلاب، 20–35، جدة</b></div>
        <div class="cardBase" style="background:${L.surface};border:1px solid ${L.border}"><small style="${tf('Label', 'ar')}color:${L.textMuted}">نبرة العلامة التجارية</small><b style="${tf('H4', 'ar')}color:${L.textPrimary};display:block;margin-top:2px">سعودي طبيعي، واثق وودود</b></div>
      </div>
      <div class="cardBase" style="background:${L.surface};border:1px solid ${L.border};margin-top:${SP['space-sm']}"><small style="${tf('Label', 'ar')}color:${L.textMuted}">الأسلوب البصري</small><p style="${tf('Body Small', 'ar')}color:${L.textPrimary};margin-top:4px">تصوير سعودي عصري، natural lighting، تكوين بسيط والمنتج هو البطل — بدون نص إضافي على الصورة.</p></div>
    </div>
  </div>
</section>

<section style="background:${D.bgPrimary}">
  <h2 style="color:#999">25 · Visual Studio — Controls, Generating, and Result (Dark)</h2>
  <div class="row" style="align-items:flex-start">
    <div class="uiMock" style="background:${D.surfaceElevated};border-color:${D.border};width:520px">
      <div class="uiBody">
        <div style="${tf('H2', 'ar')}color:${D.textPrimary}">Visual Studio</div>
        <p style="${tf('Body Small', 'ar')}color:${D.textSecondary};margin-top:4px">بيانات مشروعك وهويتك مأخوذة تلقائيًا.</p>
        <div class="row" style="margin-top:${SP['space-md']}">
          ${inputField('المقاس', 'dark', 'default', 'Instagram Story — 9:16')}
          ${inputField('الأسلوب', 'dark', 'default', 'Premium')}
        </div>
        <div class="row" style="margin-top:${SP['space-md']}">${btn('اصنع التصميم', 'primary', 'md', 'dark')}</div>
      </div>
    </div>
    <div class="cardBase" style="width:320px;background:${D.surface};border:1px solid ${D.signalPrimary}">
      <div style="display:flex;align-items:center;gap:8px;color:${D.signalPrimary};font-family:Arial;font-size:12px"><span class="spinner" style="border-color:rgba(255,255,255,.2);border-top-color:${D.signalPrimary}"></span>جارٍ توليد التصميم...</div>
      <div style="width:100%;height:140px;border-radius:8px;background:repeating-linear-gradient(45deg,${D.border},${D.border} 8px,transparent 8px,transparent 16px);margin-top:10px"></div>
      <div class="frameLabel" style="text-align:right;color:#777;margin-top:8px">Generating state — no action available yet</div>
    </div>
    <div class="cardBase" style="width:320px;background:${D.surface};border:1px solid ${D.border}">
      <div style="width:100%;height:140px;border-radius:8px;background:${D.signalSubtleBg};display:flex;align-items:center;justify-content:center;color:${D.signalPrimary};font-family:Arial;font-size:11px">التصميم النهائي</div>
      <div class="row" style="margin-top:10px">${btn('نسخة ثانية', 'secondary', 'sm', 'dark')}${btn('تحميل', 'primary', 'sm', 'dark')}</div>
    </div>
  </div>
</section>

<section>
  <h2>26 · Generated Result — Long-Form, 680px Reading Measure</h2>
  <div class="uiMock" style="background:${L.bgPrimary};width:1080px">
    <div class="uiBody">
      <div style="max-width:${uiTokens.layout.readingMeasure}">
        <div style="${tf('H2', 'ar')}color:${L.textPrimary}">خطة المحتوى الأسبوعية</div>
        <div class="row rtl" style="margin-top:6px">${badge('سوّ محتوى', 'neutral', 'light')}<span style="${tf('Metadata', 'ar')}color:${L.textMuted}">Brew 27 · 27 سبتمبر 2026</span></div>
        <p style="${tf('Body', 'ar')}color:${L.textPrimary};margin-top:${SP['space-md']}">ابدأ من فهم مشروعك، وبعدها شغّل الأدوات المناسبة له. جهّز بيانات مشروعك مرة واحدة في Business Brain، واحصل على محتوى، عروض، وردود جاهزة تلقائيًا.</p>
        <p style="${tf('Body', 'ar')}color:${L.textPrimary};margin-top:${SP['space-sm']}">شغّل يفهم نبرة علامتك التجارية ويحافظ عليها في كل نص يكتبه لك، من منشور إنستغرام إلى رد واتساب على عميل غاضب.</p>
        <ul style="${tf('Body', 'ar')}color:${L.textPrimary};margin:${SP['space-sm']} 0;padding-inline-start:24px">
          <li style="margin:4px 0">يوم الأحد: منشور تعريفي بالمنتج الجديد</li>
          <li style="margin:4px 0">يوم الثلاثاء: عرض خاص بنسبة ${bdi('15%')} لعملاء الواتساب</li>
          <li style="margin:4px 0">يوم الخميس: Reel قصير عن قصة العلامة</li>
        </ul>
        <p style="${tf('Body', 'ar')}color:${L.textPrimary};margin-top:${SP['space-sm']}">أهم نقطة هذا الأسبوع: <span style="font-weight:${typeTokens.emphasisException.weight}">زيادة المبيعات بنسبة ${bdi('24%')}</span> مقارنة بالأسبوع الماضي.</p>
        <div class="row" style="margin-top:${SP['space-lg']}">${btn('تحسين', 'secondary', 'sm', 'light')}${btn('نسخة ثانية', 'secondary', 'sm', 'light')}${btn('حفظ في السجل', 'primary', 'sm', 'light')}</div>
      </div>
    </div>
  </div>
</section>

<section>
  <h2>27 · History — Multiple Entries, Scan Hierarchy</h2>
  <div class="uiMock" style="background:${L.bgPrimary};width:1080px">
    <div class="uiBody">
      ${[
        ['سوّ محتوى', 'Brew 27', '27 سبتمبر 2026', 'خطة محتوى أسبوعية مرتبطة بهدف رجوع العملاء...', 'neutral', 'محفوظ'],
        ['رد على عميل', 'Brew 27', '25 سبتمبر 2026', 'شكرًا لتواصلك، نعتذر عن التأخير في التوصيل...', 'success', 'محفوظ'],
        ['اكتب Reel', 'Brew 27', '22 سبتمبر 2026', 'Hook: وش لو قهوتك تجيك قبل لا تطلبها؟...', 'neutral', 'مسودة'],
      ].map(([title, project, date, excerpt, kind, status]) => `
      <div class="cardBase" style="background:${L.surface};border:1px solid ${L.border};margin-bottom:${SP['space-xs']};display:flex;justify-content:space-between;align-items:center;gap:16px">
        <div style="flex:1">
          <div class="row rtl" style="align-items:center;gap:8px"><b style="${tf('H4', 'ar')}color:${L.textPrimary}">${esc(title)}</b>${badge(status, kind === 'success' ? 'success' : 'neutral', 'light')}<span style="${tf('Caption', 'ar')}color:${L.textSecondary}">· ${esc(project)}</span></div>
          <div style="${tf('Metadata', 'ar')}color:${L.textMuted};margin-top:2px">${esc(date)}</div>
          <p style="${tf('Body Small', 'ar')}color:${L.textSecondary};margin-top:4px">${esc(excerpt)}</p>
        </div>
        <div class="row" style="flex-shrink:0">${btn('فتح', 'secondary', 'sm', 'light')}<span style="display:inline-flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:8px;color:${L.error}">${iconWrap(icons.close, 16, L.error)}</span></div>
      </div>`).join('')}
    </div>
  </div>
</section>

<section>
  <h2>28 · Mobile — Full Realistic Workflow (375px)</h2>
  <div class="row" style="align-items:flex-start">
    <div>
      <div class="mobileFrame">
        <div class="screen" style="background:${L.bgPrimary};padding:${SP['space-md']}">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:8px"><div style="width:24px;height:24px;border-radius:6px;background:${L.textPrimary};display:flex;align-items:center;justify-content:center">${fitTo(recolorMaster('#ffffff'), 14)}</div><b style="${tf('H4', 'ar')}color:${L.textPrimary}">شغّل</b></div>
            ${iconWrap(icons.search, 20, L.textSecondary)}
          </div>
          <div style="${tf('H2', 'ar')}color:${L.textPrimary};margin-top:${SP['space-md']}">سوّ محتوى</div>
          <p style="${tf('Body Small', 'ar')}color:${L.textSecondary};margin-top:4px">بيانات مشروعك مأخوذة تلقائيًا من Business Brain</p>
          <div style="margin-top:${SP['space-md']}"><label style="${tf('Label', 'ar')}color:${L.textPrimary};display:block;margin-bottom:${SP['space-xs']}">الفترة</label><div style="height:40px;border-radius:8px;background:${L.surface};border:1px solid ${L.border};display:flex;align-items:center;padding:0 ${SP['space-sm']};${tf('Input', 'ar')}color:${L.textPrimary}">7 أيام</div></div>
          <div class="cardBase" style="background:${D.surface};border:1px solid ${D.signalPrimary};margin-top:${SP['space-md']}">
            <div style="display:flex;align-items:center;gap:8px;color:${D.signalPrimary};font-family:Arial;font-size:12px"><span class="spinner" style="border-color:rgba(255,255,255,.2);border-top-color:${D.signalPrimary}"></span>جارٍ الإنشاء...</div>
          </div>
          <div style="position:sticky;bottom:0;background:${L.bgPrimary};padding-top:${SP['space-md']};margin-top:${SP['space-md']}">
            <button style="width:100%;height:40px;border-radius:12px;${tf('Button', 'ar')}color:${L.ctaText};background:${L.cta};border:none">شغّل</button>
            <button style="width:100%;height:40px;border-radius:12px;${tf('Button', 'ar')}color:${L.textPrimary};background:transparent;border:none;margin-top:6px">إلغاء</button>
          </div>
        </div>
      </div>
      <div class="frameLabel">375px — full workflow, no horizontal overflow, 40px targets throughout</div>
    </div>
    <p class="rule-text" style="max-width:500px">Verified: no compressed action labels (button text wraps to a second line before truncating), sensible top-to-bottom stacking (header → title → form → AI state → sticky CTA), Arabic renders at full Body/Label sizes unchanged from desktop, and RTL holds throughout — the search icon sits at the reading-start (left, since this is RTL) matching the locked navigation rule.</p>
  </div>
</section>

<section>
  <h2>29 · Do / Don't</h2>
  <div class="dodont">
    <div class="col do"><h3 style="color:#1a8a4a">DO</h3><div class="example" style="background:#fff">${btn('إجراء واحد بارز', 'primary', 'md', 'light')}</div><p>One signal-colored primary action per screen.</p></div>
    <div class="col dont"><h3 style="color:#c4291b">DON'T</h3><div class="example" style="background:#fff;display:flex;gap:8px">${btn('إجراء', 'primary', 'md', 'light')}${btn('إجراء', 'primary', 'md', 'light')}${btn('إجراء', 'primary', 'md', 'light')}</div><p>Never make every action a filled signal-colored button — it stops signaling anything.</p></div>
  </div>
  <div class="dodont" style="margin-top:20px">
    <div class="col do"><h3 style="color:#1a8a4a">DO</h3><div class="example" style="background:#fff"><div class="cardBase" style="background:${L.surface};border:1px solid ${L.border}">بطاقة واحدة، حد واضح</div></div><p>Flat cards with one border weight communicating one level of hierarchy.</p></div>
    <div class="col dont"><h3 style="color:#c4291b">DON'T</h3><div class="example" style="background:${L.surfaceSubtle};padding:16px"><div class="cardBase" style="background:#fff;border:1px solid ${L.border}"><div class="cardBase" style="background:${L.surface};border:1px solid ${L.border};margin-top:8px">بطاقة داخل بطاقة</div></div></div><p>Never nest a card inside a card unless hierarchy genuinely requires it.</p></div>
  </div>
</section>

<section style="border-bottom:none">
  <h2>30 · Production Rules Summary</h2>
  <p class="rule-text"><b>Spacing:</b> 8 semantic steps, 4px–64px, always from the scale. <b>Radius:</b> 4 steps only, pill reserved for badges. <b>Elevation:</b> none by default; shadow only for popovers/modals. <b>Borders:</b> reference locked Graphite Pulse tokens, never new hex values. <b>Buttons:</b> primary/secondary/ghost/destructive × small/medium only. <b>AI signal color:</b> Generating/Thinking states only — never decorative. <b>Cards:</b> never nested. <b>Confirmation:</b> in-brand dialog, never native confirm().</p>
</section>

</div>
</body></html>`;

fs.writeFileSync(path.join(__dirname, 'SHAGHIL_DESIGN_SYSTEM_FOUNDATION.html'), html);

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
fs.writeFileSync(path.join(__dirname, 'SHAGHIL_DESIGN_SYSTEM_FOUNDATION.png'), buf);
console.log('design system board built, height', h);
await browser.close();
