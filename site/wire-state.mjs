export function unpackWire(message){
 if(!Object.hasOwn(message,'erasePolygonTable'))return message;
 const table=message.erasePolygonTable;
 if(!Array.isArray(table)||!table.every(poly=>Array.isArray(poly)&&poly.length>=3&&poly.length<=40&&poly.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))))throw Error('Bảng vùng tẩy không hợp lệ');
 function refs(indices){if(!Array.isArray(indices)||!indices.every(i=>Number.isInteger(i)&&i>=0&&i<table.length))throw Error('Tham chiếu vùng tẩy không hợp lệ');return indices.map(i=>table[i]);}
 function stroke(s){if(!Object.hasOwn(s,'_wireErase'))return s;const {_wireErase,...body}=s;return {...body,erasePolygons:refs(_wireErase)};}
 function state(s){return {...s,pages:s.pages.map(p=>({...p,strokes:p.strokes.map(stroke)}))};}
 const {erasePolygonTable,...result}=message;
 if(message.state)result.state=state(message.state);
 if(message.change?.action==='history')result.change={...message.change,pages:message.change.pages.map(p=>p.reuse?p:({...p,strokes:p.strokes.map(entry=>{
  if(entry.stroke)return {...entry,stroke:stroke(entry.stroke)};
  if(!Object.hasOwn(entry,'_wireAdd'))return entry;const {_wireAdd,...rest}=entry;return {...rest,add:refs(_wireAdd)};
 })}))};
 if(message.change?.stroke)result.change={...message.change,stroke:stroke(message.change.stroke)};
 return result;
}
