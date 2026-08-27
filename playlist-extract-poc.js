const { chromium } = require('playwright');

const playlistUrl = process.env.PLAYLIST_URL || 'https://open.spotify.com/playlist/5TNGJeYkQvZBzuj2LiDxlP?si=b2ca90eae7894418';
const idMatch = playlistUrl.match(/playlist\/([A-Za-z0-9]+)/);
if (!idMatch) throw new Error('Could not parse Spotify playlist ID');
const playlistId = idMatch[1];
const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
  await page.goto(embedUrl, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(5000);

  // Scroll every scrollable container so virtualised/lazy rows get a chance to render.
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => {
      const els = [...document.querySelectorAll('*')];
      for (const el of els) {
        const style = getComputedStyle(el);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
          el.scrollTop = Math.min(el.scrollHeight, el.scrollTop + Math.max(300, el.clientHeight * 0.8));
        }
      }
      window.scrollBy(0, 600);
    });
    await page.waitForTimeout(350);
  }

  const raw = await page.evaluate(() => {
    const text = document.body.innerText;
    const links = [...document.querySelectorAll('a')].map(a => ({ text: a.innerText.trim(), href: a.href })).filter(x => x.text);
    const buttons = [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(Boolean);
    return { text, links, buttons };
  });

  // Heuristic parser for Spotify embed rows. We keep this intentionally loose for the POC.
  const lines = raw.text.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const durationRe = /^\d{1,2}:\d{2}$/;
  const tracks = [];
  for (let i = 0; i < lines.length; i++) {
    if (!durationRe.test(lines[i])) continue;
    const duration = lines[i];
    const artist = lines[i - 1] || '';
    const title = lines[i - 2] || '';
    if (!title || !artist) continue;
    if (/^\d+$/.test(title) || /^\d+$/.test(artist)) continue;
    const key = `${title}\u0000${artist}\u0000${duration}`;
    if (!tracks.some(t => t.key === key)) tracks.push({ key, title, artist, duration });
  }

  const result = {
    source: 'spotify-embed-rendered-page',
    playlistId,
    embedUrl,
    trackCount: tracks.length,
    tracks: tracks.map(({ key, ...t }, i) => ({ position: i + 1, ...t })),
    sampleText: lines.slice(0, 120)
  };

  console.log('PLAYLIST_POC_RESULT_START');
  console.log(JSON.stringify(result, null, 2));
  console.log('PLAYLIST_POC_RESULT_END');

  await page.screenshot({ path: 'playlist-extract-poc.png', fullPage: true });
  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
