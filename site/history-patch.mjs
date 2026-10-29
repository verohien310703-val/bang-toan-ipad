import {moveRelation} from './selection-move.mjs?v=0.23.11';
export function historyPatch(before,after,{compactEdits=true,pageReferences=false}={}){
 const oldPages=new Map(before.pages.map(p=>[p.id,p]));
 return {action:'history',active:after.active,pages:after.pages.map(page=>{
  const old=oldPages.get(page.id),byPoints=new Map();
  // Protocol 6 reuses unchanged pages instead of enumerating every stroke.
  if(pageReferences&&old&&old.strokes.length===page.strokes.length&&old.strokes.every((s,i)=>s===page.strokes[i])){
   const keys=new Set([...Object.keys(old),...Object.keys(page)]);
   if([...keys].every(k=>k==='strokes'||old[k]===page[k]))return {reuse:page.id};
  }
  const byId=new Map();old?.strokes.forEach((s,i)=>{byPoints.set(s.points,i);byId.set(s.id,i);});
  const {strokes,...metadata}=page;
  return {metadata,strokes:strokes.map(s=>{
   const sameId=byId.get(s.id),sameBase=old?.strokes[sameId];if(compactEdits&&sameBase){const move=moveRelation(s,sameBase);if(move)return {from:sameId,move};}const at=byPoints.get(s.points),base=old?.strokes[at];
   if(!base)return {stroke:s};
   const keys=new Set([...Object.keys(base),...Object.keys(s)]);
   const fields={};for(const key of keys)if(!['id','erasePolygons'].includes(key)&&base[key]!==s[key]){if(compactEdits&&key==='color')fields.color=s.color;else return {stroke:s};}
   const a=base.erasePolygons||[],b=s.erasePolygons||[];let common=0;
   while(common<Math.min(a.length,b.length)&&a[common]===b[common])common++;
   return {...(Object.keys(fields).length?{fields}:{}),from:at,id:s.id,keep:common,add:b.slice(common),hasMasks:Object.hasOwn(s,'erasePolygons')};
  })};
 })};
}
