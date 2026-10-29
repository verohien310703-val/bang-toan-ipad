import * as pdfjs from './vendor/pdfjs/pdf.mjs';
import {pdfPaper,paperFit} from './paper-catalog.mjs?v=0.23.11';
pdfjs.GlobalWorkerOptions.workerSrc='./vendor/pdfjs/pdf.worker.mjs';
const documents=new Map();
export async function paintPdfPaper(ctx,w,h,id){
 const p=pdfPaper(id);if(!p)return false;const url=`./paper-templates/${p.source}.pdf`;
 if(!documents.has(url))documents.set(url,pdfjs.getDocument({url,isEvalSupported:false,cMapUrl:'./vendor/cmaps/',cMapPacked:true,standardFontDataUrl:'./vendor/fonts/'}).promise);
 let doc;try{doc=await documents.get(url);}catch(e){documents.delete(url);throw e;}
 const page=await doc.getPage(p.page),b=paperFit(w,h,p),m=ctx.getTransform(),vp=page.getViewport({scale:b.scale});
 ctx.save();ctx.setTransform(1,0,0,1,0,0);try{await page.render({canvasContext:ctx,viewport:vp,transform:[m.a,m.b,m.c,m.d,m.e+m.a*b.x+m.c*b.y,m.f+m.b*b.x+m.d*b.y],background:'#ffffff'}).promise;}finally{ctx.restore();}return true;
}
