'use strict';
const crypto = require('node:crypto');
const SURFACES = {front:3000, back:3000, labelA:1146, labelB:1146};
const LIMITS = {assets:16, assetBytes:20*1024*1024, totalBytes:80*1024*1024, layers:40, projectBytes:2*1024*1024, pixels:25e6};
const FONT_CATALOG = [
  {value:'Crosstalk Sans', label:'Crosstalk Sans', file:'DejaVuSans'},
  {value:'Crosstalk Serif', label:'Crosstalk Serif', file:'DejaVuSerif'},
  {value:'Crosstalk Mono', label:'Crosstalk Mono', file:'DejaVuSansMono'}
];
function fail(message){const e=new Error(message);e.status=422;throw e;}
function validate(project, assetIds){
  if(!project || project.format!=='crosstalk-project' || project.version!==1 || project.rendererVersion!=='approved-d5b75f9-v1') fail('Unsupported artwork project version');
  if(!project.surfaces || Array.isArray(project.surfaces) || typeof project.surfaces!=='object') fail('Missing surfaces');
  if(Object.keys(project.surfaces).some(id=>!SURFACES[id])) fail('Unknown surface');
  if(Buffer.byteLength(JSON.stringify(project))>LIMITS.projectBytes) fail('Project is too large');
  let layers=0,points=0;
  function walk(v,depth=0){
    if(depth>14)fail('Project nesting limit');
    if(typeof v==='number'&&(!Number.isFinite(v)||Math.abs(v)>1e7))fail('Invalid number');
    if(typeof v==='string'&&v.length>12000)fail('Artwork value is too long');
    if(Array.isArray(v)){if(v.length>5000)fail('Artwork list is too long');for(const x of v)walk(x,depth+1);}
    else if(v&&typeof v==='object')for(const [k,x] of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(k))fail('Invalid property');walk(x,depth+1);}
  }
  walk(project);
  for(const [id,list] of Object.entries(project.surfaces)){
    if(!Array.isArray(list))fail('Invalid layer list');
    const seen=new Set();
    for(const l of list){
      if(++layers>LIMITS.layers)fail('Artwork exceeds 40 layers across all surfaces');
      if(!l||!['text','image','shape','draw'].includes(l.type)||typeof l.id!=='string'||seen.has(l.id))fail('Invalid or duplicate layer');
      seen.add(l.id);
      for(const key of ['x','y','w','h'])if(typeof l[key]!=='number'||!Number.isFinite(l[key])||Math.abs(l[key])>10)fail('Layer geometry outside limits');
      if(l.w<=0||l.h<=0)fail('Empty layer');
      if(l.opacity!==undefined&&(typeof l.opacity!=='number'||l.opacity<0||l.opacity>1))fail('Invalid opacity');
      if(l.type==='image'&&(!/^asset:[a-f0-9]{64}$/.test(l.src)||!assetIds.has(l.src.slice(6))))fail('Missing source image');
      if(l.type==='text'&&(typeof l.text!=='string'||l.text.length>5000||typeof l.font!=='string'||l.font.length>300||typeof l.fontSize!=='number'||l.fontSize<=0||l.fontSize>100))fail('Invalid text');
      if(l.type==='draw'&&(!Array.isArray(l.points)||!l.points.length))fail('Empty drawing');
      points+=(l.points||[]).length+(l.maskStrokes||[]).reduce((n,s)=>n+(s.points||[]).length,0);
      if(points>20000)fail('Drawing point limit exceeded');
    }
  }
  if(!layers&&!Object.values(project.backgrounds||{}).some(Boolean))fail('Artwork is empty');
  if(Object.keys(project.backgrounds||{}).some(id=>!SURFACES[id]))fail('Unknown background surface');
  return project;
}
function digest(value){return crypto.createHash('sha256').update(value).digest('hex');}
module.exports={SURFACES,LIMITS,FONT_CATALOG,validate,digest};
