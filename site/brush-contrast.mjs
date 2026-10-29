import {curvedInkPoints} from './ink-smoothing.mjs?v=0.23.11';
// Exponential contrast around neutral force: neutral width = nominal mm size.
// At full sensitivity, pressure 0.1 / 0.9 gives roughly 62:1 width contrast.
export function contrastBrushWidth(pressure=.5,sensitivity=.5){
 const p=Math.max(0,Math.min(1,pressure)),s=Math.max(0,Math.min(1,sensitivity));
 return Math.max(.04,Math.min(3.2,Math.exp(3.7*s*(2*p-1))));
}
export function contrastBrushSamples(points,size,sensitivity=.5){return curvedInkPoints(points).map(p=>({center:p,radius:size/2*contrastBrushWidth(p[2],sensitivity)}));}
