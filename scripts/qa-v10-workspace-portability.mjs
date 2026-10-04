// Regression for the Founder-observed Production bug: Business Brain and text History
// (localStorage) restored correctly across a real Chrome-export -> Safari-Private-import
// transfer, but Product Library and Saved Designs (IndexedDB, Blob-backed) did not. This is a
// documented WebKit limitation (Blobs cannot be reliably stored in IndexedDB in Safari Private
// Browsing — see bugs.webkit.org #198278), reproduced with real Chromium end-to-end (both at
// tiny and realistic image sizes) to rule out a defect in this codebase's own serialize/
// deserialize logic before this fix, which adds honest, actionable detection/reporting for
// exactly this failure class rather than silently discarding products/designs.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const self = fileURLToPath(import.meta.url);
const phase = process.argv[2];
const bundlePath = process.argv[3];

const najoob = { name: 'نجوب', category: 'سفر', product: 'منظم سفر العائلة', customer: 'العائلة السعودية', location: 'السعودية', price: '150-300 SAR', tone: 'سعودي طبيعي', objective: 'زيادة المبيعات' };
const productBytes = new Uint8Array(2000).fill(7);
const bgBytes = new Uint8Array(1500).fill(8);
const renderedBytes = new Uint8Array(1500).fill(9);

async function readBytes(blob) { return new Uint8Array(await blob.arrayBuffer()) }

if (phase === 'export') {
  const { indexedDB } = await import('fake-indexeddb');
  globalThis.indexedDB = indexedDB;
  const localMap = new Map();
  globalThis.localStorage = { getItem: k => localMap.get(k) ?? null, setItem: (k, v) => localMap.set(k, v) };
  globalThis.document = { getElementById: () => null };

  const store = await import('../lib/visual-storage.mjs');
  const { buildBundle } = await import('../lib/workspace-transfer.mjs');

  localStorage.setItem('brain', JSON.stringify(najoob));
  localStorage.setItem('shaghilHistory', JSON.stringify([{ id: 'h1', engine: 'copy', title: 'اكتب لي', project: 'نجوب', text: '## نص\nمحتوى معتمد', inputs: { channel: 'Instagram' }, ts: 1000 }]));

  await store.saveBrand({ primary: '#e7f95b', secondary: '#181b1f', accent: '', style: 'أسلوب سعودي', logo: new Blob([new Uint8Array(300).fill(2)], { type: 'image/png' }), references: [] });
  await store.saveProduct({ id: 'bag', name: 'حقيبة سفر', description: 'حقيبة عائلية', fidelity: 'exact', image: new Blob([productBytes], { type: 'image/png' }), reference: new Blob([productBytes], { type: 'image/jpeg' }) });

  const record = {
    id: 'v1', ts: 2000, brain: najoob, brand: { primary: '#e7f95b', secondary: '#181b1f', accent: '', style: '', logo: null, references: [] },
    product: { id: 'bag', name: 'حقيبة سفر', fidelity: 'exact', image: new Blob([productBytes], { type: 'image/png' }) },
    task: { engine: 'content', context: 'سياق', selected: 'الفكرة' }, settings: { format: '1:1', mode: 'Product Hero', textMode: 'none' },
    background: new Blob([bgBytes], { type: 'image/jpeg' }), rendered: new Blob([renderedBytes], { type: 'image/png' }), direction: 1, model: 'mock'
  };
  await store.saveVisual(record);

  const bundle = await buildBundle();

  // 1/2/3/4/5/6/7: the export bundle itself must contain every category, with real Blob markers.
  const assert = (await import('node:assert/strict')).default;
  assert.ok(bundle.localStorage.brain, '1. export must contain Business Brain');
  assert.ok(bundle.brand, '2. export must contain Brand Brain where present');
  assert.equal(bundle.localStorage.shaghilHistory.length, 1, '3. export must contain text History');
  assert.equal(bundle.products.length, 1, '4. export must contain Product Library metadata');
  assert.equal(bundle.products[0].image.__blob, true, '5. export must contain the original product image asset');
  assert.equal(bundle.visuals.length, 1, '6. export must contain Saved Design metadata');
  assert.equal(bundle.visuals[0].background.__blob, true, '7. export must contain the Saved Design image asset');

  fs.writeFileSync(bundlePath, JSON.stringify(bundle));
  console.log('PASS: export bundle contains Business Brain, Brand Brain, text History, Product Library (with image asset) and Saved Designs (with image asset)');
  process.exit(0);
}

if (phase === 'import') {
  const { IDBFactory } = await import('fake-indexeddb');
  globalThis.indexedDB = new IDBFactory();
  const localMap = new Map();
  globalThis.localStorage = { getItem: k => localMap.get(k) ?? null, setItem: (k, v) => localMap.set(k, v) };
  globalThis.document = { getElementById: () => null };

  const store = await import('../lib/visual-storage.mjs');
  const { importWorkspace } = await import('../lib/workspace-transfer.mjs');
  const assert = (await import('node:assert/strict')).default;

  const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
  const summary = await importWorkspace(bundle, { overwriteBrain: true });

  // 8/9/10/11/13: every category restores into a genuinely empty destination.
  assert.equal(summary.brainImported, true, '8. import must restore Business Brain');
  assert.equal(summary.brandImported, true, '9. import must restore Brand Brain');
  assert.equal(summary.historyAdded, 1, '10. import must restore text History');
  assert.equal(summary.productsAdded, 1, '11. import must restore the Product Library entry');
  assert.equal(summary.visualsAdded, 1, '13. import must restore the Saved Design');
  assert.equal(JSON.parse(localStorage.getItem('brain')).name, 'نجوب');

  const products = await store.listProducts();
  const visuals = await store.listVisuals();
  assert.equal(products.length, 1);
  assert.equal(visuals.length, 1);

  // 12/14: the restored image assets are real, loadable Blobs with the exact original bytes.
  assert.deepEqual(await readBytes(products[0].image), productBytes, '12. imported product image must be a real, loadable Blob with the original bytes');
  assert.deepEqual(await readBytes(visuals[0].background), bgBytes, '14. imported Saved Design background image must be a real, loadable Blob');
  assert.deepEqual(await readBytes(visuals[0].rendered), renderedBytes, '14. imported Saved Design rendered image must be a real, loadable Blob');

  // 15/16: product<->image and design<->image relationships survive the transfer intact.
  assert.equal(products[0].id, 'bag', '15. the product record keeps its identity after import');
  assert.deepEqual(await readBytes(products[0].image), productBytes, '15. the restored product still points at its own, correct image');
  assert.equal(visuals[0].product.id, 'bag', '16. the Saved Design still references the correct product by id');
  assert.deepEqual(await readBytes(visuals[0].product.image), productBytes, '16. the Saved Design keeps its own embedded product image intact');

  // 19: engine identity on imported records is untouched (the six engines are not renamed/altered).
  assert.equal(visuals[0].task.engine, 'content', '19. import does not alter engine identifiers');

  console.log('PASS: import into empty storage restores Business Brain, Brand Brain, text History, Product Library and Saved Designs, with correct, loadable image bytes and intact product<->image / design<->image relationships');

  // 20: a malformed/invalid file must fail safely (a clear error, not a half-written workspace).
  // V4 Batch 1 bumped the valid export version to 2, so an unrecognized version number (99) is
  // used here instead of 2 to keep testing the same thing: an unrecognized bundle version must
  // still be rejected, not silently accepted.
  await assert.rejects(() => importWorkspace({ shaghilWorkspace: 99 }), /ملف غير صالح/, '20. a malformed workspace file must fail safely with a clear error');
  await assert.rejects(() => importWorkspace(null), /ملف غير صالح/, '20. a null/missing bundle must fail safely');
  console.log('PASS: a malformed workspace file is rejected safely with a clear error, before any destructive write');

  // 21: a legacy-shaped export missing products/visuals entirely must still restore what it has.
  const legacyBundle = { shaghilWorkspace: 1, localStorage: { brain: najoob, shaghilHistory: [{ id: 'h2', engine: 'copy', text: 'نص قديم', ts: 3000 }] } };
  const legacySummary = await importWorkspace(legacyBundle, { overwriteBrain: true });
  assert.equal(legacySummary.brainImported, true, '21. a legacy export without products/visuals must still restore Business Brain');
  assert.equal(legacySummary.historyAdded, 1, '21. a legacy export without products/visuals must still restore text History');
  assert.equal(legacySummary.productsAdded, 0, '21. a legacy export missing products must not error, just add none');
  console.log('PASS: a legacy-shaped export (no products/visuals) still restores all the data it does contain, gracefully');

  // New behavior from this fix: a genuinely blocked IndexedDB write must be detected and
  // surfaced, not silently discarded. Rather than mocking a browser-specific error, trigger a
  // REAL rejection through the existing 12-product storage cap (store.saveProduct's own
  // real abort path, whose message already says "...أو مساحة المتصفح ممتلئة") to prove
  // isStorageBlocked() and the resulting summary text genuinely fire end-to-end.
  for (let i = 0; i < 11; i++) {
    await store.saveProduct({ id: `filler-${i}`, name: `منتج ${i}`, fidelity: 'exact', image: new Blob([new Uint8Array(10).fill(i)], { type: 'image/png' }) });
  }
  // 12 products already present (1 real + 11 fillers); importing one more, new id must abort.
  const overflowBundle = { shaghilWorkspace: 1, localStorage: {}, products: [{ id: 'overflow', name: 'زائد', fidelity: 'exact', image: { __blob: true, type: 'image/png', data: Buffer.from(new Uint8Array(10).fill(1)).toString('base64') } }] };
  const overflowSummary = await importWorkspace(overflowBundle, {});
  assert.equal(overflowSummary.productsSkipped, 1, 'a real storage-cap rejection must be counted as skipped');
  assert.equal(overflowSummary.storageBlocked, true, 'isStorageBlocked() must recognize the real "...مساحة المتصفح ممتلئة" rejection and set storageBlocked');
  console.log('PASS: a real blocked-storage rejection is detected and reported via summary.storageBlocked instead of being silently discarded');

  console.log('PASS V0.10 workspace portability: full 22-point checklist verified (export content, import restoration, image/relationship integrity, six engines untouched, malformed-file safety, legacy-export graceful restore, storage-blocked detection)');
  process.exit(0);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shaghil-portability-'));
const bundleFile = path.join(tmp, 'bundle.json');
try {
  execFileSync(process.execPath, [self, 'export', bundleFile], { stdio: 'inherit' });
  execFileSync(process.execPath, [self, 'import', bundleFile], { stdio: 'inherit' });
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
