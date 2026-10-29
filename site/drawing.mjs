import {pointBounds} from './point-bounds.mjs?v=0.23.11';
import {PDF_PAPERS,pdfPaper} from './paper-catalog.mjs?v=0.23.11';
import {mapErased} from './erase-mask.mjs?v=0.23.11';
import {ellipseFrame,shapeBounds} from './shape-geometry.mjs?v=0.23.11';
export const PAPER_TYPES=['blank','ruled','grid','dots','graph','cornell',...PDF_PAPERS.map(p=>p.id)];
export const DEFAULT_PAPER={template:'blank',color:'#ffffff',lineColor:'#b6c9df',spacing:32,margin:true};
export function paintPaper(ctx,w,h,options={}){
 const p={...DEFAULT_PAPER,...options},s=p.spacing;ctx.save();ctx.fillStyle=p.color;ctx.fillRect(0,0,w,h);ctx.lineWidth=1;ctx.strokeStyle=p.lineColor;ctx.fillStyle=p.lineColor;
 if(p.template==='dots'){for(let x=s;x<w;x+=s)for(let y=s;y<h;y+=s){ctx.beginPath();ctx.arc(x,y,1.3,0,Math.PI*2);ctx.fill();}}
 else if(p.template!=='blank'&&!pdfPaper(p.template)){ctx.beginPath();if(['ruled','grid','graph','cornell'].includes(p.template))for(let y=s;y<h;y+=s){ctx.moveTo(0,y);ctx.lineTo(w,y);}if(['grid','graph'].includes(p.template))for(let x=s;x<w;x+=s){ctx.moveTo(x,0);ctx.lineTo(x,h);}ctx.stroke();
 if(p.template==='graph'){ctx.lineWidth=1.8;ctx.beginPath();for(let x=s*5;x<w;x+=s*5){ctx.moveTo(x,0);ctx.lineTo(x,h);}for(let y=s*5;y<h;y+=s*5){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();}
 if(p.template==='cornell'){ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w*.23,0);ctx.lineTo(w*.23,h*.83);ctx.moveTo(0,h*.83);ctx.lineTo(w,h*.83);ctx.stroke();}
 }
 if(p.margin&&['ruled','grid','graph'].includes(p.template)){ctx.strokeStyle='#dcb8b8';ctx.beginPath();ctx.moveTo(w*(p.marginRatio??.075),0);ctx.lineTo(w*(p.marginRatio??.075),h);ctx.stroke();}ctx.restore();
}
export function bounds(s){if(s.kind==='ellipse'&&s.ellipseAxes)return shapeBounds(s);if(s.kind==='text'){return {x:s.points[0][0],y:s.points[0][1],w:s.boxWidth||Math.max(50,s.text.length*(s.fontSize||28)*.6),h:s.boxHeight||(s.fontSize||28)*1.4};}return pointBounds(s);}
export function unionBounds(items){if(!items.length)return null;const bs=items.map(bounds),x=Math.min(...bs.map(b=>b.x)),y=Math.min(...bs.map(b=>b.y));return {x,y,w:Math.max(...bs.map(b=>b.x+b.w))-x,h:Math.max(...bs.map(b=>b.y+b.h))-y};}
export function inside(p,b){return p[0]>=b.x&&p[0]<=b.x+b.w&&p[1]>=b.y&&p[1]<=b.y+b.h;}
export function distanceToSegment(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
export function hitStroke(s,path,radius){
 if(s.kind&&s.kind!=='ink'&&!s.quickShape)return false;
 let points=s.points;
 if(s.quickShape&&['rect','triangle'].includes(s.kind))points=points.concat([points[0]]);
 if(s.quickShape&&s.kind==='ellipse'){
  const {center:c,u,v}=ellipseFrame(s);points=Array.from({length:97},(_,i)=>{const t=i*Math.PI/48;return [c[0]+u[0]*Math.cos(t)+v[0]*Math.sin(t),c[1]+u[1]*Math.cos(t)+v[1]*Math.sin(t),.5];});
 }
 for(const q of path){if(points.length===1&&Math.hypot(q[0]-points[0][0],q[1]-points[0][1])<=radius+s.size/2)return true;for(let i=1;i<points.length;i++)if(distanceToSegment(q,points[i-1],points[i])<=radius+s.size/2)return true;}return false;
}
export function partialErase(strokes,path,radius,id){const removeIds=[],addStrokes=[];for(const s of strokes){if(!hitStroke(s,path,radius))continue;removeIds.push(s.id);if(s.quickShape&&s.kind&&s.kind!=='ink')continue;const dense=[];if(s.points.length===1)dense.push(s.points[0]);for(let i=1;i<s.points.length;i++){const a=s.points[i-1],b=s.points[i],steps=Math.min(2000,Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/Math.max(1,radius/2))));if(!dense.length)dense.push(a);for(let j=1;j<=steps;j++){const t=j/steps;dense.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]);}}
 let piece=[];const flush=()=>{if(piece.length){addStrokes.push({...s,id:id(),points:piece});piece=[];}};for(const p of dense){const erased=path.some((q,i)=>i?distanceToSegment(p,path[i-1],q)<=radius+s.size/2:Math.hypot(p[0]-q[0],p[1]-q[1])<=radius+s.size/2);if(erased)flush();else {if(piece.length>=19000)flush();piece.push(p);}}flush();}return {ids:removeIds,strokes:addStrokes};}
export function transformItems(items,box,target){const sx=target.w/(box.w||1),sy=target.h/(box.h||1);return items.map(s=>({...s,...mapErased(s,p=>[target.x+(p[0]-box.x)*sx,target.y+(p[1]-box.y)*sy]),points:s.points.map(p=>[target.x+(p[0]-box.x)*sx,target.y+(p[1]-box.y)*sy,p[2]]),size:s.quickShape?s.size:Math.min(40,Math.max(.5,s.size*Math.sqrt(sx*sy))),...(s.kind==='text'?{fontSize:Math.max(10,Math.min(120,(s.fontSize||28)*sy)),boxWidth:(s.boxWidth||box.w)*sx,boxHeight:(s.boxHeight||box.h)*sy}:{} )}));}
export function polygonContains(point,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a[1]>point[1])!==(b[1]>point[1]))&&(point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0]))c=!c;}return c;}

export function paintCover(ctx,w,h,cover){
 const s=Math.min(w,h);ctx.save();ctx.fillStyle=cover.color||'#17213b';ctx.fillRect(0,0,w,h);
 if(cover.style==='grid'){ctx.strokeStyle='#ffffff17';ctx.lineWidth=s*.002;for(let x=0;x<w;x+=s*.08){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=0;y<h;y+=s*.08){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}}
 if(cover.style==='ribbon'){ctx.lineCap='round';ctx.lineWidth=s*.035;for(const [color,x,y]of [['#4bcee0',.38,.28],['#e9ebd2',.6,.39],['#32a999',.65,.63]]){ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(w*x,h*y-s*.18);ctx.bezierCurveTo(w*(x-.4),h*y+s*.12,w*(x+.42),h*y+s*.12,w*x,h*y-s*.06);ctx.bezierCurveTo(w*(x-.24),h*y-s*.26,w*(x-.22),h*y+s*.4,w*(x+.22),h*y+s*.32);ctx.stroke();}}
 ctx.strokeStyle='#ffffff25';ctx.lineWidth=2;ctx.strokeRect(s*.05,s*.05,w-s*.1,h-s*.1);ctx.restore();
}
