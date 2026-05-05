/* =========================
   ポトロクエスト magic-learn-compat.js

   追加対象：
   js/magic-learn-compat.js

   目的：
   battle.js が呼び出している
   checkMagicLearnOnLevelUp()
   が未定義で止まる問題を修正します。

   エラー：
   ReferenceError: checkMagicLearnOnLevelUp is not defined
========================= */

(function(){
  if(window.__potoroMagicLearnCompatInstalled) return;
  window.__potoroMagicLearnCompatInstalled = true;

  const POTORO_MAGIC_LEARN_LIST = {
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
    return POTORO_MAGIC_LEARN_LIST[Number(level)] || null;
  }

  window.checkMagicLearnOnLevelUp = function(level){
    const lv = Number(level || getPlayerLevelSafe());
    const name = getMagicNameByLevel(lv);

    if(!name) return null;

    console.log('[PO・TORO QUEST] checkMagicLearnOnLevelUp compat', {
      level:lv,
      magic:name
    });

    return name;
  };

  window.potoroMagicLearnCompatReport = function(){
    const lv = getPlayerLevelSafe();

    return {
      installed:true,
      version:'magic-learn-compat-v1',
      playerLevel:lv,
      expectedMagic:getMagicNameByLevel(lv),
      hasCheckFunction:typeof window.checkMagicLearnOnLevelUp === 'function',
      list:POTORO_MAGIC_LEARN_LIST
    };
  };

  console.log('[PO・TORO QUEST] magic-learn-compat.js loaded', window.potoroMagicLearnCompatReport());
})();
