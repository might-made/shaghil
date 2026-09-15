import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import OpenAI from 'openai';
import handler, { normalizeRequest } from '../api/generate.mjs';
import health from '../api/health.mjs';

const brain = {name:'Brew 27',category:'قهوة',product:'قهوة وحلويات',customer:'موظفون',location:'جدة',price:'50–100 SAR',tone:'سعودي طبيعي',objective:'رجوع العملاء'};
const cases = {content:{period:'30 يوم'},copy:{channel:'SMS',instruction:''},offer:{constraint:''},whatsapp:{message:'كم السعر؟'},campaign:{occasion:'',duration:'7 أيام'},reel:{duration:'45 ثانية',topic:''}};
const response = () => ({headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(body){this.body=body;return this}});
const originalCreate = OpenAI.Responses.prototype.create;
const originalKey = process.env.OPENAI_API_KEY;
const calls=[];
process.env.OPENAI_API_KEY='qa-placeholder';
OpenAI.Responses.prototype.create=async function(payload){calls.push(payload);return {output_text:'## نتيجة\nنص تجريبي'}};
try {
  for (const [engine,inputs] of Object.entries(cases)) {
    const res=response();
    await handler({method:'POST',body:{brain,engine,inputs:{...inputs,product:'IGNORED',objective:'IGNORED'}}},res);
    assert.equal(res.code,200,engine);
    assert.equal(res.headers['Cache-Control'],'no-store');
    const request=calls.at(-1);
    assert.equal(request.store,false);
    for(const value of Object.values(brain)) assert.ok(request.input.includes(value));
    assert.ok(!request.input.includes('IGNORED'));
    assert.ok(request.instructions.includes('single source of truth'));
    assert.ok(request.instructions.includes('Never invent discounts'));
  }
  for(const engine of ['copy','offer','reel','content']) assert.doesNotThrow(()=>normalizeRequest({brain,engine,inputs:{}}));
  for(const type of ['shorter','stronger','saudi','premium']) {
    const res=response();await handler({method:'POST',body:{brain,engine:'copy',inputs:cases.copy,refinement:type,previous:'السابق'}},res);
    assert.equal(res.code,200);assert.ok(calls.at(-1).input.includes('السابق'));
  }
  for(const body of [
    {brain,engine:'whatsapp',inputs:{message:'  '}}, {brain,engine:'campaign',inputs:{duration:''}},
    {brain,engine:'toString'}, {brain,engine:'copy',refinement:'toString'}, {brain:{},engine:'offer'},
    {brain,engine:'reel',inputs:{duration:'90 ثانية'}}, {brain,engine:'content',inputs:{period:'99 يوم'}},
    {brain,engine:'copy',inputs:{channel:'unknown'}}, {brain,engine:'offer',refinement:'shorter'}
  ]) {const res=response();await handler({method:'POST',body},res);assert.equal(res.code,400)}
  const method=response();await handler({method:'GET'},method);assert.equal(method.code,405);
  OpenAI.Responses.prototype.create=async()=>({output_text:''});
  const empty=response();await handler({method:'POST',body:{brain,engine:'offer'}},empty);assert.equal(empty.code,500);assert.ok(!empty.body.detail);
  const h=response();health({},h);assert.equal(h.body.version,'0.5.0');
} finally {OpenAI.Responses.prototype.create=originalCreate;if(originalKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=originalKey}
console.log('PASS: six server engines, authoritative context, optional defaults, validation, refinements, empty output and health');

// Exercise the real inline application script with a minimal DOM and mocked transport.
const html=fs.readFileSync('index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const storage=new Map();const requests=[];let copied='';let pending;
function app(){
  const nodes=new Map();
  function node(id){return {id,value:'',textContent:'',hidden:false,classList:{toggle(_,hidden){nodes.get(id).hidden=hidden}},focus(){},remove(){},set innerHTML(value){this.html=value;if(id==='engineForm'){for(const key of ['period','channel','instruction','constraint','message','occasion','duration','topic'])nodes.delete(key);for(const match of value.matchAll(/<(input|textarea|select)\b[^>]*id="([^"]+)"[^>]*>/g)){const n=node(match[2]);n.value=match[0].match(/value="([^"]*)"/)?.[1]||'';if(match[1]==='select')n.value=value.slice(match.index).match(/<option>([^<]+)/)?.[1]||'';nodes.set(match[2],n)}}},get innerHTML(){return this.html||''}}}
  for(const match of html.matchAll(/id="([^"]+)"/g))nodes.set(match[1],node(match[1]));
  const context=vm.createContext({document:{getElementById:id=>nodes.get(id),createElement:()=>node('toast'),body:{appendChild(){}}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},navigator:{clipboard:{writeText:async text=>{copied=text}}},setTimeout(){},fetch:async(url,options)=>{const payload=JSON.parse(options.body);requests.push(payload);if(pending)return pending;return {ok:true,json:async()=>({text:`## ${payload.engine}\nنتيجة قابلة للنسخ`})}}});
  vm.runInContext(script,context);
  return {context,nodes,run:code=>vm.runInContext(code,context)};
}
let ui=app();ui.run('setup()');
for(const [k,v]of Object.entries(brain))ui.nodes.get(k).value=v;
ui.run('saveBrain()');assert.equal(ui.nodes.get('home').hidden,false);assert.deepEqual(JSON.parse(storage.get('brain')),brain);
ui=app();assert.equal(ui.nodes.get('home').hidden,false);
for(const [engine,inputs]of Object.entries(cases)){
  ui.run(`openEngine('${engine}')`);
  const expected=Object.keys(inputs);
  const form=ui.nodes.get('engineForm').innerHTML;
  assert.equal([...form.matchAll(/<(?:input|textarea|select)\b/g)].length,expected.length);
  for(const [k,v]of Object.entries(inputs))ui.nodes.get(k).value=v;
  await ui.run('run()');assert.equal(ui.nodes.get('output').hidden,false);
  assert.deepEqual(requests.at(-1).brain,brain);assert.deepEqual(requests.at(-1).inputs,inputs);
  await ui.run('copyOut()');assert.ok(copied.includes(engine));
  for(const type of ['shorter','stronger','saudi','premium']){await ui.run(`refine('${type}')`);assert.equal(requests.at(-1).refinement,type);assert.ok(requests.at(-1).previous)}
  await ui.run('run(true)');assert.deepEqual(requests.at(-1).inputs,inputs);
  ui.run('home()');assert.equal(ui.nodes.get('home').hidden,false);
}
ui.run("openEngine('whatsapp')");const count=requests.length;ui.nodes.get('message').value='   ';await ui.run('run()');assert.equal(requests.length,count);
ui.run('historyScreen();openHistory(0)');await ui.run('run(true)');assert.equal(requests.at(-1).engine,'reel');assert.deepEqual(requests.at(-1).inputs,cases.reel);
assert.equal(JSON.parse(storage.get('shaghilHistory')).length,10);
// Older saved results still refine, but ask for fresh task details for a new version.
storage.set('shaghilHistory',JSON.stringify([{engine:'whatsapp',text:'رد قديم',ts:0}]));ui.run('openHistory(0)');await ui.run("refine('shorter')");assert.equal(requests.at(-1).engine,'whatsapp');
ui.run('openHistory(1)');const oldCount=requests.length;await ui.run('run(true)');assert.equal(requests.length,oldCount);assert.equal(ui.nodes.get('engine').hidden,false);
// A response arriving after navigation must not replace the new screen.
let resolve;pending=new Promise(r=>{resolve=r});ui.run("openEngine('offer')");const running=ui.run('run()');const inFlight=requests.length;await ui.run('run()');assert.equal(requests.length,inFlight);ui.run('home()');resolve({ok:true,json:async()=>({text:'late'})});await running;pending=null;assert.equal(ui.nodes.get('home').hidden,false);
storage.set('brain','{broken');ui=app();assert.equal(ui.nodes.get('welcome').hidden,false);
storage.set('brain',JSON.stringify({...brain,name:'<img src=x onerror=alert(1)>'}));ui.run('brainScreen()');assert.ok(!ui.nodes.get('brainGrid').innerHTML.includes('<img'));
console.log('PASS: save → reload → all six engines → generate → copy → refinements → second version → home; history restoration, legacy history, duplicate requests, navigation races, malformed storage and escaped Brain');
