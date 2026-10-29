const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const segmentDistance=(p,a,b)=>{const x=b[0]-a[0],y=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/(x*x+y*y||1)));return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*y);};
function simplify(ps,tolerance){
 if(ps.length<3)return ps;let max=0,index=0;for(let i=1;i<ps.length-1;i++){const d=segmentDistance(ps[i],ps[0],ps.at(-1));if(d>max){max=d;index=i;}}
 return max<=tolerance?[ps[0],ps.at(-1)]:simplify(ps.slice(0,index+1),tolerance).slice(0,-1).concat(simplify(ps.slice(index),tolerance));
}
export function recognizeQuickShape(points,scale=1){
 if(points.length<3||!Number.isFinite(scale)||scale<=0)return null;
 let ps=[];for(const p of points){const q=[p[0]*scale,p[1]*scale];if(!ps.length||distance(q,ps.at(-1))>=1.5)ps.push(q);}
 if(ps.length<3)return null;
 // Bound recognition work for very long strokes without changing stored ink.
 if(ps.length>512){const input=ps;ps=Array.from({length:512},(_,i)=>input[Math.round(i*(input.length-1)/511)]);}
 const lengths=ps.slice(1).map((p,i)=>distance(p,ps[i])),length=lengths.reduce((a,b)=>a+b,0),first=ps[0],last=ps.at(-1),direct=distance(first,last);
 const output=(kind,pts)=>({kind,points:pts.map(p=>[p[0]/scale,p[1]/scale,.5])});
 if(direct>=30&&length/direct<1.12&&ps.every(p=>segmentDistance(p,first,last)<=Math.max(3,direct*.04)))return output('line',[first,last]);
 const xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,diagonal=Math.hypot(w,h);
 if(Math.min(w,h)<24||direct>Math.max(12,diagonal*.25))return null;
 const close=ps.concat([first]);let far=1;for(let i=2;i<ps.length;i++)if(distance(first,ps[i])>distance(first,ps[far]))far=i;
 const tolerance=Math.max(3,diagonal*.035);
 let corners=simplify(close.slice(0,far+1),tolerance).slice(0,-1).concat(simplify(close.slice(far),tolerance).slice(0,-1));
 // Remove a redundant starting point when a closed shape starts along an edge.
 let changed=true;while(changed&&corners.length>3){changed=false;for(let i=0;i<corners.length;i++)if(segmentDistance(corners[i],corners[(i+corners.length-1)%corners.length],corners[(i+1)%corners.length])<=tolerance){corners.splice(i,1);changed=true;break;}}
 if(corners.length===3||corners.length===4){
  const perimeter=corners.reduce((n,p,i)=>n+distance(p,corners[(i+1)%corners.length]),0);
  const error=ps.every(p=>Math.min(...corners.map((a,i)=>segmentDistance(p,a,corners[(i+1)%corners.length])))<=tolerance*1.5);
  if(error&&length/perimeter>.8&&length/perimeter<1.22){
   if(corners.length===3){const [a,b,c]=corners,area=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]));if(area>diagonal*diagonal*.12)return output('triangle',corners);}
   else{
    const angles=corners.map((b,i)=>{const a=corners[(i+3)%4],c=corners[(i+1)%4];return Math.abs(((a[0]-b[0])*(c[0]-b[0])+(a[1]-b[1])*(c[1]-b[1]))/(distance(a,b)*distance(c,b)||1));});
    if(angles.every(v=>v<.3)){
     const a=corners[0],b=corners[1],angle=Math.atan2(b[1]-a[1],b[0]-a[0]),c=Math.cos(angle),s=Math.sin(angle),us=corners.map(p=>p[0]*c+p[1]*s),vs=corners.map(p=>-p[0]*s+p[1]*c),u=Math.min(...us),v=Math.min(...vs),uw=Math.max(...us),vh=Math.max(...vs);
     return output('rect',[[u,v],[uw,v],[uw,vh],[u,vh]].map(([p,q])=>[p*c-q*s,p*s+q*c]));
    }
   }
  }
 }
 const handPolygon=fitHandPolygon(ps,length,diagonal);
 if(handPolygon)return output(handPolygon.kind,handPolygon.points);
 const rx=w/2,ry=h/2,cx=x+rx,cy=y+ry;
 if(Math.max(rx/ry,ry/rx)>5)return null;
 const errors=ps.map(p=>Math.abs(Math.hypot((p[0]-cx)/rx,(p[1]-cy)/ry)-1)),perimeter=Math.PI*(3*(rx+ry)-Math.sqrt((3*rx+ry)*(rx+3*ry)));
 if(errors.reduce((a,b)=>a+b,0)/errors.length>.085||Math.max(...errors)>.24||length/perimeter<.8||length/perimeter>1.25)return null;
 const circle=Math.abs(w-h)/Math.max(w,h)<.14,r=(rx+ry)/2;
 return output('ellipse',[[cx-(circle?r:rx),cy-(circle?r:ry)],[cx+(circle?r:rx),cy+(circle?r:ry)]]);
}
function fitHandPolygon(ps,length,diagonal){
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const sorted=ps.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const half=list=>{const result=[];for(const p of list){while(result.length>1&&cross(result.at(-2),result.at(-1),p)<=0)result.pop();result.push(p);}return result;};
 const hull=half(sorted).slice(0,-1).concat(half(sorted.slice().reverse()).slice(0,-1));
 if(hull.length<3)return null;
 const fits=(corners,meanLimit,peakLimit,cornerLimit)=>{
  const perimeter=corners.reduce((n,p,i)=>n+distance(p,corners[(i+1)%corners.length]),0);
  if(length/perimeter<.72||length/perimeter>1.3)return false;
  const errors=ps.map(p=>Math.min(...corners.map((a,i)=>segmentDistance(p,a,corners[(i+1)%corners.length])))).sort((a,b)=>a-b);
  return errors.reduce((a,b)=>a+b,0)/errors.length<meanLimit&&errors[Math.floor((errors.length-1)*.95)]<peakLimit&&corners.every(c=>Math.min(...ps.map(p=>distance(c,p)))<cornerLimit);
 };
 // Minimum-area oriented box tolerates bowed sides and rounded corners.
 let box=null;
 for(let i=0;i<hull.length;i++){
  const a=hull[i],b=hull[(i+1)%hull.length],angle=Math.atan2(b[1]-a[1],b[0]-a[0]),c=Math.cos(angle),s=Math.sin(angle),us=hull.map(p=>p[0]*c+p[1]*s),vs=hull.map(p=>-p[0]*s+p[1]*c),u=Math.min(...us),v=Math.min(...vs),right=Math.max(...us),bottom=Math.max(...vs),w=right-u,h=bottom-v;
  if(!box||w*h<box.area)box={area:w*h,short:Math.min(w,h),points:[[u,v],[right,v],[right,bottom],[u,bottom]].map(([x,y])=>[x*c-y*s,x*s+y*c])};
 }
 if(box.short>=24&&fits(box.points,diagonal*.035,diagonal*.075,Math.max(6,box.short*.18)))return {kind:'rect',points:box.points};
 // Reduce the convex outline to three principal corners, then fit each side.
 let corners=hull.slice();while(corners.length>3){let best=0,area=Infinity;for(let i=0;i<corners.length;i++){const n=Math.abs(cross(corners[(i+corners.length-1)%corners.length],corners[i],corners[(i+1)%corners.length]));if(n<area){area=n;best=i;}}corners.splice(best,1);}
 const sides=corners.map((a,i)=>{
  const b=corners[(i+1)%3],group=ps.filter(p=>{const ds=corners.map((q,j)=>segmentDistance(p,q,corners[(j+1)%3]));return ds[i]<=Math.min(...ds)+.001;});
  if(group.length<3)return {center:a,vector:[b[0]-a[0],b[1]-a[1]]};
  const center=group.reduce((n,p)=>[n[0]+p[0]/group.length,n[1]+p[1]/group.length],[0,0]);let xx=0,xy=0,yy=0;
  for(const p of group){const x=p[0]-center[0],y=p[1]-center[1];xx+=x*x;xy+=x*y;yy+=y*y;}
  const angle=.5*Math.atan2(2*xy,xx-yy);return {center,vector:[Math.cos(angle),Math.sin(angle)]};
 });
 const refined=sides.map((side,i)=>{const other=sides[(i+2)%3],a=side.center,b=other.center,u=side.vector,v=other.vector,den=u[0]*v[1]-u[1]*v[0];if(Math.abs(den)<.15)return corners[i];const t=((b[0]-a[0])*v[1]-(b[1]-a[1])*v[0])/den,q=[a[0]+t*u[0],a[1]+t*u[1]];return distance(q,corners[i])<diagonal*.18?q:corners[i];});
 if(Math.abs(cross(...refined))>diagonal*diagonal*.08&&fits(refined,diagonal*.027,diagonal*.065,diagonal*.14))return {kind:'triangle',points:refined};
 return null;
}
export function resizeQuickShape(shape,anchor,p,width,height){
 if(shape.kind==='line')return {...shape,points:[shape.points[0],p]};
 const xs=shape.points.map(p=>p[0]),ys=shape.points.map(p=>p[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
 const initial=Math.hypot(anchor[0]-cx,anchor[1]-cy);if(initial<1)return shape;
 let factor=Math.max(.15,Math.min(4,Math.hypot(p[0]-cx,p[1]-cy)/initial));
 for(const q of shape.points){const dx=q[0]-cx,dy=q[1]-cy;if(dx)factor=Math.min(factor,(dx>0?width-cx:cx)/Math.abs(dx));if(dy)factor=Math.min(factor,(dy>0?height-cy:cy)/Math.abs(dy));}
 return {...shape,points:shape.points.map(q=>[cx+(q[0]-cx)*factor,cy+(q[1]-cy)*factor,q[2]])};
}
