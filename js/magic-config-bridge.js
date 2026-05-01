/* =========================
   ポトロクエスト magic-config-bridge.js（STEP17 補助）
   既存 magic.js を設定参照型に近づけるための軽量ブリッジ

   読み込み順：
   magic-config.js の後、magic.js の前に読み込むか、
   magic.js の後に読み込んで補助関数として使用できます。

   推奨：
   <script src="js/magic-config.js"></script>
   <script src="js/magic.js"></script>

   このファイルは必須ではありません。
   将来 magic.js を完全設定化するときの移行補助です。
========================= */

/* ===== Magic Cost Helper ===== */
function getMagicMpCost(kind){
  const config = typeof getMagicConfig === 'function'
    ? getMagicConfig(kind)
    : null;

  return config ? (config.mp || 0) : 0;
}

/* ===== Magic Damage Helper ===== */
function calcConfiguredMoeDamage(){
  const config = getMagicConfig('moe');

  if(!config){
    return moeMagicDamage();
  }

  const min = config.baseDamageMin || 25;
  const max = config.baseDamageMax || 30;
  const base = min + Math.floor(Math.random() * (max - min + 1));
  const talkScale = config.talkScale || 1.2;
  const talkBonus = Math.max(0,Math.floor((totalTalk() - 7) * talkScale));

  return base + talkBonus;
}

/* ===== Configured Added Magic Summary ===== */
function potoroMagicSummary(){
  const all = typeof getAllMagicConfigs === 'function'
    ? getAllMagicConfigs()
    : {};

  const summary = Object.keys(all).map(key => ({
    id:key,
    name:all[key].name,
    mp:all[key].mp,
    label:all[key].label
  }));

  console.table(summary);
  return summary;
}
