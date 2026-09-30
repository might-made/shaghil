import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { indexedDB } from 'fake-indexeddb';
import * as store from '../lib/visual-storage.mjs';
globalThis.indexedDB = globalThis.indexedDB || indexedDB;

// Regression for the Founder Live QA blocker: the workspace Export/Import UI was added only
// to the Business Brain *summary* screen (#brain), which brainScreen() only ever shows once
// a Business Brain already exists — on a brand-new, empty origin it always redirects to the
// empty setup() form instead, so the import control the Founder needed most was unreachable.
// This drives the real page (real setup()/home()/Products/Workspace code, not mocks) on a
// truly empty origin, proves the import control is visible there, imports a real recovered
// workspace, and proves it survives a simulated reload.

const html = fs.readFileSync('index.html', 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const stripImports = src => src.replace(/^import .*;\n/gm, '');
const productLibrarySrc = stripImports(fs.readFileSync('lib/product-library.mjs', 'utf8'));
const workspaceTransferSrc = stripImports(fs.readFileSync('lib/workspace-transfer.mjs', 'utf8')).replace(/^export (async function|function)/gm, '$1');
const visualStudioSrc = stripImports(fs.readFileSync('lib/visual-studio.mjs', 'utf8')).replace('export function splitIdeas', 'function splitIdeas');

// A shared, Map-backed localStorage across every mountPage() call, standing in for a real
// browser's actual per-origin persistence — jsdom itself gives every `new JSDOM()` its own
// isolated localStorage even for the same url, which would falsely fail the reload check.
const localMap = new Map();
const sharedLocalStorage = { getItem: k => localMap.get(k) ?? null, setItem: (k, v) => localMap.set(k, v), removeItem: k => localMap.delete(k) };

function mountPage() {
  const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
  const win = dom.window, ctx = dom.getInternalVMContext();
  win.store = store;
  win.structuredClone = structuredClone;
  win.Blob = Blob; win.File = File; // jsdom's own Blob/File can't round-trip through fake-indexeddb
  Object.defineProperty(win, 'localStorage', { value: sharedLocalStorage, configurable: true });
  win.URL.createObjectURL = () => 'blob:qa-' + Math.random();
  win.URL.revokeObjectURL = () => {};
  win.decodeImage = async () => ({ width: 400, height: 400 });
  win.normalizeAsset = async file => new Blob(['ref:' + file.name], { type: 'image/jpeg' });
  win.crypto.randomUUID = win.crypto.randomUUID || (() => 'uuid-' + Math.random().toString(36).slice(2));
  vm.runInContext(inlineScript, ctx);
  vm.runInContext('(function(){' + productLibrarySrc + '})()', ctx);
  vm.runInContext('(function(){' + workspaceTransferSrc + '})()', ctx);
  vm.runInContext('(function(){' + visualStudioSrc + '})()', ctx);
  return { dom, win };
}

function makeBundle() {
  const najoob = { name: 'نجوب', category: 'سفر', product: 'منظم سفر العائلة', customer: 'العائلة السعودية', location: 'السعودية', price: '150-300 SAR', tone: 'سعودي طبيعي', objective: 'زيادة المبيعات' };
  const b64 = bytes => Buffer.from(bytes).toString('base64');
  const washBytes = new Uint8Array(500).fill(1), seaBytes = new Uint8Array(500).fill(2);
  return {
    najoob, washBytes, seaBytes,
    bundle: {
      shaghilWorkspace: 1, exportedAt: Date.now(),
      localStorage: {
        brain: najoob,
        shaghilHistory: [
          { id: 'h1', engine: 'campaign', title: 'سوّ حملة', project: 'نجوب', text: '## حملة نجوب\nنتيجة معتمدة', inputs: { occasion: '', duration: '7 أيام' }, ts: 1000 },
          { id: 'h2', engine: 'whatsapp', title: 'رد على عميل', project: 'نجوب', text: '## رد\nنص الرد', inputs: { message: 'كم السعر؟' }, ts: 2000 }
        ]
      },
      brand: null,
      products: [
        { id: 'wash-me', name: 'Wash Me', description: 'منتج تنظيف', fidelity: 'exact', image: { __blob: true, type: 'image/png', data: b64(washBytes) }, reference: { __blob: true, type: 'image/jpeg', data: b64(washBytes) } },
        { id: 'sea', name: 'النفسية محتاجه بحر', description: 'منتج سفر', fidelity: 'exact', image: { __blob: true, type: 'image/png', data: b64(seaBytes) }, reference: { __blob: true, type: 'image/jpeg', data: b64(seaBytes) } }
      ],
      visuals: [], packs: []
    }
  };
}

async function waitForRender(win, selector, expected) {
  for (let i = 0; i < 50; i++) {
    if (win.document.querySelectorAll(selector).length >= expected) return;
    await new Promise(r => setTimeout(r, 5));
  }
}

// --- 1. Empty origin: the import control must be visible on the empty Business Brain screen. ---
let { dom, win } = mountPage();
assert.equal(win.getBrain?.() ?? JSON.parse(sharedLocalStorage.getItem('brain') || 'null'), null, 'origin must start with no Business Brain');
win.setup(); // exactly what clicking "ابدأ" does on a brand-new origin
assert.equal(win.document.getElementById('setup').classList.contains('hidden'), false, 'the empty Business Brain form must be showing');
const importInput = win.document.getElementById('workspaceImportFileSetup');
assert.ok(importInput, 'an import file input must exist on the empty Business Brain screen');
assert.equal(win.document.getElementById('setup').contains(importInput), true, 'the import control must live inside the empty setup screen, not only the post-creation summary');
assert.equal(typeof win.Workspace?.import, 'function', 'Workspace.import must be wired up and callable from this screen');

// --- 2-4. Import the recovered workspace: Business Brain, both products and history restored. ---
const { najoob, washBytes, seaBytes, bundle } = makeBundle();
const file = new win.File([JSON.stringify(bundle)], 'shaghil-workspace-najoob.json', { type: 'application/json' });
await win.Workspace.import(file);
await waitForRender(win, '#home', 1); // home() navigation after a successful import is async-adjacent

assert.deepEqual(JSON.parse(sharedLocalStorage.getItem('brain')), najoob, 'Business Brain must be restored exactly');
assert.equal(win.document.getElementById('home').classList.contains('hidden'), false, 'a restored Business Brain must land the Founder on Home, not leave them on the empty form');
assert.ok(win.document.getElementById('hello').textContent.includes('نجوب'), 'Home must reflect the restored business name');

const products = await store.listProducts();
assert.equal(products.length, 2, 'both Product Library entries must be restored');
const wash = products.find(p => p.name === 'Wash Me'), sea = products.find(p => p.name === 'النفسية محتاجه بحر');
assert.ok(wash && sea);
assert.deepEqual(new Uint8Array(await wash.image.arrayBuffer()), washBytes);
assert.deepEqual(new Uint8Array(await sea.image.arrayBuffer()), seaBytes);

const history = JSON.parse(sharedLocalStorage.getItem('shaghilHistory'));
assert.equal(history.length, 2, 'result history must be restored');
assert.ok(history.some(h => h.project === 'نجوب' && h.engine === 'campaign'));

// Confirm the restored library actually renders through the real UI, not just the store.
win.setup();
await waitForRender(win, '#productList .card', 2);
assert.equal(win.document.querySelectorAll('#productList .card').length, 2, 'the Product Library UI must show both restored products');
dom.window.close();

// --- 5. Reload: a brand-new page mount (same underlying origin storage) still has everything. ---
({ dom, win } = mountPage());
assert.deepEqual(JSON.parse(sharedLocalStorage.getItem('brain')), najoob, 'Business Brain must still be present after a reload');
assert.equal(win.document.getElementById('home').classList.contains('hidden'), false, 'reloading a populated origin must land on Home, not welcome');
win.setup();
await waitForRender(win, '#productList .card', 2);
assert.equal(win.document.querySelectorAll('#productList .card').length, 2, 'both products must still render after a reload');
assert.equal(JSON.parse(sharedLocalStorage.getItem('shaghilHistory')).length, 2, 'history must still be present after a reload');
dom.window.close();

console.log('PASS V0.8 import recovery UI: the import control is visible on the empty Business Brain screen, importing a recovered workspace restores Business Brain/both products/history and lands on Home, and all of it survives a reload');
