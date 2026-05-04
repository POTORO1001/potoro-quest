/* =========================
   ポトロクエスト magic-learn-message-fix.js
   おまじない習得メッセージ修正版

   追加対象：
   js/magic-learn-message-fix.js

   目的：
   レベルアップ後の「○○をおぼえた！」メッセージを
   最新のおまじない習得順に合わせます。
========================= */

(function(){
  if(window.__potoroMagicLearnMessageFixInstalled) return;
  window.__potoroMagicLearnMessageFixInstalled = true;

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

  const MAGIC_NAMES = Object.values(POTORO_MAGIC_LEARN_ORDER);

  function getPlayerLevelSafe(){
    if(typeof state === 'undefined' || !state.player) return null;
    return state.player.lv || state.player.level || null;
  }

  function getExpectedMagicName(level){
    return POTORO_MAGIC_LEARN_ORDER[level] || null;
  }

  function isLearnMessage(text){
    if(typeof text !== 'string') return false;

    const hasLearnWord =
      text.includes('おぼえ') ||
      text.includes('覚え') ||
      text.includes('習得');

    const hasMagicName = MAGIC_NAMES.some(name => text.includes(name));

    return hasLearnWord && hasMagicName;
  }

  function fixLearnMessage(text){
    if(!isLearnMessage(text)) return text;

    const level = getPlayerLevelSafe();
    const expected = getExpectedMagicName(level);

    if(!expected) return text;

    let fixed = text;

    MAGIC_NAMES.forEach(name => {
      if(name !== expected){
        fixed = fixed.replaceAll(name, expected);
      }
    });

    return fixed;
  }

  if(typeof setMessage === 'function' && !window.__potoroSetMessageLearnFixPatched){
    window.__potoroSetMessageLearnFixPatched = true;

    const originalSetMessage = setMessage;

    setMessage = function(text){
      return originalSetMessage.call(this, fixLearnMessage(text));
    };
  }

  if(typeof showLevelToast === 'function' && !window.__potoroShowLevelToastLearnFixPatched){
    window.__potoroShowLevelToastLearnFixPatched = true;

    const originalShowLevelToast = showLevelToast;

    showLevelToast = function(text){
      return originalShowLevelToast.call(this, fixLearnMessage(text));
    };
  }

  window.potoroMagicLearnMessageFixReport = function(){
    const lv = getPlayerLevelSafe();

    return {
      installed:true,
      version:'learn-message-fix-v1',
      playerLevel:lv,
      expectedMagic:getExpectedMagicName(lv),
      order:POTORO_MAGIC_LEARN_ORDER
    };
  };

  console.log('[PO・TORO QUEST] magic-learn-message-fix.js loaded', window.potoroMagicLearnMessageFixReport());
})();
