import * as store from './visual-storage.mjs';
// The import control is reachable from more than one screen (the empty Business Brain form
// and the Business Brain summary), so status updates every status line rather than one id.
function status(text) { document.querySelectorAll('.workspaceStatus').forEach(p => p.textContent = text) }

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

// Some browser storage modes (most notably Safari Private Browsing — a documented WebKit
// limitation, not a SHAGHIL defect: Blobs cannot be reliably stored in IndexedDB there, while
// plain localStorage writes for Business Brain/History still succeed) reject a Blob-containing
// IndexedDB write outright. Detect that class of failure so the import summary can tell the
// user exactly what happened instead of silently discarding their products/designs.
function isStorageBlocked(e) {
  const name = e?.name || '';
  const message = e?.message || '';
  return name === 'QuotaExceededError' || message.includes('مساحة المتصفح') || /quota/i.test(message);
}

export async function importWorkspace(bundle, { overwriteBrain } = {}) {
  if (!bundle || bundle.shaghilWorkspace !== 1) throw new Error('ملف غير صالح لشغّل');
  const summary = { brainImported: false, historyAdded: 0, brandImported: false, brandSkipped: false, productsAdded: 0, productsSkipped: 0, visualsAdded: 0, visualsSkipped: 0, packsAdded: 0, packsSkipped: 0, storageBlocked: false };
  if (bundle.localStorage?.brain && (overwriteBrain || !localStorage.getItem('brain'))) {
    try { localStorage.setItem('brain', JSON.stringify(bundle.localStorage.brain)); summary.brainImported = true } catch {}
  }
  if (Array.isArray(bundle.localStorage?.shaghilHistory)) {
    const existing = Array.isArray(readLocalRaw('shaghilHistory')) ? readLocalRaw('shaghilHistory') : [];
    const seen = new Set(existing.map(historyKey));
    const additions = bundle.localStorage.shaghilHistory.filter(x => x && typeof x.text === 'string' && !seen.has(historyKey(x)));
    if (additions.length) { try { localStorage.setItem('shaghilHistory', JSON.stringify([...existing, ...additions].slice(0, 30))); summary.historyAdded = additions.length } catch {} }
  }
  if (bundle.brand) {
    try { await store.saveBrand(deserialize(bundle.brand)); summary.brandImported = true }
    catch (e) { summary.brandSkipped = true; if (isStorageBlocked(e)) summary.storageBlocked = true }
  }
  for (const p of bundle.products || []) {
    try { await store.saveProduct(deserialize(p)); summary.productsAdded++ }
    catch (e) { summary.productsSkipped++; if (isStorageBlocked(e)) summary.storageBlocked = true }
  }
  for (const v of bundle.visuals || []) {
    try { await store.saveVisual(deserialize(v)); summary.visualsAdded++ }
    catch (e) { summary.visualsSkipped++; if (isStorageBlocked(e)) summary.storageBlocked = true }
  }
  for (const pk of bundle.packs || []) {
    try { await store.savePack(deserialize(pk)); summary.packsAdded++ }
    catch (e) { summary.packsSkipped++; if (isStorageBlocked(e)) summary.storageBlocked = true }
  }
  return summary;
}

function summaryText(s) {
  const parts = [];
  parts.push(s.brainImported ? 'هوية النشاط مستوردة' : 'هوية النشاط لم تتغيّر');
  if (s.brandImported || s.brandSkipped) parts.push(s.brandImported ? 'هوية العلامة مستوردة' : 'تعذّر استيراد هوية العلامة');
  parts.push(`${s.productsAdded} منتج مستورد` + (s.productsSkipped ? ` (تعذّر استيراد ${s.productsSkipped})` : ''));
  parts.push(`${s.visualsAdded} تصميم` + (s.visualsSkipped ? ` (تعذّر استيراد ${s.visualsSkipped})` : ''), `${s.packsAdded} حزمة` + (s.packsSkipped ? ` (تعذّر ${s.packsSkipped})` : ''), `${s.historyAdded} نتيجة جديدة في السجل`);
  let text = 'تم الاستيراد: ' + parts.join(' · ');
  if (s.storageBlocked) text += ' — تعذّر حفظ صور المنتجات أو التصاميم في هذا المتصفح؛ إذا كنت في وضع التصفح الخاص (Private/Incognito)، افتح نافذة عادية واستورد الملف نفسه من جديد لاستعادة الصور كاملة.';
  return text;
}

async function importFromFile(file) {
  if (!file) return;
  status('جارٍ قراءة الملف…');
  try {
    const bundle = JSON.parse(await file.text());
    const overwriteBrain = !localStorage.getItem('brain') || confirm('يوجد هوية نشاط محفوظة على هذا الرابط بالفعل. استبدالها ببيانات الملف المستورد؟');
    const summary = await importWorkspace(bundle, { overwriteBrain });
    status(summaryText(summary));
    globalThis.Products?.refresh();
    // Whichever screen the Founder imported from, a restored Business Brain means Home
    // (with the six engines and the restored data) is now the right place to land.
    if (localStorage.getItem('brain')) globalThis.home?.();
  } catch (e) { status('تعذّر الاستيراد: ' + (e.message || 'ملف غير صالح')) }
  finally { for (const input of document.querySelectorAll('input[type="file"][accept="application/json"]')) input.value = '' }
}

globalThis.Workspace = { export: exportWorkspace, import: importFromFile, buildBundle, importWorkspace };
