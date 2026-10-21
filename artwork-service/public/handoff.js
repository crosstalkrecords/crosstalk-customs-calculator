'use strict';
window.CrosstalkHandoff=(()=>{
 const api=()=>window.CROSSTALK_ARTWORK_API||location.origin;
 const key='crosstalk-artwork-upload:'+(new URLSearchParams(location.search).get('artworkSession')||'standalone');
 const hex=buffer=>Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');
 async function request(path,options={}){const response=await fetch(api()+path,options);const data=await response.json().catch(()=>({}));if(!response.ok){const e=Error(data.error||'Artwork upload failed. Please retry.');e.status=response.status;throw e;}return data;}
 async function source(src){
  const url=new URL(src,location.href);
  if(!['data:','blob:'].includes(url.protocol)&&!(url.origin===location.origin&&url.pathname.endsWith('/assets/crosstalk-logo.png')))throw Error('This source image is unavailable. Please upload it again.');
  const response=await fetch(src);if(!response.ok)throw Error('A source image could not be read. Your artwork has not been submitted.');
  const blob=await response.blob();if(blob.size>20*1024*1024)throw Error('Each source image must be 20 MB or smaller.');return blob;
 }
 async function upload(project,onProgress){
  const sources=new Map();
  for(const list of Object.values(project.surfaces))for(const l of list)if(l.type==='image'){
   const src=l.src;if(!sources.has(src)){onProgress('Checking source image '+(sources.size+1)+'…');const blob=await source(src);const hash=hex(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()));sources.set(src,hash);}l.src='asset:'+sources.get(src);
  }
  const json=JSON.stringify(project),fingerprint=hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(json)));
  let session;try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.fingerprint===fingerprint)session=saved;}catch(_){}
  if(session){try{const status=await request('/v1/drafts/'+session.id,{headers:{Authorization:'Bearer '+session.token}});if(status.state!=='draft')return {reference:session.id+'.'+session.token,state:status.state};}catch(e){if(e.status===404)session=null;else throw e;}}
  if(!session){session={...await request('/v1/drafts',{method:'POST'}),fingerprint};try{localStorage.setItem(key,JSON.stringify(session));}catch(_){}}
  const headers={Authorization:'Bearer '+session.token};let n=0;
  for(const [src,hash] of sources){
   onProgress('Uploading source image '+(++n)+' of '+sources.size+'…');const blob=await source(src);
   await request('/v1/drafts/'+session.id+'/assets/'+hash,{method:'PUT',headers:{...headers,'Content-Type':blob.type},body:blob});
  }
  onProgress('Saving editable project…');
  return request('/v1/drafts/'+session.id+'/commit',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:json});
 }
 return {upload};
})();
