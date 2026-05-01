/* =========================
   ポトロクエスト assets.js（STEP15-A）
   アセット一覧・プリロード分離ファイル

   読み込み順：
   1. js/game.js
   2. js/core.js
   3. js/data.js
   4. js/assets.js
   5. js/loading.js
   6. js/audio.js
   7. js/ui.js
   8. js/opening.js
   9. js/ending.js
   10. js/scene.js
   11. js/battle.js
   12. js/enemy.js
   13. js/equipment.js
   14. js/item.js
   15. js/map.js
   16. js/event.js
   17. js/magic.js
   18. js/compatibility.js

   重要：
   - game.js 内の ASSETS_TO_PRELOAD と同じ内容を安全に参照するための分離版です。
   - const ASSETS_TO_PRELOAD は game.js に既にあるため、ここでは別名 POTORO_ASSETS を使います。
========================= */

/* ===== Asset List ===== */
const POTORO_ASSETS = {
  enemies: [
    'img/enemies/teiji.png?v=29special',
    'img/enemies/kuufuku.png?v=29special',
    'img/enemies/zangyo.png?v=29special',
    'img/enemies/meisou.png?v=29special',
    'img/enemies/gekimu.png?v=29special',
    'img/enemies/neochi.png?v=29special',
    'img/enemies/deisui.png?v=29special',
    'img/enemies/shisseki.png?v=29special',
    'img/enemies/boss.png?v=29special',
    'img/enemies/tamachan.png?v=29special'
  ],
  backgrounds: [
    'img/backgrounds/battle_room.png?v=29special',
    'img/backgrounds/battle_boss_room.png?v=29special'
  ],
  audio: [
    'audio/opening.mp3?v=29special',
    'audio/map_1F.mp3?v=29special',
    'audio/map_2F.mp3?v=29special',
    'audio/tamachan.mp3?v=29special',
    'audio/battle.mp3?v=29special',
    'audio/boss.mp3?v=29special'
  ]
};

/* ===== Asset Helpers ===== */
function getImageAssets(){
  return [
    ...POTORO_ASSETS.enemies,
    ...POTORO_ASSETS.backgrounds
  ];
}

function getAudioAssets(){
  return POTORO_ASSETS.audio;
}

function getAllAssets(){
  return [
    ...getImageAssets(),
    ...getAudioAssets()
  ];
}

/* ===== Image Preload ===== */
function preloadImage(src){
  return new Promise(resolve => {
    const img = new Image();

    img.onload = () => resolve({src,ok:true,type:'image'});
    img.onerror = () => resolve({src,ok:false,type:'image'});

    img.src = src;
  });
}

/* ===== Image Preload Batch ===== */
async function preloadImages(){
  const assets = getImageAssets();

  return Promise.all(assets.map(preloadImage));
}

/* ===== Audio Warmup =====
   ブラウザの自動再生制限があるため、ここでは存在チェックのみ。
========================= */
function inspectAudioElements(){
  return [
    'bgmOpening',
    'bgmMap1F',
    'bgmMap2F',
    'bgmTamachan',
    'bgmBattle',
    'bgmBoss'
  ].map(id => {
    const el = document.getElementById(id);

    return {
      id,
      found: !!el,
      readyState: el ? el.readyState : null
    };
  });
}

/* ===== Asset Debug ===== */
function potoroAssetReport(){
  const report = {
    images:getImageAssets(),
    audio:getAudioAssets(),
    audioElements:inspectAudioElements()
  };

  console.log('[PO・TORO QUEST assets]',report);

  return report;
}
