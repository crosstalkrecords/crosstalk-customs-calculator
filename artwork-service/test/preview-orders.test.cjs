'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {chromium}=require('playwright'),packaged=require('@sparticuz/chromium');
const {makeApp}=require('../src/server.cjs');
const {createCanvas}=require('../src/psd.cjs');
test('guarded preview submits only to isolated JOSH TEST route and shows truthful confirmation',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'customs-preview-orders-'));
 const sent=[],config={bindSecret:'b'.repeat(40),dataDir:dir,origins:[],publicOrigin:'',mode:'dropbox',dropboxRoot:'/Crosstalk Customs/JOSH TEST',testLabel:'JOSH TEST',testRecipient:'delousedcomatorium@gmail.com',testWebhookUrl:'https://hook.eu1.make.com/josh-test',testMakeApiKey:'synthetic-make-api-key',testAccessCode:'test-access-only',refreshToken:'test-refresh',clientId:'test-client',clientSecret:'test-secret'};
 const service=makeApp(config,{testOrders:{fetchImpl:async(_,options)=>{sent.push(JSON.parse(options.body));return {ok:true,json:async()=>({testLabel:'JOSH TEST',artwork_status:'not_supplied'})}}}});
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
  assert.equal(await page.locator('#uploadWrap').count(),0);
  assert(!((await page.content()).includes("After submitting, you'll receive your private Dropbox link")));
  assert(!((await page.content()).includes("You'll upload them after ordering")));
  assert(!((await page.content()).includes("You'll upload your finished artwork after submitting")));
  assert.match(await page.locator('#success').innerText(),/test acknowledgement, not a customer order/i);
  assert.match(await page.locator('[data-step="4"]').innerText(),/does not collect audio files/i);
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
  assert.match(await page.locator('#success').innerText(),/JOSH TEST submission accepted/);
  assert.match(await page.locator('#success').innerText(),/does not confirm a staff record, test email, or exported ZIP/);
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
 const service=makeApp(config,{testOrders:{fetchImpl:async()=>{attempts++;throw Error('Ambiguous Make timeout');}}});
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
  const message=page.locator('#testSubmitError');
  await message.filter({hasText:'Do not submit again'}).waitFor();
  assert.match(await message.innerText(),/Test order ID: [0-9a-f-]{36}/);
  assert.equal(await page.locator('button[type="submit"]').isDisabled(),true);
  assert.equal(await page.locator('button[type="submit"]').innerText(),'Awaiting Crosstalk review');
  assert.equal(attempts,1);
  await context.close();
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));await service.close();fs.rmSync(dir,{recursive:true,force:true});}
});

test('mobile guarded preview attaches synthetic art and acknowledges an isolated submission',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'customs-mobile-preview-'));
 const sent=[];
 const config={bindSecret:'b'.repeat(40),dataDir:dir,origins:[],publicOrigin:'',mode:'dropbox',dropboxRoot:'/Crosstalk Customs/JOSH TEST',testLabel:'JOSH TEST',testRecipient:'delousedcomatorium@gmail.com',testWebhookUrl:'https://hook.eu1.make.com/josh-test',testMakeApiKey:'synthetic-make-api-key',testAccessCode:'test-access-only',refreshToken:'test-refresh',clientId:'test-client',clientSecret:'test-secret'};
 const service=makeApp(config,{worker:{interval:999999},testOrders:{fetchImpl:async(url,options)=>{
  assert.equal(url,config.testWebhookUrl);
  const payload=JSON.parse(options.body);sent.push(payload);
  return {ok:true,json:async()=>({testLabel:'JOSH TEST',artwork_status:'bound'})};
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
  const reference=await page.locator('input[name="Artwork Reference"]').inputValue();
  assert.match(reference,/^[a-f0-9]{32}\.[A-Za-z0-9_-]{43}$/);
  await page.locator('[data-step="3"] [data-next="4"]').click();
  await page.locator('.audio[data-audio="have"]').click();await page.locator('[data-step="4"] [data-next="5"]').click();
  await page.locator('#terms').check();await page.locator('button[type="submit"]').click();
  await page.locator('#success').waitFor({state:'visible'});
  const confirmation=await page.locator('#success').innerText();
  assert.match(confirmation,/JOSH TEST submission accepted/);
  assert.match(confirmation,/No payment was taken on this page/);
  assert.match(confirmation,/Delivery is not yet confirmed|Delivery is still pending|delivered to the isolated Dropbox folder/);
  assert.equal(sent.length,1);assert.equal(sent[0].testLabel,'JOSH TEST');
  assert.equal(sent[0]['Artwork Reference'],reference);
  assert.equal(sent[0].Email,'delousedcomatorium@gmail.com');
  assert(requests.some(url=>url===base+'/v1/test-orders'));
  assert(!requests.some(url=>url.includes('hook.eu1.make.com')));
  assert.equal(service.store.get(reference.split('.')[0]).state,'ready','mocked Make did not bind or deliver artwork');
  await context.close();
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));await service.close();fs.rmSync(dir,{recursive:true,force:true});}
});
