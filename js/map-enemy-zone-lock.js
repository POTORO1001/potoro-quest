/* =========================
   ポトロクエスト map-enemy-zone-lock.js
   BFS距離別 敵出現テーブル固定パッチ

   追加対象：
   js/map-enemy-zone-lock.js

   読み込み順：
   map-bfs-progress-patch.js の後
   balance.js より後でもOK
   できれば effects.js より前

   index.html 推奨：
   <script src="js/map.js"></script>
   <script src="js/map-bfs-progress-patch.js"></script>
   <script src="js/map-enemy-zone-lock.js"></script>
   <script src="js/map-status-sync.js"></script>

   目的：
   - 1Fで寝落 / 激務が出る問題を防ぐ
   - 通常敵出現をBFS進行度テーブルに完全固定
========================= */

(function(){
  if(window.__potoroEnemyZoneLockInstalled) return;
  window.__potoroEnemyZoneLockInstalled = true;

  const POTORO_ENEMY_ZONE_TABLE = {
    1:{
      early:['teiji','kuufuku'],
      middle:['kuufuku','zangyo'],
      late:['zangyo','meisou']
    },
    2:{
      early:['neochi','gekimu'],
      middle:['gekimu','deisui'],
      late:['deisui','shisseki']
    }
  };

  function safeGetProgressZone(){
    if(typeof getMapProgressZone === 'function'){
      return getMapProgressZone();
    }

    return 'early';
  }

  function findEnemyByIdSafe(id){
    if(typeof enemies === 'undefined' || !Array.isArray(enemies)) return null;
    return enemies.find(enemy => enemy.id === id) || null;
  }

  function getAllowedEnemyIdsByCurrentZone(){
    const floor = Number(state.floor || 1);
    const zone = safeGetProgressZone();

    const floorTable = POTORO_ENEMY_ZONE_TABLE[floor] || POTORO_ENEMY_ZONE_TABLE[1];

    return floorTable[zone] || floorTable.middle || floorTable.early;
  }

  function pickEnemyFromIds(ids){
    const candidates = ids
      .map(id => findEnemyByIdSafe(id))
      .filter(Boolean);

    if(!candidates.length){
      return findEnemyByIdSafe('teiji') || (Array.isArray(enemies) ? enemies[0] : null);
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /*
    通常敵抽選を完全上書き。
    これ以後、selectRandomMapEnemy() は必ず指定テーブルから返す。
  */
  window.selectRandomMapEnemy = function(){
    const ids = getAllowedEnemyIdsByCurrentZone();
    return pickEnemyFromIds(ids);
  };

  /*
    一部環境では function 宣言の selectRandomMapEnemy が window 参照されないケースがあるため、
    evalスコープにも再代入を試みる。
  */
  try{
    selectRandomMapEnemy = window.selectRandomMapEnemy;
  }catch(e){}

  /*
    checkTileEvent も安全版に上書き。
    これで通常遭遇時に必ず window.selectRandomMapEnemy を使う。
  */
  window.checkTileEvent = function(){
    const p = state.player;

    const chest = state.chests.find(chest =>
      !chest.opened &&
      chest.x === p.mapX &&
      chest.y === p.mapY
    );

    if(chest){
      chest.opened = true;

      if(typeof giveMapChestEquipment === 'function'){
        giveMapChestEquipment();
      }

      if(typeof drawMaze === 'function') drawMaze();
      if(typeof updateMapStatusPanel === 'function') updateMapStatusPanel();
      return;
    }

    if(
      state.floor === 1 &&
      state.stairs &&
      p.mapX === state.stairs.x &&
      p.mapY === state.stairs.y
    ){
      if(typeof goToSecondFloor === 'function'){
        goToSecondFloor();
      }
      return;
    }

    if(
      state.floor === 2 &&
      state.boss &&
      p.mapX === state.boss.x &&
      p.mapY === state.boss.y
    ){
      const boss = findEnemyByIdSafe('boss');
      if(boss && typeof startBattle === 'function' && typeof cloneEnemy === 'function'){
        startBattle(cloneEnemy(boss), true);
      }
      return;
    }

    if(!state.player.metTamachan && Math.random() < 1/80){
      const tama = findEnemyByIdSafe('tamachan');
      if(tama && typeof startBattle === 'function' && typeof cloneEnemy === 'function'){
        startBattle(cloneEnemy(tama), false);
      }
      return;
    }

    const rate = typeof getEncounterRate === 'function' ? getEncounterRate() : 0.18;

    if(Math.random() < rate){
      const enemy = window.selectRandomMapEnemy();

      if(enemy && typeof startBattle === 'function' && typeof cloneEnemy === 'function'){
        console.log('[PO・TORO QUEST encounter]', {
          floor:state.floor,
          zone:safeGetProgressZone(),
          allowed:getAllowedEnemyIdsByCurrentZone(),
          selected:enemy.id,
          name:enemy.name
        });

        startBattle(cloneEnemy(enemy), false);
      }
    }
  };

  try{
    checkTileEvent = window.checkTileEvent;
  }catch(e){}

  window.potoroEnemyZoneReport = function(){
    const zone = safeGetProgressZone();
    const ids = getAllowedEnemyIdsByCurrentZone();
    const selected = window.selectRandomMapEnemy();

    const report = {
      installed:true,
      floor:state.floor,
      zone,
      label:typeof getMapProgressLabel === 'function' ? getMapProgressLabel() : zone,
      progress:typeof getMapDistanceProgress === 'function' ? Math.round(getMapDistanceProgress()*100) : null,
      allowedIds:ids,
      allowedNames:ids.map(id => findEnemyByIdSafe(id)?.name || id),
      sample:selected ? {id:selected.id,name:selected.name} : null
    };

    console.log('[PO・TORO QUEST enemy zone]', report);
    return report;
  };

  console.log('[PO・TORO QUEST] map-enemy-zone-lock.js loaded');
})();
