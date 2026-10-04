// SHGHIL V4 Batch 3 (P0-B.1) regression suite.
// Scope AT THE TIME this batch shipped: safe-default Business Facts/Commercial Context fields on
// brain (localStorage) and Brand Intelligence fields on brand (IndexedDB) — storage/schema only;
// no UI, no engine use, no brand.style->toneOfVoice migration, no brain.tone suggestion.
// Batch 4 has since added the style->toneOfVoice seed and the brain.tone suggestion UI — this
// file's toneOfVoice-specific assertions were updated accordingly (see the inline notes below);
// everything else here still tests exactly what Batch 3 itself guarantees.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { indexedDB } from 'fake-indexeddb';
globalThis.indexedDB = globalThis.indexedDB || indexedDB;

const BRAIN_V4_FIELDS = { businessModel: '', secondaryObjectives: [], currentPriority: '', currentOffer: '', importantSeason: '', campaignContext: '', temporaryAudienceEmphasis: '', commercialConstraints: '' };
const BRAND_V4_FIELDS = { positioning: '', valueProposition: '', differentiators: [], brandPromise: '', personality: '', toneOfVoice: '', doList: [], dontList: [], preferredVocabulary: [], prohibitedVocabulary: [], visualDirectionNotes: '', visualDo: [], visualDont: [] };
const preV4Brain = { name: 'ثريد', category: 'أزياء', product: 'ملابس جاهزة', customer: 'شباب 18-30', location: 'الرياض', price: '100-400 SAR', tone: 'عصري', objective: 'زيادة المبيعات' };

// --- Minimal VM harness for index.html's inline script, enough to exercise getBrain()/saveBrain()/demo(). ---
const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const storage = new Map();
let uuidSeq = 0;
function node(id) { return { id, value: '', textContent: '', classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, focus() {}, disabled: false }; }
const nodes = new Map();
for (const match of html.matchAll(/id="([^"]+)"/g)) nodes.set(match[1], node(match[1]));
const context = vm.createContext({
  document: { getElementById: id => nodes.get(id), createElement: () => node('toast'), body: { appendChild() {} }, addEventListener() {} },
  localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) },
  navigator: { clipboard: { writeText: async () => {} } },
  setTimeout() {}, scrollTo() {}, crypto: { randomUUID: () => 'batch3-uuid-' + (++uuidSeq) },
  confirm: () => true, fetch: async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ text: 'ok' }) })
});
vm.runInContext(script, context);
const run = code => vm.runInContext(code, context);

// --- 1 & 3. A pre-V4 brain loads with safe defaults for every new field, and every legacy value survives unchanged. ---
storage.set('brain', JSON.stringify(preV4Brain));
// run('getBrain()') returns a vm-context-realm object (different Array/Object prototypes than
// this main-context module), so it's re-serialized through JSON before any deepEqual comparison
// against a main-realm fixture — plain value equality, never a cross-realm prototype mismatch.
const loadedBrain = JSON.parse(JSON.stringify(run('getBrain()')));
for (const [key, def] of Object.entries(BRAIN_V4_FIELDS)) {
  assert.deepEqual(loadedBrain[key], def, `1. brain.${key} gets its safe default (${JSON.stringify(def)}) on a pre-V4 record`);
}
for (const key of Object.keys(preV4Brain)) {
  assert.equal(loadedBrain[key], preV4Brain[key], `3. brain.${key} is unchanged from its pre-V4 value`);
}
assert.equal(loadedBrain.schemaVersion, 1, '3. schemaVersion is still stamped alongside the new fields');
assert.ok(loadedBrain.businessId, '3. businessId is still stamped alongside the new fields');

console.log('PASS: a pre-V4 Business Brain record loads with safe empty defaults for every new Business Facts/Commercial Context field, with every legacy field value and the Batch 1 businessId/schemaVersion stamp unchanged');

// --- 4. New fields round-trip correctly through save/load (persisted, not just returned once). ---
const persistedBrain = JSON.parse(storage.get('brain'));
for (const key of Object.keys(BRAIN_V4_FIELDS)) assert.deepEqual(persistedBrain[key], BRAIN_V4_FIELDS[key], `4. brain.${key} is actually persisted, not just returned in memory`);
const reloadedBrain = JSON.parse(JSON.stringify(run('getBrain()')));
assert.deepEqual(reloadedBrain, loadedBrain, '4. a second getBrain() call round-trips identically (idempotent, no drift)');

console.log('PASS: the new Business Facts/Commercial Context fields round-trip correctly through save and reload');

// --- 5. Array defaults do not share mutable references across records/state instances. ---
// Simulate reading two independently-stamped records and confirm their array defaults are
// distinct instances (each a fresh literal created per getBrain() call, never a shared reference).
storage.set('brain', JSON.stringify(preV4Brain));
const recordA = run('getBrain()');
storage.delete('brain'); storage.set('brain', JSON.stringify(preV4Brain));
const recordB = run('getBrain()');
assert.notEqual(recordA.secondaryObjectives, recordB.secondaryObjectives, '5. two independently-loaded records never share the same array instance for a default field');
recordA.secondaryObjectives.push('تجربة');
assert.equal(recordB.secondaryObjectives.length, 0, '5. mutating one record\'s default array never affects another record\'s default array');

console.log('PASS: array-type default fields are freshly created per record, never shared by reference, so mutating one never affects another');

// --- 6. Empty optional fields cause no regression in existing workflows (save/edit still works). ---
const businessIdBeforeSave = JSON.parse(storage.get('brain')).businessId;
for (const [k, v] of Object.entries(preV4Brain)) nodes.get(k).value = v;
run('saveBrain()'); // must not throw with the new fields already present on the stored record
const afterSave = JSON.parse(storage.get('brain'));
for (const key of Object.keys(BRAIN_V4_FIELDS)) assert.deepEqual(afterSave[key], BRAIN_V4_FIELDS[key], `6. brain.${key} survives a normal saveBrain() edit unchanged`);
assert.equal(afterSave.businessId, businessIdBeforeSave, '6. businessId is preserved across a saveBrain() edit, not reset by the new fields being present');

console.log('PASS: the existing save/edit workflow is unaffected by the new empty optional fields, and businessId remains stable across a save');

// --- demo() also preserves non-form fields, matching saveBrain()'s preservation behavior. ---
storage.delete('brain');
run('demo()');
const demoBrain = JSON.parse(storage.get('brain'));
for (const key of Object.keys(BRAIN_V4_FIELDS)) assert.deepEqual(demoBrain[key], BRAIN_V4_FIELDS[key], `demo() also stamps brain.${key} with its safe default`);

console.log('PASS: demo() also stamps every new field with its safe default, consistent with saveBrain() and getBrain()');

// --- Brand Intelligence (IndexedDB) ---
const store = await import('../lib/visual-storage.mjs');
const preV4Brand = { primary: '#1a1a1a', secondary: '#f5f5f5', accent: '#ff5500', style: 'أسلوب شبابي جريء', logo: null, references: [] };
await store.saveBrand({ ...preV4Brand }); // simulates a pre-V4 saved record: none of the new fields exist at all

// --- 2 & 3. A pre-V4 brand loads with safe defaults for every new field, every legacy value unchanged. ---
// toneOfVoice is excluded from the blanket-default loop below: as of Batch 4, a record whose
// style is already non-empty (as this fixture's is) gets toneOfVoice seeded from it on load —
// see scripts/qa-v19-batch4-voice-ssot.mjs for the dedicated seeding/precedence test suite.
const loadedBrand = await store.loadBrand();
for (const [key, def] of Object.entries(BRAND_V4_FIELDS)) {
  if (key === 'toneOfVoice') continue;
  assert.deepEqual(loadedBrand[key], def, `2. brand.${key} gets its safe default (${JSON.stringify(def)}) on a pre-V4 record`);
}
for (const key of Object.keys(preV4Brand)) assert.deepEqual(loadedBrand[key], preV4Brand[key], `3. brand.${key} is unchanged from its pre-V4 value`);
assert.equal(loadedBrand.schemaVersion, 1, '3. schemaVersion is still stamped alongside the new fields');
assert.equal(loadedBrand.style, 'أسلوب شبابي جريء', 'brand.style itself is left completely untouched');

console.log('PASS: a pre-V4 Brand Brain record loads with safe empty defaults for every new Brand Intelligence field (toneOfVoice\'s Batch-4 seeding behavior is tested separately), with every legacy visual-identity value unchanged');

// --- 4. New fields round-trip correctly through save/load for Brand Intelligence too. ---
const loadedBrandAgain = await store.loadBrand();
assert.deepEqual(loadedBrandAgain, loadedBrand, '4. a second loadBrand() call round-trips identically (idempotent, no drift, no duplicate stamping)');

console.log('PASS: the new Brand Intelligence fields round-trip correctly through save and reload');

// --- 5. Array defaults do not share mutable references across Brand Brain loads either. ---
await store.saveBrand({ ...preV4Brand }); // reset to a second pre-V4-shaped record
const brandRecordA = await store.loadBrand();
await store.saveBrand({ ...preV4Brand });
const brandRecordB = await store.loadBrand();
assert.notEqual(brandRecordA.differentiators, brandRecordB.differentiators, '5. two independently-loaded Brand Brain records never share the same array instance for a default field');
brandRecordA.doList.push('تكلم بثقة');
assert.equal(brandRecordB.doList.length, 0, '5. mutating one Brand Brain record\'s default array never affects another');

console.log('PASS: Brand Intelligence array-type default fields are freshly created per load, never shared by reference');

// Note: "no brand saved yet still returns undefined" (the existing "add your identity" UI
// prompt depends on this) is already covered, in its own fresh-IndexedDB process, by
// scripts/qa-preview-persistence.mjs and scripts/qa-v08-workspace-transfer.mjs — both pass
// unchanged in the full suite, confirming loadBrand()'s early `if (!record) return record`
// path (added in this batch's code alongside the new defaults) preserves that exact behavior.

// --- 7. Export/import preserves populated new fields because they remain inside the existing objects. ---
const { buildBundle, importWorkspace } = await import('../lib/workspace-transfer.mjs');
globalThis.indexedDB = new (await import('fake-indexeddb')).IDBFactory();
const exportLocal = new Map();
globalThis.localStorage = { getItem: k => exportLocal.get(k) ?? null, setItem: (k, v) => exportLocal.set(k, v) };
const populatedBrain = { ...preV4Brain, businessId: 'export-biz-1', schemaVersion: 1, businessModel: 'اشتراك شهري', secondaryObjectives: ['رفع الوعي', 'توسيع السوق'], currentPriority: 'إطلاق المنتج الجديد' };
globalThis.localStorage.setItem('brain', JSON.stringify(populatedBrain));
await (await import('../lib/visual-storage.mjs')).saveBrand({ ...preV4Brand, positioning: 'الخيار الأذكى للشباب', differentiators: ['توصيل خلال ساعة', 'جودة مضمونة'], toneOfVoice: '' });
const exportedBundle = await buildBundle();
assert.deepEqual(exportedBundle.localStorage.brain.secondaryObjectives, ['رفع الوعي', 'توسيع السوق'], '7. populated Commercial Context fields are present in the export bundle');
assert.equal(exportedBundle.localStorage.brain.businessModel, 'اشتراك شهري', '7. a populated Business Facts field is present in the export bundle');
assert.deepEqual(exportedBundle.brand.differentiators, ['توصيل خلال ساعة', 'جودة مضمونة'], '7. populated Brand Intelligence fields are present in the export bundle');

globalThis.indexedDB = new (await import('fake-indexeddb')).IDBFactory();
const importLocal = new Map();
globalThis.localStorage = { getItem: k => importLocal.get(k) ?? null, setItem: (k, v) => importLocal.set(k, v) };
const importSummary = await importWorkspace(exportedBundle, { overwriteBrain: true });
assert.equal(importSummary.brainImported, true, '7. the bundle with new fields still imports successfully');
const importedBrain = JSON.parse(localStorage.getItem('brain'));
assert.deepEqual(importedBrain.secondaryObjectives, ['رفع الوعي', 'توسيع السوق'], '7. populated Commercial Context fields survive export -> import, byte-for-byte');
assert.equal(importedBrain.businessModel, 'اشتراك شهري', '7. a populated Business Facts field survives export -> import');
const importedBrand = await (await import('../lib/visual-storage.mjs')).loadBrand();
assert.deepEqual(importedBrand.differentiators, ['توصيل خلال ساعة', 'جودة مضمونة'], '7. populated Brand Intelligence fields survive export -> import');

console.log('PASS: Workspace Export/Import preserves populated new Business Memory fields exactly, since they travel inside the existing brain/brand objects with no new top-level bundle key required');

console.log('\nPASS V4 BATCH 3 (P0-B.1): safe empty defaults for every approved Business Facts, Commercial Context and Brand Intelligence field are stamped lazily and idempotently on pre-V4 records, every legacy value and the Batch 1/2 stable-ID work survive unchanged, array defaults are never shared by reference, and populated fields round-trip through export/import — with zero UI, prompt, context-assembly, or Product Memory work included in this batch (toneOfVoice\'s Batch-4 seeding/suggestion behavior is covered in scripts/qa-v19-batch4-voice-ssot.mjs)');
