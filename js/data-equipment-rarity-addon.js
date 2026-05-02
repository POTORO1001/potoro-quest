function potoroAddWeaponIfMissing(item){
  if(!window.equipmentData || !equipmentData.weapons) return false;
  if(equipmentData.weapons.some(w => w.id === item.id)) return false;
  equipmentData.weapons.push(item);
  return true;
}

function potoroAddUniformIfMissing(item){
  if(!window.equipmentData || !equipmentData.uniforms) return false;
  if(equipmentData.uniforms.some(u => u.id === item.id)) return false;
  equipmentData.uniforms.push(item);
  return true;
}

function potoroPatchEquipmentRarity(){
  if(!window.equipmentData) return;

  const weaponRarity = {
    rod:'C', frill_blade:'B', gokitaku_mace:'B'
  };

  const uniformRarity = {
    maid_headband:'C', white_apron:'C', service_proof:'C',
    heart_tiara:'B', long_maid:'B', legend_nameplate:'B',
    rose_ribbon:'A', oshi_pendant:'A', first_maid:'EVENT'
  };

  equipmentData.weapons.forEach(w => {
    if(!w.rarity) w.rarity = weaponRarity[w.id] || 'B';
  });

  equipmentData.uniforms.forEach(u => {
    if(!u.rarity) u.rarity = uniformRarity[u.id] || 'B';
  });
}

function potoroInstallEquipmentRarityAddon(){
  potoroPatchEquipmentRarity();

  /* ===== Weapons ===== */
  potoroAddWeaponIfMissing({
    id:'silver_tea_spoon',
    name:'シルバーティースプーン',
    rarity:'A',
    atk:6,
    desc:'トーク力+20%。おまじない消費MP-1。',
    effect:{magicMpMinus:1,talkRate:0.20}
  });

  potoroAddWeaponIfMissing({
    id:'punish_frying_pan',
    name:'お仕置きフライパン',
    rarity:'A',
    atk:12,
    spd:-2,
    desc:'20%でスタン付与。すばやさ-2。',
    effect:{stunChance:0.20}
  });

  potoroAddWeaponIfMissing({
    id:'kirameki_tray',
    name:'きらめきトレイ',
    rarity:'A',
    atk:5,
    desc:'低確率で追撃。ご奉仕連撃のヒット数+1。',
    effect:{multiHitChance:0.16,multiMagicBonus:1}
  });

  potoroAddWeaponIfMissing({
    id:'legend_menu',
    name:'伝説のメニュー表',
    rarity:'S',
    atk:8,
    desc:'ボスへのダメージ+30%。通常敵へのダメージ-10%。',
    effect:{bossDamageRate:0.30,normalDamageRate:-0.10}
  });

  potoroAddWeaponIfMissing({
    id:'magic_staff',
    name:'おまじないステッキ',
    rarity:'B',
    atk:4,
    desc:'おまじない消費MP-2。回復系おまじない+20%。',
    effect:{magicMpMinus:2,healMagicRate:0.20}
  });

  potoroAddWeaponIfMissing({
    id:'calling_bell',
    name:'ご主人様呼び鈴',
    rarity:'B',
    atk:3,
    def:2,
    desc:'防御時の被ダメージをさらに軽減する。',
    effect:{guardDamageCut:0.30}
  });

  potoroAddWeaponIfMissing({
    id:'speed_tray',
    name:'スピードトレイ',
    rarity:'A',
    atk:5,
    spd:4,
    desc:'開幕先手を取りやすい速度型武器。',
    effect:{firstTurnSpdBonus:20,afterTurnSpdPenalty:3}
  });

  potoroAddWeaponIfMissing({
    id:'service_hammer',
    name:'お給仕ハンマー',
    rarity:'A',
    atk:9,
    desc:'攻撃時に防御ダウンを狙える。防御ダウン中の敵に火力上昇。',
    effect:{defDownChance:0.28,defDownDamageRate:0.25}
  });

  /* ===== Uniforms / Accessories ===== */
  potoroAddUniformIfMissing({id:'fuwamoko_headband',name:'ふわもこカチューシャ',slot:'head',rarity:'B',def:6,desc:'被ダメージ-10%。',effect:{damageCutRate:0.10}});
  potoroAddUniformIfMissing({id:'kirarin_headdress',name:'きらりんヘッドドレス',slot:'head',rarity:'B',def:4,spd:4,desc:'すばやさ+4。'});
  potoroAddUniformIfMissing({id:'lucky_headband',name:'ラッキーカチューシャ',slot:'head',rarity:'B',def:3,desc:'クリティカル率+10%、ドロップ率+10%。',effect:{criticalRateBonus:0.10,itemDropRateBonus:0.10}});

  potoroAddUniformIfMissing({id:'heart_apron',name:'ハートエプロン',slot:'body',rarity:'B',def:7,desc:'毎ターンHP+3。',effect:{turnHpRegen:3}});
  potoroAddUniformIfMissing({id:'perfect_maid_dress',name:'完璧メイドドレス',slot:'body',rarity:'A',def:9,desc:'バフ効果ターン+1。',effect:{buffTurnBonus:1}});
  potoroAddUniformIfMissing({id:'healing_apron',name:'癒しのエプロン',slot:'body',rarity:'A',def:6,desc:'回復量+30%。回復時、低確率で状態異常回復。',effect:{healRate:0.30,statusHealChance:0.20}});
  potoroAddUniformIfMissing({id:'cool_maid_dress',name:'クールメイドドレス',slot:'body',rarity:'B',def:8,desc:'混乱・睡眠耐性+50%。',effect:{sleepResist:0.50,confuseResist:0.50}});
  potoroAddUniformIfMissing({id:'heavy_maid_armor',name:'重装メイドアーマー',slot:'body',rarity:'S',def:14,spd:-5,desc:'被ダメージ-20%。すばやさ-5。',effect:{damageCutRate:0.20}});

  potoroAddUniformIfMissing({id:'broMaid_photo',name:'推しのブロマイド',slot:'accessory',rarity:'A',def:0,desc:'トーク力+30%。防御-3。',effect:{talkRate:0.30,defPenalty:3}});
  potoroAddUniformIfMissing({id:'magic_teacup',name:'魔法のティーカップ',slot:'accessory',rarity:'B',def:2,desc:'毎ターンMP+2。',effect:{turnMpRegen:2}});
  potoroAddUniformIfMissing({id:'business_card',name:'ご主人様の名刺',slot:'accessory',rarity:'S',def:2,desc:'アイテムドロップ率+20%。',effect:{itemDropRateBonus:0.20}});
  potoroAddUniformIfMissing({id:'forbidden_contract',name:'禁断の契約書',slot:'accessory',rarity:'A',def:0,desc:'攻撃+30%。毎ターンHP-5。',effect:{atkRate:0.30,turnHpCost:5}});
  potoroAddUniformIfMissing({id:'magic_ribbon',name:'魔力のリボン',slot:'accessory',rarity:'A',def:1,desc:'おまじない威力+25%。MP消費+1。',effect:{magicDamageRate:0.25,magicMpPlus:1}});
  potoroAddUniformIfMissing({id:'pocket_watch',name:'時間停止の懐中時計',slot:'accessory',rarity:'S',def:3,spd:-2,desc:'低確率で行動回数+1。',effect:{extraActionChance:0.12}});
  potoroAddUniformIfMissing({id:'maid_note',name:'メイドの心得ノート',slot:'accessory',rarity:'A',def:3,desc:'状態異常ターン-1、バフターン+1。',effect:{statusTurnMinus:1,buffTurnBonus:1}});
  potoroAddUniformIfMissing({id:'regular_proof',name:'常連の証',slot:'accessory',rarity:'A',def:4,desc:'ターン経過ごとに攻撃+1。',effect:{turnAtkStack:1,turnAtkStackMax:5}});
  potoroAddUniformIfMissing({id:'point_card',name:'お給仕ポイントカード',slot:'accessory',rarity:'B',def:2,desc:'戦闘後のEXP+20%。低確率で追加報酬。',effect:{expRate:0.20,bonusRewardChance:0.08}});

  console.log('[PO・TORO QUEST] equipment rarity addon installed');
}

potoroInstallEquipmentRarityAddon();
