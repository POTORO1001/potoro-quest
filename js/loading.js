/* =========================
   ポトロクエスト loading.js（STEP15-B）
   ローディング画面制御分離ファイル

   重要：
   - game.js に hideLoadingScreen / preloadAssets が既にあります。
   - loading.js はそれらを後読みで安全に上書きします。
========================= */

/* ===== Loading Screen Hide ===== */
function hideLoadingScreen(){
  const loading = document.getElementById('loadingScreen');

  if(!loading) return;

  loading.style.opacity = '0';
  loading.style.transition = 'opacity .35s ease';

  setTimeout(() => {
    if(loading && loading.parentNode){
      loading.parentNode.removeChild(loading);
    }
  },420);
}

/* ===== Loading Text Update ===== */
function setLoadingText(text){
  const el = document.querySelector('.loading-text');
  if(el) el.textContent = text;
}

/* ===== Preload Assets ===== */
async function preloadAssets(){
  try{
    setLoadingText('画像を読み込み中...');

    await Promise.race([
      preloadImages(),
      new Promise(resolve => setTimeout(resolve,2200))
    ]);

    setLoadingText('準備完了！');
  }catch(e){
    console.warn('[PO・TORO QUEST preload error]',e);
  }finally{
    setTimeout(hideLoadingScreen,180);
  }
}

/* ===== Loading Start ===== */
function startLoadingSequence(){
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(preloadAssets,0);
  }else{
    window.addEventListener('DOMContentLoaded',preloadAssets,{once:true});
  }

  // 念のための強制解除
  setTimeout(hideLoadingScreen,3500);
}

startLoadingSequence();

/* ===== Loading Debug ===== */
function potoroLoadingReport(){
  const loading = document.getElementById('loadingScreen');

  return {
    exists:!!loading,
    hidden:loading ? loading.classList.contains('hidden') : true,
    opacity:loading ? loading.style.opacity : null
  };
}
