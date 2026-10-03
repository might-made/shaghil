import './campaign-packs.mjs';
import './product-library.mjs';
import './workspace-transfer.mjs';
import * as store from './visual-storage.mjs';
import { normalizeAsset, composeVisual, blobPayload, responseBlob } from './visual-canvas.mjs';
const el=id=>document.getElementById(id);
const DEFAULT={primary:'#e7f95b',secondary:'#181b1f',accent:'',style:'',toneOfVoice:'',logo:null,references:[]};
let brandDraft=null,brandBusy=false,uploadBusy=false,visualBusy=false,active=null,source=null,ideas=[],previewURL=null;
let brandURLs=[],products=[];
function status(id,message){el(id).textContent=message}
function isScreen(id){return !el(id).classList.contains('hidden')}
function lock(value){visualBusy=value;globalThis.Packs?.setGenerationBusy(value);el('visualGenerate').disabled=value;document.querySelectorAll('#visualActions button, #aiActions button').forEach(b=>b.disabled=value);document.querySelectorAll('.visualSpin').forEach(s=>s.classList.toggle('hidden',!value))}
function previewAssets(){
  brandURLs.forEach(URL.revokeObjectURL);brandURLs=[];
  for(const [id,assets] of [['brandLogoPreview',brandDraft.logo?[brandDraft.logo]:[]],['brandRefsPreview',brandDraft.references]]){
    el(id).replaceChildren();
    assets.forEach(blob=>{const image=document.createElement('img');image.className='assetThumb';image.alt=id==='brandLogoPreview'?'الشعار المحفوظ':'صورة مرجعية';image.src=URL.createObjectURL(blob);brandURLs.push(image.src);el(id).appendChild(image)});
  }
}
// V4 Batch 4: the brain.tone -> toneOfVoice suggestion is shown only when both toneOfVoice and
// style are empty (nothing already governs voice) and a Business Brain tone exists. It only ever
// fills the textarea for the founder to review/edit; nothing is written to storage until the
// existing explicit "save and start" action runs — brain.tone is never silently persisted.
function updateToneSuggestion(){
  const tone=getBrain()?.tone?.trim();
  const show=Boolean(tone)&&!el('brandToneOfVoice').value.trim()&&!el('brandStyle').value.trim();
  el('toneSuggestion').classList.toggle('hidden',!show);
  if(show)el('toneSuggestion').innerHTML=`اقتراح من هوية النشاط: «${esc(tone)}» — <button type="button" class="btn" onclick="Visual.useToneSuggestion()">استخدم هذا الاقتراح</button>`;
}
function useToneSuggestion(){const tone=getBrain()?.tone?.trim();if(tone)el('brandToneOfVoice').value=tone;updateToneSuggestion()}
async function setupBrand(){
  if(brandBusy)return;
  globalThis.Products?.refresh();
  brandBusy=true;el('saveProjectBtn').disabled=true;status('brandStatus','جارٍ تحميل الهوية المحفوظة…');
  try{
    brandDraft={...DEFAULT,...await store.loadBrand()};
    for(const key of ['primary','secondary','accent','style','toneOfVoice'])el('brand'+key[0].toUpperCase()+key.slice(1)).value=brandDraft[key];
    el('brandLogo').value='';el('brandRefs').value='';previewAssets();updateToneSuggestion();status('brandStatus','PNG / JPEG / WebP، حتى 8MB لكل ملف. تحفظ التغييرات عند «حفظ والبدء».');
  }catch{brandDraft=null;status('brandStatus','تعذّر فتح تخزين الهوية في المتصفح. بيانات هوية النشاط تظل متاحة؛ جرّب متصفحًا يسمح بالتخزين.')}
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
  for(const key of ['primary','secondary','accent','style','toneOfVoice'])next[key]=el('brand'+key[0].toUpperCase()+key.slice(1)).value.trim();
  if(next.accent&&!/^#[0-9a-f]{6}$/i.test(next.accent))return status('brandStatus','اكتب اللون الإضافي بصيغة #FFFFFF أو اتركه فارغًا');
  brandBusy=true;el('saveProjectBtn').disabled=true;
  try{await store.saveBrand(next);brandDraft=next;saveBrain()}
  catch{status('brandStatus','تعذّر حفظ الهوية. قد تكون مساحة المتصفح ممتلئة؛ لم نحذف الهوية السابقة.')}
  finally{brandBusy=false;el('saveProjectBtn').disabled=false}
}
async function brandSummary(){try{const b=await store.loadBrand();status('brandSummary',b?`هوية العلامة: ${b.logo?'شعار محفوظ · ':''}${b.references.length} صور مرجعية · ${b.primary} · ${b.style||'أسلوب تلقائي'}`:'أضف ألوانك وشعارك من تعديل ← هوية العلامة')}catch{status('brandSummary','تخزين الهوية غير متاح في هذا المتصفح')}}
// Bridges the saved Brand Brain active voice into the text engines (/api/generate), which have
// no module import of their own into visual-storage.mjs. Read-only and best-effort: if storage is
// unavailable, generation must still proceed without brand context rather than fail or invent it.
// V4 Batch 4: toneOfVoice is the sole active voice source once populated; brand.style no longer
// competes with it (brain.tone was never read here — it is retired server-side, see api/generate.mjs).
// The style fallback only matters for the brief pre-migration instant before loadBrand() seeds
// toneOfVoice from style — from then on both hold the same value, so behavior is unchanged.
async function brandStyle(){try{const b=await store.loadBrand();const active=typeof b?.toneOfVoice==='string'&&b.toneOfVoice.trim()?b.toneOfVoice:(typeof b?.style==='string'?b.style:'');return active.trim().slice(0,4000)}catch{return ''}}
// V4 Batch 6: bridges the full set of text-engine-authorized Brand Preferences (not just the
// active voice string brandStyle() returns) into index.html's cached brand context for
// /api/generate. Returns only populated fields — api/generate.mjs independently re-validates and
// caps everything regardless of what's sent here, exactly like every other field in this app.
// Read-only and best-effort: if storage is unavailable, generation must still proceed without
// brand context rather than fail or invent it.
async function brandContext(){
  try{
    const b=await store.loadBrand();
    if(!b)return{};
    const active=typeof b.toneOfVoice==='string'&&b.toneOfVoice.trim()?b.toneOfVoice:(typeof b.style==='string'?b.style:'');
    const out={};
    if(active.trim())out.toneOfVoice=active.trim().slice(0,4000);
    for(const key of ['positioning','valueProposition','personality'])if(typeof b[key]==='string'&&b[key].trim())out[key]=b[key].trim();
    for(const key of ['differentiators','doList','dontList','preferredVocabulary','prohibitedVocabulary'])if(Array.isArray(b[key])&&b[key].length)out[key]=b[key];
    return out;
  }catch{return{}}
}
function resultEntry(){const multiCard=renderCards();el('visualEntry').classList.toggle('hidden',!['content','campaign','offer'].includes(current)||!lastText||multiCard)}
function itemSummary(item){
  const lines=item.split('\n').map(plain).map(s=>s.replace(/^[-+]\s*/,'')).filter(Boolean),summary=[];
  for(const [label,pattern]of [['المنصة',/^(?:المنصة|platform)\s*[:：]?\s*(.*)$/i],['الهدف',/^(?:الهدف|objective)\s*[:：]?\s*(.*)$/i],['الشكل',/^(?:الشكل|الصيغة|نوع المحتوى|format)\s*[:：]?\s*(.*)$/i],['العنوان',/^(?:الهوك|العنوان|hook|title)\s*[:：]?\s*(.*)$/i],['الفكرة',/^(?:الفكرة|فكرة|concept|core_message)\s*[:：]?\s*(.*)$/i]]){
    const index=lines.findIndex(line=>pattern.test(line));if(index<0)continue;const value=lines[index].match(pattern)[1]||lines[index+1]||'';if(value)summary.push(label+': '+value.slice(0,200));
  }
  return summary.length?summary:lines.slice(1,5).map(s=>s.slice(0,200));
}
function renderCards(){
  const list=el('contentCards');if(!list)return false;list.replaceChildren();list.classList.add('hidden');el('out').classList.remove('hidden');
  const items=['content','campaign'].includes(current)?splitIdeas(lastText):[];
  if(items.length<2)return false;
  list.classList.remove('hidden');el('out').classList.add('hidden');
  if(current==='campaign'){
    // splitIdeas() returns only the day/item chunks; any strategic overview/summary the
    // model wrote before the first chunk would otherwise be silently dropped from card view.
    // Show it in full (never truncated) so no generated content is lost.
    const firstIndex=lastText.indexOf(items[0]);
    const overview=firstIndex>0?lastText.slice(0,firstIndex).trim():'';
    if(overview){
      const intro=document.createElement('article');intro.className='card campaignOverview';
      const h=document.createElement('h3');h.textContent='نظرة عامة على الحملة';intro.append(h);
      const body=document.createElement('div');body.className='ideaDetail';body.innerHTML=md(overview);intro.append(body);
      list.append(intro);
    }
  }
  for(const item of items){
    const card=document.createElement('article');card.className='card ideaCard';
    const title=document.createElement('h3');title.textContent=plain(item.split('\n')[0]).slice(0,140);
    card.append(title);
    for(const line of itemSummary(item)){const p=document.createElement('p');p.textContent=line;card.append(p)}
    const action=document.createElement('button');action.className='btn primary';action.textContent='اصنع التصميم';action.onclick=()=>choose(item);
    const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='تفاصيل';const full=document.createElement('div');full.className='ideaDetail';full.innerHTML=md(item);details.append(summary,full);card.append(action,details);list.append(card);
  }
  return true;
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
  if(selection&&lastText.includes(selection)&&selection.length<=12000)ideas=[selection,...ideas.filter(idea=>idea!==selection)];
  if(!ideas.length)ideas=[lastText.slice(0,12000)];
  el('visualIdea').replaceChildren(...ideas.map((idea,i)=>new Option(plain(idea).slice(0,100),String(i))));
  selectIdea();el('visualFormat').value='1:1';el('visualMode').value=current==='campaign'?'Campaign':'Product Hero';el('visualTextMode').value='none';textControls();
  el('visualBackBtn').textContent='رجوع للمحتوى';
  show('visualStudio');status('visualStatus','');el('visualGenerate').disabled=true;
  try{source.brand={...DEFAULT,...await store.loadBrand()};products=await store.listProducts();el('visualProduct').replaceChildren(new Option('بدون منتج محدد',''),...products.map(p=>new Option(p.name,p.id)));selectProduct();status('studioBrand',`${source.brain.name} · ${source.brand.logo?'الشعار محفوظ':'بدون شعار'} · ${source.brand.references.length} صور مرجعية · ${source.brand.primary} / ${source.brand.secondary}`)}
  catch{source=null;status('visualStatus','تعذّر تحميل الهوية. افتح هوية النشاط وراجع تخزين المتصفح.')}
  finally{el('visualGenerate').disabled=false}
}
// Additive sibling entry point: opens Visual Studio directly from a saved Product Library
// item, with no generated text result required first. Seeds the source context from only the
// product's own name/description (never an invented idea, headline, CTA, offer, or audience
// insight) and leaves every Creative Direction/Composition choice to the user, exactly as
// choose() already does for the text-originated path. choose()'s own contract is untouched.
async function useProduct(productId){
  if(visualBusy)return toast('يوجد تصميم قيد الإنشاء؛ انتظر اكتماله');
  const brain=getBrain();
  if(!brain||!['name','product','customer'].every(k=>typeof brain[k]==='string'&&brain[k].trim()))return toast('أكمل بيانات مشروعك في هوية النشاط');
  const list=await store.listProducts();const product=list.find(p=>p.id===productId);
  if(!product)return toast('تعذّر العثور على هذا المنتج');
  const seed=product.description?`${product.name}\n${product.description}`:product.name;
  const task={engine:'content',context:seed,selected:seed};
  // entry:'product' marks this session as Product Library-originated for History labeling
  // and back-navigation only; it is never included in the /api/visual payload (see payload()).
  source={task,inputs:null,brain:structuredClone(brain),brand:null,entry:'product'};
  ideas=[seed];
  el('visualIdea').replaceChildren(new Option(plain(seed).slice(0,100),'0'));
  selectIdea();el('visualFormat').value='1:1';el('visualMode').value='Product Hero';el('visualTextMode').value='none';textControls();
  el('visualBackBtn').textContent='رجوع لمكتبة المنتجات';
  show('visualStudio');status('visualStatus','');el('visualGenerate').disabled=true;
  try{
    source.brand={...DEFAULT,...await store.loadBrand()};products=list;
    el('visualProduct').replaceChildren(new Option('بدون منتج محدد',''),...products.map(p=>new Option(p.name,p.id)));
    el('visualProduct').value=product.id;selectProduct();
    status('studioBrand',`${source.brain.name} · ${source.brand.logo?'الشعار محفوظ':'بدون شعار'} · ${source.brand.references.length} صور مرجعية · ${source.brand.primary} / ${source.brand.secondary}`);
  }catch{source=null;status('visualStatus','تعذّر تحميل الهوية. افتح هوية النشاط وراجع تخزين المتصفح.')}
  finally{el('visualGenerate').disabled=false}
}
function selectProduct(){const product=products.find(p=>p.id===el('visualProduct').value);if(source)source.product=product?structuredClone(product):null;el('visualFidelity').value=product?.fidelity||'exact';el('visualFidelity').disabled=!product}
function selectIdea(){if(!source)return;source.task.selected=ideas[Number(el('visualIdea').value)]||ideas[0];el('visualSource').innerHTML=md(source.task.selected);autoCopy()}
function textControls(){el('visualTextFields').classList.toggle('hidden',el('visualTextMode').value==='none')}
function settings(prefix='visual'){return {format:el(prefix+'Format').value,mode:prefix==='visual'?el('visualMode').value:active.settings.mode,textMode:el(prefix+'TextMode').value,headline:el(prefix+'Headline').value.trim(),cta:el(prefix+'CTA').value.trim(),productSize:el(prefix+'ProductSize').value,productPosition:el(prefix+'ProductPosition').value,productVertical:el(prefix+'ProductVertical').value,logoVisible:el(prefix+'LogoVisible').value!=='off',logoPosition:el(prefix+'LogoPosition').value,textPosition:el(prefix+'TextPosition').value}}
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
  const statusId=origin==='visualStudio'?'visualStatus':'visualResultStatus';
  const startedAt=Date.now();
  const tick=()=>status(statusId,`جارٍ إنشاء صورة واحدة… (${Math.round((Date.now()-startedAt)/1000)} ثانية) — قد يستغرق ذلك حتى دقيقتين ونصف.`);
  tick();const timer=setInterval(tick,1000);
  try{
    const body=await payload(snapshot);
    const response=await fetch('/api/visual',{method:'POST',headers:{'Content-Type':'application/json',...globalThis.PilotAuth?.headers()},body:JSON.stringify(body)});
    const result=await response.json();if(response.status===401)globalThis.PilotAuth?.handleUnauthorized();if(!response.ok)throw new Error(result.error||'تعذّر إنشاء الصورة');
    const background=responseBlob(result);
    // Retain the raw generation so failed overlays can be edited without another paid request.
    const record={...snapshot,id:crypto.randomUUID(),ts:Date.now(),background,rendered:null,direction:result.direction,model:result.model};
    const report={};
    try{record.rendered=await composeVisual(background,record.brand,record.settings,record.product,report)}catch(e){record.settings={...record.settings,textMode:'none'};try{record.rendered=await composeVisual(background,record.brand,record.settings,record.product,report);toast(e.message+' — حُفظت نسخة بدون نص')}catch{record.rendered=background;record.overlayWarning='حُفظت الخلفية فقط؛ تعذّر تركيب المنتج أو الشعار أو النص. لا تعتبرها تصميمًا مكتملًا؛ أعد التعديل بدون توليد جديد.'}}
    if(report.isolationFailed&&!record.overlayWarning)record.overlayWarning='تعذّر عزل خلفية صورة المنتج تلقائيًا هذه المرة؛ قد تظهر خلفية الصورة الأصلية. جرّب مرة ثانية أو استخدم صورة منتج بخلفية شفافة.';
    let saved=true;try{await store.saveVisual(record)}catch{saved=false}
    active=record;
    if(isScreen(origin)){display(record);status('visualResultStatus',(record.overlayWarning||'')+(saved?'حُفظ التصميم على هذا المتصفح.':'الصورة جاهزة؛ تعذّر حفظها في السجل. حمّلها الآن.'))}
    else toast(saved?'تصميمك جاهز في السجل':'تصميمك جاهز؛ افتح السجل لتحميله قبل إغلاق الصفحة');
  }catch(e){status(statusId,e.message||'تعذّر الاتصال. لا توجد إعادة محاولة تلقائية.')}
  finally{clearInterval(timer);lock(false)}
}
function display(record){
  active=record;if(previewURL)URL.revokeObjectURL(previewURL);previewURL=URL.createObjectURL(record.rendered);
  el('visualImage').src=previewURL;el('visualMeta').textContent=`${record.settings.format} · ${store.modeLabel(record.settings.mode)} · ${record.settings.textMode==='none'?'بدون نص':record.settings.textMode==='simple'?'نص بسيط':'إعلان كامل'}`;
  el('visualResultBackBtn').textContent=record.entry==='product'?'رجوع لمكتبة المنتجات':'رجوع للمحتوى';
  globalThis.Packs?.prepare(record);el('overlayEditor').classList.add('hidden');status('visualResultStatus',record.overlayWarning||'');show('visualResult');
}
async function variant(kind){
  if(visualBusy||!active)return;
  if(kind==='background'&&active.product?.fidelity==='creative')return status('visualResultStatus','للحفاظ على المنتج عند تغيير الخلفية، أنشئ التصميم بوضع المنتج الأصلي أولًا.');
  const s={...active.settings};if(kind==='selected')s.mode=el('variationMode').value;if(kind==='recompose')s.format=el('recomposeFormat').value;if(kind==='premium')s.mode='Premium';if(kind==='minimal')s.mode='Minimal';
  await requestVisual({parentId:active.id,rootId:active.rootId||active.id,action:kind,product:active.product?structuredClone(active.product):null,brain:structuredClone(active.brain),brand:structuredClone(active.brand),task:{...active.task},inputs:active.inputs,settings:s,previousDirection:active.direction,entry:active.entry});
}
function back(){
  if(!active&&!source)return home();
  const state=isScreen('visualStudio')?source:active||source;
  if(state.entry==='product')return productLibraryScreen();
  current=state.task.engine;lastInputs=state.inputs;renderResult(state.task.context,false);
}
function download(){if(!active?.rendered||visualBusy)return;const link=document.createElement('a');const url=URL.createObjectURL(active.rendered);link.href=url;link.download=`shaghil-${active.settings.format.replace(':','x')}-${active.id}.${active.rendered.type==='image/jpeg'?'jpg':'png'}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function editOverlay(){if(!active||visualBusy)return;for(const [key,id]of [['format','editFormat'],['textMode','editTextMode'],['headline','editHeadline'],['cta','editCTA']])el(id).value=active.settings[key];for(const [key,fallback] of [['productSize','medium'],['productPosition','center'],['productVertical','middle'],['logoPosition','top-right'],['textPosition','bottom']])el('edit'+key[0].toUpperCase()+key.slice(1)).value=active.settings[key]||fallback;el('editLogoVisible').value=active.settings.logoVisible===false?'off':'on';el('overlayEditor').classList.remove('hidden')}
async function updateOverlay(s){
  if(visualBusy||!active)return;
  lock(true);
  try{validateSettings(s);const report={};const record={...active,overlayWarning:'',settings:s,rendered:await composeVisual(active.background,active.brand,s,active.product,report)};if(report.isolationFailed)record.overlayWarning='تعذّر عزل خلفية صورة المنتج تلقائيًا هذه المرة؛ قد تظهر خلفية الصورة الأصلية.';let saved=true;try{await store.saveVisual(record)}catch{saved=false}display(record);status('visualResultStatus',(record.overlayWarning?record.overlayWarning+' ':'')+(saved?'تم التعديل محليًا بدون تكلفة توليد جديدة.':'تم التعديل؛ تعذّر الحفظ. حمّل التصميم الآن.'))}
  catch(e){status('visualResultStatus',e.message)}finally{lock(false)}
}
async function history(){
  globalThis.Packs?.render();
  const list=el('visualHistoryList');list.textContent='جارٍ تحميل التصاميم…';
  try{
    let rows=await store.listVisuals();if(active&&!rows.some(r=>r.id===active.id))rows.unshift(active);
    list.replaceChildren();if(!rows.length){list.textContent='لا توجد تصاميم محفوظة بعد.';return}
    rows.forEach(record=>{const button=document.createElement('button');button.className='historyItem btn full';button.textContent=`${record.brain?.name||'مشروع'} · ${record.parentId?'معالجة':'تصميم'} · ${record.entry==='product'?'مكتبة المنتجات':titles[record.task.engine]} · ${record.settings.format} · ${store.modeLabel(record.settings.mode)} · ${plain(record.task.selected).slice(0,90)}`;button.onclick=()=>{if(visualBusy)return toast('انتظر اكتمال التصميم الحالي');display(record)};list.appendChild(button)});
  }catch{list.textContent='تعذّر فتح سجل التصاميم.';if(active){const button=document.createElement('button');button.className='btn';button.textContent='افتح التصميم الحالي لتحميله';button.onclick=()=>display(active);list.appendChild(button)}}
}
globalThis.Visual={openSaved(record){if(visualBusy)return toast('انتظر اكتمال التصميم الحالي');display(structuredClone(record))},savePack(){if(!visualBusy&&active)return globalThis.Packs?.add(active)},setupBrand,saveProject,brandSummary,brandStyle,brandContext,useToneSuggestion,uploadLogo:file=>upload(file?[file]:[],true),uploadReferences:files=>upload(Array.from(files),false),removeLogo(){if(brandDraft&&!uploadBusy){brandDraft.logo=null;previewAssets()}},removeReferences(){if(brandDraft&&!uploadBusy){brandDraft.references=[];previewAssets()}},resultEntry,hideEntry,choose,useProduct,selectIdea,selectProduct,textControls,generate,variant,back,download,editOverlay,applyOverlay:()=>updateOverlay(settings('edit')),noText:()=>active&&updateOverlay({...active.settings,textMode:'none'}),history};
if(isScreen('setup'))setupBrand();resultEntry();
