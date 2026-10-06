// SHGHIL V4.1 — permanent real-browser regression test for the Sales Growth Mission reference
// flow (the one mission implemented end to end this release), using real Chromium via Playwright
// rather than the jsdom+vm harness every other scripts/qa-*.mjs file uses. Same philosophy as the
// V4 Product Selector E2E (scripts/qa-v26-product-selector-e2e.mjs): drive the REAL persistence
// -> UI -> request -> context wiring end to end, mocking only the unavoidable external AI/network
// boundary (/api/generate, /api/visual) — never the internal mission/context/product wiring this
// test exists to prove.
//
// Deliberately NOT part of `npm run qa` (scripts/qa.mjs), and not wired into it: that suite is
// the project's zero-install QA architecture (jsdom + fake-indexeddb only), and must stay that
// way. This file requires Playwright's Chromium to be installed once (`npx playwright install
// chromium`), so it runs on its own via `npm run qa:e2e`. See the V4.1 report for the exact
// result of running this against the shipped code.
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };

function startStaticServer(root, port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const urlPath = decodeURIComponent(req.url.split('?')[0]);
        const filePath = path.join(root, urlPath === '/' ? '/index.html' : urlPath);
        if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.writeHead(404); return res.end('not found'); }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } catch (e) { res.writeHead(500); res.end(String(e)); }
    });
    server.on('error', reject);
    server.listen(port, () => resolve(server));
  });
}

// A real, valid minimal JPEG — responseBlob() (lib/visual-canvas.mjs) requires mime 'image/jpeg'
// specifically, matching the real /api/visual contract.
const MOCK_JPEG_BASE64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMDAwMDAwMDAwMEBAMEBQgFBQUFCgoICAoKCgsLCwsLCwsLDA4ODg0MDA4PDw8QEhISFBQTFBYWGBgZGSMlJSX/2wBDAQMEBAUFBQoHBwoNDQ4NEBAQEBAQEBAQEBAQEA//wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/APn+iiigD//Z';

async function main() {
  const port = 8980 + Math.floor(Math.random() * 500);
  const server = await startStaticServer(ROOT, port);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push('pageerror: ' + err.message));

    const capturedBodies = [];
    await page.route('**/api/generate', async route => {
      const body = JSON.parse(route.request().postData());
      capturedBodies.push(body);
      const text = body.engine === 'campaign' ? '## الفكرة الرئيسية\nحملة خصم نهاية الأسبوع\n\n## whatsapp_broadcast\nعرض خاص لعملائنا!' : '## اليوم 1\nمحتوى تجريبي';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text }) });
    });
    await page.route('**/api/visual', async route => {
      const body = JSON.parse(route.request().postData());
      capturedBodies.push({ ...body, __visual: true });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ base64: MOCK_JPEG_BASE64, mime: 'image/jpeg', model: 'mock', direction: 0 }) });
    });

    await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
    await page.evaluate(() => { setPilotKey('test-key'); hidePilotGate(); });

    // 1. Create/load a business.
    await page.evaluate(() => { demo(); });
    await page.waitForTimeout(50);

    // 2. Establish Business Memory is implicit in demo(); nothing further to do — real stored data.

    // 3. Create at least one real Product Library item through the real persistence path.
    await page.evaluate(() => { productLibraryScreen(); });
    await page.fill('#productName', 'منظم شنطة السفر');
    await page.setInputFiles('#productImage', { name: 'bag.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64') });
    await page.waitForFunction(() => !document.getElementById('productPreviewWrap').classList.contains('hidden'));
    await page.click('#productSave');
    await page.waitForFunction(() => document.getElementById('productStatus').textContent.includes('تم حفظ'));
    const productId = await page.evaluate(async () => (await globalThis.Products.list())[0].id);
    assert.ok(productId, 'a real stable product id must exist after saving through the real form');

    // 4. Open Outcome Home.
    await page.evaluate(() => { outcomeHome(); });
    assert.equal(await page.evaluate(() => document.getElementById('outcomeHome').classList.contains('hidden')), false, 'Outcome Home must open');

    // 5. Select "أبغى أزيد المبيعات".
    await page.evaluate(() => { Mission.start('sales'); });
    await page.waitForTimeout(30);
    assert.equal(await page.evaluate(() => document.getElementById('missionSales').classList.contains('hidden')), false, 'the Sales Growth Mission screen must open');

    // 6. Verify real product/context is available (not fabricated) before generating anything.
    const rec = await page.evaluate(() => ({
      product: document.getElementById('missionProductName').textContent,
      audience: document.getElementById('missionAudience').textContent,
      selectValue: document.getElementById('missionProductSelect').value
    }));
    assert.ok(rec.product.includes('منظم شنطة السفر'), 'the recommendation must show the real, just-created product (never fabricated)');
    assert.equal(rec.selectValue, productId, 'the deterministic single-product preselection must use the real stable id');
    assert.ok(rec.audience.includes('موظفون وطلاب'), 'the recommendation must show the real stored audience from Business Memory');

    // 7. Generate/retrieve recommendation -> 8. approve campaign plan.
    await page.evaluate(() => { Mission.goToPlan(); });
    assert.equal(await page.evaluate(() => document.getElementById('missionStepPlan').classList.contains('hidden')), false, 'the Campaign Plan step must open');
    await page.evaluate(() => { Mission.approvePlan(); });
    for (let i = 0; i < 100 && (await page.evaluate(() => document.getElementById('missionResult').classList.contains('hidden'))); i++) await page.waitForTimeout(100);

    // 9. Verify the orchestration request carries the correct business/product context.
    const campaignBody = capturedBodies.find(b => b.engine === 'campaign');
    assert.ok(campaignBody, 'approving the plan must send a real request to the existing campaign engine');
    assert.equal(campaignBody.product?.id, productId, 'the orchestration request must carry the real selected stable product id, never a guess');
    assert.ok(!Object.hasOwn(campaignBody.product || {}, 'image') && !Object.hasOwn(campaignBody.product || {}, 'reference'), 'the text-orchestration request must never carry product image/reference data');
    const visualBody = capturedBodies.find(b => b.__visual);
    assert.ok(visualBody, 'approving the plan must also orchestrate the existing Visual Studio pipeline for a product with a real image');

    // 10. Verify the Unified Mission Result renders with real generated sections.
    const result = await page.evaluate(() => ({
      hidden: document.getElementById('missionResult').classList.contains('hidden'),
      campaign: document.getElementById('missionCampaignOut').innerHTML,
      content: document.getElementById('missionContentOut').innerHTML,
      visual: document.getElementById('missionVisualOut').innerHTML
    }));
    assert.equal(result.hidden, false, 'the Unified Mission Result must be visible after approval');
    assert.ok(result.campaign.includes('نهاية الأسبوع'), 'the result must show the real generated campaign text, not a placeholder');
    assert.ok(result.content.includes('محتوى تجريبي'), 'the result must show the real generated content text, not a placeholder');
    assert.ok(result.visual.includes('<img'), 'the result must show a real generated design image for a product with a real image');

    // Approving the campaign must reuse the existing history mechanism (no new storage schema).
    await page.evaluate(() => { Mission.approveCampaign(); });
    const history = await page.evaluate(() => JSON.parse(localStorage.getItem('shaghilHistory') || '[]'));
    assert.equal(history[0]?.engine, 'campaign', 'approving the campaign must reuse the existing shaghilHistory persistence');

    // No autonomous Business Memory mutation: the stored brain must still be exactly what demo() set.
    const brainName = await page.evaluate(() => JSON.parse(localStorage.getItem('brain')).name);
    assert.equal(brainName, 'تحميص ٢٧', 'running the full mission end to end must never mutate stored Business Memory facts');

    assert.deepEqual(consoleErrors, [], 'no console errors anywhere in the real-browser run');

    console.log('PASS: real-browser E2E — Outcome Home -> Sales Growth Mission -> recommendation (real product/context) -> plan -> orchestration (existing campaign/content/visual capabilities) -> Unified Mission Result -> approve, with the real selected stable product id carried through, and zero Business Memory mutation');
  } finally {
    await browser.close();
    server.close();
  }
}

await main();
console.log('\nPASS: SHGHIL V4.1 real-browser Sales Growth Mission E2E');
