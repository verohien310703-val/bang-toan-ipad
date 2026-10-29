// Spatial stabilizer: movement, not elapsed time, tensions the virtual string.
// Raw samples and pressure stay intact; stable history is cached causally.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function stringRadius(level=0){
 const t=clamp(Number.isFinite(level)?level:0,0,1)*4,i=Math.min(3,Math.floor(t)),a=[0,1.5,4,8,14];
 return a[i]+(a[i+1]-a[i])*(t-i);
}
const cache=new WeakMap();
export function stringPath(stroke){
 const points=stroke.points,scale=clamp(stroke.smoothingScale||1,.05,8),radius=stringRadius(stroke.penTuning?.stability),key=[scale,radius].join(':');
 let state=cache.get(points);
 if(!state||state.key!==key||state.count>points.length){state={key,count:0,travel:0,out:[],distance:[],elastic:[],sealed:1};cache.set(points,state);}
 for(let i=state.count;i<points.length;i++){
  const p=points[i];if(!i){state.out.push([...p]);state.distance.push(0);continue;}
  const prev=points[i-1],last=state.out.at(-1),step=Math.hypot(p[0]-prev[0],p[1]-prev[1])*scale;
  state.travel+=step;state.distance.push(state.travel);
  // The string starts relaxed, so short accents still form instead of being
  // swallowed by a full-sized dead zone before the first visible movement.
  const r=Math.min(radius,state.travel*.2)/scale,dx=p[0]-last[0],dy=p[1]-last[1],d=Math.hypot(dx,dy);
  if(radius===0){
   // Very light spatial cleanup even at 0%; no time-based waiting.
   const a=step>0?1-Math.exp(-step/.15):0;
   state.out.push([last[0]+a*dx,last[1]+a*dy,p[2]]);
  }else if(d>r){const f=(d-r)/d;state.out.push([last[0]+dx*f,last[1]+dy*f,p[2]]);}
  else state.out.push([last[0],last[1],p[2]]);
 }
 state.count=points.length;
 // A short elastic tail can settle as more of the same stroke arrives. Once
 // a node has 2 radii of subsequent travel, its position is permanently fixed.
 // This is bounded by arc length, not number of events or frame rate.
 if(!radius)return state.out;
 const out=state.elastic,look=radius*2,end=state.distance.at(-1);
 while(out.length<state.out.length)out.push([...state.out[out.length]]);
 const at=d=>{
  let lo=0,hi=state.distance.length-1;
  while(lo<hi){const m=(lo+hi)>>1;if(state.distance[m]<d)lo=m+1;else hi=m;}
  if(!lo)return state.out[0];const a=lo-1,b=lo,span=state.distance[b]-state.distance[a],t=span?(d-state.distance[a])/span:0;
  return [state.out[a][0]+(state.out[b][0]-state.out[a][0])*t,state.out[a][1]+(state.out[b][1]-state.out[a][1])*t];
 };
 for(let i=state.sealed;i<out.length-1;i++){
  const base=state.out[i],available=end-state.distance[i],span=Math.min(look,available);let sx=base[0]*2,sy=base[1]*2,weight=2;
  if(span>1e-6)for(let k=1;k<=6;k++){const d=span*k/6,w=1-k/7,p=at(state.distance[i]+d);sx+=p[0]*w;sy+=p[1]*w;weight+=w;}
  out[i]=[base[0]+(sx/weight-base[0])*.12,base[1]+(sy/weight-base[1])*.12,base[2]];
  if(available>=look)state.sealed=i+1;
 }
 return out;
}
