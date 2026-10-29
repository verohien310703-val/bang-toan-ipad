import {curvedInkPoints} from './ink-smoothing.mjs?v=0.23.11';
// A circular soft nib: neutral force matches the shared nominal size.
// No velocity thinning or forced tail; retained pressure controls both.
export function brushWidth(pressure=.5,sensitivity=.5){
 const p=Math.max(0,Math.min(1,pressure)),s=Math.min(1,2*Math.max(0,Math.min(1,sensitivity)));
 return 1+s*(p<.5?-.95*(1-2*p):1.8*(2*p-1));
}
export function brushSamples(points,size,sensitivity=.5){
 return curvedInkPoints(points).map(p=>({center:p,radius:size/2*brushWidth(p[2],sensitivity)}));
}
