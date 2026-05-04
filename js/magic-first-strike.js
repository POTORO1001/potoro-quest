/* =========================
   ポトロクエスト magic-first-strike.js
   ご主人様ファースト 完全版

   追加対象：
   js/magic-first-strike.js

   効果：
   - Lv4で使用可能
   - MP6
   - 必ず先制攻撃
   - 威力は通常攻撃の75%
   - 単体攻撃
========================= */

(function(){
  if(window.__potoroFirstStrikeMagicInstalledV2) return;
  window.__potoroFirstStrikeMagicInstalledV2 = true;

  const FIRST_STRIKE_MAGIC = {
    id:'first_strike',
    key:'first_strike',
    name:'ご主人様ファースト',
    mp:6,
    level:4,
    desc:'必ず先制攻撃・威力75%'
  };

  function getPlayerLevelSafe(){
    const p = state.player;
    return p.lv || p.level || 1;
  }

  function calcFirstStrikeDamage(){
    const base = Math.max(1,totalAtk() + Math.floor(Math.random()*4));
    return Math.max(1,Math.floor(base * 0.75));
  }

  async function useFirstStrikeMagic(){
    if(state.player.hp <= 0) return;
    if(state.busy) return;

    closeSubMenu();
    closeEquipMenu();

    state.busy = true;
    setButtonsDisabled(true);

    // 先制おまじないなので enemyFirstCheck() は呼ばない
    if(!(await playerStatusCheck())) return;

    const p = state.player;

    if(getPlayerLevelSafe() < FIRST_STRIKE_MAGIC.level){
      await failAction(`${FIRST_STRIKE_MAGIC.name}はまだ覚えていない！`);
      return;
    }

    if(p.mp < FIRST_STRIKE_MAGIC.mp){
      await failAction('MPがたりない！');
      return;
    }

    const target = currentEnemy();
    if(!target){
      await failAction('対象がいない！');
      return;
    }

    p.mp -= FIRST_STRIKE_MAGIC.mp;

    if(typeof showCutin === 'function'){
      await showCutin('先制おまじない',`${FIRST_STRIKE_MAGIC.name}！`);
    }

    const damage = calcFirstStrikeDamage();

    target.hp = Math.max(0,target.hp - damage);

    if(target.hp <= 0){
      state.lastDefeatedEnemy = target;
    }

    setMessage(`${FIRST_STRIKE_MAGIC.name}！ 先に動いて ${target.name} に ${damage} ダメージ！`);

    if(typeof showDamage === 'function') showDamage(damage,'enemy');
    if(typeof seMagic === 'function') seMagic();
    if(typeof enemyFlash === 'function') enemyFlash();
    if(typeof updateUI === 'function') updateUI();

    await sleep(750);

    if(allEnemiesDefeated()){
      await winBattle();
      return;
    }

    await enemyTurn();

    state.enemyActedFirst = false;
    state.busy = false;
    setButtonsDisabled(false);
    updateUI();
  }

  if(typeof useMagic === 'function' && !window.__potoroUseMagicFirstStrikePatchedV2){
    window.__potoroUseMagicFirstStrikePatchedV2 = true;

    const originalUseMagic = useMagic;

    useMagic = async function(kind){
      if(kind === 'first_strike'){
        return useFirstStrikeMagic();
      }

      return originalUseMagic.apply(this,arguments);
    };
  }

  function patchMagicConfigObject(obj){
    if(!obj) return false;

    obj.first_strike = {
      id:'first_strike',
      key:'first_strike',
      name:FIRST_STRIKE_MAGIC.name,
      level:FIRST_STRIKE_MAGIC.level,
      lv:FIRST_STRIKE_MAGIC.level,
      learnLevel:FIRST_STRIKE_MAGIC.level,
      mp:FIRST_STRIKE_MAGIC.mp,
      cost:FIRST_STRIKE_MAGIC.mp,
      desc:FIRST_STRIKE_MAGIC.desc,
      type:'attack',
      target:'single'
    };

    return true;
  }

  try{
    if(typeof MAGIC_CONFIG !== 'undefined') patchMagicConfigObject(MAGIC_CONFIG);
  }catch(e){}

  try{
    if(typeof POTORO_MAGIC_CONFIG !== 'undefined') patchMagicConfigObject(POTORO_MAGIC_CONFIG);
  }catch(e){}

  window.potoroFirstStrikeMagicReport = function(){
    return {
      installed:true,
      magic:FIRST_STRIKE_MAGIC,
      playerLevel:typeof state !== 'undefined' && state.player ? getPlayerLevelSafe() : null,
      canUse:typeof state !== 'undefined' && state.player
        ? getPlayerLevelSafe() >= FIRST_STRIKE_MAGIC.level && state.player.mp >= FIRST_STRIKE_MAGIC.mp
        : false,
      hasUseMagic:typeof useMagic === 'function'
    };
  };

  console.log('[PO・TORO QUEST] first strike magic v2 installed', window.potoroFirstStrikeMagicReport());
})();
