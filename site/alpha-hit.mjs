// Test only remaining visible ink against the swept eraser disk.
export function alphaHitsSweep(alpha,width,height,x,y,scale,a,b,r){
 const ax=a[0]*scale,ay=a[1]*scale,bx=b[0]*scale,by=b[1]*scale,radius=r*scale+Math.SQRT1_2;
 const left=Math.max(0,Math.floor(Math.min(ax,bx)-radius-x)),right=Math.min(width-1,Math.ceil(Math.max(ax,bx)+radius-x)),top=Math.max(0,Math.floor(Math.min(ay,by)-radius-y)),bottom=Math.min(height-1,Math.ceil(Math.max(ay,by)+radius-y));
 const dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy,limit=radius*radius;
 for(let py=top;py<=bottom;py++)for(let px=left;px<=right;px++)if(alpha[py*width+px]){const vx=x+px+.5-ax,vy=y+py+.5-ay,t=length?Math.max(0,Math.min(1,(vx*dx+vy*dy)/length)):0;if((vx-t*dx)**2+(vy-t*dy)**2<=limit)return true;}
 return false;
}
