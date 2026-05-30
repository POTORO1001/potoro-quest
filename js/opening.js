/* =========================
   ポトロクエスト opening.js（STEP9-A 修正版）
   タイトル・オープニング分離ファイル

   重要：
   - game.js に let openingTimer / let openingCurrentIndex が既にあるため、ここでは再定義しません。
   - OPENING_FADE_MS / OPENING_SHOW_MS も既存値を使用します。
========================= */

/* ===== 推し名取得 ===== */
function getOshiName(){
  const input = document.getElementById('oshiNameInput');
  const raw = input ? input.value.trim() : '';
  return raw ? raw.slice(0,12) : 'おうまさん';
}

/* ===== 冒険開始 ===== */
function startGame(){
  initAudio();

  if(openingTimer){
    clearInterval(openingTimer);
    openingTimer = null;
  }
  if(openingDelayTimer){
    clearTimeout(openingDelayTimer);
    openingDelayTimer = null;
  }
  if(openingLineTimer){
    clearTimeout(openingLineTimer);
    openingLineTimer = null;
  }

  hideElement('titleScreen');
  hideElement('openingScreen');
  hideElement('endingScreen');
  hideElement('battleScreen');
  showElement('mapScreen');

  state.player = makePlayer();
  state.player.name = getOshiName();

  state.busy = false;
  state.started = true;
  state.inBattle = false;
  state.firstBattleHintShown = false;

  setButtonsDisabled(false);
  setupFloor(1);
  playMapBgm();
}

/* ===== リセット ===== */
function resetGame(){
  closeSubMenu();
  closeEquipMenu();
  closeTreasureMenu();
  startGame();
}

/* ===== Opening Text ===== */
function getOpeningLines(){
  const source = document.getElementById('openingCrawlSource');
  if(!source) return [];

  const lines = [];

  const titleBlock = source.querySelector('.opening-title-block');
  if(titleBlock) lines.push(titleBlock.innerHTML);

  Array.from(source.querySelectorAll('p')).forEach(p => {
    lines.push(p.innerHTML);
  });

  return lines;
}

/* ===== Opening Line Display ===== */
function showOpeningLine(lines,index){
  const active = document.getElementById('openingStoryActive');

  if(!active || index < 0 || index >= lines.length) return;

  if(openingLineTimer){
    clearTimeout(openingLineTimer);
    openingLineTimer = null;
  }

  active.style.opacity = 0;

  openingLineTimer = setTimeout(() => {
    active.innerHTML = lines[index];
    active.style.opacity = 1;
    openingLineTimer = null;
  },OPENING_FADE_MS);
}

/* ===== Opening Story Start ===== */
function startOpeningStory(){
  if(openingTimer){
    clearInterval(openingTimer);
    openingTimer = null;
  }

  const lines = getOpeningLines();

  if(!lines.length) return;

  openingCurrentIndex = 0;
  showOpeningLine(lines,0);

  const interval = OPENING_FADE_MS + OPENING_SHOW_MS;

  openingTimer = setInterval(() => {
    openingCurrentIndex++;

    if(openingCurrentIndex >= lines.length){
      clearInterval(openingTimer);
      openingTimer = null;
      return;
    }

    showOpeningLine(lines,openingCurrentIndex);
  },interval);
}

/* ===== Opening Screen Open ===== */
function openOpening(){
  playBgm('bgmOpening');

  const active = document.getElementById('openingStoryActive');

  if(openingTimer){
    clearInterval(openingTimer);
    openingTimer = null;
  }
  if(openingDelayTimer){
    clearTimeout(openingDelayTimer);
    openingDelayTimer = null;
  }
  if(openingLineTimer){
    clearTimeout(openingLineTimer);
    openingLineTimer = null;
  }

  if(active){
    active.innerHTML = '';
    active.style.opacity = 0;
  }

  hideElement('titleScreen');
  showElement('openingScreen');

  openingDelayTimer = setTimeout(() => {
    openingDelayTimer = null;
    startOpeningStory();
  },4000);
}

/* ===== Opening Screen Close ===== */
function closeOpening(){
  const active = document.getElementById('openingStoryActive');

  if(openingTimer){
    clearInterval(openingTimer);
    openingTimer = null;
  }
  if(openingDelayTimer){
    clearTimeout(openingDelayTimer);
    openingDelayTimer = null;
  }
  if(openingLineTimer){
    clearTimeout(openingLineTimer);
    openingLineTimer = null;
  }

  if(active){
    active.innerHTML = '';
    active.style.opacity = 0;
  }

  hideElement('openingScreen');
  showElement('titleScreen');
}

/* ===== Opening Event Bind ===== */
function bindOpeningEvents(){
  const startBtn = document.getElementById('startBtn');
  const openingBtn = document.getElementById('openingBtn');
  const openingSkipBtn = document.getElementById('openingSkipBtn');
  const restartBtn = document.getElementById('restartBtn');

  if(startBtn && !startBtn.dataset.boundOpeningStart){
    startBtn.dataset.boundOpeningStart = '1';
    startBtn.addEventListener('click',startGame);
  }

  if(openingBtn && !openingBtn.dataset.boundOpening){
    openingBtn.dataset.boundOpening = '1';
    openingBtn.addEventListener('click',openOpening);
  }

  if(openingSkipBtn && !openingSkipBtn.dataset.boundOpeningSkip){
    openingSkipBtn.dataset.boundOpeningSkip = '1';
    openingSkipBtn.addEventListener('click',closeOpening);
  }

  if(restartBtn && !restartBtn.dataset.boundOpeningRestart){
    restartBtn.dataset.boundOpeningRestart = '1';
    restartBtn.addEventListener('click',resetGame);
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded',bindOpeningEvents,{once:true});
}else{
  bindOpeningEvents();
}
