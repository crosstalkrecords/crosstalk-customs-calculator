const { chromium } = require('playwright');

const tests = [
  { title: 'Jolene', artist: 'Dolly Parton', duration: '2:43' },
  { title: 'Islands In the Stream', artist: 'Dolly Parton, Kenny Rogers', duration: '4:09' },
  { title: 'I Will Always Love You', artist: 'Dolly Parton', duration: '2:57' },
  { title: '9 to 5', artist: 'Dolly Parton', duration: '2:46' }
];

const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
const seconds = s => { const p=String(s||'').split(':').map(Number); return p.length===2 ? p[0]*60+p[1] : 0; };
const badVersion = /\b(karaoke|remix|live|instrumental|tribute|cover|re-record|rerecord|sped up|slowed)\b/i;

function score(input, c) {
  const it=norm(input.title), ia=norm(input.artist), ct=norm(c.title), ca=norm(c.artist);
  let n=0, reasons=[];
  if (ct===it) { n+=45; reasons.push('exact title'); }
  else if (ct.includes(it)||it.includes(ct)) { n+=25; reasons.push('near title'); }
  if (ca===ia) { n+=35; reasons.push('exact artist'); }
  else if (ca.includes(ia)||ia.includes(ca)) { n+=24; reasons.push('near artist'); }
  const delta=Math.abs(seconds(input.duration)-seconds(c.duration));
  if (delta<=3) { n+=20; reasons.push(`duration ±${delta}s`); }
  else if (delta<=6) { n+=10; reasons.push(`duration ±${delta}s`); }
  else reasons.push(`duration differs ${delta}s`);
  if (badVersion.test(c.title) && !badVersion.test(input.title)) { n-=45; reasons.push('unexpected version marker'); }
  return { score:n, confidence:n>=90?'high':n>=72?'check':'low', reasons };
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:1000}});
  const results=[];
  for (const input of tests) {
    const q=encodeURIComponent(`${input.artist} ${input.title}`);
    const searchUrl=`https://www.qobuz.com/au-en/search?q=${q}`;
    await page.goto(searchUrl,{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForTimeout(3500);
    const links=await page.$$eval('a[href*="/album/"]', as => [...new Map(as.map(a=>[a.href,a.innerText.trim()])).entries()].slice(0,8).map(([href,text])=>({href,text})));
    const candidates=[];
    for (const link of links.slice(0,5)) {
      const p=await browser.newPage({viewport:{width:1100,height:900}});
      try {
        await p.goto(link.href,{waitUntil:'domcontentloaded',timeout:60000});
        await p.waitForTimeout(1500);
        const text=await p.locator('body').innerText();
        const lines=text.split(/\n+/).map(x=>x.trim()).filter(Boolean);
        for(let i=0;i<lines.length;i++){
          if(!/^Buy track\s+\d{1,2}:\d{2}$/i.test(lines[i])) continue;
          const m=lines[i].match(/(\d{1,2}:\d{2})$/); if(!m) continue;
          const duration=m[1];
          const title=lines[i-1]||'';
          const artist=lines[i+1] ? (lines[i+1].split(' - ')[0].replace(/,\s*(MainArtist|Associated Performer|Performer).*$/i,'').trim()) : '';
          const c={title,artist,duration,url:link.href,purchasable:true};
          Object.assign(c,score(input,c));
          if(c.score>=45) candidates.push(c);
        }
      } catch(e) {} finally { await p.close(); }
    }
    candidates.sort((a,b)=>b.score-a.score);
    results.push({input,searchUrl,candidates:candidates.slice(0,5),best:candidates[0]||null,autoRecommend:!!candidates[0]&&candidates[0].confidence==='high'});
  }
  console.log('QOBUZ_MATCH_POC_START');
  console.log(JSON.stringify(results,null,2));
  console.log('QOBUZ_MATCH_POC_END');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
