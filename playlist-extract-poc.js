const { chromium } = require('playwright');

const playlistUrl = process.env.PLAYLIST_URL || 'https://music.apple.com/au/playlist/dolly-parton-essentials/pl.bca7ed31389842108896524e2edbd956';

function providerFor(url) {
  if (/open\.spotify\.com\/playlist\//i.test(url)) return 'spotify';
  if (/music\.apple\.com\/.+\/playlist\//i.test(url)) return 'apple';
  throw new Error('Unsupported playlist URL');
}

const provider = providerFor(playlistUrl);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });

  let targetUrl = playlistUrl;
  let playlistId = '';
  if (provider === 'spotify') {
    const m = playlistUrl.match(/playlist\/([A-Za-z0-9]+)/);
    if (!m) throw new Error('Could not parse Spotify playlist ID');
    playlistId = m[1];
    targetUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
  } else {
    const m = playlistUrl.match(/\/(pl\.[A-Za-z0-9]+)/);
    playlistId = m ? m[1] : '';
  }

  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(5000);

  // Give lazy/virtualised playlist rows a chance to render.
  for (let i = 0; i < 45; i++) {
    await page.evaluate(() => {
      for (const el of document.querySelectorAll('*')) {
        const style = getComputedStyle(el);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
          el.scrollTop = Math.min(el.scrollHeight, el.scrollTop + Math.max(350, el.clientHeight * 0.85));
        }
      }
      window.scrollBy(0, 700);
    });
    await page.waitForTimeout(300);
  }

  const raw = await page.evaluate(() => ({
    text: document.body.innerText,
    html: document.documentElement.innerHTML,
    links: [...document.querySelectorAll('a')].map(a => ({ text: a.innerText.trim(), href: a.href })).filter(x => x.text)
  }));

  const lines = raw.text.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const durationRe = /^\d{1,2}:\d{2}$/;
  const tracks = [];

  if (provider === 'spotify') {
    for (let i = 0; i < lines.length; i++) {
      if (!durationRe.test(lines[i])) continue;
      const duration = lines[i], artist = lines[i - 1] || '', title = lines[i - 2] || '';
      if (!title || !artist || /^\d+$/.test(title) || /^\d+$/.test(artist)) continue;
      const key = `${title}\u0000${artist}\u0000${duration}`;
      if (!tracks.some(t => t.key === key)) tracks.push({ key, title, artist, duration });
    }
  } else {
    // Apple Music exposes useful track metadata in its rendered page. First inspect
    // JSON-LD, then fall back to rendered text heuristics so the POC tells us which
    // public representation is most dependable.
    const jsonLd = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent));
    for (const blob of jsonLd) {
      try {
        const data = JSON.parse(blob);
        const nodes = Array.isArray(data) ? data : [data];
        for (const node of nodes) {
          const list = node.track || node.tracks || node.itemListElement || [];
          const arr = Array.isArray(list) ? list : [list];
          for (const entry of arr) {
            const item = entry.item || entry;
            const title = item.name || '';
            const artistObj = item.byArtist || item.author || item.artist || {};
            const artist = typeof artistObj === 'string' ? artistObj : (artistObj.name || '');
            let duration = item.duration || '';
            const dm = String(duration).match(/PT(?:(\d+)M)?(?:(\d+)S)?/i);
            if (dm) duration = `${+(dm[1] || 0)}:${String(+(dm[2] || 0)).padStart(2,'0')}`;
            if (title && artist) {
              const key = `${title}\u0000${artist}\u0000${duration}`;
              if (!tracks.some(t => t.key === key)) tracks.push({ key, title, artist, duration });
            }
          }
        }
      } catch (_) {}
    }

    // If structured metadata did not expose the rows, collect duration-adjacent text
    // as a diagnostic fallback. This is deliberately heuristic for the experiment.
    if (!tracks.length) {
      for (let i = 0; i < lines.length; i++) {
        if (!durationRe.test(lines[i])) continue;
        const duration = lines[i];
        const nearby = lines.slice(Math.max(0, i - 4), i).filter(x => !/^\d+$/.test(x));
        if (nearby.length < 2) continue;
        const title = nearby[nearby.length - 2], artist = nearby[nearby.length - 1];
        const key = `${title}\u0000${artist}\u0000${duration}`;
        if (!tracks.some(t => t.key === key)) tracks.push({ key, title, artist, duration });
      }
    }
  }

  const result = {
    source: `${provider}-rendered-public-page`, provider, playlistId, targetUrl,
    trackCount: tracks.length,
    tracks: tracks.map(({ key, ...t }, i) => ({ position: i + 1, ...t })),
    sampleText: lines.slice(0, 180)
  };

  console.log('PLAYLIST_POC_RESULT_START');
  console.log(JSON.stringify(result, null, 2));
  console.log('PLAYLIST_POC_RESULT_END');
  await page.screenshot({ path: 'playlist-extract-poc.png', fullPage: true });
  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
