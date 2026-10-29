import {PDF_PAPERS} from './paper-catalog-data.mjs?v=0.23.11';
export {PDF_PAPERS};
export const pdfPaper=id=>PDF_PAPERS.find(p=>p.id===id);
export const paperChoices=[['blank','Trắng'],['ruled','Dòng kẻ'],['grid','Ô vuông'],['dots','Chấm'],['graph','Ô đồ thị'],['cornell','Cornell'],...PDF_PAPERS.map(p=>[p.id,p.label])];
export function paperFit(w,h,p){const scale=Math.min(w/p.width,h/p.height);return {scale,x:Math.max(0,(w-p.width*scale)/2),y:Math.max(0,(h-p.height*scale)/2),width:p.width*scale,height:p.height*scale};}
const images=new Map(),tickets=new WeakMap();
// Preview images never become the writing/PDF background. Discard callbacks
// from a previous choice even if the same canvas has already been repainted.
export function paintPdfThumbnail(ctx,w,h,id){
 const ticket={};tickets.set(ctx.canvas,ticket);const p=pdfPaper(id);if(!p)return Promise.resolve(false);
 const url=`./paper-templates/${p.source}-${p.page}.png`;if(!images.has(url))images.set(url,new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>{images.delete(url);reject(Error('Không tải được ảnh mẫu giấy.'));};im.src=url;}));
 const matrix=ctx.getTransform();return images.get(url).then(im=>{if(tickets.get(ctx.canvas)!==ticket)return false;const b=paperFit(w,h,p);ctx.save();ctx.setTransform(matrix);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);ctx.drawImage(im,b.x,b.y,b.width,b.height);ctx.restore();return true;}).catch(()=>false);
}
