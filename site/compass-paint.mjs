export function paintCompass(ctx,item,scale,radiusMm){
 const s=Math.max(.05,scale),r=item.radius,c=[item.x,item.y],p=[c[0]+r*Math.cos(item.a),c[1]+r*Math.sin(item.a)],u=[Math.cos(item.a),Math.sin(item.a)],n=[u[1],-u[0]],height=Math.max(42/s,r*.85),hinge=[(c[0]+p[0])/2+n[0]*height,(c[1]+p[1])/2+n[1]*height];
 const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 const line=(a,b,color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width/s;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();};
 const disc=(p,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(...p,r/s,0,Math.PI*2);ctx.fill();};
 const label=(text,p)=>{ctx.font=`${11/s}px -apple-system,Segoe UI,sans-serif`;const w=ctx.measureText(text).width+14/s;ctx.fillStyle='#f7fbff';ctx.strokeStyle='#9bb2c4';ctx.lineWidth=1/s;ctx.beginPath();ctx.roundRect(p[0]-w/2,p[1]-10/s,w,21/s,5/s);ctx.fill();ctx.stroke();ctx.fillStyle='#294459';ctx.textAlign='center';ctx.fillText(text,p[0],p[1]+4/s);};
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 ctx.strokeStyle='#5594ae55';ctx.lineWidth=1/s;ctx.setLineDash([5/s,6/s]);ctx.beginPath();ctx.arc(...c,r,0,Math.PI*2);ctx.stroke();line(c,p,'#5594ae88',1);ctx.setLineDash([]);
 // Steel needle leg and orange pencil leg share a real hinge.
 const needle=mix(hinge,c,.87),wood=mix(hinge,p,.87);
 line(hinge,needle,'#40566b',10);line(hinge,needle,'#b9cad7',7);line(mix(hinge,c,.12),mix(hinge,c,.75),'#edf5fa',2);
 line(needle,c,'#344b5e',2);line(hinge,wood,'#985a20',12);line(hinge,wood,'#f5b24f',9);line(mix(hinge,p,.12),mix(hinge,p,.72),'#ffe0a2',2);
 ctx.fillStyle='#e3c18e';const v=[p[0]-wood[0],p[1]-wood[1]],len=Math.hypot(...v)||1,normal=[-v[1]/len*5/s,v[0]/len*5/s];ctx.beginPath();ctx.moveTo(wood[0]+normal[0],wood[1]+normal[1]);ctx.lineTo(...p);ctx.lineTo(wood[0]-normal[0],wood[1]-normal[1]);ctx.closePath();ctx.fill();line(mix(wood,p,.67),p,'#243746',2);
 const grip=[hinge[0]+n[0]*20/s,hinge[1]+n[1]*20/s];line(hinge,grip,'#283e52',12);line(hinge,grip,'#4c6f89',7);disc(hinge,12,'#20384d');disc(hinge,8,'#7796ae');line([hinge[0]-4/s,hinge[1]],[hinge[0]+4/s,hinge[1]],'#eff7fc',2);
 label('R '+radiusMm.toFixed(1)+' mm',[hinge[0]+n[0]*42/s,hinge[1]+n[1]*42/s]);
 label('Chân kim · kéo để đặt tâm',[c[0],c[1]+25/s]);label('Đầu bút · kéo để quay',[p[0],p[1]-24/s]);
 ctx.restore();
}
