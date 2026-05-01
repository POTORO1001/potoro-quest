/* =========================
   ポトロクエスト item.js（STEP5）
   どうぐ処理分離ファイル

   読み込み順：
   1. js/game.js
   2. js/battle.js
   3. js/enemy.js
   4. js/equipment.js
   5. js/item.js
   6. js/magic.js

   重要：
   - 既存 game.js の player.items はそのまま使用します。
   - item.js は useItem を後読みで上書きします。
   - map / battle 両方から使えるようにしています。
========================= */

/* ===== どうぐ定義 ===== */
const POTORO_ITEMS = {
  omurice: {
    id: 'omurice',
    name: 'オムライス',
    label: 'オムライス　HP30回復',
    type: 'healHp',
    amount: 30,
    usableOnMap: true,
    usableInBattle: true
  },
  tea: {
    id: 'tea',
    name: '紅茶',
    label: '紅茶　MP10回復',
    type: 'healMp',
    amount: 10,
    usableOnMap: true,
    usableInBattle: true
  },
  horse: {
    id: 'horse',
    name: 'くろれきし',
    label: 'くろれきし　大ダメージ',
    type: 'damage',
    normalDamage: 999,
    bossDamage: 55,
    usableOnMap: false,
    usableInBattle: true
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

/* ===== どうぐ使用可能判定 ===== */
function canUseItem(kind){
  const item = getItemData(kind);
  const p = state.player;

  if(!item) return { ok:false, message:'そのどうぐは使えません！' };

  if(getItemCount(kind) <= 0){
    return { ok:false, message:`${item.name}は持っていない！` };
  }

  const mapMode = isMapMode();

  if(mapMode && !item.usableOnMap){
    return { ok:false, message:`${item.name}は戦闘中のみ使えます！` };
  }

  if(!mapMode && !item.usableInBattle){
    return { ok:false, message:`${item.name}は今は使えません！` };
  }

  if(item.type === 'healHp' && p.hp >= p.maxHp){
    return { ok:false, message:`${item.name}は使えない！` };
  }

  if(item.type === 'healMp' && p.mp >= p.maxMp){
    return { ok:false, message:`${item.name}は使えない！` };
  }

  return { ok:true, message:'' };
}

/* ===== どうぐメニュー用ラベル ===== */
function itemMenuLabel(kind){
  const item = getItemData(kind);
  if(!item) return kind;

  return `${item.label}　残り${getItemCount(kind)}`;
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

  /* HP回復 */
  if(item.type === 'healHp'){
    const heal = Math.min(item.amount, p.maxHp - p.hp);
    p.hp += heal;

    const msg = `${item.name}を食べた！ HPが ${heal} 回復！`;

    if(isMapMode()) setMapMessage(msg);
    else setMessage(msg);

    showDamage(-heal, 'player');
    seHeal();
    updateUI();

    await sleep(750);

    if(!isMapMode() && !state.enemyActedFirst) await enemyTurn();
  }

  /* MP回復 */
  else if(item.type === 'healMp'){
    const healMp = Math.min(item.amount, p.maxMp - p.mp);
    p.mp += healMp;

    const msg = `${item.name}を飲んだ！ MPが ${healMp} 回復！`;

    if(isMapMode()) setMapMessage(msg);
    else setMessage(msg);

    seHeal();
    updateUI();

    await sleep(750);

    if(!isMapMode() && !state.enemyActedFirst) await enemyTurn();
  }

  /* 攻撃アイテム */
  else if(item.type === 'damage'){
    if(isMapMode()){
      await failAction(`${item.name}は戦闘中のみ使えます！`);
      return;
    }

    const e = currentEnemy();
    const damage = e && e.boss ? item.bossDamage : item.normalDamage;

    await damageEnemy(`${item.name}を召喚した！`, damage);
  }

  state.enemyActedFirst = false;
  state.busy = false;
  setButtonsDisabled(false);
  updateUI();
}

/* ===== openSubMenu のどうぐ表示だけ拡張 =====
   game.js 側の openSubMenu を活かしつつ、
   item メニューだけ item.js の定義を使って再描画します。
========================= */

const _potoroItemOpenSubMenu = openSubMenu;

openSubMenu = function(kind){
  _potoroItemOpenSubMenu(kind);

  if(kind !== 'item') return;

  const title = document.getElementById('subMenuTitle');
  const body = document.getElementById('subMenuBody');

  if(!title || !body) return;

  title.textContent = 'どうぐ';
  body.innerHTML = '';

  addSubButton(itemMenuLabel('omurice'), () => useItem('omurice'));
  addSubButton(itemMenuLabel('tea'), () => useItem('tea'));
  addSubButton(itemMenuLabel('horse'), () => useItem('horse'));
};

/* ===== どうぐ追加・調整 helper ===== */

function addItem(kind, count=1){
  const p = state.player;
  if(!p.items) p.items = {};
  p.items[kind] = (p.items[kind] || 0) + count;
  updateUI();
}

function setItemCount(kind, count){
  const p = state.player;
  if(!p.items) p.items = {};
  p.items[kind] = Math.max(0, count);
  updateUI();
}

function patchItem(kind, patch){
  const item = getItemData(kind);
  if(!item) return false;
  Object.assign(item, patch);
  return true;
}

/* ===== STEP5時点では初期所持数は変更しない =====
   例：
   patchItem('omurice', { amount: 40 });
========================= */
