const pdfSizes=new Map();
export const PT_PER_MM=72/25.4;
export function rememberPdfSize(page,widthPt,heightPt){pdfSizes.set(page.background.asset+':'+page.background.page,{widthMm:widthPt/PT_PER_MM,heightMm:heightPt/PT_PER_MM});}
export function pagePhysicalSize(page){
 if(page.physicalSize)return page.physicalSize;
 if(page.background?.kind==='pdf'){const size=pdfSizes.get(page.background.asset+':'+page.background.page);if(size)return size;}
 if(!page.background){for(const [w,h,mw,mh]of [[1200,1697,210,297],[1697,1200,297,210],[1200,1553,215.9,279.4],[1553,1200,279.4,215.9]])if(page.width===w&&page.height===h)return {widthMm:mw,heightMm:mh};}
 // Legacy canvas/image pages keep the physical scale of previous PDF exports.
 return {widthMm:page.width*.6/PT_PER_MM,heightMm:page.height*.6/PT_PER_MM};
}
export const mmToSize=(mm,page)=>mm*page.width/pagePhysicalSize(page).widthMm;
export const sizeToMm=(size,page)=>size*pagePhysicalSize(page).widthMm/page.width;
export function pagePdfSize(page){const p=pagePhysicalSize(page);return [p.widthMm*PT_PER_MM,p.heightMm*PT_PER_MM];}
