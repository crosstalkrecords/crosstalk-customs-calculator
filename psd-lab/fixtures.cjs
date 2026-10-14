'use strict';
// Synthetic compatibility fixtures only. No customer assets or order integration.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createCanvas, GlobalFonts} = require('@napi-rs/canvas');
const {initializeCanvas, writePsdBuffer, readPsd} = require('ag-psd');
initializeCanvas(createCanvas);
const fontPath='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
GlobalFonts.registerFromPath(fontPath, 'Fixture Sans');
const out=path.join(__dirname,'generated');
fs.mkdirSync(out,{recursive:true});
function canvas(w,h,paint){const c=createCanvas(w,h);paint(c.getContext('2d'),w,h);return c}
function textCanvas(text,w,h,size){return canvas(w,h,ctx=>{ctx.font=`${size}px Fixture Sans`;ctx.fillStyle='#fff';ctx.textBaseline='alphabetic';text.split('\n').forEach((line,i)=>ctx.fillText(line,0,size+i*size*1.2))})}
function build(size,round=false){const scale=size/640;
 const bg=canvas(size,size,(ctx,w,h)=>{const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#172c48');g.addColorStop(1,'#bb4724');ctx.fillStyle=g;ctx.fillRect(0,0,w,h)});
 const art=canvas(320*scale,220*scale,(ctx,w,h)=>{ctx.fillStyle='#ff9c30';ctx.fillRect(0,0,w,h);ctx.fillStyle='#357ba4';for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(w*(i+1)/7,h/2,h*.16,0,Math.PI*2);ctx.fill()}});
 const mask=canvas(art.width,art.height,(ctx,w,h)=>{ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.fillStyle='#000';ctx.beginPath();ctx.arc(w/2,h/2,h*.22,0,Math.PI*2);ctx.fill()});
 const tx=textCanvas('CROSSTALK\nPSD TEST',500*scale,150*scale,44*scale);
 const opacity=canvas(170*scale,100*scale,(ctx,w,h)=>{ctx.fillStyle='#ffe34e';ctx.fillRect(0,0,w,h)});
 const hidden=canvas(100*scale,100*scale,(ctx,w,h)=>{ctx.fillStyle='#ff00ff';ctx.fillRect(0,0,w,h)});
 const native={name:'Editable title - DejaVu Sans',top:60*scale,left:60*scale,canvas:tx,text:{text:'CROSSTALK\nPSD TEST',transform:[1,0,0,1,60*scale,104*scale],orientation:'horizontal',shapeType:'point',antiAlias:'smooth',style:{font:{name:'DejaVuSans'},fontSize:44*scale,fillColor:{r:255,g:255,b:255},autoLeading:false,leading:52.8*scale,tracking:0},paragraphStyle:{justification:'left'}},effects:{stroke:[{enabled:true,present:true,showInDialog:true,size:{units:'Pixels',value:2*scale},position:'outside',fillType:'color',blendMode:'normal',opacity:1,color:{r:0,g:0,b:0}}]}};
 const backup={name:'Preview backup - title (hidden)',hidden:true,top:60*scale,left:60*scale,canvas:tx};
 const children=[{name:'Gradient background',canvas:bg},{name:'Source artwork with reversible eraser mask',top:260*scale,left:80*scale,canvas:art,mask:{top:260*scale,left:80*scale,canvas:mask,defaultColor:0,disabled:false}},native,backup,{name:'Opacity 25 percent',top:480*scale,left:380*scale,canvas:opacity,opacity:.25},{name:'Hidden layer - must stay hidden',top:500*scale,left:20*scale,canvas:hidden,hidden:true}];
 const composite=canvas(size,size,ctx=>{ctx.drawImage(bg,0,0);const masked=canvas(art.width,art.height,mx=>{mx.drawImage(art,0,0);mx.globalCompositeOperation='destination-in';const alpha=canvas(mask.width,mask.height,ax=>{ax.drawImage(mask,0,0);const d=ax.getImageData(0,0,mask.width,mask.height);for(let i=0;i<d.data.length;i+=4)d.data[i+3]=d.data[i];ax.putImageData(d,0,0)});mx.drawImage(alpha,0,0)});ctx.drawImage(masked,80*scale,260*scale);ctx.drawImage(tx,60*scale,60*scale);ctx.globalAlpha=.25;ctx.drawImage(opacity,380*scale,480*scale);ctx.globalAlpha=1});
 if(round){const circle=canvas(size,size,(ctx,w,h)=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(w/2,h/2,w/2,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(w/2,h/2,w*.0361,0,Math.PI*2);ctx.fill()});const d=circle.getContext('2d').getImageData(0,0,size,size);for(let i=0;i<d.data.length;i+=4){d.data[i]=d.data[i+1]=d.data[i+2]=d.data[i+3];d.data[i+3]=255}const group={name:'Label print boundary with centre hole',children:[...children],mask:{top:0,left:0,imageData:d,defaultColor:0}};children.splice(0,children.length,group);const cx=composite.getContext('2d');cx.globalCompositeOperation='destination-in';cx.drawImage(circle,0,0)}
 return {width:size,height:size,canvas:composite,children,imageResources:{resolutionInfo:{horizontalResolution:300,horizontalResolutionUnit:'PPI',widthUnit:'Inches',verticalResolution:300,verticalResolutionUnit:'PPI',heightUnit:'Inches'}}};
}
const results=[];
for(const [name,size,round] of [['cover-small',640,false],['cover-print',3000,false],['label-print',1146,true]]){
 const start=performance.now(),doc=build(size,round),buffer=writePsdBuffer(doc,{noBackground:true});
 fs.writeFileSync(path.join(out,name+'.psd'),buffer);fs.writeFileSync(path.join(out,name+'-reference.png'),doc.canvas.toBuffer('image/png'));
 const decoded=readPsd(buffer,{useImageData:true,skipThumbnail:true});const layers=round?decoded.children[0].children:decoded.children;
 assert.equal(decoded.width,size);assert.equal(layers.length,6);assert.equal(layers[2].text.text.trim(),'CROSSTALK\nPSD TEST');assert.equal(layers[2].text.style.font.name,'DejaVuSans');assert.equal(layers[3].hidden,true);assert.equal(layers[5].hidden,true);assert.ok(Math.abs(layers[4].opacity-.25)<1/255);assert.ok(layers[1].mask.imageData);assert.ok(layers[2].effects.stroke[0].enabled);if(round)assert.ok(decoded.children[0].mask.imageData);
 results.push({name,size,bytes:buffer.length,ms:Math.round(performance.now()-start),checks:'same-writer roundtrip PASS; independent editor validation still required'});
}
fs.writeFileSync(path.join(out,'generation-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
