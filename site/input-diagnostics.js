import {openPanel} from './panels.js?v=0.23.11';
// Opt-in, memory-only input trace. Numeric event coordinates help distinguish
// input-coordinate faults from rendering faults. No document content or URLs.
export function createInputDiagnostics(h){
 let enabled=false,start=0,rows=[],counts={},seenMoves=new Map(),expired=false,timer;
 const limit=1200;
 function mark(kind,detail={}){
  if(!enabled)return;
  counts[kind]=(counts[kind]||0)+1;
  if(rows.length===limit)rows.shift();
  rows.push({ms:Math.round(performance.now()-start),kind,...detail});
 }
 // Trace outside the canvas as well: overlays or retargeted Pencil contacts
 // must remain visible when they never reach the drawing handlers.
 const tag=el=>el?.tagName?el.tagName+(el.id?'#'+el.id:''):String(el?.nodeName||'window');
 function hit(e){const x=e.clientX,y=e.clientY;return Number.isFinite(x)&&Number.isFinite(y)?(document.elementsFromPoint?.(x,y)||[]).slice(0,5).map(tag):[];}
 function coords(e){const r=h.canvas.getBoundingClientRect();return {x:e.clientX,y:e.clientY,pageX:e.pageX,pageY:e.pageY,offsetX:e.offsetX,offsetY:e.offsetY,pressure:e.pressure,width:innerWidth,visualScale:window.visualViewport?.scale,canvas:{left:r.left,top:r.top,width:r.width,height:r.height}};}
 function zone(e){return e.target===h.canvas?'live':e.target===h.viewport?'viewport':e.target===h.paper?'paper':'other';}
 for(const type of ['pointerdown','pointermove','pointerup','pointercancel','gotpointercapture','lostpointercapture'])window.addEventListener(type,e=>{
  if(!enabled)return;
  if(type==='pointermove'){const n=seenMoves.get(e.pointerId)||0;if(n>=4)return;seenMoves.set(e.pointerId,n+1);}
  if(type==='pointerdown')seenMoves.delete(e.pointerId);
  mark(type,{id:e.pointerId,input:e.pointerType,buttons:e.buttons,zone:zone(e),target:tag(e.target),path:(e.composedPath?.()||[]).slice(0,6).map(tag),hit:hit(e),stamp:e.timeStamp,...coords(e),...h.status()});
  if(type==='pointerup'||type==='pointercancel')seenMoves.delete(e.pointerId);
 },{capture:true,passive:true});
 for(const type of ['touchstart','touchend','touchcancel'])window.addEventListener(type,e=>{
  if(enabled)mark(type,{stamp:e.timeStamp,contacts:Array.from(e.changedTouches||[],t=>({id:t.identifier,input:t.touchType||'unknown',x:t.clientX,y:t.clientY,pageX:t.pageX,pageY:t.pageY,force:t.force})),zone:zone(e),target:tag(e.target)});
 },{capture:true,passive:true});
 document.addEventListener('click',e=>{if(enabled)mark('click',{target:e.target.closest?.('button,summary,input,select')?.id||e.target.tagName,...h.status()});},true);
 let scrollFrame=0;
 window.addEventListener('scroll',e=>{if(!enabled||scrollFrame)return;const target=e.target;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;mark('scroll',{target:tag(target),left:h.viewport.scrollLeft,top:h.viewport.scrollTop,...h.status()});});},{capture:true,passive:true});
 window.addEventListener('error',e=>mark('error',{name:e.error?.name||'Error'}));
 window.addEventListener('blur',()=>mark('blur'));
 document.addEventListener('visibilitychange',()=>mark('visibility',{state:document.visibilityState}));
 const dialog=document.querySelector('#inputCheckDialog'),output=document.querySelector('#inputCheckReport');
 function report(){return JSON.stringify({schema:2,version:document.body.dataset.appVersion,enabled,expired,engine:navigator.userAgent,counts,events:rows},null,2);}
 function stop(){mark('stop');enabled=false;clearTimeout(timer);}
 document.querySelector('#openInputCheck').onclick=()=>{document.querySelector('#shortcutsDialog').close();output.value=report();openPanel(dialog);};
 document.querySelector('#startInputCheck').onclick=()=>{
  clearTimeout(timer);rows=[];counts={};seenMoves.clear();start=performance.now();enabled=true;expired=false;mark('start',h.status());
  timer=setTimeout(()=>{mark('timeout');expired=true;enabled=false;},120000);
  dialog.close();h.toast('Đang kiểm tra trong 2 phút. Thử chấm và bấm nút đến khi gặp lỗi, rồi mở lại Kiểm tra bút → Sao chép báo cáo.');
 };
 document.querySelector('#closeInputCheck').onclick=()=>dialog.close();
 document.querySelector('#copyInputCheck').onclick=()=>{
  stop();output.value=report();output.focus();output.select();output.setSelectionRange(0,output.value.length);
  // Works on the HTTP LAN origin, where navigator.clipboard is unavailable.
  let copied=false;try{copied=document.execCommand('copy');}catch{}
  h.toast(copied?'Đã sao chép báo cáo. Dán vào cuộc trò chuyện.':'Giữ vào ô báo cáo → Chọn tất cả → Sao chép.');
 };
 dialog.addEventListener('close',()=>{output.value='';});
 function measure(kind,fn,detail={}){if(!enabled)return fn();const begin=performance.now();try{return fn();}finally{mark(kind,{durationMs:Math.round((performance.now()-begin)*100)/100,...detail});}}
 return {mark,measure};
}
