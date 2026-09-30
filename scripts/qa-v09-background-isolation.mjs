import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { isolateProduct, __setLoaderForTests } from '../lib/background-removal.mjs';

// Regression for the Founder Live QA bug: EXACT-fidelity compositing drew the entire source
// product photo rectangle — original background included — onto the generated scene, for both
// the first generation and "تغيير الخلفية". Root cause: composeVisual() never isolated the
// product from its background at all; it just decoded and drew the whole stored Blob. The fix
// adds lib/background-removal.mjs (a purpose-built client-side segmentation model, not a naive
// white/near-white pixel deletion, and never a generative redraw of the product) and wires its
// output into composeVisual()'s existing exact-fidelity branch, shared by every caller.

// --- Part A: background-removal.mjs — isolation decision logic, in isolation ---
{
  const opaqueJpeg = new Blob(['opaque photo bytes'], { type: 'image/jpeg' });
  const isolatedResult = new Blob(['isolated pixels'], { type: 'image/png' });
  let calls = [];
  __setLoaderForTests(async () => ({ removeBackground: async (blob, opts) => { calls.push({ blob, opts }); return isolatedResult } }));

  // 1. Opaque-background product (JPEG can never carry transparency) must be isolated.
  calls = [];
  const result1 = await isolateProduct(opaqueJpeg, 'wash-me:100');
  assert.equal(calls.length, 1, 'an opaque-background product must be sent through real background isolation');
  assert.equal(result1, isolatedResult, 'composited output must be the isolated result, not the raw original');

  // 6. Caching: the same product/size must not re-run isolation on every compose.
  calls = [];
  await isolateProduct(opaqueJpeg, 'wash-me:100');
  assert.equal(calls.length, 0, 'a repeated isolation for the same product+size must reuse the cached result, not recompute it');

  // A replaced product image (same id, different byte size, e.g. after "تعديل") must not
  // reuse a stale mask computed for the old photo.
  calls = [];
  await isolateProduct(new Blob(['a new, different photo'], { type: 'image/jpeg' }), 'wash-me:999');
  assert.equal(calls.length, 1, 'a different cache key (e.g. after replacing the product photo) must recompute isolation, never reuse a stale mask');

  console.log('PASS V0.9 background isolation: opaque-background products are sent through real isolation, and results are cached per product+size without ever reusing a stale mask after a replaced photo');
}

// --- 2/3. Transparent product: pass through unchanged, isolation never invoked ---
{
  const savedBitmap = globalThis.createImageBitmap, savedDocument = globalThis.document;
  const alphaData = (alpha) => { const data = new Uint8ClampedArray(5 * 5 * 4); for (let i = 3; i < data.length; i += 4) data[i] = alpha; return { data } };
  globalThis.createImageBitmap = async () => ({ width: 5, height: 5 });
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage() {}, getImageData: () => alphaData(120) }) }) };
  let calls = [];
  __setLoaderForTests(async () => ({ removeBackground: async (blob) => { calls.push(blob); return new Blob(['should not be used'], { type: 'image/png' }) } }));
  const transparentPng = new Blob(['already-transparent product'], { type: 'image/png' });
  const result = await isolateProduct(transparentPng, 'wash-me-transparent:1');
  assert.equal(calls.length, 0, 'a product photo that already has a real transparent background must never be run through isolation again');
  assert.equal(result, transparentPng, 'an already-transparent product must pass through byte-for-byte unchanged');
  console.log('PASS V0.9 background isolation: a product photo that already has real transparency is preserved untouched and isolation is skipped entirely');

  // 4. A fully OPAQUE but light/white product (e.g. Wash Me) must not be mistaken for
  // "already transparent" merely because its pixels are light — the check only ever reads
  // the real alpha channel, never pixel color, so a white opaque photo still gets isolated.
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage() {}, getImageData: () => alphaData(255) }) }) };
  calls = [];
  const whiteOpaquePng = new Blob(['white product, fully opaque'], { type: 'image/png' });
  const isolatedWhite = new Blob(['isolated white product'], { type: 'image/png' });
  __setLoaderForTests(async () => ({ removeBackground: async () => isolatedWhite }));
  const whiteResult = await isolateProduct(whiteOpaquePng, 'wash-me-white:1');
  assert.equal(whiteResult, isolatedWhite, 'a light/white but fully opaque product must still go through real isolation, never skipped just because its pixels are light-colored');
  globalThis.createImageBitmap = savedBitmap; globalThis.document = savedDocument;
  console.log('PASS V0.9 background isolation: a light/white opaque product is never mistaken for already-transparent — the decision is based only on the real alpha channel, never pixel color');
}

// --- Isolation failure must degrade safely: generation still completes, never crashes ---
{
  __setLoaderForTests(async () => { throw new Error('CDN unreachable in this environment') });
  const result = await isolateProduct(new Blob(['x'], { type: 'image/jpeg' }), undefined).catch(e => e);
  assert.ok(result instanceof Error, 'isolateProduct must propagate a real failure to its caller rather than silently returning something wrong');
  console.log('PASS V0.9 background isolation: an isolation failure is a real, propagated error, not silently swallowed into a wrong result');
}

// --- Part B: composeVisual integration — the real pipeline draws the isolated product ---
{
  const isolatedResult = new Blob(['isolated for compose'], { type: 'image/png' });
  __setLoaderForTests(async () => ({ removeBackground: async () => isolatedResult }));
  const saved = { document: globalThis.document, Image: globalThis.Image, create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  const blobs = new Map(); let serial = 0;
  URL.createObjectURL = b => { const id = 'blob:qa-' + (++serial); blobs.set(id, b); return id };
  URL.revokeObjectURL = () => {};
  globalThis.Image = class { set src(url) { this.blob = blobs.get(url); this.width = 300; this.height = 200; queueMicrotask(() => this.onload()) } };
  const draws = [];
  const paint = { drawImage(...a) { draws.push(a) }, fillRect() {}, measureText(t) { return { width: t.length * 18 } }, fillText() {} };
  globalThis.document = { createElement: () => ({ getContext: () => paint, toBlob: fn => fn(new Blob(['canvas'])) }) };
  try {
    const { composeVisual } = await import('../lib/visual-canvas.mjs');
    const background = new Blob(['scene']);
    const original = new Blob(['wash me original with white studio background'], { type: 'image/jpeg' });
    const report = {};
    draws.length = 0;
    await composeVisual(background, {}, { format: '1:1', textMode: 'none', productSize: 'medium', productPosition: 'center', productVertical: 'middle' }, { id: 'wash-me', image: original, fidelity: 'exact' }, report);
    assert.equal(draws.length, 2, 'the background and the isolated product must each be drawn exactly once');
    assert.equal(draws[1][0].blob, isolatedResult, 'composeVisual must composite the ISOLATED product, not the raw source rectangle with its original background');
    assert.equal(report.isolationFailed, undefined, 'a successful isolation must not report a failure');

    // 5. تغيير الخلفية regenerates only the background but reuses the exact same composeVisual
    // call (same signature, same isolation path) — proving no separate/divergent implementation.
    draws.length = 0;
    const newBackground = new Blob(['different scene']);
    const report2 = {};
    await composeVisual(newBackground, {}, { format: '1:1', textMode: 'none', productSize: 'medium', productPosition: 'center', productVertical: 'middle' }, { id: 'wash-me', image: original, fidelity: 'exact' }, report2);
    assert.equal(draws[1][0].blob, isolatedResult, 'a تغيير الخلفية-style recompose with a new background must still draw the isolated product, using the same corrected pipeline');

    // Isolation failure must never block generation: it must fall back to the original image
    // and report a clear warning rather than crashing or silently producing nothing.
    __setLoaderForTests(async () => { throw new Error('offline') });
    draws.length = 0;
    const reportFail = {};
    const fallback = await composeVisual(background, {}, { format: '1:1', textMode: 'none', productSize: 'medium', productPosition: 'center', productVertical: 'middle' }, { id: 'wash-me-2', image: original, fidelity: 'exact' }, reportFail);
    assert.ok(fallback instanceof Blob, 'a compositing result must still be produced even when isolation fails');
    assert.equal(reportFail.isolationFailed, true, 'a failed isolation must be reported so the caller can surface a clear warning instead of silently keeping the old bug');
    assert.equal(draws[1][0].blob, original, 'on isolation failure, the fallback must be the original image (never a crash, never an empty composite)');
  } finally {
    globalThis.document = saved.document; globalThis.Image = saved.Image; URL.createObjectURL = saved.create; URL.revokeObjectURL = saved.revoke;
  }
  console.log('PASS V0.9 background isolation: composeVisual composites the isolated product (not the raw rectangle) on both first generation and a تغيير الخلفية-style recompose, and degrades safely with a reported warning if isolation fails');
}

// --- 4 (payload boundary). EXACT mode still never sends the product image to the generation
// model — isolation happens only in the local compositor, so the product is never redrawn/
// approximated by AI. ---
{
  const { normalizeVisual } = await import('../api/visual.mjs');
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
  const body = { brain: { name: 'نجوب', product: 'منظم سفر', customer: 'العائلة', category: '', location: '', price: '', tone: '', objective: '' }, brand: { primary: '#e7f95b', secondary: '#181b1f', accent: '', style: '', references: [] }, task: { engine: 'content', selected: 'الفكرة', context: 'الفكرة' }, settings: { format: '1:1', mode: 'Product Hero', textMode: 'none' }, product: { name: 'Wash Me', description: '', fidelity: 'exact', image: { type: 'image/png', base64: png } } };
  const normalized = normalizeVisual(body);
  assert.equal(normalized.images.length, 0, 'EXACT-fidelity product images must never be forwarded to the generation model — background isolation is local-only and cannot become an AI redraw');
  console.log('PASS V0.9 background isolation: EXACT mode still never sends the product image to the generation model, confirming isolation cannot become an AI redraw of the product');
}

// --- 6/7. Saved Visual History contains the corrected composite; wiring reaches saveVisual ---
{
  const html = fs.readFileSync('index.html', 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
  const win = dom.window, ctx = dom.getInternalVMContext();
  const isolatedComposite = new Blob(['final isolated composite'], { type: 'image/png' });
  const savedRecords = [];
  win.store = { loadBrand: async () => ({ primary: '#e7f95b', secondary: '#181b1f', accent: '', style: '', logo: null, references: [] }), listProducts: async () => [{ id: 'wash-me', name: 'Wash Me', description: '', fidelity: 'exact', image: new Blob(['orig']), reference: new Blob(['orig']) }], saveVisual: async r => { savedRecords.push(r) }, listPacks: async () => [] };
  win.structuredClone = structuredClone;
  win.normalizeAsset = async f => f;
  win.composeVisual = async (bg, brand, settings, product, report) => isolatedComposite;
  win.blobPayload = async () => ({ type: 'image/png', base64: 'AA==' });
  win.responseBlob = () => new Blob(['bg'], { type: 'image/jpeg' });
  win.URL.createObjectURL = () => 'blob:qa-' + Math.random();
  win.URL.revokeObjectURL = () => {};
  win.crypto.randomUUID = win.crypto.randomUUID || (() => 'uuid-' + Math.random().toString(36).slice(2));
  win.fetch = async () => ({ ok: true, json: async () => ({ base64: 'AA==', mime: 'image/jpeg', direction: 1, model: 'mock' }) });
  win.localStorage.setItem('brain', JSON.stringify({ name: 'نجوب', category: 'سفر', product: 'منظم سفر العائلة', customer: 'العائلة السعودية', location: 'السعودية', price: '150-300 SAR', tone: 'سعودي طبيعي', objective: 'زيادة المبيعات' }));
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], ctx);
  const controller = fs.readFileSync('lib/visual-studio.mjs', 'utf8').replace(/^import .*;\n/gm, '').replace('export function splitIdeas', 'function splitIdeas');
  vm.runInContext('(function(){' + controller + '})()', ctx);
  const run = code => vm.runInContext(code, ctx);
  run("current='content';lastText='## الفكرة\\nمحتوى تجريبي';lastInputs={period:'7 أيام'}");
  await run('Visual.choose()');
  win.document.getElementById('visualProduct').value = 'wash-me';
  run('Visual.selectProduct()');
  await run('Visual.generate()');
  assert.equal(savedRecords.length, 1);
  assert.equal(savedRecords[0].rendered, isolatedComposite, 'the record persisted to Visual History must be the corrected isolated composite composeVisual actually returned');
  dom.window.close();
  console.log('PASS V0.9 background isolation: the composite saved to Visual History is exactly the corrected output of composeVisual, not a stale/raw rectangle');
}

console.log('PASS V0.9 background isolation: full regression suite for the EXACT-fidelity background isolation fix');
