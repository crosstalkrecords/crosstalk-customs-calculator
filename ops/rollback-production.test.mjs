import test from 'node:test';
import assert from 'node:assert/strict';
import {rollback,canonical,digest,gitBlob} from './rollback-production.mjs';

const old=Buffer.from('<form>old</form>');
const candidate=Buffer.from('<form>new</form>');
const blueprint={flow:[{id:1,module:'webhook'}]};
const oldSha=gitBlob(old),newSha=gitBlob(candidate);
const manifest={version:1,releaseId:'rehearsal',repository:'crosstalkrecords/crosstalk-customs-calculator',branch:'main',
 pagesUrl:'https://crosstalkrecords.github.io/crosstalk-customs-calculator/calculator.html',
 oldHeadSha:'1'.repeat(40),candidateHeadSha:'2'.repeat(40),oldFormBlobSha:oldSha,candidateFormBlobSha:newSha,
 liveMakeScenarioId:4762364,liveMakeWasActive:true,liveMakeBlueprintSha256:digest(canonical(blueprint)),oldMakeUnchanged:true,
 productionGatewayUrl:'https://customs-artwork.up.railway.app'};
function fixture(overrides={}){
 let head=manifest.candidateHeadSha,form=candidate,active=true,flow=blueprint,served=old,paused=false;
 const writes=[];
 const request=async(provider,target,options={})=>{
  if(provider==='github'){
   if(target.endsWith('/git/ref/heads/main'))return {object:{sha:overrides.head||head}};
   if(target.includes('/contents/calculator.html?ref='+manifest.oldHeadSha))return {sha:oldSha,content:old.toString('base64')};
   if(target.includes('/contents/calculator.html?ref=main'))return {sha:overrides.formSha||gitBlob(form)};
   if(target.endsWith('/contents/calculator.html')&&options.method==='PUT'){
    writes.push(options.body);assert.equal(options.body.sha,newSha);
    form=Buffer.from(options.body.content,'base64');head='3'.repeat(40);return {content:{sha:gitBlob(form)}};
   }
  }
  if(provider==='make'){
   if(target.endsWith('/blueprint'))return {response:{blueprint:overrides.blueprint||flow}};
   return {response:{scenario:{isActive:overrides.active??active}}};
  }
  if(provider==='gateway'){
   if(target.endsWith('/internal/production-pause')&&options.method==='POST'){
    writes.push({gatewayPause:options.body});paused=!overrides.pauseFails;return {paused};
   }
   return overrides.badLedger?{items:null}:{paused,items:[{submissionId:'order-1',state:'processing'},{submissionId:'order-2',state:'complete'}]};
  }
  if(provider==='page')return overrides.served||served;
  throw Error(`Unexpected ${provider}: ${target}`);
 };
 return {request,writes};
}
test('dry run checks source and Make without writing',async()=>{
 const f=fixture();const r=await rollback(manifest,{request:f.request});
 assert.equal(r.restored,false);assert.deepEqual(f.writes,[]);
 assert.deepEqual(r.inFlightOrderIds,['order-1']);
});
test('execution restores exact bytes in forward commit and verifies Pages',async()=>{
 const f=fixture();const r=await rollback(manifest,{request:f.request,execute:true});
 assert.equal(r.restored,true);assert.deepEqual(r.inFlightOrderIds,['order-1']);
 assert.equal(f.writes.length,2);assert.deepEqual(f.writes[0],{gatewayPause:{paused:true}});
 assert.equal(Buffer.from(f.writes[1].content,'base64').toString(),old.toString());
});
test('unrelated main change stops before write',async()=>{
 const f=fixture({head:'4'.repeat(40)});
 await assert.rejects(rollback(manifest,{request:f.request,execute:true}),/Main changed/);
 assert.equal(f.writes.length,0);
});
test('Make blueprint change or disabled original intake stops before write',async()=>{
 for(const overrides of [{blueprint:{flow:[]}},{active:false}]){
  const f=fixture(overrides);
  await assert.rejects(rollback(manifest,{request:f.request,execute:true}),/Make blueprint changed|not active/);
  assert.equal(f.writes.length,0);
 }
});
test('restoration reports Pages propagation failure after GitHub commit',async()=>{
 const f=fixture({served:candidate});
 await assert.rejects(rollback(manifest,{request:f.request,execute:true}),/Pages has not yet served/);
 assert.equal(f.writes.length,2);
});
test('bad ledger or failed pause blocks the form switch',async()=>{
 for(const overrides of [{badLedger:true},{pauseFails:true}]){
  const f=fixture(overrides);
  await assert.rejects(rollback(manifest,{request:f.request,execute:true}),/ledger is unavailable|intake pause/);
  assert.equal(f.writes.some(x=>x.content),false);
 }
});
