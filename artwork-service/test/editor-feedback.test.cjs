'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),packaged=require('@sparticuz/chromium');
const {rendererHTML}=require('../src/render.cjs');

test('small square rectangles, Layers, duplicate and flips work on desktop and mobile',async()=>{
 const html=await fs.readFile(path.join(__dirname,'../vendor/approved-editor.html'),'utf8');
 const server=http.createServer((_req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)}).listen(0,'127.0.0.1');
 await new Promise(resolve=>server.once('listening',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||await packaged.executablePath(),args:packaged.args.filter(arg=>arg!=='--single-process')});
 try{
  for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:mobile?{width:360,height:780}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/');
   assert.equal(await page.locator('#layersBtn').isVisible(),true);
   assert.equal(await page.locator('#layersBtn').evaluate(el=>el.getBoundingClientRect().right<=innerWidth),true);
   assert.equal(await page.locator('#finishBtn').evaluate(el=>el.getBoundingClientRect().right<=innerWidth),true);
   assert.equal(await page.locator('#downloadLayeredPackage').count(),0);
   await page.locator(mobile?'#mobileShapesBtn':'#shapesBtn').click();
   await page.locator('[data-shape="0"]').click();
   assert.equal(await page.locator('.design-layer.shape-layer rect').first().getAttribute('rx'),null);
   if(!mobile){
    await page.locator('#pLockRatio').uncheck();
    const before=await page.locator('.design-layer.shape-layer').boundingBox();
    const handle=await page.locator('.design-layer.shape-layer .resize-handle').boundingBox();
    await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);
    await page.mouse.down();
    await page.mouse.move(handle.x+handle.width/2-before.width*.93,handle.y+handle.height/2-before.height*.90,{steps:8});
    await page.mouse.up();
    const after=await page.locator('.design-layer.shape-layer').boundingBox(),board=await page.locator('#artboard').boundingBox();
    assert(after.width<board.width*.08,'rectangle can be much smaller than the old 8% limit');
    assert(after.height<board.height*.08,'rectangle can be a narrow eye bar');
   }
   await page.locator('#layersBtn').click();
   assert.equal(await page.locator('#layersDrawer').getAttribute('aria-hidden'),'false');
   await page.locator('#layerDuplicate').click();
   assert.equal(await page.locator('.design-layer.shape-layer').count(),2);
   await page.locator('#layerFlipX').click();
   await page.locator('#layerFlipY').click();
   assert.match(await page.locator('.design-layer.shape-layer.selected').evaluate(el=>el.style.transform),/scale\(-1, -1\)/);
   await page.locator('#closeLayers').click();
   assert.deepEqual(errors,[]);
   await page.close();
  }
  assert.match(await rendererHTML(),/__artworkRenderer/,'PSD renderer uses the updated approved editor');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
