// Match Retina pixels and zoom, with bounded memory and Safari canvas dimensions.
export function inkResolution(width,height,dpr=1,zoom=1){
 const ratio=Math.min(Math.max(1,dpr)*Math.max(1,Math.ceil(zoom*4)/4),4096/width,4096/height,Math.sqrt(12000000/(width*height)));
 return {ratio,width:Math.max(1,Math.floor(width*ratio)),height:Math.max(1,Math.floor(height*ratio))};
}
