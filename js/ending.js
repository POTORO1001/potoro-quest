/* =========================
   ポトロクエスト ending.js（STEP9-B）
   エンディング・チェキ券分離ファイル

   読み込み順：
   1. js/game.js
   2. js/audio.js
   3. js/ui.js
   4. js/opening.js
   5. js/ending.js
   6. js/battle.js
   7. js/enemy.js
   8. js/equipment.js
   9. js/item.js
   10. js/map.js
   11. js/magic.js

   重要：
   - ending.js は showEnding / restartFromEnding / チェキ券表示を管理します。
   - game.js の既存関数を後読みで上書きします。
========================= */

/* ===== チェキ券発行時刻 ===== */
function formatChekiIssuedAt(date){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  const hh = String(date.getHours()).padStart(2,'0');
  const mm = String(date.getMinutes()).padStart(2,'0');
  const ss = String(date.getSeconds()).padStart(2,'0');

  return `${y}/${m}/${d} ${hh}:${mm}:${ss}`;
}

/* ===== チェキ券抽選 ===== */
function shouldDropChekiTicket(){
  return Math.random() < 1/50;
}

/* ===== チェキ券表示 ===== */
function showChekiTicket(){
  const cheki = document.getElementById('chekiTicket');
  const issuedAt = document.getElementById('chekiIssuedAt');
  const message = document.getElementById('endingMessage');

  if(message) message.textContent = '鬼奴夜魔さんがチェキ券を落とした！';

  if(issuedAt) issuedAt.textContent = formatChekiIssuedAt(new Date());

  if(cheki) cheki.classList.remove('hidden');

  seCheki();
}

/* ===== 通常エンディング表示 ===== */
function showNormalEndingMessage(){
  const message = document.getElementById('endingMessage');

  if(message){
    message.textContent = '鬼奴夜魔さんをいやした！ 一人前のメイドに近づいた！';
  }
}

/* ===== エンディング ===== */
async function showEnding(){
  stopBgm();
  stopAllBgm();

  setButtonsDisabled(true);
  state.busy = true;

  setMessage('鬼奴夜魔さんをいやした！ ポ・トロに平和がもどった！');

  await sleep(900);

  hideElement('battleScreen');
  hideElement('mapScreen');
  showElement('endingScreen');

  const cheki = document.getElementById('chekiTicket');
  if(cheki) cheki.classList.add('hidden');

  if(shouldDropChekiTicket()){
    showChekiTicket();
  }else{
    showNormalEndingMessage();
  }
}

/* ===== エンディングからタイトルへ ===== */
function restartFromEnding(){
  playBgm('bgmOpening');

  hideElement('endingScreen');
  hideElement('battleScreen');
  hideElement('mapScreen');
  showElement('titleScreen');

  const cheki = document.getElementById('chekiTicket');
  if(cheki) cheki.classList.add('hidden');

  const issuedAt = document.getElementById('chekiIssuedAt');
  if(issuedAt) issuedAt.textContent = '--:--';

  state.busy = false;
  state.started = false;
  state.inBattle = false;

  stopBgm();
}

/* ===== エンディング Event Bind ===== */
function bindEndingEvents(){
  const btn = document.getElementById('endingRestartBtn');

  if(btn && !btn.dataset.boundEndingRestart){
    btn.dataset.boundEndingRestart = '1';
    btn.addEventListener('click',restartFromEnding);
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded',bindEndingEvents,{once:true});
}else{
  bindEndingEvents();
}
