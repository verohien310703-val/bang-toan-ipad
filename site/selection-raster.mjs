import {drawPreparedInk} from './prepared-ink.mjs?v=0.23.11';
// Capture only selected ink; copying a rectangle of the whole page would also
// drag any unselected objects inside that rectangle. No lesson arrays change.
export async function createSelectionRaster(source,page,strokes,box,valid=()=>true){
 const m=source.getContext('2d').getTransform(),pad=Math.max(32,...strokes.map(s=>s.size*4+16)),left=Math.max(0,Math.floor((box.x-pad)*m.a)),top=Math.max(0,Math.floor((box.y-pad)*m.d)),right=Math.min(source.width,Math.ceil((box.x+box.w+pad)*m.a)),bottom=Math.min(source.height,Math.ceil((box.y+box.h+pad)*m.d)),canvas=document.createElement('canvas');canvas.width=Math.max(1,right-left);canvas.height=Math.max(1,bottom-top);const ctx=canvas.getContext('2d');ctx.setTransform(m.a,0,0,m.d,-left,-top);for(const s of strokes){if(!valid()){canvas.width=canvas.height=1;return null;}const task=drawPreparedInk(ctx,s,{valid,priority:0});if(task)await task;}if(!valid()){canvas.width=canvas.height=1;return null;}
 return {draw(target,dx,dy){target.save();target.setTransform(1,0,0,1,0,0);target.drawImage(canvas,left+dx*m.a,top+dy*m.d);target.restore();},destroy(){canvas.width=canvas.height=1;}};
}
