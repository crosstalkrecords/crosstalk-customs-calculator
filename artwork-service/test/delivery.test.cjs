'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {deliver}=require('../src/delivery.cjs');
test('Dropbox sessions preserve bytes, Unicode destination and JOSH TEST name',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'artwork-delivery-')),archive=path.join(dir,'test.zip');
 const payload=Buffer.alloc(8*1024*1024+123,42);await fs.writeFile(archive,payload);
 const original=global.fetch,parts=[],commits=[];
 global.fetch=async(url,options)=>{
  if(url.endsWith('/token'))return {ok:true,json:async()=>({access_token:'fake-only'})};
  const raw=options.headers['Dropbox-API-Arg'];assert(!/[^\x20-\x7e]/.test(raw));const arg=JSON.parse(raw);
  if(url.endsWith('/start'))return {ok:true,json:async()=>({session_id:'fake-session'})};
  assert.equal(arg.cursor.offset,parts.reduce((n,b)=>n+b.length,0));
  if(url.endsWith('/append_v2'))parts.push(Buffer.from(options.body));else commits.push(arg.commit);
  return {ok:true};
 };
 try{
  await deliver({archive,id:'test-id',binding:{orderId:'JOSH TEST',folder:'/Crosstalk Customs/JOSH TEST/Épreuve/Uploads'},config:{mode:'dropbox',testLabel:'JOSH TEST',refreshToken:'fake',clientId:'fake',clientSecret:'fake'}});
  assert.deepEqual(Buffer.concat(parts),payload);assert.equal(parts.length,2);
  assert.equal(commits[0].path,'/Crosstalk Customs/JOSH TEST/Épreuve/Uploads/JOSH TEST-test-id.zip');
  assert.equal(commits[0].mode,'overwrite');assert.equal(commits[0].autorename,false);
 }finally{global.fetch=original;await fs.rm(dir,{recursive:true,force:true});}
});
