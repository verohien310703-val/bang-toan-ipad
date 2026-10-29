// New strokes only. Keep models 1..14 unchanged for existing notebooks.
import {ink14Path,ink14Width} from './ink-engine14.mjs?v=0.23.11';
import {brushV13Width} from './brush-v13.mjs?v=0.23.11';
import {traceNibSweep} from './nib-sweep.mjs?v=0.23.11';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const scaleOf=s=>clamp(s.smoothingScale||1,.05,8);

// Velocity uses a time window, not a single delta or the number of events in a frame.
// Repeated timestamps cannot manufacture an infinite velocity.
export function ink15Motion(points,times,scale=1){
 const arc=[0],speed=[0];let lo=0;
 for(let i=1;i<points.length;i++){
  arc.push(arc[i-1]+distance(points[i-1],points[i])*scale);
  const now=times?.[i]??i*8;
  while(lo+1<i&&now-(times?.[lo+1]??(lo+1)*8)>=24)lo++;
  const dt=now-(times?.[lo]??lo*8);
  speed.push(dt>.1?clamp((arc[i]-arc[lo])/dt,0,5):speed[i-1]);
 }
 return {arc,speed};
}
export function endTaper15(points,times,scale=1,pauseMs=0){
 if(points.length<2||pauseMs>=120)return 0;
 const {speed}=ink15Motion(points,times,scale);
 return smooth((speed.at(-1)-.12)/.8)*(1-smooth((pauseMs-20)/100));
}
export function ink15Width(style,pressure,sensitivity=.5,speed=0){
 const base=style==='brush'?brushV13Width(pressure,sensitivity):ink14Width(style,pressure,sensitivity);
 if(!['brush','fountain'].includes(style))return base;
 // Force remains primary. Faster movement gradually narrows the footprint;
 // it never removes the ability to press a broad stroke or stamp a dot.
 const response=1/(1+(Math.max(0,speed)/1.2)**1.4);
 return base*(style==='brush'?.45+.55*response:.72+.28*response);
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
export function ink15Samples(stroke){
 const raw=stroke.points,scale=scaleOf(stroke),tuning=stroke.penTuning||{};
 const {arc,speed}=ink15Motion(raw,stroke.penTimes,scale),time=i=>stroke.penTimes?.[i]??i*8;
 const path=ink14Path(stroke),totalRaw=arc.at(-1),firstMove=arc.findIndex(d=>d>.7);
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
  const target=stroke.size/2*ink15Width(stroke.penStyle,pressure[i],tuning.sensitivity,speed[i]);
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
  const pos=i===raw.length-1?raw[i]:path[i];nodes.push([pos[0],pos[1],radius]);
 }
 const points=curve(nodes),ds=[0];for(let i=1;i<points.length;i++)ds.push(ds.at(-1)+distance(points[i-1],points[i]));
 const total=ds.at(-1),maxRadius=Math.max(...nodes.map(p=>p[2]));
 const amount=stroke.penEnded!==false?clamp(tuning.taper||0,0,1)*clamp(stroke.penEndTaper||0,0,1):0;
 // Real expanded width, not nominal slider size. Retain enough length for a
 // broad nib to narrow gradually; short accents cannot lose their whole body.
 const tail=Math.min(total*.45,Math.max(24/scale,maxRadius*6,speed.at(-1)*40/scale));
 const startLength=Math.min(total*.2,Math.max(3/scale,(nodes[0]?.[2]||0)*3));
 const entry=initialDwell?0:smooth(totalRaw/2);
 const factor=(d)=>{
  const start=1-entry*.85*(1-smooth(startLength?d/startLength:1));
  const end=1-amount*(1-smooth(tail?(total-d)/tail:1));return start*end;
 };
 // A single pending contact is not yet known to be a tap or a moving entry.
 const contact=raw.length===1&&stroke.penEnded===false?.15:1;
 const samples=points.map((p,i)=>({center:p,radius:p[2]*factor(ds[i])*contact}));
 for(const dot of dots)samples.push({...dot,radius:dot.radius*factor(Math.min(total,dot.at)),isolated:true});
 return samples;
}
export function drawInk15(ctx,stroke){
 const samples=ink15Samples(stroke),body=samples.filter(p=>!p.isolated);
 if(stroke.dashed||stroke.dotted){ctx.beginPath();ctx.moveTo(body[0].center[0],body[0].center[1]);for(const p of body.slice(1))ctx.lineTo(p.center[0],p.center[1]);ctx.stroke();return;}
 const flatness=stroke.penStyle==='fountain'?(stroke.penTuning?.flatness??.33):0;
 ctx.beginPath();traceNibSweep(ctx,body,flatness);for(const p of samples)if(p.isolated)traceNibSweep(ctx,[p],flatness);ctx.fill();
}
