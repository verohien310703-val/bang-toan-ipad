import {pointBounds} from './point-bounds.mjs?v=0.23.11';
import {directionalBody} from './fountain-direction.mjs?v=0.23.11';
import {calibratedBody} from './pen-calibration.mjs?v=0.23.11';
import {fountainWidth,fountainNib} from './fountain-response.mjs?v=0.23.11';
import {mapErased} from './erase-mask.mjs?v=0.23.11';
export function effectivePenSize(stroke){
 if([14,15,16,17,18,19,20,21,22,23].includes(stroke.penModel))return stroke.size;
 if(stroke.penModel>=5&&stroke.penStyle==='fountain'&&!stroke.dashed&&!stroke.dotted){let total=0,length=0;const t=stroke.penTuning||{};for(let i=1;i<stroke.points.length;i++){const a=stroke.points[i-1],b=stroke.points[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]),speed=stroke.penSpeeds?((stroke.penSpeeds[i]||0)+(stroke.penSpeeds[i-1]||0))/2:.5;total+=d*directionalBody((a[2]+b[2])/2,t.sensitivity??.5,Math.atan2(b[1]-a[1],b[0]-a[0])-Math.PI/4,t.flatness??.33,speed);length+=d;}return Math.max(.5,Math.min(40,stroke.size*(length?total/length:1)));}
 if(stroke.penModel===4&&['fountain','brush'].includes(stroke.penStyle)&&!stroke.dashed&&!stroke.dotted){let total=0,length=0;const t=stroke.penTuning||{};for(let i=1;i<stroke.points.length;i++){const a=stroke.points[i-1],b=stroke.points[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]),speed=stroke.penSpeeds?((stroke.penSpeeds[i]||0)+(stroke.penSpeeds[i-1]||0))/2:.5;total+=d*calibratedBody((a[2]+b[2])/2,t.sensitivity??.5,stroke.penStyle==='brush',Math.atan2(b[1]-a[1],b[0]-a[0])-Math.PI/4,t.flatness??.33,speed);length+=d;}return Math.max(.5,Math.min(40,stroke.size*(length?total/length:1)));}
 if(stroke.penStyle!=='fountain'||stroke.dashed||stroke.dotted)return stroke.size;if(stroke.penModel>=1){const t=stroke.penTuning||{},minor=1-.6*(t.flatness??.33);let total=0,length=0;for(let i=1;i<stroke.points.length;i++){const a=stroke.points[i-1],b=stroke.points[i],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)+Math.PI/4,p=(a[2]+b[2])/2,nib=Math.sqrt(Math.cos(angle)**2+minor*minor*Math.sin(angle)**2)/Math.sqrt(minor);total+=d*(stroke.penModel===3?fountainWidth(p,t.sensitivity??.5)*fountainNib(angle-Math.PI/2,t.flatness??.33)/(1+.22*Math.min(3,((stroke.penSpeeds?.[i]||0)+(stroke.penSpeeds?.[i-1]||0))/2)):Math.max(.3,Math.min(1.7,1+(p-.5)*2*(t.sensitivity??.5)))*nib);length+=d;}return Math.max(.5,Math.min(40,stroke.size*(length?total/length:1)));}
 let sum=0,length=0;for(let i=1;i<stroke.points.length;i++){
  const a=stroke.points[i-1],b=stroke.points[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);sum+=d*(a[2]+b[2])/2;length+=d;
 }
 const pressure=length?sum/length:(stroke.points[0]?.[2]??.5);
 return Math.max(.5,Math.min(40,stroke.size*(.35+.65*pressure)));
}
export function ellipseFrame(s){
 const p=s.points;
 if(s.ellipseAxes){const center=[(p[0][0]+p[2][0])/2,(p[0][1]+p[2][1])/2];return {center,u:[p[0][0]-center[0],p[0][1]-center[1]],v:[p[1][0]-center[0],p[1][1]-center[1]]};}
 return {center:[(p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2],u:[Math.abs(p[1][0]-p[0][0])/2,0],v:[0,Math.abs(p[1][1]-p[0][1])/2]};
}
export function shapeBounds(s){
 if(s.kind==='ellipse'&&s.ellipseAxes){const {center:c,u,v}=ellipseFrame(s),rx=Math.hypot(u[0],v[0]),ry=Math.hypot(u[1],v[1]);return {x:c[0]-rx,y:c[1]-ry,w:rx*2,h:ry*2};}
 return pointBounds(s);
}
export function transformVectorItems(items,{angle=0,scaleX=1,scaleY=1,width=5000,height=10000}={}){
 if(!items.length||![angle,scaleX,scaleY,width,height].every(Number.isFinite)||scaleX<.1||scaleX>3||scaleY<.1||scaleY>3||angle< -180||angle>180)throw Error('Thông số biến đổi không hợp lệ.');
 if(items.some(s=>['text','image'].includes(s.kind)))throw Error('Chọn riêng nét viết hoặc hình để biến đổi.');
 const bs=items.map(shapeBounds),x=Math.min(...bs.map(b=>b.x)),y=Math.min(...bs.map(b=>b.y)),right=Math.max(...bs.map(b=>b.x+b.w)),bottom=Math.max(...bs.map(b=>b.y+b.h)),cx=(x+right)/2,cy=(y+bottom)/2,c=Math.cos(angle*Math.PI/180),sn=Math.sin(angle*Math.PI/180);
 const transformed=items.map(s=>{
  let ps=s.points,ellipseAxes=s.ellipseAxes;
  if(s.kind==='ellipse'){const {center:q,u,v}=ellipseFrame(s);ps=[[q[0]+u[0],q[1]+u[1],.5],[q[0]+v[0],q[1]+v[1],.5],[q[0]-u[0],q[1]-u[1],.5],[q[0]-v[0],q[1]-v[1],.5]];ellipseAxes=true;}
  else if(s.points.length===2&&['rect','triangle','rightTriangle'].includes(s.kind)){
   const b=shapeBounds(s);ps=s.kind==='rect'?[[b.x,b.y,.5],[b.x+b.w,b.y,.5],[b.x+b.w,b.y+b.h,.5],[b.x,b.y+b.h,.5]]:[[s.kind==='triangle'?b.x+b.w/2:b.x,b.y,.5],[b.x+b.w,b.y+b.h,.5],[b.x,b.y+b.h,.5]];
  }
  return {...s,...mapErased(s,p=>{const dx=(p[0]-cx)*scaleX,dy=(p[1]-cy)*scaleY;return [cx+dx*c-dy*sn,cy+dx*sn+dy*c];}),...(ellipseAxes?{ellipseAxes:true}:{}),points:ps.map(p=>{const dx=(p[0]-cx)*scaleX,dy=(p[1]-cy)*scaleY;return [cx+dx*c-dy*sn,cy+dx*sn+dy*c,p[2]];})};
 });
 const boxes=transformed.map(shapeBounds),left=Math.min(...boxes.map(b=>b.x)),top=Math.min(...boxes.map(b=>b.y)),r=Math.max(...boxes.map(b=>b.x+b.w)),b=Math.max(...boxes.map(b=>b.y+b.h));
 if(r-left>width||b-top>height)throw Error('Hình vượt khổ trang. Hãy giảm chiều ngang hoặc chiều dọc.');
 const dx=left<0?-left:r>width?width-r:0,dy=top<0?-top:b>height?height-b:0;
 return transformed.map(s=>({...s,...mapErased(s,p=>[p[0]+dx,p[1]+dy]),points:s.points.map(p=>[p[0]+dx,p[1]+dy,p[2]])}));
}
