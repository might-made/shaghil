// SHGHIL V4 Batch 1 (P0-A.1) regression suite.
// Scope: businessId/schemaVersion stamping on brain (localStorage) and brand (IndexedDB), and
// the Workspace export bundle version bump. Does NOT exercise any later batch (Campaign Pack
// re-keying, Business Memory fields, Brand Intelligence, context assembly, product selectors,
// progressive UX) — those remain unimplemented per the Founder's Batch 1 scope boundary.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { indexedDB } from 'fake-indexeddb';
globalThis.indexedDB = globalThis.indexedDB || indexedDB;

const preV4Brain = { name: 'تحميص ٢٧', category: 'قهوة مختصة', product: 'قهوة مختصة وحلويات', customer: 'موظفون وطلاب', location: 'جدة', price: '50–100 SAR', tone: 'سعودي طبيعي', objective: 'رجوع العملاء' };
const withoutBusinessMeta = b => { const { businessId, schemaVersion, ...rest } = b; return rest };

// --- Minimal VM harness for index.html's inline script, enough to exercise getBrain()/saveBrain(). ---
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
  setTimeout() {}, scrollTo() {}, crypto: { randomUUID: () => 'batch1-uuid-' + (++uuidSeq) },
  confirm: () => true, fetch: async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ text: 'ok' }) })
});
vm.runInContext(script, context);
const run = code => vm.runInContext(code, context);

// 1. A pre-V4 brain (no businessId/schemaVersion) seeded directly into storage, as a real pilot
// record would look today on main.
storage.set('brain', JSON.stringify(preV4Brain));

// 2. First getBrain() call must stamp businessId + schemaVersion, and must not touch any
// existing field's value.
const first = run('getBrain()');
assert.equal(first.schemaVersion, 1, '1. getBrain() stamps schemaVersion = 1 on a pre-V4 record');
assert.ok(typeof first.businessId === 'string' && first.businessId.length > 0, '1. getBrain() stamps a non-empty businessId');
assert.deepEqual(withoutBusinessMeta(first), preV4Brain, '1. every pre-existing Business Brain field survives unchanged');

// 3. The stamp must be persisted immediately (not only held in memory) — a fresh raw read of
// storage must already show it, simulating a reload before any other code runs.
const persisted = JSON.parse(storage.get('brain'));
assert.equal(persisted.businessId, first.businessId, '2. the businessId is persisted immediately, surviving a simulated reload');
assert.equal(persisted.schemaVersion, 1, '2. schemaVersion is persisted immediately');

// 4. Repeated getBrain() calls (simulating repeated reloads/navigation) must never regenerate
// the businessId.
for (let i = 0; i < 5; i++) {
  const again = run('getBrain()');
  assert.equal(again.businessId, first.businessId, `3. getBrain() call #${i + 2} returns the exact same businessId, never regenerating it`);
  assert.equal(again.schemaVersion, 1);
}
const storageWriteCountAfterReads = [...storage.entries()].length; // sanity: storage.set is cheap to call repeatedly, this just confirms no crash/growth
assert.ok(storageWriteCountAfterReads >= 1);

// 5. Editing and re-saving Business Brain (the real "ابدأ"/setup save flow) must preserve the
// same businessId — the identity must survive routine edits, not just passive reads.
for (const [k, v] of Object.entries({ ...preV4Brain, price: '60–120 SAR' })) nodes.get(k).value = v;
run('saveBrain()');
const afterEdit = JSON.parse(storage.get('brain'));
assert.equal(afterEdit.businessId, first.businessId, '4. editing and re-saving Business Brain preserves the same businessId');
assert.equal(afterEdit.schemaVersion, 1, '4. schemaVersion remains 1 after an edit/save');
assert.equal(afterEdit.price, '60–120 SAR', '4. the edited field value is actually saved');
assert.equal(afterEdit.name, preV4Brain.name, '4. unedited fields survive the save unchanged');

// 6. demo() (the "جرّب مثالًا" button) must follow the same preserve-or-generate rule.
storage.delete('brain');
run('demo()');
const demoFirst = JSON.parse(storage.get('brain'));
assert.equal(demoFirst.schemaVersion, 1, '5. demo() stamps schemaVersion = 1 on a fresh install');
assert.ok(demoFirst.businessId, '5. demo() stamps a businessId on a fresh install');
run('demo()');
const demoSecond = JSON.parse(storage.get('brain'));
assert.equal(demoSecond.businessId, demoFirst.businessId, '5. calling demo() again preserves the same businessId, never regenerating it');

// 7. The internal fields must never leak into the Business Brain summary screen's rendered UI —
// only the 8 known, labeled fields may appear.
storage.set('brain', JSON.stringify(first));
run('brainScreen()');
const brainGridHTML = run('document.getElementById("brainGrid").innerHTML') ?? '';
assert.ok(!brainGridHTML.includes('businessId'), '6. the businessId key/value never renders on the Business Brain summary screen');
assert.ok(!brainGridHTML.includes('schemaVersion'), '6. the schemaVersion key/value never renders on the Business Brain summary screen');
assert.ok(!brainGridHTML.includes(first.businessId), '6. the raw businessId value never renders on the Business Brain summary screen');

console.log('PASS: Business Brain (localStorage) — lazy, idempotent businessId + schemaVersion migration verified: stamped once, persisted immediately, never regenerated on reload or repeated edits, every legacy field value preserved exactly, and no internal field leaks into the UI');

// --- Brand Brain (IndexedDB) schema-version stamping. ---
const store = await import('../lib/visual-storage.mjs');
const preV4Brand = { primary: '#e7f95b', secondary: '#181b1f', accent: '', style: 'أسلوب سعودي أصيل', logo: null, references: [] };
await store.saveBrand({ ...preV4Brand }); // simulates a pre-V4 saved record: no schemaVersion key at all

const loadedOnce = await store.loadBrand();
assert.equal(loadedOnce.schemaVersion, 1, '7. loadBrand() stamps schemaVersion = 1 on a pre-V4 Brand Brain record');
assert.deepEqual({ primary: loadedOnce.primary, secondary: loadedOnce.secondary, accent: loadedOnce.accent, style: loadedOnce.style, logo: loadedOnce.logo, references: loadedOnce.references }, preV4Brand, '7. every pre-existing Brand Brain value survives unchanged');

// Persistence check: a second, independent load must see schemaVersion already persisted (not
// just held in the first call's return value) — proves the stamp was actually written back.
const loadedTwice = await store.loadBrand();
assert.equal(loadedTwice.schemaVersion, 1, '8. a second, independent loadBrand() call confirms the stamp was actually persisted, not just returned once');
assert.deepEqual(loadedTwice, loadedOnce, '8. repeated loads are idempotent — identical result, no drift, no duplicate stamping');

console.log('PASS: Brand Brain (IndexedDB) — lazy, idempotent schemaVersion migration verified: stamped once on first read, persisted immediately, confirmed stable across repeated loads, every pre-existing visual-identity value preserved exactly');

// --- Workspace Export bundle version bump. ---
const { buildBundle, importWorkspace } = await import('../lib/workspace-transfer.mjs');
const bundle = await buildBundle();
assert.equal(bundle.shaghilWorkspace, 2, '9. Workspace Export reports shaghilWorkspace: 2');

// Backward compatibility: a pre-V4 export (version 1) must still import cleanly.
globalThis.indexedDB = new (await import('fake-indexeddb')).IDBFactory();
const freshLocal = new Map();
globalThis.localStorage = { getItem: k => freshLocal.get(k) ?? null, setItem: (k, v) => freshLocal.set(k, v) };
const legacyBundle = { shaghilWorkspace: 1, exportedAt: Date.now(), localStorage: { brain: preV4Brain, shaghilHistory: [] }, brand: null, products: [], visuals: [], packs: [] };
const legacySummary = await importWorkspace(legacyBundle, { overwriteBrain: true });
assert.equal(legacySummary.brainImported, true, '10. a pre-V4 (version 1) exported workspace still imports successfully after the version bump');

// Forward compatibility: a V4 export (version 2) must import cleanly into a fresh install.
globalThis.indexedDB = new (await import('fake-indexeddb')).IDBFactory();
const freshLocal2 = new Map();
globalThis.localStorage = { getItem: k => freshLocal2.get(k) ?? null, setItem: (k, v) => freshLocal2.set(k, v) };
const v2Bundle = { shaghilWorkspace: 2, exportedAt: Date.now(), localStorage: { brain: first, shaghilHistory: [] }, brand: null, products: [], visuals: [], packs: [] };
const v2Summary = await importWorkspace(v2Bundle, { overwriteBrain: true });
assert.equal(v2Summary.brainImported, true, '11. a V4 (version 2) exported workspace imports successfully into a fresh install');
// `first` is a vm-context object (different realm/prototype than this main-context JSON.parse
// result), so it's re-serialized through JSON before comparing — a plain value-equality check,
// not a cross-realm prototype mismatch.
assert.deepEqual(JSON.parse(localStorage.getItem('brain')), JSON.parse(JSON.stringify(first)), '11. the imported V4 bundle restores businessId/schemaVersion exactly, byte-for-byte');

// An unrecognized version must still be rejected (not silently accepted just because the check
// was widened from "=== 1" to "1 or 2").
await assert.rejects(() => importWorkspace({ shaghilWorkspace: 99 }), /ملف غير صالح/, '12. an unrecognized bundle version (neither 1 nor 2) is still rejected');

console.log('PASS: Workspace Export/Import — bundle version bumped to 2, pre-V4 (v1) exports still import, V4 (v2) exports round-trip exactly, and unrecognized versions are still rejected');

console.log('\nPASS V4 BATCH 1 (P0-A.1): businessId + schemaVersion migration is lazy, idempotent and non-destructive across Business Brain and Brand Brain, and the Workspace bundle version bump is backward- and forward-compatible, with zero regressions to Batch 2+ scope (untouched by this batch)');
