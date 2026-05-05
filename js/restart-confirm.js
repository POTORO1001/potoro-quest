/* =========================
   ポトロクエスト restart-confirm.js

   目的：
   「最初から」ボタンを押したときに、
   すぐリセットせず、確認ポップアップを表示します。

   表示：
   本当に最初に戻りますか
   はい / いいえ
========================= */

(function(){
  if(window.__potoroRestartConfirmInstalled) return;
  window.__potoroRestartConfirmInstalled = true;

  function createRestartConfirmModal(){
    let modal = document.getElementById('potoroRestartConfirmModal');
    if(modal) return modal;

    modal = document.createElement('div');
    modal.id = 'potoroRestartConfirmModal';
    modal.className = 'potoro-restart-confirm hidden';

    modal.innerHTML = `
      <div class="potoro-restart-confirm-bg"></div>
      <div class="potoro-restart-confirm-box">
        <div class="potoro-restart-confirm-title">確認</div>
        <div class="potoro-restart-confirm-message">本当に最初に戻りますか？</div>
        <div class="potoro-restart-confirm-actions">
          <button id="potoroRestartYesBtn" class="potoro-restart-yes">はい</button>
          <button id="potoroRestartNoBtn" class="potoro-restart-no">いいえ</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const noBtn = document.getElementById('potoroRestartNoBtn');
    const yesBtn = document.getElementById('potoroRestartYesBtn');
    const bg = modal.querySelector('.potoro-restart-confirm-bg');

    function close(){
      modal.classList.add('hidden');
    }

    noBtn.addEventListener('click', close);
    bg.addEventListener('click', close);

    yesBtn.addEventListener('click', function(){
      close();

      if(typeof resetGame === 'function'){
        resetGame();
      }else if(typeof restartFromGameOver === 'function'){
        restartFromGameOver();
      }else{
        location.reload();
      }
    });

    return modal;
  }

  function openRestartConfirm(){
    const modal = createRestartConfirmModal();
    modal.classList.remove('hidden');
  }

  function bindRestartConfirm(){
    const btn = document.getElementById('restartBtn');
    if(!btn || btn.dataset.boundRestartConfirm) return;

    btn.dataset.boundRestartConfirm = '1';

    /*
      game.js側ですでに resetGame が click 登録されているため、
      capture:true + stopImmediatePropagation で先に止めます。
    */
    btn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      openRestartConfirm();
    }, true);
  }

  function injectStyle(){
    if(document.getElementById('potoroRestartConfirmStyle')) return;

    const style = document.createElement('style');
    style.id = 'potoroRestartConfirmStyle';
    style.textContent = `
      .potoro-restart-confirm.hidden {
        display: none !important;
      }

      .potoro-restart-confirm {
        position: fixed;
        inset: 0;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .potoro-restart-confirm-bg {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,.62);
        backdrop-filter: blur(3px);
      }

      .potoro-restart-confirm-box {
        position: relative;
        width: min(86vw, 360px);
        border-radius: 24px;
        padding: 24px 20px 20px;
        background: rgba(255,255,255,.98);
        border: 4px solid #f5a3d6;
        box-shadow: 0 0 24px rgba(255,122,214,.65), 0 12px 32px rgba(0,0,0,.35);
        text-align: center;
        color: #7f1d1d;
      }

      .potoro-restart-confirm-title {
        font-size: 18px;
        font-weight: 900;
        color: #ec4899;
        margin-bottom: 10px;
        letter-spacing: .08em;
      }

      .potoro-restart-confirm-message {
        font-size: 18px;
        font-weight: 900;
        line-height: 1.6;
        color: #7f1d1d;
        margin-bottom: 18px;
      }

      .potoro-restart-confirm-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .potoro-restart-confirm-actions button {
        border: 0;
        border-radius: 16px;
        padding: 13px 10px;
        font-weight: 900;
        font-size: 16px;
        color: #fff;
        cursor: pointer;
      }

      .potoro-restart-yes {
        background: linear-gradient(135deg,#ef4444,#991b1b);
      }

      .potoro-restart-no {
        background: linear-gradient(135deg,#64748b,#334155);
      }
    `;

    document.head.appendChild(style);
  }

  function install(){
    injectStyle();
    createRestartConfirmModal();
    bindRestartConfirm();

    console.log('[PO・TORO QUEST] restart-confirm.js loaded');
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', install, {once:true});
  }else{
    install();
  }
})();
