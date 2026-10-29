// Recover a revision/history mismatch without discarding the socket or outbox.
export function createStateResync({send,close,timeout=15000}){
 let active=false,timer=null;
 function done(){active=false;clearTimeout(timer);timer=null;}
 return {get pending(){return active;},request(){if(active)return false;active=true;if(send({type:'resync'})===false){done();return false;}timer=setTimeout(()=>{done();close();},timeout);return true;},done};
}
