import {drawStroke} from './ink.js?v=0.23.11';
import {drawReusedRaster,rememberRaster,rasterReuseBytes} from './raster-reuse.mjs?v=0.23.11';
let worker=null,workerReady=false,workerTimer=0,generation=0,sequence=0,active=null,disabled=false;const queue=[];
const stats={workerRenders:0,cacheHits:0,synchronous:0,workerFailures:0,cancelled:0};
function available(){return !disabled&&typeof Worker!=='undefined'&&typeof OffscreenCanvas!=='undefined'&&typeof OffscreenCanvas.prototype.transferToImageBitmap==='function';}
function failWorker(){disabled=true;generation++;clearTimeout(workerTimer);worker?.terminate();worker=null;workerReady=false;const jobs=[active,...queue.splice(0)].filter(Boolean);active=null;for(const job of jobs)job.reject(Error('Ink worker unavailable'));}
function postActive(){clearTimeout(workerTimer);workerTimer=setTimeout(failWorker,30000);worker.postMessage(active.message);}
function cancelObsolete(){if(active&&!active.valid()){stats.cancelled++;generation++;clearTimeout(workerTimer);worker?.terminate();worker=null;workerReady=false;active.resolve(false);active=null;}}
function pump(){
 cancelObsolete();if(active)return;
 for(let i=queue.length-1;i>=0;i--)if(!queue[i].valid()){queue[i].resolve(false);queue.splice(i,1);}
 if(!queue.length)return;queue.sort((a,b)=>a.priority-b.priority||a.id-b.id);active=queue.shift();
 if(active.tryCache()){stats.cacheHits++;active.resolve({cached:true});active=null;setTimeout(pump,0);return;}
 try{
  if(!worker){const gen=++generation;workerReady=false;worker=new Worker(new URL('./ink-raster-worker.mjs?v=0.23.11',import.meta.url),{type:'module'});
   workerTimer=setTimeout(failWorker,15000);
   worker.onmessage=({data:m})=>{if(gen!==generation){m.bitmap?.close();m.bodyBitmap?.close();return;}if(m.ready){workerReady=true;if(active)postActive();return;}clearTimeout(workerTimer);const job=active;active=null;if(!job||job.id!==m.id){m.bitmap?.close();m.bodyBitmap?.close();return;}if(m.error)job.reject(Error(m.error));else job.resolve(m);setTimeout(pump,0);};
   worker.onerror=()=>{if(gen===generation)failWorker();};
  }
  if(workerReady)postActive();
 }catch{failWorker();}
}
// Returns null for an immediate draw, or a promise while a cold image is built.
// Drawing/erasing live still uses the original synchronous path.
export function drawPreparedInk(ctx,s,{downsample=false,priority=0,valid=()=>true}={}){
 if(!valid())return null;
 if(drawReusedRaster(ctx,s,downsample)){stats.cacheHits++;return null;}
 const m=ctx.getTransform?.();
 if(!available()||s.penEnded!==true||(s.kind||'ink')!=='ink'||![23,24].includes(s.penModel)||s.dashed||s.dotted||!m||m.a!==m.d||m.b||m.c||m.a<=0||!Number.isInteger(m.e)||!Number.isInteger(m.f)){stats.synchronous++;drawStroke(ctx,s,{downsample});return null;}
 const id=++sequence,message={id,stroke:s,width:ctx.canvas.width,height:ctx.canvas.height,scale:m.a,e:m.e,f:m.f};
 return new Promise((resolve,reject)=>{queue.push({id,message,priority,valid,resolve,reject,tryCache:()=>valid()&&drawReusedRaster(ctx,s,downsample)});pump();}).then(result=>{
  if(!result||result.empty||result.cached)return;if(!valid()){result.bitmap?.close();result.bodyBitmap?.close();return;}
  const {bitmap,x,y}=result;stats.workerRenders++;try{if(result.bodyBitmap){const {erasePolygons,...body}=s,c=document.createElement('canvas');c.width=result.bodyBitmap.width;c.height=result.bodyBitmap.height;c.getContext('2d').drawImage(result.bodyBitmap,0,0);rememberRaster(ctx,body,c,{x:result.bodyX,y:result.bodyY});c.width=c.height=1;}const c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;c.getContext('2d').drawImage(bitmap,0,0);rememberRaster(ctx,s,c,{x,y});ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.drawImage(bitmap,x,y);ctx.restore();c.width=c.height=1;}finally{bitmap.close();result.bodyBitmap?.close();}
 }).catch(()=>{stats.workerFailures++;if(valid())drawStroke(ctx,s,{downsample});});
}
export function cancelObsoleteInk(){cancelObsolete();queueMicrotask(pump);}
export function preparedInkStats(){return {...stats,rasterBytes:rasterReuseBytes(),available:available()};}
