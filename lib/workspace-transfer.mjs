import * as store from './visual-storage.mjs';
const el = id => document.getElementById(id);
function status(text) { const p = el('workspaceStatus'); if (p) p.textContent = text }

// Different Preview URLs are different browser origins, so localStorage/IndexedDB never
// share data between them (a browser platform rule, not something this app can change).
// This module lets a Founder move a whole local workspace — Business Brain, Brand Brain,
// Product Library, saved visuals, campaign packs and result history — from one origin to
// another as a single downloaded/uploaded file, without re-entering anything by hand.

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer); let binary = ''; const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}
function base64ToBlob(base64, type) {
  const binary = atob(base64), bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}
async function serialize(value) {
  if (value instanceof Blob) return { __blob: true, type: value.type, data: bufferToBase64(await value.arrayBuffer()) };
  if (Array.isArray(value)) return Promise.all(value.map(serialize));
  if (value && typeof value === 'object') { const out = {}; for (const [k, v] of Object.entries(value)) out[k] = await serialize(v); return out }
  return value;
}
function deserialize(value) {
  if (value && typeof value === 'object' && value.__blob) return base64ToBlob(value.data, value.type);
  if (Array.isArray(value)) return value.map(deserialize);
  if (value && typeof value === 'object') { const out = {}; for (const [k, v] of Object.entries(value)) out[k] = deserialize(v); return out }
  return value;
}
function readLocalRaw(key) { try { return JSON.parse(localStorage.getItem(key)) } catch { return null } }

export async function buildBundle() {
  const [brand, products, visuals, packs] = await Promise.all([
    store.loadBrand().catch(() => null), store.listProducts().catch(() => []),
    store.listVisuals().catch(() => []), store.listPacks().catch(() => [])
  ]);
  return {
    shaghilWorkspace: 1, exportedAt: Date.now(),
    localStorage: { brain: readLocalRaw('brain'), shaghilHistory: readLocalRaw('shaghilHistory') || [] },
    brand: brand ? await serialize(brand) : null,
    products: await serialize(products || []),
    visuals: await serialize(visuals || []),
    packs: await serialize(packs || [])
  };
}

async function exportWorkspace() {
  status('جارٍ تجهيز ملف التصدير…');
  try {
    const bundle = await buildBundle();
    const blob = new Blob([JSON.stringify(bundle)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (bundle.localStorage.brain?.name || 'shaghil').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'shaghil';
    a.href = url; a.download = `shaghil-workspace-${slug}-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status('تم تنزيل الملف. افتح الرابط الجديد واستورد هذا الملف من نفس الشاشة.');
  } catch (e) { status('تعذّر تجهيز ملف التصدير: ' + e.message) }
}

const historyKey = x => x.id || [x.engine, x.ts, (x.text || '').slice(0, 40)].join('|');

export async function importWorkspace(bundle, { overwriteBrain } = {}) {
  if (!bundle || bundle.shaghilWorkspace !== 1) throw new Error('ملف غير صالح لشغّل');
  const summary = { brainImported: false, historyAdded: 0, productsAdded: 0, productsSkipped: 0, visualsAdded: 0, packsAdded: 0, packsSkipped: 0 };
  if (bundle.localStorage?.brain && (overwriteBrain || !localStorage.getItem('brain'))) {
    try { localStorage.setItem('brain', JSON.stringify(bundle.localStorage.brain)); summary.brainImported = true } catch {}
  }
  if (Array.isArray(bundle.localStorage?.shaghilHistory)) {
    const existing = Array.isArray(readLocalRaw('shaghilHistory')) ? readLocalRaw('shaghilHistory') : [];
    const seen = new Set(existing.map(historyKey));
    const additions = bundle.localStorage.shaghilHistory.filter(x => x && typeof x.text === 'string' && !seen.has(historyKey(x)));
    if (additions.length) { try { localStorage.setItem('shaghilHistory', JSON.stringify([...existing, ...additions].slice(0, 30))); summary.historyAdded = additions.length } catch {} }
  }
  if (bundle.brand) { try { await store.saveBrand(deserialize(bundle.brand)) } catch {} }
  for (const p of bundle.products || []) { try { await store.saveProduct(deserialize(p)); summary.productsAdded++ } catch { summary.productsSkipped++ } }
  for (const v of bundle.visuals || []) { try { await store.saveVisual(deserialize(v)); summary.visualsAdded++ } catch {} }
  for (const pk of bundle.packs || []) { try { await store.savePack(deserialize(pk)); summary.packsAdded++ } catch { summary.packsSkipped++ } }
  return summary;
}

function summaryText(s) {
  const parts = [];
  parts.push(s.brainImported ? 'Business Brain مستورد' : 'Business Brain لم يتغيّر');
  parts.push(`${s.productsAdded} منتج مستورد` + (s.productsSkipped ? ` (تعذّر استيراد ${s.productsSkipped})` : ''));
  parts.push(`${s.visualsAdded} تصميم`, `${s.packsAdded} حزمة` + (s.packsSkipped ? ` (تعذّر ${s.packsSkipped})` : ''), `${s.historyAdded} نتيجة جديدة في السجل`);
  return 'تم الاستيراد: ' + parts.join(' · ');
}

async function importFromFile(file) {
  if (!file) return;
  status('جارٍ قراءة الملف…');
  try {
    const bundle = JSON.parse(await file.text());
    const overwriteBrain = !localStorage.getItem('brain') || confirm('يوجد Business Brain محفوظ على هذا الرابط بالفعل. استبداله ببيانات الملف المستورد؟');
    const summary = await importWorkspace(bundle, { overwriteBrain });
    status(summaryText(summary));
    globalThis.Products?.refresh();
    if (el('brain') && !el('brain').classList.contains('hidden')) globalThis.brainScreen?.();
  } catch (e) { status('تعذّر الاستيراد: ' + (e.message || 'ملف غير صالح')) }
  finally { if (el('workspaceImportFile')) el('workspaceImportFile').value = '' }
}

globalThis.Workspace = { export: exportWorkspace, import: importFromFile, buildBundle, importWorkspace };
