import {bounds} from './drawing.mjs?v=0.23.11';
import {ink23Samples} from './ink-engine23.mjs?v=0.23.11';
import {ink24Samples} from './ink-engine24.mjs?v=0.23.11';
export function eraserRasterBounds(s,ratio=1){
 if((s.kind||'ink')==='ink'&&[23,24].includes(s.penModel)&&!s.dashed&&!s.dotted){
  const samples=(s.penModel===24?ink24Samples:ink23Samples)(s);let x=Infinity,y=Infinity,right=-Infinity,bottom=-Infinity;
  for(const p of samples){x=Math.min(x,p.center[0]-p.radius);y=Math.min(y,p.center[1]-p.radius);right=Math.max(right,p.center[0]+p.radius);bottom=Math.max(bottom,p.center[1]+p.radius);}
  if(Number.isFinite(x)){const margin=2/ratio;return {x:x-margin,y:y-margin,r:right+margin,b:bottom+margin};}
 }
 const b=bounds(s),pad=s.size*40+32;return {x:b.x-pad,y:b.y-pad,r:b.x+b.w+pad,b:b.y+b.h+pad};
}
