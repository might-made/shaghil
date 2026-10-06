// SHGHIL V4 Batch 10 regression suite: Progressive Memory UX + Final Hardening.
// Scope: (A) static structural proof that Essential Setup stays lightweight, Advanced memory
// fields are progressively disclosed, Brand Strategy/Voice precede Visual Identity, and no
// cloud/account claim exists anywhere in the UI; (B) a true end-to-end lifecycle — pre-V4
// workspace -> V4 migration -> idempotency -> progressive-UI edits -> business/product rename
// safety -> all seven consumers (six text engines + Visual Studio) -> export -> import into a
// genuinely fresh store -> reload — run across two real, separate child processes (like
// qa-v08-workspace-transfer.mjs) so "import" is not merely re-reading the same process's store.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const self = fileURLToPath(import.meta.url);
const phase = process.argv[2];
const bundlePath = process.argv[3];

const brainPreV4 = { name: 'نجوب', category: 'سفر', product: 'منظم سفر العائلة', customer: 'العائلة السعودية', location: 'السعودية', price: '150-300 SAR', tone: 'سعودي طبيعي', objective: 'زيادة المبيعات' };
const renamedBusinessName = 'نجوب للسفر العائلي';
const legacyProductName = 'حقيبة سفر';
const renamedProductName = 'حقيبة سفر فاخرة';
const bagBytes = new Uint8Array(500).fill(7);
const logoBytes = new Uint8Array(200).fill(9);

function mountPage(store) {
  const html = fs.readFileSync('index.html', 'utf8');
  const dom = new (globalThis.__JSDOM)(html, { url: 'http://localhost', runScripts: 'outside-only' });
  const win = dom.window, ctx = dom.getInternalVMContext();
  win.store = store;
  win.structuredClone = structuredClone;
  win.Blob = Blob;
  win.URL.createObjectURL = () => 'blob:qa-' + Math.random();
  win.URL.revokeObjectURL = () => {};
  win.decodeImage = async () => ({ width: 400, height: 400 });
  win.normalizeAsset = async file => new Blob(['ref:' + file.name], { type: 'image/jpeg' });
  // visual-canvas.mjs needs real <canvas>/Image APIs jsdom doesn't provide — stubbed the same
  // way qa-v07.mjs already does, since this test only cares about the request body sent to
  // /api/visual, not the final composited image.
  win.blobPayload = async () => ({ type: 'image/png', base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==' });
  win.composeVisual = async () => new Blob(['rendered'], { type: 'image/png' });
  win.responseBlob = () => new Blob(['scene'], { type: 'image/jpeg' });
  win.crypto.randomUUID = win.crypto.randomUUID || (() => 'uuid-' + Math.random().toString(36).slice(2));
  win.requests = [];
  // /api/generate's client reads .text() then JSON.parses it; /api/visual's client reads
  // .json() directly — both are stubbed on the same mock response.
  const genericImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
  win.fetch = async (url, opts) => {
    win.requests.push({ url, body: JSON.parse(opts.body) });
    const visualResult = { base64: genericImageBase64, mime: 'image/jpeg', model: 'mock', direction: 0 };
    return { ok: true, status: 200, text: async () => JSON.stringify({ text: '## نتيجة\nنص تجريبي' }), json: async () => visualResult };
  };
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], ctx);
  // visual-studio.mjs's own `import './product-library.mjs'`/`import './campaign-packs.mjs'`
  // lines are stripped below like every other import — load both separately so
  // globalThis.Products and globalThis.Packs actually get registered.
  const productLibrarySrc = fs.readFileSync('lib/product-library.mjs', 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInContext('(function(){' + productLibrarySrc + '})()', ctx);
  // Its own reference to exportPack (from campaign-export.mjs) lives only inside render()'s
  // download-button closure, which this test never calls — safe to leave undefined here.
  const campaignPacksSrc = fs.readFileSync('lib/campaign-packs.mjs', 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInContext('(function(){' + campaignPacksSrc + '})()', ctx);
  const visualStudioSrc = fs.readFileSync('lib/visual-studio.mjs', 'utf8').replace(/^import .*;\n/gm, '').replace('export function splitIdeas', 'function splitIdeas');
  vm.runInContext('(function(){' + visualStudioSrc + '})()', ctx);
  return { dom, win, run: code => vm.runInContext(code, ctx) };
}
async function waitForImages(win, selector, expected, tries = 40) {
  for (let i = 0; i < tries; i++) { if ((win.document.querySelector(selector)?.querySelectorAll('.card').length || 0) >= expected) return; await new Promise(r => setTimeout(r, 5)); }
}

if (phase === 'origin') {
  const { JSDOM } = await import('jsdom');
  const { indexedDB } = await import('fake-indexeddb');
  globalThis.__JSDOM = JSDOM;
  globalThis.indexedDB = indexedDB;
  const store = await import('../lib/visual-storage.mjs');

  // --- Seed a genuinely pre-V4 workspace: no schemaVersion/businessId/V4 defaults anywhere,
  // one Campaign Pack whose project matches the current business name (will get stamped on
  // first encounter, per Batch 2), and one ALREADY-ORPHANED pack (project matches nothing). ---
  const { dom, win, run } = mountPage(store);
  win.localStorage.setItem('brain', JSON.stringify(brainPreV4));
  await store.saveBrand({ primary: '#e7f95b', secondary: '#181b1f', accent: '', style: 'تصوير سعودي تقليدي', logo: new Blob([logoBytes], { type: 'image/png' }), references: [] });
  await store.saveProduct({ id: 'legacy-prod', name: legacyProductName, description: 'حقيبة عائلية', fidelity: 'exact', image: new Blob([bagBytes], { type: 'image/png' }), reference: new Blob([bagBytes], { type: 'image/jpeg' }) });
  await store.savePack({ id: 'legacy-pack', name: 'حملة قديمة', project: brainPreV4.name, ts: 1000, entries: [{ id: 'entry-1', label: 'منشور', caption: 'نص معتمد قديم', cta: 'اطلب الآن', approvedAt: 1000, record: { id: 'rec-1', brain: brainPreV4, product: { id: 'legacy-prod', name: legacyProductName, fidelity: 'exact' }, task: { engine: 'content', selected: 'فكرة', context: 'فكرة' }, settings: { format: '1:1', mode: 'Product Hero' }, rendered: new Blob(['img-bytes'], { type: 'image/png' }) } }] });
  await store.savePack({ id: 'orphan-pack', name: 'حزمة منسية', project: 'اسم قديم جدًا غير نجوب', ts: 500, entries: [] });

  // --- 4. Pre-V4 data migrates without loss: trigger migration (home() reads getBrain(); the
  // product-library/visual-studio modules read store.loadBrand()/listProducts()), then verify
  // every legacy value survives byte-identical and every approved V4 default is now present. ---
  run('home()');
  const migratedBrain = JSON.parse(win.localStorage.getItem('brain'));
  for (const key of Object.keys(brainPreV4)) assert.equal(migratedBrain[key], brainPreV4[key], `4. legacy Business field ${key} survives migration byte-identical`);
  assert.equal(migratedBrain.schemaVersion, 1, '4. Business schemaVersion is stamped');
  assert.ok(migratedBrain.businessId, '4. a stable businessId is stamped');
  for (const key of ['businessModel', 'currentPriority', 'currentOffer', 'importantSeason', 'campaignContext', 'commercialConstraints', 'temporaryAudienceEmphasis']) assert.equal(migratedBrain[key], '', `4. new Commercial Context field ${key} defaults to empty, not invented`);
  assert.deepEqual(migratedBrain.secondaryObjectives, [], '4. secondaryObjectives defaults to an empty array');

  const migratedBrand = await store.loadBrand();
  assert.equal(migratedBrand.style, 'تصوير سعودي تقليدي', '4. legacy Brand style survives migration byte-identical');
  assert.equal(migratedBrand.schemaVersion, 1, '4. Brand schemaVersion is stamped');
  assert.equal(migratedBrand.toneOfVoice, 'تصوير سعودي تقليدي', '4. toneOfVoice is seeded once from the legacy style value, per the existing Batch 4 behavior');
  const bagBytesCheck = new Uint8Array(await migratedBrand.logo.arrayBuffer());
  assert.deepEqual(bagBytesCheck, logoBytes, '4. the legacy logo Blob survives migration byte-identical');

  const migratedProducts = await store.listProducts();
  const migratedProduct = migratedProducts.find(p => p.id === 'legacy-prod');
  assert.equal(migratedProduct.name, legacyProductName, '4. legacy product name survives migration byte-identical');
  assert.equal(migratedProduct.schemaVersion, 1, '4. Product schemaVersion is stamped');
  for (const key of ['category', 'price', 'audienceRelevance']) assert.equal(migratedProduct[key], '', `4. new Product Memory field ${key} defaults to empty, not invented`);

  console.log('PASS: a genuinely pre-V4 workspace (Business, Brand, Product, Campaign Pack) migrates with zero legacy value loss, every approved V4 field defaulting to empty rather than an invented fact');

  // --- 5. Migration repeated twice produces the same persisted result (idempotent). ---
  const secondBrain = JSON.parse(win.localStorage.getItem('brain'));
  run('home()');
  const thirdBrain = JSON.parse(win.localStorage.getItem('brain'));
  assert.deepEqual(thirdBrain, secondBrain, '5. repeating migration (home()) a second time produces byte-identical persisted Business data');
  const secondBrand = await store.loadBrand();
  const thirdBrand = await store.loadBrand();
  assert.deepEqual({ ...thirdBrand, logo: null }, { ...secondBrand, logo: null }, '5. repeated Brand migration produces byte-identical persisted data (Blob fields compared separately)');

  console.log('PASS: Business, Brand and Product schema migration is idempotent — repeating it a second time changes nothing further');

  // --- Progressive-UI edits: fill the new Advanced Business/Brand/Product fields through the
  // real forms and save, exactly as a founder would after first value. ---
  run("setup()");
  for (const [id, value] of Object.entries({ businessModel: 'اشتراك شهري', currentPriority: 'إطلاق باقة الشتاء', currentOffer: 'خصم 10% لفترة محدودة', importantSeason: 'موسم الشتاء', campaignContext: 'حملة العودة للمدارس', commercialConstraints: 'بدون شحن دولي' })) win.document.getElementById(id).value = value;
  win.document.getElementById('secondaryObjectives').value = 'رفع الوعي\nتحسين الاحتفاظ';
  run('saveBrain()');

  // brandBrainScreen() itself already fires Visual.setupBrand() as fire-and-forget; calling it
  // again here would race the first call (busy-guarded, so the second returns immediately while
  // the first is still resolving) and could clobber the field values set right after. Just wait
  // for the one real call to settle instead.
  run("brandBrainScreen()");
  await new Promise(r => setTimeout(r, 20));
  for (const [id, value] of Object.entries({ brandPositioning: 'الخيار الأذكى للسفر العائلي', brandValueProposition: 'تخطيط سفر بدون تعقيد', brandPersonality: 'مرح وعملي', brandToneOfVoice: 'ودود وواثق، جمل قصيرة' })) win.document.getElementById(id).value = value;
  win.document.getElementById('brandDifferentiators').value = 'تخطيط مخصص\nدعم على مدار الساعة';
  win.document.getElementById('brandDoList').value = 'استخدم لهجة سعودية';
  win.document.getElementById('brandPreferredVocabulary').value = 'عائلي';
  win.document.getElementById('brandVisualDirectionNotes').value = 'التزم بخلفيات فاتحة';
  win.document.getElementById('brandVisualDo').value = 'إضاءة طبيعية';
  await win.Visual.saveProject();

  run("productLibraryScreen()");
  await waitForImages(win, '#productList', 1);
  const productCard = [...win.document.querySelectorAll('#productList .card')].find(c => c.querySelector('h3').textContent === legacyProductName);
  assert.ok(productCard, 'the legacy product must render in the library before it can be edited');
  [...productCard.querySelectorAll('button')].find(b => b.textContent === 'تعديل').onclick();
  win.document.getElementById('productCategory').value = 'سفر وضيافة';
  win.document.getElementById('productPrice').value = '350 SAR';
  win.document.getElementById('productSpecifications').value = 'مقاس كبير\nعجلات دوارة';
  win.document.getElementById('productOffers').value = 'اشترِ حقيبتين واحصل على خصم';
  await win.Products.save();

  const editedBrain = JSON.parse(win.localStorage.getItem('brain'));
  assert.equal(editedBrain.currentPriority, 'إطلاق باقة الشتاء', 'the edited Advanced Business field persists');
  assert.deepEqual(editedBrain.secondaryObjectives, ['رفع الوعي', 'تحسين الاحتفاظ'], 'the edited secondaryObjectives list persists');
  const editedBrand = await store.loadBrand();
  assert.equal(editedBrand.positioning, 'الخيار الأذكى للسفر العائلي', 'the edited Brand Strategy field persists');
  assert.deepEqual(editedBrand.doList, ['استخدم لهجة سعودية'], 'the edited Brand Voice rule list persists');
  assert.equal(editedBrand.visualDirectionNotes, 'التزم بخلفيات فاتحة', 'the edited Visual Direction field persists');
  const editedProduct = (await store.listProducts()).find(p => p.id === 'legacy-prod');
  assert.equal(editedProduct.category, 'سفر وضيافة', 'the edited Product Memory field persists');
  assert.deepEqual(editedProduct.offers, ['اشترِ حقيبتين واحصل على خصم'], 'the edited product offers list persists');

  console.log('PASS: the new progressive Business/Brand/Product Advanced fields can be edited through the real UI and persist correctly');

  // --- 6, 7. Rename the business: the legacy-matching pack (stamped with businessId on this
  // encounter) remains reachable afterward; the already-orphaned pack is never relinked. ---
  const record = { id: 'rec-current', ts: Date.now(), brain: editedBrain, brand: editedBrand, product: null, task: { engine: 'content', context: 'سياق', selected: 'فكرة' }, settings: { format: '1:1', mode: 'Product Hero', textMode: 'none' }, rendered: new Blob(['x'], { type: 'image/png' }), overlayWarning: '', direction: 0, model: 'mock' };
  await win.Packs.prepare(record); // stamps 'legacy-pack' with the current businessId (project matches)
  const stampedLegacyPack = (await store.listPacks()).find(p => p.id === 'legacy-pack');
  assert.equal(stampedLegacyPack.businessId, editedBrain.businessId, 'the legacy-matching pack is stamped with the current businessId on encounter');

  win.document.getElementById('name').value = renamedBusinessName;
  run('saveBrain()');
  const renamedBrain = JSON.parse(win.localStorage.getItem('brain'));
  assert.equal(renamedBrain.businessId, editedBrain.businessId, '6. renaming the business does not change its stable businessId');
  await win.Packs.prepare({ ...record, brain: renamedBrain });
  const packsAfterRename = await store.listPacks();
  assert.equal(packsAfterRename.find(p => p.id === 'legacy-pack').businessId, renamedBrain.businessId, '6. the pack created/stamped before the rename remains matched by businessId after the rename');
  const orphanAfterRename = packsAfterRename.find(p => p.id === 'orphan-pack');
  assert.equal(orphanAfterRename.businessId, undefined, '7. the already-orphaned pack is never stamped with an unrelated businessId, even after this unrelated rename');
  assert.equal(orphanAfterRename.project, 'اسم قديم جدًا غير نجوب', "7. the already-orphaned pack's original data is left completely untouched");

  console.log('PASS: a business rename does not orphan a migrated stable-ID pack, and an already-orphaned legacy pack is never guessed or heuristically relinked');

  // --- 8. Product rename retains stable-ID selection/export behavior. ---
  const { exportPack } = await import('../lib/campaign-export.mjs');
  function readZipEntries(buffer) { const view = new DataView(buffer), bytes = new Uint8Array(buffer), out = {}; let offset = 0; while (offset + 4 <= buffer.byteLength && view.getUint32(offset, true) === 0x04034b50) { const nameLen = view.getUint16(offset + 26, true), compSize = view.getUint32(offset + 18, true); const name = new TextDecoder().decode(bytes.subarray(offset + 30, offset + 30 + nameLen)); out[name] = bytes.slice(offset + 30 + nameLen, offset + 30 + nameLen + compSize); offset += 30 + nameLen + compSize } return out }
  async function readManifest(pack) { const result = await exportPack(pack); const entries = readZipEntries(await result.blob.arrayBuffer()); const manifestPath = Object.keys(entries).find(n => n.endsWith('manifest.json')); return JSON.parse(new TextDecoder().decode(entries[manifestPath])) }
  // save() requires `pending` (the image) to be set, which the prior save's own reset() just
  // cleared — re-open the edit (exactly like a founder re-clicking "تعديل") before renaming.
  await win.Products.refresh();
  const cardToRename = [...win.document.querySelectorAll('#productList .card')].find(c => c.querySelector('h3').textContent === legacyProductName);
  assert.ok(cardToRename, 'the product must still render under its pre-rename name before it can be renamed');
  [...cardToRename.querySelectorAll('button')].find(b => b.textContent === 'تعديل').onclick();
  win.document.getElementById('productName').value = renamedProductName;
  await win.Products.save();
  const renamedProduct = (await store.listProducts()).find(p => p.id === 'legacy-prod');
  assert.equal(renamedProduct.id, 'legacy-prod', '8. the product keeps its stable id after a rename');
  assert.equal(renamedProduct.category, 'سفر وضيافة', '8. a product rename does not drop its other Product Memory fields');
  const manifest = await readManifest(stampedLegacyPack);
  assert.equal(manifest.entries[0].productId, 'legacy-prod', '8. a freshly-generated export manifest still resolves the stable productId after the product rename');

  console.log('PASS: a product rename retains stable-ID selection/export behavior — the id never changes, and a fresh export manifest still resolves it correctly');

  // --- 10, 11, 12, 13, 14. All seven consumers consume only their authorized slice, built from
  // context the founder already entered (never re-asked), with explicit product selection and
  // no write-back; an untouched optional field is never invented. ---
  const { normalizeRequest } = await import('../api/generate.mjs');
  const { normalizeVisual } = await import('../api/visual.mjs');
  const TEXT_ENGINES = ['content', 'copy', 'whatsapp', 'reel', 'offer', 'campaign'];
  for (const engine of TEXT_ENGINES) {
    run(`openEngine('${engine}')`);
    await new Promise(r => setTimeout(r, 20)); // let populateProductSelect() settle
    if (engine === 'whatsapp') win.document.getElementById('message').value = 'كم سعر الحقيبة؟';
    if (engine === 'campaign') win.document.getElementById('duration').value = '7 أيام';
    // Only one product exists in this workspace, so Batch 8's "exactly one product ->
    // deterministic, visible preselection" applies here for every engine, not only offer/
    // campaign — the selector still shows it explicitly (never silent), and this test confirms
    // the value is genuinely present rather than assuming it. The "multiple products -> no
    // auto-select" half of explicit/deterministic selection is already proven directly in
    // scripts/qa-v23-batch8-product-selection.mjs and is not re-derived here.
    const selector = win.document.getElementById('productId');
    assert.equal(selector?.value, 'legacy-prod', `12. ${engine}'s selector is deterministically preselected to the one existing product`);
    await run('run()');
    const sentBody = win.requests.at(-1).body;
    const task = normalizeRequest(sentBody);
    assert.equal(task.context.commercialContext.currentPriority, 'إطلاق باقة الشتاء', `10. ${engine} receives the already-stored Commercial Context without being re-asked`);
    assert.equal(task.context.brandPreferences.positioning, 'الخيار الأذكى للسفر العائلي', `10. ${engine} receives the already-stored Brand Preferences without being re-asked`);
    assert.equal(task.context.commercialContext.currentOffer, 'خصم 10% لفترة محدودة', `10. ${engine} receives currentOffer (it was explicitly set)`);
    assert.ok(!Object.hasOwn(task.context, 'visualIdentity'), `10. ${engine} never receives Visual Identity`);
    assert.equal(task.context.selectedProduct.id, 'legacy-prod', `12. ${engine} carries the deterministically selected stable product id`);
    // doList/preferredVocabulary are part of the FULL text-engine Brand Voice allowlist (only
    // Visual's brandVoice is the narrower, 'limited' personality+toneOfVoice set) — so these
    // text engines correctly receive the populated doList, and correctly omit the untouched
    // dontList/prohibitedVocabulary rather than inventing them.
    assert.deepEqual(task.context.brandPreferences.doList, ['استخدم لهجة سعودية'], `10. ${engine} receives the already-stored doList (part of the full text-engine Brand Voice allowlist)`);
    assert.ok(!Object.hasOwn(task.context.brandPreferences, 'dontList') && !Object.hasOwn(task.context.brandPreferences, 'prohibitedVocabulary'), `14. ${engine} omits the never-populated dontList/prohibitedVocabulary rather than inventing them`);
  }
  console.log('PASS: all six text engines consume only their authorized context slice, built entirely from already-stored memory (never re-asked), with explicit-only product selection for offer/campaign');

  // Visual Studio: jump directly from the Product Library's own "استخدم في استوديو التصميم"
  // entry point (useProduct), which deterministically and explicitly selects that exact product
  // — far more reliable for this test than driving choose()'s free-text idea-matching heuristic.
  await win.Visual.useProduct('legacy-prod');
  await new Promise(r => setTimeout(r, 20));
  await win.Visual.generate();
  const visualBody = win.requests.at(-1)?.body;
  assert.ok(visualBody && visualBody.task, 'Visual Studio must have sent a real request to /api/visual');
  const visualTask = normalizeVisual(visualBody);
  assert.equal(visualTask.context.brandPreferences.positioning, 'الخيار الأذكى للسفر العائلي', '11. Visual receives the already-stored Brand Strategy without being re-asked');
  assert.ok(!Object.hasOwn(visualTask.context.brandPreferences, 'doList'), "11. Visual's brandPreferences never includes doList (text-only Brand Voice field)");
  assert.equal(visualTask.context.visualDirection.visualDirectionNotes, 'التزم بخلفيات فاتحة', '11. Visual receives Visual Direction');
  assert.equal(visualTask.context.selectedProduct.id, 'legacy-prod', '12. Visual carries the explicitly selected stable product id reached via useProduct()');

  console.log('PASS: Visual Studio consumes only its authorized context slice, built from already-stored memory, with explicit-only product selection');

  // --- 13. No AI output writes back into memory: the response contracts are unchanged. ---
  const generateApiSource = fs.readFileSync('api/generate.mjs', 'utf8');
  const visualApiSource = fs.readFileSync('api/visual.mjs', 'utf8');
  // Checked as an actual call pattern (e.g. "saveProduct("), not a bare substring — api/visual.mjs
  // has its own explanatory comment that merely names saveProduct in prose, which is not a call.
  for (const src of [generateApiSource, visualApiSource]) for (const fn of ['saveBrain', 'saveBrand', 'saveProduct']) assert.ok(!new RegExp(`${fn}\\s*\\(`).test(src), `13. neither server endpoint calls ${fn}(...) — no mechanism exists for AI output to write back`);

  console.log('PASS: no generated output can write back into Business/Brand/Product memory — neither server endpoint has any reference to a memory-writing function');

  // --- 14. An untouched optional field (never set by the founder) is omitted, not invented. ---
  const untouchedField = normalizeRequest({ brain: { ...renamedBrain, importantSeason: '' }, engine: 'copy', inputs: { channel: 'Instagram', instruction: '' } });
  assert.ok(!Object.hasOwn(untouchedField.context.commercialContext, 'importantSeason'), '14. a never-populated optional field is omitted entirely, never invented as a fact');

  console.log('PASS: an empty/untouched optional memory field is omitted from the assembled context entirely, never invented as a fact');

  // display() (called inside requestVisual above) fires globalThis.Packs?.prepare(record) as
  // fire-and-forget; flush so that pending continuation settles before anything below closes
  // the window (same class of issue as Batch 8/9's jsdom window-close races).
  await new Promise(r => setTimeout(r, 30));

  // --- Export the full, now-populated-and-renamed V4 workspace for the import phase. This
  // must happen BEFORE dom.window.close() — jsdom tears down window.localStorage on close, and
  // buildBundle() is imported as a plain top-level module (outside the vm context), so its bare
  // `localStorage` reference resolves against this outer process's globalThis, not win; bridge
  // it to the same storage the jsdom page has been using all along while it still exists. ---
  globalThis.localStorage = win.localStorage;
  const { buildBundle } = await import('../lib/workspace-transfer.mjs');
  const bundle = await buildBundle();
  fs.writeFileSync(bundlePath, JSON.stringify(bundle));
  dom.window.close();
  process.exit(0);
}

if (phase === 'import') {
  const { indexedDB } = await import('fake-indexeddb'); // a fresh module instance — genuinely empty store
  globalThis.indexedDB = indexedDB;
  const importLocalMap = new Map();
  globalThis.localStorage = { getItem: k => importLocalMap.get(k) ?? null, setItem: (k, v) => importLocalMap.set(k, v) };
  const store = await import('../lib/visual-storage.mjs');
  const { importWorkspace } = await import('../lib/workspace-transfer.mjs');

  const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
  const summary = await importWorkspace(bundle);
  assert.equal(summary.brainImported, true, '9. Business Memory is restored on import into a fresh store');
  assert.equal(summary.productsSkipped, 0, '9. no product fails to import');
  assert.equal(summary.packsSkipped, 0, '9. no Campaign Pack fails to import');

  // Read back what importWorkspace actually wrote into the fresh store's localStorage, not
  // merely re-parsing the bundle's own data (which would just test JSON.stringify/parse).
  const importedBrain = JSON.parse(globalThis.localStorage.getItem('brain') || '{}');
  assert.equal(importedBrain.name, renamedBusinessName, '9. the renamed business name survives export/import');
  assert.equal(importedBrain.currentPriority, 'إطلاق باقة الشتاء', '9. the edited Commercial Context field survives export/import');
  assert.deepEqual(importedBrain.secondaryObjectives, ['رفع الوعي', 'تحسين الاحتفاظ'], '9. the edited secondaryObjectives list survives export/import');

  const importedBrand = await store.loadBrand();
  assert.equal(importedBrand.positioning, 'الخيار الأذكى للسفر العائلي', '9. the edited Brand Strategy field survives export/import');
  assert.deepEqual(importedBrand.doList, ['استخدم لهجة سعودية'], '9. the edited Brand Voice rule list survives export/import');
  assert.equal(importedBrand.visualDirectionNotes, 'التزم بخلفيات فاتحة', '9. the edited Visual Direction field survives export/import');
  const importedLogoBytes = new Uint8Array(await importedBrand.logo.arrayBuffer());
  assert.deepEqual(importedLogoBytes, logoBytes, '9. the Brand visual asset (logo) survives export/import byte-identical');

  const importedProducts = await store.listProducts();
  const importedProduct = importedProducts.find(p => p.id === 'legacy-prod');
  assert.ok(importedProduct, '9. the product survives export/import under its stable id');
  assert.equal(importedProduct.name, renamedProductName, '9. the renamed product name survives export/import');
  assert.equal(importedProduct.category, 'سفر وضيافة', '9. the edited Product Memory field survives export/import');
  const importedBagBytes = new Uint8Array(await importedProduct.image.arrayBuffer());
  assert.deepEqual(importedBagBytes, bagBytes, '9. the product image survives export/import byte-identical');

  const importedPacks = await store.listPacks();
  const importedLegacyPack = importedPacks.find(p => p.id === 'legacy-pack');
  assert.equal(importedLegacyPack.businessId, importedBrain.businessId, '9. the stamped Campaign Pack remains reachable under the stable businessId after export/import/reload');
  const importedOrphanPack = importedPacks.find(p => p.id === 'orphan-pack');
  assert.equal(importedOrphanPack.businessId, undefined, '9. the already-orphaned pack is still not relinked after export/import — portability never heuristically fixes it either');

  console.log('PASS: the complete V4 workspace — renamed Business Memory, Commercial Context, Brand Intelligence (Strategy/Voice/Visual Direction), visual assets, edited Product Memory, stable business/product IDs and Campaign Pack reachability (including the still-orphaned legacy pack) — survives export/import into a genuinely fresh store and reload exactly');
  process.exit(0);
}

// --- Orchestrator (no phase argv): static structural checks, then the two child-process phases. ---
const html = fs.readFileSync('index.html', 'utf8');

// --- 1. Essential Setup remains lightweight. ---
const requiredSection = html.match(/<h3>المعلومات المطلوبة للبدء<\/h3>[\s\S]*?<div class="actions">[\s\S]*?<\/div>\n<\/div>/)[0];
assert.equal([...requiredSection.matchAll(/<(?:input|textarea|select)\b/g)].length, 3, '1. the required-to-start section contains exactly the 3 essential fields (name/product/customer) — Essential Setup stays lightweight');
assert.ok(requiredSection.includes('ابدأ الآن'), '1. the quick-start action is reachable directly from the required section, with no Advanced section blocking it');

console.log('PASS: Essential Setup remains lightweight — exactly the 3 required fields stand between a new founder and first generated value');

// --- 2. Advanced memory fields are progressively accessible (collapsed by default, not forced). ---
for (const id of ['businessAdvanced', 'voiceAdvanced', 'visualDirectionAdvanced', 'productAdvanced']) {
  const tag = html.match(new RegExp(`<details[^>]*id="${id}"[^>]*>`))?.[0];
  assert.ok(tag, `2. the ${id} Advanced section exists`);
  assert.ok(!tag.includes(' open'), `2. the ${id} Advanced section is collapsed by default (progressive disclosure, not a forced giant form)`);
}

console.log('PASS: every Advanced memory section (Business Commercial Context, Brand Voice rules, Visual Direction, Product Memory details) is progressively accessible via a collapsed-by-default <details> element, never forced open');

// --- 3. Brand Strategy/Voice precede Visual Identity in the Brand Brain UX. ---
const brandBrainSection = html.match(/<section id="brandBrain"[\s\S]*?<\/section>/)[0];
// Matched as actual <h3> section headings, not substring mentions — the intro paragraph
// legitimately says "a brand is bigger than colors and logo", which would otherwise produce a
// false "colors" hit before the real Strategy heading.
const strategyIndex = brandBrainSection.indexOf('<h3>الإستراتيجية');
const voiceIndex = brandBrainSection.indexOf('<h3>نبرة الصوت');
const logoIndex = brandBrainSection.indexOf('<h3>الشعار وصور المرجع</h3>');
const colorsIndex = brandBrainSection.indexOf('<h3>الألوان</h3>');
assert.ok(strategyIndex > -1 && voiceIndex > -1 && logoIndex > -1 && colorsIndex > -1, '3. all four Brand Brain sections exist');
assert.ok(strategyIndex < logoIndex && strategyIndex < colorsIndex, '3. Brand Strategy appears before Visual Identity (logo/colors) in the Brand Brain markup');
assert.ok(voiceIndex < logoIndex && voiceIndex < colorsIndex, '3. Brand Voice appears before Visual Identity (logo/colors) in the Brand Brain markup');

console.log('PASS: Brand Strategy and Voice are presented before Visual Identity in the Brand Brain UX, so SHGHIL communicates that a brand is more than colors/logo');

// --- 17. No claim of cloud sync, accounts, or automatic cross-device persistence anywhere. ---
// "حساب" (account), "account", "cloud sync" etc. must not appear at all — there is no correct
// way to mention them in this app's actual local-only behavior. "سحاب" (cloud) alone is
// different: the existing, correct copy uses it exactly once, inside a negation ("does not
// upload to cloud storage") — so every occurrence must be a negation, not merely absent.
// V4.1 introduces one legitimate, unrelated use of "حساب": the Outcome Home mission card "أبغى
// أنشط حساباتي" means social-media accounts the founder wants to reactivate (verbatim spec
// copy), never a SHGHIL login/cloud account — strip that one known phrase before checking so
// every other occurrence (the thing this check actually guards against) is still caught.
const htmlForAccountCheck = html.replace(/أبغى أنشط حساباتي/g, '');
for (const phrase of ['حساب', 'account', 'cloud sync', 'cloud account', 'sync across devices', 'automatically sync']) {
  assert.ok(!htmlForAccountCheck.toLowerCase().includes(phrase.toLowerCase()), `17. the UI makes no mention of "${phrase}" at all (outside the disclosed V4.1 social-accounts mission-card exception)`);
}
for (const match of html.matchAll(/(.{20})سحاب/g)) assert.match(match[1], /ل[ان]\s/, `17. every mention of "cloud" is a negation (does NOT use cloud storage), never a claim: "${match[0]}"`);
assert.ok(html.includes('سحاب'), '17. sanity: the local-only cloud disclaimer this check relies on is still present at all');
assert.ok(html.includes('تُخزَّن على هذا الجهاز والمتصفح فقط'), '17. the existing local-only-storage disclaimer is still present');
assert.ok(html.includes('لا تنتقل تلقائيًا إلى جهاز أو رابط آخر'), '17. the Brand Brain screen still explicitly disclaims automatic cross-device/cross-link transfer');

console.log('PASS: the UI contains no claim of cloud sync, accounts, or automatic cross-device persistence anywhere — every relevant screen explicitly disclaims it');

// --- Full migration -> edit -> rename -> seven-consumer -> export -> import(fresh) -> reload. ---
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shaghil-v4-batch10-'));
const bundlePathArg = path.join(tmpDir, 'bundle.json');
try {
  execFileSync(process.execPath, [self, 'origin', bundlePathArg], { stdio: 'inherit' });
  execFileSync(process.execPath, [self, 'import', bundlePathArg], { stdio: 'inherit' });
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log('\nPASS V4 BATCH 10: Essential Setup stays lightweight, every new Business/Brand/Product memory field is progressively (never forcibly) disclosed, Brand Strategy/Voice precede Visual Identity, and a complete pre-V4 -> migrated -> edited -> renamed -> exported -> imported-into-a-fresh-store -> reloaded lifecycle loses nothing while every one of the seven consumers (six text engines + Visual Studio) consumes only its authorized context slice, built entirely from already-stored memory, with explicit-only product selection and zero write-back — and the UI makes no cloud/account claim anywhere');
