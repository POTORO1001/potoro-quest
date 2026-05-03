/* =========================
   ポトロクエスト map-status-sync.js
   HP / MP 表示同期パッチ

   追加対象：
   js/map-status-sync.js

   目的：
   - 戦闘画面のHP/MP
   - マップ画面のHP/MP

   この2つの表示を常に state.player の値に同期します。

   読み込み順：
   map.js の後、magic.js / effects.js より前がおすすめ
========================= */

(function(){
  if(window.__potoroMapStatusSyncInstalled) return;
  window.__potoroMapStatusSyncInstalled = true;

  function isMapScreenVisible(){
    const map = document.getElementById('mapScreen');
    return !!map && !map.classList.contains('hidden');
  }

  function syncMapStatus(){
    if(typeof updateMapStatusPanel === 'function'){
      updateMapStatusPanel();
    }
  }

  /* ===== updateUI が呼ばれたら、マップステータスも同期 ===== */
  if(typeof updateUI === 'function'){
    const originalUpdateUI = updateUI;

    updateUI = function(){
      const result = originalUpdateUI.apply(this, arguments);
      syncMapStatus();
      return result;
    };
  }

  /* ===== 戦闘終了からマップへ戻る関数がある場合、そこにも同期 ===== */
  if(typeof endBattleToMap === 'function'){
    const originalEndBattleToMap = endBattleToMap;

    endBattleToMap = function(){
      const result = originalEndBattleToMap.apply(this, arguments);

      setTimeout(() => {
        syncMapStatus();
      },0);

      return result;
    };
  }

  /* ===== シーン切替系がある場合にも同期 ===== */
  ['showMap','showMapScreen','backToMap'].forEach(fnName => {
    if(typeof window[fnName] === 'function'){
      const original = window[fnName];

      window[fnName] = function(){
        const result = original.apply(this, arguments);

        setTimeout(() => {
          syncMapStatus();
        },0);

        return result;
      };
    }
  });

  /* ===== 保険：マップ表示中は定期的に同期 ===== */
  setInterval(() => {
    if(isMapScreenVisible()){
      syncMapStatus();
    }
  },500);

  window.potoroMapStatusSyncReport = function(){
    const p = state && state.player ? state.player : null;

    const report = {
      installed:true,
      mapVisible:isMapScreenVisible(),
      hp:p ? p.hp : null,
      maxHp:p ? p.maxHp : null,
      mp:p ? p.mp : null,
      maxMp:p ? p.maxMp : null,
      hasUpdateUI:typeof updateUI === 'function',
      hasUpdateMapStatusPanel:typeof updateMapStatusPanel === 'function'
    };

    console.log('[PO・TORO QUEST map status sync]',report);
    return report;
  };

  console.log('[PO・TORO QUEST] map-status-sync.js loaded');
})();
