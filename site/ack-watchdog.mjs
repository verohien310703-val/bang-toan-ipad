// A stalled acknowledgement must not leave the outbox blocked indefinitely.
// Reconnection resends the same operation id; the server deduplicates it.
export function createAckWatchdog(timeout=15000){
 let timer=null,pending=null;
 function clear(){clearTimeout(timer);timer=null;pending=null;}
 return {
  sent(socket,id){clear();pending=id;timer=setTimeout(()=>{clear();socket.close(4001,'ACK timeout');},timeout);},
  ack(id){if(id===pending)clear();},
  clear
 };
}
