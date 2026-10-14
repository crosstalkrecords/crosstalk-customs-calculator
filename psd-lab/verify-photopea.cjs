'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
const {initializeCanvas,readPsd}=require('ag-psd');
initializeCanvas(createCanvas);
const [sourcePath,outputPath]=process.argv.slice(2);
if(!sourcePath||!outputPath)throw Error('Usage: node verify-photopea.cjs original.psd Photopea-output.psd');
const original=readPsd(fs.readFileSync(sourcePath),{useImageData:true}),changed=readPsd(fs.readFileSync(outputPath),{useImageData:true});
function flatten(ls){return(ls||[]).flatMap(l=>l.children?flatten(l.children):[l])}
const ls=flatten(changed.children),olds=flatten(original.children),txt=ls.find(l=>l.text),photo=ls.find(l=>l.mask),oldPhoto=olds.find(l=>l.mask),opacity=ls.find(l=>l.name==='Opacity 25 percent');
assert.equal(changed.width,original.width);assert.equal(changed.height,original.height);
assert.equal(txt.text.text.trim().replace(/\r/g,'\n'),'EDITABLE SUCCESS\nSIDE A');
assert.equal(txt.text.style.font.name,'DejaVuSans');assert.equal(opacity.opacity,.4);
assert.equal(ls.filter(l=>l.hidden).length,2);
assert.deepEqual(ls.map(l=>l.name),olds.map(l=>l.name));
assert.deepEqual(photo.imageData.data,oldPhoto.imageData.data);
assert.deepEqual(photo.mask.imageData.data,oldPhoto.mask.imageData.data);
const originalText=olds.find(l=>l.text);
if(originalText.effects?.stroke?.[0]?.enabled)assert.ok(txt.effects?.stroke?.[0]?.enabled);
if(original.children[0].mask){assert.ok(changed.children[0].mask);assert.deepEqual(changed.children[0].mask.imageData.data,original.children[0].mask.imageData.data)}
console.log(JSON.stringify({result:'PASS',source:sourcePath,width:changed.width,height:changed.height,layers:ls.length,checks:['edited native text retained','font metadata retained','40% editable opacity','two hidden layers retained','layer order retained','original image pixels exact','reversible mask pixels exact'],nativeOutline:!!txt.effects?.stroke?.[0]?.enabled,labelMask:!!changed.children[0].mask,resolution:changed.imageResources.resolutionInfo},null,2));
