// Speed-adaptive cleanup followed by a short, distance-weighted curve fit.
// Balanced windows keep the tip attached; only the short trailing curve refits.
// Raw input is never changed.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const cache=new WeakMap();
export function fitRadius(level=0){
 const x=clamp(level,0,1),anchors=[[0,.2],[.05,1.3],[.1,3.5],[.15,7],[.2,12],[.5,28],[.75,43],[1,60]],i=anchors.findIndex(([v])=>v>=x);
 if(i<=0)return anchors[0][1];const [a,u]=anchors[i-1],[b,v]=anchors[i];return u+(v-u)*(x-a)/(b-a);
}
export function adaptivePath(stroke){
 const ps=stroke.points,scale=clamp(stroke.smoothingScale||1,.05,8),level=clamp(stroke.penTuning?.stability??0,0,1),key=[scale,level].join(':');let s=cache.get(ps);
 if(!s||s.key!==key||s.count>ps.length){s={key,count:0,base:[],arc:[],radii:[],out:[],sealed:1};cache.set(ps,s);}
 for(let i=s.count;i<ps.length;i++){
  const p=ps[i];if(!i){s.base.push([...p]);s.arc.push(0);s.radii.push(fitRadius(level));s.out.push([...p]);continue;}
  const a=ps[i-1],last=s.base[i-1],step=Math.hypot(p[0]-a[0],p[1]-a[1])*scale,dt=clamp((stroke.penTimes?.[i]??i*8)-(stroke.penTimes?.[i-1]??(i-1)*8),.25,100),speed=step/dt;
  const tau=1.5/(1+speed*5),alpha=1-Math.exp(-dt/tau);
  s.base.push([last[0]+alpha*(p[0]-last[0]),last[1]+alpha*(p[1]-last[1]),p[2]]);s.arc.push(s.arc[i-1]+step);
  s.radii.push(fitRadius(level)/(1+Math.min(5,speed)*.12));s.out.push([...p]);
 }
 s.count=ps.length;if(ps.length<2)return s.out;
 const end=s.arc.at(-1),at=d=>{let lo=0,hi=s.arc.length-1;while(lo<hi){const m=(lo+hi)>>1;if(s.arc[m]<d)lo=m+1;else hi=m;}if(!lo)return s.base[0];const a=lo-1,span=s.arc[lo]-s.arc[a],t=span?(d-s.arc[a])/span:0;return [s.base[a][0]+(s.base[lo][0]-s.base[a][0])*t,s.base[a][1]+(s.base[lo][1]-s.base[a][1])*t];};
 for(let i=s.sealed;i<ps.length;i++){
  const d=s.arc[i],r=s.radii[i],balanced=Math.min(r,d,end-d),left=balanced,right=balanced;let x=s.base[i][0],y=s.base[i][1],w=1;
  // Equal arc-length samples: force events at rest cannot overweight geometry.
  for(const span of [-left,right])if(Math.abs(span)>1e-6)for(let k=1,n=Math.max(6,Math.ceil(Math.abs(span)/.35));k<=n;k++){const offset=span*k/n,weight=Math.exp(-2*(offset/r)**2),p=at(d+offset);x+=p[0]*weight;y+=p[1]*weight;w+=weight;}
  s.out[i]=i===ps.length-1?[...ps[i]]:[x/w,y/w,ps[i][2]];
  // Preserve intentional mathematical corners at ordinary writing levels.
  if(level<=.1&&i>0&&i+1<ps.length){const a=ps[i-1],p=ps[i],b=ps[i+1],ux=p[0]-a[0],uy=p[1]-a[1],vx=b[0]-p[0],vy=b[1]-p[1],u=Math.hypot(ux,uy),v=Math.hypot(vx,vy);if(Math.min(u,v)*scale>2.5&&(ux*vx+uy*vy)/(u*v)<.35)s.out[i]=[...p];}
  if(i===s.sealed&&end-d>=r&&i+1<ps.length)s.sealed=i+1;
 }
 return s.out;
}
