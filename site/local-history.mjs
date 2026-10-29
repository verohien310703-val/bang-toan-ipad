export function restoreLocalHistory(state,action,undo,redo){
 const source=action==='undo'?undo:redo;
 if(!source.length)throw Error(action==='undo'?'Không còn thao tác để hoàn tác':'Không còn thao tác để làm lại');
 const saved=source.at(-1),restored=typeof saved==='string'?JSON.parse(saved):saved;
 return {state:{...restored,revision:state.revision+1},undo:action==='undo'?undo.slice(0,-1):[...undo,state].slice(-40),redo:action==='undo'?[...redo,state]:redo.slice(0,-1)};
}

export function projectedHistoryCounts(base,operations){
 let undo=base.undo,redo=base.redo;
 for(const {action}of operations){
  if(action==='undo'){if(undo){undo--;redo++;}}
  else if(action==='redo'){if(redo){redo--;undo=Math.min(40,undo+1);}}
  else if(action!=='navigate'){undo=Math.min(40,undo+1);redo=0;}
 }
 return {undo,redo};
}
