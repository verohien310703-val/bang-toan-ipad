// Pointer cancellation alone does not cancel WebKit's native touch gestures.
// Cover Pencil taps on the toolbar too, before the next contact reaches paper.
// Tool buttons activate through PointerEvents; no ink is synthesized here.
export function installPencilToolGuard(root,mark=()=>{}){
 const guard=e=>{
  if(!e.target.closest?.('[data-pencil-tool]'))return;
  const contacts=Array.from(e.changedTouches||[]);
  if(!contacts.some(t=>t.touchType==='stylus')||!e.cancelable)return;
  e.preventDefault();
  mark('pencilToolGuard',{phase:e.type,prevented:e.defaultPrevented});
 };
 for(const type of ['touchstart','touchend'])root.addEventListener(type,guard,{capture:true,passive:false});
}
