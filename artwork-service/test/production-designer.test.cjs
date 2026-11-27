'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {makeApp}=require('../src/server.cjs');

test('production serves the versioned designer without exposing the JOSH TEST form or copy',async()=>{
 execFileSync(process.execPath,['build-public.cjs'],{cwd:path.resolve(__dirname,'..')});
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'customs-production-designer-'));
 const service=makeApp({dataDir:root,bindSecret:'production-route-test-secret'.repeat(2),origins:['https://crosstalkrecords.github.io'],mode:'synthetic',testDestination:path.join(root,'unused'),dropboxRoot:'/Crosstalk Customs/Orders'},{worker:{interval:999999}});
 const server=service.app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  const designer=await fetch(base+'/designer.html'),html=await designer.text();
  assert.equal(designer.status,200);
  assert.match(html,/approved-spacing-v2/);
  assert.match(html,/Packaging Designer/);
  assert.doesNotMatch(html,/JOSH TEST|submit the test|testPreview'\)==='1'/);
  assert.equal((await fetch(base+'/designer-production.html')).status,404);
  assert.equal((await fetch(base+'/calculator-preview.html')).status,503);
 }finally{await new Promise(resolve=>server.close(resolve));await service.close();await fs.rm(root,{recursive:true,force:true})}
});
