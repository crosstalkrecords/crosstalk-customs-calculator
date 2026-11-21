'use strict';
const crypto=require('node:crypto');

const NAME='TEST JOSH 21.11';
const ROOT='/Crosstalk Customs/JOSH TEST';
const MAX_ORDERS=30;
const TEST_ADDRESS=Object.freeze({
 'Street Address':'1 TEST ONLY LANE',
 Suburb:'TESTVILLE',
 Postcode:'0000',
 State:'NSW'
});
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
 if(price&&Number(price)>10000)throw Error('Invalid Estimated Price Given');
 return {
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
}
function safeEqual(a,b){
 return typeof a==='string'&&typeof b==='string'&&a.length===b.length&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));
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
  if(!['/calculator-preview.html','/designer.html','/v1/test-orders','/v1/test-config'].includes(req.path))return next();
  if(!config.testAccessCode&&['/calculator-preview.html','/designer.html'].includes(req.path))return next();
  if(!config.testAccessCode||!authorized(req,config))return res.status(401).set('WWW-Authenticate','Basic realm="Crosstalk Customs JOSH TEST", charset="UTF-8"').json({error:'Tester access required'});
  next();
 });
}
function installTestOrders(app,store,config,{fetchImpl=fetch}={}){
 store.db.exec(`CREATE TABLE IF NOT EXISTS test_submissions (
  id TEXT PRIMARY KEY, created INTEGER NOT NULL, reference_id TEXT NOT NULL,
  state TEXT NOT NULL, response TEXT, request_hash TEXT
 )`);
 if(!store.db.prepare('PRAGMA table_info(test_submissions)').all().some(column=>column.name==='request_hash'))
  store.db.exec('ALTER TABLE test_submissions ADD COLUMN request_hash TEXT');
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
   if(existing.state==='sending')return res.status(409).json({error:'Test submission is still being processed'});
  }else{
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
   'Submission ID':id,'Artwork Job ID':referenceId,'Test Order Name':NAME,
   'Test Order ID':id,'Test Summary':summary};
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
   return res.status(502).json({error:'Test submission could not be confirmed. Keep this page open and ask Crosstalk to check the test order ID.',testOrderId:id});
  }
 });
}
module.exports={protectPreview,installTestOrders,NAME};
