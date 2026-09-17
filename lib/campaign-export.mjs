// Small standards-based ZIP writer: stored (uncompressed) files, UTF-8 names.
// PNGs are already compressed. No library, network or generation is required.
const encoder=new TextEncoder();
export function safeName(value){return String(value||'creative').normalize('NFKC').replace(/[^\p{L}\p{N}_-]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,70)||'creative'}
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return (crc^0xffffffff)>>>0}
function header(size){const data=new Uint8Array(size);return {data,view:new DataView(data.buffer)}}
export async function zipFiles(files){
  let offset=0,total=0;const chunks=[],central=[];
  for(const file of files){
    total+=file.blob.size;if(total>150*1024*1024)throw new Error('الحزمة كبيرة جدًا؛ قسّمها إلى حزم أصغر');
    const bytes=new Uint8Array(await file.blob.arrayBuffer()),name=encoder.encode(file.name),crc=crc32(bytes);
    const local=header(30);local.view.setUint32(0,0x04034b50,true);local.view.setUint16(4,20,true);local.view.setUint16(6,0x800,true);local.view.setUint16(12,33,true);local.view.setUint32(14,crc,true);local.view.setUint32(18,bytes.length,true);local.view.setUint32(22,bytes.length,true);local.view.setUint16(26,name.length,true);
    chunks.push(local.data,name,bytes);
    const entry=header(46);entry.view.setUint32(0,0x02014b50,true);entry.view.setUint16(4,20,true);entry.view.setUint16(6,20,true);entry.view.setUint16(8,0x800,true);entry.view.setUint16(14,33,true);entry.view.setUint32(16,crc,true);entry.view.setUint32(20,bytes.length,true);entry.view.setUint32(24,bytes.length,true);entry.view.setUint16(28,name.length,true);entry.view.setUint32(42,offset,true);central.push(entry.data,name);offset+=30+name.length+bytes.length;
  }
  const length=central.reduce((sum,b)=>sum+b.length,0),end=header(22);end.view.setUint32(0,0x06054b50,true);end.view.setUint16(8,files.length,true);end.view.setUint16(10,files.length,true);end.view.setUint32(12,length,true);end.view.setUint32(16,offset,true);
  return new Blob([...chunks,...central,end.data],{type:'application/zip'});
}
export async function exportPack(pack){
  const stem=safeName(pack.project+'-'+pack.name),files=[],manifest={project:pack.project,campaign:pack.name,createdAt:pack.ts,entries:[]};
  for(const [i,e]of pack.entries.entries()){
    const name=String(i+1).padStart(2,'0')+'-'+safeName(e.label)+'-'+e.record.settings.format.replace(':','x');
    if(!e.record.rendered)throw new Error('تصميم غير مكتمل في الحزمة');
    files.push({name:stem+'/'+name+(e.record.rendered.type==='image/jpeg'?'.jpg':'.png'),blob:e.record.rendered});
    files.push({name:stem+'/'+name+'-copy.txt',blob:new Blob([e.caption+'\n\nCTA: '+e.cta+'\n\nالفكرة: '+e.record.task.selected],{type:'text/plain;charset=utf-8'})});
    manifest.entries.push({label:e.label,creativeId:e.record.id,parentId:e.record.parentId||null,idea:e.record.task.selected,format:e.record.settings.format,mode:e.record.settings.mode,product:e.record.product?.name||null,fidelity:e.record.product?.fidelity||null,approvedAt:e.approvedAt});
  }
  files.push({name:stem+'/manifest.json',blob:new Blob([JSON.stringify(manifest,null,2)],{type:'application/json'})});
  return {name:stem+'.zip',blob:await zipFiles(files)};
}
