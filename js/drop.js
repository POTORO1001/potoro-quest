/* =========================
   ポトロクエスト drop.js（STEP20）
   ドロップ設計専用ファイル

   読み込み順：
   balance.js の後、event.js の前を推奨

   目的：
   - 通常敵からのどうぐドロップ
   - 戦闘後の装備ドロップ
   - レアドロップ
   - ボス撃破時の特別抽選
   をこのファイルで一元管理します。

   重要：
   - たまちゃん限定「初代メイド服」は維持します。
   - 初代メイド服は通常ドロップ・宝箱ドロップに入れません。
========================= */

/* ===== Drop Config ===== */
const POTORO_DROP_CONFIG = {
  version:'step20-drop-design',

  // 通常敵からのどうぐドロップ率
  itemDropRate:0.28,

  // 戦闘後の装備宝箱ドロップ率
  equipmentDropRate:0.25,

  // レア装備ドロップ率。通常装備抽選とは別枠。
  rareEquipmentDropRate:0.06,

  // ボス撃破時のチェキ券抽選は ending.js 側の 1/50 を維持
  bossSpecialDropRate:0,

  items:{
    teiji:[
      {id:'tea',name:'紅茶',count:1,rate:0.65},
      {id:'omurice',name:'オムライス',count:1,rate:0.35}
    ],
    kuufuku:[
      {id:'omurice',name:'オムライス',count:1,rate:0.80},
      {id:'tea',name:'紅茶',count:1,rate:0.20}
    ],
    zangyo:[
      {id:'tea',name:'紅茶',count:1,rate:0.70},
      {id:'omurice',name:'オムライス',count:1,rate:0.30}
    ],
    meisou:[
      {id:'tea',name:'紅茶',count:1,rate:0.55},
      {id:'horse',name:'くろれきし',count:1,rate:0.10},
      {id:'omurice',name:'オムライス',count:1,rate:0.35}
    ],
    gekimu:[
      {id:'omurice',name:'オムライス',count:1,rate:0.50},
      {id:'tea',name:'紅茶',count:1,rate:0.40},
      {id:'horse',name:'くろれきし',count:1,rate:0.10}
    ],
    neochi:[
      {id:'tea',name:'紅茶',count:1,rate:0.65},
      {id:'omurice',name:'オムライス',count:1,rate:0.35}
    ],
    deisui:[
      {id:'horse',name:'くろれきし',count:1,rate:0.18},
      {id:'tea',name:'紅茶',count:1,rate:0.42},
      {id:'omurice',name:'オムライス',count:1,rate:0.40}
    ],
    shisseki:[
      {id:'horse',name:'くろれきし',count:1,rate:0.22},
      {id:'omurice',name:'オムライス',count:1,rate:0.38},
      {id:'tea',name:'紅茶',count:1,rate:0.40}
    ]
  },

  equipment:{
    floor1:[
      {type:'weapon',id:'frill_blade',name:'フリルブレード',rate:0.20},
      {type:'uniform',id:'maid_headband',name:'メイドカチューシャ',rate:0.30},
      {type:'uniform',id:'white_apron',name:'純白エプロン',rate:0.30},
      {type:'uniform',id:'service_proof',name:'お給仕の証',rate:0.20}
    ],
    floor2:[
      {type:'weapon',id:'gokitaku_mace',name:'ご帰宅メイス',rate:0.16},
      {type:'uniform',id:'heart_tiara',name:'ハートティアラ',rate:0.17},
      {type:'uniform',id:'rose_ribbon',name:'ローズリボン',rate:0.15},
      {type:'uniform',id:'long_maid',name:'ロングメイド服',rate:0.18},
      {type:'uniform',id:'oshi_pendant',name:'推し活ペンダント',rate:0.18},
      {type:'uniform',id:'legend_nameplate',name:'伝説の名札',rate:0.16}
    ]
  },

  rareEquipment:{
    floor1:[
      {type:'uniform',id:'heart_tiara',name:'ハートティアラ',rate:0.55},
      {type:'uniform',id:'oshi_pendant',name:'推し活ペンダント',rate:0.45}
    ],
    floor2:[
      {type:'uniform',id:'legend_nameplate',name:'伝説の名札',rate:0.55},
      {type:'uniform',id:'rose_ribbon',name:'ローズリボン',rate:0.45}
    ]
  }
};

/* ===== Weighted Pick ===== */
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

/* ===== Item Drop ===== */
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

/* ===== Equipment Drop ===== */
function getEquipmentDropPool(){
  return state.floor === 1
    ? POTORO_DROP_CONFIG.equipment.floor1
    : POTORO_DROP_CONFIG.equipment.floor2;
}

function getRareEquipmentDropPool(){
  return state.floor === 1
    ? POTORO_DROP_CONFIG.rareEquipment.floor1
    : POTORO_DROP_CONFIG.rareEquipment.floor2;
}

function isEquipmentOwned(drop){
  const p = state.player;

  if(drop.type === 'weapon'){
    return p.inventory.weapons.includes(drop.id);
  }

  if(drop.type === 'uniform'){
    return p.inventory.uniforms.includes(drop.id);
  }

  return true;
}

function addDroppedEquipment(drop){
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

function rollEquipmentDrop(){
  if(Math.random() >= POTORO_DROP_CONFIG.equipmentDropRate) return null;

  const candidates = getEquipmentDropPool().filter(drop => !isEquipmentOwned(drop));
  if(!candidates.length) return null;

  return pickWeightedDrop(candidates);
}

function rollRareEquipmentDrop(){
  if(Math.random() >= POTORO_DROP_CONFIG.rareEquipmentDropRate) return null;

  const candidates = getRareEquipmentDropPool().filter(drop => !isEquipmentOwned(drop));
  if(!candidates.length) return null;

  return pickWeightedDrop(candidates);
}

function applyEquipmentDrop(drop,isRare=false){
  if(!drop) return false;

  const added = addDroppedEquipment(drop);
  if(!added) return false;

  const prefix = isRare ? 'レアドロップ！' : '装備品を発見！';
  const statText = getEquipmentDropStatText(drop.id);

  openTreasureMenu(`${prefix} ${drop.name} を手に入れた！${statText}`);

  return true;
}

function getEquipmentDropStatText(id){
  const weapon = typeof getWeaponById === 'function'
    ? getWeaponById(id)
    : (typeof findWeapon === 'function' ? findWeapon(id) : null);

  if(weapon) return ` 攻撃 +${weapon.atk}`;

  const uniform = typeof getUniformById === 'function'
    ? getUniformById(id)
    : (typeof findUniform === 'function' ? findUniform(id) : null);

  if(uniform) return ` 防御 +${uniform.def}`;

  return '';
}

/* ===== giveReward Override =====
   通常敵のどうぐドロップをここで管理します。
========================= */
function giveReward(enemyId){
  const drop = rollItemDrop(enemyId);

  if(!drop) return false;

  return applyItemDrop(drop);
}

/* ===== treasureDrop Override =====
   戦闘後の装備ドロップをここで管理します。
========================= */
function treasureDrop(enemyId){
  // たまちゃん・ボスは通常装備ドロップ対象外
  if(enemyId === 'tamachan' || enemyId === 'boss') return false;

  const rare = rollRareEquipmentDrop();
  if(rare){
    return applyEquipmentDrop(rare,true);
  }

  const normal = rollEquipmentDrop();
  if(normal){
    return applyEquipmentDrop(normal,false);
  }

  return false;
}

/* ===== Drop Rate Helpers ===== */
function setItemDropRate(rate){
  POTORO_DROP_CONFIG.itemDropRate = Math.max(0,Math.min(1,rate));
  return POTORO_DROP_CONFIG.itemDropRate;
}

function setEquipmentDropRate(rate){
  POTORO_DROP_CONFIG.equipmentDropRate = Math.max(0,Math.min(1,rate));
  return POTORO_DROP_CONFIG.equipmentDropRate;
}

function setRareEquipmentDropRate(rate){
  POTORO_DROP_CONFIG.rareEquipmentDropRate = Math.max(0,Math.min(1,rate));
  return POTORO_DROP_CONFIG.rareEquipmentDropRate;
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
    equipment:{},
    rare:{}
  };

  for(let i=0;i<times;i++){
    const item = rollItemDrop(enemyId);
    if(item) result.item[item.id] = (result.item[item.id] || 0) + 1;

    const equip = rollEquipmentDrop();
    if(equip) result.equipment[equip.id] = (result.equipment[equip.id] || 0) + 1;

    const rare = rollRareEquipmentDrop();
    if(rare) result.rare[rare.id] = (result.rare[rare.id] || 0) + 1;
  }

  console.log('[PO・TORO QUEST drop test]',result);
  return result;
}
