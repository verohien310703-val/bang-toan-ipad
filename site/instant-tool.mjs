// Switch on contact, without waiting for Safari's compatibility click.
// A tap on the current tool retains its existing panel behavior.
export function instantTool(button,shouldSwitch,ready){
 let handled=false,dispatching=false;
 button.dataset.pencilTool='true';
 button.addEventListener('pointerdown',e=>{
  handled=false;
  if(e.button!==0||e.isPrimary===false||!ready()||e.pointerType!=='pen'&&!shouldSwitch())return;
  handled=true;e.preventDefault();
  dispatching=true;try{button.click();}finally{dispatching=false;}
 });
 button.addEventListener('click',e=>{
  if(handled&&!dispatching&&e.detail!==0){handled=false;e.preventDefault();e.stopImmediatePropagation();}
 },true);
}
