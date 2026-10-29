'use strict';
import {PDF_PAPERS} from './paper-catalog-data.mjs?v=0.23.11';
const randomUUID=()=>crypto.randomUUID();
export function createNotebook(options={}){
 const templates=['blank','dots','ruled','grid','graph','cornell',...PDF_PAPERS.map(p=>p.id)];
 const template=templates.includes(options.paperTemplate)?options.paperTemplate:'blank';
 const format=['a3','a4','a5','a6','a7','letter','screen','square'].includes(options.format)?options.format:(template.startsWith('pdf-')?'a4':'screen');
 const portrait=options.orientation!=='landscape';
 const sizes={a3:[1200,1697],a4:[1200,1697],a5:[1200,1703],a6:[1200,1691],a7:[1200,1703],letter:[1200,1553],screen:[1200,800],square:[1200,1200]};
 let [width,height]=sizes[format];if(format!=='screen'&&!portrait)[width,height]=[height,width];
 const color=['#ffffff','#fff9e9','#e5f0df','#1f2226'].includes(options.paperColor)?options.paperColor:'#ffffff';
 const coverStyle=['ribbon','plain','grid'].includes(options.coverStyle)?options.coverStyle:'ribbon';
 const paper={template,color,lineColor:color==='#1f2226'?'#40474f':'#d9dde2',spacing:32,marginRatio:.105,margin:options.margin!==false};
 const mm={a3:[297,420],a4:[210,297],a5:[148,210],a6:[105,148],a7:[74,105],letter:[215.9,279.4],screen:[254,800*.6*25.4/72],square:[254,254]}[format].slice();if(format!=='screen'&&!portrait)mm.reverse();const physicalSize={widthMm:mm[0],heightMm:mm[1]};if(['a3','a5','a6','a7'].includes(format)){width=1200;height=Math.round(width*mm[1]/mm[0]);}
 const page={physicalSize,id:randomUUID(),title:'Trang 1',width,height,paper,background:null,strokes:[]};
 const notebook={cover:options.cover===true,paperTemplate:template,format,orientation:format==='screen'?'landscape':portrait?'portrait':'landscape',coverStyle,paperColor:color};
 const pages=options.cover===true?[{id:randomUUID(),title:'Bìa',width,height,physicalSize,paper:{...paper,template:'blank',margin:false},cover:{style:coverStyle,color:'#17213b'},background:null,strokes:[]},page]:[page];
 return {version:1,revision:0,active:pages.length-1,notebook,pages};
}

