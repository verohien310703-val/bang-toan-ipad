import {drawStroke} from './ink.js?v=0.23.11';
import {hitReusedRaster} from './raster-reuse.mjs?v=0.23.11';
import {alphaHitsSweep} from './alpha-hit.mjs?v=0.23.11';
import {eraserRasterBounds} from './raster-bounds.mjs?v=0.23.11';
let probe=null;
export function visibleStrokeHit(s,a,b,r,scale=1){
 const cached=hitReusedRaster(s,a,b,r,scale);if(cached!==null)return cached;
 const bounds=eraserRasterBounds(s,scale),pad=r+2/scale,left=Math.floor(Math.max(bounds.x,Math.min(a[0],b[0])-pad)*scale),right=Math.ceil(Math.min(bounds.r,Math.max(a[0],b[0])+pad)*scale),top=Math.floor(Math.max(bounds.y,Math.min(a[1],b[1])-pad)*scale),bottom=Math.ceil(Math.min(bounds.b,Math.max(a[1],b[1])+pad)*scale);
 if(right<=left||bottom<=top)return false;probe??=document.createElement('canvas');
 for(let y=top;y<bottom;y+=128)for(let x=left;x<right;x+=128){probe.width=Math.min(128,right-x);probe.height=Math.min(128,bottom-y);const ctx=probe.getContext('2d',{willReadFrequently:true});ctx.setTransform(scale,0,0,scale,-x,-y);drawStroke(ctx,s);const rgba=ctx.getImageData(0,0,probe.width,probe.height).data,alpha=new Uint8Array(probe.width*probe.height);for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3];if(alphaHitsSweep(alpha,probe.width,probe.height,x,y,scale,a,b,r))return true;}
 return false;
}
