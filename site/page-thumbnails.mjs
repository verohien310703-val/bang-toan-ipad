// Small, sequential previews. Metadata/order changes keep existing ink images.
export function createPageThumbnails({render,open,paused=()=>false}){
 const records=new Map();let frame=0,running=false;
 const signature=p=>[p.width,p.height,JSON.stringify(p.paper),JSON.stringify(p.background),JSON.stringify(p.cover),...p.strokes];
 const same=(a,b)=>a&&a.length===b.length&&a.every((v,i)=>v===b[i]);
 function schedule(){if(!frame&&!running&&open())frame=requestAnimationFrame(run);}
 async function run(){frame=0;if(running||!open())return;if(paused()){schedule();return;}
  const next=[...records.values()].find(r=>r.dirty&&r.target.isConnected);if(!next)return;
  running=true;next.dirty=false;const target=next.target,page=next.page,sig=next.signature,c=document.createElement('canvas');
  const valid=()=>open()&&!paused()&&records.get(page.id)===next&&next.target===target&&same(next.signature,sig)&&target.isConnected;
  try{const complete=await render(page,c,valid);if(complete!==false&&valid()){const ctx=target.getContext('2d');ctx.clearRect(0,0,target.width,target.height);const scale=Math.min(target.width/c.width,target.height/c.height);ctx.drawImage(c,(target.width-c.width*scale)/2,(target.height-c.height*scale)/2,c.width*scale,c.height*scale);}else if(records.get(page.id)===next)next.dirty=true;}
  catch{if(records.get(page.id)===next)next.signature=null;}
  finally{c.width=c.height=1;running=false;schedule();}
 }
 return {request(page,target){let r=records.get(page.id);const sig=signature(page);if(!r){r={};records.set(page.id,r);}if(r.target!==target||!same(r.signature,sig)){r.dirty=true;r.signature=sig;}r.page=page;r.target=target;schedule();},prune(ids){for(const id of records.keys())if(!ids.has(id))records.delete(id);},get pending(){return [...records.values()].filter(r=>r.dirty).length;}};
}
