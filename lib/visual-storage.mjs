// Blob storage is local to this browser and origin; no base64 assets in localStorage.
// Visual mode values stay in English end-to-end (select value, settings.mode, the /api/visual
// whitelist and prompt) so the API contract and existing saved records never change; this map
// only supplies the Arabic label wherever a raw mode string would otherwise reach the screen.
const MODE_LABELS={'Product Hero':'إبراز المنتج','Lifestyle':'أسلوب حياة',Premium:'مميز',Minimal:'بسيط',Campaign:'حملة','Performance Ad':'إعلان أداء','Minimal Premium':'بساطة فاخرة',Editorial:'أسلوب تحريري'};
export const modeLabel=mode=>MODE_LABELS[mode]||mode;
let connection;
export function openStore() {
  if (!connection) connection = new Promise((resolve, reject) => {
    const request = indexedDB.open('shaghil-visual-v1', 3);
    request.onupgradeneeded = () => {
      if(!request.result.objectStoreNames.contains('brand'))request.result.createObjectStore('brand');
      if(!request.result.objectStoreNames.contains('visuals'))request.result.createObjectStore('visuals', { keyPath: 'id' });
      if(!request.result.objectStoreNames.contains('packs'))request.result.createObjectStore('packs', { keyPath: 'id' });
      if(!request.result.objectStoreNames.contains('products'))request.result.createObjectStore('products', { keyPath: 'id' });
    };
    request.onsuccess = () => {request.result.onversionchange=()=>{request.result.close();connection=null};resolve(request.result)};
    request.onerror = () => { connection = null; reject(request.error); };
    request.onblocked = () => { connection = null; reject(new Error('أغلق تبويبات شغّل الأخرى وحاول مرة ثانية')); };
  });
  return connection;
}
async function transact(store, mode, action) {
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = action(tx.objectStore(store));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('تعذّر الحفظ'));
  });
}
// V4 Batch 3: Brand Intelligence fields (strategy/voice/visual-preference), storage-schema only.
// Safe empty defaults (strings '', arrays []); no UI reads/writes these yet, no engine receives
// them, and brand.style/brain.tone are untouched (that reconciliation is a later batch).
const BRAND_V4_DEFAULTS = {
  positioning: '', valueProposition: '', differentiators: [], brandPromise: '', personality: '', toneOfVoice: '',
  doList: [], dontList: [], preferredVocabulary: [], prohibitedVocabulary: [],
  visualDirectionNotes: '', visualDo: [], visualDont: []
};
// V4 Batch 1/3: lazy, idempotent schema-version + field stamp. Returns `undefined` unchanged
// when no brand has ever been saved (callers rely on that falsy value to mean "nothing saved
// yet" — e.g. the Brand Brain summary prompt — so an empty record is never invented here).
// Each field is checked independently (not gated on schemaVersion alone) so a record already
// migrated by an earlier batch still picks up fields a later batch adds, exactly once. A fresh
// [] is created per field per call (never a reference into BRAND_V4_DEFAULTS), so array
// defaults are never shared across records. No existing value is altered, renamed or removed.
export async function loadBrand() {
  const record = await transact('brand', 'readonly', s => s.get('current'));
  if (!record) return record;
  let changed = false;
  const stamped = { ...record };
  if (stamped.schemaVersion !== 1) { stamped.schemaVersion = 1; changed = true }
  for (const key in BRAND_V4_DEFAULTS) {
    if (!(key in stamped)) { stamped[key] = Array.isArray(BRAND_V4_DEFAULTS[key]) ? [] : BRAND_V4_DEFAULTS[key]; changed = true }
  }
  // V4 Batch 4: one-time, idempotent voice SSOT seed. Precedence is purely structural (current
  // emptiness), exactly as specified — not a separate "already migrated" flag: once toneOfVoice
  // is non-empty for any reason, this branch naturally never fires again. brand.style itself is
  // never modified here, only read.
  if (!stamped.toneOfVoice && stamped.style) { stamped.toneOfVoice = stamped.style; changed = true }
  if (changed) { try { await saveBrand(stamped) } catch {} }
  return stamped;
}
export const saveBrand = brand => transact('brand', 'readwrite', s => s.put(brand, 'current'));
export const loadVisual = id => transact('visuals', 'readonly', s => s.get(id));
export async function listVisuals() {
  const rows = await transact('visuals', 'readonly', s => s.getAll());
  return rows.sort((a,b) => b.ts-a.ts);
}
export async function saveVisual(record) {
  const db = await openStore();
  return new Promise((resolve,reject) => {
    const tx = db.transaction('visuals','readwrite');
    const store = tx.objectStore('visuals');
    store.put(record);
    const request = store.getAll();
    request.onsuccess = () => request.result.sort((a,b)=>b.ts-a.ts).slice(10).forEach(row=>store.delete(row.id));
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
}

// V4 Batch 7: approved Product Memory fields beyond the existing id/name/description/fidelity/
// image/reference — schema/persistence only, no engine or Visual wiring reads any of these yet.
// Safe empty defaults (strings '', arrays []), same lazy/idempotent/additive pattern as
// BRAND_V4_DEFAULTS above: each field is checked independently so a product already migrated by
// an earlier read still picks up anything a later batch adds, and a fresh [] is created per
// field per product so array defaults are never shared by reference across products.
const PRODUCT_V4_DEFAULTS = {
  category: '', price: '', specifications: [], features: [], benefits: [], useCases: [], audienceRelevance: '', offers: []
};
// `offers` is P0 lightweight durable product/bundle/offer information only — never a workflow
// (no validity dates, inventory, history or performance/campaign state). Capped at the storage
// write boundary (here, inside saveProduct below) so no caller — the product form, a future
// Product Memory UI, or workspace import — can ever persist more than this approved boundary.
function capOffers(offers){
  return Array.isArray(offers) ? offers.filter(o=>typeof o==='string'&&o.trim()).slice(0,5).map(o=>o.trim().slice(0,150)) : [];
}
// Lazy, idempotent, additive migration — identical pattern to loadBrand() above, applied per
// record since products are a collection rather than a single current-record key. Every existing
// field/value (including the stable id) is preserved untouched; only missing new fields are
// stamped with their safe default, and only once per product.
export async function listProducts(){
  const products = await transact('products','readonly',s=>s.getAll());
  const result=[];
  for(const product of products){
    let changed=false;
    const stamped={...product};
    if(stamped.schemaVersion!==1){stamped.schemaVersion=1;changed=true}
    for(const key in PRODUCT_V4_DEFAULTS){
      if(!(key in stamped)){stamped[key]=Array.isArray(PRODUCT_V4_DEFAULTS[key])?[]:PRODUCT_V4_DEFAULTS[key];changed=true}
    }
    if(changed){try{await saveProduct(stamped)}catch{}}
    result.push(stamped);
  }
  return result;
}
export const deleteProduct = id => transact('products','readwrite',s=>s.delete(id));
export async function saveProduct(product){
  if(!product.id||!product.name?.trim()||!product.image||product.image.size>8*1024*1024||!['exact','creative'].includes(product.fidelity))throw new Error('راجع اسم المنتج وصورته');
  const toSave=Object.hasOwn(product,'offers')?{...product,offers:capOffers(product.offers)}:product;
  const db=await openStore();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('products','readwrite'),s=tx.objectStore('products'),r=s.getAllKeys();
    r.onsuccess=()=>{if(r.result.length>=12&&!r.result.includes(toSave.id)){tx.abort();return} s.put(toSave)};
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(new Error('تعذّر الحفظ؛ الحد الأقصى 12 منتجًا أو مساحة المتصفح ممتلئة'));
  });
}

export const listPacks = () => transact('packs','readonly',s=>s.getAll());
export const deletePack = id => transact('packs','readwrite',s=>s.delete(id));
export async function savePack(pack){
  if(!pack.id||!pack.name?.trim()||!Array.isArray(pack.entries)||pack.entries.length>12)throw new Error('الحد الأقصى 12 تصميمًا للحزمة');
  const db=await openStore();return new Promise((resolve,reject)=>{
    const tx=db.transaction('packs','readwrite'),s=tx.objectStore('packs'),r=s.getAllKeys();
    r.onsuccess=()=>{if(r.result.length>=6&&!r.result.includes(pack.id)){tx.abort();return}s.put(pack)};
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(new Error('تعذّر الحفظ؛ الحد الأقصى 6 حزم أو مساحة المتصفح ممتلئة'));
  });
}
