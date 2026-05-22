/* =========================
   ポトロクエスト ending.js
   ボス撃破後ルーレット完全版 v3

   差し替え対象：
   js/ending.js

   修正内容：
   - ボス名を「鬼怒夜魔さん」に統一
   - ボス撃破後は必ず挑戦券が出るルーレットに変更
   - 挑戦券をお屋敷の特別くじに接続
========================= */

function formatChekiIssuedAt(date){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  const hh = String(date.getHours()).padStart(2,'0');
  const mm = String(date.getMinutes()).padStart(2,'0');
  const ss = String(date.getSeconds()).padStart(2,'0');
  return `${y}/${m}/${d} ${hh}:${mm}:${ss}`;
}

const BOSS_CHALLENGE_TICKETS = [
  {
    type:'moe_select_60_challenge',
    label:'萌えセレ60分挑戦券',
    shortLabel:'60分挑戦',
    ticketLabel:'LEGEND CHALLENGE',
    title:'萌えセレ60分挑戦券',
    freePrize:'萌えセレ60分無料券',
    className:'challenge-60',
    burst:'LEGEND!'
  },
  {
    type:'moe_select_30_challenge',
    label:'萌えセレ30分挑戦券',
    shortLabel:'30分挑戦',
    ticketLabel:'SPECIAL CHALLENGE',
    title:'萌えセレ30分挑戦券',
    freePrize:'萌えセレ30分無料券',
    className:'challenge-30',
    burst:'SPECIAL!'
  },
  {
    type:'limited_cheki_challenge',
    label:'期間限定チェキ挑戦券',
    shortLabel:'チェキ挑戦',
    ticketLabel:'PHOTO CHALLENGE',
    title:'期間限定チェキ挑戦券',
    freePrize:'期間限定チェキ無料券',
    className:'challenge-cheki',
    burst:'CHANCE!'
  }
];

function getBossChallengeTicket(type){
  if(type === 'moe_select') type = 'moe_select_30_challenge';
  if(type === 'cheki') type = 'limited_cheki_challenge';

  return BOSS_CHALLENGE_TICKETS.find(ticket => ticket.type === type)
    || BOSS_CHALLENGE_TICKETS[BOSS_CHALLENGE_TICKETS.length - 1];
}

function drawBossRoulettePrize(){
  if(window.__potoroForceNextRoulettePrize){
    const forced = getBossChallengeTicket(window.__potoroForceNextRoulettePrize);
    window.__potoroForceNextRoulettePrize = null;
    return {
      ...forced,
      message:`${forced.label}を獲得しました！`
    };
  }

  const segments = getBossRouletteSegments();
  const ticket = segments[Math.floor(Math.random() * segments.length)];
  return {
    ...ticket,
    message:`${ticket.label}を獲得しました！`
  };
}

function getBossRouletteSegments(){
  return [
    getBossChallengeTicket('limited_cheki_challenge'),
    getBossChallengeTicket('moe_select_30_challenge'),
    getBossChallengeTicket('limited_cheki_challenge'),
    getBossChallengeTicket('moe_select_60_challenge'),
    getBossChallengeTicket('limited_cheki_challenge'),
    getBossChallengeTicket('moe_select_30_challenge')
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

function ensureBossRouletteModal(){
  let modal = document.getElementById('bossRouletteModal');
  if(modal) return modal;

  modal = document.createElement('section');
  modal.id = 'bossRouletteModal';
  modal.className = 'boss-roulette-modal hidden';

  modal.innerHTML = `
    <div class="boss-roulette-card">
      <div class="boss-roulette-title">BOSS CLEAR BONUS</div>
      <div class="boss-roulette-sub">挑戦券ルーレット</div>

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
      const prize = window.__potoroLastBossRoulettePrize;
      modal.classList.add('hidden');
      finalizeBossRouletteResult(prize);
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
        from -30deg,
        #fde68a 0deg 60deg,
        #f9a8d4 60deg 120deg,
        #fde68a 120deg 180deg,
        #c4b5fd 180deg 240deg,
        #fde68a 240deg 300deg,
        #f9a8d4 300deg 360deg
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
      width: 86px;
      text-align: center;
      z-index: 2;
    }

    .boss-roulette-seg-label.limited_cheki_challenge { color: #b45309; }
    .boss-roulette-seg-label.moe_select_30_challenge { color: #be185d; font-size: 10px; }
    .boss-roulette-seg-label.moe_select_60_challenge { color: #6d28d9; font-size: 10px; }

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

    .challenge-60 {
      border-color: #c4b5fd !important;
      box-shadow: 0 0 24px rgba(168,85,247,.75), 0 0 42px rgba(250,204,21,.35) !important;
    }

    .challenge-30 {
      border-color: #f9a8d4 !important;
      box-shadow: 0 0 22px rgba(236,72,153,.55), 0 0 34px rgba(250,204,21,.28) !important;
    }

    .challenge-cheki {
      border-color: #fde68a !important;
      box-shadow: 0 0 22px rgba(250,204,21,.55), 0 0 32px rgba(245,158,11,.25) !important;
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

    const angle = index * 60;
    const radius = 76;

    label.style.transform =
      `rotate(${angle}deg) translateY(-${radius}px) rotate(${-angle}deg) translate(-43px,-8px)`;

    wheel.appendChild(label);
  });
}

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
    const prize = getBossChallengeTicket(prizeType);
    burst.textContent = prize.burst || 'CHANCE!';
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

function runBossRoulette(){
  return new Promise(resolve => {
    const prize = drawBossRoulettePrize();
    const stopIndex = getStopIndexForPrize(prize.type);

    window.__potoroLastBossRoulettePrize = prize;
    window.__potoroLastBossRouletteStopIndex = stopIndex;

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

      const finalRotation = 360 * 7 - (stopIndex * 60);

      wheel.style.transition = 'transform 3.6s cubic-bezier(.12,.72,.08,1)';
      wheel.style.transform = `rotate(${finalRotation}deg)`;
    }

    if(typeof seMagic === 'function'){
      try{ seMagic(); }catch(e){}
    }

    setTimeout(() => {
      if(result) result.textContent = '挑戦券を獲得！';
      playBigWinEffect(prize.type);

      setTimeout(() => {
        if(result){
          result.textContent =
            prize.message + '\n結果を見るを押して、日時付き挑戦券を表示してください。';
        }
        if(closeBtn) closeBtn.classList.remove('hidden');
      }, 1400);

      resolve(prize);
    }, 3800);
  });
}

function hideAllEndingTickets(){
  const cheki = document.getElementById('chekiTicket');
  if(cheki) cheki.classList.add('hidden');

  const moe = document.getElementById('moeSelectTicket');
  if(moe) moe.classList.add('hidden');

  const challenge = document.getElementById('challengeTicket');
  if(challenge) challenge.classList.add('hidden');
}

function ensureChallengeTicket(){
  let ticket = document.getElementById('challengeTicket');
  if(ticket) return ticket;

  const endingCard = document.querySelector('#endingScreen .ending-card');
  if(!endingCard) return null;

  ticket = document.createElement('div');
  ticket.id = 'challengeTicket';
  ticket.className = 'cheki-ticket hidden';
  ticket.innerHTML = `
    <div id="challengeTicketLabel" class="ticket-label">CHALLENGE TICKET</div>
    <h2 id="challengeTicketTitle">挑戦券</h2>
    <p id="challengeTicketDescription">
      この画面のスクリーンショットをお屋敷でご提示ください。特別なくじ引きに挑戦できます。
    </p>
    <div class="cheki-time">
      <span>発行日時</span>
      <strong id="challengeIssuedAt" class="ticket-issued-at-strong">--:--</strong>
    </div>
    <div class="ticket-required-note">
      <span id="challengeFreePrize">当たり景品：--</span><br>
      ※この券は日時表記が写っているスクリーンショットのみ有効です。<br>
      ※当たりを引いた場合、挑戦券の内容に対応した無料券を獲得できます。
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

function showChallengeTicket(prize){
  const finalPrize = getBossChallengeTicket(prize && prize.type);
  const ticket = ensureChallengeTicket();
  const issuedAt = document.getElementById('challengeIssuedAt');
  const message = document.getElementById('endingMessage');
  const now = formatChekiIssuedAt(new Date());

  const label = document.getElementById('challengeTicketLabel');
  const title = document.getElementById('challengeTicketTitle');
  const description = document.getElementById('challengeTicketDescription');
  const freePrize = document.getElementById('challengeFreePrize');

  if(ticket){
    ticket.className = `cheki-ticket ${finalPrize.className || ''}`;
  }

  if(label) label.textContent = finalPrize.ticketLabel || 'CHALLENGE TICKET';
  if(title) title.textContent = finalPrize.title;
  if(description){
    description.textContent =
      'この画面のスクリーンショットをお屋敷でご提示ください。特別なくじ引きに挑戦できます。';
  }
  if(freePrize) freePrize.textContent = `当たり景品：${finalPrize.freePrize}`;

  if(message){
    message.textContent =
      `${finalPrize.label}を獲得しました！\n` +
      'スクリーンショットをお屋敷へ持参すると、特別なくじ引きに挑戦できます。';
  }

  if(issuedAt){
    issuedAt.textContent = now;
    issuedAt.classList.add('ticket-issued-at-strong');
  }

  if(ticket) ticket.classList.remove('hidden');

  playBigWinEffect(finalPrize.type);
}

function showChekiTicket(){
  showChallengeTicket(getBossChallengeTicket('limited_cheki_challenge'));
}

function showMoeSelectTicket(){
  showChallengeTicket(getBossChallengeTicket('moe_select_30_challenge'));
}

function finalizeBossRouletteResult(prize){
  const finalPrize = prize || window.__potoroLastBossRoulettePrize || getBossChallengeTicket('limited_cheki_challenge');

  hideAllEndingTickets();
  showChallengeTicket(finalPrize);
}

async function showEnding(){
  stopBgm();
  if(typeof stopAllBgm === 'function') stopAllBgm();

  setButtonsDisabled(true);
  state.busy = true;

  setMessage('鬼怒夜魔さんをいやした！ ポ・トロに平和がもどった！');

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
  if(message) message.textContent = '鬼怒夜魔さんをいやした！ 挑戦券ルーレット開始！';

  await sleep(500);
  await runBossRoulette();
}

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

  const challengeIssuedAt = document.getElementById('challengeIssuedAt');
  if(challengeIssuedAt) challengeIssuedAt.textContent = '--:--';

  state.busy = false;
  state.started = false;
  state.inBattle = false;

  stopBgm();
}

function bindEndingEvents(){
  const btn = document.getElementById('endingRestartBtn');

  if(btn && !btn.dataset.boundEndingRestart){
    btn.dataset.boundEndingRestart = '1';
    btn.addEventListener('click',restartFromEnding);
  }
}

window.potoroBossRouletteReport = function(){
  return {
    installed:true,
    version:'boss-challenge-ticket-roulette-v1',
    visualSegments:getBossRouletteSegments(),
    alwaysAwardsChallengeTicket:true,
    lastPrize:window.__potoroLastBossRoulettePrize || null,
    lastStopIndex:window.__potoroLastBossRouletteStopIndex ?? null
  };
};

window.potoroRouletteVisualSyncReport = function(){
  return {
    installed:true,
    version:'roulette-visual-sync-integrated',
    segments:getBossRouletteSegments(),
    lastPrize:window.__potoroLastBossRoulettePrize || null,
    lastStopIndex:window.__potoroLastBossRouletteStopIndex ?? null
  };
};

window.potoroTestBossRoulette = function(){
  return runBossRoulette();
};

window.potoroForceNextBossRoulette = function(type){
  window.__potoroForceNextRoulettePrize = type || 'limited_cheki_challenge';
  return '次回のルーレット結果を ' + window.__potoroForceNextRoulettePrize + ' に固定しました。potoroTestBossRoulette() を実行してください。';
};

window.potoroForceChekiTicket = function(){
  const prize = getBossChallengeTicket('limited_cheki_challenge');
  window.__potoroLastBossRoulettePrize = prize;
  window.__potoroLastBossRouletteStopIndex = getStopIndexForPrize(prize.type);
  finalizeBossRouletteResult(prize);
};

window.potoroForceMoeSelectTicket = function(){
  const prize = getBossChallengeTicket('moe_select_30_challenge');
  window.__potoroLastBossRoulettePrize = prize;
  window.__potoroLastBossRouletteStopIndex = getStopIndexForPrize(prize.type);
  finalizeBossRouletteResult(prize);
};

window.potoroForceMoeSelect60ChallengeTicket = function(){
  const prize = getBossChallengeTicket('moe_select_60_challenge');
  window.__potoroLastBossRoulettePrize = prize;
  window.__potoroLastBossRouletteStopIndex = getStopIndexForPrize(prize.type);
  finalizeBossRouletteResult(prize);
};

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded',bindEndingEvents,{once:true});
}else{
  bindEndingEvents();
}
