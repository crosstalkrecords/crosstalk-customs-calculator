'use strict';
// Pinned approved editor: inject synthetic test controls only into a lab copy.
const fs=require('node:fs'),crypto=require('node:crypto');
const original=fs.readFileSync('../artwork-editor-sandbox.html','utf8');
const blob=crypto.createHash('sha1').update(`blob ${Buffer.byteLength(original)}\0`).update(original).digest('hex');
if(blob!=='d38ee5689fa164ac1cc9c2f0c239ec1b3dac03cf')throw Error('Approved editor snapshot mismatch');
const hook=fs.readFileSync('editor-checks-hook.js','utf8');
const faces=[['Lab Sans','DejaVuSans',400,'normal'],['Lab Sans','DejaVuSans-Bold',700,'normal'],['Lab Serif','DejaVuSerif',400,'normal'],['Lab Mono','DejaVuSansMono-Oblique',400,'italic']].map(([family,file,weight,style])=>`@font-face{font-family:'${family}';src:url('https://raw.githubusercontent.com/crosstalkrecords/crosstalk-customs-calculator/fee73b3ecbba3f91b5cf514986af0e8228fc7271/psd-lab/fonts/${file}.ttf');font-weight:${weight};font-style:${style};font-display:block}`).join('');
fs.writeFileSync('editor-checks.html',original.replace('</head>',`<style>${faces}</style></head>`).replace('})();\n</script>',hook+'\n})();\n</script>'));
console.log('Created lab-only copy from verified approved editor');
