import {visibleStrokeHit} from './visible-stroke-hit.mjs?v=0.23.11';
import {createTiledEraser} from './tiled-eraser.mjs?v=0.23.11';
import {capsule} from './erase-mask.mjs?v=0.23.11';
import {strokeHitsSweep} from './fast-stroke-eraser.mjs?v=0.23.11';
export function createErasePreviewReceiver(h){
 let active=null,timer=null,frame=null,queue=[],ignored=null;
 function reset(repaint=true){const dirty=!!active;active?.tiled?.destroy();active=null;queue=[];clearTimeout(timer);cancelAnimationFrame(frame);frame=null;if(dirty&&repaint)h.paint();return dirty;}
 function stop(reason){h.trace?.({phase:reason});const id=active?.id;reset();ignored=id;}
 function draw(){frame=null;if(!active)return;if(!h.ready()||h.page()?.id!==active.pageId){stop('busy');return;}
  const started=performance.now(),a=active,warmup=!a.started,removedBefore=a.removed.size;let processed=0,newSources=0,checked=0;a.started=true;
  try{while((queue.length||a.scan)&&processed<8){
   if(a.mode==='stroke'){
    if(!a.scan){const point=queue.shift();a.scan={point,from:a.last||point,index:0};}
    while(a.scan.index<a.strokes.length){const s=a.strokes[a.scan.index++];checked++;if(!a.removed.has(s.id)&&strokeHitsSweep(s,a.scan.from,a.scan.point,a.radius,(s,x,y,r)=>visibleStrokeHit(s,x,y,r,h.canvas().getContext('2d').getTransform().a||1)))a.removed.add(s.id);if(performance.now()-started>=8||checked>=256)break;}
    if(a.scan.index===a.strokes.length){a.last=a.scan.point;a.scan=null;processed++;}
    if(performance.now()-started>=8||checked>=256)break;continue;
   }
   const batch=!warmup&&a.tiled?.applyBatch?Math.min(4,8-processed,queue.length):1,polygons=[];
   for(let i=0;i<batch;i++){const point=queue.shift();polygons.push(capsule(a.last||point,point,a.radius));a.last=point;processed++;}
   if(a.mode==='partial'){a.tiled??=createTiledEraser({canvas:h.canvas(),page:h.page(),strokes:a.strokes,changes:new Map()});const before=a.tiled.vectorRenders||0;if(batch>1)a.tiled.applyBatch(polygons);else a.tiled.apply(polygons[0]);newSources+=(a.tiled.vectorRenders||0)-before;}
   // Yield between points. A single native Canvas call cannot be interrupted.
   if(performance.now()-started>=8)break;
  }if(a.mode==='stroke'&&a.removed.size!==removedBefore){a.tiled??=createTiledEraser({canvas:h.canvas(),page:h.page(),strokes:a.strokes,changes:new Map()});const before=a.tiled.vectorRenders||0;if(a.tiled.hideStrokes)a.tiled.hideStrokes(a.removed);else h.paint(a.removed);newSources+=(a.tiled.vectorRenders||0)-before;}
  const durationMs=performance.now()-started;
  const preparing=warmup||(newSources>0&&(a.extraWarmups||0)<2);
  if(!warmup&&preparing)a.extraWarmups=(a.extraWarmups||0)+1;
  h.frame?.({durationMs,warmup,preparing,newSources,processed,pending:queue.length+(a.scan?1:0)});
  // Source rasters are created only on demand. Do not judge their first build
  // by the steady-state frame budget; still retain a hard startup ceiling.
  a.slowFrames=!preparing&&durationMs>40?(a.slowFrames||0)+1:0;
  if(durationMs>(preparing?1000:250)||a.slowFrames>=3){stop('slow');h.slow?.();return;}
  if(queue.length||a.scan)frame=requestAnimationFrame(draw);
  }catch{stop('error');}
 }
 return {receive(m){
  if(m.id===ignored)return;
  if(!h.ready()||m.documentId!==h.documentId()||m.revision!==h.revision()||m.pageId!==h.page()?.id){h.trace?.({phase:'notReady'});return;}
  if(!active||active.id!==m.id){reset();if(m.seq!==0){h.trace?.({phase:'missingStart'});ignored=m.id;return;}h.trace?.({phase:'receiving'});ignored=null;active={id:m.id,pageId:m.pageId,seq:0,mode:m.mode,radius:m.radius,strokes:h.page().strokes.slice(),removed:new Set()};}
  if(m.seq!==active.seq++||m.mode!==active.mode||m.radius!==active.radius||queue.length+(active.scan?1:0)+m.points.length>128){stop('gapOrOverflow');return;}
  queue.push(...m.points);clearTimeout(timer);timer=setTimeout(()=>{stop('expired');},2000);if(!frame)frame=requestAnimationFrame(draw);
 },end(id){if(active&&(!id||active.id===id))reset();if(ignored===id)ignored=null;},reset};
}
