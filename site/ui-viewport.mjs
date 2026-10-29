// Fixed panels use the visible viewport when the on-screen keyboard is open.
// Ignore browser magnification here; the viewport guard handles it separately.
export function visibleBounds(w=window){
 const v=w.visualViewport,use=v&&Math.abs(v.scale-1)<.015;
 const left=use?Math.max(0,v.offsetLeft||0):0,top=use?Math.max(0,v.offsetTop||0):0;
 const width=use?Math.min(w.innerWidth,v.width):w.innerWidth,height=use?Math.min(w.innerHeight,v.height):w.innerHeight;
 return {left,top,width,height,right:left+width,bottom:top+height};
}
export function syncVisibleBounds(){
 const b=visibleBounds(),root=document.documentElement,tools=document.querySelector('#tools');let changed=false;
 const values={'--app-visible-height':b.height,'--app-visible-width':b.width,'--app-visible-top':b.top,'--app-visible-left':b.left,'--app-tools-bottom':tools?.getBoundingClientRect().bottom||106};
 for(const [key,value]of Object.entries(values)){const text=Math.round(value*100)/100+'px';if(root.style.getPropertyValue(key)!==text){root.style.setProperty(key,text);changed=true;}}
 if(changed)window.dispatchEvent(new Event('bangtoan:viewport'));
 return b;
}
