from pathlib import Path

p = Path('easy-track-builder-sandbox.html')
s = p.read_text()

# Repair literal backslash-n sequences accidentally emitted between JS functions.
s = s.replace('return true}\\nfunction doubleLPOffer', 'return true}\nfunction doubleLPOffer')
s = s.replace('priceUI()}}\\nfunction review(){', 'priceUI()}}\nfunction review(){')

# Artist unlock must expose a real forward action, and relocking must remove artist pricing.
artist_continue = "$('artistContinue').onclick=()=>{state.promo=false;state.size=null;state.rpm=null;go(1);recordUI()};"
artist_guard = "$('artistCode').addEventListener('input',()=>{const ok=$('artistCode').value.trim().toUpperCase()==='STARVINGARTIST';$('artistContinue').classList.toggle('hidden',!ok);if(!ok&&state.mode==='artist'){state.mode='regular';renderBadges();priceUI()}});"
if artist_guard not in s:
    s = s.replace(artist_continue, artist_guard + artist_continue, 1)

# Shipping should not be submit-able without an address.
old_delivery = "$('delivery').onchange=e=>{state.shipping=e.target.value==='shipping';$('shipping').classList.toggle('hidden',!state.shipping);priceUI();review()};"
new_delivery = "$('delivery').onchange=e=>{state.shipping=e.target.value==='shipping';$('shipping').classList.toggle('hidden',!state.shipping);all('#shipping input,#shipping select').forEach(x=>x.required=state.shipping);priceUI();review()};"
if old_delivery in s:
    s = s.replace(old_delivery, new_delivery, 1)

# Backtracking out of a 2xLP should never leave a stale four-side state or lose the tracklist.
collapse = r'''function collapseDoubleLP(){if(!state.doubleLP)return;const tracks=qRows().map(r=>{const raw=r.querySelector('.tn').value.trim(),duration=r.querySelector('.td').value.trim();if(!raw)return null;let artist='',title=raw;if(raw.includes(' — ')){const parts=raw.split(' — ');artist=parts.shift();title=parts.join(' — ')}return{artist,title,duration}}).filter(Boolean);['A','B','C','D'].forEach(x=>{$(`tracks${x}`).innerHTML=''});$('sideC').classList.add('hidden');$('sideD').classList.add('hidden');state.doubleLP=false;const secs=tracks.map(t=>dur(t.duration)),grand=secs.reduce((a,b)=>a+b,0),half=grand/2;let run=0,split=tracks.length;for(let i=0;i<tracks.length-1;i++){run+=secs[i];if(run>=half){const prev=Math.abs((run-secs[i])-half),now=Math.abs(run-half);split=now<=prev?i+1:i;break}}if(tracks.length>1)split=Math.max(1,Math.min(tracks.length-1,split));tracks.forEach((t,i)=>{const side=i<split?'A':'B';addTrack(side);const row=$(`tracks${side}`).lastElementChild;row.querySelector('.tn').value=[t.artist,t.title].filter(Boolean).join(' — ');row.querySelector('.td').value=t.duration});$('doubleLPBox').classList.remove('show');$('doubleLPBox').innerHTML='';totals();if(tracks.length)enrichQobuz(tracks)}
'''
if 'function collapseDoubleLP()' not in s:
    s = s.replace('function doubleLPFit(tracks){', collapse + 'function doubleLPFit(tracks){', 1)

old_size = "all('#sizes .choice').forEach(b=>b.onclick=()=>{state.size=b.dataset.size;if(state.size==='12'&&state.qty>5){state.qty=5;$('qty').value=5}state.promo=false;clearValidation('validate1');recordUI()});"
new_size = "all('#sizes .choice').forEach(b=>b.onclick=()=>{collapseDoubleLP();state.size=b.dataset.size;if(state.size==='12'&&state.qty>5){state.qty=5;$('qty').value=5}state.promo=false;clearValidation('validate1');recordUI()});"
s = s.replace(old_size, new_size, 1)

s = s.replace("$('promoStart').onclick=()=>{state.mode='regular';", "$('promoStart').onclick=()=>{collapseDoubleLP();state.mode='regular';", 1)
s = s.replace("$('regularStart').onclick=()=>{state.mode='regular';", "$('regularStart').onclick=()=>{collapseDoubleLP();state.mode='regular';", 1)
s = s.replace("$('artistContinue').onclick=()=>{state.promo=false;", "$('artistContinue').onclick=()=>{collapseDoubleLP();state.promo=false;", 1)

p.write_text(s)
print('Final generated sandbox fixes applied')
