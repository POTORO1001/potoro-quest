/* =========================
   ポトロクエスト magic-config.js（STEP17）
   おまじない設定・調整ファイル

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
   18. js/magic-config.js
   19. js/magic.js
   20. js/compatibility.js

   目的：
   - おまじないのMP、威力、ターン数、成功率を一元管理します。
   - magic.js の前に読み込んで、magic.js側から参照できる形にします。
========================= */

/* ===== Magic Config ===== */
const POTORO_MAGIC_CONFIG = {
  version: 'step17-magic-config',

  existing: {
    moe: {
      id:'moe',
      name:'もえもえぎゅー',
      label:'もえもえぎゅー　MP5 / 敵に25〜30ダメージ',
      mp:5,
      baseDamageMin:25,
      baseDamageMax:30,
      talkScale:1.2
    },
    heal: {
      id:'heal',
      name:'おいしくなーれ',
      label:'おいしくなーれ　MP8 / HP回復',
      mp:8,
      heal:35,
      requiredLv:3
    },
    sleep: {
      id:'sleep',
      name:'おやすみなさい',
      label:'おやすみなさい　MP4 / 眠り',
      mp:4,
      minTurns:1,
      maxTurns:3,
      requiredLv:4
    },
    nishiki: {
      id:'nishiki',
      name:'にしきぬやまー',
      label:'にしきぬやまー　MP16 / 大ダメージ',
      mp:16,
      bossBase:50,
      normalBase:75,
      requiredLv:10
    },
    shower: {
      id:'shower',
      name:'チェキフラッシュ',
      label:'チェキフラッシュ　MP12 / 敵全体ダメージ',
      mp:12,
      base:32,
      bossRate:0.8,
      requiredLv:6
    },
    charge: {
      id:'charge',
      name:'萌えちゃーじ',
      label:'萌えちゃーじ　MP0 / MP20回復',
      mp:0,
      mpRecover:20,
      requiredLv:7
    }
  },

  added: {
    aura: {
      id:'aura',
      name:'キラキラオーラ',
      label:'キラキラオーラ　MP6 / トーク力↑・速度↑',
      mp:6,
      turns:2,
      spdBonus:5,
      talkBonus:5
    },
    charge2: {
      id:'charge2',
      name:'完璧なお給仕',
      label:'完璧なお給仕　MP8 / 次ダメージ2.5倍',
      mp:8,
      multiplier:2.5
    },
    multi: {
      id:'multi',
      name:'ご奉仕連撃',
      label:'ご奉仕連撃　MP7 / 2〜3回攻撃',
      mp:7,
      minHits:2,
      maxHits:3,
      atkRate:0.6
    },
    rush: {
      id:'rush',
      name:'ご帰宅ラッシュ',
      label:'ご帰宅ラッシュ　MP12 / 高威力＋混乱',
      mp:12,
      base:60,
      confuseRate:0.30,
      confuseTurns:1
    },
    fullheal: {
      id:'fullheal',
      name:'ひなたぼっこ',
      label:'ひなたぼっこ　MP10 / 全回復＋状態異常解除',
      mp:10
    }
  }
};

/* ===== Config Access ===== */
function getMagicConfig(kind){
  return (
    POTORO_MAGIC_CONFIG.added[kind] ||
    POTORO_MAGIC_CONFIG.existing[kind] ||
    null
  );
}

function getAddedMagicConfigs(){
  return POTORO_MAGIC_CONFIG.added;
}

function getExistingMagicConfigs(){
  return POTORO_MAGIC_CONFIG.existing;
}

function getAllMagicConfigs(){
  return {
    ...POTORO_MAGIC_CONFIG.existing,
    ...POTORO_MAGIC_CONFIG.added
  };
}

/* ===== Magic Label ===== */
function getMagicLabel(kind){
  const config = getMagicConfig(kind);
  return config ? config.label : kind;
}

/* ===== MP Check ===== */
function hasEnoughMp(kind){
  const config = getMagicConfig(kind);
  if(!config) return false;
  return state.player.mp >= (config.mp || 0);
}

function consumeMagicMp(kind){
  const config = getMagicConfig(kind);
  if(!config) return false;

  const mp = config.mp || 0;

  if(state.player.mp < mp) return false;

  state.player.mp -= mp;
  return true;
}

/* ===== Config Patch ===== */
function patchMagicConfig(kind, patch){
  const config = getMagicConfig(kind);
  if(!config) return false;

  Object.assign(config, patch);
  return true;
}

/* ===== Added Magic Balance Helpers ===== */
function setAuraBonus(spdBonus,talkBonus,turns){
  POTORO_MAGIC_CONFIG.added.aura.spdBonus = spdBonus;
  POTORO_MAGIC_CONFIG.added.aura.talkBonus = talkBonus;
  POTORO_MAGIC_CONFIG.added.aura.turns = turns;
  return POTORO_MAGIC_CONFIG.added.aura;
}

function setChargeMultiplier(multiplier){
  POTORO_MAGIC_CONFIG.added.charge2.multiplier = multiplier;
  return POTORO_MAGIC_CONFIG.added.charge2;
}

function setRushPower(base,confuseRate){
  POTORO_MAGIC_CONFIG.added.rush.base = base;
  POTORO_MAGIC_CONFIG.added.rush.confuseRate = confuseRate;
  return POTORO_MAGIC_CONFIG.added.rush;
}

function setMultiAttack(minHits,maxHits,atkRate){
  POTORO_MAGIC_CONFIG.added.multi.minHits = minHits;
  POTORO_MAGIC_CONFIG.added.multi.maxHits = maxHits;
  POTORO_MAGIC_CONFIG.added.multi.atkRate = atkRate;
  return POTORO_MAGIC_CONFIG.added.multi;
}

/* ===== Report ===== */
function potoroMagicConfigReport(){
  const report = JSON.parse(JSON.stringify(POTORO_MAGIC_CONFIG));
  console.log('[PO・TORO QUEST magic config]',report);
  return report;
}
