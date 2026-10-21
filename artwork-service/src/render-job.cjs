'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const {renderProject}=require('./render.cjs');
(async()=>{const dir=process.argv[2];const project=JSON.parse(await fs.readFile(path.join(dir,'project.json'),'utf8'));await renderProject(project,path.join(dir,'assets'),path.join(dir,'output'));})().catch(()=>{console.error('Artwork conversion failed');process.exitCode=1;});
