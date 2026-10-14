'use strict';
const fs=require('node:fs');
const {createCanvas}=require('@napi-rs/canvas');
const {initializeCanvas,readPsd,writePsdBuffer}=require('ag-psd');
initializeCanvas(createCanvas);
for(const name of ['cover-print','label-print']){
 const doc=readPsd(fs.readFileSync(`generated/${name}.psd`),{useImageData:true});
 const layers=name==='label-print'?doc.children[0].children:doc.children;
 const text=layers.find(l=>l.text);
 text.effects.stroke[0].size.value=Math.round(text.effects.stroke[0].size.value);
 fs.writeFileSync(`generated/${name}-integer-outline.psd`,writePsdBuffer(doc,{noBackground:true}));
 delete text.effects;
 fs.writeFileSync(`generated/${name}-no-outline.psd`,writePsdBuffer(doc,{noBackground:true}));
 console.log(`Generated ${name}-no-outline.psd: only native text outline removed`);
}
