/* =========================
   ポトロクエスト balance.js
   高難易度調整版 v2（HP/maxHp同期修正版）

   差し替え対象：
   js/balance.js

   修正内容：
   - 敵の hp と maxHp を必ず同じ値にする
   - 「敵がHP減った状態で出る」表示バグを修正
   - 高難易度バランスは維持
========================= */

(function(){
  if(window.__potoroHardBalanceV2) return;
  window.__potoroHardBalanceV2 = true;

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
      console.warn('[PO・TORO QUEST hard balance] enemy not found:', id);
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
    patchEnemy('teiji',{hp:28,mp:0,maxMp:0,atk:8,def:3,spd:5,talk:4,exp:9});
    patchEnemy('kuufuku',{hp:36,mp:5,maxMp:5,atk:9,def:4,spd:5,talk:5,exp:13});
    patchEnemy('zangyo',{hp:50,mp:0,maxMp:0,atk:13,def:6,spd:6,talk:7,exp:20});
    patchEnemy('meisou',{hp:56,mp:10,maxMp:10,atk:12,def:6,spd:9,talk:10,exp:26});

    patchEnemy('neochi',{hp:70,mp:15,maxMp:15,atk:16,def:8,spd:6,talk:12,exp:32});
    patchEnemy('gekimu',{hp:80,mp:12,maxMp:12,atk:18,def:9,spd:7,talk:11,exp:38});
    patchEnemy('deisui',{hp:92,mp:18,maxMp:18,atk:20,def:10,spd:7,talk:14,exp:48});
    patchEnemy('shisseki',{hp:110,mp:25,maxMp:25,atk:23,def:12,spd:10,talk:16,exp:65});

    patchEnemy('tamachan',{hp:1,mp:0,maxMp:0,atk:0,def:0,spd:99,talk:99,exp:0});
    patchEnemy('boss',{hp:280,mp:40,maxMp:40,atk:28,def:16,spd:11,talk:22,exp:120,boss:true});

    return true;
  }

  function installPotoroHardBalanceV2(){
    patchPlayer();
    patchEnemies();

    if(typeof updateUI === 'function') updateUI();
    if(typeof updateMapStatusPanel === 'function') updateMapStatusPanel();

    console.log('[PO・TORO QUEST] hard balance v2 installed', potoroHardBalanceReport());
    return true;
  }

  window.installPotoroHardBalanceV2 = installPotoroHardBalanceV2;

  window.potoroHardBalanceReport = function(){
    return {
      installed:true,
      version:'hard-balance-v2-hp-maxhp-sync',
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

  installPotoroHardBalanceV2();
})();
