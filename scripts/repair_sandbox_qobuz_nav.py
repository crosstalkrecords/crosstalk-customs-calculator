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
    helpers=r'''function builderTracks(){const out=[];['A','B'].forEach(side=>all(`#tracks${side} .track`).forEach(r=>{const raw=r.querySelector('.tn').value.trim(),d=r.querySelector('.td').value.trim();if(!raw)return;let artist='',title=raw;if(raw.includes(' — ')){const parts=raw.split(' — ');artist=parts.shift();title=parts.join(' — ')}out.push({artist,title,duration:d})}));return out}\nfunction refreshDoubleLPOffer(){if(!state.size||!state.rpm||state.doubleLP)return;const tracks=builderTracks(),grand=tracks.reduce((n,t)=>n+dur(t.duration),0);doubleLPOffer(tracks,grand)}\n'''
    s=s.replace(anchor,helpers+anchor,1)

# 2LP offer: show even if the tracklist is TOO LONG for 2LP, with a useful switch-anyway option.
start=s.find('function doubleLPOffer(tracks,grand){');end=s.find('function review(){',start)
if start<0 or end<0: raise SystemExit('doubleLPOffer not found')
new_func=r'''function doubleLPOffer(tracks,grand){const box=$('doubleLPBox'),one=dur(lim())*2,two=dur(lim())*4;box.classList.remove('show');box.innerHTML='';if(!grand||grand<=one)return;const over=grand-one,promoNote=state.promo?' This switches you out of the single-LP Father\'s Day Special.':'';if(grand<=two){box.innerHTML=`<strong>Your tracklist is ${fmt(grand)} — ${fmt(over)} over one LP.</strong><br><span>You can trim it down, or keep everything and spread it automatically across four sides.</span><br><button type="button" class="btn" id="chooseDoubleLP">Keep everything — make it a 2×LP for $225</button>${promoNote?`<div class="muted" style="margin-top:6px">${promoNote.trim()}</div>`:''}`;box.classList.add('show');$('chooseDoubleLP').onclick=()=>{state.promo=false;state.mode='regular';repartitionDoubleLP(tracks);renderBadges();updateModeScreens();priceUI()}}else{const overTwo=grand-two;box.innerHTML=`<strong>Your tracklist is ${fmt(grand)} — too long for one LP, and ${fmt(overTwo)} over a 2×LP.</strong><br><span>A 2×LP still gets you much closer. Switch to four sides now, then trim the remaining runtime.</span><br><button type="button" class="btn" id="chooseDoubleLP">Switch to 2×LP — $225</button>`;box.classList.add('show');$('chooseDoubleLP').onclick=()=>{state.promo=false;state.mode='regular';repartitionDoubleLP(tracks);renderBadges();updateModeScreens();priceUI()}}}\n'''
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

# --- FINAL HARDENING PASS ---
# Authoritative production rule: 7-inch is 5:00/side at 45 RPM.
s=s.replace('"7":{"45 RPM":"3:45"}','"7":{"45 RPM":"5:00"}')

# Artist path: once the code unlocks, provide a real way forward without resetting to retail.
artist_target='<div id="artistMsg" class="muted"></div></div>'
if artist_target in s and 'id="artistContinue"' not in s:
    s=s.replace(artist_target,'<div id="artistMsg" class="muted"></div><button type="button" class="btn hidden" id="artistContinue" style="margin-top:10px">Continue with artist pricing</button></div>',1)
s=s.replace("$('artistMsg').innerHTML='<span style=\"color:#2f8f3a;font-weight:800\">Artist pricing unlocked ✓</span>';renderBadges();priceUI()}else $('artistMsg').textContent=$('artistCode').value?'That code hasn\\'t unlocked artist pricing yet.':'';",
            "$('artistMsg').innerHTML='<span style=\"color:#2f8f3a;font-weight:800\">Artist pricing unlocked ✓</span>';$('artistContinue').classList.remove('hidden');renderBadges();priceUI()}else{$('artistContinue').classList.add('hidden');$('artistMsg').textContent=$('artistCode').value?'That code hasn\\'t unlocked artist pricing yet.':''}};")
if "$('artistContinue').onclick" not in s:
    s=s.replace("all('[data-back]').forEach", "$('artistContinue').onclick=()=>{state.promo=false;state.size=null;state.rpm=null;go(1);recordUI()};all('[data-back]').forEach",1)

# Clamp quantity immediately when 12-inch is selected; don't wait for another quantity edit.
s=s.replace("state.size=b.dataset.size;state.promo=false;clearValidation('validate1');recordUI()",
            "state.size=b.dataset.size;if(state.size==='12'&&state.qty>5){state.qty=5;$('qty').value=5}state.promo=false;clearValidation('validate1');recordUI()")

# 2xLP is a 12-inch/33 RPM four-side product. Determine fit by actually packing indivisible tracks.
fit_helper=r'''function doubleLPFit(tracks){const per=18*60+30;let side=0,used=0;for(const t of tracks){const sec=dur(String(t.duration||''));if(sec>per)return false;if(used&&used+sec>per){side++;used=0}if(side>3)return false;used+=sec}return true}\n'''
if 'function doubleLPFit(' not in s:
    pos=s.find('function doubleLPOffer(tracks,grand){')
    s=s[:pos]+fit_helper+s[pos:]
start=s.find('function doubleLPOffer(tracks,grand){');end=s.find('function review(){',start)
new_double=r'''function doubleLPOffer(tracks,grand){const box=$('doubleLPBox'),one=37*60;box.classList.remove('show');box.innerHTML='';if(!grand||grand<=one)return;const fits=doubleLPFit(tracks),promoNote=state.promo?' This switches you out of the single-LP Father\'s Day Special.':'';if(state.qty!==1){box.innerHTML=`<strong>This tracklist needs more than one LP.</strong><br><span>2×LP online pricing is for one set only. For multiple 2×LP copies, contact us and we’ll quote the run for you.</span>`;box.classList.add('show');return}if(fits){box.innerHTML=`<strong>Your tracklist is ${fmt(grand)} — longer than one LP.</strong><br><span>It fits cleanly across four 18:30 sides, so you can keep everything without starting again.</span><br><button type="button" class="btn" id="chooseDoubleLP">Keep everything — make it a 2×LP for $225</button>${promoNote?`<div class="muted" style="margin-top:6px">${promoNote.trim()}</div>`:''}`;box.classList.add('show')}else{box.innerHTML=`<strong>Your tracklist is too long to fit cleanly across four 18:30 sides.</strong><br><span>A 2×LP still gets you much closer. Switch to four sides now, then trim anything that remains over.</span><br><button type="button" class="btn" id="chooseDoubleLP">Switch to 2×LP — $225</button>`;box.classList.add('show')}$('chooseDoubleLP').onclick=()=>{state.promo=false;state.mode='regular';repartitionDoubleLP(tracks);renderBadges();updateModeScreens();priceUI()}}\n'''
s=s[:start]+new_double+s[end:]

# Subtle mobile polish and a tiny bit of visual cohesion.
if '/* final-mobile-polish */' not in s:
    polish='''<style>/* final-mobile-polish */\n.shell{box-shadow:0 10px 34px rgba(0,0,0,.055)}\n.choice{transition:border-color .15s,background .15s,transform .15s,box-shadow .15s}.choice:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.04)}\n@media(max-width:560px){input,select,textarea{font-size:16px}.audio-grid{grid-template-columns:1fr!important}.qsource a,.qsource summary{display:inline-block;min-height:28px;padding:5px 0}.nav{position:sticky;bottom:0;background:linear-gradient(to bottom,rgba(255,255,255,0),#fff 28%);padding-top:18px;padding-bottom:4px;margin-top:18px}}\n</style>'''
    s=s.replace('</head>',polish+'</head>',1)
s=s.replace('<div class="choicegrid" style="grid-template-columns:1fr 1fr;margin-top:14px">','<div class="choicegrid audio-grid" style="grid-template-columns:1fr 1fr;margin-top:14px">')

p.write_text(s)
print('Final hardening applied: artist path, 2xLP rules/fit, quantity clamp, 7-inch timing and mobile polish')
