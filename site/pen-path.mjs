import {adaptiveStabilize} from './adaptive-stabilizer.mjs?v=0.23.11';
import {stabilizeSegment} from './stabilizer.mjs?v=0.23.11';
// Spatial, not time-based: raw Pencil samples remain the source for gestures/storage.
// Uniform arc spacing avoids event-rate-dependent wobble. Local linear fitting
// removes high-frequency jitter without shifting a straight line near its ends.
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const mix=(a,b,t)=>a.map((v,k)=>v+(b[k]-v)*t);
function arc(points){const d=[0];for(let i=1;i<points.length;i++)d.push(d.at(-1)+distance(points[i-1],points[i]));return d;}
function lower(d,v){let a=0,b=d.length-1;while(a<b){const m=(a+b)>>1;if(d[m]<v)a=m+1;else b=m;}return a;}
function corners(points,d,scale){
 const reach=6/scale,candidates=[];
 for(let i=1;i<points.length-1;i++){
  if(d[i]<reach||d.at(-1)-d[i]<reach)continue;
  const a=lower(d,d[i]-reach),b=lower(d,d[i]+reach),p=points[i],u=[p[0]-points[a][0],p[1]-points[a][1]],v=[points[b][0]-p[0],points[b][1]-p[1]],lu=Math.hypot(...u),lv=Math.hypot(...v);
  if(lu<reach*.8||lv<reach*.8)continue;
  const cos=(u[0]*v[0]+u[1]*v[1])/(lu*lv);
  if(cos<.5&&lu/(d[i]-d[a])>.93&&lv/(d[b]-d[i])>.93)candidates.push({i,cos});
 }
 const chosen=[],blocked=new Uint8Array(points.length);
 for(const c of candidates.sort((a,b)=>a.cos-b.cos)){if(blocked[c.i])continue;chosen.push(c.i);for(let j=lower(d,d[c.i]-reach);j<points.length&&d[j]<=d[c.i]+reach;j++)blocked[j]=1;}
 return chosen.sort((a,b)=>a-b);
}
function resample(points,step){
 if(points.length<3)return points;
 const d=arc(points),length=d.at(-1);if(length<step)return [points[0],points.at(-1)];
 step=Math.max(step,length/6000);const out=[points[0]];let j=1;
 for(let t=step;t<length;t+=step){while(j<d.length-1&&d[j]<t)j++;out.push(mix(points[j-1],points[j],(t-d[j-1])/(d[j]-d[j-1]||1)));}
 out.push(points.at(-1));return out;
}
function fit(points,level,scale,step,strength,preserveExtra=false){
 const ps=resample(points,step);if(ps.length<3)return ps;
 const d=arc(ps),radius=(level===2?5:3)*(1+strength)/scale,limit=(level===2?1.8:1)*(1+strength*.5)/scale;
 return ps.map((p,i)=>{
  if(!i||i===ps.length-1)return p;
  let w=0,t1=0,t2=0,x=0,y=0,xt=0,yt=0;
  const first=lower(d,d[i]-radius),last=lower(d,d[i]+radius);
  for(let j=first;j<=last&&j<ps.length;j++){
   const t=d[j]-d[i],q=Math.max(0,1-Math.abs(t)/radius);if(!q)continue;
   w+=q;t1+=q*t;t2+=q*t*t;x+=q*ps[j][0];y+=q*ps[j][1];xt+=q*t*ps[j][0];yt+=q*t*ps[j][1];
  }
  const det=w*t2-t1*t1;if(det<1e-9)return p;
  let dx=(x*t2-t1*xt)/det-p[0],dy=(y*t2-t1*yt)/det-p[1];
  const n=Math.hypot(dx,dy);if(n>limit){dx*=limit/n;dy*=limit/n;}
  return [p[0]+dx,p[1]+dy,...(preserveExtra?p.slice(2):[p[2]])];
 });
}
const cache=new WeakMap();
export function penSegments(points,level=1,scale=1,strength=0,modern=false){
 strength=Number.isFinite(strength)?Math.max(0,Math.min(1,strength)):0;
 if((!level&&!modern)||points.length<3)return [points];
 scale=Number.isFinite(scale)?Math.max(.05,Math.min(8,scale)):1;
 const previous=cache.get(points);if(previous?.length===points.length&&previous.level===level&&previous.scale===scale&&previous.strength===strength&&previous.modern===modern)return previous.result;
 const d=arc(points),anchors=[0,...corners(points,d,scale),points.length-1],result=[],step=Math.max(.8/scale,d.at(-1)/6000);
 for(let i=1;i<anchors.length;i++)result.push(modern?(modern===3?adaptiveStabilize:stabilizeSegment)(fit(points.slice(anchors[i-1],anchors[i]+1),level||1,scale,step,0,modern===3),modern>=2?strength*Math.min(1,Math.max(.15,(d[anchors[i]]-d[anchors[i-1]])*scale/24)):strength,scale):fit(points.slice(anchors[i-1],anchors[i]+1),level,scale,step,strength));
 cache.set(points,{length:points.length,level,scale,strength,modern,result});return result;
}
export function tracePen(ctx,segments){
 let started=false;
 for(const ps of segments){if(!ps.length)continue;const a=ps[0];if(!started){ctx.moveTo(a[0],a[1]);started=true;}
  if(ps.length<3){for(const p of ps.slice(1))ctx.lineTo(p[0],p[1]);continue;}
  for(let i=1;i<ps.length-1;i++){const p=ps[i],q=ps[i+1];ctx.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2);}
  const b=ps.at(-1);ctx.quadraticCurveTo(b[0],b[1],b[0],b[1]);
 }
}
