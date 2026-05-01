/* =========================
   ポトロクエスト drop.js（改良版）
   装備品ドロップ廃止 / どうぐドロップ専用

   変更点：
   - 敵から装備品はドロップしない
   - 装備品の入手は宝箱のみ
   - 例外：たまちゃんの初代メイド服
   - 戦闘後はどうぐのみドロップ
========================= */

const POTORO_DROP_CONFIG = {
  version:'drop-item-only',

  // 通常敵からのどうぐドロップ率
  itemDropRate:0.32,

  // 装備品ドロップは廃止
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
      {id:'tea',name:'紅茶',count:1,rate:0.72},
      {id:'omurice',name:'オムライス',count:1,rate:0.28}
    ],
    meisou:[
      {id:'tea',name:'紅茶',count:1,rate:0.60},
      {id:'omurice',name:'オムライス',count:1,rate:0.35},
      {id:'horse',name:'くろれきし',count:1,rate:0.05}
    ],
    gekimu:[
      {id:'omurice',name:'オムライス',count:1,rate:0.55},
      {id:'tea',name:'紅茶',count:1,rate:0.40},
      {id:'horse',name:'くろれきし',count:1,rate:0.05}
    ],
    neochi:[
      {id:'tea',name:'紅茶',count:1,rate:0.70},
      {id:'omurice',name:'オムライス',count:1,rate:0.30}
    ],
    deisui:[
      {id:'tea',name:'紅茶',count:1,rate:0.45},
      {id:'omurice',name:'オムライス',count:1,rate:0.45},
      {id:'horse',name:'くろれきし',count:1,rate:0.10}
    ],
    shisseki:[
      {id:'tea',name:'紅茶',count:1,rate:0.42},
      {id:'omurice',name:'オムライス',count:1,rate:0.46},
      {id:'horse',name:'くろれきし',count:1,rate:0.12}
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

/* ===== 通常敵：どうぐのみドロップ ===== */
function giveReward(enemyId){
  if(enemyId === 'tamachan' || enemyId === 'boss') return false;

  const drop = rollItemDrop(enemyId);

  if(!drop) return false;

  return applyItemDrop(drop);
}

/* ===== 装備品ドロップ完全停止 ===== */
function treasureDrop(enemyId){
  return false;
}

/* ===== Drop Rate Helpers ===== */
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

/* ===== Drop Debug ===== */
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
