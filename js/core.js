/* =========================
   ポトロクエスト core.js（STEP12）
   共通処理・状態管理補助 分離準備ファイル

   読み込み順：
   1. js/game.js
   2. js/core.js
   3. js/data.js
   4. js/audio.js
   5. js/ui.js
   6. js/opening.js
   7. js/ending.js
   8. js/battle.js
   9. js/enemy.js
   10. js/equipment.js
   11. js/item.js
   12. js/map.js
   13. js/event.js
   14. js/magic.js

   重要：
   - state / initialPlayer / enemies / equipmentData は game.js 側の const をそのまま使います。
   - core.js では再定義しません。
   - 完全分離前の安全な中間段階です。
========================= */

/* ===== Version / Core Info ===== */
const POTORO_CORE = {
  version: 'step12-core-prep',
  project: 'potoro-quest',
  mode: 'safe-bridge'
};

/* ===== Common Sleep ===== */
function sleep(ms){
  return new Promise(resolve => setTimeout(resolve,ms));
}

/* ===== Deep Clone ===== */
function deepClone(value){
  return JSON.parse(JSON.stringify(value));
}

/* ===== Player Factory ===== */
function makePlayer(){
  return deepClone(initialPlayer);
}

/* ===== State Guard ===== */
function ensureState(){
  if(!state.player) state.player = makePlayer();
  if(!state.enemiesInBattle) state.enemiesInBattle = [];
  if(!state.chests) state.chests = [];
  if(!state.maze) state.maze = [];
  if(typeof state.floor === 'undefined') state.floor = 1;
  if(typeof state.busy === 'undefined') state.busy = false;
  if(typeof state.started === 'undefined') state.started = false;
  if(typeof state.inBattle === 'undefined') state.inBattle = false;
  return state;
}

/* ===== Player Status Guard ===== */
function ensurePlayerStatus(){
  const p = state.player;

  if(!p.status){
    p.status = {
      sleep:0,
      confuse:0,
      defDown:0
    };
  }

  if(typeof p.status.sleep !== 'number') p.status.sleep = 0;
  if(typeof p.status.confuse !== 'number') p.status.confuse = 0;
  if(typeof p.status.defDown !== 'number') p.status.defDown = 0;

  return p.status;
}

/* ===== Player Inventory Guard ===== */
function ensurePlayerInventory(){
  const p = state.player;

  if(!p.inventory){
    p.inventory = {
      weapons:['rod'],
      uniforms:[]
    };
  }

  if(!Array.isArray(p.inventory.weapons)) p.inventory.weapons = ['rod'];
  if(!Array.isArray(p.inventory.uniforms)) p.inventory.uniforms = [];

  if(!p.equip){
    p.equip = {
      weapon:'rod',
      head:null,
      body:null,
      accessory:null
    };
  }

  return p.inventory;
}

/* ===== Player Items Guard ===== */
function ensurePlayerItems(){
  const p = state.player;

  if(!p.items){
    p.items = {
      omurice:0,
      tea:0,
      cool_tea:0,
      horse:0
    };
  }

  ['omurice','tea','cool_tea','horse'].forEach(key => {
    if(typeof p.items[key] !== 'number') p.items[key] = 0;
  });

  return p.items;
}

/* ===== Status Text ===== */
function statusText(){
  const s = ensurePlayerStatus();
  const parts = [];

  if(s.sleep > 0) parts.push(`😴 睡眠(${s.sleep})`);
  if(s.confuse > 0) parts.push(`💫 混乱(${s.confuse})`);
  if(s.defDown > 0) parts.push(`🔻 防御ダウン(${s.defDown})`);

  return parts.length ? parts.join(' ') : 'なし';
}

/* ===== Effective Defense ===== */
function effectiveDef(){
  const s = ensurePlayerStatus();
  const base = totalDef();

  return s.defDown > 0
    ? Math.max(0,Math.floor(base * .65))
    : base;
}

/* ===== Battle Enemy Helpers ===== */
function currentEnemy(){
  if(state.enemiesInBattle && state.enemiesInBattle.length){
    if(
      !state.enemiesInBattle[state.targetIndex] ||
      state.enemiesInBattle[state.targetIndex].hp <= 0
    ){
      const next = state.enemiesInBattle.findIndex(enemy => enemy.hp > 0);
      state.targetIndex = next >= 0 ? next : 0;
    }

    return state.enemiesInBattle[state.targetIndex] || state.enemy;
  }

  return state.enemy;
}

function aliveEnemies(){
  return (state.enemiesInBattle || []).filter(enemy => enemy.hp > 0);
}

function allEnemiesDefeated(){
  return aliveEnemies().length === 0;
}

function currentEnemyMaxSpd(){
  const alive = aliveEnemies();

  if(!alive.length) return 0;

  return Math.max(...alive.map(enemy => enemy.spd || 0));
}

function enemyActsFirstThisTurn(){
  return currentEnemyMaxSpd() > totalSpd();
}

async function enemyFirstCheck(){
  state.enemyActedFirst = false;

  if(enemyActsFirstThisTurn()){
    setMessage('相手のほうがすばやい！');
    updateUI();

    await sleep(600);
    await enemyTurn();

    state.enemyActedFirst = true;

    return state.player.hp <= 0;
  }

  return false;
}

/* ===== Enemy Clone ===== */
function cloneEnemy(base){
  const cloned = deepClone(base);
  cloned.sleepTurns = cloned.sleepTurns || 0;
  return cloned;
}

/* ===== Magic Damage Helpers ===== */
function magicPower(base){
  return Math.floor(base + totalTalk() * 1.6);
}

function moeMagicDamage(){
  const base = 25 + Math.floor(Math.random() * 6);
  const talkBonus = Math.max(0,Math.floor((totalTalk() - 7) * 1.2));

  return base + talkBonus;
}

/* ===== Map Mode ===== */
function isMapMode(){
  const map = document.getElementById('mapScreen');
  return !!map && !map.classList.contains('hidden') && !state.inBattle;
}

/* ===== State Reset Helpers ===== */
function resetRuntimeState(){
  state.player = makePlayer();
  state.enemy = null;
  state.enemiesInBattle = [];
  state.targetIndex = 0;
  state.lastDefeatedEnemy = null;
  state.busy = false;
  state.started = false;
  state.inBattle = false;
  state.enemyActedFirst = false;
  state.firstBattleHintShown = false;
  state.floor = 1;
  state.stairs = null;
  state.boss = {x:15,y:15};
  state.maze = [];
  state.chests = [];
}

function clearBattleState(){
  state.inBattle = false;
  state.enemy = null;
  state.enemiesInBattle = [];
  state.targetIndex = 0;
  state.lastDefeatedEnemy = null;
  state.enemyActedFirst = false;
  state.busy = false;
}

function clearPlayerTemporaryState(){
  const p = state.player;

  p.guarding = false;

  const s = ensurePlayerStatus();
  s.sleep = 0;
  s.confuse = 0;
  s.defDown = 0;

  if(typeof buffState !== 'undefined'){
    buffState.aura = 0;
    buffState.charge = 0;
  }
}

/* ===== Screen Helpers ===== */
function showScreen(id){
  const el = document.getElementById(id);
  if(el) el.classList.remove('hidden');
}

function hideScreen(id){
  const el = document.getElementById(id);
  if(el) el.classList.add('hidden');
}

function switchScreen(showId,hideIds=[]){
  hideIds.forEach(id => hideScreen(id));
  showScreen(showId);
}

/* ===== Random Helpers ===== */
function randomInt(min,max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(rate){
  return Math.random() < rate;
}

function pickRandom(list){
  if(!list || !list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function shuffleArray(list){
  return [...list].sort(() => Math.random() - .5);
}

/* ===== Clamp Helpers ===== */
function clamp(value,min,max){
  return Math.max(min,Math.min(max,value));
}

function clampHp(entity){
  entity.hp = clamp(entity.hp,0,entity.maxHp);
}

function clampMp(entity){
  entity.mp = clamp(entity.mp,0,entity.maxMp);
}

/* ===== Debug Helpers ===== */
function potoroDebugSnapshot(){
  return {
    core:POTORO_CORE,
    state:{
      started:state.started,
      busy:state.busy,
      inBattle:state.inBattle,
      floor:state.floor,
      targetIndex:state.targetIndex
    },
    player: typeof getPlayerSnapshot === 'function'
      ? getPlayerSnapshot()
      : deepClone(state.player),
    battle: typeof getCurrentBattleSnapshot === 'function'
      ? getCurrentBattleSnapshot()
      : {
          enemies: deepClone(state.enemiesInBattle || [])
        },
    map: typeof getMapSnapshot === 'function'
      ? getMapSnapshot()
      : {
          floor:state.floor,
          chests:deepClone(state.chests || [])
        }
  };
}

/* ===== Core Ready ===== */
ensureState();
ensurePlayerStatus();
ensurePlayerInventory();
ensurePlayerItems();

