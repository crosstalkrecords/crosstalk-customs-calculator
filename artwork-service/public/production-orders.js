'use strict';
// Loaded only on the separately built release form, never by live main.
(()=>{
 const form=document.getElementById('orderForm'),success=document.getElementById('success'),wrap=document.getElementById('wrap');
 if(!form||!success||!wrap)return;
 const origin=new URL(document.currentScript.src).origin,keyName='crosstalk-production-submission-v1';
 const button=form.querySelector('button[type="submit"]');
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');success.append(status);
 const heading=success.querySelector('h2'),copy=success.querySelector('p');
 let record,timer;
 try{record=JSON.parse(sessionStorage.getItem(keyName));}catch(_){sessionStorage.removeItem(keyName);}
 const save=()=>sessionStorage.setItem(keyName,JSON.stringify(record));
 function hold(message){wrap.style.display='none';success.style.display='block';heading.textContent='We are checking your order';copy.textContent=message;status.textContent='Reference: '+record.id+' — contact Crosstalk with this reference if needed. Do not submit a second order.';}
 function complete(result){
  record.done=true;record.uploadLink=result.uploadLink;save();clearTimeout(timer);
  wrap.style.display='none';success.style.display='block';heading.textContent='Order received';
  copy.textContent='Your order has been received. Use the upload link below to supply your audio and any finished artwork.';
  status.textContent='Order reference: '+record.id;
  const upload=document.getElementById('upload'),uploadWrap=document.getElementById('uploadWrap');
  if(result.uploadLink&&upload&&uploadWrap){upload.href=result.uploadLink;uploadWrap.classList.remove('hidden');}
  dispatchEvent(new Event('crosstalk-order-success'));
 }
 async function poll(){
  if(!record||record.done)return;
  try{
   const response=await fetch(origin+'/v1/production-orders/'+encodeURIComponent(record.id),{headers:{'X-Order-Key':record.key},cache:'no-store'});
   if(response.ok){const result=await response.json();if(result.state==='complete'){complete(result);return;}
    if(result.outcomeUncertain){hold('Your order may have been received, but confirmation needs staff review. Please give us the reference below.');return;}
    hold('Your order is being processed. Keep this tab open; the upload link will appear when it is confirmed.');
   }else hold('We cannot verify your order right now. Please give Crosstalk the reference below.');
  }catch(_){hold('We cannot verify your order right now. Please give Crosstalk the reference below.');}
  timer=setTimeout(poll,5000);
 }
 if(record?.id&&record?.key){
  if(record.done)complete(record);
  else{hold('Checking your earlier submission. Please do not submit it again.');void poll();}
 }
 form.onsubmit=async event=>{
  event.preventDefault();if(record){hold('Checking your earlier submission. Please do not submit it again.');void poll();return;}
  if(!form.reportValidity())return;
  // Match the existing handler's hidden-field synchronization.
  sync();
  const fields={};for(const [name,value] of new FormData(form))if(name!=='Artwork Reference')fields[name]=String(value);
  const random=crypto.getRandomValues(new Uint8Array(32));
  record={id:crypto.randomUUID(),key:btoa(String.fromCharCode(...random)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),done:false};
  save();button.disabled=true;button.textContent='Submitting…';
  try{
   const response=await fetch(origin+'/v1/production-orders',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({submissionId:record.id,clientKey:record.key,artworkReference:form.elements.namedItem('Artwork Reference')?.disabled?'':form.elements.namedItem('Artwork Reference')?.value||'',fields})});
   const outcome=await response.json();
   if(response.status===202||response.ok){hold('Your order is being processed. Keep this tab open for the upload link.');void poll();return;}
   if(response.status===422){sessionStorage.removeItem(keyName);record=null;button.disabled=false;button.textContent='Place My Order';alert(outcome.error||'Please check your order details and try again.');return;}
   hold('We cannot confirm whether the order was accepted. Contact Crosstalk with the reference below.');
  }catch(_){hold('We cannot confirm whether the order was accepted. Contact Crosstalk with the reference below.');void poll();}
 };
})();
