'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const {SURFACES}=require('./project.cjs');
const {decode,pixelLayer,mask,fontName,nativeText,writePsdBuffer}=require('./psd.cjs');
const ROOT=path.resolve(__dirname,'..');
async function rendererHTML(){
 const original=await fs.readFile(path.join(ROOT,'vendor/approved-editor.html'),'utf8');
 const blob=crypto.createHash('sha1').update(`blob ${Buffer.byteLength(original)}\0`).update(original).digest('hex');
 if(blob!=='d38ee5689fa164ac1cc9c2f0c239ec1b3dac03cf')throw Error('Approved renderer source changed');
 const lab=await fs.readFile(path.join(ROOT,'vendor/lab-hook.js'),'utf8');
 const helpers=lab.slice(lab.indexOf('function labCanvas'),lab.indexOf("document.getElementById('labRender').onclick"));
 const hook=`${helpers}
 window.__artworkRenderer={
 set(project){state.surfaces={front:[],back:[],labelA:[],labelB:[],...project.surfaces};state.backgrounds={...blankBackgrounds(),...project.backgrounds};},
 async setupFonts(fonts){for(const f of fonts){const face=new FontFace(f.family,f.bytes,{weight:f.weight,style:f.style});await face.load();document.fonts.add(face)}await document.fonts.ready;},
 async base(id){const spec=SURFACES.find(s=>s.id===id),size=spec.size,ref=await drawSurface(id,size),bg=labCanvas(size),boundary=labCanvas(size);canvasBackground(bg.getContext('2d'),size,state.backgrounds[id]);const x=boundary.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,size,size);finishSurfaceShape(x,spec,size);const result={reference:ref.toDataURL(),background:bg.toDataURL(),boundary:boundary.toDataURL(),shape:spec.shape};ref.width=ref.height=bg.width=bg.height=boundary.width=boundary.height=1;return result;},
 async layer(id,index){const l=state.surfaces[id].slice().sort((a,b)=>(a.z||0)-(b.z||0))[index],size=SURFACES.find(s=>s.id===id).size,entry={raster:await labRaster(l,size)};if(l.type==='text'){entry.metrics=labTextMetrics(l,size);entry.fillRaster=await labRaster({...l,textStrokeEnabled:false},size)}if(l.type==='image')Object.assign(entry,await labPhoto(l,size));return entry;}
 };`;
 if(!original.includes('})();\n</script>'))throw Error('Renderer insertion anchor missing');
 return original.replace('})();\n</script>',hook+'\n})();\n</script>');
}
async function fonts(){
 const result=[];
 for(const [family,base] of [['Crosstalk Sans','DejaVuSans'],['Crosstalk Serif','DejaVuSerif'],['Crosstalk Mono','DejaVuSansMono']]){
  for(const [suffix,weight,style] of [['','400','normal'],['-Bold','700','normal'],['-Oblique','400','italic'],['-BoldOblique','700','italic']]){
   try{const bytes=await fs.readFile(path.join(ROOT,'public/fonts',base+suffix+'.ttf'));result.push({family,bytes:'url(data:font/ttf;base64,'+bytes.toString('base64')+')',weight,style});}catch(e){if(e.code!=='ENOENT')throw e;}
  }
 }
 return result;
}
async function renderProject(project,assetDir,out){
 await fs.mkdir(out,{recursive:true});
 const packaged=require('@sparticuz/chromium');
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||await packaged.executablePath(),args:packaged.args});
 const timer=setTimeout(()=>browser.close().catch(()=>{}),180000);
 const manifest={rendererVersion:project.rendererVersion,surfaces:[],notes:['Native text uses explicit line breaks. Shapes/gradients/drawings are separate raster layers. Unsupported/system fonts use named raster fallback layers; original wording is preserved in project.json.']};
 try{
  const page=await browser.newPage({viewport:{width:1200,height:900}});
  await page.route('**/*',route=>route.abort()); // No customer-controlled network requests.
  await page.setContent(await rendererHTML(),{waitUntil:'domcontentloaded'});
  const resolved=structuredClone(project);
  for(const list of Object.values(resolved.surfaces))for(const l of list)if(l.type==='image'){
   const bytes=await fs.readFile(path.join(assetDir,l.src.slice(6)));
   // Image MIME is verified at intake; Chromium sniffs the embedded image.
   l.src='data:application/octet-stream;base64,'+bytes.toString('base64');
  }
  await page.evaluate(({project,fonts})=>window.__artworkRenderer.setupFonts(fonts).then(()=>window.__artworkRenderer.set(project)),{project:resolved,fonts:await fonts()});
  for(const [id,size] of Object.entries(SURFACES)){
   const ordered=(project.surfaces[id]||[]).slice().sort((a,b)=>(a.z||0)-(b.z||0));
   if(!ordered.length&&!project.backgrounds?.[id])continue;
   const base=await page.evaluate(id=>window.__artworkRenderer.base(id),id);
   const children=[await pixelLayer(base.background,'Background')],fallbacks=[];
   for(let index=0;index<ordered.length;index++){
    const l=ordered[index],e=await page.evaluate(({id,index})=>window.__artworkRenderer.layer(id,index),{id,index});
    let layer;
    if(l.type==='image'){layer=await pixelLayer(e.unmasked,l.name||'Photo');layer.mask=await mask(e.mask);}
    else if(l.type==='text'&&fontName(l)){
     layer=await pixelLayer(e.fillRaster,l.name||l.text);layer.text=nativeText(l,e.metrics,size);
     if(l.textStrokeEnabled)layer.effects={stroke:[{enabled:true,present:true,showInDialog:true,size:{units:'Pixels',value:Math.max(1,Math.round(l.textStrokeWidth/100*size))},position:'center',fillType:'color',blendMode:'normal',opacity:1,color:{r:parseInt(l.textStrokeColor.slice(1,3),16),g:parseInt(l.textStrokeColor.slice(3,5),16),b:parseInt(l.textStrokeColor.slice(5,7),16)}}]};
     children.push({...await pixelLayer(e.raster,'Preview backup — '+l.id),hidden:true});
    }else{
     layer=await pixelLayer(e.raster,l.name||l.text||l.shape||l.id);
     if(l.type==='text'){layer.name='Raster text — '+l.id;fallbacks.push({id:l.id,font:l.font,reason:'Exact font/style not pinned'});}
    }
    layer.opacity=l.opacity??1;layer.hidden=l.visible===false;children.push(layer);
   }
   const doc={width:size,height:size,canvas:await decode(base.reference),children:base.shape==='circle'?[{name:'Circular label boundary and centre hole',children,mask:await mask(base.boundary)}]:children,imageResources:{resolutionInfo:{horizontalResolution:300,horizontalResolutionUnit:'PPI',widthUnit:'Inches',verticalResolution:300,verticalResolutionUnit:'PPI',heightUnit:'Inches'}}};
   await fs.writeFile(path.join(out,id+'.psd'),writePsdBuffer(doc,{noBackground:true}));
   await fs.writeFile(path.join(out,id+'-reference.png'),Buffer.from(base.reference.split(',')[1],'base64'));
   manifest.surfaces.push({id,size,editorLayers:ordered.length,nativeText:ordered.filter(l=>l.type==='text'&&fontName(l)).length,fallbacks});
   doc.canvas.width=doc.canvas.height=1;for(const l of children)if(l.canvas)l.canvas.width=l.canvas.height=1;
  }
  await fs.writeFile(path.join(out,'conversion.json'),JSON.stringify(manifest,null,2));return manifest;
 }finally{clearTimeout(timer);await browser.close();}
}
module.exports={renderProject,rendererHTML,fonts};
