const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Fixed broad nib: angle is path tangent minus 45 degrees in screen space.
// Down-right is broad, up-right narrow; reversing along the same axis has
// the same footprint, as expected for a fixed nib rather than a direction hack.
export function directionalNib(angle,flatness=.33){const f=clamp(flatness,0,1),minor=.12+.88*(1-f)**5;return Math.sqrt(Math.cos(angle)**2+minor*minor*Math.sin(angle)**2);}
export function directionalBody(p=.5,sensitivity=.5,angle=0,flatness=.33,speed=.5){const pressure=1+(2*clamp(p,0,1)-1)*.2*clamp(sensitivity,0,1),motion=clamp(1.01/(1+.02*clamp(speed,0,5)),.97,1.01);return directionalNib(angle,flatness)*pressure*motion;}
