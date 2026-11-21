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
 const sent=[],config={bindSecret:'b'.repeat(40),dataDir:dir,origins:[],publicOrigin:'',mode:'dropbox',dropboxRoot:'/Crosstalk Customs/JOSH TEST',testLabel:'JOSH TEST',testRecipient:'delousedcomatorium@gmail.com',testWebhookUrl:'https://hook.eu1.make.com/josh-test',testMakeApiKey:'synthetic-make-api-key',testAccessCode:'test-access-only',refreshToken:'test-refresh',clientId:'test-client',clientSecret:'test-secret'};
 const service=makeApp(config,{testOrders:{fetchImpl:async(url,options)=>{const payload=JSON.parse(options.body);sent.push({url,payload,headers:options.headers});return {ok:true,json:async()=>({testLabel:'JOSH TEST',artwork_status:payload['Artwork Reference']?'bound':'not_supplied'})}}}});
 assert(service.store.db.prepare('PRAGMA table_info(test_submissions)').all().some(column=>column.name==='request_hash'));
 const server=service.app.listen(0,'127.0.0.1');
 try{
  await new Promise(resolve=>server.once('listening',resolve));
  const base='http://127.0.0.1:'+server.address().port;config.publicOrigin=base;config.origins.push(base);
  const auth='Basic '+Buffer.from('tester:test-access-only').toString('base64');
  const preview=await fetch(base+'/calculator-preview.html');assert.equal(preview.status,401);
  const granted=await fetch(base+'/calculator-preview.html',{headers:{Authorization:auth}});assert.equal(granted.status,200);assert.equal(granted.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
  const id='d6f90e2f-6a80-4ac0-bb4e-258295f09802',reference='a'.repeat(32)+'.'+'B'.repeat(43);
  const fields={
   'Artist Order':'No','Customer Name':'TEST JOSH 21.11',
   Email:'delousedcomatorium@gmail.com','Custom Field 1':'0400000000',
   'Estimated Price Given':'165.00',Extras:'Printed Jacket + Labels',
   Packaging:'Printed Jacket + Labels',Postcode:'',Quantity:'1',
   'Record Size':'12',Rush:'off','Shipping Required':'off',
   'Side A Length':'','Side B Length':'',Sides:'Double',Speed:'33 RPM',
   State:'','Street Address':'',Suburb:'',Tracklist:'Synthetic test only',
   'Vinyl Colour':'Clear','Artwork Reference':reference
  };
  const body={testOrderId:id,artworkReference:reference,fields};
  const submit=(value,headers={})=>fetch(base+'/v1/test-orders',{method:'POST',headers:{Authorization:auth,Origin:base,'Content-Type':'application/json',...headers},body:JSON.stringify(value)});
  assert.equal((await submit(body,{Origin:'https://elsewhere.invalid'})).status,403);
  assert.equal((await submit({...body,fields:{...body.fields,Email:'real-customer@example.com'}})).status,422);
  assert.equal((await submit({...body,fields:{...fields,'Street Address':'REAL ADDRESS'}})).status,422);
  assert.equal((await submit({...body,fields:{...fields,'Artwork Reference':'different'}})).status,422);
  assert.equal((await submit({...body,fields:{...fields,'Request Fingerprint':'browser-forged'}})).status,422);
  assert.equal((await submit({...body,fields:{...fields,'Unknown Field':'surprise'}})).status,422);
  assert.equal((await submit({...body,fields:{...fields,Tracklist:'<script>alert(1)</script>'}})).status,422);
  assert.equal((await submit(body)).status,202);
  assert.equal((await submit(body)).status,200);
  assert.equal(sent.length,1);
  assert.equal(sent[0].headers['x-make-apikey'],config.testMakeApiKey);
  assert.equal(sent[0].payload.Email,'delousedcomatorium@gmail.com');
  assert.equal(sent[0].payload['Test Order Name'],'TEST JOSH 21.11');
  assert.equal(sent[0].payload['Customer Name'],'TEST JOSH 21.11');
  assert.equal(sent[0].payload['Record Size'],'12');
  assert.equal(sent[0].payload['Estimated Price Given'],'165.00');
  assert.equal(sent[0].payload['Tracklist'],'Synthetic test only');
  assert.equal(sent[0].payload['Submission ID'],id);
  assert.equal(sent[0].payload['Artwork Job ID'],'a'.repeat(32));
  const metadata=new Set(['testLabel','Artwork Reference','Submission ID','Request Fingerprint','Artwork Job ID','Test Order Name','Test Order ID','Test Summary']);
  const mapped=Object.fromEntries(Object.entries(sent[0].payload).filter(([key])=>!metadata.has(key)));
  const expectedHash=crypto.createHash('sha256').update(JSON.stringify({mapped,reference})).digest('hex');
  assert.equal(sent[0].payload['Request Fingerprint'],expectedHash);
  assert.equal(service.store.db.prepare('SELECT request_hash FROM test_submissions WHERE id=?').get(id).request_hash,expectedHash);
  assert.equal(sent[0].payload['Delivery Method'],'Pickup');
  assert.equal(sent[0].payload['Street Address'],'');
  assert.equal((await submit({...body,fields:{...fields,Tracklist:'different test track'}})).status,409);
  assert.equal(service.store.db.prepare('SELECT request_hash FROM test_submissions WHERE id=?').get(id).request_hash,expectedHash);
  assert.equal((await submit({...body,artworkReference:'',fields:{...fields,'Artwork Reference':''}})).status,409);
  const shippingId='e6f90e2f-6a80-4ac0-bb4e-258295f09802';
  const shippingFields={...fields,'Shipping Required':'on',
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
  config.testMakeApiKey='';assert.equal((await fetch(base+'/v1/test-config',{headers:{Authorization:auth}})).status,503);
  assert.equal((await submit({...body,testOrderId:'a6f90e2f-6a80-4ac0-bb4e-258295f09802'})).status,503);
  config.testMakeApiKey='synthetic-make-api-key';
  config.mode='disabled';assert.equal((await submit({...body,testOrderId:'e6f90e2f-6a80-4ac0-bb4e-258295f09802'})).status,503);
 }finally{await new Promise(resolve=>server.close(resolve));await service.close();fs.rmSync(dir,{recursive:true,force:true});}
});
