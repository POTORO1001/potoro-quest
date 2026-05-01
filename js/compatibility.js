/* =========================
   ポトロクエスト compatibility.js（STEP13）
   分割移行後の互換・衝突チェック用ファイル

   読み込み順：
   magic.js の後、最後に読み込んでください。

   目的：
   - 必須関数が読み込まれているか確認
   - 主要データが存在するか確認
   - コンソールに分割状態を表示
========================= */

function potoroCompatibilityCheck(){
  const requiredFunctions = [
    'startGame',
    'resetGame',
    'updateUI',
    'playerAction',
    'useMagic',
    'useItem',
    'enemyTurn',
    'enemySpecialAction',
    'openEquipMenu',
    'movePlayer',
    'showEnding',
    'toggleSound'
  ];

  const requiredObjects = [
    ['state', typeof state !== 'undefined'],
    ['enemies', typeof enemies !== 'undefined'],
    ['equipmentData', typeof equipmentData !== 'undefined'],
    ['initialPlayer', typeof initialPlayer !== 'undefined']
  ];

  const missingFunctions = requiredFunctions.filter(name => typeof window[name] !== 'function');
  const missingObjects = requiredObjects.filter(pair => !pair[1]).map(pair => pair[0]);

  const result = {
    ok: missingFunctions.length === 0 && missingObjects.length === 0,
    missingFunctions,
    missingObjects,
    scripts: Array.from(document.scripts).map(script => script.getAttribute('src')).filter(Boolean)
  };

  console.log('[PO・TORO QUEST compatibility]', result);

  return result;
}

function potoroShowScriptOrder(){
  const scripts = Array.from(document.scripts)
    .map(script => script.getAttribute('src'))
    .filter(Boolean);

  console.table(scripts.map((src,index) => ({order:index+1,src})));

  return scripts;
}

function potoroQuickTest(){
  const result = potoroCompatibilityCheck();

  if(!result.ok){
    alert('ポトロクエスト：読み込み不足があります。コンソールを確認してください。');
    return result;
  }

  console.log('ポトロクエスト：分割ファイルの基本読み込みOKです。');
  return result;
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded',() => {
    setTimeout(potoroCompatibilityCheck,500);
  },{once:true});
}else{
  setTimeout(potoroCompatibilityCheck,500);
}
