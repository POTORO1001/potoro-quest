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
