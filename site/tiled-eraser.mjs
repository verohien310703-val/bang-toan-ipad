import {drawStroke} from './ink.js?v=0.23.11';
import {eraserRasterBounds} from './raster-bounds.mjs?v=0.23.11';
export {eraserRasterBounds};
const TILE=128,LIMIT=16*1024*1024,SOURCE_LIMIT=64*1024*1024;
const boundsCache=new WeakMap();
export function createTiledEraser({canvas,page,strokes,changes,makeCanvas=()=>document.createElement('canvas'),renderStroke=drawStroke,cacheSources=true,tileLimit=LIMIT}){
 const transform=canvas.getContext('2d').getTransform?.(),ratio=Number.isFinite(transform?.a)&&transform.a>0&&transform.b===0&&transform.c===0&&transform.e===0&&transform.f===0?transform.a:canvas.width/page.width,tiles=new Map(),boxes=new Map();let bytes=0;
 const sources=new Map(),hidden=new Set();let sourceBytes=0,vectorRenders=0;
 for(const s of strokes){let cached=boundsCache.get(s);if(!cached||cached.ratio!==ratio){const b=eraserRasterBounds(s,ratio);cached={ratio,box:{x:b.x*ratio,y:b.y*ratio,r:b.r*ratio,b:b.b*ratio}};boundsCache.set(s,cached);}boxes.set(s,cached.box);}
 function dispose(t){for(const l of t.layers){bytes-=l.canvas.width*l.canvas.height*4;l.canvas.width=l.canvas.height=1;}t.flat.width=t.flat.height=1;bytes-=t.w*t.h*4;}
 function source(s){
  let saved=sources.get(s);if(saved){sources.delete(s);sources.set(s,saved);return saved;}
  const b=boxes.get(s),x=Math.max(0,Math.floor(b.x)),y=Math.max(0,Math.floor(b.y)),right=Math.min(canvas.width,Math.ceil(b.r)),bottom=Math.min(canvas.height,Math.ceil(b.b));
  if(right<=x||bottom<=y)return null;
  const size=(right-x)*(bottom-y)*4;
  while(sourceBytes+size>SOURCE_LIMIT&&sources.size){const [key,old]=sources.entries().next().value;sources.delete(key);sourceBytes-=old.bytes;old.canvas.width=old.canvas.height=1;}
  const c=makeCanvas();c.width=right-x;c.height=bottom-y;const ctx=c.getContext('2d');ctx.setTransform(ratio,0,0,ratio,-x,-y);renderStroke(ctx,s);vectorRenders++;
  saved={canvas:c,x,y,bytes:size};sources.set(s,saved);sourceBytes+=size;return saved;
 }
 function cut(ctx,poly,x,y){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#000000';ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.moveTo(poly[0][0]*ratio-x,poly[0][1]*ratio-y);for(const p of poly.slice(1))ctx.lineTo(p[0]*ratio-x,p[1]*ratio-y);ctx.closePath();ctx.fill();ctx.restore();}
 function get(tx,ty){const key=tx+':'+ty;let t=tiles.get(key);if(t){tiles.delete(key);tiles.set(key,t);return t;}
  const x=tx*TILE,y=ty*TILE,w=Math.min(TILE,canvas.width-x),h=Math.min(TILE,canvas.height-y);t={x,y,w,h,layers:[],flat:makeCanvas()};t.flat.width=w;t.flat.height=h;bytes+=w*h*4;
  for(const s of strokes){if(hidden.has(s.id))continue;const b=boxes.get(s);if(b.r<x||b.x>x+w||b.b<y||b.y>y+h)continue;const c=makeCanvas();c.width=w;c.height=h;const ctx=c.getContext('2d');const pending=changes.get(s.id)?.polygons||[];
   if(cacheSources){const raster=source(s);if(raster)ctx.drawImage(raster.canvas,raster.x-x,raster.y-y);for(const poly of pending)cut(ctx,poly,x,y);}
   else{ctx.setTransform(ratio,0,0,ratio,-x,-y);renderStroke(ctx,pending.length?{...s,erasePolygons:[...(s.erasePolygons||[]),...pending]}:s);vectorRenders++;}
   t.layers.push({stroke:s,canvas:c,erasable:!s.kind||s.kind==='ink'||s.quickShape});bytes+=w*h*4;}
  tiles.set(key,t);return t;
 }
 function composite(dirty){for(const t of dirty.values()){const out=t.flat.getContext('2d');out.clearRect(0,0,t.w,t.h);for(const l of t.layers)if(!hidden.has(l.stroke.id))out.drawImage(l.canvas,0,0);const ctx=canvas.getContext('2d');ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(t.x,t.y,t.w,t.h);ctx.drawImage(t.flat,t.x,t.y);ctx.restore();}}
 function trim(){while(bytes>tileLimit&&tiles.size){const [key,t]=tiles.entries().next().value;tiles.delete(key);dispose(t);}}
 function hideStrokes(ids){const dirty=new Map(),changed=strokes.filter(s=>ids.has(s.id)&&!hidden.has(s.id));for(const s of changed)hidden.add(s.id);for(const s of changed){const b=boxes.get(s),left=Math.max(0,Math.floor(b.x/TILE)),right=Math.min(Math.ceil(canvas.width/TILE)-1,Math.floor(b.r/TILE)),top=Math.max(0,Math.floor(b.y/TILE)),bottom=Math.min(Math.ceil(canvas.height/TILE)-1,Math.floor(b.b/TILE));
  for(let ty=top;ty<=bottom;ty++)for(let tx=left;tx<=right;tx++){dirty.set(tx+':'+ty,get(tx,ty));if(dirty.size>=4){composite(dirty);dirty.clear();trim();}}
 }composite(dirty);trim();}
 function applyChunk(polygons){const dirty=new Map();
  for(const poly of polygons){const xs=poly.map(p=>p[0]*ratio),ys=poly.map(p=>p[1]*ratio),left=Math.max(0,Math.min(...xs)),top=Math.max(0,Math.min(...ys)),right=Math.min(canvas.width-1,Math.max(...xs)),bottom=Math.min(canvas.height-1,Math.max(...ys));if(right<left||bottom<top)continue;const touched=new Set();
   for(let ty=Math.floor(top/TILE);ty<=Math.floor(bottom/TILE);ty++)for(let tx=Math.floor(left/TILE);tx<=Math.floor(right/TILE);tx++){
    const t=get(tx,ty);dirty.set(tx+':'+ty,t);
    for(const l of t.layers)if(l.erasable){const box=boxes.get(l.stroke);if(box.r<left||box.x>right||box.b<top||box.y>bottom)continue;const old=l.stroke.erasePolygons?.length||0,pending=changes.get(l.stroke.id)?.polygons.length||0;if(old+pending<1500||touched.has(l.stroke.id)){cut(l.canvas.getContext('2d'),poly,t.x,t.y);touched.add(l.stroke.id);}}
   }
   for(const id of touched){let c=changes.get(id);if(!c){c={stroke:strokes.find(s=>s.id===id),polygons:[]};changes.set(id,c);}c.polygons.push(poly);}
  }
  composite(dirty);trim();
 }
 function applyBatch(polygons){for(let i=0;i<polygons.length;i+=4)applyChunk(polygons.slice(i,i+4));}
 function apply(poly){applyChunk([poly]);}
 return {apply,applyBatch,hideStrokes,destroy(){for(const t of tiles.values())dispose(t);tiles.clear();for(const s of sources.values())s.canvas.width=s.canvas.height=1;sources.clear();sourceBytes=0;},get memoryBytes(){return bytes+sourceBytes;},get vectorRenders(){return vectorRenders;},get tileCount(){return tiles.size;}};
}
