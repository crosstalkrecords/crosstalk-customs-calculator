'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process'),http=require('node:http');
const {chromium}=require('playwright'),packaged=require('@sparticuz/chromium');
const {makeApp}=require('../src/server.cjs');
const root=path.resolve(__dirname,'../..');
const dummy='https://candidate-only.up.railway.app';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('release form sends one ordinary order to gateway, survives refresh and shows confirmed request link',async()=>{
 execFileSync(process.execPath,['ops/build-release-form.mjs',dummy],{cwd:root});
 const live=fs.readFileSync(path.join(root,'calculator.html'),'utf8'),candidate=fs.readFileSync(path.join(root,'calculator-production.html'),'utf8');
 assert(!candidate.includes('hook.eu1.make.com'));assert(candidate.includes(dummy+'/production-orders.js'));
 assert(live.includes('hook.eu1.make.com'),'the live form stays unchanged');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'customs-release-form-'));
 const sent=[],config={dataDir:dir,bindSecret:'b'.repeat(40),staffSecret:'s'.repeat(40),origins:[],publicOrigin:'',mode:'dropbox',dropboxRoot:'/Crosstalk Customs/Orders',refreshToken:'dummy',clientId:'dummy',clientSecret:'dummy',productionIntakeEnabled:true,productionWebhookUrl:'https://hook.eu1.make.com/candidateonly',productionMakeApiKey:'candidateonly'};
 const service=makeApp(config,{worker:{interval:999999},productionOrders:{interval:30,fetchImpl:async(_url,options)=>{sent.push(JSON.parse(options.body));return {ok:true,text:async()=> 'Accepted'};}}});
 const server=service.app.listen(0,'127.0.0.1'),formHost=http.createServer((_req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('<title>Separate calculator origin</title>');});let browser;
 try{
  await new Promise(resolve=>server.once('listening',resolve));const base='http://127.0.0.1:'+server.address().port;
  config.publicOrigin=base;config.origins.push(base);
  formHost.listen(0,'127.0.0.1');await new Promise(resolve=>formHost.once('listening',resolve));
  const other='http://127.0.0.1:'+formHost.address().port;config.origins.push(other);
  browser=await chromium.launch({headless:true,executablePath:await packaged.executablePath(),args:packaged.args.filter(x=>x!=='--single-process')});
  const page=await browser.newPage();page.setDefaultTimeout(20000);
  const requests=[];page.on('request',r=>{if(r.method()==='POST')requests.push({url:r.url()});});
  await page.route(base+'/release.html',route=>route.fulfill({status:200,contentType:'text/html',body:candidate.replaceAll(dummy,base)}));
  await page.goto(base+'/release.html');
  await page.locator('#regularStart').click();await page.locator('#sizes [data-size="7"]').click();
  await page.locator('[data-step="1"] [data-next="2"]').click();
  await page.getByText('Prefer to type a tracklist manually?').click();await page.locator('#manual').fill('A1 - original composition');
  await page.locator('[data-step="2"] [data-next="3"]').click();await page.locator('[data-step="3"] [data-next="4"]').click();
  await page.locator('.audio[data-audio="have"]').click();await page.locator('[data-step="4"] [data-next="5"]').click();
  await page.locator('input[name="Customer Name"]').fill('Ada Example');await page.locator('input[name="Email"]').fill('ada@example.org');
  await page.locator('input[name="Custom Field 1"]').fill('0400000000');await page.locator('#terms').check();
  await page.locator('button[type="submit"]').click();
  await page.locator('#success').waitFor({state:'visible'});
  assert.equal(await page.getByRole('button',{name:'Start another order'}).isVisible(),false,'an unconfirmed order cannot be replaced');
  for(let n=0;n<100&&!sent.length;n++)await wait(25);
  assert.equal(sent.length,1);assert.equal(sent[0]['Artwork Attached'],'No');
  assert.equal(requests.filter(r=>r.url.includes('/v1/production-orders')).length,1);
  assert.equal(requests.some(r=>r.url.includes('hook.eu1.make.com')),false);
  const id=sent[0]['Submission ID'],link='https://www.dropbox.com/request/abc123';
  const callback=await fetch(base+'/internal/production-outcome',{method:'POST',headers:{Authorization:'Bearer '+config.bindSecret,'Content-Type':'application/json'},body:JSON.stringify({submissionId:id,requestFingerprint:sent[0]['Request Fingerprint'],airtableRecordId:'rec12345678901234',jobNumber:'JOB9',folder:'/Crosstalk Customs/Orders/JOB9/Uploads',uploadLink:link,state:'complete'})});
  assert.equal(callback.status,200);
  await page.locator('#success h2').filter({hasText:'Order received'}).waitFor({timeout:9000});
  assert.equal(await page.locator('#upload').getAttribute('href'),link);
  await page.reload();await page.locator('#success h2').filter({hasText:'Order received'}).waitFor();
  assert.equal(sent.length,1);assert.equal(await page.locator('#upload').getAttribute('href'),link);
  await page.getByRole('button',{name:'Start another order'}).click();
  await page.locator('#wrap').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('crosstalk-production-submission-v1')),null);
  assert.equal(sent.length,1,'starting a new order does not resubmit the first');
  // The released form is actually hosted on GitHub Pages, separate from the
  // service. Exercise a browser CORS preflight from a second allowed origin.
  const otherPage=await browser.newPage();await otherPage.goto(other);
  const cross=await otherPage.evaluate(async({base,fields})=>{
   const bytes=crypto.getRandomValues(new Uint8Array(32));const key=btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
   const response=await fetch(base+'/v1/production-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submissionId:crypto.randomUUID(),clientKey:key,fields})});
   return {status:response.status,body:await response.json()};
  },{base,fields:{'Customer Name':'Bea Example',Email:'bea@example.org','Custom Field 1':'0400000001',Packaging:'Standard',Quantity:'1','Record Size':'7',Speed:'45 RPM',Tracklist:'A1 - original composition'}});
  assert.equal(cross.status,202);assert.equal(cross.body.state,'queued');
 }finally{await browser?.close();await new Promise(resolve=>formHost.close(resolve));await new Promise(resolve=>server.close(resolve));await service.close();fs.rmSync(dir,{recursive:true,force:true});}
});
