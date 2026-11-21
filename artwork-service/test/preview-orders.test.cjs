'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {chromium}=require('playwright'),packaged=require('@sparticuz/chromium');
const {makeApp}=require('../src/server.cjs');
test('guarded preview submits only to isolated JOSH TEST route and shows truthful confirmation',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'customs-preview-orders-'));
 const sent=[],config={bindSecret:'b'.repeat(40),dataDir:dir,origins:[],publicOrigin:'',mode:'dropbox',dropboxRoot:'/Crosstalk Customs/JOSH TEST',testLabel:'JOSH TEST',testRecipient:'delousedcomatorium@gmail.com',testWebhookUrl:'https://hook.eu1.make.com/josh-test',testAccessCode:'test-access-only',refreshToken:'test-refresh',clientId:'test-client',clientSecret:'test-secret'};
 const service=makeApp(config,{testOrders:{fetchImpl:async(_,options)=>{sent.push(JSON.parse(options.body));return {ok:true,json:async()=>({testLabel:'JOSH TEST',artwork_status:'not_supplied'})}}}});
 const server=service.app.listen(0,'127.0.0.1');let browser;
 try{
  await new Promise(resolve=>server.once('listening',resolve));
  const base='http://127.0.0.1:'+server.address().port;config.publicOrigin=base;config.origins.push(base);
  browser=await chromium.launch({headless:true,executablePath:await packaged.executablePath(),args:packaged.args.filter(x=>x!=='--single-process')});
  const context=await browser.newContext({httpCredentials:{username:'tester',password:'test-access-only'}}),page=await context.newPage();page.setDefaultTimeout(30000);
  const outbound=[];page.on('request',request=>{if(request.method()==='POST')outbound.push({url:request.url(),origin:request.headers()['origin']||null,site:request.headers()['sec-fetch-site']||null,referer:request.headers()['referer']||null})});
  await page.goto(base+'/calculator-preview.html');
  await page.locator('input[name="Email"]').waitFor({state:'attached'});
  await page.waitForFunction(()=>document.querySelector('input[name="Email"]').value==='delousedcomatorium@gmail.com');
  await page.locator('#regularStart').click();await page.locator('#sizes [data-size="12"]').click();
  await page.locator('[data-step="1"] [data-next="2"]').click();
  await page.getByText('Prefer to type a tracklist manually?').click();await page.locator('#manual').fill('A1 - synthetic track');
  await page.locator('[data-step="2"] [data-next="3"]').click();
  await page.locator('[data-step="3"] [data-next="4"]').click();
  await page.locator('.audio[data-audio="have"]').click();await page.locator('[data-step="4"] [data-next="5"]').click();
  await page.locator('#terms').check();await page.getByRole('button',{name:'Place My Order'}).click();
  try{await page.locator('#success').waitFor({state:'visible',timeout:5000});}catch(e){
   console.error('TEST PREVIEW STATE',JSON.stringify({error:await page.locator('#testSubmitError').innerText(),outbound,button:await page.getByRole('button',{name:/Place My Order|Submitting JOSH TEST/}).allTextContents()}));throw e;
  }
  assert.match(await page.locator('#success').innerText(),/JOSH TEST submission accepted/);
  assert.match(await page.locator('#testDeliveryStatus').innerText(),/No designer artwork/);
  assert.equal(sent.length,1);assert.equal(sent[0].Email,'delousedcomatorium@gmail.com');
  assert(outbound.some(request=>request.url===base+'/v1/test-orders'));
  assert(!outbound.some(request=>request.url.includes('hook.eu1.make.com')));
  await context.close();
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));await service.close();fs.rmSync(dir,{recursive:true,force:true});}
});
