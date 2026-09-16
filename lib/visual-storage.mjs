// Blob storage is local to this browser and origin; no base64 assets in localStorage.
let connection;
export function openStore() {
  if (!connection) connection = new Promise((resolve, reject) => {
    const request = indexedDB.open('shaghil-visual-v1', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('brand');
      request.result.createObjectStore('visuals', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
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
