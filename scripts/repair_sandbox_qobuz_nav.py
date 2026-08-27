from pathlib import Path

p=Path('easy-track-builder-sandbox.html')
s=p.read_text()

# Make validation helper safe for steps without a validation box.
s=s.replace("function showValidation(id,msg){const el=$(id);if(msg)el.textContent=msg;el.classList.add('show')}function clearValidation(id){$(id).classList.remove('show')}",
            "function showValidation(id,msg){const el=$(id);if(!el)return;if(msg)el.textContent=msg;el.classList.add('show')}function clearValidation(id){const el=$(id);if(el)el.classList.remove('show')}")

# Add quiet Qobuz styling if not already present.
anchor='.doublelp .btn{margin-top:9px;min-height:38px;padding:0 15px;font-size:12px}.packgrid'
if '.qsource{' not in s:
    repl='.doublelp .btn{margin-top:9px;min-height:38px;padding:0 15px;font-size:12px}.qsource{grid-column:2/-1;min-height:0;margin:-2px 0 2px;font-size:10.5px;line-height:1.35;color:#777}.qsource a{color:#3f6d8b;font-weight:800;text-decoration:none}.qsource a:hover{text-decoration:underline}.qsource details{margin:0}.qsource summary{font-size:10.5px;color:#666}.qcandidates a{display:block;margin:3px 0}.packgrid'
    if anchor not in s: raise SystemExit('qobuz css anchor missing')
    s=s.replace(anchor,repl,1)

# Add row matching/render helpers before sideTotal.
func_anchor='function sideTotal(s){return all(`#tracks${s} .td`).reduce((n,i)=>n+dur(i.value),0)}'
if 'function enrichQobuz' not in s:
    qfunc=r'''function qRows(){return [...all('#tracksA .track'),...all('#tracksB .track'),...all('#tracksC .track'),...all('#tracksD .track')]}
function esc(v){return String(v||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function renderQ(row,result){let box=row.querySelector('.qsource');if(!box){box=document.createElement('div');box.className='qsource';row.appendChild(box)}box.innerHTML='';if(!result||result.status==='none')return;if(result.status==='high'&&result.best?.url){box.innerHTML=`Available on Qobuz · <a href="${esc(result.best.url)}" target="_blank" rel="noopener">Buy / download ↗</a>`;return}const cs=(result.candidates||[]).filter(x=>x.url).slice(0,3);if(cs.length){box.innerHTML=`<details><summary>Check Qobuz versions</summary><div class="qcandidates">${cs.map(c=>`<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.title)} · ${esc(c.album||c.artist)} ↗</a>`).join('')}</div></details>`}}
async function enrichQobuz(tracks){const rows=qRows().slice(0,tracks.length);if(!tracks.length||!rows.length)return;for(let start=0;start<tracks.length;start+=25){const batch=tracks.slice(start,start+25),batchRows=rows.slice(start,start+25);try{const res=await fetch('https://crosstalk-playlist-importer.vercel.app/api/qobuz',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tracks:batch.map(t=>({title:t.title||'',artist:t.artist||'',duration:t.duration||''}))})});const data=await res.json();if(!res.ok||!data.ok)continue;(data.results||[]).forEach((r,i)=>batchRows[i]&&renderQ(batchRows[i],r))}catch(_){/* sourcing is optional; never block the builder */}}}
'''
    if func_anchor not in s: raise SystemExit('qobuz function anchor missing')
    s=s.replace(func_anchor,qfunc+func_anchor,1)

# Trigger Qobuz enrichment after every successful playlist import.
needle="if(state.size&&state.rpm)doubleLPOffer(tracks,grand)}catch(err)"
if needle in s and 'doubleLPOffer(tracks,grand);enrichQobuz(tracks)' not in s:
    s=s.replace(needle,"if(state.size&&state.rpm)doubleLPOffer(tracks,grand);enrichQobuz(tracks)}catch(err)",1)

# Replace navigation wiring with a defensive version.
old="all('[data-back]').forEach(b=>b.onclick=()=>go(+b.dataset.back));all('[data-next]').forEach(b=>b.onclick=()=>{const from=state.step;if(canAdvance(from)){clearValidation('validate'+from);go(+b.dataset.next)}});"
new="all('[data-back]').forEach(b=>b.onclick=()=>go(+b.dataset.back));all('[data-next]').forEach(b=>b.onclick=()=>{const from=state.step;if(!canAdvance(from))return;clearValidation('validate'+from);go(+b.dataset.next)});"
if old in s:s=s.replace(old,new,1)

p.write_text(s)
print('sandbox repair applied')
