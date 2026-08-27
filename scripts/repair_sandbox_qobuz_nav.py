from pathlib import Path
p=Path('easy-track-builder-sandbox.html');s=p.read_text()

# --- Put the 2xLP decision where the runtime problem is visible ---
# Remove the offer box from the playlist import helper and move it directly above the side cards.
s=s.replace('<div id="doubleLPBox" class="doublelp"></div>','',1)
marker='<div class="help"><div class="builderhead"><strong>Easy Track Builder</strong><div class="buildertools"><button type="button" id="clearTracks">Clear tracklist</button></div></div>'
if marker in s and '<div id="doubleLPBox" class="doublelp"></div>' not in s:
    s=s.replace(marker,marker+'<div id="doubleLPBox" class="doublelp"></div>',1)

# Make the persistent hint clearer that this is an actual available path.
s=s.replace('Long playlist? If it fits across four sides, we’ll offer a 2×LP automatically.','Long playlist? No problem — if it fits across four sides, we can turn it into a 2×LP without making you start again.')

# --- Mobile is essential ---
s=s.replace('<label>Mobile Number (optional)</label><input name="Custom Field 1">','<label>Mobile Number</label><input name="Custom Field 1" required>')

# --- Playlist/audio legal guidance ---
s=s.replace("A playlist is a handy starting point for planning your record. We'll still need the actual audio files before we can make it.","Playlists are used only as a planning guide — they are not legal download sources and we cannot cut from them. You must still supply the actual audio files yourself.")

old_audio='<div class="help"><strong>Your playlist gets us started — your audio files are what we actually cut.</strong><br>You\'ll need to upload files you\'ve legally purchased, music you\'ve made yourself, or audio you otherwise have permission to reproduce. Don\'t have them yet? No problem — we can point you to straightforward legal download options.</div>'
new_audio='<div class="help"><strong>Your playlist is only a guide — it does not supply the audio.</strong><br>Every audio file must be provided manually by you before we cut anything. Suitable sources can include files you have legally purchased, music you created yourself, audio you otherwise have permission to reproduce, or audio ripped from CDs you own where you are legally entitled to make and use that copy.<br><br>Our Qobuz links are simply a helping hand to locate possible legal downloads. Crosstalk does not purchase, download or transfer the music on your behalf.</div>'
if old_audio in s:s=s.replace(old_audio,new_audio,1)

s=s.replace('<div id="audioHelp" class="help hidden"><strong>Need downloadable copies?</strong><br>We recommend buying DRM-free downloadable audio from Qobuz where available. Purchased iTunes Store downloads can also be suitable.</div>', '<div id="audioHelp" class="help hidden"><strong>Need downloadable copies?</strong><br>We can help you find likely matches on Qobuz where available. You must purchase/download the files yourself and then upload them to Crosstalk. A playlist link by itself is never treated as supplied audio.</div>')

# --- 2xLP pricing: $225 base, with $60 printed artwork/packaging upgrade instead of the normal $40 ---
start=s.find('function productPrice(){')
end=s.find('function totalPrice(){',start)
if start<0 or end<0: raise SystemExit('productPrice function not found')
product=r'''function productPrice(){if(state.promo)return CONFIG.promo.price;if(!state.size)return 0;const c=CONFIG[state.mode];let t;if(state.doubleLP&&state.mode==='regular'&&state.size==='12'&&state.qty===1)t=225;else t=c.base[state.size].Double*state.qty;if(state.pack==='Custom Finish Pack')t+=c.up.custom;else{if(state.colour!=='Clear')t+=c.up.colour;if(state.pack==='Printed Jacket + Labels')t+=state.doubleLP&&state.mode==='regular'?60:c.up.printed}return t}'''
s=s[:start]+product+s[end:]

# Make the visible packaging option accurately describe the 2xLP artwork charge once selected.
if 'function updatePrintedPrice' not in s:
    anchor='function priceUI(){'
    helper="function updatePrintedPrice(){const el=$('printedP');if(el)el.textContent=state.doubleLP&&state.mode==='regular'?'+$60 · artwork/printing for both LPs':'+$'+CONFIG[state.mode].up.printed}\n"
    if anchor in s:s=s.replace(anchor,helper+anchor,1)
# Call it from priceUI before sync.
s=s.replace("['priceLabel1','priceLabel2','priceLabel3'].forEach(id=>$(id).textContent=state.promo?'Father\\'s Day Special':'Current estimate');sync()}","['priceLabel1','priceLabel2','priceLabel3'].forEach(id=>$(id).textContent=state.promo?'Father\\'s Day Special':'Current estimate');updatePrintedPrice();sync()}")

# --- 2xLP offer: precise runtime + stronger placement/copy ---
start=s.find('function doubleLPOffer(tracks,grand){')
end=s.find('function review(){',start)
if start<0 or end<0: raise SystemExit('doubleLPOffer not found')
new_func=r'''function doubleLPOffer(tracks,grand){const box=$('doubleLPBox'),one=dur(lim())*2,two=dur(lim())*4;box.classList.remove('show');box.innerHTML='';if(grand<=one)return;if(grand<=two){const over=grand-one,promoNote=state.promo?' This switches you out of the single-LP Father\'s Day Special.':'';box.innerHTML=`<strong>Your tracklist is ${fmt(grand)} — ${fmt(over)} over one LP.</strong><br><span>You can trim it down, or keep everything and spread it automatically across four sides.</span><br><button type="button" class="btn" id="chooseDoubleLP">Keep everything — make it a 2×LP for $225</button>${promoNote?`<div class="muted" style="margin-top:6px">${promoNote.trim()}</div>`:''}`;box.classList.add('show');$('chooseDoubleLP').onclick=()=>{state.promo=false;state.mode='regular';repartitionDoubleLP(tracks);renderBadges();updateModeScreens();priceUI()}}else{box.innerHTML=`<strong>Your tracklist is ${fmt(grand)}.</strong><br>Even a 2×LP can hold about ${fmt(two)} at this setup, so this one needs some trimming first. You can use <strong>Clear tracklist</strong> and start again, or remove the less-essential tracks.`;box.classList.add('show')}}
'''
s=s[:start]+new_func+s[end:]

# After converting to 2LP, keep the offer area as a reassuring confirmation rather than disappearing completely.
old="$('doubleLPBox').classList.remove('show');priceUI();totals()}"
new="$('doubleLPBox').innerHTML='<strong>2×LP selected.</strong><br>Your tracks have been redistributed across Sides A–D. Printed Jacket + Labels is +$60 for the two-LP artwork/printing package.';$('doubleLPBox').classList.add('show');priceUI();totals()}"
if old in s:s=s.replace(old,new,1)

# Ensure clearTracklist restores the explicit playlist warning copy.
s=s.replace("$('playlistMsg').textContent=\"A playlist is a handy starting point for planning your record. We'll still need the actual audio files before we can make it.\"","$('playlistMsg').textContent=\"Playlists are used only as a planning guide — they are not legal download sources and we cannot cut from them. You must still supply the actual audio files yourself.\"")

p.write_text(s)
print('Foregrounded 2xLP, required mobile, clarified source-audio rules, and added 2xLP artwork pricing')
