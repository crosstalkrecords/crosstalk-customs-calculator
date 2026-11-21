'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {chromium}=require('playwright'),packaged=require('@sparticuz/chromium');
const {makeApp}=require('../src/server.cjs');
const {createCanvas}=require('../src/psd.cjs');
const RECORD='recAAAAAAAAAAAAAA';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn){for(let i=0;i<100;i++){if(fn())return;await wait(25);}throw Error('Expected outbound JOSH TEST dispatch');}
const ack=payload=>({ok:true,json:async()=>({testLabel:'JOSH TEST',submissionId:payload['Submission ID'],requestFingerprint:payload['Request Fingerprint'],airtableRecordId:RECORD,state:'accepted'})});
function callback(base,secret,payload,artworkStatus){
 return fetch(base+'/internal/test-submissions/'+payload['Submission ID']+'/outcome',{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify({
  testLabel:'JOSH TEST',submissionId:payload['Submission ID'],requestFingerprint:payload['Request Fingerprint'],airtableRecordId:RECORD,state:'complete',artwork_status:artworkStatus})});
}
test('guarded preview submits only to isolated JOSH TEST route and shows truthful confirmation',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'customs-preview-orders-'));
 const sent=[],config={bindSecret:'b'.repeat(40),dataDir:dir,origins:[],publicOrigin:'',mode:'dropbox',dropboxRoot:'/Crosstalk Customs/JOSH TEST',testLabel:'JOSH TEST',testRecipient:'delousedcomatorium@gmail.com',testWebhookUrl:'https://hook.eu1.make.com/josh-test',testMakeApiKey:'synthetic-make-api-key',testAccessCode:'test-access-only',refreshToken:'test-refresh',clientId:'test-client',clientSecret:'test-secret'};
 const service=makeApp(config,{testOrders:{interval:20,fetchImpl:async(_,options)=>{const payload=JSON.parse(options.body);sent.push(payload);return ack(payload);}}});
 const server=service.app.listen(0,'127.0.0.1');let browser;
 try{
  await new Promise(resolve=>server.once('listening',resolve));
  const base='http://127.0.0.1:'+server.address().port;config.publicOrigin=base;config.origins.push(base);
  // If the preview integration script cannot load, the copied form handler
  // still posts only to this deliberately absent route and cannot succeed.
  assert.equal((await fetch(base+'/order-submission-disabled',{method:'POST'})).status,410);
  browser=await chromium.launch({headless:true,executablePath:await packaged.executablePath(),args:packaged.args.filter(x=>x!=='--single-process')});
  const context=await browser.newContext({httpCredentials:{username:'tester',password:'test-access-only'}}),page=await context.newPage();page.setDefaultTimeout(30000);
  const outbound=[];page.on('request',request=>{if(request.method()==='POST')outbound.push({url:request.url(),origin:request.headers()['origin']||null,site:request.headers()['sec-fetch-site']||null,referer:request.headers()['referer']||null})});
  await page.goto(base+'/calculator-preview.html');
  assert.equal(await page.title(),'JOSH TEST — Crosstalk Customs');
  assert.equal(await page.locator('.promo').isHidden(),true);
  assert.equal(await page.locator('#promoStart').isDisabled(),true);
  await page.evaluate(()=>sessionStorage.setItem('crosstalk-josh-test-form-draft-v1',JSON.stringify({
   version:1,savedAt:Date.now(),step:0,mode:'regular',promo:true,size:'12',qty:1,rpm:'33 RPM',
   colour:'Clear',pack:'Printed Jacket + Labels',audio:null,rush:false,shipping:false,
   doubleLP:false,quoteOnly:false,lpCount:1,manual:'Synthetic test',tracks:{}
  })));
  await page.reload();
  assert.equal(await page.evaluate(()=>state.promo),false,'an old draft cannot revive the expired offer');
  assert.equal(await page.locator('.promo').isHidden(),true);
  assert.equal(await page.locator('#uploadWrap').count(),0);
  assert(!((await page.content()).includes("After submitting, you'll receive your private Dropbox link")));
  assert(!((await page.content()).includes("You'll upload them after ordering")));
  assert(!((await page.content()).includes("You'll upload your finished artwork after submitting")));
  assert.match(await page.locator('#success').innerText(),/test acknowledgement, not a customer order/i);
  assert.match(await page.locator('[data-step="4"]').innerText(),/does not collect audio files/i);
  assert.match(await page.locator('[data-step="4"]').innerText(),/private upload link/i);
  assert.match(await page.locator('body > [role="note"]').innerText(),/controlled test window/i);
  assert.match(await page.locator('[data-step="5"]').innerText(),/synthetic JOSH TEST submission/i);
  await page.locator('input[name="Email"]').waitFor({state:'attached'});
  await page.waitForFunction(()=>document.querySelector('input[name="Email"]').value==='delousedcomatorium@gmail.com');
  assert.equal(await page.locator('#playlistTry').isDisabled(),true);
  assert.equal(await page.locator('#playlistUrl').isDisabled(),true);
  assert(!((await page.content()).includes('https://crosstalk-playlist-importer.vercel.app')));
  await page.locator('#regularStart').click();await page.locator('#sizes [data-size="12"]').click();
  await page.locator('[data-step="1"] [data-next="2"]').click();
  await page.getByText('Prefer to type a tracklist manually?').click();await page.locator('#manual').fill('A1 - synthetic track');
  await page.locator('[data-step="2"] [data-next="3"]').click();
  await page.locator('[data-step="3"] [data-next="4"]').click();
  await page.locator('.audio[data-audio="have"]').click();await page.locator('[data-step="4"] [data-next="5"]').click();
  await page.locator('#delivery').selectOption('shipping');
  assert.equal(await page.locator('input[name="Street Address"]').inputValue(),'1 TEST ONLY LANE');
  assert.equal(await page.locator('input[name="Suburb"]').inputValue(),'TESTVILLE');
  assert.equal(await page.locator('input[name="Postcode"]').inputValue(),'0000');
  assert.equal(await page.locator('select[name="State"]').inputValue(),'NSW');
  assert.equal(await page.locator('input[name="Street Address"]').getAttribute('readonly'),'');
  assert.match(await page.locator('#delivery').locator('..').innerText(),/fictional address/);
  await page.locator('#delivery').selectOption('pickup');
  assert.equal(await page.locator('input[name="Street Address"]').inputValue(),'');
  await page.locator('#terms').check();await page.locator('button[type="submit"]').click();
  try{await page.locator('#success').waitFor({state:'visible',timeout:5000});}catch(e){
   console.error('TEST PREVIEW STATE',JSON.stringify({error:await page.locator('#testSubmitError').innerText(),outbound,button:await page.locator('button[type="submit"]').allTextContents()}));throw e;
  }
  assert.match(await page.locator('#success').innerText(),/JOSH TEST submission saved/);
  assert.equal(await page.locator('#success h2').evaluate(el=>document.activeElement===el),true);
  assert.match(await page.locator('#success').innerText(),/not yet an order confirmation/);
  await until(()=>sent.length===1);
  await page.waitForFunction(()=>document.querySelector('#success')?.dataset.intakeState==='processing');
  await page.evaluate(()=>{const id=document.querySelector('[data-test-order-id]');id.tabIndex=0;id.focus();});
  await wait(3200);
  assert.equal(await page.locator('[data-test-order-id]').evaluate(el=>document.activeElement===el),true,'polling does not steal keyboard focus');
  assert.equal((await callback(base,config.bindSecret,sent[0],'not_supplied')).status,200);
  await page.locator('#success h2').filter({hasText:'JOSH TEST order confirmed'}).waitFor({timeout:8000});
  assert.equal(await page.locator('#success h2').evaluate(el=>document.activeElement===el),true,'terminal confirmation is announced');
  assert.match(await page.locator('#testDeliveryStatus').innerText(),/No designer artwork/);
  assert.equal(sent.length,1);assert.equal(sent[0].Email,'delousedcomatorium@gmail.com');
  assert.equal(sent[0]['Delivery Method'],'Pickup');
  assert.equal(sent[0]['Street Address'],'');
  assert(outbound.some(request=>request.url===base+'/v1/test-orders'));
  assert(!outbound.some(request=>request.url.includes('hook.eu1.make.com')));
  await context.close();
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));await service.close();fs.rmSync(dir,{recursive:true,force:true});}
});

test('uncertain Make intake freezes the test form and supplies the reconciliation ID',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'customs-uncertain-preview-'));
 const config={bindSecret:'b'.repeat(40),dataDir:dir,origins:[],publicOrigin:'',mode:'dropbox',dropboxRoot:'/Crosstalk Customs/JOSH TEST',testLabel:'JOSH TEST',testRecipient:'delousedcomatorium@gmail.com',testWebhookUrl:'https://hook.eu1.make.com/josh-test',testMakeApiKey:'synthetic-make-api-key',testAccessCode:'test-access-only',refreshToken:'test-refresh',clientId:'test-client',clientSecret:'test-secret'};
 let attempts=0;
 const service=makeApp(config,{testOrders:{interval:20,fetchImpl:async()=>{attempts++;throw Error('Ambiguous Make timeout');}}});
 const server=service.app.listen(0,'127.0.0.1');let browser;
 try{
  await new Promise(resolve=>server.once('listening',resolve));
  const base='http://127.0.0.1:'+server.address().port;config.publicOrigin=base;config.origins.push(base);
  browser=await chromium.launch({headless:true,executablePath:await packaged.executablePath(),args:packaged.args.filter(x=>x!=='--single-process')});
  const context=await browser.newContext({httpCredentials:{username:'tester',password:'test-access-only'}}),page=await context.newPage();
  await page.goto(base+'/calculator-preview.html');
  await page.locator('input[name="Email"]').waitFor({state:'attached'});
  await page.locator('#regularStart').click();await page.locator('#sizes [data-size="12"]').click();
  await page.locator('[data-step="1"] [data-next="2"]').click();
  await page.getByText('Prefer to type a tracklist manually?').click();await page.locator('#manual').fill('A1 - synthetic uncertain track');
  await page.locator('[data-step="2"] [data-next="3"]').click();
  await page.locator('[data-step="3"] [data-next="4"]').click();
  await page.locator('.audio[data-audio="have"]').click();await page.locator('[data-step="4"] [data-next="5"]').click();
  await page.locator('#terms').check();await page.locator('button[type="submit"]').click();
  await page.locator('#success h2').filter({hasText:'JOSH TEST needs Crosstalk review'}).waitFor({timeout:8000});
  assert.match(await page.locator('#success').innerText(),/Test order ID: [0-9a-f-]{36}/);
  assert.match(await page.locator('#success').innerText(),/Do not submit again/);
  assert.equal(await page.locator('button[type="submit"]').isDisabled(),true);
  assert.equal(attempts,1);
  await context.close();
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));await service.close();fs.rmSync(dir,{recursive:true,force:true});}
});

test('lost browser session preserves the prior order ID and blocks a second submission, even after intake closes',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'customs-lost-session-'));
 const config={bindSecret:'b'.repeat(40),dataDir:dir,origins:[],publicOrigin:'',mode:'dropbox',dropboxRoot:'/Crosstalk Customs/JOSH TEST',testLabel:'JOSH TEST',testRecipient:'delousedcomatorium@gmail.com',testWebhookUrl:'https://hook.eu1.make.com/josh-test',testMakeApiKey:'synthetic-make-api-key',testAccessCode:'test-access-only',refreshToken:'test-refresh',clientId:'test-client',clientSecret:'test-secret'};
 const service=makeApp(config,{worker:{interval:999999}}),server=service.app.listen(0,'127.0.0.1');let browser;
 try{
  await new Promise(resolve=>server.once('listening',resolve));
  const base='http://127.0.0.1:'+server.address().port;config.publicOrigin=base;config.origins.push(base);
  const id='b72ca4e5-0e82-4f75-9413-35568ae8ef0c';
  service.store.db.prepare("INSERT INTO test_submissions(id,created,reference_id,state,browser_hash,updated) VALUES(?,?,'','processing',?,?)").run(id,Date.now()-10000,'prior-expired-browser-session',Date.now());
  browser=await chromium.launch({headless:true,executablePath:await packaged.executablePath(),args:packaged.args.filter(x=>x!=='--single-process')});
  const context=await browser.newContext({httpCredentials:{username:'tester',password:'test-access-only'}}),page=await context.newPage();
  let posts=0;page.on('request',request=>{if(request.url()===base+'/v1/test-orders'&&request.method()==='POST')posts++;});
  await page.goto(base+'/calculator-preview.html');
  await page.evaluate(value=>{
   sessionStorage.setItem('crosstalk-artwork-order-session',value);
   sessionStorage.setItem('crosstalk-artwork-order-attempted',value);
  },id);
  await page.reload();
  await page.locator('#success h2').filter({hasText:'JOSH TEST session needs review'}).waitFor();
  assert.match(await page.locator('#success').innerText(),new RegExp('Test order ID: '+id));
  assert.match(await page.locator('#success').innerText(),/Do not submit again/);
  assert.equal(await page.locator('button[type="submit"]').isDisabled(),true);
  assert.equal(posts,0);
  config.testWebhookUrl='';
  await page.reload();
  await page.locator('#success h2').filter({hasText:'JOSH TEST session needs review'}).waitFor();
  assert.match(await page.locator('#success').innerText(),new RegExp('Test order ID: '+id));
  assert.equal(await page.locator('button[type="submit"]').isDisabled(),true);
  assert.equal(posts,0);
  assert.equal(service.store.db.prepare('SELECT state FROM test_submissions WHERE id=?').get(id).state,'processing');
  await context.close();
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));await service.close();fs.rmSync(dir,{recursive:true,force:true});}
});

test('mobile guarded preview attaches synthetic art and acknowledges an isolated submission',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'customs-mobile-preview-'));
 const sent=[];
 const config={bindSecret:'b'.repeat(40),dataDir:dir,origins:[],publicOrigin:'',mode:'dropbox',dropboxRoot:'/Crosstalk Customs/JOSH TEST',testLabel:'JOSH TEST',testRecipient:'delousedcomatorium@gmail.com',testWebhookUrl:'https://hook.eu1.make.com/josh-test',testMakeApiKey:'synthetic-make-api-key',testAccessCode:'test-access-only',refreshToken:'test-refresh',clientId:'test-client',clientSecret:'test-secret'};
 const service=makeApp(config,{worker:{interval:999999},testOrders:{interval:20,fetchImpl:async(url,options)=>{
  assert.equal(url,config.testWebhookUrl);
  const payload=JSON.parse(options.body);sent.push(payload);
  return ack(payload);
 }}});
 const server=service.app.listen(0,'127.0.0.1');let browser;
 try{
  await new Promise(resolve=>server.once('listening',resolve));
  const base='http://127.0.0.1:'+server.address().port;config.publicOrigin=base;config.origins.push(base);
  browser=await chromium.launch({headless:true,executablePath:await packaged.executablePath(),args:packaged.args.filter(x=>x!=='--single-process')});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,httpCredentials:{username:'tester',password:'test-access-only'}});
  const requests=[],draftOrigins=[];context.on('request',request=>{requests.push(request.url());if(request.url().includes('/v1/drafts'))draftOrigins.push(request.headers()['origin']||null)});
  const page=await context.newPage();page.setDefaultTimeout(30000);
  await page.goto(base+'/calculator-preview.html');
  await page.evaluate(()=>localStorage.setItem('crosstalk-artwork-upload:legacy-test',JSON.stringify({id:'f'.repeat(32),token:'B'.repeat(43)})));
  await page.reload();
  assert.equal(await page.evaluate(()=>localStorage.getItem('crosstalk-artwork-upload:legacy-test')),null,'old test draft bearer storage is removed');
  await page.waitForFunction(()=>document.querySelector('input[name="Email"]')?.readOnly);
  assert.equal(await page.locator('input[name="Customer Name"]').inputValue(),'TEST JOSH 21.11');
  await page.locator('#regularStart').click();await page.locator('#sizes [data-size="12"]').click();
  await page.locator('[data-step="1"] [data-next="2"]').click();
  await page.getByText('Prefer to type a tracklist manually?').click();await page.locator('#manual').fill('A1 - synthetic mobile track');
  await page.locator('[data-step="2"] [data-next="3"]').click();
  await page.locator('#packs [data-pack="Printed Jacket + Labels"]').click();
  const popup=page.waitForEvent('popup');await page.locator('#openArtworkDesigner').click();
  const editor=await popup;editor.setDefaultTimeout(30000);
  const canvas=createCanvas(120,120),ctx=canvas.getContext('2d');ctx.fillStyle='#35698c';ctx.fillRect(0,0,120,120);
  await editor.locator('#imageInput').setInputFiles({name:'synthetic-mobile.png',mimeType:'image/png',buffer:canvas.toBuffer('image/png')});
  await editor.locator('.design-layer').first().waitFor();
  await editor.locator('#finishBtn').click();await editor.locator('#completeArtwork').click();
  try{await Promise.race([
   editor.locator('#finishSuccess.show').waitFor(),
   editor.locator('#handoffStatus').filter({hasText:'An allowed browser origin is required'}).waitFor().then(()=>{throw Error('Local draft origin rejected')})
  ]);}
  catch(e){console.error('Mobile handoff status:',await editor.locator('#handoffStatus').textContent(),'draft origins:',draftOrigins);throw e;}
  await page.locator('#artworkOrderStatus').filter({hasText:'Artwork uploaded and attached'}).waitFor();
  const artworkJobId=await page.locator('input[name="Artwork Job ID"]').inputValue();
  assert.match(artworkJobId,/^[a-f0-9]{32}$/);
  const browserStorage=await page.evaluate(()=>JSON.stringify({local:Object.entries(localStorage),session:Object.entries(sessionStorage)}));
  assert.doesNotMatch(browserStorage,/[a-f0-9]{32}\.[A-Za-z0-9_-]{43}/,'test browser storage has no artwork capability');
  await page.locator('[data-step="3"] [data-next="4"]').click();
  await page.locator('.audio[data-audio="have"]').click();await page.locator('[data-step="4"] [data-next="5"]').click();
  await page.locator('#terms').check();await page.locator('button[type="submit"]').click();
  await page.locator('#success').waitFor({state:'visible'});
  const confirmation=await page.locator('#success').innerText();
  assert.match(confirmation,/JOSH TEST submission saved/);
  assert.match(confirmation,/no payment was taken/);
  assert.match(confirmation,/artwork delivery are not yet confirmed/);
  await until(()=>sent.length===1);
  const payload=sent[0],bind={testLabel:'JOSH TEST',submissionId:payload['Submission ID'],requestFingerprint:payload['Request Fingerprint'],
   artworkJobId,airtableRecordId:RECORD,folder:'/Crosstalk Customs/JOSH TEST/'+payload['Submission ID']+'/Uploads'};
  const bound=await fetch(base+'/internal/test-bind',{method:'POST',headers:{Authorization:'Bearer '+config.bindSecret,'Content-Type':'application/json'},body:JSON.stringify(bind)});
  assert.equal(bound.status,202);
  assert.equal((await callback(base,config.bindSecret,payload,'bound')).status,200);
  await page.locator('#success h2').filter({hasText:'JOSH TEST order confirmed'}).waitFor({timeout:8000});
  assert.equal(sent.length,1);assert.equal(sent[0].testLabel,'JOSH TEST');
  assert.equal(sent[0]['Artwork Reference'],undefined,'Make never receives artwork bearer capability');
  assert.equal(sent[0]['Artwork Job ID'],artworkJobId);
  assert.equal(sent[0].Email,'delousedcomatorium@gmail.com');
  assert(requests.some(url=>url===base+'/v1/test-orders'));
  assert(!requests.some(url=>url.includes('hook.eu1.make.com')));
  assert.equal(service.store.get(artworkJobId).state,'queued','trusted test bind is queued for disabled worker');
  await context.close();
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));await service.close();fs.rmSync(dir,{recursive:true,force:true});}
});
