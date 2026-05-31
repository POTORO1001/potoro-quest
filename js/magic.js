/* =========================
   ポトロクエスト magic.js（改良版）
   レベル習得対応 + magic-config参照版

   変更点：
   - おまじないメニューは習得済みのみ表示
   - 未習得のおまじないは使えない
   - レベルアップ後に自然にメニューへ追加
========================= */

if(!window.buffState){
  window.buffState = {
    aura: 0,
    charge: 0
  };
}

function requireMagicConfig(kind){
  const config = typeof getMagicConfig === 'function'
    ? getMagicConfig(kind)
    : null;

  if(!config){
    console.warn(`[PO・TORO QUEST] magic config not found: ${kind}`);
  }

  return config;
}

function playOmajinaiSe(){
  if(typeof seOmajinai === 'function') seOmajinai();
  else if(typeof seMagic === 'function') seMagic();
}

function randomAliveEnemy(){
  const targets = typeof aliveEnemies === 'function'
    ? aliveEnemies()
    : (state.enemiesInBattle || []).filter(enemy => enemy.hp > 0);

  if(targets.length){
    return targets[Math.floor(Math.random() * targets.length)];
  }

  return currentEnemy();
}

function tickBuffs(){
  if(buffState.aura > 0) buffState.aura--;
}

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

/* ===== おまじないメニュー：習得済みのみ表示 ===== */
const _potoroMagicOpenSubMenu = openSubMenu;

openSubMenu = function(kind){
  if(kind !== 'magic'){
    _potoroMagicOpenSubMenu(kind);
    return;
  }

  const sub = document.getElementById('subMenu');
  const title = document.getElementById('subMenuTitle');
  const body = document.getElementById('subMenuBody');

  if(!sub || !title || !body) return;

  title.textContent = 'おまじない';
  body.innerHTML = '';

  const order = [
    'moe',
    'aura',
    'heal',
    'sleep',
    'charge2',
    'shower',
    'charge',
    'multi',
    'rush',
    'nishiki',
    'fullheal'
  ];

  let count = 0;

  order.forEach(kind => {
    if(typeof isMagicLearned === 'function' && !isMagicLearned(kind)) return;

    const config = requireMagicConfig(kind);
    if(!config) return;

    addSubButton(config.label || config.name || kind, () => useMagic(kind));
    count++;
  });

  if(count === 0){
    const empty = document.createElement('div');
    empty.className = 'equip-empty';
    empty.textContent = 'まだ使えるおまじないがありません。';
    body.appendChild(empty);
  }

  const nextList = typeof getNextMagicLearnList === 'function'
    ? getNextMagicLearnList()
    : [];

  if(nextList.length){
    const next = nextList[0];
    const note = document.createElement('div');
    note.className = 'equip-current';
    note.innerHTML = `次の習得：Lv.${next.requiredLv} ${next.name}`;
    body.appendChild(note);
  }

  sub.classList.remove('hidden');
};

function addConfiguredMagicButton(kind){
  const config = requireMagicConfig(kind);
  if(!config) return;
  addSubButton(config.label || config.name || kind, () => useMagic(kind));
}

async function payMagicCost(kind){
  const config = requireMagicConfig(kind);

  if(!config){
    await failAction('そのおまじないは使えません！');
    return false;
  }

  if(typeof isMagicLearned === 'function' && !isMagicLearned(kind)){
    await failAction(`${config.name || 'そのおまじない'}はまだ覚えていません！`);
    return false;
  }

  const mp = typeof equipmentAdjustedMagicCost === 'function'
    ? equipmentAdjustedMagicCost(config.mp || 0)
    : (config.mp || 0);

  if(state.player.mp < mp){
    await failAction('TPがたりない！');
    return false;
  }

  state.player.mp -= mp;
  return true;
}

function applyChargeIfNeeded(damage){
  const charge = requireMagicConfig('charge2');

  if(buffState.charge > 0 && charge){
    const multiplier = charge.multiplier || 2.5;
    buffState.charge = 0;
    return Math.floor(damage * multiplier);
  }

  return damage;
}

const _potoroOriginalUseMagic = useMagic;

useMagic = async function(kind){
  if(state.player.hp <= 0) return;
  if(state.busy) return;

  const config = requireMagicConfig(kind);
  if(config && typeof isMagicLearned === 'function' && !isMagicLearned(kind)){
    await failAction(`${config.name}はまだ覚えていません！`);
    return;
  }

  closeSubMenu();
  closeEquipMenu();

  state.busy = true;
  setButtonsDisabled(true);

  if(!(await playerStatusCheck())) return;
  if(await enemyFirstCheck()) return;
  if(typeof applyEquipmentTurnRecovery === 'function'){
    await applyEquipmentTurnRecovery();
  }

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
    state.busy = false;
    setButtonsDisabled(false);
    return _potoroOriginalUseMagic(kind);
  }

  state.enemyActedFirst = false;
  state.busy = false;
  setButtonsDisabled(false);
  updateUI();
};

async function useMagicAura(){
  const config = requireMagicConfig('aura');
  if(!config) return failAction('そのおまじないは使えません！');
  if(!(await payMagicCost('aura'))) return;

  buffState.aura = typeof applyEquipmentBuffTurns === 'function'
    ? applyEquipmentBuffTurns(config.turns || 2)
    : (config.turns || 2);

  await showCutin('おまじない','キラキラオーラ☆');
  setMessage(`トーク力とすばやさが ${buffState.aura}ターン アップ！`);

  playOmajinaiSe();
  updateUI();

  await sleep(700);
  if(!state.enemyActedFirst) await enemyTurn();
}

async function useMagicCharge2(){
  if(!(await payMagicCost('charge2'))) return;

  buffState.charge = typeof applyEquipmentBuffTurns === 'function'
    ? applyEquipmentBuffTurns(1)
    : 1;

  await showCutin('おまじない','完璧なお給仕♡');
  setMessage('次の攻撃・おまじないダメージが強化された！');

  playOmajinaiSe();
  updateUI();

  await sleep(700);
  if(!state.enemyActedFirst) await enemyTurn();
}

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
    const target = randomAliveEnemy();
    if(!target || target.hp <= 0) break;

    let damage = Math.max(1,Math.floor(totalAtk() * atkRate));
    damage = applyChargeIfNeeded(damage);

    target.hp = Math.max(0,target.hp - damage);
    totalDamage += damage;

    if(target.hp <= 0) state.lastDefeatedEnemy = target;

    showDamage(damage,'enemy');
    playOmajinaiSe();
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
    target.sleepTurns = Math.max(target.sleepTurns || 0, config.confuseTurns || 1);
    message += ' さらに、相手は混乱した！';
  }

  setMessage(message);

  showDamage(damage,'enemy','critical-text');
  playOmajinaiSe();
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

  await damageEnemy('もえもえぎゅー！！',damage,playOmajinaiSe);
}

async function useMagicHealConfigured(){
  const config = requireMagicConfig('heal');
  if(!config) return _potoroOriginalUseMagic('heal');
  if(!(await payMagicCost('heal'))) return;

  await showCutin('おまじない','おいしくなーれ！');

  const p = state.player;
  const healRate = typeof equipmentEffectValue === 'function' ? equipmentEffectValue('healRate') : 0;
  const healBase = Math.floor((config.heal || 35) * (1 + healRate));
  const heal = Math.min(healBase,p.maxHp - p.hp);

  p.hp += heal;

  setMessage(`おいしくなーれ！ HPが ${heal} 回復！`);
  showDamage(-heal,'player');
  seHeal();
  updateUI();

  await sleep(750);
  if(!state.enemyActedFirst) await enemyTurn();
}

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

  setMessage(`${target.name} は 眠った！`);

  playOmajinaiSe();
  updateUI();

  await sleep(800);
  if(!state.enemyActedFirst) await enemyTurn();
}

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

  await damageEnemy('にしきぬやまー！！',damage,playOmajinaiSe);
}

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
  playOmajinaiSe();
  enemyFlash();
  updateUI();

  await sleep(900);

  if(allEnemiesDefeated()){
    await winBattle();
    return;
  }

  if(!state.enemyActedFirst) await enemyTurn();
}

async function useMagicMpChargeConfigured(){
  const config = requireMagicConfig('charge');
  if(!config) return _potoroOriginalUseMagic('charge');

  const p = state.player;

  if(!(await payMagicCost('charge'))) return;

  await showCutin('補助おまじない','萌えちゃーじ！');

  const gain = Math.min(config.mpRecover || 20,p.maxMp - p.mp);
  p.mp += gain;

  setMessage(`TPが ${gain} 回復した！`);

  seHeal();
  updateUI();

  await sleep(700);

  if(!state.enemyActedFirst) await enemyTurn();
}

const _potoroMagicEnemyTurn = enemyTurn;

enemyTurn = async function(){
  tickBuffs();
  await _potoroMagicEnemyTurn();
};

function potoroMagicState(){
  const stateReport = {
    lv:state.player.lv,
    learned:typeof getLearnedMagicConfigs === 'function' ? getLearnedMagicConfigs() : null,
    next:typeof getNextMagicLearnList === 'function' ? getNextMagicLearnList() : null,
    buffState:JSON.parse(JSON.stringify(buffState)),
    configs:typeof getAllMagicConfigs === 'function' ? getAllMagicConfigs() : null
  };

  console.log('[PO・TORO QUEST magic state]',stateReport);
  return stateReport;
}
