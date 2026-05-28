/* =========================
   ポトロクエスト drop.js
   どうぐドロップ整理版

   差し替え対象：
   js/drop.js

   仕様：
   - 敵からは「どうぐのみ」ドロップ
   - 装備品は敵からドロップしない
   - 装備品は宝箱・たまちゃん限定
   - レア枠は低確率ドロップのみ
   - 条件付きボーナスなし
========================= */

var POTORO_DROP_CONFIG = {
  version:'item-drop-rare-only-edition',

  itemDropRate:0.42,

  rareItemDropRateByFloor:{
    floor1:0.08,
    floor2:0.14
  },

  equipmentDropRate:0,
  rareEquipmentDropRate:0,

  items:{
    teiji:[
      {id:'tea',name:'紅茶',count:1,rate:0.70},
      {id:'omurice',name:'オムライス',count:1,rate:0.30}
    ],

    kuufuku:[
      {id:'omurice',name:'オムライス',count:1,rate:0.85},
      {id:'tea',name:'紅茶',count:1,rate:0.15}
    ],

    zangyo:[
      {id:'tea',name:'紅茶',count:1,rate:0.75},
      {id:'omurice',name:'オムライス',count:1,rate:0.25}
    ],

    meisou:[
      {id:'cool_tea',name:'冷静の紅茶',count:1,rate:0.45},
      {id:'tea',name:'紅茶',count:1,rate:0.40},
      {id:'omurice',name:'オムライス',count:1,rate:0.15}
    ],

    gekimu:[
      {id:'omurice',name:'オムライス',count:1,rate:0.45},
      {id:'voice_message',name:'応援のボイスメッセージ',count:1,rate:0.35},
      {id:'tea',name:'紅茶',count:1,rate:0.20}
    ],

    neochi:[
      {id:'alarm_bell',name:'目覚ましベル',count:1,rate:0.55},
      {id:'tea',name:'紅茶',count:1,rate:0.35},
      {id:'omurice',name:'オムライス',count:1,rate:0.10}
    ],

    deisui:[
      {id:'refresh_aroma',name:'リフレッシュアロマ',count:1,rate:0.40},
      {id:'unknown_drink',name:'？？？ドリンク',count:1,rate:0.25},
      {id:'tea',name:'紅茶',count:1,rate:0.20},
      {id:'omurice',name:'オムライス',count:1,rate:0.15}
    ],

    shisseki:[
      {id:'service_manual',name:'お給仕マニュアル',count:1,rate:0.40},
      {id:'kira_powder',name:'キラキラパウダー',count:1,rate:0.30},
      {id:'omurice',name:'オムライス',count:1,rate:0.20},
      {id:'tea',name:'紅茶',count:1,rate:0.10}
    ]
  },

  rareItems:{
    floor1:[
      {id:'pancake',name:'ふわふわパンケーキ',count:1,rate:0.35},
      {id:'royal_milk_tea',name:'ロイヤルミルクティー',count:1,rate:0.25},
      {id:'sweets_plate',name:'ご褒美スイーツプレート',count:1,rate:0.20},
      {id:'refresh_aroma',name:'リフレッシュアロマ',count:1,rate:0.12},
      {id:'kira_powder',name:'キラキラパウダー',count:1,rate:0.08}
    ],

    floor2:[
      {id:'pancake',name:'ふわふわパンケーキ',count:1,rate:0.25},
      {id:'royal_milk_tea',name:'ロイヤルミルクティー',count:1,rate:0.20},
      {id:'sweets_plate',name:'ご褒美スイーツプレート',count:1,rate:0.20},
      {id:'refresh_aroma',name:'リフレッシュアロマ',count:1,rate:0.20},
      {id:'kira_powder',name:'キラキラパウダー',count:1,rate:0.15}
    ]
  },

  treasureRates:{
    floor1:[
      {rarity:'C',rate:0.50},
      {rarity:'B',rate:0.35},
      {rarity:'A',rate:0.13},
      {rarity:'S',rate:0.02}
    ],
    floor2:[
      {rarity:'B',rate:0.45},
      {rarity:'A',rate:0.40},
      {rarity:'S',rate:0.15}
    ]
  },

  treasureWeaponRate:0.30,

  treasureTables:{
    floor1:{
      C:[
        {type:'weapon',id:'rod'},
        {type:'uniform',id:'maid_headband'},
        {type:'uniform',id:'white_apron'},
        {type:'uniform',id:'service_proof'}
      ],
      B:[
        {type:'weapon',id:'frill_blade'},
        {type:'uniform',id:'heart_apron'},
        {type:'uniform',id:'fuwamoko_headband'},
        {type:'uniform',id:'lucky_headband'},
        {type:'uniform',id:'point_card'}
      ],
      A:[
        {type:'weapon',id:'silver_tea_spoon'},
        {type:'weapon',id:'kirameki_tray'},
        {type:'uniform',id:'healing_apron'},
        {type:'uniform',id:'magic_ribbon'},
        {type:'uniform',id:'maid_note'},
        {type:'uniform',id:'broMaid_photo'}
      ],
      S:[
        {type:'weapon',id:'legend_menu'}
      ]
    },

    floor2:{
      B:[
        {type:'weapon',id:'gokitaku_mace'},
        {type:'weapon',id:'magic_staff'},
        {type:'weapon',id:'calling_bell'},
        {type:'uniform',id:'kirarin_headdress'},
        {type:'uniform',id:'cool_maid_dress'},
        {type:'uniform',id:'magic_teacup'},
        {type:'uniform',id:'heart_tiara'},
        {type:'uniform',id:'long_maid'},
        {type:'uniform',id:'legend_nameplate'}
      ],
      A:[
        {type:'weapon',id:'punish_frying_pan'},
        {type:'weapon',id:'service_hammer'},
        {type:'weapon',id:'speed_tray'},
        {type:'uniform',id:'regular_proof'},
        {type:'uniform',id:'forbidden_contract'},
        {type:'uniform',id:'rose_ribbon'},
        {type:'uniform',id:'oshi_pendant'},
        {type:'uniform',id:'perfect_maid_dress'}
      ],
      S:[
        {type:'uniform',id:'pocket_watch'},
        {type:'uniform',id:'heavy_maid_armor'},
        {type:'uniform',id:'business_card'}
      ]
    }
  }
};

var POTORO_ITEM_LIMIT = {
  defaultMax:5,

  limits:{
    royal_milk_tea:1,
    refresh_aroma:1,
    forbidden_energy:1,
    coin_toss:1,
    unknown_drink:1,
    kira_powder:1,
    service_manual:1,
    sweets_plate:1
  }
};

const POTORO_TREASURE_EFFECTS = {enabled:true,sound:true};

function playTreasureRaritySound(rarity){
  if(!POTORO_TREASURE_EFFECTS.enabled || !POTORO_TREASURE_EFFECTS.sound) return;
  if(typeof tone !== 'function') return;

  if(rarity === 'S'){
    tone(523,.12,'triangle',.08,0);
    tone(659,.12,'triangle',.08,.12);
    tone(784,.18,'triangle',.08,.24);
    tone(1046,.32,'triangle',.09,.42);
  }else if(rarity === 'A'){
    tone(440,.12,'triangle',.07,0);
    tone(554,.16,'triangle',.07,.16);
    tone(659,.22,'triangle',.07,.32);
  }else if(rarity === 'B'){
    tone(392,.12,'triangle',.06,0);
    tone(523,.18,'triangle',.06,.16);
  }else{
    tone(330,.12,'triangle',.05,0);
  }
}

function showTreasureRarityEffect(rarity,name){
  if(!POTORO_TREASURE_EFFECTS.enabled) return;

  const effect = document.createElement('div');
  effect.className = `treasure-rarity-effect rarity-${String(rarity).toLowerCase()}`;
  effect.innerHTML = `
    <div class="treasure-rarity-card">
      <div class="treasure-rarity-label">${rarity} RARE</div>
      <div class="treasure-rarity-name">${name}</div>
    </div>`;

  document.body.appendChild(effect);
  playTreasureRaritySound(rarity);

  setTimeout(() => {
    if(effect && effect.parentNode) effect.remove();
  }, rarity === 'S' ? 1900 : 1400);
}

function toggleTreasureEffects(){
  POTORO_TREASURE_EFFECTS.enabled = !POTORO_TREASURE_EFFECTS.enabled;
  return POTORO_TREASURE_EFFECTS.enabled;
}

function potoroTreasureEffectsReport(){
  console.log('[PO・TORO QUEST treasure effects]',POTORO_TREASURE_EFFECTS);
  return POTORO_TREASURE_EFFECTS;
}

function pickWeightedDrop(list){
  if(!list || !list.length) return null;

  const total = list.reduce((sum,item) => sum + (item.rate || 0),0);
  if(total <= 0) return list[Math.floor(Math.random()*list.length)];

  let roll = Math.random() * total;

  for(const item of list){
    roll -= item.rate || 0;
    if(roll <= 0) return item;
  }

  return list[list.length - 1];
}

function getFloorKey(){
  return state.floor === 2 ? 'floor2' : 'floor1';
}

function rollRareItemDrop(){
  const floorKey = getFloorKey();
  const rate = POTORO_DROP_CONFIG.rareItemDropRateByFloor[floorKey] || 0;

  if(Math.random() >= rate) return null;

  const table = POTORO_DROP_CONFIG.rareItems[floorKey];
  if(!table || !table.length) return null;

  return pickWeightedDrop(table);
}

function rollNormalItemDrop(enemyId){
  if(Math.random() >= POTORO_DROP_CONFIG.itemDropRate) return null;

  const table = POTORO_DROP_CONFIG.items[enemyId];
  if(!table || !table.length) return null;

  return pickWeightedDrop(table);
}

function rollItemDrop(enemyId){
  const rare = rollRareItemDrop();
  if(rare) return {...rare,rare:true};

  return rollNormalItemDrop(enemyId);
}

function canAddItem(itemId,amount=1){
  const p = state.player;
  if(!p.items) p.items = {};

  const current = p.items[itemId] || 0;
  const limit = POTORO_ITEM_LIMIT.limits[itemId];

  if(limit !== undefined){
    return current + amount <= limit;
  }

  return current + amount <= POTORO_ITEM_LIMIT.defaultMax;
}

function getItemLimit(itemId){
  return POTORO_ITEM_LIMIT.limits[itemId] ?? POTORO_ITEM_LIMIT.defaultMax;
}

function applyItemDrop(drop){
  if(!drop) return false;

  const p = state.player;
  if(!p.items) p.items = {};

  const amount = drop.count || 1;

  if(!canAddItem(drop.id,amount)){
    setMessage(`${drop.name} はこれ以上持てない！`);
    return false;
  }

  p.items[drop.id] = (p.items[drop.id] || 0) + amount;

  if(drop.rare){
    setMessage(`レアドロップ！ ${drop.name} を ${amount}個 手に入れた！`);
  }else{
    setMessage(`${drop.name} を ${amount}個 手に入れた！`);
  }

  if(typeof seTreasure === 'function') seTreasure();
  if(typeof updateUI === 'function') updateUI();

  return true;
}

function giveReward(enemyId){
  if(enemyId === 'tamachan' || enemyId === 'boss') return false;

  const drop = rollItemDrop(enemyId);
  if(!drop) return false;

  return applyItemDrop(drop);
}

function treasureDrop(enemyId){
  return false;
}

function setItemDropRate(rate){
  POTORO_DROP_CONFIG.itemDropRate = Math.max(0,Math.min(1,rate));
  return POTORO_DROP_CONFIG.itemDropRate;
}

function setRareItemDropRate(floor,rate){
  const key = floor === 2 || floor === 'floor2' ? 'floor2' : 'floor1';
  POTORO_DROP_CONFIG.rareItemDropRateByFloor[key] = Math.max(0,Math.min(1,rate));
  return POTORO_DROP_CONFIG.rareItemDropRateByFloor[key];
}

function setEquipmentDropRate(rate){
  console.warn('敵からの装備品ドロップは廃止されています。');
  POTORO_DROP_CONFIG.equipmentDropRate = 0;
  return 0;
}

function setRareEquipmentDropRate(rate){
  console.warn('敵からのレア装備ドロップは廃止されています。');
  POTORO_DROP_CONFIG.rareEquipmentDropRate = 0;
  return 0;
}

function rollTreasureRarity(floor){
  const rates = floor === 1
    ? POTORO_DROP_CONFIG.treasureRates.floor1
    : POTORO_DROP_CONFIG.treasureRates.floor2;

  return pickWeightedDrop(rates)?.rarity || 'B';
}

function getTreasureTableByFloorAndRarity(floor,rarity){
  const floorKey = floor === 1 ? 'floor1' : 'floor2';
  return POTORO_DROP_CONFIG.treasureTables[floorKey][rarity] || [];
}

function pickTreasureCandidateByType(candidates){
  const weapons = candidates.filter(drop => drop.type === 'weapon');
  const uniforms = candidates.filter(drop => drop.type === 'uniform');
  const wantsWeapon = Math.random() < POTORO_DROP_CONFIG.treasureWeaponRate;
  const preferred = wantsWeapon ? weapons : uniforms;
  const fallback = wantsWeapon ? uniforms : weapons;
  const pool = preferred.length ? preferred : fallback;

  if(!pool.length) return null;
  return pool[Math.floor(Math.random()*pool.length)];
}

function isTreasureEquipmentOwned(drop){
  const p = state.player;

  if(drop.type === 'weapon') return p.inventory.weapons.includes(drop.id);
  if(drop.type === 'uniform') return p.inventory.uniforms.includes(drop.id);

  return true;
}

function getTreasureEquipmentObject(drop){
  if(drop.type === 'weapon'){
    if(typeof getWeaponById === 'function') return getWeaponById(drop.id);
    if(typeof findWeapon === 'function') return findWeapon(drop.id);
  }

  if(drop.type === 'uniform'){
    if(typeof getUniformById === 'function') return getUniformById(drop.id);
    if(typeof findUniform === 'function') return findUniform(drop.id);
  }

  return null;
}

function getTreasureEquipmentName(drop){
  return getTreasureEquipmentObject(drop)?.name || drop.id;
}

function getTreasureEquipmentRarity(drop){
  return getTreasureEquipmentObject(drop)?.rarity || drop.rarity || 'B';
}

function getTreasureEquipmentStatText(drop){
  const item = getTreasureEquipmentObject(drop);
  if(!item) return '';

  const parts = [];

  if(item.atk) parts.push(`攻撃 ${item.atk > 0 ? '+' : ''}${item.atk}`);
  if(item.def) parts.push(`防御 ${item.def > 0 ? '+' : ''}${item.def}`);
  if(item.spd) parts.push(`速さ ${item.spd > 0 ? '+' : ''}${item.spd}`);
  if(item.talk) parts.push(`話術 ${item.talk > 0 ? '+' : ''}${item.talk}`);

  return parts.length ? `（${parts.join(' / ')}）` : '';
}

function addTreasureEquipment(drop){
  const p = state.player;

  if(drop.type === 'weapon'){
    if(!p.inventory.weapons.includes(drop.id)){
      p.inventory.weapons.push(drop.id);
      return true;
    }
  }

  if(drop.type === 'uniform'){
    if(!p.inventory.uniforms.includes(drop.id)){
      p.inventory.uniforms.push(drop.id);
      return true;
    }
  }

  return false;
}

function refreshEquipMenuAfterTreasure(){
  const menu = document.getElementById('equipMenu');

  if(menu && !menu.classList.contains('hidden') && typeof openEquipMenu === 'function'){
    openEquipMenu();
    return true;
  }

  if(typeof updateUI === 'function'){
    updateUI();
    return true;
  }

  return false;
}

function rollTreasureEquipment(floor){
  if(typeof potoroInstallEquipmentRarityAddon === 'function'){
    potoroInstallEquipmentRarityAddon();
  }

  const rarity = rollTreasureRarity(floor);

  let candidates = getTreasureTableByFloorAndRarity(floor,rarity)
    .filter(drop => !isTreasureEquipmentOwned(drop));

  if(!candidates.length){
    const floorKey = floor === 1 ? 'floor1' : 'floor2';

    candidates = Object.values(POTORO_DROP_CONFIG.treasureTables[floorKey])
      .flat()
      .filter(drop => !isTreasureEquipmentOwned(drop));
  }

  if(!candidates.length) return null;

  const drop = pickTreasureCandidateByType(candidates);
  if(!drop) return null;

  return {
    ...drop,
    rarity:getTreasureEquipmentRarity(drop)
  };
}

function giveMapTreasureEquipment(){
  const drop = rollTreasureEquipment(state.floor);

  if(!drop){
    setMapMessage('宝箱を開けた！ しかし、この階の装備品はすでに揃っていた。');
    refreshEquipMenuAfterTreasure();
    return null;
  }

  addTreasureEquipment(drop);

  const name = getTreasureEquipmentName(drop);
  const rarity = getTreasureEquipmentRarity(drop);
  const statText = getTreasureEquipmentStatText(drop);

  setMapMessage(`宝箱を開けた！ 【${rarity}】${name} を手に入れた！ ${statText}`);

  if(typeof showTreasureRarityEffect === 'function') showTreasureRarityEffect(rarity,name);
  if(typeof seTreasure === 'function') seTreasure();
  if(typeof updateUI === 'function') updateUI();

  refreshEquipMenuAfterTreasure();

  return {drop,name,rarity,statText};
}

function potoroDropReport(){
  const report = JSON.parse(JSON.stringify(POTORO_DROP_CONFIG));
  console.log('[PO・TORO QUEST drop config]',report);
  return report;
}

function potoroItemLimitReport(){
  const report = {
    config:JSON.parse(JSON.stringify(POTORO_ITEM_LIMIT)),
    items:state.player ? JSON.parse(JSON.stringify(state.player.items || {})) : null
  };

  console.log('[PO・TORO QUEST item limits]',report);
  return report;
}

function testDrop(enemyId='teiji',times=50){
  const result = {
    enemyId,
    normal:{},
    rare:{},
    none:0
  };

  for(let i=0;i<times;i++){
    const item = rollItemDrop(enemyId);

    if(!item){
      result.none++;
      continue;
    }

    if(item.rare){
      result.rare[item.id] = (result.rare[item.id] || 0) + 1;
    }else{
      result.normal[item.id] = (result.normal[item.id] || 0) + 1;
    }
  }

  console.log('[PO・TORO QUEST drop test]',result);
  return result;
}

function testTreasure(floor=1,times=50){
  const result = {floor,C:0,B:0,A:0,S:0,items:{}};

  for(let i=0;i<times;i++){
    const rarity = rollTreasureRarity(floor);
    result[rarity] = (result[rarity] || 0) + 1;

    const table = getTreasureTableByFloorAndRarity(floor,rarity);
    const item = table[Math.floor(Math.random()*table.length)];

    if(item) result.items[item.id] = (result.items[item.id] || 0) + 1;
  }

  console.log('[PO・TORO QUEST treasure test]',result);
  return result;
}
