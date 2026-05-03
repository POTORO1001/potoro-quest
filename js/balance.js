/* =========================
   ポトロクエスト balance.js
   高難易度調整版 v3（敵攻撃力強化版）

   差し替え対象：
   js/balance.js

   目的：
   - 装備やレベルが少し上がっただけで被ダメ1になる問題を改善
   - 敵の攻撃力を全体的に強化
   - 中盤〜終盤ほど緊張感が残るように調整
   - hp/maxHp 同期修正は維持
========================= */

(function(){
  if(window.__potoroHardBalanceV3) return;
  window.__potoroHardBalanceV3 = true;

  function hasEnemies(){
    return typeof enemies !== 'undefined' && Array.isArray(enemies);
  }

  function enemyById(id){
    if(!hasEnemies()) return null;
    return enemies.find(enemy => enemy.id === id) || null;
  }

  function patchEnemy(id, stats){
    const enemy = enemyById(id);

    if(!enemy){
      console.warn('[PO・TORO QUEST hard balance v3] enemy not found:', id);
      return false;
    }

    if(typeof stats.hp === 'number'){
      stats.maxHp = stats.hp;
    }

    Object.assign(enemy, stats);
    return true;
  }

  function patchPlayer(){
    if(typeof initialPlayer === 'undefined') return false;

    /*
      主人公はv2と同じ。
      今回は敵攻撃力側で難易度調整する。
    */
    initialPlayer.maxHp = 30;
    initialPlayer.hp = 30;
    initialPlayer.maxMp = 10;
    initialPlayer.mp = 10;

    initialPlayer.baseAtk = 7;
    initialPlayer.baseDef = 4;
    initialPlayer.baseSpd = 6;
    initialPlayer.baseTalk = 7;

    initialPlayer.nextExp = 18;

    return true;
  }

  function patchEnemies(){
    /*
      1F序盤
      目標：
      - 装備前でも即死しない
      - ただし回復なし連戦はやや危険
    */
    patchEnemy('teiji',{
      hp:28,
      mp:0,
      maxMp:0,
      atk:11,
      def:3,
      spd:5,
      talk:4,
      exp:9
    });

    patchEnemy('kuufuku',{
      hp:36,
      mp:5,
      maxMp:5,
      atk:13,
      def:4,
      spd:5,
      talk:5,
      exp:13
    });

    /*
      1F中盤
      目標：
      - 少し装備を整えても3〜7程度は通る
      - オムライス使用判断が出る
    */
    patchEnemy('zangyo',{
      hp:50,
      mp:0,
      maxMp:0,
      atk:17,
      def:6,
      spd:6,
      talk:7,
      exp:20
    });

    /*
      1F終盤
      目標：
      - 迷走は状態異常＋そこそこの打点
      - 1F終盤で油断すると負ける
    */
    patchEnemy('meisou',{
      hp:56,
      mp:10,
      maxMp:10,
      atk:16,
      def:6,
      spd:9,
      talk:10,
      exp:26
    });

    /*
      2F序盤
      目標：
      - 2F突入直後に明確な危険を感じる
      - 防具があっても被ダメ1にはなりにくい
    */
    patchEnemy('neochi',{
      hp:70,
      mp:15,
      maxMp:15,
      atk:22,
      def:8,
      spd:6,
      talk:12,
      exp:32
    });

    patchEnemy('gekimu',{
      hp:80,
      mp:12,
      maxMp:12,
      atk:25,
      def:9,
      spd:7,
      talk:11,
      exp:38
    });

    /*
      2F中盤
      目標：
      - 回復どうぐ・おまじない温存がリスクになる
    */
    patchEnemy('deisui',{
      hp:92,
      mp:18,
      maxMp:18,
      atk:28,
      def:10,
      spd:7,
      talk:14,
      exp:48
    });

    /*
      2F終盤
      目標：
      - ボス前の強敵
      - 防具を揃えても数ダメージ以上は通る
    */
    patchEnemy('shisseki',{
      hp:110,
      mp:25,
      maxMp:25,
      atk:32,
      def:12,
      spd:10,
      talk:16,
      exp:65
    });

    patchEnemy('tamachan',{
      hp:1,
      mp:0,
      maxMp:0,
      atk:0,
      def:0,
      spd:99,
      talk:99,
      exp:0
    });

    /*
      ボス
      目標：
      - Lv15前後でも回復・防御・おまじない判断必須
    */
    patchEnemy('boss',{
      hp:280,
      mp:40,
      maxMp:40,
      atk:38,
      def:16,
      spd:11,
      talk:22,
      exp:120,
      boss:true
    });

    return true;
  }

  function installPotoroHardBalanceV3(){
    patchPlayer();
    patchEnemies();

    if(typeof updateUI === 'function') updateUI();
    if(typeof updateMapStatusPanel === 'function') updateMapStatusPanel();

    console.log('[PO・TORO QUEST] hard balance v3 installed', potoroHardBalanceReport());
    return true;
  }

  window.installPotoroHardBalanceV3 = installPotoroHardBalanceV3;

  window.potoroHardBalanceReport = function(){
    return {
      installed:true,
      version:'hard-balance-v3-enemy-atk-up',
      note:'敵攻撃力強化。hp/maxHp同期済み。',
      enemies:hasEnemies() ? enemies.map(enemy => ({
        id:enemy.id,
        name:enemy.name,
        hp:enemy.hp,
        maxHp:enemy.maxHp,
        atk:enemy.atk,
        def:enemy.def,
        spd:enemy.spd,
        talk:enemy.talk,
        exp:enemy.exp
      })) : []
    };
  };

  installPotoroHardBalanceV3();
})();
