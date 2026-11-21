'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {makeApp}=require('../src/server.cjs');
const {testRootUploadSummary}=require('../src/test-upload-diagnostic.cjs');

test('staff-only JOSH TEST upload diagnostic reads one fixed folder and returns aggregates only',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'customs-upload-diagnostic-'));
 const config={dataDir:dir,bindSecret:'bind-only-'.repeat(4),staffSecret:'staff-only-'.repeat(4),origins:[],mode:'disabled',
  dropboxRoot:'/Crosstalk Customs/JOSH TEST',testLabel:'JOSH TEST',testRecipient:'delousedcomatorium@gmail.com',testAccessCode:'test-access',
  refreshToken:'private-test-refresh',clientId:'test-app',clientSecret:'private-test-secret'};
 const folder='/Crosstalk Customs/JOSH TEST/b72ca4e5-0e82-4f75-9413-35568ae8ef0c/Uploads';
 const root='/Crosstalk Customs/JOSH TEST';
 const calls=[];
 const request=async(url,options)=>{
  calls.push(url);
  if(url==='https://api.dropbox.com/oauth2/token'){
   assert.equal(options.body.get('refresh_token'),config.refreshToken);
   return {ok:true,json:async()=>({access_token:'private-test-access'})};
  }
  assert.equal(options.headers.Authorization,'Bearer private-test-access');
  if(url==='https://api.dropboxapi.com/2/files/list_folder'){
   const body=JSON.parse(options.body);
   if(body.path===folder){
    assert.deepEqual(body,{path:folder,recursive:false,include_deleted:false});
    return {ok:true,json:async()=>({entries:[
     {'.tag':'file',name:'private-dummy-audio.wav',size:6,path_display:folder+'/private-dummy-audio.wav'},
     {'.tag':'folder',name:'private-subfolder'},
     {'.tag':'file',name:'private-artwork.zip',size:7}
    ],has_more:true,cursor:'private-cursor'})};
   }
   assert.deepEqual(body,{path:root,recursive:true,include_deleted:false});
   return {ok:true,json:async()=>({entries:[
    {'.tag':'file',name:'private-inside.wav',size:11,path_lower:(folder+'/private-inside.wav').toLowerCase(),server_modified:'2026-11-21T08:00:00Z'},
    {'.tag':'file',name:'private-elsewhere.mp3',size:12,path_lower:(root+'/Elsewhere/private-elsewhere.mp3').toLowerCase(),server_modified:'2026-11-21T10:00:00Z'},
    {'.tag':'folder',name:'private-subfolder'}
   ],has_more:true,cursor:'root-private-cursor'})};
  }
  assert.equal(url,'https://api.dropboxapi.com/2/files/list_folder/continue');
  const body=JSON.parse(options.body);
  if(body.cursor==='private-cursor')return {ok:true,json:async()=>({entries:[{'.tag':'file',name:'private-notes.txt',size:8}],has_more:false})};
  assert.deepEqual(body,{cursor:'root-private-cursor'});
  return {ok:true,json:async()=>({entries:[
   {'.tag':'file',name:'private-inside.zip',size:13,path_lower:(folder+'/private-inside.zip').toLowerCase(),server_modified:'2026-11-21T09:00:00Z'},
   {'.tag':'file',name:'private-outside.txt',size:14,path_lower:(root+'/Another/private-outside.txt').toLowerCase(),server_modified:'2026-11-21T07:00:00Z'}
  ],has_more:false})};
 };
 const service=makeApp(config,{worker:{interval:999999},dropboxApiRequest:request}),server=service.app.listen(0,'127.0.0.1');
 try{
  await new Promise(resolve=>server.once('listening',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/internal/test-upload-summary';
  const rootUrl='http://127.0.0.1:'+server.address().port+'/internal/test-upload-root-summary';
  assert.equal((await fetch(url)).status,401);
  assert.equal((await fetch(rootUrl)).status,401);
  assert.equal((await fetch(url,{headers:{Authorization:'Bearer '+config.bindSecret}})).status,401);
  assert.equal((await fetch(rootUrl,{headers:{Authorization:'Bearer '+config.bindSecret}})).status,401);
  assert.equal(calls.length,0,'unauthorised access must not refresh or list Dropbox');
  const response=await fetch(url+'?path=/outside-test-folder',{headers:{Authorization:'Bearer '+config.staffSecret}});
  assert.equal(response.status,200);
  const summary=await response.json();
  assert.deepEqual(summary,{fileCount:3,folderCount:1,totalBytes:21,hasAudio:true,hasZip:true,hasOther:true});
  assert.deepEqual(calls,['https://api.dropbox.com/oauth2/token','https://api.dropboxapi.com/2/files/list_folder','https://api.dropboxapi.com/2/files/list_folder/continue']);
  for(const secret of [folder,'private-dummy-audio.wav','private-artwork.zip','private-notes.txt','private-cursor',config.refreshToken,config.clientSecret,'private-test-access'])
   assert(!JSON.stringify(summary).includes(secret));
  const rootResponse=await fetch(rootUrl+'?path=/outside-test-folder',{headers:{Authorization:'Bearer '+config.staffSecret}});
  assert.equal(rootResponse.status,200);
  const grouped=await rootResponse.json();
  assert.deepEqual(grouped,{
   inside:{fileCount:2,totalBytes:24,audioCount:1,zipCount:1,otherCount:0,latestModifiedAt:'2026-11-21T09:00:00.000Z'},
   outside:{fileCount:2,totalBytes:26,audioCount:1,zipCount:0,otherCount:1,latestModifiedAt:'2026-11-21T10:00:00.000Z'}
  });
  for(const secret of [folder,root,'private-inside.wav','private-inside.zip','private-elsewhere.mp3','private-outside.txt','root-private-cursor',config.refreshToken,config.clientSecret,'private-test-access'])
   assert(!JSON.stringify(grouped).includes(secret));
  assert.deepEqual(calls.slice(3),['https://api.dropbox.com/oauth2/token','https://api.dropboxapi.com/2/files/list_folder','https://api.dropboxapi.com/2/files/list_folder/continue']);
  config.testLabel='NOT JOSH TEST';
  assert.equal((await fetch(url,{headers:{Authorization:'Bearer '+config.staffSecret}})).status,404);
  assert.equal((await fetch(rootUrl,{headers:{Authorization:'Bearer '+config.staffSecret}})).status,404);
  assert.equal(calls.length,6,'a non-test environment cannot use the diagnostic');
 }finally{await new Promise(resolve=>server.close(resolve));await service.close();await fs.rm(dir,{recursive:true,force:true});}
});

test('recursive test diagnostic rejects incomplete pagination rather than reporting a partial count',async()=>{
 let pages=0;
 const request=async(url,options)=>{
  if(url==='https://api.dropbox.com/oauth2/token')return {ok:true,json:async()=>({access_token:'synthetic'})};
  assert.equal(options.headers.Authorization,'Bearer synthetic');
  assert(['https://api.dropboxapi.com/2/files/list_folder','https://api.dropboxapi.com/2/files/list_folder/continue'].includes(url));
  pages++;
  return {ok:true,json:async()=>({entries:[],has_more:true,cursor:'synthetic-next-cursor'})};
 };
 await assert.rejects(testRootUploadSummary({refreshToken:'synthetic',clientId:'synthetic',clientSecret:'synthetic'},request),/pagination exceeded/);
 assert.equal(pages,10);
});
