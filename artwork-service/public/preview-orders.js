'use strict';
// Loaded only by the generated JOSH TEST calculator. Never used by the live form.
(async()=>{
 const form=document.getElementById('orderForm'),submit=form?.querySelector('button[type="submit"]');
 if(!form||!submit)return;
 const error=document.createElement('p');error.id='testSubmitError';error.setAttribute('role','alert');
 error.style.cssText='color:#9d211d;font-weight:700;line-height:1.5;white-space:pre-wrap';
 submit.closest('.nav').before(error);
 const success=document.getElementById('success'),heading=success.querySelector('h2'),message=success.querySelector('p');
 const status=document.createElement('p');status.id='testDeliveryStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');success.append(status);
 document.getElementById('uploadWrap')?.remove();
 const audioCopy=document.querySelector('[data-step="4"] .muted');
 if(audioCopy)audioCopy.textContent='This test does not create an audio upload link or a real order. Use synthetic audio details only.';
 const fields=[['Customer Name','name'],['Email','email'],['Custom Field 1','phone']];
 let config;
 try{
  const response=await fetch('/v1/test-config',{cache:'no-store'});
  if(!response.ok)throw Error();config=await response.json();
  for(const [name,key] of fields){const input=form.elements.namedItem(name);input.value=config[key];input.readOnly=true;input.setAttribute('aria-label',name+' — fixed JOSH TEST value');}
  const phone=form.elements.namedItem('Custom Field 1');phone.closest('.field')?.insertAdjacentHTML('beforeend','<small>Test identity only. No customer details will be used.</small>');
  const delivery=document.getElementById('delivery'),address={
   'Street Address':'1 TEST ONLY LANE',Suburb:'TESTVILLE',Postcode:'0000',State:'NSW'
  };
  const note=document.createElement('small');
  note.textContent='JOSH TEST shipping uses a fictional address. Nothing will be shipped.';
  delivery.closest('.field')?.append(note);
  function setTestAddress(){
   const shipping=delivery.value==='shipping';
   for(const [name,synthetic] of Object.entries(address)){
    const input=form.elements.namedItem(name);
    input.value=shipping?synthetic:'';
    if(name==='State'){
     input.tabIndex=shipping?-1:0;
     input.style.pointerEvents=shipping?'none':'';
     input.setAttribute('aria-disabled',String(shipping));
    }else input.readOnly=shipping;
   }
  }
  form.elements.namedItem('State').addEventListener('change',event=>{
   if(delivery.value==='shipping')event.target.value=address.State;
  });
  delivery.addEventListener('change',setTestAddress);
  setTestAddress();
 }catch(_){error.textContent='The JOSH TEST submission window is closed. Ask Crosstalk to reopen it before submitting.';submit.disabled=true;return;}
 function session(){return sessionStorage.getItem('crosstalk-artwork-order-session');}
 async function watch(reference){
  const [id,token]=reference.split('.');
  for(let attempt=0;attempt<80;attempt++){
   try{
    const response=await fetch('/v1/drafts/'+id,{headers:{Authorization:'Bearer '+token},cache:'no-store'});
    if(response.ok){const result=await response.json();
     if(result.state==='delivered'){status.textContent='JOSH TEST artwork ZIP delivered to the isolated Dropbox folder.';return;}
     if(result.state==='failed'){status.textContent='JOSH TEST artwork delivery failed. Give Crosstalk the test order ID below for follow-up.';return;}
     status.textContent='JOSH TEST artwork is '+(result.state==='ready'?'awaiting binding':result.state)+'. Delivery is not yet confirmed.';
    }
   }catch(_){}
   await new Promise(resolve=>setTimeout(resolve,3000));
  }
  status.textContent='Delivery is still pending or its status could not be checked. Give Crosstalk the test order ID below.';
 }
 form.onsubmit=async event=>{
  event.preventDefault();if(submit.disabled||!form.reportValidity())return;
  sync();error.textContent='';submit.disabled=true;submit.textContent='Submitting JOSH TEST…';
  const data=Object.fromEntries(new FormData(form));
  const reference=data['Artwork Reference']||'';
  const id=session();
  try{
   const response=await fetch('/v1/test-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({testOrderId:id,artworkReference:reference,fields:data})});
   const result=await response.json();
   if(!response.ok)throw Error(result.error||'JOSH TEST submission failed.');
   document.getElementById('wrap').style.display='none';success.style.display='block';
   heading.textContent='JOSH TEST submission accepted';
   message.textContent='TEST JOSH 21.11 was sent through the isolated Make test route. A test notification is directed only to Crosstalk’s test inbox. No customer order or invoice was created.';
   const code=document.createElement('p');code.textContent='Test order ID: '+result.testOrderId;success.append(code);
   if(reference&&result.deliveryPending)void watch(reference);
   else status.textContent='No designer artwork was attached to this test.';
   dispatchEvent(new Event('crosstalk-order-success'));
  }catch(e){error.textContent=(e.message||'Test submission failed.')+' Keep this page open and retry, or give Crosstalk your test order ID: '+id;submit.disabled=false;submit.textContent='Place My Order';}
 };
})();
