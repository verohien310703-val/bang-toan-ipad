// Explicit calibration anchors; interpolate between them rather than snap.
export const PEN_LEVELS=Object.freeze([0,25,50,75,100]);
const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
export function levelValue(value,anchors){const x=clamp(value)*4,i=Math.min(3,Math.floor(x));return anchors[i]+(anchors[i+1]-anchors[i])*(x-i);}
export function controlProfile(tuning={},smoothing=1){
 const stability=clamp(tuning.stability??0),sharpness=clamp(tuning.taper??.25),sensitivity=clamp(tuning.sensitivity??.5),flatness=clamp(tuning.flatness??.33);
 const mode=[0,1,2].includes(smoothing)?smoothing:1;
 return {stability,sharpness,sensitivity,flatness,
  filterMs:levelValue(stability,[0,6,14,26,44])+[0,4,10][mode],
  lagPixels:levelValue(stability,[0,.7,1.4,2.4,3.6])+[0,.25,.65][mode],
  brushGamma:levelValue(sensitivity,[1.25,1.12,1,.90,.82]),
  brushGain:levelValue(sensitivity,[Math.exp(-.2),Math.exp(-.1),1,Math.exp(.1),Math.exp(.2)]),
  fountainContrast:levelValue(sensitivity,[.25,.4,.675,.95,1.3]),
  entrySharpness:levelValue(sharpness,[0,.35,.65,.85,.96])};
}
export function nibMinor16(flatness=.33){
 const f=clamp(flatness),anchors=[[0,1],[.25,.34],[.33,.12+.88*.67**5],[.5,.20],[.75,.16],[1,.12]];
 const i=anchors.findIndex(([x])=>x>=f);if(i<=0)return anchors[0][1];
 const [a,u]=anchors[i-1],[b,v]=anchors[i];return u+(v-u)*(f-a)/(b-a);
}
export const PEN_PROFILE_KEYS=Object.freeze({ball:[],fountain:['nibTaper','pressureSensitivity','nibFlatness'],brush:['pressureSensitivity']});
export const PRIVATE_LEVELS=Object.freeze({nibTaper:[0,25,50,75,100],pressureSensitivity:[0,25,50,75,100],nibFlatness:[0,33,66,100]});
export function snapPrivate(key,value){const levels=PRIVATE_LEVELS[key];return levels?levels.reduce((best,n)=>Math.abs(n-value*100)<Math.abs(best-value*100)?n:best,levels[0])/100:value;}
export function initPenProfiles(settings,persisted){
 const result={};for(const [style,keys]of Object.entries(PEN_PROFILE_KEYS)){
  const saved=persisted?.[style];result[style]={};
  for(const key of keys){const value=saved?.[key],valid=key==='smoothing'?[0,1,2].includes(value):Number.isFinite(value)&&value>=0&&value<=1;
   result[style][key]=snapPrivate(key,valid?value:settings[key]);}
 }
 settings.penProfiles=result;applyPenProfile(settings,settings.penStyle);return result;
}
export function stashPenProfile(settings){const keys=PEN_PROFILE_KEYS[settings.penStyle];if(!keys||!settings.penProfiles)return;for(const key of keys)settings.penProfiles[settings.penStyle][key]=snapPrivate(key,settings[key]);}
export function applyPenProfile(settings,style){const profile=settings.penProfiles?.[style];if(profile)for(const key of PEN_PROFILE_KEYS[style])settings[key]=profile[key];}
export function switchPenProfile(settings,style){stashPenProfile(settings);settings.penStyle=style;applyPenProfile(settings,style);}
