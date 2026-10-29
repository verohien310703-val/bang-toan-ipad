// Run the existing pen renderer unchanged on a cropped OffscreenCanvas.
import {drawStroke} from './ink.js?v=0.23.11';
import {eraserRasterBounds} from './raster-bounds.mjs?v=0.23.11';
import {clearRasterReuse,copyRaster} from './raster-reuse.mjs?v=0.23.11';
globalThis.document={createElement:()=>new OffscreenCanvas(1,1)};
self.onmessage=({data:m})=>{
 try{
  const b=eraserRasterBounds(m.stroke,m.scale),x=Math.max(0,Math.floor(b.x*m.scale+m.e)),y=Math.max(0,Math.floor(b.y*m.scale+m.f)),right=Math.min(m.width,Math.ceil(b.r*m.scale+m.e)),bottom=Math.min(m.height,Math.ceil(b.b*m.scale+m.f));
  if(right<=x||bottom<=y){self.postMessage({id:m.id,empty:true});return;}
  const canvas=new OffscreenCanvas(right-x,bottom-y),ctx=canvas.getContext('2d');ctx.setTransform(m.scale,0,0,m.scale,m.e-x,m.f-y);drawStroke(ctx,m.stroke);const bitmap=canvas.transferToImageBitmap(),{erasePolygons,...body}=m.stroke,copy=erasePolygons?.length?copyRaster(body):null,bodyBitmap=copy?.canvas.transferToImageBitmap();clearRasterReuse();self.postMessage({id:m.id,x,y,bitmap,...(bodyBitmap?{bodyBitmap,bodyX:copy.x+m.e,bodyY:copy.y+m.f}:{})},bodyBitmap?[bitmap,bodyBitmap]:[bitmap]);
 }catch(e){clearRasterReuse();self.postMessage({id:m.id,error:e.message});}
};
self.postMessage({ready:true});
