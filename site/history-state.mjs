import {translateStrokes} from './selection-move.mjs?v=0.23.11';
// Resolve all references against the previous revision before replacing any page.
export function applyHistory(state,change){
 const previous=new Map(state.pages.map(p=>[p.id,p]));
 const pages=change.pages.map(entry=>{
  if(Object.hasOwn(entry,'reuse')){const old=previous.get(entry.reuse);if(!old)throw Error('Missing unchanged history page');return old;}
  const {metadata,strokes}=entry;return {...metadata,strokes:strokes.map(entry=>{
  if(entry.stroke)return entry.stroke;
  const old=previous.get(metadata.id)?.strokes[entry.from];
  if(entry.move){if(!old||!Array.isArray(entry.move)||entry.move.length!==2)throw Error('Invalid move history');return translateStrokes([old],[old.id],...entry.move)[0];}if(!old||!Number.isInteger(entry.keep)||entry.keep<0||entry.keep>(old.erasePolygons?.length||0))throw Error('Thiếu nét để khôi phục lịch sử');
  if(!entry.fields&&entry.id===old.id&&entry.keep===(old.erasePolygons?.length||0)&&entry.add.length===0&&entry.hasMasks===Object.hasOwn(old,'erasePolygons'))return old;
  if(entry.fields&&(Object.keys(entry.fields).some(k=>k!=='color')||!/^#[a-f0-9]{6}$/i.test(entry.fields.color)))throw Error('Invalid style history');const next={...old,...entry.fields,id:entry.id};
  if(entry.hasMasks)next.erasePolygons=[...(old.erasePolygons||[]).slice(0,entry.keep),...entry.add];
  else delete next.erasePolygons;
  return next;
 })};});
 if(!pages[change.active])throw Error('Trang lịch sử không hợp lệ');
 return {...state,pages,active:change.active};
}
