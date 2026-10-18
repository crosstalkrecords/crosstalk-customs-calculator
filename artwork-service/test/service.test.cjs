'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {makeApp}=require('../src/server.cjs');
const {validate,digest}=require('../src/project.cjs');
const {validateBinding}=require('../src/delivery.cjs');
const project=()=>({format:'crosstalk-project',version:1,rendererVersion:'approved-d5b75f9-v1',surfaces:{front:[{id:'t',type:'text',text:'Synthetic',font:'Crosstalk Sans',fontSize:4,x:.1,y:.1,w:.8,h:.2,z:1}]},backgrounds:{front:{type:'solid',color:'#123456'}}});
test('source references and private order destinations are bounded',()=>{
 assert.throws(()=>validate({...project(),surfaces:{front:[{id:'bad',type:'image',src:'https://example.com/private',x:0,y:0,w:1,h:1}]}},new Set()),/Missing source/);
 assert.throws(()=>validate({...project(),surfaces:{front:Array.from({length:41},(_,i)=>({...project().surfaces.front[0],id:String(i)}))}},new Set()),/40 layers/);
 for(const folder of ['/Elsewhere/A/Uploads','/Crosstalk Customs/Orders/../Uploads','/Crosstalk Customs/Orders/A/Uploads/child'])assert.throws(()=>validateBinding({orderId:'x',folder},'/Crosstalk Customs/Orders'));
 assert.equal(validateBinding({orderId:'x',folder:'/Crosstalk Customs/Orders/A/Uploads'},'/Crosstalk Customs/Orders').orderId,'x');
});
test('capabilities, sealing, trusted binding, restart and retry are isolated',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'customs-artwork-'));
 let renders=0,deliveries=0;
 const config={dataDir:root,bindSecret:'test-only-secret-'.repeat(3),origins:['https://synthetic.test'],mode:'disabled',dropboxRoot:'/Crosstalk Customs/Orders'};
 const fakeRender=async dir=>{renders++;await fs.mkdir(path.join(dir,'output'),{recursive:true});await fs.writeFile(path.join(dir,'output','front.psd'),'synthetic-worker-output');};
 const service=makeApp(config,{worker:{interval:999999,render:fakeRender,delivery:async()=>{if(++deliveries===1)throw Error('Synthetic network interruption');}}});
 const server=service.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const url='http://127.0.0.1:'+server.address().port;
 const req=async(route,method='GET',body,token,origin='https://synthetic.test')=>fetch(url+route,{method,headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
 try{
  assert.equal((await req('/v1/drafts','POST',null,null,'https://evil.test')).status,403);
  const a=await(await req('/v1/drafts','POST')).json(),b=await(await req('/v1/drafts','POST')).json();
  assert.equal((await req('/v1/drafts/'+a.id,'GET',null,b.token)).status,404);
  const commit=await req('/v1/drafts/'+a.id+'/commit','POST',project(),a.token);assert.equal(commit.status,200);const reference=(await commit.json()).reference;
  assert.equal((await req('/v1/drafts/'+a.id+'/commit','POST',{...project(),backgrounds:{}},a.token)).status,409);
  assert.equal((await req('/internal/bind','POST',{reference,orderId:'A',folder:'/Crosstalk Customs/Orders/A/Uploads'},a.token)).status,401);
  const binding={reference,orderId:'A',folder:'/Crosstalk Customs/Orders/A/Uploads'};
  assert.equal((await req('/internal/bind','POST',binding,config.bindSecret)).status,202);
  assert.equal((await req('/internal/bind','POST',{...binding,orderId:'B',folder:'/Crosstalk Customs/Orders/B/Uploads'},config.bindSecret)).status,409);
  await service.worker.tick();assert.equal(service.store.get(a.id).state,'queued');assert.equal(renders,1);
  service.store.db.prepare('UPDATE jobs SET next_attempt=0 WHERE id=?').run(a.id);
  await service.worker.tick();assert.equal(service.store.get(a.id).state,'delivered');assert.equal(renders,1);assert.equal(deliveries,2);
  assert.equal((await req('/internal/bind','POST',binding,config.bindSecret)).status,200);await service.worker.tick();assert.equal(deliveries,2);
  assert.equal(service.store.get(b.id).state,'draft');
 }finally{await new Promise(r=>server.close(r));await service.close();}
 // Durable state survives process/store recreation.
 const again=makeApp(config,{worker:{interval:999999}});assert.equal(again.store.db.prepare("SELECT count(*) AS n FROM jobs WHERE state='delivered'").get().n,1);await again.close();await fs.rm(root,{recursive:true,force:true});
});
