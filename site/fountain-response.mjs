const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// New calligraphic response, versioned separately from existing saved strokes.
// Sensitivity controls contrast rather than inflating both light and heavy ink.
export function fountainWidth(pressure,sensitivity=.5){const s=clamp(sensitivity,0,1);if(s===0)return .62;const p=clamp(.5+(clamp(pressure,0,1)-.5)*(1+3*s),0,1),curve=p*p*(3-2*p);return .08+.92*curve;}
export function fountainNib(angle,flatness=.33){const minor=1-.88*clamp(flatness,0,1);return Math.sqrt(Math.cos(angle)**2+minor*minor*Math.sin(angle)**2);}
