/* =========================
   ポトロクエスト map-ui-fix.js
   マップどうぐ使用 + マップステータス表示 修正
========================= */

/* ===== マップステータス表示 ===== */
function createMapStatusPanelIfNeeded(){
  const mapPanel = document.querySelector('.map-panel');
  if(!mapPanel) return null;

  let panel = document.getElementById('mapStatusPanel');
  if(panel) return panel;

  panel = document.createElement('div');
  panel.id = 'mapStatusPanel';
  panel.className = 'map-status-panel';

  const message = document.getElementById('mapMessage');
  if(message){
    message.insertAdjacentElement('afterend',panel);
  }else{
    mapPanel.appendChild(panel);
  }

  return panel;
}

function updateMapStatusPanel(){
  const panel = createMapStatusPanelIfNeeded();
  if(!panel || !state || !state.player) return;

  const p = state.player;

  const weaponName = typeof findWeapon === 'function'
    ? (findWeapon(p.equip.weapon)?.name || 'なし')
    : (p.equip.weapon || 'なし');

  const headName = typeof findUniform === 'function'
    ? (findUniform(p.equip.head)?.name || 'なし')
    : (p.equip.head || 'なし');

  const bodyName = typeof findUniform === 'function'
    ? (findUniform(p.equip.body)?.name || 'なし')
    : (p.equip.body || 'なし');

  const accessoryName = typeof findUniform === 'function'
    ? (findUniform(p.equip.accessory)?.name || 'なし')
    : (p.equip.accessory || 'なし');

  const status = typeof statusText === 'function' ? statusText() : 'なし';

  panel.innerHTML = `
    <div class="map-status-title">${p.name} Lv.${p.lv}</div>
    <div class="map-status-grid">
      <div>HP <strong>${p.hp}/${p.maxHp}</strong></div>
      <div>MP <strong>${p.mp}/${p.maxMp}</strong></div>
      <div>攻撃 <strong>${typeof totalAtk === 'function' ? totalAtk() : p.baseAtk}</strong></div>
      <div>防御 <strong>${typeof totalDef === 'function' ? totalDef() : p.baseDef}</strong></div>
      <div>速さ <strong>${typeof totalSpd === 'function' ? totalSpd() : p.baseSpd}</strong></div>
      <div>話術 <strong>${typeof totalTalk === 'function' ? totalTalk() : p.baseTalk}</strong></div>
    </div>
    <div class="map-status-line">状態：${status}</div>
    <div class="map-status-line">武器：${weaponName}</div>
    <div class="map-status-line">防具：${headName} / ${bodyName} / ${accessoryName}</div>
    <div class="map-status-line">EXP：${p.exp}/${p.nextExp}</div>
  `;
}

/* ===== updateUI / drawMaze 後に更新 ===== */
const _mapUiFixUpdateUI = updateUI;
updateUI = function(){
  _mapUiFixUpdateUI();
  updateMapStatusPanel();
};

if(typeof drawMaze === 'function'){
  const _mapUiFixDrawMaze = drawMaze;
  drawMaze = function(){
    const result = _mapUiFixDrawMaze();
    updateMapStatusPanel();
    return result;
  };
}

/* ===== マップ用どうぐ使用 ===== */
function getMapItemAmount(kind,fallback){
  if(typeof POTORO_ITEMS !== 'undefined' && POTORO_ITEMS[kind]){
    return POTORO_ITEMS[kind].amount || fallback;
  }

  if(kind === 'omurice') return 40;
  if(kind === 'tea') return 14;

  return fallback;
}

function potoroMapItemFail(message){
  if(typeof setMapMessage === 'function') setMapMessage(message);
  else if(typeof setMessage === 'function') setMessage(message);

  state.busy = false;
  if(typeof setButtonsDisabled === 'function') setButtonsDisabled(false);
  updateMapStatusPanel();
}

async function useMapItem(kind){
  const p = state.player;
  if(!p.items) p.items = {};

  state.busy = false;

  if(kind === 'omurice'){
    if((p.items.omurice || 0) <= 0){
      potoroMapItemFail('オムライスは持っていない！');
      return;
    }

    if(p.hp >= p.maxHp){
      potoroMapItemFail('HPはすでに満タンです！');
      return;
    }

    p.items.omurice--;

    const heal = Math.min(getMapItemAmount('omurice',40),p.maxHp - p.hp);
    p.hp += heal;

    setMapMessage(`オムライスを食べた！ HPが ${heal} 回復！`);
    if(typeof seHeal === 'function') seHeal();
    updateMapStatusPanel();
    return;
  }

  if(kind === 'tea'){
    if((p.items.tea || 0) <= 0){
      potoroMapItemFail('紅茶は持っていない！');
      return;
    }

    if(p.mp >= p.maxMp){
      potoroMapItemFail('MPはすでに満タンです！');
      return;
    }

    p.items.tea--;

    const healMp = Math.min(getMapItemAmount('tea',14),p.maxMp - p.mp);
    p.mp += healMp;

    setMapMessage(`紅茶を飲んだ！ MPが ${healMp} 回復！`);
    if(typeof seHeal === 'function') seHeal();
    updateMapStatusPanel();
    return;
  }

  if(kind === 'horse'){
    potoroMapItemFail('くろれきしは戦闘中のみ使えます！');
  }
}

const _mapUiFixUseItem = useItem;
useItem = async function(kind){
  if(typeof isMapMode === 'function' && isMapMode()){
    return useMapItem(kind);
  }

  return _mapUiFixUseItem(kind);
};

/* ===== どうぐメニュー表示補正 ===== */
function getMapItemLabel(kind){
  const p = state.player;
  const items = p.items || {};

  if(kind === 'omurice') return `オムライス　HP回復　残り${items.omurice || 0}`;
  if(kind === 'tea') return `紅茶　MP回復　残り${items.tea || 0}`;
  if(kind === 'horse') return `くろれきし　戦闘中のみ　残り${items.horse || 0}`;

  return kind;
}

const _mapUiFixOpenSubMenu = openSubMenu;
openSubMenu = function(kind){
  _mapUiFixOpenSubMenu(kind);

  if(kind !== 'item') return;

  const title = document.getElementById('subMenuTitle');
  const body = document.getElementById('subMenuBody');

  if(!title || !body) return;

  title.textContent = 'どうぐ';
  body.innerHTML = '';

  ['omurice','tea','horse'].forEach(itemKind => {
    const btn = document.createElement('button');
    btn.textContent = getMapItemLabel(itemKind);
    btn.onclick = () => useItem(itemKind);
    body.appendChild(btn);
  });
};

/* ===== 初期化 ===== */
function initMapUiFix(){
  createMapStatusPanelIfNeeded();
  updateMapStatusPanel();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded',initMapUiFix,{once:true});
}else{
  initMapUiFix();
}

function potoroMapUiFixReport(){
  const report = {
    version:'map-ui-fix',
    mapStatusPanel:!!document.getElementById('mapStatusPanel'),
    player:state.player ? {
      hp:state.player.hp,
      maxHp:state.player.maxHp,
      mp:state.player.mp,
      maxMp:state.player.maxMp,
      items:state.player.items
    } : null
  };

  console.log('[PO・TORO QUEST map-ui-fix]',report);
  return report;
}

console.log('[PO・TORO QUEST] map-ui-fix.js loaded');
