import {paintSolid} from './solid-math.mjs?v=0.23.11';
import {paintRevolution} from './revolution.mjs?v=0.23.11';
const fmt=n=>Math.abs(n)<1e-9?'0':Math.abs(n)>=1e5||Math.abs(n)<.0001?n.toExponential(2):String(+n.toFixed(5));
export function paintGraph(c,w,h,{view,rows,points=[],grid=true,revolution,transparent=false,axes=true,solid,parameter}){
const scale=w/view.span,px=x=>w/2+(x-view.x)*scale,py=y=>h/2-(y-view.y)*scale,min=view.x-view.span/2,max=view.x+view.span/2,halfY=h/scale/2;
 if(transparent)c.clearRect(0,0,w,h);else{c.fillStyle='#fff';c.fillRect(0,0,w,h);}if(solid){paintSolid(c,w,h,{solid,view,axes});return;}c.font='11px -apple-system,Segoe UI,sans-serif';const raw=view.span/9,base=10**Math.floor(Math.log10(raw)),step=[1,2,5,10].find(n=>n*base>=raw)*base;c.lineWidth=1;
 if(grid){for(let minor=0;minor<2;minor++){const st=step/(minor?1:5);c.strokeStyle=minor?'#dbe4ed':'#f0f4f8';c.beginPath();for(let x=Math.ceil(min/st)*st;x<=max;x+=st){c.moveTo(px(x),0);c.lineTo(px(x),h);}for(let y=Math.ceil((view.y-halfY)/st)*st;y<=view.y+halfY;y+=st){c.moveTo(0,py(y));c.lineTo(w,py(y));}c.stroke();}}
 if(axes){c.strokeStyle='#5c7084';c.lineWidth=1.3;c.beginPath();c.moveTo(0,py(0));c.lineTo(w,py(0));c.moveTo(px(0),0);c.lineTo(px(0),h);c.stroke();c.fillStyle='#607389';for(let x=Math.ceil(min/step)*step;x<=max;x+=step)c.fillText(fmt(x),px(x)+4,Math.max(14,Math.min(h-8,py(0)+15)));for(let y=Math.ceil((view.y-halfY)/step)*step;y<=view.y+halfY;y+=step)if(Math.abs(y)>1e-9)c.fillText(fmt(y),Math.max(5,Math.min(w-50,px(0)+7)),py(y)-4);c.fillText('x',w-15,Math.max(15,Math.min(h-8,py(0)-7)));c.fillText('y',Math.max(6,Math.min(w-15,px(0)+9)),15);
 }
 for(const row of rows){if(!row.visible||!row.f)continue;c.strokeStyle=row.color;c.lineWidth=2.5;c.lineJoin='round';c.lineCap='round';c.beginPath();let last=null;for(let sx=0;sx<=w;sx+=.65){const x=min+sx/scale,y=row.f(x),sy=py(y);if(!Number.isFinite(sy)||Math.abs(sy)>h*8){last=null;continue;}if(last){const my=py(row.f((x+last.x)/2));if(Math.abs(sy-last.sy)<h*.75&&Number.isFinite(my)&&Math.abs(my-(sy+last.sy)/2)<h*.25)c.lineTo(sx,sy);else c.moveTo(sx,sy);}else c.moveTo(sx,sy);last={x,sy};}c.stroke();}
 if(revolution)paintRevolution(c,w,h,{view,rows,revolution,parameter});
 for(const p of points){const x=px(p.x),y=py(p.y);if(x<0||x>w||y<0||y>h)continue;c.fillStyle=p.color;c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.fill();c.stroke();}
 let ly=16;c.font='12px -apple-system,Segoe UI,sans-serif';for(const row of rows.filter(r=>r.visible&&r.f)){const label='y = '+row.text;if(!transparent){c.fillStyle='#ffffffdf';c.fillRect(8,ly-12,Math.min(w-16,c.measureText(label).width+22),20);}c.fillStyle=row.color;c.fillText(label,16,ly+2);ly+=23;}
 
}
