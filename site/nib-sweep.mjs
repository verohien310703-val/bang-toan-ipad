// Union of a fixed elliptical nib swept along the curve. Unlike a normal-offset
// ribbon this cannot fold through itself at tight loops or cusps.
export function traceNibSweep(ctx,samples,flatness=.33,minorOverride){const minor=Number.isFinite(minorOverride)?Math.max(.02,Math.min(1,minorOverride)):.12+.88*(1-Math.max(0,Math.min(1,flatness)))**5,c=Math.SQRT1_2,s=-Math.SQRT1_2;
 const local=p=>[(p[0]*c+p[1]*s),(p[1]*c-p[0]*s)/minor],world=p=>[p[0]*c-p[1]*minor*s,p[0]*s+p[1]*minor*c];
 let prev;for(const sample of samples){const p=sample.center,r=sample.radius;if(r>1e-7){ctx.moveTo(p[0]+c*r,p[1]+s*r);ctx.ellipse(p[0],p[1],r,r*minor,-Math.PI/4,0,Math.PI*2);ctx.closePath();}
 if(prev){const a=local(prev.center),b=local(p),ra=prev.radius,dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy);if(d>Math.abs(ra-r)+1e-7){const ux=dx/d,uy=dy/d,q=(ra-r)/d,k=Math.sqrt(Math.max(0,1-q*q)),n1=[ux*q-uy*k,uy*q+ux*k],n2=[ux*q+uy*k,uy*q-ux*k],poly=[[a[0]+ra*n1[0],a[1]+ra*n1[1]],[b[0]+r*n1[0],b[1]+r*n1[1]],[b[0]+r*n2[0],b[1]+r*n2[1]],[a[0]+ra*n2[0],a[1]+ra*n2[1]]].map(world);let area=0;for(let i=0;i<4;i++){const j=(i+1)%4;area+=poly[i][0]*poly[j][1]-poly[j][0]*poly[i][1];}if(area<0)poly.reverse();ctx.moveTo(...poly[0]);for(const q of poly.slice(1))ctx.lineTo(...q);ctx.closePath();}}
 prev=sample;}
}
