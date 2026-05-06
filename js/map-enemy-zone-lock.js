/* =========================
   ポトロクエスト map-enemy-zone-lock.js
   BFS距離別 敵出現テーブル完全固定パッチ v2

   差し替え対象：
   js/map-enemy-zone-lock.js

   目的：
   - 1Fに2F敵が混ざる問題を防ぐ
   - 2Fに1F敵が混ざる問題を防ぐ
   - 2体出現時の追加敵も、現在フロア・現在ゾーンの許可敵だけに固定
========================= */

(function(){
  if(window.__potoroEnemyZoneLockV2Installed) return;
  window.__potoroEnemyZoneLockV2Installed = true;

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

  const POTORO_FLOOR_ENEMY_IDS = {
    1:['teiji','kuufuku','zangyo','meisou'],
    2:['neochi','gekimu','deisui','shisseki']
  };

  function getCurrentFloorSafe(){
    const floor = Number(state && state.floor ? state.floor : 1);
    return floor === 2 ? 2 : 1;
  }

  function safeGetProgressZone(){
    if(typeof getMapProgressZone === 'function'){
      const zone = getMapProgressZone();
      if(zone === 'early' || zone === 'middle' || zone === 'late') return zone;
    }
    return 'early';
  }

  function findEnemyByIdSafe(id){
    if(typeof enemies === 'undefined' || !Array.isArray(enemies)) return null;
    return enemies.find(enemy => enemy.id === id) || null;
  }

  function cloneEnemySafe(enemy){
    if(typeof cloneEnemy === 'function') return cloneEnemy(enemy);
    return JSON.parse(JSON.stringify(enemy));
  }

  function getAllowedEnemyIdsByCurrentZone(){
    const floor = getCurrentFloorSafe();
    const zone = safeGetProgressZone();
    const floorTable = POTORO_ENEMY_ZONE_TABLE[floor] || POTORO_ENEMY_ZONE_TABLE[1];
    return floorTable[zone] || floorTable.middle || floorTable.early;
  }

  function getAllowedEnemiesByCurrentZone(){
    return getAllowedEnemyIdsByCurrentZone()
      .map(id => findEnemyByIdSafe(id))
      .filter(Boolean);
  }

  function pickEnemyFromIds(ids){
    const candidates = ids
      .map(id => findEnemyByIdSafe(id))
      .filter(Boolean)
      .filter(enemy => !enemy.boss && !enemy.helper);

    if(!candidates.length){
      return findEnemyByIdSafe('teiji') || (Array.isArray(enemies) ? enemies[0] : null);
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function isEnemyAllowedOnCurrentFloor(enemy){
    if(!enemy) return false;
    if(enemy.boss || enemy.helper) return true;

    const floor = getCurrentFloorSafe();
    const floorIds = POTORO_FLOOR_ENEMY_IDS[floor] || POTORO_FLOOR_ENEMY_IDS[1];

    return floorIds.includes(enemy.id);
  }

  window.selectRandomMapEnemy = function(){
    const ids = getAllowedEnemyIdsByCurrentZone();
    const enemy = pickEnemyFromIds(ids);

    if(enemy && !isEnemyAllowedOnCurrentFloor(enemy)){
      console.warn('[PO・TORO QUEST enemy zone] blocked wrong-floor enemy', {
        floor:getCurrentFloorSafe(),
        enemy:enemy.id,
        name:enemy.name
      });

      return pickEnemyFromIds(ids);
    }

    return enemy;
  };

  try{
    selectRandomMapEnemy = window.selectRandomMapEnemy;
  }catch(e){}

  /*
    重要：
    game.js の buildEnemyParty() は、2体目を全通常敵から選ぶ実装になっている場合がある。
    それが「1Fに2F敵が混ざる」主原因になりやすいため、ここで上書きする。
  */
  window.buildEnemyParty = function(enemyBase){
    const main = cloneEnemySafe(enemyBase);

    if(main.boss || main.helper) return [main];

    const party = [main];

    if(Math.random() < 0.42){
      const allowed = getAllowedEnemiesByCurrentZone()
        .filter(enemy => enemy.id !== main.id)
        .filter(enemy => isEnemyAllowedOnCurrentFloor(enemy));

      const pool = allowed.length
        ? allowed
        : getAllowedEnemiesByCurrentZone().filter(enemy => isEnemyAllowedOnCurrentFloor(enemy));

      if(pool.length){
        const subBase = pool[Math.floor(Math.random() * pool.length)];
        party.push(cloneEnemySafe(subBase));
      }
    }

    return party;
  };

  try{
    buildEnemyParty = window.buildEnemyParty;
  }catch(e){}

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
      if(boss && typeof startBattle === 'function'){
        startBattle(cloneEnemySafe(boss), true);
      }
      return;
    }

    if(!state.player.metTamachan && Math.random() < 1/80){
      const tama = findEnemyByIdSafe('tamachan');
      if(tama && typeof startBattle === 'function'){
        startBattle(cloneEnemySafe(tama), false);
      }
      return;
    }

    const rate = typeof getEncounterRate === 'function' ? getEncounterRate() : 0.18;

    if(Math.random() < rate){
      const enemy = window.selectRandomMapEnemy();

      if(enemy && typeof startBattle === 'function'){
        console.log('[PO・TORO QUEST encounter]', {
          floor:getCurrentFloorSafe(),
          zone:safeGetProgressZone(),
          allowed:getAllowedEnemyIdsByCurrentZone(),
          selected:enemy.id,
          name:enemy.name
        });

        startBattle(cloneEnemySafe(enemy), false);
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
    const party = selected ? window.buildEnemyParty(selected).map(enemy => ({
      id:enemy.id,
      name:enemy.name
    })) : [];

    const report = {
      installed:true,
      version:'enemy-zone-lock-v2-party-fixed',
      floor:getCurrentFloorSafe(),
      zone,
      label:typeof getMapProgressLabel === 'function' ? getMapProgressLabel() : zone,
      progress:typeof getMapDistanceProgress === 'function' ? Math.round(getMapDistanceProgress()*100) : null,
      allowedIds:ids,
      allowedNames:ids.map(id => findEnemyByIdSafe(id)?.name || id),
      sample:selected ? {id:selected.id,name:selected.name} : null,
      sampleParty:party
    };

    console.log('[PO・TORO QUEST enemy zone]', report);
    return report;
  };

  console.log('[PO・TORO QUEST] map-enemy-zone-lock.js v2 loaded');
})();
