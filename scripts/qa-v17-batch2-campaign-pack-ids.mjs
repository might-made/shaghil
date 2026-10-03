// SHGHIL V4 Batch 2 (P0-A.2) regression suite.
// Scope: re-keying Campaign Packs from mutable business-name matching to stable businessId,
// and adding a stable productId alongside the existing human-readable product name in campaign
// export manifests. Does NOT exercise any later batch (Business Memory fields, Brand
// Intelligence, context assembly, product selectors, progressive UX, product.offers).
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { indexedDB } from 'fake-indexeddb';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
globalThis.document = dom.window.document;
globalThis.Option = dom.window.Option;
globalThis.indexedDB = indexedDB;

const store = await import('../lib/visual-storage.mjs');
const { exportPack } = await import('../lib/campaign-export.mjs');
await import('../lib/campaign-packs.mjs');
const Packs = globalThis.Packs;

// Minimal elements Packs.* reads/writes, mirroring the real screen's markup by id.
for (const id of ['packAdd', 'packSelect', 'packStatus', 'packCaption', 'packCTA', 'packLabel', 'packName', 'campaignPacks']) {
  const el = document.createElement(id === 'packSelect' ? 'select' : 'div');
  el.id = id;
  document.body.appendChild(el);
}

function makeRecord(overrides = {}) {
  return {
    id: 'visual-' + Math.random().toString(36).slice(2),
    ts: Date.now(),
    brain: { name: 'نجوب', businessId: 'biz-1', category: '', product: '', customer: '', location: '', price: '', tone: '', objective: '', schemaVersion: 1 },
    brand: { primary: '#000000', secondary: '#ffffff', accent: '', style: '', logo: null, references: [] },
    product: null,
    task: { engine: 'content', context: 'سياق اليوم', selected: 'فكرة اليوم الأول' },
    settings: { format: '1:1', mode: 'Product Hero', textMode: 'none', cta: 'اطلب الآن' },
    rendered: new Blob(['img-bytes'], { type: 'image/png' }),
    overlayWarning: '',
    direction: 0, model: 'mock',
    ...overrides
  };
}
function selectOptionValues() { return [...document.getElementById('packSelect').options].map(o => o.value) }

// --- 1 & 5. A pre-V4 pack (no businessId) whose project matches the current business name is
// stamped with the current businessId, and remains visible via the legacy fallback in the same pass. ---
await store.savePack({ id: 'legacy-match', name: 'حزمة قديمة', project: 'نجوب', ts: 1000, entries: [] });
await Packs.prepare(makeRecord());
assert.ok(selectOptionValues().includes('legacy-match'), '1/5. a pre-V4 pack matching the current business name is visible in the pack dropdown (legacy fallback)');
const stamped = (await store.listPacks()).find(p => p.id === 'legacy-match');
assert.equal(stamped.businessId, 'biz-1', '1. the pre-V4 pack is stamped with the current businessId on first encounter');
assert.equal(stamped.project, 'نجوب', '8. the legacy project label survives the stamp unchanged');
assert.equal(stamped.name, 'حزمة قديمة', '8. the pack name survives the stamp unchanged');
assert.deepEqual(stamped.entries, [], '8. the entries array survives the stamp unchanged');

console.log('PASS: a pre-V4 pack matching the current business name is stamped with businessId and remains visible via the unchanged legacy fallback, with every other field preserved exactly');

// --- 2. A newly-created pack stores businessId directly. ---
document.getElementById('packSelect').value = '';
document.getElementById('packName').value = 'حزمة جديدة';
document.getElementById('packCaption').value = 'نص معتمد';
document.getElementById('packCTA').value = 'اطلب الآن';
await Packs.add(makeRecord());
const created = (await store.listPacks()).find(p => p.name === 'حزمة جديدة');
assert.ok(created, '2. the newly-created pack was saved');
assert.equal(created.businessId, 'biz-1', '2. a newly-created pack stores the current businessId directly');
assert.equal(created.project, 'نجوب', '2. the newly-created pack still stores the human-readable project label');

console.log('PASS: a newly-created Campaign Pack stores businessId directly at creation, alongside the unchanged human-readable project label');

// --- 3. Rename the business after that pack was created → it remains visible via businessId. ---
const renamedRecord = makeRecord({ brain: { ...makeRecord().brain, name: 'نجوب الجديد' } }); // same businessId, new name
await Packs.prepare(renamedRecord);
assert.ok(selectOptionValues().includes(created.id), '3. a pack created before a business rename remains visible afterward, matched by businessId, not by the now-stale project name');

console.log('PASS: renaming the business after a pack was created does not hide that pack — businessId keeps it correctly matched regardless of the name change');

// --- 4. A pack already orphaned by an earlier rename (project never matched the pre-Batch-2
// current name) must NOT be heuristically stamped or force-matched. ---
await store.savePack({ id: 'already-orphaned', name: 'حزمة منسية', project: 'اسم قديم جدًا', ts: 500, entries: [] });
const otherBusiness = makeRecord({ brain: { ...makeRecord().brain, name: 'مشروع آخر تمامًا', businessId: 'biz-2' } });
await Packs.prepare(otherBusiness);
const stillOrphaned = (await store.listPacks()).find(p => p.id === 'already-orphaned');
assert.equal(stillOrphaned.businessId, undefined, '4. a pack already orphaned by an earlier rename is never stamped with an unrelated businessId');
assert.equal(stillOrphaned.project, 'اسم قديم جدًا', '4. its original project label is left completely untouched');
assert.ok(!selectOptionValues().includes('already-orphaned'), '4. it does not appear under a business it never belonged to — no heuristic reassignment');

console.log('PASS: a pack already orphaned by a rename that happened before this migration existed is never guessed or heuristically relinked, and its original data is left untouched');

// --- 6 & 7. Campaign export includes both product name and productId, and productId survives a
// later product rename (the snapshot is stable; only the live catalog name changes). ---
await store.saveProduct({ id: 'prod-1', name: 'الاسم الأصلي', fidelity: 'exact', image: new Blob(['p'], { type: 'image/png' }) });
document.getElementById('packSelect').value = '';
document.getElementById('packName').value = 'حزمة فيها منتج';
await Packs.add(makeRecord({ product: { id: 'prod-1', name: 'الاسم الأصلي', fidelity: 'exact' } }));
const packWithProduct = (await store.listPacks()).find(p => p.name === 'حزمة فيها منتج');

function readZipEntries(buffer) {
  const view = new DataView(buffer), bytes = new Uint8Array(buffer), out = {};
  let offset = 0;
  while (offset + 4 <= buffer.byteLength && view.getUint32(offset, true) === 0x04034b50) {
    const nameLen = view.getUint16(offset + 26, true), compSize = view.getUint32(offset + 18, true);
    const name = new TextDecoder().decode(bytes.subarray(offset + 30, offset + 30 + nameLen));
    out[name] = bytes.slice(offset + 30 + nameLen, offset + 30 + nameLen + compSize);
    offset += 30 + nameLen + compSize;
  }
  return out;
}
async function readManifest(pack) {
  const result = await exportPack(pack);
  const entries = readZipEntries(await result.blob.arrayBuffer());
  const manifestPath = Object.keys(entries).find(n => n.endsWith('manifest.json'));
  return JSON.parse(new TextDecoder().decode(entries[manifestPath]));
}

const manifestBefore = await readManifest(packWithProduct);
assert.equal(manifestBefore.entries[0].product, 'الاسم الأصلي', '6. the export manifest includes the human-readable product name');
assert.equal(manifestBefore.entries[0].productId, 'prod-1', '6. the export manifest includes the stable productId alongside it');

// Rename the live Product Library item; the already-saved pack entry is an independent snapshot
// (unchanged architecture, not part of this batch), but its productId must still correctly and
// stably identify the product across the rename.
await store.saveProduct({ id: 'prod-1', name: 'اسم جديد بعد إعادة التسمية', fidelity: 'exact', image: new Blob(['p'], { type: 'image/png' }) });
const manifestAfterRename = await readManifest(packWithProduct);
assert.equal(manifestAfterRename.entries[0].productId, 'prod-1', '7. a product rename does not break the stable productId reference in a freshly-generated export manifest');

console.log('PASS: campaign export manifests include both the human-readable product name and a stable productId, and the productId reference survives a later product rename');

console.log('\nPASS V4 BATCH 2 (P0-A.2): Campaign Packs are re-keyed to stable businessId (new packs stamp it, matching legacy packs are stamped once, already-orphaned legacy packs are never heuristically relinked, the legacy name fallback still works), and campaign export manifests carry a stable productId alongside the unchanged product name — with zero existing pack/export data deleted or overwritten');
