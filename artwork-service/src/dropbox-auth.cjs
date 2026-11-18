'use strict';
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const COOKIE='__Host-customs-dropbox';
const SCOPES=['files.content.write','files.metadata.read'];
function credentialPath(config){return path.join(config.dataDir,'dropbox-credential.enc');}
function key(config){return crypto.createHash('sha256').update('crosstalk-dropbox-credential-v1\0'+config.bindSecret).digest();}
function saveCredential(config,token){
 const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key(config),iv);
 const data=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);
 const payload=JSON.stringify({v:1,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')});
 const file=credentialPath(config);fs.writeFileSync(file+'.tmp',payload,{mode:0o600});fs.renameSync(file+'.tmp',file);
}
function loadCredential(config){
 let value;try{value=JSON.parse(fs.readFileSync(credentialPath(config),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw Error('Stored Dropbox credential could not be read');}
 try{
  if(value.v!==1)throw Error();
  const decipher=crypto.createDecipheriv('aes-256-gcm',key(config),Buffer.from(value.iv,'base64'));decipher.setAuthTag(Buffer.from(value.tag,'base64'));
  return Buffer.concat([decipher.update(Buffer.from(value.data,'base64')),decipher.final()]).toString('utf8');
 }catch(_){throw Error('Stored Dropbox credential could not be decrypted');}
}
function installDropboxAuth(app,config,{authenticate,fetchImpl=fetch,now=Date.now}={}){
 const pending=new Map();
 const enabled=()=>config.dropboxSetup===true&&config.setupSecret&&config.clientId&&config.clientSecret&&config.publicOrigin;
 const origin=()=>{const u=new URL(config.publicOrigin);if(u.protocol!=='https:'||u.origin!==config.publicOrigin)throw Error('Invalid setup origin');return u.origin;};
 const redirectUri=()=>origin()+'/oauth/dropbox/callback';
 const clearCookie=res=>res.set('Set-Cookie',COOKIE+'=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0');
 const safePage=(res,status,text)=>res.status(status).set('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'").type('html').send('<!doctype html><html lang="en"><meta charset="utf-8"><title>JOSH TEST Dropbox connection</title><body><h1>JOSH TEST</h1><p>'+text+'</p></body></html>');
 app.get('/internal/dropbox/status',(req,res)=>{authenticate(req);res.json({appConfigured:!!(config.clientId&&config.clientSecret),connected:!!config.refreshToken,setupEnabled:!!enabled(),deliveryEnabled:config.mode==='dropbox'});});
 app.post('/internal/dropbox/connect',(req,res)=>{
  authenticate(req);if(!enabled())return res.status(409).json({error:'Dropbox setup is not configured'});
  for(const [k,v] of pending)if(v.expires<=now())pending.delete(k);
  if(pending.size>=5)return res.status(429).json({error:'Too many pending setup links'});
  const ticket=crypto.randomBytes(32).toString('base64url'),state=crypto.randomBytes(32).toString('base64url');
  pending.set(ticket,{state,expires:now()+10*60*1000,started:false});
  res.json({setupUrl:origin()+'/setup/dropbox/start/'+ticket,redirectUri:redirectUri(),expiresInSeconds:600});
 });
 app.get('/setup/dropbox/start/:ticket',(req,res)=>{
  const session=pending.get(req.params.ticket);
  if(!enabled()||!session||session.expires<=now()||session.started)return safePage(res,410,'This connection link has expired. Request a new link.');
  session.started=true;
  res.set('Set-Cookie',COOKIE+'='+session.state+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=600');
  const url=new URL('https://www.dropbox.com/oauth2/authorize');url.search=new URLSearchParams({client_id:config.clientId,response_type:'code',token_access_type:'offline',redirect_uri:redirectUri(),state:session.state,scope:SCOPES.join(' '),force_reapprove:'true'}).toString();
  res.redirect(302,url.href);
 });
 app.get('/oauth/dropbox/callback',async(req,res)=>{
  const state=typeof req.query.state==='string'?req.query.state:'';
  const match=[...pending.entries()].find(([,s])=>s.state===state&&s.started&&s.expires>now());
  const cookie=(req.get('Cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  if(!enabled()||!match||!cookie||cookie!==state)return safePage(res,400,'The connection could not be verified. Request a new link and use the same browser.');
  pending.delete(match[0]);clearCookie(res);
  if(req.query.error||typeof req.query.code!=='string'||req.query.code.length>2048)return safePage(res,400,'Dropbox access was not approved. Request a new connection link when ready.');
  try{
   const body=new URLSearchParams({grant_type:'authorization_code',code:req.query.code,client_id:config.clientId,client_secret:config.clientSecret,redirect_uri:redirectUri()});
   const response=await fetchImpl('https://api.dropbox.com/oauth2/token',{method:'POST',body,signal:AbortSignal.timeout(30000)});
   if(!response.ok)throw Error();const token=await response.json();
   if(typeof token.refresh_token!=='string'||!token.refresh_token||token.refresh_token.length>16384||!SCOPES.every(s=>(token.scope||'').split(' ').includes(s)))throw Error();
   saveCredential(config,token.refresh_token);config.refreshToken=token.refresh_token;
   res.redirect(303,'/setup/dropbox/complete');
  }catch(_){safePage(res,502,'Dropbox could not complete the connection. Request a new link; no token is displayed here.');}
 });
 app.get('/setup/dropbox/complete',(_,res)=>safePage(res,200,config.refreshToken?'Dropbox authorization is complete. Delivery is still controlled separately. You can close this tab.':'Dropbox has not been connected.'));
}
module.exports={installDropboxAuth,loadCredential,saveCredential};
