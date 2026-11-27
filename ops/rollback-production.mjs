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
    m.oldFormBlobSha===m.candidateFormBlobSha||m.liveMakeScenarioId!==4762364||m.liveMakeWasActive!==true||
    !/^[a-f0-9]{64}$/.test(m.liveMakeBlueprintSha256||'')||m.oldMakeUnchanged!==true||
    !Array.isArray(m.inFlightOrderIds)||m.inFlightOrderIds.some(x=>typeof x!=='string'||x.length>150))
  throw Error('Rollback manifest is incomplete or does not match the approved release contract');
 return m;
}
function unwrap(data,key){return data?.response?.[key]??data?.[key]??data?.response??data;}
async function rollback(m,{request,report=()=>{},execute=false}){
 validate(m);
 const repo=`repos/${m.repository}`;
 const ref=await request('github',`${repo}/git/ref/heads/main`);
 const head=ref.object?.sha;
 const current=await request('github',`${repo}/contents/calculator.html?ref=main`);
 const currentBlob=current.sha;
 if(head!==m.candidateHeadSha&&currentBlob!==m.oldFormBlobSha)
  throw Error('Main changed since the approved cutover; refusing to overwrite a later change');
 if(currentBlob!==m.candidateFormBlobSha&&currentBlob!==m.oldFormBlobSha)
  throw Error('The served form source differs from both approved revisions');
 const details=unwrap(await request('make',`scenarios/${m.liveMakeScenarioId}`),'scenario');
 if(details.isActive!==true)throw Error('The original Make intake is not active');
 const blueprintResponse=await request('make',`scenarios/${m.liveMakeScenarioId}/blueprint`);
 const value=unwrap(blueprintResponse,'blueprint');
 const blueprint=typeof value==='string'?JSON.parse(value):value;
 if(digest(canonical(blueprint))!==m.liveMakeBlueprintSha256)
  throw Error('The original Make blueprint changed; refusing an incomplete rollback');
 const old=await request('github',`${repo}/contents/calculator.html?ref=${m.oldHeadSha}`);
 const bytes=Buffer.from((old.content||'').replace(/\s/g,''),'base64');
 if(gitBlob(bytes)!==m.oldFormBlobSha||old.sha!==m.oldFormBlobSha)
  throw Error('The saved old form failed its immutable blob check');
 if(currentBlob===m.oldFormBlobSha){
  report('Form already restored; verifying served bytes and in-flight orders');
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
  const served=await request('page',m.pagesUrl);
  if(digest(served)!==digest(bytes))throw Error('Pages has not yet served the restored form; keep monitoring CDN propagation');
  report('Old form bytes verified at the public Pages URL');
 }
 report(`${m.inFlightOrderIds.length} new-route order(s) require outcome reconciliation; do not delete or retry blindly`);
 return {restored:execute||currentBlob===m.oldFormBlobSha,inFlightOrderIds:m.inFlightOrderIds};
}
async function main(){
 const [manifestPath,flag]=process.argv.slice(2);
 if(!manifestPath||!['--dry-run','--execute'].includes(flag))throw Error('Usage: rollback-production.sh MANIFEST --dry-run|--execute');
 const m=validate(JSON.parse(await fs.readFile(manifestPath,'utf8')));
 if(!process.env.GH_TOKEN||!process.env.MAKE_API_TOKEN)throw Error('GH_TOKEN and MAKE_API_TOKEN must be provided by the restricted release operator');
 async function request(provider,target,options={}){
  const url=provider==='github'?`https://api.github.com/${target}`:provider==='make'?`https://eu1.make.com/api/v2/${target}`:target;
  const headers=provider==='github'?{Authorization:`Bearer ${process.env.GH_TOKEN}`,Accept:'application/vnd.github+json'}:
   provider==='make'?{Authorization:`Token ${process.env.MAKE_API_TOKEN}`}:{Accept:'text/html'};
  const response=await fetch(url,{method:options.method||'GET',headers:{...headers,...(options.body?{'Content-Type':'application/json'}:{})},body:options.body?JSON.stringify(options.body):undefined,signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(`${provider} returned HTTP ${response.status} during rollback`);
  return provider==='page'?Buffer.from(await response.arrayBuffer()):response.json();
 }
 await rollback(m,{request,execute:flag==='--execute',report:message=>console.log(message)});
}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)main().catch(error=>{console.error(error.message);process.exitCode=1});
export {validate,rollback,canonical,digest,gitBlob};
