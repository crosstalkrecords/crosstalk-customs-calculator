#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const host=process.argv[2];
if(!/^https:\/\/[a-z0-9-]+\.up\.railway\.app$/.test(host||''))throw Error('Usage: build-release-form.mjs https://approved-service.up.railway.app');
const live=await fs.readFile(path.join(root,'calculator.html'),'utf8');
const handler=/^\$\('orderForm'\)\.onsubmit=async e=>\{.*\};$/m;
if((live.match(handler)||[]).length!==1||!live.includes('</script></body></html>'))throw Error('Live form structure changed; inspect it before building');
let candidate=live.replace(handler,"$('orderForm').onsubmit=e=>{e.preventDefault();alert('Orders are temporarily unavailable. Please contact Crosstalk.');};");
candidate=candidate.replace('</script></body></html>',`</script><script src="${host}/calculator-artwork.js"></script><script src="${host}/production-orders.js"></script></body></html>`);
if(candidate.includes('hook.eu1.make.com')||candidate===live)throw Error('Candidate still contains the old direct Make submission');
await fs.writeFile(path.join(root,'calculator-production.html'),candidate);
console.log('Built candidate form. Live calculator.html was not changed.');
