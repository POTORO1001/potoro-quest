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

      unlockBattleControls();
      return false;
    }
  }

  if(s.defDown > 0){
    s.defDown--;
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

  const p = state.player;

  if(type === 'attack'){
    const target = currentEnemy();
    const isCritical = Math.random() < 0.10;
    const baseDamage = Math.max(1,totalAtk() + Math.floor(Math.random()*4));
    const damage = isCritical ? Math.floor(baseDamage*2.2) : baseDamage;

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

    if(allEnemiesDefeated()){
      await winBattle();
      return;
    }

    if(!state.enemyActedFirst) await enemyTurn();
  }

  else if(type === 'guard'){
    p.guarding = true;
    setMessage(`${p.name} は みをまもった！`);

    await sleep(650);

    if(!state.enemyActedFirst) await enemyTurn();
  }

  unlockBattleControls();
}

/* ===== Damage Helpers ===== */
async function damageEnemy(message,damage,playSe){
  const target = currentEnemy();

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

  if(!state.enemyActedFirst) await enemyTurn();
}

async function damageAllEnemies(message,baseDamage){
  let defeated = null;

  aliveEnemies().forEach(enemy => {
    const damage = enemy.boss ? Math.floor(baseDamage*0.8) : baseDamage;
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
      continue;
    }

    if(await enemySpecialAction(e)){
      updateUI();
      await sleep(850);

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
async function enemyBasicAttack(e){
  const p = state.player;

  let damage = Math.max(1,e.atk - effectiveDef() + Math.floor(Math.random()*3));
  const isCritical = Math.random() < 0.08;

  if(isCritical) damage = Math.floor(damage*2);
  if(p.guarding) damage = Math.max(1,Math.floor(damage/2));

  p.hp = Math.max(0,p.hp - damage);

  setMessage(
    isCritical
      ? `${e.name} の会心の一撃！ ${damage} ダメージ！`
      : `${e.name} のこうげき！ ${damage} ダメージ！`
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
  const totalExp = defeatedEnemies.reduce((sum,e) => sum + (e.exp || 0),0);
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

    seLevelUp();
    showLevelToast(`LEVEL UP！ Lv.${p.lv}`);
    setMessage(`${p.name} は レベル ${p.lv} に あがった！`);

    updateUI();

   checkMagicLearnOnLevelUp();
     
    await sleep(1200);
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
