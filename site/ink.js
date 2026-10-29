import {drawInk24} from './ink-engine24.mjs?v=0.23.11';
import {rasterizeMasked} from './raster-mask.mjs?v=0.23.11';
import {drawInk23} from './ink-engine23.mjs?v=0.23.11';
import {drawInk22} from './ink-engine22.mjs?v=0.23.11';
import {drawInk21} from './ink-engine21.mjs?v=0.23.11';
import {drawInk20} from './ink-engine20.mjs?v=0.23.11';
import {drawInk19} from './ink-engine19.mjs?v=0.23.11';
import {drawInk18} from './ink-engine18.mjs?v=0.23.11';
import {drawInk17} from './ink-engine17.mjs?v=0.23.11';
import {drawInk16} from './ink-engine16.mjs?v=0.23.11';
import {drawInk15} from './ink-engine15.mjs?v=0.23.11';
import {drawInk14} from './ink-engine14.mjs?v=0.23.11';
import {brushV13Width,brushV13Samples} from './brush-v13.mjs?v=0.23.11';
import {brushV12Width,brushV12Samples} from './brush-v12.mjs?v=0.23.11';
import {brushV11Width,brushV11Samples} from './brush-v11.mjs?v=0.23.11';
import {brushV10Width,brushV10Samples} from './brush-v10.mjs?v=0.23.11';
import {contrastBrushWidth,contrastBrushSamples} from './brush-contrast.mjs?v=0.23.11';
import {brushPressureWidth,pressureBrushSamples} from './brush-pressure.mjs?v=0.23.11';
import {brushWidth,brushSamples} from './brush-response.mjs?v=0.23.11';
import {traceNibSweep} from './nib-sweep.mjs?v=0.23.11';
import {calibratedWidth} from './pen-calibration.mjs?v=0.23.11';
import {fountainWidth} from './fountain-response.mjs?v=0.23.11';
import {fountainOutline,traceRoundedOutline} from './pen-profile.mjs?v=0.23.11';
import {clipErased} from './erase-mask.mjs?v=0.23.11';
import {penSegments,tracePen} from './pen-path.mjs?v=0.23.11';
import {ellipseFrame} from './shape-geometry.mjs?v=0.23.11';
import {smoothInkPoints,pressureOutline} from './ink-smoothing.mjs?v=0.23.11';
const imageCache=new Map();
export const registerImage=(id,image)=>imageCache.set(id,image);
export function drawStroke(ctx,s,options){
 if(((s.erasePolygons?.length||0)>16||(s.penEnded===true&&(s.kind||'ink')==='ink'&&[23,24].includes(s.penModel)&&!s.dashed&&!s.dotted))&&rasterizeMasked(ctx,s,drawStrokeVector,options))return;
 drawStrokeVector(ctx,s);
}
export function drawStrokeVector(ctx,s){
 if(!s.points?.length)return;const source=s.penModel>=3&&s.penSpeeds?.length===s.points.length?s.points.map((p,i)=>[...p,s.penSpeeds[i]]):s.points;const enhanced=![14,15,16,17,18,19,20,21,22,23,24].includes(s.penModel)&&(s.kind||'ink')==='ink'&&s.inkVersion===2&&(!!s.smoothing||s.penTuning?.stabilizer===1&&s.penTuning?.stability>0),segments=enhanced?penSegments(source,s.smoothing,s.smoothingScale,s.penTuning?.stability,s.penModel>=4?3:s.penModel>=1?2:s.penTuning?.stabilizer===1):null;const kind=s.kind||'ink',ps=!enhanced&&kind==='ink'&&s.smoothing?smoothInkPoints(source,s.smoothing):source,a=ps[0],b=ps[ps.length-1],x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]),w=Math.max(1,Math.abs(a[0]-b[0])),h=Math.max(1,Math.abs(a[1]-b[1]));
 ctx.save();clipErased(ctx,s.erasePolygons);ctx.strokeStyle=s.color;ctx.fillStyle=s.fillColor||s.color;ctx.globalAlpha=s.opacity??1;ctx.lineWidth=s.size;ctx.lineCap='round';ctx.lineJoin='round';if(s.dotted)ctx.setLineDash([.01,s.size*2.5]);else if(s.dashed)ctx.setLineDash([s.size*4,s.size*3]);
 if(kind==='ink'&&s.penModel===24){drawInk24(ctx,s);ctx.restore();return;}
 if(kind==='ink'&&s.penModel===23){drawInk23(ctx,s);ctx.restore();return;}
 if(kind==='ink'&&s.penModel===22){drawInk22(ctx,s);ctx.restore();return;}
 if(kind==='ink'&&s.penModel===21){drawInk21(ctx,s);ctx.restore();return;}
 if(kind==='ink'&&s.penModel===20){drawInk20(ctx,s);ctx.restore();return;}
 if(kind==='ink'&&s.penModel===19){drawInk19(ctx,s);ctx.restore();return;}
 if(kind==='ink'&&s.penModel===18){drawInk18(ctx,s);ctx.restore();return;}
 if(kind==='ink'&&s.penModel===17){drawInk17(ctx,s);ctx.restore();return;}
 if(kind==='ink'&&s.penModel===16){drawInk16(ctx,s);ctx.restore();return;}
 if(kind==='ink'&&s.penModel===15){drawInk15(ctx,s);ctx.restore();return;}
 if(kind==='ink'&&s.penModel===14){drawInk14(ctx,s);ctx.restore();return;}
 if(kind==='ink'&&[7,8,9,10,11,12,13].includes(s.penModel)&&s.penStyle==='brush'&&!s.dashed&&!s.dotted){ctx.beginPath();for(const segment of segments||[ps])traceNibSweep(ctx,s.penModel>=10?(s.penModel===13?brushV13Samples:s.penModel===12?brushV12Samples:s.penModel===11?brushV11Samples:brushV10Samples)(segment,s.size,{...s.penTuning,endTaper:s.penEnded!==false&&(!segments||segment===segments.at(-1))?s.penEndTaper??0:0},s.smoothingScale):(s.penModel===9?contrastBrushSamples:s.penModel===8?pressureBrushSamples:brushSamples)(segment,s.size,s.penTuning?.sensitivity),0);for(let i=0;i<s.points.length;i++){const p=s.points[i],a=s.points[i-1],b=s.points[i+1];if((a&&Math.hypot(p[0]-a[0],p[1]-a[1])<.35)||(b&&Math.hypot(p[0]-b[0],p[1]-b[1])<.35))traceNibSweep(ctx,[{center:p,radius:s.size/2*(s.penModel===13?brushV13Width:s.penModel===12?brushV12Width:s.penModel===11?brushV11Width:s.penModel===10?brushV10Width:s.penModel===9?contrastBrushWidth:s.penModel===8?brushPressureWidth:brushWidth)(p[2],s.penTuning?.sensitivity)}],0);}ctx.fill();ctx.restore();return;}
 if(kind==='ink'&&s.penModel>=3&&['fountain','brush'].includes(s.penStyle)&&ps.length===1){ctx.beginPath();ctx.arc(a[0],a[1],Math.max(.3/(s.smoothingScale||1),s.size/2*(s.penModel>=4?calibratedWidth(a[2],s.penModel>=5?(s.penTuning?.sensitivity??.5)*.2:s.penTuning?.sensitivity,s.penStyle==='brush'):fountainWidth(a[2],s.penTuning?.sensitivity))),0,Math.PI*2);ctx.fill();ctx.restore();return;}
 if(kind==='image'){const im=imageCache.get(s.asset);if(im)ctx.drawImage(im,x,y,w,h);ctx.restore();return;}
 if(kind==='text'){const size=s.fontSize||28;ctx.font=`${s.bold?'600':'400'} ${size}px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;ctx.textBaseline='top';String(s.text).split('\n').forEach((line,i)=>ctx.fillText(line,a[0],a[1]+i*size*1.35));ctx.restore();return;}
 if(kind==='ink'&&s.penStyle==='pencil'){if(s.penModel===4&&ps.length===1){ctx.globalAlpha=(s.opacity??1)*.65;ctx.beginPath();ctx.arc(a[0],a[1],s.size/2,0,Math.PI*2);ctx.fill();ctx.restore();return;}const paths=segments||[ps];ctx.globalAlpha=(s.opacity??1)*.65;ctx.lineWidth=s.size*(s.penModel===4?1:.75);ctx.beginPath();tracePen(ctx,paths);ctx.stroke();ctx.globalAlpha=(s.opacity??1)*.22;ctx.lineWidth=Math.max(.3,s.size*.16);for(let k=0;k<3;k++){ctx.save();ctx.translate((k-1)*s.size*(s.penModel===4?.08:.2),(k%2-.5)*s.size*(s.penModel===4?.08:.25));ctx.beginPath();tracePen(ctx,paths);ctx.stroke();ctx.restore();}ctx.restore();return;}
 if(kind==='ink'&&(enhanced||s.penTuning)&&s.inkVersion===2&&['fountain','brush'].includes(s.penStyle)&&!s.dashed&&!s.dotted&&s.points.length>1){
  ctx.fillStyle=s.color;ctx.beginPath();
  for(const segment of segments||[ps]){const tuning=s.penTuning?{...s.penTuning,brush:s.penStyle==='brush',response:s.penTuning.stabilizer===1}:s.penStyle==='brush'?{taper:.15,sensitivity:.5,flatness:0,brush:true}:undefined;const o=(s.penModel>=1&&s.penStyle==='fountain'||s.penModel===4&&s.penStyle==='brush')?fountainOutline(segment,s.size,{...tuning,rounded:s.penModel>=2,calligraphic:s.penModel>=3,calibrated:s.penModel===4,directional:s.penModel>=5,swept:s.penModel===6,endTaper:s.penEndTaper??0,taperStart:!segments||segment===segments[0],taperEnd:s.penEnded!==false&&(!segments||segment===segments.at(-1))},s.smoothingScale):pressureOutline(segment,s.size,tuning);if(!o)continue;if(s.penModel===6){traceNibSweep(ctx,o.sweep,s.penTuning?.flatness);continue;}if(s.penModel>=2){traceRoundedOutline(ctx,o);}else{ctx.moveTo(...o.right[0]);for(const p of o.right.slice(1))ctx.lineTo(...p);for(const p of o.left.slice().reverse())ctx.lineTo(...p);ctx.closePath();}for(const [p,r,cap]of [[o.start,o.startRadius,!segments||segment===segments[0]],[o.end,o.endRadius,!segments||segment===segments.at(-1)]]){if(s.penModel===5&&!cap)continue;ctx.moveTo(p[0]+r,p[1]);ctx.arc(p[0],p[1],r,0,Math.PI*2);}}
  ctx.fill();ctx.restore();return;
 }
 if(enhanced&&s.points.length>1){ctx.beginPath();tracePen(ctx,segments);ctx.stroke();ctx.restore();return;}
 if(kind==='ink'&&s.penStyle==='fountain'&&s.smoothing&&!s.dashed&&ps.length>1){
  const outline=pressureOutline(ps,s.size);ctx.fillStyle=s.color;ctx.beginPath();ctx.moveTo(...outline.right[0]);
  for(const p of outline.right.slice(1))ctx.lineTo(...p);for(const p of outline.left.slice().reverse())ctx.lineTo(...p);ctx.closePath();
  for(const [p,r]of [[outline.start,outline.startRadius],[outline.end,outline.endRadius]]){ctx.moveTo(p[0]+r,p[1]);ctx.arc(p[0],p[1],r,0,Math.PI*2);}
  ctx.fill();ctx.restore();return;
 }
 if(kind==='ink'&&s.penStyle==='fountain'&&ps.length>1&&!(s.smoothing&&s.dashed)){for(let i=1;i<ps.length;i++){const p=ps[i-1],q=ps[i];ctx.lineWidth=s.size*(.35+.65*((p[2]+q[2])/2));ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();}ctx.restore();return;}
 ctx.beginPath();
 if(kind==='ellipse'&&s.ellipseAxes){const {center:c,u,v}=ellipseFrame(s),k=.5522847498307936;ctx.moveTo(c[0]+u[0],c[1]+u[1]);for(let i=0;i<4;i++){const t=i*Math.PI/2,n=t+Math.PI/2,a=[c[0]+u[0]*Math.cos(t)+v[0]*Math.sin(t),c[1]+u[1]*Math.cos(t)+v[1]*Math.sin(t)],b=[c[0]+u[0]*Math.cos(n)+v[0]*Math.sin(n),c[1]+u[1]*Math.cos(n)+v[1]*Math.sin(n)],da=[-u[0]*Math.sin(t)+v[0]*Math.cos(t),-u[1]*Math.sin(t)+v[1]*Math.cos(t)],db=[-u[0]*Math.sin(n)+v[0]*Math.cos(n),-u[1]*Math.sin(n)+v[1]*Math.cos(n)];ctx.bezierCurveTo(a[0]+k*da[0],a[1]+k*da[1],b[0]-k*db[0],b[1]-k*db[1],...b);}ctx.closePath();}else if((kind==='rect'&&ps.length===4)||(['triangle','rightTriangle'].includes(kind)&&ps.length===3)){ctx.moveTo(a[0],a[1]);for(const p of ps.slice(1))ctx.lineTo(p[0],p[1]);ctx.closePath();}else if(kind==='rect'){ctx.rect(x,y,w,h);}else if(kind==='ellipse'){ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);}else if(kind==='triangle'||kind==='rightTriangle'){ctx.moveTo(kind==='triangle'?x+w/2:x,y);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();}
 else if(kind==='line'||kind==='arrow'){ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);}
 else if(ps.length===1){ctx.arc(a[0],a[1],s.size/2,0,Math.PI*2);ctx.fill();ctx.restore();return;}
 else {ctx.moveTo(a[0],a[1]);for(let i=1;i<ps.length-1;i++){const p=ps[i],q=ps[i+1];ctx.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2);}ctx.lineTo(b[0],b[1]);}
 if(s.filled&&['rect','ellipse','triangle','rightTriangle'].includes(kind)){ctx.save();ctx.globalAlpha=(s.opacity??1)*.16;ctx.fill();ctx.restore();}ctx.stroke();
 if(kind==='arrow'){ctx.setLineDash([]);const ang=Math.atan2(b[1]-a[1],b[0]-a[0]),len=Math.max(12,s.size*5);ctx.beginPath();ctx.moveTo(b[0]-Math.cos(ang-.45)*len,b[1]-Math.sin(ang-.45)*len);ctx.lineTo(b[0],b[1]);ctx.lineTo(b[0]-Math.cos(ang+.45)*len,b[1]-Math.sin(ang+.45)*len);ctx.stroke();}
 ctx.restore();
}
export function sampledEvents(e){let events;try{events=e.getCoalescedEvents?.();}catch{}if(!events?.length)return [e];const last=events.at(-1);return last.clientX!==e.clientX||last.clientY!==e.clientY||last.pressure!==e.pressure||last.timeStamp!==e.timeStamp?[...events,e]:events;}
export function appendPoint(points,p,final=false,pressureAware=false){const a=points[points.length-1];if(!a){points.push(p);return;}if(points.length<20000&&(Math.hypot(p[0]-a[0],p[1]-a[1])>=(final?.01:.35)||pressureAware&&Math.abs(p[2]-a[2])>=(typeof pressureAware==='number'?pressureAware:.015)))points.push(p);}
