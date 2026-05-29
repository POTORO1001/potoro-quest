/* =========================
   ポトロクエスト magic-learn-effect.js
   おまじない習得ポップアップ

   レベルアップで覚えたおまじないを戦闘終了後、マップへ戻る前に表示します。
========================= */

(function(){
  if(window.__potoroMagicLearnEffectFixedInstalled) return;
  window.__potoroMagicLearnEffectFixedInstalled = true;

  const POTORO_MAGIC_LEARN_LIST = {
    1:'もえもえぎゅー',
    2:'おいしくなーれ',
    3:'おやすみなさい',
    4:'ご主人様ファースト',
    5:'キラキラオーラ',
    6:'チェキフラッシュ',
    7:'完璧なお給仕',
    8:'ご奉仕連撃',
    9:'萌えちゃーじ',
    10:'ご帰宅ラッシュ',
    11:'ひなたぼっこ',
    12:'にしきぬやまー'
  };

  const pendingMagicLearnNotices = [];

  function getPlayerLevelSafe(){
    if(typeof state === 'undefined' || !state.player) return null;
    return state.player.lv || state.player.level || null;
  }

  function getMagicNameByLevel(level){
    return POTORO_MAGIC_LEARN_LIST[Number(level)] || null;
  }

  function ensureLearnedMagicMemory(){
    if(typeof state === 'undefined' || !state.player) return {};
    if(!state.player.learnedMagicNotice) state.player.learnedMagicNotice = {};
    return state.player.learnedMagicNotice;
  }

  function injectMagicLearnStyle(){
    if(document.getElementById('potoroMagicLearnStyle')) return;

    const style = document.createElement('style');
    style.id = 'potoroMagicLearnStyle';
    style.textContent = `
      .potoro-magic-learn-modal.hidden { display: none !important; }

      .potoro-magic-learn-modal {
        position: fixed;
        inset: 0;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(24,16,74,.72);
        backdrop-filter: blur(4px);
      }

      .potoro-magic-learn-card {
        position: relative;
        width: min(88vw, 390px);
        padding: 26px 18px 22px;
        border-radius: 26px;
        border: 4px solid #f5a3d6;
        background:
          radial-gradient(circle at 50% 0%, rgba(255,255,255,.98), rgba(255,241,248,.98) 58%, rgba(239,246,255,.98));
        box-shadow: 0 0 24px rgba(255,122,214,.78), 0 18px 36px rgba(0,0,0,.35);
        text-align: center;
        color: #7c2d92;
        animation: none !important;
      }

      .potoro-magic-learn-close {
        position: absolute;
        right: 12px;
        top: 10px;
        width: 34px;
        height: 34px;
        border: 0;
        border-radius: 999px;
        background: #fce7f3;
        color: #be185d;
        font-size: 24px;
        font-weight: 900;
        line-height: 1;
        cursor: pointer;
      }

      .potoro-magic-learn-kicker {
        font-size: 14px;
        letter-spacing: .22em;
        color: #f472b6;
        font-weight: 1000;
        margin-bottom: 8px;
      }

      .potoro-magic-learn-title {
        font-size: 22px;
        color: #ec4899;
        font-weight: 1000;
        margin-bottom: 12px;
        animation: none !important;
      }

      .potoro-magic-learn-name {
        display: block;
        margin: 12px auto;
        padding: 14px 10px;
        border-radius: 20px;
        background: linear-gradient(135deg,#fef3c7,#fce7f3,#ede9fe);
        border: 2px solid rgba(168,85,247,.25);
        color: #7c3aed;
        font-size: 28px;
        font-weight: 1000;
        line-height: 1.25;
        animation: none !important;
      }

      .potoro-magic-learn-help {
        margin: 10px 0 0;
        color: #4c1d95;
        font-size: 14px;
        line-height: 1.55;
        font-weight: 800;
      }

      .potoro-magic-learn-ok {
        width: 100%;
        margin-top: 18px;
        border: 0;
        border-radius: 18px;
        padding: 13px 12px;
        background: linear-gradient(135deg,#60a5fa,#a855f7,#f472b6);
        color: #fff;
        font-size: 16px;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 8px 18px rgba(99,102,241,.28);
      }
    `;

    document.head.appendChild(style);
  }

  function createMagicLearnModal(){
    injectMagicLearnStyle();

    const oldModal = document.getElementById('potoroMagicLearnModal');
    if(oldModal) oldModal.remove();

    const modal = document.createElement('section');
    modal.id = 'potoroMagicLearnModal';
    modal.className = 'potoro-magic-learn-modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.innerHTML = `
      <div class="potoro-magic-learn-card">
        <button id="potoroMagicLearnClose" class="potoro-magic-learn-close" type="button" aria-label="閉じる">×</button>
        <div class="potoro-magic-learn-kicker">LEVEL UP!</div>
        <div class="potoro-magic-learn-title">新しいおまじないを覚えました</div>
        <strong id="potoroMagicLearnName" class="potoro-magic-learn-name">---</strong>
        <p class="potoro-magic-learn-help">次の戦闘から「おまじない」で使えます。</p>
        <button id="potoroMagicLearnOk" class="potoro-magic-learn-ok" type="button">OK</button>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  function showMagicLearnModalByName(name){
    if(!name) return Promise.resolve(false);

    const modal = createMagicLearnModal();
    const nameEl = document.getElementById('potoroMagicLearnName');
    const closeBtn = document.getElementById('potoroMagicLearnClose');
    const okBtn = document.getElementById('potoroMagicLearnOk');

    if(nameEl) nameEl.textContent = name;

    if(typeof seLevelUp === 'function'){
      try{ seLevelUp(); }catch(e){}
    }

    return new Promise(resolve => {
      let acknowledged = false;

      const keepVisible = new MutationObserver(() => {
        if(acknowledged) return;

        if(modal.classList.contains('hidden')){
          modal.classList.remove('hidden');
        }

        if(modal.style.display === 'none'){
          modal.style.display = '';
        }

        if(!document.body.contains(modal)){
          document.body.appendChild(modal);
        }
      });

      keepVisible.observe(document.body,{childList:true,subtree:true});
      keepVisible.observe(modal,{attributes:true,attributeFilter:['class','style']});

      const close = (event) => {
        if(event){
          event.preventDefault();
          event.stopPropagation();
        }

        acknowledged = true;
        keepVisible.disconnect();
        closeBtn?.removeEventListener('click',close);
        okBtn?.removeEventListener('click',close);
        modal.remove();
        resolve(true);
      };

      closeBtn?.addEventListener('click',close);
      okBtn?.addEventListener('click',close);
    });
  }

  function queueMagicLearnNoticeByLevel(level){
    const lv = Number(level || getPlayerLevelSafe());
    const name = getMagicNameByLevel(lv);
    if(!name) return null;

    const memory = ensureLearnedMagicMemory();
    if(memory[lv]) return null;

    memory[lv] = true;
    pendingMagicLearnNotices.push({level:lv,name:name});

    if(typeof setMessage === 'function'){
      setMessage(`${name}を覚えた！`);
    }

    console.log('[PO・TORO QUEST] magic learned queued', {level:lv,name:name});
    return name;
  }

  async function flushMagicLearnNotices(){
    while(pendingMagicLearnNotices.length){
      const notice = pendingMagicLearnNotices.shift();
      await showMagicLearnModalByName(notice.name);
    }
  }

  window.potoroFlushMagicLearnNotices = flushMagicLearnNotices;

  window.checkMagicLearnOnLevelUp = function(level){
    return queueMagicLearnNoticeByLevel(level);
  };

  window.potoroTestMagicLearnEffect = function(level){
    return showMagicLearnModalByName(getMagicNameByLevel(Number(level)));
  };

  window.potoroMagicLearnEffectReport = function(){
    const lv = getPlayerLevelSafe();

    return {
      installed:true,
      version:'modal-manual-close-v4-css-isolated',
      playerLevel:lv,
      expectedMagic:getMagicNameByLevel(lv),
      pending:pendingMagicLearnNotices.slice(),
      flushAvailable:typeof window.potoroFlushMagicLearnNotices === 'function',
      list:POTORO_MAGIC_LEARN_LIST
    };
  };

  console.log('[PO・TORO QUEST] magic-learn-effect.js loaded', window.potoroMagicLearnEffectReport());
})();
