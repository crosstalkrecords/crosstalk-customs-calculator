const { chromium } = require('playwright');

const tests = [
  { title: 'Jolene', artist: 'Dolly Parton', duration: '2:43' },
  { title: 'Islands In the Stream', artist: 'Dolly Parton, Kenny Rogers', duration: '4:09' },
  { title: 'I Will Always Love You', artist: 'Dolly Parton', duration: '2:57' },
  { title: '9 to 5', artist: 'Dolly Parton', duration: '2:46' }
];

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:1000}});
  for (let n=0;n<tests.length;n++) {
    const input=tests[n];
    const q=encodeURIComponent(`${input.artist} ${input.title}`);
    const searchUrl=`https://www.qobuz.com/au-en/search?q=${q}`;
    console.log(`\n=== QOBUZ DIAGNOSTIC ${n+1}: ${input.artist} — ${input.title} ===`);
    console.log('REQUESTED', searchUrl);
    try {
      const response=await page.goto(searchUrl,{waitUntil:'domcontentloaded',timeout:90000});
      await page.waitForTimeout(5000);
      console.log('STATUS', response && response.status());
      console.log('FINAL_URL', page.url());
      console.log('TITLE', await page.title());
      const body=(await page.locator('body').innerText()).replace(/\s+$/g,'');
      console.log('BODY_START');
      console.log(body.slice(0,12000));
      console.log('BODY_END');
      const links=await page.$$eval('a', as => as.slice(0,250).map(a=>({text:(a.innerText||a.textContent||'').trim().replace(/\s+/g,' '),href:a.href})).filter(x=>x.href));
      console.log('LINKS_START');
      console.log(JSON.stringify(links,null,2));
      console.log('LINKS_END');
      console.log('HTML_SNIPPET_START');
      console.log((await page.content()).slice(0,16000));
      console.log('HTML_SNIPPET_END');
      await page.screenshot({path:`qobuz-${n+1}.png`,fullPage:true});
    } catch(e) {
      console.log('ERROR', e && e.stack || e);
    }
  }
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
