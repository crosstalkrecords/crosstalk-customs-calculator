'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright'),packaged=require('@sparticuz/chromium');

test('playlist import error cannot execute markup in the order form',async()=>{
 const html=await fs.readFile(path.resolve(__dirname,'../../calculator.html'),'utf8');
 const server=http.createServer((_,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)}).listen(0,'127.0.0.1');
 await new Promise(resolve=>server.once('listening',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||await packaged.executablePath(),args:packaged.args.filter(a=>!['--single-process','--disable-web-security','--disable-site-isolation-trials'].includes(a))});
 try{
  const page=await browser.newPage();
  await page.route('**/api/playlist?**',route=>route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({ok:false,error:'<img src=x onerror=window.__playlistXss=1>'})}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.locator('#regularStart').click();
  await page.locator('#sizes [data-size="12"]').click();
  await page.locator('[data-step="1"] [data-next="2"]').click();
  await page.locator('#playlistUrl').fill('https://open.spotify.com/playlist/synthetic');
  await page.locator('#playlistTry').click();
  await page.locator('#playlistMsg').getByText('<img src=x onerror=window.__playlistXss=1>').waitFor();
  assert.equal(await page.locator('#playlistMsg img').count(),0);
  assert.equal(await page.evaluate(()=>window.__playlistXss),undefined);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
