'use strict';
(()=>{
 const form=document.getElementById('orderForm');if(!form)return;
 // In production this script is served by the artwork service on the form's
 // GitHub Pages origin. Keep the service origin tied to the loaded script.
 const serviceOrigin=new URL(document.currentScript?.src||location.href).origin;
 const testPreview=location.pathname==='/calculator-preview.html';
 const attachedCopy=testPreview
  ?'Artwork uploaded and attached. Submit JOSH TEST to queue its PSD delivery.'
  :'Artwork uploaded and attached. Place your order to queue its PSD delivery.';
 const artworkStep=form.querySelector('[data-step="3"]'),artHelp=document.getElementById('artHelp');
 if(!artworkStep||!artHelp)return;
 const box=document.createElement('section');box.className='artwork-designer-entry hidden';
 box.innerHTML='<label class="artwork-choice"><input type="checkbox" id="chooseCustomArtwork"> Create custom artwork in the editor</label><div id="artworkEditorAction" class="hidden"><button type="button" class="btn" id="openArtworkDesigner">Open artwork editor</button><p class="artwork-return-copy">'+(testPreview?'Your choices and tracklist are saved in this tab for up to 24 hours. The editor opens in another window; when you finish, you will return to this Extras page.':'The editor opens in another window. When you finish, you will return to this Extras page; keep this order tab open. Leave this option unticked if you plan to upload finished artwork after ordering.')+'</p></div><p id="artworkOrderStatus" role="status" aria-live="polite">No designer artwork attached.</p>';
 const style=document.createElement('style');style.textContent='.artwork-designer-entry{margin:16px 0 20px}.artwork-choice{display:flex;align-items:center;gap:10px;font-weight:700;cursor:pointer}.artwork-choice input{width:20px;height:20px;flex:none}.artwork-designer-entry #openArtworkDesigner{display:block;width:100%;margin:12px 0 6px;padding:16px;font-size:1.08rem}.artwork-return-copy{margin:0 0 8px;line-height:1.5}.artwork-designer-entry #artworkOrderStatus{margin:8px 0 0}';document.head.append(style);
 artworkStep.querySelector('.lede').after(box);
 const choice=document.getElementById('chooseCustomArtwork'),action=document.getElementById('artworkEditorAction');
 const choiceKey=testPreview?'crosstalk-test-custom-artwork-choice':'crosstalk-custom-artwork-choice';
 try{choice.checked=sessionStorage.getItem(choiceKey)==='yes';}catch(_){}
 const input=document.createElement('input');input.type='hidden';input.name=testPreview?'Artwork Job ID':'Artwork Reference';form.append(input);
 const review=document.createElement('p');review.className='muted artwork-review';
 document.getElementById('review')?.after(review);
 const referenceKey=testPreview?'crosstalk-test-artwork-job':'crosstalk-artwork-order-reference';
 if(testPreview){
  sessionStorage.removeItem('crosstalk-artwork-order-reference');
  try{for(const key of Object.keys(localStorage))if(key.startsWith('crosstalk-artwork-upload:')){
   try{if(JSON.parse(localStorage.getItem(key))?.token)localStorage.removeItem(key);}catch(_){}
  }}catch(_){}
 }
 const validReference=value=>testPreview?/^[a-f0-9]{32}$/.test(value||''):/^[a-f0-9]{32}\.[A-Za-z0-9_-]{43}$/.test(value||'');
 let editor,session=sessionStorage.getItem('crosstalk-artwork-order-session')||crypto.randomUUID();sessionStorage.setItem('crosstalk-artwork-order-session',session);
 const status=document.getElementById('artworkOrderStatus');
 try{
  const saved=JSON.parse(sessionStorage.getItem(referenceKey));
  if(saved?.session===session&&validReference(saved.reference)){
   input.value=saved.reference;
   status.textContent=attachedCopy;
  }else sessionStorage.removeItem(referenceKey);
 }catch(_){sessionStorage.removeItem(referenceKey);}
 function updateAvailability(){
  const printed=!document.getElementById('promoLookSummary').classList.contains('hidden')||form.querySelector('#packs .choice.selected')?.dataset.pack!=='Standard';
  box.classList.toggle('hidden',!printed);input.disabled=!printed;
  action.classList.toggle('hidden',!printed||!choice.checked);
  review.textContent=printed?(input.value?'Cover and label artwork attached.':choice.checked?'Artwork: finish and attach your design before continuing.':testPreview?'Artwork: no designer artwork selected for this test.':'Artwork: upload finished files after ordering, or return to Make It Yours to use the designer.'):'';
  review.classList.toggle('hidden',!printed);
 }
 choice.addEventListener('change',()=>{
  if(!choice.checked&&input.value){input.value='';sessionStorage.removeItem(referenceKey);status.textContent='Designer artwork removed from this order.';}
  try{sessionStorage.setItem(choiceKey,choice.checked?'yes':'no');}catch(_){}
  updateAvailability();
 });
 form.addEventListener('click',event=>{
  if(!event.target.closest('[data-step="3"] [data-next="4"]')||box.classList.contains('hidden')||!choice.checked||input.value)return;
  event.preventDefault();event.stopImmediatePropagation();
  status.textContent='Finish and attach your artwork in the editor before continuing, or untick this option.';
  box.scrollIntoView({block:'center',behavior:'smooth'});document.getElementById('openArtworkDesigner').focus();
 },true);
 // The calculator changes packaging in its click handlers. Read the final
 // selected choice after those handlers, including the fixed-price promo.
 form.addEventListener('click',()=>queueMicrotask(updateAvailability));
 updateAvailability();
 document.getElementById('openArtworkDesigner').onclick=()=>{
  const url=new URL('/designer.html',serviceOrigin);
  url.searchParams.set('artworkSession',session);
  url.searchParams.set('returnOrigin',location.origin);
  if(testPreview)url.searchParams.set('testPreview','1');
  editor=window.open(url.href,'crosstalkArtwork');
  if(!editor)status.textContent='Allow this artwork window to open, then try again.';
 };
 addEventListener('message',event=>{
  const attached=testPreview?event.data?.artworkJobId:event.data?.reference;
  if(event.origin!==serviceOrigin||event.source!==editor||event.data?.type!=='crosstalk-artwork-complete'||event.data?.session!==session||!validReference(attached))return;
  input.value=attached;sessionStorage.setItem(referenceKey,JSON.stringify({session,reference:input.value}));
  choice.checked=true;try{sessionStorage.setItem(choiceKey,'yes');}catch(_){}
  status.textContent=attachedCopy;updateAvailability();
  if(typeof window.go==='function')window.go(3);
  window.focus();editor?.close();editor=null;
 });
 // The live form must dispatch this only after Make confirms an actual order.
 addEventListener('crosstalk-order-success',()=>{
  input.value='';sessionStorage.removeItem(referenceKey);
  // The JOSH TEST confirmation screen must survive refresh so its existing
  // order can show the later delivery outcome without creating another order.
  if(!testPreview){session=crypto.randomUUID();sessionStorage.setItem('crosstalk-artwork-order-session',session);}
  editor=null;choice.checked=false;try{sessionStorage.removeItem(choiceKey);}catch(_){}
  status.textContent='No designer artwork attached.';updateAvailability();
 });
})();
