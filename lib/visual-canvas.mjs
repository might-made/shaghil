export const DIMENSIONS={'1:1':[1080,1080],'4:5':[1080,1350],'9:16':[1080,1920]};
export function decodeImage(blob){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(blob),image=new Image();
    image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};
    image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('تعذّر قراءة الصورة'))};
    image.src=url;
  });
}
export function canvasBlob(canvas,type='image/png',quality){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('تعذّر تجهيز الصورة')),type,quality))}
export async function normalizeAsset(file,logo=false){
  if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024)throw new Error('اختر PNG أو JPEG أو WebP بحجم أقل من 8MB');
  const image=await decodeImage(file);
  if(image.width*image.height>40000000)throw new Error('أبعاد الصورة كبيرة جدًا');
  const scale=Math.min(1,(logo?600:1200)/Math.max(image.width,image.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  const blob=await canvasBlob(canvas,logo?'image/png':'image/jpeg',0.8);
  if(blob.size>700000)throw new Error('الصورة كبيرة بعد التحسين، اختر صورة أبسط أو أصغر');
  return blob;
}
function linesFor(ctx,text,width){
  const words=text.trim().split(/\s+/),lines=[];let line='';
  for(const word of words){
    if(ctx.measureText(word).width>width)return null;
    const next=line?line+' '+word:word;
    if(ctx.measureText(next).width>width){lines.push(line);line=word}else line=next;
  }
  if(line)lines.push(line);return lines;
}
function drawText(ctx,text,x,y,width,maxLines,initial,maxHeight=Infinity){
  let size=initial,lines;
  do{ctx.font=`700 ${size}px Tahoma, Arial, sans-serif`;lines=linesFor(ctx,text,width);if(lines&&lines.length<=maxLines&&lines.length*size*1.5<=maxHeight)break;size-=2}while(size>=24);
  if(!lines||lines.length>maxLines||lines.length*size*1.5>maxHeight)throw new Error('النص طويل للتصميم، اختصره قبل الحفظ');
  lines.forEach((line,i)=>ctx.fillText(line,x,y+i*size*1.5));
}
export async function composeVisual(background,brand,settings,product=null){
  const [w,h]=DIMENSIONS[settings.format]||DIMENSIONS['1:1'];
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');const image=await decodeImage(background);
  ctx.fillStyle=brand.secondary||'#181b1f';ctx.fillRect(0,0,w,h);
  // Fit, rather than crop, so changing format cannot cut off the product.
  const scale=Math.min(w/image.width,h/image.height),iw=image.width*scale,ih=image.height*scale;
  ctx.drawImage(image,(w-iw)/2,(h-ih)/2,iw,ih);
  const margin=Math.round(w*0.065);
  if(product?.fidelity==='exact'&&product.image){
    const original=await decodeImage(product.image);
    const size={small:0.32,medium:0.5,large:0.68}[settings.productSize]||0.5;
    const top=margin+h*0.14,bottom=settings.textMode==='none'?h-margin:h*(settings.textMode==='full'?0.64:0.74)-margin;
    const available=Math.max(h*0.2,bottom-top),scale=Math.min(w*size/original.width,available/original.height);
    const pw=original.width*scale,ph=original.height*scale;
    const x=settings.productPosition==='left'?margin:settings.productPosition==='right'?w-margin-pw:(w-pw)/2;
    const y=settings.productVertical==='top'?top:settings.productVertical==='bottom'?bottom-ph:top+(available-ph)/2;
    ctx.drawImage(original,x,y,pw,ph);
  }
  if(brand.logo&&settings.logoVisible!==false){
    const logo=await decodeImage(brand.logo),s=Math.min(w*0.22/logo.width,h*0.12/logo.height);
    ctx.drawImage(logo,w-margin-logo.width*s,margin,logo.width*s,logo.height*s);
  }
  if(settings.textMode!=='none'){
    const panelHeight=settings.textMode==='full'?h*0.36:h*0.26;
    ctx.fillStyle='rgba(9,12,15,0.88)';ctx.fillRect(0,h-panelHeight,w,panelHeight);
    ctx.fillStyle=brand.accent||brand.primary||'#e7f95b';ctx.fillRect(w-margin-80,h-panelHeight+margin/2,80,6);
    ctx.textAlign='right';ctx.textBaseline='top';ctx.direction='rtl';ctx.fillStyle='#ffffff';
    drawText(ctx,settings.headline,w-margin,h-panelHeight+margin,w-2*margin,3,52,panelHeight-margin*1.5-(settings.textMode==='full'&&settings.cta?100:0));
    if(settings.textMode==='full'&&settings.cta){ctx.fillStyle='#ffffff';drawText(ctx,settings.cta,w-margin,h-margin-45,w-2*margin,1,34)}
  }
  return canvasBlob(canvas);
}
export function blobPayload(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({type:blob.type,base64:String(reader.result).split(',')[1]});reader.onerror=reject;reader.readAsDataURL(blob)})}
export function responseBlob(data){
  if(data.mime!=='image/jpeg'||typeof data.base64!=='string')throw new Error('استجابة الصورة غير صالحة');
  return new Blob([Uint8Array.from(atob(data.base64),c=>c.charCodeAt(0))],{type:data.mime});
}
