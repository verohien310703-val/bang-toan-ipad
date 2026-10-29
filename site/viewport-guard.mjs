import {syncVisibleBounds} from './ui-viewport.mjs?v=0.23.11';
// Browser magnification and document zoom are separate. Never fit the paper
// as a workaround for a magnified application shell.
export const APP_VIEWPORT='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
export function needsViewportReset(scale){return Number.isFinite(scale)&&scale>1.015;}
export function installViewportGuard({onSuspend=()=>{},onResume=()=>{}}={}){
 const meta=document.querySelector('meta[name="viewport"]');if(!meta)return;
 let pending=false,suspended=false,timer=0,followup=0,raf=0,generation=0;
 const typing=()=>document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
 const touchDevice=()=>navigator.maxTouchPoints>0;
 meta.content=APP_VIEWPORT;syncVisibleBounds();
 function cancel(){clearTimeout(timer);clearTimeout(followup);cancelAnimationFrame(raf);generation++;if(meta.content!==APP_VIEWPORT)meta.content=APP_VIEWPORT;}
 function suspend(){if(suspended)return;cancel();pending=true;suspended=true;onSuspend();window.dispatchEvent(new Event('bangtoan:suspend'));}
 function restore(){
  if(document.hidden)return;clearTimeout(timer);cancelAnimationFrame(raf);const run=++generation;
  syncVisibleBounds();const zoomed=needsViewportReset(window.visualViewport?.scale)&&touchDevice();
  if(!pending&&!zoomed)return;
  if(zoomed){if(pending&&typing())document.activeElement.blur();meta.content=APP_VIEWPORT.replaceAll('scale=1','scale=1.0001');}
  raf=requestAnimationFrame(()=>{
   if(run!==generation||document.hidden)return;
   if(zoomed)meta.content=APP_VIEWPORT;
   raf=requestAnimationFrame(()=>{if(run!==generation||document.hidden)return;syncVisibleBounds();pending=false;suspended=false;onResume();window.dispatchEvent(new Event('bangtoan:resume'));});
  });
 }
 function schedule(delay=80){clearTimeout(timer);timer=setTimeout(restore,delay);}
 function resume(){if(document.hidden)return;pending=true;syncVisibleBounds();schedule();clearTimeout(followup);followup=setTimeout(restore,300);}
 document.addEventListener('visibilitychange',()=>document.hidden?suspend():resume());
 window.addEventListener('pagehide',suspend);window.addEventListener('pageshow',resume);
 window.addEventListener('blur',suspend);
 window.addEventListener('focus',()=>{if(suspended||pending||needsViewportReset(window.visualViewport?.scale)&&!typing())resume();});
 function viewportChanged(){if(document.hidden)return;syncVisibleBounds();if(pending)schedule();}
 window.addEventListener('resize',viewportChanged);
 window.visualViewport?.addEventListener('resize',viewportChanged,{passive:true});
 window.visualViewport?.addEventListener('scroll',viewportChanged,{passive:true});
 function rotate(){suspend();resume();}
 window.addEventListener('orientationchange',rotate);window.screen?.orientation?.addEventListener('change',rotate);
 // Pointer handlers still receive two fingers and zoom the paper themselves.
 for(const type of ['touchstart','touchmove'])document.addEventListener(type,e=>{
  if(e.target.closest?.('#paper')&&e.touches.length>1&&e.cancelable)e.preventDefault();
 },{capture:true,passive:false});
 return {resume};
}
