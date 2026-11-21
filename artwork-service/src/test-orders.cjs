'use strict';
const crypto=require('node:crypto'),path=require('node:path');
const {validateBinding}=require('./delivery.cjs');

const NAME='TEST JOSH 21.11';
const ROOT='/Crosstalk Customs/JOSH TEST';
const MAX_ORDERS=30;
const TEST_ADDRESS=Object.freeze({
 'Street Address':'1 TEST ONLY LANE',
 Suburb:'TESTVILLE',
 Postcode:'0000',
 State:'NSW'
});
// Match the copied JOSH TEST calculator's displayed estimate. This checks
// internal consistency; a browser flag does not establish artist eligibility.
const PRICE_CENTS=Object.freeze({
 regular:{base:{'7':8500,'10':10000,'12':12500},colour:1500,printed:4000,custom:5500},
 artist:{base:{'7':3700,'10':4250,'12':5810},colour:1000,printed:2500,custom:3500}
});
const LP_SIDES='ABCDEFGH';
const SESSION_COOKIE='crosstalk_josh_session';
const SESSION_SECONDS=24*60*60;
const PROCESSING_TIMEOUT_MS=10*60*1000;
const FORM_FIELDS=new Set([
 'Artist Order','Customer Name','Email','Custom Field 1','Estimated Price Given',
 'Extras','Packaging','Postcode','Quantity','Record Size','Rush',
 'Shipping Required','Side A Length','Side B Length','Sides','Speed','State',
 'Street Address','Suburb','Tracklist','Vinyl Colour','Artwork Job ID',
 'Delivery Method','Submission ID'
]);
function intakeFields(fields,id,artworkJobId,config){
 if(!fields||typeof fields!=='object'||Array.isArray(fields)||
   Object.keys(fields).some(key=>!FORM_FIELDS.has(key)))throw Error('Invalid test order fields');
 function value(key,max=120){
  const v=fields[key];
  if(typeof v!=='string'||v.length>max||/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v))throw Error('Invalid '+key);
  return v;
 }
 function choice(key,choices){
  const v=value(key);
  if(!choices.includes(v))throw Error('Invalid '+key);
  return v;
 }
 const name=choice('Customer Name',[NAME]);
 const email=choice('Email',[config.testRecipient]);
 const phone=choice('Custom Field 1',['0400000000']);
 const shipping=choice('Shipping Required',['on','off']);
 const delivery=shipping==='on'?'Shipping':'Pickup';
 if(fields['Delivery Method']!==undefined&&fields['Delivery Method']!==delivery)throw Error('Invalid Delivery Method');
 if(fields['Submission ID']!==undefined&&fields['Submission ID']!==id)throw Error('Invalid Submission ID');
 if(fields['Artwork Job ID']!==undefined&&fields['Artwork Job ID']!==artworkJobId)throw Error('Artwork job does not match the design');
 for(const [key,synthetic] of Object.entries(TEST_ADDRESS)){
  const entered=fields[key]===undefined?'':value(key);
  if(entered!==''&&entered!==synthetic)throw Error('Only the fixed synthetic test address is allowed');
  if(shipping==='on'&&entered!==synthetic)throw Error('The synthetic shipping address is required');
 }
 const quantity=value('Quantity');
 if(!/^[1-9]\d{0,2}$/.test(quantity)||Number(quantity)>100)throw Error('Invalid Quantity');
 const price=value('Estimated Price Given');
 if(price&&!/^\d{1,5}(?:\.\d{1,2})?$/.test(price))throw Error('Invalid Estimated Price Given');
 const mapped={
  'Artist Order':choice('Artist Order',['Yes','No']),
  'Customer Name':name,Email:email,'Custom Field 1':phone,
  'Estimated Price Given':price,Extras:value('Extras',250),
  Packaging:choice('Packaging',['Standard','Printed Jacket + Labels','Custom Finish Pack']),
  Quantity:quantity,'Record Size':choice('Record Size',['7','10','12']),
  Rush:choice('Rush',['on','off']),'Shipping Required':shipping,
  'Side A Length':value('Side A Length',160),'Side B Length':value('Side B Length',160),
  Sides:choice('Sides',['Double']),Speed:choice('Speed',['33 RPM','45 RPM']),
  Tracklist:value('Tracklist',4000),
  'Vinyl Colour':choice('Vinyl Colour',['Clear','Black','Red']),
  'Delivery Method':delivery,
  ...Object.fromEntries(Object.keys(TEST_ADDRESS).map(key=>[key,shipping==='on'?TEST_ADDRESS[key]:'']))
 };
 const extras=[mapped['Vinyl Colour']==='Red'?'Transparent Red vinyl':mapped['Vinyl Colour']==='Black'?'Black vinyl':'',
  mapped.Packaging==='Standard'?'':mapped.Packaging].filter(Boolean).join(' | ');
 if(mapped.Extras!==extras)throw Error('Order extras do not match the selected options');
 if(mapped['Side B Length']!=='')throw Error('Invalid Side B Length');
 if(mapped['Side A Length']!=='')throw Error('Promotions are unavailable in JOSH TEST');
 const size=mapped['Record Size'],speed=mapped.Speed,first=mapped.Tracklist.split('\n',1)[0];
 let discs=1;
 if(first.startsWith('FORMAT: >4LP')){
  if(first!==`FORMAT: >4LP | CUSTOM QUOTE REQUIRED | ${size}in | ${speed}`)throw Error('Invalid tracklist format');
  discs=5;
 }else if(size==='12'){
  const count=/^FORMAT: ([1-4])xLP \|/.exec(first);
  if(!count)throw Error('Invalid tracklist format');
  discs=Number(count[1]);
  const expected=`FORMAT: ${discs}xLP | ${discs} disc${discs===1?'':'s'} | ${discs*2} sides (A-${LP_SIDES[discs*2-1]}) | 12in | ${speed}`;
  if(first!==expected)throw Error('Invalid tracklist format');
 }else if(first!==`FORMAT: 1 disc | 1 disc | 2 sides (A-B) | ${size}in | ${speed}`)throw Error('Invalid tracklist format');
 if(size==='7'&&speed!=='45 RPM')throw Error('Invalid playback speed');
 if(discs>1&&(size!=='12'||quantity!=='1'||mapped['Artist Order']!=='No'))throw Error('Invalid multi-LP options');
 let cents=null;
 if(discs<=2){
  const rates=PRICE_CENTS[mapped['Artist Order']==='Yes'?'artist':'regular'];
  cents=discs===2?22500:rates.base[size]*Number(quantity);
  if(mapped.Packaging==='Custom Finish Pack')cents+=rates.custom;
  else{
   if(mapped['Vinyl Colour']!=='Clear')cents+=rates.colour;
   if(mapped.Packaging==='Printed Jacket + Labels')cents+=discs===2?6000:rates.printed;
  }
  if(mapped.Rush==='on')cents+=8000;
  if(shipping==='on')cents+=2000;
 }
 if(price!==(cents===null?'':(cents/100).toFixed(2)))throw Error('Estimated price does not match the selected options');
 return mapped;
}
function safeEqual(a,b){
 if(typeof a!=='string'||typeof b!=='string')return false;
 const left=Buffer.from(a),right=Buffer.from(b);
 return left.length===right.length&&crypto.timingSafeEqual(left,right);
}
// The test browser sees only a job ID. Keep its draft capability encrypted on
// the server until a matching, signed browser session submits the same order.
function sealDraftToken(token,id,config){
 const key=crypto.createHash('sha256').update('JOSH TEST draft encryption:'+config.bindSecret).digest();
 const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
 cipher.setAAD(Buffer.from('JOSH TEST artwork job:'+id));
 const bytes=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);
 return [iv,bytes,cipher.getAuthTag()].map(part=>part.toString('base64url')).join('.');
}
function openDraftToken(sealed,id,config){
 if(typeof sealed!=='string')return null;
 const parts=sealed.split('.');if(parts.length!==3)return null;
 try{
  const [iv,bytes,tag]=parts.map(part=>Buffer.from(part,'base64url'));
  if(iv.length!==12||tag.length!==16)return null;
  const key=crypto.createHash('sha256').update('JOSH TEST draft encryption:'+config.bindSecret).digest();
  const decipher=crypto.createDecipheriv('aes-256-gcm',key,iv);
  decipher.setAAD(Buffer.from('JOSH TEST artwork job:'+id));decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(bytes),decipher.final()]).toString('utf8');
 }catch(_){return null;}
}
function browserSessionHash(req,config){
 const pair=(req.get('Cookie')||'').split(';').map(value=>value.trim()).find(value=>value.startsWith(SESSION_COOKIE+'='));
 const raw=pair?.slice(SESSION_COOKIE.length+1)||'';
 const match=/^([0-9a-z]+)\.([A-Za-z0-9_-]{43})\.([A-Za-z0-9_-]{43})$/.exec(raw);
 if(!match)return null;
 const issued=Number.parseInt(match[1],36),now=Math.floor(Date.now()/1000);
 if(!Number.isSafeInteger(issued)||issued>now+60||now-issued>SESSION_SECONDS)return null;
 const signature=crypto.createHmac('sha256',config.bindSecret).update('JOSH TEST browser session:'+match[1]+'.'+match[2]).digest('base64url');
 if(!safeEqual(match[3],signature))return null;
 return crypto.createHash('sha256').update(raw).digest('hex');
}
function issueBrowserSession(res,config){
 const issued=Math.floor(Date.now()/1000).toString(36),nonce=crypto.randomBytes(32).toString('base64url');
 const signature=crypto.createHmac('sha256',config.bindSecret).update('JOSH TEST browser session:'+issued+'.'+nonce).digest('base64url');
 const secure=config.publicOrigin?.startsWith('https://')?'; Secure':'';
 res.set('Set-Cookie',`${SESSION_COOKIE}=${issued}.${nonce}.${signature}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; SameSite=Strict${secure}`);
}
function testOnly(config){
 let url;
 try{url=new URL(config.testWebhookUrl);}catch(_){return false;}
 return testPreviewMode(config)&&config.mode==='dropbox'&&!!config.testMakeApiKey&&
  url.protocol==='https:'&&url.hostname==='hook.eu1.make.com'&&!url.username&&!url.password;
}
function testPreviewMode(config){
 return config.testLabel==='JOSH TEST'&&config.dropboxRoot===ROOT&&config.testRecipient==='delousedcomatorium@gmail.com'&&!!config.testAccessCode;
}
function authorized(req,config){
 const match=/^Basic ([A-Za-z0-9+/=]+)$/.exec(req.get('Authorization')||'');
 let credentials='';try{credentials=match&&Buffer.from(match[1],'base64').toString('utf8');}catch(_){}
 return safeEqual(credentials,'tester:'+config.testAccessCode);
}
function protectPreview(app,config){
 app.use((req,res,next)=>{
  // Static file serving decodes percent-encoded paths. Gate the same canonical
  // path so an encoded filename cannot bypass the preview password.
  let pathname;
  try{pathname=path.posix.normalize(decodeURIComponent(req.path));}
  catch(_){return res.status(400).json({error:'Invalid request path'});}
  if(!['/calculator-preview.html','/designer.html','/v1/test-orders','/v1/test-config'].includes(pathname))return next();
  const html=pathname==='/calculator-preview.html'||pathname==='/designer.html';
  if(html&&config.testLabel==='JOSH TEST'){
   res.locals.privatePreview=true;
   res.set({'Content-Security-Policy':"frame-ancestors 'none'",'X-Frame-Options':'DENY'});
  }
  if(!config.testAccessCode&&pathname==='/designer.html'&&config.testLabel!=='JOSH TEST')return next();
  if(!config.testAccessCode&&html)return res.status(503).json({error:'JOSH TEST preview access is closed'});
  if(!config.testAccessCode||!authorized(req,config))return res.status(401).set('WWW-Authenticate','Basic realm="Crosstalk Customs JOSH TEST", charset="UTF-8"').json({error:'Tester access required'});
  if(pathname==='/calculator-preview.html'&&testPreviewMode(config)&&!browserSessionHash(req,config))issueBrowserSession(res,config);
  next();
 });
}
function installTestOrders(app,store,config,{fetchImpl=fetch,interval=1000}={}){
 store.db.exec(`CREATE TABLE IF NOT EXISTS test_submissions (
  id TEXT PRIMARY KEY, created INTEGER NOT NULL, reference_id TEXT NOT NULL,
  state TEXT NOT NULL, response TEXT, request_hash TEXT, browser_hash TEXT,
  payload TEXT, updated INTEGER, accepted_at INTEGER, airtable_id TEXT,
  review_stage TEXT
 );
 CREATE TABLE IF NOT EXISTS test_draft_sessions (
  job_id TEXT PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL, browser_hash TEXT NOT NULL, token_sealed TEXT
 )`);
 if(!store.db.prepare('PRAGMA table_info(test_submissions)').all().some(column=>column.name==='request_hash'))
  store.db.exec('ALTER TABLE test_submissions ADD COLUMN request_hash TEXT');
 if(!store.db.prepare('PRAGMA table_info(test_submissions)').all().some(column=>column.name==='browser_hash'))
  store.db.exec('ALTER TABLE test_submissions ADD COLUMN browser_hash TEXT');
 const submissionColumns=new Set(store.db.prepare('PRAGMA table_info(test_submissions)').all().map(column=>column.name));
 for(const [name,type] of Object.entries({payload:'TEXT',updated:'INTEGER',accepted_at:'INTEGER',airtable_id:'TEXT',review_stage:'TEXT'}))
  if(!submissionColumns.has(name))store.db.exec('ALTER TABLE test_submissions ADD COLUMN '+name+' '+type);
 if(!store.db.prepare('PRAGMA table_info(test_draft_sessions)').all().some(column=>column.name==='token_sealed'))
  store.db.exec('ALTER TABLE test_draft_sessions ADD COLUMN token_sealed TEXT');
 // The atomic dispatch claim precedes the network call. A restart cannot
 // distinguish "not sent" from "accepted by Make" after that claim.
 store.db.prepare("UPDATE test_submissions SET state='unknown',updated=? WHERE state IN ('sending','dispatching')").run(Date.now());
 let closed=false,inFlight=null;
 function sameBrowserOrigin(req){
  return (req.get('Origin')===config.publicOrigin||(!req.get('Origin')&&req.get('Sec-Fetch-Site')==='same-origin'))&&
   req.get('Host')===new URL(config.publicOrigin).host;
 }
 function deliveryState(referenceId){
  if(!referenceId)return {artworkStatus:'not_supplied',deliveryPending:false,deliveryVerified:false,deliveryFailed:false};
  const job=store.get(referenceId);
  if(!job)return {artworkStatus:'not_verifiable',deliveryPending:false,deliveryVerified:false,deliveryFailed:false};
  let receipt;
  try{receipt=JSON.parse(job.delivery_receipt);}catch(_){}
  const verified=job.state==='delivered'&&receipt?.verified===true&&
   Number.isSafeInteger(receipt.bytes)&&receipt.bytes>=0&&/^[a-f0-9]{64}$/.test(receipt.contentHash||'');
  if(verified)return {artworkStatus:'delivered',deliveryPending:false,deliveryVerified:true,deliveryFailed:false};
  if(job.state==='failed')return {artworkStatus:'failed',deliveryPending:false,deliveryVerified:false,deliveryFailed:true};
  if(job.state==='delivered')return {artworkStatus:'not_verifiable',deliveryPending:false,deliveryVerified:false,deliveryFailed:false};
  return {artworkStatus:job.state==='processing'?'processing':'bound',deliveryPending:true,deliveryVerified:false,deliveryFailed:false};
 }
 function publicState(row){
  if(row.state==='complete'){
   const saved=JSON.parse(row.response);
   return row.reference_id?{...saved,...deliveryState(row.reference_id)}:saved;
  }
  const uncertain=['unknown','manual_review'].includes(row.state);
  return {testOrderId:row.id,state:row.state,...deliveryState(row.reference_id),
   ...(uncertain?{outcomeUncertain:true}:{})};
 }
 function makePayload(row){
  const mapped=JSON.parse(row.payload);
  if(row.reference_id){
   const linked=store.db.prepare('SELECT order_id,browser_hash,token_sealed FROM test_draft_sessions WHERE job_id=?').get(row.reference_id);
   if(!linked||linked.order_id!==row.id||linked.browser_hash!==row.browser_hash)throw Error('Artwork session mismatch');
   const job=store.get(row.reference_id);
   if(!linked.token_sealed||!job||job.state!=='ready')throw Error('Artwork unavailable for intake');
  }
  const summary=['Record size','Speed','Quantity','Vinyl Colour','Packaging','Estimated Price Given','Tracklist'].map(k=>{
   const key=k==='Record size'?'Record Size':k;
   return k+': '+mapped[key].slice(0,k==='Tracklist'?1200:100);
  }).join('\n');
  return {testLabel:'JOSH TEST',...mapped,
   'Submission ID':row.id,'Request Fingerprint':row.request_hash,
   'Artwork Job ID':row.reference_id,'Test Order Name':NAME,
   'Test Order ID':row.id,
   'Test Summary':'JOSH TEST ONLY — estimate matches preview arithmetic; artist eligibility and final quote require staff verification. Do not invoice.\n'+summary};
 }
 async function dispatch(){
  if(closed||inFlight||!testOnly(config))return;
  store.db.prepare("UPDATE test_submissions SET state='unknown',updated=? WHERE state='processing' AND accepted_at<?").run(Date.now(),Date.now()-PROCESSING_TIMEOUT_MS);
  const row=store.db.prepare("SELECT * FROM test_submissions WHERE state='queued' ORDER BY created,id LIMIT 1").get();
  if(!row)return;
  const now=Date.now();
  if(!store.db.prepare("UPDATE test_submissions SET state='dispatching',updated=? WHERE id=? AND state='queued'").run(now,row.id).changes)return;
  inFlight=(async()=>{
   try{
    const payload=makePayload(row);
    const response=await fetchImpl(config.testWebhookUrl,{method:'POST',headers:{'Content-Type':'application/json','x-make-apikey':config.testMakeApiKey},body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});
    if(!response.ok)throw Error('Make did not accept the test submission');
    // A sequential Make webhook may acknowledge its queue before any Airtable
    // claim exists. Its documented default response is exactly 200 Accepted.
    // Treat it only as queue acceptance; the authenticated final callback
    // supplies and pins the actual Airtable record ID. Never retry an uncertain
    // dispatch, including when the queue later stalls.
    let result;
    if(response.status===200&&typeof response.text==='function'){
     const body=await response.text();
     if(body==='Accepted'){
      store.db.prepare("UPDATE test_submissions SET state='processing',accepted_at=?,updated=? WHERE id=? AND state='dispatching'")
       .run(Date.now(),Date.now(),row.id);
      return;
     }
     result=JSON.parse(body);
    }else result=await response.json();
    if(result.testLabel!=='JOSH TEST'||result.submissionId!==row.id||result.requestFingerprint!==row.request_hash||result.state!=='accepted'||
      !/^rec[A-Za-z0-9]{14}$/.test(result.airtableRecordId))
     throw Error('Unexpected Make acknowledgement');
    const current=store.db.prepare('SELECT airtable_id FROM test_submissions WHERE id=?').get(row.id);
    if(current.airtable_id&&current.airtable_id!==result.airtableRecordId)throw Error('Conflicting Airtable claim');
    // The authenticated final callback can race ahead of the HTTP response.
    store.db.prepare("UPDATE test_submissions SET state='processing',airtable_id=?,accepted_at=?,updated=? WHERE id=? AND state='dispatching' AND (airtable_id IS NULL OR airtable_id=?)")
     .run(result.airtableRecordId,Date.now(),Date.now(),row.id,result.airtableRecordId);
   }catch(_){
    // A timeout or failed response can still follow downstream side effects.
    store.db.prepare("UPDATE test_submissions SET state='unknown',updated=? WHERE id=? AND state='dispatching'").run(Date.now(),row.id);
   }
  })();
  try{await inFlight;}finally{inFlight=null;}
 }
 function runDispatch(){void dispatch().catch(()=>console.warn('JOSH TEST intake worker needs operator review'));}
 const timer=setInterval(runDispatch,Math.max(50,interval));timer.unref();
 queueMicrotask(runDispatch);
 function staffAccess(req,res,next){
  if(config.testLabel!=='JOSH TEST'||config.dropboxRoot!==ROOT)return res.status(503).json({error:'JOSH TEST staff view is unavailable'});
  if(!config.staffSecret)return res.status(503).json({error:'Staff recovery access is not configured'});
  if(!safeEqual(req.get('Authorization'),'Bearer '+config.staffSecret))return res.status(401).json({error:'Unauthorised'});
  next();
 }
 function safeRow(row){return {testOrderId:row.id,createdAt:row.created,updatedAt:row.updated||row.created,state:row.state,
  hasArtwork:!!row.reference_id,artworkJobId:row.reference_id||null};}
 app.get('/internal/test-submissions',staffAccess,(req,res)=>{
  const limit=req.query.limit??'25',offset=req.query.offset??'0',state=req.query.state??'uncertain';
  if(typeof limit!=='string'||!/^[1-9][0-9]*$/.test(limit)||Number(limit)>100||
     typeof offset!=='string'||!/^(0|[1-9][0-9]*)$/.test(offset)||Number(offset)>100000||
     typeof state!=='string'||!['uncertain','queued','dispatching','processing','unknown','manual_review','complete'].includes(state))return res.status(422).json({error:'Invalid test submission query'});
  const where=state==='uncertain'?"state IN ('unknown','manual_review')":'state=?';
  const query=`SELECT id,created,updated,state,reference_id FROM test_submissions WHERE ${where} ORDER BY created DESC,id DESC LIMIT ? OFFSET ?`;
  const args=state==='uncertain'?[Number(limit)+1,Number(offset)]:[state,Number(limit)+1,Number(offset)];
  const rows=store.db.prepare(query).all(...args);
  res.json({items:rows.slice(0,Number(limit)).map(safeRow),nextOffset:rows.length>Number(limit)?Number(offset)+Number(limit):null});
 });
 app.get('/internal/test-submissions/:id',staffAccess,(req,res)=>{
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id))return res.status(422).json({error:'Invalid test order ID'});
  const row=store.db.prepare(`SELECT s.id,s.created,s.updated,s.state,s.reference_id,s.request_hash,s.review_stage,s.airtable_id,
    j.state AS artwork_state
    FROM test_submissions s LEFT JOIN jobs j ON j.id=s.reference_id WHERE s.id=?`).get(req.params.id);
  if(!row)return res.status(404).json({error:'Test submission not found'});
  res.json({...safeRow(row),requestFingerprint:row.request_hash||null,
   artworkState:row.artwork_state||null,...deliveryState(row.reference_id),
   needsReconciliation:['unknown','manual_review'].includes(row.state),reviewStage:row.review_stage||null,
   airtableRecordId:row.airtable_id||null});
 });
 function trusted(req){return testPreviewMode(config)&&safeEqual(req.get('Authorization'),'Bearer '+config.bindSecret);}
 function pinClaim(row,airtableId){
  if(!/^rec[A-Za-z0-9]{14}$/.test(airtableId)||
     !store.db.prepare('UPDATE test_submissions SET airtable_id=? WHERE id=? AND (airtable_id IS NULL OR airtable_id=?)').run(airtableId,row.id,airtableId).changes)return false;
  return true;
 }
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 const hash64=/^[a-f0-9]{64}$/;
 app.post('/internal/test-bind',require('express').json({limit:'4kb'}),(req,res)=>{
  if(!trusted(req))return res.status(401).json({error:'Unauthorised'});
  const v=req.body||{};
  if(typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['testLabel','submissionId','requestFingerprint','artworkJobId','airtableRecordId','folder'].includes(k))||
    v.testLabel!=='JOSH TEST'||!uuid.test(v.submissionId||'')||!hash64.test(v.requestFingerprint||'')||
    !/^[a-f0-9]{32}$/.test(v.artworkJobId||'')||!/^rec[A-Za-z0-9]{14}$/.test(v.airtableRecordId||'')||
    v.folder!==ROOT+'/'+v.submissionId+'/Uploads')return res.status(422).json({error:'Invalid JOSH TEST binding'});
  const row=store.db.prepare('SELECT * FROM test_submissions WHERE id=?').get(v.submissionId);
  if(!row||!['dispatching','processing','unknown','manual_review','complete'].includes(row.state)||
    row.request_hash!==v.requestFingerprint||row.reference_id!==v.artworkJobId)return res.status(409).json({error:'Test order binding does not match the claimed submission'});
  const linked=store.db.prepare('SELECT order_id,browser_hash,token_sealed FROM test_draft_sessions WHERE job_id=?').get(v.artworkJobId);
  if(!linked||linked.order_id!==row.id||linked.browser_hash!==row.browser_hash)return res.status(409).json({error:'Artwork does not belong to the claimed submission'});
  const token=openDraftToken(linked.token_sealed,v.artworkJobId,config),job=token&&store.authorize(v.artworkJobId,token);
  if(!job)return res.status(409).json({error:'Artwork is unavailable for binding'});
  const binding=JSON.stringify(validateBinding({orderId:v.airtableRecordId,folder:v.folder},ROOT));
  if(job.binding){
   if(job.binding!==binding||!pinClaim(row,v.airtableRecordId))return res.status(409).json({error:'Artwork is bound to a different test order'});
   return res.json({id:job.id,artwork_status:'already_bound',state:job.state});
  }
  if(config.mode!=='dropbox')return res.status(503).json({error:'JOSH TEST artwork delivery is disabled'});
  if(job.state!=='ready'||!pinClaim(row,v.airtableRecordId))return res.status(409).json({error:'Artwork is not ready for this test order'});
  const result=store.db.prepare("UPDATE jobs SET binding=?,state='queued' WHERE id=? AND state='ready' AND binding IS NULL").run(binding,job.id);
  if(!result.changes){
   const latest=store.get(job.id);
   if(latest?.binding===binding)return res.json({id:job.id,artwork_status:'already_bound',state:latest.state});
   return res.status(409).json({error:'Artwork binding changed'});
  }
  res.status(202).json({id:job.id,artwork_status:'bound',state:'queued'});
 });
 // Make can reconcile the worker's terminal outcome after its intake run has
 // ended. This is a read-only, test-only query using the existing trusted
 // connection; none of the identifiers or the request fingerprint go in a URL.
 app.post('/internal/test-delivery-status',require('express').json({limit:'4kb'}),(req,res)=>{
  if(!trusted(req))return res.status(401).json({error:'Unauthorised'});
  const v=req.body||{};
  if(typeof v!=='object'||Array.isArray(v)||
    Object.keys(v).some(k=>!['testLabel','submissionId','requestFingerprint','artworkJobId','airtableRecordId'].includes(k))||
    v.testLabel!=='JOSH TEST'||!uuid.test(v.submissionId||'')||!hash64.test(v.requestFingerprint||'')||
    !/^[a-f0-9]{32}$/.test(v.artworkJobId||'')||!/^rec[A-Za-z0-9]{14}$/.test(v.airtableRecordId||''))
   return res.status(422).json({error:'Invalid JOSH TEST delivery query'});
  const row=store.db.prepare('SELECT id,state,request_hash,reference_id,airtable_id FROM test_submissions WHERE id=?').get(v.submissionId);
  if(!row||row.state!=='complete'||row.request_hash!==v.requestFingerprint||
    row.reference_id!==v.artworkJobId||row.airtable_id!==v.airtableRecordId)
   return res.status(409).json({error:'Delivery query does not match a completed test order'});
  const job=store.get(row.reference_id);
  if(job?.binding!==JSON.stringify({orderId:row.airtable_id,folder:ROOT+'/'+row.id+'/Uploads'}))
   return res.status(409).json({error:'Artwork is not bound to this test order'});
  res.set('Cache-Control','private, no-store').json({testLabel:'JOSH TEST',submissionId:row.id,
   airtableRecordId:row.airtable_id,artworkJobId:row.reference_id,...deliveryState(row.reference_id)});
 });
 const reviewStages=new Set(['folder_uncertain','request_uncertain','open_uncertain','customer_email_uncertain','staff_email_uncertain','artwork_bind_uncertain','finalization_uncertain','callback_uncertain']);
 app.post('/internal/test-submissions/:id/outcome',require('express').json({limit:'4kb'}),(req,res)=>{
  if(!trusted(req))return res.status(401).json({error:'Unauthorised'});
  const v=req.body||{};
  if(!uuid.test(req.params.id)||typeof v!=='object'||Array.isArray(v)||
    Object.keys(v).some(k=>!['testLabel','submissionId','requestFingerprint','airtableRecordId','state','artwork_status','stage'].includes(k))||
    v.testLabel!=='JOSH TEST'||v.submissionId!==req.params.id||!hash64.test(v.requestFingerprint||'')||
    !/^rec[A-Za-z0-9]{14}$/.test(v.airtableRecordId||'')||!['complete','manual_review'].includes(v.state))
   return res.status(422).json({error:'Invalid JOSH TEST outcome'});
  if(v.state==='manual_review'&&(!reviewStages.has(v.stage)||v.artwork_status!==undefined)||
     v.state==='complete'&&(v.stage!==undefined||!['bound','already_bound','not_supplied'].includes(v.artwork_status)))
   return res.status(422).json({error:'Invalid JOSH TEST outcome'});
  const row=store.db.prepare('SELECT * FROM test_submissions WHERE id=?').get(req.params.id);
  if(!row||row.request_hash!==v.requestFingerprint||!['dispatching','processing','unknown','manual_review','complete'].includes(row.state)||
    (row.airtable_id&&row.airtable_id!==v.airtableRecordId))return res.status(409).json({error:'Outcome does not match the claimed test order'});
  if(v.state==='complete'){
   if((!row.reference_id)!==(v.artwork_status==='not_supplied'))return res.status(409).json({error:'Artwork outcome does not match this test order'});
   if(row.reference_id){
    const job=store.get(row.reference_id),expected=JSON.stringify({orderId:v.airtableRecordId,folder:ROOT+'/'+row.id+'/Uploads'});
    if(job?.binding!==expected)return res.status(409).json({error:'Artwork has not been bound to the claimed test order'});
   }
  }
  if(row.state==='complete'){
   if(v.state!=='complete'||JSON.parse(row.response).artworkStatus!==v.artwork_status)return res.status(409).json({error:'Test outcome already finalised differently'});
   return res.json({state:'complete',testOrderId:row.id});
  }
  if(row.state==='manual_review'&&v.state==='manual_review'){
   if(row.review_stage!==v.stage)return res.status(409).json({error:'Test review stage differs'});
   return res.json({state:'manual_review',testOrderId:row.id});
  }
  if(!pinClaim(row,v.airtableRecordId))return res.status(409).json({error:'Airtable claim differs'});
  if(v.state==='manual_review'){
   store.db.prepare("UPDATE test_submissions SET state='manual_review',review_stage=?,updated=? WHERE id=? AND state!='complete'").run(v.stage,Date.now(),row.id);
   return res.json({state:'manual_review',testOrderId:row.id});
  }
  const safe={testOrderId:row.id,state:'complete',artworkStatus:v.artwork_status,artworkId:row.reference_id,deliveryPending:!!row.reference_id};
  store.db.prepare("UPDATE test_submissions SET state='complete',response=?,review_stage=NULL,updated=? WHERE id=? AND state!='complete'").run(JSON.stringify(safe),Date.now(),row.id);
  res.json({state:'complete',testOrderId:row.id});
 });
 app.get('/v1/test-config',(_,res)=>{
  if(!testOnly(config))return res.status(503).json({error:'The JOSH TEST submission window is closed'});
  res.json({name:NAME,email:config.testRecipient,phone:'0400000000'});
 });
 app.post('/v1/test-orders',require('express').json({limit:'16kb'}),(req,res)=>{
  if(!testOnly(config))return res.status(503).json({error:'The JOSH TEST submission window is closed'});
  if(!sameBrowserOrigin(req))return res.status(403).json({error:'Invalid test page origin'});
  const body=req.body||{},id=body.testOrderId,artworkJobId=body.artworkJobId||'',fields=body.fields||{};
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(key=>!['testOrderId','artworkJobId','fields'].includes(key)))return res.status(422).json({error:'Invalid test submission'});
  if(typeof id!=='string'||!uuid.test(id))return res.status(422).json({error:'Invalid test order session'});
  const browserHash=browserSessionHash(req,config);
  if(!browserHash)return res.status(403).json({error:'JOSH TEST browser session is missing or expired. Reopen the test form and create new artwork.'});
  if(typeof artworkJobId!=='string'||(artworkJobId&&!/^[a-f0-9]{32}$/.test(artworkJobId)))return res.status(422).json({error:'Invalid artwork job'});
  if(fields['Customer Name']!==NAME||fields.Email!==config.testRecipient||fields['Custom Field 1']!=='0400000000')return res.status(422).json({error:'Only the fixed JOSH TEST identity is allowed'});
  if(Object.keys(fields).length>25||JSON.stringify(fields).length>10000)return res.status(422).json({error:'Test order is too large'});
  let mapped;
  try{mapped=intakeFields(fields,id,artworkJobId,config);}
  catch(error){return res.status(422).json({error:error.message});}
  const referenceId=artworkJobId;
  const requestHash=crypto.createHash('sha256').update(JSON.stringify({mapped,artworkJobId})).digest('hex');
  const existing=store.db.prepare('SELECT * FROM test_submissions WHERE id=?').get(id);
  if(existing){
   if(existing.browser_hash!==browserHash)return res.status(409).json({error:'Test session is already used by another browser session'});
   if(existing.reference_id!==referenceId)return res.status(409).json({error:'Test session already used for a different design'});
   if(existing.request_hash&&existing.request_hash!==requestHash)return res.status(409).json({error:'Test session already used for different order details'});
   if(existing.state==='complete')return res.json(publicState(existing));
   if(['unknown','manual_review','sending'].includes(existing.state))return res.status(409).json(publicState(existing));
   return res.status(202).json(publicState(existing));
  }
  if(artworkJobId){
   const linked=store.db.prepare('SELECT order_id,browser_hash,token_sealed FROM test_draft_sessions WHERE job_id=?').get(referenceId);
   if(!linked||linked.order_id!==id||linked.browser_hash!==browserHash)return res.status(422).json({error:'Artwork does not belong to this test order session or is not ready'});
   const token=openDraftToken(linked.token_sealed,referenceId,config);
   const job=token&&store.authorize(referenceId,token);
   if(!job||job.state!=='ready')return res.status(422).json({error:'Artwork does not belong to this test order session or is not ready'});
  }
  const count=store.db.prepare('SELECT count(*) AS n FROM test_submissions').get().n;
  if(count>=MAX_ORDERS)return res.status(429).json({error:'JOSH TEST has reached its submission limit'});
  const now=Date.now();
  store.db.prepare("INSERT INTO test_submissions(id,created,reference_id,state,request_hash,browser_hash,payload,updated) VALUES(?,?,?,'queued',?,?,?,?)")
   .run(id,now,referenceId,requestHash,browserHash,JSON.stringify(mapped),now);
  // A queued response means the request is durable on the isolated volume.
  // Make acceptance, email, Airtable and delivery remain unconfirmed.
  res.status(202).json(publicState({id,state:'queued',reference_id:referenceId}));
 });
 app.get('/v1/test-orders/:id',(req,res)=>{
  if(!testPreviewMode(config)||!sameBrowserOrigin(req)||!browserSessionHash(req,config))return res.status(403).json({error:'JOSH TEST session required'});
  if(!uuid.test(req.params.id))return res.status(422).json({error:'Invalid test order ID'});
  const row=store.db.prepare('SELECT * FROM test_submissions WHERE id=?').get(req.params.id);
  if(!row||row.browser_hash!==browserSessionHash(req,config))return res.status(404).json({error:'Test order not found in this browser session'});
  res.json(publicState(row));
 });
 return {async close(){closed=true;clearInterval(timer);if(inFlight)await inFlight;}};
}
module.exports={protectPreview,installTestOrders,NAME,testOnly,testPreviewMode,browserSessionHash,sealDraftToken};
