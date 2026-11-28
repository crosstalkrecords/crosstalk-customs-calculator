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
 const box=document.createElement('section');box.className='artwork-designer-entry';
 box.innerHTML='<h3 class="artwork-intro-copy">Upload your own images or create something new in our Packaging Designer.</h3><button type="button" class="btn" id="openArtworkDesigner">Open Packaging Designer</button><p class="artwork-return-copy">'+(testPreview?'Your choices and tracklist are saved in this tab for up to 24 hours. When you finish designing, you will return to this Extras page.':'Keep this form tab open while designing. When you finish, you will return to this Extras page with your answers here.')+'</p><p id="artworkOrderStatus" role="status" aria-live="polite">No designer artwork attached.</p>';
 const style=document.createElement('style');style.textContent='.artwork-designer-entry{margin:16px 0 20px}.artwork-designer-entry .artwork-intro-copy{font-size:1.12rem;font-weight:750;line-height:1.35;margin:0 0 12px;color:#292725}.artwork-designer-entry #openArtworkDesigner{display:block;width:100%;margin:0 0 10px;padding:16px;font-size:1.08rem}.artwork-return-copy{margin:0 0 6px;line-height:1.5}.artwork-designer-entry #artworkOrderStatus{margin:8px 0 0}';document.head.append(style);
 document.getElementById('promoLookSummary').after(box);
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
  const printed=!document.getElementById('promoLookSummary').classList.contains('hidden')||['Printed Jacket + Labels','Custom Finish Pack'].includes(form.querySelector('#packs .choice.selected')?.dataset.pack);
  input.disabled=!printed;
  if(!printed){if(!status.textContent.startsWith('Choose Printed Jacket'))status.textContent='Choose a printed packaging option above to use the designer. Standard packaging does not include printed artwork.';}
  else if(input.value)status.textContent=attachedCopy;
  else if(status.textContent.startsWith('Choose '))status.textContent='No designer artwork attached. You can also supply finished artwork after ordering.';
  review.textContent=printed?(input.value?'Designer artwork attached. Review each cover and label surface before submitting.':testPreview?'Artwork: no designer artwork attached; you may supply files after ordering.':'Artwork: upload finished files after ordering, or return to Make It Yours to use the designer.'):'Standard packaging: no printed artwork included.';
  review.classList.toggle('hidden',!printed);
 }
 // The calculator changes packaging in its click handlers. Read the final
 // selected choice after those handlers, including the fixed-price promo.
 form.addEventListener('click',()=>queueMicrotask(updateAvailability));
 updateAvailability();
 document.getElementById('openArtworkDesigner').onclick=()=>{
  if(input.disabled){status.textContent='Choose Printed Jacket + Labels or Custom Finish Pack above, then open the Packaging Designer. Your price will update only when you choose a packaging option.';form.querySelector('#packs [data-pack="Printed Jacket + Labels"]')?.focus();return;}
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
  editor=null;
  status.textContent='No designer artwork attached.';updateAvailability();
 });
})();
