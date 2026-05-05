/* =========================
   game-event-safety-preload.js

   使い方：
   index.htmlで game.js より前に読み込む緊急回避用です。

   <script src="js/game-event-safety-preload.js"></script>
   <script src="js/game.js"></script>

   目的：
   game.js内の直接addEventListenerで、
   存在しないIDがあっても停止しにくくします。

   推奨：
   最終的には game.js の Eventsブロックを
   game_events_safe_block.txt に置換してください。
========================= */

(function(){
  if(window.__potoroEventSafetyPreloadInstalled) return;
  window.__potoroEventSafetyPreloadInstalled = true;

  const originalGetElementById = document.getElementById.bind(document);

  const dummyClassList = {
    add(){},
    remove(){},
    toggle(){},
    contains(){ return true; }
  };

  function createDummyElement(id){
    return {
      id,
      dataset:{},
      style:{},
      classList:dummyClassList,
      addEventListener(){
        console.warn('[PO・TORO QUEST] dummy event target ignored:', id);
      },
      removeEventListener(){},
      appendChild(){},
      remove(){},
      querySelector(){ return null; },
      querySelectorAll(){ return []; },
      textContent:'',
      innerHTML:''
    };
  }

  document.getElementById = function(id){
    const el = originalGetElementById(id);
    if(el) return el;

    const optionalIds = [
      'equipBtn',
      'battleEquipBtn',
      'mapItemBtn',
      'mapEquipBtn',
      'endingRestartBtn',
      'guideBtn',
      'guideCloseBtn',
      'guideModal',
      'newMapBtn'
    ];

    if(optionalIds.includes(id)){
      return createDummyElement(id);
    }

    return null;
  };

  console.log('[PO・TORO QUEST] game-event-safety-preload.js loaded');
})();
