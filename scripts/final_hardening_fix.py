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

p.write_text(s)
print('Final generated sandbox fixes applied')
