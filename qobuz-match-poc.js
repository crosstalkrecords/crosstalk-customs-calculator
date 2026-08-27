const APP_ID = '6DGZIMLH49';
const API_KEY = '71d982987ae69c2e9f12a5537b54d723';
const INDEX = 'pistesV1';

const tests = [
  { title: 'Jolene', artist: 'Dolly Parton', duration: '2:43' },
  { title: 'Islands In the Stream', artist: 'Dolly Parton, Kenny Rogers', duration: '4:09' }
];

async function algoliaSearch(query) {
  const url=`https://${APP_ID}-dsn.algolia.net/1/indexes/${encodeURIComponent(INDEX)}/query`;
  const res=await fetch(url,{
    method:'POST',
    headers:{
      'content-type':'application/json',
      'x-algolia-application-id':APP_ID,
      'x-algolia-api-key':API_KEY
    },
    body:JSON.stringify({params:`query=${encodeURIComponent(query)}&hitsPerPage=5`})
  });
  const text=await res.text();
  if(!res.ok) throw new Error(`Algolia ${res.status}: ${text.slice(0,500)}`);
  return JSON.parse(text);
}

(async()=>{
  console.log('QOBUZ_RAW_SHAPE_START');
  for(const input of tests){
    const query=`${input.artist} ${input.title}`;
    console.log(`\n=== ${query} ===`);
    const data=await algoliaSearch(query);
    console.log('TOTAL_HITS',data.nbHits,'RETURNED',data.hits?.length||0);
    for(let i=0;i<Math.min(3,data.hits?.length||0);i++){
      console.log(`RAW_HIT_${i+1}_START`);
      console.log(JSON.stringify(data.hits[i],null,2));
      console.log(`RAW_HIT_${i+1}_END`);
    }
  }
  console.log('QOBUZ_RAW_SHAPE_END');
})().catch(e=>{console.error('POC_ERROR',e.stack||e);process.exit(1)});
