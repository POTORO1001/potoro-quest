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

  setTimeout(() => {
    if(el && el.parentNode) el.remove();
  }, 1600);
}

/* ===== レベルアップ時チェック ===== */
function checkMagicLearnOnLevelUp(){
  if(!state || !state.player) return;

  const lv = state.player.lv;

  Object.entries(POTORO_MAGIC_CONFIG.learnLevels).forEach(([key, needLv]) => {
    if(lv === needLv){
      const name = getMagicName(key);
      showMagicLearnEffect(name);
    }
  });
}

/* ===== おまじない名取得 ===== */
function getMagicName(kind){
  const names = {
    moe:'もえもえぎゅー',
    cook:'おいしくなーれ',
    aura:'キラキラオーラ',
    sleep:'おやすみなさい',
    flash:'チェキフラッシュ',
    charge2:'完璧なお給仕',
    multi:'ご奉仕連撃',
    charge:'萌えちゃーじ',
    rush:'ご帰宅ラッシュ',
    fullheal:'ひなたぼっこ',
    ultimate:'にしきぬやまー'
  };

  return names[kind] || kind;
}
