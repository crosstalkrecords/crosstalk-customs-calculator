from pathlib import Path
p=Path('easy-track-builder-sandbox.html')
s=p.read_text()

# --- Styles ---
style_anchor='.qsource details[open] summary{display:inline}.qcandidates{padding-top:3px}.qcandidates a{display:block;margin:2px 0}'
extra_css='.builderhead{display:flex;align-items:center;justify-content:space-between;gap:10px}.buildertools{display:flex;gap:6px}.buildertools button{border:1px solid #d8e2e8;background:#fff;border-radius:8px;padding:6px 9px;font:inherit;font-size:10.5px;font-weight:750;color:#5c6a72;cursor:pointer}.buildertools button:hover{background:#f7fafc}.doublelp-hint{margin-top:8px;font-size:10.5px;color:#667680}.suggestions{grid-column:2/4;margin-top:-2px;border:1px solid #d7e4ec;border-radius:8px;background:#fff;box-shadow:0 5px 16px rgba(0,0,0,.06);overflow:hidden;z-index:2}.suggestion{display:block;width:100%;border:0;border-bottom:1px solid #edf1f3;background:#fff;padding:8px 9px;text-align:left;font:inherit;cursor:pointer}.suggestion:last-child{border-bottom:0}.suggestion:hover,.suggestion.active{background:#f1f7fb}.suggestion strong{display:block;font-size:11px}.suggestion small{display:block;font-size:10px;color:#777;margin-top:2px}.searching{grid-column:2/4;font-size:10px;color:#888;margin-top:-2px}'
if '.builderhead{' not in s:
    if style_anchor not in s: raise SystemExit('style anchor missing')
    s=s.replace(style_anchor,style_anchor+extra_css,1)

# --- Persistent 2LP hint under playlist import ---
old='<div id="playlistMsg" class="muted" style="margin-top:7px">A playlist is a handy starting point for planning your record. We\'ll still need the actual audio files before we can make it.</div><div id="doubleLPBox" class="doublelp"></div>'
new='<div id="playlistMsg" class="muted" style="margin-top:7px">A playlist is a handy starting point for planning your record. We\'ll still need the actual audio files before we can make it.</div><div class="doublelp-hint">Long playlist? If it fits across four sides, we’ll offer a 2×LP automatically.</div><div id="doubleLPBox" class="doublelp"></div>'
if old in s:s=s.replace(old,new,1)

# --- Clear Tracklist control in builder heading ---
old='<div class="help"><strong>Easy Track Builder</strong><div class="side">'
new='<div class="help"><div class="builderhead"><strong>Easy Track Builder</strong><div class="buildertools"><button type="button" id="clearTracks">Clear tracklist</button></div></div><div class="side">'
if old in s:s=s.replace(old,new,1)

# --- Helper functions before addTrack ---
anchor='function addTrack(side){'
if 'function clearTracklist' not in s:
    helpers=r'''function clearTracklist(){['A','B','C','D'].forEach(x=>{$(`tracks${x}`).innerHTML=''});$('sideC').classList.add('hidden');$('sideD').classList.add('hidden');state.doubleLP=false;lastImportedTracks=[];$('manual').value='';$('playlistUrl').value='';$('doubleLPBox').classList.remove('show');$('doubleLPBox').innerHTML='';$('playlistMsg').textContent="A playlist is a handy starting point for planning your record. We'll still need the actual audio files before we can make it.";addTrack('A');addTrack('B');priceUI();totals();clearValidation('validate2')}
function closeSuggestions(row){const old=row.querySelector('.suggestions'),wait=row.querySelector('.searching');if(old)old.remove();if(wait)wait.remove()}
async function enrichOneRow(row,track){try{const res=await fetch('https://crosstalk-playlist-importer.vercel.app/api/qobuz',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tracks:[track]})});const data=await res.json();if(res.ok&&data.ok&&data.results?.[0])renderQ(row,data.results[0])}catch(_){}}
function chooseSuggestion(row,item){row.querySelector('.tn').value=`${item.artist} — ${item.title}`;row.querySelector('.td').value=item.duration?fmt(item.duration):'';closeSuggestions(row);totals();clearValidation('validate2');enrichOneRow(row,{title:item.title,artist:item.artist,duration:item.duration?fmt(item.duration):''})}
async function searchSuggestions(row,input,token){const q=input.value.trim();closeSuggestions(row);if(q.length<3)return;const wait=document.createElement('div');wait.className='searching';wait.textContent='Finding track…';row.appendChild(wait);try{const res=await fetch('https://crosstalk-playlist-importer.vercel.app/api/track-search?q='+encodeURIComponent(q));const data=await res.json();if(input._searchToken!==token)return;closeSuggestions(row);if(!res.ok||!data.ok||!data.results?.length)return;const box=document.createElement('div');box.className='suggestions';data.results.slice(0,5).forEach(item=>{const b=document.createElement('button');b.type='button';b.className='suggestion';b.innerHTML=`<strong>${esc(item.artist)} — ${esc(item.title)}</strong><small>${esc(item.album||'')}${item.duration?' · '+fmt(item.duration):''}</small>`;b.onmousedown=e=>{e.preventDefault();chooseSuggestion(row,item)};box.appendChild(b)});row.appendChild(box)}catch(_){closeSuggestions(row)}}
function wireAutocomplete(row){const input=row.querySelector('.tn');let timer;input.addEventListener('input',()=>{clearTimeout(timer);closeSuggestions(row);input._searchToken=(input._searchToken||0)+1;const token=input._searchToken;if(input.value.trim().length>=3)timer=setTimeout(()=>searchSuggestions(row,input,token),350)});input.addEventListener('blur',()=>setTimeout(()=>closeSuggestions(row),180))}
'''
    if anchor not in s: raise SystemExit('addTrack anchor missing')
    s=s.replace(anchor,helpers+anchor,1)

# Wire autocomplete whenever a track row is created.
old="r.querySelector('.remove').onclick=()=>{r.remove();totals()};$(`tracks${side}`).appendChild(r);totals()}"
new="r.querySelector('.remove').onclick=()=>{r.remove();totals()};wireAutocomplete(r);$(`tracks${side}`).appendChild(r);totals()}"
if old in s:s=s.replace(old,new,1)

# --- 2LP offer: always visible after a viable overlength import, including promo builds ---
start=s.find('function doubleLPOffer(tracks,grand){')
end=s.find('function review(){',start)
if start<0 or end<0: raise SystemExit('doubleLP function not found')
new_func=r'''function doubleLPOffer(tracks,grand){const box=$('doubleLPBox'),one=dur(lim())*2,two=dur(lim())*4;box.classList.remove('show');box.innerHTML='';if(grand<=one)return;if(grand<=two){const promoNote=state.promo?' This switches you out of the single-LP Father\'s Day Special.':'';box.innerHTML=`<strong>Want to keep the whole playlist?</strong><br>This runtime is a natural fit for a <strong>2×LP set</strong> — we can spread it across four sides for <strong>$225</strong>.${promoNote}<br><button type="button" class="btn" id="chooseDoubleLP">Make it a 2×LP</button>`;box.classList.add('show');$('chooseDoubleLP').onclick=()=>{state.promo=false;state.mode='regular';repartitionDoubleLP(tracks);renderBadges();updateModeScreens()}}else{box.innerHTML='<strong>This playlist is much longer than a vinyl set can hold.</strong><br>Even a 2×LP would still need substantial trimming. Clear the list or pick the must-have tracks first and we’ll keep the runtime clear as you go.';box.classList.add('show')}}
'''
s=s[:start]+new_func+s[end:]

# Clear button event.
wire_anchor="all('.add').forEach(b=>b.onclick=()=>addTrack(b.dataset.side));"
if "$('clearTracks').onclick" not in s:
    if wire_anchor not in s: raise SystemExit('wire anchor missing')
    s=s.replace(wire_anchor,wire_anchor+"$('clearTracks').onclick=clearTracklist;",1)

# Keep acknowledgement and sourcing on successful import.
if 'doubleLPOffer(tracks,grand);enrichQobuz(tracks)' in s:
    s=s.replace('doubleLPOffer(tracks,grand);enrichQobuz(tracks)','doubleLPOffer(tracks,grand);acknowledgeImport();enrichQobuz(tracks)',1)
elif 'doubleLPOffer(tracks,grand)}catch(err)' in s:
    s=s.replace('doubleLPOffer(tracks,grand)}catch(err)','doubleLPOffer(tracks,grand);acknowledgeImport();enrichQobuz(tracks)}catch(err)',1)

p.write_text(s)
print('Added clear tracklist, manual autocomplete, Qobuz enrichment, and visible 2LP path')
