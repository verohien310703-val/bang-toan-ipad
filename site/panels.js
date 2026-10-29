// Shared transient surfaces. Toolbar taps pass through; a dismissal on paper
// consumes the contact so closing a panel cannot accidentally leave ink.
export function hasBlockingPanel(){return !!document.querySelector('dialog[open]:not([data-nonblocking="true"])');}
export function closePanels(except){for(const d of document.querySelectorAll('dialog[open]'))if(d!==except&&d.dataset.saving!=='true'&&(!except||d.dataset.nonblocking!=='true'))d.close();for(const d of document.querySelectorAll('details[open]'))if(!except?.contains(d))d.open=false;}
export function openPanel(dialog){closePanels(dialog);if(dialog.open)dialog.close();dialog.show();}
export function toggleToolPanel(button,open){const d=document.querySelector('#workbenchDialog');if(d?.open&&d.dataset.invoker===button.id){d.close();return;}if(d)d.dataset.invoker=button.id;open();}
document.addEventListener('pointerdown',e=>{let closed=false;for(const d of document.querySelectorAll('dialog[open]')){if(d.contains(e.target)||d.dataset.saving==='true'||d.dataset.nonblocking==='true'||d.dataset.invoker&&e.target.closest?.('button')?.id===d.dataset.invoker)continue;d.close();closed=true;}for(const d of document.querySelectorAll('details[open]'))if(!d.contains(e.target))d.open=false;if(closed&&e.target.closest('#paper,.sheet-slot')){e.preventDefault();e.stopImmediatePropagation();}},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanels();},true);
