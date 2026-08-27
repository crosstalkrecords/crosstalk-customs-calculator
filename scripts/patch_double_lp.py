from pathlib import Path

p = Path('easy-track-builder-sandbox.html')
s = p.read_text()

# 1) Styles
old = '.add{border:0;border-radius:8px;background:#e8f0f5;padding:8px 11px;margin-top:9px;font-weight:700;cursor:pointer}.packgrid'
new = '.add{border:0;border-radius:8px;background:#e8f0f5;padding:8px 11px;margin-top:9px;font-weight:700;cursor:pointer}.doublelp{display:none;margin-top:12px;padding:13px 14px;border:1px solid #d7e4ec;border-radius:10px;background:#f8fbfd;font-size:12px;line-height:1.5}.doublelp.show{display:block}.doublelp strong{font-size:13px}.doublelp .btn{margin-top:9px;min-height:38px;padding:0 15px;font-size:12px}.packgrid'
if old not in s: raise SystemExit('style anchor missing')
s = s.replace(old, new, 1)

# 2) Add offer box under playlist message
old = '<div id="playlistMsg" class="muted" style="margin-top:7px">A playlist is a handy starting point for planning your record. We\'ll still need the actual audio files before we can make it.</div></div><div class="help"><strong>Easy Track Builder</strong>'
new = '<div id="playlistMsg" class="muted" style="margin-top:7px">A playlist is a handy starting point for planning your record. We\'ll still need the actual audio files before we can make it.</div><div id="doubleLPBox" class="doublelp"></div></div><div class="help"><strong>Easy Track Builder</strong>'
if old not in s: raise SystemExit('playlist box anchor missing')
s = s.replace(old, new, 1)

# 3) Add hidden sides C/D after Side B
old = '<div class="side" id="sideB"><div class="sidehead"><span>SIDE B</span><span class="total" id="totalB"></span></div><div class="bar"><div id="barB"></div></div><div id="tracksB"></div><button type="button" class="add" data-side="B">+ Add another track</button><div class="warn" id="warnB">Side B is over the maximum runtime.</div></div></div><details>'
new = '<div class="side" id="sideB"><div class="sidehead"><span>SIDE B</span><span class="total" id="totalB"></span></div><div class="bar"><div id="barB"></div></div><div id="tracksB"></div><button type="button" class="add" data-side="B">+ Add another track</button><div class="warn" id="warnB">Side B is over the maximum runtime.</div></div><div class="side hidden" id="sideC"><div class="sidehead"><span>SIDE C</span><span class="total" id="totalC"></span></div><div class="bar"><div id="barC"></div></div><div id="tracksC"></div><button type="button" class="add" data-side="C">+ Add another track</button><div class="warn" id="warnC">Side C is over the maximum runtime.</div></div><div class="side hidden" id="sideD"><div class="sidehead"><span>SIDE D</span><span class="total" id="totalD"></span></div><div class="bar"><div id="barD"></div></div><div id="tracksD"></div><button type="button" class="add" data-side="D">+ Add another track</button><div class="warn" id="warnD">Side D is over the maximum runtime.</div></div></div><details>'
if old not in s: raise SystemExit('side B anchor missing')
s = s.replace(old, new, 1)

# 4) Track numbering for C/D
old = '#tracksA .track::before{content:"A" counter(tracknum)}#tracksB .track::before{content:"B" counter(tracknum)}'
new = '#tracksA .track::before{content:"A" counter(tracknum)}#tracksB .track::before{content:"B" counter(tracknum)}#tracksC .track::before{content:"C" counter(tracknum)}#tracksD .track::before{content:"D" counter(tracknum)}'
if old not in s: raise SystemExit('counter anchor missing')
s = s.replace(old, new, 1)

# 5) State flag + bundle price
old = 'const state={step:0,mode:"regular",promo:false,size:null,sides:"Double",qty:1,rpm:null,colour:"Clear",pack:"Standard",audio:null,rush:false,shipping:false};'
new = 'const state={step:0,mode:"regular",promo:false,doubleLP:false,size:null,sides:"Double",qty:1,rpm:null,colour:"Clear",pack:"Standard",audio:null,rush:false,shipping:false};let lastImportedTracks=[];'
if old not in s: raise SystemExit('state anchor missing')
s = s.replace(old, new, 1)

old = 'function productPrice(){if(state.promo)return CONFIG.promo.price;if(!state.size)return 0;const c=CONFIG[state.mode];let t=c.base[state.size].Double*state.qty;'
new = 'function productPrice(){if(state.promo)return CONFIG.promo.price;if(!state.size)return 0;const c=CONFIG[state.mode];if(state.doubleLP&&state.mode===\'regular\'&&state.size===\'12\'&&state.qty===1)return 225;let t=c.base[state.size].Double*state.qty;'
if old not in s: raise SystemExit('price anchor missing')
s = s.replace(old, new, 1)

# 6) Sync sides label
old = "$('sidesValue').value='Double';"
new = "$('sidesValue').value=state.doubleLP?'4 sides (2xLP)':'Double';"
if old not in s: raise SystemExit('sync anchor missing')
s = s.replace(old, new, 1)

# 7) Totals and tracklist include C/D when active
old = "function sideTotal(s){return all(`#tracks${s} .td`).reduce((n,i)=>n+dur(i.value),0)}function totals(){if(!state.size||!state.rpm){['A','B'].forEach(s=>{$(`total${s}`).textContent='';$(`bar${s}`).style.width='0%'});sync();return}['A','B'].forEach(s=>{"
new = "function sideTotal(s){return all(`#tracks${s} .td`).reduce((n,i)=>n+dur(i.value),0)}function activeSides(){return state.doubleLP?['A','B','C','D']:['A','B']}function totals(){if(!state.size||!state.rpm){['A','B','C','D'].forEach(s=>{if($(`total${s}`))$(`total${s}`).textContent='';if($(`bar${s}`))$(`bar${s}`).style.width='0%'});sync();return}activeSides().forEach(s=>{"
if old not in s: raise SystemExit('totals anchor missing')
s = s.replace(old, new, 1)

old = "return [side('A'),side('B')].filter(Boolean).join('\\n\\n')}"
new = "return activeSides().map(side).filter(Boolean).join('\\n\\n')}"
if old not in s: raise SystemExit('tracklist anchor missing')
s = s.replace(old, new, 1)

# 8) Add 2xLP helpers before review()
anchor = 'function review(){sync();'
helper = r'''function repartitionDoubleLP(tracks){state.doubleLP=true;state.size='12';state.rpm='33 RPM';state.qty=1;['A','B','C','D'].forEach(s=>{$(`tracks${s}`).innerHTML=''});$('sideC').classList.remove('hidden');$('sideD').classList.remove('hidden');const per=dur(lim()),sides=['A','B','C','D'];let si=0,used=0;tracks.forEach(t=>{const sec=dur(String(t.duration||'').replace(/^0+/,''));if(si<3&&used>0&&used+sec>per){si++;used=0}addTrack(sides[si]);const row=$(`tracks${sides[si]}`).lastElementChild;row.querySelector('.tn').value=[t.artist,t.title].filter(Boolean).join(' — ');row.querySelector('.td').value=String(t.duration||'').replace(/^0+(?=\d+:)/,'');used+=sec});$('doubleLPBox').classList.remove('show');priceUI();totals()}
function doubleLPOffer(tracks,grand){const box=$('doubleLPBox'),one=dur(lim())*2,two=dur(lim())*4;box.classList.remove('show');box.innerHTML='';if(grand<=one)return;if(grand<=two&&state.mode==='regular'&&state.size==='12'&&state.qty===1){box.innerHTML='<strong>This is a better fit for a 2×LP set.</strong><br>Keep more of the playlist and spread it across four sides. Sandbox bundle price: <strong>$225</strong>.<br><button type="button" class="btn secondary" id="chooseDoubleLP">Try 2×LP</button>';box.classList.add('show');$('chooseDoubleLP').onclick=()=>repartitionDoubleLP(tracks)}else if(grand>two){box.innerHTML='<strong>This playlist is much longer than a vinyl set can hold.</strong><br>Even a 2×LP would still need substantial trimming. Pick the must-have tracks first and we’ll keep the runtime clear as you go.';box.classList.add('show')}}
'''
if anchor not in s: raise SystemExit('review anchor missing')
s = s.replace(anchor, helper + anchor, 1)

# 9) Import: clear C/D, disable previous 2LP, remember tracks, replace generic too-long message, trigger offer
old = "$('tracksA').innerHTML='';$('tracksB').innerHTML='';$('manual').value='';"
new = "$('tracksA').innerHTML='';$('tracksB').innerHTML='';$('tracksC').innerHTML='';$('tracksD').innerHTML='';$('sideC').classList.add('hidden');$('sideD').classList.add('hidden');state.doubleLP=false;lastImportedTracks=tracks;$('manual').value='';"
if old not in s: raise SystemExit('import clear anchor missing')
s = s.replace(old, new, 1)

old = "const provider=data.provider==='apple'?'Apple Music':'Spotify',tooLong=state.size&&state.rpm&&grand>dur(lim())*2;$('playlistMsg').innerHTML=`<strong>${tracks.length} tracks imported from ${provider}.</strong> We've split them roughly evenly across Side A and Side B.${tooLong?' <span style=\"color:#a52320;font-weight:800\">This playlist is longer than the selected record can hold, so trim tracks until both runtime bars fit.</span>':' You can move, remove or edit tracks from here.'}`"
new = "const provider=data.provider==='apple'?'Apple Music':'Spotify',tooLong=state.size&&state.rpm&&grand>dur(lim())*2;$('playlistMsg').innerHTML=`<strong>${tracks.length} tracks imported from ${provider}.</strong> We've split them roughly evenly across Side A and Side B.${tooLong?' <span style=\"color:#a52320;font-weight:800\">This is longer than one record can hold.</span>':' You can move, remove or edit tracks from here.'}`;if(state.size&&state.rpm)doubleLPOffer(tracks,grand)"
if old not in s: raise SystemExit('import message anchor missing')
s = s.replace(old, new, 1)

# 10) Review format should say 2xLP
old = "<div class=\"rline\"><span>Format</span><strong>${state.size}&quot; · ${state.rpm} · Double</strong></div>"
new = "<div class=\"rline\"><span>Format</span><strong>${state.doubleLP?'2×12&quot; · '+state.rpm+' · four sides':state.size+'&quot; · '+state.rpm+' · Double'}</strong></div>"
if old not in s: raise SystemExit('review format anchor missing')
s = s.replace(old, new, 1)

p.write_text(s)
print('Patched guided sandbox with conditional 2xLP flow')
