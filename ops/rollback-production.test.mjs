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
 liveMakeScenarioId:4762364,liveMakeHookId:2620320,liveMakeWasActive:true,liveMakeBlueprintSha256:digest(canonical(blueprint)),oldMakeUnchanged:true,
 productionGatewayUrl:'https://customs-artwork.up.railway.app'};
function fixture(overrides={}){
 let head=overrides.initialOld?manifest.oldHeadSha:manifest.candidateHeadSha,
  form=overrides.initialOld?old:candidate,active=true,flow=blueprint,served=old,paused=false,pageReads=0;
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
   if(overrides.makeDown)throw Error('Make API unavailable');
   if(target.endsWith('/blueprint'))return {response:{blueprint:overrides.blueprint||flow}};
   return {response:{scenario:{isActive:overrides.active??active,hookId:overrides.hookId??manifest.liveMakeHookId}}};
  }
  if(provider==='gateway'){
   if(overrides.gatewayDown)throw Error('Candidate gateway unavailable');
   if(target.endsWith('/internal/production-pause')&&options.method==='POST'){
    writes.push({gatewayPause:options.body});paused=!overrides.pauseFails;return {paused};
   }
   return overrides.badLedger?{items:null}:{paused,items:overrides.items??[
    {submissionId:'order-1',state:'processing',hasArtwork:false},
    {submissionId:'order-2',state:'complete',hasArtwork:false}]};
  }
  if(provider==='page')return overrides.pageResponses?.[pageReads++]||overrides.served||served;
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
test('dry run refuses to certify changed, rebound or inactive original Make intake',async()=>{
 for(const overrides of [{blueprint:{flow:[]}},{active:false},{hookId:999}]){
  const f=fixture(overrides);
  await assert.rejects(rollback(manifest,{request:f.request}),/Make blueprint changed|not active|not bound/);
  assert.equal(f.writes.length,0);
 }
});
test('restoration reports Pages propagation failure after GitHub commit',async()=>{
 const f=fixture({served:candidate});
 await assert.rejects(rollback(manifest,{request:f.request,execute:true,pageAttempts:2,wait:async()=>{}}),/Pages has not verified/);
 assert.equal(f.writes.length,2);
});
test('one command waits for Pages propagation and verifies the old public bytes',async()=>{
 const f=fixture({pageResponses:[candidate,candidate,old]}),reports=[];
 const result=await rollback(manifest,{request:f.request,execute:true,pageAttempts:3,wait:async()=>{},report:x=>reports.push(x)});
 assert.equal(result.restored,true);assert.equal(result.liveMakeVerified,true);
 assert(reports.some(x=>x.includes('Waiting for the old form')));
 assert(reports.some(x=>x.includes('Old form bytes verified')));
});
test('dry run refuses to certify an unavailable ledger',async()=>{
 for(const overrides of [{badLedger:true},{gatewayDown:true}]){
  const f=fixture(overrides);
  await assert.rejects(rollback(manifest,{request:f.request}),/ledger is unavailable/);
  assert.deepEqual(f.writes,[]);
 }
});
test('emergency execution restores the old form even when the candidate gateway is down',async()=>{
 const f=fixture({gatewayDown:true}),warnings=[];
 const r=await rollback(manifest,{request:f.request,execute:true,report:x=>warnings.push(x)});
 assert.equal(r.restored,true);assert.equal(r.paused,false);assert.equal(r.inFlightOrderIds,null);
 assert.equal(f.writes.length,1);assert.equal(Buffer.from(f.writes[0].content,'base64').toString(),old.toString());
 assert(warnings.some(x=>x.includes('order count is unknown')));
});
test('failed pause restores the old form and marks the candidate ledger uncertain',async()=>{
 const f=fixture({pauseFails:true}),warnings=[];
 const r=await rollback(manifest,{request:f.request,execute:true,report:x=>warnings.push(x)});
 assert.equal(r.restored,true);assert.equal(r.paused,false);assert.equal(r.inFlightOrderIds,null);
 assert.equal(f.writes.length,2);assert(warnings.some(x=>x.includes('pause or ledger was not confirmed')));
});
test('emergency rollback is idempotent after the old form is restored',async()=>{
 const f=fixture({gatewayDown:true,formSha:oldSha}),warnings=[];
 const r=await rollback(manifest,{request:f.request,execute:true,report:x=>warnings.push(x)});
 assert.equal(r.restored,true);assert.equal(r.inFlightOrderIds,null);
 assert.equal(f.writes.some(x=>x.content),false);
});
test('Make API outage does not prevent emergency source restore, but command fails closed',async()=>{
 const f=fixture({makeDown:true}),reports=[];
 await assert.rejects(rollback(manifest,{request:f.request,execute:true,report:x=>reports.push(x)}),/original Make intake was not verified/);
 assert.equal(f.writes.length,2);
 assert.equal(Buffer.from(f.writes[1].content,'base64').toString(),old.toString());
 assert(reports.some(x=>x.includes('Continuing emergency form restore')));
 assert(reports.some(x=>x.includes('Old form bytes verified')));
});
test('changed, rebound or inactive original Make intake still restores form, then reports incomplete recovery',async()=>{
 for(const override of [{active:false},{blueprint:{flow:[]}},{hookId:999}]){
  const f=fixture(override),reports=[];
  await assert.rejects(rollback(manifest,{request:f.request,execute:true,report:x=>reports.push(x)}),/original Make intake was not verified/);
  assert.equal(f.writes.length,2);
  assert(reports.some(x=>x.includes('Continuing emergency form restore')));
 }
});
test('four cutover checkpoints restore the old form and preserve artwork reconciliation',async()=>{
 const cases=[
  {label:'before switch',initialOld:true,items:[],expected:[],writes:0},
  {label:'after switch',items:[],expected:[],writes:1},
  {label:'after order accepted',items:[{submissionId:'accepted',state:'processing',hasArtwork:false}],expected:['accepted'],writes:1},
  {label:'after artwork queued',items:[{submissionId:'art',state:'complete',hasArtwork:true}],expected:['art'],writes:1}
 ];
 for(const c of cases){
  const f=fixture(c),reports=[];
  const result=await rollback(manifest,{request:f.request,execute:true,report:x=>reports.push(x)});
  assert.deepEqual(result.inFlightOrderIds,c.expected,c.label);
  assert.equal(f.writes.filter(x=>x.content).length,c.writes,c.label);
  assert(reports.some(x=>x.includes('Old form bytes verified')),c.label);
 }
});
