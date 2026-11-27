#!/usr/bin/env node
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const gitBlob=bytes=>crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const canonical=value=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const sha=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);
function validate(m){
 if(!m||m.version!==1||m.repository!=='crosstalkrecords/crosstalk-customs-calculator'||m.branch!=='main'||
    !/^https:\/\/crosstalkrecords\.github\.io\/crosstalk-customs-calculator\/calculator\.html$/.test(m.pagesUrl)||
    ![m.oldHeadSha,m.candidateHeadSha,m.oldFormBlobSha,m.candidateFormBlobSha].every(sha)||
    m.oldHeadSha===m.candidateHeadSha||m.oldFormBlobSha===m.candidateFormBlobSha||
    !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(m.releaseId||'')||
    m.liveMakeScenarioId!==4762364||m.liveMakeHookId!==2620320||m.liveMakeWasActive!==true||
    !/^[a-f0-9]{64}$/.test(m.liveMakeBlueprintSha256||'')||m.oldMakeUnchanged!==true||
    !/^https:\/\/[a-z0-9-]+\.up\.railway\.app$/.test(m.productionGatewayUrl||''))
  throw Error('Rollback manifest is incomplete or does not match the approved release contract');
 return m;
}
function unwrap(data,key){return data?.response?.[key]??data?.[key]??data?.response??data;}
async function rollback(m,{request,report=()=>{},execute=false,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),pageAttempts=144,pageIntervalMs=5000}){
 validate(m);
 report('This command verifies or restores the old GitHub Pages file only; it does NOT change the Common Ground iframe. For a dual-URL cutover, point that iframe back to calculator.html separately');
 const repo=`repos/${m.repository}`;
 const ref=await request('github',`${repo}/git/ref/heads/main`);
 const head=ref.object?.sha;
 const current=await request('github',`${repo}/contents/calculator.html?ref=main`);
 const currentBlob=current.sha;
 if(head!==m.candidateHeadSha&&currentBlob!==m.oldFormBlobSha)
  throw Error('Main changed since the approved cutover; refusing to overwrite a later change');
 if(currentBlob!==m.candidateFormBlobSha&&currentBlob!==m.oldFormBlobSha)
  throw Error('The served form source differs from both approved revisions');
 let liveMakeVerified=false;
 try{
  const details=unwrap(await request('make',`scenarios/${m.liveMakeScenarioId}`),'scenario');
  if(details.isActive!==true)throw Error('The original Make intake is not active');
  if(details.hookId!==m.liveMakeHookId)throw Error('The original Make intake is not bound to the saved hook');
  const blueprintResponse=await request('make',`scenarios/${m.liveMakeScenarioId}/blueprint`);
  const value=unwrap(blueprintResponse,'blueprint');
  const blueprint=typeof value==='string'?JSON.parse(value):value;
  if(digest(canonical(blueprint))!==m.liveMakeBlueprintSha256)
   throw Error('The original Make blueprint changed');
  liveMakeVerified=true;
 }catch(error){
  if(!execute)throw error;
  report(`WARNING: ${error.message}. Continuing emergency form restore; the original Make intake must be checked manually`);
 }
 const old=await request('github',`${repo}/contents/calculator.html?ref=${m.oldHeadSha}`);
 const bytes=Buffer.from((old.content||'').replace(/\s/g,''),'base64');
 if(gitBlob(bytes)!==m.oldFormBlobSha||old.sha!==m.oldFormBlobSha)
  throw Error('The saved old form failed its immutable blob check');
 const validLedger=ledger=>ledger&&typeof ledger.paused==='boolean'&&Array.isArray(ledger.items)&&!ledger.items.some(item=>
   typeof item.submissionId!=='string'||!['queued','dispatching','processing','unknown','manual_review','complete'].includes(item.state));
 let ledger,paused=false;
 try{ledger=await request('gateway',m.productionGatewayUrl+'/internal/production-ledger');}catch(_){/* Emergency restore must work when the candidate gateway is down. */}
 if(!validLedger(ledger)){
  if(!execute)throw Error('The production order ledger is unavailable or malformed');
  ledger=null;
  report('WARNING: Candidate ledger unavailable; accepted orders and delivery state are unknown. Reconcile Make, Airtable and the gateway before any replay');
 }
 // Intake completion does not prove that an attached artwork ZIP was delivered.
 // The staff ledger has hasArtwork but no terminal delivery status, so retain
 // every artwork order for reconciliation even when its intake is complete.
 const needsReview=item=>item.state!=='complete'||item.hasArtwork===true;
 let inFlightOrderIds=ledger?ledger.items.filter(needsReview).map(item=>item.submissionId):null;
 if(execute){
  try{
   const stopped=await request('gateway',m.productionGatewayUrl+'/internal/production-pause',{method:'POST',body:{paused:true}});
   if(stopped?.paused!==true)throw Error('Pause was not confirmed');
   paused=true;
   const afterPause=await request('gateway',m.productionGatewayUrl+'/internal/production-ledger');
   if(!validLedger(afterPause)||afterPause.paused!==true)throw Error('Paused ledger was not confirmed');
   inFlightOrderIds=afterPause.items.filter(needsReview).map(item=>item.submissionId);
   report('New candidate intake paused; already accepted orders remain queued for delivery or reconciliation');
  }catch(_){
   inFlightOrderIds=null;
   report('WARNING: Candidate intake pause or ledger was not confirmed. Restore the old form now; reconcile all candidate orders, including submissions during Pages propagation');
  }
 }
 if(currentBlob===m.oldFormBlobSha){
  report('Old form file is already intact; verifying its served bytes and candidate orders');
 }else if(execute){
  // GitHub's contents API creates a forward commit. The current blob SHA is
  // a compare-and-swap guard; no force push or history rewrite is used.
  await request('github',`${repo}/contents/calculator.html`,{
   method:'PUT',body:{message:`Rollback ${m.releaseId}: restore previous Customs form`,branch:'main',sha:m.candidateFormBlobSha,content:bytes.toString('base64')}
  });
  report('Published a forward commit restoring the old calculator.html');
 }else report('Dry run: form revision and original Make intake match the manifest');
 if(execute||currentBlob===m.oldFormBlobSha){
  const after=await request('github',`${repo}/contents/calculator.html?ref=main`);
  if(after.sha!==m.oldFormBlobSha)throw Error('GitHub has not confirmed the restored form blob');
  if(!Number.isInteger(pageAttempts)||pageAttempts<1||pageAttempts>180)throw Error('Invalid Pages verification attempts');
  let servedOld=false;
  for(let attempt=1;attempt<=pageAttempts;attempt++){
   try{servedOld=digest(await request('page',m.pagesUrl))===digest(bytes);}catch(_){/* A transient Pages fetch is not proof of propagation. */}
   if(servedOld)break;
   if(attempt===1||attempt%6===0)report(`Waiting for the old form at GitHub Pages (${attempt}/${pageAttempts}); the source commit has been restored`);
   if(attempt<pageAttempts)await wait(pageIntervalMs);
  }
  if(!servedOld)throw Error('GitHub source was restored, but Pages has not verified the old form; keep monitoring the public URL and do not declare rollback complete');
  report('Old form bytes verified at the public Pages URL');
 }
 report(inFlightOrderIds===null?'New-route order count is unknown; do not delete or retry blindly':
  `${inFlightOrderIds.length} new-route order(s) require intake or artwork delivery reconciliation; do not delete or retry blindly`);
 if(!liveMakeVerified)throw Error('Old form restored, but the original Make intake was not verified; check or restore it before declaring the public order flow recovered');
 return {restored:execute||currentBlob===m.oldFormBlobSha,inFlightOrderIds,paused,liveMakeVerified};
}
async function main(){
 const [manifestPath,flag]=process.argv.slice(2);
 if(!manifestPath||!['--dry-run','--execute'].includes(flag))throw Error('Usage: rollback-production.sh MANIFEST --dry-run|--execute');
 const m=validate(JSON.parse(await fs.readFile(manifestPath,'utf8')));
 if(!process.env.GH_TOKEN||!process.env.MAKE_API_TOKEN||!process.env.ARTWORK_PRODUCTION_STAFF_SECRET)
  throw Error('GH_TOKEN, MAKE_API_TOKEN and ARTWORK_PRODUCTION_STAFF_SECRET are required by the restricted release operator');
 async function request(provider,target,options={}){
  const url=provider==='github'?`https://api.github.com/${target}`:provider==='make'?`https://eu1.make.com/api/v2/${target}`:target;
  const headers=provider==='github'?{Authorization:`Bearer ${process.env.GH_TOKEN}`,Accept:'application/vnd.github+json'}:
   provider==='make'?{Authorization:`Token ${process.env.MAKE_API_TOKEN}`}:
   provider==='gateway'?{Authorization:`Bearer ${process.env.ARTWORK_PRODUCTION_STAFF_SECRET}`,Accept:'application/json'}:{Accept:'text/html'};
  const response=await fetch(url,{method:options.method||'GET',headers:{...headers,...(options.body?{'Content-Type':'application/json'}:{})},body:options.body?JSON.stringify(options.body):undefined,signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(`${provider} returned HTTP ${response.status} during rollback`);
  return provider==='page'?Buffer.from(await response.arrayBuffer()):response.json();
 }
 await rollback(m,{request,execute:flag==='--execute',report:message=>console.log(message)});
}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)main().catch(error=>{console.error(error.message);process.exitCode=1});
export {validate,rollback,canonical,digest,gitBlob};
