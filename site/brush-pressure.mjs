import {curvedInkPoints} from './ink-smoothing.mjs?v=0.23.11';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Version 8: sensitivity changes the force curve, without saturating at 50%.
// Neutral force retains the shared size. Higher sensitivity needs less force.
export function brushPressureWidth(pressure=.5,sensitivity=.5){
 const p=clamp(pressure,0,1),s=clamp(sensitivity,0,1);
 if(s===0)return 1;
 const exponent=1.6-1.25*s;
 return p<=.5?.15+.85*(2*p)**exponent:1+1.8*(2*p-1)**(1.8-.6*s);
}
export function pressureBrushSamples(points,size,sensitivity=.5){
 return curvedInkPoints(points).map(p=>({center:p,radius:size/2*brushPressureWidth(p[2],sensitivity)}));
}
export function pressureText(report,prefix='Nét vừa viết'){
 if(!report)return 'Viết thử nét nhẹ rồi nét mạnh để kiểm tra lực bút';
 if(report.pointerType!=='pen')return 'Chuột / cảm ứng: lực cố định. Dùng Apple Pencil để thử lực nhấn.';
 const range=`${(report.min*100).toFixed(1)}–${(report.max*100).toFixed(1)}%`;
 return `${prefix}: lực ${range}${report.count>=8&&report.max-report.min<.01?' · Chưa nhận được chênh lệch lực rõ. Thử nhấn nhẹ rồi mạnh trong cùng nét.':''}`;
}
