import {eraserRasterBounds} from './raster-bounds.mjs?v=0.23.11';
const cachedBounds=new WeakMap();
function visualBounds(s,scale){let value=cachedBounds.get(s);if(value?.scale===scale)return value.bounds;const bounds=eraserRasterBounds(s,scale);cachedBounds.set(s,{scale,bounds});return bounds;}
const intersects=(a,b)=>a.x<=b.r&&a.r>=b.x&&a.y<=b.b&&a.b>=b.y;
// Plan against the last committed image, never against an unfinished render.
// Changed image/text transforms use the full renderer; unchanged objects are
// replayed under the region clip without assuming their visual bounds. Stroke order is retained when replaying a region.
export function planInkRepaint(before,after,surface,boundsFor=visualBounds){
 const visible=after.strokes.filter(s=>!after.omit.has(s.id)),full=()=>({mode:'full',x:0,y:0,width:surface.width,height:surface.height,strokes:visible});
 if(!before||before.pageId!==after.pageId||before.width!==after.width||before.height!==after.height||before.surfaceWidth!==surface.width||before.surfaceHeight!==surface.height||before.scale!==surface.scale)return full();
 const old=before.strokes.filter(s=>!before.omit.has(s.id));
 const oldById=new Map(old.map(s=>[s.id,s])),nextById=new Map(visible.map(s=>[s.id,s])),commonOld=old.filter(s=>nextById.has(s.id)),commonNext=visible.filter(s=>oldById.has(s.id));if(commonOld.some((s,i)=>s.id!==commonNext[i]?.id))return full();
 const changed=[...old.filter(s=>nextById.get(s.id)!==s),...visible.filter(s=>oldById.get(s.id)!==s)];
 // An explicit repaint may restore a cancelled transient eraser or loaded asset.
 if(!changed.length||changed.some(s=>['image','text'].includes(s.kind)))return full();
 const boxes=changed.map(s=>boundsFor(s,surface.scale));if(boxes.some(b=>![b.x,b.y,b.r,b.b].every(Number.isFinite)))return full();
 const x=Math.max(0,Math.floor(Math.min(...boxes.map(b=>b.x))*surface.scale)-2),y=Math.max(0,Math.floor(Math.min(...boxes.map(b=>b.y))*surface.scale)-2),r=Math.min(surface.width,Math.ceil(Math.max(...boxes.map(b=>b.r))*surface.scale)+2),b=Math.min(surface.height,Math.ceil(Math.max(...boxes.map(b=>b.b))*surface.scale)+2);
 if(r<=x||b<=y)return {mode:'region',x:0,y:0,width:0,height:0,strokes:[]};
 if((r-x)*(b-y)>surface.width*surface.height*.65)return full();
 const view={x:x/surface.scale,y:y/surface.scale,r:r/surface.scale,b:b/surface.scale},strokes=visible.filter(s=>['image','text'].includes(s.kind)||intersects(boundsFor(s,surface.scale),view));
 return {mode:'region',x,y,width:r-x,height:b-y,strokes};
}