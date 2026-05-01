/* =========================
   ポトロクエスト battle.js（STEP2）
   戦闘ロジック分離ファイル

   読み込み順：
   1. js/game.js
   2. js/battle.js
   3. js/magic.js
========================= */

/* ===== Player Battle Status Check ===== */
async function playerStatusCheck(){
  const s=ensurePlayerStatus();

  if(s.sleep>0){
    setMessage(`${state.player.name} は眠っている…`);
    s.sleep--;
    updateUI();
    await sleep(800);
    await enemyTurn();
    return false;
  }

  if(s.confuse>0){
    s.confuse--;
    if(Math.random()<0.35){
      setMessage(`${state.player.name} は混乱して行動できなかった！`);
      updateUI();
      await sleep(800);
      await enemyTurn();
      return false;
    }
  }

  if(s.defDown>0) s.defDown--;
  return true;
}

/* ===== Player Action ===== */
async function playerAction(type){
  if(state.player.hp<=0) return;
  if(state.busy) return;

  closeSubMenu();
  closeEquipMenu();

  state.busy=true;
  setButtonsDisabled(true);

  if(!(await playerStatusCheck())) return;
  if(await enemyFirstCheck()) return;

  const p=state.player;

  if(type==='attack'){
    const target=currentEnemy();
    const isCritical=Math.random()<0.10;
    const baseDamage=Math.max(1,totalAtk()+Math.floor(Math.random()*4));
    const damage=isCritical ? Math.floor(baseDamage*2.2) : baseDamage;

    target.hp=Math.max(0,target.hp-damage);
    if(target.hp<=0) state.lastDefeatedEnemy=target;

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

    await sleep(isCritical?950:700);

    if(allEnemiesDefeated()){
      await winBattle();
      return;
    }

    if(!state.enemyActedFirst) await enemyTurn();
  }

  else if(type==='guard'){
    p.guarding=true;
    setMessage(`${p.name} は みをまもった！`);
    await sleep(650);
    if(!state.enemyActedFirst) await enemyTurn();
  }

  state.enemyActedFirst=false;
  state.busy=false;
  setButtonsDisabled(false);
  updateUI();
}

/* ===== Battle Item ===== */
async function useItem(kind){
  if(state.player.hp<=0 && !isMapMode()) return;
  if(state.busy) return;

  closeSubMenu();
  closeEquipMenu();

  state.busy=true;
  setButtonsDisabled(true);

  if(!isMapMode() && !(await playerStatusCheck())) return;
  if(!isMapMode() && await enemyFirstCheck()) return;

  const p=state.player;
  const e=currentEnemy();

  if(kind==='omurice'){
    if(p.items.omurice<=0||p.hp>=p.maxHp){
      await failAction('オムライスは使えない！');
      return;
    }

    p.items.omurice--;
    const heal=Math.min(30,p.maxHp-p.hp);
    p.hp+=heal;

    setMessage(`オムライスを食べた！ HPが ${heal} 回復！`);
    showDamage(-heal,'player');
    seHeal();
    updateUI();

    await sleep(750);
    if(!isMapMode() && !state.enemyActedFirst) await enemyTurn();
  }

  else if(kind==='tea'){
    if(p.items.tea<=0||p.mp>=p.maxMp){
      await failAction('紅茶は使えない！');
      return;
    }

    p.items.tea--;
    const healMp=Math.min(10,p.maxMp-p.mp);
    p.mp+=healMp;

    setMessage(`紅茶を飲んだ！ MPが ${healMp} 回復！`);
    seHeal();
    updateUI();

    await sleep(750);
    if(!isMapMode() && !state.enemyActedFirst) await enemyTurn();
  }

  else if(kind==='horse'){
    if(isMapMode()){
      await failAction('くろれきしは戦闘中のみ使えます！');
      return;
    }

    if(p.items.horse<=0){
      await failAction('くろれきしは持っていない！');
      return;
    }

    p.items.horse--;
    const damage=e.boss?55:999;
    await damageEnemy('くろれきしを召喚した！',damage);
  }

  state.enemyActedFirst=false;
  state.busy=false;
  setButtonsDisabled(false);
  updateUI();
}

/* ===== Fail Action ===== */
async function failAction(message){
  if(isMapMode()) setMapMessage(message);
  else setMessage(message);

  await sleep(700);

  state.enemyActedFirst=false;
  state.busy=false;
  setButtonsDisabled(false);
  updateUI();
}

/* ===== Damage Helpers ===== */
async function damageEnemy(message,damage){
  const target=currentEnemy();

  target.hp=Math.max(0,target.hp-damage);
  if(target.hp<=0) state.lastDefeatedEnemy=target;

  setMessage(`${message} ${target.name} に ${damage} ダメージ！`);
  showDamage(damage,'enemy');
  seMagic();
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
  let defeated=null;

  aliveEnemies().forEach(enemy=>{
    const damage=enemy.boss ? Math.floor(baseDamage*0.8) : baseDamage;
    enemy.hp=Math.max(0,enemy.hp-damage);
    if(enemy.hp<=0) defeated=enemy;
  });

  if(defeated) state.lastDefeatedEnemy=defeated;

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

/* ===== Game Over ===== */
function showGameOver(){
  state.busy=true;
  state.inBattle=false;
  setButtonsDisabled(true);
  stopAllBgm();

  const overlay=document.getElementById('gameOverOverlay');
  if(overlay) overlay.classList.remove('hidden');
}

function restartFromGameOver(){
  const overlay=document.getElementById('gameOverOverlay');
  if(overlay) overlay.classList.add('hidden');

  document.getElementById('battleScreen').classList.add('hidden');
  document.getElementById('mapScreen').classList.add('hidden');
  document.getElementById('endingScreen').classList.add('hidden');
  document.getElementById('openingScreen').classList.add('hidden');
  document.getElementById('titleScreen').classList.remove('hidden');

  state.player=makePlayer();
  state.enemy=null;
  state.enemiesInBattle=[];
  state.targetIndex=0;
  state.lastDefeatedEnemy=null;
  state.busy=false;
  state.started=false;
  state.inBattle=false;
  state.floor=1;
  state.stairs=null;
  state.maze=[];
  state.chests=[];

  setButtonsDisabled(false);
  playBgm('bgmOpening');
}

/* ===== Enemy Turn ===== */
async function enemyTurn(){
  const p=state.player;
  ensurePlayerStatus();

  const attackers=aliveEnemies();
  if(!attackers.length) return;

  for(const e of attackers){
    if(e.sleepTurns&&e.sleepTurns>0){
      e.sleepTurns--;
      setMessage(`${e.name} は眠っている…`);
      updateUI();
      await sleep(700);
      continue;
    }

    if(await enemySpecialAction(e)){
      updateUI();
      await sleep(850);

      if(p.hp<=0){
        setMessage(`${p.name} は たおれてしまった…`);
        await sleep(900);
        showGameOver();
        return;
      }

      continue;
    }

    await enemyBasicAttack(e);

    if(p.hp<=0){
      setMessage(`${p.name} は たおれてしまった…`);
      await sleep(900);
      showGameOver();
      return;
    }
  }

  p.guarding=false;
}

/* ===== Enemy Basic Attack ===== */
async function enemyBasicAttack(e){
  const p=state.player;

  let damage=Math.max(1,e.atk-effectiveDef()+Math.floor(Math.random()*3));
  const isCritical=Math.random()<0.08;

  if(isCritical) damage=Math.floor(damage*2);
  if(p.guarding) damage=Math.max(1,Math.floor(damage/2));

  p.hp=Math.max(0,p.hp-damage);

  setMessage(
    isCritical
      ? `${e.name} の会心の一撃！ ${damage} ダメージ！`
      : `${e.name} のこうげき！ ${damage} ダメージ！`
  );

  showDamage(damage,'player',isCritical?'enemy-critical-text':null);

  if(isCritical) criticalFlash();

  seHit();
  playerFlash();
  updateUI();

  await sleep(isCritical?1050:850);
}

/* ===== Enemy Special Action ===== */
async function enemySpecialAction(e){
  const p=state.player;
  const s=ensurePlayerStatus();

  if(e.skill==='drain'&&Math.random()<0.28){
    const damage=Math.max(4,Math.floor(e.atk*.75)-Math.floor(effectiveDef()*.35));
    p.hp=Math.max(0,p.hp-damage);

    const heal=Math.max(1,Math.floor(damage*.3));
    e.hp=Math.min(e.maxHp,e.hp+heal);

    setMessage(`${e.name} の おなかすいた…！ ${damage}ダメージ、HPを${heal}回復！`);
    showDamage(damage,'player');
    seHit();
    playerFlash();
    return true;
  }

  if(e.skill==='double'&&Math.random()<0.24){
    setMessage(`${e.name} は さらに働き続けた！`);
    await sleep(450);
    await enemyBasicAttack(e);
    if(p.hp>0) await enemyBasicAttack(e);
    return true;
  }

  if(e.skill==='confuse'&&Math.random()<0.30){
    s.confuse=Math.max(s.confuse,2);
    setMessage(`${e.name} の 思考迷走！ 💫 混乱した！`);
    seMagic();
    screenFlash();
    return true;
  }

  if(e.skill==='powerup'&&Math.random()<0.28){
    e.atk+=3;
    setMessage(`${e.name} は 激務で追い込まれた！ 攻撃力が上がった！`);
    seMagic();
    return true;
  }

  if(e.skill==='sleep'&&Math.random()<0.25){
    s.sleep=Math.max(s.sleep,1+Math.floor(Math.random()*2));
    setMessage(`${e.name} の うとうと…！ 😴 眠ってしまった！`);
    seMagic();
    screenFlash();
    return true;
  }

  if(e.skill==='drunk'&&Math.random()<0.35){
    if(Math.random()<0.35){
      const selfDamage=Math.max(8,Math.floor(e.atk*.9));
      e.hp=Math.max(0,e.hp-selfDamage);

      if(e.hp<=0) state.lastDefeatedEnemy=e;

      setMessage(`${e.name} は酔って自分にぶつかった！ ${selfDamage}ダメージ！`);
      showDamage(selfDamage,'enemy');
      seHit();
      enemyFlash();
    }else{
      s.confuse=Math.max(s.confuse,2);
      setMessage(`${e.name} の 千鳥足トーク！ 💫 混乱した！`);
      seMagic();
      screenFlash();
    }

    return true;
  }

  if(e.skill==='defdown'&&Math.random()<0.32){
    s.defDown=Math.max(s.defDown,2);
    setMessage(`${e.name} の 叱責！ 🔻 防御が下がった！`);
    seMagic();
    screenFlash();
    return true;
  }

  if(e.skill==='boss'&&Math.random()<0.35){
    const roll=Math.random();

    if(roll<.45){
      let damage=Math.max(5,Math.floor(e.atk*.75)-Math.floor(effectiveDef()*.35));

      if(p.guarding) damage=Math.max(1,Math.floor(damage/2));

      p.hp=Math.max(0,p.hp-damage);

      setMessage(`${e.name} の 夜魔の圧！ ${damage}ダメージ！`);
      showDamage(damage,'player','enemy-critical-text');
      seMagic();
      screenFlash();
      playerFlash();
    }

    else if(roll<.7){
      s.defDown=Math.max(s.defDown,2);
      setMessage(`${e.name} の 威圧！ 🔻 防御が下がった！`);
      seMagic();
      screenFlash();
    }

    else{
      s.confuse=Math.max(s.confuse,2);
      setMessage(`${e.name} の 闇トーク！ 💫 混乱した！`);
      seMagic();
      screenFlash();
    }

    return true;
  }

  return false;
}

/* ===== Reward ===== */
function giveReward(enemyId){
  // 正式仕様：通常敵からのどうぐドロップは無し
  return false;
}

/* ===== Treasure Drop ===== */
function treasureDrop(enemyId){
  const p=state.player;

  // 戦闘後の宝箱も装備品のみ。初代メイド服はたまちゃん限定。
  if(Math.floor(Math.random()*4)!==0) return false;

  const candidates=[];

  if(!p.inventory.weapons.includes('frill_blade')){
    candidates.push({type:'weapon',id:'frill_blade',text:'フリルブレード を発見した！ 攻撃 +6'});
  }

  if(!p.inventory.weapons.includes('gokitaku_mace')){
    candidates.push({type:'weapon',id:'gokitaku_mace',text:'ご帰宅メイス を発見した！ 攻撃 +11'});
  }

  if(!p.inventory.uniforms.includes('maid_headband')){
    candidates.push({type:'uniform',id:'maid_headband',text:'メイドカチューシャ を発見した！ 防御 +3'});
  }

  if(!p.inventory.uniforms.includes('heart_tiara')){
    candidates.push({type:'uniform',id:'heart_tiara',text:'ハートティアラ を発見した！ 防御 +6'});
  }

  if(!p.inventory.uniforms.includes('rose_ribbon')){
    candidates.push({type:'uniform',id:'rose_ribbon',text:'ローズリボン を発見した！ 防御 +10'});
  }

  if(!p.inventory.uniforms.includes('white_apron')){
    candidates.push({type:'uniform',id:'white_apron',text:'純白エプロン を発見した！ 防御 +4'});
  }

  if(!p.inventory.uniforms.includes('long_maid')){
    candidates.push({type:'uniform',id:'long_maid',text:'ロングメイド服 を発見した！ 防御 +9'});
  }

  if(!p.inventory.uniforms.includes('service_proof')){
    candidates.push({type:'uniform',id:'service_proof',text:'お給仕の証 を発見した！ 防御 +3'});
  }

  if(!p.inventory.uniforms.includes('oshi_pendant')){
    candidates.push({type:'uniform',id:'oshi_pendant',text:'推し活ペンダント を発見した！ 防御 +7'});
  }

  if(!p.inventory.uniforms.includes('legend_nameplate')){
    candidates.push({type:'uniform',id:'legend_nameplate',text:'伝説の名札 を発見した！ 防御 +12'});
  }

  if(!candidates.length) return false;

  const reward=candidates[Math.floor(Math.random()*candidates.length)];

  if(reward.type==='weapon') p.inventory.weapons.push(reward.id);
  if(reward.type==='uniform') p.inventory.uniforms.push(reward.id);

  openTreasureMenu(reward.text);
  setMessage('宝箱から装備品を入手！');

  return true;
}

/* ===== Win Battle ===== */
async function winBattle(){
  const p=state.player;
  const defeatedEnemies=state.enemiesInBattle && state.enemiesInBattle.length
    ? state.enemiesInBattle
    : [currentEnemy()];

  const dropTarget=state.lastDefeatedEnemy || defeatedEnemies[defeatedEnemies.length-1];
  const totalExp=defeatedEnemies.reduce((sum,e)=>sum+(e.exp||0),0);
  const hasBoss=defeatedEnemies.some(e=>e.boss);

  victoryEffect();
  seVictory();

  setMessage(`ご主人様たちを いやした！ EXP ${totalExp} 獲得！`);

  p.exp+=totalExp;
  updateUI();

  await sleep(1000);

  while(p.exp>=p.nextExp){
    p.exp-=p.nextExp;
    p.lv++;
    p.nextExp=Math.floor(p.nextExp*1.5);

    p.maxHp+=6;
    p.maxMp+=3;
    p.baseAtk+=2;
    p.baseDef+=1;
    p.baseSpd+=1;
    p.baseTalk+=2;
    p.hp=p.maxHp;
    p.mp=p.maxMp;

    seLevelUp();
    showLevelToast(`LEVEL UP！ Lv.${p.lv}`);
    setMessage(`${p.name} は レベル ${p.lv} に あがった！`);

    updateUI();
    await sleep(1200);
  }

  if(hasBoss){
    await showEnding();
    return;
  }

  // v23：ドロップ判定は「最後に倒した敵」が対象
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

