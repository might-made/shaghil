// Founder QA follow-up (post-Batch 10): a focused, real end-to-end proof of the
// persistence -> engine selector -> request -> normalized-context path for Batch 8's product
// selector, using the REAL index.html inline script + REAL lib/*.mjs modules mounted in jsdom
// (same technique as scripts/qa-v25-batch10-progressive-hardening.mjs), rather than hand-rolled
// stand-ins for openEngine/populateProductSelect/run/generate.
//
// This closes a narrow gap left by the existing suite: qa-v25 already asserts the selector is
// preselected for a product, but that product was seeded directly via store.saveProduct() (an
// already-existing record), never created through the real NEW-product upload form the Founder
// actually used (file input -> Products.upload() -> Products.save()). This file creates exactly
// one BRAND NEW product through that real form, from a workspace that starts with zero products,
// then drives the real content engine and the real server-side normalizeRequest() on the exact
// request it produced.
//
// Runs in its own process (fresh IndexedDB), like qa-v07-product-persistence.mjs and
// qa-v23-batch8-product-selection.mjs: it needs to start from a genuinely empty Product Library.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { indexedDB } from 'fake-indexeddb';
import { normalizeRequest } from '../api/generate.mjs';
import * as store from '../lib/visual-storage.mjs';

globalThis.indexedDB = globalThis.indexedDB || indexedDB;

function mountPage() {
  const html = fs.readFileSync('index.html', 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
  const win = dom.window, ctx = dom.getInternalVMContext();
  // product-library.mjs/campaign-packs.mjs/visual-studio.mjs each have their own
  // `import * as store from './visual-storage.mjs'` line stripped below like every other
  // import — bind the real module onto the context's global so that bare `store` reference
  // inside their vm-executed source resolves to it, exactly like qa-v25's mountPage.
  win.store = store;
  win.URL.createObjectURL = () => 'blob:qa-' + Math.random();
  win.URL.revokeObjectURL = () => {};
  win.decodeImage = async () => ({ width: 400, height: 400 });
  win.normalizeAsset = async file => new Blob(['ref:' + file.name], { type: 'image/jpeg' });
  win.crypto.randomUUID = win.crypto.randomUUID || (() => 'uuid-' + Math.random().toString(36).slice(2));
  win.requests = [];
  win.fetch = async (url, opts) => {
    win.requests.push({ url, body: JSON.parse(opts.body) });
    return { ok: true, status: 200, text: async () => JSON.stringify({ text: 'نتيجة تجريبية' }) };
  };
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], ctx);
  // Same stripped-import load order as qa-v25: visual-studio.mjs's own
  // import './product-library.mjs' / import './campaign-packs.mjs' / import './workspace-transfer.mjs'
  // lines are stripped like every other import, so each sibling module is loaded separately.
  // workspace-transfer.mjs itself is never separately loaded (same as qa-v25's mountPage) since
  // this test never calls anything from it.
  for (const file of ['lib/product-library.mjs', 'lib/campaign-packs.mjs']) {
    const src = fs.readFileSync(file, 'utf8').replace(/^import .*;\n/gm, '');
    vm.runInContext('(function(){' + src + '})()', ctx);
  }
  const visualStudioSrc = fs.readFileSync('lib/visual-studio.mjs', 'utf8').replace(/^import .*;\n/gm, '').replace('export function splitIdeas', 'function splitIdeas');
  vm.runInContext('(function(){' + visualStudioSrc + '})()', ctx);
  return { dom, win, run: code => vm.runInContext(code, ctx) };
}

const { dom, win, run } = mountPage();

// 1. Seed a valid Business Brain (Essential Setup only, nothing product-related) and land home.
win.localStorage.setItem('brain', JSON.stringify({ name: 'تحميص ٢٧', product: 'قهوة مختصة', customer: 'موظفون 20-35' }));
run('home()');

// Confirm the workspace genuinely starts with zero products before creating one.
const beforeAny = await win.Products.list();
assert.equal(beforeAny.length, 0, 'sanity: this workspace starts with zero Product Memory items');

// 1. Create exactly ONE product through the REAL Product Library persistence path: open the
// screen, fill the form, run the real upload handler (what the real <input onchange> calls),
// wait for the real preview to confirm the pending image registered, then click real Save.
run("productLibraryScreen()");
win.document.getElementById('productName').value = 'منظم شنطة السفر';
const file = new win.File([new Uint8Array(500).fill(7)], 'bag.png', { type: 'image/png' });
await win.Products.upload(file);
assert.equal(win.document.getElementById('productPreviewWrap').classList.contains('hidden'), false, 'the real upload handler must show a pending preview before save');
await win.Products.save();

// 2. Confirm the stable product id now exists in the real store (IndexedDB), via the real
// module's own read path — not a hand-rolled stand-in.
const afterSave = await win.Products.list();
assert.equal(afterSave.length, 1, '2. exactly one product now exists in the real store');
const productId = afterSave[0].id;
assert.ok(productId && typeof productId === 'string', '2. the persisted product has a real stable id');
assert.equal(afterSave[0].name, 'منظم شنطة السفر', '2. the persisted product has the name entered in the real form');

console.log('PASS: a brand-new product created through the real Product Library form (file input -> Products.upload() -> Products.save()) persists with a real stable id, from a workspace that started with zero products');

// 3. Open the content engine exactly like a real click on its home-screen card.
run("openEngine('content')");
await new Promise(r => setTimeout(r, 30)); // let the real, fire-and-forget populateProductSelect() resolve

// 4. Inspect the real DOM state Batch 8's contract promises: wrap visibility, option count, value.
const wrap = win.document.getElementById('productSelectorWrap');
const sel = win.document.getElementById('productId');
assert.ok(wrap, '4. #productSelectorWrap exists in the real rendered content-engine form');
assert.equal(wrap.classList.contains('hidden'), false, '4. #productSelectorWrap is NOT hidden now that exactly one product exists');
assert.equal(sel.options.length, 2, "4. #productId has exactly 2 options ('بدون منتج محدد' + the one real product)");
assert.equal(sel.options[1].value, productId, "4. the real product's stable id is the selectable option's value");

// 5. The single product appears and is deterministically preselected.
assert.equal(sel.value, productId, '5. #productId is auto-selected to the one existing product (Batch 8 deterministic preselection)');

console.log('PASS: opening the content engine with exactly one real, freshly-created product shows the shared selector unhidden with that product deterministically preselected');

// 6. Submit generation exactly like a real click on "شغّل".
await run('run()');
assert.equal(win.requests.length, 1, '6. generate() sent exactly one real request to /api/generate');
const sentBody = win.requests[0].body;

// 7. The selected stable product id reaches body.product (resolved via Visual.productContext())
// and body.inputs.productId (the shared selector field, read like every other field).
assert.equal(sentBody.product?.id, productId, '7. the selected stable product id reaches the request as body.product.id');
assert.equal(sentBody.inputs?.productId, productId, '7. the selected stable product id also reaches body.inputs.productId');
assert.equal(sentBody.product?.name, 'منظم شنطة السفر', '7. body.product carries the real product name, not a guess');

console.log('PASS: submitting the real content engine sends a request whose body.product and body.inputs.productId both carry the real selected stable product id');

// 8. Run the real server-side normalizeRequest() on the exact body the browser sent, and verify
// the normalized context carries only the authorized Product Memory slice, keyed by the real id —
// never an unauthorized field (e.g. no image/reference, since body.product never carries them).
const task = normalizeRequest(sentBody);
const ALLOWED_PRODUCT_KEYS = ['id', 'name', 'category', 'description', 'price', 'specifications', 'features', 'benefits', 'useCases', 'audienceRelevance', 'offers'];
assert.ok(task.context.selectedProduct, '8. normalizeRequest() produces a non-empty selectedProduct for this request');
assert.equal(task.context.selectedProduct.id, productId, '8. the normalized context selectedProduct carries the real stable id');
const unauthorizedKeys = Object.keys(task.context.selectedProduct).filter(k => !ALLOWED_PRODUCT_KEYS.includes(k));
assert.deepEqual(unauthorizedKeys, [], '8. the normalized selectedProduct contains no key outside the approved Product Memory allowlist');
assert.deepEqual(Object.keys(task.context.selectedProduct).sort(), ['id', 'name'], '8. with only name/image filled in on this product, the normalized slice is exactly {id, name} — nothing invented for the untouched fields');

console.log('PASS: the real server-side normalizeRequest() resolves the exact request body into a selectedProduct slice containing only the authorized Product Memory fields, keyed by the real stable id');

dom.window.close();
console.log('\nPASS: Product Memory selector end-to-end — real persistence -> real engine selector -> real request -> real normalized context — proven on a brand-new product, not an isolated function');
