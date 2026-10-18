'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {createCanvas,readPsd}=require('../src/psd.cjs');
const {makeApp}=require('../src/server.cjs'),{digest}=require('../src/project.cjs');
const root=path.resolve(__dirname,'../test-output');
function text(id,words,y,extra={}){return {id,type:'text',text:words,font:'Crosstalk Sans',fontSize:4,color:'#ffffff',align:'center',rotation:0,letterSpacing:0,opacity:1,x:.1,y,w:.8,h:.12,z:10,...extra};}
function fixture(hash,labelOnly=false){
 const photo={id:'photo',type:'image',name:'Photo with reversible crop and eraser',src:'asset:'+hash,aspect:1.5,x:.12,y:.37,w:.65,h:.45,rotation:11,fit:'cover',photoX:-.18,photoY:-.08,photoW:1.25,photoH:1.25,cropPreset:'free',opacity:.7,z:1,brightness:100,contrast:100,saturation:100,hue:0,maskStrokes:[{mode:'erase',width:.14,points:[{x:.1,y:.5},{x:.85,y:.5}]},{mode:'restore',width:.05,points:[{x:.45,y:.5},{x:.6,y:.5}]}]};
 const shape={id:'gradient',type:'shape',shape:'circle',name:'Gradient at 45 percent opacity',x:.68,y:.55,w:.2,h:.2,fillMode:'gradient',gradientStyle:'radial',fillA:'#fd9200',fillB:'#c12795',strokeEnabled:true,strokeWidth:5,strokeColor:'#f2d54c',lockRatio:true,opacity:.45,z:3};
 const hidden={...shape,id:'hidden',name:'HIDDEN green test layer',fillMode:'solid',fillA:'#00ff00',visible:false,z:30};
 const label=[{...photo,x:.08,y:.28,w:.8,h:.52,cropPreset:'circle'},text('label-title','JOSH TEST',.1,{fontSize:5}),text('label-side','JOSH TEST · SIDE A',.75,{fontSize:4}),hidden];
 return {format:'crosstalk-project',version:1,rendererVersion:'approved-d5b75f9-v1',surfaces:labelOnly?{labelB:label}:{front:[photo,shape,text('title','JOSH TEST',.1,{bold:true}),text('edit','JOSH TEST edit this line',.22,{fontSize:3.2}),text('rotated','JOSH TEST rotated text',.84,{font:'Crosstalk Mono',italic:true,rotation:-8,fontSize:3}),hidden],labelA:label},backgrounds:labelOnly?{labelB:{type:'solid',color:'#183049'}}:{front:{type:'gradient',a:'#183049',b:'#7b2440',angle:135},labelA:{type:'solid',color:'#183049'}}};
}
(async()=>{
 await fs.rm(root,{recursive:true,force:true});await fs.mkdir(root,{recursive:true});
 const c=createCanvas(900,600),x=c.getContext('2d');const g=x.createLinearGradient(0,0,900,600);g.addColorStop(0,'#ffad30');g.addColorStop(1,'#206ab2');x.fillStyle=g;x.fillRect(0,0,900,600);for(let i=0;i<8;i++){x.fillStyle=i%2?'#ffe08b':'#236851';x.fillRect(20+i*100,90+i*35,50,220);}const image=c.toBuffer('image/png'),hash=digest(image);
 const config={testLabel:'JOSH TEST',dataDir:path.join(root,'private'),bindSecret:'synthetic-only-'.repeat(4),origins:['https://synthetic.test'],mode:'synthetic',dropboxRoot:'/Crosstalk Customs/Testing',testDestination:path.join(root,'delivered')};
 const service=makeApp(config,{worker:{interval:999999}}),server=service.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 const results=[];
 try{
  for(const [order,labelOnly] of [['JOSH TEST A',false],['JOSH TEST B',true]]){
   const session=await(await fetch(base+'/v1/drafts',{method:'POST',headers:{Origin:'https://synthetic.test'}})).json();const auth={Origin:'https://synthetic.test',Authorization:'Bearer '+session.token};
   let res=await fetch(base+'/v1/drafts/'+session.id+'/assets/'+hash,{method:'PUT',headers:auth,body:image});assert.equal(res.status,200,await res.text());
   const project=fixture(hash,labelOnly);res=await fetch(base+'/v1/drafts/'+session.id+'/commit',{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify(project)});assert.equal(res.status,200);const {reference}=await res.json();
   res=await fetch(base+'/internal/bind',{method:'POST',headers:{Authorization:'Bearer '+config.bindSecret,'Content-Type':'application/json'},body:JSON.stringify({reference,orderId:order,folder:config.dropboxRoot+'/'+order+'/Uploads'})});assert.equal(res.status,202);
   console.log('Processing '+order);const started=Date.now();await service.worker.tick();const job=service.store.get(session.id);assert.equal(job.state,'delivered',job.error);
   const output=path.join(service.store.dir(session.id),'output');const docs=[];
   for(const name of await fs.readdir(output))if(name.endsWith('.psd')){
    const buf=await fs.readFile(path.join(output,name)),doc=readPsd(buf,{skipLayerImageData:true,skipCompositeImageData:true,skipThumbnail:true});
    const layers=doc.children[0].children||doc.children;assert(layers.some(l=>l.text));assert(layers.some(l=>l.hidden&&l.name==='HIDDEN green test layer'));assert(layers.some(l=>l.mask));assert(layers.some(l=>Math.abs(l.opacity-.7)<.01));if(name.startsWith('label'))assert(doc.children[0].mask);
    docs.push({file:name,width:doc.width,height:doc.height,nativeText:layers.filter(l=>l.text).length,bytes:buf.length});
   }
   results.push({order,id:session.id,elapsedMs:Date.now()-started,documents:docs});
   if(!labelOnly){await fs.cp(output,path.join(root,'Photoshop-check'),{recursive:true});await fs.cp(path.join(__dirname,'../public/fonts'),path.join(root,'Photoshop-check/Fonts'),{recursive:true});}
  }
  const dirs=await fs.readdir(config.testDestination);assert.deepEqual(dirs.sort(),['JOSH_TEST_A','JOSH_TEST_B']);for(const d of dirs)assert.equal((await fs.readdir(path.join(config.testDestination,d))).length,1);
  await fs.writeFile(path.join(root,'acceptance.json'),JSON.stringify({syntheticOnly:true,remoteDropboxVerified:false,photoshopVerified:false,results},null,2));console.log(JSON.stringify(results,null,2));
 }finally{await new Promise(r=>server.close(r));await service.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={fixture};
