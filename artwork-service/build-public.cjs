'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=__dirname;
let html=fs.readFileSync(path.join(root,'vendor/approved-editor.html'),'utf8');
const css=[];
for(const [family,base] of [['Crosstalk Sans','DejaVuSans'],['Crosstalk Serif','DejaVuSerif'],['Crosstalk Mono','DejaVuSansMono']])for(const [suffix,weight,style] of [['',400,'normal'],['-Bold',700,'normal'],['-Oblique',400,'italic'],['-BoldOblique',700,'italic']])if(fs.existsSync(path.join(root,'public/fonts',base+suffix+'.ttf')))css.push(`@font-face{font-family:'${family}';src:url('fonts/${base+suffix}.ttf');font-weight:${weight};font-style:${style};font-display:block}`);
html=html.replace('</head>','<style>'+css.join('')+'</style><script src="handoff.js"></script></head>');
html=html.replace('const FONTS=[',"const FONTS=[{label:'Crosstalk Sans (PSD text)',value:'Crosstalk Sans'},{label:'Crosstalk Serif (PSD text)',value:'Crosstalk Serif'},{label:'Crosstalk Mono (PSD text)',value:'Crosstalk Mono'},");
html=html.replace("return{font:'Arial, Helvetica, sans-serif',fontSize:5.8", "return{font:'Crosstalk Sans',fontSize:5.8");
const hook=`
// Delivery integration: source/state only; no print-size layer rasterization here.
for(const id of ['addTextBtn','mobileTextBtn'])$(id).onclick=async()=>{try{await document.fonts.load('700 32px "Crosstalk Sans"');addText()}catch(_){showToast('The artwork font could not load. Please retry.')}};
saveNow=async function(){try{const db=await openDB();if(!db)throw Error();const data=JSON.parse(snapshot());data.version=4;data.savedAt=new Date().toISOString();await new Promise((resolve,reject)=>{const tx=db.transaction('projects','readwrite');tx.objectStore('projects').put(data,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});$('saveStatus').textContent='Saved on this device'}catch(_){$('saveStatus').textContent='Saved for this session'}};
$('completeArtwork').onclick=async()=>{
 const button=$('completeArtwork'),status=$('exportStatus');button.disabled=true;
 try{
  await saveNow();
  const project={format:'crosstalk-project',version:1,rendererVersion:'approved-d5b75f9-v1',surfaces:Object.fromEntries(Object.entries(state.surfaces).map(([id,layers])=>[id,layers.map(l=>({...l}))])),backgrounds:structuredClone(state.backgrounds)};
  const result=await window.CrosstalkHandoff.upload(project,message=>status.textContent=message);
  const session=new URLSearchParams(location.search).get('artworkSession');
  if(window.opener&&session)window.opener.postMessage({type:'crosstalk-artwork-complete',reference:result.reference,session},location.origin);
  status.textContent='Artwork uploaded. Place your order to queue its PSD delivery.';
  $('finishContent').style.display='none';$('finishSuccess').classList.add('show');
 }catch(error){status.textContent=error.message||'Artwork could not be uploaded. Your draft is still on this device.';}finally{button.disabled=false;}
};
`;
html=html.replace('})();\n</script>',hook+'\n})();\n</script>');
html=html.replace('Your artwork is saved on this device.', 'Your draft is saved on this device.');
html=html.replace('<strong>Artwork saved ✓</strong><p>Your designs are saved in this browser. Return to your order tab to continue.</p>','<strong>Artwork uploaded ✓</strong><p>Return to your order tab and place your order to queue its PSD delivery. Your draft is also saved in this browser.</p>');
fs.writeFileSync(path.join(root,'public/designer.html'),html);
fs.mkdirSync(path.join(root,'public/assets'),{recursive:true});fs.copyFileSync(path.join(root,'../assets/crosstalk-logo.png'),path.join(root,'public/assets/crosstalk-logo.png'));
// This is a non-production calculator preview. Its existing Make URL is removed.
let calculator=fs.readFileSync(path.join(root,'../calculator.html'),'utf8');
const before=calculator;calculator=calculator.replace(/https:\/\/hook\.eu1\.make\.com\/[a-zA-Z0-9]+/g,'/order-submission-disabled');
if(calculator===before||calculator.includes('hook.eu1.make.com'))throw Error('Preview order endpoint replacement failed');
calculator=calculator.replace('</body>','<script src="calculator-artwork.js"></script></body>');
calculator=calculator.replace(/<body[^>]*>/,'$&<div style="padding:12px;background:#ffe89d;color:#111">ARTWORK TEST PREVIEW — order submission is disabled. This page cannot place real orders.</div>');
fs.writeFileSync(path.join(root,'public/calculator-preview.html'),calculator);
console.log('Built isolated artwork designer and calculator preview; live calculator unchanged');
