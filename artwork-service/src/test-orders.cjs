'use strict';
const crypto=require('node:crypto'),path=require('node:path');

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
const FORM_FIELDS=new Set([
 'Artist Order','Customer Name','Email','Custom Field 1','Estimated Price Given',
 'Extras','Packaging','Postcode','Quantity','Record Size','Rush',
 'Shipping Required','Side A Length','Side B Length','Sides','Speed','State',
 'Street Address','Suburb','Tracklist','Vinyl Colour','Artwork Reference',
 'Delivery Method','Submission ID'
]);
function intakeFields(fields,id,reference,config){
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
 if(fields['Artwork Reference']!==undefined&&fields['Artwork Reference']!==reference)throw Error('Artwork reference does not match the design');
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
 return config.testLabel==='JOSH TEST'&&config.dropboxRoot===ROOT&&config.testRecipient==='delousedcomatorium@gmail.com'&&config.mode==='dropbox'&&!!config.testWebhookUrl&&!!config.testAccessCode&&!!config.testMakeApiKey;
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
  if(pathname==='/calculator-preview.html'&&testOnly(config)&&!browserSessionHash(req,config))issueBrowserSession(res,config);
  next();
 });
}
function installTestOrders(app,store,config,{fetchImpl=fetch}={}){
 store.db.exec(`CREATE TABLE IF NOT EXISTS test_submissions (
  id TEXT PRIMARY KEY, created INTEGER NOT NULL, reference_id TEXT NOT NULL,
  state TEXT NOT NULL, response TEXT, request_hash TEXT
 );
 CREATE TABLE IF NOT EXISTS test_draft_sessions (
  job_id TEXT PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL, browser_hash TEXT NOT NULL
 )`);
 if(!store.db.prepare('PRAGMA table_info(test_submissions)').all().some(column=>column.name==='request_hash'))
  store.db.exec('ALTER TABLE test_submissions ADD COLUMN request_hash TEXT');
 // A request left in flight by a process restart has no trustworthy outcome.
 // Reconcile it against Make before any further submission with the same ID.
 store.db.prepare("UPDATE test_submissions SET state='unknown' WHERE state='sending'").run();
 function staffAccess(req,res,next){
  if(config.testLabel!=='JOSH TEST'||config.dropboxRoot!==ROOT)return res.status(503).json({error:'JOSH TEST staff view is unavailable'});
  if(!config.staffSecret)return res.status(503).json({error:'Staff recovery access is not configured'});
  if(!safeEqual(req.get('Authorization'),'Bearer '+config.staffSecret))return res.status(401).json({error:'Unauthorised'});
  next();
 }
 function safeRow(row){return {testOrderId:row.id,createdAt:row.created,state:row.state,
  hasArtwork:!!row.reference_id,artworkJobId:row.reference_id||null};}
 app.get('/internal/test-submissions',staffAccess,(req,res)=>{
  const limit=req.query.limit??'25',offset=req.query.offset??'0',state=req.query.state??'uncertain';
  if(typeof limit!=='string'||!/^[1-9][0-9]*$/.test(limit)||Number(limit)>100||
     typeof offset!=='string'||!/^(0|[1-9][0-9]*)$/.test(offset)||Number(offset)>100000||
     typeof state!=='string'||!['uncertain','unknown','sending','complete'].includes(state))return res.status(422).json({error:'Invalid test submission query'});
  const where=state==='uncertain'?"state IN ('unknown','sending')":'state=?';
  const query=`SELECT id,created,state,reference_id FROM test_submissions WHERE ${where} ORDER BY created DESC,id DESC LIMIT ? OFFSET ?`;
  const args=state==='uncertain'?[Number(limit)+1,Number(offset)]:[state,Number(limit)+1,Number(offset)];
  const rows=store.db.prepare(query).all(...args);
  res.json({items:rows.slice(0,Number(limit)).map(safeRow),nextOffset:rows.length>Number(limit)?Number(offset)+Number(limit):null});
 });
 app.get('/internal/test-submissions/:id',staffAccess,(req,res)=>{
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id))return res.status(422).json({error:'Invalid test order ID'});
  const row=store.db.prepare(`SELECT s.id,s.created,s.state,s.reference_id,s.request_hash,
    j.state AS artwork_state,CASE WHEN j.delivery_receipt IS NULL THEN 0 ELSE 1 END AS delivery_verified
    FROM test_submissions s LEFT JOIN jobs j ON j.id=s.reference_id WHERE s.id=?`).get(req.params.id);
  if(!row)return res.status(404).json({error:'Test submission not found'});
  res.json({...safeRow(row),requestFingerprint:row.request_hash||null,
   artworkState:row.artwork_state||null,deliveryVerified:!!row.delivery_verified,
   needsReconciliation:row.state==='unknown'||row.state==='sending'});
 });
 app.get('/v1/test-config',(_,res)=>{
  if(!testOnly(config))return res.status(503).json({error:'The JOSH TEST submission window is closed'});
  res.json({name:NAME,email:config.testRecipient,phone:'0400000000'});
 });
 app.post('/v1/test-orders',require('express').json({limit:'16kb'}),async(req,res)=>{
  if(!testOnly(config))return res.status(503).json({error:'The JOSH TEST submission window is closed'});
  const sameOrigin=req.get('Origin')===config.publicOrigin||(!req.get('Origin')&&req.get('Sec-Fetch-Site')==='same-origin');
  if(!sameOrigin||req.get('Host')!==new URL(config.publicOrigin).host)return res.status(403).json({error:'Invalid test page origin'});
  const url=new URL(config.testWebhookUrl);
  if(url.protocol!=='https:'||url.hostname!=='hook.eu1.make.com'||url.username||url.password)return res.status(503).json({error:'The JOSH TEST webhook is not configured safely'});
  const body=req.body||{},id=body.testOrderId,reference=body.artworkReference||'',fields=body.fields||{};
  if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return res.status(422).json({error:'Invalid test order session'});
  const browserHash=browserSessionHash(req,config);
  if(!browserHash)return res.status(403).json({error:'JOSH TEST browser session is missing or expired. Reopen the test form and create new artwork.'});
  if(typeof reference!=='string'||(reference&&!/^[a-f0-9]{32}\.[A-Za-z0-9_-]{43}$/.test(reference)))return res.status(422).json({error:'Invalid artwork reference'});
  if(fields['Customer Name']!==NAME||fields.Email!==config.testRecipient||fields['Custom Field 1']!=='0400000000')return res.status(422).json({error:'Only the fixed JOSH TEST identity is allowed'});
  if(Object.keys(fields).length>25||JSON.stringify(fields).length>10000)return res.status(422).json({error:'Test order is too large'});
  let mapped;
  try{mapped=intakeFields(fields,id,reference,config);}
  catch(error){return res.status(422).json({error:error.message});}
  const referenceId=reference?reference.split('.')[0]:'';
  const requestHash=crypto.createHash('sha256').update(JSON.stringify({mapped,reference})).digest('hex');
  const existing=store.db.prepare('SELECT * FROM test_submissions WHERE id=?').get(id);
  if(existing){
   if(existing.reference_id!==referenceId)return res.status(409).json({error:'Test session already used for a different design'});
   if(existing.request_hash&&existing.request_hash!==requestHash)return res.status(409).json({error:'Test session already used for different order details'});
   if(existing.state==='complete')return res.json(JSON.parse(existing.response));
   if(existing.state==='sending')return res.status(409).json({error:'Test submission is still being processed. Keep this page open and ask Crosstalk to check the test order ID.',testOrderId:id,outcomeUncertain:true});
   if(existing.state==='unknown')return res.status(409).json({error:'Test submission outcome is uncertain. Ask Crosstalk to check the test order ID before trying again.',testOrderId:id,outcomeUncertain:true});
  }
  if(reference){
   const linked=store.db.prepare('SELECT order_id,browser_hash FROM test_draft_sessions WHERE job_id=?').get(referenceId);
   const job=store.authorize(referenceId,reference.split('.')[1]);
   if(!linked||linked.order_id!==id||linked.browser_hash!==browserHash||!job||job.state!=='ready')return res.status(422).json({error:'Artwork does not belong to this test order session or is not ready'});
  }
  if(!existing){
   const count=store.db.prepare('SELECT count(*) AS n FROM test_submissions').get().n;
   if(count>=MAX_ORDERS)return res.status(429).json({error:'JOSH TEST has reached its submission limit'});
   store.db.prepare("INSERT INTO test_submissions(id,created,reference_id,state,request_hash) VALUES(?,?,?,'sending',?)").run(id,Date.now(),referenceId,requestHash);
  }
  store.db.prepare("UPDATE test_submissions SET state='sending',request_hash=coalesce(request_hash,?) WHERE id=?").run(requestHash,id);
  // The intake copy can map these live form field names to the isolated base.
  // Shipping fields are replaced with an unmistakably fictional address.
  const summary=['Record size','Speed','Quantity','Vinyl Colour','Packaging','Estimated Price Given','Tracklist'].map(k=>{
   const key=k==='Record size'?'Record Size':k;
   return k+': '+mapped[key].slice(0,k==='Tracklist'?1200:100);
  }).join('\n');
  const payload={testLabel:'JOSH TEST',...mapped,'Artwork Reference':reference,
   'Submission ID':id,'Request Fingerprint':requestHash,
   'Artwork Job ID':referenceId,'Test Order Name':NAME,
   'Test Order ID':id,'Test Summary':'JOSH TEST ONLY — estimate matches preview arithmetic; artist eligibility and final quote require staff verification. Do not invoice.\n'+summary};
  try{
   const response=await fetchImpl(config.testWebhookUrl,{method:'POST',headers:{'Content-Type':'application/json','x-make-apikey':config.testMakeApiKey},body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});
   if(!response.ok)throw Error('Make rejected the test submission');
   const result=await response.json();
   const allowed=reference?['bound','already_bound']:['not_supplied'];
   if(result.testLabel!=='JOSH TEST'||!allowed.includes(result.artwork_status))throw Error('Unexpected Make acknowledgement');
   const safe={testOrderId:id,artworkStatus:result.artwork_status,artworkId:referenceId,deliveryPending:!!reference};
   store.db.prepare("UPDATE test_submissions SET state='complete',response=? WHERE id=?").run(JSON.stringify(safe),id);
   return res.status(202).json(safe);
  }catch(_){
   store.db.prepare("UPDATE test_submissions SET state='unknown' WHERE id=?").run(id);
   return res.status(502).json({error:'Test submission could not be confirmed. Keep this page open and ask Crosstalk to check the test order ID.',testOrderId:id,outcomeUncertain:true});
  }
 });
}
module.exports={protectPreview,installTestOrders,NAME,testOnly,browserSessionHash};
