import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
globalThis.indexedDB=indexedDB;
const old=await new Promise((resolve,reject)=>{const r=indexedDB.open('shaghil-visual-v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('brand');r.result.createObjectStore('visuals',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
await new Promise((resolve,reject)=>{const tx=old.transaction(['brand','visuals'],'readwrite');tx.objectStore('brand').put({style:'هوية V0.6',logo:new Blob(['original'])},'current');tx.objectStore('visuals').put({id:'legacy',ts:1,rendered:new Blob(['creative'])});tx.oncomplete=resolve;tx.onerror=reject});old.close();
const store=await import('../lib/visual-storage.mjs');assert.equal((await store.loadBrand()).style,'هوية V0.6');assert.equal(await (await store.loadVisual('legacy')).rendered.text(),'creative');assert.deepEqual(await store.listProducts(),[]);assert.deepEqual(await store.listPacks(),[]);console.log('PASS V0.7: V0.6 IndexedDB migration preserves original brand and visual Blobs');
