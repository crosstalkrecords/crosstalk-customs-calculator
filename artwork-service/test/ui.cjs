'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),packaged=require('@sparticuz/chromium');
const {makeApp}=require('../src/server.cjs');
const {createCanvas}=require('../src/psd.cjs');
(async()=>{
 const root=path.resolve(__dirname,'../test-output/ui');await fs.mkdir(root,{recursive:true});
 const canvas=createCanvas(120,80);const cx=canvas.getContext('2d');cx.fillStyle='#f4b520';cx.fillRect(0,0,120,80);await fs.writeFile(path.join(root,'synthetic-source.png'),canvas.toBuffer('image/png'));
 const service=makeApp({dataDir:path.join(root,'private'),bindSecret:'ui-test-secret-'.repeat(4),origins:['http://127.0.0.1:4311','http://127.0.0.1:4312'],mode:'disabled',dropboxRoot:'/Crosstalk Customs/Testing'},{worker:{interval:999999}});
 const server=service.app.listen(4311,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const preview=(await fs.readFile(path.resolve(__dirname,'../public/calculator-preview.html'),'utf8')).replace('<script src="calculator-artwork.js"></script>','<script src="http://127.0.0.1:4311/calculator-artwork.js"></script>');
 const formServer=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(preview)}).listen(4312,'127.0.0.1');
 await new Promise(r=>formServer.once('listening',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||await packaged.executablePath(),args:packaged.args.filter(a=>!['--single-process','--disable-web-security','--disable-site-isolation-trials'].includes(a))});
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1365,height:900},isMobile:mobile,hasTouch:mobile});const page=await context.newPage();page.setDefaultTimeout(12000);console.log('Opening '+(mobile?'mobile':'desktop'));page.on('pageerror',e=>console.log('UI error: '+e.message));
   await page.goto(mobile?'http://127.0.0.1:4312/':'http://127.0.0.1:4311/calculator-preview.html');
   assert.equal(await page.locator('#openArtworkDesigner').count(),1);
   assert.equal(await page.locator('#openArtworkDesigner').isVisible(),false);
   await page.locator('#regularStart').click();
   await page.locator('#sizes [data-size="12"]').click();
   await page.locator('[data-step="1"] [data-next="2"]').click();
   await page.getByText('Prefer to type a tracklist manually?').click();
   await page.locator('#manual').fill('A1 - JOSH TEST track');
   await page.locator('[data-step="2"] [data-next="3"]').click();
   assert.equal(await page.locator('#openArtworkDesigner').isVisible(),false);
   await page.locator('#packs [data-pack="Custom Finish Pack"]').click();
   assert.equal(await page.locator('#openArtworkDesigner').isVisible(),true);
   assert.equal(await page.locator('input[name="Artwork Reference"]').isEnabled(),true);
   await page.locator('#packs [data-pack="Printed Jacket + Labels"]').click();
   assert.equal(await page.locator('#openArtworkDesigner').isVisible(),true);
   assert.equal(await page.locator('input[name="Artwork Reference"]').isEnabled(),true);
   const popupPromise=page.waitForEvent('popup');await page.locator('#openArtworkDesigner').click();const editor=await popupPromise;await editor.waitForLoadState('domcontentloaded');editor.setDefaultTimeout(12000);console.log('Designer opened');await editor.locator('#imageInput').setInputFiles(path.join(root,'synthetic-source.png'));await editor.locator('.layer.image').count();
   await editor.locator(mobile?'#mobileTextBtn':'#addTextBtn').click();
   // Close the existing mobile editor through its visible Done control.
   if(mobile){const buttons=editor.getByRole('button',{name:/^(Done|Apply|Save)$/i});if(await buttons.count())await buttons.first().click();}
   console.log('Text added');await editor.locator('#finishBtn').click();console.log('Finish opened');await editor.locator('#completeArtwork').click();console.log('Upload clicked');await editor.waitForTimeout(1000);console.log('Upload status:',await editor.locator('#handoffStatus').textContent());
   await page.locator('#artworkOrderStatus').filter({hasText:'Artwork uploaded and attached'}).waitFor({timeout:7000});
   const reference=await page.locator('input[name="Artwork Reference"]').inputValue();assert.match(reference,/^[a-f0-9]{32}\./);
   await page.locator('#packs [data-pack="Standard"]').click();
   assert.equal(await page.locator('#openArtworkDesigner').isVisible(),false);
   assert.equal(await page.locator('input[name="Artwork Reference"]').isEnabled(),false);
   assert.equal(await page.evaluate(()=>new FormData(document.getElementById('orderForm')).has('Artwork Reference')),false);
   await page.locator('#packs [data-pack="Printed Jacket + Labels"]').click();
   assert.equal(await page.locator('input[name="Artwork Reference"]').inputValue(),reference);
   assert.equal(await page.evaluate(()=>new FormData(document.getElementById('orderForm')).get('Artwork Reference')),reference);
   await editor.screenshot({path:path.join(root,mobile?'mobile-uploaded.png':'desktop-uploaded.png'),fullPage:false});
   const before=service.store.db.prepare('SELECT count(*) AS n FROM jobs').get().n;
   await editor.reload();await editor.locator('#restoreRecovery').count();
   // Use the public handoff module with the exact same tiny synthetic design to
   // check that a refresh resumes the sealed upload rather than creating another.
   await editor.locator('#restoreRecovery').click();await editor.locator('#finishBtn').click();await editor.locator('#completeArtwork').click();await editor.locator('#finishSuccess.show').waitFor();
   const saved=await editor.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('crosstalk-artwork-upload:')).map(k=>JSON.parse(localStorage.getItem(k))));
   assert(saved.some(s=>s.id===reference.split('.')[0]));assert.equal(service.store.db.prepare('SELECT count(*) AS n FROM jobs').get().n,before);
   const oldSession=await page.evaluate(()=>sessionStorage.getItem('crosstalk-artwork-order-session'));
   await page.locator('[data-step="3"] [data-next="4"]').click();
   await page.locator('.audio[data-audio="have"]').click();
   await page.locator('[data-step="4"] [data-next="5"]').click();
   await page.locator('input[name="Customer Name"]').fill('JOSH TEST');
   await page.locator('input[name="Email"]').fill('josh-test@example.invalid');
   await page.locator('input[name="Custom Field 1"]').fill('0400000000');
   await page.locator('#terms').check();
   let attempts=0;
   await page.route('**/order-submission-disabled',route=>route.fulfill({status:++attempts===1?503:200,contentType:'application/json',body:'{"upload_link":"https://example.invalid/JOSH-TEST-upload"}'}));
   page.on('dialog',dialog=>dialog.accept());
   await page.getByRole('button',{name:'Place My Order'}).click();
   await page.getByRole('button',{name:'Place My Order'}).waitFor();
   assert.equal(await page.locator('input[name="Artwork Reference"]').inputValue(),reference);
   assert.equal(await page.evaluate(()=>sessionStorage.getItem('crosstalk-artwork-order-session')),oldSession);
   await page.getByRole('button',{name:'Place My Order'}).click();
   await page.locator('#success').waitFor({state:'visible'});
   assert.equal(attempts,2);
   assert.equal(await page.locator('input[name="Artwork Reference"]').inputValue(),'');
   assert.notEqual(await page.evaluate(()=>sessionStorage.getItem('crosstalk-artwork-order-session')),oldSession);
   await context.close();console.log((mobile?'Mobile':'Desktop')+' upload, opener handoff, retry and confirmed-order reset passed');
  }
  // A standard order completes without an artwork reference or a draft.
  const plainContext=await browser.newContext();const plain=await plainContext.newPage();
  await plain.goto('http://127.0.0.1:4311/calculator-preview.html');
  const plainJobs=service.store.db.prepare('SELECT count(*) AS n FROM jobs').get().n;
  await plain.locator('#regularStart').click();
  await plain.locator('#sizes [data-size="12"]').click();
  await plain.locator('[data-step="1"] [data-next="2"]').click();
  await plain.getByText('Prefer to type a tracklist manually?').click();
  await plain.locator('#manual').fill('A1 - JOSH TEST standard order');
  await plain.locator('[data-step="2"] [data-next="3"]').click();
  assert.equal(await plain.locator('#openArtworkDesigner').isVisible(),false);
  await plain.locator('[data-step="3"] [data-next="4"]').click();
  await plain.locator('.audio[data-audio="have"]').click();
  await plain.locator('[data-step="4"] [data-next="5"]').click();
  await plain.locator('input[name="Customer Name"]').fill('JOSH TEST');
  await plain.locator('input[name="Email"]').fill('standard@example.invalid');
  await plain.locator('input[name="Custom Field 1"]').fill('0400000000');
  let plainAttempts=0,plainBody='';
  await plain.route('**/order-submission-disabled',async route=>{plainAttempts++;plainBody=route.request().postData()||'';await route.fulfill({status:200,contentType:'application/json',body:'{}'});});
  await plain.getByRole('button',{name:'Place My Order'}).click();
  assert.equal(plainAttempts,0,'Terms validation must prevent submission');
  await plain.locator('#terms').check();
  await plain.getByRole('button',{name:'Place My Order'}).click();
  await plain.locator('#success').waitFor({state:'visible'});
  assert.equal(plainAttempts,1);
  assert.equal(plainBody.includes('name="Artwork Reference"'),false);
  assert.equal(service.store.db.prepare('SELECT count(*) AS n FROM jobs').get().n,plainJobs);
  await plainContext.close();console.log('Standard order, required terms, and no-artwork payload passed');
  // A forged return destination must fail before creating an upload session.
  const blocked=await browser.newContext();const form=await blocked.newPage();await form.goto('http://127.0.0.1:4312/');
  const popupPromise=form.waitForEvent('popup');
  await form.evaluate(()=>window.open('http://127.0.0.1:4311/designer.html?artworkSession=forged&returnOrigin=https%3A%2F%2Fevil.test','forgedArtwork'));
  const forged=await popupPromise;await forged.locator('#imageInput').setInputFiles(path.join(root,'synthetic-source.png'));
  await forged.locator('#finishBtn').click();
  const beforeBlocked=service.store.db.prepare('SELECT count(*) AS n FROM jobs').get().n;
  await forged.locator('#completeArtwork').click();
  await forged.locator('#handoffStatus').filter({hasText:'not approved for artwork handoff'}).waitFor();
  assert.equal(service.store.db.prepare('SELECT count(*) AS n FROM jobs').get().n,beforeBlocked);
  await blocked.close();console.log('Unapproved return origin rejected before upload');
 }finally{await browser.close();await new Promise(r=>formServer.close(r));await new Promise(r=>server.close(r));await service.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
