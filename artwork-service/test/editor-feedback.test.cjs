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
   const layers=page.locator(mobile?'#mobileLayersTopBtn':'#layersBtn');
   assert.equal(await layers.isVisible(),true);
   assert.equal(await layers.evaluate(el=>el.getBoundingClientRect().right<=innerWidth),true);
   if(!mobile){
    assert.equal(await page.locator('#layersBtn').evaluate(el=>el.parentElement?.id==='surfaceTabs'),true);
    assert.equal(await page.locator('#layersBtn').evaluate(el=>el.getBoundingClientRect().width>=240),true);
    assert.equal(await page.locator('#layersBtn').evaluate(el=>getComputedStyle(el).textAlign),'center');
   }
   assert.equal(await page.locator('#surfaceTabChoices .surface-tab').count(),4);
   assert.equal(await page.locator('.guidance').innerText(),'Extend your artwork to the edge, but keep important information inside the dotted line.');
   assert.equal(await page.locator('#safetyWarning').innerText(),'Some text is outside the dotted line. It may be cut off during production.');
   assert.equal(await page.locator('.guide-note,.wheel-hint').count(),0);
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
   await layers.click();
   assert.equal(await page.locator('#layersDrawer').getAttribute('aria-hidden'),'false');
   await page.locator('#layerDuplicate').click();
   assert.equal(await page.locator('.design-layer.shape-layer').count(),2);
   await page.locator('#layerFlipX').click();
   await page.locator('#layerFlipY').click();
   assert.match(await page.locator('.design-layer.shape-layer.selected').evaluate(el=>el.style.transform),/scale\(-1, -1\)/);
   await page.locator('#closeLayers').click();
   await page.locator(mobile?'#mobileMarksBtn':'#marksBtn').click();
   assert.equal(await page.getByText('Approved logo from supplied template').count(),0);
   assert.equal(await page.getByRole('button',{name:'Add Crosstalk Records logo'}).count(),1);
   await page.locator('#cancelMarks').click();
   if(!mobile){
    await page.locator('#projectPreviewGrid [data-preview-surface="labelA"]').waitFor();
    await page.locator('#projectPreviewGrid [data-preview-surface="labelA"]').click();
    await page.locator('#largePreview img').waitFor();
    for(const viewport of [{width:1280,height:600},{width:360,height:568}]){
     await page.setViewportSize(viewport);
     const layout=await page.locator('.preview-dialog-card').evaluate(card=>{
      const bounds=card.getBoundingClientRect(),actions=card.querySelector('.preview-dialog-actions').getBoundingClientRect(),preview=card.querySelector('.large-preview').getBoundingClientRect();
      return {scrollHeight:card.scrollHeight,clientHeight:card.clientHeight,top:bounds.top,bottom:bounds.bottom,actionsBottom:actions.bottom,previewBottom:preview.bottom,viewportHeight:innerHeight};
     });
     assert(layout.scrollHeight<=layout.clientHeight+1,'preview card should not need a scrollbar');
     assert(layout.top>=0&&layout.bottom<=layout.viewportHeight,'preview card fits the viewport');
     assert(layout.actionsBottom<=layout.viewportHeight&&layout.previewBottom<=layout.actionsBottom,'Close and Edit this design remain visible');
    }
    await page.locator('#previewEditDesign').click();
    assert.equal(await page.locator('#previewModal').evaluate(el=>el.classList.contains('open')),false);
    assert.equal(await page.locator('#surfaceTabChoices .surface-tab.active').innerText(),'Side A label');
   }
   assert.deepEqual(errors,[]);
   await page.close();
  }
  assert.match(await rendererHTML(),/__artworkRenderer/,'PSD renderer uses the updated approved editor');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
