// Renders each direction's review-board.html in real headless Chromium at a 1600px desktop
// viewport and slices it into three PNG review files per direction (brand / product / web),
// per Founder instruction. This is real rendered visual QA, not DOM/jsdom validation.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import path from 'node:path';

const dirs = ['01-operator', '02-craftsman', '03-kinetic'];

async function clipFor(page, startSel, endSel) {
  return page.evaluate(([s, e]) => {
    const start = document.querySelector(`[data-capture="${s}"]`).getBoundingClientRect();
    const end = document.querySelector(`[data-capture="${e}"]`).getBoundingClientRect();
    const top = start.top + window.scrollY;
    const bottom = end.bottom + window.scrollY;
    return { x: 0, y: top, width: document.documentElement.scrollWidth, height: bottom - top };
  }, [startSel, endSel]);
}

const browser = await chromium.launch();
for (const d of dirs) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  const file = 'file://' + path.resolve('brand-exploration', d, 'review-board.html');
  await page.goto(file);
  await page.waitForTimeout(1200); // let Google Fonts finish applying

  const full = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
  await page.setViewportSize({ width: 1600, height: full.h });
  await page.waitForTimeout(200);

  const brandClip = await clipFor(page, 'brand-start', 'brand-end');
  const productClip = await clipFor(page, 'product-start', 'product-end');
  const webClip = await clipFor(page, 'web-start', 'web-end');

  const slug = d.split('-')[1];
  await page.screenshot({ path: `brand-exploration/${d}/${d}-brand.png`, clip: brandClip });
  await page.screenshot({ path: `brand-exploration/${d}/${d}-product.png`, clip: productClip });
  await page.screenshot({ path: `brand-exploration/${d}/${d}-web.png`, clip: webClip });
  console.log(d, 'clips', { brandClip, productClip, webClip });
  await page.close();
}
await browser.close();
console.log('done');
