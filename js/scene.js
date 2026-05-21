/* =========================
   ポトロクエスト scene.js（STEP14）
   画面遷移・戦闘開始終了・特殊イベント分離ファイル

   読み込み順：
   1. js/game.js
   2. js/core.js
   3. js/data.js
   4. js/audio.js
   5. js/ui.js
   6. js/opening.js
   7. js/ending.js
   8. js/scene.js
   9. js/battle.js
   10. js/enemy.js
   11. js/equipment.js
   12. js/item.js
   13. js/map.js
   14. js/event.js
   15. js/magic.js
   16. js/compatibility.js

   重要：
   - scene.js は startBattle / endBattleToMap / たまちゃん / ガイド / 宝箱表示を管理します。
   - battle.js は winBattle から endBattleToMap を呼ぶため、scene.js は battle.js より前が安全です。
========================= */

/* ===== 敵パーティ生成 ===== */
function buildEnemyParty(enemyBase){
  const main = cloneEnemy(enemyBase);

  if(main.boss || main.helper) return [main];

  // 最大2体まで。通常敵は一定確率で2体出現。
  if(Math.random() < 0.42){
    const candidates = enemies.filter(enemy => !enemy.boss && !enemy.helper);
    const sub = cloneEnemy(candidates[Math.floor(Math.random()*candidates.length)]);
    return [main,sub];
  }

  return [main];
}

/* ===== 対象選択 ===== */
function selectTarget(index){
  if(state.busy) return;
  if(!state.enemiesInBattle[index] || state.enemiesInBattle[index].hp <= 0) return;

  state.targetIndex = index;

  updateUI();
  setMessage(`${state.enemiesInBattle[index].name}を対象にした！`);
}

/* ===== 初回戦闘ヒント ===== */
function getBattleOpeningMessage(){
  const baseMessage = state.enemiesInBattle.length > 1
    ? `${state.enemiesInBattle[0].name}たちが あらわれた！`
    : (state.enemy.intro || `${state.enemy.name} が あらわれた！`);

  if(!state.firstBattleHintShown){
    state.firstBattleHintShown = true;
    return `${baseMessage} はじめての戦闘です。「おまじない」や「どうぐ」も使ってみましょう。`;
  }

  return baseMessage;
}

/* ===== 戦闘開始 ===== */
function startBattle(enemy,fromMap){
  playBgm(
    (enemy && enemy.helper)
      ? 'bgmTamachan'
      : ((enemy && enemy.boss) ? 'bgmBoss' : 'bgmBattle')
  );

  state.inBattle = true;
  state.enemiesInBattle = buildEnemyParty(enemy);
  state.targetIndex = 0;
  state.lastDefeatedEnemy = null;
  state.enemy = state.enemiesInBattle[0];
  state.player.guarding = false;

  closeSubMenu();
  closeEquipMenu();
  closeTreasureMenu();

  hideElement('mapScreen');
  showElement('battleScreen');

  if(state.enemiesInBattle.some(e => e.boss)){
    bossEntrance();
  }

  updateUI();

  if(enemy.helper){
    setMessage('いつもありがと♡お給仕頑張ってね♡');
    setTimeout(() => showTamachanContinueButton(),5000);
    return;
  }

  setMessage(getBattleOpeningMessage());

  startBgm(state.enemiesInBattle.some(e => e.boss) ? 'boss' : 'battle');
}

/* ===== 戦闘終了：マップへ戻る ===== */
function endBattleToMap(){
  playMapBgm();

  state.inBattle = false;
  state.enemy = null;
  state.enemiesInBattle = [];
  state.targetIndex = 0;
  state.lastDefeatedEnemy = null;
  state.enemyActedFirst = false;

  stopBgm();

  document.body.classList.remove('boss-battle');

  hideElement('battleScreen');
  showElement('mapScreen');

  setButtonsDisabled(false);

  state.busy = false;

  setMapMessage('戦闘に勝利した！ 探索を続けよう。');
  drawMaze();
}

/* ===== ガイド ===== */
function openGuide(){
  showElement('guideModal');
}

function closeGuide(){
  hideElement('guideModal');
}

/* ===== 宝箱モーダル ===== */
function openTreasureMenu(rewardText){
  const menu = document.getElementById('treasureMenu');
  const body = document.getElementById('treasureMenuBody');

  if(!menu || !body) return;

  body.innerHTML = '';

  const box = document.createElement('div');
  box.className = 'equip-current treasure-box';
  box.innerHTML = `<div class="treasure-rare">${rewardText}</div>`;
  body.appendChild(box);

  const btn = document.createElement('button');
  btn.className = 'treasure-btn';
  btn.textContent = '受け取る';
  btn.onclick = closeTreasureMenu;
  body.appendChild(btn);

  menu.classList.remove('hidden');
  seTreasure();
}

function closeTreasureMenu(){
  const menu = document.getElementById('treasureMenu');
  if(menu) menu.classList.add('hidden');
}

/* ===== たまちゃんイベント ===== */
function showTamachanContinueButton(){
  completeTamachanEvent();

  const btn = document.getElementById('tamachanContinueBtn');
  if(btn) btn.classList.remove('hidden');
}

function hideTamachanContinueButton(){
  const btn = document.getElementById('tamachanContinueBtn');
  if(btn) btn.classList.add('hidden');
}

function showTamachanGetEffect(){
  const overlay = document.getElementById('tamachanGetOverlay');

  if(!overlay) return;

  const btn = document.getElementById('tamachanContinueBtn');
  if(btn) btn.classList.add('hidden');

  overlay.classList.remove('hidden');
}

function completeTamachanEvent(){
  const p = state.player;

  p.metTamachan = true;

  if(!p.inventory.uniforms.includes('first_maid')){
    p.inventory.uniforms.push('first_maid');
  }

  setMessage('初代メイド服GET！！');
  showTamachanGetEffect();
}

/* ===== たまちゃん続行 ===== */
function continueFromTamachan(){
  hideTamachanContinueButton();

  const overlay = document.getElementById('tamachanGetOverlay');
  if(overlay) overlay.classList.add('hidden');

  endBattleToMap();
}

/* ===== ゲームオーバー表示補助 ===== */
function showGameOverScreen(){
  const overlay = document.getElementById('gameOverOverlay');
  if(overlay) overlay.classList.remove('hidden');
}

function hideGameOverScreen(){
  const overlay = document.getElementById('gameOverOverlay');
  if(overlay) overlay.classList.add('hidden');
}

/* ===== 主要画面リセット補助 ===== */
function hideAllGameScreens(){
  hideElement('battleScreen');
  hideElement('mapScreen');
  hideElement('endingScreen');
  hideElement('openingScreen');
}

function showTitleScreen(){
  hideAllGameScreens();
  showElement('titleScreen');
}

/* ===== Scene Debug ===== */
function getSceneSnapshot(){
  return {
    titleHidden: document.getElementById('titleScreen')?.classList.contains('hidden'),
    mapHidden: document.getElementById('mapScreen')?.classList.contains('hidden'),
    battleHidden: document.getElementById('battleScreen')?.classList.contains('hidden'),
    openingHidden: document.getElementById('openingScreen')?.classList.contains('hidden'),
    endingHidden: document.getElementById('endingScreen')?.classList.contains('hidden'),
    inBattle: state.inBattle,
    floor: state.floor
  };
}
