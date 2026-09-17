import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { indexedDB } from 'fake-indexeddb';
import * as store from '../lib/visual-storage.mjs';
globalThis.indexedDB = globalThis.indexedDB || indexedDB;

// Regression for the Founder Live QA blocker: after a successful workspace import, Home had
// no visible way to reach السجل (History) — the only "السجل" buttons lived inside a result
// screen the Founder had to already be on, and the persistent top nav only offered الرئيسية
// and Business Brain. This drives the real page/top-nav button to prove History is reachable
// from a fresh Home, renders imported entries, reopens one without a new request, and keeps
// delete confirmation-guarded.

const html = fs.readFileSync('index.html', 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const stripImports = src => src.replace(/^import .*;\n/gm, '');
const productLibrarySrc = stripImports(fs.readFileSync('lib/product-library.mjs', 'utf8'));
const workspaceTransferSrc = stripImports(fs.readFileSync('lib/workspace-transfer.mjs', 'utf8')).replace(/^export (async function|function)/gm, '$1');
const visualStudioSrc = stripImports(fs.readFileSync('lib/visual-studio.mjs', 'utf8')).replace('export function splitIdeas', 'function splitIdeas');

const localMap = new Map();
const sharedLocalStorage = { getItem: k => localMap.get(k) ?? null, setItem: (k, v) => localMap.set(k, v), removeItem: k => localMap.delete(k) };
let confirmResult = true;

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
  win.confirm = () => confirmResult;
  vm.runInContext(inlineScript, ctx);
  vm.runInContext('(function(){' + productLibrarySrc + '})()', ctx);
  vm.runInContext('(function(){' + workspaceTransferSrc + '})()', ctx);
  vm.runInContext('(function(){' + visualStudioSrc + '})()', ctx);
  return { dom, win };
}

function makeBundle() {
  const najoob = { name: 'نجوب', category: 'سفر', product: 'منظم سفر العائلة', customer: 'العائلة السعودية', location: 'السعودية', price: '150-300 SAR', tone: 'سعودي طبيعي', objective: 'زيادة المبيعات' };
  const engines = ['content', 'copy', 'offer', 'whatsapp', 'campaign', 'reel', 'content'];
  const shaghilHistory = engines.map((engine, i) => ({ id: 'h' + i, engine, title: engine, project: 'نجوب', text: `## نتيجة ${i}\nمحتوى معتمد رقم ${i}`, inputs: {}, ts: 1000 + i }));
  return { najoob, bundle: { shaghilWorkspace: 1, exportedAt: Date.now(), localStorage: { brain: najoob, shaghilHistory }, brand: null, products: [], visuals: [], packs: [] } };
}

async function waitForRender(win, selector, expected) {
  for (let i = 0; i < 50; i++) {
    if (win.document.querySelectorAll(selector).length >= expected) return;
    await new Promise(r => setTimeout(r, 5));
  }
}

const { najoob, bundle } = makeBundle();
const { dom, win } = mountPage();
const file = new win.File([JSON.stringify(bundle)], 'shaghil-workspace-najoob.json', { type: 'application/json' });
await win.Workspace.import(file);
await waitForRender(win, '#home', 1);
assert.equal(win.document.getElementById('home').classList.contains('hidden'), false, 'a fresh import must land on Home');

// --- fresh Home -> the history nav button must be visible ---
const navButtons = [...win.document.querySelector('.top > div:last-child').querySelectorAll('button')];
assert.deepEqual(navButtons.map(b => b.textContent), ['الرئيسية', 'Business Brain', 'السجل'], 'the persistent top nav must offer السجل alongside الرئيسية and Business Brain');
const historyButton = navButtons.find(b => b.textContent === 'السجل');
assert.ok(historyButton, 'السجل must be visible on a fresh Home');

// --- click the button -> History opens ---
// jsdom's runScripts:'outside-only' (needed so this file, not jsdom, controls script
// execution) does not wire up inline onclick="..." attributes to real click() events, so
// this evaluates the button's own onclick attribute text -- exactly what a real click fires.
const onclick = historyButton.getAttribute('onclick');
assert.equal(onclick, 'historyScreen()', 'the button must be wired to historyScreen()');
win.historyScreen();
assert.equal(win.document.getElementById('history').classList.contains('hidden'), false, 'clicking the button must open the History screen');
assert.equal(win.document.getElementById('home').classList.contains('hidden'), true);

// --- imported 7 history entries render ---
const items = win.document.querySelectorAll('#historyList .historyItem');
assert.equal(items.length, 7, 'all 7 imported history entries must render');
assert.ok([...items].every(i => i.textContent.includes('نجوب')), 'each entry must show its project name');

// --- reopen one saved result works without regeneration ---
const requests = [];
win.fetch = async (url, opts) => { requests.push(JSON.parse(opts.body)); return { ok: true, status: 200, text: async () => JSON.stringify({ text: 'unexpected regeneration' }) }; };
win.openHistory(2);
assert.equal(win.document.getElementById('output').classList.contains('hidden'), false, 'reopening a saved result must show the result screen');
assert.ok(win.document.getElementById('out').innerHTML.includes('نتيجة 2'), 'the reopened result must be the exact saved text, not a new generation');
assert.equal(requests.length, 0, 'reopening a saved result must make zero network requests');
assert.equal(win.document.getElementById('saveResultBtn').disabled, true, 'a reopened saved result is already marked saved');

// --- delete remains confirmation-guarded ---
win.historyScreen();
const before = win.document.querySelectorAll('#historyList .historyItem').length;
confirmResult = false;
win.deleteResult(0);
assert.equal(JSON.parse(sharedLocalStorage.getItem('shaghilHistory')).length, before, 'declining the confirmation must not delete anything');
confirmResult = true;
win.deleteResult(0);
assert.equal(JSON.parse(sharedLocalStorage.getItem('shaghilHistory')).length, before - 1, 'confirming must remove exactly the targeted entry');

dom.window.close();
console.log('PASS V0.8 history navigation: the top-nav history button is visible on a fresh Home, opens History on click, renders all imported entries, reopens a saved result without regenerating it, and delete stays confirmation-guarded');
