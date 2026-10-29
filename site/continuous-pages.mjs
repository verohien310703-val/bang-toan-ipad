// One live paper surface; only nearby inactive sheets retain preview canvases.
export function createContinuousPages(h){
 const v=h.viewport,paper=h.paper,stack=document.createElement('div'),slots=new Map();stack.id='pageStack';v.insertBefore(stack,paper);
 let enabled=true,documentId=null,activeId=null,pages=[],scale=1,fromScroll=false,frame=0,timer=0,rendering=false,generation=0,suspended=false,ignoreUntil=0,scrollPending=false;
 let layoutWidth=-1,visible=new Set();
 const contacts=new Set();try{enabled=localStorage.getItem('bangtoan-continuous-pages')!=='false';}catch{}
 const on=()=>enabled&&!h.viewer();
 function signature(p){return [p.width,p.height,JSON.stringify(p.paper),JSON.stringify(p.background),JSON.stringify(p.cover),...p.strokes];}
 const same=(a,b)=>a&&a.length===b.length&&a.every((v,i)=>v===b[i]);
 function release(s){s.ticket++;if(s.canvas){s.canvas.remove();s.canvas.width=s.canvas.height=1;s.canvas=null;}s.error?.remove();s.error=null;s.signature=null;}
 function offset(id=activeId){return on()?(slots.get(id)?.el.offsetTop||0):0;}
 function sync(data){
  const nextDoc=data.documentId!==documentId,was=activeId,structure=pages.length!==data.pages.length||pages.some((p,i)=>p.id!==data.pages[i].id),previousTop=!nextDoc&&was===data.activeId&&structure?paper.getBoundingClientRect().top:0;
  if(nextDoc){generation++;for(const s of slots.values()){release(s);s.el.remove();}slots.clear();documentId=data.documentId;activeId=null;}
  pages=data.pages;activeId=data.activeId;
  document.body.classList.toggle('continuous-pages',on());stack.hidden=!on();
  if(!on()){if(paper.parentElement!==v)v.insertBefore(paper,stack.nextSibling);for(const s of slots.values())release(s);return;}
  const ids=new Set(pages.map(p=>p.id));for(const [id,s]of slots)if(!ids.has(id)){release(s);s.el.remove();slots.delete(id);}
  for(const [index,p] of pages.entries()){let s=slots.get(p.id);if(!s){const el=document.createElement('div');el.className='sheet-slot';el.dataset.sheetId=p.id;s={el,ticket:0,canvas:null,signature:null};slots.set(p.id,s);}s.page=p;if(s.title!==p.title){s.el.setAttribute('aria-label',p.title);s.title=p.title;}if(stack.children[index]!==s.el)stack.insertBefore(s.el,stack.children[index]||null);}
  if(was!==activeId&&was&&slots.has(was)&&paper.parentElement===slots.get(was).el){const s=slots.get(was);release(s);const c=document.createElement('canvas');c.className='sheet-preview';try{h.snapshot(c);s.el.append(c);s.canvas=c;s.signature=null;}catch{c.width=c.height=1;}}
  const current=slots.get(activeId);if(current){if(current.canvas)release(current);if(paper.parentElement!==current.el)current.el.append(paper);}
  layout(data.scale||scale);if(!nextDoc&&was===activeId&&structure){ignoreScroll();v.scrollTop+=paper.getBoundingClientRect().top-previousTop;}schedule();
 }
 function layout(nextScale){scale=nextScale;if(!on())return;let width=v.clientWidth-16;for(const p of pages){const s=slots.get(p.id);if(!s)continue;const w=p.width*scale,h=p.height*scale,active=p.id===activeId;if(s.width!==w){s.el.style.width=w+'px';s.width=w;}if(s.height!==h){s.el.style.height=h+'px';s.height=h;}if(s.active!==active){s.el.dataset.active=String(active);s.active=active;}width=Math.max(width,w);}if(layoutWidth!==width){stack.style.width=width+'px';layoutWidth=width;}schedule();}
 function ignoreScroll(){ignoreUntil=performance.now()+180;}
 function focus(id=activeId,relativeTop=0,left=0){if(!on())return;ignoreScroll();v.scrollTop=offset(id)+relativeTop;v.scrollLeft=left;schedule();}
 function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;refresh();});}
 function nearby(){const top=v.scrollTop-v.clientHeight,bottom=v.scrollTop+v.clientHeight*2,out=[];for(const p of pages){const s=slots.get(p.id),y=s.el.offsetTop;if(y+p.height*scale>=top&&y<=bottom)out.push(s);}return out.sort((a,b)=>Math.abs(a.el.offsetTop-v.scrollTop)-Math.abs(b.el.offsetTop-v.scrollTop)).slice(0,7);}
 function refresh(){if(!on()||suspended)return;visible=new Set(nearby());for(const s of slots.values())if(!visible.has(s)&&s.page.id!==activeId&&(s.canvas||s.pending))release(s);renderNext(visible);}
 async function renderNext(keep){if(rendering||!on()||suspended)return;let next;for(const s of keep){if(s.page.id!==activeId&&!same(s.signature,signature(s.page))){next=s;break;}}if(!next)return;
  rendering=true;const s=next,ticket=++s.ticket,gen=generation,p=s.page,sig=signature(p),canvas=document.createElement('canvas');canvas.className='sheet-preview';s.pending=true;
  const valid=()=>on()&&!suspended&&gen===generation&&s.ticket===ticket&&p.id!==activeId&&slots.get(p.id)===s&&visible.has(s);
  try{const complete=await h.preview(p,canvas,Math.max(900,Math.ceil(p.width*scale*Math.min(2,window.devicePixelRatio||1))),valid);if(complete!==false&&valid()&&same(sig,signature(s.page))){s.canvas?.remove();if(s.canvas)s.canvas.width=s.canvas.height=1;s.error?.remove();s.error=null;s.canvas=canvas;s.signature=sig;s.el.append(canvas);}}
  catch{if(valid()){s.signature=sig;s.error?.remove();const error=document.createElement('span');error.className='sheet-error';error.textContent='Chạm để mở trang và tải lại bản xem trước';s.el.append(error);s.error=error;}}
  finally{s.pending=false;if(s.canvas!==canvas)canvas.width=canvas.height=1;rendering=false;schedule();}
 }
 function candidate(){let best=null,area=-1;const vr=v.getBoundingClientRect();for(const p of pages){const s=slots.get(p.id),r=s.el.getBoundingClientRect(),visible=Math.max(0,Math.min(r.bottom,vr.bottom)-Math.max(r.top,vr.top));if(visible>area){area=visible;best=p.id;}}return area>0?best:null;}
 function selectVisible(){if(!scrollPending||!on()||suspended||contacts.size||!h.canSelect())return;if(performance.now()<ignoreUntil){clearTimeout(timer);timer=setTimeout(selectVisible,ignoreUntil-performance.now()+20);return;}scrollPending=false;const id=candidate();if(id&&id!==activeId){fromScroll=true;try{h.select(id);}finally{fromScroll=false;}}}
 v.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey){scrollPending=true;clearTimeout(timer);timer=setTimeout(selectVisible,120);}},{passive:true});
 window.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&contacts.has(e.pointerId))scrollPending=true;},true);
 v.addEventListener('scroll',()=>{schedule();if(performance.now()>=ignoreUntil)scrollPending=true;clearTimeout(timer);timer=setTimeout(selectVisible,110);},{passive:true});
 window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&v.contains(e.target))contacts.add(e.pointerId);},true);
 v.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch')contacts.add(e.pointerId);
  const slot=e.target.closest('.sheet-slot');if(!on()||!slot||slot.dataset.sheetId===activeId)return;
  const writing=e.pointerType==='pen'||e.pointerType==='mouse'&&e.button===0&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&h.tool()!=='hand'||e.pointerType==='touch'&&h.fingerWrites();
  if(!writing)return;e.preventDefault();e.stopImmediatePropagation();if(!h.canSelect()){h.waitNotice();return;}
  scrollPending=false;fromScroll=true;let ok;try{ok=h.select(slot.dataset.sheetId);}finally{fromScroll=false;}if(ok)h.begin(e);
 },true);
 for(const type of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(type,e=>{contacts.delete(e.pointerId);clearTimeout(timer);timer=setTimeout(selectVisible,120);},true);
 for(const type of ['touchstart','touchend'])stack.addEventListener(type,e=>{if(!paper.contains(e.target)){h.contact?.(e);if(e.touches.length<2&&e.cancelable)e.preventDefault();}},{passive:false});
 let pull=null,wheelPull=0,lastWheel=0,adding=false;
 const hint=document.createElement('div');hint.id='pullAddHint';hint.textContent='Kéo thêm để thêm trang';hint.hidden=true;v.append(hint);
 const atEnd=()=>v.scrollTop+v.clientHeight>=stack.offsetHeight+12;
 function showPull(distance){hint.hidden=distance<8;hint.textContent=distance>=85?'Thả để thêm trang':'Kéo thêm để thêm trang';}
 function addLast(){if(adding||!on()||!h.canSelect()||h.readOnly?.())return;adding=true;hint.hidden=true;h.addLast?.();setTimeout(()=>adding=false,700);}
 window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&v.contains(e.target)&&atEnd()&&!h.fingerWrites())pull={id:e.pointerId,y:e.clientY,distance:0};},true);
 window.addEventListener('pointermove',e=>{if(pull?.id===e.pointerId){pull.distance=Math.max(0,pull.y-e.clientY);showPull(pull.distance);}},true);
 window.addEventListener('pointerup',e=>{if(pull?.id===e.pointerId){const ready=pull.distance>=85;pull=null;hint.hidden=true;if(ready)addLast();}},true);
 window.addEventListener('pointercancel',()=>{pull=null;hint.hidden=true;},true);
 v.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey||e.deltaY<=0||!atEnd()){wheelPull=0;return;}const now=performance.now();wheelPull=now-lastWheel<450?wheelPull+e.deltaY:0;lastWheel=now;showPull(wheelPull);if(wheelPull>180){wheelPull=0;addLast();}},{passive:true});
 function suspend(){suspended=true;generation++;contacts.clear();clearTimeout(timer);}
 function resume(){suspended=false;schedule();}
 window.addEventListener('bangtoan:suspend',suspend);window.addEventListener('bangtoan:resume',resume);window.addEventListener('bangtoan:home',suspend);window.addEventListener('bangtoan:editor',resume);
 return {sync,layout,focus,offset,schedule,ignoreScroll,get enabled(){return on();},get preserving(){return fromScroll;},setEnabled(value){enabled=!!value;try{localStorage.setItem('bangtoan-continuous-pages',String(enabled));}catch{}h.rebuild();}};
}
