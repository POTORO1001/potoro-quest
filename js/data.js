/* =========================
   ポトロクエスト data.js（STEP11）
   データ参照・調整窓口 分離ファイル

   読み込み順：
   1. js/game.js
   2. js/data.js
   3. js/audio.js
   4. js/ui.js
   5. js/opening.js
   6. js/ending.js
   7. js/battle.js
   8. js/enemy.js
   9. js/equipment.js
   10. js/item.js
   11. js/map.js
   12. js/event.js
   13. js/magic.js

   重要：
   - game.js 内の const enemies / equipmentData / initialPlayer は再定義しません。
   - data.js は「検索・取得・調整用の窓口」を提供します。
   - 完全分割前の安全な中間段階です。
========================= */

/* ===== Data Namespace ===== */
const POTORO_DATA = {
  version: 'step11-data-split',
  enemyIds: {
    TEIJI: 'teiji',
    KUUFUKU: 'kuufuku',
    ZANGYO: 'zangyo',
    MEISOU: 'meisou',
    GEKIMU: 'gekimu',
    NEOCHI: 'neochi',
    DEISUI: 'deisui',
    SHISSEKI: 'shisseki',
    BOSS: 'boss',
    TAMACHAN: 'tamachan'
  },
  weaponIds: {
    ROD: 'rod',
    FRILL_BLADE: 'frill_blade',
    GOKITAKU_MACE: 'gokitaku_mace'
  },
  uniformIds: {
    MAID_HEADBAND: 'maid_headband',
    HEART_TIARA: 'heart_tiara',
    ROSE_RIBBON: 'rose_ribbon',
    WHITE_APRON: 'white_apron',
    LONG_MAID: 'long_maid',
    SERVICE_PROOF: 'service_proof',
    OSHI_PENDANT: 'oshi_pendant',
    LEGEND_NAMEPLATE: 'legend_nameplate',
    FIRST_MAID: 'first_maid'
  },
  itemIds: {
    OMURICE: 'omurice',
    TEA: 'tea',
    HORSE: 'horse'
  }
};

/* ===== Enemy Data Access ===== */
function getAllEnemies(){
  return enemies;
}

function getEnemyById(id){
  return enemies.find(enemy => enemy.id === id) || null;
}

function getBossEnemy(){
  return getEnemyById(POTORO_DATA.enemyIds.BOSS);
}

function getTamachanEnemy(){
  return getEnemyById(POTORO_DATA.enemyIds.TAMACHAN);
}

function getNormalEnemies(){
  return enemies.filter(enemy => !enemy.boss && !enemy.helper);
}

function getFloorEnemyPool(floor){
  if(floor === 1){
    return enemies.filter(enemy =>
      ['teiji','kuufuku','zangyo','meisou'].includes(enemy.id)
    );
  }

  return enemies.filter(enemy =>
    ['gekimu','neochi','deisui','shisseki'].includes(enemy.id)
  );
}

function patchEnemyData(id, patch){
  const enemy = getEnemyById(id);
  if(!enemy) return false;

  Object.assign(enemy, patch);
  return true;
}

function patchEnemyStats(id, stats){
  const enemy = getEnemyById(id);
  if(!enemy) return false;

  ['hp','maxHp','mp','maxMp','atk','def','spd','talk','exp'].forEach(key => {
    if(typeof stats[key] !== 'undefined'){
      enemy[key] = stats[key];
    }
  });

  return true;
}

/* ===== Equipment Data Access ===== */
function getEquipmentData(){
  return equipmentData;
}

function getAllWeapons(){
  return equipmentData.weapons;
}

function getAllUniforms(){
  return equipmentData.uniforms;
}

function getWeaponById(id){
  return equipmentData.weapons.find(item => item.id === id) || null;
}

function getUniformById(id){
  return equipmentData.uniforms.find(item => item.id === id) || null;
}

function getEquipmentById(id){
  return getWeaponById(id) || getUniformById(id);
}

function getUniformsBySlot(slot){
  return equipmentData.uniforms.filter(item => item.slot === slot);
}

function patchWeaponData(id, patch){
  const item = getWeaponById(id);
  if(!item) return false;

  Object.assign(item, patch);
  return true;
}

function patchUniformData(id, patch){
  const item = getUniformById(id);
  if(!item) return false;

  Object.assign(item, patch);
  return true;
}

function patchEquipmentData(id, patch){
  const item = getEquipmentById(id);
  if(!item) return false;

  Object.assign(item, patch);
  return true;
}

/* ===== Player Data Access ===== */
function getInitialPlayerData(){
  return initialPlayer;
}

function createFreshPlayer(){
  return makePlayer();
}

function patchInitialPlayer(patch){
  Object.assign(initialPlayer, patch);
  return true;
}

function patchInitialPlayerStats(stats){
  ['hp','maxHp','mp','maxMp','baseAtk','baseDef','baseSpd','baseTalk','nextExp'].forEach(key => {
    if(typeof stats[key] !== 'undefined'){
      initialPlayer[key] = stats[key];
    }
  });

  return true;
}

/* ===== Inventory Helpers ===== */
function hasWeapon(id){
  return state.player.inventory.weapons.includes(id);
}

function hasUniform(id){
  return state.player.inventory.uniforms.includes(id);
}

function addWeaponToInventory(id){
  if(!getWeaponById(id)) return false;

  const inv = state.player.inventory.weapons;

  if(!inv.includes(id)){
    inv.push(id);
  }

  return true;
}

function addUniformToInventory(id){
  if(!getUniformById(id)) return false;

  const inv = state.player.inventory.uniforms;

  if(!inv.includes(id)){
    inv.push(id);
  }

  return true;
}

function addEquipmentToInventory(id){
  if(getWeaponById(id)) return addWeaponToInventory(id);
  if(getUniformById(id)) return addUniformToInventory(id);
  return false;
}

/* ===== Item Data Access =====
   POTORO_ITEMS は item.js 読み込み後に利用できます。
========================= */
function getPotoroItems(){
  if(typeof POTORO_ITEMS === 'undefined') return null;
  return POTORO_ITEMS;
}

function getPotoroItemById(id){
  if(typeof POTORO_ITEMS === 'undefined') return null;
  return POTORO_ITEMS[id] || null;
}

/* ===== Debug / Balance Helpers ===== */
function getPlayerSnapshot(){
  const p = state.player;

  return {
    name: p.name,
    lv: p.lv,
    hp: p.hp,
    maxHp: p.maxHp,
    mp: p.mp,
    maxMp: p.maxMp,
    atk: totalAtk(),
    def: totalDef(),
    spd: totalSpd(),
    talk: totalTalk(),
    exp: p.exp,
    nextExp: p.nextExp,
    status: JSON.parse(JSON.stringify(p.status || {})),
    items: JSON.parse(JSON.stringify(p.items || {})),
    equip: JSON.parse(JSON.stringify(p.equip || {})),
    inventory: JSON.parse(JSON.stringify(p.inventory || {}))
  };
}

function getCurrentBattleSnapshot(){
  return {
    inBattle: state.inBattle,
    targetIndex: state.targetIndex,
    enemies: (state.enemiesInBattle || []).map(enemy => ({
      id: enemy.id,
      name: enemy.name,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      atk: enemy.atk,
      def: enemy.def,
      spd: enemy.spd,
      talk: enemy.talk,
      skill: enemy.skill || null,
      boss: !!enemy.boss,
      helper: !!enemy.helper
    }))
  };
}

function getMapSnapshot(){
  return {
    floor: state.floor,
    playerX: state.player.mapX,
    playerY: state.player.mapY,
    stairs: state.stairs,
    boss: state.boss,
    chests: JSON.parse(JSON.stringify(state.chests || []))
  };
}

/* ===== Safe Balance Patch Example =====
   必要になったら下のように使えます。

   patchEnemyStats('kuufuku', { hp:70, maxHp:70, atk:11 });
   patchWeaponData('frill_blade', { atk:7 });
   patchInitialPlayerStats({ maxHp:32, hp:32 });

   STEP11時点では自動変更は行いません。
========================= */
