'use strict';
const {accessToken,rpc}=require('./dropbox-api.cjs');

// The single static TEST JOSH 21.11 intake used for the private file request.
// This is an order identifier, not a capability or Dropbox request URL.
const FOLDER='/Crosstalk Customs/JOSH TEST/b72ca4e5-0e82-4f75-9413-35568ae8ef0c/Uploads';
const AUDIO=/\.(?:aif|aiff|alac|flac|m4a|mp3|ogg|wav)$/i;

async function testUploadSummary(config,request=fetch){
 const token=await accessToken(config,request);
 let page=await rpc(token,'files/list_folder',{path:FOLDER,recursive:false,include_deleted:false},request);
 let fileCount=0,totalBytes=0,hasAudio=false,hasZip=false,hasOther=false,folderCount=0,pages=0;
 for(;;){
  if(!page||!Array.isArray(page.entries)||typeof page.has_more!=='boolean')throw Error('Invalid Dropbox metadata response');
  pages++;
  for(const item of page.entries){
   if(item?.['.tag']==='folder'){folderCount++;continue;}
   if(item?.['.tag']!=='file'||typeof item.name!=='string'||!Number.isSafeInteger(item.size)||item.size<0)throw Error('Invalid Dropbox metadata response');
   fileCount++;totalBytes+=item.size;
   if(!Number.isSafeInteger(totalBytes))throw Error('Dropbox metadata exceeds safe count');
   if(AUDIO.test(item.name))hasAudio=true;
   else if(/\.zip$/i.test(item.name))hasZip=true;
   else hasOther=true;
  }
  if(!page.has_more)break;
  if(pages>=10||typeof page.cursor!=='string'||!page.cursor)throw Error('Dropbox metadata pagination exceeded');
  page=await rpc(token,'files/list_folder/continue',{cursor:page.cursor},request);
 }
 return {fileCount,folderCount,totalBytes,hasAudio,hasZip,hasOther};
}
module.exports={testUploadSummary};
