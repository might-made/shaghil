import './product-library.mjs';
import * as store from './visual-storage.mjs';
import { normalizeAsset, composeVisual, blobPayload, responseBlob } from './visual-canvas.mjs';
const el=id=>document.getElementById(id);
const DEFAULT={primary:'#e7f95b',secondary:'#181b1f',accent:'',style:'',logo:null,references:[]};
let brandDraft=null,brandBusy=false,uploadBusy=false,visualBusy=false,active=null,source=null,ideas=[],previewURL=null;
let brandURLs=[],products=[];
function status(id,message){el(id).textContent=message}
function isScreen(id){return !el(id).classList.contains('hidden')}
function lock(value){visualBusy=value;el('visualGenerate').disabled=value;el('visualActions').querySelectorAll('button').forEach(b=>b.disabled=value)}
function previewAssets(){
  brandURLs.forEach(URL.revokeObjectURL);brandURLs=[];
  for(const [id,assets] of [['brandLogoPreview',brandDraft.logo?[brandDraft.logo]:[]],['brandRefsPreview',brandDraft.references]]){
    el(id).replaceChildren();
    assets.forEach(blob=>{const image=document.createElement('img');image.className='assetThumb';image.alt=id==='brandLogoPreview'?'الشعار المحفوظ':'صورة مرجعية';image.src=URL.createObjectURL(blob);brandURLs.push(image.src);el(id).appendChild(image)});
  }
}
async function setupBrand(){
  if(brandBusy)return;
  globalThis.Products?.refresh();
  brandBusy=true;el('saveProjectBtn').disabled=true;status('brandStatus','جارٍ تحميل الهوية المحفوظة…');
  try{
    brandDraft={...DEFAULT,...await store.loadBrand()};
    for(const key of ['primary','secondary','accent','style'])el('brand'+key[0].toUpperCase()+key.slice(1)).value=brandDraft[key];
    el('brandLogo').value='';el('brandRefs').value='';previewAssets();status('brandStatus','PNG / JPEG / WebP، حتى 8MB لكل ملف. تحفظ التغييرات عند «حفظ والبدء».');
  }catch{brandDraft=null;status('brandStatus','تعذّر فتح تخزين الهوية في المتصفح. بيانات Business Brain تظل متاحة؛ جرّب متصفحًا يسمح بالتخزين.')}
  finally{brandBusy=false;el('saveProjectBtn').disabled=false}
}
async function upload(files,logo){
  if(!brandDraft||brandBusy||uploadBusy)return;
  if(!files.length)return;
  uploadBusy=true;el('saveProjectBtn').disabled=true;
  try{
    if(files.length>2&&!logo)throw new Error('اختر صورتين كحد أقصى');
    const blobs=await Promise.all(files.map(f=>normalizeAsset(f,logo)));
    if(logo)brandDraft.logo=blobs[0];else brandDraft.references=blobs;
    previewAssets();status('brandStatus','الصور جاهزة. اضغط حفظ والبدء لحفظ الهوية.');
  }catch(e){status('brandStatus',e.message)}
  finally{uploadBusy=false;el('saveProjectBtn').disabled=false;el(logo?'brandLogo':'brandRefs').value=''}
}
async function saveProject(){
  if(brandBusy||uploadBusy)return;
  if(!['name','product','customer'].every(id=>el(id).value.trim()))return toast('أكمل اسم المشروع والمنتج والعميل');
  if(!brandDraft){saveBrain();return toast('حُفظ المشروع؛ لم تُحفظ الهوية لأن تخزين الصور غير متاح')}
  const next={...brandDraft};
  for(const key of ['primary','secondary','accent','style'])next[key]=el('brand'+key[0].toUpperCase()+key.slice(1)).value.trim();
  if(next.accent&&!/^#[0-9a-f]{6}$/i.test(next.accent))return status('brandStatus','اكتب اللون الإضافي بصيغة #FFFFFF أو اتركه فارغًا');
  brandBusy=true;el('saveProjectBtn').disabled=true;
  try{await store.saveBrand(next);brandDraft=next;saveBrain()}
  catch{status('brandStatus','تعذّر حفظ الهوية. قد تكون مساحة المتصفح ممتلئة؛ لم نحذف الهوية السابقة.')}
  finally{brandBusy=false;el('saveProjectBtn').disabled=false}
}
async function brandSummary(){try{const b=await store.loadBrand();status('brandSummary',b?`Brand Brain: ${b.logo?'شعار محفوظ · ':''}${b.references.length} صور مرجعية · ${b.primary} · ${b.style||'أسلوب تلقائي'}`:'أضف ألوانك وشعارك من تعديل ← Brand Brain')}catch{status('brandSummary','تخزين الهوية غير متاح في هذا المتصفح')}}
function resultEntry(){el('visualEntry').classList.toggle('hidden',!['content','campaign','offer'].includes(current)||!lastText);renderCards()}
function renderCards(){
  const list=el('contentCards');if(!list)return;list.replaceChildren();list.classList.add('hidden');el('out').classList.remove('hidden');
  const items=current==='content'?splitIdeas(lastText):[];
  if(items.length<2)return;
  list.classList.remove('hidden');el('out').classList.add('hidden');
  for(const item of items){
    const card=document.createElement('article');card.className='card ideaCard';
    const title=document.createElement('h3');title.textContent=plain(item.split('\n')[0]).slice(0,140);
    card.append(title);
    for(const line of item.split('\n').slice(1).filter(s=>s.trim()).slice(0,6)){const p=document.createElement('p');p.textContent=plain(line).slice(0,240);card.append(p)}
    const action=document.createElement('button');action.className='btn primary';action.textContent='اصنع التصميم';action.onclick=()=>choose(item);
    const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='تفاصيل';const full=document.createElement('div');full.textContent=item;details.append(summary,full);card.append(action,details);list.append(card);
  }
}
function hideEntry(){el('visualEntry').classList.add('hidden');el('contentCards')?.classList.add('hidden');el('out').classList.remove('hidden')}
export function splitIdeas(text){
  // Prefer whole days/items over the plan title or nested fields. Preserve exact
  // source substrings for server validation and the original plan for returning.
  const lines=[...text.matchAll(/^.*$/gm)];
  const day=/^(?:اليوم|يوم|day)\s*(?:[:：-]\s*)?(?:[\d٠-٩۰-۹]+|الأول|الاول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي عشر|الثاني عشر|first|second|third)(?=\s|[:：.،|)–—-]|$)/i;
  const clean=line=>line.trim().replace(/^\|\s*/, '').replace(/^#{1,6}\s*/, '').replace(/^(?:[-+*]|[\d٠-٩۰-۹]+[.)-])\s+/, '').replace(/[*_`]/g,'').trim();
  const days=lines.filter(line=>day.test(clean(line[0])));
  if(days.length){
    return days.map((line,i)=>text.slice(line.index,line[0].trim().startsWith('|')?line.index+line[0].length:days[i+1]?.index??text.length).trim()).filter(s=>s.length<=12000).slice(0,100);
  }
  // Numbered ideas without day labels are another common content-plan format.
  const numbered=lines.filter(line=>/^(?:#{1,6}\s*)?(?:\*\*)?[\d٠-٩۰-۹]+[.)]\s+/.test(line[0].trim()));
  if(numbered.length>1)return numbered.map((line,i)=>text.slice(line.index,numbered[i+1]?.index??text.length).trim()).filter(s=>s.length<=12000).slice(0,100);
  const headings=lines.filter(line=>/^#{1,6}\s/.test(line[0]));
  for(let depth=1;depth<=6;depth++){
    const items=headings.filter(line=>line[0].match(/^#+/)[0].length===depth);
    if(items.length>1)return items.map((line,i)=>text.slice(line.index,items[i+1]?.index??text.length).trim()).filter(s=>s.length<=12000).slice(0,100);
  }
  let parts=text.split(/(?=^#{1,3}\s)/m).map(s=>s.trim()).filter(Boolean);
  if(parts.length<2)parts=text.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
  return parts.filter(s=>s.length>15&&s.length<=12000).slice(0,100);
}
function plain(text){return text.replace(/[#*_`]/g,'').trim()}
function autoCopy(){
  const selected=source.task.selected;
  const labelled=selected.match(/(?:hook|عنوان|الهوك|العنوان|النص الأساسي|core_message|promo_line)\s*[:：]\s*([^\n]+)/i);
  const cta=selected.match(/(?:cta|دعوة لاتخاذ إجراء)\s*[:：]\s*([^\n]+)/i);
  el('visualHeadline').value=plain(labelled?.[1]||selected.split('\n').find(s=>s.trim())||'').slice(0,120);
  el('visualCTA').value=plain(cta?.[1]||'').slice(0,60);
}
async function choose(chosen){
  if(busy||!lastText||!['content','campaign','offer'].includes(current))return;
  if(visualBusy)return toast('يوجد تصميم قيد الإنشاء؛ انتظر اكتماله');
  const selection=typeof chosen==='string'?chosen:window.getSelection()?.toString().trim();
  const task={engine:current,context:lastText,selected:''};
  source={task,inputs:lastInputs?{...lastInputs}:null,brain:structuredClone(getBrain()),brand:null};
  ideas=splitIdeas(lastText);
  if(selection&&lastText.includes(selection)&&selection.length<=12000)ideas.unshift(selection);
  if(!ideas.length)ideas=[lastText.slice(0,12000)];
  el('visualIdea').replaceChildren(...ideas.map((idea,i)=>new Option(plain(idea).slice(0,100),String(i))));
  selectIdea();el('visualFormat').value='1:1';el('visualMode').value=current==='campaign'?'Campaign':'Product Hero';el('visualTextMode').value='none';textControls();
  show('visualStudio');status('visualStatus','');el('visualGenerate').disabled=true;
  try{source.brand={...DEFAULT,...await store.loadBrand()};products=await store.listProducts();el('visualProduct').replaceChildren(new Option('بدون منتج محدد',''),...products.map(p=>new Option(p.name,p.id)));selectProduct();status('studioBrand',`${source.brain.name} · ${source.brand.logo?'الشعار محفوظ':'بدون شعار'} · ${source.brand.references.length} صور مرجعية · ${source.brand.primary} / ${source.brand.secondary}`)}
  catch{source=null;status('visualStatus','تعذّر تحميل الهوية. افتح Business Brain وراجع تخزين المتصفح.')}
  finally{el('visualGenerate').disabled=false}
}
function selectProduct(){const product=products.find(p=>p.id===el('visualProduct').value);if(source)source.product=product?structuredClone(product):null;el('visualFidelity').value=product?.fidelity||'exact';el('visualFidelity').disabled=!product}
function selectIdea(){if(!source)return;source.task.selected=ideas[Number(el('visualIdea').value)]||ideas[0];el('visualSource').textContent=source.task.selected;autoCopy()}
function textControls(){el('visualTextFields').classList.toggle('hidden',el('visualTextMode').value==='none')}
function settings(prefix='visual'){return {format:el(prefix+'Format').value,mode:prefix==='visual'?el('visualMode').value:active.settings.mode,textMode:el(prefix+'TextMode').value,headline:el(prefix+'Headline').value.trim(),cta:el(prefix+'CTA').value.trim(),productSize:el(prefix+'ProductSize').value,productPosition:el(prefix+'ProductPosition').value,productVertical:el(prefix+'ProductVertical').value,logoVisible:el(prefix+'LogoVisible').value!=='off'}}
function validateSettings(s){if(s.textMode!=='none'&&!s.headline)throw new Error('راجع النص المعتمد قبل المتابعة')}
async function payload(snapshot){return {brain:snapshot.brain,brand:{...snapshot.brand,logo:snapshot.brand.logo?await blobPayload(snapshot.brand.logo):null,references:snapshot.product?.fidelity==='exact'?[]:await Promise.all(snapshot.brand.references.map(blobPayload))},product:snapshot.product?{name:snapshot.product.name,description:snapshot.product.description,fidelity:snapshot.product.fidelity,...(snapshot.product.fidelity==='creative'?{image:await blobPayload(snapshot.product.reference)}:{})}:null,task:snapshot.task,settings:snapshot.settings,previousDirection:snapshot.previousDirection??-1}}
async function generate(){
  if(visualBusy||!source?.brand)return;
  const s=settings();
  try{validateSettings(s)}catch(e){return status('visualStatus',e.message)}
  const snapshot=structuredClone(source);if(snapshot.product)snapshot.product.fidelity=el('visualFidelity').value;return requestVisual({...snapshot,settings:s});
}
async function requestVisual(snapshot){
  if(visualBusy)return;
  lock(true);const origin=isScreen('visualStudio')?'visualStudio':'visualResult';
  const statusId=origin==='visualStudio'?'visualStatus':'visualResultStatus';status(statusId,'جارٍ إنشاء صورة واحدة… قد يستغرق ذلك بضع دقائق.');
  try{
    const body=await payload(snapshot);
    const response=await fetch('/api/visual',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'تعذّر إنشاء الصورة');
    const background=responseBlob(result);
    // Retain the raw generation so failed overlays can be edited without another paid request.
    const record={...snapshot,id:crypto.randomUUID(),ts:Date.now(),background,rendered:null,direction:result.direction,model:result.model};
    try{record.rendered=await composeVisual(background,record.brand,record.settings,record.product)}catch(e){record.settings={...record.settings,textMode:'none'};try{record.rendered=await composeVisual(background,record.brand,record.settings,record.product);toast(e.message+' — حُفظت نسخة بدون نص')}catch{record.rendered=background;record.overlayWarning='حُفظت الخلفية فقط؛ تعذّر تركيب المنتج أو الشعار أو النص. لا تعتبرها تصميمًا مكتملًا؛ أعد التعديل بدون توليد جديد.'}}
    let saved=true;try{await store.saveVisual(record)}catch{saved=false}
    active=record;
    if(isScreen(origin)){display(record);status('visualResultStatus',(record.overlayWarning||'')+(saved?'حُفظ التصميم على هذا المتصفح.':'الصورة جاهزة؛ تعذّر حفظها في السجل. حمّلها الآن.'))}
    else toast(saved?'تصميمك جاهز في السجل':'تصميمك جاهز؛ افتح السجل لتحميله قبل إغلاق الصفحة');
  }catch(e){status(statusId,e.message||'تعذّر الاتصال. لا توجد إعادة محاولة تلقائية.')}
  finally{lock(false)}
}
function display(record){
  active=record;if(previewURL)URL.revokeObjectURL(previewURL);previewURL=URL.createObjectURL(record.rendered);
  el('visualImage').src=previewURL;el('visualMeta').textContent=`${record.settings.format} · ${record.settings.mode} · ${record.settings.textMode==='none'?'بدون نص':record.settings.textMode==='simple'?'نص بسيط':'إعلان كامل'}`;
  el('overlayEditor').classList.add('hidden');status('visualResultStatus',record.overlayWarning||'');show('visualResult');
}
async function variant(kind){
  if(visualBusy||!active)return;
  const s={...active.settings};if(kind==='premium')s.mode='Premium';if(kind==='minimal')s.mode='Minimal';
  await requestVisual({product:active.product?structuredClone(active.product):null,brain:structuredClone(active.brain),brand:structuredClone(active.brand),task:{...active.task},inputs:active.inputs,settings:s,previousDirection:active.direction});
}
function back(){if(!active&&!source)return home();const origin=isScreen('visualStudio')?source:active||source;current=origin.task.engine;lastInputs=origin.inputs;renderResult(origin.task.context,false)}
function download(){if(!active?.rendered||visualBusy)return;const link=document.createElement('a');const url=URL.createObjectURL(active.rendered);link.href=url;link.download=`shaghil-${active.settings.format.replace(':','x')}-${active.id}.${active.rendered.type==='image/jpeg'?'jpg':'png'}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function editOverlay(){if(!active||visualBusy)return;for(const [key,id]of [['format','editFormat'],['textMode','editTextMode'],['headline','editHeadline'],['cta','editCTA']])el(id).value=active.settings[key];for(const [key,fallback] of [['productSize','medium'],['productPosition','center'],['productVertical','middle']])el('edit'+key[0].toUpperCase()+key.slice(1)).value=active.settings[key]||fallback;el('editLogoVisible').value=active.settings.logoVisible===false?'off':'on';el('overlayEditor').classList.remove('hidden')}
async function updateOverlay(s){
  if(visualBusy||!active)return;
  lock(true);
  try{validateSettings(s);const record={...active,overlayWarning:'',settings:s,rendered:await composeVisual(active.background,active.brand,s,active.product)};let saved=true;try{await store.saveVisual(record)}catch{saved=false}display(record);status('visualResultStatus',saved?'تم التعديل محليًا بدون تكلفة توليد جديدة.':'تم التعديل؛ تعذّر الحفظ. حمّل التصميم الآن.')}
  catch(e){status('visualResultStatus',e.message)}finally{lock(false)}
}
async function history(){
  const list=el('visualHistoryList');list.textContent='جارٍ تحميل التصاميم…';
  try{
    let rows=await store.listVisuals();if(active&&!rows.some(r=>r.id===active.id))rows.unshift(active);
    list.replaceChildren();if(!rows.length){list.textContent='لا توجد تصاميم محفوظة بعد.';return}
    rows.forEach(record=>{const button=document.createElement('button');button.className='historyItem btn full';button.textContent=`${titles[record.task.engine]} · ${record.settings.format} · ${record.settings.mode} · ${plain(record.task.selected).slice(0,90)}`;button.onclick=()=>{if(visualBusy)return toast('انتظر اكتمال التصميم الحالي');display(record)};list.appendChild(button)});
  }catch{list.textContent='تعذّر فتح سجل التصاميم.';if(active){const button=document.createElement('button');button.className='btn';button.textContent='افتح التصميم الحالي لتحميله';button.onclick=()=>display(active);list.appendChild(button)}}
}
globalThis.Visual={setupBrand,saveProject,brandSummary,uploadLogo:file=>upload(file?[file]:[],true),uploadReferences:files=>upload(Array.from(files),false),removeLogo(){if(brandDraft&&!uploadBusy){brandDraft.logo=null;previewAssets()}},removeReferences(){if(brandDraft&&!uploadBusy){brandDraft.references=[];previewAssets()}},resultEntry,hideEntry,choose,selectIdea,selectProduct,textControls,generate,variant,back,download,editOverlay,applyOverlay:()=>updateOverlay(settings('edit')),noText:()=>active&&updateOverlay({...active.settings,textMode:'none'}),history};
if(isScreen('setup'))setupBrand();resultEntry();
