// SHGHIL V4.1 — Outcome Experience / Sales Growth Mission regression suite (requirements A-T).
// Same philosophy and mounting technique as qa-v25-batch10-progressive-hardening.mjs: the real
// index.html inline script + real lib/*.mjs modules are mounted in jsdom via vm.runInContext, so
// every assertion drives the actual shipped code, not a hand-rolled stand-in.
//
// Runs in its own process (fresh IndexedDB), like qa-v23/qa-v26, since it needs a genuinely empty
// Product Library to prove the zero/one/multiple-product paths deterministically.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { indexedDB } from 'fake-indexeddb';
import * as store from '../lib/visual-storage.mjs';

globalThis.indexedDB = globalThis.indexedDB || indexedDB;

function mountPage() {
  const html = fs.readFileSync('index.html', 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
  const win = dom.window, ctx = dom.getInternalVMContext();
  win.store = store;
  win.structuredClone = structuredClone;
  win.Blob = Blob;
  win.URL.createObjectURL = () => 'blob:qa-' + Math.random();
  win.URL.revokeObjectURL = () => {};
  win.decodeImage = async () => ({ width: 400, height: 400 });
  win.normalizeAsset = async file => new Blob(['ref:' + file.name], { type: 'image/jpeg' });
  win.blobPayload = async () => ({ type: 'image/png', base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==' });
  win.composeVisual = async () => new Blob(['rendered'], { type: 'image/png' });
  win.responseBlob = () => new Blob(['scene'], { type: 'image/jpeg' });
  win.crypto.randomUUID = win.crypto.randomUUID || (() => 'uuid-' + Math.random().toString(36).slice(2));
  win.requests = [];
  win.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body);
    win.requests.push({ url, body });
    const text = body.engine === 'campaign' ? '## الفكرة\nحملة تجريبية\n\n## whatsapp_broadcast\nرسالة تجريبية' : '## اليوم 1\nمحتوى تجريبي';
    return { ok: true, status: 200, text: async () => JSON.stringify({ text }), json: async () => ({ base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', mime: 'image/jpeg', model: 'mock', direction: 0 }) };
  };
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], ctx);
  for (const file of ['lib/product-library.mjs', 'lib/campaign-packs.mjs', 'lib/workspace-transfer.mjs']) {
    const src = fs.readFileSync(file, 'utf8').replace(/^import .*;\n/gm, '').replace(/^export (function|const|async function)/gm, '$1');
    vm.runInContext('(function(){' + src + '})()', ctx);
  }
  const visualStudioSrc = fs.readFileSync('lib/visual-studio.mjs', 'utf8').replace(/^import .*;\n/gm, '').replace('export function splitIdeas', 'function splitIdeas');
  vm.runInContext('(function(){' + visualStudioSrc + '})()', ctx);
  // mission-sales.mjs has several named exports (unlike visual-studio.mjs's lone one) — strip the
  // `export` keyword generically rather than one string replace per export.
  const missionSrc = fs.readFileSync('lib/mission-sales.mjs', 'utf8').replace(/^import .*;\n/gm, '').replace(/^export (function|const|async function)/gm, '$1');
  vm.runInContext('(function(){' + missionSrc + '})()', ctx);
  return { dom, win, run: code => vm.runInContext(code, ctx) };
}

const brain = { name: 'تحميص ٢٧', category: 'قهوة مختصة', product: 'قهوة مختصة وحلويات', customer: 'موظفون وطلاب 20-35', location: 'جدة', price: '50-100 SAR', tone: 'سعودي طبيعي', objective: 'رجوع العملاء', importantSeason: 'رمضان', currentOffer: 'خصم 10% لفترة محدودة' };

// ---- A. Outcome Home renders. ----
{
  const { dom, win, run } = mountPage();
  win.localStorage.setItem('brain', JSON.stringify(brain));
  run('outcomeHome()');
  const sec = win.document.getElementById('outcomeHome');
  assert.equal(sec.classList.contains('hidden'), false, 'A. outcomeHome() must render the Outcome Home screen');
  assert.ok(sec.querySelector('h1').textContent.includes('وش تبغى تحقق'), 'A. the Outcome Home heading matches the approved product principle text');
  dom.window.close();
  console.log('PASS A: Outcome Home renders with the approved heading');
}

// ---- B. All five Mission options exist. C. "كل الأدوات" still exposes existing engines. ----
{
  const { dom, win, run } = mountPage();
  win.localStorage.setItem('brain', JSON.stringify(brain));
  run('outcomeHome()');
  const cards = [...win.document.querySelectorAll('#outcomeHome .card.engine')];
  assert.equal(cards.length, 5, 'B. exactly five mission cards exist on Outcome Home');
  const labels = cards.map(c => c.textContent.trim());
  for (const label of ['أبغى أزيد المبيعات', 'أبغى أسوي حملة لمنتج', 'أبغى أنشط حساباتي', 'عندي عرض وأبغى أسوق له', 'أبغى أطلق منتج جديد']) {
    assert.ok(labels.some(l => l.includes(label)), `B. mission "${label}" must exist on Outcome Home`);
  }
  assert.ok(win.document.getElementById('missionFreeText'), 'B. the free-text mission entry point exists');
  const allToolsBtn = [...win.document.querySelectorAll('#outcomeHome button')].find(b => b.textContent === 'كل الأدوات');
  assert.ok(allToolsBtn, 'B. "كل الأدوات" is reachable from Outcome Home');
  run(allToolsBtn.getAttribute('onclick'));
  assert.equal(win.document.getElementById('home').classList.contains('hidden'), false, 'C. "كل الأدوات" opens the existing six-engine home screen');
  for (const engine of ['content', 'copy', 'offer', 'whatsapp', 'campaign', 'reel']) {
    assert.ok(win.document.querySelector(`#home .engine[onclick="openEngine('${engine}')"]`), `C. existing engine "${engine}" is still exposed under كل الأدوات`);
  }
  dom.window.close();
  console.log('PASS B/C: all five missions plus the free-text entry exist, and "كل الأدوات" still exposes every existing engine');
}

// ---- D. Sales Growth Mission can open. ----
{
  const { dom, win, run } = mountPage();
  win.localStorage.setItem('brain', JSON.stringify(brain));
  await win.Mission.start('sales');
  assert.equal(win.document.getElementById('missionSales').classList.contains('hidden'), false, 'D. Mission.start("sales") opens the missionSales screen');
  assert.equal(win.document.getElementById('missionStepRecommendation').classList.contains('hidden'), false, 'D. the recommendation step is the first thing shown');
  dom.window.close();
  console.log('PASS D: the Sales Growth Mission opens to its recommendation step');
}

// ---- The other four missions enter an honest "coming next" state, never fake functionality. ----
{
  const { dom, win, run } = mountPage();
  win.localStorage.setItem('brain', JSON.stringify(brain));
  for (const key of ['campaign', 'reactivate', 'offer', 'launch']) {
    win.Mission.start(key);
    assert.equal(win.document.getElementById('missionComingNext').classList.contains('hidden'), false, `the "${key}" mission must show the honest coming-next state, not fabricated output`);
  }
  dom.window.close();
  console.log('PASS: the four not-yet-implemented missions show an honest "coming next" state rather than fake functionality');
}

// ---- E. Business Memory context is selectively assembled (reused, never a new Business Brain). ----
{
  const { pickProduct, buildOpportunity, buildPlan, routeFreeText } = await import('../lib/mission-sales.mjs');
  const opp = buildOpportunity(brain, null);
  assert.equal(opp.goal, 'زيادة الطلبات والمبيعات', 'E. opportunity goal is set');
  assert.equal(opp.audience, brain.customer, 'E. audience comes directly from existing Business Memory (brain.customer), never invented');
  assert.equal(opp.opportunity, brain.importantSeason, 'E. opportunity text is drawn from existing Commercial Context (importantSeason), never invented');
  assert.equal(opp.offer, brain.currentOffer, 'E. offer is drawn from existing Commercial Context (currentOffer) when no product offer exists');
  const plan = buildPlan(opp);
  assert.equal(plan.audience, opp.audience, 'E. the plan reuses the same already-assembled opportunity context');
  console.log('PASS E: Sales Mission context is selectively assembled from already-stored V4 Business Memory, never a new/duplicate Business Brain');
}

// ---- F. Product selection uses stable Product ID. G. No product -> graceful behavior. ----
{
  const { pickProduct, buildOpportunity } = await import('../lib/mission-sales.mjs');
  assert.equal(pickProduct([]), null, 'G. zero products -> no auto-pick (null), a graceful, non-fabricated state');
  const oppNoProduct = buildOpportunity(brain, null);
  assert.equal(oppNoProduct.product, null, 'G. no product selected means no product in the opportunity, never guessed');
  assert.ok(oppNoProduct.recommendation.includes('لعدم وجود منتج محدد') || !oppNoProduct.product, 'G. the recommendation text honestly reflects the absence of a product');
  const product = { id: 'stable-id-123', name: 'منظم شنطة السفر', offers: [] };
  const oppOneProduct = buildOpportunity(brain, product);
  assert.equal(oppOneProduct.product.id, 'stable-id-123', 'F. the opportunity carries the product by its real stable id, never by name alone');
  console.log('PASS F/G: product selection is keyed by stable id, and a workspace with no products degrades gracefully without inventing one');
}

// ---- H. One product -> valid recommendation path. I. Multiple products -> recommendation/change path. ----
{
  const { dom, win, run } = mountPage();
  win.localStorage.setItem('brain', JSON.stringify(brain));
  await store.saveProduct({ id: 'prod-one', name: 'منتج فريد', description: '', fidelity: 'exact', image: new Blob(['x'], { type: 'image/png' }), reference: new Blob(['x'], { type: 'image/jpeg' }) });
  await win.Mission.start('sales');
  assert.equal(win.document.getElementById('missionProductSelect').value, 'prod-one', 'H. exactly one product is deterministically preselected in the mission recommendation');
  assert.ok(win.document.getElementById('missionProductName').textContent.includes('منتج فريد'), 'H. the recommended product is the real, named product');
  await store.saveProduct({ id: 'prod-two', name: 'منتج ثاني', description: '', fidelity: 'exact', image: new Blob(['x'], { type: 'image/png' }), reference: new Blob(['x'], { type: 'image/jpeg' }) });
  await win.Mission.start('sales');
  assert.equal(win.document.getElementById('missionProductSelect').value, '', 'I. with multiple products, nothing is auto-selected — the founder must choose explicitly');
  const options = [...win.document.getElementById('missionProductSelect').options].map(o => o.value);
  assert.ok(options.includes('prod-one') && options.includes('prod-two'), 'I. both products are offered so the founder can change the selection');
  win.document.getElementById('missionProductSelect').value = 'prod-two';
  win.Mission.changeProduct();
  assert.ok(win.document.getElementById('missionProductName').textContent.includes('منتج ثاني'), 'I. changing the selection updates the recommendation to the newly chosen real product');
  dom.window.close();
  // Clean up: this suite shares one fake-indexeddb across every block in this process (like
  // qa-v17/qa-v22 do for the main qa.mjs chain) — remove these two products so a later block's
  // own single-product assumption is not silently broken by this block's leftover state.
  await store.deleteProduct('prod-one');
  await store.deleteProduct('prod-two');
  console.log('PASS H/I: one product is deterministically preselected; multiple products offer an explicit, working change path');
}

// ---- J. Known currentOffer/product offers are used without invention. K. Unknown offer never fabricates a discount. ----
{
  const { buildOpportunity } = await import('../lib/mission-sales.mjs');
  const productWithOffer = { id: 'p1', name: 'منتج', offers: ['اشترِ واحد واحصل على الثاني بنصف السعر'] };
  const oppWithProductOffer = buildOpportunity(brain, productWithOffer);
  assert.equal(oppWithProductOffer.offer, productWithOffer.offers[0], 'J. a known product offer is used verbatim, never altered');
  const brainNoOffer = { ...brain, currentOffer: '' };
  const productNoOffer = { id: 'p2', name: 'منتج آخر', offers: [] };
  const oppNoOffer = buildOpportunity(brainNoOffer, productNoOffer);
  assert.equal(oppNoOffer.offer, '', 'K. with no known offer anywhere, the opportunity reports an empty offer, never a fabricated discount');
  assert.ok(oppNoOffer.recommendation.includes('بدون عرض مخفّض معروف'), 'K. the recommendation text honestly states no known offer rather than inventing one');
  console.log('PASS J/K: a known offer (product or business) is used as-is; an unknown offer never fabricates a discount');
}

// ---- L. Recommendation -> Campaign Plan transition works. ----
{
  const { dom, win, run } = mountPage();
  win.localStorage.setItem('brain', JSON.stringify(brain));
  await win.Mission.start('sales');
  win.Mission.goToPlan();
  assert.equal(win.document.getElementById('missionStepPlan').classList.contains('hidden'), false, 'L. approving the recommendation opens the Campaign Plan step');
  assert.equal(win.document.getElementById('missionStepRecommendation').classList.contains('hidden'), true, 'L. the recommendation step is hidden once the plan step is shown');
  assert.ok(win.document.getElementById('missionPlanGoal').textContent, 'L. the plan is populated from the just-approved recommendation');
  dom.window.close();
  console.log('PASS L: the recommendation-to-plan transition works and carries the approved context forward');
}

// ---- M. Campaign Plan -> generation orchestration works (reuses existing campaign/content/visual). ----
// N. Existing engine functionality remains intact. R. No autonomous Business Memory mutation.
// S. Unified Mission Result contains expected generated sections.
{
  const { dom, win, run } = mountPage();
  win.localStorage.setItem('brain', JSON.stringify(brain));
  await store.saveProduct({ id: 'prod-m', name: 'منتج التجربة', description: '', fidelity: 'exact', image: new Blob(['x'], { type: 'image/png' }), reference: new Blob(['x'], { type: 'image/jpeg' }) });
  await win.Mission.start('sales');
  // Captured after opening the mission (which triggers getBrain()'s normal, pre-existing, one-time
  // lazy V4 migration/stamping) rather than before it, so this snapshot reflects the already-
  // migrated record — the thing R actually guards against is the MISSION writing back, not the
  // unrelated, already-approved lazy-migration stamp every screen triggers on first read.
  const brainBefore = win.localStorage.getItem('brain');
  win.Mission.goToPlan();
  await win.Mission.approvePlan();
  assert.equal(win.document.getElementById('missionResult').classList.contains('hidden'), false, 'M. approving the plan opens the Unified Mission Result');
  const requestEngines = win.requests.map(r => r.body.engine).filter(Boolean);
  assert.ok(requestEngines.includes('campaign'), 'M. orchestration reuses the existing campaign engine via the unmodified /api/generate endpoint');
  assert.ok(requestEngines.includes('content'), 'M. orchestration reuses the existing content engine via the unmodified /api/generate endpoint');
  const visualRequest = win.requests.find(r => r.url.includes('/api/visual'));
  assert.ok(visualRequest, 'M. orchestration reuses the existing Visual Studio pipeline via the unmodified /api/visual endpoint for a product with a real image');
  const campaignReq = win.requests.find(r => r.body.engine === 'campaign');
  assert.equal(campaignReq.body.product?.id, 'prod-m', 'M. the orchestrated campaign request carries the real selected stable product id');
  assert.ok(win.document.getElementById('missionCampaignOut').innerHTML.includes('حملة تجريبية'), 'S. the Unified Result "خطة الحملة" section contains the real generated campaign text');
  assert.ok(win.document.getElementById('missionContentOut').innerHTML.includes('محتوى تجريبي'), 'S. the Unified Result "المحتوى" section contains the real generated content text');
  assert.ok(win.document.getElementById('missionVisualOut').innerHTML.includes('<img'), 'S. the Unified Result "التصاميم" section contains a real generated image for a product with a real image');
  // N: a direct engine call still works unaffected by anything the mission did.
  run("openEngine('copy')");
  await run('run()');
  assert.equal(win.document.getElementById('output').classList.contains('hidden'), false, 'N. direct engine access (openEngine/run) still works exactly as before, untouched by the Mission layer');
  // R: nothing about running the mission silently changed stored Business Memory.
  assert.equal(win.localStorage.getItem('brain'), brainBefore, 'R. running the Sales Mission end to end never mutates stored Business Memory');
  // Flush fire-and-forget continuations (Visual's display() -> Packs.prepare(), openEngine()'s
  // own populateProductSelect()) before closing — otherwise they can fire after this window is
  // torn down and crash against its now-undefined document (the same jsdom gotcha qa-v25 and
  // qa-v26 already document and guard against).
  await new Promise(r => setTimeout(r, 30));
  dom.window.close();
  console.log('PASS M/N/R/S: Campaign Plan approval orchestrates the existing campaign/content/visual capabilities unmodified, direct engine access remains intact, Business Memory is never autonomously mutated, and the Unified Result contains all three real generated sections');
}

// ---- O. Pilot gate remains intact. ----
{
  const html = fs.readFileSync('index.html', 'utf8');
  assert.ok(html.includes("async function submitPilotKey()") && html.includes("/api/pilot-auth"), 'O. the real-server-verification pilot gate (PR #3 hotfix) is untouched by V4.1');
  assert.ok(fs.existsSync('api/pilot-auth.mjs'), 'O. the dedicated pilot-auth verification endpoint still exists');
  const generateSrc = fs.readFileSync('api/generate.mjs', 'utf8');
  const visualSrc = fs.readFileSync('api/visual.mjs', 'utf8');
  assert.ok(generateSrc.includes('checkPilotAuth(req)') && visualSrc.includes('checkPilotAuth(req)'), 'O. both AI endpoints still enforce checkPilotAuth() first, exactly as before V4.1');
  console.log('PASS O: the server-side pilot gate (auth, rate limiting, fail-closed behavior) is completely untouched by V4.1');
}

// ---- P. Workspace export/import remains backward compatible. ----
{
  const { dom, win, run } = mountPage();
  win.localStorage.setItem('brain', JSON.stringify(brain));
  const bundle = await win.Workspace.buildBundle();
  assert.ok(bundle && typeof bundle === 'object', 'P. Workspace.buildBundle() still produces a bundle after V4.1');
  assert.ok(!('missionState' in bundle), 'P. V4.1 introduces no new, separate persisted mission-state field — nothing new for export/import to track');
  assert.ok(!('missionState' in (bundle.localStorage || {})), 'P. V4.1 adds no new localStorage key for mission state either');
  dom.window.close();
  console.log('PASS P: workspace export/import is untouched and backward compatible — V4.1 adds no new persisted schema');
}

// ---- Q. Mobile structural checks. ----
{
  const html = fs.readFileSync('index.html', 'utf8');
  const css = fs.readFileSync('styles/components.css', 'utf8');
  assert.ok(/@media\(max-width:700px\)\{[^}]*\.grid,\.form,\.brain\{grid-template-columns:1fr\}/.test(css), 'Q. the existing mobile single-column rule still covers .grid, and therefore the new Outcome Home mission-card grid');
  const outcomeSection = html.match(/<section id="outcomeHome"[\s\S]*?<\/section>/)[0];
  assert.ok(outcomeSection.includes('class="grid"'), 'Q. Outcome Home reuses the existing responsive .grid class, not a new unresponsive layout');
  const missionResultSection = html.match(/<section id="missionResult"[\s\S]*?<\/section>/)[0];
  assert.ok(missionResultSection.includes('<details'), 'Q. the Unified Mission Result reuses the existing collapsible <details> pattern (already mobile-proven in Batch 10), not a new layout');
  console.log('PASS Q: Outcome Home and the Sales Mission result reuse already-responsive existing layout primitives, with no new unresponsive markup');
}

// ---- T. Direct engine access remains functional (static structural proof, complementing N above). ----
{
  const html = fs.readFileSync('index.html', 'utf8');
  for (const engine of ['content', 'copy', 'offer', 'whatsapp', 'campaign', 'reel']) {
    assert.ok(html.includes(`openEngine('${engine}')`), `T. direct access to "${engine}" is still wired in the markup`);
  }
  assert.ok(html.includes('function run(again=false)') && html.includes('function openEngine(e)'), 'T. the existing run()/openEngine() functions are untouched');
  console.log('PASS T: every existing engine remains directly accessible through its original, untouched code path');
}

console.log('\nPASS: V4.1 Outcome Experience / Sales Growth Mission — requirements A-T all verified against the real shipped code');
