/* =========================
   ポトロクエスト ending-roulette-visual-sync-patch.js

   追加対象：
   js/ending-roulette-visual-sync-patch.js

   読み込み順：
   ending.js の直後

   目的：
   ルーレットの「見た目の停止マス」と「内部抽選結果」を一致させます。
   現象：
   見た目はチェキ券に止まっているのに、結果がハズレになる。
========================= */

(function(){
  if(window.__potoroRouletteVisualSyncPatchInstalled) return;
  window.__potoroRouletteVisualSyncPatchInstalled = true;

  function getSegments(){
    return [
      {type:'miss',label:'ハズレ'},
      {type:'cheki',label:'チェキ券'},
      {type:'miss',label:'ハズレ'},
      {type:'miss',label:'ハズレ'},
      {type:'moe_select',label:'萌えセレクト券(30分)'},
      {type:'miss',label:'ハズレ'},
      {type:'cheki',label:'チェキ券'},
      {type:'miss',label:'ハズレ'}
    ];
  }

  window.getBossRouletteSegments = getSegments;

  window.getStopIndexForPrize = function(prizeType){
    const segments = getSegments();
    const candidates = [];

    segments.forEach((seg,index)=>{
      if(seg.type === prizeType) candidates.push(index);
    });

    if(!candidates.length) return 0;
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  function injectVisualSyncStyle(){
    if(document.getElementById('bossRouletteVisualSyncPatchStyle')) return;

    const style = document.createElement('style');
    style.id = 'bossRouletteVisualSyncPatchStyle';
    style.textContent = `
      /*
        0番マスの中心が必ず12時方向に来るように補正。
        これで stopIndex と見た目が一致します。
      */
      .boss-roulette-wheel {
        background: conic-gradient(
          from -22.5deg,
          #f8fafc 0deg 45deg,
          #fde68a 45deg 90deg,
          #f8fafc 90deg 135deg,
          #f8fafc 135deg 180deg,
          #f9a8d4 180deg 225deg,
          #f8fafc 225deg 270deg,
          #fde68a 270deg 315deg,
          #f8fafc 315deg 360deg
        ) !important;
      }

      .boss-roulette-seg-label {
        width: 86px !important;
      }
    `;
    document.head.appendChild(style);
  }

  window.renderBossRouletteSegments = function(){
    injectVisualSyncStyle();

    const wheel = document.getElementById('bossRouletteWheel');
    if(!wheel) return;

    wheel.innerHTML = '';

    const segments = getSegments();

    segments.forEach((seg,index)=>{
      const label = document.createElement('div');
      label.className = `boss-roulette-seg-label ${seg.type}`;
      label.textContent = seg.label;

      /*
        index 0 = 12時方向
        index 1 = 1時半方向
        index 2 = 3時方向
      */
      const angle = index * 45;
      const radius = 76;

      label.style.transform =
        `rotate(${angle}deg) translateY(-${radius}px) rotate(${-angle}deg) translate(-43px,-8px)`;

      wheel.appendChild(label);
    });
  };

  window.runBossRoulette = function(){
    return new Promise(resolve => {
      injectVisualSyncStyle();

      const prize = drawBossRoulettePrize();
      const stopIndex = window.getStopIndexForPrize(prize.type);

      window.__potoroLastBossRoulettePrize = prize;
      window.__potoroLastBossRouletteStopIndex = stopIndex;

      const modal = ensureBossRouletteModal();
      const wheel = document.getElementById('bossRouletteWheel');
      const result = document.getElementById('bossRouletteResult');
      const closeBtn = document.getElementById('bossRouletteCloseBtn');

      window.renderBossRouletteSegments();

      if(result) result.textContent = 'ルーレットスタート！';
      if(closeBtn) closeBtn.classList.add('hidden');

      modal.classList.remove('hidden');

      if(wheel){
        wheel.style.transition = 'none';
        wheel.style.transform = 'rotate(0deg)';
        void wheel.offsetWidth;

        /*
          0番マスの中心は上。
          stopIndex番マスを上に持ってくるには -stopIndex*45度。
        */
        const finalRotation = 360 * 7 - (stopIndex * 45);

        wheel.style.transition = 'transform 3.6s cubic-bezier(.12,.72,.08,1)';
        wheel.style.transform = `rotate(${finalRotation}deg)`;
      }

      if(typeof seMagic === 'function'){
        try{ seMagic(); }catch(e){}
      }

      setTimeout(() => {
        if(prize.type === 'cheki' || prize.type === 'moe_select'){
          if(result) result.textContent = '！！大当たり！！';

          if(typeof playBigWinEffect === 'function'){
            playBigWinEffect(prize.type);
          }

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
  };

  window.potoroRouletteVisualSyncReport = function(){
    return {
      installed:true,
      version:'roulette-visual-sync-patch-v1',
      segments:getSegments(),
      lastPrize:window.__potoroLastBossRoulettePrize || null,
      lastStopIndex:window.__potoroLastBossRouletteStopIndex ?? null
    };
  };

  window.potoroForceNextBossRoulette = function(type){
    window.__potoroForceNextRoulettePrize = type || 'miss';
    return '次回のルーレット結果を ' + window.__potoroForceNextRoulettePrize + ' に固定しました。potoroTestBossRoulette() を実行してください。';
  };

  /*
    drawBossRoulettePrize に強制テスト機能を追加。
    既存関数を包む。
  */
  if(typeof drawBossRoulettePrize === 'function' && !window.__potoroDrawRoulettePrizePatched){
    window.__potoroDrawRoulettePrizePatched = true;
    const originalDrawBossRoulettePrize = drawBossRoulettePrize;

    drawBossRoulettePrize = function(){
      if(window.__potoroForceNextRoulettePrize){
        const forced = window.__potoroForceNextRoulettePrize;
        window.__potoroForceNextRoulettePrize = null;

        if(forced === 'cheki'){
          return {type:'cheki',label:'チェキ券',message:'大当たり！チェキ券が当たった！'};
        }

        if(forced === 'moe_select'){
          return {type:'moe_select',label:'萌えセレクト券(30分)',message:'超大当たり！萌えセレクト券(30分)が当たった！！'};
        }

        return {type:'miss',label:'ハズレ',message:'残念…今回はハズレでした。'};
      }

      return originalDrawBossRoulettePrize();
    };
  }

  injectVisualSyncStyle();

  console.log('[PO・TORO QUEST] ending-roulette-visual-sync-patch.js loaded', window.potoroRouletteVisualSyncReport());
})();
