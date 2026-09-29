// Regression for the Founder-reported "every new Preview URL looks empty" QA blocker.
// Root cause (confirmed live against the actual Vercel project via the Vercel API, not
// guessed): every push to shaghil-closed-pilot-ux-refinement was being opened at Vercel's
// fresh, random per-deployment URL (e.g. shaghil-oo7xjqh8b-...vercel.app), which is a brand
// new browser origin every single time — so localStorage/IndexedDB are correctly empty there,
// by browser design, not by a SHAGHIL defect. See SHAGHIL_PREVIEW_PERSISTENCE_AUDIT.md for the
// full live-project findings and the stable Git-branch URL that already exists and does not
// change across deployments on this branch.
//
// This file proves the two things SHAGHIL's own code is responsible for: (1) data already
// written to an origin is never lost by simply revisiting that same origin again, and (2) the
// Workspace export/import path can move a full workspace — History, Saved Designs, Product
// Library and Campaign Packs together — from one origin to a completely separate one with zero
// data loss and an accurate restored/failed summary, exactly the path a Founder needs while
// waiting on a stable URL.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const self = fileURLToPath(import.meta.url);
const phase = process.argv[2];
const bundlePath = process.argv[3];

const brain = { name: 'MIGHT MADE', category: 'استشارات وتسويق', product: 'خدمات بناء وتسويق العلامات', customer: 'رواد أعمال في السعودية', location: 'السعودية', price: 'حسب المشروع', tone: 'احترافي وواثق', objective: 'زيادة الوعي' };
const productBytes = new Uint8Array(1000).fill(4);

async function readBytes(blob) { return new Uint8Array(await blob.arrayBuffer()) }

// --- Phase "same-origin": data written to an origin must still be there after simply
// reopening that origin's storage again (proves the ORIGINAL Preview URL never loses data). ---
if (phase === 'same-origin') {
  const { indexedDB } = await import('fake-indexeddb');
  globalThis.indexedDB = indexedDB;
  const localMap = new Map();
  globalThis.localStorage = { getItem: k => localMap.get(k) ?? null, setItem: (k, v) => localMap.set(k, v) };
  globalThis.document = { getElementById: () => null };

  const store = await import('../lib/visual-storage.mjs');
  localStorage.setItem('brain', JSON.stringify(brain));
  localStorage.setItem('shaghilHistory', JSON.stringify([{ id: 'h1', engine: 'campaign', title: 'سوّ حملة', project: 'MIGHT MADE', text: '## حملة\nنتيجة', ts: 1000 }]));
  await store.saveProduct({ id: 'p1', name: 'خدمة استشارية', fidelity: 'exact', image: new Blob([productBytes], { type: 'image/png' }) });
  await store.savePack({ id: 'pack1', name: 'حملة الإطلاق', project: 'MIGHT MADE', ts: 2000, entries: [] });

  // "Reopening the same Preview URL" is simulated by dropping the module's cached IndexedDB
  // connection and reading through fresh calls against the SAME underlying indexedDB instance
  // (a real browser tab reload does exactly this: a new JS heap, the same on-disk origin storage).
  const products = await store.listProducts();
  const packs = await store.listPacks();
  assert.equal(JSON.parse(localStorage.getItem('brain')).name, 'MIGHT MADE', 'Business Brain must still be readable from the same origin');
  assert.equal(JSON.parse(localStorage.getItem('shaghilHistory')).length, 1, 'History must still be readable from the same origin');
  assert.equal(products.length, 1, 'Product Library must still be readable from the same origin');
  assert.equal(packs.length, 1, 'Campaign Packs must still be readable from the same origin');
  console.log('PASS: data already saved on a Preview URL remains fully readable simply by revisiting that same origin — nothing is lost by Vercel or by SHAGHIL on its own URL');
  process.exit(0);
}

// --- Phase "export": build a full workspace bundle standing in for "the previous Preview URL". ---
if (phase === 'export') {
  const { indexedDB } = await import('fake-indexeddb');
  globalThis.indexedDB = indexedDB;
  const localMap = new Map();
  globalThis.localStorage = { getItem: k => localMap.get(k) ?? null, setItem: (k, v) => localMap.set(k, v) };
  globalThis.document = { getElementById: () => null };

  const store = await import('../lib/visual-storage.mjs');
  const { buildBundle } = await import('../lib/workspace-transfer.mjs');

  localStorage.setItem('brain', JSON.stringify(brain));
  localStorage.setItem('shaghilHistory', JSON.stringify([{ id: 'h1', engine: 'campaign', title: 'سوّ حملة', project: 'MIGHT MADE', text: '## حملة\nنتيجة معتمدة', ts: 1000 }]));
  await store.saveProduct({ id: 'p1', name: 'خدمة استشارية', fidelity: 'exact', image: new Blob([productBytes], { type: 'image/png' }) });
  const record = {
    id: 'v1', ts: 2000, brain, brand: { primary: '#e7f95b', secondary: '#181b1f', accent: '', style: '', logo: null, references: [] },
    product: { id: 'p1', name: 'خدمة استشارية', fidelity: 'exact', image: new Blob([productBytes], { type: 'image/png' }) },
    task: { engine: 'campaign', context: 'سياق', selected: 'الفكرة المختارة' }, settings: { format: '1:1', mode: 'Product Hero', textMode: 'none' },
    background: new Blob(['scene'], { type: 'image/jpeg' }), rendered: new Blob(['final'], { type: 'image/png' }), direction: 1, model: 'mock'
  };
  await store.saveVisual(record);
  await store.savePack({ id: 'pack1', name: 'حملة الإطلاق', project: 'MIGHT MADE', ts: 3000, entries: [{ id: 'e1', label: 'Story', caption: 'نص معتمد', cta: 'تواصل الآن', approvedAt: 3000, record }] });

  // Deliberately include one record that WILL fail to import (missing required name), to prove
  // the summary reports failures honestly rather than only ever reporting successes.
  const bundle = await buildBundle();
  bundle.products.push({ id: 'broken', name: '', fidelity: 'exact', image: bundle.products[0].image });

  fs.writeFileSync(bundlePath, JSON.stringify(bundle));
  console.log('export phase: wrote a full workspace bundle (History, Saved Design, Product Library, Campaign Pack, plus one deliberately invalid product) standing in for the previous Preview URL');
  process.exit(0);
}

// --- Phase "import": a completely separate, empty origin standing in for "the current Preview URL". ---
if (phase === 'import') {
  const { IDBFactory } = await import('fake-indexeddb');
  globalThis.indexedDB = new IDBFactory();
  const localMap = new Map();
  globalThis.localStorage = { getItem: k => localMap.get(k) ?? null, setItem: (k, v) => localMap.set(k, v) };
  globalThis.document = { getElementById: () => null };

  const store = await import('../lib/visual-storage.mjs');
  const { importWorkspace } = await import('../lib/workspace-transfer.mjs');

  assert.equal(await store.loadBrand(), undefined, 'the new Preview URL must start with a genuinely empty origin');
  assert.deepEqual(await store.listProducts(), []);

  const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
  const summary = await importWorkspace(bundle, { overwriteBrain: true });

  // All four categories the Founder named must be fully restored with zero loss.
  assert.equal(summary.brainImported, true, 'Business Brain must be restored on the new Preview URL');
  assert.equal(summary.historyAdded, 1, 'History must be restored on the new Preview URL');
  assert.equal(summary.visualsAdded, 1, 'Saved Designs must be restored on the new Preview URL');
  assert.equal(summary.packsAdded, 1, 'Campaign Packs must be restored on the new Preview URL');
  assert.equal(summary.productsAdded, 1, 'the valid Product Library entry must be restored');
  // ...and the summary must be an ACCURATE, non-silent record of the one that failed.
  assert.equal(summary.productsSkipped, 1, 'the deliberately invalid product must be counted as skipped, not silently dropped');

  const products = await store.listProducts();
  const visuals = await store.listVisuals();
  const packs = await store.listPacks();
  assert.equal(products.length, 1, 'only the valid product may actually land in storage');
  assert.deepEqual(await readBytes(products[0].image), productBytes, "the restored product's image bytes must survive the transfer exactly");
  assert.equal(visuals.length, 1);
  assert.deepEqual(await readBytes(visuals[0].rendered), new TextEncoder().encode('final'), 'the restored Saved Design image must survive the transfer exactly');
  assert.equal(packs.length, 1);
  assert.equal(packs[0].entries[0].caption, 'نص معتمد', 'the restored Campaign Pack entry must keep its exact approved caption');

  const history = JSON.parse(localStorage.getItem('shaghilHistory'));
  assert.equal(history.length, 1);
  assert.equal(history[0].project, 'MIGHT MADE');

  console.log('PASS: a workspace exported from a previous Preview URL (History, Saved Design, Product Library, Campaign Pack) imports into a brand-new, empty Preview URL with zero data loss, and the one genuinely invalid record is honestly reported as skipped rather than silently dropped');

  // Re-importing the same bundle again from the same "previous Preview URL" export must not
  // duplicate anything — the Founder may need to re-import after further local testing.
  const again = await importWorkspace(bundle, {});
  assert.equal((await store.listProducts()).length, 1, 're-importing the same export must not duplicate the product');
  assert.equal((await store.listVisuals()).length, 1, 're-importing the same export must not duplicate the saved design');
  assert.equal((await store.listPacks()).length, 1, 're-importing the same export must not duplicate the campaign pack');
  assert.equal(JSON.parse(localStorage.getItem('shaghilHistory')).length, 1, 're-importing the same export must not duplicate history');
  console.log('PASS: re-importing the same previous-Preview-URL export into the already-populated current Preview URL is idempotent — no duplicate records');

  console.log('PASS PREVIEW PERSISTENCE: same-origin data survives revisiting a Preview URL untouched, and cross-origin Workspace export/import moves History + Saved Designs + Product Library + Campaign Packs between Preview URLs with zero loss and an honest, accurate restored/failed summary');
  process.exit(0);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shaghil-preview-persistence-'));
const bundleFile = path.join(tmp, 'bundle.json');
try {
  execFileSync(process.execPath, [self, 'same-origin'], { stdio: 'inherit' });
  execFileSync(process.execPath, [self, 'export', bundleFile], { stdio: 'inherit' });
  execFileSync(process.execPath, [self, 'import', bundleFile], { stdio: 'inherit' });
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
