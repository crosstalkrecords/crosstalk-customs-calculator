'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright'),packaged=require('@sparticuz/chromium');
const {makeApp}=require('../src/server.cjs');
const {createCanvas}=require('../src/psd.cjs');
(async()=>{
 const root=path.resolve(__dirname,'../test-output/ui');await fs.mkdir(root,{recursive:true});
 const canvas=createCanvas(120,80);const cx=canvas.getContext('2d');cx.fillStyle='#f4b520';cx.fillRect(0,0,120,80);await fs.writeFile(path.join(root,'synthetic-source.png'),canvas.toBuffer('image/png'));
 const service=makeApp({dataDir:path.join(root,'private'),bindSecret:'ui-test-secret-'.repeat(4),origins:['http://127.0.0.1:4311'],mode:'disabled',dropboxRoot:'/Crosstalk Customs/Testing'},{worker:{interval:999999}});
 const server=service.app.listen(4311,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||await packaged.executablePath(),args:packaged.args.filter(a=>!['--single-process','--disable-web-security','--disable-site-isolation-trials'].includes(a))});
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1365,height:900},isMobile:mobile,hasTouch:mobile});const page=await context.newPage();page.setDefaultTimeout(12000);console.log('Opening '+(mobile?'mobile':'desktop'));page.on('pageerror',e=>console.log('UI error: '+e.message));
   await page.goto('http://127.0.0.1:4311/calculator-preview.html');
   assert.equal(await page.locator('#openArtworkDesigner').count(),1);
   const popupPromise=page.waitForEvent('popup');await page.locator('#openArtworkDesigner').click();const editor=await popupPromise;await editor.waitForLoadState('domcontentloaded');editor.setDefaultTimeout(12000);console.log('Designer opened');await editor.locator('#imageInput').setInputFiles(path.join(root,'synthetic-source.png'));await editor.locator('.layer.image').count();
   await editor.locator(mobile?'#mobileTextBtn':'#addTextBtn').click();
   // Close the existing mobile editor through its visible Done control.
   if(mobile){const buttons=editor.getByRole('button',{name:/^(Done|Apply|Save)$/i});if(await buttons.count())await buttons.first().click();}
   console.log('Text added');await editor.locator('#finishBtn').click();console.log('Finish opened');await editor.locator('#completeArtwork').click();console.log('Upload clicked');await editor.waitForTimeout(1000);console.log('Upload status:',await editor.locator('#exportStatus').textContent());
   await page.locator('#artworkOrderStatus').filter({hasText:'Artwork uploaded and attached'}).waitFor({timeout:7000});
   const reference=await page.locator('input[name="Artwork Reference"]').inputValue();assert.match(reference,/^[a-f0-9]{32}\./);
   await editor.screenshot({path:path.join(root,mobile?'mobile-uploaded.png':'desktop-uploaded.png'),fullPage:false});
   const before=service.store.db.prepare('SELECT count(*) AS n FROM jobs').get().n;
   await editor.reload();await editor.locator('#restoreRecovery').count();
   // Use the public handoff module with the exact same tiny synthetic design to
   // check that a refresh resumes the sealed upload rather than creating another.
   await editor.locator('#restoreRecovery').click();await editor.locator('#finishBtn').click();await editor.locator('#completeArtwork').click();await editor.locator('#finishSuccess.show').waitFor();
   const saved=await editor.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('crosstalk-artwork-upload:')).map(k=>JSON.parse(localStorage.getItem(k))));
   assert(saved.some(s=>s.id===reference.split('.')[0]));assert.equal(service.store.db.prepare('SELECT count(*) AS n FROM jobs').get().n,before);
   await context.close();console.log((mobile?'Mobile':'Desktop')+' upload, opener handoff and refresh resumption passed');
  }
 }finally{await browser.close();await new Promise(r=>server.close(r));await service.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
