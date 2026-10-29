// Only immutable completed ink. Cropped device-pixel images are bounded by a
// shared LRU; weak keys do not keep old lesson/undo objects alive.
import {eraserRasterBounds} from './raster-bounds.mjs?v=0.23.11';
import {alphaHitsSweep} from './alpha-hit.mjs?v=0.23.11';
import {moveSource} from './selection-move.mjs?v=0.23.11';
const lookup=new WeakMap(),byPoints=new WeakMap(),byShape=new WeakMap(),polygonKeys=new WeakMap(),lru=new Map(),LIMIT=32*1024*1024;let bytes=0,polygonSequence=0;
function visualKey(s,ignoreColor=false){const body=Object.keys(s).filter(k=>!['id','points','erasePolygons',...(ignoreColor?['color']:[])].includes(k)).sort().map(k=>[k,s[k]]),masks=(s.erasePolygons||[]).map(p=>{let id=polygonKeys.get(p);if(!id){id=++polygonSequence;polygonKeys.set(p,id);}return id;});return JSON.stringify(body)+'|'+masks.join(',');}
function tintable(s){return s.penEnded===true&&(s.kind||'ink')==='ink'&&[23,24].includes(s.penModel)&&!s.fillColor&&!s.dashed&&!s.dotted&&/^#[a-f0-9]{6}$/i.test(s.color);}
function indexRecord(s,record){lookup.set(s,record);if(Array.isArray(s.points)){let map=byPoints.get(s.points);if(!map){map=new Map();byPoints.set(s.points,map);}map.set(visualKey(s),record);while(map.size>64)map.delete(map.keys().next().value);if(tintable(s)){let shapes=byShape.get(s.points);if(!shapes){shapes=new Map();byShape.set(s.points,shapes);}record.shapeKey=visualKey(s,true);shapes.set(record.shapeKey,record);while(shapes.size>32)shapes.delete(shapes.keys().next().value);}}return record;}
function recolorRecord(s,source){const size=source.canvas.width*source.canvas.height*4;if(size>LIMIT)return null;const canvas=document.createElement('canvas');canvas.width=source.canvas.width;canvas.height=source.canvas.height;const ctx=canvas.getContext('2d');ctx.drawImage(source.canvas,0,0);ctx.globalCompositeOperation='source-in';ctx.fillStyle=s.color;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='source-over';while((bytes+size>LIMIT||lru.size>=128)&&lru.size)remove(lru.keys().next().value);const record={ref:new WeakRef(s),pointsRef:new WeakRef(s.points),visualKey:visualKey(s),canvas,bytes:size,scale:source.scale,bounds:{...source.bounds},x:source.x,y:source.y};lru.set(record,true);bytes+=size;return indexRecord(s,record);}
function shiftedRecord(s,record,dx,dy){const x=dx*record.scale,y=dy*record.scale;return indexRecord(s,{...record,base:record.base||record,ref:new WeakRef(s),pointsRef:Array.isArray(s.points)?new WeakRef(s.points):null,x:record.x+x,y:record.y+y,bounds:{x:record.bounds.x+x,y:record.bounds.y+y,r:record.bounds.r+x,b:record.bounds.b+y}});}
function findRecord(s,depth=0){let record=lookup.get(s);if(record&&lru.has(record.base||record))return record;if(Array.isArray(s.points)){record=byPoints.get(s.points)?.get(visualKey(s));if(record&&lru.has(record.base||record)){lookup.set(s,record);return record;}if(tintable(s)){const shape=byShape.get(s.points)?.get(visualKey(s,true));if(shape&&lru.has(shape.base||shape))return recolorRecord(s,shape);}}if(depth<64){const move=moveSource(s);if(move){record=findRecord(move.source,depth+1);if(record){const shifted=shiftedRecord(s,record,move.dx,move.dy);if(s.erasePolygons?.length){const {erasePolygons,...body}=s,{erasePolygons:oldMasks,...oldBody}=move.source,bodyRecord=findRecord(oldBody,depth+1);if(bodyRecord)shiftedRecord(body,bodyRecord,move.dx,move.dy);}return shifted;}}}return null;}
function remove(record){lru.delete(record);bytes-=record.bytes;const stroke=record.ref.deref();if(stroke&&lookup.get(stroke)===record)lookup.delete(stroke);const points=record.pointsRef?.deref(),map=points&&byPoints.get(points);if(map?.get(record.visualKey)===record){map.delete(record.visualKey);if(!map.size)byPoints.delete(points);}const shapes=points&&byShape.get(points);if(shapes?.get(record.shapeKey)===record)shapes.delete(record.shapeKey);record.canvas.width=record.canvas.height=1;}
function geometry(ctx,s){
 if(s.penEnded!==true||(s.kind||'ink')!=='ink'||![23,24].includes(s.penModel)||s.dashed||s.dotted||typeof WeakRef==='undefined')return null;
 const m=ctx.getTransform();if(m.b!==0||m.c!==0||m.a<=0||m.a!==m.d||!Number.isInteger(m.e)||!Number.isInteger(m.f))return null;
 return m;
}
export function drawReusedRaster(ctx,s,downsample=false){
 const record=findRecord(s);if(!record)return false;const m=geometry(ctx,s);if(!m||(m.a!==record.scale&&!(downsample&&m.a<record.scale)))return false;
 const factor=m.a/record.scale,left=Math.max(record.bounds.x,-m.e/factor),top=Math.max(record.bounds.y,-m.f/factor),right=Math.min(record.bounds.r,(ctx.canvas.width-m.e)/factor),bottom=Math.min(record.bounds.b,(ctx.canvas.height-m.f)/factor);
 if(left<record.x||top<record.y||right>record.x+record.canvas.width||bottom>record.y+record.canvas.height)return false;
 const base=record.base||record;lru.delete(base);lru.set(base,true);ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;if(factor===1)ctx.drawImage(record.canvas,record.x+m.e,record.y+m.f);else ctx.drawImage(record.canvas,record.x*factor+m.e,record.y*factor+m.f,record.canvas.width*factor,record.canvas.height*factor);ctx.restore();
 // Aliases retain the original bounded bitmap and accumulate only offsets.
 // Never bake subpixel movement into a new image: repeated moves must not blur.
 return true;
}
export function rasterWindow(ctx,s){
 const m=geometry(ctx,s);if(!m)return null;const b=eraserRasterBounds(s,m.a),left=Math.max(0,Math.floor(b.x*m.a+m.e)),top=Math.max(0,Math.floor(b.y*m.a+m.f)),right=Math.min(ctx.canvas.width,Math.ceil(b.r*m.a+m.e)),bottom=Math.min(ctx.canvas.height,Math.ceil(b.b*m.a+m.f));
 return {x:left,y:top,width:Math.max(0,right-left),height:Math.max(0,bottom-top)};
}
export function rememberRaster(ctx,s,bitmap,origin={x:0,y:0}){
 const m=geometry(ctx,s);if(!m||origin.x<0||origin.y<0||origin.x+bitmap.width>ctx.canvas.width||origin.y+bitmap.height>ctx.canvas.height||bitmap.getContext('2d').canvas!==bitmap)return;
 const b=eraserRasterBounds(s,m.a),full={x:Math.floor(b.x*m.a),y:Math.floor(b.y*m.a),r:Math.ceil(b.r*m.a),b:Math.ceil(b.b*m.a)};
 const left=Math.max(0,full.x+m.e-origin.x),top=Math.max(0,full.y+m.f-origin.y),right=Math.min(bitmap.width,full.r+m.e-origin.x),bottom=Math.min(bitmap.height,full.b+m.f-origin.y),size=(right-left)*(bottom-top)*4;
 if(right<=left||bottom<=top||size>LIMIT)return;
 const candidate=findRecord(s),old=candidate?.base?null:candidate,nextX=left+origin.x-m.e,nextY=top+origin.y-m.f;
 // A sidebar/continuous preview must not evict the main writing surface's
 // higher-resolution ink. Both images refer to the same immutable stroke.
 if(old&&old.scale>m.a)return;
 if(old&&old.scale===m.a&&old.x<=nextX&&old.y<=nextY&&old.x+old.canvas.width>=nextX+right-left&&old.y+old.canvas.height>=nextY+bottom-top){lru.delete(old);lru.set(old,true);return;}
 if(old)remove(old);
 // Keep shared images until LRU pressure. An alias may outlive its source;
 // weak source collection must not invalidate the current visible stroke.
 while((bytes+size>LIMIT||lru.size>=128)&&lru.size)remove(lru.keys().next().value);
 const canvas=document.createElement('canvas');canvas.width=right-left;canvas.height=bottom-top;canvas.getContext('2d').drawImage(bitmap,left,top,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
 const record={ref:new WeakRef(s),canvas,bytes:size,scale:m.a,bounds:full,x:left+origin.x-m.e,y:top+origin.y-m.f};if(Array.isArray(s.points)){record.pointsRef=new WeakRef(s.points);record.visualKey=visualKey(s);let map=byPoints.get(s.points);if(!map){map=new Map();byPoints.set(s.points,map);}map.set(record.visualKey,record);}indexRecord(s,record);lru.set(record,true);bytes+=size;
}
export function clearRasterReuse(){for(const record of [...lru.keys()])remove(record);}
export function rasterReuseBytes(){return bytes;}
export function copyRaster(stroke){const record=findRecord(stroke);if(!record||record.base)return null;const canvas=document.createElement('canvas');canvas.width=record.canvas.width;canvas.height=record.canvas.height;canvas.getContext('2d').drawImage(record.canvas,0,0);return {canvas,x:record.x,y:record.y};}
export function hitReusedRaster(s,a,b,r,scale){
 const record=findRecord(s);if(!record||record.scale!==scale)return null;
 const radius=r*scale+1,left=Math.max(record.bounds.x,Math.min(a[0],b[0])*scale-radius),right=Math.min(record.bounds.r,Math.max(a[0],b[0])*scale+radius),top=Math.max(record.bounds.y,Math.min(a[1],b[1])*scale-radius),bottom=Math.min(record.bounds.b,Math.max(a[1],b[1])*scale+radius);
 if(right<=left||bottom<=top)return false;
 if(left<record.x||top<record.y||right>record.x+record.canvas.width||bottom>record.y+record.canvas.height)return null;
 const base=record.base||record;lru.delete(base);lru.set(base,true);base.alphaTiles??=new Map();record.alphaTiles=base.alphaTiles;
 const firstX=Math.floor(Math.max(0,left-record.x)/128),lastX=Math.floor(Math.min(record.canvas.width-1,right-record.x)/128),firstY=Math.floor(Math.max(0,top-record.y)/128),lastY=Math.floor(Math.min(record.canvas.height-1,bottom-record.y)/128);
 const ax=a[0]*scale,ay=a[1]*scale,bx=b[0]*scale,by=b[1]*scale,dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy;
 for(let ty=firstY;ty<=lastY;ty++)for(let tx=firstX;tx<=lastX;tx++){
  const x=tx*128,y=ty*128,w=Math.min(128,record.canvas.width-x),h=Math.min(128,record.canvas.height-y),vx=record.x+x+w/2-ax,vy=record.y+y+h/2-ay,t=length?Math.max(0,Math.min(1,(vx*dx+vy*dy)/length)):0;
  if(Math.hypot(vx-t*dx,vy-t*dy)>radius+Math.hypot(w,h)/2)continue;
  const key=tx+':'+ty;let alpha=record.alphaTiles.get(key);
  if(!alpha){const rgba=record.canvas.getContext('2d').getImageData(x,y,w,h).data;alpha=new Uint8Array(w*h);for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3];
   if(base.bytes+alpha.length<=LIMIT){record.alphaTiles.set(key,alpha);base.bytes+=alpha.length;bytes+=alpha.length;while(bytes>LIMIT&&lru.size)remove(lru.keys().next().value);}
  }
  if(alphaHitsSweep(alpha,w,h,record.x+x,record.y+y,scale,a,b,r))return true;
 }
 return false;
}
