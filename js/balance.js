/* =========================
   ポトロクエスト balance.js
   BFS敵配置対応・敵/主人公バランス調整版

   差し替え対象：
   js/balance.js

   目的：
   - BFS距離による敵出現ランクに合わせて敵の強さを整理
   - 序盤に中〜強敵が出ても事故りにくくする
   - 中盤以降は回復・装備・おまじないを使う緊張感を出す
   - ボスは Lv15 前後で撃破を想定

   想定敵配置：
   1F序盤：定時 / 空腹
   1F中盤：空腹 / 残業
   1F終盤：残業 / 迷走

   2F序盤：寝落 / 激務
   2F中盤：激務 / 泥酔
   2F終盤：泥酔 / 叱責
========================= */

(function(){
  if(window.__potoroBalanceBfsInstalled) return;
  window.__potoroBalanceBfsInstalled = true;

  function hasEnemies(){
    return typeof enemies !== 'undefined' && Array.isArray(enemies);
  }

  function findEnemy(id){
    if(!hasEnemies()) return null;
    return enemies.find(enemy => enemy.id === id) || null;
  }

  function patchEnemy(id, patch){
    const enemy = findEnemy(id);

    if(!enemy){
      console.warn(`[PO・TORO QUEST balance] enemy not found: ${id}`);
      return false;
    }

    Object.assign(enemy, patch);
    return true;
  }

  function patchPlayerBase(){
    if(typeof initialPlayer === 'undefined') return false;

    /*
      主人公の初期値：
      序盤事故を防ぐため、少しだけ耐久寄り。
      火力は装備・おまじないで伸びる設計。
    */
    initialPlayer.maxHp = 36;
    initialPlayer.hp = 36;
    initialPlayer.maxMp = 12;
    initialPlayer.mp = 12;

    initialPlayer.baseAtk = 8;
    initialPlayer.baseDef = 5;
    initialPlayer.baseSpd = 7;
    initialPlayer.baseTalk = 8;

    initialPlayer.level = initialPlayer.level || 1;
    initialPlayer.exp = initialPlayer.exp || 0;
    initialPlayer.nextExp = 18;

    return true;
  }

  function patchLevelGrowth(){
    /*
      levelUp 関数が既存である場合、成長量だけ安全に補正します。
      既存の演出・おまじない習得処理は壊さないため、
      レベルアップ後のステータス補正として動きます。
    */
    if(typeof levelUp !== 'function') return false;
    if(window.__potoroLevelGrowthPatchedForBfsBalance) return true;

    window.__potoroLevelGrowthPatchedForBfsBalance = true;

    const originalLevelUp = levelUp;

    levelUp = function(){
      const p = state.player;
      const beforeLv = p.level;
      const beforeMaxHp = p.maxHp;
      const beforeMaxMp = p.maxMp;
      const beforeAtk = p.baseAtk || 0;
      const beforeDef = p.baseDef || 0;
      const beforeSpd = p.baseSpd || 0;
      const beforeTalk = p.baseTalk || 0;

      const result = originalLevelUp.apply(this, arguments);

      const afterLv = p.level;

      if(afterLv > beforeLv){
        const gained = afterLv - beforeLv;

        /*
          既存levelUpがすでに上げている場合もあるため、
          目標成長に満たない分だけ補う。
        */
        const targetHpGain = 5 * gained;
        const targetMpGain = 2 * gained;
        const targetAtkGain = 3 * gained;
        const targetDefGain = 2 * gained;
        const targetSpdGain = 1 * gained;
        const targetTalkGain = 3 * gained;

        const actualHpGain = p.maxHp - beforeMaxHp;
        const actualMpGain = p.maxMp - beforeMaxMp;
        const actualAtkGain = (p.baseAtk || 0) - beforeAtk;
        const actualDefGain = (p.baseDef || 0) - beforeDef;
        const actualSpdGain = (p.baseSpd || 0) - beforeSpd;
        const actualTalkGain = (p.baseTalk || 0) - beforeTalk;

        if(actualHpGain < targetHpGain){
          const diff = targetHpGain - actualHpGain;
          p.maxHp += diff;
          p.hp += diff;
        }

        if(actualMpGain < targetMpGain){
          const diff = targetMpGain - actualMpGain;
          p.maxMp += diff;
          p.mp += diff;
        }

        if(actualAtkGain < targetAtkGain) p.baseAtk = (p.baseAtk || 0) + (targetAtkGain - actualAtkGain);
        if(actualDefGain < targetDefGain) p.baseDef = (p.baseDef || 0) + (targetDefGain - actualDefGain);
        if(actualSpdGain < targetSpdGain) p.baseSpd = (p.baseSpd || 0) + (targetSpdGain - actualSpdGain);
        if(actualTalkGain < targetTalkGain) p.baseTalk = (p.baseTalk || 0) + (targetTalkGain - actualTalkGain);

        /*
          次レベル必要EXP：
          Lv15前後でボス到達しやすいテンポ。
        */
        p.nextExp = Math.floor(18 + p.level * p.level * 7.2);
      }

      if(typeof updateUI === 'function') updateUI();
      if(typeof updateMapStatusPanel === 'function') updateMapStatusPanel();

      return result;
    };

    return true;
  }

  function installEnemyBalance(){
    if(!hasEnemies()){
      console.warn('[PO・TORO QUEST balance] enemies が見つかりません。');
      return false;
    }

    /*
      1F序盤：定時 / 空腹
      目標：Lv1〜3で安定。回復なしでも数戦できる。
    */
    patchEnemy('teiji', {
      name:'定時のご主人様',
      hp:24,
      maxHp:24,
      atk:7,
      def:2,
      spd:5,
      talk:4,
      exp:8
    });

    patchEnemy('kuufuku', {
      name:'空腹のご主人様',
      hp:30,
      maxHp:30,
      atk:8,
      def:3,
      spd:5,
      talk:5,
      exp:11
    });

    /*
      1F中盤：空腹 / 残業
      目標：Lv3〜5で適正。装備なしでも勝てるが消耗する。
    */
    patchEnemy('zangyo', {
      name:'残業のご主人様',
      hp:42,
      maxHp:42,
      atk:11,
      def:5,
      spd:6,
      talk:7,
      exp:17
    });

    /*
      1F終盤：残業 / 迷走
      目標：Lv5〜7。状態異常やおまじないを使う価値が出る。
    */
    patchEnemy('meisou', {
      name:'迷走のご主人様',
      hp:48,
      maxHp:48,
      atk:10,
      def:5,
      spd:8,
      talk:9,
      exp:22
    });

    /*
      2F序盤：寝落 / 激務
      目標：Lv7〜9。2F突入直後の壁。ただし即死しない。
    */
    patchEnemy('neochi', {
      name:'寝落のご主人様',
      hp:56,
      maxHp:56,
      atk:13,
      def:7,
      spd:5,
      talk:9,
      exp:28
    });

    patchEnemy('gekimu', {
      name:'激務のご主人様',
      hp:64,
      maxHp:64,
      atk:15,
      def:8,
      spd:7,
      talk:10,
      exp:34
    });

    /*
      2F中盤：激務 / 泥酔
      目標：Lv9〜12。装備と回復の重要性が増す。
    */
    patchEnemy('deisui', {
      name:'泥酔のご主人様',
      hp:72,
      maxHp:72,
      atk:17,
      def:9,
      spd:6,
      talk:12,
      exp:42
    });

    /*
      2F終盤：泥酔 / 叱責
      目標：Lv12〜14。ボス前の緊張感。
    */
    patchEnemy('shisseki', {
      name:'叱責のご主人様',
      hp:86,
      maxHp:86,
      atk:20,
      def:11,
      spd:9,
      talk:14,
      exp:55
    });

    /*
      たまちゃん：
      イベント敵。強すぎないが特別感。
    */
    patchEnemy('tamachan', {
      hp:45,
      maxHp:45,
      atk:10,
      def:8,
      spd:10,
      talk:10,
      exp:1
    });

    /*
      ボス：
      目標：Lv15前後 + 2F装備 + 回復どうぐで撃破。
      ごり押しだけではやや危険。
    */
    patchEnemy('boss', {
      hp:230,
      maxHp:230,
      atk:24,
      def:14,
      spd:10,
      talk:18,
      exp:0,
      boss:true
    });

    return true;
  }

  function installPotoroBfsBalance(){
    patchPlayerBase();
    installEnemyBalance();
    patchLevelGrowth();

    if(typeof updateUI === 'function') updateUI();
    if(typeof updateMapStatusPanel === 'function') updateMapStatusPanel();

    console.log('[PO・TORO QUEST] BFS enemy/player balance installed', potoroBalanceReport());

    return true;
  }

  window.installPotoroBfsBalance = installPotoroBfsBalance;

  window.potoroBalanceReport = function(){
    const p = typeof state !== 'undefined' && state.player ? state.player : null;

    return {
      installed:true,
      version:'bfs-enemy-zone-balance',
      player:p ? {
        level:p.level,
        hp:p.hp,
        maxHp:p.maxHp,
        mp:p.mp,
        maxMp:p.maxMp,
        baseAtk:p.baseAtk,
        baseDef:p.baseDef,
        baseSpd:p.baseSpd,
        baseTalk:p.baseTalk,
        nextExp:p.nextExp
      } : null,
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

  installPotoroBfsBalance();
})();
