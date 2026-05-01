/* =========================
   ポトロクエスト drop.js（回復アイテム入手しやすい版）
   装備品ドロップ廃止 / どうぐドロップ強化
========================= */

const POTORO_DROP_CONFIG = {
  version:'drop-item-only-easier-heal',

  itemDropRate:0.42,

  equipmentDropRate:0,
  rareEquipmentDropRate:0,

  items:{
    teiji:[
      {id:'tea',name:'紅茶',count:1,rate:0.72},
      {id:'omurice',name:'オムライス',count:1,rate:0.28}
    ],
    kuufuku:[
      {id:'omurice',name:'オムライス',count:1,rate:0.88},
      {id:'tea',name:'紅茶',count:1,rate:0.12}
    ],
    zangyo:[
      {id:'tea',name:'紅茶',count:1,rate:0.75},
      {id:'omurice',name:'オムライス',count:1,rate:0.25}
    ],
    meisou:[
      {id:'tea',name:'紅茶',count:1,rate:0.64},
      {id:'omurice',name:'オムライス',count:1,rate:0.34},
      {id:'horse',name:'くろれきし',count:1,rate:0.02}
    ],
    gekimu:[
      {id:'omurice',name:'オムライス',count:1,rate:0.58},
      {id:'tea',name:'紅茶',count:1,rate:0.39},
      {id:'horse',name:'くろれきし',count:1,rate:0.03}
    ],
    neochi:[
      {id:'tea',name:'紅茶',count:1,rate:0.72},
      {id:'omurice',name:'オムライス',count:1,rate:0.28}
    ],
    deisui:[
      {id:'tea',name:'紅茶',count:1,rate:0.47},
      {id:'omurice',name:'オムライス',count:1,rate:0.48},
      {id:'horse',name:'くろれきし',count:1,rate:0.05}
    ],
    shisseki:[
      {id:'tea',name:'紅茶',count:1,rate:0.44},
      {id:'omurice',name:'オムライス',count:1,rate:0.50},
      {id:'horse',name:'くろれきし',count:1,rate:0.06}
    ]
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

function applyItemDrop(drop){
  if(!drop) return false;

  const p = state.player;
  if(!p.items) p.items = {};

  p.items[drop.id] = (p.items[drop.id] || 0) + (drop.count || 1);

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

function treasureDrop(enemyId){
  return false;
}

function setItemDropRate(rate){
  POTORO_DROP_CONFIG.itemDropRate = Math.max(0,Math.min(1,rate));
  return POTORO_DROP_CONFIG.itemDropRate;
}

function setEquipmentDropRate(rate){
  console.warn('装備品ドロップは廃止されています。装備品は宝箱またはたまちゃんイベントからのみ入手します。');
  POTORO_DROP_CONFIG.equipmentDropRate = 0;
  return 0;
}

function setRareEquipmentDropRate(rate){
  console.warn('レア装備ドロップは廃止されています。装備品は宝箱またはたまちゃんイベントからのみ入手します。');
  POTORO_DROP_CONFIG.rareEquipmentDropRate = 0;
  return 0;
}

function potoroDropReport(){
  const report = JSON.parse(JSON.stringify(POTORO_DROP_CONFIG));
  console.log('[PO・TORO QUEST drop config]',report);
  return report;
}

function testDrop(enemyId='teiji',times=20){
  const result = {
    enemyId,
    item:{},
    equipment:'disabled',
    rare:'disabled'
  };

  for(let i=0;i<times;i++){
    const item = rollItemDrop(enemyId);
    if(item) result.item[item.id] = (result.item[item.id] || 0) + 1;
  }

  console.log('[PO・TORO QUEST drop test]',result);
  return result;
}
