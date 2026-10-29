import {compileGraph} from './graph-math.mjs?v=0.23.11';
export const revolutionViews={book:{yaw:-.32,pitch:.18},front:{yaw:0,pitch:0},top:{yaw:0,pitch:Math.PI/2},side:{yaw:Math.PI/2,pitch:0}};
export function constantValue(text){if(/x/i.test(String(text).replace(/exp/gi,'')))throw Error('Cận phải là số hoặc biểu thức hằng, ví dụ 2pi.');const v=compileGraph(String(text))(0);if(!Number.isFinite(v)||Math.abs(v)>1e4)throw Error('Cận phải hữu hạn và trong ±10.000.');return v;}
export function checkRevolution(r,rows,parameter){
 if(!r||!Number.isFinite(r.angle)||r.angle<0||r.angle>360||!Number.isFinite(r.yaw)||Math.abs(r.yaw)>Math.PI||!Number.isFinite(r.pitch)||Math.abs(r.pitch)>Math.PI/2||!['x','y'].includes(r.axis)||!Number.isFinite(r.a)||!Number.isFinite(r.b)||r.a>=r.b||r.b-r.a<1e-6||Math.max(Math.abs(r.a),Math.abs(r.b))>1e4)throw Error('Nhập cận trái nhỏ hơn cận phải, trong ±10.000.');
 if(!Number.isInteger(r.first)||r.first<0||r.first>=rows.length||!Number.isInteger(r.second)||r.second< -1||r.second>=rows.length||r.first===r.second)throw Error('Chọn hai đường biên khác nhau.');
 const f=compileGraph(rows[r.first].text,parameter?.value),g=r.second<0?()=>0:compileGraph(rows[r.second].text,parameter?.value);let area=0;
 for(let i=0;i<=240;i++){const x=r.a+(r.b-r.a)*i/240,a=f(x),b=g(x);if(![a,b].every(v=>Number.isFinite(v)&&Math.abs(v)<=1e4))throw Error('Đường biên không hữu hạn trên khoảng đã chọn. Hãy đổi cận.');area+=Math.abs(a-b);}
 if(area<1e-9)throw Error('Hai đường biên trùng nhau trên khoảng đã chọn.');return {f,g};
}
// Rigid rotation: lengths and distances to the rotation axis are preserved.
export function revolvePoint(x,y,theta,axis){return axis==='x'?[x,y*Math.cos(theta),y*Math.sin(theta)]:[x*Math.cos(theta),y,-x*Math.sin(theta)];}
export function cameraPoint(p,yaw,pitch,center){const x=p[0]-center[0],y=p[1]-center[1],z=p[2],xx=x*Math.cos(yaw)-z*Math.sin(yaw),zz=x*Math.sin(yaw)+z*Math.cos(yaw);return [xx,y*Math.cos(pitch)-zz*Math.sin(pitch),y*Math.sin(pitch)+zz*Math.cos(pitch)];}
export function revolutionMesh(r,rows,nx=40,na=48,parameter){let {f,g}=checkRevolution(r,rows,parameter);if(r.axis==='x'&&r.angle===360){const f0=f,g0=g;f=x=>Math.max(Math.abs(f0(x)),Math.abs(g0(x)));g=x=>f0(x)*g0(x)<=0?0:Math.min(Math.abs(f0(x)),Math.abs(g0(x)));}const sweep=r.angle*Math.PI/180;const grids=[f,g].map(fn=>Array.from({length:nx+1},(_,i)=>{const x=r.a+(r.b-r.a)*i/nx,y=fn(x);return Array.from({length:na+1},(_,j)=>revolvePoint(x,y,sweep*j/na,r.axis));}));const faces=[];
 if(r.angle>0){for(const grid of grids)for(let i=0;i<nx;i++)for(let j=0;j<na;j++)faces.push([grid[i][j],grid[i+1][j],grid[i+1][j+1],grid[i][j+1]]);
 for(const i of [0,nx])for(let j=0;j<na;j++)faces.push([grids[0][i][j],grids[1][i][j],grids[1][i][j+1],grids[0][i][j+1]]);}
 // The original region and the moving sweep face.
 for(const j of r.angle===360?[0]:[0,na])for(let i=0;i<nx;i++)faces.push([grids[0][i][j],grids[0][i+1][j],grids[1][i+1][j],grids[1][i][j]]);
 const samples=grids.flat(2),center=r.axis==='x'?[(r.a+r.b)/2,0]:[0,(Math.min(...samples.map(p=>p[1]))+Math.max(...samples.map(p=>p[1])))/2];return {grids,faces,center,nx,na};}
let cachedKey='',cachedMesh;
export function paintRevolution(c,w,h,{view,rows,revolution:r,parameter}){
 if(!r)return;let mesh;const key=JSON.stringify([r.axis,r.a,r.b,r.first,r.second,r.angle,rows.map(v=>v.text),parameter?.value]);try{if(key!==cachedKey){cachedMesh=revolutionMesh(r,rows,40,48,parameter);cachedKey=key;}mesh=cachedMesh;}catch{return;}
 const scale=w/view.span,anchor=[w/2+(mesh.center[0]-view.x)*scale,h/2-(mesh.center[1]-view.y)*scale],cam=p=>cameraPoint(p,r.yaw,r.pitch,mesh.center),screen=p=>[anchor[0]+p[0]*scale,anchor[1]-p[1]*scale];
 c.save();c.beginPath();c.rect(0,0,w,h);c.clip();
 const faces=mesh.faces.map(v=>{const pts=v.map(cam);return {pts,z:pts.reduce((s,p)=>s+p[2],0)/pts.length};}).sort((a,b)=>a.z-b.z);
 for(const {pts}of faces){const a=pts[0],b=pts[1],d=pts[2],u=b.map((v,i)=>v-a[i]),v=d.map((v,i)=>v-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n);if(len<1e-12)continue;const light=Math.abs((n[0]*.2+n[1]*.5+n[2]*.84)/len);c.fillStyle=`rgba(${Math.round(80+45*light)},${Math.round(150+35*light)},${Math.round(210+30*light)},.15)`;c.beginPath();pts.forEach((p,i)=>{const [x,y]=screen(p);i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();c.fill();}
 const line=(points,strong=false)=>{const projected=points.map(cam);for(let i=1;i<projected.length;i++){const back=(projected[i][2]+projected[i-1][2])<0;c.setLineDash(back&&!strong?[4,4]:[]);c.strokeStyle=strong?'#47647e':back?'#6488a768':'#547c9fa6';c.lineWidth=strong?1.3:.75;c.beginPath();c.moveTo(...screen(projected[i-1]));c.lineTo(...screen(projected[i]));c.stroke();}};
 for(const grid of mesh.grids){for(let i=0;i<=mesh.nx;i+=8){if(i===0||i===mesh.nx){const p=grid[i][0];line(Array.from({length:129},(_,j)=>revolvePoint(p[0],p[1],r.angle*Math.PI/180*j/128,r.axis)),true);}else line(grid[i]);}if(mesh.nx%8)line(grid[mesh.nx],true);for(let j=0;j<=mesh.na;j+=6)line(grid.map(row=>row[j]));}
 // A visible border on both ends of the swept region.
 for(const i of [0,mesh.nx])for(const j of [0,mesh.na])line([mesh.grids[0][i][j],mesh.grids[1][i][j]],true);
 c.setLineDash([]);c.restore();
}
