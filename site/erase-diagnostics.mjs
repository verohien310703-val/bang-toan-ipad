// Small rate-limited performance notices; no coordinates, ids or lesson content.
export function createEraseDiagnostics(send){
 let pending=new Map(),timer=null;
 function flush(){timer=null;const next=pending.entries().next().value;if(next){pending.delete(next[0]);send({type:'eraseDiagnostic',event:next[1]});}if(pending.size)timer=setTimeout(flush,250);}
 return {note(event){const key=event.stage+':'+event.phase,previous=pending.get(key);pending.set(key,{...event,...(Number.isFinite(event.durationMs)?{durationMs:Math.max(event.durationMs,previous?.durationMs||0)}:{})});if(pending.size>16)pending.delete(pending.keys().next().value);if(!timer)timer=setTimeout(flush,250);},clear(){pending.clear();clearTimeout(timer);timer=null;}};
}
