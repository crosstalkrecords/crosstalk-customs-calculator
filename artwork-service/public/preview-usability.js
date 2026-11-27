'use strict';
// JOSH TEST only. Keep the live calculator's navigation and markup untouched.
(()=>{
 const form=document.getElementById('orderForm');
 if(!form||typeof window.go!=='function')return;
 const originalGo=window.go;
 const draftKey='crosstalk-josh-test-form-draft-v1';
 const instanceKey='crosstalk-josh-test-form-instance-v1';
 let pageInstance;
 try{
  pageInstance=sessionStorage.getItem(instanceKey)||crypto.randomUUID();
  sessionStorage.setItem(instanceKey,pageInstance);
 }catch(_){pageInstance=crypto.randomUUID();}

 // Only synthetic test choices and tracks are kept in this tab. Identity,
 // address, access data and the artwork capability are deliberately omitted.
 function saveDraft(){
  if(document.getElementById('success')?.style.display==='block')return;
  const tracks={};
  for(const side of LP_SIDES)tracks[side]=[...document.querySelectorAll('#tracks'+side+' .track')].slice(0,100).map(row=>({
   name:row.querySelector('.tn')?.value.slice(0,200)||'',
   duration:row.querySelector('.td')?.value.slice(0,20)||''
  }));
  const draft={version:1,savedAt:Date.now(),step:state.step,mode:state.mode,
   size:state.size,qty:state.qty,rpm:state.rpm,colour:state.colour,pack:state.pack,
   audio:state.audio,rush:state.rush,shipping:state.shipping,doubleLP:state.doubleLP,quoteOnly:state.quoteOnly,
   lpCount:state.lpCount,manual:document.getElementById('manual').value.slice(0,8000),tracks};
  try{sessionStorage.setItem(draftKey,JSON.stringify(draft));}catch(_){}
 }
 function restoreDraft(){
  let draft;
  try{draft=JSON.parse(sessionStorage.getItem(draftKey)||'null');}catch(_){return false;}
  if(!draft||draft.version!==1||!Number.isFinite(draft.savedAt)||Date.now()-draft.savedAt>24*60*60*1000)return false;
  state.mode=draft.mode==='artist'?'artist':'regular';
  // A saved test draft must not revive the expired Father's Day offer.
  state.promo=false;
  state.size=['7','10','12'].includes(draft.size)?draft.size:null;
  state.qty=Math.max(1,Math.min(100,Number.isInteger(draft.qty)?draft.qty:1));
  if(state.size==='12')state.qty=Math.min(5,state.qty);
  document.getElementById('qty').value=state.qty;
  state.colour=['Clear','Black','Red'].includes(draft.colour)?draft.colour:'Clear';
  state.pack=['Standard','Printed Jacket + Labels','Custom Finish Pack'].includes(draft.pack)?draft.pack:'Standard';
  state.audio=['have','help'].includes(draft.audio)?draft.audio:null;
  state.doubleLP=draft.doubleLP===true&&state.size==='12';
  state.quoteOnly=draft.quoteOnly===true;
  state.lpCount=state.doubleLP?Math.max(2,Math.min(4,Number.isInteger(draft.lpCount)?draft.lpCount:2)):1;
  for(const side of LP_SIDES){
   const container=document.getElementById('tracks'+side);
   container.replaceChildren();
   if(side!=='A'&&side!=='B')document.getElementById('side'+side).classList.toggle('hidden',LP_SIDES.indexOf(side)>=state.lpCount*2);
   const rows=Array.isArray(draft.tracks?.[side])?draft.tracks[side].slice(0,100):[];
   for(const row of rows){
    if(!row||typeof row.name!=='string'||typeof row.duration!=='string')continue;
    addTrack(side);
    const last=container.lastElementChild;
    last.querySelector('.tn').value=row.name.slice(0,200);
    last.querySelector('.td').value=row.duration.slice(0,20);
   }
  }
  if(!document.querySelector('#tracksA .track'))addTrack('A');
  if(!document.querySelector('#tracksB .track'))addTrack('B');
  document.getElementById('manual').value=typeof draft.manual==='string'?draft.manual.slice(0,8000):'';
  recordUI();
  if(state.size&&CONFIG.limits[state.size]?.[draft.rpm]){
   state.rpm=draft.rpm;
   document.getElementById('rpm').value=state.rpm;
   document.getElementById('runtime').innerHTML=`Selected setup: <strong>${state.rpm}</strong> · up to <strong>${lim()} per side</strong>`;
   totals();priceUI();
  }
  document.querySelectorAll('.audio.choice').forEach(button=>button.classList.toggle('selected',button.dataset.audio===state.audio));
  document.getElementById('audioHelp').classList.toggle('hidden',state.audio!=='help');
  document.getElementById('rush').checked=draft.rush===true;
  document.getElementById('rush').dispatchEvent(new Event('change'));
  document.getElementById('delivery').value=draft.shipping===true?'shipping':'pickup';
  document.getElementById('delivery').dispatchEvent(new Event('change'));
  const step=Number.isInteger(draft.step)&&draft.step>=0&&draft.step<=5?draft.step:0;
  originalGo(state.size||step<=1?step:0);
  const note=document.createElement('p');
  note.setAttribute('role','status');
  note.textContent='Your synthetic test choices and tracklist were restored in this tab. Review them before submitting.';
  note.style.cssText='font-size:12px;line-height:1.5;padding:9px 12px;background:#f1f7fb;border-radius:8px';
  form.prepend(note);
  return true;
 }
 const restored=restoreDraft();
 const previous=history.state;
 const step=restored&&previous?.customsTestInstance===pageInstance&&Number.isInteger(previous.customsTestStep)
  ?previous.customsTestStep:restored?state.step:0;
 if(restored&&step!==state.step)originalGo(step);
 history.replaceState({customsTestStep:step,customsTestInstance:pageInstance},'');

 function focusStep(){
  const heading=form.querySelector('.step.active h1,.step.active h2');
  if(!heading)return;
  heading.tabIndex=-1;
  heading.focus({preventScroll:true});
 }
 function syncChoices(){
  form.querySelectorAll('#sizes .choice,#colours .choice,#packs .choice,.audio.choice').forEach(button=>{
   const selected=button.dataset.size?button.dataset.size===state.size
    :button.dataset.colour?button.dataset.colour===state.colour
    :button.dataset.pack?button.dataset.pack===state.pack
    :button.dataset.audio?button.dataset.audio===state.audio:false;
   button.classList.toggle('selected',selected);
   button.setAttribute('aria-pressed',String(selected));
  });
 }
 function showStep(step,addHistory){
  originalGo(step);
  if(addHistory)history.pushState({customsTestStep:step,customsTestInstance:pageInstance},'');
  syncChoices();
  focusStep();
  saveDraft();
 }
 window.go=step=>showStep(step,true);
 addEventListener('popstate',event=>{
  const step=event.state?.customsTestInstance===pageInstance&&Number.isInteger(event.state.customsTestStep)
   ?event.state.customsTestStep:0;
  showStep(step,false);
 });

 // The source form uses visual labels and selected classes. Associate its
 // preview fields and choices with names/states for keyboard and screen readers.
 form.querySelectorAll('.field').forEach((field,index)=>{
  const label=field.querySelector(':scope > label');
  if(!label)return;
  const control=field.querySelector(':scope > input,:scope > select,:scope > textarea');
  if(control){
   if(!control.id)control.id='test-field-'+index;
   label.htmlFor=control.id;
  }else{
   const group=field.querySelector('.choicegrid,.packgrid');
   if(group){
    if(!label.id)label.id='test-group-'+index;
    group.setAttribute('role','group');
    group.setAttribute('aria-labelledby',label.id);
   }
  }
 });
 form.querySelector('#manual')?.setAttribute('aria-label','Manual tracklist');
 form.querySelector('#playlistUrl')?.setAttribute('aria-label','Playlist URL (disabled in JOSH TEST)');
 form.addEventListener('click',()=>queueMicrotask(()=>{syncChoices();saveDraft();}));
 form.addEventListener('change',()=>queueMicrotask(()=>{syncChoices();saveDraft();}));
 form.addEventListener('input',()=>queueMicrotask(saveDraft));
 addEventListener('crosstalk-order-success',()=>{
  try{sessionStorage.removeItem(draftKey);sessionStorage.removeItem(instanceKey);}catch(_){}
 });
 syncChoices();
})();
