const moves=new WeakMap();
export function moveRelation(next,base){const a=moves.get(next),b=moves.get(base);if(a?.source.deref()===base)return [a.dx,a.dy];if(b?.source.deref()===next)return [-b.dx,-b.dy];return null;}
export function moveSource(stroke){const m=moves.get(stroke),source=m?.source.deref();return source?{source,dx:m.dx,dy:m.dy}:null;}
export function translateStrokes(strokes,ids,dx,dy){
 if(!Array.isArray(ids)||!ids.length||ids.length>20000||new Set(ids).size!==ids.length||!ids.every(id=>typeof id==='string')||!Number.isFinite(dx)||!Number.isFinite(dy)||Math.abs(dx)>5000||Math.abs(dy)>10000)throw Error('Độ dịch chuyển không hợp lệ.');
 const selected=new Set(ids),found=new Set(),polygons=new WeakMap(),points=new WeakMap();
 const mapPolygon=poly=>{let value=polygons.get(poly);if(!value){value=poly.map(p=>{const q=[p[0]+dx,p[1]+dy];if(q.some(n=>!Number.isFinite(n)||Math.abs(n)>1000000))throw Error('Vùng tẩy vượt giới hạn.');return q;});polygons.set(poly,value);}return value;};
 const result=strokes.map(s=>{if(!selected.has(s.id))return s;found.add(s.id);let ps=points.get(s.points);if(!ps){ps=s.points.map(p=>{const x=p[0]+dx,y=p[1]+dy;if(x< -100||x>5100||y< -100||y>10100)throw Error('Nội dung vượt giới hạn trang.');return [x,y,p[2]];});points.set(s.points,ps);}const next={...s,points:ps,...(s.erasePolygons?{erasePolygons:s.erasePolygons.map(mapPolygon)}:{})};moves.set(next,{source:new WeakRef(s),dx,dy});return next;});
 if(found.size!==selected.size)throw Error('Nội dung vừa thay đổi. Hãy khoanh chọn lại.');return result;
}
