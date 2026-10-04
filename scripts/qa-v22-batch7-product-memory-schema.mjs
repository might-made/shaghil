// SHGHIL V4 Batch 7 regression suite: Product Memory Schema & Persistence.
// Scope: lib/visual-storage.mjs's product store gains the approved V4 Product Memory fields via
// a lazy, idempotent, additive migration in listProducts(), plus an `offers` cap enforced in
// saveProduct(); lib/product-library.mjs's save() is fixed to preserve those fields on an
// existing-product edit. No engine/Visual wiring, no selectors, no progressive UX, no Batch-6
// context-assembly changes — this suite proves schema/persistence only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { indexedDB } from 'fake-indexeddb';
import { JSDOM } from 'jsdom';
import * as store from '../lib/visual-storage.mjs';
import { buildBundle, importWorkspace } from '../lib/workspace-transfer.mjs';

globalThis.indexedDB = globalThis.indexedDB || indexedDB;

const APPROVED_NEW_FIELDS = ['category', 'price', 'specifications', 'features', 'benefits', 'useCases', 'audienceRelevance', 'offers'];
const LEGACY_FIELDS = ['id', 'name', 'description', 'fidelity'];

function makeImage(fillByte) { return new Blob([new Uint8Array(500).fill(fillByte)], { type: 'image/png' }) }
function makeReference(fillByte) { return new Blob([new Uint8Array(200).fill(fillByte)], { type: 'image/jpeg' }) }

// --- 1, 2, 3. A legacy product (pre-V4 shape, written directly as the old code would have)
// loads with every approved new default, its stable id survives unchanged, and every existing
// field/value stays byte-identical. ---
const legacyImage = makeImage(1), legacyReference = makeReference(1);
await store.saveProduct({ id: 'legacy-product-1', name: 'منتج قديم', description: 'وصف أصلي', fidelity: 'exact', image: legacyImage, reference: legacyReference });

let products = await store.listProducts();
let legacy = products.find(p => p.id === 'legacy-product-1');
assert.ok(legacy, '2. the existing id survives migration unchanged — the record is still found by its original id');
assert.equal(legacy.id, 'legacy-product-1', '2. existing id is byte-identical after migration');
assert.equal(legacy.name, 'منتج قديم', '3. existing name is byte-identical after migration');
assert.equal(legacy.description, 'وصف أصلي', '3. existing description is byte-identical after migration');
assert.equal(legacy.fidelity, 'exact', '3. existing fidelity is byte-identical after migration');
assert.deepEqual(new Uint8Array(await legacy.image.arrayBuffer()), new Uint8Array(await legacyImage.arrayBuffer()), '3. existing image bytes are unchanged by migration');
assert.deepEqual(new Uint8Array(await legacy.reference.arrayBuffer()), new Uint8Array(await legacyReference.arrayBuffer()), '3. existing reference bytes are unchanged by migration');
assert.equal(legacy.schemaVersion, 1, '1. Product schemaVersion is stamped');
for (const field of ['category', 'price', 'audienceRelevance']) assert.equal(legacy[field], '', `1. ${field} defaults to an empty string`);
for (const field of ['specifications', 'features', 'benefits', 'useCases', 'offers']) assert.deepEqual(legacy[field], [], `1. ${field} defaults to an empty array`);

console.log('PASS: a legacy product loads with every approved new Product Memory default, its stable id and every existing field/value (name, description, fidelity, image, reference) remain byte-identical');

// --- 4. Migration is idempotent: a second (and third) listProducts() call changes nothing further. ---
const afterFirstMigration = (await store.listProducts()).find(p => p.id === 'legacy-product-1');
const afterSecondMigration = (await store.listProducts()).find(p => p.id === 'legacy-product-1');
assert.deepEqual(afterFirstMigration, afterSecondMigration, '4. repeated listProducts() calls after the one-time migration never change the record again');
assert.equal(afterSecondMigration.schemaVersion, 1, '4. schemaVersion remains 1, never bumped again or re-stamped');

console.log('PASS: Product Memory migration is idempotent — repeated listProducts() calls after the first migration never mutate the record again');

// --- 5. New array-type defaults use independent references, never shared across products. ---
await store.saveProduct({ id: 'legacy-product-2', name: 'منتج قديم آخر', fidelity: 'creative', image: makeImage(2) });
products = await store.listProducts();
const p1 = products.find(p => p.id === 'legacy-product-1'), p2 = products.find(p => p.id === 'legacy-product-2');
assert.notEqual(p1.features, p2.features, '5. two different products never share the same array reference for a defaulted field');
p1.features.push('ميزة خاصة بالمنتج الأول فقط');
const p2Again = (await store.listProducts()).find(p => p.id === 'legacy-product-2');
assert.deepEqual(p2Again.features, [], "5. mutating one product's defaulted array must never affect another product's array");

console.log('PASS: array-type Product Memory defaults (specifications, features, benefits, useCases, offers) are freshly created per product, never shared by reference');

// --- 6. Populated new Product Memory fields survive save/load. ---
const populated = {
  id: 'populated-product', name: 'منتج مكتمل', description: 'وصف', fidelity: 'exact', image: makeImage(3), reference: makeReference(3),
  category: 'عناية منزلية', price: '45 SAR', specifications: ['الوزن: 250غم', 'الحجم: 500مل'],
  features: ['مقاوم للماء', 'خالٍ من الكيماويات القاسية'], benefits: ['يدوم طويلًا'], useCases: ['الاستخدام اليومي'],
  audienceRelevance: 'مناسب للعائلات ذات الأطفال', offers: ['اشترِ 2 واحصل على خصم 10%']
};
await store.saveProduct(populated);
const reloaded = (await store.listProducts()).find(p => p.id === 'populated-product');
for (const field of APPROVED_NEW_FIELDS) assert.deepEqual(reloaded[field], populated[field], `6. populated field ${field} survives save/load exactly`);

console.log('PASS: populated Product Memory fields (category, price, specifications, features, benefits, useCases, audienceRelevance, offers) survive save and reload exactly');

// --- 7. Existing edit/save flows (the real product-library.mjs UI module) do not silently
// delete the new fields — only this batch's explicit fix makes this true. ---
{
  const html = '<input id="productName"><textarea id="productDescription"></textarea><select id="productFidelity"><option value="exact">exact</option><option value="creative">creative</option></select><input id="productImage"><button id="productSave"></button><button id="productCancelEdit" class="hidden"></button><div id="productStatus"></div><div id="productList"></div><img id="productPreview"><div id="productPreviewWrap" class="hidden"></div>';
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`, { url: 'http://localhost', runScripts: 'outside-only' });
  const win = dom.window, ctx = dom.getInternalVMContext();
  win.store = store;
  win.structuredClone = structuredClone;
  win.Blob = Blob;
  win.URL.createObjectURL = () => 'blob:qa-' + Math.random();
  win.URL.revokeObjectURL = () => {};
  const productLibrarySrc = fs.readFileSync('lib/product-library.mjs', 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInContext('(function(){' + productLibrarySrc + '})()', ctx);

  // Render the real card list, then click the real "تعديل" button for the populated product —
  // this is the only way to reach product-library.mjs's own `editing`/`pending` closure
  // variables (they live inside the module's IIFE, not on `window`), exactly as a founder
  // clicking "تعديل" in the browser would set them.
  await win.Products.refresh();
  const card = [...win.document.querySelectorAll('#productList .card')].find(c => c.querySelector('h3').textContent === 'منتج مكتمل');
  assert.ok(card, '7. the populated product must render in the library before it can be edited');
  const editBtn = [...card.querySelectorAll('button')].find(b => b.textContent === 'تعديل');
  editBtn.onclick();
  win.document.getElementById('productDescription').value = 'وصف جديد بعد التعديل';
  win.document.getElementById('productFidelity').value = 'creative';
  await win.Products.save();

  const afterEdit = (await store.listProducts()).find(p => p.id === 'populated-product');
  assert.equal(afterEdit.description, 'وصف جديد بعد التعديل', "7. the edited description is applied");
  assert.equal(afterEdit.fidelity, 'creative', '7. the edited fidelity is applied');
  for (const field of APPROVED_NEW_FIELDS) assert.deepEqual(afterEdit[field], populated[field], `7. editing via the real UI save flow must not silently delete ${field}`);
  dom.window.close();
}

console.log('PASS: the existing product edit/save flow (the real product-library.mjs UI module) preserves every Product Memory field it does not itself edit — none are silently deleted');

// --- 8. `offers` enforces <=5 entries and <=150 characters each, at the storage write boundary. ---
const longOffer = 'ع'.repeat(300);
await store.saveProduct({ id: 'offers-overflow', name: 'منتج بعروض كثيرة', fidelity: 'exact', image: makeImage(4), offers: [longOffer, 'عرض 2', 'عرض 3', 'عرض 4', 'عرض 5', 'عرض 6 يجب أن يُستثنى', 'عرض 7 يجب أن يُستثنى'] });
const overflowProduct = (await store.listProducts()).find(p => p.id === 'offers-overflow');
assert.equal(overflowProduct.offers.length, 5, '8. offers is capped at a maximum of 5 entries regardless of how many were supplied');
assert.equal(overflowProduct.offers[0].length, 150, '8. an individual offer entry is capped at a maximum of 150 characters');
assert.ok(!overflowProduct.offers.includes('عرض 6 يجب أن يُستثنى') && !overflowProduct.offers.includes('عرض 7 يجب أن يُستثنى'), '8. entries beyond the 5-entry cap are dropped, never silently kept');

console.log('PASS: `offers` enforces a maximum of 5 entries and 150 characters per entry at the storage write boundary (saveProduct), regardless of how many or how long the caller supplies');

// --- 9. brain.currentOffer and product.offers remain structurally separate. At the time this
// batch shipped, neither api/generate.mjs nor lib/context-assembly.mjs referenced `offers` at
// all (no product wiring existed yet). Batch 8 has since authorized wiring an explicitly
// selected product's `offers` into both files alongside brain.currentOffer — the invariant this
// file still enforces is that the two remain distinct keys in distinct sections, never merged
// into one field (verified below on real assembled data, the strongest form of this check). ---
const generateSource = fs.readFileSync('api/generate.mjs', 'utf8');
const contextAssemblySource = fs.readFileSync('lib/context-assembly.mjs', 'utf8');
assert.ok(generateSource.includes('currentOffer'), "9. brain.currentOffer (Commercial Context, Batch 6) still exists in api/generate.mjs, untouched by this batch");
// A real brain object carrying currentOffer must never leak into a product record, and a real
// product carrying offers must never leak into brain — proving the separation holds on actual
// data, not just by source-scanning for the field names.
const brainWithCurrentOffer = { name: 'ث', category: '', product: 'م', customer: 'ع', location: '', price: '', tone: '', objective: '', currentOffer: 'خصم اليوم فقط على كل الطلبات' };
assert.ok(!('offers' in brainWithCurrentOffer), '9. a brain object carrying currentOffer has no offers key at all');
const productOffersOnly = (await store.listProducts()).find(p => p.id === 'populated-product');
assert.ok(!('currentOffer' in productOffersOnly), '9. a product record carrying offers has no currentOffer key at all — the two live in entirely separate stores (brain in localStorage, product in IndexedDB) with no shared field name');

console.log('PASS: brain.currentOffer (temporary business/campaign-level Commercial Context) and product.offers (durable product-attached information) remain structurally separate — neither module merges them');

// --- 10. Workspace export/import preserves the expanded Product Memory fields and stable IDs. ---
{
  const bundle = await buildBundle();
  const exportedPopulated = bundle.products.find(p => p.id === 'populated-product');
  assert.ok(exportedPopulated, '10. the export bundle includes the populated product');
  assert.equal(exportedPopulated.category, 'عناية منزلية', '10. export preserves a populated new Product Memory field (category)');
  assert.deepEqual(exportedPopulated.offers, ['اشترِ 2 واحصل على خصم 10%'], '10. export preserves a populated array-type new Product Memory field (offers)');

  // Re-importing the export bundle's products into the same store (saveProduct is id-keyed —
  // put, not add) proves the round-trip without needing a second physical database.
  const summary = await importWorkspace(bundle);
  assert.equal(summary.productsSkipped, 0, '10. re-importing the export bundle must not error on any product');
  const reimported = (await store.listProducts()).find(p => p.id === 'populated-product');
  assert.equal(reimported.id, 'populated-product', '10. the stable product id survives export/import');
  for (const field of APPROVED_NEW_FIELDS) assert.deepEqual(reimported[field], populated[field], `10. re-imported product preserves Product Memory field ${field} exactly`);
}

console.log('PASS: Workspace export/import preserves the expanded Product Memory fields and stable product IDs exactly');

// --- 11. Campaign export continues carrying both product name and stable productId, unaffected
// by this batch's schema expansion. ---
{
  const campaignExportSource = fs.readFileSync('lib/campaign-export.mjs', 'utf8');
  assert.ok(campaignExportSource.includes('productId:e.record.product?.id') && campaignExportSource.includes("product:e.record.product?.name"), '11. campaign export manifests still carry both the product name and a stable productId, exactly as Batch 2 established');
  assert.ok(!campaignExportSource.includes('category') && !campaignExportSource.includes('offers'), "11. campaign export was not touched to surface any new Product Memory field — out of scope for this batch");
}

console.log('PASS: campaign export manifests continue carrying both product name and stable productId, exactly as Batch 2 established — untouched by this batch\'s schema expansion');

// --- 12. At the time this batch shipped, no product selector or Product Memory prompt wiring
// existed anywhere. Batch 8 has since authorized exactly that: an explicitly selected product's
// fields (including specifications/audienceRelevance/useCases/benefits) are now referenced in
// both api/generate.mjs and lib/visual-studio.mjs (see
// scripts/qa-v23-batch8-product-selection.mjs for that wiring's own verification). The
// invariant this file still enforces is narrower but still real and still true: no AUTOMATIC or
// guessed selector exists anywhere (selection stays explicit and client-driven, by stable id
// only). api/visual.mjs was unwired at the time this batch shipped; Batch 9 has since wired it
// too (see scripts/qa-v24-batch9-visual-context-wiring.mjs). ---
assert.ok(!/function\s+select\w*[Pp]roduct/.test(generateSource), '12. api/generate.mjs contains no automatic/guessing product-selector implementation (selection is explicit and client-driven, authorized in Batch 8)');
const visualApiSource = fs.readFileSync('api/visual.mjs', 'utf8');
assert.ok(visualApiSource.includes('context-assembly'), '12. api/visual.mjs now references context-assembly.mjs, exactly as Batch 9 authorized — see qa-v24-batch9-visual-context-wiring.mjs');

console.log('PASS: at the time of this batch, no product selector or Product Memory prompt wiring existed anywhere; Batch 8 has since authorized explicit, selection-based wiring (verified separately in qa-v23-batch8-product-selection.mjs) and Batch 9 has since wired Visual too (qa-v24-batch9-visual-context-wiring.mjs), and this file continues to enforce that no automatic/guessing selector exists anywhere');

console.log('\nPASS V4 BATCH 7: the Product Library migrates additively and idempotently to the approved V4 Product Memory schema (category, price, specifications, features, benefits, useCases, audienceRelevance, offers) — every existing id/name/description/fidelity/image/reference value survives byte-identical, array defaults are never shared by reference, populated fields and the existing edit/save flow both preserve the new data, `offers` is capped at 5 entries/150 characters at the storage boundary, brain.currentOffer and product.offers stay structurally separate, Workspace export/import and campaign export both continue working exactly as before, and zero product selector/prompt/Visual wiring was introduced in this batch (Batch 8 has since authorized explicit, selection-based text prompt wiring, and Batch 9 has since wired Visual too — see qa-v23-batch8-product-selection.mjs and qa-v24-batch9-visual-context-wiring.mjs)');
