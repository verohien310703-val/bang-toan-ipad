// Versioned control calibration; models 1..17 remain unchanged.
import {ink15Motion,endTaper15} from './ink-engine15.mjs?v=0.23.11';
import {levelValue,nibMinor16} from './pen-controls.mjs?v=0.23.11';
import {traceNibSweep} from './nib-sweep.mjs?v=0.23.11';
export {endTaper15 as endTaper18};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const scaleOf=s=>clamp(s.smoothingScale||1,.05,8);
// Automatic light denoising plus a separate user-controlled trailing filter.
// Historical model 17 keeps its original calibration and pixels.
export function controlProfile18(tuning={}){
 const stability=clamp(tuning.stability??0,0,1),sharpness=clamp(tuning.taper??.25,0,1);
 return {filterMs:2+levelValue(stability,[0,12,28,52,85]),lagPixels:.25+levelValue(stability,[0,2,5,10,18]),entrySharpness:levelValue(sharpness,[0,.35,.65,.85,.96])};
}
export function ink18Width(style,pressure=.35,sensitivity=.5,speed=0){
 const p=clamp(pressure,0,1),s=clamp(sensitivity,0,1);
 // Common light-contact floor at every sensitivity. Sensitivity adds width;
 // it never subtracts width below a neutral pressure pivot.
 if(style==='brush'){
  const gain=levelValue(s,[.12,1.2,2.4,3.8,5.5]);
  const motion=.45+.55/(1+(Math.max(0,speed)/1.2)**1.4);
  return (.45+gain*Math.expm1(p*2))*motion;
 }
 if(style==='fountain'){
  const gain=levelValue(s,[.05,.7,1.5,2.5,4]);
  const response=1/(1+(Math.max(0,speed)/1.2)**1.4);
  return (1+gain*Math.expm1(p*2)/Math.expm1(2))*(.72+.28*response);
 }
 return 1;
}
const pathCache=new WeakMap();
export function ink18Path(stroke){
 const points=stroke.points,scale=scaleOf(stroke),c=controlProfile18(stroke.penTuning);
 const key=[scale,c.filterMs,c.lagPixels].join(':');let state=pathCache.get(points);
 if(!state||state.key!==key||state.count>points.length){state={key,count:0,out:[]};pathCache.set(points,state);}
 for(let i=state.count;i<points.length;i++){
  const raw=points[i];if(!i){state.out.push([...raw]);continue;}
  const prev=points[i-1],last=state.out.at(-1),dt=clamp((stroke.penTimes?.[i]??i*8)-(stroke.penTimes?.[i-1]??(i-1)*8),.25,100),speed=distance(raw,prev)*scale/dt;
  const tau=2/(1+speed*6)+(c.filterMs-2)/(1+speed*.4),alpha=tau?1-Math.exp(-dt/tau):1;
  let x=last[0]+alpha*(raw[0]-last[0]),y=last[1]+alpha*(raw[1]-last[1]);
  const lag=Math.hypot(x-raw[0],y-raw[1]),limit=c.lagPixels/scale;
  if(lag>limit){x=raw[0]+(x-raw[0])*limit/lag;y=raw[1]+(y-raw[1])*limit/lag;}
  if(i>1){const a=points[i-2],ux=prev[0]-a[0],uy=prev[1]-a[1],vx=raw[0]-prev[0],vy=raw[1]-prev[1],u=Math.hypot(ux,uy),v=Math.hypot(vx,vy);if(Math.min(u,v)*scale>2.5&&(ux*vx+uy*vy)/(u*v)<.35){x=raw[0];y=raw[1];}}
  state.out.push([x,y,raw[2]]);
 }
 state.count=points.length;return state.out;
}
function curve(nodes){
 if(nodes.length<3)return nodes;
 const result=[nodes[0]];let start=nodes[0];
 for(let i=1;i<nodes.length;i++){
  const control=nodes[i],next=nodes[i+1],end=next?control.map((v,k)=>(v+next[k])/2):control;
  const count=Math.max(1,Math.min(128,Math.ceil((distance(start,control)+distance(control,end))/.7)));
  for(let j=1;j<=count;j++){const t=j/count,u=1-t;result.push(start.map((v,k)=>u*u*v+2*u*t*control[k]+t*t*end[k]));}
  start=end;
 }
 return result;
}
export function ink18Samples(stroke){
 const raw=stroke.points,scale=scaleOf(stroke),tuning=stroke.penTuning||{};
 const {arc,speed}=ink15Motion(raw,stroke.penTimes,scale),time=i=>stroke.penTimes?.[i]??i*8;
 const path=ink18Path(stroke),totalRaw=arc.at(-1),firstMove=arc.findIndex(d=>d>.7);
 // An intentional initial dwell or a dot is not a flying handwriting entry.
 const initialDwell=firstMove<0||time(firstMove)-time(0)>=70;
 const pressure=raw.map(p=>p[2]);
 // Reject only a brief, isolated pressure overshoot before movement. Do not
 // classify a sustained hard start as bad input, or rewrite the raw samples.
 if(!initialDwell&&raw.length>=3){
  const early=[];for(let i=1;i<raw.length&&time(i)-time(0)<=40;i++)if(arc[i]>.7)early.push(pressure[i]);
  if(early.length>=2){early.sort((a,b)=>a-b);const settled=early[Math.floor((early.length-1)/2)];
   for(let i=0;i<raw.length&&time(i)-time(0)<=32&&arc[i]<2;i++)if(pressure[i]>settled*2+.03)pressure[i]=settled;}
 }
 const nodes=[],dots=[];let radius=0;
 for(let i=0;i<raw.length;i++){
  const target=stroke.size/2*ink18Width(stroke.penStyle,pressure[i],tuning.sensitivity,speed[i]);
  const step=i?arc[i]-arc[i-1]:0,dt=i?clamp(time(i)-time(i-1),0,100):0;
  if(!i)radius=target;
  else if(step<.35){radius=target;
   // Preserve intentional dwell peaks, not incidental startup contacts.
   if(pressure[i]>pressure[i-1]+.002&&(initialDwell||arc[i]>3))dots.push({center:path[i],radius:target,at:arc[i]/scale});
  }else{
   // Filter width as well as coordinates. At high speed a force transition
   // is spread over distance, rather than becoming a shoulder in one frame.
   const response=1-Math.exp(-dt/18-step/Math.max(3,(radius+target)*scale));
   const maxChange=.45*step/scale;
   radius+=clamp(response*(target-radius),-maxChange,maxChange);
  }
  const pos=path[i];nodes.push([pos[0],pos[1],radius]);
 }
 const points=curve(nodes),ds=[0];for(let i=1;i<points.length;i++)ds.push(ds.at(-1)+distance(points[i-1],points[i]));
 const total=ds.at(-1),maxRadius=Math.max(...nodes.map(p=>p[2]));
 const sharpness=stroke.penStyle==='brush'?.85:stroke.penStyle==='fountain'?(tuning.taper??.25):0;
 const amount=stroke.penEnded!==false?sharpness*clamp(stroke.penEndTaper||0,0,1):0;
 // Real expanded width, not nominal slider size. Retain enough length for a
 // broad nib to narrow gradually; short accents cannot lose their whole body.
 const tail=Math.min(total*.45,Math.max(24/scale,maxRadius*6,speed.at(-1)*40/scale));
 const startLength=Math.min(total*.2,Math.max(3/scale,(nodes[0]?.[2]||0)*3));
 const entry=initialDwell?0:smooth(totalRaw/2);
 const controls=controlProfile18({...tuning,taper:sharpness});
 const factor=(d)=>{
  const start=1-entry*controls.entrySharpness*(1-smooth(startLength?d/startLength:1));
  const end=1-amount*(1-smooth(tail?(total-d)/tail:1));return start*end;
 };
 // A single pending contact is not yet known to be a tap or a moving entry.
 const contact=raw.length===1&&stroke.penEnded===false&&['brush','fountain'].includes(stroke.penStyle)?.15:1;
 const samples=points.map((p,i)=>({center:p,radius:p[2]*factor(ds[i])*contact}));
 for(const dot of dots)samples.push({...dot,radius:dot.radius*factor(Math.min(total,dot.at)),isolated:true});
 return samples;
}
export function drawInk18(ctx,stroke){
 const samples=ink18Samples(stroke),body=samples.filter(p=>!p.isolated);
 if(stroke.dashed||stroke.dotted){ctx.beginPath();ctx.moveTo(body[0].center[0],body[0].center[1]);for(const p of body.slice(1))ctx.lineTo(p.center[0],p.center[1]);ctx.stroke();return;}
 const flatness=stroke.penStyle==='fountain'?(stroke.penTuning?.flatness??.33):0;
 ctx.beginPath();traceNibSweep(ctx,body,flatness,stroke.penStyle==='fountain'?nibMinor16(flatness):1);for(const p of samples)if(p.isolated)traceNibSweep(ctx,[p],flatness,stroke.penStyle==='fountain'?nibMinor16(flatness):1);ctx.fill();
}
