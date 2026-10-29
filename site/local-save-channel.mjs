export function createLocalSaveChannel(makeWorker=()=>typeof Worker==='undefined'?null:new Worker(new URL('./local-save-worker.mjs',import.meta.url),{type:'module'})){
 let worker=null,disabled=false,sequence=0;const pending=new Map();
 function fail(){disabled=true;worker?.terminate();worker=null;for(const job of pending.values()){clearTimeout(job.timer);job.reject(Error('Tác vụ lưu nền bị gián đoạn. Nét chưa lưu vẫn được giữ để thử lại.'));}pending.clear();}
 return {save(op,expectedEpoch){
  if(disabled)return Promise.resolve(null);
  if(!worker){
   try{worker=makeWorker();}catch{disabled=true;return Promise.resolve(null);}
   if(!worker){disabled=true;return Promise.resolve(null);}
   worker.onmessage=({data})=>{const job=pending.get(data.id);if(!job)return;pending.delete(data.id);clearTimeout(job.timer);if(data.error)job.reject(Error(data.error));else if(data.epoch===job.epoch+1)job.resolve({epoch:data.epoch});else job.reject(Error('Phiên lưu dữ liệu không hợp lệ.'));};
   worker.onerror=fail;worker.onmessageerror=fail;
  }
  return new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(fail,30000);pending.set(id,{resolve,reject,timer,epoch:expectedEpoch});try{worker.postMessage({id,op,expectedEpoch});}catch(error){clearTimeout(timer);pending.delete(id);reject(error);}});
 }};
}
