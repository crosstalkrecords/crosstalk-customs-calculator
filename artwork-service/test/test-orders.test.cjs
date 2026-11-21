'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {makeApp}=require('../src/server.cjs');
test('test-only order intake is gated, bounded, idempotent and never forwards customer fields',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'customs-test-orders-'));
 const sent=[],config={bindSecret:'b'.repeat(40),dataDir:dir,origins:[],publicOrigin:'',mode:'dropbox',dropboxRoot:'/Crosstalk Customs/JOSH TEST',testLabel:'JOSH TEST',testRecipient:'delousedcomatorium@gmail.com',testWebhookUrl:'https://hook.eu1.make.com/josh-test',testAccessCode:'test-access-only',refreshToken:'test-refresh',clientId:'test-client',clientSecret:'test-secret'};
 const service=makeApp(config,{testOrders:{fetchImpl:async(url,options)=>{sent.push({url,payload:JSON.parse(options.body)});return {ok:true,json:async()=>({testLabel:'JOSH TEST',artwork_status:'bound'})}}}});
 const server=service.app.listen(0,'127.0.0.1');
 try{
  await new Promise(resolve=>server.once('listening',resolve));
  const base='http://127.0.0.1:'+server.address().port;config.publicOrigin=base;config.origins.push(base);
  const auth='Basic '+Buffer.from('tester:test-access-only').toString('base64');
  const preview=await fetch(base+'/calculator-preview.html');assert.equal(preview.status,401);
  const granted=await fetch(base+'/calculator-preview.html',{headers:{Authorization:auth}});assert.equal(granted.status,200);assert.equal(granted.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
  const id='d6f90e2f-6a80-4ac0-bb4e-258295f09802',reference='a'.repeat(32)+'.'+'B'.repeat(43);
  const body={testOrderId:id,artworkReference:reference,fields:{'Customer Name':'TEST JOSH 21.11',Email:'delousedcomatorium@gmail.com','Custom Field 1':'0400000000','Packaging':'Printed Jacket + Labels','Tracklist':'Synthetic test only','Street Address':'NEVER FORWARD'}};
  const submit=(value,headers={})=>fetch(base+'/v1/test-orders',{method:'POST',headers:{Authorization:auth,Origin:base,'Content-Type':'application/json',...headers},body:JSON.stringify(value)});
  assert.equal((await submit(body,{Origin:'https://elsewhere.invalid'})).status,403);
  assert.equal((await submit({...body,fields:{...body.fields,Email:'real-customer@example.com'}})).status,422);
  assert.equal((await submit(body)).status,202);
  assert.equal((await submit(body)).status,200);
  assert.equal(sent.length,1);
  assert.equal(sent[0].payload.Email,'delousedcomatorium@gmail.com');
  assert.equal(sent[0].payload['Test Order Name'],'TEST JOSH 21.11');
  assert.equal(sent[0].payload['Street Address'],undefined);
  assert.equal((await submit({...body,artworkReference:''})).status,409);
  config.mode='disabled';assert.equal((await submit({...body,testOrderId:'e6f90e2f-6a80-4ac0-bb4e-258295f09802'})).status,503);
 }finally{await new Promise(resolve=>server.close(resolve));await service.close();fs.rmSync(dir,{recursive:true,force:true});}
});
