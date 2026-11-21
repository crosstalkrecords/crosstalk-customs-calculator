'use strict';
// Opt-in synthetic acceptance against the isolated JOSH TEST Railway service.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const packaged=require('@sparticuz/chromium');
const {createCanvas}=require('../src/psd.cjs');

const base='https://josh-test-artwork-exporter-josh-test.up.railway.app';
const output=path.resolve(__dirname,'../test-output/hosted');
const proxyUrl=process.env.HTTPS_PROXY&&new URL(process.env.HTTPS_PROXY);
const proxy=proxyUrl?{server:proxyUrl.origin,...(proxyUrl.username?{username:decodeURIComponent(proxyUrl.username),password:decodeURIComponent(proxyUrl.password)}:{})}:undefined;
const httpCredentials=process.env.ARTWORK_TEST_ACCESS_CODE?{username:'tester',password:process.env.ARTWORK_TEST_ACCESS_CODE}:undefined;
const failures=[];

async function prepare(page,pack){
 await page.goto(base+'/calculator-preview.html');
 assert.match(await page.locator('body').innerText(),/JOSH TEST — TEST JOSH 21\.11/);
 await page.locator('#regularStart').click();
 await page.locator('#sizes [data-size="12"]').click();
 await page.locator('[data-step="1"] [data-next="2"]').click();
 await page.getByText('Prefer to type a tracklist manually?').click();
 await page.locator('#manual').fill('A1 - JOSH TEST synthetic audio');
 await page.locator('[data-step="2"] [data-next="3"]').click();
 if(pack!=='Standard')await page.locator('#packs [data-pack="'+pack+'"]').click();
 assert.equal(await page.locator('#openArtworkDesigner').isVisible(),pack!=='Standard');
}
async function customer(page,route){
 await page.locator('[data-step="3"] [data-next="4"]').click();
 await page.locator('.audio[data-audio="have"]').click();
 await page.locator('[data-step="4"] [data-next="5"]').click();
 await page.waitForFunction(()=>document.querySelector('input[name="Customer Name"]')?.readOnly);
 for(const [name,value] of [['Customer Name','TEST JOSH 21.11'],['Email','delousedcomatorium@gmail.com'],['Custom Field 1','0400000000']]){
  const field=page.locator('input[name="'+name+'"]');
  assert.equal(await field.getAttribute('readonly'),'');
  assert.equal(await field.inputValue(),value);
 }
 await page.locator('#terms').check();
 if(route)await page.route('**/v1/test-orders',route);
}
async function openEditor(page){
 const popup=page.waitForEvent('popup');await page.locator('#openArtworkDesigner').click();
 const editor=await popup;editor.setDefaultTimeout(45000);await editor.waitForLoadState('domcontentloaded');
 return editor;
}
async function upload(editor,image,mobile){
 await editor.locator('#imageInput').setInputFiles(image);
 await editor.locator(mobile?'#mobileTextBtn':'#addTextBtn').click();
 if(mobile){const done=editor.getByRole('button',{name:/^(Done|Apply|Save)$/i});if(await done.count())await done.first().click();}
 if(!mobile){
  await editor.locator('#surfaceTabs .surface-tab').filter({hasText:'Side A label'}).click();
  await editor.locator('#addTextBtn').click();
 }
 await editor.locator('#finishBtn').click();
 await editor.locator('#completeArtwork').click();
 await editor.locator('#finishSuccess.show').waitFor({timeout:60000});
}
async function run(){
 await fs.mkdir(output,{recursive:true});
 const canvas=createCanvas(120,120),ctx=canvas.getContext('2d');ctx.fillStyle='#336b8a';ctx.fillRect(0,0,120,120);
 ctx.fillStyle='#f5b330';ctx.fillRect(20,20,80,80);
 const image=path.join(output,'JOSH-TEST-synthetic.png');await fs.writeFile(image,canvas.toBuffer('image/png'));
 const health=await fetch(base+'/health');assert.equal(health.status,200);
 const healthBody=await health.json();assert.equal(healthBody.deliveryMode,'dropbox');assert.equal(healthBody.configured,true);
 const cfg=await(await fetch(base+'/v1/client-config')).json();assert.deepEqual(cfg.returnOrigins,[base]);
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||await packaged.executablePath(),args:packaged.args.filter(a=>!['--single-process','--disable-web-security','--disable-site-isolation-trials'].includes(a)),...(proxy?{proxy}:{})});
 const result={base,health:'pass',cases:[],references:[]};
 async function guardedContext(options={}){
  const context=await browser.newContext({ignoreHTTPSErrors:true,...(httpCredentials?{httpCredentials}:{}),...options});
  // This script checks only browser behaviour. An unmocked submission is a
  // test failure, never a call to Make or the real isolated order endpoint.
  await context.route('**/v1/test-orders',route=>{failures.push('Unmocked JOSH TEST submission');return route.abort()});
  await context.route('**/order-submission-disabled',route=>{failures.push('Obsolete preview submission');return route.abort()});
  await context.route('https://hook.eu1.make.com/**',route=>{failures.push('Unexpected Make request');return route.abort()});
  return context;
 }
 try{
  const standard=await guardedContext();const plain=await standard.newPage();plain.setDefaultTimeout(45000);
  await prepare(plain,'Standard');
  let standardAttempts=0;
  await customer(plain,async route=>{standardAttempts++;const data=route.request().postDataJSON();assert.equal(data.artworkReference,'');assert.equal('Artwork Reference' in data.fields,false);await new Promise(r=>setTimeout(r,350));await route.fulfill({status:202,contentType:'application/json',body:JSON.stringify({testOrderId:data.testOrderId,artworkStatus:'not_supplied',deliveryPending:false})});});
  await plain.locator('button[type="submit"]').evaluate(button=>{button.click();button.click()});await plain.locator('#success').waitFor({state:'visible'});
  assert.equal(standardAttempts,1);
  result.cases.push('Standard without artwork and duplicate submit suppression');await standard.close();

  for(const [mobile,pack] of [[false,'Printed Jacket + Labels'],[true,'Custom Finish Pack']]){
   const context=await guardedContext({viewport:mobile?{width:390,height:844}:{width:1365,height:900},isMobile:mobile,hasTouch:mobile});
   const page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>failures.push(e.message));
   await prepare(page,pack);let editor=await openEditor(page);
   if(mobile){
    let failOnce=true;
    await editor.route('**/v1/drafts',async route=>{if(failOnce){failOnce=false;await route.fulfill({status:503,contentType:'application/json',body:'{"error":"JOSH TEST injected failure"}'})}else await route.continue()});
    await editor.locator('#imageInput').setInputFiles(image);
    await editor.locator('#finishBtn').click();await editor.locator('#completeArtwork').click();
    await editor.locator('#handoffStatus').filter({hasText:'JOSH TEST injected failure'}).waitFor();
    assert.equal(await page.locator('input[name="Artwork Reference"]').inputValue(),'');
    await editor.unroute('**/v1/drafts');
    await editor.locator('#completeArtwork').click();await editor.locator('#finishSuccess.show').waitFor({timeout:60000});
    result.cases.push('failed upload and retry');
   }else await upload(editor,image,false);
   await page.locator('#artworkOrderStatus').filter({hasText:'Artwork uploaded and attached'}).waitFor();
   const reference=await page.locator('input[name="Artwork Reference"]').inputValue();assert.match(reference,/^[a-f0-9]{32}\.[A-Za-z0-9_-]{43}$/);
   result.references.push(reference);
   await editor.close();editor=await openEditor(page);
   assert.equal(await editor.locator('#restoreRecovery').count(),1);
   await editor.locator('#restoreRecovery').click();
   await editor.reload();await editor.locator('#restoreRecovery').click();
   await editor.locator('#finishBtn').click();await editor.locator('#completeArtwork').click();
   await editor.locator('#finishSuccess.show').waitFor({timeout:60000});
   const sessions=await editor.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('crosstalk-artwork-upload:')).map(k=>JSON.parse(localStorage.getItem(k))));
   assert(sessions.some(s=>s.id===reference.split('.')[0]));
   result.cases.push((mobile?'mobile Custom Finish':'desktop Printed Jacket')+' upload, reopen and recovery');
   if(!mobile){
    await page.locator('#packs [data-pack="Standard"]').click();
    assert.equal(await page.evaluate(()=>new FormData(document.querySelector('#orderForm')).has('Artwork Reference')),false);
    await page.locator('#packs [data-pack="Printed Jacket + Labels"]').click();
    assert.equal(await page.locator('input[name="Artwork Reference"]').inputValue(),reference);
    result.cases.push('switch to Standard and restore artwork');
   }
   let attempts=0;
   await customer(page,async route=>{attempts++;const data=route.request().postDataJSON();assert.equal(data.artworkReference,reference);await route.fulfill({status:attempts===1?503:202,contentType:'application/json',body:attempts===1?'{"error":"JOSH TEST injected submission error"}':JSON.stringify({testOrderId:data.testOrderId,artworkStatus:'bound',deliveryPending:false})});});
   const old=await page.evaluate(()=>sessionStorage.getItem('crosstalk-artwork-order-session'));
   await page.locator('button[type="submit"]').click();
   await page.locator('#testSubmitError').filter({hasText:'JOSH TEST injected submission error'}).waitFor();
   assert.equal(await page.locator('input[name="Artwork Reference"]').inputValue(),reference);
   assert.equal(await page.evaluate(()=>sessionStorage.getItem('crosstalk-artwork-order-session')),old);
   await page.locator('button[type="submit"]').click();await page.locator('#success').waitFor({state:'visible'});
   assert.equal(attempts,2);assert.equal(await page.locator('input[name="Artwork Reference"]').inputValue(),'');
   assert.notEqual(await page.evaluate(()=>sessionStorage.getItem('crosstalk-artwork-order-session')),old);
   result.cases.push((mobile?'mobile':'desktop')+' failed submission retry and confirmed reset');
   if(!mobile){
    await editor.close();await prepare(page,'Printed Jacket + Labels');
    const next=await openEditor(page);await upload(next,image,false);
    await page.locator('#artworkOrderStatus').filter({hasText:'Artwork uploaded and attached'}).waitFor();
    const second=await page.locator('input[name="Artwork Reference"]').inputValue();assert.notEqual(second,reference);
    result.references.push(second);result.cases.push('separate consecutive orders in one browser session');
    await next.close();
   }
   await context.close();
  }
  assert.notEqual(result.references[0],result.references[1]);
  const forgedContext=await guardedContext();const form=await forgedContext.newPage();await form.goto(base+'/calculator-preview.html');
  const opened=form.waitForEvent('popup');await form.evaluate(origin=>window.open(origin+'/designer.html?artworkSession=forged&returnOrigin=https%3A%2F%2Fevil.test','forgedArtwork'),base);
  const forged=await opened;forged.setDefaultTimeout(45000);await forged.locator('#imageInput').setInputFiles(image);
  await forged.locator('#finishBtn').click();await forged.locator('#completeArtwork').click();
  await forged.locator('#handoffStatus').filter({hasText:'not approved for artwork handoff'}).waitFor();
  result.cases.push('forged return origin rejected');await forgedContext.close();
  assert.deepEqual(failures,[]);
  await fs.writeFile(path.join(output,'hosted-result.json'),JSON.stringify({...result,references:result.references.map(r=>r.split('.')[0])},null,2));
  console.log(JSON.stringify({...result,references:result.references.map(r=>r.split('.')[0])},null,2));
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1});
