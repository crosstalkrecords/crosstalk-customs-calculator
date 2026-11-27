'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {makeApp}=require('../src/server.cjs');
const baseConfig=root=>({dataDir:root,bindSecret:'b'.repeat(40),staffSecret:'s'.repeat(40),origins:['https://crosstalkrecords.github.io'],
 publicOrigin:'https://candidate.example',mode:'dropbox',dropboxRoot:'/Crosstalk Customs/Orders',refreshToken:'dummy',clientId:'dummy',clientSecret:'dummy',
 productionIntakeEnabled:true,productionWebhookUrl:'https://hook.eu1.make.com/candidateonly',productionMakeApiKey:'candidateonly'});
const fields={'Customer Name':'Ada Example',Email:'ada@example.org','Custom Field 1':'0400000000',Packaging:'Standard',Quantity:'1','Record Size':'7',Speed:'45 RPM',Tracklist:'FORMAT: 1 disc | 1 disc | 2 sides (A-B) | 7in | 45 RPM'};
const id='11111111-1111-4111-8111-111111111111',key=crypto.randomBytes(32).toString('base64url');
async function setup(fetchImpl){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'production-order-'));
 const service=makeApp(baseConfig(root),{worker:{interval:999999},productionOrders:{fetchImpl,interval:30}});
 const server=service.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const url='http://127.0.0.1:'+server.address().port;
 return {service,url,async request(route,{method='GET',body,staff=false,bind=false,orderKey}={}){
  const res=await fetch(url+route,{method,headers:{Origin:'https://crosstalkrecords.github.io',...(body?{'Content-Type':'application/json'}:{}),
   ...(staff?{Authorization:'Bearer '+'s'.repeat(40)}:{}),...(bind?{Authorization:'Bearer '+'b'.repeat(40)}:{}),...(orderKey?{'X-Order-Key':orderKey}:{})},
   body:body?JSON.stringify(body):undefined});return {status:res.status,data:await res.json()};
 },async close(){await new Promise(resolve=>server.close(resolve));await service.close();await fs.rm(root,{recursive:true,force:true})}};
}
async function until(fn){for(let i=0;i<80;i++){const v=await fn();if(v)return v;await new Promise(r=>setTimeout(r,20));}throw Error('Timed out waiting for isolated dispatch');}
test('production gateway deduplicates an ordinary order, requires trusted outcome, and pauses new intake',async()=>{
 const sent=[];const f=await setup(async(_url,options)=>{sent.push(JSON.parse(options.body));return {ok:true,text:async()=> 'Accepted'};});
 try{
  const body={submissionId:id,clientKey:key,fields};
  assert.equal((await f.request('/v1/production-orders',{method:'POST',body})).status,202);
  assert.equal((await f.request('/v1/production-orders',{method:'POST',body})).status,202);
  await until(()=>sent.length===1);
  assert.equal((await f.request('/v1/production-orders',{method:'POST',body:{...body,fields:{...fields,Quantity:'2'}}})).status,409);
  assert.equal((await f.request('/v1/production-orders/'+id,{orderKey:'wrong'})).status,422);
  const ledger=await f.request('/internal/production-ledger',{staff:true});assert.equal(ledger.data.items.length,1);
  const outcome={submissionId:id,requestFingerprint:sent[0]['Request Fingerprint'],airtableRecordId:'rec12345678901234',
   folder:'/Crosstalk Customs/Orders/JOB9/Uploads',uploadLink:'https://www.dropbox.com/request/abc123',state:'complete'};
  assert.equal((await f.request('/internal/production-outcome',{method:'POST',body:outcome})).status,401);
  assert.equal((await f.request('/internal/production-outcome',{method:'POST',body:outcome,bind:true})).status,200);
  assert.equal((await f.request('/internal/production-outcome',{method:'POST',body:outcome,bind:true})).status,200);
  const saved=await f.request('/v1/production-orders/'+id,{orderKey:key});
  assert.equal(saved.data.uploadLink,outcome.uploadLink);assert.equal(saved.data.state,'complete');
  assert.equal((await f.request('/internal/production-pause',{method:'POST',staff:true,body:{paused:true}})).data.paused,true);
  assert.equal((await f.request('/v1/production-orders',{method:'POST',body:{...body,submissionId:crypto.randomUUID()}})).status,503);
  assert.equal((await f.request('/internal/production-ledger',{staff:true})).data.items.length,1);
 }finally{await f.close();}
});
test('ambiguous Make response is held for reconciliation and never automatically replayed',async()=>{
 let calls=0;const f=await setup(async()=>{calls++;throw Error('Simulated timeout after downstream side effects');});
 try{
  const body={submissionId:id,clientKey:key,fields};
  assert.equal((await f.request('/v1/production-orders',{method:'POST',body})).status,202);
  await until(async()=>{const r=await f.request('/v1/production-orders/'+id,{orderKey:key});return r.data.state==='unknown';});
  assert.equal((await f.request('/v1/production-orders',{method:'POST',body})).status,409);
  await new Promise(r=>setTimeout(r,120));assert.equal(calls,1);
 }finally{await f.close();}
});
test('one artwork capability binds only to the exact returned order folder',async()=>{
 const sent=[];const f=await setup(async(_url,options)=>{sent.push(JSON.parse(options.body));return {ok:true,text:async()=> 'Accepted'};});
 try{
  const draft=f.service.store.create(),reference=draft.id+'.'+draft.token;
  f.service.store.db.prepare("UPDATE jobs SET state='ready' WHERE id=?").run(draft.id);
  const body={submissionId:id,clientKey:key,artworkReference:reference,fields:{...fields,Packaging:'Printed Jacket + Labels'}};
  assert.equal((await f.request('/v1/production-orders',{method:'POST',body})).status,202);
  assert.equal((await f.request('/v1/production-orders',{method:'POST',body:{...body,submissionId:crypto.randomUUID(),clientKey:crypto.randomBytes(32).toString('base64url')}})).status,409);
  await until(()=>sent.length===1);
  assert.equal(sent[0]['Artwork Attached'],'Yes');
  assert.equal(JSON.stringify(sent[0]).includes(draft.token),false);
  const outcome={submissionId:id,requestFingerprint:sent[0]['Request Fingerprint'],airtableRecordId:'rec12345678901234',
   folder:'/Crosstalk Customs/Orders/JOB9/Uploads',uploadLink:'https://www.dropbox.com/request/abc123',state:'complete'};
  assert.equal((await f.request('/internal/production-outcome',{method:'POST',bind:true,body:{...outcome,uploadLink:'https://www.dropbox.com/scl/fo/edit'}})).status,422);
  assert.equal((await f.request('/internal/production-outcome',{method:'POST',bind:true,body:{...outcome,folder:'/Crosstalk Customs/JOSH TEST/other/Uploads'}})).status,422);
  assert.equal((await f.request('/internal/production-outcome',{method:'POST',bind:true,body:outcome})).status,200);
  const binding=JSON.parse(f.service.store.get(draft.id).binding);
  assert.equal(binding.orderId,outcome.airtableRecordId);assert.equal(binding.folder,outcome.folder);
  assert.equal((await f.request('/internal/production-outcome',{method:'POST',bind:true,body:{...outcome,folder:'/Crosstalk Customs/Orders/JOB10/Uploads'}})).status,409);
 }finally{await f.close();}
});
test('pause stops new acceptance while an already accepted order drains',async()=>{
 const sent=[];const f=await setup(async(_url,options)=>{sent.push(JSON.parse(options.body));return {ok:true,text:async()=> 'Accepted'};});
 try{
  const body={submissionId:id,clientKey:key,fields};
  assert.equal((await f.request('/v1/production-orders',{method:'POST',body})).status,202);
  assert.equal((await f.request('/internal/production-pause',{method:'POST',staff:true,body:{paused:true}})).status,200);
  await until(()=>sent.length===1);
  assert.equal((await f.request('/v1/production-orders',{method:'POST',body:{...body,submissionId:crypto.randomUUID()}})).status,503);
  const status=await f.request('/v1/production-orders/'+id,{orderKey:key});assert.equal(status.data.state,'processing');
 }finally{await f.close();}
});
test('a queued Make acknowledgment without final callback becomes uncertain, not replayed',async()=>{
 let calls=0;const f=await setup(async()=>{calls++;return {ok:true,text:async()=> 'Accepted'};});
 try{
  assert.equal((await f.request('/v1/production-orders',{method:'POST',body:{submissionId:id,clientKey:key,fields}})).status,202);
  await until(async()=>{const r=await f.request('/v1/production-orders/'+id,{orderKey:key});return r.data.state==='processing';});
  f.service.store.db.prepare("UPDATE production_submissions SET updated=? WHERE id=?").run(Date.now()-11*60*1000,id);
  await until(async()=>{const r=await f.request('/v1/production-orders/'+id,{orderKey:key});return r.data.state==='unknown';});
  assert.equal(calls,1);
 }finally{await f.close();}
});
