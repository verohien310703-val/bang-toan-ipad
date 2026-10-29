import {curvedInkPoints} from './ink-smoothing.mjs?v=0.23.11';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// Pressure gain, not a hard maximum on the nib size. Input force remains 0..1.
export const brushV12Reference=sensitivity=>.25*Math.exp(-1.4*clamp(sensitivity,0,1));
export function brushV12Width(pressure=.5,sensitivity=.5){
 const p=clamp(pressure,0,1),s=clamp(sensitivity,0,1),blend=Math.min(1,2*s);
 return Math.max(.03,1-blend+blend*(p/brushV12Reference(s))**1.3);
}
// Endpoint taper is distance-based; only the last segment may taper.
export function brushV12Samples(points,size,tuning={},scale=1){
 const ps=curvedInkPoints(points),d=[0];for(let i=1;i<ps.length;i++)d.push(d[i-1]+Math.hypot(ps[i][0]-ps[i-1][0],ps[i][1]-ps[i-1][1]));
 const length=d.at(-1)||0,tail=Math.min(length*.25,Math.max(size*1.5,4/Math.max(.05,scale))),amount=clamp(tuning.taper??0,0,1)*clamp(tuning.endTaper??0,0,1);
 return ps.map((p,i)=>{const t=tail?clamp((length-d[i])/tail,0,1):1,edge=t*t*(3-2*t);return {center:p,radius:size/2*brushV12Width(p[2],tuning.sensitivity)*(1-amount*(1-edge))};});
}
