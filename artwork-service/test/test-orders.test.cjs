'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const {makeApp}=require('../src/server.cjs');
test('test-only order intake maps bounded Customs fields and rejects real identity or address',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'customs-test-orders-'));
 // An existing JOSH TEST volume has the prior table schema. The new mapping
 // must add its fingerprint column without losing previous submissions.
 const legacy=new DatabaseSync(path.join(dir,'jobs.sqlite'));
 legacy.exec('CREATE TABLE test_submissions (id TEXT PRIMARY KEY, created INTEGER NOT NULL, reference_id TEXT NOT NULL, state TEXT NOT NULL, response TEXT)');
 legacy.close();
 const sent=[];let failNext=false;
 const config={bindSecret:'b'.repeat(40),dataDir:dir,origins:[],publicOrigin:'',mode:'dropbox',dropboxRoot:'/Crosstalk Customs/JOSH TEST',testLabel:'JOSH TEST',testRecipient:'delousedcomatorium@gmail.com',testWebhookUrl:'https://hook.eu1.make.com/josh-test',testMakeApiKey:'synthetic-make-api-key',testAccessCode:'test-access-only',refreshToken:'test-refresh',clientId:'test-client',clientSecret:'test-secret'};
 const service=makeApp(config,{testOrders:{fetchImpl:async(url,options)=>{const payload=JSON.parse(options.body);sent.push({url,payload,headers:options.headers});if(failNext)throw Error('Ambiguous Make timeout');return {ok:true,json:async()=>({testLabel:'JOSH TEST',artwork_status:payload['Artwork Reference']?'bound':'not_supplied'})}}}});
 assert(service.store.db.prepare('PRAGMA table_info(test_submissions)').all().some(column=>column.name==='request_hash'));
 const server=service.app.listen(0,'127.0.0.1');
 try{
  await new Promise(resolve=>server.once('listening',resolve));
  const base='http://127.0.0.1:'+server.address().port;config.publicOrigin=base;config.origins.push(base);
  const auth='Basic '+Buffer.from('tester:test-access-only').toString('base64');
  const preview=await fetch(base+'/calculator-preview.html');assert.equal(preview.status,401);
  assert.equal((await fetch(base+'/%63alculator-preview.html')).status,401,'encoded preview path remains gated');
  assert.equal((await fetch(base+'/%64esigner.html')).status,401,'encoded designer path remains gated');
  const granted=await fetch(base+'/calculator-preview.html',{headers:{Authorization:auth}});assert.equal(granted.status,200);assert.equal(granted.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
  assert.equal(granted.headers.get('cache-control'),'private, no-store');
  assert.equal(granted.headers.get('x-frame-options'),'DENY');
  assert.equal(granted.headers.get('content-security-policy'),"frame-ancestors 'none'");
  const cookie=granted.headers.get('set-cookie')?.split(';')[0];
  assert.match(cookie,/^crosstalk_josh_session=/);
  assert.match(granted.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  const sameBrowser=await fetch(base+'/calculator-preview.html',{headers:{Authorization:auth,Cookie:cookie}});
  assert.equal(sameBrowser.status,200);assert.equal(sameBrowser.headers.get('set-cookie'),null,'a refresh keeps the same browser session');
  const encodedGranted=await fetch(base+'/%63alculator-preview.html',{headers:{Authorization:auth}});
  assert.equal(encodedGranted.status,200);assert.equal(encodedGranted.headers.get('cache-control'),'private, no-store');
  const id='d6f90e2f-6a80-4ac0-bb4e-258295f09802';
  const created=await fetch(base+'/v1/drafts',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({testOrderId:id})});
  assert.equal(created.status,201);
  const draft=await created.json(),reference=draft.id+'.'+draft.token;
  assert.equal((await fetch(base+'/v1/drafts/'+draft.id,{headers:{Authorization:'Bearer '+draft.token,Origin:base}})).status,404,'bearer alone cannot read a test draft');
  assert.equal((await fetch(base+'/v1/drafts/'+draft.id,{headers:{Authorization:'Bearer '+draft.token,Origin:base,Cookie:cookie}})).status,200);
  service.store.db.prepare("UPDATE jobs SET state='ready' WHERE id=?").run(draft.id);
  const fields={
   'Artist Order':'No','Customer Name':'TEST JOSH 21.11',
   Email:'delousedcomatorium@gmail.com','Custom Field 1':'0400000000',
   'Estimated Price Given':'165.00',Extras:'Printed Jacket + Labels',
   Packaging:'Printed Jacket + Labels',Postcode:'',Quantity:'1',
   'Record Size':'12',Rush:'off','Shipping Required':'off',
   'Side A Length':'','Side B Length':'',Sides:'Double',Speed:'33 RPM',
   State:'','Street Address':'',Suburb:'',Tracklist:'FORMAT: 1xLP | 1 disc | 2 sides (A-B) | 12in | 33 RPM\nEXTRAS: Printed Jacket + Labels\n\nSynthetic test only',
   'Vinyl Colour':'Clear','Artwork Reference':reference
  };
  const body={testOrderId:id,artworkReference:reference,fields};
  const submit=(value,headers={})=>fetch(base+'/v1/test-orders',{method:'POST',headers:{Authorization:auth,Origin:base,Cookie:cookie,'Content-Type':'application/json',...headers},body:JSON.stringify(value)});
  assert.equal((await submit(body,{Origin:'https://elsewhere.invalid'})).status,403);
  assert.equal((await submit({...body,fields:{...body.fields,Email:'real-customer@example.com'}})).status,422);
  assert.equal((await submit({...body,fields:{...fields,'Street Address':'REAL ADDRESS'}})).status,422);
  assert.equal((await submit({...body,fields:{...fields,'Artwork Reference':'different'}})).status,422);
  assert.equal((await submit({...body,fields:{...fields,'Estimated Price Given':'1.00'}})).status,422);
  assert.equal((await submit({...body,fields:{...fields,Extras:'Custom Finish Pack'}})).status,422);
  assert.equal((await submit({...body,fields:{...fields,'Side A Length':'made-up promotion'}})).status,422);
  assert.equal((await submit(body,{Cookie:''})).status,403,'an artwork capability alone cannot submit an order');
  const other=await fetch(base+'/calculator-preview.html',{headers:{Authorization:auth}});
  const otherCookie=other.headers.get('set-cookie')?.split(';')[0];
  assert.equal((await fetch(base+'/v1/drafts/'+draft.id,{headers:{Authorization:'Bearer '+draft.token,Origin:base,Cookie:otherCookie}})).status,404);
  assert.equal((await submit(body,{Cookie:otherCookie})).status,422,'a different browser session cannot attach this artwork');
  const otherId='16f90e2f-6a80-4ac0-bb4e-258295f09802';
  assert.equal((await submit({...body,testOrderId:otherId},{Cookie:cookie})).status,422,'a different order session cannot attach this artwork');
  assert.equal((await submit({...body,artworkReference:draft.id+'.'+'B'.repeat(43),fields:{...fields,'Artwork Reference':draft.id+'.'+'B'.repeat(43)}})).status,422,'a forged artwork bearer cannot attach this draft');
  assert.equal((await submit({...body,fields:{...fields,'Request Fingerprint':'browser-forged'}})).status,422);
  assert.equal((await submit({...body,fields:{...fields,'Unknown Field':'surprise'}})).status,422);
  assert.equal((await submit({...body,fields:{...fields,Tracklist:'<script>alert(1)</script>'}})).status,422);
  assert.equal((await submit(body)).status,202);
  service.store.db.prepare("UPDATE jobs SET state='delivered' WHERE id=?").run(draft.id);
  assert.equal((await submit(body)).status,200);
  assert.equal(sent.length,1);
  assert.equal(sent[0].headers['x-make-apikey'],config.testMakeApiKey);
  assert.equal(sent[0].payload.Email,'delousedcomatorium@gmail.com');
  assert.equal(sent[0].payload['Test Order Name'],'TEST JOSH 21.11');
  assert.equal(sent[0].payload['Customer Name'],'TEST JOSH 21.11');
  assert.equal(sent[0].payload['Record Size'],'12');
  assert.equal(sent[0].payload['Estimated Price Given'],'165.00');
  assert.match(sent[0].payload['Test Summary'],/Do not invoice/);
  assert.equal(sent[0].payload['Tracklist'],fields.Tracklist);
  assert.equal(sent[0].payload['Submission ID'],id);
  assert.equal(sent[0].payload['Artwork Job ID'],draft.id);
  const metadata=new Set(['testLabel','Artwork Reference','Submission ID','Request Fingerprint','Artwork Job ID','Test Order Name','Test Order ID','Test Summary']);
  const mapped=Object.fromEntries(Object.entries(sent[0].payload).filter(([key])=>!metadata.has(key)));
  const expectedHash=crypto.createHash('sha256').update(JSON.stringify({mapped,reference})).digest('hex');
  assert.equal(sent[0].payload['Request Fingerprint'],expectedHash);
  assert.equal(service.store.db.prepare('SELECT request_hash FROM test_submissions WHERE id=?').get(id).request_hash,expectedHash);
  assert.equal(sent[0].payload['Delivery Method'],'Pickup');
  assert.equal(sent[0].payload['Street Address'],'');
  assert.equal((await submit({...body,fields:{...fields,Tracklist:fields.Tracklist+'\nAnother synthetic track'}})).status,409);
  assert.equal(service.store.db.prepare('SELECT request_hash FROM test_submissions WHERE id=?').get(id).request_hash,expectedHash);
  assert.equal((await submit({...body,artworkReference:'',fields:{...fields,'Artwork Reference':''}})).status,409);
  const shippingId='e6f90e2f-6a80-4ac0-bb4e-258295f09802';
  const shippingFields={...fields,'Shipping Required':'on','Estimated Price Given':'185.00',
   'Street Address':'1 TEST ONLY LANE',Suburb:'TESTVILLE',Postcode:'0000',State:'NSW',
   'Artwork Reference':''};
  assert.equal((await submit({testOrderId:shippingId,artworkReference:'',fields:shippingFields})).status,202);
  assert.equal(sent.length,2);
  assert.equal(sent[1].payload['Delivery Method'],'Shipping');
  assert.equal(sent[1].payload['Street Address'],'1 TEST ONLY LANE');
  assert.equal(sent[1].payload.Suburb,'TESTVILLE');
  assert.equal(sent[1].payload.Postcode,'0000');
  assert.equal(sent[1].payload.State,'NSW');
  assert.equal(sent[1].payload['Artwork Reference'],'');
  const quoteId='f6f90e2f-6a80-4ac0-bb4e-258295f09802';
  const quoteFields={...fields,'Artwork Reference':'','Estimated Price Given':'',
   Tracklist:'FORMAT: 3xLP | 3 discs | 6 sides (A-F) | 12in | 33 RPM\nEXTRAS: Printed Jacket + Labels\n\nSynthetic long project'};
  assert.equal((await submit({testOrderId:quoteId,artworkReference:'',fields:quoteFields})).status,202);
  assert.equal(sent.at(-1).payload['Estimated Price Given'],'','a three-LP build stays quote-only');
  const promoId='76f90e2f-6a80-4ac0-bb4e-258295f09802';
  const promoFields={...fields,'Artwork Reference':'','Estimated Price Given':'120.00',
   'Side A Length':'FATHERS DAY SPECIAL - 1x CLEAR 12IN + PRINTED JACKET + LABELS'};
  assert.equal((await submit({testOrderId:promoId,artworkReference:'',fields:promoFields})).status,202);
  assert.equal(sent.at(-1).payload['Estimated Price Given'],'120.00');
  const artistId='86f90e2f-6a80-4ac0-bb4e-258295f09802';
  const artistFields={...fields,'Artwork Reference':'','Artist Order':'Yes','Estimated Price Given':'83.10',
   Tracklist:'FORMAT: 1xLP | 1 disc | 2 sides (A-B) | 12in | 33 RPM\nEXTRAS: Printed Jacket + Labels\n\nSynthetic artist track'};
  assert.equal((await submit({testOrderId:artistId,artworkReference:'',fields:artistFields})).status,202);
  assert.equal(sent.at(-1).payload['Estimated Price Given'],'83.10');
  const doubleId='96f90e2f-6a80-4ac0-bb4e-258295f09802';
  const doubleFields={...fields,'Artwork Reference':'','Estimated Price Given':'285.00',
   Tracklist:'FORMAT: 2xLP | 2 discs | 4 sides (A-D) | 12in | 33 RPM\nEXTRAS: Printed Jacket + Labels\n\nSynthetic two-LP project'};
  assert.equal((await submit({testOrderId:doubleId,artworkReference:'',fields:doubleFields})).status,202);
  assert.equal(sent.at(-1).payload['Estimated Price Given'],'285.00');
  assert.equal((await submit({testOrderId:'a6f90e2f-6a80-4ac0-bb4e-258295f09803',artworkReference:'',fields:{...doubleFields,'Estimated Price Given':'165.00'}})).status,422);
  failNext=true;
  const uncertainId='b6f90e2f-6a80-4ac0-bb4e-258295f09802';
  const uncertainBody={testOrderId:uncertainId,artworkReference:'',fields:shippingFields};
  const uncertain=await submit(uncertainBody);
  assert.equal(uncertain.status,502);
  assert.deepEqual(await uncertain.json(),{
   error:'Test submission could not be confirmed. Keep this page open and ask Crosstalk to check the test order ID.',
   testOrderId:uncertainId,outcomeUncertain:true
  });
  assert.equal(service.store.db.prepare('SELECT state FROM test_submissions WHERE id=?').get(uncertainId).state,'unknown');
  const attempts=sent.length;
  const retry=await submit(uncertainBody);
  assert.equal(retry.status,409);
  assert.equal((await retry.json()).outcomeUncertain,true);
  assert.equal(sent.length,attempts,'an unknown Make outcome must not be posted twice');
  config.testMakeApiKey='';assert.equal((await fetch(base+'/v1/test-config',{headers:{Authorization:auth}})).status,503);
  assert.equal((await submit({...body,testOrderId:'a6f90e2f-6a80-4ac0-bb4e-258295f09802'})).status,503);
  config.testMakeApiKey='synthetic-make-api-key';
  config.mode='disabled';assert.equal((await submit({...body,testOrderId:'e6f90e2f-6a80-4ac0-bb4e-258295f09802'})).status,503);
  config.testAccessCode='';
  assert.equal((await fetch(base+'/calculator-preview.html')).status,503);
  assert.equal((await fetch(base+'/designer.html')).status,503);
 }finally{await new Promise(resolve=>server.close(resolve));await service.close();fs.rmSync(dir,{recursive:true,force:true});}
});

test('a process restart marks interrupted test submissions as unknown',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'customs-interrupted-order-'));
 const db=new DatabaseSync(path.join(dir,'jobs.sqlite'));
 db.exec("CREATE TABLE test_submissions (id TEXT PRIMARY KEY, created INTEGER NOT NULL, reference_id TEXT NOT NULL, state TEXT NOT NULL, response TEXT)");
 db.prepare("INSERT INTO test_submissions(id,created,reference_id,state) VALUES(?,?,?,'sending')").run('c6f90e2f-6a80-4ac0-bb4e-258295f09802',Date.now(),'');
 db.close();
 const config={bindSecret:'b'.repeat(40),dataDir:dir,origins:[],mode:'disabled'};
 const service=makeApp(config);
 try{
  assert.equal(service.store.db.prepare('SELECT state FROM test_submissions').get().state,'unknown');
 }finally{await service.close();fs.rmSync(dir,{recursive:true,force:true});}
});
