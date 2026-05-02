const POTORO_TREASURE_EFFECTS = { enabled:true, sound:true };

function playTreasureRaritySound(rarity){
  if(!POTORO_TREASURE_EFFECTS.enabled || !POTORO_TREASURE_EFFECTS.sound) return;
  if(typeof tone !== 'function') return;
  if(rarity === 'S'){
    tone(523,.12,'triangle',.08,0); tone(659,.12,'triangle',.08,.12); tone(784,.18,'triangle',.08,.24); tone(1046,.32,'triangle',.09,.42);
  }else if(rarity === 'A'){
    tone(440,.12,'triangle',.07,0); tone(554,.16,'triangle',.07,.16); tone(659,.22,'triangle',.07,.32);
  }else if(rarity === 'B'){
    tone(392,.12,'triangle',.06,0); tone(523,.18,'triangle',.06,.16);
  }else{
    tone(330,.12,'triangle',.05,0);
  }
}

function showTreasureRarityEffect(rarity,name){
  if(!POTORO_TREASURE_EFFECTS.enabled) return;
  const effect = document.createElement('div');
  effect.className = `treasure-rarity-effect rarity-${String(rarity).toLowerCase()}`;
  effect.innerHTML = `
    <div class="treasure-rarity-card">
      <div class="treasure-rarity-label">${rarity} RARE</div>
      <div class="treasure-rarity-name">${name}</div>
    </div>`;
  document.body.appendChild(effect);
  playTreasureRaritySound(rarity);
  setTimeout(() => { if(effect && effect.parentNode) effect.remove(); }, rarity === 'S' ? 1900 : 1400);
}

function toggleTreasureEffects(){
  POTORO_TREASURE_EFFECTS.enabled = !POTORO_TREASURE_EFFECTS.enabled;
  return POTORO_TREASURE_EFFECTS.enabled;
}
function potoroTreasureEffectsReport(){
  console.log('[PO・TORO QUEST treasure effects]',POTORO_TREASURE_EFFECTS);
  return POTORO_TREASURE_EFFECTS;
}
