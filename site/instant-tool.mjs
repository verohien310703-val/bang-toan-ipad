// Switch immediately, but do not rebuild/hide the current tool's panel while
// Pencil is still down. Each pointer contact owns exactly one activation.
const installed=new WeakSet();
export function instantTool(button,shouldSwitch,ready){
 if(installed.has(button))return;
 installed.add(button);
 let handled=false,dispatching=false,contact=null;
 const activate=()=>{dispatching=true;try{button.click();}finally{dispatching=false;}};
 button.dataset.pencilTool='true';
 button.addEventListener('pointerdown',e=>{
  // A fresh down also recovers if WebKit omitted the previous up/cancel.
  contact=null;handled=false;const switching=shouldSwitch();
  if(e.button!==0||e.isPrimary===false||!ready()||e.pointerType!=='pen'&&!switching)return;
  handled=true;e.preventDefault();
  contact={id:e.pointerId,x:e.clientX??0,y:e.clientY??0,immediate:switching};
  if(switching)activate();
 });
 button.addEventListener('pointerup',e=>{
  if(!contact||contact.id!==e.pointerId)return;
  const pending=contact;contact=null;e.preventDefault();
  if(!pending.immediate&&ready()&&Math.hypot((e.clientX??0)-pending.x,(e.clientY??0)-pending.y)<10)activate();
 });
 const cancel=e=>{if(contact?.id===e.pointerId)contact=null;};
 button.addEventListener('pointercancel',cancel);
 button.addEventListener('lostpointercapture',cancel);
 button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){handled=false;contact=null;}});
 button.addEventListener('click',e=>{
  // WebKit can emit a trusted Pencil click with detail=0. Keyboard activation
  // is released by keydown; deliberate programmatic clicks still work.
  if(handled&&!dispatching&&(e.isTrusted||e.detail!==0)){e.preventDefault();e.stopImmediatePropagation();}
 },true);
}
