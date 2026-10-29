// Conservative recognition: repeated, nearly straight, overlapping sweeps.
// All thresholds are in CSS pixels, so zoom does not change the hand gesture.
export function scratchEraseIds(points,strokes,{scale=1,duration=0}={}){
 if(!Number.isFinite(scale)||scale<=0||duration<0||points.length<10)return [];
 const ps=[];for(const p of points){const q=[p[0]*scale,p[1]*scale],last=ps.at(-1);if(!last||Math.hypot(q[0]-last[0],q[1]-last[1])>=1.5)ps.push(q);}
 if(ps.length<10)return [];
 const mean=ps.reduce((a,p)=>[a[0]+p[0]/ps.length,a[1]+p[1]/ps.length],[0,0]);
 let xx=0,xy=0,yy=0;for(const p of ps){const x=p[0]-mean[0],y=p[1]-mean[1];xx+=x*x;xy+=x*y;yy+=y*y;}
 const angle=.5*Math.atan2(2*xy,xx-yy),c=Math.cos(angle),s=Math.sin(angle);
 const project=p=>[(p[0]-mean[0])*c+(p[1]-mean[1])*s,-(p[0]-mean[0])*s+(p[1]-mean[1])*c];
 const qs=ps.map(project),us=qs.map(p=>p[0]),vs=qs.map(p=>p[1]);
 const lo=Math.min(...us),hi=Math.max(...us),bottom=Math.min(...vs),top=Math.max(...vs),span=hi-lo,thick=top-bottom;
 if(span<35||thick<3||thick>span*.6)return [];
 const threshold=Math.max(12,span*.23),sweeps=[];let dir=0,start=0,extreme=0;
 for(let i=1;i<qs.length;i++){
  const u=qs[i][0];if(!dir){if(Math.abs(u-qs[start][0])>=threshold){dir=Math.sign(u-qs[start][0]);extreme=i;}continue;}
  if((u-qs[extreme][0])*dir>=0)extreme=i;
  else if((qs[extreme][0]-u)*dir>=threshold){sweeps.push([start,extreme]);start=extreme;extreme=i;dir=-dir;}
 }
 if(dir)sweeps.push([start,extreme]);
 const valid=sweeps.filter(([a,b])=>{
  const amplitude=Math.abs(qs[b][0]-qs[a][0]);if(amplitude<Math.max(20,span*.65))return false;
  let length=0;for(let i=a+1;i<=b;i++)length+=Math.hypot(ps[i][0]-ps[i-1][0],ps[i][1]-ps[i-1][1]);
  return length<=Math.hypot(ps[b][0]-ps[a][0],ps[b][1]-ps[a][1])*1.35;
 });
 if(valid.length<5)return [];
 // Rounded hairpin turns are valid scratches too. Reject consistent circular
 // winding instead of demanding needle-sharp corners at sampled endpoints.
 let winding=0,turning=0;
 for(let i=1;i<ps.length-1;i++){
  const a=[ps[i][0]-ps[i-1][0],ps[i][1]-ps[i-1][1]],b=[ps[i+1][0]-ps[i][0],ps[i+1][1]-ps[i][1]];
  const angle=Math.atan2(a[0]*b[1]-a[1]*b[0],a[0]*b[0]+a[1]*b[1]);winding+=angle;turning+=Math.abs(angle);
 }
 if(Math.abs(winding)>Math.PI*2.5&&Math.abs(winding)/Math.max(1,turning)>.65)return [];
 const left=Math.max(...valid.map(([a,b])=>Math.min(qs[a][0],qs[b][0]))),right=Math.min(...valid.map(([a,b])=>Math.max(qs[a][0],qs[b][0])));
 if(right-left<span*.45)return [];
 // The gesture is recognized once; erase ink covered by its envelope rather
 // than requiring every letter to be crossed by several individual sweeps.
 const hull=convexHull(ps),pad=8,ids=[];
 for(const stroke of strokes){
  if(stroke.kind&&stroke.kind!=='ink'||!stroke.points?.length)continue;
  const raw=stroke.points.map(p=>[p[0]*scale,p[1]*scale]);
  const target=raw.map(project);
  if(target.some(p=>p[0]<lo-pad||p[0]>hi+pad))continue;
  let total=0,covered=0;
  const check=p=>{total++;if(coveredBy(p,hull,pad))covered++;};
  check(raw[0]);
  for(let i=1;i<raw.length;i++){
   const a=raw[i-1],b=raw[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/4));
   for(let j=1;j<=steps;j++)check([a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps]);
  }
  if(covered/total>=.6)ids.push(stroke.id);
 }
 return ids;
}
function convexHull(points){
 const sorted=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const half=list=>{const out=[];for(const p of list){while(out.length>=2&&cross(out.at(-2),out.at(-1),p)<=0)out.pop();out.push(p);}return out;};
 const low=half(sorted),high=half(sorted.slice().reverse());return low.slice(0,-1).concat(high.slice(0,-1));
}
function coveredBy(p,hull,pad){
 let inside=true;
 for(let i=0;i<hull.length;i++){
  const a=hull[i],b=hull[(i+1)%hull.length],dx=b[0]-a[0],dy=b[1]-a[1];
  if(dx*(p[1]-a[1])-dy*(p[0]-a[0])<0)inside=false;
  const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
  if(Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)<=pad)return true;
 }
 return inside;
}
