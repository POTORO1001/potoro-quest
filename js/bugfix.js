/* =========================
   ポトロクエスト bugfix.js
   戦闘停止 + 2マス移動 修正
========================= */

/* ===== 戦闘停止対策 ===== */

function potoroUnlockBattleControls(){
  if(state.player && state.player.hp <= 0) return;

  state.enemyActedFirst = false;
  state.busy = false;
  setButtonsDisabled(false);
  if(typeof updateUI === 'function') updateUI();
}

playerStatusCheck = async function(){
  const s = ensurePlayerStatus();

  if(s.sleep > 0){
    setMessage(`${state.player.name} は眠っている…`);
    s.sleep--;

    await sleep(800);
    await enemyTurn();

    potoroUnlockBattleControls();
    return false;
  }

  if(s.confuse > 0){
    s.confuse--;

    if(Math.random() < 0.35){
      setMessage(`${state.player.name} は混乱して行動できなかった！`);

      await sleep(800);
      await enemyTurn();

      potoroUnlockBattleControls();
      return false;
    }
  }

  return true;
};

failAction = async function(message){
  if(typeof isMapMode === 'function' && isMapMode()){
    setMapMessage(message);
  }else{
    setMessage(message);
  }

  await sleep(700);
  potoroUnlockBattleControls();
};

/* ===== 2マス移動対策 ===== */

let moveLock = false;
let lastMove = 0;

function canMove(){
  const now = Date.now();

  if(moveLock) return false;
  if(now - lastMove < 120) return false;

  moveLock = true;
  lastMove = now;

  setTimeout(()=>{ moveLock = false; },120);

  return true;
}

const _movePlayer = movePlayer;

movePlayer = function(dx,dy){
  if(!canMove()) return;

  dx = Math.max(-1,Math.min(1,dx));
  dy = Math.max(-1,Math.min(1,dy));

  return _movePlayer(dx,dy);
};

console.log("bugfix.js loaded");
