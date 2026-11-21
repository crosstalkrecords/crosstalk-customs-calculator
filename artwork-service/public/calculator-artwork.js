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
 const box=document.createElement('section');box.className='help artwork-designer-choice';
 box.innerHTML='<strong>Make your cover and labels</strong><p>'+(testPreview?'Create and attach a synthetic design here before submitting JOSH TEST. No separate upload link is created.':'Create your printed artwork here, or upload finished files using the private link after ordering.')+'</p><button type="button" class="btn secondary" id="openArtworkDesigner">Open cover designer</button><p id="artworkOrderStatus" role="status" aria-live="polite">No designer artwork attached.</p>';
 artHelp.before(box);
 const input=document.createElement('input');input.type='hidden';input.name='Artwork Reference';form.append(input);
 const review=document.createElement('p');review.className='muted artwork-review';
 document.getElementById('review')?.after(review);
 const referenceKey='crosstalk-artwork-order-reference';
 const validReference=value=>/^[a-f0-9]{32}\.[A-Za-z0-9_-]{43}$/.test(value||'');
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
  review.textContent=printed?(input.value?'Cover and label artwork attached.':testPreview?'Artwork: use the designer before test submission.':'Artwork: upload finished files after ordering, or return to Make It Yours to use the designer.'):'';
  review.classList.toggle('hidden',!printed);
 }
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
  if(event.origin!==serviceOrigin||event.source!==editor||event.data?.type!=='crosstalk-artwork-complete'||event.data?.session!==session||!validReference(event.data?.reference))return;
  input.value=event.data.reference;sessionStorage.setItem(referenceKey,JSON.stringify({session,reference:input.value}));
  status.textContent=attachedCopy;updateAvailability();
 });
 // The live form must dispatch this only after Make confirms an actual order.
 addEventListener('crosstalk-order-success',()=>{
  input.value='';sessionStorage.removeItem(referenceKey);
  session=crypto.randomUUID();sessionStorage.setItem('crosstalk-artwork-order-session',session);
  editor=null;status.textContent='No designer artwork attached.';updateAvailability();
 });
})();
