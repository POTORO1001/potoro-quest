/* =========================
   ポトロクエスト equipment-balance.js
   装備数値バランス調整版

   追加対象：
   js/equipment-balance.js

   目的：
   - 装備品の特殊効果はそのまま
   - atk / def / spd / talk の数値だけ整理
   - C / B / A / S のレア度に応じて強さを統一

   読み込み順：
   data-equipment-rarity-addon.js の後
   equipment.js の後でもOK

   推奨：
   <script src="js/equipment.js"></script>
   <script src="js/data-equipment-rarity-addon.js"></script>
   <script src="js/equipment-balance.js"></script>
========================= */

(function(){
  function hasEquipmentData(){
    return (
      typeof equipmentData !== 'undefined' &&
      equipmentData &&
      Array.isArray(equipmentData.weapons) &&
      Array.isArray(equipmentData.uniforms)
    );
  }

  function findWeaponForBalance(id){
    if(!hasEquipmentData()) return null;
    return equipmentData.weapons.find(item => item.id === id) || null;
  }

  function findUniformForBalance(id){
    if(!hasEquipmentData()) return null;
    return equipmentData.uniforms.find(item => item.id === id) || null;
  }

  function patchWeaponStats(id, stats){
    const item = findWeaponForBalance(id);
    if(!item) return false;

    item.atk = stats.atk || 0;
    item.def = stats.def || 0;
    item.spd = stats.spd || 0;
    item.talk = stats.talk || 0;

    if(stats.rarity) item.rarity = stats.rarity;

    return true;
  }

  function patchUniformStats(id, stats){
    const item = findUniformForBalance(id);
    if(!item) return false;

    item.atk = stats.atk || 0;
    item.def = stats.def || 0;
    item.spd = stats.spd || 0;
    item.talk = stats.talk || 0;

    if(stats.rarity) item.rarity = stats.rarity;

    return true;
  }

  function installPotoroEquipmentBalance(){
    if(!hasEquipmentData()){
      console.warn('[PO・TORO QUEST] equipmentData が見つからないため、装備バランス調整をスキップしました。');
      return false;
    }

    /* =========================
       武器
       役割：
       - 通常攻撃型
       - 魔法/トーク型
       - 速度型
       - ボス特効型
    ========================= */

    patchWeaponStats('rod', {
      rarity:'C',
      atk:3,
      def:0,
      spd:0,
      talk:0
    });

    patchWeaponStats('frill_blade', {
      rarity:'B',
      atk:7,
      def:0,
      spd:1,
      talk:0
    });

    patchWeaponStats('gokitaku_mace', {
      rarity:'B',
      atk:10,
      def:0,
      spd:-1,
      talk:0
    });

    patchWeaponStats('silver_tea_spoon', {
      rarity:'A',
      atk:6,
      def:0,
      spd:1,
      talk:10
    });

    patchWeaponStats('punish_frying_pan', {
      rarity:'A',
      atk:14,
      def:0,
      spd:-3,
      talk:0
    });

    patchWeaponStats('kirameki_tray', {
      rarity:'A',
      atk:9,
      def:1,
      spd:3,
      talk:3
    });

    patchWeaponStats('magic_staff', {
      rarity:'B',
      atk:4,
      def:0,
      spd:0,
      talk:8
    });

    patchWeaponStats('calling_bell', {
      rarity:'B',
      atk:5,
      def:4,
      spd:0,
      talk:2
    });

    patchWeaponStats('speed_tray', {
      rarity:'A',
      atk:7,
      def:0,
      spd:8,
      talk:0
    });

    patchWeaponStats('service_hammer', {
      rarity:'A',
      atk:12,
      def:2,
      spd:-1,
      talk:0
    });

    patchWeaponStats('legend_menu', {
      rarity:'S',
      atk:10,
      def:3,
      spd:3,
      talk:18
    });


    /* =========================
       頭装備
       役割：
       - C：最低限
       - B：便利枠
       - A：防御寄り
    ========================= */

    patchUniformStats('maid_headband', {
      rarity:'C',
      atk:0,
      def:3,
      spd:0,
      talk:0
    });

    patchUniformStats('heart_tiara', {
      rarity:'B',
      atk:0,
      def:6,
      spd:0,
      talk:2
    });

    patchUniformStats('rose_ribbon', {
      rarity:'A',
      atk:0,
      def:10,
      spd:1,
      talk:4
    });

    patchUniformStats('fuwamoko_headband', {
      rarity:'B',
      atk:0,
      def:6,
      spd:0,
      talk:1
    });

    patchUniformStats('kirarin_headdress', {
      rarity:'B',
      atk:0,
      def:4,
      spd:5,
      talk:1
    });

    patchUniformStats('lucky_headband', {
      rarity:'B',
      atk:0,
      def:3,
      spd:2,
      talk:2
    });


    /* =========================
       体装備
       役割：
       - 防御の主軸
       - 一部は回復/耐性/バフ向け
    ========================= */

    patchUniformStats('white_apron', {
      rarity:'C',
      atk:0,
      def:4,
      spd:0,
      talk:0
    });

    patchUniformStats('long_maid', {
      rarity:'B',
      atk:0,
      def:9,
      spd:0,
      talk:1
    });

    patchUniformStats('heart_apron', {
      rarity:'B',
      atk:0,
      def:7,
      spd:0,
      talk:3
    });

    patchUniformStats('healing_apron', {
      rarity:'A',
      atk:0,
      def:9,
      spd:0,
      talk:6
    });

    patchUniformStats('perfect_maid_dress', {
      rarity:'A',
      atk:0,
      def:11,
      spd:1,
      talk:5
    });

    patchUniformStats('cool_maid_dress', {
      rarity:'B',
      atk:0,
      def:8,
      spd:2,
      talk:2
    });

    patchUniformStats('heavy_maid_armor', {
      rarity:'S',
      atk:0,
      def:20,
      spd:-5,
      talk:0
    });

    patchUniformStats('first_maid', {
      rarity:'EVENT',
      atk:3,
      def:28,
      spd:3,
      talk:8
    });


    /* =========================
       アクセサリー
       役割：
       - ビルド差別化枠
       - 火力 / 魔法 / 速度 / 育成 / ドロップ
    ========================= */

    patchUniformStats('service_proof', {
      rarity:'C',
      atk:0,
      def:3,
      spd:0,
      talk:1
    });

    patchUniformStats('oshi_pendant', {
      rarity:'A',
      atk:0,
      def:5,
      spd:2,
      talk:9
    });

    patchUniformStats('legend_nameplate', {
      rarity:'B',
      atk:0,
      def:10,
      spd:0,
      talk:3
    });

    patchUniformStats('broMaid_photo', {
      rarity:'A',
      atk:0,
      def:0,
      spd:0,
      talk:14
    });

    patchUniformStats('magic_teacup', {
      rarity:'B',
      atk:0,
      def:3,
      spd:0,
      talk:5
    });

    patchUniformStats('business_card', {
      rarity:'S',
      atk:4,
      def:4,
      spd:2,
      talk:12
    });

    patchUniformStats('forbidden_contract', {
      rarity:'A',
      atk:12,
      def:0,
      spd:0,
      talk:0
    });

    patchUniformStats('magic_ribbon', {
      rarity:'A',
      atk:0,
      def:2,
      spd:0,
      talk:13
    });

    patchUniformStats('pocket_watch', {
      rarity:'S',
      atk:0,
      def:4,
      spd:14,
      talk:4
    });

    patchUniformStats('maid_note', {
      rarity:'A',
      atk:0,
      def:5,
      spd:2,
      talk:7
    });

    patchUniformStats('regular_proof', {
      rarity:'A',
      atk:7,
      def:5,
      spd:0,
      talk:3
    });

    patchUniformStats('point_card', {
      rarity:'B',
      atk:0,
      def:3,
      spd:1,
      talk:3
    });

    console.log('[PO・TORO QUEST] equipment balance installed', potoroEquipmentBalanceReport());

    return true;
  }

  window.potoroEquipmentBalanceReport = function(){
    if(!hasEquipmentData()){
      return {installed:false,reason:'equipmentData not found'};
    }

    return {
      installed:true,
      weapons:equipmentData.weapons.map(item => ({
        id:item.id,
        name:item.name,
        rarity:item.rarity,
        atk:item.atk || 0,
        def:item.def || 0,
        spd:item.spd || 0,
        talk:item.talk || 0
      })),
      uniforms:equipmentData.uniforms.map(item => ({
        id:item.id,
        name:item.name,
        slot:item.slot,
        rarity:item.rarity,
        atk:item.atk || 0,
        def:item.def || 0,
        spd:item.spd || 0,
        talk:item.talk || 0
      }))
    };
  };

  window.installPotoroEquipmentBalance = installPotoroEquipmentBalance;

  installPotoroEquipmentBalance();
})();
