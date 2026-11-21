'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {makeApp}=require('../src/server.cjs');

test('staff-only JOSH TEST upload diagnostic reads one fixed folder and returns aggregates only',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'customs-upload-diagnostic-'));
 const config={dataDir:dir,bindSecret:'bind-only-'.repeat(4),staffSecret:'staff-only-'.repeat(4),origins:[],mode:'disabled',
  dropboxRoot:'/Crosstalk Customs/JOSH TEST',testLabel:'JOSH TEST',testRecipient:'delousedcomatorium@gmail.com',testAccessCode:'test-access',
  refreshToken:'private-test-refresh',clientId:'test-app',clientSecret:'private-test-secret'};
 const folder='/Crosstalk Customs/JOSH TEST/b72ca4e5-0e82-4f75-9413-35568ae8ef0c/Uploads';
 const calls=[];
 const request=async(url,options)=>{
  calls.push(url);
  if(url==='https://api.dropbox.com/oauth2/token'){
   assert.equal(options.body.get('refresh_token'),config.refreshToken);
   return {ok:true,json:async()=>({access_token:'private-test-access'})};
  }
  assert.equal(options.headers.Authorization,'Bearer private-test-access');
  if(url==='https://api.dropboxapi.com/2/files/list_folder'){
   assert.deepEqual(JSON.parse(options.body),{path:folder,recursive:false,include_deleted:false});
   return {ok:true,json:async()=>({entries:[
    {'.tag':'file',name:'private-dummy-audio.wav',size:6,path_display:folder+'/private-dummy-audio.wav'},
    {'.tag':'folder',name:'private-subfolder'},
    {'.tag':'file',name:'private-artwork.zip',size:7}
   ],has_more:true,cursor:'private-cursor'})};
  }
  assert.equal(url,'https://api.dropboxapi.com/2/files/list_folder/continue');
  assert.deepEqual(JSON.parse(options.body),{cursor:'private-cursor'});
  return {ok:true,json:async()=>({entries:[{'.tag':'file',name:'private-notes.txt',size:8}],has_more:false})};
 };
 const service=makeApp(config,{worker:{interval:999999},dropboxApiRequest:request}),server=service.app.listen(0,'127.0.0.1');
 try{
  await new Promise(resolve=>server.once('listening',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/internal/test-upload-summary';
  assert.equal((await fetch(url)).status,401);
  assert.equal((await fetch(url,{headers:{Authorization:'Bearer '+config.bindSecret}})).status,401);
  assert.equal(calls.length,0,'unauthorised access must not refresh or list Dropbox');
  const response=await fetch(url+'?path=/outside-test-folder',{headers:{Authorization:'Bearer '+config.staffSecret}});
  assert.equal(response.status,200);
  const summary=await response.json();
  assert.deepEqual(summary,{fileCount:3,folderCount:1,totalBytes:21,hasAudio:true,hasZip:true,hasOther:true});
  assert.deepEqual(calls,['https://api.dropbox.com/oauth2/token','https://api.dropboxapi.com/2/files/list_folder','https://api.dropboxapi.com/2/files/list_folder/continue']);
  for(const secret of [folder,'private-dummy-audio.wav','private-artwork.zip','private-notes.txt','private-cursor',config.refreshToken,config.clientSecret,'private-test-access'])
   assert(!JSON.stringify(summary).includes(secret));
  config.testLabel='NOT JOSH TEST';
  assert.equal((await fetch(url,{headers:{Authorization:'Bearer '+config.staffSecret}})).status,404);
  assert.equal(calls.length,3,'a non-test environment cannot use the diagnostic');
 }finally{await new Promise(resolve=>server.close(resolve));await service.close();await fs.rm(dir,{recursive:true,force:true});}
});
