'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const packaged=require('@sparticuz/chromium');

test('an attached artwork reference survives refresh only for its order session',async()=>{
 const root=path.resolve(__dirname,'../..');
 const source=await fs.readFile(path.join(root,'calculator.html'),'utf8');
 const script=await fs.readFile(path.join(root,'artwork-service/public/calculator-artwork.js'),'utf8');
 // This test never sends a request to the live order webhook.
 const html=source.replace(/https:\/\/hook\.eu1\.make\.com\/[a-zA-Z0-9]+/g,'/order-submission-disabled')
  .replace('</body>','<script src="/calculator-artwork.js"></script></body>');
 const reference='a'.repeat(32)+'.'+'B'.repeat(43);
 const server=http.createServer((req,res)=>{
  if(req.url==='/calculator-artwork.js')return res.writeHead(200,{'Content-Type':'application/javascript'}).end(script);
  if(req.url?.startsWith('/designer.html'))return res.writeHead(200,{'Content-Type':'text/html'}).end(`<!doctype html><script>addEventListener('load',()=>opener.postMessage({type:'crosstalk-artwork-complete',session:new URLSearchParams(location.search).get('artworkSession'),reference:'${reference}'},location.origin))</script>`);
  res.writeHead(200,{'Content-Type':'text/html'}).end(html);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||await packaged.executablePath(),args:packaged.args.filter(a=>!['--single-process','--disable-web-security','--disable-site-isolation-trials'].includes(a))});
  const page=await browser.newPage();
  const origin='http://127.0.0.1:'+server.address().port;
  await page.goto(origin);
  await page.locator('#regularStart').click();
  await page.locator('#sizes [data-size="12"]').click();
  await page.locator('[data-step="1"] [data-next="2"]').click();
  await page.getByText('Prefer to type a tracklist manually?').click();
  await page.locator('#manual').fill('A1 - synthetic test');
  await page.locator('[data-step="2"] [data-next="3"]').click();
  await page.locator('#packs [data-pack="Printed Jacket + Labels"]').click();
  await page.locator('#chooseCustomArtwork').check();
  const popup=page.waitForEvent('popup');await page.locator('#openArtworkDesigner').click();const editor=await popup;
  await page.locator('#artworkOrderStatus').filter({hasText:'Artwork uploaded and attached'}).waitFor();
  assert.equal(await page.locator('input[name="Artwork Reference"]').inputValue(),reference);
  const oldSession=await page.evaluate(()=>sessionStorage.getItem('crosstalk-artwork-order-session'));
  await editor.close();

  await page.reload();
  await page.locator('#regularStart').click();
  await page.locator('#sizes [data-size="12"]').click();
  await page.locator('[data-step="1"] [data-next="2"]').click();
  await page.getByText('Prefer to type a tracklist manually?').click();
  await page.locator('#manual').fill('A1 - synthetic test');
  await page.locator('[data-step="2"] [data-next="3"]').click();
  await page.locator('#packs [data-pack="Printed Jacket + Labels"]').click();
  assert.equal(await page.locator('input[name="Artwork Reference"]').inputValue(),reference);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('crosstalk-artwork-order-session')),oldSession);

  await page.evaluate(()=>dispatchEvent(new Event('crosstalk-order-success')));
  assert.equal(await page.locator('input[name="Artwork Reference"]').inputValue(),'');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('crosstalk-artwork-order-reference')),null);
  assert.notEqual(await page.evaluate(()=>sessionStorage.getItem('crosstalk-artwork-order-session')),oldSession);
  await page.reload();
  await page.locator('#regularStart').click();
  await page.locator('#sizes [data-size="12"]').click();
  await page.locator('[data-step="1"] [data-next="2"]').click();
  await page.getByText('Prefer to type a tracklist manually?').click();
  await page.locator('#manual').fill('A1 - another synthetic order');
  await page.locator('[data-step="2"] [data-next="3"]').click();
  await page.locator('#packs [data-pack="Printed Jacket + Labels"]').click();
  assert.equal(await page.locator('input[name="Artwork Reference"]').inputValue(),'');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
