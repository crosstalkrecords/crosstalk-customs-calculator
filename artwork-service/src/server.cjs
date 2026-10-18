'use strict';
const express=require('express'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {imageSize}=require('image-size');
const {openStore}=require('./store.cjs');
const {validate,LIMITS,digest}=require('./project.cjs');
const {validateBinding}=require('./delivery.cjs');
const {startWorker}=require('./worker.cjs');
const {prune}=require('./retention.cjs');
function error(status,message){const e=new Error(message);e.status=status;return e;}
function secureEqual(a,b){return typeof a==='string'&&typeof b==='string'&&a.length===b.length&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));}
function makeApp(config,options={}){
 if(!config.bindSecret||config.bindSecret.length<32)throw Error('A separate 32-character or longer binding secret is required');
 if(config.mode==='synthetic'&&process.env.NODE_ENV==='production')throw Error('Synthetic delivery is disabled in production');
 if(config.mode==='dropbox'&&(!config.refreshToken||!config.clientId||!config.clientSecret))throw Error('Dropbox delivery credentials are not configured');
 const store=openStore(config.dataDir),app=express(),worker=startWorker(store,config,options.worker);const rates=new Map();let uploads=0;
 let pruning=Promise.resolve();const cleanup=()=>{pruning=pruning.then(()=>prune(store)).catch(()=>{});};cleanup();const cleanupTimer=setInterval(cleanup,3600000);cleanupTimer.unref();
 app.disable('x-powered-by');app.set('trust proxy',false);
 app.use((req,res,next)=>{
  res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
  const origin=req.get('Origin');
  if(origin){if(!config.origins.includes(origin))return next(error(403,'Origin is not allowed'));res.set({'Access-Control-Allow-Origin':origin,Vary:'Origin','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, PUT, OPTIONS'});}
  if(req.method==='OPTIONS')return res.sendStatus(204);next();
 });
 app.get('/health',(_,res)=>res.json({service:'crosstalk-artwork',deliveryMode:config.mode,configured:['synthetic','dropbox'].includes(config.mode)}));
 function browserOrigin(req){if(!req.get('Origin')||!config.origins.includes(req.get('Origin')))throw error(403,'An allowed browser origin is required');}
 function auth(req){const j=store.authorize(req.params.id,(req.get('Authorization')||'').replace(/^Bearer /,''));if(!j)throw error(404,'Artwork not found');return j;}
 app.post('/v1/drafts',(req,res)=>{
  browserOrigin(req);const key=req.socket.remoteAddress||'unknown',now=Date.now(),r=rates.get(key);if(!r||now-r.start>3600000)rates.set(key,{start:now,count:0});
  if(++rates.get(key).count>20)throw error(429,'Too many artwork sessions; try later');
  if(rates.size>10000)for(const [k,v] of rates)if(now-v.start>3600000)rates.delete(k);
  const count=store.db.prepare("SELECT count(*) AS n FROM jobs WHERE state!='delivered'").get().n;
  const total=store.db.prepare('SELECT coalesce(sum(bytes),0) AS n FROM assets').get().n;
  if(count>=100||total>=2*1024**3)throw error(503,'Artwork service capacity reached');
  res.status(201).json(store.create());
 });
 app.put('/v1/drafts/:id/assets/:hash',(req,res,next)=>{
  try{browserOrigin(req);const j=auth(req);if(j.state!=='draft')throw error(409,'Artwork is sealed');if(!/^[a-f0-9]{64}$/.test(req.params.hash))throw error(422,'Invalid asset identifier');if(uploads>=2)throw error(429,'Upload busy; retry shortly');uploads++;res.once('finish',()=>uploads--);res.once('close',()=>{if(!res.writableFinished)uploads--;});next();}catch(e){next(e);}
 },express.raw({type:()=>true,limit:LIMITS.assetBytes}),async(req,res)=>{
  const j=auth(req),hash=req.params.hash,bytes=req.body;
  if(!Buffer.isBuffer(bytes)||digest(bytes)!==hash)throw error(422,'Source image checksum mismatch');
  const dimensions=imageSize(bytes);const mime={png:'image/png',jpg:'image/jpeg',webp:'image/webp'}[dimensions.type];
  if(!mime||dimensions.width*dimensions.height>LIMITS.pixels)throw error(422,'Use PNG, JPEG or WebP images up to 25 megapixels');
  const assets=store.assets(j.id),exists=assets.find(a=>a.hash===hash);
  if(!exists&&(assets.length>=LIMITS.assets||assets.reduce((n,a)=>n+a.bytes,0)+bytes.length>LIMITS.totalBytes))throw error(422,'Source image limit exceeded');
  // Reserve atomically before asynchronous disk I/O so parallel uploads cannot exceed quotas.
  if(!exists)store.db.prepare('INSERT INTO assets(job_id,hash,bytes,mime) VALUES(?,?,?,?)').run(j.id,hash,bytes.length,mime);
  try{await fs.writeFile(path.join(store.dir(j.id),'assets',hash),bytes,{mode:0o600});}catch(e){if(!exists)store.db.prepare('DELETE FROM assets WHERE job_id=? AND hash=?').run(j.id,hash);throw e;}
  res.json({hash,bytes:bytes.length});
 });
 app.post('/v1/drafts/:id/commit',express.json({limit:LIMITS.projectBytes}),async(req,res)=>{
  browserOrigin(req);const j=auth(req),assets=store.assets(j.id),project=validate(req.body,new Set(assets.map(a=>a.hash))),json=JSON.stringify(project),hash=digest(json);
  if(j.state!=='draft'){if(j.digest===hash)return res.json({reference:j.id+'.'+req.get('Authorization').slice(7),state:j.state});throw error(409,'Artwork is already sealed');}
  for(const asset of assets){const b=await fs.readFile(path.join(store.dir(j.id),'assets',asset.hash));if(digest(b)!==asset.hash)throw error(409,'Source upload has not completed');}
  // Recheck after disk I/O: concurrent commits must not replace a sealed design.
  const result=store.db.prepare("UPDATE jobs SET project=?,digest=?,state='ready' WHERE id=? AND state='draft'").run(json,hash,j.id);
  if(!result.changes)throw error(409,'Artwork was sealed by another request');
  res.json({reference:j.id+'.'+req.get('Authorization').slice(7),state:'ready'});
 });
 app.get('/v1/drafts/:id',(req,res)=>{const j=auth(req);res.json({id:j.id,state:j.state,attempts:j.attempts,error:j.error||null});});
 app.post('/internal/bind',express.json({limit:'4kb'}),(req,res)=>{
  if(!secureEqual(req.get('Authorization'),'Bearer '+config.bindSecret))throw error(401,'Unauthorised binding');
  const {reference,orderId,folder}=req.body||{};if(typeof reference!=='string')throw error(422,'Artwork reference missing');const [id,token,...rest]=reference.split('.');if(rest.length)throw error(422,'Invalid reference');
  const j=store.authorize(id,token);if(!j)throw error(404,'Artwork not found');
  const binding=JSON.stringify(validateBinding({orderId,folder},config.dropboxRoot));
  if(j.binding){if(j.binding!==binding)throw error(409,'Artwork is bound to a different order');return res.json({id,state:j.state});}
  if(j.state!=='ready')throw error(409,'Artwork upload is not complete');
  store.db.prepare("UPDATE jobs SET binding=?,state='queued' WHERE id=? AND state='ready'").run(binding,id);res.status(202).json({id,state:'queued'});
 });
 app.get('/internal/jobs',(req,res)=>{
  if(!secureEqual(req.get('Authorization'),'Bearer '+config.bindSecret))throw error(401,'Unauthorised');
  res.json(store.db.prepare('SELECT id,created,state,attempts,error FROM jobs ORDER BY created DESC LIMIT 100').all());
 });
 app.post('/internal/retry/:id',(req,res)=>{
  if(!secureEqual(req.get('Authorization'),'Bearer '+config.bindSecret))throw error(401,'Unauthorised');
  const result=store.db.prepare("UPDATE jobs SET state='queued',attempts=0,next_attempt=0,error=NULL WHERE id=? AND state='failed'").run(req.params.id);
  if(!result.changes)throw error(409,'Only failed jobs can be retried');res.status(202).json({state:'queued'});
 });
 app.use(express.static(path.join(__dirname,'../public'),{dotfiles:'deny',index:'index.html',setHeaders:res=>res.set('Cache-Control','public, max-age=300')}));
 app.use((err,req,res,next)=>{if(res.headersSent)return next(err);const status=err.status||500;res.status(status).json({error:status<500?err.message:'Artwork service could not complete this request'});});
 return {app,store,worker,async close(){clearInterval(cleanupTimer);await pruning;await worker.close();store.close();}};
}
function environment(){return {testLabel:process.env.ARTWORK_TEST_LABEL,dataDir:process.env.ARTWORK_DATA_DIR||path.join(__dirname,'../data'),bindSecret:process.env.ARTWORK_BIND_SECRET,origins:(process.env.ARTWORK_ORIGINS||'http://127.0.0.1:4310').split(',').map(x=>x.trim()),mode:process.env.ARTWORK_DELIVERY_MODE||'disabled',dropboxRoot:process.env.ARTWORK_DROPBOX_ROOT||'/Crosstalk Customs/Orders',testDestination:process.env.ARTWORK_TEST_DESTINATION,refreshToken:process.env.DROPBOX_REFRESH_TOKEN,clientId:process.env.DROPBOX_CLIENT_ID,clientSecret:process.env.DROPBOX_CLIENT_SECRET};}
if(require.main===module){const service=makeApp(environment());const server=service.app.listen(Number(process.env.PORT||4310),process.env.HOST||'127.0.0.1',()=>console.log('Artwork service listening'));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close();service.close().then(()=>process.exit(0));});}
module.exports={makeApp,environment};
