export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });

  const q = String(req.query?.q || '').trim();
  if (q.length < 3) return res.status(200).json({ ok: true, results: [] });

  try {
    const url = new URL('https://itunes.apple.com/search');
    url.searchParams.set('term', q);
    url.searchParams.set('country', 'AU');
    url.searchParams.set('media', 'music');
    url.searchParams.set('entity', 'song');
    url.searchParams.set('limit', '6');
    url.searchParams.set('explicit', 'Yes');

    const upstream = await fetch(url, {
      headers: { 'user-agent': 'Crosstalk-Customs/1.0' }
    });
    if (!upstream.ok) throw new Error(`Apple search ${upstream.status}`);
    const data = await upstream.json();

    const results = (data.results || []).map(x => ({
      id: String(x.trackId || ''),
      title: x.trackName || '',
      artist: x.artistName || '',
      album: x.collectionName || '',
      duration: Number.isFinite(x.trackTimeMillis) ? Math.round(x.trackTimeMillis / 1000) : 0,
      artwork: x.artworkUrl60 || '',
      appleUrl: x.trackViewUrl || ''
    })).filter(x => x.title && x.artist);

    return res.status(200).json({ ok: true, results });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'Track search failed' });
  }
}
