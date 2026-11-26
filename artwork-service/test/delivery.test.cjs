'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {deliver,staffFileStem}=require('../src/delivery.cjs');
const {archiveJob}=require('../src/worker.cjs');
const {contentHash}=require('../src/dropbox-api.cjs');
test('Dropbox sessions preserve bytes, Unicode destination and JOSH TEST name',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'artwork-delivery-')),archive=path.join(dir,'test.zip');
 const payload=Buffer.alloc(8*1024*1024+123,42);await fs.writeFile(archive,payload);
 const original=global.fetch,parts=[],commits=[];const expectedHash=await contentHash(archive);const metadata={path_lower:'/crosstalk customs/josh test/épreuve/uploads/josh test-test-id.zip',path_display:'/Crosstalk Customs/JOSH TEST/Épreuve/Uploads/JOSH TEST-test-id.zip',size:payload.length,content_hash:expectedHash};
 global.fetch=async(url,options)=>{
  if(url.endsWith('/get_metadata'))return {ok:true,json:async()=>metadata};
  if(url.endsWith('/token'))return {ok:true,json:async()=>({access_token:'fake-only'})};
  const raw=options.headers['Dropbox-API-Arg'];assert(!/[^\x20-\x7e]/.test(raw));const arg=JSON.parse(raw);
  if(url.endsWith('/start'))return {ok:true,json:async()=>({session_id:'fake-session'})};
  assert.equal(arg.cursor.offset,parts.reduce((n,b)=>n+b.length,0));
  if(url.endsWith('/append_v2'))parts.push(Buffer.from(options.body));else commits.push(arg.commit);
  return {ok:true,json:async()=>metadata};
 };
 try{
  await deliver({archive,id:'test-id',binding:{orderId:'JOSH TEST',folder:'/Crosstalk Customs/JOSH TEST/Épreuve/Uploads'},config:{mode:'dropbox',testLabel:'JOSH TEST',refreshToken:'fake',clientId:'fake',clientSecret:'fake'}});
  assert.deepEqual(Buffer.concat(parts),payload);assert.equal(parts.length,2);
  assert.equal(commits[0].path,'/Crosstalk Customs/JOSH TEST/Épreuve/Uploads/JOSH TEST-test-id.zip');
  assert.equal(commits[0].mode,'overwrite');assert.equal(commits[0].autorename,false);
  parts.length=0;metadata.content_hash='incorrect';
  await assert.rejects(deliver({archive,id:'test-id',binding:{orderId:'JOSH TEST',folder:'/Crosstalk Customs/JOSH TEST/Épreuve/Uploads'},config:{mode:'dropbox',testLabel:'JOSH TEST',refreshToken:'fake',clientId:'fake',clientSecret:'fake'}}),/verification failed/);
 }finally{global.fetch=original;await fs.rm(dir,{recursive:true,force:true});}
});
test('staff archive and its output files use the protected JOB number',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'artwork-named-'));
 const job={id:'a'.repeat(32),binding:JSON.stringify({orderId:'recAAAAAAAAAAAAAA',folder:'/Crosstalk Customs/JOSH TEST/order/Uploads',jobNumber:'JOB364'})};
 const stem=staffFileStem(job.id,JSON.parse(job.binding),{testLabel:'JOSH TEST'});
 try{
  await fs.mkdir(path.join(root,job.id,'output'),{recursive:true});
  await fs.writeFile(path.join(root,job.id,'project.json'),'{}');
  await fs.writeFile(path.join(root,job.id,'output/front.psd'),'synthetic PSD');
  await fs.writeFile(path.join(root,job.id,'output/front-reference.png'),'synthetic PNG');
  const archive=await archiveJob({dir:()=>path.join(root,job.id),assets:()=>[]},job,{testLabel:'JOSH TEST'});
  const zip=await fs.readFile(archive),end=zip.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
  assert(end>=0,'ZIP central directory exists');
  const names=[],count=zip.readUInt16LE(end+10);let offset=zip.readUInt32LE(end+16);
  for(let i=0;i<count;i++){
   assert.equal(zip.readUInt32LE(offset),0x02014b50);
   const length=zip.readUInt16LE(offset+28),extra=zip.readUInt16LE(offset+30),comment=zip.readUInt16LE(offset+32);
   names.push(zip.subarray(offset+46,offset+46+length).toString());offset+=46+length+extra+comment;
  }
  assert(names.includes(stem+'/'+stem+'-front.psd'));
  assert(names.includes(stem+'/'+stem+'-front-reference.png'));
  assert(names.includes(stem+'/Recovery/project.json'));
  assert(names.includes(stem+'/README.txt'));
  assert(names.every(name=>name.startsWith(stem+'/')));
  assert.equal(staffFileStem(job.id,{orderId:'recAAAAAAAAAAAAAA'},{testLabel:'JOSH TEST'}),'JOSH TEST-recAAAAAAAAAAAAAA');
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
