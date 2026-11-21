'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const {makeApp}=require('../src/server.cjs');
const ROOT='/Crosstalk Customs/JOSH TEST',RECORD='recAAAAAAAAAAAAAA',ID='d6f90e2f-6a80-4ac0-bb4e-258295f09802';
const fields=job=>({'Artist Order':'No','Customer Name':'TEST JOSH 21.11',Email:'delousedcomatorium@gmail.com','Custom Field 1':'0400000000',
 'Estimated Price Given':'165.00',Extras:'Printed Jacket + Labels',Packaging:'Printed Jacket + Labels',Postcode:'',Quantity:'1','Record Size':'12',
 Rush:'off','Shipping Required':'off','Side A Length':'','Side B Length':'',Sides:'Double',Speed:'33 RPM',State:'','Street Address':'',Suburb:'',
 Tracklist:'FORMAT: 1xLP | 1 disc | 2 sides (A-B) | 12in | 33 RPM\nEXTRAS: Printed Jacket + Labels\n\nSynthetic test only',
 'Vinyl Colour':'Clear','Artwork Job ID':job});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<80;i++){const v=fn();if(v)return v;await pause(25);}throw Error('Expected state did not arrive');}
const ack=p=>({ok:true,json:async()=>({testLabel:'JOSH TEST',submissionId:p['Submission ID'],requestFingerprint:p['Request Fingerprint'],airtableRecordId:RECORD,state:'accepted'})});
const outcome=(id,hash,state,extra={})=>({testLabel:'JOSH TEST',submissionId:id,requestFingerprint:hash,airtableRecordId:RECORD,state,...extra});
async function fixture(fetchImpl){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'customs-queued-intake-'));
 const config={bindSecret:'b'.repeat(40),staffSecret:'staff-test-only-'.repeat(3),dataDir:dir,origins:[],publicOrigin:'',mode:'dropbox',dropboxRoot:ROOT,
  testLabel:'JOSH TEST',testRecipient:'delousedcomatorium@gmail.com',testWebhookUrl:'https://hook.eu1.make.com/josh-test',testMakeApiKey:'synthetic-make-api-key',
  testAccessCode:'test-access-only',refreshToken:'test-refresh',clientId:'test-client',clientSecret:'test-secret'};
 const svc=makeApp(config,{worker:{interval:999999},testOrders:{fetchImpl,interval:20}}),server=svc.app.listen(0,'127.0.0.1');
 await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;config.publicOrigin=base;config.origins.push(base);
 const auth='Basic '+Buffer.from('tester:test-access-only').toString('base64');
 const cookie=async()=>{const r=await fetch(base+'/calculator-preview.html',{headers:{Authorization:auth}});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];};
 const owner=await cookie();
 const submit=(body,c=owner)=>fetch(base+'/v1/test-orders',{method:'POST',headers:{Authorization:auth,Origin:base,Cookie:c,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const status=(id,c=owner)=>fetch(base+'/v1/test-orders/'+id,{headers:{Origin:base,Cookie:c}});
 const trusted=(route,body,key=config.bindSecret)=>fetch(base+route,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const close=async()=>{await new Promise(r=>server.close(r));await svc.close();fs.rmSync(dir,{recursive:true,force:true});};
 return {svc,config,base,owner,cookie,submit,status,trusted,close};
}

test('queued artwork intake hides capability from Make; trusted bind and callback are idempotent even before ack resolves',async()=>{
 let release;const gate=new Promise(r=>{release=r;}),sent=[];
 const f=await fixture(async(_url,opt)=>{const p=JSON.parse(opt.body);sent.push(p);await gate;return ack(p);});
 try{
  assert.equal((await fetch(f.base+'/calculator-preview.html')).status,401);
  assert.equal((await fetch(f.base+'/%63alculator-preview.html')).status,401);
  assert.equal((await fetch(f.base+'/%64esigner.html')).status,401);
  const preview=await fetch(f.base+'/calculator-preview.html',{headers:{Authorization:'Basic '+Buffer.from('tester:test-access-only').toString('base64')}});
  assert.equal(preview.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
  assert.equal(preview.headers.get('cache-control'),'private, no-store');
  assert.equal(preview.headers.get('x-frame-options'),'DENY');
  assert.match(preview.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  const create=await fetch(f.base+'/v1/drafts',{method:'POST',headers:{Origin:f.base,Cookie:f.owner,'Content-Type':'application/json'},body:JSON.stringify({testOrderId:ID})});
  assert.equal(create.status,201);const job=await create.json();assert.deepEqual(Object.keys(job),['id']);
  f.svc.store.db.prepare("UPDATE jobs SET state='ready' WHERE id=?").run(job.id);
  const form=fields(job.id),body={testOrderId:ID,artworkJobId:job.id,fields:form};
  for(const bad of [{...body,artworkReference:'forged'},{...body,fields:{...form,Email:'other@example.com'}},
   {...body,fields:{...form,'Estimated Price Given':'1.00'}},{...body,fields:{...form,'Street Address':'REAL'}},
   {...body,fields:{...form,'Artwork Job ID':'different'}},{...body,fields:{...form,Extras:'Custom Finish Pack'}},
   {...body,fields:{...form,'Side A Length':'retired promotion'}},{...body,fields:{...form,Tracklist:'<script>alert(1)</script>'}},
   {...body,fields:{...form,'Request Fingerprint':'forged'}}])assert.equal((await f.submit(bad)).status,422);
  assert.equal((await fetch(f.base+'/v1/test-orders',{method:'POST',headers:{Origin:'https://elsewhere.invalid',Cookie:f.owner,'Content-Type':'application/json'},body:JSON.stringify(body)})).status,403);
  assert.equal((await f.submit(body,'')).status,403);
  const foreign=await f.cookie();assert.equal((await f.submit(body,foreign)).status,422);
  assert.equal((await f.submit({...body,testOrderId:'16f90e2f-6a80-4ac0-bb4e-258295f09802'})).status,422);
  assert.equal((await f.submit({...body,artworkJobId:'f'.repeat(32),fields:{...form,'Artwork Job ID':'f'.repeat(32)}})).status,422);
  const first=await f.submit(body);assert.equal(first.status,202);assert.equal((await first.json()).state,'queued');
  assert.equal((await f.submit(body)).status,202);assert.equal((await f.status(ID,foreign)).status,404);
  await until(()=>sent.length===1);const p=sent[0],hash=p['Request Fingerprint'];
  assert.equal(p['Artwork Reference'],undefined);assert.equal(p['Artwork Job ID'],job.id);assert.equal(p.Email,'delousedcomatorium@gmail.com');
  const saved=f.svc.store.db.prepare('SELECT state,payload FROM test_submissions WHERE id=?').get(ID);
  assert.equal(saved.state,'dispatching');assert(!saved.payload.includes('token_sealed'));
  assert.equal(hash,crypto.createHash('sha256').update(JSON.stringify({mapped:JSON.parse(saved.payload),artworkJobId:job.id})).digest('hex'));
  assert.equal(p['Submission ID'],ID);assert.equal(p['Test Order Name'],'TEST JOSH 21.11');
  assert.match(p['Test Summary'],/Do not invoice/);assert.equal(p.Tracklist,form.Tracklist);
  const bind={testLabel:'JOSH TEST',submissionId:ID,requestFingerprint:hash,artworkJobId:job.id,airtableRecordId:RECORD,folder:ROOT+'/'+ID+'/Uploads'};
  const deliveryQuery=Object.fromEntries(Object.entries(bind).filter(([key])=>key!=='folder'));
  const delivery=async(body=deliveryQuery,key=f.config.bindSecret)=>f.trusted('/internal/test-delivery-status',body,key);
  assert.equal((await delivery(deliveryQuery,'wrong-secret')).status,401);
  assert.equal((await delivery({...deliveryQuery,folder:bind.folder})).status,422);
  assert.equal((await delivery({...deliveryQuery,requestFingerprint:'f'.repeat(64)})).status,409);
  assert.equal((await delivery()).status,409,'incomplete intake cannot be marked delivered');
  assert.equal((await f.trusted('/internal/test-bind',bind,'wrong-secret')).status,401);
  assert.equal((await f.trusted('/internal/test-bind',{...bind,folder:ROOT+'/other/Uploads'})).status,422);
  assert.equal((await f.trusted('/internal/test-bind',{...bind,requestFingerprint:'f'.repeat(64)})).status,409);
  assert.equal((await f.trusted('/internal/test-bind',bind)).status,202,'bind can pin claim before ack');
  assert.equal((await(await f.trusted('/internal/test-bind',bind)).json()).artwork_status,'already_bound');
  assert.equal((await f.trusted('/internal/test-bind',{...bind,airtableRecordId:'recBBBBBBBBBBBBBB'})).status,409);
  const route='/internal/test-submissions/'+ID+'/outcome',done=outcome(ID,hash,'complete',{artwork_status:'bound'});
  assert.equal((await f.trusted(route,done)).status,200,'final callback can race ahead of early ack');
  release();await until(()=>f.svc.store.db.prepare('SELECT state FROM test_submissions WHERE id=?').get(ID).state==='complete');
  const final=await(await f.status(ID)).json();assert.equal(final.state,'complete');assert.equal(final.artworkStatus,'bound');assert.equal(final.deliveryPending,true);
  const pendingStatus=await(await delivery()).json();
  assert.deepEqual(pendingStatus,{testLabel:'JOSH TEST',submissionId:ID,airtableRecordId:RECORD,artworkJobId:job.id,
   artworkStatus:'bound',deliveryPending:true,deliveryVerified:false,deliveryFailed:false});
  assert.equal((await delivery()).headers.get('cache-control'),'private, no-store');
  assert.equal((await delivery({...deliveryQuery,airtableRecordId:'recBBBBBBBBBBBBBB'})).status,409);
  assert.equal((await delivery({...deliveryQuery,artworkJobId:'f'.repeat(32)})).status,409);
  assert.equal((await f.submit(body)).status,200);assert.equal(sent.length,1);
  assert.equal((await f.submit(body,foreign)).status,409);
  assert.equal((await f.submit({...body,fields:{...form,Tracklist:form.Tracklist+'\nchanged'}})).status,409);
  assert.equal((await f.trusted(route,done)).status,200);assert.equal((await f.trusted(route,{...done,artwork_status:'already_bound'})).status,409);
  const staff=()=>fetch(f.base+'/internal/test-submissions/'+ID,{headers:{Authorization:'Bearer '+f.config.staffSecret}});
  assert.equal((await(await staff()).json()).deliveryPending,true);
  f.svc.store.db.prepare("UPDATE jobs SET state='delivered',delivery_receipt=? WHERE id=?").run(JSON.stringify({verified:true,bytes:2048,contentHash:'a'.repeat(64)}),job.id);
  const delivered=await(await f.status(ID)).json();assert.equal(delivered.artworkStatus,'delivered');assert.equal(delivered.deliveryPending,false);assert.equal(delivered.deliveryVerified,true);
  const deliveryStatus=await(await delivery()).json();assert.equal(deliveryStatus.artworkStatus,'delivered');assert.equal(deliveryStatus.deliveryVerified,true);
  assert.equal(JSON.stringify(deliveryStatus).includes(f.config.testRecipient),false);
  assert.equal(JSON.stringify(deliveryStatus).includes(f.config.testWebhookUrl),false);
  const staffDelivered=await(await staff()).json();assert.equal(staffDelivered.artworkState,'delivered');assert.equal(staffDelivered.deliveryVerified,true);assert.equal(staffDelivered.deliveryPending,false);
  assert.equal((await(await f.submit(body)).json()).artworkStatus,'delivered','idempotent response reflects the worker, not the old bind callback');
  f.svc.store.db.prepare("UPDATE jobs SET delivery_receipt=NULL WHERE id=?").run(job.id);
  const unverified=await(await f.status(ID)).json();assert.equal(unverified.artworkStatus,'not_verifiable');assert.equal(unverified.deliveryVerified,false);assert.equal(unverified.deliveryPending,false);
  assert.equal((await(await delivery()).json()).artworkStatus,'not_verifiable');
  f.svc.store.db.prepare("UPDATE jobs SET state='failed' WHERE id=?").run(job.id);
  const failed=await(await f.status(ID)).json();assert.equal(failed.artworkStatus,'failed');assert.equal(failed.deliveryFailed,true);assert.equal(failed.deliveryPending,false);
  const failedStatus=await(await delivery()).json();assert.equal(failedStatus.artworkStatus,'failed');assert.equal(failedStatus.deliveryFailed,true);
 }finally{release();await f.close();}
});

test('no-artwork callback, ambiguous timeout and manual-review recovery never cause duplicate dispatch',async()=>{
 const sent=[];let fail=false;const f=await fixture(async(_url,opt)=>{const p=JSON.parse(opt.body);sent.push(p);if(fail)throw Error('Ambiguous timeout');return ack(p);});
 try{
  const body={testOrderId:ID,artworkJobId:'',fields:fields('')};assert.equal((await f.submit(body)).status,202);
  await until(()=>f.svc.store.db.prepare('SELECT state FROM test_submissions WHERE id=?').get(ID).state==='processing');
  assert.equal(sent[0]['Artwork Reference'],undefined);const hash=sent[0]['Request Fingerprint'],route='/internal/test-submissions/'+ID+'/outcome';
  assert.equal((await f.trusted(route,outcome(ID,hash,'complete',{artwork_status:'not_supplied'}),'wrong')).status,401);
  assert.equal((await f.trusted(route,outcome(ID,'f'.repeat(64),'complete',{artwork_status:'not_supplied'}))).status,409);
  assert.equal((await f.trusted(route,outcome(ID,hash,'complete',{artwork_status:'bound'}))).status,409);
  assert.equal((await f.trusted(route,outcome(ID,hash,'complete',{artwork_status:'not_supplied'}))).status,200);
  assert.equal((await(await f.status(ID)).json()).state,'complete');
  fail=true;const second='e6f90e2f-6a80-4ac0-bb4e-258295f09802',body2={...body,testOrderId:second};
  assert.equal((await f.submit(body2)).status,202);
  await until(()=>f.svc.store.db.prepare('SELECT state FROM test_submissions WHERE id=?').get(second).state==='unknown');
  const attempts=sent.length;assert.equal((await f.submit(body2)).status,409);await pause(110);assert.equal(sent.length,attempts);
  assert.equal((await(await f.status(second)).json()).outcomeUncertain,true);
  const hash2=sent.at(-1)['Request Fingerprint'];
  assert.equal((await f.trusted('/internal/test-submissions/'+second+'/outcome',outcome(second,hash2,'complete',{artwork_status:'not_supplied'}))).status,200);
  assert.equal((await(await f.status(second)).json()).state,'complete');
  fail=false;const third='f6f90e2f-6a80-4ac0-bb4e-258295f09802';assert.equal((await f.submit({...body,testOrderId:third})).status,202);
  await until(()=>f.svc.store.db.prepare('SELECT state FROM test_submissions WHERE id=?').get(third).state==='processing');
  const hash3=sent.at(-1)['Request Fingerprint'],route3='/internal/test-submissions/'+third+'/outcome';
  const review=outcome(third,hash3,'manual_review',{stage:'customer_email_uncertain'});
  assert.equal((await f.trusted(route3,review)).status,200);assert.equal((await f.trusted(route3,review)).status,200);
  assert.equal((await f.trusted(route3,{...review,stage:'staff_email_uncertain'})).status,409);
  assert.equal((await(await f.status(third)).json()).state,'manual_review');
  assert.equal((await f.trusted(route3,outcome(third,hash3,'complete',{artwork_status:'not_supplied'}))).status,200);
  assert.equal((await(await f.status(third)).json()).state,'complete');
 }finally{await f.close();}
});

test('intake preserves synthetic shipping, artist, two-LP, quote and price guards; staff sees pending and uncertain ages',async()=>{
 const sent=[];const f=await fixture(async(_url,opt)=>{const payload=JSON.parse(opt.body);sent.push(payload);return ack(payload);});
 try{
  const base=fields(''),cases=[
   {id:'e6f90e2f-6a80-4ac0-bb4e-258295f09802',fields:{...base,'Shipping Required':'on','Estimated Price Given':'185.00','Street Address':'1 TEST ONLY LANE',Suburb:'TESTVILLE',Postcode:'0000',State:'NSW'},check:p=>{
    assert.equal(p['Delivery Method'],'Shipping');assert.deepEqual([p['Street Address'],p.Suburb,p.Postcode,p.State],['1 TEST ONLY LANE','TESTVILLE','0000','NSW']);}},
   {id:'f6f90e2f-6a80-4ac0-bb4e-258295f09802',fields:{...base,'Estimated Price Given':'',Tracklist:'FORMAT: 3xLP | 3 discs | 6 sides (A-F) | 12in | 33 RPM\nEXTRAS: Printed Jacket + Labels\n\nSynthetic long project'},check:p=>assert.equal(p['Estimated Price Given'],'')},
   {id:'86f90e2f-6a80-4ac0-bb4e-258295f09802',fields:{...base,'Artist Order':'Yes','Estimated Price Given':'83.10'},check:p=>assert.equal(p['Estimated Price Given'],'83.10')},
   {id:'96f90e2f-6a80-4ac0-bb4e-258295f09802',fields:{...base,'Estimated Price Given':'285.00',Tracklist:'FORMAT: 2xLP | 2 discs | 4 sides (A-D) | 12in | 33 RPM\nEXTRAS: Printed Jacket + Labels\n\nSynthetic two-LP project'},check:p=>assert.equal(p['Estimated Price Given'],'285.00')}
  ];
  for(let i=0;i<cases.length;i++){
   const item=cases[i];assert.equal((await f.submit({testOrderId:item.id,artworkJobId:'',fields:item.fields})).status,202);
   await until(()=>sent.length===i+1);item.check(sent[i]);assert.equal(sent[i]['Artwork Reference'],undefined);
  }
  assert.equal((await f.submit({testOrderId:'76f90e2f-6a80-4ac0-bb4e-258295f09802',artworkJobId:'',fields:{...base,'Side A Length':'FATHERS DAY SPECIAL','Estimated Price Given':'120.00'}})).status,422);
  assert.equal((await f.submit({testOrderId:'a6f90e2f-6a80-4ac0-bb4e-258295f09803',artworkJobId:'',fields:{...cases[3].fields,'Estimated Price Given':'165.00'}})).status,422);
  const staff={Authorization:'Bearer '+f.config.staffSecret};
  const get=(suffix='',headers=staff)=>fetch(f.base+'/internal/test-submissions'+suffix,{headers});
  assert.equal((await get('',{})).status,401);
  assert.equal((await get('',{Authorization:'Bearer '+f.config.bindSecret})).status,401);
  assert.equal((await get('',{Authorization:'é'.repeat(('Bearer '+f.config.staffSecret).length)})).status,401);
  await until(()=>f.svc.store.db.prepare("SELECT count(*) AS n FROM test_submissions WHERE state='processing'").get().n===4);
  const processing=await(await get('?state=processing')).json();assert.equal(processing.items.length,4);
  assert.equal(processing.items.every(item=>Number.isInteger(item.updatedAt)&&!('requestFingerprint' in item)),true);
  const first=processing.items[0];const detail=await(await get('/'+first.testOrderId)).json();
  assert.equal(detail.needsReconciliation,false);assert.equal(detail.airtableRecordId,RECORD);
  const callbackRoute='/internal/test-submissions/'+first.testOrderId+'/outcome';
  const review=outcome(first.testOrderId,detail.requestFingerprint,'manual_review',{stage:'staff_email_uncertain'});
  assert.equal((await f.trusted(callbackRoute,review)).status,200);
  const uncertain=await(await get()).json();assert.deepEqual(uncertain.items.map(item=>item.testOrderId),[first.testOrderId]);
  assert.equal((await(await get('/'+first.testOrderId)).json()).reviewStage,'staff_email_uncertain');
  assert.equal((await(await get('?limit=1')).json()).nextOffset,null);
  for(const query of ['?limit=101','?limit=0','?offset=-1','?state=all'])assert.equal((await get(query)).status,422);
  assert.equal((await get('/invalid')).status,422);
  assert.equal((await get('/36f90e2f-6a80-4ac0-bb4e-258295f09802')).status,404);
  const serialized=JSON.stringify({uncertain,detail});
  assert(!serialized.includes(f.config.testWebhookUrl)&&!serialized.includes(f.config.testRecipient));
  assert.equal((await fetch(f.base+'/internal/test-submissions/'+first.testOrderId,{method:'POST',headers:staff})).status,404);
  f.config.testMakeApiKey='';assert.equal((await get()).status,200,'staff view remains available while intake is closed');
  assert.equal((await fetch(f.base+'/v1/test-config',{headers:{Authorization:'Basic '+Buffer.from('tester:test-access-only').toString('base64')}})).status,503);
  assert.equal((await f.submit({testOrderId:ID,artworkJobId:'',fields:base})).status,503);
  f.config.testLabel='';assert.equal((await get()).status,503);
 }finally{await f.close();}
});

test('invalid webhook configuration cannot dispatch a queued row during startup',async()=>{
 let sent=0;const f=await fixture(async()=>{sent++;throw Error('Forbidden dispatch');});
 try{
  f.config.testWebhookUrl='https://attacker.invalid/collect';
  const now=Date.now();f.svc.store.db.prepare("INSERT INTO test_submissions(id,created,reference_id,state,request_hash,browser_hash,payload,updated) VALUES(?,?,?,'queued',?,?,?,?)")
   .run(ID,now,'','f'.repeat(64),'browser',JSON.stringify(fields('')),now);
  await pause(150);assert.equal(sent,0);
  assert.equal(f.svc.store.db.prepare('SELECT state FROM test_submissions WHERE id=?').get(ID).state,'queued');
  assert.equal((await f.submit({testOrderId:'e6f90e2f-6a80-4ac0-bb4e-258295f09802',artworkJobId:'',fields:fields('')})).status,503);
 }finally{await f.close();}
});

test('restart quarantines dispatching submissions from the old schema',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'customs-interrupted-order-'));
 const db=new DatabaseSync(path.join(dir,'jobs.sqlite'));
 db.exec("CREATE TABLE test_submissions (id TEXT PRIMARY KEY, created INTEGER NOT NULL, reference_id TEXT NOT NULL, state TEXT NOT NULL, response TEXT)");
 db.prepare("INSERT INTO test_submissions(id,created,reference_id,state) VALUES(?,?,?,'dispatching')").run(ID,Date.now(),'');db.close();
 const svc=makeApp({bindSecret:'b'.repeat(40),dataDir:dir,origins:[],mode:'disabled'});
 try{assert.equal(svc.store.db.prepare('SELECT state FROM test_submissions').get().state,'unknown');}
 finally{await svc.close();fs.rmSync(dir,{recursive:true,force:true});}
});
