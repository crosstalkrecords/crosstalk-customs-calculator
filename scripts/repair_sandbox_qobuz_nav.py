from pathlib import Path
p=Path('easy-track-builder-sandbox.html');s=p.read_text()

# Validation/navigation safety.
s=s.replace("function showValidation(id,msg){const el=$(id);if(msg)el.textContent=msg;el.classList.add('show')}function clearValidation(id){$(id).classList.remove('show')}","function showValidation(id,msg){const el=$(id);if(!el)return;if(msg)el.textContent=msg;el.classList.add('show')}function clearValidation(id){const el=$(id);if(el)el.classList.remove('show')}")

# Styles: quiet source correction path + stronger but still native 2LP recommendation.
s=s.replace('.doublelp{display:none;margin-top:12px;padding:13px 14px;border:1px solid #d7e4ec;border-radius:10px;background:#f8fbfd;font-size:12px;line-height:1.5}', '.doublelp{display:none;margin-top:12px;padding:15px 16px;border:2px solid #bcd6e5;border-radius:11px;background:#eef7fc;font-size:12px;line-height:1.5}')
if '.qalt{' not in s:
    s=s.replace('.qsource a:hover{text-decoration:underline}', '.qsource a:hover{text-decoration:underline}.qalt{margin-left:5px;color:#777!important;font-weight:600!important;font-size:10px}.qsource details{display:inline;margin:0 0 0 4px}.qsource summary{display:inline;font-size:10px;color:#777;font-weight:600}.qsource details[open]{display:block;margin:3px 0 0}.qsource details[open] summary{display:inline}.qcandidates{padding-top:3px}.qcandidates a{display:block;margin:2px 0}')

# Replace renderer: choose best by default, alternatives are only a correction route.
start=s.find('function renderQ(row,result)')
end=s.find('async function enrichQobuz',start)
if start<0 or end<0: raise SystemExit('renderer not found')
renderer=r'''function renderQ(row,result){let box=row.querySelector('.qsource');if(!box){box=document.createElement('div');box.className='qsource';row.appendChild(box)}box.innerHTML='';if(!result||result.status==='none'||!result.best?.url)return;const best=result.best,alts=(result.candidates||[]).filter(x=>x.url&&x.url!==best.url).slice(0,3);box.innerHTML=`<a href="${esc(best.url)}" target="_blank" rel="noopener">Buy / download on Qobuz ↗</a>${alts.length?`<details><summary>Wrong version?</summary><div class="qcandidates">${alts.map(c=>`<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.title)} · ${esc(c.album||c.artist)} ↗</a>`).join('')}</div></details>`:''}`}
'''
s=s[:start]+renderer+s[end:]

# Make the 2LP copy read as the normal keep-your-playlist path.
old="box.innerHTML='<strong>This is a better fit for a 2×LP set.</strong><br>Keep more of the playlist and spread it across four sides. Sandbox bundle price: <strong>$225</strong>.<br><button type=\"button\" class=\"btn secondary\" id=\"chooseDoubleLP\">Try 2×LP</button>'"
new="box.innerHTML='<strong>Want to keep the whole playlist?</strong><br>This runtime is a natural fit for a <strong>2×LP set</strong> — we can spread it across four sides for <strong>$225</strong>.<br><button type=\"button\" class=\"btn\" id=\"chooseDoubleLP\">Make it a 2×LP</button>'"
if old in s:s=s.replace(old,new,1)

# Acknowledgement flash, if not already in live file.
if '.side.import-ack{' not in s:
    anchor='.side{background:#fff;border:1px solid #d7e4ec;border-radius:10px;padding:12px;margin-top:11px}'
    s=s.replace(anchor,anchor+'.side{transition:background-color .65s ease}.side.import-ack{background:var(--blue)}',1)
if 'function acknowledgeImport' not in s:
    anchor='function sideTotal(s){return all(`#tracks${s} .td`).reduce((n,i)=>n+dur(i.value),0)}'
    s=s.replace(anchor,"function acknowledgeImport(){const sides=activeSides().map(x=>$('side'+x)||$('tracks'+x)?.closest('.side')).filter(Boolean);sides.forEach(el=>el.classList.remove('import-ack'));requestAnimationFrame(()=>requestAnimationFrame(()=>{sides.forEach(el=>el.classList.add('import-ack'));setTimeout(()=>sides.forEach(el=>el.classList.remove('import-ack')),650)}))}\n"+anchor,1)

# Ensure import triggers acknowledgement + sourcing.
if 'doubleLPOffer(tracks,grand);enrichQobuz(tracks)' in s:
    s=s.replace('doubleLPOffer(tracks,grand);enrichQobuz(tracks)','doubleLPOffer(tracks,grand);acknowledgeImport();enrichQobuz(tracks)',1)
elif 'doubleLPOffer(tracks,grand)}catch(err)' in s:
    s=s.replace('doubleLPOffer(tracks,grand)}catch(err)','doubleLPOffer(tracks,grand);acknowledgeImport();enrichQobuz(tracks)}catch(err)',1)

p.write_text(s);print('Applied default-first Qobuz + foreground 2LP UX')
