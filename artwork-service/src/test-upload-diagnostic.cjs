'use strict';
const {accessToken,rpc}=require('./dropbox-api.cjs');

// The single static TEST JOSH 21.11 intake used for the private file request.
// This is an order identifier, not a capability or Dropbox request URL.
const ROOT='/Crosstalk Customs/JOSH TEST';
const FOLDER=ROOT+'/b72ca4e5-0e82-4f75-9413-35568ae8ef0c/Uploads';
const AUDIO=/\.(?:aif|aiff|alac|flac|m4a|mp3|ogg|wav)$/i;

async function listMetadata(token,path,recursive,request,accept){
 let page=await rpc(token,'files/list_folder',{path,recursive,include_deleted:false},request),pages=0;
 for(;;){
  if(!page||!Array.isArray(page.entries)||typeof page.has_more!=='boolean')throw Error('Invalid Dropbox metadata response');
  pages++;
  for(const item of page.entries)accept(item);
  if(!page.has_more)break;
  if(pages>=10||typeof page.cursor!=='string'||!page.cursor)throw Error('Dropbox metadata pagination exceeded');
  page=await rpc(token,'files/list_folder/continue',{cursor:page.cursor},request);
 }
}
function fileMetadata(item){
 if(item?.['.tag']!=='file'||typeof item.name!=='string'||!Number.isSafeInteger(item.size)||item.size<0)throw Error('Invalid Dropbox metadata response');
}
async function testUploadSummary(config,request=fetch){
 const token=await accessToken(config,request);
 let fileCount=0,totalBytes=0,hasAudio=false,hasZip=false,hasOther=false,folderCount=0;
 await listMetadata(token,FOLDER,false,request,item=>{
   if(item?.['.tag']==='folder'){folderCount++;return;}
   fileMetadata(item);
   fileCount++;totalBytes+=item.size;
   if(!Number.isSafeInteger(totalBytes))throw Error('Dropbox metadata exceeds safe count');
   if(AUDIO.test(item.name))hasAudio=true;
   else if(/\.zip$/i.test(item.name))hasZip=true;
   else hasOther=true;
 });
 return {fileCount,folderCount,totalBytes,hasAudio,hasZip,hasOther};
}
function emptyGroup(){return {fileCount:0,totalBytes:0,audioCount:0,zipCount:0,otherCount:0,latestModifiedAt:null};}
async function testRootUploadSummary(config,request=fetch){
 const token=await accessToken(config,request),inside=emptyGroup(),outside=emptyGroup();
 const rootLower=ROOT.toLowerCase()+'/',folderLower=FOLDER.toLowerCase()+'/';
 await listMetadata(token,ROOT,true,request,item=>{
  if(item?.['.tag']==='folder')return;
  fileMetadata(item);
  const lower=item.path_lower;
  if(typeof lower!=='string'||!lower.startsWith(rootLower))throw Error('Invalid Dropbox metadata path');
  const group=lower.startsWith(folderLower)?inside:outside;
  group.fileCount++;group.totalBytes+=item.size;
  if(!Number.isSafeInteger(group.totalBytes))throw Error('Dropbox metadata exceeds safe count');
  if(AUDIO.test(item.name))group.audioCount++;
  else if(/\.zip$/i.test(item.name))group.zipCount++;
  else group.otherCount++;
  if(item.server_modified){
   const modified=Date.parse(item.server_modified);
   if(!Number.isFinite(modified))throw Error('Invalid Dropbox modification time');
   if(!group.latestModifiedAt||modified>Date.parse(group.latestModifiedAt))group.latestModifiedAt=new Date(modified).toISOString();
  }
 });
 return {inside,outside};
}
module.exports={testUploadSummary,testRootUploadSummary};
