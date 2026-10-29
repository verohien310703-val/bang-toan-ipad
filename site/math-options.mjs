export function createMathOptions(dialog,changed){
 const box=document.createElement('section');box.className='math-options';box.innerHTML='<strong>Hiển thị trên trang</strong><label><input id="mathTransparent" type="checkbox" checked> Nền trong suốt</label><label><input id="mathAxes" type="checkbox" checked> Hiện trục tọa độ</label><label>Tham số a <output id="mathAValue">1</output><input id="mathA" type="range" min="-5" max="5" step="0.05" value="1"></label><small>Dùng a trong công thức, ví dụ a*x^2. Sau khi chèn, có thể kéo thanh a ngay trên trang.</small>';dialog.querySelector('.graph-layout>aside').prepend(box);
 const $=s=>box.querySelector(s);let parameter={value:1,min:-5,max:5};
 function sync(){const a=$('#mathA');a.min=parameter.min;a.max=parameter.max;a.value=parameter.value;$('#mathAValue').textContent=String(+parameter.value.toFixed(3));}
 for(const id of ['mathTransparent','mathAxes'])$('#'+id).onchange=changed;
 $('#mathA').oninput=()=>{parameter.value=+$('#mathA').value;sync();changed();};
 return {get(){return {transparent:$('#mathTransparent').checked,axes:$('#mathAxes').checked,parameter:{...parameter}};},set(g){$('#mathTransparent').checked=g.transparent===true;$('#mathAxes').checked=g.axes!==false;parameter=g.parameter?{...g.parameter}:{value:1,min:-5,max:5};sync();}};
}
