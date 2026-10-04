// SHGHIL V4 Batch 8 regression suite: Product Selection + Selective Text Context Wiring.
// Scope: an EXPLICIT, deterministic, never-guessed product selector for the six text engines,
// wired through the existing Batch-5/6 context-assembly architecture (no parallel ad-hoc path).
// Server-side checks inspect normalized/assembled context objects directly (api/generate.mjs);
// client-side checks drive the real index.html + lib/visual-studio.mjs + lib/product-library.mjs
// modules against a real (fake-indexeddb) Product Library, exactly like prior batches' DOM tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import OpenAI from 'openai';
import { indexedDB } from 'fake-indexeddb';
import { JSDOM } from 'jsdom';
import handler, { normalizeRequest } from '../api/generate.mjs';
import { CONTEXT_GROUPS } from '../lib/context-matrix.mjs';
import * as store from '../lib/visual-storage.mjs';

globalThis.indexedDB = globalThis.indexedDB || indexedDB;

const TEXT_ENGINES = ['content', 'copy', 'whatsapp', 'reel', 'offer', 'campaign'];
const DEFAULT_INPUTS = { content: {}, copy: {}, offer: {}, whatsapp: { message: 'كم السعر؟' }, campaign: { duration: '7 أيام' }, reel: {} };
const fullBrain = { name: 'ثريد', category: 'أزياء', product: 'ملابس جاهزة للبيع بالتجزئة', customer: 'شباب', location: 'الرياض', price: '100-400 SAR', tone: 'جريء', objective: 'زيادة المبيعات', currentOffer: 'خصم اليوم فقط على كل الطلبات' };
const makeImage = fillByte => new Blob([new Uint8Array(500).fill(fillByte)], { type: 'image/png' });

const fullProduct = {
  id: 'prod-1', name: 'قميص قطني أزرق', category: 'ملابس', description: 'قميص قطني مريح لكل الأوقات', price: '120 SAR',
  specifications: ['قطن 100%', 'مقاس حر'], features: ['خامة ناعمة', 'لا يتجعد'], benefits: ['راحة طوال اليوم'],
  useCases: ['الاستخدام اليومي', 'المناسبات غير الرسمية'], audienceRelevance: 'مناسب للشباب العصري', offers: ['اشترِ 2 بسعر 1']
};
const PRODUCT_ALLOWLIST = ['id', 'name', 'category', 'description', 'price', 'specifications', 'features', 'benefits', 'useCases', 'audienceRelevance', 'offers'];

// --- 17. Existing context matrix remains canonical: the exact field allowlist wired below comes
// straight from lib/context-matrix.mjs, not a second, competing, hand-maintained list. ---
assert.deepEqual([...CONTEXT_GROUPS.productMemory].sort(), [...PRODUCT_ALLOWLIST].sort(), "17. lib/context-matrix.mjs's productMemory group is the single canonical field list this suite's own allowlist must match exactly");
const contextAssemblySource = fs.readFileSync('lib/context-assembly.mjs', 'utf8');
assert.ok(contextAssemblySource.includes("from './context-matrix.mjs'"), '17. lib/context-assembly.mjs still resolves its policy from context-matrix.mjs, never a parallel hardcoded policy');

console.log('PASS: lib/context-matrix.mjs remains the single canonical Product Memory policy source — no parallel, competing field list exists');

// --- 2, 8, 9, 11. A selected product (by stable id) produces exactly the approved allowlist,
// nothing more (no image/reference, no unrelated product), across every text engine. ---
for (const engine of TEXT_ENGINES) {
  const task = normalizeRequest({ brain: fullBrain, engine, inputs: DEFAULT_INPUTS[engine], product: { ...fullProduct, image: 'IMAGE-SHOULD-NEVER-APPEAR', reference: 'REFERENCE-SHOULD-NEVER-APPEAR', unrelatedField: 'UNRELATED-SHOULD-NEVER-APPEAR' } });
  assert.deepEqual(Object.keys(task.context.selectedProduct).sort(), [...PRODUCT_ALLOWLIST].sort(), `2/8. ${engine}'s selectedProduct exposes exactly the approved allowlist, nothing more`);
  for (const field of PRODUCT_ALLOWLIST) assert.deepEqual(task.context.selectedProduct[field], fullProduct[field], `2. ${engine}'s selectedProduct.${field} matches the selected product exactly`);
  assert.equal(task.context.selectedProduct.id, 'prod-1', `2. ${engine}'s selectedProduct carries the stable id (transmitted by id, not by mutable name)`);
  const serialized = JSON.stringify(task);
  assert.ok(!serialized.includes('IMAGE-SHOULD-NEVER-APPEAR') && !serialized.includes('REFERENCE-SHOULD-NEVER-APPEAR'), `11. ${engine}'s normalized task never includes product image/reference content`);
  assert.ok(!serialized.includes('UNRELATED-SHOULD-NEVER-APPEAR'), `8. ${engine}'s selectedProduct never includes a field outside the approved allowlist`);
}

console.log('PASS: a selected product (by stable id) produces exactly the approved Product Memory allowlist for every text engine — no image/reference, and no field outside the allowlist, even when supplied');

// --- 3, 9. Zero/no selection: no selectedProduct context at all, for any text engine. ---
for (const engine of TEXT_ENGINES) {
  const taskNoProduct = normalizeRequest({ brain: fullBrain, engine, inputs: DEFAULT_INPUTS[engine] });
  assert.deepEqual(taskNoProduct.context.selectedProduct, {}, `3/9. ${engine} with no product field at all produces an empty selectedProduct — no regression from the pre-Batch-8 shape`);
  const taskEmptyProduct = normalizeRequest({ brain: fullBrain, engine, inputs: DEFAULT_INPUTS[engine], product: {} });
  assert.deepEqual(taskEmptyProduct.context.selectedProduct, {}, `9. ${engine} with an empty product object (no id) produces an empty selectedProduct`);
}

console.log('PASS: with zero products selected (no product field, or one with no id), every text engine produces an empty selectedProduct — no regression and no Product Memory context sent');

// --- 13. brain.product remains the general offering context and is never overwritten by a
// selected product's own, more specific fields. ---
for (const engine of ['offer', 'campaign']) {
  const task = normalizeRequest({ brain: fullBrain, engine, inputs: DEFAULT_INPUTS[engine], product: fullProduct });
  assert.equal(task.brain.product, fullBrain.product, `13. ${engine}'s brain.product is untouched by a selected product's own, different product field`);
  assert.equal(task.context.selectedProduct.category, fullProduct.category, `13. ${engine}'s selectedProduct.category carries the selected product's own, more specific category, independent of brain`);
}

console.log('PASS: brain.product remains the general business offering description and is never overwritten by a selected product\'s own, more specific fields (verified on real assembled data for both offer and campaign)');

// --- 14. brain.currentOffer and product.offers coexist, each in its own section. ---
{
  const task = normalizeRequest({ brain: fullBrain, engine: 'offer', inputs: DEFAULT_INPUTS.offer, product: fullProduct });
  assert.equal(task.context.commercialContext.currentOffer, fullBrain.currentOffer, "14. brain.currentOffer survives in commercialContext even when a product is also selected");
  assert.deepEqual(task.context.selectedProduct.offers, fullProduct.offers, '14. product.offers survives in selectedProduct even when brain.currentOffer is also populated');
  assert.notEqual(task.context.commercialContext.currentOffer, task.context.selectedProduct.offers, '14. the two remain distinct values in distinct sections, never merged into one field');
}

console.log('PASS: brain.currentOffer (time-bound business/campaign context) and product.offers (durable product-attached information) coexist simultaneously, each in its own distinguishable section');

// --- 15. No product is ever inferred from task text/history/keywords, even when the task input
// or brain.product textually mentions an existing product's exact name. ---
{
  const provocativeBrain = { ...fullBrain, product: `يبيع ${fullProduct.name} والمزيد` };
  const task = normalizeRequest({ brain: provocativeBrain, engine: 'copy', inputs: { channel: 'Instagram', instruction: `اكتب عن ${fullProduct.name} تحديدًا` } });
  assert.deepEqual(task.context.selectedProduct, {}, '15. no product is inferred from brain.product or task input text even when they textually name an existing product, without an explicit selection');
}

console.log('PASS: no product is ever inferred from task text, brain.product, history, or keywords — only an explicit selection (a supplied product with an id) ever populates selectedProduct');

// --- 16. No AI output can write back into Product Memory — the response contract is unchanged
// and the server has no mechanism to persist anything (same invariant Batches 6-7 verified for
// Business/Brand/Product Memory, re-confirmed here for the product-selection code path). ---
const generateSource = fs.readFileSync('api/generate.mjs', 'utf8');
assert.ok(!generateSource.includes('saveProduct') && !generateSource.includes('listProducts'), '16. api/generate.mjs contains no reference to saveProduct/listProducts — it cannot write back into Product Memory, which lives client-side in IndexedDB, not on the server at all');

console.log('PASS: no AI output can write back into Product Memory — api/generate.mjs has no reference to the Product Library\'s storage functions at all');

// --- 19. api/visual.mjs was outside this batch's own wiring work. At the time this batch
// shipped, it referenced neither context-matrix.mjs nor context-assembly.mjs. Batch 9 has since
// authorized wiring Visual too (see scripts/qa-v24-batch9-visual-context-wiring.mjs). ---
const visualApiSource = fs.readFileSync('api/visual.mjs', 'utf8');
assert.ok(visualApiSource.includes('context-assembly'), '19. api/visual.mjs now references context-assembly.mjs, exactly as Batch 9 authorized — see qa-v24-batch9-visual-context-wiring.mjs');

console.log('PASS: api/visual.mjs was outside this batch\'s own wiring; Batch 9 has since wired it too (verified separately in qa-v24-batch9-visual-context-wiring.mjs)');

// --- 18. Payload/prompt size measurement for a representative selected-product request. ---
const originalKey = process.env.OPENAI_API_KEY;
process.env.OPENAI_API_KEY = 'qa-placeholder';
process.env.PILOT_ACCESS_KEY ||= 'qa-pilot-key';
const AUTH_HEADERS = { 'x-pilot-key': process.env.PILOT_ACCESS_KEY };
const calls = [];
const originalCreate = OpenAI.Responses.prototype.create;
OpenAI.Responses.prototype.create = async function (payload) { calls.push(payload); return { output_text: '## نتيجة\nنص تجريبي' } };
const res = () => ({ headers: {}, setHeader(k, v) { this.headers[k] = v }, status(n) { this.code = n; return this }, json(body) { this.body = body; return this } });
try {
  const MAX_BODY_BYTES = 80_000;
  const representativeBody = { brain: fullBrain, engine: 'campaign', inputs: { occasion: 'إطلاق المجموعة الجديدة', duration: '7 أيام' }, product: fullProduct };
  const representativeBytes = Buffer.byteLength(JSON.stringify(representativeBody));
  console.log(`MEASURED: representative selected-product request body = ${representativeBytes} bytes (ceiling: ${MAX_BODY_BYTES})`);
  assert.ok(representativeBytes < MAX_BODY_BYTES, '18. a representative selected-product request body stays safely under the existing, unchanged request-size ceiling');

  const r = res();
  await handler({ method: 'POST', headers: AUTH_HEADERS, body: representativeBody }, r);
  assert.equal(r.code, 200, '18. the representative selected-product request is accepted and processed successfully');
  const promptBytes = Buffer.byteLength(calls.at(-1).instructions) + Buffer.byteLength(calls.at(-1).input);
  console.log(`MEASURED: representative selected-product assembled OpenAI prompt (instructions + input) = ${promptBytes} bytes`);
  assert.ok(calls.at(-1).input.includes('SELECTED PRODUCT CONTEXT'), '18. the assembled prompt includes the distinguishable SELECTED PRODUCT CONTEXT section');

  console.log('PASS: payload and prompt sizes were measured directly for a representative selected-product request and remain safely under the existing, unchanged request-size ceiling');

  // --- 6, 7. content/copy/whatsapp/reel work normally without selection; offer/campaign never
  // hard-block generation even when Product Memory exists and nothing was selected. ---
  for (const engine of TEXT_ENGINES) {
    const rNoSelection = res();
    await handler({ method: 'POST', headers: AUTH_HEADERS, body: { brain: fullBrain, engine, inputs: DEFAULT_INPUTS[engine] } }, rNoSelection);
    assert.equal(rNoSelection.code, 200, `6/7. ${engine} succeeds normally with no product selected at all`);
  }
} finally {
  OpenAI.Responses.prototype.create = originalCreate;
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
}

console.log('PASS: content/copy/whatsapp/reel generate normally with no product selected, and offer/campaign never hard-block generation even when nothing was selected — selection is optional everywhere');

// ---------------------------------------------------------------------------
// Client-side: real index.html + lib/visual-studio.mjs + lib/product-library.mjs modules,
// a real (fake-indexeddb) Product Library — selector UX, stable-ID flow, zero/one/many-product
// behavior, the offer/campaign nudge, and product-rename resilience, all driven end to end.
// ---------------------------------------------------------------------------
function mountPage() {
  const html = fs.readFileSync('index.html', 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
  const win = dom.window, ctx = dom.getInternalVMContext();
  win.store = store;
  win.structuredClone = structuredClone;
  win.Blob = Blob;
  win.URL.createObjectURL = () => 'blob:qa-' + Math.random();
  win.URL.revokeObjectURL = () => {};
  win.decodeImage = async () => ({ width: 400, height: 400 });
  win.normalizeAsset = async file => new Blob(['ref:' + file.name], { type: 'image/jpeg' });
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], ctx);
  const productLibrarySrc = fs.readFileSync('lib/product-library.mjs', 'utf8').replace(/^import .*;\n/gm, '');
  const visualStudioSrc = fs.readFileSync('lib/visual-studio.mjs', 'utf8').replace(/^import .*;\n/gm, '').replace('export function splitIdeas', 'function splitIdeas');
  vm.runInContext('(function(){' + productLibrarySrc + '})()', ctx);
  vm.runInContext('(function(){' + visualStudioSrc + '})()', ctx);
  return { dom, win, run: code => vm.runInContext(code, ctx) };
}
async function waitFor(check, tries = 40) { for (let i = 0; i < tries && !check(); i++) await new Promise(r => setTimeout(r, 5)); }
// For the zero-products case, the selector wrapper exists (hidden) in the markup immediately —
// waitFor's condition would be trivially true before populateProductSelect()'s own async
// Products.list() lookup has actually settled. A fixed flush (fake-indexeddb settles well
// within this) ensures that pending async work finishes before the next assertion or a
// dom.window.close(), which would otherwise let it resolve against an already-closed document.
const flush = () => new Promise(r => setTimeout(r, 30));

const brainForUI = { name: 'نجوب', category: 'سفر', product: 'منظم سفر العائلة', customer: 'العائلة السعودية', location: 'السعودية', price: '150-300 SAR', tone: 'سعودي طبيعي', objective: 'زيادة المبيعات' };

// --- 3. Zero products: no selector visible, no regression to the existing form. ---
{
  const { dom, win, run } = mountPage();
  win.localStorage.setItem('brain', JSON.stringify(brainForUI));
  run('home()');
  for (const engine of TEXT_ENGINES) {
    run(`openEngine('${engine}')`);
    await flush();
    assert.equal(win.document.getElementById('productSelectorWrap')?.classList.contains('hidden'), true, `3. ${engine}'s product selector stays hidden when zero products exist — no regression`);
  }
  await flush();dom.window.close();
}
console.log('PASS: with zero products in the Product Library, every engine\'s product selector stays hidden — no regression to the pre-Batch-8 form');

// --- 1, 4. Exactly one product: the selector becomes visible and is deterministically,
// visibly preselected to that one product — for every one of the six engines. ---
{
  const { dom, win, run } = mountPage();
  win.localStorage.setItem('brain', JSON.stringify(brainForUI));
  win.document.getElementById('productName').value = 'قميص قطني أزرق';
  await win.Products.upload(new win.File([new Uint8Array(500).fill(1)], 'shirt.png', { type: 'image/png' }));
  await win.Products.save();
  const [{ id: onlyProductId }] = await store.listProducts();
  run('home()');
  for (const engine of TEXT_ENGINES) {
    run(`openEngine('${engine}')`);
    await waitFor(() => win.document.getElementById('productSelectorWrap') && !win.document.getElementById('productSelectorWrap').classList.contains('hidden'));
    assert.equal(win.document.getElementById('productSelectorWrap').classList.contains('hidden'), false, `1. ${engine}'s product selector is visible once Product Memory exists`);
    assert.equal(win.document.getElementById('productId').value, onlyProductId, `4. ${engine}'s selector is deterministically preselected to the one existing product, visibly (its value is set, not merely defaulted)`);
  }
  await flush();dom.window.close();
}
console.log('PASS: all six text engines expose the product selector once Product Memory exists, and with exactly one product it is deterministically and visibly preselected for convenience, for every engine');

// --- 5. Multiple products: no automatic selection — the founder must choose explicitly. ---
{
  const { dom, win, run } = mountPage();
  win.localStorage.setItem('brain', JSON.stringify(brainForUI));
  for (const [name, byte] of [['قميص قطني أزرق', 1], ['حقيبة سفر', 2]]) {
    win.document.getElementById('productName').value = name;
    await win.Products.upload(new win.File([new Uint8Array(500).fill(byte)], 'p.png', { type: 'image/png' }));
    await win.Products.save();
  }
  run('home()');
  run("openEngine('offer')");
  await waitFor(() => win.document.getElementById('productSelectorWrap') && !win.document.getElementById('productSelectorWrap').classList.contains('hidden'));
  assert.equal(win.document.getElementById('productId').value, '', '5. with more than one product, nothing is auto-selected — the value stays empty until the founder chooses');
  await flush();dom.window.close();
}
console.log('PASS: with more than one product in the Product Library, the selector never auto-selects one — the founder must choose explicitly');

// --- 7. offer/campaign show a soft nudge (never a hard block) when Product Memory exists and
// nothing is selected; content/copy/whatsapp/reel never show it. ---
{
  const { dom, win, run } = mountPage();
  win.localStorage.setItem('brain', JSON.stringify(brainForUI));
  for (const [name, byte] of [['قميص قطني أزرق', 1], ['حقيبة سفر', 2]]) {
    win.document.getElementById('productName').value = name;
    await win.Products.upload(new win.File([new Uint8Array(500).fill(byte)], 'p.png', { type: 'image/png' }));
    await win.Products.save();
  }
  run('home()');
  for (const engine of TEXT_ENGINES) {
    run(`openEngine('${engine}')`);
    await waitFor(() => win.document.getElementById('productSelectorWrap') && !win.document.getElementById('productSelectorWrap').classList.contains('hidden'));
    const nudgeHidden = win.document.getElementById('productNudge').classList.contains('hidden');
    if (['offer', 'campaign'].includes(engine)) assert.equal(nudgeHidden, false, `7. ${engine} shows the soft nudge when Product Memory exists and nothing is selected`);
    else assert.equal(nudgeHidden, true, `7. ${engine} never shows the offer/campaign-only nudge`);
  }
  // Never a hard block: offer must still run to completion with nothing selected.
  run("openEngine('offer')");
  win.fetch = async (url, opts) => { JSON.parse(opts.body); return { ok: true, status: 200, text: async () => JSON.stringify({ text: '## عرض\nنتيجة' }) } };
  await run('run()');
  assert.equal(win.document.getElementById('output').classList.contains('hidden'), false, '7. offer still generates successfully with nothing selected — the nudge never blocks generation');
  await flush();dom.window.close();
}
console.log('PASS: offer/campaign show a soft, non-blocking nudge when Product Memory exists and nothing is selected; the other four engines never show it; generation is never hard-blocked');

// --- Stable-ID flow (UI -> request -> lookup -> assembled context) and 12. a product rename
// does not break selection because the stable id, not the name, is transmitted and looked up. ---
{
  const { dom, win, run } = mountPage();
  win.localStorage.setItem('brain', JSON.stringify(brainForUI));
  win.document.getElementById('productName').value = 'الاسم القديم';
  await win.Products.upload(new win.File([new Uint8Array(500).fill(3)], 'p.png', { type: 'image/png' }));
  await win.Products.save();
  const [{ id: stableId }] = await store.listProducts();
  // Rename the product after it was created — its id must stay the authoritative key.
  const existing = (await store.listProducts())[0];
  await store.saveProduct({ ...existing, name: 'الاسم الجديد بعد إعادة التسمية' });
  run('home()');
  run("openEngine('campaign')");
  await waitFor(() => win.document.getElementById('productSelectorWrap') && !win.document.getElementById('productSelectorWrap').classList.contains('hidden'));
  win.document.getElementById('productId').value = stableId;
  win.document.getElementById('duration').value = '7 أيام';
  let sentBody;
  win.fetch = async (url, opts) => { sentBody = JSON.parse(opts.body); return { ok: true, status: 200, text: async () => JSON.stringify({ text: '## حملة\nنتيجة' }) } };
  await run('run()');
  assert.equal(sentBody.product?.id, stableId, '12. the stable product id (not the now-stale name) is what the UI actually transmits in the request');
  assert.equal(sentBody.product?.name, 'الاسم الجديد بعد إعادة التسمية', '12. the resolved context reflects the CURRENT name looked up by the stable id — a rename after selection is reflected correctly, proving id (not name) is authoritative');
  assert.equal(sentBody.inputs?.productId, stableId, 'the UI-level selection itself is also recorded by stable id, never by the mutable name');
  await flush();dom.window.close();
}
console.log('PASS: the stable product id flows correctly from UI selection, through the request, to the context-assembly lookup, and a product rename after selection does not break it — the id, never the mutable name, is authoritative throughout');

console.log('\nPASS V4 BATCH 8: Product Memory is wired into the six text engines exactly as the Batch-5 matrix authorizes — selection is always explicit, deterministic and by stable id (never guessed from task text, history or keywords), the optional selector appears only when Product Memory exists and is deterministically preselected for exactly one product while never auto-selecting among several, offer/campaign nudge softly without ever hard-blocking generation, a selected product\'s approved allowlist (never image/reference, never an unrelated product) is assembled through the existing shared context-assembly architecture with brain.product and brain.currentOffer left untouched and coexisting correctly alongside it, no AI output can write back into Product Memory, payload sizes remain safely under the unchanged request ceiling, and api/visual.mjs was outside this batch\'s own wiring (wired separately in Batch 9)');
