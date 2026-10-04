import * as store from './visual-storage.mjs';
import { decodeImage, normalizeAsset } from './visual-canvas.mjs';
const el=id=>document.getElementById(id);
let pending=null,editing=null,working=false,urls=[],previewUrl=null;
function message(text){el('productStatus').textContent=text}
function showPreview(blob){
  if(previewUrl)URL.revokeObjectURL(previewUrl);
  previewUrl=URL.createObjectURL(blob);
  el('productPreview').src=previewUrl;
  el('productPreviewWrap').classList.remove('hidden');
}
function hidePreview(){
  if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}
  el('productPreview').src='';
  el('productPreviewWrap').classList.add('hidden');
}
async function refresh(){
  urls.forEach(URL.revokeObjectURL);urls=[];const list=el('productList');list.replaceChildren();
  try{const products=await store.listProducts();
    for(const p of products){
      // One record that fails to render (e.g. an unreadable image) must never take the
      // rest of the library down with it — each card is isolated so the others still show.
      try{
        const card=document.createElement('div');card.className='card';
        const image=document.createElement('img');image.className='assetThumb';image.alt=p.name;image.src=URL.createObjectURL(p.image);urls.push(image.src);
        const title=document.createElement('h3');title.textContent=p.name;
        const description=document.createElement('p');description.textContent=p.description||'';
        const mode=document.createElement('p');mode.textContent=p.fidelity==='exact'?'المنتج الأصلي':'معالجة إبداعية';
        const use=document.createElement('button');use.className='btn primary';use.textContent='استخدم في استوديو التصميم';use.onclick=()=>{if(working)return;globalThis.Visual?.useProduct(p.id)};
        const edit=document.createElement('button');edit.className='btn';edit.textContent='تعديل';edit.onclick=()=>{if(working)return;editing=p.id;pending={image:p.image,reference:p.reference};el('productName').value=p.name;el('productDescription').value=p.description;el('productFidelity').value=p.fidelity;showPreview(p.image);el('productSave').textContent='تحديث المنتج';el('productCancelEdit').classList.remove('hidden');message(`تعديل "${p.name}" — اختر صورة جديدة لاستبدال الأصلية، ثم اضغط "تحديث المنتج"`);};
        const remove=document.createElement('button');remove.className='btn';remove.textContent='حذف من المكتبة';remove.onclick=async()=>{if(working||!confirm('حذف المنتج من المكتبة؟ التصاميم المحفوظة تحتفظ بنسختها.'))return;try{await store.deleteProduct(p.id);if(editing===p.id)reset();await refresh()}catch{message('تعذّر حذف المنتج')}};
        card.append(image,title,description,mode,use,edit,remove);list.append(card);
      }catch{
        const card=document.createElement('div');card.className='card';
        const title=document.createElement('h3');title.textContent=p.name||'منتج';
        const warning=document.createElement('p');warning.textContent='تعذّر عرض صورة هذا المنتج في هذا المتصفح.';
        const remove=document.createElement('button');remove.className='btn';remove.textContent='حذف من المكتبة';remove.onclick=async()=>{if(working||!confirm('حذف المنتج من المكتبة؟'))return;try{await store.deleteProduct(p.id);await refresh()}catch{message('تعذّر حذف المنتج')}};
        card.append(title,warning,remove);list.append(card);
      }
    }
    if(!products.length)list.textContent='أضف أول منتج لاستخدام صورته الأصلية في تصاميمك.';
  }catch{message('تعذّر فتح مكتبة المنتجات في هذا المتصفح')}
}
function reset(){editing=null;pending=null;hidePreview();el('productName').value='';el('productDescription').value='';el('productImage').value='';el('productFidelity').value='exact';el('productSave').textContent='حفظ المنتج';el('productCancelEdit').classList.add('hidden');message('منتج جديد — أضف الاسم والصورة ثم احفظ')}
async function upload(file){
  if(!file||working)return;working=true;el('productSave').disabled=true;
  try{if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024)throw new Error('اختر PNG أو JPEG أو WebP أقل من 8MB');const image=await decodeImage(file);if(image.width*image.height>40000000)throw new Error('أبعاد الصورة كبيرة جدًا');const reference=await normalizeAsset(file);
    // Copy into a plain, memory-owned Blob rather than persisting the live File handle:
    // a File tied to the <input> selection can go stale in IndexedDB after later DOM
    // changes (e.g. the input being reset), silently breaking that one saved product.
    const owned=new Blob([file],{type:file.type});
    pending={image:owned,reference};showPreview(owned);message(`${file.name} — الصورة جاهزة. اضغط "حفظ المنتج" لإتمام الحفظ`)}
  catch(e){pending=null;hidePreview();el('productImage').value='';message(e.message)}
  finally{working=false;el('productSave').disabled=false}
}
async function save(){
  if(working)return;
  const name=el('productName').value.trim();if(!name||!pending)return message('أضف اسم المنتج وصورته أولًا');
  const wasEditing=Boolean(editing);
  working=true;el('productSave').disabled=true;
  try{
    // V4 Batch 7: this form only edits name/description/fidelity/image — preserve every other
    // Product Memory field (category, price, specifications, features, benefits, useCases,
    // audienceRelevance, offers, schemaVersion) exactly as already stored, rather than silently
    // dropping them because this form doesn't know about them yet.
    let existing={};
    if(editing){const list=await store.listProducts();existing=list.find(p=>p.id===editing)||{}}
    await store.saveProduct({...existing,id:editing||crypto.randomUUID(),name:name.slice(0,120),description:el('productDescription').value.trim().slice(0,600),fidelity:el('productFidelity').value,...pending});
    reset();await refresh();message(wasEditing?`تم تحديث "${name}" — الصورة الجديدة ستُستخدم تلقائيًا في التصاميم القادمة، والتصاميم المحفوظة سابقًا لا تتغيّر`:`تم حفظ "${name}" في المكتبة`)
  }
  catch(e){message(e.message)}finally{working=false;el('productSave').disabled=false}
}
// V4 Batch 8: a plain, read-only list for building the six engines' optional product selector —
// never auto-selects or guesses anything itself, just the raw data a caller selects from.
async function list(){try{return await store.listProducts()}catch{return[]}}
globalThis.Products={refresh,reset,upload,save,list};
