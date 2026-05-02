const POTORO_DROP_CONFIG = {
  version:'treasure-rarity-edition',
  itemDropRate:0.42,
  equipmentDropRate:0,
  rareEquipmentDropRate:0,

  items:{
    teiji:[{id:'tea',name:'紅茶',count:1,rate:0.72},{id:'omurice',name:'オムライス',count:1,rate:0.28}],
    kuufuku:[{id:'omurice',name:'オムライス',count:1,rate:0.88},{id:'tea',name:'紅茶',count:1,rate:0.12}],
    zangyo:[{id:'tea',name:'紅茶',count:1,rate:0.75},{id:'omurice',name:'オムライス',count:1,rate:0.25}],
    meisou:[{id:'tea',name:'紅茶',count:1,rate:0.64},{id:'omurice',name:'オムライス',count:1,rate:0.34},{id:'horse',name:'くろれきし',count:1,rate:0.02}],
    gekimu:[{id:'omurice',name:'オムライス',count:1,rate:0.58},{id:'tea',name:'紅茶',count:1,rate:0.39},{id:'horse',name:'くろれきし',count:1,rate:0.03}],
    neochi:[{id:'tea',name:'紅茶',count:1,rate:0.72},{id:'omurice',name:'オムライス',count:1,rate:0.28}],
    deisui:[{id:'tea',name:'紅茶',count:1,rate:0.47},{id:'omurice',name:'オムライス',count:1,rate:0.48},{id:'horse',name:'くろれきし',count:1,rate:0.05}],
    shisseki:[{id:'tea',name:'紅茶',count:1,rate:0.44},{id:'omurice',name:'オムライス',count:1,rate:0.50},{id:'horse',name:'くろれきし',count:1,rate:0.06}]
  },

  treasureRates:{
    floor1:[{rarity:'C',rate:0.50},{rarity:'B',rate:0.35},{rarity:'A',rate:0.13},{rarity:'S',rate:0.02}],
    floor2:[{rarity:'B',rate:0.45},{rarity:'A',rate:0.40},{rarity:'S',rate:0.15}]
  },

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

const POTORO_DROP_CONFIG = { ... };

/* ===== 所持制限設定（ここに追加） ===== */
const POTORO_ITEM_LIMIT = {
  defaultMax: 5,

  limits: {
    'royal_milk_tea': 1,
    'refresh_aroma': 1,
    'forbidden_energy': 1,
    'coin_toss': 1,
    'unknown_drink': 1
  }
};

function pickWeightedDrop(list){
  if(!list || !list.length) return null;
  const total = list.reduce((sum,item) => sum + (item.rate || 0),0);
  if(total <= 0) return list[Math.floor(Math.random()*list.length)];
  let roll = Math.random() * total;
  for(const item of list){
    roll -= item.rate || 0;
    if(roll <= 0) return item;
  }
  return list[list.length-1];
}

function rollItemDrop(enemyId){
  if(Math.random() >= POTORO_DROP_CONFIG.itemDropRate) return null;
  const table = POTORO_DROP_CONFIG.items[enemyId];
  if(!table || !table.length) return null;
  return pickWeightedDrop(table);
}

/* ===== 所持制限チェック ===== */
function canAddItem(itemId, amount = 1){
  const p = state.player;
  if(!p.items) p.items = {};

  const current = p.items[itemId] || 0;

  const limit = POTORO_ITEM_LIMIT.limits[itemId];
  if(limit !== undefined){
    return current + amount <= limit;
  }

  return current + amount <= POTORO_ITEM_LIMIT.defaultMax;
}

function applyItemDrop(drop){
  if(!drop) return false;
  const p = state.player;
  if(!p.items) p.items = {};
  const amount = drop.count || 1;

if(!canAddItem(drop.id, amount)){
  setMessage(`${drop.name} はこれ以上持てない！`);
  return false;
}

p.items[drop.id] = (p.items[drop.id] || 0) + amount;
  setMessage(`${drop.name} を ${drop.count || 1}個 手に入れた！`);
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

function treasureDrop(enemyId){ return false; }

function setItemDropRate(rate){
  POTORO_DROP_CONFIG.itemDropRate = Math.max(0,Math.min(1,rate));
  return POTORO_DROP_CONFIG.itemDropRate;
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
  const rates = floor === 1 ? POTORO_DROP_CONFIG.treasureRates.floor1 : POTORO_DROP_CONFIG.treasureRates.floor2;
  return pickWeightedDrop(rates)?.rarity || 'B';
}
function getTreasureTableByFloorAndRarity(floor,rarity){
  const floorKey = floor === 1 ? 'floor1' : 'floor2';
  return POTORO_DROP_CONFIG.treasureTables[floorKey][rarity] || [];
}
function isTreasureEquipmentOwned(drop){
  const p = state.player;
  if(drop.type === 'weapon') return p.inventory.weapons.includes(drop.id);
  if(drop.type === 'uniform') return p.inventory.uniforms.includes(drop.id);
  return true;
}
function getTreasureEquipmentName(drop){
  if(drop.type === 'weapon') return getWeaponById(drop.id)?.name || drop.id;
  if(drop.type === 'uniform') return getUniformById(drop.id)?.name || drop.id;
  return drop.id;
}
function getTreasureEquipmentRarity(drop){
  if(drop.type === 'weapon') return getWeaponById(drop.id)?.rarity || 'B';
  if(drop.type === 'uniform') return getUniformById(drop.id)?.rarity || 'B';
  return 'B';
}
function getTreasureEquipmentStatText(drop){
  const item = drop.type === 'weapon' ? getWeaponById(drop.id) : getUniformById(drop.id);
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
    if(!p.inventory.weapons.includes(drop.id)){ p.inventory.weapons.push(drop.id); return true; }
  }
  if(drop.type === 'uniform'){
    if(!p.inventory.uniforms.includes(drop.id)){ p.inventory.uniforms.push(drop.id); return true; }
  }
  return false;
}
function rollTreasureEquipment(floor){
  const rarity = rollTreasureRarity(floor);
  let candidates = getTreasureTableByFloorAndRarity(floor,rarity).filter(drop => !isTreasureEquipmentOwned(drop));
  if(!candidates.length){
    const floorKey = floor === 1 ? 'floor1' : 'floor2';
    candidates = Object.values(POTORO_DROP_CONFIG.treasureTables[floorKey]).flat().filter(drop => !isTreasureEquipmentOwned(drop));
  }
  if(!candidates.length) return null;
  const drop = candidates[Math.floor(Math.random()*candidates.length)];
  return {...drop,rarity:getTreasureEquipmentRarity(drop)};
}
function giveMapTreasureEquipment(){
  const drop = rollTreasureEquipment(state.floor);
  if(!drop){
    setMapMessage('宝箱を開けた！ しかし、この階の装備品はすでに揃っていた。');
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
  return {drop,name,rarity,statText};
}
function potoroDropReport(){
  const report = JSON.parse(JSON.stringify(POTORO_DROP_CONFIG));
  console.log('[PO・TORO QUEST drop config]',report);
  return report;
}
function testDrop(enemyId='teiji',times=20){
  const result = {enemyId,item:{},equipment:'disabled',rare:'disabled'};
  for(let i=0;i<times;i++){
    const item = rollItemDrop(enemyId);
    if(item) result.item[item.id] = (result.item[item.id] || 0) + 1;
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
