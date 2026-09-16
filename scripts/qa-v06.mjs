import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import OpenAI from 'openai';
import { indexedDB } from 'fake-indexeddb';
import { JSDOM } from 'jsdom';
import visualHandler,{normalizeVisual,makePrompt,FORMATS} from '../api/visual.mjs';
import * as storage from '../lib/visual-storage.mjs';

const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
const image={type:'image/png',base64:png};
const brain={name:'قهوة الاختبار',category:'قهوة',product:'قهوة مختصة',customer:'موظفون',location:'جدة',price:'50–100 SAR',tone:'سعودي طبيعي',objective:'زيادة الطلبات'};
const base={brain,brand:{primary:'#aa7733',secondary:'#111111',accent:'',style:'إضاءة طبيعية',logo:image,references:[]},task:{engine:'content',selected:'اليوم الأول: قهوة الصباح',context:'اليوم الأول: قهوة الصباح\nCTA: ابدأ يومك بقهوة'},settings:{format:'1:1',mode:'Product Hero',textMode:'none',headline:'قهوة الصباح',cta:'تواصل معنا'}};
const res=()=>({status(n){this.code=n;return this},json(body){this.body=body;return this},setHeader(){}});
const oldKey=process.env.OPENAI_API_KEY,generate=OpenAI.Images.prototype.generate,edit=OpenAI.Images.prototype.edit;
const calls=[];process.env.OPENAI_API_KEY='qa-image-placeholder';
OpenAI.Images.prototype.generate=async function(p){calls.push({kind:'generate',p,client:this._client});return {data:[{b64_json:'/9j/2Q=='}]}};
OpenAI.Images.prototype.edit=async function(p){calls.push({kind:'edit',p,client:this._client});return {data:[{b64_json:'/9j/2Q=='}]}};
try{
 for(const format of Object.keys(FORMATS))for(const mode of ['Product Hero','Lifestyle','Premium','Minimal','Campaign'])for(const textMode of ['none','simple','full']){
  const r=res(),body=structuredClone(base);body.settings={...body.settings,format,mode,textMode};body.previousDirection=2;
  await visualHandler({method:'POST',body},r);assert.equal(r.code,200);assert.notEqual(r.body.direction,2);
  const call=calls.at(-1);assert.equal(call.p.n,1);assert.equal(call.p.size,FORMATS[format]);assert.equal(call.p.quality,'medium');assert.equal(call.client.maxRetries,0);assert.equal(call.p.output_format,'jpeg');assert.ok(call.p.prompt.includes(brain.product));assert.ok(call.p.prompt.includes(body.brand.style));assert.ok(call.p.prompt.includes(body.task.selected));assert.ok(!call.p.prompt.includes(png));
 }
 for(const engine of ['offer','campaign']){const r=res();await visualHandler({method:'POST',body:{...base,task:{...base.task,engine}}},r);assert.equal(r.code,200)}
 const r=res();await visualHandler({method:'POST',body:{...base,brand:{...base.brand,references:[image]}}},r);assert.equal(r.code,200);assert.equal(calls.at(-1).kind,'edit');assert.equal(calls.at(-1).p.image.length,1);
 for(const mutate of [b=>b.task.engine='whatsapp',b=>b.task.selected='not in context',b=>b.settings.format='16:9',b=>b.settings.mode='evil',b=>b.settings.textMode='html',b=>b.brand.primary='invalid',b=>b.brain={},b=>b.brand.references=[image,image,image],b=>b.brand.logo={type:'image/svg+xml',base64:png},b=>b.brand.references=[{type:'image/png',base64:'AAAA'}],b=>b.previousDirection=99,b=>{b.settings.textMode='full';b.settings.headline=''}]){
  const body=structuredClone(base);mutate(body);const r=res(),before=calls.length;await visualHandler({method:'POST',body},r);assert.equal(r.code,400);assert.equal(calls.length,before);
 }
 const method=res();await visualHandler({method:'GET'},method);assert.equal(method.code,405);
 delete process.env.OPENAI_API_KEY;const missing=res();await visualHandler({method:'POST',body:base},missing);assert.equal(missing.code,503);
 process.env.OPENAI_API_KEY='qa-image-placeholder';let failures=0;OpenAI.Images.prototype.generate=async()=>{failures++;throw new Error('private upstream details')};const failed=res();await visualHandler({method:'POST',body:base},failed);assert.equal(failed.code,502);assert.equal(failures,1);assert.ok(!JSON.stringify(failed.body).includes('private'));
 const prompt=makePrompt(normalizeVisual(base),0);for(const policy of ['Never invent','No text','no exact','not proof'])assert.ok(prompt.toLowerCase().includes(policy.toLowerCase()));
}finally{OpenAI.Images.prototype.generate=generate;OpenAI.Images.prototype.edit=edit;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey}
console.log('PASS: 45 format/mode/text combinations; source engines, references, logo exclusion, server validation, one image, no retries, error handling');

globalThis.indexedDB=indexedDB;
const brand={...base.brand,logo:new Blob([Buffer.from(png,'base64')],{type:'image/png'}),references:[new Blob(['reference'],{type:'image/jpeg'})]};
await storage.saveBrand(brand);const restored=await storage.loadBrand();assert.equal(restored.style,brand.style);assert.equal(restored.primary,brand.primary);assert.equal(restored.logo.size,brand.logo.size);assert.equal(restored.references.length,1);
for(let i=0;i<12;i++)await storage.saveVisual({id:String(i),ts:i,background:brand.logo,rendered:brand.logo,task:base.task,settings:base.settings});
const records=await storage.listVisuals();assert.equal(records.length,10);assert.equal(records[0].id,'11');assert.equal(await storage.loadVisual('0'),undefined);assert.equal((await storage.loadVisual('11')).settings.format,'1:1');
console.log('PASS: IndexedDB brand metadata and Blob persistence; visual history retains metadata and prunes to ten');

// Run the actual browser controller in a DOM, mocking only raster composition and the network.
const html=fs.readFileSync('index.html','utf8');const dom=new JSDOM(html,{url:'http://localhost',runScripts:'outside-only'});
const ctx=dom.getInternalVMContext();const win=dom.window;
const objectURLs=new Map();let urlCounter=0;
win.URL.createObjectURL=blob=>{const url='blob:test-'+(++urlCounter);objectURLs.set(url,blob);return url};win.URL.revokeObjectURL=url=>objectURLs.delete(url);
win.structuredClone=structuredClone;win.store=storage;win.normalizeAsset=async f=>f;win.composeCalls=[];
win.composeVisual=async(background,brand,settings)=>{win.composeCalls.push({background,brand,settings});return new Blob(['composited'],{type:'image/png'})};
win.blobPayload=async b=>({type:b.type,base64:png});win.responseBlob=()=>brand.logo;
win.requests=[];let release;let delayed=false;
win.fetch=async(url,opts)=>{win.requests.push({url,body:JSON.parse(opts.body)});if(delayed)await new Promise(r=>release=r);return {ok:true,json:async()=>({base64:'/9j/2Q==',mime:'image/jpeg',direction:3,model:'mock-image'})}};
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
let controller=fs.readFileSync('lib/visual-studio.mjs','utf8').replace(/^import .*;\n/gm,'').replace('export function splitIdeas','function splitIdeas');vm.runInContext("(function(){"+controller+"})()",ctx);
const run=code=>vm.runInContext(code,ctx);
win.localStorage.setItem('brain',JSON.stringify(brain));await run('Visual.setupBrand()');assert.equal(win.document.getElementById('brandPrimary').value,brand.primary);
// Real save via the integrated setup preserves both sets of fields.
for(const [k,v]of Object.entries(brain))win.document.getElementById(k).value=v;
win.document.getElementById('brandStyle').value='أسلوب محفوظ جديد';await run('Visual.saveProject()');assert.equal((await storage.loadBrand()).style,'أسلوب محفوظ جديد');assert.deepEqual(JSON.parse(win.localStorage.getItem('brain')),brain);
run("current='content';lastInputs={period:'7 أيام'};renderResult("+JSON.stringify('## اليوم الأول\nقهوة الصباح\nCTA: تواصل معنا\n\n## اليوم الثاني\nقهوة المساء')+")");
assert.equal(win.document.getElementById('visualEntry').classList.contains('hidden'),false);
await run('Visual.choose()');assert.equal(win.document.getElementById('visualTextMode').value,'none');assert.ok(win.document.getElementById('visualIdea').options.length>=2);
win.document.getElementById('visualFormat').value='4:5';await run('Visual.generate()');assert.equal(win.requests.length,1);assert.deepEqual(win.requests[0].body.brain,brain);assert.equal(win.requests[0].body.brand.style,'أسلوب محفوظ جديد');assert.ok(win.requests[0].body.task.context.includes(win.requests[0].body.task.selected));assert.equal(win.requests[0].body.settings.format,'4:5');
const original=win.requests[0].body;await run("Visual.variant('different')");const variant=win.requests.at(-1).body;assert.deepEqual(variant.brain,original.brain);assert.deepEqual(variant.brand,original.brand);assert.deepEqual(variant.task,original.task);assert.deepEqual(variant.settings,original.settings);assert.equal(variant.previousDirection,3);
const count=win.requests.length;await run('Visual.noText()');run('Visual.editOverlay()');win.document.getElementById('editFormat').value='9:16';win.document.getElementById('editTextMode').value='simple';win.document.getElementById('editHeadline').value='قهوة الصباح';await run('Visual.applyOverlay()');assert.equal(win.requests.length,count);assert.equal(win.composeCalls.at(-1).settings.format,'9:16');
await run('Visual.history()');assert.ok(win.document.getElementById('visualHistoryList').children.length>0);run('Visual.back()');assert.ok(!win.document.getElementById('output').classList.contains('hidden'));
for(const engine of ['copy','whatsapp','reel']){run(`current='${engine}';Visual.resultEntry()`);assert.ok(win.document.getElementById('visualEntry').classList.contains('hidden'))}
run("current='offer'");await run('Visual.choose()');delayed=true;const inFlight=run('Visual.generate()');for(let i=0;i<10&&!release;i++)await new Promise(r=>setTimeout(r,0));const before=win.requests.length;await run('Visual.generate()');assert.equal(win.requests.length,before);run('home()');release();await inFlight;assert.ok(!win.document.getElementById('home').classList.contains('hidden'));delayed=false;
for(let i=0;i<win.localStorage.length;i++){const value=win.localStorage.getItem(win.localStorage.key(i));assert.ok(!value.includes(png));assert.ok(!value.includes('data:image'))}
for(const file of ['index.html','lib/visual-studio.mjs','lib/visual-storage.mjs','lib/visual-canvas.mjs'])assert.ok(!fs.readFileSync(file,'utf8').includes('OPENAI_API_KEY'));
const composite=win.composeVisual;win.composeVisual=async()=>{throw new Error('canvas unavailable')};run("current='offer'");await run('Visual.choose()');const paidCount=win.requests.length;await run('Visual.generate()');assert.equal(win.requests.length,paidCount+1);assert.ok(!win.document.getElementById('visualResult').classList.contains('hidden'));win.composeVisual=composite;
dom.window.close();
console.log('PASS: integrated Brand Brain save, context transfer, source selection, defaults, second-version retention, free overlays/resizing, history, duplicate-click guard, navigation races and client secret checks');

// Check the real compositor's draw geometry, opacity-preserving logo path and text bounds.
const drawCalls=[],textCalls=[];
const paint={fillStyle:'',font:'',drawImage(...a){drawCalls.push(a)},fillRect(){},measureText(t){return {width:t.length*parseInt(this.font.match(/(\d+)px/)?.[1]||'24')*0.6}},fillText(text,x,y){textCalls.push({text,x,y,font:this.font})}};
const savedDocument=globalThis.document,savedImage=globalThis.Image;
globalThis.document={createElement(){return {width:0,height:0,getContext:()=>paint,toBlob(fn,type){fn(new Blob(['canvas'],{type}))}}}};
globalThis.Image=class{constructor(){this.width=800;this.height=800}set src(value){this.width=drawCalls.length%2?240:800;this.height=drawCalls.length%2?120:800;queueMicrotask(()=>this.onload())}};
try{
 const {composeVisual,DIMENSIONS}=await import('../lib/visual-canvas.mjs');
 for(const format of Object.keys(DIMENSIONS))for(const textMode of ['none','simple','full']){
  drawCalls.length=0;textCalls.length=0;
  const settings={format,textMode,headline:'قهوتك على ذوقك مع لحظة هدوء في صباح يومك '.repeat(3).slice(0,120),cta:'تواصل معنا'};
  const blob=await composeVisual(brand.logo,brand,settings);assert.equal(blob.type,'image/png');assert.equal(drawCalls.length,2);
  const logo=drawCalls[1];assert.equal(logo[3]/logo[4],2);assert.ok(logo[1]>0&&logo[2]>0);
  if(textMode==='none')assert.equal(textCalls.length,0);
  for(const line of textCalls)assert.ok(line.y+parseInt(line.font.match(/(\d+)px/)[1])<DIMENSIONS[format][1]);
 }
}finally{globalThis.document=savedDocument;globalThis.Image=savedImage}
console.log('PASS: real compositor geometry for 3 ratios × 3 text modes; logo aspect ratio, safe margins and long-text bounds');
