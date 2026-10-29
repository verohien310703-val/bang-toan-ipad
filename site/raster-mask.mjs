// Render dense convex erase masks as a union on an isolated bitmap. Preserve
// the original vector renderer for unsupported contexts or polygons.
import {drawReusedRaster,rememberRaster,rasterWindow} from './raster-reuse.mjs?v=0.23.11';
let scratch=null;const directionsCache=new WeakMap(),polygonBounds=new WeakMap();
function intersects(poly,view){let b=polygonBounds.get(poly);if(!b){b={x:Infinity,y:Infinity,r:-Infinity,b:-Infinity};for(const p of poly){b.x=Math.min(b.x,p[0]);b.y=Math.min(b.y,p[1]);b.r=Math.max(b.r,p[0]);b.b=Math.max(b.b,p[1]);}polygonBounds.set(poly,b);}return b.r>=view.x&&b.x<=view.r&&b.b>=view.y&&b.y<=view.b;}
function orientation(poly){if(directionsCache.has(poly))return directionsCache.get(poly);let sign=0,area=0;for(let i=0;i<poly.length;i++){
 const a=poly[i],b=poly[(i+1)%poly.length],c=poly[(i+2)%poly.length];
 const cross=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);
 if(Math.abs(cross)>1e-8){const next=Math.sign(cross);if(sign&&next!==sign)return 0;sign=next;}
 area+=a[0]*b[1]-b[0]*a[1];
 }const result=Math.abs(area)>1e-8?Math.sign(area):0;directionsCache.set(poly,result);return result;
}
export function rasterizeMasked(ctx,stroke,render,options){
 const polygons=stroke.erasePolygons||[],w=ctx.canvas?.width,h=ctx.canvas?.height;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w*h>8000000||ctx.globalCompositeOperation!=='source-over'||typeof ctx.getTransform!=='function'||typeof document==='undefined')return false;
 if(drawReusedRaster(ctx,stroke,!!options?.downsample))return true;
 const region=rasterWindow(ctx,stroke)||{x:0,y:0,width:w,height:h};if(!region.width||!region.height)return true;
 const matrix=ctx.getTransform(),pad=matrix.a>0?2/matrix.a:0,view=matrix.b===0&&matrix.c===0&&matrix.a>0&&matrix.d>0?{x:(region.x-matrix.e)/matrix.a-pad,y:(region.y-matrix.f)/matrix.d-pad,r:(region.x+region.width-matrix.e)/matrix.a+pad,b:(region.y+region.height-matrix.f)/matrix.d+pad}:null;
 // A polygon wholly outside this cropped bitmap cannot affect its pixels.
 // Keep an antialias margin; retain the old fallback for relevant nonconvex masks.
 const relevant=view?polygons.filter(poly=>intersects(poly,view)):polygons,directions=relevant.map(orientation);if(directions.some(d=>!d))return false;
 scratch??=document.createElement('canvas');
 if(scratch.width!==region.width)scratch.width=region.width;if(scratch.height!==region.height)scratch.height=region.height;
 const c=scratch.getContext('2d'),m=ctx.getTransform();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,region.width,region.height);c.setTransform(m.a,m.b,m.c,m.d,m.e-region.x,m.f-region.y);
 const {erasePolygons,...body}=stroke;if(!drawReusedRaster(c,body)){render(c,body);rememberRaster(c,body,scratch,{x:0,y:0});}
 c.save();c.globalAlpha=1;c.globalCompositeOperation='destination-out';c.fillStyle='#000';c.beginPath();
 relevant.forEach((poly,i)=>{const points=directions[i]>0?poly:poly.slice().reverse();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();});c.fill('nonzero');c.restore();
 rememberRaster(ctx,stroke,scratch,region);ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.drawImage(scratch,region.x,region.y);ctx.restore();return true;
}
