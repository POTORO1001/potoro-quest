/* =========================
   ポトロクエスト balance.js（最終バランス調整版）
   Final Balance Edition
========================= */

const POTORO_BALANCE = {
  version: 'final-balance-edition',
  autoApply: true,

  encounter: {
    rate: 0.145
  },

  enemyAi: {
    drainRate: 0.22,
    doubleRate: 0.18,
    confuseRate: 0.23,
    powerupRate: 0.22,
    sleepRate: 0.20,
    drunkRate: 0.30,
    drunkSelfHitRate: 0.40,
    defdownRate: 0.25,
    bossRate: 0.38
  },

  player: {
    hp:40,
    maxHp:40,
    mp:18,
    maxMp:18,
    baseAtk:11,
    baseDef:6,
    baseSpd:7,
    baseTalk:9,
    nextExp:34
  },

  enemies: {
    teiji: { hp:30, maxHp:30, atk:5, def:1, spd:4, talk:3, exp:14 },
    kuufuku: { hp:46, maxHp:46, atk:7, def:2, spd:5, talk:5, exp:18 },
    zangyo: { hp:64, maxHp:64, atk:10, def:4, spd:6, talk:6, exp:26 },
    meisou: { hp:84, maxHp:84, atk:12, def:6, spd:9, talk:10, exp:38 },

    gekimu: { hp:142, maxHp:142, atk:18, def:10, spd:12, talk:11, exp:48 },
    neochi: { hp:122, maxHp:122, atk:15, def:9, spd:9, talk:12, exp:44 },
    deisui: { hp:168, maxHp:168, atk:20, def:12, spd:8, talk:14, exp:62 },
    shisseki: { hp:220, maxHp:220, atk:24, def:15, spd:14, talk:16, exp:82 },

    boss: { hp:420, maxHp:420, atk:33, def:21, spd:18, talk:24, exp:140 }
  },

  weapons: {
    rod: { atk:4 },
    frill_blade: { atk:8 },
    gokitaku_mace: { atk:13 }
  },

  uniforms: {
    maid_headband:{def:4},
    white_apron:{def:5},
    service_proof:{def:4},
    heart_tiara:{def:7},
    rose_ribbon:{def:8},
    long_maid:{def:12},
    oshi_pendant:{def:7},
    legend_nameplate:{def:10},
    first_maid:{def:30}
  },

  items: {
    omurice:{amount:42},
    tea:{amount:15}
  }
};

function getEncounterRate(){
  return POTORO_BALANCE.encounter.rate;
}

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

function applyPlayerBalance(){
  if(!POTORO_BALANCE.player || !Object.keys(POTORO_BALANCE.player).length) return false;
  Object.assign(initialPlayer,POTORO_BALANCE.player);
  return true;
}

function applyEnemyStatusBalance(){
  const patches = POTORO_BALANCE.enemies || {};
  let count = 0;

  Object.keys(patches).forEach(id => {
    const enemy = typeof getEnemyById === 'function'
      ? getEnemyById(id)
      : enemies.find(e => e.id === id);

    if(enemy){
      Object.assign(enemy,patches[id]);
      count++;
    }
  });

  return count;
}

function applyEquipmentBalance(){
  let count = 0;

  const weaponPatches = POTORO_BALANCE.weapons || {};
  Object.keys(weaponPatches).forEach(id => {
    const item = typeof getWeaponById === 'function'
      ? getWeaponById(id)
      : equipmentData.weapons.find(w => w.id === id);

    if(item){
      Object.assign(item,weaponPatches[id]);
      count++;
    }
  });

  const uniformPatches = POTORO_BALANCE.uniforms || {};
  Object.keys(uniformPatches).forEach(id => {
    const item = typeof getUniformById === 'function'
      ? getUniformById(id)
      : equipmentData.uniforms.find(u => u.id === id);

    if(item){
      Object.assign(item,uniformPatches[id]);
      count++;
    }
  });

  return count;
}

function applyItemBalance(){
  if(typeof patchItem !== 'function') return 0;

  const patches = POTORO_BALANCE.items || {};
  let count = 0;

  Object.keys(patches).forEach(id => {
    if(patchItem(id,patches[id])) count++;
  });

  return count;
}

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

function setPotoroDifficultyEasy(){
  POTORO_BALANCE.encounter.rate = 0.12;
  POTORO_BALANCE.enemyAi.drainRate = 0.18;
  POTORO_BALANCE.enemyAi.doubleRate = 0.14;
  POTORO_BALANCE.enemyAi.confuseRate = 0.18;
  POTORO_BALANCE.enemyAi.powerupRate = 0.18;
  POTORO_BALANCE.enemyAi.sleepRate = 0.16;
  POTORO_BALANCE.enemyAi.drunkRate = 0.24;
  POTORO_BALANCE.enemyAi.defdownRate = 0.20;
  POTORO_BALANCE.enemyAi.bossRate = 0.30;
  return applyPotoroBalance();
}

function setPotoroDifficultyNormal(){
  POTORO_BALANCE.encounter.rate = 0.145;
  POTORO_BALANCE.enemyAi.drainRate = 0.22;
  POTORO_BALANCE.enemyAi.doubleRate = 0.18;
  POTORO_BALANCE.enemyAi.confuseRate = 0.23;
  POTORO_BALANCE.enemyAi.powerupRate = 0.22;
  POTORO_BALANCE.enemyAi.sleepRate = 0.20;
  POTORO_BALANCE.enemyAi.drunkRate = 0.30;
  POTORO_BALANCE.enemyAi.defdownRate = 0.25;
  POTORO_BALANCE.enemyAi.bossRate = 0.38;
  return applyPotoroBalance();
}

function setPotoroDifficultyHard(){
  POTORO_BALANCE.encounter.rate = 0.21;
  POTORO_BALANCE.enemyAi.drainRate = 0.32;
  POTORO_BALANCE.enemyAi.doubleRate = 0.28;
  POTORO_BALANCE.enemyAi.confuseRate = 0.34;
  POTORO_BALANCE.enemyAi.powerupRate = 0.32;
  POTORO_BALANCE.enemyAi.sleepRate = 0.30;
  POTORO_BALANCE.enemyAi.drunkRate = 0.40;
  POTORO_BALANCE.enemyAi.defdownRate = 0.36;
  POTORO_BALANCE.enemyAi.bossRate = 0.45;
  return applyPotoroBalance();
}

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
  POTORO_BALANCE.enemies[id] = { ...(POTORO_BALANCE.enemies[id] || {}), ...patch };
  return applyEnemyStatusBalance();
}

function buffWeapon(id,patch){
  POTORO_BALANCE.weapons[id] = { ...(POTORO_BALANCE.weapons[id] || {}), ...patch };
  return applyEquipmentBalance();
}

function buffUniform(id,patch){
  POTORO_BALANCE.uniforms[id] = { ...(POTORO_BALANCE.uniforms[id] || {}), ...patch };
  return applyEquipmentBalance();
}

function buffItem(id,patch){
  POTORO_BALANCE.items[id] = { ...(POTORO_BALANCE.items[id] || {}), ...patch };
  return applyItemBalance();
}

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

if(POTORO_BALANCE.autoApply){
  applyPotoroBalance();
}
