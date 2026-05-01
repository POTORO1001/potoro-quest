/* =========================
   ポトロクエスト equipment.js（STEP4）
   装備計算・装備メニュー分離ファイル

   読み込み順：
   1. js/game.js
   2. js/battle.js
   3. js/enemy.js
   4. js/equipment.js
   5. js/magic.js

   重要：
   - 既存 game.js の equipmentData はそのまま使用します。
   - const equipmentData は再定義しません。
   - 装備関連関数だけを equipment.js 側で上書きします。
========================= */

/* ===== 装備検索 ===== */
function findWeapon(id){
  return equipmentData.weapons.find(item => item.id === id) || null;
}

function findUniform(id){
  return equipmentData.uniforms.find(item => item.id === id) || null;
}

/* ===== 装備込みステータス ===== */
function totalAtk(){
  const p = state.player;
  const weapon = findWeapon(p.equip.weapon);
  return p.baseAtk + (weapon ? weapon.atk : 0);
}

function totalDef(){
  const p = state.player;
  let def = p.baseDef;

  ['head','body','accessory'].forEach(slot => {
    const item = findUniform(p.equip[slot]);
    if(item) def += item.def;
  });

  return def;
}

function totalSpd(){
  const p = state.player;
  return p.baseSpd || 0;
}

function totalTalk(){
  const p = state.player;
  return p.baseTalk || 0;
}

/* ===== 装備スロット表示名 ===== */
function slotName(slot){
  if(slot === 'head') return '頭';
  if(slot === 'body') return '胴';
  if(slot === 'accessory') return 'アクセ';
  return slot;
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
      .sort((a,b) => b.atk - a.atk),
    item => `武器：${item.name}　攻+${item.atk}`,
    item => equipWeapon(item.id),
    item => p.equip.weapon === item.id
  );

  const uniforms = p.inventory.uniforms
    .map(id => findUniform(id))
    .filter(Boolean);

  renderEquipGroup(
    body,
    '防具（頭）',
    uniforms.filter(item => item.slot === 'head').sort((a,b) => b.def - a.def),
    item => `頭：${item.name}　防+${item.def}`,
    item => equipUniform(item.id),
    item => p.equip.head === item.id
  );

  renderEquipGroup(
    body,
    '防具（胴）',
    uniforms.filter(item => item.slot === 'body').sort((a,b) => b.def - a.def),
    item => `胴：${item.name}　防+${item.def}`,
    item => equipUniform(item.id),
    item => p.equip.body === item.id
  );

  renderEquipGroup(
    body,
    '防具（アクセ）',
    uniforms.filter(item => item.slot === 'accessory').sort((a,b) => b.def - a.def),
    item => `アクセ：${item.name}　防+${item.def}`,
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
      btn.textContent = labelFn(item);

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

/* ===== 装備関連の調整 helper =====
   今後、装備データを game.js から完全分離する前段階として、
   ここで equipmentData を安全に調整できます。
========================= */

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

/* ===== STEP4時点では装備データは変更しない =====
   例：
   patchEquipment('frill_blade', { atk: 7 });
========================= */
