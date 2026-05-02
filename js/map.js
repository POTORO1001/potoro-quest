/* =========================
   ポトロクエスト map.js（統合版）
   bugfix.js / map-ui-fix.js 吸収済み

   吸収内容：
   - 1マス移動固定
   - 二重イベント発火対策
   - マップ上で紅茶使用可能
   - マップ画面ステータス表示
   - マップステータス自動更新

   置き換え対象：
   js/map.js

   削除対象：
   js/bugfix.js
   js/map-ui-fix.js
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

  setTimeout(() => {
    potoroMoveGuardLocked = false;
  },130);

  return true;
}

/* ===== Map Canvas Helper ===== */
function getMapCanvas(){
  return document.getElementById('mapCanvas');
}

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

      if(
        nx > 0 &&
        ny > 0 &&
        nx < MAZE_W - 1 &&
        ny < MAZE_H - 1 &&
        maze[ny][nx] === 1
      ){
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
  visionRange:2,
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

  ensureVisibilityMaps();

  state.visibleMap = createVisibilityMap();

  const px = state.player.mapX;
  const py = state.player.mapY;
  const range = POTORO_FOG_CONFIG.visionRange;

  for(let y=py-range;y<=py+range;y++){
    for(let x=px-range;x<=px+range;x++){
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
function makeMaze(){
  setupFloor(1);
}

/* ===== Floor Setup ===== */
function setupFloor(floor){
  state.floor = floor;
  state.maze = generateRandomMaze();

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
}

/* ===== Floor Label ===== */
function updateFloorLabel(){
  const label = document.getElementById('floorLabel');
  if(label) label.textContent = `${state.floor}F`;
}

/* ===== Find Farthest Tile ===== */
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

/* ===== Chest Placement ===== */
function placeChests(){
  state.chests = [];

  const floors = [];

  for(let y=1;y<MAZE_H-1;y++){
    for(let x=1;x<MAZE_W-1;x++){
      const isStart = (x===1 && y===1);
      const isBoss = (x===state.boss.x && y===state.boss.y);
      const isStairs = (state.stairs && x===state.stairs.x && y===state.stairs.y);

      if(state.maze[y][x] === 0 && !isStart && !isBoss && !isStairs){
        floors.push({x,y});
      }
    }
  }

  floors.sort(() => Math.random() - .5);

  state.chests = floors.slice(0,4).map((point,index) => ({
    ...point,
    opened:false,
    id:`${state.floor}-${index}`
  }));
}

/* ===== Draw Maze ===== */
function drawMaze(){
  if(!mapCtx) return;

  if(typeof updateVisibility === 'function'){
    updateVisibility();
  }

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

      if(state.maze[y][x]===1){
        mapCtx.fillStyle = visible ? '#172033' : '#0b1120';
      }else{
        mapCtx.fillStyle = visible ? '#8a6b3a' : '#3f321f';
      }

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

  /* ===== 宝箱：探索済みまたは視界内のみ表示 ===== */
  for(const chest of state.chests){
    if(chest.opened) continue;
    if(!isTileVisible(chest.x,chest.y) && !isTileExplored(chest.x,chest.y)) continue;

    mapCtx.fillStyle = isTileVisible(chest.x,chest.y) ? '#facc15' : '#7c5f13';
    mapCtx.fillRect(chest.x*size+size*.25,chest.y*size+size*.32,size*.5,size*.42);
  }

  /* ===== 階段：見えている/探索済みの時だけ表示 ===== */
  if(state.floor===1 && state.stairs){
    if(isTileVisible(state.stairs.x,state.stairs.y) || isTileExplored(state.stairs.x,state.stairs.y)){
      mapCtx.fillStyle = isTileVisible(state.stairs.x,state.stairs.y) ? '#a78bfa' : '#5b4a8c';
      mapCtx.fillRect(state.stairs.x*size+size*.2,state.stairs.y*size+size*.2,size*.6,size*.6);

      mapCtx.fillStyle = '#fff';
      mapCtx.font = `${Math.floor(size*.55)}px sans-serif`;
      mapCtx.textAlign = 'center';
      mapCtx.textBaseline = 'middle';
      mapCtx.fillText('⇧',state.stairs.x*size+size/2,state.stairs.y*size+size/2);
    }
  }

  /* ===== ボス：見えている/探索済みの時だけ表示 ===== */
  if(state.floor===2){
    if(isTileVisible(state.boss.x,state.boss.y) || isTileExplored(state.boss.x,state.boss.y)){
      mapCtx.fillStyle = isTileVisible(state.boss.x,state.boss.y) ? '#dc2626' : '#6f1d1b';
      mapCtx.fillRect(state.boss.x*size+size*.25,state.boss.y*size+size*.25,size*.5,size*.5);
    }
  }

  /* ===== プレイヤー：常に表示 ===== */
  mapCtx.fillStyle = '#ff7ad6';
  mapCtx.beginPath();
  mapCtx.arc(state.player.mapX*size+size/2,state.player.mapY*size+size/2,size*.32,0,Math.PI*2);
  mapCtx.fill();

  /* ===== 現在地周辺の光 ===== */
  if(POTORO_FOG_CONFIG.enabled){
    const gradient = mapCtx.createRadialGradient(
      state.player.mapX*size+size/2,
      state.player.mapY*size+size/2,
      size*.2,
      state.player.mapX*size+size/2,
      state.player.mapY*size+size/2,
      size*2.4
    );

    gradient.addColorStop(0,'rgba(255,255,255,.10)');
    gradient.addColorStop(1,'rgba(255,255,255,0)');

    mapCtx.fillStyle = gradient;
    mapCtx.fillRect(0,0,cvs.width,cvs.height);
  }
}

/* ===== Draw Parts ===== */
function drawChests(ctx,size){
  for(const chest of state.chests){
    if(chest.opened) continue;

    ctx.fillStyle = '#facc15';
    ctx.fillRect(
      chest.x*size+size*.25,
      chest.y*size+size*.32,
      size*.5,
      size*.42
    );
  }
}

function drawStairs(ctx,size){
  if(state.floor !== 1 || !state.stairs) return;

  ctx.fillStyle = '#a78bfa';
  ctx.fillRect(
    state.stairs.x*size+size*.2,
    state.stairs.y*size+size*.2,
    size*.6,
    size*.6
  );

  ctx.fillStyle = '#fff';
  ctx.font = `${Math.floor(size*.55)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    '⇧',
    state.stairs.x*size+size/2,
    state.stairs.y*size+size/2
  );
}

function drawBossMark(ctx,size){
  if(state.floor !== 2) return;

  ctx.fillStyle = '#dc2626';
  ctx.fillRect(
    state.boss.x*size+size*.25,
    state.boss.y*size+size*.25,
    size*.5,
    size*.5
  );
}

function drawPlayerMark(ctx,size){
  ctx.fillStyle = '#ff7ad6';
  ctx.beginPath();
  ctx.arc(
    state.player.mapX*size+size/2,
    state.player.mapY*size+size/2,
    size*.32,
    0,
    Math.PI*2
  );
  ctx.fill();
}

/* ===== Map Message ===== */
function setMapMessage(text){
  const el = document.getElementById('mapMessage');
  if(el) el.textContent = text;
}

/* ===== Move Player：1マス固定 ===== */
function movePlayer(dx,dy){
  if(state.inBattle || state.busy) return;
  if(!potoroCanMoveOneStep()) return;

  dx = Math.max(-1,Math.min(1,dx));
  dy = Math.max(-1,Math.min(1,dy));

  const nx = state.player.mapX + dx;
  const ny = state.player.mapY + dy;

  if(nx < 0 || ny < 0 || nx >= MAZE_W || ny >= MAZE_H) return;

  if(state.maze[ny][nx] === 1){
    setMapMessage('壁です。別の道を進みましょう。');
    return;
  }

state.player.mapX=nx;
state.player.mapY=ny;
updateVisibility();
drawMaze();
checkTileEvent();
}

/* ===== Floor Change ===== */
function goToSecondFloor(){
  setupFloor(2);
}

/* ===== Map Chest Reward ===== */
function giveMapChestEquipment(){
  if(typeof giveMapTreasureEquipment === 'function'){
    giveMapTreasureEquipment();
    return;
  }

  setMapMessage('宝箱を開けた！');
}

/* ===== Tile Event ===== */
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
    return;
  }

  if(
    state.floor === 1 &&
    state.stairs &&
    p.mapX === state.stairs.x &&
    p.mapY === state.stairs.y
  ){
    goToSecondFloor();
    return;
  }

  if(
    state.floor === 2 &&
    p.mapX === state.boss.x &&
    p.mapY === state.boss.y
  ){
    startBattle(cloneEnemy(enemies.find(enemy => enemy.id === 'boss')), true);
    return;
  }

  if(!state.player.metTamachan && Math.random() < 1/80){
    startBattle(cloneEnemy(enemies.find(enemy => enemy.id === 'tamachan')), false);
    return;
  }

  if(Math.random() < getEncounterRate()){
    const enemy = selectRandomMapEnemy();
    startBattle(cloneEnemy(enemy), false);
  }else{
  }
}

/* ===== Encounter Helpers ===== */
function getEncounterRate(){
  return 0.18;
}

function selectRandomMapEnemy(){
  let zone;

  if(state.floor === 1){
    zone = enemies.filter(enemy =>
      ['teiji','kuufuku','zangyo','meisou'].includes(enemy.id)
    );
  }else{
    zone = enemies.filter(enemy =>
      ['gekimu','neochi','deisui','shisseki'].includes(enemy.id)
    );
  }

  return zone[Math.floor(Math.random()*zone.length)];
}

/* ===== Map Regenerate Helper ===== */
function regenerateCurrentFloor(){
  setupFloor(state.floor || 1);
}

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
  if(message){
    message.insertAdjacentElement('afterend',panel);
  }else{
    mapPanel.appendChild(panel);
  }

  return panel;
}

function updateMapStatusPanel(){
  const panel = createMapStatusPanelIfNeeded();
  if(!panel || !state || !state.player) return;

  const p = state.player;
  const status = typeof statusText === 'function' ? statusText() : 'なし';

  panel.innerHTML = `
    <div class="map-status-grid">
      <div>HP <strong>${p.hp}/${p.maxHp}</strong></div>
      <div>MP <strong>${p.mp}/${p.maxMp}</strong></div>
    </div>
    <div class="map-status-line">状態：${status}</div>
  `;
}

/* ==================================================
   マップ上どうぐ使用
================================================== */

function getMapItemAmount(kind,fallback){
  if(typeof POTORO_ITEMS !== 'undefined' && POTORO_ITEMS[kind]){
    return POTORO_ITEMS[kind].amount || fallback;
  }

  if(kind === 'omurice') return 40;
  if(kind === 'tea') return 14;

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
    if((p.items.omurice || 0) <= 0){
      potoroMapItemFail('オムライスは持っていない！');
      return;
    }

    if(p.hp >= p.maxHp){
      potoroMapItemFail('HPはすでに満タンです！');
      return;
    }

    p.items.omurice--;

    const heal = Math.min(getMapItemAmount('omurice',40),p.maxHp - p.hp);
    p.hp += heal;

    setMapMessage(`オムライスを食べた！ HPが ${heal} 回復！`);
    if(typeof seHeal === 'function') seHeal();
    updateMapStatusPanel();
    return;
  }

  if(kind === 'tea'){
    if((p.items.tea || 0) <= 0){
      potoroMapItemFail('紅茶は持っていない！');
      return;
    }

    if(p.mp >= p.maxMp){
      potoroMapItemFail('MPはすでに満タンです！');
      return;
    }

    p.items.tea--;

    const healMp = Math.min(getMapItemAmount('tea',14),p.maxMp - p.mp);
    p.mp += healMp;

    setMapMessage(`紅茶を飲んだ！ MPが ${healMp} 回復！`);
    if(typeof seHeal === 'function') seHeal();
    updateMapStatusPanel();
    return;
  }

  if(kind === 'horse'){
    potoroMapItemFail('くろれきしは戦闘中のみ使えます！');
  }
}

/* useItem をマップ時だけ分岐 */
const _potoroMapOriginalUseItem = useItem;

useItem = async function(kind){
  if(typeof isMapMode === 'function' && isMapMode()){
    return useMapItem(kind);
  }

  return _potoroMapOriginalUseItem(kind);
};

/* どうぐメニュー補正 */
function getMapItemLabel(kind){
  const p = state.player;
  const items = p.items || {};

  if(kind === 'omurice') return `オムライス　HP回復　残り${items.omurice || 0}`;
  if(kind === 'tea') return `紅茶　MP回復　残り${items.tea || 0}`;
  if(kind === 'horse') return `くろれきし　戦闘中のみ　残り${items.horse || 0}`;

  return kind;
}

const _potoroMapOriginalOpenSubMenu = openSubMenu;

openSubMenu = function(kind){
  _potoroMapOriginalOpenSubMenu(kind);

  if(kind !== 'item') return;

  const title = document.getElementById('subMenuTitle');
  const body = document.getElementById('subMenuBody');

  if(!title || !body) return;

  title.textContent = 'どうぐ';
  body.innerHTML = '';

  ['omurice','tea','horse'].forEach(itemKind => {
    const btn = document.createElement('button');
    btn.textContent = getMapItemLabel(itemKind);
    btn.onclick = () => useItem(itemKind);
    body.appendChild(btn);
  });
};

function initMapStatusPanel(){
  createMapStatusPanelIfNeeded();
  updateMapStatusPanel();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded',initMapStatusPanel,{once:true});
}else{
  initMapStatusPanel();
}
