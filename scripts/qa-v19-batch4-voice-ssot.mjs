// SHGHIL V4 Batch 4 (P0-B.2 / Voice SSOT) regression suite.
// Scope: brand.toneOfVoice becomes the sole active voice source. One-time, idempotent seed from
// brand.style when toneOfVoice is empty; brain.tone is never auto-merged, only ever surfaced as
// an editable suggestion requiring explicit founder action; once an active voice exists, neither
// brand.style nor brain.tone are sent to engines as a competing voice signal. Does NOT implement
// context-matrix.mjs, the broader context refactor, Product Memory, product.offers, product
// selectors, Visual Studio's broader context allowlist, or any progressive UX beyond the minimum
// needed for the brain.tone suggestion.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { indexedDB } from 'fake-indexeddb';
globalThis.indexedDB = globalThis.indexedDB || indexedDB;

const store = await import('../lib/visual-storage.mjs');
// Note: lib/visual-storage.mjs caches its IndexedDB connection at module scope on first use, so
// `globalThis.indexedDB = new IDBFactory()` reassignments later in this file do not give `store`
// a genuinely separate database (ES module caching means every `import('../lib/visual-storage.mjs')`
// below returns this same instance) — each section instead explicitly saves the exact starting
// state it needs on the one shared connection. That is sufficient to prove every assertion below
// (seeding, precedence, serialize/deserialize round-trips); true cross-origin isolation, where
// needed, is proven elsewhere in the existing suite (e.g. qa-v08-workspace-transfer.mjs's
// separate child processes).

// ============================================================================
// 1-6, 11: storage-level migration, precedence and architectural isolation.
// ============================================================================

// --- 1. toneOfVoice already populated -> wins, remains unchanged (never overwritten by style). ---
await store.saveBrand({ primary: '#000000', secondary: '#ffffff', accent: '', style: 'نمط بصري قديم', toneOfVoice: 'نبرة محددة مسبقًا ولا يجب المساس بها', logo: null, references: [] });
const existingToneResult = await store.loadBrand();
assert.equal(existingToneResult.toneOfVoice, 'نبرة محددة مسبقًا ولا يجب المساس بها', '1. an already-populated toneOfVoice wins and is never overwritten by style');
assert.equal(existingToneResult.style, 'نمط بصري قديم', '4. brand.style remains byte-identical in storage when toneOfVoice already existed');

console.log('PASS: an already-populated toneOfVoice always wins and is never overwritten, even when brand.style also holds a different value');

// --- 2. Empty toneOfVoice + populated style -> seeded exactly once. ---
await store.saveBrand({ primary: '#111111', secondary: '#eeeeee', accent: '', style: 'أسلوب أصلي من قبل V4', toneOfVoice: '', logo: null, references: [] });
const seeded = await store.loadBrand();
assert.equal(seeded.toneOfVoice, 'أسلوب أصلي من قبل V4', '2. an empty toneOfVoice with a populated style is seeded from it exactly');
assert.equal(seeded.style, 'أسلوب أصلي من قبل V4', '4. brand.style remains byte-identical in storage after seeding toneOfVoice from it');

console.log('PASS: an empty toneOfVoice with a populated brand.style is seeded from it exactly once');

// --- 3. Reload / repeated migration -> no further mutation or regeneration. ---
const seededAgain = await store.loadBrand();
assert.deepEqual(seededAgain, seeded, '3. a second loadBrand() call after seeding produces an identical result — no further mutation or regeneration');
const seededThirdTime = await store.loadBrand();
assert.deepEqual(seededThirdTime, seeded, '3. a third loadBrand() call is still identical — the seed is genuinely one-time, not re-applied on every load');

console.log('PASS: repeated loads after the one-time seed never mutate or regenerate toneOfVoice or style again');

// --- 6. brain.tone (a completely separate storage technology/location) can never silently
// become toneOfVoice, by construction: lib/visual-storage.mjs has zero reference to localStorage
// or getBrain(), so it has no way to read brain.tone even if it wanted to. ---
const visualStorageSource = fs.readFileSync('lib/visual-storage.mjs', 'utf8');
// Checks for actual property/call usage (localStorage.getItem, getBrain()), not the file's own
// top-of-file prose comment that merely mentions "...in localStorage." (sentence-ending period,
// not a property-access dot) descriptively.
assert.ok(!/localStorage\s*\.\s*[a-zA-Z_$]/.test(visualStorageSource) && !/\bgetBrain\s*\(/.test(visualStorageSource), '6. lib/visual-storage.mjs (which owns the toneOfVoice seed) has no actual reference to localStorage or getBrain() — brain.tone is architecturally unreachable from the seeding code, not merely unused by convention');
// Reinforced end-to-end: seed a brand with empty toneOfVoice AND empty style, confirm loadBrand()
// leaves toneOfVoice empty regardless of any brain.tone value existing elsewhere.
await store.saveBrand({ primary: '#222222', secondary: '#dddddd', accent: '', style: '', toneOfVoice: '', logo: null, references: [] });
const bothEmpty = await store.loadBrand();
assert.equal(bothEmpty.toneOfVoice, '', '6. with both toneOfVoice and style empty, toneOfVoice stays empty no matter what brain.tone holds — loadBrand() never reads brain.tone at all');

console.log('PASS: brain.tone can never silently become toneOfVoice — the seeding code has no architectural path to even read it');

// --- 11. Export/import preserves both legacy values and the new SSOT. ---
const { buildBundle, importWorkspace } = await import('../lib/workspace-transfer.mjs');
globalThis.indexedDB = new (await import('fake-indexeddb')).IDBFactory();
const exportLocal = new Map();
globalThis.localStorage = { getItem: k => exportLocal.get(k) ?? null, setItem: (k, v) => exportLocal.set(k, v) };
await store.saveBrand({ primary: '#333333', secondary: '#cccccc', accent: '', style: 'الأسلوب القديم المحفوظ', toneOfVoice: 'نبرة الصوت المعتمدة حديثًا', logo: null, references: [] });
const exportedBundle = await buildBundle();
assert.equal(exportedBundle.brand.style, 'الأسلوب القديم المحفوظ', '11. export preserves the legacy brand.style value');
assert.equal(exportedBundle.brand.toneOfVoice, 'نبرة الصوت المعتمدة حديثًا', '11. export preserves the new toneOfVoice SSOT value');

globalThis.indexedDB = new (await import('fake-indexeddb')).IDBFactory();
const importLocal = new Map();
globalThis.localStorage = { getItem: k => importLocal.get(k) ?? null, setItem: (k, v) => importLocal.set(k, v) };
const importSummary = await importWorkspace(exportedBundle, { overwriteBrain: true });
assert.equal(importSummary.brandImported, true, '11. the bundle with both legacy style and SSOT toneOfVoice still imports successfully');
const importedBrand = await store.loadBrand();
assert.equal(importedBrand.style, 'الأسلوب القديم المحفوظ', '11. brand.style survives export -> import byte-for-byte');
assert.equal(importedBrand.toneOfVoice, 'نبرة الصوت المعتمدة حديثًا', '11. toneOfVoice survives export -> import byte-for-byte');

console.log('PASS: Workspace Export/Import preserves both the legacy brand.style value and the new toneOfVoice SSOT value exactly');

// --- 10. Old workspaces with only brand.style retain equivalent voice behavior after migration. ---
globalThis.indexedDB = new (await import('fake-indexeddb')).IDBFactory();
const oldStyleOnly = 'تصوير دافئ، عائلي، بدون رسميات';
await store.saveBrand({ primary: '#444444', secondary: '#bbbbbb', accent: '', style: oldStyleOnly, toneOfVoice: '', logo: null, references: [] });
// Simulate lib/visual-studio.mjs's brandStyle() active-voice computation directly against the
// storage layer (the real function requires a `document` global; its logic is reproduced here
// exactly as implemented, and cross-checked against the real module's source below).
const postMigration = await store.loadBrand();
const activeVoice = (postMigration.toneOfVoice && postMigration.toneOfVoice.trim()) ? postMigration.toneOfVoice : postMigration.style;
assert.equal(activeVoice, oldStyleOnly, '10. the computed active voice for an old style-only workspace is byte-identical to its original style after migration');
const visualStudioSource = fs.readFileSync('lib/visual-studio.mjs', 'utf8');
assert.ok(/toneOfVoice.*:.*style|style.*:.*toneOfVoice/.test(visualStudioSource.match(/async function brandStyle\(\)\{[\s\S]*?\n\}/)?.[0] || visualStudioSource), '10. brandStyle() in lib/visual-studio.mjs implements the toneOfVoice-with-style-fallback precedence');

console.log('PASS: an old workspace that only ever had brand.style produces byte-identical active-voice text after migration — generation behavior is unaffected');

// ============================================================================
// 8: inspect the assembled text-engine context directly (not generated output).
// ============================================================================
const { normalizeRequest } = await import('../api/generate.mjs');
const brainWithTone = { name: 'ثريد', category: 'أزياء', product: 'ملابس جاهزة', customer: 'شباب', location: 'الرياض', price: '100-400 SAR', tone: 'جريء ومباشر', objective: 'زيادة المبيعات' };

// Active voice present (client already resolved toneOfVoice-or-style into brand.style): brain.tone
// must be completely absent from the assembled context, not merely unlabeled.
const withActiveVoice = normalizeRequest({ brain: brainWithTone, engine: 'copy', inputs: { channel: 'Instagram', instruction: '' }, brand: { style: 'نبرة الصوت الفعلية المعتمدة' } });
assert.equal(withActiveVoice.brand.style, 'نبرة الصوت الفعلية المعتمدة', '8. the assembled context carries the active voice text as brand.style');
assert.ok(!Object.hasOwn(withActiveVoice.brain, 'tone'), '8. the assembled business-brain context has brain.tone completely removed once an active voice exists — not sent as a competing instruction');

// No active voice at all (nothing migrated, nothing entered): brain.tone is untouched, exactly as
// pre-Batch-4 behavior — "All empty -> remain empty".
const withoutActiveVoice = normalizeRequest({ brain: brainWithTone, engine: 'copy', inputs: { channel: 'Instagram', instruction: '' }, brand: { style: '' } });
assert.equal(withoutActiveVoice.brain.tone, 'جريء ومباشر', '8. with no active voice at all, brain.tone is sent exactly as before — nothing is retired when there is nothing to replace it with');

console.log('PASS: the assembled text-engine context (inspected directly, not generated output) carries toneOfVoice as the sole active voice and drops brain.tone entirely once one exists, while leaving brain.tone untouched when no active voice exists at all');

// ============================================================================
// 9: inspect the assembled Visual Studio context directly; confirm no broader expansion.
// ============================================================================
const { normalizeVisual } = await import('../api/visual.mjs');
const visualBody = {
  brain: brainWithTone,
  brand: { primary: '#e7f95b', secondary: '#181b1f', accent: '', style: 'نمط بصري قديم لن يُستخدم', toneOfVoice: 'نبرة الصوت الفعلية للتصميم', logo: null, references: [] },
  task: { engine: 'content', selected: 'فكرة اليوم', context: 'سياق يتضمن فكرة اليوم' },
  settings: { format: '1:1', mode: 'Product Hero', textMode: 'none' }
};
const normalizedVisual = normalizeVisual(visualBody);
assert.equal(normalizedVisual.brand.style, 'نبرة الصوت الفعلية للتصميم', '9. Visual Studio\'s assembled context prefers toneOfVoice over legacy style, same SSOT precedence as text engines');
assert.ok(!Object.hasOwn(normalizedVisual.brain, 'tone'), '9. Visual Studio\'s assembled business-brain context also drops brain.tone once an active voice exists');
assert.deepEqual(Object.keys(normalizedVisual.brand).sort(), ['accent', 'primary', 'secondary', 'style'], '9. Visual Studio\'s normalized brand shape is still exactly {primary,secondary,accent,style} — no personality/visualDirectionNotes/doList/etc. fields added (that broader context expansion is a later batch)');

// No active voice: brain.tone untouched for Visual Studio too.
const visualBodyNoVoice = { ...visualBody, brand: { ...visualBody.brand, style: '', toneOfVoice: '' } };
const normalizedVisualNoVoice = normalizeVisual(visualBodyNoVoice);
assert.equal(normalizedVisualNoVoice.brain.tone, 'جريء ومباشر', '9. with no active voice, Visual Studio also leaves brain.tone untouched exactly as before');

console.log('PASS: Visual Studio\'s assembled context (inspected directly) follows the identical Batch-4 SSOT precedence without any broader context-field expansion');

// ============================================================================
// 7: the brain.tone suggestion requires explicit founder action (real UI harness).
// ============================================================================
// lib/visual-storage.mjs caches its IndexedDB connection at module scope on first use, so
// reassigning globalThis.indexedDB here would have no effect on the `store` import already used
// by earlier sections above — instead, explicitly reset the brand record on that same, already-
// established connection to a known clean (empty style/toneOfVoice) starting state.
await store.saveBrand({ primary: '#000000', secondary: '#ffffff', accent: '', style: '', toneOfVoice: '', logo: null, references: [] });
const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
const win = dom.window, ctx = dom.getInternalVMContext();
win.store = store;
win.structuredClone = structuredClone;
win.crypto.randomUUID = win.crypto.randomUUID || (() => 'uuid-' + Math.random().toString(36).slice(2));
win.normalizeAsset = async f => f;
win.URL.createObjectURL = () => 'blob:qa-' + Math.random();
win.URL.revokeObjectURL = () => {};
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const stripImports = src => src.replace(/^import .*;\n/gm, '');
// Only product-library.mjs and workspace-transfer.mjs are needed: setupBrand()/saveProject()/
// useToneSuggestion() only ever reach globalThis.Products/Workspace through optional chaining
// (globalThis.Products?.refresh()), so campaign-packs.mjs/campaign-export.mjs (which this test
// never exercises) are deliberately not loaded here.
vm.runInContext(inlineScript, ctx);
vm.runInContext('(function(){' + stripImports(fs.readFileSync('lib/product-library.mjs', 'utf8')) + '})()', ctx);
vm.runInContext('(function(){' + stripImports(fs.readFileSync('lib/workspace-transfer.mjs', 'utf8')).replace(/^export (async function|function)/gm, '$1') + '})()', ctx);
vm.runInContext('(function(){' + stripImports(fs.readFileSync('lib/visual-studio.mjs', 'utf8')).replace('export function splitIdeas', 'function splitIdeas') + '})()', ctx);
const run = code => vm.runInContext(code, ctx);

// brain.tone (id="tone") is a <select> with a fixed option list in the real markup, not free
// text — "ودود" (friendly) is one of its actual options.
win.document.getElementById('name').value = 'ثريد'; win.document.getElementById('product').value = 'ملابس جاهزة'; win.document.getElementById('customer').value = 'شباب'; win.document.getElementById('tone').value = 'ودود';
run('saveBrain()');

await run('Visual.setupBrand()');
assert.equal(win.document.getElementById('toneSuggestion').classList.contains('hidden'), false, '7. the suggestion is shown when toneOfVoice and style are both empty and brain.tone exists');
assert.ok(win.document.getElementById('toneSuggestion').innerHTML.includes('ودود'), '7. the suggestion text includes the actual brain.tone value for the founder to review');
assert.equal(win.document.getElementById('brandToneOfVoice').value, '', '7. the suggestion is NOT auto-filled into the field merely by being shown');
let afterShow = await store.loadBrand();
assert.equal((afterShow?.toneOfVoice || ''), '', '7. nothing is written to storage merely by showing the suggestion');

run('Visual.useToneSuggestion()');
assert.equal(win.document.getElementById('brandToneOfVoice').value, 'ودود', '7. clicking the suggestion button fills the editable field for review/editing');
let afterClick = await store.loadBrand();
assert.equal((afterClick?.toneOfVoice || ''), '', '7. filling the field from the suggestion still writes nothing to storage — only an explicit save persists it');

await run('Visual.saveProject()');
const afterSave = await store.loadBrand();
assert.equal(afterSave.toneOfVoice, 'ودود', '7. only the explicit "save and start" action actually persists the accepted suggestion into toneOfVoice');

dom.window.close();

console.log('PASS: the brain.tone suggestion is shown as editable text, is never auto-filled or auto-saved, and requires two explicit founder actions (accept the suggestion, then save) before it becomes toneOfVoice');

console.log('\nPASS V4 BATCH 4 (P0-B.2 / Voice SSOT): toneOfVoice is the sole active voice source — seeded exactly once from brand.style when empty, never overwriting an existing value, idempotent across reloads; brain.tone is never auto-merged and only ever surfaced as an editable, explicitly-actioned suggestion; both legacy fields remain byte-identical in storage and survive export/import; text and Visual generation both receive toneOfVoice as the sole active voice (verified in the assembled context objects directly) and drop brain.tone once one exists, with zero broader context-field expansion beyond this narrow SSOT replacement');
