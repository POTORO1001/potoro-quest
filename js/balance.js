/* =========================
   ポトロクエスト balance.js
   高難易度調整版 v4（中盤〜終盤脅威強化版）

   差し替え対象：
   js/balance.js

   目的：
   - 迷走 / 寝落 / 激務 / 泥酔 / 叱責をさらに脅威にする
   - 序盤の定時 / 空腹はv3相当で維持
   - 中盤以降、装備が整っても被ダメ1になりにくくする
   - hp/maxHp同期は維持
========================= */

(function(){
  if(window.__potoroHardBalanceV4) return;
  window.__potoroHardBalanceV4 = true;

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
      console.warn('[PO・TORO QUEST hard balance v4] enemy not found:', id);
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
    patchEnemy('teiji',{hp:28,mp:0,maxMp:0,atk:11,def:3,spd:5,talk:4,exp:9});
    patchEnemy('kuufuku',{hp:36,mp:5,maxMp:5,atk:13,def:4,spd:5,talk:5,exp:13});
    patchEnemy('zangyo',{hp:50,mp:0,maxMp:0,atk:18,def:6,spd:6,talk:7,exp:20});

    patchEnemy('meisou',{hp:56,mp:10,maxMp:10,atk:20,def:6,spd:9,talk:10,exp:26});

    patchEnemy('neochi',{hp:70,mp:15,maxMp:15,atk:27,def:8,spd:6,talk:12,exp:32});
    patchEnemy('gekimu',{hp:80,mp:12,maxMp:12,atk:30,def:9,spd:7,talk:11,exp:38});
    patchEnemy('deisui',{hp:92,mp:18,maxMp:18,atk:34,def:10,spd:7,talk:14,exp:48});
    patchEnemy('shisseki',{hp:110,mp:25,maxMp:25,atk:40,def:12,spd:10,talk:16,exp:65});

    patchEnemy('tamachan',{hp:1,mp:0,maxMp:0,atk:0,def:0,spd:99,talk:99,exp:0});
    patchEnemy('boss',{hp:280,mp:40,maxMp:40,atk:42,def:16,spd:11,talk:22,exp:120,boss:true});

    return true;
  }

  function installPotoroHardBalanceV4(){
    patchPlayer();
    patchEnemies();

    if(typeof updateUI === 'function') updateUI();
    if(typeof updateMapStatusPanel === 'function') updateMapStatusPanel();

    console.log('[PO・TORO QUEST] hard balance v4 installed', potoroHardBalanceReport());
    return true;
  }

  window.installPotoroHardBalanceV4 = installPotoroHardBalanceV4;

  window.potoroHardBalanceReport = function(){
    return {
      installed:true,
      version:'hard-balance-v4-mid-late-threat-up',
      note:'迷走 / 寝落 / 激務 / 泥酔 / 叱責の攻撃力を強化。hp/maxHp同期済み。',
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

  installPotoroHardBalanceV4();
})();
