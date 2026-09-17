// Regression for the Founder Live QA blocker: a new Preview origin cannot see the previous
// origin's localStorage/IndexedDB (a browser platform rule — different Preview URLs are
// different origins). This proves Workspace.buildBundle/importWorkspace can move a whole
// populated workspace (Business Brain, Brand Brain, Product Library with real images,
// a saved visual, a campaign pack and result history) from one origin to a completely
// separate, empty one, byte-for-byte, without re-entering anything.
//
// Two real, separate Node processes stand in for two separate browser origins: nothing is
// shared between them except the exported JSON file, exactly like a Founder downloading the
// export on one Preview and uploading it on another.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const self = fileURLToPath(import.meta.url);
const phase = process.argv[2];
const bundlePath = process.argv[3];

const najoob = { name: 'نجوب', category: 'سفر', product: 'منظم سفر العائلة', customer: 'العائلة السعودية', location: 'السعودية', price: '150-300 SAR', tone: 'سعودي طبيعي', objective: 'زيادة المبيعات' };
const washBytes = new Uint8Array(500).fill(1);
const seaBytes = new Uint8Array(500).fill(2);
const logoBytes = new Uint8Array(200).fill(3);

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
  localStorage.setItem('shaghilHistory', JSON.stringify([{ id: 'h1', engine: 'campaign', title: 'سوّ حملة', project: 'نجوب', text: '## حملة نجوب\nنتيجة معتمدة', inputs: { occasion: '', duration: '7 أيام' }, ts: 1000 }]));

  await store.saveBrand({ primary: '#e7f95b', secondary: '#181b1f', accent: '', style: 'تصوير سعودي عصري', logo: new Blob([logoBytes], { type: 'image/png' }), references: [] });
  await store.saveProduct({ id: 'wash-me', name: 'Wash Me', description: 'منتج تنظيف', fidelity: 'exact', image: new Blob([washBytes], { type: 'image/png' }), reference: new Blob([washBytes], { type: 'image/jpeg' }) });
  await store.saveProduct({ id: 'sea', name: 'النفسية محتاجه بحر', description: 'منتج سفر', fidelity: 'exact', image: new Blob([seaBytes], { type: 'image/png' }), reference: new Blob([seaBytes], { type: 'image/jpeg' }) });

  const record = {
    id: 'v1', ts: 2000, brain: najoob, brand: { primary: '#e7f95b', secondary: '#181b1f', accent: '', style: '', logo: new Blob([logoBytes], { type: 'image/png' }), references: [] },
    product: { id: 'wash-me', name: 'Wash Me', fidelity: 'exact', image: new Blob([washBytes], { type: 'image/png' }) },
    task: { engine: 'campaign', context: 'سياق', selected: 'الفكرة المختارة' }, settings: { format: '1:1', mode: 'Product Hero', textMode: 'none' },
    background: new Blob(['scene'], { type: 'image/jpeg' }), rendered: new Blob(['final'], { type: 'image/png' }), direction: 1, model: 'mock'
  };
  await store.saveVisual(record);
  await store.savePack({ id: 'pack1', name: 'حملة نجوب', project: 'نجوب', ts: 3000, entries: [{ id: 'e1', label: 'Story', caption: 'النص المعتمد', cta: 'اطلب الآن', approvedAt: 3000, record }] });

  const bundle = await buildBundle();
  fs.writeFileSync(bundlePath, JSON.stringify(bundle));
  console.log('export phase: wrote workspace bundle for a populated Najoob origin');
  process.exit(0);
}

if (phase === 'import') {
  // A second, independent fake-indexeddb + localStorage instance: a completely separate,
  // empty origin, exactly like a brand-new Preview URL the Founder has never opened before.
  const { IDBFactory } = await import('fake-indexeddb');
  globalThis.indexedDB = new IDBFactory();
  const localMap = new Map();
  globalThis.localStorage = { getItem: k => localMap.get(k) ?? null, setItem: (k, v) => localMap.set(k, v) };
  globalThis.document = { getElementById: () => null };

  const store = await import('../lib/visual-storage.mjs');
  const { importWorkspace } = await import('../lib/workspace-transfer.mjs');
  const assert = (await import('node:assert/strict')).default;

  assert.equal(await store.loadBrand(), undefined, 'the destination origin must start empty');
  assert.deepEqual(await store.listProducts(), []);

  const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
  const summary = await importWorkspace(bundle, { overwriteBrain: true });
  assert.equal(summary.brainImported, true);
  assert.equal(summary.productsAdded, 2);
  assert.equal(summary.visualsAdded, 1);
  assert.equal(summary.packsAdded, 1);
  assert.equal(summary.historyAdded, 1);

  assert.deepEqual(JSON.parse(localStorage.getItem('brain')), najoob, 'Business Brain fields must be restored exactly');
  const history = JSON.parse(localStorage.getItem('shaghilHistory'));
  assert.equal(history.length, 1); assert.equal(history[0].project, 'نجوب'); assert.equal(history[0].engine, 'campaign');

  const brand = await store.loadBrand();
  assert.equal(brand.style, 'تصوير سعودي عصري');
  assert.deepEqual(await readBytes(brand.logo), logoBytes, "the brand logo's exact bytes must survive the transfer");

  const products = await store.listProducts();
  assert.equal(products.length, 2);
  const wash = products.find(p => p.name === 'Wash Me'), sea = products.find(p => p.name === 'النفسية محتاجه بحر');
  assert.ok(wash && sea, 'both products must be present by name after import');
  assert.deepEqual(await readBytes(wash.image), washBytes, "Wash Me's exact image bytes must survive the transfer");
  assert.deepEqual(await readBytes(sea.image), seaBytes, "the second product's exact image bytes must survive the transfer");

  const visuals = await store.listVisuals();
  assert.equal(visuals.length, 1); assert.equal(visuals[0].task.engine, 'campaign');
  const packs = await store.listPacks();
  assert.equal(packs.length, 1); assert.equal(packs[0].entries.length, 1); assert.equal(packs[0].entries[0].caption, 'النص المعتمد');

  // Importing the same bundle again must not duplicate anything (ids are stable/idempotent).
  await importWorkspace(bundle, { overwriteBrain: true });
  assert.equal((await store.listProducts()).length, 2, 're-importing the same export must not create duplicate products');
  assert.equal(JSON.parse(localStorage.getItem('shaghilHistory')).length, 1, 're-importing must not duplicate history entries already present');

  console.log('PASS V0.8 workspace transfer: a fully populated Najoob workspace (Business Brain, Brand Brain logo, both products with exact images, a saved visual, a campaign pack and history) moves byte-for-byte into a completely separate, empty origin via export/import, and re-importing is idempotent');
  process.exit(0);
}

// Orchestrator: run both phases as separate processes, exactly like two separate browser origins.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shaghil-workspace-'));
const bundleFile = path.join(tmp, 'bundle.json');
try {
  execFileSync(process.execPath, [self, 'export', bundleFile], { stdio: 'inherit' });
  execFileSync(process.execPath, [self, 'import', bundleFile], { stdio: 'inherit' });
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
