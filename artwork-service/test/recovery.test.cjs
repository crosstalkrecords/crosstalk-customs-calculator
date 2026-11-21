'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {makeApp}=require('../src/server.cjs');
const {openStore}=require('../src/store.cjs');
const {prune}=require('../src/retention.cjs');
const {createCanvas}=require('../src/psd.cjs');
const {digest}=require('../src/project.cjs');

test('existing volume schema migrates without dropping a failed job',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'customs-migration-'));
 try{
  const db=new DatabaseSync(path.join(root,'jobs.sqlite'));
  db.exec("CREATE TABLE jobs(id TEXT PRIMARY KEY,token_hash TEXT NOT NULL,created INTEGER NOT NULL,state TEXT NOT NULL,project TEXT,digest TEXT,binding TEXT,attempts INTEGER NOT NULL DEFAULT 0,next_attempt INTEGER NOT NULL DEFAULT 0,error TEXT); CREATE TABLE assets(job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,hash TEXT NOT NULL,bytes INTEGER NOT NULL,mime TEXT NOT NULL,PRIMARY KEY(job_id,hash));");
  db.prepare("INSERT INTO jobs(id,token_hash,created,state) VALUES(?,?,?,'failed')").run('a'.repeat(32),'hash',1);
  db.prepare("INSERT INTO jobs(id,token_hash,created,state) VALUES(?,?,?,'delivered')").run('d'.repeat(32),'hash',1);db.close();
  const store=openStore(root);
  assert.equal(store.get('a'.repeat(32)).state,'failed');
  assert(store.get('d'.repeat(32)).completed_at>0);
  for(const field of ['completed_at','failed_at','failure_stage','delivery_receipt'])assert(store.db.prepare('PRAGMA table_info(jobs)').all().some(c=>c.name===field));
  assert.equal(await prune(store,Date.now()),0);assert(store.get('a'.repeat(32)));assert(store.get('d'.repeat(32)));
  store.close();
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('JOSH TEST recovery summary is staff-only, read-only and contains no private references',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'customs-summary-'));
 const config={dataDir:root,bindSecret:'bind-only-'.repeat(4),staffSecret:'staff-only-'.repeat(4),origins:['https://synthetic.test'],publicOrigin:'https://synthetic.test',testLabel:'JOSH TEST',testRecipient:'delousedcomatorium@gmail.com',testAccessCode:'test-access',mode:'disabled',dropboxRoot:'/Crosstalk Customs/JOSH TEST'};
 const service=makeApp(config,{worker:{interval:999999}}),server=service.app.listen(0,'127.0.0.1');
 await new Promise(r=>server.once('listening',r));
 const url='http://127.0.0.1:'+server.address().port+'/internal/test-recovery-summary';
 try{
  const failed=service.store.create(),queued=service.store.create(),processing=service.store.create(),created=Date.now()-5000;
  service.store.db.prepare("UPDATE jobs SET state='failed',failed_at=? WHERE id=?").run(created,failed.id);
  service.store.db.prepare("UPDATE jobs SET state='queued',created=? WHERE id=?").run(created,queued.id);
  service.store.db.prepare("UPDATE jobs SET state='processing',created=? WHERE id=?").run(created,processing.id);
  service.store.db.prepare("INSERT INTO test_submissions(id,created,reference_id,state,request_hash,browser_hash) VALUES(?,?,?,'unknown',?,?)").run('b72ca4e5-0e82-4f75-9413-35568ae8ef0c',created,failed.id,'private-fingerprint','private-session');
  for(const [state,id] of [['queued','a72ca4e5-0e82-4f75-9413-35568ae8ef0c'],['processing','c72ca4e5-0e82-4f75-9413-35568ae8ef0c'],['manual_review','d72ca4e5-0e82-4f75-9413-35568ae8ef0c']])
   service.store.db.prepare('INSERT INTO test_submissions(id,created,reference_id,state,updated) VALUES(?,?,?,?,?)').run(id,created,'',state,created);
  assert.equal((await fetch(url)).status,401);
  assert.equal((await fetch(url,{headers:{Authorization:'Bearer '+config.bindSecret}})).status,401);
  const result=await fetch(url,{headers:{Authorization:'Bearer '+config.staffSecret}});assert.equal(result.status,200);
  const summary=await result.json();
  assert.equal(summary.jobs.failed,1);assert.equal(summary.jobs.queued,1);assert.equal(summary.jobs.processing,1);
  assert.equal(summary.jobs.oldestFailedAt,created);assert.equal(summary.jobs.oldestQueuedAt,created);
  assert.equal(summary.jobs.oldestProcessingAt,created);assert(summary.jobs.oldestQueuedAgeMs>=5000);
  assert(summary.jobs.oldestProcessingAgeMs>=5000);
  for(const state of ['queued','processing','unknown','manual_review']){
   assert.equal(summary.submissions[state].count,1);
   assert.equal(summary.submissions[state].oldestUpdatedAt,created);
   assert(summary.submissions[state].oldestAgeMs>=5000);
  }
  assert.deepEqual(summary.submissions.dispatching,{count:0,oldestUpdatedAt:null,oldestAgeMs:null});
  assert(summary.volumeFreeBytes>0);assert(summary.generatedAt>created);
  const text=JSON.stringify(summary);
  for(const privateValue of [failed.id,queued.id,processing.id,failed.token,queued.token,processing.token,'b72ca4e5-0e82-4f75-9413-35568ae8ef0c','private-fingerprint','private-session','/Crosstalk Customs/JOSH TEST'])assert(!text.includes(privateValue));
  assert.equal(service.store.get(failed.id).state,'failed');
  assert.equal(service.store.db.prepare("SELECT state FROM test_submissions WHERE id=?").get('b72ca4e5-0e82-4f75-9413-35568ae8ef0c').state,'unknown');
 }finally{await new Promise(r=>server.close(r));await service.close();await fs.rm(root,{recursive:true,force:true});}
});

test('staff recovery secret is distinct and an existing draft cannot upload when disk is full',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'customs-capacity-'));
 const bindSecret='bind-only-'.repeat(4),config={dataDir:root,bindSecret,origins:['https://synthetic.test'],mode:'disabled',dropboxRoot:'/Crosstalk Customs/Orders'};
 assert.throws(()=>makeApp({...config,staffSecret:bindSecret}),/must differ/);
 const service=makeApp(config,{worker:{interval:999999}}),server=service.app.listen(0,'127.0.0.1');
 await new Promise(r=>server.once('listening',r));
 const url='http://127.0.0.1:'+server.address().port,job=service.store.create();
 const canvas=createCanvas(2,2);const bytes=canvas.toBuffer('image/png'),hash=digest(bytes);
 const realStatfs=fs.statfs;
 try{
  fs.statfs=async()=>({bavail:0,bsize:4096});
  const result=await fetch(url+'/v1/drafts/'+job.id+'/assets/'+hash,{method:'PUT',headers:{Origin:'https://synthetic.test',Authorization:'Bearer '+job.token,'Content-Type':'image/png'},body:bytes});
  assert.equal(result.status,503);assert.equal(service.store.assets(job.id).length,0);
  await assert.rejects(fs.stat(path.join(service.store.dir(job.id),'assets',hash)),{code:'ENOENT'});
 }finally{fs.statfs=realStatfs;await new Promise(r=>server.close(r));await service.close();await fs.rm(root,{recursive:true,force:true});}
});

test('terminal failures survive retention, remain staff visible, and retry to an audited delivery',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'customs-recovery-'));
 const config={dataDir:root,bindSecret:'bind-only-'.repeat(4),staffSecret:'staff-only-'.repeat(4),origins:['https://synthetic.test'],mode:'disabled',dropboxRoot:'/Crosstalk Customs/Orders'};
 let deliverOk=false;
 const service=makeApp(config,{worker:{interval:999999,render:async dir=>{await fs.mkdir(path.join(dir,'output'),{recursive:true});await fs.writeFile(path.join(dir,'output','front.psd'),'synthetic');},delivery:async()=>{
  if(!deliverOk)throw Error('Synthetic network interruption');
  return {verified:true,bytes:123,contentHash:'b'.repeat(64),path:'/PRIVATE/Customer/Uploads',access_token:'must-not-store'};
 }}});
 const server=service.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const url='http://127.0.0.1:'+server.address().port;
 const req=(route,method='GET',token)=>fetch(url+route,{method,headers:{Origin:'https://synthetic.test',...(token?{Authorization:'Bearer '+token}:{})}});
 try{
  const job=service.store.create(),binding={orderId:'recTEST',folder:'/Crosstalk Customs/Orders/recTEST/Uploads'};
  service.store.db.prepare("UPDATE jobs SET state='queued',project=?,binding=?,created=? WHERE id=?").run('{}',JSON.stringify(binding),Date.now()-10*86400000,job.id);
  for(let n=0;n<3;n++){
   await service.worker.tick();
   if(n<2)service.store.db.prepare('UPDATE jobs SET next_attempt=0 WHERE id=?').run(job.id);
  }
  assert.equal(service.store.get(job.id).state,'failed');assert.equal(service.store.get(job.id).failure_stage,'delivery');assert(service.store.get(job.id).failed_at>0);
  assert.equal((await req('/internal/failures')).status,401);
  assert.equal((await req('/internal/failures','GET',config.bindSecret)).status,401);
  assert.equal((await req('/internal/failures?limit=0','GET',config.staffSecret)).status,422);
  const failures=await(await req('/internal/failures?limit=1&offset=0','GET',config.staffSecret)).json();
  assert.equal(failures.items.length,1);assert.equal(failures.nextOffset,null);assert.equal(failures.items[0].orderId,'recTEST');
  assert(!JSON.stringify(failures).includes('Uploads'));assert(!JSON.stringify(failures).includes('token'));
  assert.equal(await prune(service.store,Date.now()),0);assert(service.store.get(job.id));
  // Failed records do not use active-job slots, even if more than 100 exist.
  for(let i=0;i<100;i++){const old=service.store.create();service.store.db.prepare("UPDATE jobs SET state='failed' WHERE id=?").run(old.id);}
  const page1=await(await req('/internal/failures?limit=10','GET',config.staffSecret)).json();
  const page2=await(await req('/internal/failures?limit=10&offset='+page1.nextOffset,'GET',config.staffSecret)).json();
  assert.equal(page1.items.length,10);assert.equal(page1.nextOffset,10);assert.equal(page2.items.length,10);
  assert(!page2.items.some(item=>page1.items.some(previous=>previous.id===item.id)));
  assert.equal((await req('/v1/drafts','POST')).status,201);
  assert.equal((await req('/internal/retry/'+job.id,'POST',config.staffSecret)).status,202);
  deliverOk=true;await service.worker.tick();
  const delivered=service.store.get(job.id);
  assert.equal(delivered.state,'delivered');assert(delivered.completed_at>0);assert.equal(delivered.failed_at,null);
  assert.deepEqual(JSON.parse(delivered.delivery_receipt),{verified:true,bytes:123,contentHash:'b'.repeat(64)});
  assert(!delivered.delivery_receipt.includes('PRIVATE'));assert(!delivered.delivery_receipt.includes('token'));
  // A long-running job is retained for seven days after delivery, not creation.
  assert.equal(await prune(service.store,Date.now()),0);
  service.store.db.prepare('UPDATE jobs SET completed_at=? WHERE id=?').run(Date.now()-8*86400000,job.id);
  assert.equal(await prune(service.store,Date.now()),1);assert.equal(service.store.get(job.id),undefined);
 }finally{await new Promise(r=>server.close(r));await service.close();await fs.rm(root,{recursive:true,force:true});}
});

test('Dropbox mode requires a verified receipt before marking a job delivered',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'customs-receipt-'));
 const config={dataDir:root,bindSecret:'bind-only-'.repeat(4),origins:['https://synthetic.test'],mode:'dropbox',dropboxRoot:'/Crosstalk Customs/JOSH TEST',refreshToken:'fake',clientId:'fake',clientSecret:'fake'};
 const service=makeApp(config,{worker:{interval:999999,render:async dir=>{await fs.mkdir(path.join(dir,'output'),{recursive:true});await fs.writeFile(path.join(dir,'output','front.psd'),'synthetic');},delivery:async()=>undefined}});
 try{
  const job=service.store.create();
  service.store.db.prepare("UPDATE jobs SET state='queued',project=?,binding=? WHERE id=?").run('{}',JSON.stringify({orderId:'JOSH TEST',folder:'/Crosstalk Customs/JOSH TEST/JOSH TEST/Uploads'}),job.id);
  await service.worker.tick();
  assert.equal(service.store.get(job.id).state,'queued');assert.equal(service.store.get(job.id).completed_at,null);assert.equal(service.store.get(job.id).delivery_receipt,null);
 }finally{await service.close();await fs.rm(root,{recursive:true,force:true});}
});
