'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
function validateBinding(value,root){
 if(!value||typeof value.orderId!=='string'||!value.orderId||value.orderId.length>150)throw Error('Invalid order reference');
 const folder=value.folder;
 if(typeof folder!=='string'||!folder.startsWith(root+'/')||folder.length>700||/[\\\x00-\x1f]/.test(folder)||folder.slice(1).split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Invalid order folder');
 const parts=folder.slice(root.length+1).split('/');
 if(parts.length!==2||parts[1]!=='Uploads'||!parts[0])throw Error('Expected the existing order Uploads folder');
 return {orderId:value.orderId,folder};
}
async function deliver({archive,id,binding,config}){
 const filename='Crosstalk-artwork-'+id+'.zip';
 if(config.mode==='synthetic'){
  if(!config.testDestination)throw Error('Synthetic destination missing');
  const dest=path.join(config.testDestination,binding.orderId.replace(/[^a-zA-Z0-9_-]/g,'_'));
  await fs.mkdir(dest,{recursive:true});await fs.copyFile(archive,path.join(dest,filename));return;
 }
 if(config.mode!=='dropbox')throw Error('Delivery is not configured');
 const auth=new URLSearchParams({grant_type:'refresh_token',refresh_token:config.refreshToken,client_id:config.clientId,client_secret:config.clientSecret});
 const tokenResponse=await fetch('https://api.dropbox.com/oauth2/token',{method:'POST',body:auth,signal:AbortSignal.timeout(30000)});
 if(!tokenResponse.ok)throw Error('Dropbox authentication failed');
 const {access_token}=await tokenResponse.json();if(!access_token)throw Error('Dropbox authentication failed');
 const handle=await fs.open(archive,'r');
 try{
  // Sessions keep requests bounded and support archives larger than 150 MB.
  const start=await fetch('https://content.dropboxapi.com/2/files/upload_session/start',{method:'POST',headers:{Authorization:'Bearer '+access_token,'Content-Type':'application/octet-stream','Dropbox-API-Arg':JSON.stringify({close:false})},body:Buffer.alloc(0),signal:AbortSignal.timeout(30000)});
  if(!start.ok)throw Error('Dropbox upload could not start');
  const {session_id}=await start.json();const stat=await handle.stat();let offset=0;
  while(offset<stat.size){
   const data=Buffer.alloc(Math.min(8*1024*1024,stat.size-offset));const {bytesRead}=await handle.read(data,0,data.length,offset);if(!bytesRead)throw Error('Archive read failed');
   const res=await fetch('https://content.dropboxapi.com/2/files/upload_session/append_v2',{method:'POST',headers:{Authorization:'Bearer '+access_token,'Content-Type':'application/octet-stream','Dropbox-API-Arg':JSON.stringify({cursor:{session_id,offset},close:false})},body:data.subarray(0,bytesRead),signal:AbortSignal.timeout(60000)});
   if(!res.ok)throw Error('Dropbox upload interrupted');offset+=bytesRead;
  }
  const finish=await fetch('https://content.dropboxapi.com/2/files/upload_session/finish',{method:'POST',headers:{Authorization:'Bearer '+access_token,'Content-Type':'application/octet-stream','Dropbox-API-Arg':JSON.stringify({cursor:{session_id,offset},commit:{path:binding.folder+'/'+filename,mode:'overwrite',autorename:false,mute:true}})},body:Buffer.alloc(0),signal:AbortSignal.timeout(60000)});
  if(!finish.ok)throw Error('Dropbox upload could not finish');
 }finally{await handle.close();}
}
module.exports={validateBinding,deliver};
