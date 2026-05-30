/* =========================
   ポトロクエスト magic-complete.js
   おまじない完全実装パッチ

   追加対象：
   js/magic-complete.js

   目的：
   game.js に未実装の下記おまじないを正式実装します。

   Lv4  ご主人様ファースト
   Lv5  キラキラオーラ
   Lv7  完璧なお給仕
   Lv8  ご奉仕連撃
   Lv10 ご帰宅ラッシュ
   Lv11 ひなたぼっこ

   既存処理を使うもの：
   Lv1  もえもえぎゅー
   Lv2  おいしくなーれ
   Lv3  おやすみなさい
   Lv6  チェキフラッシュ
   Lv9  萌えちゃーじ
   Lv12 にしきぬやまー

   推奨読み込み順：
   magic-first-strike.js / magic-level-order.js の後

   index.html：
   <script src="js/magic-first-strike.js"></script>
   <script src="js/magic-level-order.js"></script>
   <script src="js/magic-complete.js"></script>
========================= */

(function(){
  if(window.__potoroMagicCompleteInstalled) return;
  window.__potoroMagicCompleteInstalled = true;

  const MAGIC_COMPLETE_CONFIG = {
    first_strike:{name:'ご主人様ファースト', mp:6, level:4},
    aura:{name:'キラキラオーラ', mp:4, level:5},
    perfect_service:{name:'完璧なお給仕', mp:7, level:7},
    combo:{name:'ご奉仕連撃', mp:8, level:8},
    rush:{name:'ご帰宅ラッシュ', mp:12, level:10},
    sunny:{name:'ひなたぼっこ', mp:12, level:11}
  };

  function getPlayerLevelSafe(){
    const p = state.player;
    return p.lv || p.level || 1;
  }

  function ensureBuffs(){
    const p = state.player;
    if(!p.buffs) p.buffs = {};
    return p.buffs;
  }

  function getMagicConfig(kind){
    return MAGIC_COMPLETE_CONFIG[kind] || null;
  }

  function playOmajinaiSe(){
    if(typeof seOmajinai === 'function') seOmajinai();
    else if(typeof seMagic === 'function') seMagic();
  }

  async function failMagic(message){
    if(typeof failAction === 'function'){
      await failAction(message);
      return;
    }

    if(typeof setMessage === 'function') setMessage(message);
    state.enemyActedFirst = false;
    state.busy = false;
    setButtonsDisabled(false);
    updateUI();
  }

  function checkLevelAndMp(kind){
    const cfg = getMagicConfig(kind);
    if(!cfg) return true;

    const p = state.player;

    if(getPlayerLevelSafe() < cfg.level){
      return `${cfg.name}はまだ覚えていない！`;
    }

    const mp = typeof equipmentAdjustedMagicCost === 'function'
      ? equipmentAdjustedMagicCost(cfg.mp)
      : cfg.mp;

    if(p.mp < mp){
      return 'MPがたりない！';
    }

    return null;
  }

  function consumeMp(kind){
    const cfg = getMagicConfig(kind);
    if(cfg){
      const mp = typeof equipmentAdjustedMagicCost === 'function'
        ? equipmentAdjustedMagicCost(cfg.mp)
        : cfg.mp;
      state.player.mp -= mp;
    }
  }

  function calcNormalAttackDamage(){
    return Math.max(1,totalAtk() + Math.floor(Math.random()*4));
  }

  function calcTalkDamage(base){
    if(typeof magicPower === 'function') return magicPower(base);
    return Math.floor(base + totalTalk()*1.6);
  }

  function applyChargeIfNeeded(damage){
    const buffs = ensureBuffs();

    if(buffs.perfectService && buffs.perfectService > 0){
      buffs.perfectService = 0;
      return Math.floor(damage * 2.5);
    }

    return damage;
  }

  function applyAuraBonusToDamage(damage){
    const buffs = ensureBuffs();

    if(buffs.kiraAura && buffs.kiraAura > 0){
      return Math.floor(damage * 1.25);
    }

    return damage;
  }

  function endPlayerMagicAction(){
    state.enemyActedFirst = false;
    state.busy = false;
    setButtonsDisabled(false);
    updateUI();
  }

  async function afterPlayerActionEnemyTurn(){
    if(typeof shouldTriggerEquipmentExtraAction === 'function' && shouldTriggerEquipmentExtraAction()){
      await announceEquipmentExtraAction();
      endPlayerMagicAction();
      return;
    }

    if(!state.enemyActedFirst){
      await enemyTurn();
    }
    endPlayerMagicAction();
  }

  async function useFirstStrike(){
    const error = checkLevelAndMp('first_strike');
    if(error){ await failMagic(error); return; }

    consumeMp('first_strike');

    await showCutin('先制おまじない','ご主人様ファースト！');

    const target = currentEnemy();
    let damage = Math.max(1,Math.floor(calcNormalAttackDamage() * 0.75));
    damage = applyAuraBonusToDamage(damage);
    damage = applyChargeIfNeeded(damage);
    if(typeof applyEquipmentOutgoingDamage === 'function'){
      damage = applyEquipmentOutgoingDamage(damage,target,{magic:true});
    }

    target.hp = Math.max(0,target.hp - damage);
    if(target.hp <= 0) state.lastDefeatedEnemy = target;

    setMessage(`ご主人様ファースト！ ${target.name} に ${damage} ダメージ！`);
    showDamage(damage,'enemy');
    playOmajinaiSe();
    enemyFlash();
    updateUI();

    await sleep(750);

    if(allEnemiesDefeated()){
      await winBattle();
      return;
    }

    // 先制攻撃。敵ターンは通常通りこのあと来る。
    await enemyTurn();
    endPlayerMagicAction();
  }

  async function useAura(){
    const error = checkLevelAndMp('aura');
    if(error){ await failMagic(error); return; }

    consumeMp('aura');

    await showCutin('補助おまじない','キラキラオーラ！');

    const buffs = ensureBuffs();
    buffs.kiraAura = typeof applyEquipmentBuffTurns === 'function' ? applyEquipmentBuffTurns(2) : 2;

    setMessage('キラキラオーラ！ トーク力とすばやさが上がった！');
    playOmajinaiSe();
    screenFlash();
    updateUI();

    await sleep(800);
    await afterPlayerActionEnemyTurn();
  }

  async function usePerfectService(){
    const error = checkLevelAndMp('perfect_service');
    if(error){ await failMagic(error); return; }

    consumeMp('perfect_service');

    await showCutin('集中おまじない','完璧なお給仕！');

    const buffs = ensureBuffs();
    buffs.perfectService = typeof applyEquipmentBuffTurns === 'function' ? applyEquipmentBuffTurns(1) : 1;

    setMessage('完璧なお給仕！ 次の攻撃・おまじない威力が2.5倍！');
    playOmajinaiSe();
    screenFlash();
    updateUI();

    await sleep(800);
    await afterPlayerActionEnemyTurn();
  }

  async function useCombo(){
    const error = checkLevelAndMp('combo');
    if(error){ await failMagic(error); return; }

    consumeMp('combo');

    await showCutin('連撃おまじない','ご奉仕連撃！');

    const hitCount = 2 + Math.floor(Math.random()*2);
    let total = 0;

    for(let i=0;i<hitCount;i++){
      const target = currentEnemy();
      if(!target || target.hp <= 0) break;

      let damage = Math.max(1,Math.floor(calcNormalAttackDamage() * 0.65));
      damage = applyAuraBonusToDamage(damage);

      // 完璧なお給仕は最初の1撃だけに乗る
      if(i === 0) damage = applyChargeIfNeeded(damage);
      if(typeof applyEquipmentOutgoingDamage === 'function'){
        damage = applyEquipmentOutgoingDamage(damage,target,{magic:true});
      }

      target.hp = Math.max(0,target.hp - damage);
      total += damage;

      if(target.hp <= 0) state.lastDefeatedEnemy = target;

      setMessage(`ご奉仕連撃！ ${i+1}回目！ ${damage} ダメージ！`);
      showDamage(damage,'enemy');
      playOmajinaiSe();
      enemyFlash();
      updateUI();

      await sleep(420);

      if(allEnemiesDefeated()) break;
    }

    if(allEnemiesDefeated()){
      await winBattle();
      return;
    }

    setMessage(`ご奉仕連撃！ 合計 ${total} ダメージ！`);
    await sleep(500);

    await afterPlayerActionEnemyTurn();
  }

  async function useRush(){
    const error = checkLevelAndMp('rush');
    if(error){ await failMagic(error); return; }

    consumeMp('rush');

    await showCutin('大技おまじない','ご帰宅ラッシュ！');
    screenFlash();

    const target = currentEnemy();

    let damage = calcTalkDamage(48);
    damage = applyAuraBonusToDamage(damage);
    damage = applyChargeIfNeeded(damage);
    if(typeof applyEquipmentOutgoingDamage === 'function'){
      damage = applyEquipmentOutgoingDamage(damage,target,{magic:true});
    }

    target.hp = Math.max(0,target.hp - damage);
    if(target.hp <= 0) state.lastDefeatedEnemy = target;

    if(Math.random() < 0.25 && target.hp > 0){
      target.confuseTurns = Math.max(target.confuseTurns || 0,2);
      setMessage(`ご帰宅ラッシュ！ ${target.name} に ${damage} ダメージ！ さらに混乱！`);
    }else{
      setMessage(`ご帰宅ラッシュ！ ${target.name} に ${damage} ダメージ！`);
    }

    showDamage(damage,'enemy','critical-text');
    playOmajinaiSe();
    enemyFlash();
    updateUI();

    await sleep(900);

    if(allEnemiesDefeated()){
      await winBattle();
      return;
    }

    await afterPlayerActionEnemyTurn();
  }

  async function useSunny(){
    const error = checkLevelAndMp('sunny');
    if(error){ await failMagic(error); return; }

    consumeMp('sunny');

    await showCutin('回復おまじない','ひなたぼっこ！');

    const p = state.player;
    const status = ensurePlayerStatus();

    const heal = p.maxHp - p.hp;
    p.hp = p.maxHp;

    status.sleep = 0;
    status.confuse = 0;
    status.defDown = 0;

    p.guarding = false;

    setMessage(`ひなたぼっこ！ HP全回復、状態異常も治った！`);
    showDamage(-heal,'player');
    seHeal();
    screenFlash();
    updateUI();

    await sleep(850);
    await afterPlayerActionEnemyTurn();
  }

  function tickPlayerBuffsAfterEnemyTurn(){
    const buffs = ensureBuffs();

    if(buffs.kiraAura && buffs.kiraAura > 0){
      buffs.kiraAura--;
    }
  }

  /*
    totalSpd / totalTalk にキラキラオーラ補正を乗せる。
  */
  if(typeof totalSpd === 'function' && !window.__potoroAuraTotalSpdPatched){
    window.__potoroAuraTotalSpdPatched = true;
    const originalTotalSpd = totalSpd;

    totalSpd = function(){
      let value = originalTotalSpd.apply(this,arguments);
      const buffs = state.player && state.player.buffs ? state.player.buffs : {};
      if(buffs.kiraAura && buffs.kiraAura > 0){
        value += 5;
      }
      return value;
    };
  }

  if(typeof totalTalk === 'function' && !window.__potoroAuraTotalTalkPatched){
    window.__potoroAuraTotalTalkPatched = true;
    const originalTotalTalk = totalTalk;

    totalTalk = function(){
      let value = originalTotalTalk.apply(this,arguments);
      const buffs = state.player && state.player.buffs ? state.player.buffs : {};
      if(buffs.kiraAura && buffs.kiraAura > 0){
        value += 5;
      }
      return value;
    };
  }

  /*
    enemyTurn終了後にバフターンを減らす。
  */
  if(typeof enemyTurn === 'function' && !window.__potoroMagicBuffTurnPatched){
    window.__potoroMagicBuffTurnPatched = true;
    const originalEnemyTurn = enemyTurn;

    enemyTurn = async function(){
      const result = await originalEnemyTurn.apply(this,arguments);
      tickPlayerBuffsAfterEnemyTurn();
      if(typeof updateUI === 'function') updateUI();
      return result;
    };
  }

  /*
    useMagic を完全補完。
    既存実装済みのものは元のuseMagicに渡す。
  */
  if(typeof useMagic === 'function' && !window.__potoroMagicCompleteUseMagicPatched){
    window.__potoroMagicCompleteUseMagicPatched = true;

    const originalUseMagic = useMagic;

    useMagic = async function(kind){
      if(['first_strike','aura','perfect_service','combo','rush','sunny'].includes(kind)){
        if(typeof applyEquipmentTurnRecovery === 'function'){
          await applyEquipmentTurnRecovery();
        }
      }

      if(kind === 'first_strike') return useFirstStrike();
      if(kind === 'aura') return useAura();
      if(kind === 'perfect_service') return usePerfectService();
      if(kind === 'combo') return useCombo();
      if(kind === 'rush') return useRush();
      if(kind === 'sunny') return useSunny();

      return originalUseMagic.apply(this,arguments);
    };
  }

  window.potoroMagicCompleteReport = function(){
    return {
      installed:true,
      implemented:[
        'first_strike',
        'aura',
        'perfect_service',
        'combo',
        'rush',
        'sunny'
      ],
      buffs:state.player ? (state.player.buffs || {}) : null,
      playerLevel:state.player ? (state.player.lv || state.player.level || 1) : null
    };
  };

  console.log('[PO・TORO QUEST] magic-complete.js loaded', window.potoroMagicCompleteReport());
})();
