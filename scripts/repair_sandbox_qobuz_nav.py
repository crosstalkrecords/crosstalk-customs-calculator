from pathlib import Path
p=Path('easy-track-builder-sandbox.html');s=p.read_text()

# --- Put the 2xLP decision where the runtime problem is visible ---
s=s.replace('<div id="doubleLPBox" class="doublelp"></div>','',1)
marker='<div class="help"><div class="builderhead"><strong>Easy Track Builder</strong><div class="buildertools"><button type="button" id="clearTracks">Clear tracklist</button></div></div>'
if marker in s and '<div id="doubleLPBox" class="doublelp"></div>' not in s:
    s=s.replace(marker,marker+'<div id="doubleLPBox" class="doublelp"></div>',1)
s=s.replace('Long playlist? If it fits across four sides, we’ll offer a 2×LP automatically.','Long playlist? No problem — if it fits across four sides, we can turn it into a 2×LP without making you start again.')

# --- Runtime guidance: playlist times help plan the record, supplied files decide the final fit ---
runtime_note='<div id="runtimeGuide" class="muted" style="margin-top:8px"><strong>Track times are a guide.</strong> Final running time is confirmed from your supplied audio files.</div><p class="muted" style="margin:8px 0 0">Durations are based on the playlist versions we can identify. Your final audio files may be slightly different — for example, a different edit, remaster or version. <strong>The files you supply are what ultimately determine whether your record fits.</strong> If they run over the available time, we’ll contact you before cutting anything.</p>'
if 'id="runtimeGuide"' not in s:
    target=marker+'<div id="doubleLPBox" class="doublelp"></div>'
    if target in s:
        s=s.replace(target,marker+runtime_note+'<div id="doubleLPBox" class="doublelp"></div>',1)

# --- Mobile is essential ---
s=s.replace('<label>Mobile Number (optional)</label><input name="Custom Field 1">','<label>Mobile Number</label><input name="Custom Field 1" required>')

# --- Playlist/audio legal guidance ---
s=s.replace("A playlist is a handy starting point for planning your record. We'll still need the actual audio files before we can make it.","Playlists are used only as a planning guide — they are not legal download sources and we cannot cut from them. You must still supply the actual audio files yourself.")
old_audio='<div class="help"><strong>Your playlist gets us started — your audio files are what we actually cut.</strong><br>You\'ll need to upload files you\'ve legally purchased, music you\'ve made yourself, or audio you otherwise have permission to reproduce. Don\'t have them yet? No problem — we can point you to straightforward legal download options.</div>'
new_audio='<div class="help"><strong>Your playlist is only a guide — it does not supply the audio.</strong><br>Every audio file must be provided manually by you before we cut anything. Suitable sources can include files you have legally purchased, music you created yourself, audio you otherwise have permission to reproduce, or audio ripped from CDs you own where you are legally entitled to make and use that copy.<br><br>Our Qobuz links are simply a helping hand to locate possible legal downloads. Crosstalk does not purchase, download or transfer the music on your behalf.</div>'
updated_audio='<div class="help"><strong>Your playlist is only a guide — it does not supply the audio.</strong><br>Every audio file must be provided manually by you before we cut anything. Suitable sources can include files you have legally purchased, music you created yourself, audio you otherwise have permission to reproduce, or audio ripped from CDs you own where you are legally entitled to make and use that copy.<br><br><strong>Your supplied files are the final word on running time.</strong> Playlist durations are used to help plan your record, but we’ll check the actual audio before cutting. If anything no longer fits, we’ll get in touch.<br><br>Our Qobuz links are simply a helping hand to locate possible legal downloads. Crosstalk does not purchase, download or transfer the music on your behalf.</div>'
if old_audio in s:s=s.replace(old_audio,updated_audio,1)
elif new_audio in s:s=s.replace(new_audio,updated_audio,1)
s=s.replace('<div id="audioHelp" class="help hidden"><strong>Need downloadable copies?</strong><br>We recommend buying DRM-free downloadable audio from Qobuz where available. Purchased iTunes Store downloads can also be suitable.</div>', '<div id="audioHelp" class="help hidden"><strong>Need downloadable copies?</strong><br>We can help you find likely matches on Qobuz where available. You must purchase/download the files yourself and then upload them to Crosstalk. A playlist link by itself is never treated as supplied audio.</div>')

# --- 2xLP pricing ---
start=s.find('function productPrice(){');end=s.find('function totalPrice(){',start)
if start<0 or end<0: raise SystemExit('productPrice function not found')
product=r'''function productPrice(){if(state.promo)return CONFIG.promo.price;if(!state.size)return 0;const c=CONFIG[state.mode];let t;if(state.doubleLP&&state.mode==='regular'&&state.size==='12'&&state.qty===1)t=225;else t=c.base[state.size].Double*state.qty;if(state.pack==='Custom Finish Pack')t+=c.up.custom;else{if(state.colour!=='Clear')t+=c.up.colour;if(state.pack==='Printed Jacket + Labels')t+=state.doubleLP&&state.mode==='regular'?60:c.up.printed}return t}'''
s=s[:start]+product+s[end:]
if 'function updatePrintedPrice' not in s:
    anchor='function priceUI(){';helper="function updatePrintedPrice(){const el=$('printedP');if(el)el.textContent=state.doubleLP&&state.mode==='regular'?'+$60 · artwork/printing for both LPs':'+$'+CONFIG[state.mode].up.printed}\n"
    if anchor in s:s=s.replace(anchor,helper+anchor,1)
s=s.replace("['priceLabel1','priceLabel2','priceLabel3'].forEach(id=>$(id).textContent=state.promo?'Father\\'s Day Special':'Current estimate');sync()}","['priceLabel1','priceLabel2','priceLabel3'].forEach(id=>$(id).textContent=state.promo?'Father\\'s Day Special':'Current estimate');updatePrintedPrice();sync()}")

# Helpers to derive live builder runtime/tracks, so 2LP isn't tied only to playlist import.
anchor='function sideTotal(s){return all(`#tracks${s} .td`).reduce((n,i)=>n+dur(i.value),0)}'
if 'function builderTracks()' not in s:
    helpers=r'''function builderTracks(){const out=[];['A','B'].forEach(side=>all(`#tracks${side} .track`).forEach(r=>{const raw=r.querySelector('.tn').value.trim(),d=r.querySelector('.td').value.trim();if(!raw)return;let artist='',title=raw;if(raw.includes(' — ')){const parts=raw.split(' — ');artist=parts.shift();title=parts.join(' — ')}out.push({artist,title,duration:d})}));return out}
function refreshDoubleLPOffer(){if(!state.size||!state.rpm||state.doubleLP)return;const tracks=builderTracks(),grand=tracks.reduce((n,t)=>n+dur(t.duration),0);doubleLPOffer(tracks,grand)}
'''
    s=s.replace(anchor,helpers+anchor,1)

# 2LP offer: show even if the tracklist is TOO LONG for 2LP, with a useful switch-anyway option.
start=s.find('function doubleLPOffer(tracks,grand){');end=s.find('function review(){',start)
if start<0 or end<0: raise SystemExit('doubleLPOffer not found')
new_func=r'''function doubleLPOffer(tracks,grand){const box=$('doubleLPBox'),one=dur(lim())*2,two=dur(lim())*4;box.classList.remove('show');box.innerHTML='';if(!grand||grand<=one)return;const over=grand-one,promoNote=state.promo?' This switches you out of the single-LP Father\'s Day Special.':'';if(grand<=two){box.innerHTML=`<strong>Your tracklist is ${fmt(grand)} — ${fmt(over)} over one LP.</strong><br><span>You can trim it down, or keep everything and spread it automatically across four sides.</span><br><button type="button" class="btn" id="chooseDoubleLP">Keep everything — make it a 2×LP for $225</button>${promoNote?`<div class="muted" style="margin-top:6px">${promoNote.trim()}</div>`:''}`;box.classList.add('show');$('chooseDoubleLP').onclick=()=>{state.promo=false;state.mode='regular';repartitionDoubleLP(tracks);renderBadges();updateModeScreens();priceUI()}}else{const overTwo=grand-two;box.innerHTML=`<strong>Your tracklist is ${fmt(grand)} — too long for one LP, and ${fmt(overTwo)} over a 2×LP.</strong><br><span>A 2×LP still gets you much closer. Switch to four sides now, then trim the remaining runtime.</span><br><button type="button" class="btn" id="chooseDoubleLP">Switch to 2×LP — $225</button>`;box.classList.add('show');$('chooseDoubleLP').onclick=()=>{state.promo=false;state.mode='regular';repartitionDoubleLP(tracks);renderBadges();updateModeScreens();priceUI()}}}
'''
s=s[:start]+new_func+s[end:]

# After converting to 2LP, show confirmation and re-run Qobuz against the rebuilt A-D rows.
current="$('doubleLPBox').innerHTML='<strong>2×LP selected.</strong><br>Your tracks have been redistributed across Sides A–D. Printed Jacket + Labels is +$60 for the two-LP artwork/printing package.';$('doubleLPBox').classList.add('show');priceUI();totals()}"
patched="$('doubleLPBox').innerHTML='<strong>2×LP selected.</strong><br>Your tracks have been redistributed across Sides A–D. Printed Jacket + Labels is +$60 for the two-LP artwork/printing package.';$('doubleLPBox').classList.add('show');priceUI();totals();enrichQobuz(tracks)}"
if current in s:s=s.replace(current,patched,1)

# Make live edits/removals/additions update the 2LP prompt automatically.
s=s.replace("r.querySelectorAll('input').forEach(i=>i.oninput=()=>{clearValidation('validate2');totals()})","r.querySelectorAll('input').forEach(i=>i.oninput=()=>{clearValidation('validate2');totals();refreshDoubleLPOffer()})")
s=s.replace("r.querySelector('.remove').onclick=()=>{r.remove();totals()}","r.querySelector('.remove').onclick=()=>{r.remove();totals();refreshDoubleLPOffer()}")

# Playlist import still triggers immediately.
if 'doubleLPOffer(tracks,grand);acknowledgeImport();enrichQobuz(tracks)' not in s and 'doubleLPOffer(tracks,grand);enrichQobuz(tracks)' in s:
    s=s.replace('doubleLPOffer(tracks,grand);enrichQobuz(tracks)','doubleLPOffer(tracks,grand);acknowledgeImport();enrichQobuz(tracks)',1)

# Clear Tracklist resets copy.
s=s.replace("$('playlistMsg').textContent=\"A playlist is a handy starting point for planning your record. We'll still need the actual audio files before we can make it.\"","$('playlistMsg').textContent=\"Playlists are used only as a planning guide — they are not legal download sources and we cannot cut from them. You must still supply the actual audio files yourself.\"")

p.write_text(s)
print('Preserved 2xLP/Qobuz fixes and added clear runtime guidance for supplied audio')
