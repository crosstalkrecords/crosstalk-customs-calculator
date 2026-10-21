'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {makeApp}=require('../src/server.cjs');
test('JOSH TEST probe is private, fixed-root, delivery-disabled-safe, and reuses one archive',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'josh-test-probe-'));let renders=0,deliveries=0;
 const config={dataDir:dir,bindSecret:'fake-binding-'.repeat(4),setupSecret:'fake-setup-'.repeat(4),origins:['https://test.example'],mode:'disabled',testLabel:'JOSH TEST',dropboxRoot:'/Crosstalk Customs/JOSH TEST',refreshToken:'fake'};
 const service=makeApp(config,{worker:{interval:999999},testDelivery:{prepareFolders:async()=>{},render:async dir=>{renders++;await fs.mkdir(path.join(dir,'output'),{recursive:true});await fs.writeFile(path.join(dir,'output/front.psd'),'test-only');},delivery:async({config:c,binding})=>{deliveries++;assert.equal(c.mode,'dropbox');assert.equal(binding.folder,'/Crosstalk Customs/JOSH TEST/JOSH TEST/Uploads');return {verified:true,bytes:123,contentHash:'test-only',dropboxFileId:'same-file'};}}});
 const server=service.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const url='http://127.0.0.1:'+server.address().port+'/internal/dropbox/test-delivery';
 try{
  assert.equal((await fetch(url,{method:'POST'})).status,401);
  const headers={Authorization:'Bearer '+config.setupSecret};
  const first=await(await fetch(url,{method:'POST',headers})).json();assert.equal(first.state,'delivered');
  const second=await(await fetch(url,{method:'POST',headers})).json();assert.equal(second.id,first.id);assert.equal(renders,1);assert.equal(deliveries,2);assert.equal(config.mode,'disabled');
  const status=await(await fetch(url,{headers})).json();assert.equal(status.receipt.verified,true);
  config.dropboxRoot='/Crosstalk Customs/Orders';assert.equal((await fetch(url,{method:'POST',headers})).status,409);assert.equal(deliveries,2);
 }finally{await new Promise(r=>server.close(r));await service.close();await fs.rm(dir,{recursive:true,force:true});}
});
