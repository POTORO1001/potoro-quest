/* =========================
   ポトロクエスト ending-event.js
   七夕イベント用 ボス撃破後ルーレット完全版 v1

   新規作成対象：
   js/ending-event.js

   運用方法：
   - 通常時：js/ending.js を読み込む
   - 七夕イベント時：js/ending-event.js を読み込む
   - ending.js と ending-event.js は同時に読み込まないこと

   内容：
   - ボス撃破後のご褒美ルーレットを七夕イベント仕様に変更
   - 衣装一覧から8種類をランダム抽選してルーレット枠に配置
   - 8枠のうち1枠に停止し、当たった衣装イベント開催権を表示
   - チェキ券／萌えセレクト券／ハズレは使用しない
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

const POTORO_TANABATA_COSTUME_LIST = [
  '初代メイド服',
  '弐代目メイド服',
  '三代目メイド服',
  '四代目メイド服',
  '五代目メイド服',
  '六代目メイド服',
  'ナース',
  'OL',
  'ポリス',
  'アニマル',
  'チャイナ',
  'パジャマ',
  'セーラー服'
];

function shuffleTanabataCostumes(list){
  const arr = [...list];

  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function getBossRouletteSegments(){
  if(
    Array.isArray(window.__potoroTanabataRouletteSegments) &&
    window.__potoroTanabataRouletteSegments.length === 8
  ){
    return window.__potoroTanabataRouletteSegments;
  }

  const selectedCostumes = shuffleTanabataCostumes(POTORO_TANABATA_COSTUME_LIST).slice(0,8);

  window.__potoroTanabataRouletteSegments = selectedCostumes.map((name,index) => ({
    type:'tanabata_costume',
    label:name,
    costume:name,
    index:index
  }));

  return window.__potoroTanabataRouletteSegments;
}

function resetTanabataRouletteSegments(){
  window.__potoroTanabataRouletteSegments = null;
}

function drawBossRoulettePrize(){
  const segments = getBossRouletteSegments();
  const stopIndex = Math.floor(Math.random() * segments.length);
  const selected = segments[stopIndex];

  return {
    type:'tanabata_costume',
    label:selected.label,
    costume:selected.costume,
    stopIndex:stopIndex,
    message:
      `七夕の願い事が届きました！\n` +
      `「${selected.costume}」イベント開催権を獲得しました！`
  };
}

function getStopIndexForPrize(prize){
  if(prize && typeof prize.stopIndex === 'number'){
    return prize.stopIndex;
  }

  const segments = getBossRouletteSegments();
  const targetCostume = prize && prize.costume ? prize.costume : '';
  const foundIndex = segments.findIndex(seg => seg.costume === targetCostume);

  if(foundIndex >= 0) return foundIndex;
  return 0;
}

function ensureBossRouletteModal(){
  let modal = document.getElementById('bossRouletteModal');
  if(modal) return modal;

  modal = document.createElement('section');
  modal.id = 'bossRouletteModal';
  modal.className = 'boss-roulette-modal hidden';

  modal.innerHTML = `
    <div class="boss-roulette-card tanabata-card">
      <div class="boss-roulette-title">TANABATA EVENT BONUS</div>
      <div class="boss-roulette-sub">七夕の願い事ルーレット</div>

      <div class="boss-roulette-wrap">
        <div class="boss-roulette-pointer">▼</div>
        <div id="bossRouletteWheel" class="boss-roulette-wheel"></div>
        <div id="bossRouletteBurst" class="boss-roulette-burst hidden">WISH HIT!</div>
      </div>

      <div id="bossRouletteResult" class="boss-roulette-result">ルーレット準備中...</div>
      <button id="bossRouletteCloseBtn" class="boss-roulette-close hidden">願い事の結果を見る</button>
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
      background:
        radial-gradient(circle at 50% 20%, rgba(255,255,255,.16), transparent 32%),
        linear-gradient(180deg, rgba(24,16,74,.84), rgba(49,17,92,.86));
      backdrop-filter: blur(4px);
      padding: 18px;
    }

    .boss-roulette-card {
      width: min(92vw, 420px);
      border-radius: 28px;
      padding: 22px 18px 20px;
      background:
        radial-gradient(circle at 50% 0%, rgba(255,255,255,.98), rgba(245,240,255,.97) 55%, rgba(224,242,254,.98));
      border: 4px solid #a5b4fc;
      box-shadow: 0 0 28px rgba(129,140,248,.76), 0 16px 36px rgba(0,0,0,.35);
      text-align: center;
      color: #4338ca;
      overflow: hidden;
    }

    .boss-roulette-card.big-hit {
      animation: bossBigHitPulse .7s ease-in-out 0s 4 alternate;
      border-color: #facc15;
      box-shadow: 0 0 34px rgba(250,204,21,.9), 0 0 54px rgba(96,165,250,.72), 0 16px 36px rgba(0,0,0,.35);
    }

    @keyframes bossBigHitPulse {
      from { transform: scale(1); filter: brightness(1); }
      to { transform: scale(1.04); filter: brightness(1.25); }
    }

    .boss-roulette-title {
      font-size: 14px;
      letter-spacing: .14em;
      font-weight: 900;
      color: #6366f1;
      margin-bottom: 4px;
    }

    .boss-roulette-sub {
      font-size: 23px;
      font-weight: 900;
      color: #7c3aed;
      margin-bottom: 14px;
      text-shadow: 0 0 10px rgba(124,58,237,.24);
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
        #e0f2fe 0deg 45deg,
        #ede9fe 45deg 90deg,
        #fce7f3 90deg 135deg,
        #fef3c7 135deg 180deg,
        #dcfce7 180deg 225deg,
        #cffafe 225deg 270deg,
        #fae8ff 270deg 315deg,
        #fef9c3 315deg 360deg
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
      border: 5px solid #818cf8;
      box-shadow: 0 0 12px rgba(99,102,241,.5);
    }

    .boss-roulette-seg-label {
      position: absolute;
      left: 50%;
      top: 50%;
      transform-origin: 0 0;
      font-size: 10px;
      font-weight: 900;
      line-height: 1.12;
      color: #312e81;
      text-shadow: 0 1px 0 rgba(255,255,255,.9);
      width: 82px;
      text-align: center;
      z-index: 2;
      word-break: keep-all;
    }

    .boss-roulette-burst.hidden { display:none !important; }

    .boss-roulette-burst {
      position: absolute;
      inset: 0;
      z-index: 6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 31px;
      font-weight: 1000;
      letter-spacing: .06em;
      color: #fff;
      text-shadow: 0 0 8px #60a5fa, 0 0 18px #facc15, 0 3px 0 #7c3aed;
      animation: bossBurst .9s ease-in-out 0s 3 alternate;
      pointer-events: none;
    }

    @keyframes bossBurst {
      from { transform: scale(.7) rotate(-8deg); opacity: .2; }
      to { transform: scale(1.25) rotate(8deg); opacity: 1; }
    }

    .boss-roulette-result {
      white-space: pre-line;
      min-height: 62px;
      font-size: 17px;
      line-height: 1.5;
      font-weight: 900;
      color: #4c1d95;
      margin-bottom: 14px;
    }

    .boss-roulette-close {
      width: 100%;
      border: 0;
      border-radius: 18px;
      padding: 14px 12px;
      background: linear-gradient(135deg,#60a5fa,#a855f7,#f472b6);
      color: #fff;
      font-size: 17px;
      font-weight: 900;
      box-shadow: 0 8px 18px rgba(99,102,241,.28);
      cursor: pointer;
    }

    .tanabata-ticket {
      margin: 16px auto 18px;
      padding: 18px 14px;
      border-radius: 22px;
      background:
        radial-gradient(circle at 50% 0%, rgba(255,255,255,.98), rgba(239,246,255,.98) 58%, rgba(245,243,255,.98));
      border: 3px solid #818cf8;
      box-shadow: 0 0 22px rgba(129,140,248,.45), 0 12px 26px rgba(0,0,0,.12);
      text-align: center;
      color: #312e81;
    }

    .tanabata-ticket.hidden { display:none !important; }

    .tanabata-ticket .ticket-label {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 999px;
      background: #eef2ff;
      color: #4f46e5;
      font-size: 12px;
      font-weight: 1000;
      letter-spacing: .08em;
      margin-bottom: 8px;
    }

    .tanabata-ticket h2 {
      margin: 6px 0 8px;
      font-size: 25px;
      line-height: 1.25;
      color: #7c3aed;
      font-weight: 1000;
    }

    .tanabata-ticket p {
      margin: 8px 0;
      font-size: 14px;
      line-height: 1.65;
      font-weight: 800;
    }

    .tanabata-costume-name {
      display: block;
      margin: 10px auto;
      padding: 12px 10px;
      border-radius: 18px;
      background: linear-gradient(135deg,#fef3c7,#fce7f3,#e0f2fe);
      border: 2px solid rgba(124,58,237,.25);
      font-size: 27px;
      color: #be185d;
      font-weight: 1000;
      line-height: 1.25;
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
    label.className = 'boss-roulette-seg-label tanabata_costume';
    label.textContent = seg.label;

    const angle = index * 45 + 22.5;
    const radius = 73;

    label.style.transform =
      `rotate(${angle}deg) translate(${radius}px) rotate(90deg) translate(-41px,-8px)`;

    wheel.appendChild(label);
  });
}

function playBigWinEffect(){
  const modal = document.getElementById('bossRouletteModal');
  const card = modal ? modal.querySelector('.boss-roulette-card') : null;
  const burst = document.getElementById('bossRouletteBurst');

  if(card){
    card.classList.remove('big-hit');
    void card.offsetWidth;
    card.classList.add('big-hit');
  }

  if(burst){
    burst.textContent = 'WISH HIT!';
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
    resetTanabataRouletteSegments();

    const prize = drawBossRoulettePrize();
    const stopIndex = getStopIndexForPrize(prize);

    window.__potoroLastBossRoulettePrize = prize;
    window.__potoroLastBossRouletteStopIndex = stopIndex;

    const modal = ensureBossRouletteModal();
    const wheel = document.getElementById('bossRouletteWheel');
    const result = document.getElementById('bossRouletteResult');
    const closeBtn = document.getElementById('bossRouletteCloseBtn');

    renderBossRouletteSegments();

    if(result) result.textContent = '短冊に願いをこめて…\nルーレットスタート！';
    if(closeBtn) closeBtn.classList.add('hidden');

    modal.classList.remove('hidden');

    if(wheel){
      wheel.style.transition = 'none';
      wheel.style.transform = 'rotate(0deg)';
      void wheel.offsetWidth;

      const centerAngle = stopIndex * 45 + 22.5;
      const spins = 360 * 7;
      const finalRotation = spins - centerAngle;

      wheel.style.transition = 'transform 3.6s cubic-bezier(.12,.72,.08,1)';
      wheel.style.transform = `rotate(${finalRotation}deg)`;
    }

    if(typeof seMagic === 'function'){
      try{ seMagic(); }catch(e){}
    }

    setTimeout(() => {
      if(result){
        result.textContent =
          '！！願い事成就！！\n' +
          `「${prize.costume}」イベント開催権が当たりました！`;
      }

      playBigWinEffect();

      setTimeout(() => {
        if(result){
          result.textContent =
            prize.message + '\n結果を見るを押して、日時付きの権利画面を表示してください。';
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

  const tanabata = document.getElementById('tanabataEventTicket');
  if(tanabata) tanabata.classList.add('hidden');
}

function ensureTanabataEventTicket(){
  let ticket = document.getElementById('tanabataEventTicket');
  if(ticket) return ticket;

  const endingCard = document.querySelector('#endingScreen .ending-card');
  if(!endingCard) return null;

  ticket = document.createElement('div');
  ticket.id = 'tanabataEventTicket';
  ticket.className = 'tanabata-ticket hidden';
  ticket.innerHTML = `
    <div class="ticket-label">TANABATA WISH EVENT</div>
    <h2>イベント開催権 獲得</h2>
    <p>当選した衣装イベント</p>
    <strong id="tanabataCostumeName" class="tanabata-costume-name">---</strong>
    <p>この画面のスクリーンショットをお屋敷でご提示ください。</p>
    <div class="cheki-time">
      <span>発行日時</span>
      <strong id="tanabataIssuedAt" class="ticket-issued-at-strong">--:--</strong>
    </div>
    <div class="ticket-required-note">
      ※この権利は日時表記が写っているスクリーンショットのみ有効です。<br>
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

function showTanabataEventTicket(prize){
  const ticket = ensureTanabataEventTicket();
  const costumeName = document.getElementById('tanabataCostumeName');
  const issuedAt = document.getElementById('tanabataIssuedAt');
  const message = document.getElementById('endingMessage');
  const now = formatChekiIssuedAt(new Date());
  const costume = prize && prize.costume ? prize.costume : '衣装イベント';

  if(message){
    message.textContent =
      '七夕の願い事が叶いました！\n' +
      `「${costume}」イベント開催権を獲得しました！\n` +
      'この画面をスクリーンショットで保存してください。';
  }

  if(costumeName){
    costumeName.textContent = costume;
  }

  if(issuedAt){
    issuedAt.textContent = now;
    issuedAt.classList.add('ticket-issued-at-strong');
  }

  if(ticket) ticket.classList.remove('hidden');

  playBigWinEffect();
}

function finalizeBossRouletteResult(prize){
  const finalPrize = prize || window.__potoroLastBossRoulettePrize || {
    type:'tanabata_costume',
    costume:'衣装イベント'
  };

  hideAllEndingTickets();
  showTanabataEventTicket(finalPrize);
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
  if(message) message.textContent = '鬼怒夜魔さんをいやした！ 七夕の願い事ルーレット開始！';

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

  const tanabataIssuedAt = document.getElementById('tanabataIssuedAt');
  if(tanabataIssuedAt) tanabataIssuedAt.textContent = '--:--';

  const tanabataCostumeName = document.getElementById('tanabataCostumeName');
  if(tanabataCostumeName) tanabataCostumeName.textContent = '---';

  resetTanabataRouletteSegments();

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
    version:'tanabata-event-roulette-v1',
    event:'七夕イベント',
    costumeList:POTORO_TANABATA_COSTUME_LIST,
    visualSegments:getBossRouletteSegments(),
    rates:{
      tanabataCostume:'8枠すべて当たり / 停止枠は均等抽選'
    },
    lastPrize:window.__potoroLastBossRoulettePrize || null,
    lastStopIndex:window.__potoroLastBossRouletteStopIndex ?? null
  };
};

window.potoroTestBossRoulette = function(){
  return runBossRoulette();
};

window.potoroForceTanabataCostumeTicket = function(costumeName){
  const costume = costumeName || '初代メイド服';
  const prize = {
    type:'tanabata_costume',
    label:costume,
    costume:costume,
    stopIndex:0,
    message:
      `七夕の願い事が届きました！\n` +
      `「${costume}」イベント開催権を獲得しました！`
  };

  window.__potoroLastBossRoulettePrize = prize;
  window.__potoroLastBossRouletteStopIndex = 0;
  finalizeBossRouletteResult(prize);
};

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded',bindEndingEvents,{once:true});
}else{
  bindEndingEvents();
}
