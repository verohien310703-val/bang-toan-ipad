export const PAPER_FORMATS=[['screen','Màn hình',254,169.3333333333],['a3','A3',297,420],['a4','A4',210,297],['a5','A5',148,210],['a6','A6',105,148],['a7','A7',74,105],['letter','Letter',215.9,279.4],['square','Vuông',254,254]];
export function paperDimensions(format='a4',orientation='portrait'){
 const f=PAPER_FORMATS.find(f=>f[0]===format)||PAPER_FORMATS[2];let [w,h]=f.slice(2);
 if(format!=='screen'&&orientation==='landscape')[w,h]=[h,w];
 return {width:1200,height:Math.round(1200*h/w),physicalSize:{widthMm:w,heightMm:h}};
}
export const formatOptions=()=>PAPER_FORMATS.map(([id,name])=>`<option value="${id}">${name}</option>`).join('');
