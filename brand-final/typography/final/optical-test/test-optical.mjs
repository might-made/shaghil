// Real optical-size comparison: IBM Plex Sans Arabic vs IBM Plex Sans Latin at identical
// nominal px sizes, to determine whether Arabic needs a compensating size bump for equivalent
// perceived weight/x-height — not guessed, rendered and measured.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(__dirname, '../../exploration/fonts');
function faceCss(cssFile) {
  let css = fs.readFileSync(path.join(fontsDir, cssFile), 'utf8');
  return css.replace(/url\('([^']+\.woff2)'\)/g, (m, fname) => `url('file://${path.join(fontsDir, fname)}')`);
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${faceCss('plexarabic.css')}
${faceCss('plexsans.css')}
body { margin: 0; background: #fff; padding: 40px; }
.row { display: flex; align-items: baseline; gap: 40px; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
.ar { font-family: 'IBM Plex Sans Arabic'; direction: rtl; }
.en { font-family: 'IBM Plex Sans'; direction: ltr; }
.lbl { width: 220px; font-family: Arial; font-size: 12px; color: #999; }
.ruler { position: absolute; border-top: 1px dashed red; width: 900px; }
</style></head><body>
<div class="row"><div class="lbl">16px / weight 400, no compensation</div><div class="ar" style="font-size:16px;font-weight:400">مشروعك. لكن أسرع.</div><div class="en" style="font-size:16px;font-weight:400">Your project. Faster.</div></div>
<div class="row"><div class="lbl">16px ar / 15px en (Arabic +1px)</div><div class="ar" style="font-size:16px;font-weight:400">مشروعك. لكن أسرع.</div><div class="en" style="font-size:15px;font-weight:400">Your project. Faster.</div></div>
<div class="row"><div class="lbl">17px ar / 15px en (Arabic +2px, ~13%)</div><div class="ar" style="font-size:17px;font-weight:400">مشروعك. لكن أسرع.</div><div class="en" style="font-size:15px;font-weight:400">Your project. Faster.</div></div>
<div class="row"><div class="lbl">34px / weight 600, no compensation (H1)</div><div class="ar" style="font-size:34px;font-weight:600">شغّل — مشروعك</div><div class="en" style="font-size:34px;font-weight:600">SHAGHIL</div></div>
<div class="row"><div class="lbl">36px ar / 34px en (H1, Arabic +~6%)</div><div class="ar" style="font-size:36px;font-weight:600">شغّل — مشروعك</div><div class="en" style="font-size:34px;font-weight:600">SHAGHIL</div></div>
<div class="row"><div class="lbl">12px / weight 500, no compensation (caption)</div><div class="ar" style="font-size:12px;font-weight:500">تم إنشاء المحتوى بنجاح</div><div class="en" style="font-size:12px;font-weight:500">Content created successfully</div></div>
<div class="row"><div class="lbl">13px ar / 12px en (caption, Arabic +~8%)</div><div class="ar" style="font-size:13px;font-weight:500">تم إنشاء المحتوى بنجاح</div><div class="en" style="font-size:12px;font-weight:500">Content created successfully</div></div>
</body></html>`;

fs.writeFileSync(path.join(__dirname, 'optical-test.html'), html);
const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(150);
await page.screenshot({ path: path.join(__dirname, 'optical-test.png'), fullPage: true });
console.log('optical test rendered');
await browser.close();
