'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {makeApp}=require('../src/server.cjs');
const {loadCredential}=require('../src/dropbox-auth.cjs');
test('Dropbox setup checks administrator, browser cookie, state, expiry and one-time use; encrypts tokens across restarts',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'josh-test-auth-'));let clock=Date.now(),exchanges=0;
 const config={setupSecret:'fake-setup-secret-'.repeat(3),dataDir:dir,bindSecret:'fake-admin-secret-'.repeat(3),origins:['https://josh-test.example'],mode:'disabled',dropboxRoot:'/Crosstalk Customs/JOSH TEST',dropboxSetup:true,publicOrigin:'https://josh-test.example',clientId:'fake-app',clientSecret:'fake-secret'};
 const service=makeApp(config,{now:()=>clock,worker:{interval:999999},dropboxFetch:async(url,opts)=>{
  exchanges++;assert.equal(url,'https://api.dropbox.com/oauth2/token');assert.equal(opts.body.get('client_secret'),'fake-secret');assert.equal(opts.body.get('redirect_uri'),'https://josh-test.example/oauth/dropbox/callback');
  return {ok:true,json:async()=>({refresh_token:'fake-private-refresh',scope:'files.content.write files.metadata.read'})};
 }});
 const server=service.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 const auth={Authorization:'Bearer '+config.setupSecret};const connect=async()=>{const r=await fetch(base+'/internal/dropbox/connect',{method:'POST',headers:auth});assert.equal(r.status,200);return r.json();};
 try{
  assert.equal((await fetch(base+'/internal/dropbox/connect',{method:'POST'})).status,401);
  const setup=await connect(),startPath=new URL(setup.setupUrl).pathname;
  const start=await fetch(base+startPath,{redirect:'manual'});assert.equal(start.status,302);
  const provider=new URL(start.headers.get('Location'));assert.equal(provider.origin,'https://www.dropbox.com');assert.equal(provider.searchParams.get('token_access_type'),'offline');assert.equal(provider.searchParams.get('scope'),'files.content.write files.metadata.read');assert(!provider.href.includes('fake-secret'));
  assert.equal((await fetch(base+startPath,{redirect:'manual'})).status,410);
  const state=provider.searchParams.get('state'),callback='/oauth/dropbox/callback?code=fake-code&state='+state;
  assert.equal((await fetch(base+callback,{redirect:'manual'})).status,400);assert.equal(exchanges,0);
  const cookie=start.headers.get('Set-Cookie').split(';')[0];assert.match(start.headers.get('Set-Cookie'),/Secure; HttpOnly; SameSite=Lax/);
  const result=await fetch(base+callback,{headers:{Cookie:cookie},redirect:'manual'});assert.equal(result.status,303);assert.equal(result.headers.get('Location'),'/setup/dropbox/complete');assert.equal(exchanges,1);
  assert.equal((await fetch(base+callback,{headers:{Cookie:cookie},redirect:'manual'})).status,400);assert.equal(exchanges,1);
  const status=await(await fetch(base+'/internal/dropbox/status',{headers:auth})).text();assert(!status.includes('fake-private'));assert.equal(JSON.parse(status).connected,true);assert.equal(JSON.parse(status).deliveryEnabled,false);
  const encrypted=await fs.readFile(path.join(dir,'dropbox-credential.enc'),'utf8');assert(!encrypted.includes('fake-private-refresh'));assert.equal(loadCredential(config),'fake-private-refresh');assert.throws(()=>loadCredential({...config,bindSecret:'wrong-key'}),/decrypt/);
  const expired=await connect();clock+=600001;assert.equal((await fetch(base+new URL(expired.setupUrl).pathname,{redirect:'manual'})).status,410);
 }finally{await new Promise(r=>server.close(r));await service.close();}
 const restarted={...config};delete restarted.refreshToken;const again=makeApp(restarted,{worker:{interval:999999}});assert.equal(restarted.refreshToken,'fake-private-refresh');await again.close();await fs.rm(dir,{recursive:true,force:true});
});
