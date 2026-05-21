const POTORO_MAGIC_CONFIG = {
  version: 'magic-config-level-learn-fixed',

  existing: {
    moe: {
      id:'moe',
      name:'もえもえぎゅー',
      label:'もえもえぎゅー　MP5 / 敵に25〜30ダメージ',
      mp:5,
      baseDamageMin:25,
      baseDamageMax:30,
      talkScale:1.2,
      requiredLv:1
    },
    heal: {
      id:'heal',
      name:'おいしくなーれ',
      label:'おいしくなーれ　MP8 / HP回復',
      mp:8,
      heal:35,
      requiredLv:2
    },
    sleep: {
      id:'sleep',
      name:'おやすみなさい',
      label:'おやすみなさい　MP4 / 眠り',
      mp:4,
      minTurns:1,
      maxTurns:3,
      requiredLv:3
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
      requiredLv:9
    },
    nishiki: {
      id:'nishiki',
      name:'にしきぬやまー',
      label:'にしきぬやまー　MP16 / 大ダメージ',
      mp:16,
      bossBase:50,
      normalBase:75,
      requiredLv:12
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
      talkBonus:5,
      requiredLv:5
    },
    charge2: {
      id:'charge2',
      name:'完璧なお給仕',
      label:'完璧なお給仕　MP8 / 次ダメージ2.5倍',
      mp:8,
      multiplier:2.5,
      requiredLv:7
    },
    multi: {
      id:'multi',
      name:'ご奉仕連撃',
      label:'ご奉仕連撃　MP7 / 2〜3回攻撃',
      mp:7,
      minHits:2,
      maxHits:3,
      atkRate:0.6,
      requiredLv:8
    },
    rush: {
      id:'rush',
      name:'ご帰宅ラッシュ',
      label:'ご帰宅ラッシュ　MP12 / 高威力＋混乱',
      mp:12,
      base:60,
      confuseRate:0.30,
      confuseTurns:1,
      requiredLv:10
    },
    fullheal: {
      id:'fullheal',
      name:'ひなたぼっこ',
      label:'ひなたぼっこ　MP10 / 全回復＋状態異常解除',
      mp:10,
      requiredLv:11
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

/* ===== 習得判定 ===== */
function isMagicLearned(kind){
  const config = getMagicConfig(kind);
  if(!config) return false;

  const requiredLv = config.requiredLv || 1;
  return state.player.lv >= requiredLv;
}

function getLearnedMagicConfigs(){
  const all = getAllMagicConfigs();
  const learned = {};

  Object.keys(all).forEach(kind => {
    if(isMagicLearned(kind)){
      learned[kind] = all[kind];
    }
  });

  return learned;
}

function getNextMagicLearnList(){
  const all = getAllMagicConfigs();

  return Object.keys(all)
    .map(kind => all[kind])
    .filter(config => (config.requiredLv || 1) > state.player.lv)
    .sort((a,b) => (a.requiredLv || 1) - (b.requiredLv || 1));
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

function potoroLearnedMagicReport(){
  const report = {
    lv:state.player.lv,
    learned:getLearnedMagicConfigs(),
    next:getNextMagicLearnList()
  };

  console.log('[PO・TORO QUEST learned magic]',report);
  return report;
}

/* ===== Magic Config Bridge Helpers ===== */
function getMagicMpCost(kind){
  const config = getMagicConfig(kind);
  return config ? (config.mp || 0) : 0;
}

function calcConfiguredMoeDamage(){
  const config = getMagicConfig('moe');

  if(!config){
    return moeMagicDamage();
  }

  const min = config.baseDamageMin || 25;
  const max = config.baseDamageMax || 30;
  const base = min + Math.floor(Math.random() * (max - min + 1));
  const talkScale = config.talkScale || 1.2;
  const talkBonus = Math.max(0,Math.floor((totalTalk() - 7) * talkScale));

  return base + talkBonus;
}

function potoroMagicSummary(){
  const all = getAllMagicConfigs();
  const summary = Object.keys(all).map(key => ({
    id:key,
    name:all[key].name,
    mp:all[key].mp,
    label:all[key].label
  }));

  console.table(summary);
  return summary;
}
