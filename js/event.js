/* =========================
   ポトロクエスト event.js（STEP10）
   イベントバインド一元管理ファイル

   読み込み順：
   1. js/game.js
   2. js/audio.js
   3. js/ui.js
   4. js/opening.js
   5. js/ending.js
   6. js/battle.js
   7. js/enemy.js
   8. js/equipment.js
   9. js/item.js
   10. js/map.js
   11. js/event.js
   12. js/magic.js

   重要：
   - event.js はボタン・キーボード・タッチ関連の登録を一元化します。
   - 既存game.js内にもイベント登録がありますが、datasetフラグで二重登録を防ぎます。
   - magic.jsはopenSubMenu/useMagic拡張のため最後に読み込みます。
========================= */

/* ===== 汎用バインド helper ===== */
function bindOnceById(id, key, eventName, handler){
  const el = document.getElementById(id);
  if(!el) return false;

  const flag = `bound${key}`;

  if(el.dataset[flag]) return false;

  el.dataset[flag] = '1';
  el.addEventListener(eventName, handler);

  return true;
}

/* ===== 画面系ボタン ===== */
function bindScreenButtons(){
  bindOnceById('startBtn','EventStart','click',startGame);
  bindOnceById('openingBtn','EventOpening','click',openOpening);
  bindOnceById('openingSkipBtn','EventOpeningSkip','click',closeOpening);
  bindOnceById('restartBtn','EventRestart','click',resetGame);
  bindOnceById('endingRestartBtn','EventEndingRestart','click',restartFromEnding);
  bindOnceById('gameOverRestartBtn','EventGameOverRestart','click',restartFromGameOver);
}

/* ===== メニュー系ボタン ===== */
function bindMenuButtons(){
  bindOnceById('equipBtn','EventEquip','click',openEquipMenu);
  bindOnceById('battleEquipBtn','EventBattleEquip','click',openEquipMenu);
  bindOnceById('soundBtn','EventSound','click',toggleSound);
  bindOnceById('guideBtn','EventGuide','click',openGuide);
  bindOnceById('guideCloseBtn','EventGuideClose','click',closeGuide);
  bindOnceById('newMapBtn','EventNewMap','click',() => setupFloor(state.floor || 1));
  bindOnceById('mapItemBtn','EventMapItem','click',(e) => {
    e.preventDefault();
    e.stopPropagation();
    openSubMenu('item');
  });
  bindOnceById('mapEquipBtn','EventMapEquip','click',(e) => {
    e.preventDefault();
    e.stopPropagation();
    openEquipMenu();
  });
}

/* ===== ガイドモーダル ===== */
function bindGuideModal(){
  const modal = document.getElementById('guideModal');
  if(!modal || modal.dataset.boundEventGuideModal) return;

  modal.dataset.boundEventGuideModal = '1';

  modal.addEventListener('click',function(e){
    if(e.target === this) closeGuide();
  });
}

/* ===== 十字キー ===== */
function bindDpadButtons(){
  document.querySelectorAll('[data-move]').forEach(btn => {
    if(btn.dataset.boundEventDpad) return;

    btn.dataset.boundEventDpad = '1';

    btn.addEventListener('click',() => {
      const dir = btn.dataset.move;

      if(dir === 'up') movePlayer(0,-1);
      if(dir === 'down') movePlayer(0,1);
      if(dir === 'left') movePlayer(-1,0);
      if(dir === 'right') movePlayer(1,0);
    });
  });
}

/* ===== キーボード移動 ===== */
function bindKeyboardMove(){
  if(document.body.dataset.boundEventKeyboardMove) return;

  document.body.dataset.boundEventKeyboardMove = '1';

  document.addEventListener('keydown',e => {
    const map = document.getElementById('mapScreen');
    if(!map || map.classList.contains('hidden')) return;

    if(e.key === 'ArrowUp'){
      e.preventDefault();
      movePlayer(0,-1);
    }

    if(e.key === 'ArrowDown'){
      e.preventDefault();
      movePlayer(0,1);
    }

    if(e.key === 'ArrowLeft'){
      e.preventDefault();
      movePlayer(-1,0);
    }

    if(e.key === 'ArrowRight'){
      e.preventDefault();
      movePlayer(1,0);
    }
  });
}

/* ===== ダブルタップ拡大抑制 ===== */
function bindTouchZoomGuard(){
  if(document.body.dataset.boundEventTouchZoomGuard) return;

  document.body.dataset.boundEventTouchZoomGuard = '1';

  let lastTouchEnd = 0;

  document.addEventListener('touchend',function(e){
    const now = Date.now();

    if(now - lastTouchEnd <= 300){
      e.preventDefault();
    }

    lastTouchEnd = now;
  },{passive:false});

  document.addEventListener('gesturestart',function(e){
    e.preventDefault();
  });
}

/* ===== たまちゃん続行ボタン ===== */
function bindTamachanContinueButton(){
  const btn = document.getElementById('tamachanContinueBtn');
  if(!btn || btn.dataset.boundEventTamachan) return;

  btn.dataset.boundEventTamachan = '1';

  btn.addEventListener('click',() => {
    hideTamachanContinueButton();

    const overlay = document.getElementById('tamachanGetOverlay');
    if(overlay) overlay.classList.add('hidden');

    endBattleToMap();
  });
}

/* ===== 既存互換：マップメニューボタン ===== */
function bindMapMenuButtons(){
  bindMenuButtons();
}

/* ===== 既存互換：バトル装備ボタン ===== */
function bindBattleEquipButton(){
  bindMenuButtons();
}

/* ===== 既存互換：ゲームオーバーボタン ===== */
function bindGameOverButton(){
  bindScreenButtons();
}

/* ===== 全イベント登録 ===== */
function bindAllEvents(){
  bindScreenButtons();
  bindMenuButtons();
  bindGuideModal();
  bindDpadButtons();
  bindKeyboardMove();
  bindTouchZoomGuard();
  bindTamachanContinueButton();
}

/* ===== DOM Ready ===== */
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded',bindAllEvents,{once:true});
}else{
  bindAllEvents();
}
