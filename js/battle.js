/* =========================
   ポトロクエスト battle.js（統合版）
   bugfix.js 吸収済み

   吸収内容：
   - 戦闘途中で動かなくなる問題の修正
   - 睡眠・混乱による行動スキップ後の操作復帰
   - failAction 後の操作復帰
   - state.busy / ボタン無効化の解除を一本化

   置き換え対象：
   js/battle.js

   削除対象：
   js/bugfix.js
========================= */

/* ===== Battle Unlock ===== */
function unlockBattleControls(){
  if(state.player && state.player.hp <= 0) return;

  state.enemyActedFirst = false;
  state.busy = false;
  setButtonsDisabled(false);

  if(typeof updateUI === 'function'){
    updateUI();
  }
}

/* ===== Player Status Check ===== */
async function playerStatusCheck(){
  const s = ensurePlayerStatus();

  if(s.sleep > 0){
    setMessage(`${state.player.name} は眠っている…`);
    s.sleep--;
    updateUI();

    await sleep(800);
    await enemyTurn();

    if(s.sleep <= 0){
      setMessage(`${state.player.name} は目を覚ました！`);
      updateUI();
      await sleep(650);
    }

    unlockBattleControls();
    return false;
  }

  if(s.confuse > 0){
    s.confuse--;

    if(Math.random() < 0.35){
      setMessage(`${state.player.name} は混乱して行動できなかった！`);
      updateUI();

      await sleep(800);
      await enemyTurn();

      if(s.confuse <= 0){
        setMessage(`${state.player.name} は気持ちを整えた！`);
        updateUI();
        await sleep(650);
      }

      unlockBattleControls();
      return false;
    }

    if(s.confuse <= 0){
      setMessage(`${state.player.name} は気持ちを整えた！`);
      updateUI();
      await sleep(650);
    }
  }

  if(s.defDown > 0){
    s.defDown--;
    if(s.defDown <= 0){
      setMessage(`${state.player.name} は身だしなみを整えた！ 防御が戻った！`);
      updateUI();
      await sleep(700);
    }
  }

  return true;
}

/* ===== Fail Action ===== */
async function failAction(message){
  if(typeof isMapMode === 'function' && isMapMode()){
    setMapMessage(message);
  }else{
    setMessage(message);
  }

  await sleep(700);
  unlockBattleControls();
}

/* ===== Player Action ===== */
async function playerAction(type){
  if(state.player.hp <= 0) return;
  if(state.busy) return;

  closeSubMenu();
  closeEquipMenu();

  state.busy = true;
  setButtonsDisabled(true);

  if(!(await playerStatusCheck())) return;
  if(await enemyFirstCheck()) return;
  if(typeof applyEquipmentTurnRecovery === 'function'){
    await applyEquipmentTurnRecovery();
  }

  const p = state.player;

  if(type === 'attack'){
    const target = currentEnemy();
    const criticalBonus = typeof equipmentChance === 'function' ? equipmentChance('criticalRateBonus') : 0;
    const isCritical = Math.random() < (0.10 + criticalBonus);
    const baseDamage = Math.max(1,totalAtk() + Math.floor(Math.random()*4));
    let damage = isCritical ? Math.floor(baseDamage*2.2) : baseDamage;
    if(typeof applyEquipmentOutgoingDamage === 'function'){
      damage = applyEquipmentOutgoingDamage(damage,target,{attack:true});
    }

    setMessage(`${p.name} のこうげき！`);
    await sleep(500);

    target.hp = Math.max(0,target.hp - damage);
    if(target.hp <= 0) state.lastDefeatedEnemy = target;

    if(isCritical){
      setMessage(`会心の癒し！ ${target.name} に ${damage} ダメージ！`);
      criticalFlash();
      showDamage(damage,'enemy','critical-text');
    }else{
      setMessage(`${target.name} に ${damage} ダメージ！`);
      showDamage(damage,'enemy');
    }

    seAttack();
    enemyFlash();
    updateUI();

    await sleep(isCritical ? 950 : 700);

    if(target.hp > 0 && typeof equipmentChance === 'function' && Math.random() < equipmentChance('multiHitChance')){
      const followDamage = Math.max(1,Math.floor(totalAtk() * 0.55));
      const finalFollowDamage = typeof applyEquipmentOutgoingDamage === 'function'
        ? applyEquipmentOutgoingDamage(followDamage,target,{attack:true})
        : followDamage;
      target.hp = Math.max(0,target.hp - finalFollowDamage);
      if(target.hp <= 0) state.lastDefeatedEnemy = target;
      setMessage(`装備効果！ ${target.name} に ${finalFollowDamage} 追加ダメージ！`);
      showDamage(finalFollowDamage,'enemy');
      seAttack();
      enemyFlash();
      updateUI();
      await sleep(700);
    }

    if(target.hp > 0 && typeof equipmentChance === 'function' && Math.random() < equipmentChance('stunChance')){
      target.sleepTurns = Math.max(target.sleepTurns || 0,1);
      setMessage(`装備効果！ ${target.name} はひるんだ！`);
      seMagic();
      screenFlash();
      updateUI();
      await sleep(650);
    }

    if(target.hp > 0 && typeof equipmentChance === 'function' && Math.random() < equipmentChance('defDownChance')){
      target.equipmentDefDownTurns = Math.max(target.equipmentDefDownTurns || 0,2);
      setMessage(`装備効果！ ${target.name} の守りがゆるんだ！`);
      seMagic();
      screenFlash();
      updateUI();
      await sleep(650);
    }

    if(allEnemiesDefeated()){
      await winBattle();
      return;
    }

    if(typeof shouldTriggerEquipmentExtraAction === 'function' && shouldTriggerEquipmentExtraAction()){
      await announceEquipmentExtraAction();
      unlockBattleControls();
      return;
    }

    if(!state.enemyActedFirst) await enemyTurn();
  }

  else if(type === 'guard'){
    p.guarding = true;
    setMessage(`${p.name} は みをまもった！`);

    await sleep(650);

    if(typeof shouldTriggerEquipmentExtraAction === 'function' && shouldTriggerEquipmentExtraAction()){
      await announceEquipmentExtraAction();
      unlockBattleControls();
      return;
    }

    if(!state.enemyActedFirst) await enemyTurn();
  }

  unlockBattleControls();
}

/* ===== Damage Helpers ===== */
async function damageEnemy(message,damage,playSe){
  const target = currentEnemy();

  if(typeof applyEquipmentOutgoingDamage === 'function'){
    damage = applyEquipmentOutgoingDamage(damage,target,{magic:true});
  }

  target.hp = Math.max(0,target.hp - damage);
  if(target.hp <= 0) state.lastDefeatedEnemy = target;

  setMessage(`${message} ${target.name} に ${damage} ダメージ！`);
  showDamage(damage,'enemy');
  if(typeof playSe === 'function') playSe();
  else seMagic();
  enemyFlash();
  updateUI();

  await sleep(750);

  if(allEnemiesDefeated()){
    await winBattle();
    return;
  }

  if(typeof shouldTriggerEquipmentExtraAction === 'function' && shouldTriggerEquipmentExtraAction()){
    await announceEquipmentExtraAction();
    return;
  }

  if(!state.enemyActedFirst) await enemyTurn();
}

async function damageAllEnemies(message,baseDamage){
  let defeated = null;

  aliveEnemies().forEach(enemy => {
    let damage = enemy.boss ? Math.floor(baseDamage*0.8) : baseDamage;
    if(typeof applyEquipmentOutgoingDamage === 'function'){
      damage = applyEquipmentOutgoingDamage(damage,enemy,{magic:true});
    }
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

  if(typeof shouldTriggerEquipmentExtraAction === 'function' && shouldTriggerEquipmentExtraAction()){
    await announceEquipmentExtraAction();
    return;
  }

  if(!state.enemyActedFirst) await enemyTurn();
}

/* ===== Enemy Turn ===== */
async function enemyTurn(){
  const p = state.player;
  ensurePlayerStatus();

  const attackers = aliveEnemies();
  if(!attackers.length) return;

  for(const e of attackers){
    if(e.sleepTurns && e.sleepTurns > 0){
      e.sleepTurns--;
      setMessage(`${e.name} は眠っている…`);
      updateUI();
      await sleep(700);
      if(e.sleepTurns <= 0){
        setMessage(`${e.name} は目を覚ました！`);
        updateUI();
        await sleep(650);
      }
      continue;
    }

    if(e.equipmentDefDownTurns && e.equipmentDefDownTurns > 0){
      e.equipmentDefDownTurns--;
      if(e.equipmentDefDownTurns <= 0){
        setMessage(`${e.name} は体勢を立て直した！`);
        updateUI();
        await sleep(650);
      }
    }

    if(await enemySpecialAction(e)){
      updateUI();
      await sleep(850);

      if(allEnemiesDefeated()){
        await winBattle();
        return;
      }

      if(p.hp <= 0){
        setMessage(`${p.name} は たおれてしまった…`);
        await sleep(900);
        showGameOver();
        return;
      }

      continue;
    }

    await enemyBasicAttack(e);

    if(p.hp <= 0){
      setMessage(`${p.name} は たおれてしまった…`);
      await sleep(900);
      showGameOver();
      return;
    }
  }

  p.guarding = false;
}

/* ===== Enemy Basic Attack ===== */
async function announceEnemyAttack(e){
  setMessage(`${e.name} の攻撃！`);
  updateUI();
  await sleep(520);
}

async function enemyBasicAttack(e, options){
  const p = state.player;
  const opts = options || {};

  let damage = Math.max(1,e.atk - effectiveDef() + Math.floor(Math.random()*3));
  const isCritical = Math.random() < 0.08;

  if(isCritical) damage = Math.floor(damage*2);
  if(p.guarding) damage = Math.max(1,Math.floor(damage/2));
  if(typeof applyEquipmentDamageCut === 'function'){
    damage = applyEquipmentDamageCut(damage);
  }

  if(!opts.skipIntro){
    await announceEnemyAttack(e);
  }

  p.hp = Math.max(0,p.hp - damage);

  setMessage(
    isCritical
      ? `会心の一撃！ ${p.name} に ${damage} ダメージ！`
      : `${p.name} に ${damage} ダメージ！`
  );

  showDamage(damage,'player',isCritical ? 'enemy-critical-text' : null);

  if(isCritical) criticalFlash();

  seHit();
  playerFlash();
  updateUI();

  await sleep(isCritical ? 1050 : 850);
}

/* ===== Enemy Special Action Placeholder =====
   enemy.js 側で上書きされます。
========================= */
async function enemySpecialAction(e){
  return false;
}

/* ===== Reward Placeholder =====
   drop.js 側で上書きされます。
========================= */
function giveReward(enemyId){
  return false;
}

function treasureDrop(enemyId){
  return false;
}

/* ===== Game Over ===== */
function showGameOver(){
  state.busy = true;
  state.inBattle = false;
  setButtonsDisabled(true);
  stopAllBgm();

  const overlay = document.getElementById('gameOverOverlay');
  if(overlay) overlay.classList.remove('hidden');
}

function restartFromGameOver(){
  const overlay = document.getElementById('gameOverOverlay');
  if(overlay) overlay.classList.add('hidden');

  document.getElementById('battleScreen').classList.add('hidden');
  document.getElementById('mapScreen').classList.add('hidden');
  document.getElementById('endingScreen').classList.add('hidden');
  document.getElementById('openingScreen').classList.add('hidden');
  document.getElementById('titleScreen').classList.remove('hidden');

  state.player = makePlayer();
  state.enemy = null;
  state.enemiesInBattle = [];
  state.targetIndex = 0;
  state.lastDefeatedEnemy = null;
  state.busy = false;
  state.started = false;
  state.inBattle = false;
  state.floor = 1;
  state.stairs = null;
  state.maze = [];
  state.chests = [];

  setButtonsDisabled(false);
  playBgm('bgmOpening');
}

/* ===== Win Battle ===== */
async function winBattle(){
  const p = state.player;
  const defeatedEnemies = state.enemiesInBattle && state.enemiesInBattle.length
    ? state.enemiesInBattle
    : [currentEnemy()];

  const dropTarget = state.lastDefeatedEnemy || defeatedEnemies[defeatedEnemies.length-1];
  const baseExp = defeatedEnemies.reduce((sum,e) => sum + (e.exp || 0),0);
  const totalExp = typeof applyEquipmentExpBonus === 'function'
    ? applyEquipmentExpBonus(baseExp)
    : baseExp;
  const hasBoss = defeatedEnemies.some(e => e.boss);

  victoryEffect();
  seVictory();

  setMessage(`ご主人様たちを いやした！ EXP ${totalExp} 獲得！`);

  p.exp += totalExp;
  updateUI();

  await sleep(1000);

  while(p.exp >= p.nextExp){
    p.exp -= p.nextExp;
    p.lv++;
    p.nextExp = Math.floor(p.nextExp*1.5);

    p.maxHp += 6;
    p.maxMp += 3;
    p.baseAtk += 2;
    p.baseDef += 1;
    p.baseSpd += 1;
    p.baseTalk += 2;
    p.hp = p.maxHp;
    p.mp = p.maxMp;

    const learnedMagicName = typeof checkMagicLearnOnLevelUp === 'function'
      ? checkMagicLearnOnLevelUp()
      : null;

    seLevelUp();
    if(!learnedMagicName){
      showLevelToast(`LEVEL UP！ Lv.${p.lv}`);
    }
    setMessage(`${p.name} は レベル ${p.lv} に あがった！`);
    updateUI();

    if(learnedMagicName && typeof potoroFlushMagicLearnNotices === 'function'){
      await potoroFlushMagicLearnNotices();
    }else{
      await sleep(1200);
    }
  }

  if(typeof potoroFlushMagicLearnNotices === 'function'){
    await potoroFlushMagicLearnNotices();
  }

  if(hasBoss){
    await showEnding();
    return;
  }

  if(dropTarget && giveReward(dropTarget.id)){
    updateUI();
    await sleep(1300);
  }

  if(dropTarget && treasureDrop(dropTarget.id)){
    updateUI();
    await sleep(1200);
  }

  endBattleToMap();
}
