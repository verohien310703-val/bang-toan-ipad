// Versioned ink pipeline. Old notes retain their original renderer.
// Coordinates and pressure are filtered causally: extending a stroke cannot
// refit its history. Time is the browser sample timestamp, not frame time.
import {traceNibSweep} from './nib-sweep.mjs?v=0.23.11';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const cache=new WeakMap();
export function ink14Width(style,pressure=.35,sensitivity=.5){
 const p=clamp(pressure,0,1),s=clamp(sensitivity,0,1);
 // Shared nominal reference: .35 normalized pressure at default sensitivity.
 // Brush retains a wide dynamic range, without a small hard size ceiling.
 if(style==='brush')return Math.max(.025,(p/(.35*Math.exp(-.5*(s-.5))))**1.35);
 if(style==='fountain')return Math.max(.25,1+(p-.35)*(.35+.65*s));
 return 1;
}
export function ink14Path(stroke){
 const points=stroke.points,scale=clamp(stroke.smoothingScale||1,.05,8);
 const strength=clamp(stroke.penTuning?.stability??0,0,1);
 const key=`${scale}:${strength}:${stroke.smoothing||0}`;
 let state=cache.get(points);
 if(!state||state.key!==key||state.count>points.length){state={key,count:0,out:[]};cache.set(points,state);}
 for(let i=state.count;i<points.length;i++){
  const raw=points[i];
  if(!i){state.out.push([...raw]);continue;}
  const prev=points[i-1],last=state.out.at(-1),dt=clamp((stroke.penTimes?.[i]??i*8)-(stroke.penTimes?.[i-1]??(i-1)*8),.25,100);
  const movement=distance(raw,prev)*scale,speed=movement/dt;
  // A bounded, speed-adaptive filter; stability=0 truly bypasses filtering.
  const tau=strength*24/(1+speed*8),alpha=tau?1-Math.exp(-dt/tau):1;
  let x=last[0]+alpha*(raw[0]-last[0]),y=last[1]+alpha*(raw[1]-last[1]);
  const lag=Math.hypot(x-raw[0],y-raw[1]),limit=(.3+2.5*strength)/scale;
  if(lag>limit){x=raw[0]+(x-raw[0])*limit/lag;y=raw[1]+(y-raw[1])*limit/lag;}
  // Strong direction changes are intentional in mathematical handwriting.
  if(i>1){const a=points[i-2],ux=prev[0]-a[0],uy=prev[1]-a[1],vx=raw[0]-prev[0],vy=raw[1]-prev[1],u=Math.hypot(ux,uy),v=Math.hypot(vx,vy);
   if(Math.min(u,v)*scale>2.5&&(ux*vx+uy*vy)/(u*v)<.35){x=raw[0];y=raw[1];}}
  // A stationary press must immediately grow a round dot; never resample it away.
  const pa=movement<.35?1:1-Math.exp(-dt/3);
  state.out.push([x,y,last[2]+pa*(raw[2]-last[2])]);
 }
 state.count=points.length;return state.out;
}
function curve(points){
 if(points.length<3)return points;
 const out=[points[0]];let start=points[0];
 for(let i=1;i<points.length;i++){
  const c=points[i],next=points[i+1],end=next?c.map((v,k)=>(v+next[k])/2):c;
  const n=Math.max(1,Math.min(128,Math.ceil((distance(start,c)+distance(c,end))/.8)));
  for(let j=1;j<=n;j++){const t=j/n,u=1-t;out.push(start.map((v,k)=>u*u*v+2*u*t*c[k]+t*t*end[k]));}
  start=end;
 }
 return out;
}
export function ink14Samples(stroke){
 const centerline=ink14Path(stroke).slice();
 // Keep the visible tip at contact; only the unfinished local segment changes.
 if(centerline.length>1)centerline[centerline.length-1]=[...stroke.points.at(-1)];
 const points=curve(centerline),size=stroke.size,t=stroke.penTuning||{},scale=stroke.smoothingScale||1;
 const ds=[0];for(let i=1;i<points.length;i++)ds.push(ds.at(-1)+distance(points[i-1],points[i]));
 const total=ds.at(-1),tail=Math.min(total*.2,Math.max(size*1.5,4/scale));
 const amount=stroke.penEnded!==false?clamp(t.taper||0,0,1)*clamp(stroke.penEndTaper||0,0,1):0;
 const samples=points.map((p,i)=>{const q=tail?clamp((total-ds[i])/tail,0,1):1,edge=q*q*(3-2*q);
  return {center:p,radius:size/2*ink14Width(stroke.penStyle,p[2],t.sensitivity)*(1-amount*(1-edge))};});
 // Preserve pressure-only contacts exactly, including a single pressure peak.
 const filtered=ink14Path(stroke);for(let i=1;i<filtered.length;i++)if(distance(stroke.points[i],stroke.points[i-1])*scale<.35&&stroke.points[i][2]>stroke.points[i-1][2]+.002)samples.push({center:filtered[i],radius:size/2*ink14Width(stroke.penStyle,stroke.points[i][2],t.sensitivity),isolated:true});
 return samples;
}
export function drawInk14(ctx,stroke){
 const points=ink14Path(stroke),style=stroke.penStyle;
 if(stroke.dashed||stroke.dotted){ctx.beginPath();ctx.moveTo(...points[0].slice(0,2));for(const p of curve(points).slice(1))ctx.lineTo(p[0],p[1]);ctx.stroke();return;}
 const samples=ink14Samples(stroke);
 ctx.beginPath();const flatness=style==='fountain'?(stroke.penTuning?.flatness??.33):0;traceNibSweep(ctx,samples.filter(p=>!p.isolated),flatness);for(const p of samples)if(p.isolated)traceNibSweep(ctx,[p],flatness);

 if(style==='pencil')ctx.globalAlpha=(stroke.opacity??1)*.65;
 ctx.fill();
}
