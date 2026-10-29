import {hitStroke} from './drawing.mjs?v=0.23.11';
const cache=new WeakMap();
function box(points){let b=cache.get(points);if(!b){b={x:Infinity,y:Infinity,r:-Infinity,b:-Infinity};for(const p of points){b.x=Math.min(b.x,p[0]);b.y=Math.min(b.y,p[1]);b.r=Math.max(b.r,p[0]);b.b=Math.max(b.b,p[1]);}cache.set(points,b);}return b;}
function pointDistance(p,a,b){const x=b[0]-a[0],y=b[1]-a[1],d=x*x+y*y,t=d?Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/d)):0;return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*y);}
function cross(a,b,c){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
function segmentDistance(a,b,c,d){const u=cross(a,b,c),v=cross(a,b,d),w=cross(c,d,a),z=cross(c,d,b);if(((u>0&&v<0)||(u<0&&v>0))&&((w>0&&z<0)||(w<0&&z>0)))return 0;return Math.min(pointDistance(a,c,d),pointDistance(b,c,d),pointDistance(c,a,b),pointDistance(d,a,b));}
export function strokeHitsSweep(s,a,b,r,visibleHit){if(s.kind&&s.kind!=='ink'&&!s.quickShape)return false;const bb=box(s.points);
 if(s.erasePolygons?.length&&visibleHit){const broad=r+s.size*40+32;if(!s.quickShape&&(bb.r+broad<Math.min(a[0],b[0])||bb.x-broad>Math.max(a[0],b[0])||bb.b+broad<Math.min(a[1],b[1])||bb.y-broad>Math.max(a[1],b[1])))return false;return visibleHit(s,a,b,r);}
 const pad=r+s.size/2;if(!s.quickShape&&(bb.r+pad<Math.min(a[0],b[0])||bb.x-pad>Math.max(a[0],b[0])||bb.b+pad<Math.min(a[1],b[1])||bb.y-pad>Math.max(a[1],b[1])))return false;
 const confirm=()=>s.erasePolygons?.length&&visibleHit?visibleHit(s,a,b,r):true;
 if(s.quickShape){const steps=Math.max(1,Math.min(4000,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/Math.max(1,r/2))));return hitStroke(s,Array.from({length:steps+1},(_,i)=>a.map((v,k)=>v+(b[k]-v)*i/steps)),r)&&confirm();}
 if(s.points.length===1)return pointDistance(s.points[0],a,b)<=pad&&confirm();
 for(let i=1;i<s.points.length;i++)if(segmentDistance(a,b,s.points[i-1],s.points[i])<=pad)return confirm();return false;
}
