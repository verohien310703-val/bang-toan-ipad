// Rendering only: retain the original points for editing, erasing and gestures.
export function smoothInkPoints(points,level=1){
 if(!level||points.length<3)return points;
 const weight=level===2?.32:.2,limit=level===2?2.2:1.2;
 return points.map((p,i)=>{
  if(!i||i===points.length-1)return p;
  const a=points[i-1],b=points[i+1],u=[p[0]-a[0],p[1]-a[1]],v=[b[0]-p[0],b[1]-p[1]],lu=Math.hypot(...u),lv=Math.hypot(...v);
  // Keep deliberate corners on long enough legs (roots, triangles, axes).
  if(Math.min(lu,lv)>=4&&(u[0]*v[0]+u[1]*v[1])/(lu*lv||1)<.4)return p;
  let dx=((a[0]+b[0])/2-p[0])*weight,dy=((a[1]+b[1])/2-p[1])*weight;
  const d=Math.hypot(dx,dy);if(d>limit){dx*=limit/d;dy*=limit/d;}
  return [p[0]+dx,p[1]+dy,p[2]];
 });
}
export function curvedInkPoints(ps){
 if(ps.length<3)return ps;
 const out=[ps[0]];let start=ps[0];
 for(let i=1;i<ps.length;i++){
  const control=ps[i],next=ps[i+1],end=next?control.map((x,j)=>(x+next[j])/2):control;
  const length=Math.hypot(control[0]-start[0],control[1]-start[1])+Math.hypot(end[0]-control[0],end[1]-control[1]);
  const count=Math.max(1,Math.min(12,Math.ceil(length/2)));
  for(let k=1;k<=count;k++){const t=k/count,u=1-t;out.push(start.map((x,j)=>u*u*x+2*u*t*control[j]+t*t*end[j]));}
  start=end;
 }
 return out;
}
export function pressureOutline(points,size,tuning){
 const ps=curvedInkPoints(points);if(ps.length<2)return null;
 const left=[],right=[];let pressure=ps[0][2];
 for(let i=0;i<ps.length;i++){
  pressure+=((ps[i][2]??.5)-pressure)*.35;
  const before=ps[Math.max(0,i-1)],after=ps[Math.min(ps.length-1,i+1)];
  let dx=after[0]-before[0],dy=after[1]-before[1],len=Math.hypot(dx,dy);
  if(len<.001){dx=1;dy=0;len=1;}
  let value=Math.max(0,Math.min(1,pressure));if(tuning)value=Math.max(0,Math.min(1,.5+(value-.5)*2*tuning.sensitivity));if(tuning?.response)value=Math.pow(value,tuning.brush?1.5:.85);let radius=size*((tuning?.brush ? .1 : .35)+(tuning?.brush ? .9 : .65)*value)/2;if(tuning){const edge=Math.min(1,(i+1)/(ps.length*.12),(ps.length-i)/(ps.length*.12));radius*=1-tuning.taper*(1-edge);radius*=1-tuning.flatness*.65*Math.abs(Math.sin(Math.atan2(dy,dx)+Math.PI/4));}
  left.push([ps[i][0]-dy/len*radius,ps[i][1]+dx/len*radius]);
  right.push([ps[i][0]+dy/len*radius,ps[i][1]-dx/len*radius]);
 }
 return {left,right,start:ps[0],end:ps.at(-1),startRadius:tuning?Math.hypot(left[0][0]-ps[0][0],left[0][1]-ps[0][1]):size*(.35+.65*ps[0][2])/2,endRadius:tuning?Math.hypot(left.at(-1)[0]-ps.at(-1)[0],left.at(-1)[1]-ps.at(-1)[1]):size*(.35+.65*pressure)/2};
}
