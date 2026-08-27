const APP_ID='6DGZIMLH49';
const API_KEY='71d982987ae69c2e9f12a5537b54d723';
const INDEX='pistesV1';
const input={title:'Jolene',artist:'Dolly Parton',duration:'2:43'};
const slug=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

async function timedFetch(url,opts={},ms=5000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  const started=Date.now();
  try{
    const res=await fetch(url,{...opts,signal:controller.signal});
    const text=await res.text();
    return {status:res.status,ok:res.ok,url:res.url,type:res.headers.get('content-type')||'',text,ms:Date.now()-started};
  }catch(e){return {status:0,ok:false,url,type:'',text:'',ms:Date.now()-started,error:e.name+': '+e.message};}
  finally{clearTimeout(timer);}
}

(async()=>{
  console.log('QOBUZ_DETAIL_PROBE_V2_START');
  const searchUrl=`https://${APP_ID}-dsn.algolia.net/1/indexes/${INDEX}/query`;
  const sr=await timedFetch(searchUrl,{method:'POST',headers:{'content-type':'application/json','x-algolia-application-id':APP_ID,'x-algolia-api-key':API_KEY},body:JSON.stringify({params:`query=${encodeURIComponent(input.artist+' '+input.title)}&hitsPerPage=3`})});
  if(!sr.ok) throw new Error('Search failed '+JSON.stringify({status:sr.status,error:sr.error}));
  const data=JSON.parse(sr.text); const hit=data.hits?.[0];
  if(!hit) throw new Error('No hit');
  const one=v=>Array.isArray(v)?v[0]:v;
  const title=one(hit.title), artist=one(hit.artist?.name), album=one(hit.album?.title), albumId=hit.album?.id, trackId=hit.objectID, isrc=hit.isrc;
  const shop=`https://www.qobuz.com/au-en/album/${slug(album)}-${slug(artist)}/${albumId}`;
  console.log('MATCH',JSON.stringify({title,artist,album,albumId,trackId,isrc,performers:hit.performers,shop,searchMs:sr.ms}));

  for(const [name,url] of [
    ['SHOP',shop],
    ['TRACK_API',`https://www.qobuz.com/api.json/0.2/track/get?app_id=${APP_ID}&track_id=${trackId}`],
    ['ALBUM_API',`https://www.qobuz.com/api.json/0.2/album/get?app_id=${APP_ID}&album_id=${albumId}`]
  ]){
    const r=await timedFetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0'}},5000);
    console.log('PROBE',name,JSON.stringify({status:r.status,ok:r.ok,ms:r.ms,finalUrl:r.url,type:r.type,bytes:r.text.length,error:r.error||null}));
    if(r.text){
      const low=r.text.toLowerCase();
      for(const needle of [String(isrc).toLowerCase(),String(trackId).toLowerCase(),'duration','price','purchas','download']){
        const i=low.indexOf(needle); if(i>=0) console.log(name+'_FOUND_'+needle.toUpperCase(),r.text.slice(Math.max(0,i-350),i+850).replace(/\s+/g,' '));
      }
      if(/json/i.test(r.type)) console.log(name+'_JSON_HEAD',r.text.slice(0,7000));
    }
  }
  console.log('QOBUZ_DETAIL_PROBE_V2_END');
})().catch(e=>{console.error('POC_ERROR',e.stack||e);process.exit(1)});
