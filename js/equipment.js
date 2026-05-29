/* =========================
   ポトロクエスト equipment.js
   装備比較表示（↑↓）対応版

   差し替え対象：
   js/equipment.js

   追加内容：
   - 装備一覧で現在装備との差分を表示
   - 攻撃 / 防御 / すばやさ / トーク力 を比較
   - 特殊効果説明を短く表示
   - 宝箱追加装備にも対応
========================= */

/* ===== 装備検索 ===== */
function findWeapon(id){
  return equipmentData.weapons.find(item => item.id === id) || null;
}

function findUniform(id){
  return equipmentData.uniforms.find(item => item.id === id) || null;
}

/* ===== 装備ステータス取得 ===== */
function equipStat(item,key){
  if(!item) return 0;

  let value = item[key] || 0;

  if(key === 'def' && item.effect && item.effect.defPenalty){
    value -= item.effect.defPenalty;
  }

  return value;
}

function equippedItemBySlot(slot){
  const p = state.player;

  if(slot === 'weapon') return findWeapon(p.equip.weapon);
  return findUniform(p.equip[slot]);
}

/* ===== 装備込みステータス ===== */
function totalAtk(){
  const p = state.player;
  let atk = p.baseAtk || 0;

  const weapon = findWeapon(p.equip.weapon);
  if(weapon) atk += equipStat(weapon,'atk');

  ['head','body','accessory'].forEach(slot => {
    const item = findUniform(p.equip[slot]);
    if(item) atk += equipStat(item,'atk');
  });

  return atk;
}

function totalDef(){
  const p = state.player;
  let def = p.baseDef || 0;

  ['head','body','accessory'].forEach(slot => {
    const item = findUniform(p.equip[slot]);
    if(item) def += equipStat(item,'def');
  });

  const weapon = findWeapon(p.equip.weapon);
  if(weapon) def += equipStat(weapon,'def');

  return Math.max(0,def);
}

function totalSpd(){
  const p = state.player;
  let spd = p.baseSpd || 0;

  const weapon = findWeapon(p.equip.weapon);
  if(weapon) spd += equipStat(weapon,'spd');

  ['head','body','accessory'].forEach(slot => {
    const item = findUniform(p.equip[slot]);
    if(item) spd += equipStat(item,'spd');
  });

  return spd;
}

function totalTalk(){
  const p = state.player;
  let talk = p.baseTalk || 0;

  const weapon = findWeapon(p.equip.weapon);
  if(weapon) talk += equipStat(weapon,'talk');

  ['head','body','accessory'].forEach(slot => {
    const item = findUniform(p.equip[slot]);
    if(item) talk += equipStat(item,'talk');
  });

  return talk;
}

/* ===== 装備スロット表示名 ===== */
function slotName(slot){
  if(slot === 'weapon') return '武器';
  if(slot === 'head') return '頭';
  if(slot === 'body') return '胴';
  if(slot === 'accessory') return 'アクセ';
  return slot;
}

/* ===== 比較表示 ===== */
function compareArrow(delta){
  if(delta > 0) return `↑+${delta}`;
  if(delta < 0) return `↓${delta}`;
  return '±0';
}

function comparePart(label,newValue,currentValue){
  const delta = newValue - currentValue;
  const cls = delta > 0 ? 'up' : delta < 0 ? 'down' : 'same';
  return `<span class="equip-compare ${cls}">${label}${compareArrow(delta)}</span>`;
}

function rarityBadge(item){
  const rarity = item && item.rarity ? item.rarity : 'B';
  return `<span class="equip-rarity rarity-${String(rarity).toLowerCase()}">${rarity}</span>`;
}

function itemEffectText(item){
  if(!item) return '';

  const e = item.effect || {};
  const parts = [];

  if(e.magicMpMinus) parts.push(`MP消費-${e.magicMpMinus}`);
  if(e.magicMpPlus) parts.push(`MP消費+${e.magicMpPlus}`);
  if(e.talkRate) parts.push(`トーク+${Math.round(e.talkRate*100)}%`);
  if(e.magicDamageRate) parts.push(`おまじない+${Math.round(e.magicDamageRate*100)}%`);
  if(e.healMagicRate) parts.push(`回復魔法+${Math.round(e.healMagicRate*100)}%`);
  if(e.healRate) parts.push(`回復量+${Math.round(e.healRate*100)}%`);
  if(e.stunChance) parts.push(`スタン${Math.round(e.stunChance*100)}%`);
  if(e.multiHitChance) parts.push(`追撃${Math.round(e.multiHitChance*100)}%`);
  if(e.defDownChance) parts.push(`防御ダウン${Math.round(e.defDownChance*100)}%`);
  if(e.bossDamageRate) parts.push(`ボス特効+${Math.round(e.bossDamageRate*100)}%`);
  if(e.damageCutRate) parts.push(`被ダメ-${Math.round(e.damageCutRate*100)}%`);
  if(e.guardDamageCut) parts.push(`防御時さらに軽減`);
  if(e.turnHpRegen) parts.push(`毎ターンHP+${e.turnHpRegen}`);
  if(e.turnMpRegen) parts.push(`毎ターンMP+${e.turnMpRegen}`);
  if(e.sleepResist || e.confuseResist) parts.push(`状態異常耐性`);
  if(e.buffTurnBonus) parts.push(`バフ+${e.buffTurnBonus}T`);
  if(e.statusTurnMinus) parts.push(`状態短縮`);
  if(e.atkRate) parts.push(`攻撃+${Math.round(e.atkRate*100)}%`);
  if(e.turnHpCost) parts.push(`毎ターンHP-${e.turnHpCost}`);
  if(e.extraActionChance) parts.push(`追加行動${Math.round(e.extraActionChance*100)}%`);
  if(e.itemDropRateBonus) parts.push(`ドロップ+${Math.round(e.itemDropRateBonus*100)}%`);
  if(e.expRate) parts.push(`EXP+${Math.round(e.expRate*100)}%`);
  if(e.turnAtkStack) parts.push(`毎ターン攻撃UP`);

  if(!parts.length && item.desc) return item.desc;

  return parts.join(' / ');
}

function buildEquipButtonHtml(slot,item){
  const current = equippedItemBySlot(slot);

  const newAtk = equipStat(item,'atk');
  const newDef = equipStat(item,'def');
  const newSpd = equipStat(item,'spd');
  const newTalk = equipStat(item,'talk');

  const curAtk = equipStat(current,'atk');
  const curDef = equipStat(current,'def');
  const curSpd = equipStat(current,'spd');
  const curTalk = equipStat(current,'talk');

  const compares = [];

  if(slot === 'weapon' || newAtk || curAtk) compares.push(comparePart('攻',newAtk,curAtk));
  if(slot !== 'weapon' || newDef || curDef) compares.push(comparePart('防',newDef,curDef));
  if(newSpd || curSpd) compares.push(comparePart('速',newSpd,curSpd));
  if(newTalk || curTalk) compares.push(comparePart('話',newTalk,curTalk));

  const effect = itemEffectText(item);

  return `
    <div class="equip-button-main">
      <span class="equip-button-name">${slotName(slot)}：${item.name}</span>
      ${rarityBadge(item)}
    </div>
    <div class="equip-button-compare">
      ${compares.join(' ')}
    </div>
    ${effect ? `<div class="equip-button-effect">${effect}</div>` : ''}
  `;
}

/* ===== 装備メニュー ===== */
function openEquipMenu(){
  if(state.busy) return;

  closeSubMenu();

  const menu = document.getElementById('equipMenu');
  const body = document.getElementById('equipMenuBody');
  const p = state.player;

  if(!menu || !body) return;

  body.innerHTML = '';

  const current = document.createElement('div');
  current.className = 'equip-current';

  current.innerHTML =
    `現在の装備<br>` +
    `武器：${findWeapon(p.equip.weapon)?.name || 'なし'}<br>` +
    `頭：${findUniform(p.equip.head)?.name || 'なし'}<br>` +
    `胴：${findUniform(p.equip.body)?.name || 'なし'}<br>` +
    `アクセ：${findUniform(p.equip.accessory)?.name || 'なし'}<br>` +
    `<span class="equip-stat">` +
    `攻撃 ${totalAtk()} / 防御 ${totalDef()} / すばやさ ${totalSpd()} / トーク力 ${totalTalk()}` +
    `</span>`;

  body.appendChild(current);

  renderEquipGroup(
    body,
    '武器',
    p.inventory.weapons
      .map(id => findWeapon(id))
      .filter(Boolean)
      .sort((a,b) => equipStat(b,'atk') - equipStat(a,'atk')),
    item => buildEquipButtonHtml('weapon',item),
    item => equipWeapon(item.id),
    item => p.equip.weapon === item.id
  );

  const uniforms = p.inventory.uniforms
    .map(id => findUniform(id))
    .filter(Boolean);

  renderEquipGroup(
    body,
    '防具（頭）',
    uniforms.filter(item => item.slot === 'head').sort((a,b) => equipStat(b,'def') - equipStat(a,'def')),
    item => buildEquipButtonHtml('head',item),
    item => equipUniform(item.id),
    item => p.equip.head === item.id
  );

  renderEquipGroup(
    body,
    '防具（胴）',
    uniforms.filter(item => item.slot === 'body').sort((a,b) => equipStat(b,'def') - equipStat(a,'def')),
    item => buildEquipButtonHtml('body',item),
    item => equipUniform(item.id),
    item => p.equip.body === item.id
  );

  renderEquipGroup(
    body,
    '防具（アクセ）',
    uniforms.filter(item => item.slot === 'accessory').sort((a,b) => equipStat(b,'def') - equipStat(a,'def')),
    item => buildEquipButtonHtml('accessory',item),
    item => equipUniform(item.id),
    item => p.equip.accessory === item.id
  );

  menu.classList.remove('hidden');
}

/* ===== 装備グループ描画 ===== */
function renderEquipGroup(parent,title,items,labelFn,handlerFn,isEquippedFn){
  const details = document.createElement('details');
  details.className = 'equip-group';
  details.open = true;

  const summary = document.createElement('summary');
  summary.textContent = `${title}（${items.length}）`;
  details.appendChild(summary);

  const wrap = document.createElement('div');
  wrap.className = 'equip-group-body';

  if(!items.length){
    const empty = document.createElement('div');
    empty.className = 'equip-empty';
    empty.textContent = '未入手';
    wrap.appendChild(empty);
  }else{
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.innerHTML = labelFn(item);

      if(isEquippedFn(item)) btn.classList.add('equip-equipped');

      btn.onclick = () => handlerFn(item);
      wrap.appendChild(btn);
    });
  }

  details.appendChild(wrap);
  parent.appendChild(details);
}

/* ===== 装備ボタン追加 helper ===== */
function addEquipButton(label,handler){
  const body = document.getElementById('equipMenuBody');
  if(!body) return;

  const btn = document.createElement('button');
  btn.textContent = label;
  btn.onclick = handler;
  body.appendChild(btn);
}

/* ===== 装備メニューを閉じる ===== */
function closeEquipMenu(){
  const menu = document.getElementById('equipMenu');
  if(menu) menu.classList.add('hidden');
}

/* ===== 装備変更 ===== */
function equipWeapon(id){
  const item = findWeapon(id);
  if(!item) return;

  state.player.equip.weapon = id;

  const msg = `${item.name} を装備した！`;

  if(isMapMode()) setMapMessage(msg);
  else setMessage(msg);

  openEquipMenu();
  updateUI();
}

function equipUniform(id){
  const item = findUniform(id);
  if(!item) return;

  state.player.equip[item.slot] = id;

  const msg = `${item.name} を装備した！`;

  if(isMapMode()) setMapMessage(msg);
  else setMessage(msg);

  openEquipMenu();
  updateUI();
}

/* ===== 装備関連の調整 helper ===== */
function findEquipmentById(id){
  const weapon = equipmentData.weapons.find(item => item.id === id);
  if(weapon) return weapon;

  const uniform = equipmentData.uniforms.find(item => item.id === id);
  if(uniform) return uniform;

  return null;
}

function patchEquipment(id, patch){
  const item = findEquipmentById(id);
  if(!item) return false;

  Object.assign(item, patch);
  return true;
}

/* ==================================================
   装備データ追加・レアリティ付与
================================================== */
function potoroHasEquipmentData(){
  return (
    typeof equipmentData !== 'undefined' &&
    equipmentData &&
    Array.isArray(equipmentData.weapons) &&
    Array.isArray(equipmentData.uniforms)
  );
}

function potoroAddWeaponIfMissing(item){
  if(!potoroHasEquipmentData()) return false;
  if(equipmentData.weapons.some(w => w.id === item.id)) return false;

  equipmentData.weapons.push(item);
  return true;
}

function potoroAddUniformIfMissing(item){
  if(!potoroHasEquipmentData()) return false;
  if(equipmentData.uniforms.some(u => u.id === item.id)) return false;

  equipmentData.uniforms.push(item);
  return true;
}

function potoroPatchEquipmentRarity(){
  if(!potoroHasEquipmentData()) return false;

  const weaponRarity = {
    rod:'C',
    frill_blade:'B',
    gokitaku_mace:'B'
  };

  const uniformRarity = {
    maid_headband:'C',
    white_apron:'C',
    service_proof:'C',
    black_stocking:'C',
    heart_tiara:'B',
    long_maid:'B',
    legend_nameplate:'B',
    rose_ribbon:'A',
    oshi_pendant:'A',
    first_maid:'EVENT'
  };

  equipmentData.weapons.forEach(w => {
    if(!w.rarity) w.rarity = weaponRarity[w.id] || 'B';
  });

  equipmentData.uniforms.forEach(u => {
    if(!u.rarity) u.rarity = uniformRarity[u.id] || 'B';
  });

  return true;
}

function potoroInstallEquipmentRarityAddon(){
  if(!potoroHasEquipmentData()){
    console.warn('[PO・TORO QUEST] equipmentData が見つからないため、装備追加をスキップしました。読み込み順を確認してください。');
    return false;
  }

  potoroPatchEquipmentRarity();

  [
    {
      id:'silver_tea_spoon',
      name:'シルバーティースプーン',
      rarity:'A',
      atk:6,
      desc:'トーク力+20%。おまじない消費MP-1。',
      effect:{magicMpMinus:1,talkRate:0.20}
    },
    {
      id:'punish_frying_pan',
      name:'お仕置きフライパン',
      rarity:'A',
      atk:12,
      spd:-2,
      desc:'20%でスタン付与。すばやさ-2。',
      effect:{stunChance:0.20}
    },
    {
      id:'kirameki_tray',
      name:'きらめきトレイ',
      rarity:'A',
      atk:5,
      desc:'低確率で追撃。ご奉仕連撃のヒット数+1。',
      effect:{multiHitChance:0.16,multiMagicBonus:1}
    },
    {
      id:'legend_menu',
      name:'伝説のメニュー表',
      rarity:'S',
      atk:8,
      desc:'ボスへのダメージ+30%。通常敵へのダメージ-10%。',
      effect:{bossDamageRate:0.30,normalDamageRate:-0.10}
    },
    {
      id:'magic_staff',
      name:'おまじないステッキ',
      rarity:'B',
      atk:4,
      desc:'おまじない消費MP-2。回復系おまじない+20%。',
      effect:{magicMpMinus:2,healMagicRate:0.20}
    },
    {
      id:'calling_bell',
      name:'ご主人様呼び鈴',
      rarity:'B',
      atk:3,
      def:2,
      desc:'防御時の被ダメージをさらに軽減する。',
      effect:{guardDamageCut:0.30}
    },
    {
      id:'speed_tray',
      name:'スピードトレイ',
      rarity:'A',
      atk:5,
      spd:4,
      desc:'開幕先手を取りやすい速度型武器。',
      effect:{firstTurnSpdBonus:20,afterTurnSpdPenalty:3}
    },
    {
      id:'service_hammer',
      name:'お給仕ハンマー',
      rarity:'A',
      atk:9,
      desc:'攻撃時に防御ダウンを狙える。防御ダウン中の敵に火力上昇。',
      effect:{defDownChance:0.28,defDownDamageRate:0.25}
    }
  ].forEach(potoroAddWeaponIfMissing);

  [
    {
      id:'fuwamoko_headband',
      name:'ふわもこカチューシャ',
      slot:'head',
      rarity:'B',
      def:6,
      desc:'被ダメージ-10%。',
      effect:{damageCutRate:0.10}
    },
    {
      id:'kirarin_headdress',
      name:'きらりんヘッドドレス',
      slot:'head',
      rarity:'B',
      def:4,
      spd:4,
      desc:'すばやさ+4。'
    },
    {
      id:'lucky_headband',
      name:'ラッキーカチューシャ',
      slot:'head',
      rarity:'B',
      def:3,
      desc:'クリティカル率+10%、ドロップ率+10%。',
      effect:{criticalRateBonus:0.10,itemDropRateBonus:0.10}
    },
    {
      id:'heart_apron',
      name:'ハートエプロン',
      slot:'body',
      rarity:'B',
      def:7,
      desc:'毎ターンHP+3。',
      effect:{turnHpRegen:3}
    },
    {
      id:'perfect_maid_dress',
      name:'完璧メイドドレス',
      slot:'body',
      rarity:'A',
      def:9,
      desc:'バフ効果ターン+1。',
      effect:{buffTurnBonus:1}
    },
    {
      id:'healing_apron',
      name:'癒しのエプロン',
      slot:'body',
      rarity:'A',
      def:6,
      desc:'回復量+30%。回復時、低確率で状態異常回復。',
      effect:{healRate:0.30,statusHealChance:0.20}
    },
    {
      id:'cool_maid_dress',
      name:'クールメイドドレス',
      slot:'body',
      rarity:'B',
      def:8,
      desc:'混乱・睡眠耐性+50%。',
      effect:{sleepResist:0.50,confuseResist:0.50}
    },
    {
      id:'heavy_maid_armor',
      name:'重装メイドアーマー',
      slot:'body',
      rarity:'S',
      def:14,
      spd:-5,
      desc:'被ダメージ-20%。すばやさ-5。',
      effect:{damageCutRate:0.20}
    },
    {
      id:'broMaid_photo',
      name:'推しのブロマイド',
      slot:'accessory',
      rarity:'A',
      def:0,
      desc:'トーク力+30%。防御-3。',
      effect:{talkRate:0.30,defPenalty:3}
    },
    {
      id:'magic_teacup',
      name:'魔法のティーカップ',
      slot:'accessory',
      rarity:'B',
      def:2,
      desc:'毎ターンMP+2。',
      effect:{turnMpRegen:2}
    },
    {
      id:'business_card',
      name:'ご主人様の名刺',
      slot:'accessory',
      rarity:'S',
      def:2,
      desc:'アイテムドロップ率+20%。',
      effect:{itemDropRateBonus:0.20}
    },
    {
      id:'forbidden_contract',
      name:'禁断の契約書',
      slot:'accessory',
      rarity:'A',
      def:0,
      desc:'攻撃+30%。毎ターンHP-5。',
      effect:{atkRate:0.30,turnHpCost:5}
    },
    {
      id:'magic_ribbon',
      name:'魔力のリボン',
      slot:'accessory',
      rarity:'A',
      def:1,
      desc:'おまじない威力+25%。MP消費+1。',
      effect:{magicDamageRate:0.25,magicMpPlus:1}
    },
    {
      id:'pocket_watch',
      name:'時間停止の懐中時計',
      slot:'accessory',
      rarity:'S',
      def:3,
      spd:-2,
      desc:'低確率で行動回数+1。',
      effect:{extraActionChance:0.12}
    },
    {
      id:'maid_note',
      name:'メイドの心得ノート',
      slot:'accessory',
      rarity:'A',
      def:3,
      desc:'状態異常ターン-1、バフターン+1。',
      effect:{statusTurnMinus:1,buffTurnBonus:1}
    },
    {
      id:'regular_proof',
      name:'常連の証',
      slot:'accessory',
      rarity:'A',
      def:4,
      desc:'ターン経過ごとに攻撃+1。',
      effect:{turnAtkStack:1,turnAtkStackMax:5}
    },
    {
      id:'point_card',
      name:'お給仕ポイントカード',
      slot:'accessory',
      rarity:'B',
      def:2,
      desc:'戦闘後のEXP+20%。低確率で追加報酬。',
      effect:{expRate:0.20,bonusRewardChance:0.08}
    }
  ].forEach(potoroAddUniformIfMissing);

  console.log('[PO・TORO QUEST] equipment rarity addon installed', {
    weapons:equipmentData.weapons.length,
    uniforms:equipmentData.uniforms.length
  });

  return true;
}

function potoroEquipmentAddonReport(){
  const report = {
    hasEquipmentData:potoroHasEquipmentData(),
    weapons:potoroHasEquipmentData() ? equipmentData.weapons.map(w => ({id:w.id,name:w.name,rarity:w.rarity})) : [],
    uniforms:potoroHasEquipmentData() ? equipmentData.uniforms.map(u => ({id:u.id,name:u.name,slot:u.slot,rarity:u.rarity})) : []
  };

  console.log('[PO・TORO QUEST equipment addon]',report);
  return report;
}

/* ==================================================
   装備バランス調整
================================================== */
function patchEquipmentStats(id, stats){
  const item = findEquipmentById(id);
  if(!item) return false;

  item.atk = stats.atk || 0;
  item.def = stats.def || 0;
  item.spd = stats.spd || 0;
  item.talk = stats.talk || 0;

  if(stats.rarity) item.rarity = stats.rarity;

  return true;
}

function installPotoroEquipmentBalance(){
  if(!potoroHasEquipmentData()){
    console.warn('[PO・TORO QUEST] equipmentData が見つからないため、装備バランス調整をスキップしました。');
    return false;
  }

  [
    ['rod',{rarity:'C',atk:3,def:0,spd:0,talk:0}],
    ['frill_blade',{rarity:'B',atk:7,def:0,spd:1,talk:0}],
    ['gokitaku_mace',{rarity:'B',atk:10,def:0,spd:-1,talk:0}],
    ['silver_tea_spoon',{rarity:'A',atk:6,def:0,spd:1,talk:10}],
    ['punish_frying_pan',{rarity:'A',atk:14,def:0,spd:-3,talk:0}],
    ['kirameki_tray',{rarity:'A',atk:9,def:1,spd:3,talk:3}],
    ['magic_staff',{rarity:'B',atk:4,def:0,spd:0,talk:8}],
    ['calling_bell',{rarity:'B',atk:5,def:4,spd:0,talk:2}],
    ['speed_tray',{rarity:'A',atk:7,def:0,spd:8,talk:0}],
    ['service_hammer',{rarity:'A',atk:12,def:2,spd:-1,talk:0}],
    ['legend_menu',{rarity:'S',atk:10,def:3,spd:3,talk:18}],
    ['maid_headband',{rarity:'C',atk:0,def:3,spd:0,talk:0}],
    ['heart_tiara',{rarity:'B',atk:0,def:6,spd:0,talk:2}],
    ['rose_ribbon',{rarity:'A',atk:0,def:10,spd:1,talk:4}],
    ['fuwamoko_headband',{rarity:'B',atk:0,def:6,spd:0,talk:1}],
    ['kirarin_headdress',{rarity:'B',atk:0,def:4,spd:5,talk:1}],
    ['lucky_headband',{rarity:'B',atk:0,def:3,spd:2,talk:2}],
    ['white_apron',{rarity:'C',atk:0,def:4,spd:0,talk:0}],
    ['long_maid',{rarity:'B',atk:0,def:9,spd:0,talk:1}],
    ['heart_apron',{rarity:'B',atk:0,def:7,spd:0,talk:3}],
    ['healing_apron',{rarity:'A',atk:0,def:9,spd:0,talk:6}],
    ['perfect_maid_dress',{rarity:'A',atk:0,def:11,spd:1,talk:5}],
    ['cool_maid_dress',{rarity:'B',atk:0,def:8,spd:2,talk:2}],
    ['heavy_maid_armor',{rarity:'S',atk:0,def:20,spd:-5,talk:0}],
    ['first_maid',{rarity:'EVENT',atk:3,def:28,spd:3,talk:8}],
    ['black_stocking',{rarity:'C',atk:0,def:2,spd:0,talk:0}],
    ['service_proof',{rarity:'C',atk:0,def:3,spd:0,talk:2}],
    ['oshi_pendant',{rarity:'A',atk:0,def:5,spd:2,talk:9}],
    ['legend_nameplate',{rarity:'B',atk:0,def:10,spd:0,talk:3}],
    ['broMaid_photo',{rarity:'A',atk:0,def:0,spd:0,talk:14}],
    ['magic_teacup',{rarity:'B',atk:0,def:3,spd:0,talk:5}],
    ['business_card',{rarity:'S',atk:4,def:4,spd:2,talk:12}],
    ['forbidden_contract',{rarity:'A',atk:12,def:0,spd:0,talk:0}],
    ['magic_ribbon',{rarity:'A',atk:0,def:2,spd:0,talk:13}],
    ['pocket_watch',{rarity:'S',atk:0,def:4,spd:14,talk:4}],
    ['maid_note',{rarity:'A',atk:0,def:5,spd:2,talk:7}],
    ['regular_proof',{rarity:'A',atk:7,def:5,spd:0,talk:3}],
    ['point_card',{rarity:'B',atk:0,def:3,spd:1,talk:3}]
  ].forEach(([id,stats]) => patchEquipmentStats(id,stats));

  console.log('[PO・TORO QUEST] equipment balance installed', potoroEquipmentBalanceReport());
  return true;
}

window.potoroEquipmentBalanceReport = function(){
  if(!potoroHasEquipmentData()){
    return {installed:false,reason:'equipmentData not found'};
  }

  return {
    installed:true,
    weapons:equipmentData.weapons.map(item => ({
      id:item.id,
      name:item.name,
      rarity:item.rarity,
      atk:item.atk || 0,
      def:item.def || 0,
      spd:item.spd || 0,
      talk:item.talk || 0
    })),
    uniforms:equipmentData.uniforms.map(item => ({
      id:item.id,
      name:item.name,
      slot:item.slot,
      rarity:item.rarity,
      atk:item.atk || 0,
      def:item.def || 0,
      spd:item.spd || 0,
      talk:item.talk || 0
    }))
  };
};

window.installPotoroEquipmentBalance = installPotoroEquipmentBalance;

potoroInstallEquipmentRarityAddon();
installPotoroEquipmentBalance();
