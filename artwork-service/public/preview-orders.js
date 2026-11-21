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
 document.querySelector('.promo')?.classList.add('hidden');
 const promoButton=document.getElementById('promoStart');if(promoButton)promoButton.disabled=true;
 const playlistButton=document.getElementById('playlistTry'),playlistUrl=document.getElementById('playlistUrl');
 if(playlistButton)playlistButton.disabled=true;
 if(playlistUrl)playlistUrl.disabled=true;
 const playlistMessage=document.getElementById('playlistMsg');
 if(playlistMessage)playlistMessage.textContent='Public playlist and track lookups are disabled in JOSH TEST. Enter synthetic track names or a manual tracklist.';
 const audioCopy=document.querySelector('[data-step="4"] .muted');
 if(audioCopy)audioCopy.textContent='This form does not collect audio files directly. If the isolated test intake accepts your submission, Josh may receive a private upload link for a harmless dummy file. Do not upload genuine customer audio.';
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
 }catch(_){
  error.textContent='JOSH TEST submission is closed for now. You can review the interface and designer, but the form cannot submit until Crosstalk opens a controlled test window.';
  const banner=document.querySelector('body > [role="note"]');
  if(banner)banner.textContent='JOSH TEST — TEST JOSH 21.11. Submission is currently closed. You can explore the form and designer, but no test order, email, upload link, charge or invoice will be created from this page.';
  submit.disabled=true;
 }
 function session(){return sessionStorage.getItem('crosstalk-artwork-order-session');}
 const attemptedKey='crosstalk-artwork-order-attempted';
 function showSessionLost(id){
  // A fresh signed cookie cannot read an older submission. Preserve the ID
  // instead of leaving a form that will fail or invite a second order.
  document.getElementById('wrap').style.display='none';success.style.display='block';
  success.dataset.intakeState='session_lost';heading.tabIndex=-1;
  heading.textContent='JOSH TEST session needs review';
  message.textContent='This browser can no longer verify the earlier test submission. Give Crosstalk the test order ID below to reconcile it. Do not submit again until Crosstalk confirms the outcome; no payment was taken on this page.';
  let code=success.querySelector('[data-test-order-id]');
  if(!code){code=document.createElement('p');code.dataset.testOrderId='1';success.append(code);}
  code.textContent='Test order ID: '+id;
  status.textContent='The email, upload link and artwork ZIP cannot be confirmed by this browser session.';
  submit.disabled=true;heading.focus();
 }
 function showResult(id,result){
  const firstResult=success.style.display!=='block',previousState=success.dataset.intakeState;
  document.getElementById('wrap').style.display='none';success.style.display='block';
  success.dataset.intakeState=result.state;heading.tabIndex=-1;
  let code=success.querySelector('[data-test-order-id]');
  if(!code){code=document.createElement('p');code.dataset.testOrderId='1';success.append(code);}
  code.textContent='Test order ID: '+id;
  if(result.state==='complete'){
   heading.textContent='JOSH TEST order confirmed';
   message.textContent='The isolated test route confirmed TEST JOSH 21.11. Crosstalk will separately check the Airtable record, email, file upload and exported ZIP. No payment was taken on this page.';
   if(result.artworkId){
    if(result.deliveryVerified)status.textContent='JOSH TEST artwork ZIP delivered and verified in the isolated Dropbox folder.';
    else if(result.deliveryFailed)status.textContent='JOSH TEST artwork delivery failed. Give Crosstalk the test order ID below for follow-up.';
    else if(!result.deliveryPending)status.textContent='Artwork delivery can no longer be verified here. Give Crosstalk the test order ID below for review.';
    else status.textContent='JOSH TEST artwork delivery is still pending.';
   }else status.textContent='No designer artwork was attached to this test.';
   if(previousState!=='complete'){
    if(result.deliveryPending&&result.artworkId)void watch(result.artworkId);
    dispatchEvent(new Event('crosstalk-order-success'));
   }
  }else if(result.state==='unknown'||result.state==='manual_review'){
   heading.textContent='JOSH TEST needs Crosstalk review';
   message.textContent='The outcome cannot be confirmed yet. Keep this test order ID and ask Crosstalk to reconcile it. Do not submit again; no payment was taken.';
   status.textContent='Manual review required. An email, upload link or artwork ZIP is not confirmed by this page.';
  }else{
   heading.textContent='JOSH TEST submission saved';
   message.textContent='TEST JOSH 21.11 is queued in the isolated test service. This is not yet an order confirmation. Keep this page open while the test route runs; no payment was taken.';
   status.textContent='Checking the isolated intake. Airtable, email, upload link and artwork delivery are not yet confirmed.';
  }
  if(firstResult||previousState!==result.state&&['complete','manual_review','unknown'].includes(result.state))heading.focus();
 }
 async function pollOutcome(id){
  for(let attempt=0;attempt<100;attempt++){
   try{
    const response=await fetch('/v1/test-orders/'+id,{cache:'no-store'});
    if(response.ok){const result=await response.json();showResult(id,result);
     if(['complete','unknown','manual_review'].includes(result.state))return;}
    else if(response.status===403||response.status===404){
     status.textContent='This browser session can no longer check the test order. Give Crosstalk the test order ID above.';return;
    }
   }catch(_){}
   await new Promise(resolve=>setTimeout(resolve,3000));
  }
  status.textContent='The test is still pending or its status could not be checked. Give Crosstalk the test order ID above; do not submit again.';
 }
 async function watch(id){
  for(let attempt=0;attempt<80;attempt++){
   try{
    const response=await fetch('/v1/drafts/'+id,{cache:'no-store'});
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
  const artworkJobId=data['Artwork Job ID']||'';
  const id=session();
  try{
   // A missing server row is normal before the first submission. After any
   // attempt, an ambiguous network failure must remain a reconciliation case.
   sessionStorage.setItem(attemptedKey,id);
   const response=await fetch('/v1/test-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({testOrderId:id,artworkJobId,fields:data})});
   const result=await response.json();
   if(!response.ok){
    if(result.outcomeUncertain&&result.testOrderId===id){showResult(id,{...result,state:'unknown'});return;}
    throw Error(result.error||'JOSH TEST submission failed.');
   }
   showResult(id,result);
   if(result.state!=='complete')void pollOutcome(id);
  }catch(e){
   error.textContent=(e.message||'Test submission failed.')+' Keep this page open and retry, or give Crosstalk your test order ID: '+id;
   submit.disabled=false;submit.textContent='Submit JOSH TEST';
  }
 };
 const existingId=session();
 if(existingId)fetch('/v1/test-orders/'+existingId,{cache:'no-store'}).then(async response=>{
  if(response.ok){const result=await response.json();showResult(existingId,result);
   if(!['complete','unknown','manual_review'].includes(result.state))void pollOutcome(existingId);}
  else if((response.status===403||response.status===404)&&sessionStorage.getItem(attemptedKey)===existingId)showSessionLost(existingId);
 }).catch(()=>{});
})();
