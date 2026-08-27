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

  page.on('request', req => {
    const u=req.url();
    if (/qobuz|search|catalog|api/i.test(u) && !/\.(png|jpg|jpeg|svg|woff|css)(\?|$)/i.test(u)) {
      console.log('NET_REQUEST', req.method(), u, req.postData() || '');
    }
  });
  page.on('response', async res => {
    const u=res.url();
    const ct=(res.headers()['content-type']||'');
    if (/qobuz|search|catalog|api/i.test(u) && (/json|javascript|text/i.test(ct) || /search|api/i.test(u))) {
      console.log('NET_RESPONSE', res.status(), ct, u);
      if (/json/i.test(ct)) {
        try { console.log('NET_JSON', (await res.text()).slice(0,20000)); } catch (_) {}
      }
    }
  });

  await page.goto('https://www.qobuz.com/au-en/search',{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForTimeout(4000);

  for (let n=0;n<tests.length;n++) {
    const input=tests[n];
    const query=`${input.artist} ${input.title}`;
    console.log(`\n=== LIVE SEARCH ${n+1}: ${query} ===`);
    try {
      const candidates = [
        'input[type="search"]',
        'input[placeholder*="Search" i]',
        'input[aria-label*="Search" i]',
        'input[name*="search" i]',
        'input'
      ];
      let box=null;
      for (const sel of candidates) {
        const loc=page.locator(sel).first();
        if (await loc.count()) {
          try { if (await loc.isVisible()) { box=loc; console.log('SEARCH_BOX', sel); break; } } catch (_) {}
        }
      }
      if (!box) throw new Error('No visible search input found');
      await box.fill(query);
      await page.waitForTimeout(500);
      await box.press('Enter');
      await page.waitForTimeout(6000);
      console.log('FINAL_URL', page.url());
      console.log('TITLE', await page.title());
      const body=(await page.locator('body').innerText()).replace(/\s+$/g,'');
      console.log('BODY_START');
      console.log(body.slice(0,12000));
      console.log('BODY_END');
      await page.screenshot({path:`qobuz-live-${n+1}.png`,fullPage:true});
    } catch(e) {
      console.log('ERROR', e && e.stack || e);
    }
  }
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
