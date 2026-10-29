import {cameraPoint} from './revolution.mjs?v=0.23.11';
import {validSolid} from './graph-schema.mjs?v=0.23.11';
export const SOLID_NAMES={cube:'Lập phương',box:'Hộp chữ nhật',pyramid:'Chóp đáy chữ nhật',cylinder:'Hình trụ',cone:'Hình nón',sphere:'Hình cầu'};
export function solidMesh(s){
 if(!validSolid(s))throw Error('Thông số hình không gian không hợp lệ.');
 let w=s.width,h=s.height,d=s.depth;if(s.type==='cube')h=d=w;
 const vertices=[],faces=[];const v=(x,y,z)=>(vertices.push([x,y,z]),vertices.length-1);
 if(['cube','box','pyramid'].includes(s.type)){
  for(const y of [-h/2,h/2])for(const [x,z]of [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]])v(x,y,z);
  if(s.type==='pyramid'){vertices.splice(4);v(0,h/2,0);faces.push([0,3,2,1],[0,1,4],[1,2,4],[2,3,4],[3,0,4]);}
  else faces.push([0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]);
 }else if(s.type==='sphere'){
  const n=24,m=12,r=w/2;v(0,-r,0);for(let i=1;i<m;i++)for(let j=0;j<n;j++){const a=-Math.PI/2+i*Math.PI/m,t=j*Math.PI*2/n;v(r*Math.cos(a)*Math.cos(t),r*Math.sin(a),r*Math.cos(a)*Math.sin(t));}const top=v(0,r,0),at=(i,j)=>1+(i-1)*n+(j+n)%n;
  for(let j=0;j<n;j++){faces.push([0,at(1,j+1),at(1,j)],[top,at(m-1,j),at(m-1,j+1)]);for(let i=1;i<m-1;i++)faces.push([at(i,j),at(i,j+1),at(i+1,j+1),at(i+1,j)]);}
 }else{
  const n=32,r=w/2;for(let j=0;j<n;j++)v(r*Math.cos(j*Math.PI*2/n),-h/2,r*Math.sin(j*Math.PI*2/n));faces.push(Array.from({length:n},(_,j)=>n-1-j));
  if(s.type==='cone'){v(0,h/2,0);for(let j=0;j<n;j++)faces.push([j,(j+1)%n,n]);}
  else{for(let j=0;j<n;j++)v(r*Math.cos(j*Math.PI*2/n),h/2,r*Math.sin(j*Math.PI*2/n));faces.push(Array.from({length:n},(_,j)=>n+j));for(let j=0;j<n;j++)faces.push([j,(j+1)%n,n+(j+1)%n,n+j]);}
 }
 // Orient every face outward; this also supports hidden-edge classification.
 const normal=ids=>{const [a,b,c]=ids.map(i=>vertices[i]),u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-a[i]);return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];};
 for(const f of faces){const n=normal(f),center=f.reduce((a,i)=>a.map((x,k)=>x+vertices[i][k]/f.length),[0,0,0]);if(n.reduce((sum,x,i)=>sum+x*center[i],0)<0)f.reverse();}
 return {vertices,faces};
}
let cachedKey='',cachedMesh;
export function paintSolid(c,w,h,{solid:s,view,axes=true}){
 const key=JSON.stringify([s.type,s.width,s.height,s.depth]);if(key!==cachedKey){cachedMesh=solidMesh(s);cachedKey=key;}const {vertices,faces}=cachedMesh,cam=p=>cameraPoint(p,s.yaw,s.pitch,[0,0]),scale=w/view.span,screen=p=>[w/2+(p[0]-view.x)*scale,h/2-(p[1]-view.y)*scale],points=vertices.map(cam),edges=new Map();
 const drawAxes=()=>{if(axes)for(const [p,label,color]of [[[s.width*.8,0,0],'x','#c5574f'],[[0,s.height*.8,0],'y','#3e875a'],[[0,0,s.depth*.8],'z','#5266b4']]){c.setLineDash([]);c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.moveTo(...screen([0,0,0]));c.lineTo(...screen(cam(p)));c.stroke();c.fillStyle=color;c.font='12px sans-serif';const q=screen(cam(p));c.fillText(label,q[0]+4,q[1]-4);}};
 c.save();c.beginPath();c.rect(0,0,w,h);c.clip();c.lineJoin='round';
 if(s.type==='sphere'){
  const r=s.width/2,center=screen([0,0,0]);c.strokeStyle='#24658f';c.lineWidth=1.7;c.beginPath();c.arc(center[0],center[1],r*scale,0,Math.PI*2);c.stroke();
  // Smooth great circles: collect contiguous front/back arcs, keeping dash
  // phase across samples instead of drawing a separate dash for each edge.
  for(const fn of [t=>[r*Math.cos(t),0,r*Math.sin(t)],t=>[0,r*Math.cos(t),r*Math.sin(t)],t=>[r*Math.cos(t),r*Math.sin(t),0]]){let front=null,previous=null;c.beginPath();for(let i=0;i<=128;i++){const p=cam(fn(i*Math.PI*2/128)),now=p[2]>=-1e-9,q=screen(p);if(now!==front){if(front!==null)c.stroke();c.beginPath();c.strokeStyle=now?'#24658f':'#7793a6';c.lineWidth=now?1.4:1;c.setLineDash(now?[]:[5,5]);if(previous)c.moveTo(...previous);else c.moveTo(...q);front=now;}c.lineTo(...q);previous=q;}c.stroke();}
  c.setLineDash([]);drawAxes();c.restore();return;
 }
 const front=faces.map(f=>{const [a,b,d]=f.map(i=>points[i]);return (b[0]-a[0])*(d[1]-a[1])-(b[1]-a[1])*(d[0]-a[0])>1e-9;});
 faces.forEach((f,i)=>{for(let j=0;j<f.length;j++){const a=f[j],b=f[(j+1)%f.length],key=[Math.min(a,b),Math.max(a,b)].join(':');if(!edges.has(key))edges.set(key,{a,b,front:false,frontCount:0,count:0});const edge=edges.get(key);edge.front||=front[i];edge.frontCount+=Number(front[i]);edge.count++;}});
 // Light face tint only on polyhedra; dense curved meshes remain wireframes.
 if(['cube','box','pyramid'].includes(s.type))for(let i=0;i<faces.length;i++)if(front[i]){c.fillStyle='#3187bb12';c.beginPath();faces[i].forEach((v,j)=>c[j?'lineTo':'moveTo'](...screen(points[v])));c.closePath();c.fill();}
 const curved=['cylinder','cone','sphere'].includes(s.type);for(const {a,b,front,frontCount,count}of edges.values()){
  // Sparse generators keep the curved models readable and inexpensive.
  const silhouette=frontCount>0&&frontCount<count;
  if(curved&&s.type!=='sphere'&&Math.abs(vertices[a][1]-vertices[b][1])>1e-8&&!silhouette){const base=s.type==='cone'?(a<32?a:b):a;if(base%8!==0)continue;}
  if(s.type==='sphere'&&a>0&&b>0&&a<vertices.length-1&&b<vertices.length-1){const sameRing=Math.abs(vertices[a][1]-vertices[b][1])<1e-8;if(!sameRing&&(a-1)%4!==0)continue;if(sameRing&&Math.round((a-1)/24)%3!==0)continue;}
  c.strokeStyle=front?'#24658f':'#64849a';c.lineWidth=front?1.7:1;c.setLineDash(front?[]:[5,5]);c.beginPath();c.moveTo(...screen(points[a]));c.lineTo(...screen(points[b]));c.stroke();
 }
 c.setLineDash([]);drawAxes();
 if(s.labels&&vertices.length<=8){c.font='17px sans-serif';c.fillStyle='#254e6b';vertices.forEach((_,i)=>{const p=screen(points[i]);c.fillText(s.type==='pyramid'&&i===4?'S':['A','B','C','D','A′','B′','C′','D′'][i],p[0]+5,p[1]-6);});}c.restore();
}
