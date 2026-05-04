/* =========================
   ポトロクエスト item-name-rename.js
   どうぐ名変更パッチ

   追加対象：
   js/item-name-rename.js

   目的：
   内部IDと効果はそのまま、表示名だけ変更します。

   変更内容：
   紅茶 → ココア
   冷静の紅茶 → ホットミルク
   リフレッシュアロマ → ジュエリーウォーター
   キラキラパウダー → マジックパウダー
========================= */

(function(){
  if(window.__potoroItemNameRenameInstalled) return;
  window.__potoroItemNameRenameInstalled = true;

  const POTORO_ITEM_NAME_RENAMES = {
    tea:'ココア',
    cool_tea:'ホットミルク',
    refresh_aroma:'ジュエリーウォーター',
    kira_powder:'マジックパウダー'
  };

  const POTORO_ITEM_LABEL_RENAMES = {
    tea:'ココア　MP10回復',
    cool_tea:'ホットミルク　混乱回復',
    refresh_aroma:'ジュエリーウォーター　状態異常回復',
    kira_powder:'マジックパウダー　おまじない強化'
  };

  function renameItemDefinitions(){
    if(typeof POTORO_ITEMS === 'undefined') return false;

    Object.keys(POTORO_ITEM_NAME_RENAMES).forEach(id => {
      if(POTORO_ITEMS[id]){
        POTORO_ITEMS[id].name = POTORO_ITEM_NAME_RENAMES[id];
        POTORO_ITEMS[id].label = POTORO_ITEM_LABEL_RENAMES[id] || POTORO_ITEM_NAME_RENAMES[id];
      }
    });

    return true;
  }

  function renameDropTables(){
    if(typeof POTORO_DROP_CONFIG === 'undefined') return false;

    function renameDrop(drop){
      if(!drop || !drop.id) return;
      if(POTORO_ITEM_NAME_RENAMES[drop.id]){
        drop.name = POTORO_ITEM_NAME_RENAMES[drop.id];
      }
    }

    if(POTORO_DROP_CONFIG.items){
      Object.values(POTORO_DROP_CONFIG.items).forEach(table => {
        if(Array.isArray(table)) table.forEach(renameDrop);
      });
    }

    if(POTORO_DROP_CONFIG.rareItems){
      Object.values(POTORO_DROP_CONFIG.rareItems).forEach(table => {
        if(Array.isArray(table)) table.forEach(renameDrop);
      });
    }

    return true;
  }

  function renameHelpModalStaticText(){
    const modal = document.getElementById('helpModal');
    if(!modal) return false;

    modal.innerHTML = modal.innerHTML
      .replaceAll('冷静の紅茶', 'ホットミルク')
      .replaceAll('紅茶', 'ココア')
      .replaceAll('リフレッシュアロマ', 'ジュエリーウォーター')
      .replaceAll('キラキラパウダー', 'マジックパウダー');

    return true;
  }

  function installPotoroItemNameRename(){
    renameItemDefinitions();
    renameDropTables();
    renameHelpModalStaticText();

    if(typeof updateUI === 'function') updateUI();
    if(typeof updateMapStatusPanel === 'function') updateMapStatusPanel();

    console.log('[PO・TORO QUEST] item names renamed', potoroItemNameRenameReport());
    return true;
  }

  window.installPotoroItemNameRename = installPotoroItemNameRename;

  window.potoroItemNameRenameReport = function(){
    return {
      installed:true,
      renames:POTORO_ITEM_NAME_RENAMES,
      itemDefinitions:typeof POTORO_ITEMS !== 'undefined'
        ? Object.fromEntries(Object.keys(POTORO_ITEM_NAME_RENAMES).map(id => [id, POTORO_ITEMS[id]?.name || null]))
        : null
    };
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded',installPotoroItemNameRename,{once:true});
  }else{
    installPotoroItemNameRename();
  }
})();
