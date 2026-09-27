// Builds the single final production board for the locked SHAGHIL color system
// (C2 — Graphite Pulse, final refinement). Uses the real locked logo SVG (geometry
// untouched, fill only) and real product copy as static mockups.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, 'shaghil-color-tokens.json'), 'utf8'));
const finalContrast = JSON.parse(fs.readFileSync(path.join(__dirname, '../qa/final-contrast-results.json'), 'utf8'));

const logoRoot = path.join(__dirname, '../../logo');
const rawMaster = fs.readFileSync(path.join(logoRoot, 'master/SHAGHIL_MASTER_AR.svg'), 'utf8');
const rawAppIcon = fs.readFileSync(path.join(logoRoot, 'micromark/SHAGHIL_APP_ICON_BW.svg'), 'utf8');
const rawFavicon = fs.readFileSync(path.join(logoRoot, 'micromark/SHAGHIL_FAVICON.svg'), 'utf8');

function recolorMaster(hex) { return rawMaster.replace('fill="#000"', `fill="${hex}"`); }
function recolorAppIconTile(tileHex, markHex) { return rawAppIcon.replace('fill="#000"', `fill="${tileHex}"`).replace('fill="#fff"', `fill="${markHex}"`); }
function recolorFavicon(hex) { return rawFavicon.replace('fill="#000"', `fill="${hex}"`); }

function fitTo(svg, targetW) {
  const vb = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
  const [, , , vw, vh] = vb.map(Number);
  const targetH = Math.round((vh / vw) * targetW);
  return svg.replace(/width="[\d.]+" height="[\d.]+"( style="display:block")?/, `width="${targetW}" height="${targetH}" style="display:block"`);
}

// Flattened per-mode view for the template. Built explicitly (not via object-spread merge)
// because 'border' exists in both the graphite and signal namespaces with different meanings
// (naive spreading silently let the signal's border overwrite the graphite divider color).
function flatten(mode) {
  const g = tokens[mode].graphite, s = tokens[mode].signal, i = tokens[mode].interactive, sem = tokens[mode].semantic;
  return {
    bgDeepest: g.bgDeepest, bgPrimary: g.bgPrimary, surface: g.surface, surfaceSubtle: g.surfaceSubtle,
    surfaceElevated: g.surfaceElevated, border: g.border, borderStrong: g.borderStrong,
    textPrimary: g.textPrimary, textSecondary: g.textSecondary, textMuted: g.textMuted,
    signalPrimary: s.primary, signalHover: s.hover, signalPressed: s.pressed,
    signalSubtleBg: s.subtleBg, signalBorder: s.border, signalTextOnLight: s.textOnLight,
    cta: i.cta, ctaText: i.ctaText, ctaHover: i.ctaHover, ctaPressed: i.ctaPressed,
    focus: i.focus, disabledBg: i.disabledBg, disabledText: i.disabledText,
    success: sem.success, warning: sem.warning, error: sem.error, info: sem.info,
  };
}
const D = flatten('dark');
const L = flatten('light');

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

function ratioOf(fg, bg) {
  const hexToRgb = (h) => { const n = parseInt(h.replace('#', ''), 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; };
  const ch = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const lum = (h) => { const { r, g, b } = hexToRgb(h); return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b); };
  const l1 = lum(fg), l2 = lum(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function swatch(hex, label, sub = '') {
  const textColor = ratioOf(hex, '#FFFFFF') > ratioOf(hex, '#000000') ? '#fff' : '#000';
  return `<div class="swatch" style="background:${hex};color:${textColor}"><b>${esc(label)}</b><span>${esc(hex)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
}

function hierarchyStrip(entries, label) {
  return `<div class="hierBlock"><h4>${esc(label)}</h4><div class="hierStrip">${entries.map(([k, v]) => `<div class="hierCell" style="background:${v}"><span style="color:${ratioOf(v, '#fff') > ratioOf(v, '#000') ? '#fff' : '#000'}">${esc(k)}<br>${esc(v)}</span></div>`).join('')}</div></div>`;
}

function btn(bg, color, label, extra = '') {
  return `<button class="mockBtn" style="background:${bg};color:${color};${extra}">${esc(label)}</button>`;
}

function accessRows(mode) {
  return finalContrast[mode].map((r) => `<div class="accRow"><span class="accVerdict ${r.verdict === 'PASS' ? 'pass' : 'fail'}">${r.verdict}</span><span class="accRatio">${r.ratio.toFixed(2)}:1</span><span class="accLabel">${esc(r.label)}</span><span class="accPair">${esc(r.fg)} / ${esc(r.bg)}</span></div>`).join('');
}

const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; }
  .canvas { width: 1900px; padding-bottom: 80px; }
  section { padding: 60px 90px; border-bottom: 1px solid #eee; }
  h2 { font-size: 20px; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin: 0 0 28px; direction: ltr; text-align: left; font-weight: 700; }
  h4 { font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; color: #999; margin: 0 0 12px; direction: ltr; text-align: left; }
  .rule-text { font-size: 16px; line-height: 1.7; direction: ltr; text-align: left; color: #333; max-width: 1200px; }
  .badge { display: inline-block; background: #111; color: #fff; font-size: 13px; padding: 4px 12px; border-radius: 20px; direction: ltr; }
  .status-badge { display: inline-block; background: #0a5; color: #fff; font-size: 13px; padding: 4px 12px; border-radius: 20px; direction: ltr; margin-inline-start: 10px; }
  .title { font-size: 40px; font-weight: 800; direction: ltr; text-align: left; margin: 10px 0 6px; }

  .swatchRow { display: flex; gap: 20px; flex-wrap: wrap; direction: ltr; }
  .swatch { width: 230px; height: 150px; border-radius: 16px; padding: 16px; display: flex; flex-direction: column; justify-content: flex-end; direction: ltr; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
  .swatch b { font-size: 16px; } .swatch span { font-size: 13px; opacity: .85; } .swatch small { font-size: 11px; opacity: .75; margin-top: 4px; }

  .tokenGrid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; direction: ltr; }
  .tokenBlock { background: #fafafa; border: 1px solid #eee; border-radius: 14px; padding: 20px; }
  .tokenList { display: flex; flex-direction: column; gap: 8px; }
  .tokenRow { display: flex; align-items: center; gap: 10px; direction: ltr; font-size: 13px; }
  .swatchSm { width: 22px; height: 22px; border-radius: 6px; border: 1px solid rgba(0,0,0,.08); flex-shrink: 0; }
  .tokName { width: 170px; color: #444; font-weight: 600; } .tokHex { color: #999; font-family: monospace; }

  .hierBlock { margin-bottom: 24px; }
  .hierStrip { display: flex; direction: ltr; border-radius: 12px; overflow: hidden; }
  .hierCell { flex: 1; height: 90px; display: flex; align-items: center; justify-content: center; text-align: center; }
  .hierCell span { font-size: 11px; line-height: 1.5; direction: ltr; font-family: monospace; }

  .logoTiles { display: flex; gap: 30px; flex-wrap: wrap; direction: ltr; }
  .logoTile { width: 340px; height: 240px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
  .logoTile.light { background: #fff; border: 1px solid #eee; }
  .logoTileWrap { text-align: center; } .logoTileWrap .lbl { margin-top: 12px; font-size: 13px; color: #888; direction: ltr; }
  .logoTileWrap .lbl.warn { color: #b4740a; font-weight: 700; }

  .uiMock { border-radius: 20px; overflow: hidden; width: 900px; border: 1px solid #ddd; }
  .uiTop { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; }
  .uiBrand { display: flex; align-items: center; gap: 10px; }
  .uiLogoTile { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; font-weight: 900; font-size: 18px; }
  .uiNav button { border: none; border-radius: 10px; padding: 8px 12px; font-weight: 700; font-size: 13px; margin-inline-start: 6px; cursor: default; }
  .uiBody { padding: 24px; }
  .uiH1 { font-size: 30px; font-weight: 800; margin: 4px 0 10px; line-height: 1.15; }
  .uiP { font-size: 14px; line-height: 1.7; margin: 0 0 16px; }
  .uiGrid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
  .uiCard { border-radius: 16px; padding: 16px; } .uiCard b { display: block; font-size: 15px; margin-bottom: 6px; } .uiCard span { font-size: 12px; line-height: 1.5; display:block; }

  .brainGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .brainCell { border-radius: 12px; padding: 12px; } .brainCell small { display: block; font-size: 11px; margin-bottom: 4px; } .brainCell b { font-size: 14px; }

  .studioRow { display: flex; gap: 24px; align-items: flex-start; }
  .studioForm { flex: 1; display: flex; flex-direction: column; gap: 10px; }
  .studioField label { font-size: 12px; font-weight: 700; display: block; margin-bottom: 5px; }
  .studioField select { width: 100%; border-radius: 10px; padding: 9px; font-size: 13px; }
  .genCard { width: 300px; height: 300px; border-radius: 16px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px; }
  .genCard .ph { width: 70%; height: 55%; border-radius: 10px; background: repeating-linear-gradient(45deg, rgba(255,255,255,.06), rgba(255,255,255,.06) 10px, rgba(255,255,255,.02) 10px, rgba(255,255,255,.02) 20px); }

  .btnRow { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
  .btnRow.ltr { direction: ltr; }
  .mockBtn { border-radius: 12px; padding: 11px 18px; font-weight: 700; font-size: 14px; border: none; direction: ltr; }

  .inputStates { display: flex; gap: 20px; flex-wrap: wrap; direction: ltr; }
  .inputDemo { width: 260px; }
  .inputDemo label { font-size: 12px; font-weight: 700; display: block; margin-bottom: 6px; direction: ltr; }
  .inputDemo input { width: 100%; border-radius: 10px; padding: 10px; font-size: 13px; direction: ltr; }

  .semRow { display: flex; gap: 16px; flex-wrap: wrap; direction: ltr; }
  .semBanner { width: 280px; border-radius: 12px; padding: 14px; font-size: 13px; line-height: 1.5; direction: ltr; }

  .favSim { display: flex; gap: 40px; align-items: center; flex-wrap: wrap; direction: ltr; }
  .favTab { width: 210px; height: 44px; border-radius: 8px 8px 0 0; display: flex; align-items: center; padding: 0 12px; gap: 8px; }
  .favTab svg { width: 18px; height: 18px; } .favTab .t { font-size: 12px; direction: ltr; }
  .appIconTile { width: 128px; height: 128px; border-radius: 28px; overflow: hidden; }

  .socialPost { width: 480px; border-radius: 20px; overflow: hidden; }
  .socialInner { aspect-ratio: 1/1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; padding: 40px; text-align: center; }
  .socialInner .tag { font-size: 28px; font-weight: 900; direction: ltr; }
  .socialInner .sub { font-size: 14px; direction: ltr; opacity: .85; }

  .accTable { display: flex; flex-direction: column; gap: 6px; }
  .accRow { display: flex; gap: 14px; align-items: center; font-size: 13px; direction: ltr; padding: 6px 10px; border-radius: 8px; background: #fafafa; }
  .accVerdict { font-weight: 800; width: 46px; } .accVerdict.pass { color: #1a8a4a; } .accVerdict.fail { color: #c4291b; }
  .accRatio { width: 70px; font-family: monospace; color: #444; } .accLabel { flex: 1; color: #333; } .accPair { font-family: monospace; color: #999; font-size: 12px; }

  .dominanceBar { display: flex; height: 46px; border-radius: 10px; overflow: hidden; width: 900px; direction: ltr; }
  .dominanceBar div { display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; direction: ltr; color: #fff; }

  .dodont { display: flex; gap: 30px; direction: ltr; }
  .dodont .col { flex: 1; border-radius: 16px; padding: 24px; }
  .dodont .col.do { background: #eafaf0; border: 1px solid #bfe8cd; }
  .dodont .col.dont { background: #fdeceb; border: 1px solid #f3c6c2; }
  .dodont h3 { margin: 0 0 14px; font-size: 16px; direction: ltr; }
  .dodont .example { border-radius: 12px; padding: 18px; margin-bottom: 12px; }
  .dodont p { font-size: 13px; margin: 0; direction: ltr; color: #444; }
</style></head>
<body>
<div class="canvas">

<section style="border-top: 10px solid ${D.signalPrimary};">
  <span class="badge">SHAGHIL COLOR SYSTEM</span><span class="status-badge">FOUNDER APPROVED — LOCKED</span>
  <h1 class="title">Graphite Pulse — Final Production Color System</h1>
  <p class="rule-text">Selected direction: C2 — Graphite Pulse. Color is a system signal, not decoration. Graphite carries the environment; the mint/cyan signal is a controlled activation color, used sparingly. The SHAGHIL master logo remains fundamentally black/white — logo geometry is unchanged throughout this phase.</p>
</section>

<section>
  <h2>01 · Final Core Palette</h2>
  <div class="swatchRow">
    ${swatch(D.signalPrimary, 'Signal (dark)', 'controlled activation color')}
    ${swatch(D.bgPrimary, 'Graphite bg (dark)')}
    ${swatch(D.surfaceElevated, 'Elevated surface (dark)')}
    ${swatch(L.signalPrimary, 'Signal (light)', 'controlled activation color')}
    ${swatch(L.bgPrimary, 'Graphite bg (light)')}
    ${swatch(L.surface, 'Surface (light)')}
  </div>
</section>

<section>
  <h2>02 · Full Token Scale</h2>
  <div class="tokenGrid2">
    <div class="tokenBlock"><h4>Dark mode — all tokens</h4><div class="tokenList">${Object.entries(D).map(([k, v]) => `<div class="tokenRow"><span class="swatchSm" style="background:${v}"></span><span class="tokName">${k}</span><span class="tokHex">${v}</span></div>`).join('')}</div></div>
    <div class="tokenBlock"><h4>Light mode — all tokens</h4><div class="tokenList">${Object.entries(L).map(([k, v]) => `<div class="tokenRow"><span class="swatchSm" style="background:${v}"></span><span class="tokName">${k}</span><span class="tokHex">${v}</span></div>`).join('')}</div></div>
  </div>
</section>

<section>
  <h2>03 · Neutral / Graphite Hierarchy</h2>
  ${hierarchyStrip([['bgDeepest', D.bgDeepest], ['bgPrimary', D.bgPrimary], ['surface', D.surface], ['surfaceSubtle', D.surfaceSubtle], ['surfaceElevated', D.surfaceElevated], ['border', D.border], ['borderStrong', D.borderStrong]], 'Dark mode — 7-step neutral scale')}
  ${hierarchyStrip([['bgDeepest', L.bgDeepest], ['bgPrimary', L.bgPrimary], ['surface', L.surface], ['surfaceSubtle', L.surfaceSubtle], ['surfaceElevated', L.surfaceElevated], ['border', L.border], ['borderStrong', L.borderStrong]], 'Light mode — 7-step neutral scale')}
</section>

<section>
  <h2>04 · Mint / Signal Hierarchy</h2>
  ${hierarchyStrip([['primary', D.signalPrimary], ['hover', D.signalHover], ['pressed', D.signalPressed], ['subtleBg', D.signalSubtleBg], ['border', D.signalBorder], ['textOnLight', D.signalTextOnLight]], 'Dark mode — signal scale')}
  ${hierarchyStrip([['primary', L.signalPrimary], ['hover', L.signalHover], ['pressed', L.signalPressed], ['subtleBg', L.signalSubtleBg], ['border', L.signalBorder], ['textOnLight', L.signalTextOnLight]], 'Light mode — signal scale')}
  <p class="rule-text">Tuned down from the exploration-round mint (#29F0C6, HSL 167°/87%/55%) to a calmer, controlled tone (dark primary #24BC99, HSL 166°/68%/44%) — proprietary and legible without reading as fluorescent or neon.</p>
</section>

<section>
  <h2>05 · Logo — Permitted Color Applications</h2>
  <div class="logoTiles">
    <div class="logoTileWrap"><div class="logoTile light">${fitTo(recolorMaster('#000000'), 260)}</div><div class="lbl">PRIMARY: black on light</div></div>
    <div class="logoTileWrap"><div class="logoTile" style="background:${D.bgPrimary}">${fitTo(recolorMaster('#FFFFFF'), 260)}</div><div class="lbl">PRIMARY: white on dark</div></div>
    <div class="logoTileWrap"><div class="logoTile" style="background:${D.signalPrimary}">${fitTo(recolorMaster('#FFFFFF'), 260)}</div><div class="lbl warn">SECONDARY/CONTROLLED: white on signal — sparingly</div></div>
    <div class="logoTileWrap"><div class="logoTile light">${fitTo(recolorMaster(D.signalPrimary), 260)}</div><div class="lbl warn">SECONDARY/CONTROLLED: signal on light — sparingly, never default</div></div>
  </div>
</section>

<section>
  <h2>06 · Light-Mode Product Example</h2>
  <div class="uiMock" style="background:${L.bgPrimary}">
    <div class="uiTop" style="background:${L.surfaceElevated};border-bottom:1px solid ${L.border}">
      <div class="uiBrand"><div class="uiLogoTile" style="background:${L.textPrimary};color:#fff">ش</div><b style="color:${L.textPrimary}">شغّل</b></div>
      <div class="uiNav"><button style="background:${L.surface};color:${L.textPrimary}">الرئيسية</button><button style="background:${L.surface};color:${L.textPrimary}">Business Brain</button><button style="background:${L.surface};color:${L.textPrimary}">السجل</button></div>
    </div>
    <div class="uiBody">
      <div class="uiH1" style="color:${L.textPrimary}">مشروعك.<br>لكن أسرع.</div>
      <p class="uiP" style="color:${L.textSecondary}">جهّز بيانات مشروعك مرة واحدة في Business Brain، وشغّل ست أدوات تساعدك تنجز.</p>
      <div class="btnRow" style="margin-bottom:20px">${btn(L.cta, L.ctaText, 'ابدأ')}${btn(L.surface, L.textPrimary, 'Demo')}</div>
      <div class="uiGrid">
        <div class="uiCard" style="background:${L.surface};border:1px solid ${L.border}"><b style="color:${L.textPrimary}">🗓️ سوّ محتوى</b><span style="color:${L.textSecondary}">خطة محتوى مرتبطة بهدف مشروعك.</span></div>
        <div class="uiCard" style="background:${L.surface};border:1px solid ${L.border}"><b style="color:${L.textPrimary}">✍️ اكتب لي</b><span style="color:${L.textSecondary}">Caption، إعلان، WhatsApp ووصف منتج.</span></div>
        <div class="uiCard" style="background:${L.surfaceSubtle};border:2px solid ${L.border}"><b style="color:${L.textPrimary}">💬 رد على عميل</b><span style="color:${L.textMuted}">بيع، اعتراض، متابعة أو شكوى.</span></div>
      </div>
    </div>
  </div>
</section>

<section style="background:${D.bgPrimary}">
  <h2 style="color:#999">07 · Dark-Mode Product Example</h2>
  <div class="uiMock" style="background:${D.bgPrimary};border-color:${D.border}">
    <div class="uiTop" style="background:${D.surfaceElevated};border-bottom:1px solid ${D.border}">
      <div class="uiBrand"><div class="uiLogoTile" style="background:${D.textPrimary};color:${D.bgPrimary}">ش</div><b style="color:${D.textPrimary}">شغّل</b></div>
      <div class="uiNav"><button style="background:${D.surface};color:${D.textPrimary}">الرئيسية</button><button style="background:${D.surfaceSubtle};color:${D.signalPrimary};box-shadow:inset 0 0 0 1px ${D.signalPrimary}">Business Brain</button><button style="background:${D.surface};color:${D.textPrimary}">السجل</button></div>
    </div>
    <div class="uiBody">
      <div class="uiH1" style="color:${D.textPrimary}">مشروعك.<br>لكن أسرع.</div>
      <p class="uiP" style="color:${D.textSecondary}">جهّز بيانات مشروعك مرة واحدة في Business Brain، وشغّل ست أدوات تساعدك تنجز.</p>
      <div class="btnRow" style="margin-bottom:20px">${btn(D.cta, D.ctaText, 'ابدأ')}${btn(D.surface, D.textPrimary, 'Demo')}</div>
      <div class="uiGrid">
        <div class="uiCard" style="background:${D.surface};border:1px solid ${D.border}"><b style="color:${D.textPrimary}">🗓️ سوّ محتوى</b><span style="color:${D.textSecondary}">خطة محتوى مرتبطة بهدف مشروعك.</span></div>
        <div class="uiCard" style="background:${D.surface};border:1px solid ${D.border}"><b style="color:${D.textPrimary}">✍️ اكتب لي</b><span style="color:${D.textSecondary}">Caption، إعلان، WhatsApp ووصف منتج.</span></div>
        <div class="uiCard" style="background:${D.surfaceSubtle};border:1px solid ${D.signalPrimary}"><b style="color:${D.textPrimary}">💬 رد على عميل</b><span style="color:${D.textMuted}">بيع، اعتراض، متابعة أو شكوى.</span></div>
      </div>
    </div>
  </div>
</section>

<section>
  <h2>08 · Business Brain Application</h2>
  <div class="uiMock" style="background:${L.surfaceElevated};border-color:${L.border}">
    <div class="uiBody">
      <div class="uiH1" style="font-size:22px;color:${L.textPrimary}">Business Brain</div>
      <div class="brainGrid">
        <div class="brainCell" style="background:${L.surface}"><small style="color:${L.textMuted}">name</small><b style="color:${L.textPrimary}">Brew 27</b></div>
        <div class="brainCell" style="background:${L.surface}"><small style="color:${L.textMuted}">category</small><b style="color:${L.textPrimary}">قهوة مختصة</b></div>
        <div class="brainCell" style="background:${L.surface}"><small style="color:${L.textMuted}">customer</small><b style="color:${L.textPrimary}">موظفون وطلاب 20–35</b></div>
        <div class="brainCell" style="background:${L.surface}"><small style="color:${L.textMuted}">objective</small><b style="color:${L.textPrimary}">رجوع العملاء</b></div>
      </div>
      <div class="btnRow" style="margin-top:16px">${btn(L.surface, L.textPrimary, 'تعديل')}${btn(L.cta, L.ctaText, 'ابدأ شغّل')}</div>
    </div>
  </div>
</section>

<section>
  <h2>09 · Brand Brain Application</h2>
  <div class="uiMock" style="background:${L.surfaceElevated};border-color:${L.border}">
    <div class="uiBody">
      <div class="uiH1" style="font-size:22px;color:${L.textPrimary}">Brand Brain</div>
      <p class="uiP" style="color:${L.textSecondary}">أضف هويتك مرة واحدة. تحفظ الصور على هذا المتصفح لهذا الرابط.</p>
      <div class="uiGrid" style="grid-template-columns:1fr 1fr 1fr">
        <div class="uiCard" style="background:${L.surface};border:1px solid ${L.border}"><b style="color:${L.textPrimary}">الشعار</b><span style="color:${L.textMuted}">اختياري</span></div>
        <div class="uiCard" style="background:${L.surface};border:1px solid ${L.border}"><b style="color:${L.textPrimary}">اللون الأساسي</b><span style="color:${L.signalPrimary}">${L.signalPrimary}</span></div>
        <div class="uiCard" style="background:${L.surface};border:1px solid ${L.border}"><b style="color:${L.textPrimary}">الأسلوب البصري</b><span style="color:${L.textMuted}">تصوير سعودي عصري</span></div>
      </div>
    </div>
  </div>
</section>

<section style="background:${D.bgPrimary}">
  <h2 style="color:#999">10 · Visual Studio Application</h2>
  <div class="uiMock" style="background:${D.surfaceElevated};border-color:${D.border}">
    <div class="uiBody">
      <div class="uiH1" style="font-size:22px;color:${D.textPrimary}">Visual Studio</div>
      <div class="studioRow">
        <div class="studioForm">
          <div class="studioField"><label style="color:${D.textPrimary}">المقاس</label><select style="background:${D.surface};color:${D.textPrimary};border:1px solid ${D.border}"><option>Instagram Post — 1:1</option></select></div>
          <div class="studioField"><label style="color:${D.textPrimary}">الأسلوب</label><select style="background:${D.surface};color:${D.textPrimary};border:1px solid ${D.border}"><option>Premium</option></select></div>
          <div class="btnRow" style="margin-top:6px">${btn(D.cta, D.ctaText, 'اصنع التصميم')}</div>
        </div>
        <div class="genCard" style="background:${D.surface};border:1px solid ${D.border}"><div class="ph"></div><span style="color:${D.textMuted};font-size:12px">التصميم الناتج (placeholder)</span></div>
      </div>
    </div>
  </div>
</section>

<section>
  <h2>11 · CTA / Button States</h2>
  <div class="btnRow ltr">
    ${btn(L.cta, L.ctaText, 'Primary CTA')}
    ${btn(L.ctaHover, L.ctaText, 'Hover')}
    ${btn(L.ctaPressed, L.ctaText, 'Pressed')}
    ${btn(L.surface, L.textPrimary, 'Secondary')}
    ${btn(L.disabledBg, L.disabledText, 'Disabled', 'cursor:not-allowed')}
    <span style="display:inline-block;padding:11px 18px;border-radius:12px;border:2px solid ${L.focus};font-weight:700;font-size:14px;direction:ltr;color:${L.textPrimary}">Focus ring</span>
  </div>
</section>

<section>
  <h2>12 · Form / Input / Focus States</h2>
  <div class="inputStates">
    <div class="inputDemo"><label style="color:${L.textPrimary}">Default</label><input style="background:${L.surface};border:1px solid ${L.border};color:${L.textPrimary}" placeholder="اسم المشروع"></div>
    <div class="inputDemo"><label style="color:${L.textPrimary}">Focused</label><input style="background:${L.surface};border:2px solid ${L.focus};color:${L.textPrimary}" value="Brew 27"></div>
    <div class="inputDemo"><label style="color:${L.textPrimary}">Filled</label><input style="background:${L.surface};border:1px solid ${L.border};color:${L.textPrimary}" value="قهوة مختصة"></div>
    <div class="inputDemo"><label style="color:${L.error}">Error</label><input style="background:${L.surface};border:2px solid ${L.error};color:${L.textPrimary}" value="..."><span style="font-size:12px;color:${L.error};direction:ltr">هذا الحقل مطلوب</span></div>
  </div>
</section>

<section>
  <h2>13 · Semantic States</h2>
  <div class="semRow">
    <div class="semBanner" style="background:${L.surface};border-inline-start:4px solid ${L.success};color:${L.textPrimary}"><b style="color:${L.success}">Success</b><br>تم الحفظ في السجل ✓</div>
    <div class="semBanner" style="background:${L.surface};border-inline-start:4px solid ${L.warning};color:${L.textPrimary}"><b style="color:${L.warning}">Warning</b><br>قد يحتوي الملف على بيانات حساسة.</div>
    <div class="semBanner" style="background:${L.surface};border-inline-start:4px solid ${L.error};color:${L.textPrimary}"><b style="color:${L.error}">Error</b><br>ما قدرنا نكمل المهمة.</div>
    <div class="semBanner" style="background:${L.surface};border-inline-start:4px solid ${L.info};color:${L.textPrimary}"><b style="color:${L.info}">Info</b><br>الشعار والنص يضافان بعد التوليد.</div>
  </div>
  <p class="rule-text" style="margin-top:16px">Success green sits ${Math.abs(tokens.hueMap.signalHue - tokens.hueMap.successHueDark)}° away in hue from the mint signal (dark mode) — a deliberate separation so a success confirmation is never mistaken for the brand-activation color.</p>
</section>

<section>
  <h2>14 · Favicon / App-Icon Treatment</h2>
  <div class="favSim">
    <div class="favTab" style="background:#e8e8e8">${fitTo(recolorFavicon('#000000'), 18)}<span class="t">shaghil.app</span></div>
    <div class="appIconTile">${fitTo(recolorAppIconTile(D.bgPrimary, '#fff'), 128)}</div>
    <div class="appIconTile">${fitTo(recolorAppIconTile(D.signalPrimary, D.ctaText), 128)}</div>
  </div>
  <p class="rule-text" style="margin-top:16px">Default app icon uses the black/white monochrome logo on the graphite background. The signal-colored tile is the controlled exception, reserved for contexts that call for maximum brand-activation visibility (e.g. a promotional listing).</p>
</section>

<section>
  <h2>15 · Marketing / Social Application</h2>
  <div class="socialPost" style="background:${D.bgPrimary}">
    <div class="socialInner" style="color:${D.textPrimary}">
      ${fitTo(recolorMaster('#FFFFFF'), 200)}
      <div class="tag">SHAGHIL</div>
      <div class="sub" style="color:${D.signalPrimary}">مشروعك. لكن أسرع.</div>
    </div>
  </div>
</section>

<section>
  <h2>16 · Accessibility Results (real WCAG AA contrast calculations)</h2>
  <h4>Dark mode</h4>
  <div class="accTable">${accessRows('dark')}</div>
  <h4 style="margin-top:24px">Light mode</h4>
  <div class="accTable">${accessRows('light')}</div>
</section>

<section>
  <h2>17 · Color Dominance / Usage Rule</h2>
  <p class="rule-text">${esc(tokens.dominanceRule)}</p>
  <div class="dominanceBar">
    <div style="flex:8;background:${D.textSecondary}">graphite / neutral</div>
    <div style="flex:1.5;background:${D.signalPrimary};color:${D.ctaText}">mint signal</div>
    <div style="flex:0.5;background:${D.error}">semantic</div>
  </div>
</section>

<section style="border-bottom: none;">
  <h2>18 · Do / Don't</h2>
  <div class="dodont">
    <div class="col do">
      <h3 style="color:#1a8a4a">DO</h3>
      <div class="example" style="background:${D.bgPrimary}"><div class="btnRow ltr">${btn(D.cta, D.ctaText, 'ابدأ')}</div></div>
      <p>One signal-colored CTA per screen, on a graphite background. The mint activates a single primary action.</p>
    </div>
    <div class="col dont">
      <h3 style="color:#c4291b">DON'T</h3>
      <div class="example" style="background:${D.signalPrimary};padding:24px;text-align:center;color:${D.ctaText};font-weight:800;font-size:15px;direction:ltr">FULL-BLEED MINT BACKGROUND</div>
      <p>Never use the signal color as a large background fill — it reads as neon/cheap and defeats "signal, not decoration."</p>
    </div>
  </div>
  <div class="dodont" style="margin-top:24px">
    <div class="col do">
      <h3 style="color:#1a8a4a">DO</h3>
      <div class="example light" style="background:#fff;display:flex;justify-content:center;padding:20px">${fitTo(recolorMaster('#000000'), 160)}</div>
      <p>Logo stays black on light, white on dark — the default, universal usage in nearly every context.</p>
    </div>
    <div class="col dont">
      <h3 style="color:#c4291b">DON'T</h3>
      <div class="example" style="background:${D.success};display:flex;justify-content:center;padding:20px">${fitTo(recolorMaster('#FFFFFF'), 160)}</div>
      <p>Never recolor the logo in a semantic color or any tone outside the documented black/white/controlled-signal rule.</p>
    </div>
  </div>
</section>

</div>
</body></html>`;

fs.writeFileSync(path.join(__dirname, 'SHAGHIL_COLOR_SYSTEM_FINAL.html'), html);

const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
const page = await browser.newPage({ viewport: { width: 1900, height: 1200 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.waitForTimeout(150);
const full = await page.locator('.canvas').boundingBox();
const h = Math.ceil(full.height);
await page.setViewportSize({ width: 1900, height: h });
await page.waitForTimeout(100);
const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 1900, height: h } });
fs.writeFileSync(path.join(__dirname, 'SHAGHIL_COLOR_SYSTEM_FINAL.png'), buf);
console.log('final board built, height', h);
await browser.close();
