/* =========================
   ポトロクエスト magic-first-strike.js
   先制攻撃おまじない追加パッチ

   追加対象：
   js/magic-first-strike.js

   追加おまじない：
   ご主人様ファースト

   効果：
   - 敵より必ず先に攻撃する
   - 威力は通常の 75%
   - 単体攻撃
   - MP 6
   - Lv.4 で習得想定

   読み込み順：
   magic.js / magic-config.js / magic-config-bridge.js の後
   magic-learn-effect.js より後でもOK

   推奨：
   <script src="js/magic.js"></script>
   <script src="js/magic-learn-effect.js"></script>
   <script src="js/magic-first-strike.js"></script>
========================= */

(function(){
  if(window.__potoroFirstStrikeMagicInstalled) return;
  window.__potoroFirstStrikeMagicInstalled = true;

  const FIRST_STRIKE_MAGIC = {
    id:'first_strike',
    name:'ご主人様ファースト',
    mp:6,
    level:4,
    desc:'必ず先に攻撃する。威力は通常の75%。'
  };

  function getPlayerLevelSafe(){
    const p = state.player;
    return p.lv || p.level || 1;
  }

  function canUseFirstStrikeMagic(){
    const p = state.player;
    return getPlayerLevelSafe() >= FIRST_STRIKE_MAGIC.level && p.mp >= FIRST_STRIKE_MAGIC.mp;
  }

  function calcFirstStrikeDamage(){
    /*
      通常攻撃相当をベースに75%。
      防御無視ではなく、既存の通常攻撃に近い体感にする。
    */
    const base = Math.max(1,totalAtk() + Math.floor(Math.random()*4));
    return Math.max(1,Math.floor(base * 0.75));
  }

  async function useFirstStrikeMagic(){
    if(state.player.hp <= 0) return;
    if(state.busy) return;

    closeSubMenu();
    closeEquipMenu();

    state.busy = true;
    setButtonsDisabled(true);

    /*
      先制おまじないなので enemyFirstCheck() は呼ばない。
      ただし、プレイヤー自身の睡眠/混乱チェックは行う。
    */
    if(!(await playerStatusCheck())) return;

    const p = state.player;

    if(getPlayerLevelSafe() < FIRST_STRIKE_MAGIC.level){
      await failAction(`${FIRST_STRIKE_MAGIC.name}はまだ覚えていない！`);
      return;
    }

    if(p.mp < FIRST_STRIKE_MAGIC.mp){
      await failAction('MPがたりない！');
      return;
    }

    const target = currentEnemy();
    if(!target){
      await failAction('対象がいない！');
      return;
    }

    p.mp -= FIRST_STRIKE_MAGIC.mp;

    if(typeof showCutin === 'function'){
      await showCutin('先制おまじない',`${FIRST_STRIKE_MAGIC.name}！`);
    }

    const damage = calcFirstStrikeDamage();

    target.hp = Math.max(0,target.hp - damage);

    if(target.hp <= 0){
      state.lastDefeatedEnemy = target;
    }

    setMessage(`${FIRST_STRIKE_MAGIC.name}！ 先に動いて ${target.name} に ${damage} ダメージ！`);

    if(typeof showDamage === 'function') showDamage(damage,'enemy');
    if(typeof seMagic === 'function') seMagic();
    if(typeof enemyFlash === 'function') enemyFlash();
    if(typeof updateUI === 'function') updateUI();

    await sleep(750);

    if(allEnemiesDefeated()){
      await winBattle();
      return;
    }

    /*
      先制攻撃後、敵ターンへ。
      通常の素早さ判定は無視して「こちらが先に行動済み」扱い。
    */
    await enemyTurn();

    state.enemyActedFirst = false;
    state.busy = false;
    setButtonsDisabled(false);
    updateUI();
  }

  /*
    useMagic に新IDを追加。
    既存 useMagic を壊さず、first_strike の時だけこちらで処理。
  */
  if(typeof useMagic === 'function' && !window.__potoroUseMagicFirstStrikePatched){
    window.__potoroUseMagicFirstStrikePatched = true;

    const originalUseMagic = useMagic;

    useMagic = async function(kind){
      if(kind === 'first_strike'){
        return useFirstStrikeMagic();
      }

      return originalUseMagic.apply(this,arguments);
    };
  }

  /*
    おまじないメニューにボタンを追加。
    既存 openSubMenu を壊さず、magicメニュー表示後に追記。
  */
  if(typeof openSubMenu === 'function' && !window.__potoroOpenSubMenuFirstStrikePatched){
    window.__potoroOpenSubMenuFirstStrikePatched = true;

    const originalOpenSubMenu = openSubMenu;

    openSubMenu = function(kind){
      originalOpenSubMenu.apply(this,arguments);

      if(kind !== 'magic') return;

      const body = document.getElementById('subMenuBody');
      if(!body) return;

      const p = state.player;
      const lv = getPlayerLevelSafe();

      if(lv < FIRST_STRIKE_MAGIC.level) return;

      /*
        二重追加防止
      */
      if(body.querySelector('[data-magic-id="first_strike"]')) return;

      const btn = document.createElement('button');
      btn.dataset.magicId = 'first_strike';
      btn.textContent = `${FIRST_STRIKE_MAGIC.name}　MP${FIRST_STRIKE_MAGIC.mp} / 先制攻撃・威力75%`;
      btn.onclick = () => useMagic('first_strike');

      /*
        メニュー上ではなるべく上の方に出す。
        「先に攻撃できる」おまじないなので、攻撃系の近くへ。
      */
      if(body.firstChild){
        body.insertBefore(btn,body.firstChild.nextSibling);
      }else{
        body.appendChild(btn);
      }
    };
  }

  /*
    magic-config 系が存在する場合にも登録。
    存在しない環境では無視。
  */
  function patchMagicConfig(){
    try{
      if(typeof MAGIC_CONFIG !== 'undefined' && MAGIC_CONFIG){
        MAGIC_CONFIG.first_strike = {
          id:'first_strike',
          name:FIRST_STRIKE_MAGIC.name,
          level:FIRST_STRIKE_MAGIC.level,
          mp:FIRST_STRIKE_MAGIC.mp,
          type:'attack',
          target:'single',
          desc:FIRST_STRIKE_MAGIC.desc
        };
      }
    }catch(e){}

    try{
      if(typeof POTORO_MAGIC_CONFIG !== 'undefined' && POTORO_MAGIC_CONFIG){
        POTORO_MAGIC_CONFIG.first_strike = {
          id:'first_strike',
          name:FIRST_STRIKE_MAGIC.name,
          level:FIRST_STRIKE_MAGIC.level,
          mp:FIRST_STRIKE_MAGIC.mp,
          type:'attack',
          target:'single',
          desc:FIRST_STRIKE_MAGIC.desc
        };
      }
    }catch(e){}
  }

  function patchHelpModal(){
    const modal = document.getElementById('helpModal');
    if(!modal) return false;

    const magicSection = Array.from(modal.querySelectorAll('.help-section'))
      .find(section => section.querySelector('h2') && section.querySelector('h2').textContent.includes('おまじない'));

    if(!magicSection) return false;

    const table = magicSection.querySelector('.help-table');
    if(!table) return false;

    if(table.querySelector('[data-help-magic="first_strike"]')) return true;

    const div = document.createElement('div');
    div.dataset.helpMagic = 'first_strike';
    div.innerHTML = `<b>${FIRST_STRIKE_MAGIC.name}</b><span>先制攻撃・威力75%</span>`;

    /*
      もえもえぎゅーの次あたりに追加
    */
    if(table.children.length >= 1){
      table.insertBefore(div,table.children[1]);
    }else{
      table.appendChild(div);
    }

    return true;
  }

  patchMagicConfig();

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded',patchHelpModal,{once:true});
  }else{
    patchHelpModal();
  }

  window.potoroFirstStrikeMagicReport = function(){
    return {
      installed:true,
      magic:FIRST_STRIKE_MAGIC,
      playerLevel:getPlayerLevelSafe(),
      canUse:canUseFirstStrikeMagic(),
      hasUseMagic:typeof useMagic === 'function',
      hasOpenSubMenu:typeof openSubMenu === 'function'
    };
  };

  console.log('[PO・TORO QUEST] first strike magic installed', window.potoroFirstStrikeMagicReport());
})();
