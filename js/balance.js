/* =========================
   ポトロクエスト balance.js（STEP16）
   バランス調整・難易度調整 窓口ファイル

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
   16. js/balance.js
   17. js/event.js
   18. js/magic.js
   19. js/compatibility.js

   目的：
   - 敵ステータス
   - 装備数値
   - アイテム効果
   - エンカウント率
   - 敵AI発動率
   - 初期プレイヤー値
   をこのファイルでまとめて調整できるようにします。

   重要：
   - 初期状態ではゲームバランスを変更しません。
   - 自動適用したい場合は POTORO_BALANCE.autoApply を true にしてください。
========================= */

/* ===== Balance Config ===== */
const POTORO_BALANCE = {
  version: 'step16-balance',
  autoApply: false,

  encounter: {
    rate: 0.18
  },

  enemyAi: {
    drainRate: 0.28,
    doubleRate: 0.24,
    confuseRate: 0.30,
    powerupRate: 0.28,
    sleepRate: 0.25,
    drunkRate: 0.35,
    drunkSelfHitRate: 0.35,
    defdownRate: 0.32,
    bossRate: 0.35
  },

  player: {
    // 初期値を変更したい場合だけ指定
    // 例：maxHp: 32, hp: 32
  },

  enemies: {
    // 例：
    // kuufuku: { hp:70, maxHp:70, atk:11 }
  },

  weapons: {
    // 例：
    // frill_blade: { atk:7 }
  },

  uniforms: {
    // 例：
    // first_maid: { def:30 }
  },

  items: {
    // 例：
    // omurice: { amount:40 }
  }
};

/* ===== Encounter Rate Override ===== */
function getEncounterRate(){
  return POTORO_BALANCE.encounter.rate;
}

/* ===== Enemy AI Config Apply ===== */
function applyEnemyAiBalance(){
  if(typeof POTORO_ENEMY_AI === 'undefined') return false;

  POTORO_ENEMY_AI.drain.rate = POTORO_BALANCE.enemyAi.drainRate;
  POTORO_ENEMY_AI.double.rate = POTORO_BALANCE.enemyAi.doubleRate;
  POTORO_ENEMY_AI.confuse.rate = POTORO_BALANCE.enemyAi.confuseRate;
  POTORO_ENEMY_AI.powerup.rate = POTORO_BALANCE.enemyAi.powerupRate;
  POTORO_ENEMY_AI.sleep.rate = POTORO_BALANCE.enemyAi.sleepRate;
  POTORO_ENEMY_AI.drunk.rate = POTORO_BALANCE.enemyAi.drunkRate;
  POTORO_ENEMY_AI.drunk.selfHitRate = POTORO_BALANCE.enemyAi.drunkSelfHitRate;
  POTORO_ENEMY_AI.defdown.rate = POTORO_BALANCE.enemyAi.defdownRate;
  POTORO_ENEMY_AI.boss.rate = POTORO_BALANCE.enemyAi.bossRate;

  return true;
}

/* ===== Player Balance Apply ===== */
function applyPlayerBalance(){
  if(!POTORO_BALANCE.player || !Object.keys(POTORO_BALANCE.player).length) return false;

  if(typeof patchInitialPlayerStats === 'function'){
    patchInitialPlayerStats(POTORO_BALANCE.player);
    return true;
  }

  Object.assign(initialPlayer,POTORO_BALANCE.player);
  return true;
}

/* ===== Enemy Status Apply ===== */
function applyEnemyStatusBalance(){
  const patches = POTORO_BALANCE.enemies || {};
  let count = 0;

  Object.keys(patches).forEach(id => {
    if(typeof patchEnemyStats === 'function'){
      if(patchEnemyStats(id,patches[id])) count++;
    }else if(typeof patchEnemyData === 'function'){
      if(patchEnemyData(id,patches[id])) count++;
    }
  });

  return count;
}

/* ===== Equipment Balance Apply ===== */
function applyEquipmentBalance(){
  let count = 0;

  const weaponPatches = POTORO_BALANCE.weapons || {};
  Object.keys(weaponPatches).forEach(id => {
    if(typeof patchWeaponData === 'function'){
      if(patchWeaponData(id,weaponPatches[id])) count++;
    }else if(typeof patchEquipmentData === 'function'){
      if(patchEquipmentData(id,weaponPatches[id])) count++;
    }
  });

  const uniformPatches = POTORO_BALANCE.uniforms || {};
  Object.keys(uniformPatches).forEach(id => {
    if(typeof patchUniformData === 'function'){
      if(patchUniformData(id,uniformPatches[id])) count++;
    }else if(typeof patchEquipmentData === 'function'){
      if(patchEquipmentData(id,uniformPatches[id])) count++;
    }
  });

  return count;
}

/* ===== Item Balance Apply ===== */
function applyItemBalance(){
  if(typeof patchItem !== 'function') return 0;

  const patches = POTORO_BALANCE.items || {};
  let count = 0;

  Object.keys(patches).forEach(id => {
    if(patchItem(id,patches[id])) count++;
  });

  return count;
}

/* ===== All Balance Apply ===== */
function applyPotoroBalance(){
  const result = {
    enemyAi:applyEnemyAiBalance(),
    player:applyPlayerBalance(),
    enemies:applyEnemyStatusBalance(),
    equipment:applyEquipmentBalance(),
    items:applyItemBalance(),
    encounterRate:POTORO_BALANCE.encounter.rate
  };

  console.log('[PO・TORO QUEST balance applied]',result);

  return result;
}

/* ===== Difficulty Presets ===== */
function setPotoroDifficultyEasy(){
  POTORO_BALANCE.encounter.rate = 0.14;

  POTORO_BALANCE.enemyAi.drainRate = 0.22;
  POTORO_BALANCE.enemyAi.doubleRate = 0.18;
  POTORO_BALANCE.enemyAi.confuseRate = 0.22;
  POTORO_BALANCE.enemyAi.powerupRate = 0.22;
  POTORO_BALANCE.enemyAi.sleepRate = 0.18;
  POTORO_BALANCE.enemyAi.drunkRate = 0.26;
  POTORO_BALANCE.enemyAi.defdownRate = 0.24;
  POTORO_BALANCE.enemyAi.bossRate = 0.28;

  return applyPotoroBalance();
}

function setPotoroDifficultyNormal(){
  POTORO_BALANCE.encounter.rate = 0.18;

  POTORO_BALANCE.enemyAi.drainRate = 0.28;
  POTORO_BALANCE.enemyAi.doubleRate = 0.24;
  POTORO_BALANCE.enemyAi.confuseRate = 0.30;
  POTORO_BALANCE.enemyAi.powerupRate = 0.28;
  POTORO_BALANCE.enemyAi.sleepRate = 0.25;
  POTORO_BALANCE.enemyAi.drunkRate = 0.35;
  POTORO_BALANCE.enemyAi.defdownRate = 0.32;
  POTORO_BALANCE.enemyAi.bossRate = 0.35;

  return applyPotoroBalance();
}

function setPotoroDifficultyHard(){
  POTORO_BALANCE.encounter.rate = 0.22;

  POTORO_BALANCE.enemyAi.drainRate = 0.34;
  POTORO_BALANCE.enemyAi.doubleRate = 0.30;
  POTORO_BALANCE.enemyAi.confuseRate = 0.36;
  POTORO_BALANCE.enemyAi.powerupRate = 0.34;
  POTORO_BALANCE.enemyAi.sleepRate = 0.31;
  POTORO_BALANCE.enemyAi.drunkRate = 0.42;
  POTORO_BALANCE.enemyAi.defdownRate = 0.38;
  POTORO_BALANCE.enemyAi.bossRate = 0.42;

  return applyPotoroBalance();
}

/* ===== Manual Patch Helpers ===== */
function setEncounterRate(rate){
  POTORO_BALANCE.encounter.rate = Math.max(0,Math.min(1,rate));
  return POTORO_BALANCE.encounter.rate;
}

function setEnemyAiRate(skill,rate){
  const key = `${skill}Rate`;

  if(typeof POTORO_BALANCE.enemyAi[key] === 'undefined') return false;

  POTORO_BALANCE.enemyAi[key] = Math.max(0,Math.min(1,rate));
  applyEnemyAiBalance();

  return true;
}

function buffEnemy(id,patch){
  POTORO_BALANCE.enemies[id] = {
    ...(POTORO_BALANCE.enemies[id] || {}),
    ...patch
  };

  return applyEnemyStatusBalance();
}

function buffWeapon(id,patch){
  POTORO_BALANCE.weapons[id] = {
    ...(POTORO_BALANCE.weapons[id] || {}),
    ...patch
  };

  return applyEquipmentBalance();
}

function buffUniform(id,patch){
  POTORO_BALANCE.uniforms[id] = {
    ...(POTORO_BALANCE.uniforms[id] || {}),
    ...patch
  };

  return applyEquipmentBalance();
}

function buffItem(id,patch){
  POTORO_BALANCE.items[id] = {
    ...(POTORO_BALANCE.items[id] || {}),
    ...patch
  };

  return applyItemBalance();
}

/* ===== Balance Report ===== */
function potoroBalanceReport(){
  const report = {
    config:JSON.parse(JSON.stringify(POTORO_BALANCE)),
    enemyAi:typeof POTORO_ENEMY_AI !== 'undefined'
      ? JSON.parse(JSON.stringify(POTORO_ENEMY_AI))
      : null,
    encounterRate:typeof getEncounterRate === 'function'
      ? getEncounterRate()
      : null
  };

  console.log('[PO・TORO QUEST balance]',report);

  return report;
}

/* ===== Optional Auto Apply ===== */
if(POTORO_BALANCE.autoApply){
  applyPotoroBalance();
}
