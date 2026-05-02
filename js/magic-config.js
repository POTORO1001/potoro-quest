/* =========================
   ポトロクエスト magic-config.js
   おまじない習得レベル設定（最新版）
========================= */

const POTORO_MAGIC_CONFIG = {
  learnLevels: {
    moe: 1,                // もえもえぎゅー
    cook: 2,               // おいしくなーれ
    aura: 3,               // キラキラオーラ
    sleep: 4,              // おやすみなさい
    flash: 5,              // チェキフラッシュ
    charge2: 6,            // 完璧なお給仕
    multi: 7,              // ご奉仕連撃
    charge: 8,             // 萌えちゃーじ
    rush: 9,               // ご帰宅ラッシュ
    fullheal: 10,          // ひなたぼっこ
    ultimate: 11           // にしきぬやまー
  }
};

/* ===== 習得判定 ===== */
function isMagicUnlocked(kind){
  const lv = state.player.lv;
  const needLv = POTORO_MAGIC_CONFIG.learnLevels[kind] || 999;
  return lv >= needLv;
}
