import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {indexedDB} from 'fake-indexeddb';
import * as store from '../lib/visual-storage.mjs';
globalThis.indexedDB = globalThis.indexedDB || indexedDB;

// Regression for the Founder Live QA report: "Wash Me" vanished from the Product Library
// after (1) saving two products, (2) a browser refresh, (3) a blocked "Save & Start"
// validation, and (4) reopening Business Brain. This exercises the real page script
// (setup/saveProject), the real product-library module and the real visual-studio module
// together, the same way the app wires them, across three separate simulated page loads
// sharing one underlying IndexedDB (fake-indexeddb persists independently of any one
// window/module instance, the same way a real browser's IndexedDB outlives a page reload).

const html = fs.readFileSync('index.html', 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const productLibrarySrc = fs.readFileSync('lib/product-library.mjs', 'utf8').replace(/^import .*;\n/gm, '');
const visualStudioSrc = fs.readFileSync('lib/visual-studio.mjs', 'utf8')
  .replace(/^import .*;\n/gm, '')
  .replace('export function splitIdeas', 'function splitIdeas');

function mountPage() {
  const dom = new JSDOM(html, {url: 'http://localhost', runScripts: 'outside-only'});
  const win = dom.window, ctx = dom.getInternalVMContext();
  win.store = store;
  win.structuredClone = structuredClone;
  // jsdom's own Blob/File are minimal stand-ins that fake-indexeddb cannot round-trip
  // (they come back as empty plain objects). Node's real Blob/File are fully spec-compliant
  // and round-trip cleanly, so use them here for the same reason decodeImage is mocked below:
  // jsdom has no real image/file pipeline, so the test supplies a working one.
  win.Blob = Blob;
  win.File = File;
  win.URL.createObjectURL = () => 'blob:qa-' + Math.random();
  win.URL.revokeObjectURL = () => {};
  win.decodeImage = async () => ({width: 400, height: 400});
  win.normalizeAsset = async file => new Blob(['ref:' + file.name], {type: 'image/jpeg'});
  win.crypto.randomUUID = win.crypto.randomUUID || (() => 'uuid-' + Math.random().toString(36).slice(2));
  vm.runInContext(inlineScript, ctx);
  vm.runInContext('(function(){' + productLibrarySrc + '})()', ctx);
  vm.runInContext('(function(){' + visualStudioSrc + '})()', ctx);
  return {dom, win};
}

async function readBack(name) {
  const products = await store.listProducts();
  return products.find(p => p.name === name);
}

// setup() triggers Products.refresh() as an internal, un-awaited side effect (exactly as a
// real click on "Business Brain" does), so wait for that render to land instead of calling
// Products.refresh() again ourselves — a second concurrent call would just race the first.
async function waitForRender(win, expected) {
  for (let i = 0; i < 50; i++) {
    if (win.document.getElementById('productList').querySelectorAll('.card').length >= expected) return;
    await new Promise(r => setTimeout(r, 5));
  }
}

// --- Page load 1: create both products ---
let {dom, win} = mountPage();
win.setup();

win.document.getElementById('productName').value = 'Wash Me';
const washBytes = new Uint8Array(2000).fill(1);
await win.Products.upload(new win.File([washBytes], 'wash.png', {type: 'image/png'}));
await win.Products.save();

win.document.getElementById('productName').value = 'النفسية محتاجه بحر';
const seaBytes = new Uint8Array(2000).fill(2);
await win.Products.upload(new win.File([seaBytes], 'sea.png', {type: 'image/png'}));
await win.Products.save();

let products = await store.listProducts();
assert.equal(products.length, 2, 'both products must be saved');
assert.ok(products.some(p => p.name === 'Wash Me'));
assert.ok(products.some(p => p.name === 'النفسية محتاجه بحر'));
dom.window.close();

// --- Page load 2: browser refresh; reopen Business Brain to view the library ---
({dom, win} = mountPage());
win.setup();
await waitForRender(win, 2);
assert.equal(win.document.getElementById('productList').querySelectorAll('.card').length, 2,
  'both products must render after a browser refresh');

// Blocked "Save & Start": Business Brain fields are still empty, so this must be
// rejected by validation and must not touch the product library at all.
await win.Visual.saveProject();
products = await store.listProducts();
assert.equal(products.length, 2, 'a validation-blocked Save & Start must not drop a product');

// Reopen Business Brain again (the exact trigger the founder hit the disappearance on).
win.setup();
await waitForRender(win, 2);
assert.equal(win.document.getElementById('productList').querySelectorAll('.card').length, 2,
  'both products must still render after reopening Business Brain');
products = await store.listProducts();
assert.equal(products.length, 2, 'both products must still exist in storage after reopening Business Brain');
dom.window.close();

// --- Page load 3: another reload, both products and their exact original bytes survive ---
({dom, win} = mountPage());
win.setup();
await waitForRender(win, 2);
assert.equal(win.document.getElementById('productList').querySelectorAll('.card').length, 2,
  'both products must still render after a second reload');

const wash = await readBack('Wash Me');
const sea = await readBack('النفسية محتاجه بحر');
assert.ok(wash && sea, 'both products must still be individually readable after a second reload');
assert.deepEqual(new Uint8Array(await wash.image.arrayBuffer()), washBytes, "Wash Me's exact image bytes must survive");
assert.deepEqual(new Uint8Array(await sea.image.arrayBuffer()), seaBytes, "the second product's exact image bytes must survive");
dom.window.close();

console.log('PASS V0.7 product persistence: two saved products with images both survive save, reload, a blocked Save & Start, Business Brain re-entry and another reload');
