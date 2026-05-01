/* =========================
   ポトロクエスト balance.js（改良版）
   序盤緩和・敵/主人公バランス調整

   変更点：
   - 序盤がキツイ問題を緩和
   - 主人公の初期HP/MP/防御を少し強化
   - 1F敵をやや弱体化
   - 2F敵は大きくは崩さず微調整
========================= */

const POTORO_BALANCE = {
  version: 'balance-early-game-ease',
  autoApply: true,

  encounter: {
    // 序盤の連戦負荷を少し下げる
    rate: 0.16
  },

  enemyAi: {
    drainRate: 0.24,
    doubleRate: 0.20,
    confuseRate: 0.26,
    powerupRate: 0.25,
    sleepRate: 0.22,
    drunkRate: 0.32,
    drunkSelfHitRate: 0.38,
    defdownRate: 0.28,
    bossRate: 0.35
  },

  player: {
    hp:34,
    maxHp:34,
    mp:14,
    maxMp:14,
    baseAtk:10,
    baseDef:5,
    baseSpd:7,
    baseTalk:8,
    nextExp:40
  },

  enemies: {
    // 1F：序盤緩和
    teiji: {
      hp:38,
      maxHp:38,
      atk:6,
      def:2,
      spd:5,
      talk:3,
      exp:12
    },
    kuufuku: {
      hp:56,
      maxHp:56,
      atk:8,
      def:3,
      spd:6,
      talk:5,
      exp:16
    },
    zangyo: {
      hp:74,
      maxHp:74,
      atk:11,
      def:5,
      spd:7,
      talk:6,
      exp:24
    },
    meisou: {
      hp:96,
      maxHp:96,
      atk:13,
      def:7,
      spd:10,
      talk:10,
      exp:34
    },

    // 2F：少しだけ調整
    gekimu: {
      hp:145,
      maxHp:145,
      atk:18,
      def:10,
      spd:12,
      talk:11,
      exp:45
    },
    neochi: {
      hp:124,
      maxHp:124,
      atk:15,
      def:9,
      spd:9,
      talk:12,
      exp:40
    },
    deisui: {
      hp:172,
      maxHp:172,
      atk:20,
      def:12,
      spd:8,
      talk:14,
      exp:58
    },
    shisseki: {
      hp:230,
      maxHp:230,
      atk:25,
      def:15,
      spd:14,
      talk:16,
      exp:78
    },

    boss: {
      hp:380,
      maxHp:380,
      atk:32,
      def:20,
      spd:18,
      talk:22,
      exp:120
    }
  },

  weapons: {
    rod: { atk:3 },
    frill_blade: { atk:7 },
    gokitaku_mace: { atk:12 }
  },

  uniforms: {
    maid_headband:{def:4},
    white_apron:{def:5},
    service_proof:{def:4},
    first_maid:{def:28}
  },

  items: {
    omurice:{amount:35},
    tea:{amount:12}
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
  POTORO_BALANCE.encounter.rate = 0.13;
  POTORO_BALANCE.enemyAi.drainRate = 0.20;
  POTORO_BALANCE.enemyAi.doubleRate = 0.16;
  POTORO_BALANCE.enemyAi.confuseRate = 0.22;
  POTORO_BALANCE.enemyAi.powerupRate = 0.20;
  POTORO_BALANCE.enemyAi.sleepRate = 0.18;
  POTORO_BALANCE.enemyAi.drunkRate = 0.26;
  POTORO_BALANCE.enemyAi.defdownRate = 0.22;
  POTORO_BALANCE.enemyAi.bossRate = 0.30;
  return applyPotoroBalance();
}

function setPotoroDifficultyNormal(){
  POTORO_BALANCE.encounter.rate = 0.16;
  POTORO_BALANCE.enemyAi.drainRate = 0.24;
  POTORO_BALANCE.enemyAi.doubleRate = 0.20;
  POTORO_BALANCE.enemyAi.confuseRate = 0.26;
  POTORO_BALANCE.enemyAi.powerupRate = 0.25;
  POTORO_BALANCE.enemyAi.sleepRate = 0.22;
  POTORO_BALANCE.enemyAi.drunkRate = 0.32;
  POTORO_BALANCE.enemyAi.defdownRate = 0.28;
  POTORO_BALANCE.enemyAi.bossRate = 0.35;
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
  POTORO_BALANCE.enemyAi.bossRate = 0.42;
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
