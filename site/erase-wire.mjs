function samePoints(a,b){return a===b||Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((p,i)=>p.length===b[i].length&&p.every((v,j)=>v===b[i][j]));}
export function replaceErasedInOrder(strokes,ids,replacements){
 if(ids.length!==replacements.length||new Set(ids).size!==ids.length)throw Error('Thao tác tẩy không hợp lệ.');
 const changes=new Map(ids.map((id,i)=>[id,replacements[i]]));let found=0;
 const result=strokes.map(s=>{if(!changes.has(s.id))return s;found++;return changes.get(s.id);});
 if(found!==ids.length)throw Error('Nội dung vừa thay đổi.');return result;
}
export function packEraseEdit(message,page){
 if(message.action!=='edit'||!page)return message;const byId=new Map(page.strokes.map(s=>[s.id,s])),polygons=[],index=new Map(),updates=[];
 if(message.ids.length!==message.strokes.length)return message;
 for(let i=0;i<message.ids.length;i++){const old=byId.get(message.ids[i]),next=message.strokes[i];if(!old||!samePoints(next.points,old.points)||!next.erasePolygons)return message;const n=old.erasePolygons?.length||0;if(next.erasePolygons.length<n)return message;
 for(const k of new Set([...Object.keys(old),...Object.keys(next)]))if(!['id','erasePolygons','points'].includes(k)&&JSON.stringify(old[k])!==JSON.stringify(next[k]))return message;
 const indices=[];for(const p of next.erasePolygons.slice(n)){const key=JSON.stringify(p);let at=index.get(key);if(at===undefined){at=polygons.length;index.set(key,at);polygons.push(p);}indices.push(at);}updates.push({id:old.id,nextId:next.id,indices});}
 const {ids,strokes,...rest}=message;return {...rest,action:'eraseMasks',polygons,updates};
}

export function expandEraseMasks(m,page,valid){
 if(!Array.isArray(m.polygons)||m.polygons.length>30000||!m.polygons.every(p=>valid([p]))||!Array.isArray(m.updates)||m.updates.length>20000)throw Error('Gói tẩy không hợp lệ.');
 const originals=new Map(page.strokes.map(s=>[s.id,s])),seen=new Set(),ids=[],strokes=[];
 for(const u of m.updates){const s=originals.get(u.id);if(!s||seen.has(u.id)||typeof u.nextId!=='string'||u.nextId.length>=80||!Array.isArray(u.indices)||u.indices.length>1500||u.indices.some(i=>!Number.isInteger(i)||i<0||i>=m.polygons.length))throw Error('Vùng tẩy không hợp lệ.');seen.add(u.id);ids.push(u.id);strokes.push({...s,id:u.nextId,erasePolygons:[...(s.erasePolygons||[]),...u.indices.map(i=>m.polygons[i])]});}
 return {...m,action:'edit',ids,strokes};
}
