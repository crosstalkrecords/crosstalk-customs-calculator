'use strict';
const crypto=require('node:crypto');

const NAME='TEST JOSH 21.11';
const ROOT='/Crosstalk Customs/JOSH TEST';
const MAX_ORDERS=30;
function safeEqual(a,b){
 return typeof a==='string'&&typeof b==='string'&&a.length===b.length&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));
}
function testOnly(config){
 return config.testLabel==='JOSH TEST'&&config.dropboxRoot===ROOT&&config.testRecipient==='delousedcomatorium@gmail.com'&&config.mode==='dropbox'&&!!config.testWebhookUrl&&!!config.testAccessCode;
}
function authorized(req,config){
 const match=/^Basic ([A-Za-z0-9+/=]+)$/.exec(req.get('Authorization')||'');
 let credentials='';try{credentials=match&&Buffer.from(match[1],'base64').toString('utf8');}catch(_){}
 return safeEqual(credentials,'tester:'+config.testAccessCode);
}
function protectPreview(app,config){
 app.use((req,res,next)=>{
  if(!['/calculator-preview.html','/v1/test-orders','/v1/test-config'].includes(req.path))return next();
  if(!config.testAccessCode&&req.path==='/calculator-preview.html')return next();
  if(!config.testAccessCode||!authorized(req,config))return res.status(401).set('WWW-Authenticate','Basic realm="Crosstalk Customs JOSH TEST", charset="UTF-8"').json({error:'Tester access required'});
  next();
 });
}
function installTestOrders(app,store,config,{fetchImpl=fetch}={}){
 store.db.exec(`CREATE TABLE IF NOT EXISTS test_submissions (
  id TEXT PRIMARY KEY, created INTEGER NOT NULL, reference_id TEXT NOT NULL,
  state TEXT NOT NULL, response TEXT
 )`);
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
  const referenceId=reference?reference.split('.')[0]:'';
  const existing=store.db.prepare('SELECT * FROM test_submissions WHERE id=?').get(id);
  if(existing){
   if(existing.reference_id!==referenceId)return res.status(409).json({error:'Test session already used for a different design'});
   if(existing.state==='complete')return res.json(JSON.parse(existing.response));
   if(existing.state==='sending')return res.status(409).json({error:'Test submission is still being processed'});
  }else{
   const count=store.db.prepare('SELECT count(*) AS n FROM test_submissions').get().n;
   if(count>=MAX_ORDERS)return res.status(429).json({error:'JOSH TEST has reached its submission limit'});
   store.db.prepare("INSERT INTO test_submissions(id,created,reference_id,state) VALUES(?,?,?,'sending')").run(id,Date.now(),referenceId);
  }
  store.db.prepare("UPDATE test_submissions SET state='sending' WHERE id=?").run(id);
  // The submitted customer, email and phone are fixed above. Shipping details
  // are deliberately not forwarded to Make; the test never creates real orders.
  const summary=['Record size','Speed','Quantity','Vinyl Colour','Packaging','Estimated Price Given','Tracklist'].map(k=>{
   const v=fields[k];return k+': '+(typeof v==='string'?v.slice(0,k==='Tracklist'?1200:100):'');
  }).join('\n');
  const payload={testLabel:'JOSH TEST','Artwork Reference':reference,'Test Order Name':NAME,Email:config.testRecipient,'Test Order ID':id,'Test Summary':summary};
  try{
   const response=await fetchImpl(config.testWebhookUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});
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
