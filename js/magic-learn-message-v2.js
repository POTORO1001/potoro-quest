/* =========================
   ポトロクエスト magic-learn-message-v2.js
   おまじない習得メッセージ 強制表示版

   追加対象：
   js/magic-learn-message-v2.js

   目的：
   レベルアップ時に、最新の習得表に基づいて
   「○○をおぼえた！」を必ず表示します。
========================= */

(function(){
  if(window.__potoroMagicLearnMessageV2Installed) return;
  window.__potoroMagicLearnMessageV2Installed = true;

  const POTORO_MAGIC_LEARN_ORDER = {
    1:'もえもえぎゅー',
    2:'おいしくなーれ',
    3:'おやすみなさい',
    4:'ご主人様ファースト',
    5:'キラキラオーラ',
    6:'チェキフラッシュ',
    7:'完璧なお給仕',
    8:'ご奉仕連撃',
    9:'萌えちゃーじ',
    10:'ご帰宅ラッシュ',
    11:'ひなたぼっこ',
    12:'にしきぬやまー'
  };

  function getPlayerLevelSafe(){
    if(typeof state === 'undefined' || !state.player) return null;
    return state.player.lv || state.player.level || null;
  }

  function getMagicNameByLevel(level){
    return POTORO_MAGIC_LEARN_ORDER[level] || null;
  }

  function showLearnMessage(level){
    const name = getMagicNameByLevel(level);
    if(!name) return false;

    const text = name + 'をおぼえた！';

    if(typeof showLevelToast === 'function'){
      showLevelToast(text);
    }

    if(typeof setMessage === 'function'){
      setMessage(text);
    }

    console.log('[PO・TORO QUEST magic learned]', { level, name });
    return true;
  }

  if(typeof winBattle === 'function' && !window.__potoroWinBattleLearnMessagePatchedV2){
    window.__potoroWinBattleLearnMessagePatchedV2 = true;

    const originalWinBattle = winBattle;

    winBattle = async function(){
      const beforeLv = getPlayerLevelSafe();
      const result = await originalWinBattle.apply(this,arguments);
      const afterLv = getPlayerLevelSafe();

      if(beforeLv !== null && afterLv !== null && afterLv > beforeLv){
        let delay = 250;

        for(let lv = beforeLv + 1; lv <= afterLv; lv++){
          if(getMagicNameByLevel(lv)){
            setTimeout(function(){
              showLearnMessage(lv);
            }, delay);

            delay += 900;
          }
        }
      }

      return result;
    };
  }

  if(typeof levelUp === 'function' && !window.__potoroLevelUpLearnMessagePatchedV2){
    window.__potoroLevelUpLearnMessagePatchedV2 = true;

    const originalLevelUp = levelUp;

    levelUp = function(){
      const beforeLv = getPlayerLevelSafe();
      const result = originalLevelUp.apply(this,arguments);
      const afterLv = getPlayerLevelSafe();

      if(beforeLv !== null && afterLv !== null && afterLv > beforeLv){
        for(let lv = beforeLv + 1; lv <= afterLv; lv++){
          showLearnMessage(lv);
        }
      }

      return result;
    };
  }

  window.potoroTestMagicLearnMessage = function(level){
    return showLearnMessage(Number(level));
  };

  window.potoroMagicLearnMessageV2Report = function(){
    const lv = getPlayerLevelSafe();

    return {
      installed:true,
      version:'learn-message-force-v2',
      playerLevel:lv,
      expectedMagic:getMagicNameByLevel(lv),
      order:POTORO_MAGIC_LEARN_ORDER,
      winBattlePatched:!!window.__potoroWinBattleLearnMessagePatchedV2,
      levelUpPatched:!!window.__potoroLevelUpLearnMessagePatchedV2
    };
  };

  console.log('[PO・TORO QUEST] magic-learn-message-v2.js loaded', window.potoroMagicLearnMessageV2Report());
})();
