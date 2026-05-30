/* =========================
   ポトロクエスト magic-level-order.js
   おまじない習得レベル完全固定版

   追加対象：
   js/magic-level-order.js

   目的：
   おまじないの習得レベルを下記に完全固定します。

   Lv1  もえもえぎゅー
   Lv2  おいしくなーれ
   Lv3  おやすみなさい
   Lv4  ご主人様ファースト
   Lv5  キラキラオーラ
   Lv6  チェキフラッシュ
   Lv7  完璧なお給仕
   Lv8  ご奉仕連撃
   Lv9  萌えちゃーじ
   Lv10 ご帰宅ラッシュ
   Lv11 ひなたぼっこ
   Lv12 にしきぬやまー

   推奨読み込み順：
   magic.js / magic-config.js / magic-config-bridge.js の後
   magic-first-strike.js の後でもOK

   index.html例：
   <script src="js/magic.js"></script>
   <script src="js/magic-first-strike.js"></script>
   <script src="js/magic-level-order.js"></script>
========================= */

(function(){
  if(window.__potoroMagicLevelOrderInstalled) return;
  window.__potoroMagicLevelOrderInstalled = true;

  const POTORO_MAGIC_LEVEL_ORDER = [
    {id:'moe', key:'moe', name:'もえもえぎゅー', level:1, mp:5, desc:'単体ダメージ'},
    {id:'heal', key:'heal', name:'おいしくなーれ', level:2, mp:6, desc:'HP回復'},
    {id:'sleep', key:'sleep', name:'おやすみなさい', level:3, mp:3, desc:'敵を眠らせる'},
    {id:'first_strike', key:'first_strike', name:'ご主人様ファースト', level:4, mp:6, desc:'必ず先制攻撃・威力75%'},
    {id:'aura', key:'aura', name:'キラキラオーラ', level:5, mp:4, desc:'トーク力＋すばやさUP'},
    {id:'shower', key:'shower', name:'チェキフラッシュ', level:6, mp:12, desc:'敵全体ダメージ'},
    {id:'perfect_service', key:'perfect_service', name:'完璧なお給仕', level:7, mp:7, desc:'次の行動ダメージ2.5倍'},
    {id:'combo', key:'combo', name:'ご奉仕連撃', level:8, mp:8, desc:'2〜3回攻撃'},
    {id:'charge', key:'charge', name:'萌えちゃーじ', level:9, mp:0, desc:'MP回復'},
    {id:'rush', key:'rush', name:'ご帰宅ラッシュ', level:10, mp:12, desc:'高ダメージ＋低確率混乱'},
    {id:'sunny', key:'sunny', name:'ひなたぼっこ', level:11, mp:12, desc:'HP全回復＋状態異常回復'},
    {id:'nishiki', key:'nishiki', name:'にしきぬやまー', level:12, mp:16, desc:'超高威力単体攻撃'}
  ];

  const ALIAS = {
    moe:['moe','moe_gyu','moemoe','moeGyu'],
    heal:['heal','oishiku','oishiku_naare'],
    sleep:['sleep','oyasumi'],
    first_strike:['first_strike','firstStrike','first'],
    aura:['aura','kira_aura','kira','kiraAura'],
    shower:['shower','cheki_flash','cheki','chekiFlash'],
    perfect_service:['perfect_service','perfect','perfectService'],
    combo:['combo','combo_attack','rengeki','gohoshi_combo'],
    charge:['charge','moe_charge','moeCharge'],
    rush:['rush','go_home_rush','gokitaku_rush'],
    sunny:['sunny','hinatabokko','hinata'],
    nishiki:['nishiki','nishikinuyama']
  };

  function getPlayerLevelSafe(){
    const p = state.player;
    return p.lv || p.level || 1;
  }

  function findMagicOrderByKind(kind){
    return POTORO_MAGIC_LEVEL_ORDER.find(magic => {
      const aliases = ALIAS[magic.id] || [magic.id];
      return aliases.includes(kind);
    }) || null;
  }

  function patchMagicObject(obj,key,magic){
    if(!obj || !key || !magic) return false;
    if(!obj[key]) return false;

    obj[key].level = magic.level;
    obj[key].lv = magic.level;
    obj[key].learnLevel = magic.level;
    obj[key].mp = magic.mp;
    obj[key].cost = magic.mp;
    obj[key].name = magic.name;
    obj[key].desc = magic.desc;

    return true;
  }

  function patchMagicConfigObject(obj){
    if(!obj) return false;

    POTORO_MAGIC_LEVEL_ORDER.forEach(magic => {
      const aliases = ALIAS[magic.id] || [magic.id];

      aliases.forEach(key => {
        patchMagicObject(obj,key,magic);
      });

      // 存在しない場合は代表IDで追加
      if(!obj[magic.id]){
        obj[magic.id] = {
          id:magic.id,
          key:magic.key,
          name:magic.name,
          level:magic.level,
          lv:magic.level,
          learnLevel:magic.level,
          mp:magic.mp,
          cost:magic.mp,
          desc:magic.desc
        };
      }
    });

    return true;
  }

  function patchKnownMagicConfigs(){
    try{
      if(typeof MAGIC_CONFIG !== 'undefined') patchMagicConfigObject(MAGIC_CONFIG);
    }catch(e){}

    try{
      if(typeof POTORO_MAGIC_CONFIG !== 'undefined') patchMagicConfigObject(POTORO_MAGIC_CONFIG);
    }catch(e){}

    try{
      if(typeof magicConfig !== 'undefined') patchMagicConfigObject(magicConfig);
    }catch(e){}

    try{
      if(typeof magicData !== 'undefined') patchMagicConfigObject(magicData);
    }catch(e){}

    try{
      if(typeof magics !== 'undefined') patchMagicConfigObject(magics);
    }catch(e){}
  }

  function shouldShowMagic(kind){
    const magic = findMagicOrderByKind(kind);
    if(!magic) return true;
    return getPlayerLevelSafe() >= magic.level;
  }

  function buttonTextForMagic(magic){
    return `${magic.name}　MP${magic.mp} / ${magic.desc}`;
  }

  function rebuildMagicMenu(){
    const body = document.getElementById('subMenuBody');
    const title = document.getElementById('subMenuTitle');

    if(!body || !title) return false;
    if(title.textContent !== 'おまじない') return false;

    body.innerHTML = '';

    POTORO_MAGIC_LEVEL_ORDER.forEach(magic => {
      if(getPlayerLevelSafe() < magic.level) return;

      const btn = document.createElement('button');
      btn.dataset.magicId = magic.id;
      btn.textContent = buttonTextForMagic(magic);
      btn.onclick = () => useMagic(magic.key);

      body.appendChild(btn);
    });

    return true;
  }

  /*
    openSubMenu を包んで、おまじないメニューを指定順に完全再構築。
  */
  if(typeof openSubMenu === 'function' && !window.__potoroMagicLevelOrderOpenSubMenuPatched){
    window.__potoroMagicLevelOrderOpenSubMenuPatched = true;

    const originalOpenSubMenu = openSubMenu;

    openSubMenu = function(kind){
      const result = originalOpenSubMenu.apply(this,arguments);

      if(kind === 'magic'){
        rebuildMagicMenu();
      }

      return result;
    };
  }

  /*
    useMagic を包んで、未習得おまじないを安全に止める。
  */
  if(typeof useMagic === 'function' && !window.__potoroMagicLevelOrderUseMagicPatched){
    window.__potoroMagicLevelOrderUseMagicPatched = true;

    const originalUseMagic = useMagic;

    useMagic = async function(kind){
      const magic = findMagicOrderByKind(kind);

      if(magic && getPlayerLevelSafe() < magic.level){
        if(typeof failAction === 'function'){
          return failAction(`${magic.name}はまだ覚えていない！`);
        }

        if(typeof setMessage === 'function') setMessage(`${magic.name}はまだ覚えていない！`);
        return;
      }

      return originalUseMagic.apply(this,arguments);
    };
  }

  /*
    ヘルプモーダルの表示も指定順に寄せる。
  */
  function patchHelpModal(){
    const modal = document.getElementById('helpModal');
    if(!modal) return false;

    const section = Array.from(modal.querySelectorAll('.help-section'))
      .find(sec => {
        const h2 = sec.querySelector('h2');
        return h2 && h2.textContent.includes('おまじない');
      });

    if(!section) return false;

    const table = section.querySelector('.help-table');
    if(!table) return false;

    table.innerHTML = '';

    POTORO_MAGIC_LEVEL_ORDER.forEach(magic => {
      const row = document.createElement('div');
      row.dataset.helpMagic = magic.id;
      row.innerHTML = `<b>Lv${magic.level} ${magic.name}</b><span>${magic.desc}</span>`;
      table.appendChild(row);
    });

    return true;
  }

  function installPotoroMagicLevelOrder(){
    patchKnownMagicConfigs();
    patchHelpModal();

    console.log('[PO・TORO QUEST] magic level order installed', potoroMagicLevelOrderReport());
    return true;
  }

  window.installPotoroMagicLevelOrder = installPotoroMagicLevelOrder;

  window.potoroMagicLevelOrderReport = function(){
    return {
      installed:true,
      version:'fixed-level-order-v1',
      playerLevel:typeof state !== 'undefined' && state.player ? getPlayerLevelSafe() : null,
      order:POTORO_MAGIC_LEVEL_ORDER.map(magic => ({
        level:magic.level,
        id:magic.id,
        key:magic.key,
        name:magic.name,
        mp:magic.mp,
        desc:magic.desc
      }))
    };
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded',installPotoroMagicLevelOrder,{once:true});
  }else{
    installPotoroMagicLevelOrder();
  }
})();
