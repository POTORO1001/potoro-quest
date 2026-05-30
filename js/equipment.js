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
  if(e.criticalRateBonus) parts.push(`会心+${Math.round(e.criticalRateBonus*100)}%`);
  if(e.expRate) parts.push(`EXP+${Math.round(e.expRate*100)}%`);
  if(e.bonusRewardChance) parts.push(`追加報酬${Math.round(e.bonusRewardChance*100)}%`);
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
    frill_blade:'C',
    silver_tea_spoon:'C',
    gokitaku_mace:'B',
    punish_frying_pan:'B',
    kirameki_tray:'B',
    magic_staff:'B',
    calling_bell:'A',
    speed_tray:'A',
    service_hammer:'A',
    legend_menu:'S'
  };

  const uniformRarity = {
    maid_headband:'C',
    heart_tiara:'C',
    white_apron:'C',
    long_maid:'C',
    tea_time_dress:'C',
    service_proof:'C',
    black_stocking:'C',
    oshi_pendant:'C',
    heart_brooch:'C',
    rose_ribbon:'B',
    blue_rose_ribbon:'B',
    fuwamoko_headband:'B',
    heart_apron:'B',
    cool_maid_dress:'B',
    hannari_yukata:'B',
    business_card:'B',
    star_badge:'B',
    magic_ribbon:'B',
    maid_note:'B',
    kirarin_headdress:'A',
    lucky_headband:'A',
    healing_apron:'A',
    heavy_maid_armor:'A',
    perfect_maid_dress:'A',
    point_card:'A',
    broMaid_photo:'A',
    legend_nameplate:'A',
    royal_tiara:'S',
    royal_maid_dress:'S',
    royal_ring:'S',
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
      name:'フリルコースター',
      rarity:'C',
      atk:4,
      desc:'低確率で追加ダメージ。',
      effect:{multiHitChance:0.08}
    },
    {
      id:'punish_frying_pan',
      name:'お仕置きフライパン',
      rarity:'B',
      atk:10,
      spd:-1,
      desc:'低確率でスタン付与。すばやさ-1。',
      effect:{stunChance:0.16}
    },
    {
      id:'kirameki_tray',
      name:'きらめきネイル',
      rarity:'B',
      atk:7,
      spd:2,
      desc:'クリティカル率UP。',
      effect:{criticalRateBonus:0.10}
    },
    {
      id:'legend_menu',
      name:'伝説のメニュー表',
      rarity:'S',
      atk:15,
      talk:5,
      desc:'ボスへのダメージUP。',
      effect:{bossDamageRate:0.30}
    },
    {
      id:'magic_staff',
      name:'おまじないステッキ',
      rarity:'B',
      atk:5,
      desc:'おまじない消費MP-1。回復おまじない少しUP。',
      effect:{magicMpMinus:1,healMagicRate:0.20}
    },
    {
      id:'calling_bell',
      name:'レインボーサイリウム',
      rarity:'A',
      atk:11,
      talk:3,
      desc:'おまじない威力少しUP。',
      effect:{magicDamageRate:0.15}
    },
    {
      id:'speed_tray',
      name:'スピードトレイ',
      rarity:'A',
      atk:9,
      spd:5,
      desc:'開幕先手を取りやすい速度型武器。',
      effect:{firstTurnSpdBonus:20,afterTurnSpdPenalty:3}
    },
    {
      id:'service_hammer',
      name:'お給仕ハンマー',
      rarity:'A',
      atk:13,
      desc:'攻撃時に防御ダウンを狙える。防御ダウン中の敵に火力上昇。',
      effect:{defDownChance:0.28,defDownDamageRate:0.25}
    }
  ].forEach(potoroAddWeaponIfMissing);

  [
    {
      id:'fuwamoko_headband',
      name:'ブルーローズリボン',
      slot:'head',
      rarity:'B',
      def:6,
      talk:1,
      desc:'トーク+1。'
    },
    {
      id:'kirarin_headdress',
      name:'星屑の髪飾り',
      slot:'head',
      rarity:'A',
      def:7,
      desc:'毎ターンMP+1。',
      effect:{turnMpRegen:1}
    },
    {
      id:'lucky_headband',
      name:'極彩色の花かんむり',
      slot:'head',
      rarity:'A',
      def:8,
      talk:3,
      desc:'状態異常耐性少しUP。',
      effect:{sleepResist:0.25,confuseResist:0.25}
    },
    {
      id:'royal_tiara',
      name:'ロイヤルティアラ',
      slot:'head',
      rarity:'S',
      def:12,
      talk:4,
      desc:'被ダメージ少し軽減。',
      effect:{damageCutRate:0.10}
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
      name:'ベルベッドドレス',
      slot:'body',
      rarity:'A',
      def:11,
      talk:3,
      desc:'状態異常耐性UP。',
      effect:{sleepResist:0.50,confuseResist:0.50}
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
      name:'着ぐるみパジャマ',
      slot:'body',
      rarity:'B',
      def:8,
      spd:-1,
      desc:'睡眠耐性UP。',
      effect:{sleepResist:0.50}
    },
    {
      id:'heavy_maid_armor',
      name:'重装メイドアーマー',
      slot:'body',
      rarity:'A',
      def:14,
      spd:-5,
      desc:'被ダメージ-20%。すばやさ-5。',
      effect:{damageCutRate:0.20}
    },
    {
      id:'tea_time_dress',
      name:'ティータイムドレス',
      slot:'body',
      rarity:'C',
      def:4,
      desc:'毎ターンMP+1。',
      effect:{turnMpRegen:1}
    },
    {
      id:'hannari_yukata',
      name:'はんなり浴衣',
      slot:'body',
      rarity:'B',
      def:7,
      talk:2,
      desc:'トーク+2。'
    },
    {
      id:'royal_maid_dress',
      name:'ロイヤルメイド服',
      slot:'body',
      rarity:'S',
      def:17,
      talk:5,
      desc:'バフ効果ターン+1。',
      effect:{buffTurnBonus:1}
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
      name:'スター缶バッチ',
      slot:'accessory',
      rarity:'B',
      def:3,
      spd:2,
      desc:'クリティカル率少しUP。',
      effect:{criticalRateBonus:0.08}
    },
    {
      id:'business_card',
      name:'ご主人様の名刺',
      slot:'accessory',
      rarity:'B',
      def:2,
      desc:'アイテムドロップ率UP。',
      effect:{itemDropRateBonus:0.15}
    },
    {
      id:'magic_ribbon',
      name:'魔力のアクスタ',
      slot:'accessory',
      rarity:'B',
      def:2,
      desc:'おまじない威力UP。MP消費+1。',
      effect:{magicDamageRate:0.20,magicMpPlus:1}
    },
    {
      id:'maid_note',
      name:'メイドの心得ノート',
      slot:'accessory',
      rarity:'B',
      def:3,
      desc:'状態異常ターン-1、バフターン+1。',
      effect:{statusTurnMinus:1,buffTurnBonus:1}
    },
    {
      id:'point_card',
      name:'満タンポイントカード',
      slot:'accessory',
      rarity:'A',
      def:4,
      desc:'戦闘後のEXP+20%。低確率で追加報酬。',
      effect:{expRate:0.20,bonusRewardChance:0.08}
    },
    {
      id:'heart_brooch',
      name:'ハートのブローチ',
      slot:'accessory',
      rarity:'C',
      def:3,
      desc:'防御+3の安定アクセ。'
    },
    {
      id:'royal_ring',
      name:'ロイヤルリング',
      slot:'accessory',
      rarity:'S',
      def:10,
      talk:5,
      desc:'低確率で追加行動。',
      effect:{extraActionChance:0.12}
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

function patchEquipmentDetails(id, details){
  const item = findEquipmentById(id);
  if(!item) return false;

  if(details.name) item.name = details.name;
  if(details.desc !== undefined) item.desc = details.desc;
  if(details.effect !== undefined) item.effect = details.effect;
  if(details.slot) item.slot = details.slot;
  if(details.rarity) item.rarity = details.rarity;

  return true;
}

function installPotoroEquipmentBalance(){
  if(!potoroHasEquipmentData()){
    console.warn('[PO・TORO QUEST] equipmentData が見つからないため、装備バランス調整をスキップしました。');
    return false;
  }

  [
    ['rod',{name:'ご奉仕ロッド',desc:'基本武器。'}],
    ['frill_blade',{name:'お絵かきケチャップ',desc:'トーク+1。'}],
    ['silver_tea_spoon',{name:'フリルコースター',desc:'低確率で追加ダメージ。',effect:{multiHitChance:0.08}}],
    ['gokitaku_mace',{name:'ご帰宅メイス',desc:'安定火力。'}],
    ['punish_frying_pan',{name:'お仕置きフライパン',desc:'低確率でスタン付与。すばやさ-1。',effect:{stunChance:0.16}}],
    ['kirameki_tray',{name:'きらめきネイル',desc:'クリティカル率UP。',effect:{criticalRateBonus:0.10}}],
    ['magic_staff',{name:'おまじないステッキ',desc:'おまじない消費MP-1。回復おまじない少しUP。',effect:{magicMpMinus:1,healMagicRate:0.20}}],
    ['calling_bell',{name:'レインボーサイリウム',desc:'おまじない威力少しUP。',effect:{magicDamageRate:0.15}}],
    ['speed_tray',{name:'スピードトレイ',desc:'開幕先手を取りやすい速度型武器。',effect:{firstTurnSpdBonus:20,afterTurnSpdPenalty:3}}],
    ['service_hammer',{name:'お給仕ハンマー',desc:'攻撃時に防御ダウンを狙える。防御ダウン中の敵に火力上昇。',effect:{defDownChance:0.28,defDownDamageRate:0.25}}],
    ['legend_menu',{name:'伝説のメニュー表',desc:'ボスへのダメージUP。',effect:{bossDamageRate:0.30}}],
    ['maid_headband',{name:'メイドカチューシャ',desc:'基本頭装備。'}],
    ['heart_tiara',{name:'コットンシュシュ',desc:'すばやさ+1。'}],
    ['rose_ribbon',{name:'猫耳ヘアバンド',desc:'すばやさ+2。'}],
    ['fuwamoko_headband',{name:'ブルーローズリボン',desc:'トーク+1。'}],
    ['kirarin_headdress',{name:'星屑の髪飾り',desc:'毎ターンMP+1。',effect:{turnMpRegen:1}}],
    ['lucky_headband',{name:'極彩色の花かんむり',desc:'状態異常耐性少しUP。',effect:{sleepResist:0.25,confuseResist:0.25}}],
    ['royal_tiara',{name:'ロイヤルティアラ',desc:'被ダメージ少し軽減。',effect:{damageCutRate:0.10}}],
    ['white_apron',{name:'純白のエプロン',desc:'基本服。'}],
    ['long_maid',{name:'見習いメイド服',desc:'序盤安定。'}],
    ['tea_time_dress',{name:'ティータイムドレス',desc:'毎ターンMP+1。',effect:{turnMpRegen:1}}],
    ['heart_apron',{name:'ハートエプロン',desc:'毎ターンHP+3。',effect:{turnHpRegen:3}}],
    ['cool_maid_dress',{name:'着ぐるみパジャマ',desc:'睡眠耐性UP。',effect:{sleepResist:0.50}}],
    ['hannari_yukata',{name:'はんなり浴衣',desc:'トーク+2。'}],
    ['healing_apron',{name:'癒しのエプロン',desc:'回復量UP。',effect:{healRate:0.30,statusHealChance:0.20}}],
    ['heavy_maid_armor',{name:'重装メイドアーマー',desc:'被ダメージ-20%。すばやさ-5。',effect:{damageCutRate:0.20}}],
    ['perfect_maid_dress',{name:'ベルベッドドレス',desc:'状態異常耐性UP。',effect:{sleepResist:0.50,confuseResist:0.50}}],
    ['royal_maid_dress',{name:'ロイヤルメイド服',desc:'バフ効果ターン+1。',effect:{buffTurnBonus:1}}],
    ['first_maid',{name:'初代メイド服',desc:'たまちゃん限定。'}],
    ['black_stocking',{name:'黒のストッキング',desc:'基本アクセ。'}],
    ['service_proof',{name:'お給仕の証',desc:'トーク+2。'}],
    ['oshi_pendant',{name:'推し活ペンダント',desc:'トーク+1。ドロップ率少しUP。',effect:{itemDropRateBonus:0.05}}],
    ['heart_brooch',{name:'ハートのブローチ',desc:'防御+3の安定アクセ。'}],
    ['business_card',{name:'ご主人様の名刺',desc:'アイテムドロップ率UP。',effect:{itemDropRateBonus:0.15}}],
    ['magic_teacup',{name:'スター缶バッチ',desc:'クリティカル率少しUP。',effect:{criticalRateBonus:0.08}}],
    ['magic_ribbon',{name:'魔力のアクスタ',desc:'おまじない威力UP。MP消費+1。',effect:{magicDamageRate:0.20,magicMpPlus:1}}],
    ['maid_note',{name:'メイドの心得ノート',desc:'状態異常ターン-1、バフターン+1。',effect:{statusTurnMinus:1,buffTurnBonus:1}}],
    ['point_card',{name:'満タンポイントカード',desc:'戦闘後のEXP+20%。低確率で追加報酬。',effect:{expRate:0.20,bonusRewardChance:0.08}}],
    ['broMaid_photo',{name:'推しのブロマイド',desc:'トーク+5。'}],
    ['legend_nameplate',{name:'伝説の名札',desc:'安定型アクセ。'}],
    ['royal_ring',{name:'ロイヤルリング',desc:'低確率で追加行動。',effect:{extraActionChance:0.12}}]
  ].forEach(([id,details]) => patchEquipmentDetails(id,details));

  [
    ['rod',{rarity:'C',atk:2,def:0,spd:0,talk:0}],
    ['frill_blade',{rarity:'C',atk:3,def:0,spd:0,talk:1}],
    ['silver_tea_spoon',{rarity:'C',atk:4,def:0,spd:0,talk:0}],
    ['gokitaku_mace',{rarity:'B',atk:8,def:0,spd:0,talk:0}],
    ['punish_frying_pan',{rarity:'B',atk:10,def:0,spd:-1,talk:0}],
    ['kirameki_tray',{rarity:'B',atk:7,def:0,spd:2,talk:0}],
    ['magic_staff',{rarity:'B',atk:5,def:0,spd:0,talk:0}],
    ['calling_bell',{rarity:'A',atk:11,def:0,spd:0,talk:3}],
    ['speed_tray',{rarity:'A',atk:9,def:0,spd:5,talk:0}],
    ['service_hammer',{rarity:'A',atk:13,def:0,spd:0,talk:0}],
    ['legend_menu',{rarity:'S',atk:15,def:0,spd:0,talk:5}],
    ['maid_headband',{rarity:'C',atk:0,def:3,spd:0,talk:0}],
    ['heart_tiara',{rarity:'C',atk:0,def:2,spd:1,talk:0}],
    ['rose_ribbon',{rarity:'B',atk:0,def:5,spd:2,talk:0}],
    ['fuwamoko_headband',{rarity:'B',atk:0,def:6,spd:0,talk:1}],
    ['kirarin_headdress',{rarity:'A',atk:0,def:7,spd:0,talk:0}],
    ['lucky_headband',{rarity:'A',atk:0,def:8,spd:0,talk:3}],
    ['royal_tiara',{rarity:'S',atk:0,def:12,spd:0,talk:4}],
    ['white_apron',{rarity:'C',atk:0,def:4,spd:0,talk:0}],
    ['long_maid',{rarity:'C',atk:0,def:5,spd:0,talk:0}],
    ['tea_time_dress',{rarity:'C',atk:0,def:4,spd:0,talk:0}],
    ['heart_apron',{rarity:'B',atk:0,def:7,spd:0,talk:0}],
    ['cool_maid_dress',{rarity:'B',atk:0,def:8,spd:-1,talk:0}],
    ['hannari_yukata',{rarity:'B',atk:0,def:7,spd:0,talk:2}],
    ['healing_apron',{rarity:'A',atk:0,def:9,spd:0,talk:0}],
    ['heavy_maid_armor',{rarity:'A',atk:0,def:14,spd:-5,talk:0}],
    ['perfect_maid_dress',{rarity:'A',atk:0,def:11,spd:0,talk:3}],
    ['royal_maid_dress',{rarity:'S',atk:0,def:17,spd:0,talk:5}],
    ['first_maid',{rarity:'EVENT',atk:3,def:28,spd:3,talk:8}],
    ['black_stocking',{rarity:'C',atk:0,def:2,spd:0,talk:0}],
    ['service_proof',{rarity:'C',atk:0,def:3,spd:0,talk:2}],
    ['oshi_pendant',{rarity:'C',atk:0,def:2,spd:0,talk:1}],
    ['heart_brooch',{rarity:'C',atk:0,def:3,spd:0,talk:0}],
    ['business_card',{rarity:'B',atk:0,def:2,spd:0,talk:0}],
    ['magic_teacup',{rarity:'B',atk:0,def:3,spd:2,talk:0}],
    ['magic_ribbon',{rarity:'B',atk:0,def:2,spd:0,talk:0}],
    ['maid_note',{rarity:'B',atk:0,def:3,spd:0,talk:0}],
    ['point_card',{rarity:'A',atk:0,def:4,spd:0,talk:0}],
    ['broMaid_photo',{rarity:'A',atk:0,def:1,spd:0,talk:5}],
    ['legend_nameplate',{rarity:'A',atk:0,def:8,spd:0,talk:3}],
    ['royal_ring',{rarity:'S',atk:0,def:10,spd:0,talk:5}]
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
