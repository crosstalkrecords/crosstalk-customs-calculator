'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const {validate,digest}=require('./project.cjs');
const {runRenderer,archiveJob}=require('./worker.cjs');
const {deliver}=require('./delivery.cjs');
const {accessToken,rpc}=require('./dropbox-api.cjs');
const ROOT='/Crosstalk Customs/JOSH TEST',FOLDER=ROOT+'/JOSH TEST/Uploads';
function project(){
 const text={id:'josh-test',type:'text',text:'JOSH TEST',font:'Crosstalk Sans',fontSize:7,color:'#ffffff',align:'center',rotation:0,letterSpacing:0,opacity:1,x:.1,y:.2,w:.8,h:.2,z:1};
 return {format:'crosstalk-project',version:1,rendererVersion:'approved-d5b75f9-v1',surfaces:{front:[text],labelA:[{...text,fontSize:6}]},backgrounds:{front:{type:'solid',color:'#183049'},labelA:{type:'solid',color:'#183049'}}};
}
async function ensureFolders(config){
 const token=await accessToken(config);
 for(const folder of [ROOT,ROOT+'/JOSH TEST',FOLDER]){
  try{await rpc(token,'files/create_folder_v2',{path:folder,autorename:false});}catch(e){if(e.status!==409)throw e;}
  const metadata=await rpc(token,'files/get_metadata',{path:folder});if(metadata['.tag']!=='folder'||metadata.path_lower!==folder.toLowerCase())throw Error('Test folder could not be verified');
 }
}
function installTestDelivery(app,store,config,{authenticate,render=runRenderer,delivery=deliver,prepareFolders=ensureFolders}={}){
 let running=false;
 const binding=JSON.stringify({orderId:'JOSH TEST',folder:FOLDER});
 const get=()=>store.db.prepare('SELECT * FROM jobs WHERE binding=? ORDER BY created DESC LIMIT 1').get(binding);
 const guard=req=>{authenticate(req);if(config.testLabel!=='JOSH TEST'||config.dropboxRoot!==ROOT||!config.refreshToken){const e=Error('JOSH TEST delivery is not configured');e.status=409;throw e;}};
 app.post('/internal/dropbox/test-delivery',async(req,res)=>{
  guard(req);if(running)return res.status(409).json({error:'JOSH TEST is already running'});running=true;let job,stage='folder';
  try{
   await prepareFolders(config);job=get();
   if(!job){const session=store.create(),json=JSON.stringify(validate(project(),new Set()));store.db.prepare("UPDATE jobs SET project=?,digest=?,binding=?,state='test-processing' WHERE id=?").run(json,digest(json),binding,session.id);job=store.get(session.id);}
   store.db.prepare("UPDATE jobs SET state='test-processing',error=NULL,attempts=attempts+1 WHERE id=?").run(job.id);
   const dir=store.dir(job.id),archive=path.join(dir,'artwork.zip');await fs.writeFile(path.join(dir,'project.json'),job.project,{mode:0o600});
   let exists=true;try{await fs.access(archive);}catch(_){exists=false;}
   if(!exists){stage='render';await render(dir);stage='archive';await archiveJob(store,job,config);}
   stage='upload';const receipt=await delivery({archive,id:job.id,binding:JSON.parse(binding),config:{...config,mode:'dropbox'}});
   if(!receipt?.verified)throw Error('Delivery receipt missing');await fs.writeFile(path.join(dir,'delivery-receipt.json'),JSON.stringify(receipt),{mode:0o600});
   store.db.prepare("UPDATE jobs SET state='delivered',error=NULL WHERE id=?").run(job.id);
   res.json({id:job.id,state:'delivered',...receipt});
  }catch(_){if(job)store.db.prepare("UPDATE jobs SET state='failed',error=? WHERE id=?").run('JOSH TEST failed at '+stage,job.id);res.status(502).json({error:'JOSH TEST failed at '+stage,id:job?.id});}
  finally{running=false;}
 });
 app.get('/internal/dropbox/test-delivery',async(req,res)=>{
  guard(req);const job=get();if(!job)return res.json({state:'not-started'});
  let receipt=null;try{receipt=JSON.parse(await fs.readFile(path.join(store.dir(job.id),'delivery-receipt.json'),'utf8'));}catch(_){}
  res.json({id:job.id,state:job.state,attempts:job.attempts,error:job.error,receipt});
 });
}
module.exports={installTestDelivery,project};
