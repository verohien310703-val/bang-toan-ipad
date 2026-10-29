import {LocalLibrary} from './local-store.mjs?v=0.23.11';
import {applyLocal} from './local-model.mjs?v=0.23.11';
import {expandEraseMasks} from './erase-wire.mjs?v=0.23.11';
import {validErased} from './erase-mask.mjs?v=0.23.11';
import {applyHistory} from './history-state.mjs?v=0.23.11';

// The persistence worker keeps the library locally. Only the operation crosses
// the thread boundary; full-library IndexedDB reads/writes stay off the UI.
export function createInkPersistence({load,commit}){
 let library=null,serial=Promise.resolve();
 async function persist({op,expectedEpoch}){
  if(!library||library.data.epoch!==expectedEpoch)library=new LocalLibrary(await load());
  if(library.data.epoch!==expectedEpoch)throw Error('Dữ liệu đã thay đổi trong cửa sổ khác.');
  const state=library.data.notes[op.documentId];
  if(!state||state.revision!==op.revision||!['stroke','erase','edit','clear','eraseMasks','restoreHistory'].includes(op.action))throw Error('Bài đang lưu đã thay đổi.');
  let operation=op;
  if(op.action==='eraseMasks'){
   const page=state.pages.find(p=>p.id===op.pageId);if(!page)throw Error('Không tìm thấy trang.');
   operation={...op,action:'edit',...expandEraseMasks(op,page,validErased)};
  }
  const restored=op.action==='restoreHistory'?{...applyHistory(state,op.change),revision:state.revision+1}:applyLocal(state,operation).state;
  const next=library.withSavedSnapshot(restored);
  await commit(next.data,expectedEpoch);
  library=next;
  return {epoch:next.data.epoch};
 }
 return {save(request){const result=serial.then(()=>persist(request));serial=result.catch(()=>{});return result;}};
}
