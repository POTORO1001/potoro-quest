/* =========================
   ポトロクエスト map-status-sync.js
   HP / MP / 状態 完全同期版

   追加・差し替え対象：
   js/map-status-sync.js

   目的：
   - 戦闘画面のHP/MP/状態
   - マップ画面のHP/MP/状態

   この2つの表示を常に state.player の値に同期します。

   読み込み順：
   map.js の直後がおすすめ

   index.html：
   <script src="js/map.js"></script>
   <script src="js/map-status-sync.js"></script>
========================= */

(function(){
  if(window.__potoroMapStatusSyncInstalledV2) return;
  window.__potoroMapStatusSyncInstalledV2 = true;

  function isMapScreenVisible(){
    const map = document.getElementById('mapScreen');
    return !!map && !map.classList.contains('hidden');
  }

  function normalizeStatusValue(value){
    return Number(value || 0);
  }

  function buildPlayerStatusText(){
    if(!state || !state.player) return 'なし';

    const p = state.player;
    const s = p.status || p.statusEffects || {};

    const parts = [];

    if(normalizeStatusValue(s.sleep) > 0) parts.push('睡眠');
    if(normalizeStatusValue(s.confuse) > 0) parts.push('混乱');
    if(normalizeStatusValue(s.defDown) > 0) parts.push('防御ダウン');
    if(normalizeStatusValue(s.atkDown) > 0) parts.push('攻撃ダウン');
    if(normalizeStatusValue(s.spdDown) > 0) parts.push('すばやさダウン');
    if(normalizeStatusValue(s.talkDown) > 0) parts.push('トーク力ダウン');

    if(p.guard) parts.push('防御中');

    if(p.itemBuffs){
      const b = p.itemBuffs;

      if(normalizeStatusValue(b.turns) > 0){
        const buffs = [];
        if(normalizeStatusValue(b.atk) > 0) buffs.push('攻撃UP');
        if(normalizeStatusValue(b.def) > 0) buffs.push('防御UP');
        if(normalizeStatusValue(b.spd) > 0) buffs.push('すばやさUP');
        if(normalizeStatusValue(b.talk) > 0) buffs.push('トーク力UP');

        if(buffs.length) parts.push(buffs.join('・'));
      }

      if(normalizeStatusValue(b.magicBoostTurns) > 0 && Number(b.magicBoost || 1) > 1){
        parts.push('おまじない強化');
      }
    }

    if(p.buffs){
      const b = p.buffs;

      if(normalizeStatusValue(b.aura) > 0) parts.push('キラキラオーラ');
      if(normalizeStatusValue(b.charge) > 0 || p.charged) parts.push('ため中');
      if(normalizeStatusValue(b.def) > 0) parts.push('防御UP');
      if(normalizeStatusValue(b.talk) > 0) parts.push('トーク力UP');
      if(normalizeStatusValue(b.spd) > 0) parts.push('すばやさUP');
    }

    return parts.length ? parts.join(' / ') : 'なし';
  }

  function syncBattleStatusText(){
    const el = document.getElementById('playerStatusEffects');
    if(!el) return;

    el.textContent = `状態：${buildPlayerStatusText()}`;
  }

  function syncMapStatus(){
    if(typeof updateMapStatusPanel === 'function'){
      updateMapStatusPanel();
    }

    // map.js 側の statusText() が古い場合でも、直接上書きして同期する
    const panel = document.getElementById('mapStatusPanel');
    if(panel && state && state.player){
      const p = state.player;
      const status = buildPlayerStatusText();

      panel.innerHTML = `
        <div class="map-status-grid">
          <div>HP <strong>${p.hp}/${p.maxHp}</strong></div>
          <div>MP <strong>${p.mp}/${p.maxMp}</strong></div>
        </div>
        <div class="map-status-line">状態：${status}</div>
      `;
    }

    syncBattleStatusText();
  }

  /* ===== statusText を安全に補強 ===== */
  if(typeof statusText === 'function' && !window.__potoroStatusTextPatchedForMapSync){
    window.__potoroStatusTextPatchedForMapSync = true;

    const originalStatusText = statusText;

    statusText = function(){
      const safe = buildPlayerStatusText();

      // 既存 statusText が特殊表示を持っている可能性を残す
      try{
        const original = originalStatusText.apply(this, arguments);
        if(original && original !== 'なし') return original;
      }catch(e){}

      return safe;
    };
  }

  /* ===== updateUI が呼ばれたらマップも状態も同期 ===== */
  if(typeof updateUI === 'function' && !window.__potoroUpdateUIPatchedForMapSync){
    window.__potoroUpdateUIPatchedForMapSync = true;

    const originalUpdateUI = updateUI;

    updateUI = function(){
      const result = originalUpdateUI.apply(this, arguments);
      syncMapStatus();
      return result;
    };
  }

  /* ===== 戦闘終了からマップへ戻る関数がある場合、そこにも同期 ===== */
  if(typeof endBattleToMap === 'function' && !window.__potoroEndBattlePatchedForMapSync){
    window.__potoroEndBattlePatchedForMapSync = true;

    const originalEndBattleToMap = endBattleToMap;

    endBattleToMap = function(){
      const result = originalEndBattleToMap.apply(this, arguments);

      setTimeout(() => {
        syncMapStatus();
      },0);

      setTimeout(() => {
        syncMapStatus();
      },250);

      return result;
    };
  }

  /* ===== シーン切替系がある場合にも同期 ===== */
  ['showMap','showMapScreen','backToMap'].forEach(fnName => {
    if(typeof window[fnName] === 'function' && !window[`__potoro_${fnName}_MapSyncPatched`]){
      window[`__potoro_${fnName}_MapSyncPatched`] = true;

      const original = window[fnName];

      window[fnName] = function(){
        const result = original.apply(this, arguments);

        setTimeout(() => {
          syncMapStatus();
        },0);

        setTimeout(() => {
          syncMapStatus();
        },250);

        return result;
      };
    }
  });

  /* ===== 状態変化がupdateUIを呼ばないケースへの保険 ===== */
  setInterval(() => {
    if(isMapScreenVisible()){
      syncMapStatus();
    }
  },300);

  window.potoroMapStatusSyncReport = function(){
    const p = state && state.player ? state.player : null;

    const report = {
      installed:true,
      version:'hp-mp-status-full-sync',
      mapVisible:isMapScreenVisible(),
      hp:p ? p.hp : null,
      maxHp:p ? p.maxHp : null,
      mp:p ? p.mp : null,
      maxMp:p ? p.maxMp : null,
      statusText:buildPlayerStatusText(),
      rawStatus:p ? (p.status || p.statusEffects || null) : null,
      itemBuffs:p ? (p.itemBuffs || null) : null,
      buffs:p ? (p.buffs || null) : null,
      hasUpdateUI:typeof updateUI === 'function',
      hasUpdateMapStatusPanel:typeof updateMapStatusPanel === 'function'
    };

    console.log('[PO・TORO QUEST map status sync]',report);
    return report;
  };

  window.potoroForceMapStatusSync = function(){
    syncMapStatus();
    return potoroMapStatusSyncReport();
  };

  setTimeout(syncMapStatus,0);

  console.log('[PO・TORO QUEST] map-status-sync.js full sync loaded');
})();
