/* =========================
   ポトロクエスト map.js（修正版・完全差し替え用）

   差し替え対象：js/map.js
   内容：1マス移動 / フォグ・オブ・ウォー / 円形視界 / 宝箱処理 / マップHP・MP・状態表示
========================= */

/* ===== Move Guard ===== */
let potoroMoveGuardLocked = false;
let potoroMoveGuardLastAt = 0;

function potoroCanMoveOneStep(){
  const now = Date.now();
  if(potoroMoveGuardLocked) return false;
  if(now - potoroMoveGuardLastAt < 130) return false;
  potoroMoveGuardLocked = true;
  potoroMoveGuardLastAt = now;
  setTimeout(() => { potoroMoveGuardLocked = false; },130);
  return true;
}

/* ===== Map Canvas Helper ===== */
function getMapCanvas(){ return document.getElementById('mapCanvas'); }
function getMapContext(){
  const canvas = getMapCanvas();
  return canvas ? canvas.getContext('2d') : null;
}

/* ===== Maze Generate ===== */
function generateRandomMaze(){
  const maze = Array.from({length:MAZE_H}, () => Array(MAZE_W).fill(1));
  function carve(x,y){
    maze[y][x] = 0;
    const dirs = [[2,0],[-2,0],[0,2],[0,-2]].sort(() => Math.random() - .5);
    for(const [dx,dy] of dirs){
      const nx = x + dx;
      const ny = y + dy;
      if(nx > 0 && ny > 0 && nx < MAZE_W - 1 && ny < MAZE_H - 1 && maze[ny][nx] === 1){
        maze[y + dy / 2][x + dx / 2] = 0;
        carve(nx,ny);
      }
    }
  }
  carve(1,1);
  return maze;
}

/* ===== Fog of War Settings ===== */
const POTORO_FOG_CONFIG = {
  enabled:true,
  visionRange:2.5,
  showExplored:true
};

function createVisibilityMap(){
  return Array.from({length:MAZE_H},()=>Array(MAZE_W).fill(false));
}

function ensureVisibilityMaps(){
  if(!state.visibleMap) state.visibleMap = createVisibilityMap();
  if(!state.exploredMap) state.exploredMap = createVisibilityMap();
}

function resetVisibilityMaps(){
  state.visibleMap = createVisibilityMap();
  state.exploredMap = createVisibilityMap();
}

function updateVisibility(){
  ensureVisibilityMaps();

  if(!POTORO_FOG_CONFIG.enabled){
    state.visibleMap = createVisibilityMap();
    state.exploredMap = createVisibilityMap();
    for(let y=0;y<MAZE_H;y++){
      for(let x=0;x<MAZE_W;x++){
        state.visibleMap[y][x] = true;
        state.exploredMap[y][x] = true;
      }
    }
    return;
  }

  state.visibleMap = createVisibilityMap();
  const px = state.player.mapX;
  const py = state.player.mapY;
  const range = POTORO_FOG_CONFIG.visionRange;

  for(let y=Math.floor(py-range);y<=Math.ceil(py+range);y++){
    for(let x=Math.floor(px-range);x<=Math.ceil(px+range);x++){
      if(x<0 || y<0 || x>=MAZE_W || y>=MAZE_H) continue;
      const dist = Math.sqrt((px-x)*(px-x) + (py-y)*(py-y));
      if(dist <= range){
        state.visibleMap[y][x] = true;
        state.exploredMap[y][x] = true;
      }
    }
  }
}

function isTileVisible(x,y){
  if(!POTORO_FOG_CONFIG.enabled) return true;
  ensureVisibilityMaps();
  return !!state.visibleMap[y]?.[x];
}

function isTileExplored(x,y){
  if(!POTORO_FOG_CONFIG.enabled) return true;
  ensureVisibilityMaps();
  return !!state.exploredMap[y]?.[x];
}

/* ===== New Game Map ===== */
function makeMaze(){ setupFloor(1); }

/* ===== Map Progress by Distance ===== */
function buildDistanceMapFromStart(){
  const distMap = Array.from({length:MAZE_H},()=>Array(MAZE_W).fill(-1));
  const queue = [];
  const sx = 1;
  const sy = 1;

  if(!state.maze || !state.maze[sy] || state.maze[sy][sx] !== 0){
    state.mapDistanceMap = distMap;
    state.mapMaxDistance = 1;
    return;
  }

  distMap[sy][sx] = 0;
  queue.push({x:sx,y:sy});

  const dirs = [
    {x:1,y:0},
    {x:-1,y:0},
    {x:0,y:1},
    {x:0,y:-1}
  ];

  let maxDistance = 0;

  while(queue.length){
    const cur = queue.shift();

    for(const d of dirs){
      const nx = cur.x + d.x;
      const ny = cur.y + d.y;

      if(nx < 0 || ny < 0 || nx >= MAZE_W || ny >= MAZE_H) continue;
      if(state.maze[ny][nx] !== 0) continue;
      if(distMap[ny][nx] !== -1) continue;

      distMap[ny][nx] = distMap[cur.y][cur.x] + 1;
      maxDistance = Math.max(maxDistance,distMap[ny][nx]);
      queue.push({x:nx,y:ny});
    }
  }

  state.mapDistanceMap = distMap;
  state.mapMaxDistance = Math.max(1,maxDistance);
}

function getMapDistanceProgress(){
  if(!state.mapDistanceMap || !state.mapMaxDistance){
    buildDistanceMapFromStart();
  }

  const x = state.player.mapX;
  const y = state.player.mapY;
  const dist = state.mapDistanceMap?.[y]?.[x];

  if(dist === undefined || dist < 0) return 0;

  return Math.max(0,Math.min(1,dist / state.mapMaxDistance));
}

function getMapProgressZone(){
  const progress = getMapDistanceProgress();

  if(progress <= 0.25) return 'early';
  if(progress <= 0.65) return 'middle';
  return 'late';
}

function getMapProgressLabel(){
  const zone = getMapProgressZone();

  if(zone === 'early') return '序盤';
  if(zone === 'middle') return '中盤';
  return '終盤';
}

function potoroMapProgressReport(){
  const progress = getMapDistanceProgress();
  const zone = getMapProgressZone();
  const report = {
    floor:state.floor,
    x:state.player.mapX,
    y:state.player.mapY,
    distance:state.mapDistanceMap?.[state.player.mapY]?.[state.player.mapX] ?? null,
    maxDistance:state.mapMaxDistance || null,
    progress:Math.round(progress * 100),
    zone,
    label:getMapProgressLabel()
  };

  console.log('[PO・TORO QUEST map progress]',report);
  return report;
}

/* ===== Floor Setup ===== */
function setupFloor(floor){
  state.floor = floor;
  state.maze = generateRandomMaze();

  buildDistanceMapFromStart();
  state.player.mapX = 1;
  state.player.mapY = 1;

  resetVisibilityMaps();
  updateVisibility();

  const far = findFarthest();
  if(floor === 1){
    state.stairs = {x:far.x,y:far.y};
    state.boss = {x:-1,y:-1};
  }else{
    state.stairs = null;
    state.boss = {x:far.x,y:far.y};
  }

  placeChests();
  updateFloorLabel();
  drawMaze();
  playMapBgm();
  updateMapStatusPanel();
  setMapMessage('');
}

function updateFloorLabel(){
  const label = document.getElementById('floorLabel');
  if(label) label.textContent = `${state.floor}F`;
}

function findFarthest(){
  let best = {x:1,y:1,d:0};
  for(let y=1;y<MAZE_H-1;y++){
    for(let x=1;x<MAZE_W-1;x++){
      if(state.maze[y][x] === 0){
        const d = Math.abs(x-1) + Math.abs(y-1);
        if(d > best.d) best = {x,y,d};
      }
    }
  }
  return {x:best.x,y:best.y};
}

function placeChests(){
  state.chests = [];
  const floors = [];
  for(let y=1;y<MAZE_H-1;y++){
    for(let x=1;x<MAZE_W-1;x++){
      const isStart = (x===1 && y===1);
      const isBoss = (x===state.boss.x && y===state.boss.y);
      const isStairs = (state.stairs && x===state.stairs.x && y===state.stairs.y);
      if(state.maze[y][x] === 0 && !isStart && !isBoss && !isStairs){ floors.push({x,y}); }
    }
  }
  floors.sort(() => Math.random() - .5);
  const chestCount = state.floor === 1 ? 5 : 7;
  state.chests = floors.slice(0,chestCount).map((point,index) => ({...point, opened:false, id:`${state.floor}-${index}`}));
}

function drawMaze(){
  const cvs = getMapCanvas();
  const mapCtx = getMapContext();
  if(!cvs || !mapCtx) return;

  updateVisibility();
  mapCtx.clearRect(0,0,cvs.width,cvs.height);
  const size = cvs.width / MAZE_W;

  for(let y=0;y<MAZE_H;y++){
    for(let x=0;x<MAZE_W;x++){
      const visible = isTileVisible(x,y);
      const explored = isTileExplored(x,y);
      if(!visible && !explored){
        mapCtx.fillStyle = '#030712';
        mapCtx.fillRect(x*size,y*size,size,size);
        continue;
      }
      if(state.maze[y][x]===1){ mapCtx.fillStyle = visible ? '#172033' : '#0b1120'; }
      else{ mapCtx.fillStyle = visible ? '#8a6b3a' : '#3f321f'; }
      mapCtx.fillRect(x*size,y*size,size,size);
      if(state.maze[y][x]===0){
        mapCtx.fillStyle = visible ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.03)';
        mapCtx.fillRect(x*size,y*size+size*.65,size,1);
      }
      if(!visible && explored){
        mapCtx.fillStyle = 'rgba(0,0,0,.42)';
        mapCtx.fillRect(x*size,y*size,size,size);
      }
    }
  }

  for(const chest of state.chests){
    if(chest.opened) continue;
    if(!isTileVisible(chest.x,chest.y)) continue;
    mapCtx.fillStyle = '#facc15';
    mapCtx.fillRect(chest.x*size+size*.25,chest.y*size+size*.32,size*.5,size*.42);
  }

  if(state.floor===1 && state.stairs && isTileVisible(state.stairs.x,state.stairs.y)){
    mapCtx.fillStyle = '#a78bfa';
    mapCtx.fillRect(state.stairs.x*size+size*.2,state.stairs.y*size+size*.2,size*.6,size*.6);
    mapCtx.fillStyle = '#fff';
    mapCtx.font = `${Math.floor(size*.55)}px sans-serif`;
    mapCtx.textAlign = 'center';
    mapCtx.textBaseline = 'middle';
    mapCtx.fillText('⇧',state.stairs.x*size+size/2,state.stairs.y*size+size/2);
  }

  if(state.floor===2 && isTileVisible(state.boss.x,state.boss.y)){
    mapCtx.fillStyle = '#dc2626';
    mapCtx.fillRect(state.boss.x*size+size*.25,state.boss.y*size+size*.25,size*.5,size*.5);
  }

  mapCtx.fillStyle = '#ff7ad6';
  mapCtx.beginPath();
  mapCtx.arc(state.player.mapX*size+size/2,state.player.mapY*size+size/2,size*.32,0,Math.PI*2);
  mapCtx.fill();

  if(POTORO_FOG_CONFIG.enabled){
    const gradient = mapCtx.createRadialGradient(
      state.player.mapX*size+size/2,
      state.player.mapY*size+size/2,
      size*.2,
      state.player.mapX*size+size/2,
      state.player.mapY*size+size/2,
      size*2.7
    );
    gradient.addColorStop(0,'rgba(255,255,255,.12)');
    gradient.addColorStop(1,'rgba(255,255,255,0)');
    mapCtx.fillStyle = gradient;
    mapCtx.fillRect(0,0,cvs.width,cvs.height);
  }
}

function setMapMessage(text){
  const el = document.getElementById('mapMessage');
  if(el) el.textContent = text;
}

function movePlayer(dx,dy){
  if(state.inBattle || state.busy) return;
  if(!potoroCanMoveOneStep()) return;

  dx = Math.max(-1,Math.min(1,dx));
  dy = Math.max(-1,Math.min(1,dy));
  const nx = state.player.mapX + dx;
  const ny = state.player.mapY + dy;

  if(nx < 0 || ny < 0 || nx >= MAZE_W || ny >= MAZE_H) return;
  if(state.maze[ny][nx] === 1){ setMapMessage('壁です。別の道を進みましょう。'); return; }

  state.player.mapX = nx;
  state.player.mapY = ny;
  updateVisibility();
  drawMaze();
  updateMapStatusPanel();
  checkTileEvent();
}

function goToSecondFloor(){ setupFloor(2); }

function giveMapChestEquipment(){
  if(typeof giveMapTreasureEquipment === 'function'){
    giveMapTreasureEquipment();
    return;
  }
  setMapMessage('宝箱を開けた！');
}

/* ===== Floor / Zone Enemy Selection ===== */
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
  const zone = getMapProgressZone();
  if(zone === 'early' || zone === 'middle' || zone === 'late') return zone;
  return 'early';
}

function findEnemyByIdSafe(id){
  return enemies.find(enemy => enemy.id === id) || null;
}

function cloneEnemySafe(enemy){
  return typeof cloneEnemy === 'function'
    ? cloneEnemy(enemy)
    : JSON.parse(JSON.stringify(enemy));
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
    return findEnemyByIdSafe('teiji') || enemies[0] || null;
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

function buildEnemyParty(enemyBase){
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
}

function checkTileEvent(){
  const p = state.player;

  const chest = state.chests.find(chest =>
    !chest.opened &&
    chest.x === p.mapX &&
    chest.y === p.mapY
  );

  if(chest){
    chest.opened = true;
    giveMapChestEquipment();
    drawMaze();
    updateMapStatusPanel();
    return;
  }

  if(state.floor === 1 && state.stairs && p.mapX === state.stairs.x && p.mapY === state.stairs.y){
    goToSecondFloor();
    return;
  }

  if(state.floor === 2 && p.mapX === state.boss.x && p.mapY === state.boss.y){
    const boss = findEnemyByIdSafe('boss');
    if(boss) startBattle(cloneEnemySafe(boss), true);
    return;
  }

  if(!state.player.metTamachan && Math.random() < 1/80){
    const tama = findEnemyByIdSafe('tamachan');
    if(tama) startBattle(cloneEnemySafe(tama), false);
    return;
  }

  if(Math.random() < getEncounterRate()){
    const enemy = selectRandomMapEnemy();
    if(enemy) startBattle(cloneEnemySafe(enemy), false);
  }
}

function getEncounterRate(){ return 0.18; }

function selectRandomMapEnemy(){
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
}

function potoroEnemyZoneReport(){
  const zone = safeGetProgressZone();
  const ids = getAllowedEnemyIdsByCurrentZone();
  const selected = selectRandomMapEnemy();
  const party = selected ? buildEnemyParty(selected).map(enemy => ({
    id:enemy.id,
    name:enemy.name
  })) : [];

  const report = {
    installed:true,
    version:'enemy-zone-lock-integrated',
    floor:getCurrentFloorSafe(),
    zone,
    label:getMapProgressLabel(),
    progress:Math.round(getMapDistanceProgress()*100),
    allowedIds:ids,
    allowedNames:ids.map(id => findEnemyByIdSafe(id)?.name || id),
    sample:selected ? {id:selected.id,name:selected.name} : null,
    sampleParty:party
  };

  console.log('[PO・TORO QUEST enemy zone]', report);
  return report;
}

function regenerateCurrentFloor(){ setupFloor(state.floor || 1); }

/* ==================================================
   マップステータス表示
================================================== */
function createMapStatusPanelIfNeeded(){
  const mapPanel = document.querySelector('.map-panel');
  if(!mapPanel) return null;
  let panel = document.getElementById('mapStatusPanel');
  if(panel) return panel;
  panel = document.createElement('div');
  panel.id = 'mapStatusPanel';
  panel.className = 'map-status-panel';
  const message = document.getElementById('mapMessage');
  if(message){ message.insertAdjacentElement('afterend',panel); }
  else{ mapPanel.appendChild(panel); }
  return panel;
}

function updateMapStatusPanel(){
  const panel = createMapStatusPanelIfNeeded();
  if(!panel || !state || !state.player) return;
  const p = state.player;
  const status = buildPlayerMapStatusText();
  panel.innerHTML = `
    <div class="map-status-grid">
      <div>HP <strong>${p.hp}/${p.maxHp}</strong></div>
      <div>MP <strong>${p.mp}/${p.maxMp}</strong></div>
    </div>
    <div class="map-status-line">状態：${status}</div>
  `;
}

function normalizeStatusValue(value){
  return Number(value || 0);
}

function buildPlayerMapStatusText(){
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
  if(el) el.textContent = `状態：${buildPlayerMapStatusText()}`;
}

function syncMapStatus(){
  updateMapStatusPanel();
  syncBattleStatusText();
}

const originalMapStatusText = statusText;
statusText = function(){
  const safe = buildPlayerMapStatusText();

  try{
    const original = originalMapStatusText.apply(this, arguments);
    if(original && original !== 'なし') return original;
  }catch(e){}

  return safe;
};

const originalMapUpdateUI = updateUI;
updateUI = function(){
  const result = originalMapUpdateUI.apply(this, arguments);
  syncMapStatus();
  return result;
};

const originalMapEndBattleToMap = endBattleToMap;
endBattleToMap = function(){
  const result = originalMapEndBattleToMap.apply(this, arguments);

  setTimeout(syncMapStatus,0);
  setTimeout(syncMapStatus,250);

  return result;
};

function potoroMapStatusSyncReport(){
  const p = state && state.player ? state.player : null;
  const report = {
    installed:true,
    version:'hp-mp-status-integrated',
    mapVisible:!!document.getElementById('mapScreen') && !document.getElementById('mapScreen').classList.contains('hidden'),
    hp:p ? p.hp : null,
    maxHp:p ? p.maxHp : null,
    mp:p ? p.mp : null,
    maxMp:p ? p.maxMp : null,
    statusText:buildPlayerMapStatusText(),
    rawStatus:p ? (p.status || p.statusEffects || null) : null,
    itemBuffs:p ? (p.itemBuffs || null) : null,
    buffs:p ? (p.buffs || null) : null
  };

  console.log('[PO・TORO QUEST map status sync]',report);
  return report;
}

function potoroForceMapStatusSync(){
  syncMapStatus();
  return potoroMapStatusSyncReport();
}

/* ==================================================
   マップ上どうぐ使用
================================================== */
function getMapItemAmount(kind,fallback){
  if(typeof POTORO_ITEMS !== 'undefined' && POTORO_ITEMS[kind]){ return POTORO_ITEMS[kind].amount || fallback; }
  if(kind === 'omurice') return 30;
  if(kind === 'tea') return 10;
  return fallback;
}

function potoroMapItemFail(message){
  if(typeof setMapMessage === 'function') setMapMessage(message);
  else if(typeof setMessage === 'function') setMessage(message);
  state.busy = false;
  if(typeof setButtonsDisabled === 'function') setButtonsDisabled(false);
  updateMapStatusPanel();
}

async function useMapItem(kind){
  const p = state.player;
  if(!p.items) p.items = {};
  state.busy = false;

  if(kind === 'omurice'){
    if((p.items.omurice || 0) <= 0){ potoroMapItemFail('オムライスは持っていない！'); return; }
    if(p.hp >= p.maxHp){ potoroMapItemFail('HPはすでに満タンです！'); return; }
    p.items.omurice--;
    const heal = Math.min(getMapItemAmount('omurice',30),p.maxHp - p.hp);
    p.hp += heal;
    setMapMessage(`オムライスを食べた！ HPが ${heal} 回復！`);
    if(typeof seHeal === 'function') seHeal();
    updateMapStatusPanel();
    if(typeof updateUI === 'function') updateUI();
    return;
  }

  if(kind === 'tea'){
    if((p.items.tea || 0) <= 0){ potoroMapItemFail('紅茶は持っていない！'); return; }
    if(p.mp >= p.maxMp){ potoroMapItemFail('MPはすでに満タンです！'); return; }
    p.items.tea--;
    const healMp = Math.min(getMapItemAmount('tea',10),p.maxMp - p.mp);
    p.mp += healMp;
    setMapMessage(`紅茶を飲んだ！ MPが ${healMp} 回復！`);
    if(typeof seHeal === 'function') seHeal();
    updateMapStatusPanel();
    if(typeof updateUI === 'function') updateUI();
    return;
  }

  if(kind === 'horse'){
    potoroMapItemFail('くろれきしは戦闘中のみ使えます！');
    return;
  }

  if(window.__potoroMapOriginalUseItem) return window.__potoroMapOriginalUseItem(kind);
}

if(typeof useItem === 'function' && !window.__potoroMapUseItemPatched){
  window.__potoroMapUseItemPatched = true;
  window.__potoroMapOriginalUseItem = useItem;
  useItem = async function(kind){
    if(typeof isMapMode === 'function' && isMapMode()){
      if(['omurice','tea','horse'].includes(kind)) return useMapItem(kind);
    }
    return window.__potoroMapOriginalUseItem(kind);
  };
}

function getMapItemLabel(kind){
  if(typeof itemMenuLabel === 'function') return itemMenuLabel(kind);
  const p = state.player;
  const items = p.items || {};
  if(kind === 'omurice') return `オムライス　HP回復　残り${items.omurice || 0}`;
  if(kind === 'tea') return `紅茶　MP回復　残り${items.tea || 0}`;
  if(kind === 'horse') return `くろれきし　戦闘中のみ　残り${items.horse || 0}`;
  return kind;
}

if(typeof openSubMenu === 'function' && !window.__potoroMapOpenSubMenuPatched){
  window.__potoroMapOpenSubMenuPatched = true;
  const _potoroMapOriginalOpenSubMenu = openSubMenu;
  openSubMenu = function(kind){
    _potoroMapOriginalOpenSubMenu(kind);
    if(kind !== 'item') return;
    const title = document.getElementById('subMenuTitle');
    const body = document.getElementById('subMenuBody');
    if(!title || !body) return;
    title.textContent = 'どうぐ';
    body.innerHTML = '';
    const itemKinds = typeof ownedItemKinds === 'function' ? ownedItemKinds() : ['omurice','tea','horse'];
    itemKinds.forEach(itemKind => {
      const btn = document.createElement('button');
      btn.textContent = getMapItemLabel(itemKind);
      btn.onclick = () => useItem(itemKind);
      body.appendChild(btn);
    });
  };
}

function initMapStatusPanel(){
  createMapStatusPanelIfNeeded();
  updateMapStatusPanel();
}

function toggleMapFog(){
  POTORO_FOG_CONFIG.enabled = !POTORO_FOG_CONFIG.enabled;
  updateVisibility();
  drawMaze();
  return POTORO_FOG_CONFIG.enabled;
}

function setMapVisionRange(range){
  POTORO_FOG_CONFIG.visionRange = Math.max(1,Math.min(5,Number(range)||2.5));
  updateVisibility();
  drawMaze();
  return POTORO_FOG_CONFIG.visionRange;
}

function potoroMapReport(){
  const report = {
    floor:state.floor,
    player:{x:state.player.mapX,y:state.player.mapY},
    fog:POTORO_FOG_CONFIG,
    progress:typeof potoroMapProgressReport === 'function' ? {
      percent:Math.round(getMapDistanceProgress()*100),
      zone:getMapProgressZone(),
      label:getMapProgressLabel()
    } : null,
    chests:state.chests,
    stairs:state.stairs,
    boss:state.boss
  };
  console.log('[PO・TORO QUEST map]',report);
  return report;
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded',initMapStatusPanel,{once:true});
}else{
  initMapStatusPanel();
}

setInterval(() => {
  const map = document.getElementById('mapScreen');
  if(map && !map.classList.contains('hidden')){
    syncMapStatus();
  }
},300);
