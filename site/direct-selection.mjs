import {mapErased,mapEndpointErased} from './erase-mask.mjs?v=0.23.11';
import {shapeBounds,transformVectorItems} from './shape-geometry.mjs?v=0.23.11';
export function selectionBox(items){const bs=items.map(shapeBounds);if(!bs.length)return null;const x=Math.min(...bs.map(b=>b.x)),y=Math.min(...bs.map(b=>b.y));return {x,y,w:Math.max(...bs.map(b=>b.x+b.w))-x,h:Math.max(...bs.map(b=>b.y+b.h))-y};}
export function selectionHandles(items,scale=1){
 const box=selectionBox(items);if(!box)return [];
 if(items.length===1&&['line','arrow'].includes(items[0].kind))return items[0].points.slice(0,2).map((p,i)=>({key:'end'+i,type:'endpoint',x:p[0],y:p[1],index:i}));
 const {x,y,w,h}=box,handles=[['nw',x,y],['n',x+w/2,y],['ne',x+w,y],['e',x+w,y+h/2],['se',x+w,y+h],['s',x+w/2,y+h],['sw',x,y+h],['w',x,y+h/2]].map(([key,x,y])=>({key,type:key.length===2?'corner':'edge',x,y}));
 handles.push({key:'rotate',type:'rotate',x:x+w/2,y:y>=32/scale?y-28/scale:y+Math.min(h/2,28/scale)});return handles;
}
export function hitSelectionHandle(items,p,scale=1){return selectionHandles(items,scale).map(h=>({...h,d:Math.hypot(p[0]-h.x,p[1]-h.y)*scale})).filter(h=>h.d<=13).sort((a,b)=>a.d-b.d)[0]||null;}
export function paintSelection(ctx,items,scale=1){
 const box=selectionBox(items);if(!box)return;
 ctx.save();ctx.strokeStyle='#3577d5';ctx.fillStyle='white';ctx.lineWidth=1.3/scale;ctx.setLineDash([5/scale,3/scale]);
 if(!(items.length===1&&['line','arrow'].includes(items[0].kind)))ctx.strokeRect(box.x,box.y,box.w,box.h);
 ctx.setLineDash([]);for(const h of selectionHandles(items,scale)){
  if(h.type==='rotate'){ctx.beginPath();ctx.moveTo(h.x,box.y);ctx.lineTo(h.x,h.y);ctx.stroke();}
  ctx.beginPath();ctx.arc(h.x,h.y,(h.type==='rotate'?7:5.5)/scale,0,Math.PI*2);ctx.fill();ctx.stroke();
  if(h.type==='rotate'){ctx.fillStyle='#3577d5';ctx.beginPath();ctx.arc(h.x,h.y,2/scale,0,Math.PI*2);ctx.fill();ctx.fillStyle='white';}
 }ctx.restore();
}
export function dragSelection(items,handle,start,p,page){
 const box=selectionBox(items),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 if(handle.type==='endpoint')return items.map((s,i)=>{if(i)return s;const points=s.points.map((q,j)=>j===handle.index?[clamp(p[0],0,page.width),clamp(p[1],0,page.height),q[2]]:q.slice());return {...s,...mapEndpointErased(s,points),points};});
 if(handle.type==='move'){
  const dx=clamp(p[0]-start[0],-box.x,page.width-box.x-box.w),dy=clamp(p[1]-start[1],-box.y,page.height-box.y-box.h);
  return items.map(s=>({...s,...mapErased(s,p=>[p[0]+dx,p[1]+dy]),points:s.points.map(q=>[q[0]+dx,q[1]+dy,q[2]])}));
 }
 if(handle.type==='rotate'){
  const cx=box.x+box.w/2,cy=box.y+box.h/2;let angle=(Math.atan2(p[1]-cy,p[0]-cx)-Math.atan2(start[1]-cy,start[0]-cx))*180/Math.PI;while(angle>180)angle-=360;while(angle< -180)angle+=360;
  return transformVectorItems(items,{angle,width:page.width,height:page.height});
 }
 const west=handle.key.includes('w'),east=handle.key.includes('e'),north=handle.key.includes('n'),south=handle.key.includes('s'),ax=west?box.x+box.w:box.x,ay=north?box.y+box.h:box.y;
 let sx=west||east?clamp((p[0]-ax)*(west?-1:1)/Math.max(1,box.w),.1,3):1,sy=north||south?clamp((p[1]-ay)*(north?-1:1)/Math.max(1,box.h),.1,3):1;
 if(handle.type==='corner')sx=sy=Math.max(sx,sy);
 const maxX=(west?ax:page.width-ax)/Math.max(1,box.w),maxY=(north?ay:page.height-ay)/Math.max(1,box.h);
 if(handle.type==='corner')sx=sy=Math.min(sx,maxX,maxY);else{if(west||east)sx=Math.min(sx,maxX);if(north||south)sy=Math.min(sy,maxY);}
 const result=transformVectorItems(items,{scaleX:sx,scaleY:sy,width:page.width,height:page.height}),next=selectionBox(result),x=west?ax-box.w*sx:box.x,y=north?ay-box.h*sy:box.y;
 return result.map(s=>({...s,...mapErased(s,p=>[p[0]+x-next.x,p[1]+y-next.y]),points:s.points.map(q=>[q[0]+x-next.x,q[1]+y-next.y,q[2]])}));
}
