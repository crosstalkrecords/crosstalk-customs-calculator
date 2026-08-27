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
  const seenScripts=new Set();

  page.on('request', req => {
    const u=req.url();
    if (/algolia|qobuz|search|catalog|api/i.test(u) && !/\.(png|jpg|jpeg|svg|woff|css)(\?|$)/i.test(u)) {
      console.log('NET_REQUEST', req.method(), u, (req.postData() || '').slice(0,12000));
      const h=req.headers();
      for (const k of Object.keys(h)) if (/algolia|application|api-key/i.test(k)) console.log('REQ_HEADER',k,h[k]);
    }
  });
  page.on('response', async res => {
    const u=res.url();
    const ct=(res.headers()['content-type']||'');
    if (/algolia|qobuz|search|catalog|api/i.test(u) && (/json|javascript|text/i.test(ct) || /search|api|algolia/i.test(u))) {
      console.log('NET_RESPONSE', res.status(), ct, u);
      if (/json/i.test(ct)) try { console.log('NET_JSON', (await res.text()).slice(0,20000)); } catch (_) {}
    }
  });

  await page.goto('https://www.qobuz.com/au-en/search',{waitUntil:'networkidle',timeout:90000}).catch(async()=>{
    await page.waitForLoadState('domcontentloaded');
  });
  await page.waitForTimeout(5000);
  console.log('FINAL_URL',page.url());
  console.log('TITLE',await page.title());

  // Dump inline configuration/state looking specifically for Algolia/index credentials.
  const html=await page.content();
  for (const re of [
    /.{0,180}algolia.{0,500}/ig,
    /.{0,180}(?:app(?:lication)?[_-]?id|api[_-]?key|index[_-]?name).{0,500}/ig
  ]) {
    const matches=html.match(re)||[];
    for (const m of matches.slice(0,30)) console.log('HTML_CONFIG',m.replace(/\s+/g,' ').slice(0,1200));
  }

  // Fetch loaded JS ourselves and grep it. This works even when the UI has no search box.
  const scripts=await page.locator('script[src]').evaluateAll(xs=>xs.map(x=>x.src));
  console.log('SCRIPT_COUNT',scripts.length);
  for (const src of scripts) {
    if (seenScripts.has(src)) continue;
    seenScripts.add(src);
    try {
      const r=await page.request.get(src,{timeout:30000});
      if (!r.ok()) continue;
      const txt=await r.text();
      if (/algolia|algoliasearch|indexName|applicationId|apiKey/i.test(txt)) {
        console.log('\nSCRIPT_HIT',src,'bytes',txt.length);
        const patterns=[
          /.{0,250}algoliasearch.{0,700}/ig,
          /.{0,250}indexName.{0,700}/ig,
          /.{0,250}applicationId.{0,700}/ig,
          /.{0,250}apiKey.{0,700}/ig
        ];
        for (const re of patterns) {
          const ms=txt.match(re)||[];
          for (const m of ms.slice(0,12)) console.log('JS_CONFIG',m.replace(/\s+/g,' ').slice(0,1500));
        }
      }
    } catch(e) { console.log('SCRIPT_ERR',src,e.message); }
  }

  // Try likely shop search URLs directly; network listeners above will reveal any Algolia call.
  const base=new URL(page.url()).origin;
  for (const input of tests) {
    const query=`${input.artist} ${input.title}`;
    console.log(`\n=== URL PROBES: ${query} ===`);
    const urls=[
      `${base}/search?q=${encodeURIComponent(query)}`,
      `${base}/search?query=${encodeURIComponent(query)}`,
      `${base}/search/${encodeURIComponent(query)}`
    ];
    for (const url of urls) {
      try {
        console.log('PROBE',url);
        await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
        await page.waitForTimeout(3500);
        console.log('PROBE_FINAL',page.url());
        const body=(await page.locator('body').innerText()).replace(/\s+$/g,'');
        console.log('BODY',body.slice(0,4000));
      } catch(e) { console.log('PROBE_ERR',e.message); }
    }
    break; // one query is enough to expose the transport/config
  }

  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
