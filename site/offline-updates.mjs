// Keep an update waiting until all old application windows have closed.
export async function installOffline(status,actions,toast){
 const button=document.createElement('button');button.type='button';button.textContent='Kiểm tra cập nhật';actions.append(button);
 const registration=await navigator.serviceWorker.register(new URL('./offline-sw.js',import.meta.url),{updateViaCache:'none'});
 const show=()=>{status.textContent=registration.waiting
  ?'Có bản cập nhật đã tải xong. Chờ Đã lưu, đóng tất cả cửa sổ Bảng Toán rồi mở lại để dùng bản mới.'
  :'Đã sẵn sàng dùng offline. Safari → Chia sẻ → Thêm vào Màn hình chính. Bài lưu trên thiết bị này.';};
 const watch=()=>{const worker=registration.installing;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed'||worker.state==='activated')show();});};
 registration.addEventListener('updatefound',watch);watch();
 button.onclick=async()=>{button.disabled=true;try{await registration.update();if(registration.installing){toast('Đang tải bản cập nhật. Bạn có thể tiếp tục dùng bản hiện tại.');}else{show();toast(registration.waiting?'Bản mới đã sẵn sàng. Lưu bài và đóng các cửa sổ trước khi mở lại.':'Đang dùng bản mới nhất đã kiểm tra.');}}catch{toast('Chưa kiểm tra được cập nhật. Bài vẫn lưu trên thiết bị này.');}finally{button.disabled=false;}};
 await navigator.serviceWorker.ready;show();
 try{await navigator.storage?.persist?.();}catch{}
}
