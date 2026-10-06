// SHGHIL V4.1 — Outcome Experience, Sales Growth Mission (the one mission implemented
// end-to-end in this release; the other four missions are a "coming next" placeholder).
//
// Architectural rule this file exists to honor: no new Business Brain, no new generators, no
// new API endpoints. Everything here either reads the existing V4 Business Memory (brain via
// the inline script's global getBrain(), Brand via Visual.brandContext(), Product Memory via
// visual-storage.mjs/Visual.productContext()) or orchestrates the existing /api/generate and
// Visual Studio (/api/visual) capabilities exactly as the six engines already do. Nothing here
// ever calls store.saveBrain()/saveBrand()/saveProduct() — recommending from memory must never
// silently write back into it.
import * as store from './visual-storage.mjs';

const el = id => document.getElementById(id);

// ---- Pure, deterministic, unit-testable core (no DOM, no network) -------------------------

// Exactly-one-product deterministic pick, multiple-products no-auto-pick — the same Batch 8
// product-selection discipline the six text engines already use, reused rather than reinvented.
export function pickProduct(products) {
  if (!Array.isArray(products) || products.length !== 1) return null;
  return products[0];
}

// Never invents price, discount, stock, margin, promotion or performance. `offer` is only ever
// an already-stored fact (the selected product's own first offer, or the business's current
// offer) — when neither exists, it is explicitly reported as unknown, never guessed or defaulted
// to a fabricated discount.
export function buildOpportunity(brain, product) {
  const audience = typeof brain?.customer === 'string' ? brain.customer.trim() : '';
  const opportunity = [brain?.importantSeason, brain?.currentPriority, brain?.campaignContext]
    .map(v => (typeof v === 'string' ? v.trim() : '')).find(Boolean) || '';
  const offerSource = (Array.isArray(product?.offers) && product.offers[0]) || brain?.currentOffer || '';
  const offer = typeof offerSource === 'string' ? offerSource.trim() : '';
  const productInfo = product ? { id: product.id, name: product.name } : null;
  return {
    goal: 'زيادة الطلبات والمبيعات',
    product: productInfo,
    audience,
    opportunity,
    offer,
    recommendation: buildRecommendationText({ product: productInfo, audience, opportunity, offer })
  };
}

function buildRecommendationText({ product, audience, opportunity, offer }) {
  const parts = [];
  parts.push(product ? `أفضل فرصة الآن هي التركيز على منتج "${product.name}"` : 'أفضل فرصة الآن تعتمد على مشروعك ككل لعدم وجود منتج محدد في مكتبة المنتجات بعد');
  if (audience) parts.push(`لجمهورك المعروف (${audience})`);
  if (opportunity) parts.push(`مستفيدًا من ${opportunity}`);
  parts.push(offer ? `مع تسليط الضوء على عرضك الحالي: ${offer}` : 'بدون عرض مخفّض معروف حاليًا — التركيز يكون على القيمة والفائدة المباشرة بدل الخصم');
  return parts.join('، ') + '.';
}

const DEFAULT_CHANNELS = ['Instagram', 'WhatsApp'];
const DEFAULT_DURATION = '7 أيام';

export function buildPlan(opportunity, overrides = {}) {
  return {
    goal: opportunity.goal,
    audience: opportunity.audience || 'جمهورك الحالي',
    creativeIdea: overrides.creativeIdea || (opportunity.product ? `حملة تركّز على ${opportunity.product.name}` : 'حملة تركّز على القيمة الأساسية لمشروعك'),
    keyMessage: overrides.keyMessage || opportunity.recommendation,
    offer: opportunity.offer || 'بدون عرض محدد حاليًا',
    channels: Array.isArray(overrides.channels) && overrides.channels.length ? overrides.channels : DEFAULT_CHANNELS,
    duration: overrides.duration || DEFAULT_DURATION
  };
}

// Maps a short free-text goal to one of the five missions. Deliberately NOT a chatbot: a fixed,
// small keyword table with one honest default, never an open-ended AI conversation.
const MISSION_KEYWORDS = [
  ['sales', /مبيع|طلبات|بيع/],
  ['campaign', /حمل[ةه]/],
  ['reactivate', /نشط|حساب|سوشال|متابع/],
  ['offer', /عرض|خصم/],
  ['launch', /اطلاق|إطلاق|أطلق|جديد/]
];
export function routeFreeText(text) {
  const t = typeof text === 'string' ? text.trim() : '';
  for (const [mission, pattern] of MISSION_KEYWORDS) if (pattern.test(t)) return mission;
  return 'sales';
}

const MISSION_LABELS = {
  sales: 'أبغى أزيد المبيعات',
  campaign: 'أبغى أسوي حملة لمنتج',
  reactivate: 'أبغى أنشط حساباتي',
  offer: 'عندي عرض وأبغى أسوق له',
  launch: 'أبغى أطلق منتج جديد'
};

// ---- DOM-driving layer (mirrors the existing Visual/Products module pattern) ---------------

const state = { opportunity: null, plan: null, products: [], selectedProductId: '', result: null, busy: false };

function renderRecommendation() {
  const o = state.opportunity;
  el('missionGoal').textContent = o.goal;
  el('missionAudience').textContent = o.audience || 'غير محدد بعد — أكمل بيانات العميل في هوية النشاط';
  el('missionOpportunity').textContent = o.opportunity || 'لا توجد أولوية أو موسم محدد حاليًا';
  el('missionOffer').textContent = o.offer || 'بدون عرض معروف حاليًا';
  el('missionRecommendationText').textContent = o.recommendation;
  const sel = el('missionProductSelect'), wrap = el('missionProductSelectWrap');
  wrap.classList.toggle('hidden', state.products.length === 0);
  sel.innerHTML = '<option value="">بدون منتج محدد</option>' + state.products.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
  sel.value = state.selectedProductId;
  el('missionProductName').textContent = o.product ? o.product.name : 'لا يوجد منتج محدد — أضف منتجًا من مكتبة المنتجات لتحسين الدقة';
}

function recomputeOpportunity() {
  const brain = getBrain();
  const product = state.products.find(p => p.id === state.selectedProductId) || null;
  state.opportunity = buildOpportunity(brain, product);
  renderRecommendation();
}

function changeProduct() {
  state.selectedProductId = el('missionProductSelect').value;
  recomputeOpportunity();
}

function renderPlan() {
  const p = state.plan;
  el('missionPlanGoal').textContent = p.goal;
  el('missionPlanAudience').textContent = p.audience;
  el('missionPlanIdea').textContent = p.creativeIdea;
  el('missionPlanMessage').textContent = p.keyMessage;
  el('missionPlanOffer').textContent = p.offer;
  el('missionPlanChannels').textContent = p.channels.join('، ');
  el('missionPlanDuration').value = p.duration;
}

function goToPlan() {
  state.plan = buildPlan(state.opportunity);
  renderPlan();
  el('missionStepRecommendation').classList.add('hidden');
  el('missionStepPlan').classList.remove('hidden');
}

function editPlan() {
  el('missionStepPlan').classList.add('hidden');
  el('missionStepRecommendation').classList.remove('hidden');
}

function savePlanEdits() {
  state.plan.duration = el('missionPlanDuration').value.trim() || DEFAULT_DURATION;
  renderPlan();
}

async function open() {
  const brain = getBrain();
  if (!brain) return setup();
  state.busy = false;
  try { state.products = await store.listProducts(); } catch { state.products = []; }
  state.selectedProductId = pickProduct(state.products)?.id || '';
  recomputeOpportunity();
  el('missionStepRecommendation').classList.remove('hidden');
  el('missionStepPlan').classList.add('hidden');
  show('missionSales');
}

function comingNext(missionKey) {
  el('missionComingNextLabel').textContent = MISSION_LABELS[missionKey] || '';
  show('missionComingNext');
}

function start(missionKey) {
  if (missionKey === 'sales') return open();
  return comingNext(missionKey);
}

function startFreeText() {
  const text = el('missionFreeText').value.trim();
  if (!text) { toast('اكتب هدفك أولًا'); return; }
  const missionKey = routeFreeText(text);
  el('missionFreeText').value = '';
  return start(missionKey);
}

// The thin transport wrapper the existing inline generate() can't be reused for directly — that
// function always drives the single-engine `output` screen (sets `current`/`lastText`, calls
// show('output')), which would corrupt the Mission's own screen/state. This calls the exact same
// unmodified /api/generate endpoint, with the exact same pilot-auth header and error contract;
// no engine prompt/logic is duplicated, only this small fetch/parse wrapper.
async function missionGenerateText(payload) {
  let brand = {};
  try { brand = await globalThis.Visual?.brandContext?.() || {}; } catch {}
  const body = { ...payload, brand };
  const r = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', ...globalThis.PilotAuth.headers() }, body: JSON.stringify(body) });
  const raw = await r.text();
  let j;
  try { j = JSON.parse(raw); } catch { throw new Error('تعذّر الاتصال بالخادم، جرّب مرة ثانية'); }
  if (r.status === 401) globalThis.PilotAuth.handleUnauthorized();
  if (!r.ok) throw new Error(j.error || 'تعذّر الاتصال');
  if (typeof j.text !== 'string' || !j.text.trim()) throw new Error('لم تصل نتيجة، جرّب مرة ثانية');
  return j.text;
}

function renderResult() {
  const r = state.result;
  el('missionCampaignOut').innerHTML = r.campaign ? md(r.campaign) : `<p class="status">${esc(r.errors.find(e => e.startsWith('خطة الحملة')) || 'تعذّر إنشاء خطة الحملة.')}</p>`;
  el('missionContentOut').innerHTML = r.content ? md(r.content) : `<p class="status">${esc(r.errors.find(e => e.startsWith('المحتوى')) || 'تعذّر إنشاء المحتوى.')}</p>`;
  if (r.visual && r.visual.rendered) {
    if (state.visualURL) URL.revokeObjectURL(state.visualURL);
    state.visualURL = URL.createObjectURL(r.visual.rendered);
    el('missionVisualOut').innerHTML = `<img class="visualPreview" alt="تصميم المهمة" src="${state.visualURL}">`;
  } else {
    el('missionVisualOut').innerHTML = `<p class="status">${state.opportunity.product ? 'تعذّر إنشاء تصميم بصري هذه المرة.' : 'لا تتوفر صورة منتج لإنشاء تصميم الآن — أضف منتجًا في مكتبة المنتجات.'}</p>`;
  }
  el('missionApproveStatus').textContent = '';
}

async function approvePlan() {
  if (state.busy) return;
  state.busy = true;
  el('missionApproveBtn').disabled = true;
  el('missionApproveStatus').textContent = 'جارٍ تجهيز حملتك…';
  const brain = getBrain();
  const product = state.products.find(p => p.id === state.selectedProductId) || null;
  let productMemory = null;
  try { productMemory = product ? await globalThis.Visual?.productContext?.(product.id) : null; } catch {}
  const result = { campaign: null, content: null, visual: null, errors: [] };
  try {
    result.campaign = await missionGenerateText({ brain, engine: 'campaign', inputs: { occasion: '', duration: state.plan.duration }, ...(productMemory ? { product: productMemory } : {}) });
  } catch (e) { result.errors.push('خطة الحملة: ' + e.message); }
  try {
    result.content = await missionGenerateText({ brain, engine: 'content', inputs: { period: '7 أيام', contentObjective: '', contentObjectiveCustom: '', contentAudience: state.opportunity.audience, contentChannels: '', contentChannelsCustom: '', contentTone: '', contentCTA: '', contentInstructions: product ? `ركّز على المنتج: ${product.name}` : '' }, ...(productMemory ? { product: productMemory } : {}) });
  } catch (e) { result.errors.push('المحتوى: ' + e.message); }
  if (product && product.image) {
    try {
      await globalThis.Visual.useProduct(product.id);
      await globalThis.Visual.generate();
      const rows = await store.listVisuals();
      result.visual = rows[0] || null;
    } catch (e) { result.errors.push('التصميم: ' + e.message); }
  }
  state.result = result;
  state.busy = false;
  el('missionApproveBtn').disabled = false;
  renderResult();
  show('missionResult');
}

// Reuses the exact existing history storage (shaghilHistory) rather than inventing new, separate
// persistence — the campaign text is saved exactly as a direct "سوّ حملة" result would be.
function approveCampaign() {
  if (!state.result?.campaign) return;
  let h = [];
  try { h = JSON.parse(localStorage.getItem('shaghilHistory')) || []; } catch {}
  if (!Array.isArray(h)) h = [];
  const brain = getBrain();
  h.unshift({ id: crypto.randomUUID(), engine: 'campaign', title: 'مهمة: ' + MISSION_LABELS.sales, project: brain?.name || '', text: state.result.campaign, inputs: null, ts: Date.now() });
  try { localStorage.setItem('shaghilHistory', JSON.stringify(h.slice(0, 30))); toast('تم حفظ الحملة في السجل'); }
  catch { toast('تعذّر الحفظ؛ مساحة المتصفح ممتلئة'); }
}

globalThis.Mission = {
  start, startFreeText, comingNext, open, changeProduct, goToPlan, editPlan, savePlanEdits, approvePlan, approveCampaign,
  labels: MISSION_LABELS
};
