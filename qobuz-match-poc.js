const APP_ID = '6DGZIMLH49';
const API_KEY = '71d982987ae69c2e9f12a5537b54d723';
const INDEX = 'pistesV1';

const tests = [
  { title: 'Jolene', artist: 'Dolly Parton', duration: '2:43' },
  { title: 'Islands In the Stream', artist: 'Dolly Parton, Kenny Rogers', duration: '4:09' },
  { title: 'I Will Always Love You', artist: 'Dolly Parton', duration: '2:57' },
  { title: '9 to 5', artist: 'Dolly Parton', duration: '2:46' }
];

const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
const secs = s => { const p=String(s||'').split(':').map(Number); return p.length===2 ? p[0]*60+p[1] : Number(s)||0; };
const bad = /\b(karaoke|remix|live|instrumental|tribute|cover|re-record|rerecord|sped up|slowed|acoustic)\b/i;

function getFirst(obj, paths) {
  for (const path of paths) {
    let v=obj;
    for (const key of path.split('.')) v=v && v[key];
    if (v !== undefined && v !== null && v !== '') return v;
  }
}

function normalizeHit(h) {
  const title=getFirst(h,['title','name','track_title','track.name','title_display']) || '';
  const artist=getFirst(h,['artist','artist_name','performer','performer_name','album.artist.name','main_artist.name','artist.name']) || '';
  const duration=getFirst(h,['duration','duration_seconds','length','track.duration']) || 0;
  const album=getFirst(h,['album_title','album.name','album.title','release_title']) || '';
  const url=getFirst(h,['url','qobuz_url','permalink','link']) || '';
  return {title:String(title), artist:String(artist), duration:Number(duration)||0, album:String(album), url:String(url), raw:h};
}

function score(input,c) {
  const it=norm(input.title), ia=norm(input.artist), ct=norm(c.title), ca=norm(c.artist);
  let score=0; const reasons=[];
  if (ct===it) { score+=45; reasons.push('exact title'); }
  else if (ct.includes(it)||it.includes(ct)) { score+=28; reasons.push('near title'); }
  if (ca===ia) { score+=35; reasons.push('exact artist'); }
  else {
    const inputArtists=ia.split(/\s+(?:and|&|,)\s+|,/).filter(Boolean);
    const candidateArtists=ca.split(/\s+(?:and|&|,)\s+|,/).filter(Boolean);
    const overlap=inputArtists.filter(a=>candidateArtists.some(b=>a===b||a.includes(b)||b.includes(a))).length;
    if (overlap) { score+=Math.min(30,18+overlap*6); reasons.push('artist overlap'); }
  }
  const delta=Math.abs(secs(input.duration)-c.duration);
  if (c.duration) {
    if (delta<=3) { score+=20; reasons.push(`duration ±${delta}s`); }
    else if (delta<=6) { score+=10; reasons.push(`duration ±${delta}s`); }
    else reasons.push(`duration differs ${delta}s`);
  } else reasons.push('duration unavailable');
  if (bad.test(c.title) && !bad.test(input.title)) { score-=45; reasons.push('unexpected version marker'); }
  return {score, confidence:score>=90?'high':score>=72?'check':'low', reasons};
}

async function algoliaSearch(query) {
  const url=`https://${APP_ID}-dsn.algolia.net/1/indexes/${encodeURIComponent(INDEX)}/query`;
  const res=await fetch(url,{
    method:'POST',
    headers:{
      'content-type':'application/json',
      'x-algolia-application-id':APP_ID,
      'x-algolia-api-key':API_KEY
    },
    body:JSON.stringify({params:`query=${encodeURIComponent(query)}&hitsPerPage=20`})
  });
  const text=await res.text();
  if(!res.ok) throw new Error(`Algolia ${res.status}: ${text.slice(0,500)}`);
  return JSON.parse(text);
}

(async()=>{
  console.log('QOBUZ_ALGOLIA_POC_START');
  for(const input of tests){
    const query=`${input.artist} ${input.title}`;
    console.log(`\n=== ${query} ===`);
    const data=await algoliaSearch(query);
    console.log('TOTAL_HITS',data.nbHits,'RETURNED',data.hits?.length||0);
    if (data.hits?.[0]) console.log('FIRST_HIT_KEYS',Object.keys(data.hits[0]).sort().join(','));
    const candidates=(data.hits||[]).map(normalizeHit).map(c=>({...c,...score(input,c)})).sort((a,b)=>b.score-a.score);
    for(const c of candidates.slice(0,8)){
      console.log(JSON.stringify({title:c.title,artist:c.artist,duration:c.duration,album:c.album,url:c.url,score:c.score,confidence:c.confidence,reasons:c.reasons}));
    }
    const best=candidates[0]||null;
    console.log('RESULT',JSON.stringify({input,best:best&&{title:best.title,artist:best.artist,duration:best.duration,album:best.album,url:best.url,score:best.score,confidence:best.confidence,reasons:best.reasons},autoRecommend:!!best&&best.confidence==='high'}));
  }
  console.log('QOBUZ_ALGOLIA_POC_END');
})().catch(e=>{console.error('POC_ERROR',e.stack||e);process.exit(1)});
