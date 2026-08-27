const APP_ID = '6DGZIMLH49';
const API_KEY = '71d982987ae69c2e9f12a5537b54d723';
const INDEX = 'pistesV1';

const tests = [
  { title: 'Jolene', artist: 'Dolly Parton', duration: '2:43' },
  { title: 'Islands In the Stream', artist: 'Dolly Parton, Kenny Rogers', duration: '4:09' }
];

const slug = s => String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

async function algoliaSearch(query) {
  const url=`https://${APP_ID}-dsn.algolia.net/1/indexes/${encodeURIComponent(INDEX)}/query`;
  const res=await fetch(url,{
    method:'POST',
    headers:{'content-type':'application/json','x-algolia-application-id':APP_ID,'x-algolia-api-key':API_KEY},
    body:JSON.stringify({params:`query=${encodeURIComponent(query)}&hitsPerPage=5`})
  });
  const text=await res.text();
  if(!res.ok) throw new Error(`Algolia ${res.status}: ${text.slice(0,500)}`);
  return JSON.parse(text);
}

async function fetchProbe(url) {
  const started=Date.now();
  try {
    const res=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0'}});
    const text=await res.text();
    return {ok:res.ok,status:res.status,url:res.url,ms:Date.now()-started,contentType:res.headers.get('content-type')||'',text};
  } catch(e) {
    return {ok:false,status:0,url,ms:Date.now()-started,error:e.message,text:''};
  }
}

function contexts(text, needles, radius=500) {
  const out=[];
  for(const needle of needles){
    let from=0;
    while(true){
      const i=text.toLowerCase().indexOf(String(needle).toLowerCase(),from);
      if(i<0) break;
      out.push(text.slice(Math.max(0,i-radius),Math.min(text.length,i+String(needle).length+radius)).replace(/\s+/g,' ').slice(0,1400));
      from=i+String(needle).length;
      if(out.length>=12) return out;
    }
  }
  return out;
}

(async()=>{
  console.log('QOBUZ_DETAIL_PROBE_START');
  for(const input of tests){
    const data=await algoliaSearch(`${input.artist} ${input.title}`);
    const hit=data.hits?.[0];
    if(!hit){console.log('NO_HIT',input);continue;}
    const title=Array.isArray(hit.title)?hit.title[0]:hit.title;
    const artist=Array.isArray(hit.artist?.name)?hit.artist.name[0]:hit.artist?.name;
    const album=Array.isArray(hit.album?.title)?hit.album.title[0]:hit.album?.title;
    const albumId=hit.album?.id;
    const trackId=hit.objectID;
    const isrc=hit.isrc;
    const shopUrl=`https://www.qobuz.com/au-en/album/${slug(album)}-${slug(artist)}/${albumId}`;
    console.log('\nINPUT',JSON.stringify(input));
    console.log('HIT',JSON.stringify({title,artist,album,albumId,trackId,isrc,performers:hit.performers,shopUrl}));

    const probes=[
      ['SHOP',shopUrl],
      ['SHOP_MINIMAL',`https://www.qobuz.com/au-en/album/x/${albumId}`],
      ['TRACK_API_ALGOLIA_ID',`https://www.qobuz.com/api.json/0.2/track/get?app_id=${encodeURIComponent(APP_ID)}&track_id=${encodeURIComponent(trackId)}`],
      ['ALBUM_API_ALGOLIA_ID',`https://www.qobuz.com/api.json/0.2/album/get?app_id=${encodeURIComponent(APP_ID)}&album_id=${encodeURIComponent(albumId)}`]
    ];

    for(const [name,url] of probes){
      const r=await fetchProbe(url);
      console.log('PROBE',name,JSON.stringify({status:r.status,ok:r.ok,ms:r.ms,finalUrl:r.url,contentType:r.contentType,error:r.error||null,bytes:r.text.length}));
      if(r.text){
        const snippets=contexts(r.text,[isrc,trackId,'duration','purchasable','downloadable','price','buy track']);
        for(const s of snippets.slice(0,8)) console.log(`${name}_CONTEXT`,s);
        if(/json/i.test(r.contentType)) console.log(`${name}_JSON_HEAD`,r.text.slice(0,5000));
      }
    }
  }
  console.log('QOBUZ_DETAIL_PROBE_END');
})().catch(e=>{console.error('POC_ERROR',e.stack||e);process.exit(1)});
