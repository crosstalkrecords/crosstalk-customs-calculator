const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

const ALLOWED_ORIGINS = new Set([
  'https://crosstalkrecords.github.io',
  'https://crosstalkrecords.com',
  'https://www.crosstalkrecords.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function providerFor(url) {
  if (/^https:\/\/open\.spotify\.com\/playlist\/[A-Za-z0-9]+/i.test(url)) return 'spotify';
  if (/^https:\/\/music\.apple\.com\/[a-z]{2}\/playlist\/.+\/pl\.[A-Za-z0-9]+/i.test(url)) return 'apple';
  return null;
}

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });

  const playlistUrl = String(req.query.url || '').trim();
  const provider = providerFor(playlistUrl);
  if (!provider) return res.status(400).json({ ok: false, error: 'Paste a public Spotify or Apple Music playlist URL.' });

  let browser;
  try {
    let targetUrl = playlistUrl;
    let playlistId = '';
    if (provider === 'spotify') {
      const m = playlistUrl.match(/playlist\/([A-Za-z0-9]+)/i);
      playlistId = m[1];
      targetUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
    } else {
      const m = playlistUrl.match(/\/(pl\.[A-Za-z0-9]+)/i);
      playlistId = m ? m[1] : '';
    }

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 1200 },
      executablePath: await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v141.0.0/chromium-v141.0.0-pack.x64.tar'),
      headless: chromium.headless
    });
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 3500));

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
      await new Promise(r => setTimeout(r, 180));
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

    if (!tracks.length) throw new Error('Playlist loaded, but no track rows were extracted.');

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      ok: true,
      provider,
      playlistId,
      trackCount: tracks.length,
      tracks: tracks.map((t, i) => ({ position: i + 1, ...t }))
    });
  } catch (error) {
    console.error('playlist-import-error', error);
    return res.status(500).json({ ok: false, error: 'We could not read that playlist right now.', detail: String(error.message || error) });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
};
