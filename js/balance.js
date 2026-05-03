/* =========================
ポトロクエスト balance.js
高難易度調整版（緊張感強化）

■ 変更方針
・主人公はやや弱体化
・敵は中盤〜終盤を強化
・回復・おまじない必須環境へ
========================= */

(function(){
if(window.__potoroHardBalance) return;
window.__potoroHardBalance = true;

/* ===== 主人公 ===== */
function patchPlayer(){
  if(typeof initialPlayer === 'undefined') return;

  initialPlayer.maxHp = 30;
  initialPlayer.hp = 30;
  initialPlayer.maxMp = 10;
  initialPlayer.mp = 10;

  initialPlayer.baseAtk = 7;
  initialPlayer.baseDef = 4;
  initialPlayer.baseSpd = 6;
  initialPlayer.baseTalk = 7;
}

/* ===== 敵 ===== */
function e(id){return enemies.find(e=>e.id===id);}

function patchEnemies(){

  // 1F序盤
  Object.assign(e('teiji'),{
    hp:28, atk:8, def:3, spd:5, exp:9
  });

  Object.assign(e('kuufuku'),{
    hp:36, atk:9, def:4, spd:5, exp:13
  });

  // 1F中盤
  Object.assign(e('zangyo'),{
    hp:50, atk:13, def:6, spd:6, exp:20
  });

  // 1F終盤
  Object.assign(e('meisou'),{
    hp:56, atk:12, def:6, spd:9, exp:26
  });

  // 2F序盤
  Object.assign(e('neochi'),{
    hp:70, atk:16, def:8, spd:6, exp:32
  });

  Object.assign(e('gekimu'),{
    hp:80, atk:18, def:9, spd:7, exp:38
  });

  // 2F中盤
  Object.assign(e('deisui'),{
    hp:92, atk:20, def:10, spd:7, exp:48
  });

  // 2F終盤
  Object.assign(e('shisseki'),{
    hp:110, atk:23, def:12, spd:10, exp:65
  });

  // ボス
  Object.assign(e('boss'),{
    hp:280, atk:28, def:16, spd:11
  });
}

/* ===== 成長抑制 ===== */
function patchGrowth(){
  if(typeof levelUp !== 'function') return;

  const old = levelUp;

  levelUp = function(){
    const p = state.player;
    const before = p.level;

    const r = old.apply(this,arguments);

    if(p.level > before){
      p.maxHp += 3;
      p.maxMp += 1;
      p.baseAtk += 2;
      p.baseDef += 1;
      p.baseSpd += 1;
      p.baseTalk += 2;
    }

    return r;
  }
}

function init(){
  patchPlayer();
  patchEnemies();
  patchGrowth();
  console.log('[HARD BALANCE LOADED]');
}

init();

})();
