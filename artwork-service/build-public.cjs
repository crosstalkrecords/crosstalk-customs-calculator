'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=__dirname;
let html=fs.readFileSync(path.join(root,'vendor/approved-editor.html'),'utf8');
// A shared browser must never offer a different order's previous design.
html=html.replaceAll("get('current')","get(artworkDraftKey())").replaceAll("delete('current')","delete(artworkDraftKey())");
html=html.replaceAll("put(data,'current')","put(data,artworkDraftKey())");
html=html.replace('<title>Crosstalk Customs Artwork Designer — Sandbox</title>','<title>Crosstalk Customs Artwork Designer — JOSH TEST</title>');
html=html.replace('<div class="sandbox">Sandbox</div>','<div class="sandbox">JOSH TEST</div>');
html=html.replace('Nothing leaves your browser','Draft saved on this device; Finish uploads to the JOSH TEST service');
const css=[];
for(const [family,base] of [['Crosstalk Sans','DejaVuSans'],['Crosstalk Serif','DejaVuSerif'],['Crosstalk Mono','DejaVuSansMono']])for(const [suffix,weight,style] of [['',400,'normal'],['-Bold',700,'normal'],['-Oblique',400,'italic'],['-BoldOblique',700,'italic']])if(fs.existsSync(path.join(root,'public/fonts',base+suffix+'.ttf')))css.push(`@font-face{font-family:'${family}';src:url('fonts/${base+suffix}.ttf');font-weight:${weight};font-style:${style};font-display:block}`);
html=html.replace('</head>','<style>'+css.join('')+'.handoff-status{font-size:13px;font-weight:650;min-height:20px;color:#5c3322}.handoff-status:not(:empty){margin:12px 0}.standalone-notice{margin:0;padding:10px 16px;background:#fff2df;color:#643719;font-weight:650}.standalone-notice[hidden]{display:none}</style><script src="handoff.js"></script></head>');
html=html.replace('  </header>\n  <nav class="surface-tabs"','  </header>\n  <p class="standalone-notice" id="standaloneNotice" role="status" hidden>Explore here; open from the JOSH TEST form to attach or upload artwork.</p>\n  <nav class="surface-tabs"');
html=html.replace('      <div class="modal-actions">','      <p class="handoff-status" id="handoffStatus" role="status" aria-live="polite"></p>\n      <div class="modal-actions">');
html=html.replace('const FONTS=[',"const FONTS=[{label:'Crosstalk Sans (PSD text)',value:'Crosstalk Sans'},{label:'Crosstalk Serif (PSD text)',value:'Crosstalk Serif'},{label:'Crosstalk Mono (PSD text)',value:'Crosstalk Mono'},");
html=html.replace("return{font:'Arial, Helvetica, sans-serif',fontSize:5.8", "return{font:'Crosstalk Sans',fontSize:5.8");
const hook=`
// Delivery integration: source/state only; no print-size layer rasterization here.
function artworkDraftKey(){const session=new URLSearchParams(location.search).get('artworkSession');return session&&/^[0-9a-f-]{36}$/i.test(session)?'order:'+session:'standalone'}
if(!window.opener||!new URLSearchParams(location.search).get('artworkSession'))$('standaloneNotice').hidden=false;
for(const id of ['addTextBtn','mobileTextBtn'])$(id).onclick=async()=>{try{await document.fonts.load('700 32px "Crosstalk Sans"');addText()}catch(_){showToast('The artwork font could not load. Please retry.')}};
saveNow=async function(){try{const db=await openDB();if(!db)throw Error();const data=JSON.parse(snapshot());data.version=4;data.savedAt=new Date().toISOString();await new Promise((resolve,reject)=>{const tx=db.transaction('projects','readwrite');tx.objectStore('projects').put(data,artworkDraftKey());tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});$('saveStatus').textContent='Saved on this device'}catch(_){$('saveStatus').textContent='Saved for this session'}};
$('completeArtwork').onclick=async()=>{
 const button=$('completeArtwork'),status=$('handoffStatus');button.disabled=true;
 try{
  const session=new URLSearchParams(location.search).get('artworkSession');
  const returnOrigin=new URLSearchParams(location.search).get('returnOrigin');
  if(!window.opener||!session)throw Error('Open this designer from the JOSH TEST order form so the artwork can attach to that test. Your draft remains on this device.');
  if(window.opener&&session){
   const response=await fetch('/v1/client-config');
   if(!response.ok)throw Error('The order handoff is unavailable. Please retry.');
   const config=await response.json();
   if(!config.returnOrigins?.includes(returnOrigin))throw Error('This order page is not approved for artwork handoff.');
  }
  await saveNow();
  const project={format:'crosstalk-project',version:1,rendererVersion:'approved-spacing-v2',surfaces:Object.fromEntries(Object.entries(state.surfaces).map(([id,layers])=>[id,layers.map(l=>({...l}))])),backgrounds:structuredClone(state.backgrounds)};
  const result=await window.CrosstalkHandoff.upload(project,message=>status.textContent=message);
  if(window.opener&&session){
   const testPreview=new URLSearchParams(location.search).get('testPreview')==='1';
   window.opener.postMessage(testPreview
    ?{type:'crosstalk-artwork-complete',artworkJobId:result.artworkJobId,session}
    :{type:'crosstalk-artwork-complete',reference:result.reference,session},returnOrigin);
  }
  status.textContent='Artwork uploaded. Submit JOSH TEST to queue its PSD delivery.';
  $('finishContent').style.display='none';$('finishSuccess').classList.add('show');
 }catch(error){status.textContent=error.message||'Artwork could not be uploaded. Your draft is still on this device.';}finally{button.disabled=false;}
};
`;
html=html.replace('})();\n</script>',hook+'\n})();\n</script>');
html=html.replace('Your artwork is saved on this device.', 'Your draft is saved on this device.');
html=html.replace('<strong>Artwork saved ✓</strong><p>Your designs are saved in this browser. Return to your order tab to continue.</p>','<strong>Artwork uploaded ✓</strong><p>Return to your JOSH TEST form and submit the test to queue PSD delivery. Your draft is also saved in this browser.</p>');
fs.writeFileSync(path.join(root,'public/designer.html'),html);
// Generate a separate production-facing document. The JOSH TEST designer and
// its guarded preview remain unchanged; the server selects this file only in
// a non-test environment. Both documents use the same pinned renderer source.
let production=html
 .replace('<title>Crosstalk Customs Artwork Designer — JOSH TEST</title>','<title>Crosstalk Customs Packaging Designer</title>')
 .replace('<div class="sandbox">JOSH TEST</div>','<div class="sandbox">Packaging Designer</div>')
 .replace('Finish uploads to the JOSH TEST service','Finish to attach artwork to your order')
 .replace('Explore here; open from the JOSH TEST form to attach or upload artwork.','Explore here; open from the Customs order form to attach artwork.')
 .replace('Return to your JOSH TEST form and submit the test to queue PSD delivery.','Return to your order form and submit your order to queue PSD delivery.')
 .replace('Open this designer from the JOSH TEST order form so the artwork can attach to that test.','Open this designer from the Customs order form so the artwork can attach to your order.')
 .replace("const testPreview=new URLSearchParams(location.search).get('testPreview')==='1';","const testPreview=false;")
 .replace('Artwork uploaded. Submit JOSH TEST to queue its PSD delivery.','Artwork uploaded. Place your order to queue PSD delivery.');
if(production.includes('JOSH TEST')||production.includes("get('testPreview')"))throw Error('Production designer contains a test-only reference');
fs.writeFileSync(path.join(root,'public/designer-production.html'),production);
fs.mkdirSync(path.join(root,'public/assets'),{recursive:true});fs.copyFileSync(path.join(root,'../assets/crosstalk-logo.png'),path.join(root,'public/assets/crosstalk-logo.png'));
// This is a non-production calculator preview. Its existing Make URL is removed.
let calculator=fs.readFileSync(path.join(root,'../calculator.html'),'utf8');
const before=calculator;calculator=calculator.replace(/https:\/\/hook\.eu1\.make\.com\/[a-zA-Z0-9]+/g,'/order-submission-disabled');
if(calculator===before||calculator.includes('hook.eu1.make.com'))throw Error('Preview order endpoint replacement failed');
// The tester should not send synthetic track searches or playlist URLs to the
// separate production lookup service. This is a preview-only substitution.
const lookupOrigin='https://crosstalk-playlist-importer.vercel.app';
if(calculator.split(lookupOrigin).length!==5)throw Error('Preview lookup isolation check failed');
calculator=calculator.replaceAll(lookupOrigin,'/josh-test-lookup-disabled');
// The preview must remain truthful even while its test config is loading or
// unavailable. The live form's audio and success promises do not apply here.
const testCopy=[
 ['<strong>Already have a playlist?</strong>',
  '<strong>Playlist import is disabled in JOSH TEST</strong>'],
 ['placeholder="Paste a public playlist link"',
  'placeholder="Enter synthetic tracks manually below"'],
 ['You\'ll upload your finished artwork after submitting.',
  'Use the Packaging Designer to attach a synthetic design now, or supply harmless finished files using the private JOSH TEST upload link sent after submission.'],
 ['<h2 class="title">Now we need the actual music.</h2><p class="lede">Your tracklist is the plan. Before we can cut your record, we need the actual audio files.</p>',
  '<h2 class="title">Plan the audio for this test.</h2><p class="lede">Use synthetic track names. This form does not collect audio files directly or create a genuine customer order.</p>'],
 ['Every audio file must be provided manually by you before we cut anything.',
  'For a real order, you must supply every audio file before Crosstalk can cut anything.'],
 ['Playlist durations are used to help plan your record, but we’ll check the actual audio before cutting. If anything no longer fits, we’ll get in touch.',
  'In a real order, playlist durations help plan the record and Crosstalk checks the supplied audio before cutting. If anything no longer fits, we contact you.'],
 ['Our Qobuz links are simply a helping hand to locate possible legal downloads. Crosstalk does not purchase, download or transfer the music on your behalf.',
  'The live form may suggest legal download sources. Track lookup is disabled in JOSH TEST; do not make a purchase for this test.'],
 ['<strong>I\'ve got my files</strong><small>You\'ll upload them after ordering.</small>',
  '<strong>I can supply a dummy file</strong><small>Use only a harmless test file if Josh receives a private JOSH TEST link.</small>'],
 ['You must purchase/download the files yourself and then upload them to Crosstalk. A playlist link by itself is never treated as supplied audio.',
  'For a real order, you must obtain and upload your own files. For JOSH TEST, do not purchase music or upload genuine customer audio. A playlist link is never supplied audio.'],
 ['After submitting, you\'ll receive your private Dropbox link for audio and artwork.',
  'If the isolated test intake accepts the submission, Josh may receive a private audio upload link by email. Use only a harmless dummy file; no genuine order or charge is created. Designer artwork is attached here, not through that link.'],
 ['Step 5 of 5 · Review & Order','Step 5 of 5 · Review & Test Submit'],
 ['<div class="legal"><strong>Copyright Declaration & Terms</strong>',
  '<div class="legal"><strong>Preview of real order terms</strong><p>Shown for interface review only. JOSH TEST submits no customer order or audio files.</p>'],
 ['I confirm that I have the right to reproduce the audio I supply and agree to the Crosstalk Customs terms above.',
  'I understand this is a synthetic JOSH TEST submission and have reviewed the real order terms above.'],
 ['<button type="submit" class="btn">Place My Order</button>',
  '<button type="submit" class="btn">Submit JOSH TEST</button>'],
 ["btn.textContent='Place My Order'","btn.textContent='Submit JOSH TEST'"],
 ['<h2>Order received</h2><p>Your Crosstalk Customs project has been submitted.</p>',
  '<h2>JOSH TEST submission accepted</h2><p>This is a test acknowledgement, not a customer order. Delivery is confirmed separately.</p>'],
 ['<div id="uploadWrap" class="hidden"><a id="upload" class="upload" target="_blank">Upload Your Audio + Artwork</a></div>',
  '']
];
for(const [source,replacement] of testCopy){
 if(!calculator.includes(source))throw Error('Preview test copy replacement failed');
 calculator=calculator.replace(source,replacement);
}
calculator=calculator.replace(/<title>[^<]*<\/title>/,'<title>JOSH TEST — Crosstalk Customs</title>');
calculator=calculator.replace('</head>','<meta name="robots" content="noindex,nofollow,noarchive"></head>');
calculator=calculator.replace('</body>','<script src="calculator-artwork.js"></script><script src="preview-orders.js"></script><script src="preview-usability.js"></script></body>');
calculator=calculator.replace(/<body[^>]*>/,'$&<div role="note" style="padding:12px;background:#ffe89d;color:#111;font-weight:700">JOSH TEST — TEST JOSH 21.11. Submission opens only during a controlled test window. If accepted, it can create an isolated test record, send Josh a private dummy-audio upload link, and queue attached artwork to the JOSH TEST Dropbox folder. No genuine order, invoice or charge is created. Use synthetic details and files only.</div>');
fs.writeFileSync(path.join(root,'public/calculator-preview.html'),calculator);
console.log('Built isolated artwork designer and calculator preview; live calculator unchanged');
