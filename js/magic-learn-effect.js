/* =========================
   ポトロクエスト magic-learn-effect.js
   おまじない習得演出・現行リスト対応版

   差し替え対象：
   js/magic-learn-effect.js

   目的：
   レベルアップ時の
   LEVEL UP! / NEW MAGIC! / おまじない名
   の表示を、現行のおまじない習得順に合わせます。
========================= */

(function(){
  if(window.__potoroMagicLearnEffectFixedInstalled) return;
  window.__potoroMagicLearnEffectFixedInstalled = true;

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

  function ensureLearnedMagicMemory(){
    if(typeof state === 'undefined' || !state.player) return {};
    if(!state.player.learnedMagicNotice) state.player.learnedMagicNotice = {};
    return state.player.learnedMagicNotice;
  }

  function createMagicLearnToast(){
    let toast = document.getElementById('potoroMagicLearnToast');

    if(toast) return toast;

    toast = document.createElement('div');
    toast.id = 'potoroMagicLearnToast';
    toast.style.position = 'fixed';
    toast.style.left = '50%';
    toast.style.top = '22%';
    toast.style.transform = 'translate(-50%, -50%) scale(.96)';
    toast.style.zIndex = '99999';
    toast.style.minWidth = '220px';
    toast.style.maxWidth = '86vw';
    toast.style.padding = '18px 22px';
    toast.style.borderRadius = '22px';
    toast.style.border = '4px solid #f5a3d6';
    toast.style.background = 'rgba(255,255,255,.96)';
    toast.style.boxShadow = '0 0 22px rgba(255,122,214,.75), 0 8px 24px rgba(0,0,0,.25)';
    toast.style.textAlign = 'center';
    toast.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    toast.style.opacity = '0';
    toast.style.pointerEvents = 'none';
    toast.style.transition = 'opacity .25s ease, transform .25s ease';
    toast.innerHTML = ''
      + '<div style="font-size:16px;letter-spacing:4px;color:#f472b6;font-weight:900;margin-bottom:6px;">LEVEL UP!</div>'
      + '<div style="font-size:14px;letter-spacing:3px;color:#ec4899;font-weight:900;margin-bottom:10px;">NEW MAGIC!</div>'
      + '<div id="potoroMagicLearnToastName" style="font-size:24px;color:#a855f7;font-weight:900;text-shadow:0 0 10px rgba(168,85,247,.35);"></div>';

    document.body.appendChild(toast);

    return toast;
  }

  function showMagicLearnEffectByName(name){
    if(!name) return false;

    const toast = createMagicLearnToast();
    const nameEl = document.getElementById('potoroMagicLearnToastName');

    if(nameEl) nameEl.textContent = name;

    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, -50%) scale(1)';

    if(typeof seLevelUp === 'function'){
      try{ seLevelUp(); }catch(e){}
    }

    setTimeout(function(){
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -50%) scale(.96)';
    }, 1800);

    return true;
  }

  function showMagicLearnEffectByLevel(level){
    const name = getMagicNameByLevel(level);
    if(!name) return false;

    const memory = ensureLearnedMagicMemory();

    if(memory[level]) return false;

    memory[level] = true;

    showMagicLearnEffectByName(name);

    if(typeof setMessage === 'function'){
      setMessage(name + 'をおぼえた！');
    }

    console.log('[PO・TORO QUEST] magic learned effect', {
      level:Number(level),
      name:name
    });

    return true;
  }

  if(typeof winBattle === 'function' && !window.__potoroMagicLearnEffectWinBattlePatched){
    window.__potoroMagicLearnEffectWinBattlePatched = true;

    const originalWinBattle = winBattle;

    winBattle = async function(){
      const beforeLv = getPlayerLevelSafe();

      const result = await originalWinBattle.apply(this, arguments);

      const afterLv = getPlayerLevelSafe();

      if(beforeLv !== null && afterLv !== null && afterLv > beforeLv){
        let delay = 250;

        for(let lv = beforeLv + 1; lv <= afterLv; lv++){
          if(getMagicNameByLevel(lv)){
            setTimeout(function(){
              showMagicLearnEffectByLevel(lv);
            }, delay);

            delay += 1900;
          }
        }
      }

      return result;
    };
  }

  if(typeof levelUp === 'function' && !window.__potoroMagicLearnEffectLevelUpPatched){
    window.__potoroMagicLearnEffectLevelUpPatched = true;

    const originalLevelUp = levelUp;

    levelUp = function(){
      const beforeLv = getPlayerLevelSafe();

      const result = originalLevelUp.apply(this, arguments);

      const afterLv = getPlayerLevelSafe();

      if(beforeLv !== null && afterLv !== null && afterLv > beforeLv){
        for(let lv = beforeLv + 1; lv <= afterLv; lv++){
          showMagicLearnEffectByLevel(lv);
        }
      }

      return result;
    };
  }

  window.potoroTestMagicLearnEffect = function(level){
    return showMagicLearnEffectByName(getMagicNameByLevel(Number(level)));
  };

  window.potoroMagicLearnEffectReport = function(){
    return {
      installed:true,
      version:'fixed-current-magic-list',
      playerLevel:getPlayerLevelSafe(),
      expectedMagic:getMagicNameByLevel(getPlayerLevelSafe()),
      list:POTORO_MAGIC_LEARN_LIST,
      winBattlePatched:!!window.__potoroMagicLearnEffectWinBattlePatched,
      levelUpPatched:!!window.__potoroMagicLearnEffectLevelUpPatched
    };
  };

  console.log('[PO・TORO QUEST] magic-learn-effect.js fixed loaded', window.potoroMagicLearnEffectReport());
})();
