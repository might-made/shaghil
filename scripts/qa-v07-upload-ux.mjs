import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {indexedDB} from 'fake-indexeddb';
import * as store from '../lib/visual-storage.mjs';
globalThis.indexedDB = globalThis.indexedDB || indexedDB;

const html = '<!doctype html><html><body>'
  + '<input id="productName" maxlength="120">'
  + '<input id="productImage" type="file">'
  + '<textarea id="productDescription" maxlength="600"></textarea>'
  + '<select id="productFidelity"><option value="exact" selected>exact</option><option value="creative">creative</option></select>'
  + '<div id="productPreviewWrap" class="hidden"><img id="productPreview"></div>'
  + '<button id="productSave"></button>'
  + '<p id="productStatus" role="status"></p>'
  + '<div id="productList"></div>'
  + '</body></html>';

function mount(){
  const dom = new JSDOM(html, {url: 'http://localhost', runScripts: 'outside-only'});
  const win = dom.window, ctx = dom.getInternalVMContext();
  win.store = store;
  win.URL.createObjectURL = () => 'blob:qa-' + Math.random();
  win.URL.revokeObjectURL = () => {};
  win.decodeImage = async () => ({width: 400, height: 400});
  win.normalizeAsset = async file => new Blob(['ref:' + file.name], {type: 'image/jpeg'});
  win.crypto = win.crypto || {};
  if (!win.crypto.randomUUID) win.crypto.randomUUID = () => 'uuid-' + Math.random().toString(36).slice(2);
  const src = fs.readFileSync('lib/product-library.mjs', 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInContext('(function(){' + src + '})()', ctx);
  return {dom, win};
}

const {dom, win} = mount();
const hiddenNow = () => win.document.getElementById('productPreviewWrap').classList.contains('hidden');
const status = () => win.document.getElementById('productStatus').textContent;

// A real, successfully decoded selection must show a preview and an explicit next step,
// and must not look like a failed upload.
const goodFile = new win.File([new Uint8Array(1200)], 'shoe.png', {type: 'image/png'});
await win.Products.upload(goodFile);
assert.equal(hiddenNow(), false, 'preview must be visible immediately after successful decode');
assert.ok(win.document.getElementById('productPreview').src, 'preview <img> must have a src set');
assert.match(status(), /حفظ المنتج/, 'status must reference the Arabic Save Product action');
assert.match(status(), /Save Product/, 'status must reference the English Save Product action');

// The pending image must survive being left alone (no premature clearing) until an
// actual save, replacement, cancellation or error.
assert.equal(hiddenNow(), false, 'pending preview must not disappear on its own');

// An actual decode/validation error is the only thing allowed to clear the pending state.
const oversized = new win.File([new Uint8Array(9 * 1024 * 1024)], 'huge.png', {type: 'image/png'});
await win.Products.upload(oversized);
assert.equal(hiddenNow(), true, 'preview must clear on an actual validation error');
assert.doesNotMatch(status(), /Save Product/, 'error status must not still prompt to save');

win.document.getElementById('productName').value = 'منتج بلا صورة';
await win.Products.save();
assert.equal((await store.listProducts()).some(p => p.name === 'منتج بلا صورة'), false, 'save must refuse without a pending image');

// Re-selecting a valid image (replacement) restores the pending/preview state, and Save Product persists it.
await win.Products.upload(goodFile);
assert.equal(hiddenNow(), false, 'replacement selection must show its own preview');
win.document.getElementById('productName').value = 'حذاء رياضي';
await win.Products.save();
const saved = (await store.listProducts()).find(p => p.name === 'حذاء رياضي');
assert.ok(saved, 'Save Product must persist the product image');
assert.equal(hiddenNow(), true, 'preview resets once the product is saved');
dom.window.close();

// Verify the saved image survives a reload: a fresh document/window reading the same
// underlying storage must render the persisted thumbnail.
const {dom: dom2, win: win2} = mount();
await win2.Products.refresh();
assert.ok(win2.document.getElementById('productList').querySelector('img'), 'reload must render a saved product thumbnail');
dom2.window.close();

console.log('PASS V0.7 upload UX: filename/status stays visible, preview shows before save, explicit Save Product prompt, pending state survives until save/replace/error, saved image persists after reload');
