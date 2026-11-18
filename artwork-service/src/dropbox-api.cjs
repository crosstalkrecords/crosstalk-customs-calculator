'use strict';
const fs=require('node:fs/promises'),crypto=require('node:crypto');
async function accessToken(config,request=fetch){
 const body=new URLSearchParams({grant_type:'refresh_token',refresh_token:config.refreshToken,client_id:config.clientId,client_secret:config.clientSecret});
 const response=await request('https://api.dropbox.com/oauth2/token',{method:'POST',body,signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Dropbox authentication failed');
 const {access_token}=await response.json();if(!access_token)throw Error('Dropbox authentication failed');return access_token;
}
async function rpc(token,route,body,request=fetch){
 const res=await request('https://api.dropboxapi.com/2/'+route,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
 if(!res.ok){const e=Error('Dropbox request failed');e.status=res.status;throw e;}return res.json();
}
async function contentHash(file){
 const handle=await fs.open(file,'r'),hash=crypto.createHash('sha256');let offset=0;
 try{
  const size=(await handle.stat()).size;
  while(offset<size){const block=Buffer.alloc(Math.min(4*1024*1024,size-offset));let filled=0;
   while(filled<block.length){const {bytesRead}=await handle.read(block,filled,block.length-filled,offset+filled);if(!bytesRead)throw Error('Archive read failed');filled+=bytesRead;}
   hash.update(crypto.createHash('sha256').update(block).digest());offset+=filled;
  }
  return hash.digest('hex');
 }finally{await handle.close();}
}
module.exports={accessToken,rpc,contentHash};
