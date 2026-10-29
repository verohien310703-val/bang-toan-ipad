import {curvedInkPoints} from './ink-smoothing.mjs?v=0.23.11';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// Bounded, continuous response with no hard-clipped pressure interval.
// Nominal width occurs at 25% force; preserve the full light-to-heavy range.
export function brushV11Width(pressure=.5,sensitivity=.5){
 const raw=clamp(pressure,0,1),p=raw<=.25?raw*2:.5+(raw-.25)*2/3,s=clamp(sensitivity,0,1),strength=1-(1-s)**2.5;
 const response=Math.tanh(2*(2*p-1))/Math.tanh(2);
 return 1+strength*response*(p<.5?.96:1.7);
}
// Endpoint taper is distance-based; only the last segment may taper.
export function brushV11Samples(points,size,tuning={},scale=1){
 const ps=curvedInkPoints(points),d=[0];for(let i=1;i<ps.length;i++)d.push(d[i-1]+Math.hypot(ps[i][0]-ps[i-1][0],ps[i][1]-ps[i-1][1]));
 const length=d.at(-1)||0,tail=Math.min(length*.25,Math.max(size*1.5,4/Math.max(.05,scale))),amount=clamp(tuning.taper??0,0,1)*clamp(tuning.endTaper??0,0,1);
 return ps.map((p,i)=>{const t=tail?clamp((length-d[i])/tail,0,1):1,edge=t*t*(3-2*t);return {center:p,radius:size/2*brushV11Width(p[2],tuning.sensitivity)*(1-amount*(1-edge))};});
}
