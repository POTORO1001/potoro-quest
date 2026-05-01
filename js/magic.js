/* =========================
   ポトロクエスト magic.js（STEP18）
   おまじない完全設定参照版

   読み込み順：
   1. js/game.js
   2. js/core.js
   3. js/data.js
   4. js/assets.js
   5. js/loading.js
   6. js/audio.js
   7. js/ui.js
   8. js/opening.js
   9. js/ending.js
   10. js/scene.js
   11. js/battle.js
   12. js/enemy.js
   13. js/equipment.js
   14. js/item.js
   15. js/map.js
   16. js/balance.js
   17. js/event.js
   18. js/magic-config.js
   19. js/magic-config-bridge.js
   20. js/magic.js
   21. js/compatibility.js

   重要：
   - このファイルは STEP1 の magic.js と差し替え用です。
   - magic-config.js の POTORO_MAGIC_CONFIG を参照して動きます。
========================= */

/* ===== バフ状態管理 ===== */
if(!window.buffState){
  window.buffState = {
    aura: 0,
    charge: 0
  };
}

/* ===== Magic Config Fallback ===== */
function requireMagicConfig(kind){
  const config = typeof getMagicConfig === 'function'
    ? getMagicConfig(kind)
    : null;

  if(!config){
    console.warn(`[PO・TORO QUEST] magic config not found: ${kind}`);
  }

  return config;
}

/* ===== バフターン経過 ===== */
function tickBuffs(){
  if(buffState.aura > 0) buffState.aura--;
}

/* ===== ステータス補正：キラキラオーラ ===== */
const _potoroMagicTotalSpd = totalSpd;
totalSpd = function(){
  let base = _potoroMagicTotalSpd();

  const aura = requireMagicConfig('aura');
  if(buffState.aura > 0 && aura){
    base += aura.spdBonus || 0;
  }

  return base;
};

const _potoroMagicTotalTalk = totalTalk;
totalTalk = function(){
  let base = _potoroMagicTotalTalk();

  const aura = requireMagicConfig('aura');
  if(buffState.aura > 0 && aura){
    base += aura.talkBonus || 0;
  }

  return base;
};

/* ===== おまじないメニュー ===== */
const _potoroMagicOpenSubMenu = openSubMenu;

openSubMenu = function(kind){
  _potoroMagicOpenSubMenu(kind);

  if(kind !== 'magic') return;

  const body = document.getElementById('subMenuBody');
  const title = document.getElementById('subMenuTitle');

  if(!body) return;

  if(title) title.textContent = 'おまじない';

  // 既存おまじないは game.js 側の表示を尊重しつつ、追加おまじないを設定から追加
  addConfiguredMagicButton('aura');
  addConfiguredMagicButton('charge2');
  addConfiguredMagicButton('multi');
  addConfiguredMagicButton('rush');
  addConfiguredMagicButton('fullheal');
};

function addConfiguredMagicButton(kind){
  const config = requireMagicConfig(kind);
  if(!config) return;

  addSubButton(config.label || config.name || kind, () => useMagic(kind));
}

/* ===== MP消費共通 ===== */
async function payMagicCost(kind){
  const config = requireMagicConfig(kind);

  if(!config){
    await failAction('そのおまじないは使えません！');
    return false;
  }

  const mp = config.mp || 0;

  if(state.player.mp < mp){
    await failAction('MPがたりない！');
    return false;
  }

  state.player.mp -= mp;
  return true;
}

/* ===== チャージ倍率適用 ===== */
function applyChargeIfNeeded(damage){
  const charge = requireMagicConfig('charge2');

  if(buffState.charge > 0 && charge){
    const multiplier = charge.multiplier || 2.5;
    buffState.charge = 0;
    return Math.floor(damage * multiplier);
  }

  return damage;
}

/* ===== useMagic 完全設定参照版 ===== */
const _potoroOriginalUseMagic = useMagic;

useMagic = async function(kind){
  if(state.player.hp <= 0) return;
  if(state.busy) return;

  closeSubMenu();
  closeEquipMenu();

  state.busy = true;
  setButtonsDisabled(true);

  if(!(await playerStatusCheck())) return;
  if(await enemyFirstCheck()) return;

  if(kind === 'aura'){
    await useMagicAura();
  }

  else if(kind === 'charge2'){
    await useMagicCharge2();
  }

  else if(kind === 'multi'){
    await useMagicMulti();
  }

  else if(kind === 'rush'){
    await useMagicRush();
  }

  else if(kind === 'fullheal'){
    await useMagicFullHeal();
  }

  else if(kind === 'moe'){
    await useMagicMoeConfigured();
  }

  else if(kind === 'heal'){
    await useMagicHealConfigured();
  }

  else if(kind === 'sleep'){
    await useMagicSleepConfigured();
  }

  else if(kind === 'nishiki'){
    await useMagicNishikiConfigured();
  }

  else if(kind === 'shower'){
    await useMagicShowerConfigured();
  }

  else if(kind === 'charge'){
    await useMagicMpChargeConfigured();
  }

  else{
    // 未対応の場合だけ旧処理へフォールバック
    state.busy = false;
    setButtonsDisabled(false);
    return _potoroOriginalUseMagic(kind);
  }

  state.enemyActedFirst = false;
  state.busy = false;
  setButtonsDisabled(false);
  updateUI();
};

/* ===== 追加：キラキラオーラ ===== */
async function useMagicAura(){
  const config = requireMagicConfig('aura');
  if(!config) return failAction('そのおまじないは使えません！');
  if(!(await payMagicCost('aura'))) return;

  buffState.aura = config.turns || 2;

  await showCutin('おまじない','キラキラオーラ☆');
  setMessage(`トーク力とすばやさが ${buffState.aura}ターン アップ！`);

  seMagic();
  updateUI();

  await sleep(700);
  if(!state.enemyActedFirst) await enemyTurn();
}

/* ===== 追加：完璧なお給仕 ===== */
async function useMagicCharge2(){
  if(!(await payMagicCost('charge2'))) return;

  buffState.charge = 1;

  await showCutin('おまじない','完璧なお給仕♡');
  setMessage('次の攻撃・おまじないダメージが強化された！');

  seMagic();
  updateUI();

  await sleep(700);
  if(!state.enemyActedFirst) await enemyTurn();
}

/* ===== 追加：ご奉仕連撃 ===== */
async function useMagicMulti(){
  const config = requireMagicConfig('multi');
  if(!config) return failAction('そのおまじないは使えません！');
  if(!(await payMagicCost('multi'))) return;

  await showCutin('おまじない','ご奉仕連撃！');

  const minHits = config.minHits || 2;
  const maxHits = config.maxHits || 3;
  const atkRate = config.atkRate || 0.6;

  const hits = minHits + Math.floor(Math.random() * (maxHits - minHits + 1));
  let totalDamage = 0;

  for(let i=0;i<hits;i++){
    const target = currentEnemy();
    if(!target || target.hp <= 0) break;

    let damage = Math.max(1,Math.floor(totalAtk() * atkRate));
    damage = applyChargeIfNeeded(damage);

    target.hp = Math.max(0,target.hp - damage);
    totalDamage += damage;

    if(target.hp <= 0) state.lastDefeatedEnemy = target;

    showDamage(damage,'enemy');
    seAttack();
    enemyFlash();
    updateUI();

    await sleep(260);

    if(allEnemiesDefeated()) break;
  }

  setMessage(`ご奉仕連撃！ ${hits}回攻撃で合計${totalDamage}ダメージ！`);
  updateUI();

  await sleep(550);

  if(allEnemiesDefeated()){
    await winBattle();
    return;
  }

  if(!state.enemyActedFirst) await enemyTurn();
}

/* ===== 追加：ご帰宅ラッシュ ===== */
async function useMagicRush(){
  const config = requireMagicConfig('rush');
  if(!config) return failAction('そのおまじないは使えません！');
  if(!(await payMagicCost('rush'))) return;

  await showCutin('必殺おまじない','ご帰宅ラッシュ！！');

  const target = currentEnemy();
  let damage = magicPower(config.base || 60);
  damage = applyChargeIfNeeded(damage);

  target.hp = Math.max(0,target.hp - damage);
  if(target.hp <= 0) state.lastDefeatedEnemy = target;

  let message = `ご帰宅ラッシュ！！ ${target.name} に ${damage} ダメージ！`;

  if(Math.random() < (config.confuseRate || 0)){
    // 現行敵側には混乱状態がないため、疑似的に睡眠ターンで行動阻害します。
    target.sleepTurns = Math.max(target.sleepTurns || 0, config.confuseTurns || 1);
    message += ' さらに、相手は混乱した！';
  }

  setMessage(message);

  showDamage(damage,'enemy','critical-text');
  seMagic();
  screenFlash();
  enemyFlash();
  updateUI();

  await sleep(900);

  if(allEnemiesDefeated()){
    await winBattle();
    return;
  }

  if(!state.enemyActedFirst) await enemyTurn();
}

/* ===== 追加：ひなたぼっこ ===== */
async function useMagicFullHeal(){
  if(!(await payMagicCost('fullheal'))) return;

  const p = state.player;
  const before = p.hp;

  await showCutin('回復おまじない','ひなたぼっこ…☀');

  p.hp = p.maxHp;

  const s = ensurePlayerStatus();
  s.sleep = 0;
  s.confuse = 0;
  s.defDown = 0;

  const heal = p.hp - before;

  setMessage('ひなたぼっこ…☀ HP全回復！状態異常も解除！');

  showDamage(-heal,'player');
  seHeal();
  updateUI();

  await sleep(800);

  if(!state.enemyActedFirst) await enemyTurn();
}

/* ===== 既存：もえもえぎゅー 設定参照版 ===== */
async function useMagicMoeConfigured(){
  const config = requireMagicConfig('moe');
  if(!config) return _potoroOriginalUseMagic('moe');
  if(!(await payMagicCost('moe'))) return;

  await showCutin('おまじない','もえもえぎゅー！！');

  let damage;

  if(typeof calcConfiguredMoeDamage === 'function'){
    damage = calcConfiguredMoeDamage();
  }else{
    const min = config.baseDamageMin || 25;
    const max = config.baseDamageMax || 30;
    const base = min + Math.floor(Math.random() * (max - min + 1));
    const talkBonus = Math.max(0,Math.floor((totalTalk() - 7) * (config.talkScale || 1.2)));
    damage = base + talkBonus;
  }

  damage = applyChargeIfNeeded(damage);

  await damageEnemy('もえもえぎゅー！！',damage);
}

/* ===== 既存：おいしくなーれ 設定参照版 ===== */
async function useMagicHealConfigured(){
  const config = requireMagicConfig('heal');
  if(!config) return _potoroOriginalUseMagic('heal');
  if(!(await payMagicCost('heal'))) return;

  await showCutin('おまじない','おいしくなーれ！');

  const p = state.player;
  const heal = Math.min(config.heal || 35,p.maxHp - p.hp);

  p.hp += heal;

  setMessage(`おいしくなーれ！ HPが ${heal} 回復！`);
  showDamage(-heal,'player');
  seHeal();
  updateUI();

  await sleep(750);
  if(!state.enemyActedFirst) await enemyTurn();
}

/* ===== 既存：おやすみなさい 設定参照版 ===== */
async function useMagicSleepConfigured(){
  const config = requireMagicConfig('sleep');
  if(!config) return _potoroOriginalUseMagic('sleep');
  if(!(await payMagicCost('sleep'))) return;

  const target = currentEnemy();
  const min = config.minTurns || 1;
  const max = config.maxTurns || 3;
  const turns = min + Math.floor(Math.random() * (max - min + 1));

  target.sleepTurns = turns;

  await showCutin('おまじない','おやすみなさい…');

  setMessage(`${target.name} は ${turns}ターン 眠った！`);

  seMagic();
  updateUI();

  await sleep(800);
  if(!state.enemyActedFirst) await enemyTurn();
}

/* ===== 既存：にしきぬやまー 設定参照版 ===== */
async function useMagicNishikiConfigured(){
  const config = requireMagicConfig('nishiki');
  if(!config) return _potoroOriginalUseMagic('nishiki');
  if(!(await payMagicCost('nishiki'))) return;

  await showCutin('必殺おまじない','にしきぬやまー！！');

  screenFlash();

  const target = currentEnemy();
  const base = target.boss ? (config.bossBase || 50) : (config.normalBase || 75);

  let damage = magicPower(base);
  damage = applyChargeIfNeeded(damage);

  await damageEnemy('にしきぬやまー！！',damage);
}

/* ===== 既存：チェキフラッシュ 設定参照版 ===== */
async function useMagicShowerConfigured(){
  const config = requireMagicConfig('shower');
  if(!config) return _potoroOriginalUseMagic('shower');
  if(!(await payMagicCost('shower'))) return;

  await showCutin('全体おまじない','チェキフラッシュ！！');

  screenFlash();

  let baseDamage = magicPower(config.base || 32);
  baseDamage = applyChargeIfNeeded(baseDamage);

  await damageAllEnemiesConfigured('チェキフラッシュ！！',baseDamage,config.bossRate || 0.8);
}

async function damageAllEnemiesConfigured(message,baseDamage,bossRate){
  let defeated = null;

  aliveEnemies().forEach(enemy => {
    const damage = enemy.boss ? Math.floor(baseDamage * bossRate) : baseDamage;
    enemy.hp = Math.max(0,enemy.hp - damage);

    if(enemy.hp <= 0) defeated = enemy;
  });

  if(defeated) state.lastDefeatedEnemy = defeated;

  setMessage(`${message} 敵全体にダメージ！`);

  showDamage(baseDamage,'enemy','critical-text');
  seMagic();
  enemyFlash();
  updateUI();

  await sleep(900);

  if(allEnemiesDefeated()){
    await winBattle();
    return;
  }

  if(!state.enemyActedFirst) await enemyTurn();
}

/* ===== 既存：萌えちゃーじ 設定参照版 ===== */
async function useMagicMpChargeConfigured(){
  const config = requireMagicConfig('charge');
  if(!config) return _potoroOriginalUseMagic('charge');

  const p = state.player;

  // MP0想定だが、設定でMPコストを持たせることも可能
  if(!(await payMagicCost('charge'))) return;

  await showCutin('補助おまじない','萌えちゃーじ！');

  const gain = Math.min(config.mpRecover || 20,p.maxMp - p.mp);
  p.mp += gain;

  setMessage(`MPが ${gain} 回復した！`);

  seHeal();
  updateUI();

  await sleep(700);

  if(!state.enemyActedFirst) await enemyTurn();
}

/* ===== enemyTurn 拡張：バフターン経過 ===== */
const _potoroMagicEnemyTurn = enemyTurn;

enemyTurn = async function(){
  tickBuffs();
  await _potoroMagicEnemyTurn();
};

/* ===== Magic Debug ===== */
function potoroMagicState(){
  const stateReport = {
    buffState:JSON.parse(JSON.stringify(buffState)),
    configs:typeof getAllMagicConfigs === 'function'
      ? getAllMagicConfigs()
      : null
  };

  console.log('[PO・TORO QUEST magic state]',stateReport);
  return stateReport;
}
