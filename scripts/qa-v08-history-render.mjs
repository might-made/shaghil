import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { indexedDB } from 'fake-indexeddb';
import * as store from '../lib/visual-storage.mjs';
globalThis.indexedDB = globalThis.indexedDB || indexedDB;

// Regression for the Founder Live QA bug: the workspace import reported "7 new history
// entries imported", but the History screen then showed "ما فيه نتائج محفوظة حتى الآن."
// (no saved results). Traced end-to-end: importWorkspace() genuinely persists the entries
// (localStorage.setItem only runs, and summary.historyAdded is only set, after it succeeds),
// so the fragility is on the read side — getHistory()'s old filter silently dropped ANY
// entry whose `engine` field did not exactly match one of the six current internal keys via
// Object.hasOwn(titles, x.engine), with zero diagnostic: a stored-but-unrecognized entry was
// indistinguishable from no history at all. This uses the ACTUAL V0.7 saveHistory() entry
// shape — {engine, title, text, inputs, ts}, no id, no project field, exactly what the real
// DevTools recovery export produces from a real V0.7 origin — not a synthetic V0.8-only
// fixture, and includes a real reload between import and viewing History.

const html = fs.readFileSync('index.html', 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const stripImports = src => src.replace(/^import .*;\n/gm, '');
const productLibrarySrc = stripImports(fs.readFileSync('lib/product-library.mjs', 'utf8'));
const workspaceTransferSrc = stripImports(fs.readFileSync('lib/workspace-transfer.mjs', 'utf8')).replace(/^export (async function|function)/gm, '$1');
const visualStudioSrc = stripImports(fs.readFileSync('lib/visual-studio.mjs', 'utf8')).replace('export function splitIdeas', 'function splitIdeas');

const localMap = new Map();
const sharedLocalStorage = { getItem: k => localMap.get(k) ?? null, setItem: (k, v) => localMap.set(k, v), removeItem: k => localMap.delete(k) };

function mountPage() {
  const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
  const win = dom.window, ctx = dom.getInternalVMContext();
  win.store = store;
  win.structuredClone = structuredClone;
  win.Blob = Blob; win.File = File;
  Object.defineProperty(win, 'localStorage', { value: sharedLocalStorage, configurable: true });
  win.URL.createObjectURL = () => 'blob:qa-' + Math.random();
  win.URL.revokeObjectURL = () => {};
  win.decodeImage = async () => ({ width: 400, height: 400 });
  win.normalizeAsset = async file => new Blob(['ref:' + file.name], { type: 'image/jpeg' });
  win.crypto.randomUUID = win.crypto.randomUUID || (() => 'uuid-' + Math.random().toString(36).slice(2));
  win.confirm = () => true;
  vm.runInContext(inlineScript, ctx);
  vm.runInContext('(function(){' + productLibrarySrc + '})()', ctx);
  vm.runInContext('(function(){' + workspaceTransferSrc + '})()', ctx);
  vm.runInContext('(function(){' + visualStudioSrc + '})()', ctx);
  return { dom, win };
}

async function waitForRender(win, selector, expected) {
  for (let i = 0; i < 50; i++) {
    if (win.document.querySelectorAll(selector).length >= expected) return;
    await new Promise(r => setTimeout(r, 5));
  }
}

// The exact V0.7 Business Brain and the exact V0.7 saveHistory() entry shape (no id, no
// project — those fields did not exist before V0.8), one entry per engine plus a repeat,
// mirroring the real recovered Najoob workspace's reported 7 history entries.
const najoob = { name: 'نجوب', category: 'سفر', product: 'منظم سفر العائلة', customer: 'العائلة السعودية', location: 'السعودية', price: '150-300 SAR', tone: 'سعودي طبيعي', objective: 'زيادة المبيعات' };
const titlesArabic = { content: 'سوّ محتوى', copy: 'اكتب لي', offer: 'ابنِ عرض', whatsapp: 'رد على عميل', campaign: 'سوّ حملة', reel: 'اكتب Reel' };
const engines = ['content', 'copy', 'offer', 'whatsapp', 'campaign', 'reel', 'content'];
const v07History = engines.map((engine, i) => ({ engine, title: titlesArabic[engine], text: `## نتيجة ${i}\nمحتوى معتمد رقم ${i}`, inputs: {}, ts: 1000 + i }));
for (const entry of v07History) assert.ok(!('id' in entry) && !('project' in entry), 'the fixture must match the real V0.7 shape exactly (no id/project)');

const bundle = { shaghilWorkspace: 1, exportedAt: Date.now(), localStorage: { brain: najoob, shaghilHistory: v07History }, brand: null, products: [], visuals: [], packs: [] };

// --- V0.7 export -> V0.8 import ---
let { dom, win } = mountPage();
const file = new win.File([JSON.stringify(bundle)], 'shaghil-workspace-najoob.json', { type: 'application/json' });
await win.Workspace.import(file);
await waitForRender(win, '#home', 1);
const stored = JSON.parse(sharedLocalStorage.getItem('shaghilHistory'));
assert.equal(stored.length, 7, 'all 7 V0.7-shaped entries must be persisted');
dom.window.close();

// --- reload ---
({ dom, win } = mountPage());
assert.equal(win.document.getElementById('home').classList.contains('hidden'), false, 'reload must land on Home with the restored Business Brain');

// --- History screen -> all 7 visible ---
win.historyScreen();
assert.equal(win.document.getElementById('history').classList.contains('hidden'), false);
const items = win.document.querySelectorAll('#historyList .historyItem');
assert.equal(items.length, 7, 'all 7 imported V0.7 history entries must render after a reload, not "ما فيه نتائج محفوظة حتى الآن"');
assert.ok(!win.document.getElementById('historyList').textContent.includes('ما فيه نتائج محفوظة'), 'the empty-state message must not show when 7 entries are actually stored');
assert.ok([...items].some(i => i.textContent.includes('رد على عميل')), 'entries must render with their real Arabic engine titles');

// --- reopen one -> zero generation/network call ---
const requests = [];
win.fetch = async (url, opts) => { requests.push(JSON.parse(opts.body)); return { ok: true, status: 200, text: async () => JSON.stringify({ text: 'unexpected regeneration' }) }; };
win.openHistory(3); // the whatsapp entry
assert.equal(win.document.getElementById('output').classList.contains('hidden'), false, 'reopening must show the result screen');
assert.ok(win.document.getElementById('out').innerHTML.includes('نتيجة 3'), 'the reopened result must be the exact saved V0.7 text, not a new generation');
assert.equal(requests.length, 0, 'reopening an imported V0.7 result must make zero network requests');

dom.window.close();
console.log('PASS V0.8 history render: a real V0.7-shaped 7-entry export survives import + reload and all 7 render in History (not the empty-state message), and reopening one makes zero network requests');

// --- Hardening: getHistory() must never silently drop a stored, valid-text entry just
// because its `engine` field does not exactly match one of the six current internal keys.
// The old strict Object.hasOwn(titles, x.engine) check made exactly this class of entry
// (present in storage, valid text, any engine-field drift) indistinguishable from having
// no history at all -- the same symptom Founder observed. This proves the relaxed filter
// closes that entire class, not just the one clean fixture above.
({ dom, win } = mountPage());
sharedLocalStorage.setItem('shaghilHistory', JSON.stringify([
  { engine: 'content', title: 'سوّ محتوى', text: '## عادي\nنص عادي', inputs: {}, ts: 1 },
  { engine: 'unknown-future-engine', title: 'محرك جديد', text: '## محرك غير معروف\nنص محفوظ', inputs: {}, ts: 2 },
  { engine: undefined, text: '## بدون محرك\nنص بلا محرك محدد', inputs: {}, ts: 3 }
]));
win.historyScreen();
const hardenedItems = win.document.querySelectorAll('#historyList .historyItem');
assert.equal(hardenedItems.length, 3, 'a stored entry must never be silently dropped just because its engine field is unrecognized or missing, as long as it has real saved text');
dom.window.close();
console.log('PASS V0.8 history render hardening: entries with an unrecognized or missing engine field still render instead of vanishing silently');
