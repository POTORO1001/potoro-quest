/* =========================
   ポトロクエスト ending.js
   ボス撃破後ルーレット完全版

   差し替え対象：
   js/ending.js

   仕様：
   - ボス撃破後、必ずルーレットが登場
   - 見た目は8分割
     ハズレ：5マス
     チェキ券：2マス
     萌えセレクト30分無料券：1マス
   - 実際の内部当選確率
     チェキ券：1/1000
     萌えセレクト30分無料券：1/10000
     ハズレ：残り
   - チェキ券 / 萌えセレクト30分無料券 当選時は派手な演出
   - 当選券には必ず日時を表示
   - 日時が写っていないスクリーンショットは無効という注意文を表示
========================= */

/* ===== 発行時刻 ===== */
function formatChekiIssuedAt(date){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  const hh = String(date.getHours()).padStart(2,'0');
  const mm = String(date.getMinutes()).padStart(2,'0');
  const ss = String(date.getSeconds()).padStart(2,'0');
  return `${y}/${m}/${d} ${hh}:${mm}:${ss}`;
}

/* ===== ルーレット内部抽選 ===== */
function drawBossRoulettePrize(){
  /*
    roll: 1〜10000

    萌えセレクト30分無料券：1/10000
    チェキ券：10/10000 = 1/1000
    ハズレ：9989/10000
  */
  const roll = Math.floor(Math.random() * 10000) + 1;

  if(roll === 1){
    return {
      type:'moe_select',
      label:'萌えセレクト30分無料券',
      message:'超大当たり！萌えセレクト30分無料券が当たった！！'
    };
  }

  if(roll >= 2 && roll <= 11){
    return {
      type:'cheki',
      label:'チェキ券',
      message:'大当たり！チェキ券が当たった！'
    };
  }

  return {
    type:'miss',
    label:'ハズレ',
    message:'残念…今回はハズレでした。'
  };
}

/* ===== 8分割ルーレット表示用マス ===== */
function getBossRouletteSegments(){
  return [
    {type:'miss',label:'ハズレ'},
    {type:'cheki',label:'チェキ券'},
    {type:'miss',label:'ハズレ'},
    {type:'miss',label:'ハズレ'},
    {type:'moe_select',label:'萌えセレクト券'},
    {type:'miss',label:'ハズレ'},
    {type:'cheki',label:'チェキ券'},
    {type:'miss',label:'ハズレ'}
  ];
}

function getStopIndexForPrize(prizeType){
  const segments = getBossRouletteSegments();
  const candidates = [];

  segments.forEach((seg,index) => {
    if(seg.type === prizeType) candidates.push(index);
  });

  if(!candidates.length) return 0;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/* ===== ルーレットDOM ===== */
function ensureBossRouletteModal(){
  let modal = document.getElementById('bossRouletteModal');
  if(modal) return modal;

  modal = document.createElement('section');
  modal.id = 'bossRouletteModal';
  modal.className = 'boss-roulette-modal hidden';

  modal.innerHTML = `
    <div class="boss-roulette-card">
      <div class="boss-roulette-title">BOSS CLEAR BONUS</div>
      <div class="boss-roulette-sub">ご褒美ルーレット</div>

      <div class="boss-roulette-wrap">
        <div class="boss-roulette-pointer">▼</div>
        <div id="bossRouletteWheel" class="boss-roulette-wheel"></div>
        <div id="bossRouletteBurst" class="boss-roulette-burst hidden">BIG HIT!</div>
      </div>

      <div id="bossRouletteResult" class="boss-roulette-result">ルーレット準備中...</div>
      <button id="bossRouletteCloseBtn" class="boss-roulette-close hidden">結果を見る</button>
    </div>
  `;

  document.body.appendChild(modal);
  injectBossRouletteStyle();
  renderBossRouletteSegments();

  const closeBtn = document.getElementById('bossRouletteCloseBtn');
  if(closeBtn && !closeBtn.dataset.boundRouletteClose){
    closeBtn.dataset.boundRouletteClose = '1';
    closeBtn.addEventListener('click',function(){
      modal.classList.add('hidden');
      finalizeBossRouletteResult(window.__potoroLastBossRoulettePrize || {type:'miss'});
    });
  }

  return modal;
}

function injectBossRouletteStyle(){
  if(document.getElementById('bossRouletteStyle')) return;

  const style = document.createElement('style');
  style.id = 'bossRouletteStyle';
  style.textContent = `
    .boss-roulette-modal.hidden { display: none !important; }

    .boss-roulette-modal {
      position: fixed;
      inset: 0;
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(10, 5, 25, .78);
      backdrop-filter: blur(4px);
      padding: 18px;
    }

    .boss-roulette-card {
      width: min(92vw, 420px);
      border-radius: 28px;
      padding: 22px 18px 20px;
      background: radial-gradient(circle at 50% 0%, rgba(255,255,255,.98), rgba(255,240,250,.96) 58%, rgba(255,226,246,.98));
      border: 4px solid #f5a3d6;
      box-shadow: 0 0 28px rgba(255,122,214,.78), 0 16px 36px rgba(0,0,0,.35);
      text-align: center;
      color: #7e22ce;
      overflow: hidden;
    }

    .boss-roulette-card.big-hit {
      animation: bossBigHitPulse .7s ease-in-out 0s 4 alternate;
      border-color: #facc15;
      box-shadow: 0 0 34px rgba(250,204,21,.9), 0 0 54px rgba(236,72,153,.7), 0 16px 36px rgba(0,0,0,.35);
    }

    @keyframes bossBigHitPulse {
      from { transform: scale(1); filter: brightness(1); }
      to { transform: scale(1.04); filter: brightness(1.25); }
    }

    .boss-roulette-title {
      font-size: 15px;
      letter-spacing: .16em;
      font-weight: 900;
      color: #ec4899;
      margin-bottom: 4px;
    }

    .boss-roulette-sub {
      font-size: 24px;
      font-weight: 900;
      color: #a855f7;
      margin-bottom: 14px;
      text-shadow: 0 0 10px rgba(168,85,247,.3);
    }

    .boss-roulette-wrap {
      position: relative;
      width: 280px;
      height: 280px;
      margin: 0 auto 16px;
    }

    .boss-roulette-pointer {
      position: absolute;
      left: 50%;
      top: -2px;
      transform: translateX(-50%);
      z-index: 5;
      color: #ef4444;
      font-size: 32px;
      font-weight: 900;
      text-shadow: 0 2px 0 #fff;
    }

    .boss-roulette-wheel {
      position: absolute;
      inset: 20px;
      border-radius: 50%;
      border: 8px solid #fff;
      background: conic-gradient(
        #f8fafc 0deg 45deg,
        #fde68a 45deg 90deg,
        #f8fafc 90deg 135deg,
        #f8fafc 135deg 180deg,
        #f9a8d4 180deg 225deg,
        #f8fafc 225deg 270deg,
        #fde68a 270deg 315deg,
        #f8fafc 315deg 360deg
      );
      box-shadow: inset 0 0 18px rgba(0,0,0,.18), 0 0 24px rgba(255,255,255,.8);
      transition: transform 3.6s cubic-bezier(.12,.72,.08,1);
      overflow: hidden;
    }

    .boss-roulette-wheel::after {
      content: "";
      position: absolute;
      inset: 50%;
      width: 52px;
      height: 52px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: #fff;
      border: 5px solid #f472b6;
      box-shadow: 0 0 12px rgba(236,72,153,.5);
    }

    .boss-roulette-seg-label {
      position: absolute;
      left: 50%;
      top: 50%;
      transform-origin: 0 0;
      font-size: 11px;
      font-weight: 900;
      line-height: 1.1;
      color: #7e22ce;
      text-shadow: 0 1px 0 rgba(255,255,255,.9);
      width: 80px;
      text-align: center;
      z-index: 2;
    }

    .boss-roulette-seg-label.miss { color: #475569; }
    .boss-roulette-seg-label.cheki { color: #b45309; }
    .boss-roulette-seg-label.moe_select { color: #be185d; font-size: 10px; }

    .boss-roulette-burst.hidden { display:none !important; }

    .boss-roulette-burst {
      position: absolute;
      inset: 0;
      z-index: 6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: 1000;
      letter-spacing: .08em;
      color: #fff;
      text-shadow: 0 0 8px #ec4899, 0 0 18px #facc15, 0 3px 0 #be185d;
      animation: bossBurst .9s ease-in-out 0s 3 alternate;
      pointer-events: none;
    }

    @keyframes bossBurst {
      from { transform: scale(.7) rotate(-8deg); opacity: .2; }
      to { transform: scale(1.25) rotate(8deg); opacity: 1; }
    }

    .boss-roulette-result {
      white-space: pre-line;
      min-height: 56px;
      font-size: 18px;
      line-height: 1.5;
      font-weight: 900;
      color: #831843;
      margin-bottom: 14px;
    }

    .boss-roulette-close {
      width: 100%;
      border: 0;
      border-radius: 18px;
      padding: 14px 12px;
      background: linear-gradient(135deg,#ec4899,#a855f7);
      color: #fff;
      font-size: 17px;
      font-weight: 900;
      box-shadow: 0 8px 18px rgba(168,85,247,.28);
      cursor: pointer;
    }

    .ticket-required-note {
      margin-top: 10px;
      padding: 10px 12px;
      border-radius: 14px;
      background: rgba(254,226,226,.92);
      border: 2px solid #ef4444;
      color: #991b1b;
      font-size: 13px;
      font-weight: 900;
      line-height: 1.55;
    }

    .ticket-issued-at-strong {
      display: inline-block;
      margin-top: 4px;
      font-size: 18px !important;
      color: #dc2626 !important;
      font-weight: 1000 !important;
      letter-spacing: .04em;
    }

    .moe-select-ticket-special {
      border-color: #facc15 !important;
      box-shadow: 0 0 22px rgba(250,204,21,.75), 0 0 36px rgba(236,72,153,.45) !important;
    }
  `;

  document.head.appendChild(style);
}

function renderBossRouletteSegments(){
  const wheel = document.getElementById('bossRouletteWheel');
  if(!wheel) return;

  wheel.innerHTML = '';

  const segments = getBossRouletteSegments();

  segments.forEach((seg,index) => {
    const label = document.createElement('div');
    label.className = `boss-roulette-seg-label ${seg.type}`;
    label.textContent = seg.label;

    const angle = index * 45 + 22.5;
    const radius = 74;

    label.style.transform =
      `rotate(${angle}deg) translate(${radius}px) rotate(90deg) translate(-40px,-8px)`;

    wheel.appendChild(label);
  });
}

/* ===== 派手演出 ===== */
function playBigWinEffect(prizeType){
  const modal = document.getElementById('bossRouletteModal');
  const card = modal ? modal.querySelector('.boss-roulette-card') : null;
  const burst = document.getElementById('bossRouletteBurst');

  if(card){
    card.classList.remove('big-hit');
    void card.offsetWidth;
    card.classList.add('big-hit');
  }

  if(burst){
    burst.textContent = prizeType === 'moe_select' ? 'ULTRA HIT!' : 'BIG HIT!';
    burst.classList.remove('hidden');
    setTimeout(() => burst.classList.add('hidden'), 2600);
  }

  if(typeof screenFlash === 'function'){
    try{ screenFlash(); }catch(e){}
  }

  if(typeof criticalFlash === 'function'){
    try{ criticalFlash(); }catch(e){}
  }

  if(typeof seLevelUp === 'function'){
    try{ seLevelUp(); }catch(e){}
  }

  setTimeout(() => {
    if(typeof seCheki === 'function'){
      try{ seCheki(); }catch(e){}
    }
  }, 650);
}

/* ===== ルーレット実行 ===== */
function runBossRoulette(){
  return new Promise(resolve => {
    const prize = drawBossRoulettePrize();
    const stopIndex = getStopIndexForPrize(prize.type);

    window.__potoroLastBossRoulettePrize = prize;

    const modal = ensureBossRouletteModal();
    const wheel = document.getElementById('bossRouletteWheel');
    const result = document.getElementById('bossRouletteResult');
    const closeBtn = document.getElementById('bossRouletteCloseBtn');

    if(result) result.textContent = 'ルーレットスタート！';
    if(closeBtn) closeBtn.classList.add('hidden');

    modal.classList.remove('hidden');

    if(wheel){
      wheel.style.transition = 'none';
      wheel.style.transform = 'rotate(0deg)';
      void wheel.offsetWidth;

      const centerAngle = stopIndex * 45 + 22.5;
      const spins = 360 * 7;
      const finalRotation = spins + (360 - centerAngle);

      wheel.style.transition = 'transform 3.6s cubic-bezier(.12,.72,.08,1)';
      wheel.style.transform = `rotate(${finalRotation}deg)`;
    }

    if(typeof seMagic === 'function'){
      try{ seMagic(); }catch(e){}
    }

    setTimeout(() => {
      if(prize.type === 'cheki' || prize.type === 'moe_select'){
        if(result) result.textContent = '！！大当たり！！';
        playBigWinEffect(prize.type);

        setTimeout(() => {
          if(result){
            result.textContent =
              prize.message + '\n結果を見るを押して、日時付き券を表示してください。';
          }
          if(closeBtn) closeBtn.classList.remove('hidden');
        }, 1400);
      }else{
        if(result) result.textContent = prize.message;
        if(closeBtn) closeBtn.classList.remove('hidden');
      }

      resolve(prize);
    }, 3800);
  });
}

/* ===== 結果表示 ===== */
function hideAllEndingTickets(){
  const cheki = document.getElementById('chekiTicket');
  if(cheki) cheki.classList.add('hidden');

  const moe = document.getElementById('moeSelectTicket');
  if(moe) moe.classList.add('hidden');
}

function ensureMoeSelectTicket(){
  let ticket = document.getElementById('moeSelectTicket');
  if(ticket) return ticket;

  const endingCard = document.querySelector('#endingScreen .ending-card');
  if(!endingCard) return null;

  ticket = document.createElement('div');
  ticket.id = 'moeSelectTicket';
  ticket.className = 'cheki-ticket moe-select-ticket-special hidden';
  ticket.innerHTML = `
    <div class="ticket-label">ULTRA SPECIAL DROP</div>
    <h2>萌えセレクト券</h2>
    <p>この画面のスクリーンショットをお屋敷でご提示ください。</p>
    <div class="cheki-time">
      <span>発行日時</span>
      <strong id="moeSelectIssuedAt" class="ticket-issued-at-strong">--:--</strong>
    </div>
    <div class="ticket-required-note">
      ※この券は日時表記が写っているスクリーンショットのみ有効です。<br>
      ※日時が写っていない場合は無効となります。
    </div>
  `;

  const restartBtn = document.getElementById('endingRestartBtn');
  if(restartBtn){
    endingCard.insertBefore(ticket,restartBtn);
  }else{
    endingCard.appendChild(ticket);
  }

  return ticket;
}

function ensureChekiTicketNote(){
  const cheki = document.getElementById('chekiTicket');
  if(!cheki) return;

  const issuedAt = document.getElementById('chekiIssuedAt');
  if(issuedAt){
    issuedAt.classList.add('ticket-issued-at-strong');
  }

  if(!cheki.querySelector('.ticket-required-note')){
    const note = document.createElement('div');
    note.className = 'ticket-required-note';
    note.innerHTML =
      '※この券は日時表記が写っているスクリーンショットのみ有効です。<br>' +
      '※日時が写っていない場合は無効となります。';
    cheki.appendChild(note);
  }

  const timeLabel = cheki.querySelector('.cheki-time span');
  if(timeLabel){
    timeLabel.textContent = '発行日時';
  }
}

function showChekiTicket(){
  const cheki = document.getElementById('chekiTicket');
  const issuedAt = document.getElementById('chekiIssuedAt');
  const message = document.getElementById('endingMessage');
  const now = formatChekiIssuedAt(new Date());

  ensureChekiTicketNote();

  if(message){
    message.textContent =
      'ルーレット大当たり！チェキ券を獲得しました！\n' +
      'この画面をスクリーンショットで保存してください。';
  }

  if(issuedAt){
    issuedAt.textContent = now;
    issuedAt.classList.add('ticket-issued-at-strong');
  }

  if(cheki) cheki.classList.remove('hidden');

  playBigWinEffect('cheki');
}

function showMoeSelectTicket(){
  const ticket = ensureMoeSelectTicket();
  const issuedAt = document.getElementById('moeSelectIssuedAt');
  const message = document.getElementById('endingMessage');
  const now = formatChekiIssuedAt(new Date());

  if(message){
    message.textContent =
      '超大当たり！萌えセレクト券を獲得しました！！\n' +
      'この画面をスクリーンショットで保存してください。';
  }

  if(issuedAt){
    issuedAt.textContent = now;
    issuedAt.classList.add('ticket-issued-at-strong');
  }

  if(ticket) ticket.classList.remove('hidden');

  playBigWinEffect('moe_select');
}

function showRouletteMissMessage(){
  const message = document.getElementById('endingMessage');

  if(message){
    message.textContent = 'ルーレットはハズレでした。でも、鬼奴夜魔さんをいやした！';
  }
}

function finalizeBossRouletteResult(prize){
  hideAllEndingTickets();

  if(prize.type === 'cheki'){
    showChekiTicket();
    return;
  }

  if(prize.type === 'moe_select'){
    showMoeSelectTicket();
    return;
  }

  showRouletteMissMessage();
}

/* ===== エンディング ===== */
async function showEnding(){
  stopBgm();
  if(typeof stopAllBgm === 'function') stopAllBgm();

  setButtonsDisabled(true);
  state.busy = true;

  setMessage('鬼奴夜魔さんをいやした！ ポ・トロに平和がもどった！');

  await sleep(900);

  if(typeof hideElement === 'function'){
    hideElement('battleScreen');
    hideElement('mapScreen');
    showElement('endingScreen');
  }else{
    document.getElementById('battleScreen')?.classList.add('hidden');
    document.getElementById('mapScreen')?.classList.add('hidden');
    document.getElementById('endingScreen')?.classList.remove('hidden');
  }

  hideAllEndingTickets();

  const message = document.getElementById('endingMessage');
  if(message) message.textContent = '鬼奴夜魔さんをいやした！ ご褒美ルーレット開始！';

  await sleep(500);
  await runBossRoulette();
}

/* ===== エンディングからタイトルへ ===== */
function restartFromEnding(){
  playBgm('bgmOpening');

  if(typeof hideElement === 'function'){
    hideElement('endingScreen');
    hideElement('battleScreen');
    hideElement('mapScreen');
    showElement('titleScreen');
  }else{
    document.getElementById('endingScreen')?.classList.add('hidden');
    document.getElementById('battleScreen')?.classList.add('hidden');
    document.getElementById('mapScreen')?.classList.add('hidden');
    document.getElementById('titleScreen')?.classList.remove('hidden');
  }

  hideAllEndingTickets();

  const issuedAt = document.getElementById('chekiIssuedAt');
  if(issuedAt) issuedAt.textContent = '--:--';

  const moeIssuedAt = document.getElementById('moeSelectIssuedAt');
  if(moeIssuedAt) moeIssuedAt.textContent = '--:--';

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

/* ===== デバッグ・確認用 ===== */
window.potoroBossRouletteReport = function(){
  return {
    installed:true,
    version:'boss-roulette-complete-v2',
    visualSegments:getBossRouletteSegments(),
    rates:{
      cheki:'1/1000',
      moeSelect:'1/10000',
      miss:'9989/10000'
    },
    lastPrize:window.__potoroLastBossRoulettePrize || null
  };
};

window.potoroTestBossRoulette = function(){
  return runBossRoulette();
};

window.potoroForceChekiTicket = function(){
  const prize = {type:'cheki',label:'チェキ券',message:'大当たり！チェキ券が当たった！'};
  window.__potoroLastBossRoulettePrize = prize;
  finalizeBossRouletteResult(prize);
};

window.potoroForceMoeSelectTicket = function(){
  const prize = {type:'moe_select',label:'萌えセレクト券',message:'超大当たり！萌えセレクト券が当たった！！'};
  window.__potoroLastBossRoulettePrize = prize;
  finalizeBossRouletteResult(prize);
};

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded',bindEndingEvents,{once:true});
}else{
  bindEndingEvents();
}
