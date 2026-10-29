const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// One nominal width: neutral pressure (.5), reference speed (.5 CSS px/ms),
// and a 45-degree nib projection all give multiplier 1 for every writing pen.
export function calibratedWidth(p=.5,sensitivity=.5,brush=false){return clamp(1+(clamp(p,0,1)*2-1)*clamp(sensitivity,0,1)*(brush?1.7:1.3),brush?.15:.35,brush?1.85:1.65);}
export function calibratedNib(angle,flatness=0){const minor=1-.65*clamp(flatness,0,1);return clamp(Math.sqrt(Math.cos(angle)**2+minor*minor*Math.sin(angle)**2)/Math.sqrt((1+minor*minor)/2),.55,1.3);}
export function calibratedMotion(speed=.5){return clamp(1.08/(1+.16*clamp(speed,0,5)),.85,1.08);}
export function calibratedBody(p,sensitivity,brush,angle,flatness,speed){return clamp(calibratedWidth(p,sensitivity,brush)*(brush?1:calibratedNib(angle,flatness))*calibratedMotion(speed),brush?.2:.3,1.85);}
