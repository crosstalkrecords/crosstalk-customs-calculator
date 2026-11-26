'use strict';
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path');
const {spawn}=require('node:child_process');
const {pipeline}=require('node:stream/promises');
const yazl=require('yazl');
const {deliver,staffFileStem}=require('./delivery.cjs');
const ROOT=path.resolve(__dirname,'..');
async function runRenderer(dir){
 await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['--max-old-space-size=1200',path.join(__dirname,'render-job.cjs'),dir],{stdio:'ignore'});
  const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('Conversion timeout'));},240000);
  child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('exit',code=>{clearTimeout(timer);code===0?resolve():reject(Error('Conversion failed'));});
 });
}
async function archiveJob(store,job,config={}){
 const dir=store.dir(job.id),zip=new yazl.ZipFile(),output=path.join(dir,'artwork.zip');
 const binding=JSON.parse(job.binding),stem=staffFileStem(job.id,binding,config);
 zip.addFile(path.join(dir,'project.json'),stem+'/Recovery/project.json');
 zip.addBuffer(Buffer.from(JSON.stringify(store.assets(job.id),null,2)),stem+'/Recovery/assets.json');
 for(const asset of store.assets(job.id))zip.addFile(path.join(dir,'assets',asset.hash),stem+'/Recovery/assets/'+asset.hash);
 for(const filename of await fsp.readdir(path.join(dir,'output')))
  zip.addFile(path.join(dir,'output',filename),stem+'/'+stem+'-'+filename);
 for(const filename of await fsp.readdir(path.join(ROOT,'public/fonts')))zip.addFile(path.join(ROOT,'public/fonts',filename),stem+'/Fonts/'+filename);
 zip.addBuffer(Buffer.from((config.testLabel==='JOSH TEST'?'JOSH TEST\n\n':'')+'CROSSTALK CUSTOMS ARTWORK\n\nOpen one PSD at a time in Photoshop. The matching reference PNG shows the intended print appearance. Hidden Preview backup layers are recovery images: leave them hidden while native text is visible. System/unsupported fonts use named raster text layers; editable wording remains in Recovery/project.json. Photo crop/eraser masks are separate from photo pixels. Original uploads are preserved by hash in Recovery/assets; assets.json records their MIME types. Shapes, gradients and drawings are raster layers. Fonts includes optional exact native-text fonts and their licence. PSD resolution is 300 PPI; physical cut dimensions need staff approval.\n'),stem+'/README.txt');
 const done=pipeline(zip.outputStream,fs.createWriteStream(output+'.tmp',{mode:0o600}));zip.end();await done;await fsp.rename(output+'.tmp',output);return output;
}
function startWorker(store,config,{render=runRenderer,delivery=deliver,interval=1000}={}){
 let busy=false,closed=false;
 function safeFailure(error){
  const message=error?.message||'';
  if(/^(Dropbox authentication failed(?: \(HTTP [1-5][0-9]{2}(?:; (?:invalid_grant|invalid_client))?\))?|Dropbox request failed|Dropbox upload could not (?:start|finish)|Dropbox upload interrupted|Dropbox delivery verification failed|Delivery is not configured|Conversion (?:timeout|failed)|Archive read failed)$/.test(message))return message;
  return 'Unexpected processing error';
 }
 async function tick(){
  if(busy||closed)return;const job=store.db.prepare("SELECT * FROM jobs WHERE state='queued' AND next_attempt<=? ORDER BY created LIMIT 1").get(Date.now());if(!job)return;
  busy=true;store.db.prepare("UPDATE jobs SET state='processing',attempts=attempts+1,error=NULL WHERE id=?").run(job.id);
  let stage='render';
  try{
   const dir=store.dir(job.id);await fsp.writeFile(path.join(dir,'project.json'),job.project,{mode:0o600});
   const archive=path.join(dir,'artwork.zip');
   if(!fs.existsSync(archive)){await render(dir);stage='archive';await archiveJob(store,job,config);}
   stage='delivery';
   const receipt=await delivery({archive,id:job.id,binding:JSON.parse(job.binding),config});
   // Persist only verified metadata. Provider paths, credentials and arbitrary
   // response fields must not end up in the staff audit record.
   let audit=null;
   if(receipt?.verified===true&&Number.isSafeInteger(receipt.bytes)&&receipt.bytes>=0&&/^[a-f0-9]{64}$/.test(receipt.contentHash||'')){
    audit=JSON.stringify({verified:true,bytes:receipt.bytes,contentHash:receipt.contentHash});
   }else if(config.mode==='dropbox')throw Error('Dropbox delivery verification failed');
   store.db.prepare("UPDATE jobs SET state='delivered',error=NULL,completed_at=?,failed_at=NULL,failure_stage=NULL,delivery_receipt=?,next_attempt=0 WHERE id=?").run(Date.now(),audit,job.id);
  }catch(e){
   console.warn('Artwork job '+job.id+' failed during '+stage+': '+safeFailure(e));
   const attempts=job.attempts+1,failed=attempts>=3;
   store.db.prepare('UPDATE jobs SET state=?,error=?,next_attempt=?,failed_at=?,failure_stage=? WHERE id=?').run(failed?'failed':'queued','Artwork processing or delivery failed',Date.now()+Math.min(300000,1000*30**attempts),failed?Date.now():null,failed?stage:null,job.id);
  }finally{busy=false;}
 }
 const timer=setInterval(()=>tick().catch(()=>console.warn('Artwork worker tick failed unexpectedly')),interval);timer.unref();
 return {tick,async close(){closed=true;clearInterval(timer);while(busy)await new Promise(r=>setTimeout(r,50));}};
}
module.exports={startWorker,archiveJob,runRenderer};
