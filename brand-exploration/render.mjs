// Generates three fully self-contained review-board HTML files (no relative sibling
// dependencies — everything inline) from one shared template, so structure/scale/polish
// are guaranteed identical and only the injected tokens differ.
import fs from 'node:fs';

const directions = [
  {
    slug: '01-operator', num: '01', nameAr: 'المُشغّل', nameEn: 'The Operator',
    personality: 'A precision control panel. You don’t chat with it, you operate it.',
    bg:'#0F1113', surface:'#1A1D20', surface2:'#20242A', fg:'#F3F1EC', muted:'#8C949B', border:'#2B3034',
    brand:'#E8873A', brandOn:'#12100D', secondary:'#B08D57', success:'#3F9E6B', warning:'#D9A441', error:'#D14343',
    fontArDisplay:"'Noto Kufi Arabic',sans-serif", fontArBody:"'IBM Plex Sans Arabic',sans-serif",
    fontEnDisplay:"'Space Grotesk',sans-serif", fontEnUi:"'IBM Plex Sans',sans-serif",
    googleFonts:'Noto+Kufi+Arabic:wght@400;700;900&family=IBM+Plex+Sans+Arabic:wght@400;500;700&family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600',
    enTracking:'.04em', enCase:'uppercase',
    radiusLg:'18px', radiusMd:'10px', radiusBtn:'8px', radiusPill:'18px',
    markLabel:'Base bar + 3-position indicator tick, abstracted from ش',
    mark:(s)=>`<svg viewBox="0 0 64 64" width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="14" fill="#0F1113"/>
      <rect x="14" y="40" width="36" height="8" rx="2" fill="#F3F1EC"/>
      <rect x="16" y="20" width="7" height="12" rx="1.5" fill="#5B6268"/>
      <rect x="28.5" y="14" width="7" height="18" rx="1.5" fill="#E8873A"/>
      <rect x="41" y="20" width="7" height="12" rx="1.5" fill="#5B6268"/>
    </svg>`,
    icons:(c)=>[
      `<svg width="34" height="34" viewBox="0 0 34 34"><rect x="6" y="22" width="22" height="5" rx="2" fill="${c}"/><rect x="9" y="10" width="5" height="10" rx="1.5" fill="${c}"/><rect x="20" y="6" width="5" height="14" rx="1.5" fill="#E8873A"/></svg>`,
      `<svg width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="12" fill="none" stroke="${c}" stroke-width="3"/><line x1="17" y1="17" x2="24" y2="10" stroke="#E8873A" stroke-width="3" stroke-linecap="round"/></svg>`,
      `<svg width="34" height="34" viewBox="0 0 34 34"><rect x="5" y="14" width="7" height="7" fill="${c}"/><rect x="14" y="14" width="7" height="7" fill="${c}"/><rect x="23" y="14" width="7" height="7" fill="#E8873A"/></svg>`
    ],
    motionName:'Snap', motionCaption:'Instant, stepped state changes — like a switch flipping. No ease, no bounce.',
    motionCss:'@keyframes anim{0%,45%{transform:scale(1)}50%,95%{transform:scale(.8)}100%{transform:scale(1)}}',
    motionTiming:'1.6s steps(1) infinite',
  },
  {
    slug: '02-craftsman', num: '02', nameAr: 'الحِرفي', nameEn: 'The Craftsman',
    personality: 'A skilled operator’s workshop. Precision through craft, not machinery.',
    bg:'#1C1712', surface:'#262019', surface2:'#2E2620', fg:'#F5EEE1', muted:'#A6957E', border:'#3A3126',
    brand:'#B8563A', brandOn:'#F5EEE1', secondary:'#2B6C63', success:'#6B8E4E', warning:'#C98A3B', error:'#B23B3B',
    fontArDisplay:"'Almarai',sans-serif", fontArBody:"'Almarai',sans-serif",
    fontEnDisplay:"'Manrope',sans-serif", fontEnUi:"'Manrope',sans-serif",
    googleFonts:'Almarai:wght@400;700;800&family=Manrope:wght@400;600;700',
    enTracking:'0', enCase:'none',
    radiusLg:'26px', radiusMd:'16px', radiusBtn:'16px', radiusPill:'28px',
    markLabel:'Stamped seal — one curved stroke + one dot, abstracted from ش',
    mark:(s)=>`<svg viewBox="0 0 64 64" width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#1C1712" stroke="#3A3126" stroke-width="1"/>
      <path d="M18 40 Q32 48 46 38" stroke="#F5EEE1" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="32" cy="20" r="4.5" fill="#B8563A"/>
    </svg>`,
    icons:(c)=>[
      `<svg width="34" height="34" viewBox="0 0 34 34"><path d="M6 22 Q17 28 28 20" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="17" cy="10" r="3" fill="#B8563A"/></svg>`,
      `<svg width="34" height="34" viewBox="0 0 34 34"><rect x="7" y="7" width="20" height="20" rx="6" fill="none" stroke="${c}" stroke-width="3"/><circle cx="17" cy="17" r="4" fill="#B8563A"/></svg>`,
      `<svg width="34" height="34" viewBox="0 0 34 34"><path d="M8 24 L17 8 L26 24 Z" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/></svg>`
    ],
    motionName:'Settle', motionCaption:'Transitions ease out gently, like something placed down with care.',
    motionCss:'@keyframes anim{0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(6px);opacity:.7}}',
    motionTiming:'2s ease-in-out infinite',
  },
  {
    slug: '03-kinetic', num: '03', nameAr: 'الحركة', nameEn: 'Kinetic Execution',
    personality: 'Pure momentum. Get it moving, now.',
    bg:'#0E1012', surface:'#181B1F', surface2:'#20242A', fg:'#F6F4EF', muted:'#AAB0B6', border:'#2D333A',
    brand:'#2F5AF0', brandOn:'#F6F4EF', secondary:'#5B6268', success:'#4C9A6A', warning:'#D9A441', error:'#E1483B',
    fontArDisplay:"'Tajawal',sans-serif", fontArBody:"'Tajawal',sans-serif",
    fontEnDisplay:"'Sora',sans-serif", fontEnUi:"'Inter',sans-serif",
    googleFonts:'Tajawal:wght@400;500;700;900&family=Sora:wght@500;700&family=Inter:wght@400;500;600',
    enTracking:'-.01em', enCase:'none',
    radiusLg:'10px', radiusMd:'6px', radiusBtn:'6px', radiusPill:'12px',
    markLabel:'Diagonal execution stroke + base notch, abstracted from ش',
    mark:(s)=>`<svg viewBox="0 0 64 64" width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="10" fill="#0E1012"/>
      <path d="M20 44 L34 18 L42 18 L28 44 Z" fill="#2F5AF0"/>
      <rect x="18" y="46" width="16" height="5" rx="2.5" fill="#F6F4EF"/>
    </svg>`,
    icons:(c)=>[
      `<svg width="34" height="34" viewBox="0 0 34 34"><path d="M8 26 L26 8" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M18 8 L26 8 L26 16" stroke="#2F5AF0" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      `<svg width="34" height="34" viewBox="0 0 34 34"><rect x="7" y="14" width="20" height="6" rx="3" fill="${c}"/><rect x="7" y="14" width="12" height="6" rx="3" fill="#2F5AF0"/></svg>`,
      `<svg width="34" height="34" viewBox="0 0 34 34"><path d="M9 24 L17 10 L25 24 Z" fill="#2F5AF0"/></svg>`
    ],
    motionName:'Directional / Fast', motionCaption:'Short, fixed-distance movement along the mark’s diagonal. No overshoot.',
    motionCss:'@keyframes anim{0%,100%{transform:translate(0,0)}50%{transform:translate(7px,-7px)}}',
    motionTiming:'1.1s cubic-bezier(.2,.8,.2,1) infinite',
  },
];

const esc = s => s;

function template(d) {
  const icons = d.icons(d.fg);
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SHAGHIL Direction ${d.num} — ${d.nameAr} / ${d.nameEn}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${d.googleFonts}&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:${d.bg};width:1600px}
body{font-family:${d.fontArBody};color:${d.fg}}
.canvas{width:1600px;margin:0 auto}
.section{padding:100px 90px;border-bottom:1px solid ${d.border}}
.eyebrow{font-family:${d.fontEnUi};font-size:14px;letter-spacing:.18em;text-transform:uppercase;color:${d.muted};margin-bottom:18px}
h2.title{font-family:${d.fontEnUi};font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:${d.muted};margin:0 0 46px}

/* SECTION 1: HERO */
#hero{padding:140px 90px;text-align:center;background:${d.bg}}
#hero .mark{margin:0 auto 44px}
#hero .ar{font-family:${d.fontArDisplay};font-size:150px;line-height:1;margin:0 0 20px;font-weight:900}
#hero .en{font-family:${d.fontEnDisplay};font-size:54px;letter-spacing:${d.enTracking};text-transform:${d.enCase};margin:0 0 28px;color:${d.muted}}
#hero .personality{font-family:${d.fontEnUi};font-size:20px;color:${d.muted};max-width:760px;margin:0 auto 36px}
#hero .endorse{font-family:${d.fontEnUi};font-size:14px;letter-spacing:.1em;color:${d.muted};text-transform:uppercase}

/* SECTION 2: LOGO SYSTEM */
.logo-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px}
.logo-panel{border-radius:${d.radiusLg};padding:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;min-height:320px}
.logo-panel.dark{background:${d.bg};border:1px solid ${d.border}}
.logo-panel.light{background:${d.fg};color:${d.bg}}
.logo-panel .ar{font-family:${d.fontArDisplay};font-size:88px;font-weight:900}
.logo-panel .en{font-family:${d.fontEnDisplay};font-size:34px;letter-spacing:${d.enTracking};text-transform:${d.enCase}}
.logo-panel.light .en{color:${d.bg};opacity:.55}
.logo-panel.dark .en{color:${d.muted}}
.logo-full{grid-column:1/-1;background:${d.surface};border:1px solid ${d.border};border-radius:${d.radiusLg};padding:70px;display:flex;align-items:center;justify-content:center;gap:40px}
.logo-full .ar{font-family:${d.fontArDisplay};font-size:100px;font-weight:900}
.logo-full .lockup{display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.logo-full .en{font-family:${d.fontEnDisplay};font-size:30px;letter-spacing:${d.enTracking};text-transform:${d.enCase};color:${d.muted}}
.logo-full .cap{font-family:${d.fontEnUi};font-size:13px;color:${d.muted};letter-spacing:.08em;text-transform:uppercase;max-width:260px;white-space:normal}

/* SECTION 3: COLOR PALETTE */
.swatch-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.swatch{border-radius:${d.radiusLg};overflow:hidden;border:1px solid ${d.border}}
.swatch .chip{height:200px;display:flex;align-items:flex-end;padding:20px}
.swatch .chip span{font-family:${d.fontEnUi};font-size:15px;font-weight:600;background:rgba(0,0,0,.35);color:#fff;padding:6px 12px;border-radius:8px}
.swatch .meta{background:${d.surface};padding:20px 22px}
.swatch .meta b{font-family:${d.fontEnUi};font-size:18px;display:block}
.swatch .meta span{font-family:${d.fontEnUi};font-size:14px;color:${d.muted}}

/* SECTION 4: TYPOGRAPHY */
.type-block{margin-bottom:56px}
.type-block .ar-display{font-family:${d.fontArDisplay};font-size:96px;font-weight:900;line-height:1.1;margin-bottom:10px}
.type-block .ar-h1{font-family:${d.fontArDisplay};font-size:52px;font-weight:700;margin-bottom:10px}
.type-block .ar-body{font-family:${d.fontArBody};font-size:26px;line-height:1.7;color:${d.fg};max-width:900px}
.type-block .ar-ui{font-family:${d.fontArBody};font-size:20px;font-weight:700;color:${d.brand}}
.type-block .en-display{font-family:${d.fontEnDisplay};font-size:72px;letter-spacing:${d.enTracking};text-transform:${d.enCase};margin-bottom:8px}
.type-block .en-body{font-family:${d.fontEnUi};font-size:24px;color:${d.muted}}
.type-tag{font-family:${d.fontEnUi};font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:${d.muted};margin-bottom:14px}

/* SECTION 5: APP ICON */
.icon-row-big{display:flex;align-items:center;gap:60px;flex-wrap:wrap}
.icon-cell{display:flex;flex-direction:column;align-items:center;gap:16px}
.icon-cell .cap{font-family:${d.fontEnUi};font-size:14px;color:${d.muted}}
.app-icon-big{border-radius:34px;background:${d.surface};border:1px solid ${d.border};display:flex;align-items:center;justify-content:center;padding:22px}
.tab-mock{display:inline-flex;align-items:center;gap:10px;background:#e8e8e8;border-radius:10px 10px 0 0;padding:12px 20px;font-family:${d.fontEnUi};font-size:15px;color:#222}
.avatar-big{border-radius:50%;background:${d.surface};border:1px solid ${d.border};display:flex;align-items:center;justify-content:center;padding:18px}

/* SECTION 6: PRODUCT UI MOCKUP */
.device{background:${d.bg};border:1px solid ${d.border};border-radius:20px;padding:36px;max-width:1200px;margin:0 auto}
.device .topbar{display:flex;justify-content:space-between;align-items:center;background:${d.surface};border:1px solid ${d.border};border-radius:${d.radiusPill};padding:18px 28px;margin-bottom:28px}
.device .brand{display:flex;align-items:center;gap:16px}
.device .brand b{font-family:${d.fontArDisplay};font-size:26px;font-weight:900}
.device .navbtns{display:flex;gap:14px}
.device .btn{font-family:${d.fontArBody};border-radius:${d.radiusBtn};padding:14px 22px;font-size:16px;font-weight:700;border:1px solid ${d.border};background:${d.surface};color:${d.fg}}
.device .btn.primary{background:${d.brand};color:${d.brandOn};border:0}
.device .cardrow{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-bottom:24px}
.device .card{background:${d.surface};border:1px solid ${d.border};border-radius:${d.radiusLg};padding:28px}
.device .card b{font-family:${d.fontArDisplay};font-size:22px;display:block;margin-bottom:10px}
.device .card span{color:${d.muted};font-size:16px}
.device label{font-size:14px;color:${d.muted};display:block;margin-bottom:10px;font-family:${d.fontEnUi}}
.device input{width:100%;background:${d.bg};border:1px solid ${d.border};border-radius:${d.radiusMd};padding:16px;color:${d.fg};font-family:${d.fontArBody};font-size:16px;margin-bottom:20px}
.device .status{display:flex;align-items:center;gap:12px;font-size:15px;color:${d.muted};margin-bottom:20px}
.device .dot{width:10px;height:10px;border-radius:50%;background:${d.brand}}
.device .result{background:${d.bg};border:1px solid ${d.border};border-radius:${d.radiusMd};padding:26px}
.device .result h3{font-family:${d.fontArDisplay};font-size:22px;margin:0 0 12px}
.device .result p{font-size:16px;line-height:1.8;margin:0 0 18px}
.device .actions{display:flex;gap:14px}

/* SECTION 7: VISUAL STUDIO MOCKUP */
.vsframe{background:${d.bg};border:1px solid ${d.border};border-radius:20px;padding:36px;max-width:1200px;margin:0 auto}
.vsframe .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:26px}
.vsframe .head b{font-family:${d.fontArDisplay};font-size:26px;font-weight:900}
.vsframe .grid2{display:grid;grid-template-columns:1fr 1fr;gap:26px}
.vsframe .thumb{aspect-ratio:1;background:${d.surface};border:2px dashed ${d.border};border-radius:${d.radiusLg};display:flex;align-items:center;justify-content:center;color:${d.muted};font-size:16px}
.vsframe .controls label{font-size:14px;color:${d.muted};display:block;margin:16px 0 8px;font-family:${d.fontEnUi}}
.vsframe .fs{background:${d.surface};border:1px solid ${d.border};border-radius:${d.radiusMd};padding:14px;font-size:16px;font-family:${d.fontArBody}}
.vsframe .genbtn{margin-top:24px;width:100%;background:${d.brand};color:${d.brandOn};border:0;border-radius:${d.radiusBtn};padding:18px;font-weight:700;font-family:${d.fontArBody};font-size:18px}
.vsframe .loading{margin-top:16px;font-size:15px;color:${d.muted};display:flex;align-items:center;gap:10px}
.spin{width:16px;height:16px;border-radius:50%;border:3px solid ${d.border};border-top-color:${d.brand};animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.vsframe .resultvisual{margin:20px auto 0;max-width:460px;aspect-ratio:1;background:${d.surface};border:1px solid ${d.border};border-radius:${d.radiusLg};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:${d.muted};font-size:15px}

/* SECTION 8: WEBSITE HERO */
.webhero{background:${d.bg};padding:160px 80px;text-align:center}
.webhero .mark{margin:0 auto 40px}
.webhero h1{font-family:${d.fontArDisplay};font-size:120px;font-weight:900;margin:0 0 22px}
.webhero .tag{font-family:${d.fontArBody};font-size:30px;color:${d.muted};margin:0 0 44px}
.webhero .flow{font-family:${d.fontEnUi};font-size:16px;letter-spacing:.1em;color:${d.muted};margin-bottom:50px}
.webhero .cta{display:inline-block;background:${d.brand};color:${d.brandOn};border-radius:${d.radiusBtn};padding:24px 56px;font-weight:700;font-family:${d.fontArBody};font-size:24px}
.webhero .endorse{margin-top:34px;font-family:${d.fontEnUi};font-size:14px;color:${d.muted};letter-spacing:.1em;text-transform:uppercase}

/* SECTION 9: BRAND LANGUAGE */
.lang-row{display:flex;align-items:center;gap:50px;flex-wrap:wrap;margin-bottom:44px}
.lang-card{width:180px;height:120px;background:${d.surface};border:1px solid ${d.border};border-radius:${d.radiusLg}}
.lang-btn{width:180px;height:60px;background:${d.brand};border-radius:${d.radiusBtn};display:flex;align-items:center;justify-content:center;color:${d.brandOn};font-family:${d.fontArBody};font-weight:700;font-size:18px}
.lang-btn2{width:180px;height:60px;background:${d.surface};border:1px solid ${d.border};border-radius:${d.radiusBtn};display:flex;align-items:center;justify-content:center;color:${d.fg};font-family:${d.fontArBody};font-weight:700;font-size:18px}
.lang-input{width:220px;height:60px;background:${d.surface};border:1px solid ${d.border};border-radius:${d.radiusMd}}
.lang-divider{width:100%;height:2px;background:${d.border}}
.status-dot-row{display:flex;gap:40px;align-items:center}
.status-dot-row .dot{width:22px;height:22px;border-radius:50%}
.status-dot-row .cap{font-family:${d.fontEnUi};font-size:14px;color:${d.muted}}

.motion-row{display:flex;align-items:center;gap:40px}
.motion-box{width:80px;height:80px;border-radius:${d.radiusLg};background:${d.brand};animation:anim ${d.motionTiming}}
${d.motionCss}
.motion-cap{font-family:${d.fontEnUi};font-size:18px;color:${d.muted};max-width:600px}
</style>
</head>
<body>
<div class="canvas">

<section id="hero" data-capture="brand-start">
  <div class="mark">${d.mark(140)}</div>
  <div class="ar">شغّل</div>
  <div class="en">SHAGHIL</div>
  <div class="personality">Direction ${d.num} — ${d.nameAr} / ${d.nameEn}<br>${d.personality}</div>
  <div class="endorse">by MIGHT MADE</div>
</section>

<section class="section">
  <h2 class="title">Section 2 — Logo System</h2>
  <div class="logo-grid">
    <div class="logo-panel dark"><div class="ar">شغّل</div><div class="en">SHAGHIL</div></div>
    <div class="logo-panel light"><div class="ar">شغّل</div><div class="en">SHAGHIL</div></div>
    <div class="logo-full">
      ${d.mark(120)}
      <div class="lockup">
        <span class="ar" style="font-size:64px">شغّل</span>
        <span class="en">SHAGHIL</span>
        <span class="cap">ARABIC PRIMARY · ENGLISH SECONDARY</span>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <h2 class="title">Section 3 — Color Palette</h2>
  <div class="swatch-grid">
    <div class="swatch"><div class="chip" style="background:${d.bg}"><span>${d.bg}</span></div><div class="meta"><b>Background</b><span>Base surface</span></div></div>
    <div class="swatch"><div class="chip" style="background:${d.surface}"><span>${d.surface}</span></div><div class="meta"><b>Surface</b><span>Cards / panels</span></div></div>
    <div class="swatch"><div class="chip" style="background:${d.fg};color:${d.bg}"><span style="background:rgba(255,255,255,.5);color:#111">${d.fg}</span></div><div class="meta"><b>Foreground</b><span>Primary text</span></div></div>
    <div class="swatch"><div class="chip" style="background:${d.brand}"><span>${d.brand}</span></div><div class="meta"><b>Brand Signal</b><span>Primary action only</span></div></div>
    <div class="swatch"><div class="chip" style="background:${d.secondary}"><span>${d.secondary}</span></div><div class="meta"><b>Secondary</b><span>Supporting tone</span></div></div>
    <div class="swatch"><div class="chip" style="background:${d.muted}"><span>${d.muted}</span></div><div class="meta"><b>Muted</b><span>Metadata / captions</span></div></div>
    <div class="swatch"><div class="chip" style="background:${d.success}"><span>${d.success}</span></div><div class="meta"><b>Success</b><span>Status</span></div></div>
    <div class="swatch"><div class="chip" style="background:${d.warning}"><span>${d.warning}</span></div><div class="meta"><b>Warning</b><span>Status</span></div></div>
    <div class="swatch"><div class="chip" style="background:${d.error}"><span>${d.error}</span></div><div class="meta"><b>Error</b><span>Status</span></div></div>
  </div>
</section>

<section class="section">
  <h2 class="title">Section 4 — Typography</h2>
  <div class="type-block">
    <div class="type-tag">Arabic Display</div>
    <div class="ar-display">شغّل أعمالك بذكاء</div>
  </div>
  <div class="type-block">
    <div class="type-tag">Arabic Heading</div>
    <div class="ar-h1">حوّل سياق نشاطك إلى شغل جاهز</div>
  </div>
  <div class="type-block">
    <div class="type-tag">Arabic Body</div>
    <div class="ar-body">بيانات مشروعك مأخوذة تلقائيًا من Business Brain لتشغّل ست أدوات تساعدك تنجز.</div>
  </div>
  <div class="type-block">
    <div class="type-tag">Arabic UI Label</div>
    <div class="ar-ui">حفظ في السجل</div>
  </div>
  <div class="type-block">
    <div class="type-tag">Latin Display</div>
    <div class="en-display">SHAGHIL</div>
  </div>
  <div class="type-block">
    <div class="type-tag">Latin Body / UI</div>
    <div class="en-body">Turn business context into finished work.</div>
  </div>
</section>

<section class="section" data-capture="brand-end">
  <h2 class="title">Section 5 — App Icon / Favicon / Avatar</h2>
  <div class="icon-row-big">
    <div class="icon-cell"><div class="app-icon-big">${d.mark(150)}</div><span class="cap">App icon</span></div>
    <div class="icon-cell">${d.mark(64)}<span class="cap">64px</span></div>
    <div class="icon-cell">${d.mark(32)}<span class="cap">32px</span></div>
    <div class="icon-cell">${d.mark(16)}<span class="cap">16px</span></div>
    <div class="icon-cell"><span class="tab-mock">${d.mark(18)}شغّل</span><span class="cap">Browser tab</span></div>
    <div class="icon-cell"><div class="avatar-big">${d.mark(70)}</div><span class="cap">Social avatar</span></div>
  </div>
</section>

<section class="section" data-capture="product-start">
  <h2 class="title">Section 6 — Product UI Mockup</h2>
  <div class="device">
    <div class="topbar">
      <div class="brand">${d.mark(40)}<b>شغّل</b></div>
      <div class="navbtns"><button class="btn">الرئيسية</button><button class="btn">Business Brain</button></div>
    </div>
    <div class="cardrow">
      <div class="card"><b>سوّ محتوى</b><span>خطة محتوى مرتبطة بهدف مشروعك.</span></div>
      <div class="card"><b>ابنِ عرض</b><span>عرض مقنع مبني على قيمة منتجك.</span></div>
    </div>
    <label>اسم المشروع</label>
    <input value="Visual Studio">
    <div class="status"><span class="dot"></span>جارٍ إنشاء النتيجة…</div>
    <div class="result">
      <h3>النتيجة</h3>
      <p>اليوم الأول: قهوة الصباح — منشور Instagram يعرض المنتج بإضاءة طبيعية مع CTA واضح.</p>
      <div class="actions"><button class="btn primary">حفظ في السجل</button><button class="btn">نسخة ثانية</button></div>
    </div>
  </div>
</section>

<section class="section">
  <h2 class="title">Section 7 — Visual Studio Mockup</h2>
  <div class="vsframe">
    <div class="head"><b>Visual Studio</b><span style="font-family:${d.fontEnUi};font-size:15px;color:${d.muted}">Product Library</span></div>
    <div class="grid2">
      <div>
        <div class="thumb">صورة المنتج الأصلية</div>
        <div class="controls">
          <label>المنتج من المكتبة</label>
          <div class="fs">Wash Me</div>
          <label>الحفاظ على المنتج</label>
          <div class="fs">المنتج الأصلي</div>
        </div>
      </div>
      <div>
        <div class="controls">
          <label>المقاس</label>
          <div class="fs">Instagram Post — 1:1</div>
          <label>الأسلوب</label>
          <div class="fs">Product Hero</div>
        </div>
        <button class="genbtn">اصنع التصميم</button>
        <div class="loading"><span class="spin"></span>جارٍ إنشاء صورة واحدة… (14 ثانية)</div>
      </div>
    </div>
    <div class="resultvisual"><span>التصميم الناتج</span><span>1080×1080</span></div>
  </div>
</section>

<section class="section" data-capture="product-end">
  <h2 class="title">Section 9 — Brand Language</h2>
  <div class="lang-row">
    <div class="lang-card"></div>
    <div class="lang-btn">حفظ في السجل</div>
    <div class="lang-btn2">نسخة ثانية</div>
    <div class="lang-input"></div>
    ${icons.map(i=>`<div>${i}</div>`).join('')}
  </div>
  <div class="lang-divider"></div>
  <div class="status-dot-row" style="margin-top:36px">
    <div style="display:flex;align-items:center;gap:12px"><span class="dot" style="background:${d.success}"></span><span class="cap">Success</span></div>
    <div style="display:flex;align-items:center;gap:12px"><span class="dot" style="background:${d.warning}"></span><span class="cap">Warning</span></div>
    <div style="display:flex;align-items:center;gap:12px"><span class="dot" style="background:${d.error}"></span><span class="cap">Error</span></div>
  </div>
  <div class="motion-row" style="margin-top:50px">
    <div class="motion-box"></div>
    <div class="motion-cap"><b style="color:${d.fg};font-family:${d.fontEnUi}">Motion — ${d.motionName}.</b> ${d.motionCaption}</div>
  </div>
</section>

<section class="webhero" data-capture="web-start">
  ${d.mark(110)}
  <h1>شغّل</h1>
  <p class="tag">حوّل سياق نشاطك إلى شغل جاهز.</p>
  <div class="flow">BUSINESS BRAIN → CONTENT → CAMPAIGNS → VISUALS</div>
  <a class="cta">ابدأ شغلك</a>
  <div class="endorse">by MIGHT MADE</div>
</section>
<div data-capture="web-end"></div>

</div>
</body>
</html>
`;
}

for (const d of directions) {
  const dir = `brand-exploration/${d.slug}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/review-board.html`, template(d));
  console.log('wrote', `${dir}/review-board.html`);
}
