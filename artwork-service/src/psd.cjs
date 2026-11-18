'use strict';
// Staff-computer experiment only. Input is a browser-rendered synthetic bundle.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {initializeCanvas,writePsdBuffer,readPsd}=require('ag-psd');initializeCanvas(createCanvas);
async function decode(uri){const img=await loadImage(uri),c=createCanvas(img.width,img.height);c.getContext('2d').drawImage(img,0,0);return c}
function cropCanvas(c){const cx=c.getContext('2d'),d=cx.getImageData(0,0,c.width,c.height);let left=c.width,top=c.height,right=0,bottom=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d.data[(y*c.width+x)*4+3]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1)}if(right<=left)return{left:0,top:0,canvas:createCanvas(1,1)};const trimmed=createCanvas(right-left,bottom-top);trimmed.getContext('2d').drawImage(c,left,top,right-left,bottom-top,0,0,right-left,bottom-top);c.width=c.height=1;return{left,top,canvas:trimmed}}
async function pixelLayer(uri,name){return{name,...cropCanvas(await decode(uri))}}
async function mask(uri){const c=await decode(uri),d=c.getContext('2d').getImageData(0,0,c.width,c.height);for(let i=0;i<d.data.length;i+=4){const a=d.data[i+3];d.data[i]=d.data[i+1]=d.data[i+2]=a;d.data[i+3]=255}c.width=c.height=1;return{left:0,top:0,imageData:d,defaultColor:0}}
function rgb(hex){const n=parseInt(hex.slice(1),16);return{r:(n>>16)&255,g:(n>>8)&255,b:n&255}}
function fontName(l){
 const base={'Crosstalk Sans':'DejaVuSans','Crosstalk Serif':'DejaVuSerif','Crosstalk Mono':'DejaVuSansMono'}[l.font];
 if(!base)return null;
 if(l.italic&&l.font!=='Crosstalk Mono')return null;
 return base+(l.bold?(l.italic?'-BoldOblique':'-Bold'):(l.italic?'-Oblique':''));
}
function nativeText(l,m,size){const r=(l.rotation||0)*Math.PI/180,c=Math.cos(r),s=Math.sin(r),w=l.w*size,h=l.h*size,localX=(l.align==='left'?-w/2:l.align==='right'?w/2:0)-(l.letterSpacing||0)*m.fontSize*(l.align==='left'?0:l.align==='right'?1:.5),localY=-(m.lines.length-1)*m.lineHeight/2+m.baselineOffset;const x=(l.x+l.w/2)*size+c*localX-s*localY,y=(l.y+l.h/2)*size+s*localX+c*localY;return{text:m.lines.join('\n'),transform:[c,s,-s,c,x,y],orientation:'horizontal',shapeType:'point',antiAlias:'smooth',style:{font:{name:fontName(l)},fontSize:m.fontSize,fillColor:rgb(l.color),autoLeading:false,leading:m.lineHeight,tracking:Math.round((l.letterSpacing||0)*1000),autoKerning:false,kerning:0,ligatures:false},paragraphStyle:{justification:l.align||'center'}}}

module.exports={decode,pixelLayer,mask,fontName,nativeText,createCanvas,writePsdBuffer,readPsd};
