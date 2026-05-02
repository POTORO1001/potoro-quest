/* ===== 習得演出 ===== */
function showMagicLearnEffect(name){
  const el = document.createElement('div');
  el.className = 'magic-learn-effect';

  el.innerHTML = `
    <div class="magic-learn-card">
      <div class="magic-learn-title">NEW MAGIC!</div>
      <div class="magic-learn-name">${name}</div>
    </div>
  `;

  document.body.appendChild(el);

  if(typeof tone === 'function'){
    tone(659,.12,'triangle',.07,0);
    tone(784,.14,'triangle',.07,.12);
    tone(988,.24,'triangle',.08,.28);
  }

  setTimeout(() => {
    if(el && el.parentNode) el.remove();
  },1600);
}

/* ===== おまじない習得チェック ===== */
function checkMagicLearnOnLevelUp(){
  if(!state || !state.player) return;
  if(typeof getAllMagicConfigs !== 'function') return;

  const lv = state.player.lv;
  const all = getAllMagicConfigs();

  Object.keys(all).forEach(kind => {
    const config = all[kind];
    if(!config) return;

    if((config.requiredLv || 1) === lv){
      showMagicLearnEffect(config.name || kind);
    }
  });
}

/* ===== デバッグ確認 ===== */
function potoroMagicLearnEffectReport(){
  const report = {
    loaded:true,
    playerLv:state && state.player ? state.player.lv : null,
    canReadMagicConfig:typeof getAllMagicConfigs === 'function',
    magicConfigs:typeof getAllMagicConfigs === 'function' ? getAllMagicConfigs() : null
  };

  console.log('[PO・TORO QUEST magic learn effect]',report);
  return report;
}

console.log('[PO・TORO QUEST] magic-learn-effect.js fixed loaded');
