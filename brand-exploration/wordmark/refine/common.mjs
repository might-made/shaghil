import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import fs from 'node:fs';
import { PNG } from 'pngjs';

export const WORD = 'شغّل'; // شغّل
const cwd = new URL('.', import.meta.url).pathname;

export async function renderWordPNG({ fontSize = 600, transform = '', letterSpacing = '' } = {}) {
  const html = `<!doctype html><html><head><style>
@font-face { font-family:'NKA'; src:url('file://${cwd}notokufiarabic900.woff2') format('woff2'); font-weight:900; }
html,body{margin:0;padding:0;background:#ffffff;}
#wrap{position:absolute;top:200px;left:200px;}
#w{font-family:'NKA';font-weight:900;font-size:${fontSize}px;line-height:1;color:#000;white-space:nowrap;direction:rtl;
   transform:${transform || 'none'};transform-origin:center center;${letterSpacing ? `letter-spacing:${letterSpacing};` : ''}}
</style></head><body><div id="wrap"><div id="w">${WORD}</div></div></body></html>`;

  const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 4000, height: 2000 }, deviceScaleFactor: 3 });
  await page.setContent(html);
  await page.waitForTimeout(200);
  const box = await page.locator('#w').boundingBox();
  const pad = 20;
  const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 };
  const buf = await page.screenshot({ clip });
  await browser.close();
  const png = PNG.sync.read(buf);
  return { png, box: { x: 0, y: 0, width: box.width + pad * 2, height: box.height + pad * 2 } };
}

export function svgWrap(d, { minX, minY, w, h }, opts = {}) {
  const { fill = '#000', bg = null, stroke = null, strokeWidth = 0 } = opts;
  const bgRect = bg ? `<rect x="${minX}" y="${minY}" width="${w}" height="${h}" fill="${bg}"/>` : '';
  const strokeAttr = stroke ? ` stroke="${stroke}" stroke-width="${strokeWidth}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${w} ${h}">${bgRect}<path d="${d}" fill="${fill}"${strokeAttr}/></svg>`;
}

export function bboxOfComponents(components, pad = 20) {
  const minX = Math.min(...components.map((c) => c.minX)) - pad;
  const minY = Math.min(...components.map((c) => c.minY)) - pad;
  const maxX = Math.max(...components.map((c) => c.maxX)) + pad;
  const maxY = Math.max(...components.map((c) => c.maxY)) + pad;
  return { minX, minY, w: maxX - minX, h: maxY - minY };
}

export async function screenshotSVG(svgMarkup, outPath, { width = 800, height = 800, bg = '#fff' } = {}) {
  const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:${bg}">${svgMarkup}</body></html>`);
  await page.waitForTimeout(80);
  const buf = await page.screenshot();
  fs.writeFileSync(outPath, buf);
  await browser.close();
}
