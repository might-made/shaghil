import * as store from './visual-storage.mjs';
import {exportPack} from './campaign-export.mjs';
const el=id=>document.getElementById(id);let busy=false,loading=false,generating=false,epoch=0;
function controls(){el('packAdd').disabled=busy||loading||generating;el('packSelect').disabled=busy||loading||generating}
function message(text){el('packStatus').textContent=text}
async function prepare(record){
  loading=true;controls();const token=++epoch;el('packCaption').value=record.task.selected.slice(0,4000);el('packCTA').value=record.settings.cta||'';el('packLabel').value=record.settings.format==='9:16'?'Story':record.settings.format==='4:5'?'Instagram Portrait':'Instagram Post';el('packName').value='';
  try{const packs=await store.listPacks();if(token!==epoch)return;el('packSelect').replaceChildren(new Option('حزمة جديدة',''),...packs.filter(p=>p.project===record.brain.name).map(p=>new Option(p.name,p.id)));message('راجع التصميم والنص ثم احفظ نسخة معتمدة في الحزمة')}
  catch{message('تعذّر تحميل الحزم')}finally{if(token===epoch){loading=false;controls()}}
}
async function add(record){
  if(busy||loading||generating||!record?.rendered)return;if(record.overlayWarning)return message('راجع خطأ تركيب التصميم قبل اعتماده');
  busy=true;controls();
  try{
    const packs=await store.listPacks();let pack=packs.find(p=>p.id===el('packSelect').value&&p.project===record.brain.name);
    if(!pack){const name=el('packName').value.trim();if(!name)throw new Error('سمّ الحملة أو اختر حزمة محفوظة');pack={id:crypto.randomUUID(),name:name.slice(0,120),project:record.brain.name,ts:Date.now(),entries:[]}}
    const label=el('packLabel').value.trim()||record.settings.format;
    pack.entries.push({id:crypto.randomUUID(),label:label.slice(0,100),caption:el('packCaption').value.trim().slice(0,4000),cta:el('packCTA').value.trim().slice(0,120),approvedAt:Date.now(),record:structuredClone(record)});
    await store.savePack(pack);await prepare(record);el('packSelect').value=pack.id;message('حُفظت نسخة معتمدة؛ التعديلات اللاحقة لا تغيّرها');await render();
  }catch(e){message(e.message)}finally{busy=false;controls()}
}
function button(label,action){const b=document.createElement('button');b.className='btn';b.textContent=label;b.onclick=action;return b}
async function render(){
  const list=el('campaignPacks');list.replaceChildren();
  try{const packs=await store.listPacks();if(!packs.length){list.textContent='لا توجد حزم حملات محفوظة بعد.';return}
    for(const pack of packs){const card=document.createElement('article');card.className='card';const title=document.createElement('h3');title.textContent=pack.project+' ← '+pack.name;card.append(title);
      for(const entry of pack.entries){const row=document.createElement('div');row.className='historyItem';const idea=document.createElement('p');idea.textContent=entry.record.task.selected.split('\n')[0];row.append(idea,button(entry.label+' · '+entry.record.settings.format+' · '+entry.record.settings.mode,()=>globalThis.Visual.openSaved(entry.record)),button('إزالة من الحزمة',async()=>{if(busy)return;busy=true;try{pack.entries=pack.entries.filter(e=>e.id!==entry.id);await store.savePack(pack);await render()}catch{message('تعذّر حفظ الحزمة')}finally{busy=false}}));card.append(row)}
      const feedback=document.createElement('p');feedback.setAttribute('role','status');
      const download=button('تحميل الحزمة',async()=>{if(busy)return;busy=true;download.disabled=true;try{const result=await exportPack(pack),url=URL.createObjectURL(result.blob),a=document.createElement('a');a.href=url;a.download=result.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);feedback.textContent='جُهزت الحزمة بدون توليد جديد'}catch(e){feedback.textContent=e.message}finally{busy=false;download.disabled=false}});
      card.append(download,button('حذف الحزمة',async()=>{if(busy||!confirm('حذف الحزمة من هذا المتصفح؟'))return;busy=true;try{await store.deletePack(pack.id);await render()}catch{feedback.textContent='تعذّر الحذف'}finally{busy=false}}),feedback);list.append(card);
    }
  }catch{list.textContent='تعذّر فتح حزم الحملات'}
}
globalThis.Packs={prepare,add,render,setGenerationBusy(value){generating=value;controls()}};
