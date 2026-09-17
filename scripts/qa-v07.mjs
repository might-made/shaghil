import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {indexedDB} from 'fake-indexeddb';
import * as store from '../lib/visual-storage.mjs';
globalThis.indexedDB=indexedDB;
const asset=new Blob(['original pixels'],{type:'image/png'});
for(let i=0;i<2;i++)await store.saveProduct({id:'product-'+i,name:'منتج '+i,description:'سفر العائلة',fidelity:'exact',image:asset,reference:asset});
const products=await store.listProducts();assert.equal(products.length,2);assert.equal(await products[0].image.text(),'original pixels');assert.equal(products[0].fidelity,'exact');
const html=fs.readFileSync('index.html','utf8'),dom=new JSDOM(html,{url:'http://localhost',runScripts:'outside-only'}),win=dom.window,ctx=dom.getInternalVMContext();
win.store=store;win.structuredClone=structuredClone;win.URL.createObjectURL=()=> 'blob:qa';win.URL.revokeObjectURL=()=>{};
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
const controller=fs.readFileSync('lib/visual-studio.mjs','utf8').replace(/^import .*;\n/gm,'').replace('export function splitIdeas','function splitIdeas');vm.runInContext('(function(){'+controller+'})()',ctx);
const brain={name:'نجوب',product:'منظم سفر',customer:'العائلة'};win.localStorage.setItem('brain',JSON.stringify(brain));
const plan='# خطة نجوب\n\n## اليوم الأول\nالمنصة: Instagram\nالفكرة: رحلة الأسرة\n\n## اليوم الثاني\nالهدف: الوعي\nالفكرة: ترتيب الحقيبة\n\n## اليوم الثالث\nالمنصة: Instagram\nالفكرة: منظم سفر العائلة';
vm.runInContext("current='content';renderResult("+JSON.stringify(plan)+")",ctx);
assert.equal(win.document.querySelectorAll('#contentCards article').length,3);
await win.document.querySelectorAll('#contentCards button')[2].onclick();assert.ok(win.document.getElementById('visualSource').textContent.startsWith('## اليوم الثالث'));
assert.equal(win.document.getElementById('productFidelity').value,'exact');assert.ok(![...Array(win.localStorage.length)].some((_,i)=>win.localStorage.getItem(win.localStorage.key(i)).includes('original pixels')));
console.log('PASS V0.7 M1: multiple product Blobs, default exact fidelity, Content cards and direct Day 3 handoff');

// The controller must retain the original Blob but omit it from an Exact request.
win.blobPayload=async b=>({type:'image/png',base64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='});
const requests=[],compositions=[];
win.composeVisual=async(bg,brand,settings,product)=>{compositions.push({bg,brand,settings,product});return new Blob(['rendered'],{type:'image/png'})};win.responseBlob=()=>new Blob(['scene'],{type:'image/jpeg'});
win.fetch=async(url,opts)=>{requests.push(JSON.parse(opts.body));return {ok:true,json:async()=>({base64:'mock',mime:'image/jpeg',direction:1,model:'mock'})}};
win.document.getElementById('visualProduct').value='product-0';win.Visual.selectProduct();await win.Visual.generate();
assert.equal(requests.length,1);assert.equal(requests[0].product.fidelity,'exact');assert.equal(requests[0].product.image,undefined);assert.equal(requests[0].brand.references.length,0);
assert.equal(await compositions[0].product.image.text(),'original pixels');assert.equal(await compositions[0].bg.text(),'scene');
win.Visual.editOverlay();win.document.getElementById('editProductSize').value='large';win.document.getElementById('editProductPosition').value='left';win.document.getElementById('editProductVertical').value='bottom';win.document.getElementById('editLogoVisible').value='off';await win.Visual.applyOverlay();assert.equal(requests.length,1);assert.equal(compositions.at(-1).settings.productSize,'large');assert.equal(compositions.at(-1).settings.productPosition,'left');assert.equal(compositions.at(-1).settings.logoVisible,false);
await win.Visual.choose();win.document.getElementById('visualProduct').value='product-0';win.Visual.selectProduct();win.document.getElementById('visualFidelity').value='creative';await win.Visual.generate();assert.ok(requests.at(-1).product.image);
const {normalizeVisual,makePrompt}=await import('../api/visual.mjs');
const exact=normalizeVisual(requests[0]);assert.equal(exact.images.length,0);assert.ok(makePrompt(exact,0).includes('ONLY an empty scene/background'));const creative=normalizeVisual(requests.at(-1));assert.equal(creative.images.length,1+requests.at(-1).brand.references.length);
assert.throws(()=>normalizeVisual({...requests[0],product:{...requests[0].product,fidelity:'invented'}}));
// Exercise the real compositor and prove the original asset is the drawn source.
const saved={document:globalThis.document,Image:globalThis.Image,create:URL.createObjectURL,revoke:URL.revokeObjectURL};const blobs=new Map(),draws=[];let serial=0;
URL.createObjectURL=b=>{const id='blob:qa-'+(++serial);blobs.set(id,b);return id};URL.revokeObjectURL=()=>{};
globalThis.Image=class{set src(url){this.blob=blobs.get(url);this.width=400;this.height=200;queueMicrotask(()=>this.onload())}};
const paint={drawImage(...args){draws.push(args)},fillRect(){},measureText(t){return {width:t.length*18}},fillText(){}};
globalThis.document={createElement:()=>({getContext:()=>paint,toBlob:fn=>fn(new Blob(['canvas']))})};
try{const {composeVisual}=await import('../lib/visual-canvas.mjs');const background=new Blob(['scene']),logo=new Blob(['logo']);
 for(const format of ['1:1','4:5','9:16'])for(const size of ['small','medium','large'])for(const position of ['left','center','right']){
  draws.length=0;await composeVisual(background,{logo},{format,textMode:'none',productSize:size,productPosition:position},{image:asset,fidelity:'exact'});assert.equal(draws.length,3);assert.equal(draws[1][0].blob,asset);assert.equal(draws[2][0].blob,logo);assert.equal(draws[1][3]/draws[1][4],2);assert.ok(draws[1][1]>=0&&draws[1][1]+draws[1][3]<=1080);
 }
 draws.length=0;await composeVisual(background,{logo},{format:'1:1',textMode:'none',logoVisible:false},{image:asset,fidelity:'creative'});assert.equal(draws.length,1);
}finally{globalThis.document=saved.document;globalThis.Image=saved.Image;URL.createObjectURL=saved.create;URL.revokeObjectURL=saved.revoke}
console.log('PASS V0.7 M2: original product pixels and logo composed locally; separate scene; size/position without requests; creative reference forwarding; exact excludes raster inputs');


// Every explicit paid action has one request; all editor controls reuse pixels.
await win.Visual.choose();win.document.getElementById('visualProduct').value='product-0';win.Visual.selectProduct();await win.Visual.generate();
const editCount=requests.length;win.Visual.editOverlay();
for(const [id,value]of Object.entries({editHeadline:'رحلتك مرتبة',editCTA:'اكتشف نجوب',editTextMode:'full',editLogoPosition:'bottom-left',editTextPosition:'top',editProductSize:'small',editProductPosition:'right',editFormat:'4:5'}))win.document.getElementById(id).value=value;
await win.Visual.applyOverlay();assert.equal(requests.length,editCount);assert.equal(compositions.at(-1).settings.logoPosition,'bottom-left');assert.equal(compositions.at(-1).settings.textPosition,'top');
for(const action of ['background','selected','recompose','different']){
 win.document.getElementById('variationMode').value='Editorial';win.document.getElementById('recomposeFormat').value='9:16';const before=requests.length;await win.Visual.variant(action);assert.equal(requests.length,before+1);assert.equal(requests.at(-1).product.name,'منتج 0');assert.equal(requests.at(-1).settings.headline,'رحلتك مرتبة');assert.ok(requests.at(-1).task.selected);assert.equal(compositions.at(-1).product.image.size,asset.size);
}
for(const mode of ['Product Hero','Lifestyle','Performance Ad','Minimal Premium','Editorial']){win.document.getElementById('variationMode').value=mode;const before=requests.length;await win.Visual.variant('selected');assert.equal(requests.length,before+1);assert.equal(normalizeVisual(requests.at(-1)).settings.mode,mode)}
let release;const immediateFetch=win.fetch;win.fetch=async(...args)=>{await new Promise(r=>release=r);return immediateFetch(...args)};const pending=win.Visual.variant('background');for(let i=0;i<10&&!release;i++)await new Promise(r=>setTimeout(r,0));const before=requests.length;await win.Visual.variant('recompose');release();await pending;assert.equal(requests.length,before+1);win.fetch=immediateFetch;
await win.Visual.history();assert.ok(win.document.querySelectorAll('#visualHistoryList button').length);
console.log('PASS V0.7 M3: free copy/CTA/logo/product/text/format edits; one request per background/variation/recompose; retained context and duplicate protection');


const {exportPack,safeName}=await import('../lib/campaign-export.mjs');win.exportPack=exportPack;
const packController=fs.readFileSync('lib/campaign-packs.mjs','utf8').replace(/^import .*;\n/gm,'');vm.runInContext('(function(){'+packController+'})()',ctx);
const savedRecord=(await store.listVisuals())[0];await win.Packs.prepare(savedRecord);win.document.getElementById('packName').value='سفر العائلة';win.document.getElementById('packCaption').value='كل شيء في مكانه';win.document.getElementById('packCTA').value='اكتشف المنتج';
const packCalls=requests.length;await win.Packs.add(savedRecord);const pack=(await store.listPacks())[0];assert.equal(pack.entries.length,1);assert.equal(pack.entries[0].caption,'كل شيء في مكانه');assert.equal(await pack.entries[0].record.product.image.text(),'original pixels');
for(let i=0;i<12;i++)await store.saveVisual({...savedRecord,id:'later-'+i,ts:Date.now()+i});assert.equal((await store.listVisuals()).length,10);assert.equal((await store.listPacks())[0].entries[0].record.id,savedRecord.id);
await win.Packs.render();assert.ok(win.document.querySelector('#campaignPacks h3').textContent.includes('سفر العائلة'));win.document.querySelector('#campaignPacks .historyItem button').click();assert.equal(win.document.getElementById('visualResult').classList.contains('hidden'),false);
const bundle=await exportPack(pack);assert.ok(bundle.name.includes('سفر-العائلة'));assert.equal(requests.length,packCalls);assert.equal(safeName('../../evil/<script>'),'evil-script');
// Verify ZIP interoperability and CRC with Python's independent standard reader.
const {mkdtempSync,writeFileSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {execFileSync}=await import('node:child_process');const dir=mkdtempSync(join(tmpdir(),'shaghil-zip-'));
try{const archive=join(dir,'pack.zip');writeFileSync(archive,Buffer.from(await bundle.blob.arrayBuffer()));execFileSync('python3',['-c',"import zipfile,sys,json; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; names=z.namelist(); assert len(names)==3; assert all('..' not in n for n in names); m=json.loads(z.read(next(n for n in names if n.endswith('manifest.json')))); assert m['campaign']=='سفر العائلة'; assert m['entries'][0]['fidelity']=='exact'; assert 'كل شيء في مكانه' in z.read(next(n for n in names if n.endswith('-copy.txt'))).decode()",archive])}finally{rmSync(dir,{recursive:true,force:true})}
for(const file of ['index.html',...fs.readdirSync('lib').filter(f=>f.endsWith('.mjs')).map(f=>'lib/'+f)])assert.ok(!fs.readFileSync(file,'utf8').includes('OPENAI_API_KEY'));
assert.equal(requests.length,packCalls);console.log('PASS V0.7 M4: approved pack snapshots survive history pruning; reopening; UTF-8 ZIP images/copy/manifest; independent CRC check; zero API calls; no browser credentials');
await win.Packs.prepare(savedRecord);dom.window.close();
