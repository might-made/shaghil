// Blob storage is local to this browser and origin; no base64 assets in localStorage.
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
export const loadBrand = () => transact('brand', 'readonly', s => s.get('current'));
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

export const listProducts = () => transact('products','readonly',s=>s.getAll());
export const deleteProduct = id => transact('products','readwrite',s=>s.delete(id));
export async function saveProduct(product){
  if(!product.id||!product.name?.trim()||!product.image||product.image.size>8*1024*1024||!['exact','creative'].includes(product.fidelity))throw new Error('راجع اسم المنتج وصورته');
  const db=await openStore();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('products','readwrite'),s=tx.objectStore('products'),r=s.getAllKeys();
    r.onsuccess=()=>{if(r.result.length>=12&&!r.result.includes(product.id)){tx.abort();return} s.put(product)};
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
