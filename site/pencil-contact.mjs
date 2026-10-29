// Pointer IDs and Touch identifiers are different namespaces. Pair only a
// single, explicit stylus contact on this canvas, within the same start event.
export function stylusContact(event){
 const changed=Array.from(event.changedTouches||[]),explicit=changed.filter(t=>t.touchType==='stylus');
 // Some engines omit touchType. An unlabelled, sole contact can be paired
 // only with a pen PointerEvent at the same timestamp (not the broad window).
 const contacts=explicit.length?explicit:changed.length===1&&event.touches?.length===1&&!changed[0].touchType?changed:[];
 const t=contacts[0];return contacts.length===1&&Number.isFinite(t.clientX)&&Number.isFinite(t.clientY)?{clientX:t.clientX,clientY:t.clientY,timeStamp:event.timeStamp,explicit:t.touchType==='stylus'}:null;
}
export function matchingContact(contact,event){
 return event.pointerType==='pen'&&contact&&Math.abs(contact.timeStamp-event.timeStamp)<=(contact.explicit===false?4:50)?contact:null;
}
export function reconcilePencilStart(stroke,contact,toPoint){
 if(!stroke||stroke.pointerType!=='pen'||stroke.points.length!==1||!matchingContact(contact,{pointerType:'pen',timeStamp:stroke.startedAt}))return false;
 const old=stroke.points[0],p=toPoint({...contact,pointerType:'pen',pressure:old[2]});
 if(Math.hypot(old[0]-p[0],old[1]-p[1])<.01)return false;
 // New array invalidates any causal rendering cache for the provisional dot.
 stroke.points=[[p[0],p[1],old[2]]];return true;
}
