'use strict';
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path');
const {spawn}=require('node:child_process');
const {pipeline}=require('node:stream/promises');
const yazl=require('yazl');
const {deliver}=require('./delivery.cjs');
const ROOT=path.resolve(__dirname,'..');
async function runRenderer(dir){
 await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['--max-old-space-size=1200',path.join(__dirname,'render-job.cjs'),dir],{stdio:'ignore'});
  const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('Conversion timeout'));},240000);
  child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('exit',code=>{clearTimeout(timer);code===0?resolve():reject(Error('Conversion failed'));});
 });
}
async function archiveJob(store,job){
 const dir=store.dir(job.id),zip=new yazl.ZipFile(),output=path.join(dir,'artwork.zip');
 zip.addFile(path.join(dir,'project.json'),'Recovery/project.json');
 zip.addBuffer(Buffer.from(JSON.stringify(store.assets(job.id),null,2)),'Recovery/assets.json');
 for(const asset of store.assets(job.id))zip.addFile(path.join(dir,'assets',asset.hash),'Recovery/assets/'+asset.hash);
 for(const filename of await fsp.readdir(path.join(dir,'output')))zip.addFile(path.join(dir,'output',filename),filename);
 for(const filename of await fsp.readdir(path.join(ROOT,'public/fonts')))zip.addFile(path.join(ROOT,'public/fonts',filename),'Fonts/'+filename);
 zip.addBuffer(Buffer.from('CROSSTALK CUSTOMS ARTWORK\n\nOpen one PSD at a time in Photoshop. The matching reference PNG shows the intended print appearance. Hidden Preview backup layers are recovery images: leave them hidden while native text is visible. System/unsupported fonts use named raster text layers; editable wording remains in Recovery/project.json. Photo crop/eraser masks are separate from photo pixels. Original uploads are preserved by hash in Recovery/assets; assets.json records their MIME types. Shapes, gradients and drawings are raster layers. Fonts includes optional exact native-text fonts and their licence. PSD resolution is 300 PPI; physical cut dimensions need staff approval.\n'),'README.txt');
 const done=pipeline(zip.outputStream,fs.createWriteStream(output+'.tmp',{mode:0o600}));zip.end();await done;await fsp.rename(output+'.tmp',output);return output;
}
function startWorker(store,config,{render=runRenderer,delivery=deliver,interval=1000}={}){
 let busy=false,closed=false;
 async function tick(){
  if(busy||closed)return;const job=store.db.prepare("SELECT * FROM jobs WHERE state='queued' AND next_attempt<=? ORDER BY created LIMIT 1").get(Date.now());if(!job)return;
  busy=true;store.db.prepare("UPDATE jobs SET state='processing',attempts=attempts+1,error=NULL WHERE id=?").run(job.id);
  try{
   const dir=store.dir(job.id);await fsp.writeFile(path.join(dir,'project.json'),job.project,{mode:0o600});
   const archive=path.join(dir,'artwork.zip');
   if(!fs.existsSync(archive)){await render(dir);await archiveJob(store,job);}
   await delivery({archive,id:job.id,binding:JSON.parse(job.binding),config});
   store.db.prepare("UPDATE jobs SET state='delivered',error=NULL WHERE id=?").run(job.id);
  }catch(_){
   const attempts=job.attempts+1;store.db.prepare('UPDATE jobs SET state=?,error=?,next_attempt=? WHERE id=?').run(attempts<3?'queued':'failed','Artwork processing or delivery failed',Date.now()+Math.min(300000,1000*30**attempts),job.id);
  }finally{busy=false;}
 }
 const timer=setInterval(()=>tick().catch(()=>{}),interval);timer.unref();
 return {tick,async close(){closed=true;clearInterval(timer);while(busy)await new Promise(r=>setTimeout(r,50));}};
}
module.exports={startWorker,archiveJob,runRenderer};
