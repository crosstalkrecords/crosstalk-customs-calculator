'use strict';
const crypto=require('node:crypto');
const express=require('express');
const {validateBinding}=require('./delivery.cjs');

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RECORD=/^rec[A-Za-z0-9]{14}$/;
const REFERENCE=/^([a-f0-9]{32})\.([A-Za-z0-9_-]{43})$/;
const FIELDS=new Set(['Artist Order','Customer Name','Email','Custom Field 1','Estimated Price Given','Extras','Packaging','Postcode','Quantity','Record Size','Rush','Shipping Required','Side A Length','Side B Length','Sides','Speed','State','Street Address','Suburb','Tracklist','Vinyl Colour','Delivery Method']);
function hash(s){return crypto.createHash('sha256').update(s).digest('hex');}
function safeEqual(a,b){if(typeof a!=='string'||typeof b!=='string')return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y);}
function uploadRequestLink(value){
 try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='www.dropbox.com'&&
   /^\/request\/[A-Za-z0-9_-]+$/.test(u.pathname)&&!u.username&&!u.password&&!u.search&&!u.hash;}
 catch(_){return false;}
}
function available(config){
 let url;try{url=new URL(config.productionWebhookUrl);}catch(_){return false;}
 return config.productionIntakeEnabled===true&&config.testLabel!=='JOSH TEST'&&config.mode==='dropbox'&&
  config.dropboxRoot==='/Crosstalk Customs/Orders'&&url.protocol==='https:'&&url.hostname==='hook.eu1.make.com'&&
  !url.username&&!url.password&&!!config.productionMakeApiKey&&!!config.publicOrigin&&!!config.staffSecret;
}
function validateFields(fields){
 if(!fields||typeof fields!=='object'||Array.isArray(fields)||Object.keys(fields).length>FIELDS.size||
  Object.keys(fields).some(key=>!FIELDS.has(key)))throw Error('Invalid order fields');
 for(const [key,value] of Object.entries(fields))if(typeof value!=='string'||value.length>(key==='Tracklist'?8000:500)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))throw Error('Invalid '+key);
 for(const key of ['Customer Name','Email','Custom Field 1','Packaging','Quantity','Record Size','Speed','Tracklist'])if(!fields[key])throw Error('Missing '+key);
 if(!/^\d{1,3}$/.test(fields.Quantity)||Number(fields.Quantity)<1||Number(fields.Quantity)>100||
  !['7','10','12'].includes(fields['Record Size'])||!['Standard','Printed Jacket + Labels','Custom Finish Pack'].includes(fields.Packaging)||
  !['33 RPM','45 RPM'].includes(fields.Speed)||!/^\S+@\S+\.\S+$/.test(fields.Email)||fields.Email.length>254)throw Error('Invalid order choice or email');
 if(fields['Shipping Required']==='on'&&['Street Address','Suburb','Postcode','State'].some(k=>!fields[k]))throw Error('Shipping address is incomplete');
 return Object.fromEntries([...FIELDS].filter(key=>Object.hasOwn(fields,key)).map(key=>[key,fields[key]]));
}
function installProductionOrders(app,store,config,{fetchImpl=fetch,interval=1000}={}){
 store.db.exec(`CREATE TABLE IF NOT EXISTS production_submissions (
  id TEXT PRIMARY KEY, client_hash TEXT NOT NULL, request_hash TEXT NOT NULL, created INTEGER NOT NULL,
  updated INTEGER NOT NULL, state TEXT NOT NULL, payload TEXT NOT NULL, reference TEXT,
  airtable_id TEXT, folder TEXT, upload_link TEXT, review_stage TEXT
 ); CREATE UNIQUE INDEX IF NOT EXISTS production_reference_once ON production_submissions(reference) WHERE reference IS NOT NULL;
 CREATE TABLE IF NOT EXISTS production_control (name TEXT PRIMARY KEY, value TEXT NOT NULL);
 INSERT OR IGNORE INTO production_control(name,value) VALUES('paused','0');`);
 // A crash during dispatch has an unknown downstream outcome; never replay it.
 store.db.prepare("UPDATE production_submissions SET state='unknown',updated=? WHERE state='dispatching'").run(Date.now());
 const paused=()=>store.db.prepare("SELECT value FROM production_control WHERE name='paused'").get().value==='1';
 const staff=req=>safeEqual(req.get('Authorization'),'Bearer '+config.staffSecret);
 const trusted=req=>safeEqual(req.get('Authorization'),'Bearer '+config.bindSecret);
 const sameOrigin=req=>{
  const origin=req.get('Origin');
  if(origin)return config.origins.includes(origin);
  if(config.publicOrigin&&req.get('Host')===new URL(config.publicOrigin).host&&req.get('Sec-Fetch-Site')==='same-origin')return true;
  // Some Chromium builds omit Origin for an allowed cross-port request on
  // the same site. In that case require both Fetch Metadata and an exact
  // approved Referer origin; a missing Referer never opens this fallback.
  if(req.get('Sec-Fetch-Site')==='same-site'){
   try{return config.origins.includes(new URL(req.get('Referer')).origin);}catch(_){return false;}
  }
  return false;
 };
 const publicState=row=>({submissionId:row.id,state:row.state,
  ...(row.state==='complete'?{uploadLink:row.upload_link,artworkStatus:row.reference?'queued':'not_supplied'}:{}),
  ...(['unknown','manual_review'].includes(row.state)?{outcomeUncertain:true}:{})});
 let closed=false,inFlight=null;
 async function dispatch(){
  store.db.prepare("UPDATE production_submissions SET state='unknown',updated=? WHERE state='processing' AND updated<?")
   .run(Date.now(),Date.now()-10*60*1000);
  // Pausing stops new acceptance, not work already durably accepted.
  if(closed||inFlight||!available(config))return;
  const row=store.db.prepare("SELECT * FROM production_submissions WHERE state='queued' ORDER BY created,id LIMIT 1").get();
  if(!row||!store.db.prepare("UPDATE production_submissions SET state='dispatching',updated=? WHERE id=? AND state='queued'").run(Date.now(),row.id).changes)return;
  inFlight=(async()=>{
   try{
    const response=await fetchImpl(config.productionWebhookUrl,{method:'POST',headers:{'Content-Type':'application/json','x-make-apikey':config.productionMakeApiKey},
     body:JSON.stringify({...JSON.parse(row.payload),'Submission ID':row.id,'Request Fingerprint':row.request_hash,'Artwork Attached':row.reference?'Yes':'No'}),signal:AbortSignal.timeout(25000)});
    if(!response.ok)throw Error('Make did not accept the order');
    // A Make "Accepted" response confirms queueing, not Airtable creation.
    // A trusted final outcome callback must pin the actual row and folder.
    const body=await response.text();
    if(body!=='Accepted')throw Error('Unexpected intake acknowledgement');
    store.db.prepare("UPDATE production_submissions SET state='processing',updated=? WHERE id=? AND state='dispatching'").run(Date.now(),row.id);
   }catch(_){store.db.prepare("UPDATE production_submissions SET state='unknown',updated=? WHERE id=? AND state='dispatching'").run(Date.now(),row.id);}
  })();
  try{await inFlight;}finally{inFlight=null;}
 }
 const timer=setInterval(()=>{void dispatch().catch(()=>console.warn('Production intake requires reconciliation'));},Math.max(50,interval));timer.unref();
 if(available(config))queueMicrotask(()=>{void dispatch().catch(()=>{});});
 app.post('/v1/production-orders',express.json({limit:'16kb'}),(req,res)=>{
  if(!available(config)||paused())return res.status(503).json({error:'Order intake is temporarily unavailable'});
  if(!sameOrigin(req))return res.status(403).json({error:'Order origin is not allowed'});
  const v=req.body||{},id=v.submissionId,key=v.clientKey,reference=v.artworkReference||'';
  if(typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['submissionId','clientKey','artworkReference','fields'].includes(k))||
   !UUID.test(id||'')||typeof key!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(key)||
   typeof reference!=='string'||(reference&&!REFERENCE.test(reference)))return res.status(422).json({error:'Invalid order submission'});
  let fields;try{fields=validateFields(v.fields);}catch(e){return res.status(422).json({error:e.message});}
  const clientHash=hash(key),requestHash=hash(JSON.stringify({fields,reference}));
  const existing=store.db.prepare('SELECT * FROM production_submissions WHERE id=?').get(id);
  if(existing){
   if(!safeEqual(existing.client_hash,clientHash)||existing.request_hash!==requestHash)return res.status(409).json({error:'Submission ID already belongs to a different order'});
   return res.status(existing.state==='complete'?200:['unknown','manual_review'].includes(existing.state)?409:202).json(publicState(existing));
  }
  if(reference){
   const [,jobId,token]=REFERENCE.exec(reference),job=store.authorize(jobId,token);
   if(!job||job.state!=='ready'||job.binding)return res.status(422).json({error:'Artwork is not ready or is already used'});
   if(store.db.prepare('SELECT id FROM production_submissions WHERE reference=?').get(reference))return res.status(409).json({error:'Artwork already belongs to another submission'});
  }
  const capacity=store.db.prepare("SELECT count(*) AS recent,sum(CASE WHEN state!='complete' THEN 1 ELSE 0 END) AS pending FROM production_submissions WHERE created>=?").get(Date.now()-86400000);
  if(capacity.recent>=200||capacity.pending>=100)return res.status(429).json({error:'Order intake is busy; please contact Crosstalk'});
  const now=Date.now();
  store.db.prepare("INSERT INTO production_submissions(id,client_hash,request_hash,created,updated,state,payload,reference) VALUES(?,?,?,?,?,'queued',?,?)")
   .run(id,clientHash,requestHash,now,now,JSON.stringify(fields),reference||null);
  res.status(202).json({submissionId:id,state:'queued'});
 });
 app.get('/v1/production-orders/:id',(req,res)=>{
  if(!available(config)||!sameOrigin(req))return res.status(403).json({error:'Order session unavailable'});
  if(!UUID.test(req.params.id)||!/^[A-Za-z0-9_-]{43}$/.test(req.get('x-order-key')||''))return res.status(422).json({error:'Invalid order session'});
  const row=store.db.prepare('SELECT * FROM production_submissions WHERE id=?').get(req.params.id);
  if(!row||!safeEqual(row.client_hash,hash(req.get('x-order-key'))))return res.status(404).json({error:'Order session not found'});
  res.json(publicState(row));
 });
 app.post('/internal/production-outcome',express.json({limit:'4kb'}),(req,res)=>{
  if(!available(config)||!trusted(req))return res.status(401).json({error:'Unauthorised'});
  const v=req.body||{},id=v.submissionId;
  if(!UUID.test(id||'')||!RECORD.test(v.airtableRecordId||'')||!/^[a-f0-9]{64}$/.test(v.requestFingerprint||'')||
   !['complete','manual_review'].includes(v.state)||typeof v.folder!=='string'||
   (v.state==='complete'&&(!uploadRequestLink(v.uploadLink)||v.reviewStage!==undefined))||
   (v.state==='manual_review'&&(!/^[a-z_]{3,50}$/.test(v.reviewStage||'')||v.uploadLink!==undefined)))return res.status(422).json({error:'Invalid outcome'});
  let binding;try{binding=validateBinding({orderId:v.airtableRecordId,folder:v.folder},config.dropboxRoot);}catch(_){return res.status(422).json({error:'Invalid returned folder'});}
  const row=store.db.prepare('SELECT * FROM production_submissions WHERE id=?').get(id);
  if(!row||row.request_hash!==v.requestFingerprint||!['dispatching','processing','unknown','manual_review','complete'].includes(row.state)||
   (row.airtable_id&&row.airtable_id!==v.airtableRecordId)||
   (row.folder&&row.folder!==v.folder)||row.state==='complete'&&(v.state!=='complete'||row.upload_link!==v.uploadLink))
   return res.status(409).json({error:'Outcome conflicts with the accepted order'});
  if(v.state==='complete'&&row.reference){
   const [,jobId,token]=REFERENCE.exec(row.reference),job=store.authorize(jobId,token);
   if(!job)return res.status(409).json({error:'Artwork reference unavailable'});
   const pinned=JSON.stringify(binding);
   if(job.binding&&job.binding!==pinned)return res.status(409).json({error:'Artwork belongs to a different order'});
   if(!job.binding){
    if(job.state!=='ready')return res.status(409).json({error:'Artwork not ready'});
    store.db.prepare("UPDATE jobs SET binding=?,state='queued' WHERE id=? AND state='ready' AND binding IS NULL").run(pinned,jobId);
   }
  }
  if(row.state==='complete')return res.json({state:'complete',submissionId:id});
  store.db.prepare('UPDATE production_submissions SET state=?,updated=?,airtable_id=?,folder=?,upload_link=?,review_stage=? WHERE id=?')
   .run(v.state,Date.now(),v.airtableRecordId,v.folder,v.uploadLink||null,v.reviewStage||null,id);
  res.json({state:v.state,submissionId:id});
 });
 app.post('/internal/production-pause',express.json({limit:'1kb'}),(req,res)=>{
  if(!available(config)||!staff(req))return res.status(401).json({error:'Unauthorised'});
  if(typeof req.body?.paused!=='boolean')return res.status(422).json({error:'Paused must be a boolean'});
  store.db.prepare("UPDATE production_control SET value=? WHERE name='paused'").run(req.body.paused?'1':'0');
  res.json({paused:paused()});
 });
 app.get('/internal/production-ledger',(req,res)=>{
  if(!available(config)||!staff(req))return res.status(401).json({error:'Unauthorised'});
  const rows=store.db.prepare("SELECT id,created,updated,state,airtable_id,reference IS NOT NULL AS has_artwork,review_stage FROM production_submissions ORDER BY created,id").all();
  res.json({paused:paused(),items:rows.map(r=>({submissionId:r.id,createdAt:r.created,updatedAt:r.updated,state:r.state,airtableRecordId:r.airtable_id||null,hasArtwork:!!r.has_artwork,reviewStage:r.review_stage||null}))});
 });
 return {async close(){closed=true;clearInterval(timer);if(inFlight)await inFlight;}};
}
module.exports={installProductionOrders,available,validateFields};
