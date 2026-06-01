/* =========================
   ポトロクエスト item.js（新どうぐ完全対応版）

   差し替え対象：
   js/item.js

   対応内容：
   - drop.jsで追加した新どうぐを使用可能にする
   - お給仕中 / マップ中の使用に対応
   - 状態異常回復
   - バフ系どうぐ
   - ランダム系どうぐ
   - どうぐメニュー自動表示
========================= */

/* ===== どうぐ定義 ===== */
const POTORO_ITEMS = {
  omurice: {
    id:'omurice',
    name:'オムライス',
    label:'オムライス　HP30回復',
    type:'healHp',
    amount:30,
    usableOnMap:true,
    usableInBattle:true
  },

  tea: {
    id:'tea',
    name:'紅茶',
    label:'紅茶　TP10回復',
    type:'healMp',
    amount:10,
    usableOnMap:true,
    usableInBattle:true
  },

  horse: {
    id:'horse',
    name:'くろれきし',
    label:'くろれきし　大ダメージ',
    type:'damage',
    normalDamage:999,
    bossDamage:55,
    usableOnMap:false,
    usableInBattle:true
  },

  pancake: {
    id:'pancake',
    name:'ふわふわパンケーキ',
    label:'ふわふわパンケーキ　HP50回復',
    type:'healHp',
    amount:50,
    usableOnMap:true,
    usableInBattle:true
  },

  royal_milk_tea: {
    id:'royal_milk_tea',
    name:'ロイヤルミルクティー',
    label:'ロイヤルミルクティー　TP30回復',
    type:'healMp',
    amount:30,
    usableOnMap:true,
    usableInBattle:true
  },

  sweets_plate: {
    id:'sweets_plate',
    name:'ご褒美スイーツプレート',
    label:'ご褒美スイーツプレート　HP25・TP15回復',
    type:'healBoth',
    hpAmount:25,
    mpAmount:15,
    usableOnMap:true,
    usableInBattle:true
  },

  cool_tea: {
    id:'cool_tea',
    name:'冷静の紅茶',
    label:'冷静の紅茶　混乱回復',
    type:'cureStatus',
    cures:['confuse'],
    usableOnMap:true,
    usableInBattle:true
  },

  refresh_aroma: {
    id:'refresh_aroma',
    name:'リフレッシュアロマ',
    label:'リフレッシュアロマ　状態異常回復',
    type:'cureStatus',
    cures:['sleep','confuse','defDown'],
    usableOnMap:true,
    usableInBattle:true
  },

  voice_message: {
    id:'voice_message',
    name:'応援のボイスメッセージ',
    label:'応援のボイスメッセージ　攻撃UP',
    type:'buff',
    buff:{atk:4,turns:2},
    usableOnMap:false,
    usableInBattle:true
  },

  kira_powder: {
    id:'kira_powder',
    name:'キラキラパウダー',
    label:'キラキラパウダー　おまじない強化',
    type:'magicBoost',
    multiplier:1.4,
    turns:1,
    usableOnMap:false,
    usableInBattle:true
  },

  service_manual: {
    id:'service_manual',
    name:'お給仕マニュアル',
    label:'お給仕マニュアル　防御・トーク・速さUP',
    type:'buff',
    buff:{def:3,talk:3,spd:3,turns:2},
    usableOnMap:false,
    usableInBattle:true
  },

  unknown_drink: {
    id:'unknown_drink',
    name:'？？？ドリンク',
    label:'？？？ドリンク　ランダム効果',
    type:'random',
    usableOnMap:false,
    usableInBattle:true
  }
};

/* ===== どうぐ取得 ===== */
function getItemData(kind){
  return POTORO_ITEMS[kind] || null;
}

/* ===== どうぐ所持数 ===== */
function getItemCount(kind){
  const p = state.player;
  if(!p.items) p.items = {};
  return p.items[kind] || 0;
}

/* ===== どうぐ消費 ===== */
function consumeItem(kind){
  const p = state.player;
  if(!p.items) p.items = {};
  if((p.items[kind] || 0) <= 0) return false;
  p.items[kind]--;
  return true;
}

/* ===== 状態異常 helpers ===== */
function getPlayerStatusSafe(){
  if(typeof ensurePlayerStatus === 'function') return ensurePlayerStatus();

  const p = state.player;
  if(!p.status) p.status = {sleep:0,confuse:0,defDown:0};
  return p.status;
}

function hasAnyCureTarget(item){
  const s = getPlayerStatusSafe();
  if(!item.cures || !item.cures.length) return false;

  return item.cures.some(key => (s[key] || 0) > 0);
}

function cureStatuses(item){
  const s = getPlayerStatusSafe();
  const cured = [];

  (item.cures || []).forEach(key => {
    if((s[key] || 0) > 0){
      s[key] = 0;
      cured.push(key);
    }
  });

  return cured;
}

function statusName(key){
  if(key === 'sleep') return '睡眠';
  if(key === 'confuse') return '混乱';
  if(key === 'defDown') return '防御ダウン';
  return key;
}

/* ===== バフ helpers ===== */
function ensureItemBuffs(){
  const p = state.player;
  if(!p.itemBuffs){
    p.itemBuffs = {
      atk:0,
      def:0,
      spd:0,
      talk:0,
      magicBoost:1,
      turns:0,
      magicBoostTurns:0
    };
  }
  return p.itemBuffs;
}

function applyItemBuff(buff){
  const b = ensureItemBuffs();

  b.atk = Math.max(b.atk || 0,buff.atk || 0);
  b.def = Math.max(b.def || 0,buff.def || 0);
  b.spd = Math.max(b.spd || 0,buff.spd || 0);
  b.talk = Math.max(b.talk || 0,buff.talk || 0);
  b.turns = Math.max(b.turns || 0,buff.turns || 1);

  return b;
}

function applyMagicBoost(multiplier,turns){
  const b = ensureItemBuffs();
  b.magicBoost = Math.max(b.magicBoost || 1,multiplier || 1);
  b.magicBoostTurns = Math.max(b.magicBoostTurns || 0,turns || 1);
  return b;
}

function tickItemBuffs(){
  const b = ensureItemBuffs();

  if(b.turns > 0){
    b.turns--;
    if(b.turns <= 0){
      b.atk = 0;
      b.def = 0;
      b.spd = 0;
      b.talk = 0;
    }
  }

  if(b.magicBoostTurns > 0){
    b.magicBoostTurns--;
    if(b.magicBoostTurns <= 0){
      b.magicBoost = 1;
    }
  }
}

/* ===== 既存ステータス関数にバフを反映 ===== */
(function patchItemBuffToStats(){
  if(window.__potoroItemBuffPatched) return;
  window.__potoroItemBuffPatched = true;

  const originalTotalAtk = totalAtk;
  const originalTotalDef = totalDef;
  const originalTotalSpd = totalSpd;
  const originalTotalTalk = totalTalk;

  totalAtk = function(){
    const b = ensureItemBuffs();
    return originalTotalAtk() + (b.atk || 0);
  };

  totalDef = function(){
    const b = ensureItemBuffs();
    return originalTotalDef() + (b.def || 0);
  };

  totalSpd = function(){
    const b = ensureItemBuffs();
    return originalTotalSpd() + (b.spd || 0);
  };

  totalTalk = function(){
    const b = ensureItemBuffs();
    return originalTotalTalk() + (b.talk || 0);
  };

  if(typeof magicPower === 'function'){
    const originalMagicPower = magicPower;
    magicPower = function(base){
      const b = ensureItemBuffs();
      return Math.floor(originalMagicPower(base) * (b.magicBoost || 1));
    };
  }

  if(typeof moeMagicDamage === 'function'){
    const originalMoeMagicDamage = moeMagicDamage;
    moeMagicDamage = function(){
      const b = ensureItemBuffs();
      return Math.floor(originalMoeMagicDamage() * (b.magicBoost || 1));
    };
  }
})();

/* ===== どうぐ使用可能判定 ===== */
function canUseItem(kind){
  const item = getItemData(kind);
  const p = state.player;

  if(!item) return {ok:false,message:'そのどうぐは使えません！'};

  if(getItemCount(kind) <= 0){
    return {ok:false,message:`${item.name}は持っていない！`};
  }

  const mapMode = isMapMode();

  if(mapMode && !item.usableOnMap){
    return {ok:false,message:`${item.name}はお給仕中のみ使えます！`};
  }

  if(!mapMode && !item.usableInBattle){
    return {ok:false,message:`${item.name}は今は使えません！`};
  }

  if(item.type === 'healHp' && p.hp >= p.maxHp){
    return {ok:false,message:`${item.name}は使えない！`};
  }

  if(item.type === 'healMp' && p.mp >= p.maxMp){
    return {ok:false,message:`${item.name}は使えない！`};
  }

  if(item.type === 'healBoth' && p.hp >= p.maxHp && p.mp >= p.maxMp){
    return {ok:false,message:`${item.name}は使えない！`};
  }

  if(item.type === 'cureStatus' && !hasAnyCureTarget(item)){
    return {ok:false,message:'治せる状態異常がありません！'};
  }

  return {ok:true,message:''};
}

/* ===== どうぐメニュー用ラベル ===== */
function itemMenuLabel(kind){
  const item = getItemData(kind);
  if(!item) return kind;

  let limitText = '';
  if(typeof getItemLimit === 'function'){
    limitText = ` / ${getItemLimit(kind)}`;
  }

  return `${item.label}　${getItemCount(kind)}${limitText}`;
}

function ownedItemKinds(){
  const p = state.player;
  if(!p.items) p.items = {};

  const baseOrder = [
    'omurice',
    'tea',
    'pancake',
    'royal_milk_tea',
    'sweets_plate',
    'cool_tea',
    'refresh_aroma',
    'voice_message',
    'kira_powder',
    'service_manual',
    'unknown_drink',
    'horse'
  ];

  return baseOrder.filter(kind => (p.items[kind] || 0) > 0 || ['omurice','tea','horse'].includes(kind));
}

/* ===== どうぐ使用処理 ===== */
async function useItem(kind){
  if(state.player.hp <= 0 && !isMapMode()) return;
  if(state.busy) return;

  closeSubMenu();
  closeEquipMenu();

  state.busy = true;
  setButtonsDisabled(true);

  if(!isMapMode() && !(await playerStatusCheck())) return;
  if(!isMapMode() && await enemyFirstCheck()) return;

  const p = state.player;
  const item = getItemData(kind);
  const check = canUseItem(kind);

  if(!check.ok){
    await failAction(check.message);
    return;
  }

  if(!consumeItem(kind)){
    await failAction(`${item.name}は持っていない！`);
    return;
  }

  if(item.type === 'healHp'){
    const heal = Math.min(item.amount,p.maxHp-p.hp);
    p.hp += heal;

    const msg = `${item.name}を使った！ HPが ${heal} 回復！`;
    if(isMapMode()) setMapMessage(msg);
    else setMessage(msg);

    if(!isMapMode()) showDamage(-heal,'player');
    if(typeof seHeal === 'function') seHeal();
    updateUI();

    await sleep(750);
    if(!isMapMode() && !state.enemyActedFirst) await enemyTurn();
  }

  else if(item.type === 'healMp'){
    const healMp = Math.min(item.amount,p.maxMp-p.mp);
    p.mp += healMp;

    const msg = `${item.name}を使った！ TPが ${healMp} 回復！`;
    if(isMapMode()) setMapMessage(msg);
    else setMessage(msg);

    if(typeof seHeal === 'function') seHeal();
    updateUI();

    await sleep(750);
    if(!isMapMode() && !state.enemyActedFirst) await enemyTurn();
  }

  else if(item.type === 'healBoth'){
    const heal = Math.min(item.hpAmount,p.maxHp-p.hp);
    const healMp = Math.min(item.mpAmount,p.maxMp-p.mp);

    p.hp += heal;
    p.mp += healMp;

    const msg = `${item.name}を使った！ HP${heal}・TP${healMp} 回復！`;
    if(isMapMode()) setMapMessage(msg);
    else setMessage(msg);

    if(!isMapMode() && heal > 0) showDamage(-heal,'player');
    if(typeof seHeal === 'function') seHeal();
    updateUI();

    await sleep(750);
    if(!isMapMode() && !state.enemyActedFirst) await enemyTurn();
  }

  else if(item.type === 'cureStatus'){
    const cured = cureStatuses(item);
    const label = cured.map(statusName).join('・') || '状態異常';

    const msg = `${item.name}を使った！ ${label}が回復した！`;
    if(isMapMode()) setMapMessage(msg);
    else setMessage(msg);

    if(typeof seHeal === 'function') seHeal();
    updateUI();

    await sleep(700);
    if(!isMapMode() && !state.enemyActedFirst) await enemyTurn();
  }

  else if(item.type === 'buff'){
    applyItemBuff(item.buff || {turns:1});

    const parts = [];
    if(item.buff?.atk) parts.push('攻撃');
    if(item.buff?.def) parts.push('防御');
    if(item.buff?.spd) parts.push('すばやさ');
    if(item.buff?.talk) parts.push('トーク力');

    setMessage(`${item.name}を使った！ ${parts.join('・')}が上がった！`);
    if(typeof seMagic === 'function') seMagic();
    updateUI();

    await sleep(750);
    if(!state.enemyActedFirst) await enemyTurn();
  }

  else if(item.type === 'magicBoost'){
    applyMagicBoost(item.multiplier,item.turns);

    setMessage(`${item.name}を使った！ 次のおまじないが強くなる！`);
    if(typeof seMagic === 'function') seMagic();
    updateUI();

    await sleep(750);
    if(!state.enemyActedFirst) await enemyTurn();
  }

  else if(item.type === 'random'){
    await useUnknownDrinkEffect(item);
  }

  else if(item.type === 'damage'){
    if(isMapMode()){
      await failAction(`${item.name}はお給仕中のみ使えます！`);
      return;
    }

    const e = currentEnemy();
    const damage = e && e.boss ? item.bossDamage : item.normalDamage;

    await damageEnemy(`${item.name}を召喚した！`,damage);
  }

  if(!isMapMode()){
    tickItemBuffs();
  }

  state.enemyActedFirst = false;
  state.busy = false;
  setButtonsDisabled(false);
  updateUI();

  if(typeof updateMapStatusPanel === 'function') updateMapStatusPanel();
}

/* ===== ？？？ドリンク ===== */
async function useUnknownDrinkEffect(item){
  if(isMapMode()){
    await failAction(`${item.name}はお給仕中のみ使えます！`);
    return;
  }

  const p = state.player;
  const roll = Math.random();

  if(roll < 0.35){
    const heal = Math.min(40,p.maxHp-p.hp);
    p.hp += heal;
    setMessage(`？？？ドリンク！ なぜかHPが ${heal} 回復した！`);
    showDamage(-heal,'player');
    if(typeof seHeal === 'function') seHeal();
    updateUI();
    await sleep(750);
    if(!state.enemyActedFirst) await enemyTurn();
    return;
  }

  if(roll < 0.65){
    applyItemBuff({atk:5,spd:3,turns:2});
    setMessage('？？？ドリンク！ なんだか力が湧いてきた！');
    if(typeof seMagic === 'function') seMagic();
    updateUI();
    await sleep(750);
    if(!state.enemyActedFirst) await enemyTurn();
    return;
  }

  if(roll < 0.85){
    const e = currentEnemy();
    const damage = e && e.boss ? 35 : 60;
    await damageEnemy('？？？ドリンクが爆発した！',damage);
    return;
  }

  const damage = Math.min(p.hp-1,18);
  p.hp = Math.max(1,p.hp-damage);
  setMessage(`？？？ドリンク！ 変な味で ${damage} ダメージ！`);
  if(!isMapMode()) showDamage(damage,'player');
  if(typeof seHit === 'function') seHit();
  updateUI();

  await sleep(750);
  if(!state.enemyActedFirst) await enemyTurn();
}

/* ===== openSubMenu のどうぐ表示だけ拡張 ===== */
const _potoroItemOpenSubMenu = openSubMenu;

openSubMenu = function(kind){
  _potoroItemOpenSubMenu(kind);

  if(kind !== 'item') return;

  const title = document.getElementById('subMenuTitle');
  const body = document.getElementById('subMenuBody');

  if(!title || !body) return;

  title.textContent = 'どうぐ';
  body.innerHTML = '';

  ownedItemKinds().forEach(kind => {
    addSubButton(itemMenuLabel(kind),() => useItem(kind));
  });
};

/* ===== どうぐ追加・調整 helper ===== */
function addItem(kind,count=1){
  const p = state.player;
  if(!p.items) p.items = {};
  p.items[kind] = (p.items[kind] || 0) + count;
  updateUI();
}

function setItemCount(kind,count){
  const p = state.player;
  if(!p.items) p.items = {};
  p.items[kind] = Math.max(0,count);
  updateUI();
}

function patchItem(kind,patch){
  const item = getItemData(kind);
  if(!item) return false;
  Object.assign(item,patch);
  return true;
}

function potoroItemReport(){
  const report = {
    definitions:POTORO_ITEMS,
    inventory:state.player.items || {}
  };

  console.log('[PO・TORO QUEST items]',report);
  return report;
}
