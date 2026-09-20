import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

// V0.9 Pilot Readiness regressions: lightweight first-run (quick start with only the
// 3 required Business Brain fields), the local-data-safety notice (shown once, dismissible,
// never nagging again), the "ابدأ من هنا" first-value hint (same dismiss-once pattern), and
// the Visual Studio generation wait UX (a live elapsed-time status plus a visible spinner,
// not a fake percentage). None of this touches persistence schema, APIs, or existing
// capability, so every V0.8 behavior these tests share a page with must keep passing too.

const html = fs.readFileSync('index.html', 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function mountPage() {
  const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
  const win = dom.window, ctx = dom.getInternalVMContext();
  vm.runInContext(inlineScript, ctx);
  return { dom, win, run: code => vm.runInContext(code, ctx) };
}

// --- 1. Lightweight first-run: quick start with only the 3 required fields ---
{
  const { dom, win, run } = mountPage();
  run("show('setup')");
  win.document.getElementById('name').value = 'نجوب';
  win.document.getElementById('product').value = 'منظم سفر العائلة';
  win.document.getElementById('customer').value = 'العائلة السعودية';
  // The quick-start button must call the existing saveBrain() directly (no Brand Brain
  // dependency) so it works even when brand/product-image storage is unavailable.
  const quickStartBtn = win.document.getElementById('quickStartBtn');
  assert.equal(quickStartBtn.getAttribute('onclick'), 'saveBrain()', 'the quick-start button must call the existing saveBrain(), not a new/duplicate code path');
  run('saveBrain()');
  assert.equal(win.document.getElementById('home').classList.contains('hidden'), false, 'quick start with only the 3 required fields must reach Home');
  const saved = JSON.parse(win.localStorage.getItem('brain'));
  assert.equal(saved.name, 'نجوب'); assert.equal(saved.product, 'منظم سفر العائلة'); assert.equal(saved.customer, 'العائلة السعودية');
  dom.window.close();
}

// --- Existing (pre-V0.9) full workspaces must continue working unchanged ---
{
  const { dom, win, run } = mountPage();
  const legacyBrain = { name: 'نجوب', category: 'سفر', product: 'منظم سفر العائلة', customer: 'العائلة السعودية', location: 'السعودية', price: '150-300 SAR', tone: 'سعودي طبيعي', objective: 'زيادة المبيعات' };
  win.localStorage.setItem('brain', JSON.stringify(legacyBrain));
  run('setup()');
  for (const [key, value] of Object.entries(legacyBrain)) assert.equal(win.document.getElementById(key).value, value, `pre-V0.9 field ${key} must still populate the setup form unchanged`);
  dom.window.close();
}

// --- 2. Local data safety notice: unmissable once, never repeated ---
{
  const { dom, win, run } = mountPage();
  run('setup()');
  assert.equal(win.document.getElementById('localDataNotice').classList.contains('hidden'), false, 'the local-data notice must show the first time a new user reaches setup');
  const notice = win.document.getElementById('localDataNotice').textContent;
  for (const term of ['IndexedDB', 'localStorage']) assert.ok(!notice.includes(term), 'customer-facing copy must never use technical storage terminology');
  assert.ok(notice.includes('هذا الجهاز') || notice.includes('هذا المتصفح'), 'the notice must explain data is device/browser-local in plain Arabic');
  run('dismissLocalDataNotice()');
  assert.equal(win.document.getElementById('localDataNotice').classList.contains('hidden'), true, 'dismissing must hide the notice immediately');
  assert.equal(win.localStorage.getItem('localDataNoticeDismissed'), '1');
  // Re-entering setup (e.g. via "تعديل") must never show it again once dismissed.
  run('setup()');
  assert.equal(win.document.getElementById('localDataNotice').classList.contains('hidden'), true, 'the notice must not reappear on a later setup() visit once dismissed');
  dom.window.close();
}

// --- 3. First-value guidance: dismissible "ابدأ من هنا", not a tutorial ---
{
  const { dom, win, run } = mountPage();
  win.localStorage.setItem('brain', JSON.stringify({ name: 'نجوب', category: '', product: 'منظم سفر', customer: 'عائلات', location: '', price: '', tone: '', objective: '' }));
  run('home()');
  assert.equal(win.document.getElementById('firstValueHint').classList.contains('hidden'), false, 'the first-value hint must show on Home before it has been dismissed');
  const hintText = win.document.getElementById('firstValueHint').textContent;
  assert.ok(hintText.includes('سوّ محتوى') && hintText.includes('رد على عميل'), 'the hint must point at the two lowest-friction engines');
  run('dismissFirstValueHint()');
  assert.equal(win.document.getElementById('firstValueHint').classList.contains('hidden'), true);
  assert.equal(win.localStorage.getItem('firstValueHintDismissed'), '1');
  run('home()');
  assert.equal(win.document.getElementById('firstValueHint').classList.contains('hidden'), true, 'the hint must stay hidden on every later Home visit once dismissed — no repeated nagging');
  dom.window.close();
}

// --- 4. Visual Studio generation wait UX: real elapsed time, no fake percentage, visible spinner ---
{
  const { dom, win, run } = mountPage();
  let controller = fs.readFileSync('lib/visual-studio.mjs', 'utf8').replace(/^import .*;\n/gm, '').replace('export function splitIdeas', 'function splitIdeas');
  win.structuredClone = structuredClone;
  win.store = { loadBrand: async () => ({ primary: '#e7f95b', secondary: '#181b1f', accent: '', style: '', logo: null, references: [] }), listProducts: async () => [], saveVisual: async () => {}, listPacks: async () => [] };
  win.normalizeAsset = async f => f;
  win.composeVisual = async () => new Blob(['composited'], { type: 'image/png' });
  win.blobPayload = async () => ({ type: 'image/png', base64: 'AA==' });
  win.responseBlob = () => new Blob(['bg'], { type: 'image/jpeg' });
  win.URL.createObjectURL = () => 'blob:qa-' + Math.random();
  win.URL.revokeObjectURL = () => {};
  win.crypto.randomUUID = win.crypto.randomUUID || (() => 'uuid-' + Math.random().toString(36).slice(2));
  let release;
  win.fetch = async () => new Promise(r => { release = () => r({ ok: true, json: async () => ({ base64: 'AA==', mime: 'image/jpeg', direction: 1, model: 'mock' }) }) });
  win.localStorage.setItem('brain', JSON.stringify({ name: 'نجوب', category: 'سفر', product: 'منظم سفر العائلة', customer: 'العائلة السعودية', location: 'السعودية', price: '150-300 SAR', tone: 'سعودي طبيعي', objective: 'زيادة المبيعات' }));
  vm.runInContext('(function(){' + controller + '})()', dom.getInternalVMContext());
  run("current='content';lastText='## اليوم الأول: فكرة\\nمحتوى تجريبي';lastInputs={period:'7 أيام'}");
  await run('Visual.choose()');

  const spinners = () => [...win.document.querySelectorAll('.visualSpin')];
  assert.ok(spinners().length >= 1, 'a visible spinner element must exist for the generation wait');
  assert.ok(spinners().every(s => s.classList.contains('hidden')), 'the spinner must be hidden before generation starts');

  const generatePromise = run('Visual.generate()');
  await new Promise(r => setTimeout(r, 0));
  assert.ok(spinners().every(s => !s.classList.contains('hidden')), 'the spinner must become visible while a visual is generating');
  const firstStatus = win.document.getElementById('visualStatus').textContent;
  assert.ok(/\d+\s*ثانية/.test(firstStatus), 'the wait status must show a real elapsed-time count in Arabic');
  assert.ok(!/%/.test(firstStatus), 'the wait status must never show a fabricated percentage');

  await new Promise(r => setTimeout(r, 1100));
  const laterStatus = win.document.getElementById('visualStatus').textContent;
  assert.notEqual(laterStatus, firstStatus, 'the elapsed-time status must keep updating while the request is still in flight, proving it is live, not static text');

  release();
  await generatePromise;
  assert.ok(spinners().every(s => s.classList.contains('hidden')), 'the spinner must hide again once generation completes');
  dom.window.close();
}

console.log('PASS V0.9 pilot readiness: quick start with only the 3 required fields, pre-V0.9 full workspaces still populate unchanged, the local-data notice shows once and never repeats, the first-value hint is dismissible and non-repeating, and Visual Studio\'s generation wait shows a live elapsed-time status with a visible spinner and no fake percentage');
