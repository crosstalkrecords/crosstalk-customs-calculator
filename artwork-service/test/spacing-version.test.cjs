'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),packaged=require('@sparticuz/chromium');
const {rendererHTML}=require('../src/render.cjs');
const {validate}=require('../src/project.cjs');

test('wide letter spacing exports without horizontal compression while queued v1 jobs retain their renderer',async()=>{
 const project=version=>({format:'crosstalk-project',version:1,rendererVersion:version,surfaces:{front:[{id:'text',type:'text',text:'WIDE',font:'Crosstalk Sans',fontSize:5,x:.1,y:.1,w:.8,h:.2}]}});
 for(const version of ['approved-d5b75f9-v1','approved-spacing-v2'])assert.equal(validate(project(version),new Set()).rendererVersion,version);
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||await packaged.executablePath(),args:packaged.args.filter(arg=>arg!=='--single-process')});
 try{
  const widths=[];
  for(const version of ['approved-d5b75f9-v1','approved-spacing-v2']){
   const page=await browser.newPage();
   const html=(await rendererHTML(version)).replace('})();\n</script>','window.__spacingTestDrawText=drawText;\n})();\n</script>');
   await page.setContent(html,{waitUntil:'domcontentloaded'});
   widths.push(await page.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=500;canvas.height=120;
    const ctx=canvas.getContext('2d');ctx.font='40px Arial';ctx.letterSpacing='16px';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#000';
    window.__spacingTestDrawText(ctx,'WIDE',250,60,130,44);
    const {data}=ctx.getImageData(0,0,500,120);let left=500,right=-1;
    for(let x=0;x<500;x++)for(let y=0;y<120;y++)if(data[(y*500+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x)}
    return right-left+1;
   }));
   await page.close();
  }
  assert(widths[0]<=135,`v1 demonstrated the compressed line: ${widths[0]}`);
  assert(widths[1]>widths[0]*1.25,`v2 preserves spacing: ${widths.join(' → ')}`);
 }finally{await browser.close()}
});
