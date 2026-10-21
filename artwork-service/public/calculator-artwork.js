'use strict';
(()=>{
 const form=document.getElementById('orderForm');if(!form)return;
 const box=document.createElement('section');box.style.cssText='padding:18px;margin:16px 0;border:1px solid #999;border-radius:12px';
 box.innerHTML='<h3>Design your artwork</h3><p>Create your cover and labels, then return here to attach them to your order.</p><button type="button" id="openArtworkDesigner">Open artwork designer</button><p id="artworkOrderStatus" role="status">No designer artwork attached.</p>';
 form.prepend(box);
 const input=document.createElement('input');input.type='hidden';input.name='Artwork Reference';form.append(input);
 let editor,session=sessionStorage.getItem('crosstalk-artwork-order-session')||crypto.randomUUID();sessionStorage.setItem('crosstalk-artwork-order-session',session);
 document.getElementById('openArtworkDesigner').onclick=()=>{
  editor=window.open('designer.html?artworkSession='+encodeURIComponent(session),'crosstalkArtwork');
  if(!editor)document.getElementById('artworkOrderStatus').textContent='Allow this artwork window to open, then try again.';
 };
 addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==editor||event.data?.type!=='crosstalk-artwork-complete'||event.data?.session!==session||!/^\w{32}\.[A-Za-z0-9_-]{43}$/.test(event.data?.reference||''))return;
  input.value=event.data.reference;document.getElementById('artworkOrderStatus').textContent='Artwork uploaded and attached. Place your order to queue its PSD delivery.';
 });
})();
