const APP_ID = '6DGZIMLH49';
const API_KEY = '71d982987ae69c2e9f12a5537b54d723';
const INDEX = 'pistesV1';

const BAD_VERSION = /\b(karaoke|remix|live|instrumental|tribute|cover|re-record|rerecord|sped up|slowed|acoustic)\b/i;
const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
const first = v => Array.isArray(v) ? v[0] : v;
const slug = s => norm(s).replace(/\s+/g, '-');

function artistTokens(s) {
  return norm(s).split(' ').filter(x => x.length > 1 && !['and','the','feat','featuring'].includes(x));
}

function performerMatch(inputArtist, hit) {
  const wanted = artistTokens(inputArtist);
  if (!wanted.length) return 0;
  const hay = norm([...(hit.performers || []), ...(hit.artist?.name || [])].join(' '));
  const matched = wanted.filter(t => hay.includes(t)).length;
  return matched / wanted.length;
}

function score(input, hit, rank) {
  const title = String(first(hit.title) || '');
  const inTitle = norm(input.title);
  const outTitle = norm(title);
  let points = 0;
  const reasons = [];

  if (outTitle === inTitle) { points += 55; reasons.push('exact title'); }
  else if (outTitle.includes(inTitle) || inTitle.includes(outTitle)) { points += 34; reasons.push('near title'); }

  const a = performerMatch(input.artist, hit);
  if (a >= 0.99) { points += 35; reasons.push('performer match'); }
  else if (a >= 0.6) { points += 20; reasons.push('partial performer match'); }

  if (BAD_VERSION.test(title) && !BAD_VERSION.test(input.title)) {
    points -= 55;
    reasons.push('unexpected version');
  }

  if (hit.start?.AU && hit.end?.AU) {
    const now = Math.floor(Date.now() / 1000);
    if (hit.start.AU <= now && hit.end.AU > now) { points += 5; reasons.push('AU catalogue'); }
  }

  points += Math.max(0, 5 - rank);
  return { points, reasons, title };
}

async function algoliaSearch(query) {
  const url = `https://${APP_ID}-dsn.algolia.net/1/indexes/${INDEX}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-algolia-application-id': APP_ID,
      'x-algolia-api-key': API_KEY
    },
    body: JSON.stringify({ params: `query=${encodeURIComponent(query)}&hitsPerPage=15` })
  });
  if (!res.ok) throw new Error(`Qobuz search ${res.status}`);
  return res.json();
}

function normaliseCandidate(hit, input, rank) {
  const scored = score(input, hit, rank);
  const artist = first(hit.artist?.name) || input.artist || '';
  const album = first(hit.album?.title) || '';
  const albumId = hit.album?.id || '';
  return {
    title: scored.title,
    artist,
    performers: hit.performers || [],
    album,
    isrc: hit.isrc || '',
    score: scored.points,
    reasons: scored.reasons,
    url: albumId ? `https://www.qobuz.com/au-en/album/${slug(album)}-${slug(artist)}/${albumId}` : ''
  };
}

async function matchTrack(input) {
  const data = await algoliaSearch(`${input.artist || ''} ${input.title || ''}`.trim());
  let candidates = (data.hits || []).map((h, i) => normaliseCandidate(h, input, i));

  // Collapse duplicate reissues of the exact same recording where Qobuz exposes the same ISRC.
  const byRecording = new Map();
  for (const c of candidates) {
    const key = c.isrc || `${norm(c.title)}|${norm(c.artist)}|${norm(c.album)}`;
    if (!byRecording.has(key) || byRecording.get(key).score < c.score) byRecording.set(key, c);
  }
  candidates = [...byRecording.values()].sort((a, b) => b.score - a.score).slice(0, 3);

  const best = candidates[0] || null;
  const second = candidates[1] || null;
  const gap = best ? best.score - (second?.score ?? 0) : 0;
  let status = 'none';
  if (best && best.score >= 88 && (gap >= 8 || !second)) status = 'high';
  else if (best && best.score >= 68) status = 'check';

  return { input, status, best, candidates };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  try {
    const tracks = Array.isArray(req.body?.tracks) ? req.body.tracks.slice(0, 40) : [];
    if (!tracks.length) return res.status(400).json({ ok: false, error: 'No tracks supplied' });
    const results = await Promise.all(tracks.map(t => matchTrack({
      title: String(t.title || '').trim(),
      artist: String(t.artist || '').trim(),
      duration: String(t.duration || '').trim()
    })));
    return res.status(200).json({ ok: true, results });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'Qobuz matching failed' });
  }
}
