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

  const text = await page.evaluate(() => document.body.innerText);
  const lines = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const durationRe = /^\d{1,2}:\d{2}$/;
  const tracks = [];

  if (provider === 'spotify') {
    for (let i = 0; i < lines.length; i++) {
      if (!durationRe.test(lines[i])) continue;
      const duration = lines[i];
      const artist = lines[i - 1] || '';
      const title = lines[i - 2] || '';
      if (!title || !artist || /^\d+$/.test(title) || /^\d+$/.test(artist)) continue;
      tracks.push({ title, artist, duration });
    }
  } else {
    // Apple public playlist rows render as:
    // Song, Artist, Album, PREVIEW, Duration.
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toUpperCase() !== 'PREVIEW') continue;
      const duration = lines[i + 1] || '';
      if (!durationRe.test(duration)) continue;
      const album = lines[i - 1] || '';
      const artist = lines[i - 2] || '';
      const title = lines[i - 3] || '';
      if (!title || !artist) continue;
      tracks.push({ title, artist, album, duration });
    }
  }

  const result = {
    source: `${provider}-rendered-public-page`, provider, playlistId, targetUrl,
    trackCount: tracks.length,
    tracks: tracks.map((t, i) => ({ position: i + 1, ...t })),
    sampleText: lines.slice(0, 180)
  };

  console.log('PLAYLIST_POC_RESULT_START');
  console.log(JSON.stringify(result, null, 2));
  console.log('PLAYLIST_POC_RESULT_END');
  await page.screenshot({ path: 'playlist-extract-poc.png', fullPage: true });
  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
