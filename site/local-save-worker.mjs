import {openDatabase,readRecord,commitLibrary} from './local-store.mjs?v=0.23.11';
import {createInkPersistence} from './local-save-core.mjs';

const database=openDatabase();
const persistence=createInkPersistence({
 load:async()=>readRecord(await database,'library','main'),
 commit:async(data,epoch)=>commitLibrary(await database,data,epoch)
});
self.onmessage=async({data:{id,op,expectedEpoch}})=>{
 try{const result=await persistence.save({op,expectedEpoch});self.postMessage({id,...result});}
 catch(error){self.postMessage({id,error:error.message||'Không lưu được dữ liệu.'});}
};
