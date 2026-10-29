// Ephemeral only: no outbox, undo, asset, or disk writes.
export function createErasePreviewSender({send,canSend,context,trace=()=>{}}){
 let current=null,timer=null,blocked=null;
 function finish(id){if(id&&current&&id!==current.id)return;if(current){send({type:'erasePreviewEnd',id:current.id});current=null;}clearTimeout(timer);timer=null;if(!id||blocked===id)blocked=null;}
 function abandon(reason){trace({phase:reason});const id=current?.id;finish();blocked=id;}
 function flush(){timer=null;if(!current)return;if(!canSend()){abandon('backpressure');return;}
  const points=current.points.length?current.points.splice(0):[current.last];
  if(!send({...current.metadata,type:'erasePreview',id:current.id,seq:current.seq++,points})){abandon('backpressure');return;}
  if(current.seq===1)trace({phase:'sending',points:points.length});
  timer=setTimeout(flush,500);
 }
 return {add({id,pageId,mode,radius,point}){
  if(blocked===id)return;
  if(current?.id!==id){finish();if(!canSend()){trace({phase:'blocked'});blocked=id;return;}current={id,seq:0,points:[],last:point,metadata:{...context(),pageId,mode:mode==='stroke'?'stroke':'partial',radius}};}
  if(current.points.length>=64){abandon('overflow');return;}
  current.points.push(point.slice(0,2));current.last=point.slice(0,2);
  // Every batch is delayed 50 ms; never accelerate the stream on pointermove.
  if(current.points.length===1){clearTimeout(timer);timer=setTimeout(flush,50);}
 },finish};
}
