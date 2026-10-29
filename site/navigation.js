import {hasBlockingPanel} from './panels.js?v=0.23.11';
export function createNavigation(h){
 const v=h.viewport,paper=h.paper,min=.05,max=8,views=new Map(),touches=new Map();let scale=1,mode='width',key=null,pair=null,space=false,pan=null,touchLock=false,safariScale=1,frame=0,documentKey=null,viewPageId=null,wheelFrame=0,wheelZoom=null,pinchFrame=0,pinchPending=null;
 const clamp=x=>Math.max(min,Math.min(max,x));
 const editor=()=>h.page()&&!document.body.classList.contains('library-mode');
 const blocked=()=>!editor()||h.drawing()||hasBlockingPanel();
 const typing=el=>!!el?.closest('input,textarea,select,[contenteditable="true"]');
 const center=()=>{const r=v.getBoundingClientRect();return {x:r.left+v.clientWidth/2,y:r.top+v.clientHeight/2};};
 function base(which){const p=h.page(),pad=h.viewer()?0:16;return Math.max(min,which==='fit'?Math.min((v.clientWidth-pad)/p.width,(v.clientHeight-pad)/p.height):(v.clientWidth-pad)/p.width);}
 function remember(){if(!key||document.hidden||!editor())return;views.set(key,{scale,mode,left:v.scrollLeft,top:v.scrollTop-(h.flow()?.enabled?h.flow().offset(viewPageId):0)});if(views.size>200)views.delete(views.keys().next().value);}
 function report(){const percent=Math.round(scale*100);document.querySelector('#zoomReadout').textContent=percent+'%';document.querySelector('#zoomSlider').value=percent;document.querySelector('#zoomIn').disabled=scale>=max;document.querySelector('#zoomOut').disabled=scale<=min;document.querySelector('#zoomWidth').classList.toggle('active-view',mode==='width');document.querySelector('#zoomFit').classList.toggle('active-view',mode==='fit');paper.dataset.scale=String(scale);window.dispatchEvent(new Event('bangtoan:view'));}
 function size(){const p=h.page();h.flow()?.layout(scale);paper.style.width=p.width*scale+'px';paper.style.height=p.height*scale+'px';report();}
 function anchor(newScale,from=center(),to=from){if(blocked())return false;cancelWheel();const p=h.page(),r=paper.getBoundingClientRect();if(!r.width||!r.height)return false;const q={x:(from.x-r.left)*p.width/r.width,y:(from.y-r.top)*p.height/r.height};h.flow()?.ignoreScroll();scale=clamp(newScale);mode='manual';size();const n=paper.getBoundingClientRect();v.scrollLeft+=n.left+q.x*scale-to.x;v.scrollTop+=n.top+q.y*scale-to.y;remember();return true;}
 function fit(which='width'){if(blocked())return;cancelWheel();h.flow()?.ignoreScroll();mode=which;scale=clamp(base(which));size();v.scrollLeft=0;v.scrollTop=h.flow()?.enabled?h.flow().offset():0;remember();}
 function cancelWheel(){cancelAnimationFrame(wheelFrame);wheelFrame=0;wheelZoom=null;}
 function flushWheel(){const pending=wheelZoom;cancelWheel();if(pending)anchor(pending.scale,pending.from,pending.to);}
 function queueWheel(ratio,point){wheelZoom??={scale,from:point,to:point};const next=clamp(wheelZoom.scale*ratio),r=next/wheelZoom.scale;wheelZoom.to={x:point.x+(wheelZoom.to.x-point.x)*r,y:point.y+(wheelZoom.to.y-point.y)*r};wheelZoom.scale=next;if(!wheelFrame)wheelFrame=requestAnimationFrame(flushWheel);}
 function zoomBy(ratio,point){flushWheel();return anchor(scale*ratio,point||center());}
 function resize(){if(!editor()||h.drawing()||!v.clientWidth||!v.clientHeight)return;if(mode==='manual'){const c=center();anchor(scale,c);}else{const continuous=h.flow()?.enabled,relative=continuous?(v.scrollTop-h.flow().offset()+v.clientHeight/2)/scale:0;h.flow()?.ignoreScroll();scale=clamp(base(mode));size();if(continuous)v.scrollTop=h.flow().offset()+relative*scale-v.clientHeight/2;remember();}}
 function pageChanged(){cancelPinch();cancelWheel();if(!h.page())return;const sameDocument=documentKey===h.documentKey?.();if(sameDocument)remember();const preserve=sameDocument&&h.flow()?.preserving;key=h.key();documentKey=h.documentKey?.();viewPageId=h.page().id;const saved=views.get(key);if(!preserve){if(saved){mode=saved.mode;scale=saved.mode==='manual'?saved.scale:clamp(base(saved.mode));}else if(!sameDocument||!h.flow()?.enabled){mode=h.viewer()?'fit':'width';scale=clamp(base(mode));}}size();if(!preserve){h.flow()?.ignoreScroll();v.scrollLeft=saved?.left||0;v.scrollTop=(h.flow()?.enabled?h.flow().offset():0)+(saved?.top||0)*(h.flow()?.enabled&&saved?scale/saved.scale:1);pair=null;touches.clear();touchLock=false;}remember();}
 function flowChanged(){cancelWheel();views.clear();mode='width';scale=clamp(base(mode));size();v.scrollLeft=0;v.scrollTop=h.flow()?.enabled?h.flow().offset():0;remember();}
 function stop(e){e.preventDefault();e.stopImmediatePropagation();}
 function cursor(){document.body.classList.toggle('temporary-hand',space||!!pan);document.body.classList.toggle('navigation-dragging',!!pan);}
 function capture(id){try{v.setPointerCapture(id);}catch{}}
 function activeTouches(){return [...touches.values()].filter(t=>!t.suppressed);}
 function metrics(list){const a=list[0],b=list[1];return {distance:Math.max(5,Math.hypot(a.x-b.x,a.y-b.y)),x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
 function suppressTouches(){cancelPinch();for(const t of touches.values())t.suppressed=true;pair=null;touchLock=touches.size>0;}
 function flushPinch(){cancelAnimationFrame(pinchFrame);pinchFrame=0;const next=pinchPending;pinchPending=null;if(next&&pair){anchor(scale*next.distance/pair.distance,{x:pair.x,y:pair.y},{x:next.x,y:next.y});pair=next;}}
 function cancelPinch(){cancelAnimationFrame(pinchFrame);pinchFrame=0;pinchPending=null;}
 function touch(e,phase){
  if(!editor())return false;
  if(phase==='down'){
   flushPinch();
   const palm=h.drawing()&&!h.fingerDrawing(),suppressed=h.penRecent()||palm;touches.set(e.pointerId,{id:e.pointerId,x:e.clientX,y:e.clientY,suppressed,palm,startX:e.clientX,startY:e.clientY});
   if(suppressed||h.fingerPan()||touchLock){touchLock=true;capture(e.pointerId);}
   if(activeTouches().length>=2){if(h.fingerDrawing())h.cancelFinger();if(!h.drawing()){touchLock=true;for(const t of touches.values())capture(t.id);pair=metrics(activeTouches());}}
  }else if(phase==='move'){
   const t=touches.get(e.pointerId);if(!t)return false;t.x=e.clientX;t.y=e.clientY;
   // Contacts made during writing stay rejected. A new finger after pen-up
   // may start panning once the grace period ends and movement is deliberate.
   if(t.suppressed&&!t.palm&&!h.penRecent()&&!h.drawing()&&h.fingerPan()&&Math.hypot(t.x-t.startX,t.y-t.startY)>=10){t.suppressed=false;t.previous={x:t.x,y:t.y};}
   if(h.penRecent()&&!h.fingerDrawing()){suppressTouches();}
   const list=activeTouches();if(touchLock&&!blocked()){
    if(list.length>=2){const now=metrics(list);if(pair){pinchPending=now;if(!pinchFrame)pinchFrame=requestAnimationFrame(flushPinch);}else pair=now;}
    else if(list.length===1&&h.fingerPan()&&!t.suppressed){const old=t.previous;if(old){v.scrollLeft-=t.x-old.x;v.scrollTop-=t.y-old.y;remember();}pair=null;}
   }
  }else if(phase==='up'){
   flushPinch();
   const handled=touchLock||touches.get(e.pointerId)?.suppressed;touches.delete(e.pointerId);pair=null;for(const t of touches.values())t.previous={x:t.x,y:t.y};if(!touches.size)touchLock=false;return handled;
  }
  for(const t of touches.values())t.previous={x:t.x,y:t.y};return touchLock||touches.get(e.pointerId)?.suppressed;
 }
 v.addEventListener('pointerdown',e=>{flushWheel();if(!editor())return;if(e.pointerType==='touch'&&h.instrumentPointer?.(e,'down')){capture(e.pointerId);stop(e);return;}if(e.pointerType==='pen'){for(const t of touches.values())t.palm=true;suppressTouches();return;}if(e.pointerType==='touch'){if(touch(e,'down'))stop(e);return;}if((e.button===1||(space&&e.button===0))&&!blocked()){pan={id:e.pointerId,x:e.clientX,y:e.clientY};capture(e.pointerId);cursor();stop(e);}},true);
 v.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&h.instrumentPointer?.(e,'move')){stop(e);return;}if(e.pointerType==='touch'){if(touch(e,'move'))stop(e);return;}if(pan?.id===e.pointerId){v.scrollLeft-=e.clientX-pan.x;v.scrollTop-=e.clientY-pan.y;pan.x=e.clientX;pan.y=e.clientY;remember();stop(e);}},true);
 for(const type of ['pointerup','pointercancel'])v.addEventListener(type,e=>{if(e.pointerType==='touch'&&h.instrumentPointer?.(e,e.type==='pointercancel'?'cancel':'up')){stop(e);return;}if(e.pointerType==='touch'){if(touch(e,'up'))stop(e);return;}if(pan?.id===e.pointerId){pan=null;cursor();stop(e);}},true);
 v.addEventListener('lostpointercapture',e=>{if(e.pointerType==='touch'||touches.has(e.pointerId))touch(e,'up');if(pan?.id===e.pointerId){pan=null;cursor();}},true);
 v.addEventListener('auxclick',e=>{if(e.button===1&&editor())e.preventDefault();});
 v.addEventListener('wheel',e=>{if(!editor())return;if(e.ctrlKey||e.metaKey){e.preventDefault();if(blocked())return;const unit=e.deltaMode===1?16:e.deltaMode===2?v.clientHeight:1,delta=Math.max(-500,Math.min(500,e.deltaY*unit));queueWheel(Math.exp(-delta*.0025),{x:e.clientX,y:e.clientY});}else if(e.shiftKey&&!e.deltaX){e.preventDefault();v.scrollLeft+=e.deltaY*(e.deltaMode===1?16:1);remember();}},{passive:false});
 // Safari's proprietary gesture events are a fallback only; never apply both event streams.
 v.addEventListener('gesturestart',e=>{if(!editor())return;e.preventDefault();safariScale=1;},{passive:false});
 v.addEventListener('gesturechange',e=>{if(!editor())return;e.preventDefault();if(touches.size||blocked())return;const next=Number(e.scale);if(next>0){const c=center();zoomBy(next/safariScale,{x:Number(e.clientX)||c.x,y:Number(e.clientY)||c.y});safariScale=next;}},{passive:false});
 v.addEventListener('gestureend',e=>{if(editor())e.preventDefault();safariScale=1;},{passive:false});
 v.addEventListener('dblclick',e=>{if(editor()&&!blocked()&&h.handTool()){e.preventDefault();if(scale<base('width')*1.1)zoomBy(2,{x:e.clientX,y:e.clientY});else fit('width');}});
 const toolKeys={b:'pen',e:'eraser',h:'highlighter',v:'select',g:'hand',l:'laser',t:'text'};
 document.addEventListener('keydown',e=>{if(!editor()||typing(e.target)||hasBlockingPanel())return;const cmd=e.ctrlKey||e.metaKey;
  if(e.code==='Space'&&!cmd&&!e.altKey){e.preventDefault();space=true;cursor();return;}
  if(['+','=','-','_','Add','Subtract'].includes(e.key)&&!e.altKey){e.preventDefault();if(!blocked())zoomBy(['-','_','Subtract'].includes(e.key)?1/1.2:1.2);return;}
  if(cmd&&['0','1','2'].includes(e.key)){e.preventDefault();if(!blocked())e.key==='0'?fit('width'):e.key==='1'?fit('fit'):anchor(1);return;}
  if(cmd&&['z','y'].includes(e.key.toLowerCase())){e.preventDefault();if(!blocked())document.querySelector(e.key.toLowerCase()==='y'||e.shiftKey?'#redo':'#undo').click();return;}
  if(e.key==='Escape'){pan=null;space=false;cursor();return;}
  if(blocked())return;
  if(!cmd&&!e.altKey&&toolKeys[e.key.toLowerCase()]){e.preventDefault();h.tool(toolKeys[e.key.toLowerCase()]);return;}
  if(!cmd&&!e.altKey&&['PageUp','PageDown'].includes(e.key)){e.preventDefault();document.querySelector(e.key==='PageUp'?'#prev':'#next').click();}
 });
 document.addEventListener('keyup',e=>{if(e.code==='Space'){space=false;cursor();}});
 function suspend(){cancelPinch();cancelWheel();remember();space=false;pan=null;pair=null;touches.clear();touchLock=false;safariScale=1;cursor();}
 function resume(){const saved=views.get(key);space=false;pan=null;pair=null;touches.clear();touchLock=false;safariScale=1;cursor();if(!editor())return;if(saved){scale=saved.scale;mode=saved.mode;}if(mode!=='manual')scale=clamp(base(mode));size();if(saved){h.flow()?.ignoreScroll();v.scrollLeft=saved.left;v.scrollTop=(h.flow()?.enabled?h.flow().offset():0)+saved.top*(h.flow()?.enabled?scale/saved.scale:1);}remember();}
 window.addEventListener('blur',suspend);window.addEventListener('bangtoan:before-document',suspend);
 v.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;remember();window.dispatchEvent(new Event('bangtoan:view'));});},{passive:true});
 document.querySelector('#zoomIn').onclick=()=>zoomBy(1.2);document.querySelector('#zoomOut').onclick=()=>zoomBy(1/1.2);document.querySelector('#zoomWidth').onclick=()=>fit('width');document.querySelector('#zoomFit').onclick=()=>fit('fit');
 document.querySelector('#zoomSlider').oninput=e=>anchor(Number(e.target.value)/100);
 for(const b of document.querySelectorAll('[data-zoom-percent]'))b.onclick=()=>{anchor(Number(b.dataset.zoomPercent)/100);b.closest('details').open=false;};
 for(const b of document.querySelectorAll('[data-view-fit]'))b.onclick=()=>{fit(b.dataset.viewFit);b.closest('details').open=false;};
 return {resize,pageChanged,flowChanged,zoomBy,fit,suspend,resume,get interacting(){return touchLock||!!pan;},get scale(){return scale;}};
}
