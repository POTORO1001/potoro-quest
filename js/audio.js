/* =========================
   ポトロクエスト audio.js（STEP8）
   BGM / SE / 音量制御 分離ファイル

   読み込み順：
   1. js/game.js
   2. js/audio.js
   3. js/ui.js
   4. js/battle.js
   5. js/enemy.js
   6. js/equipment.js
   7. js/item.js
   8. js/map.js
   9. js/magic.js

   重要：
   - audio.js は stopAllBgm / playBgm / playMapBgm / SE系関数を上書きします。
   - battle.js / map.js / ui.js からSEやBGMを呼ぶため、
     audio.js はそれらより前に読み込む構成を推奨します。
========================= */

/* ===== BGM ID管理 ===== */
const POTORO_BGM_IDS = [
  'bgmOpening',
  'bgmMap',
  'bgmMap1F',
  'bgmMap2F',
  'bgmBattle',
  'bgmBoss',
  'bgmTamachan'
];

/* ===== BGM停止 ===== */
function stopAllBgm(){
  POTORO_BGM_IDS.forEach(id => {
    const audio = document.getElementById(id);

    if(audio){
      audio.pause();
      audio.currentTime = 0;
    }
  });
}

/* ===== BGM再生 ===== */
function playBgm(id){
  if(state && state.soundOff) return;
  if(soundState && soundState.enabled === false) return;

  stopAllBgm();

  const audio = document.getElementById(id);

  if(audio){
    const result = audio.play();

    if(result && typeof result.catch === 'function'){
      result.catch(() => {});
    }
  }
}

/* ===== マップBGM ===== */
function playMapBgm(){
  playBgm(state.floor === 2 ? 'bgmMap2F' : 'bgmMap1F');
}

/* ===== 旧WebAudio BGM停止互換 ===== */
function stopBgm(){
  if(soundState.bgmTimer){
    clearInterval(soundState.bgmTimer);
    soundState.bgmTimer = null;
  }

  soundState.bgmKind = null;
}

/* ===== 音声状態 ===== */
if(typeof soundState === 'undefined'){
  var soundState = {
    ctx:null,
    enabled:true,
    bgmTimer:null,
    bgmKind:null
  };
}

/* ===== AudioContext初期化 ===== */
function initAudio(){
  if(soundState.ctx) return soundState.ctx;

  try{
    soundState.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return soundState.ctx;
  }catch(e){
    return null;
  }
}

/* ===== 音ON/OFF ===== */
function toggleSound(){
  soundState.enabled = !soundState.enabled;

  const btn = document.getElementById('soundBtn');

  if(btn){
    btn.textContent = soundState.enabled ? '音: ON' : '音: OFF';
    btn.classList.toggle('sound-off', !soundState.enabled);
  }

  if(!soundState.enabled){
    stopAllBgm();
    stopBgm();
    return;
  }

  if(state.inBattle && state.enemiesInBattle && state.enemiesInBattle.length){
    if(state.enemiesInBattle.some(enemy => enemy.helper)){
      playBgm('bgmTamachan');
    }else if(state.enemiesInBattle.some(enemy => enemy.boss)){
      playBgm('bgmBoss');
    }else{
      playBgm('bgmBattle');
    }
  }else if(state.started){
    playMapBgm();
  }else{
    playBgm('bgmOpening');
  }
}

/* ===== Tone Helper ===== */
function tone(freq,duration,type='square',gain=.08,delay=0){
  if(!soundState.enabled) return;

  const ctx = initAudio();
  if(!ctx) return;

  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  g.gain.setValueAtTime(gain, ctx.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + delay + duration);

  osc.connect(g);
  g.connect(ctx.destination);

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

/* ===== Sequence Helper ===== */
function playSeq(notes){
  let t = 0;

  notes.forEach(note => {
    if(note.f > 0){
      tone(
        note.f,
        note.d,
        note.type || 'square',
        note.g || .08,
        t
      );
    }

    t += note.wait || note.d;
  });
}

/* ===== SE ===== */
function seAttack(){
  playSeq([
    {f:520,d:.06,g:.09},
    {f:260,d:.08,g:.08}
  ]);
}

function seHit(){
  playSeq([
    {f:110,d:.09,type:'sawtooth',g:.08},
    {f:85,d:.08,type:'sawtooth',g:.06}
  ]);
}

function seHeal(){
  playSeq([
    {f:523,d:.08,type:'sine',g:.08},
    {f:659,d:.08,type:'sine',g:.08},
    {f:784,d:.12,type:'sine',g:.08}
  ]);
}

function seMagic(){
  playSeq([
    {f:740,d:.07,type:'triangle',g:.07},
    {f:988,d:.07,type:'triangle',g:.07},
    {f:1175,d:.12,type:'triangle',g:.07}
  ]);
}

function seTreasure(){
  playSeq([
    {f:659,d:.08,type:'sine',g:.08},
    {f:784,d:.08,type:'sine',g:.08},
    {f:988,d:.12,type:'sine',g:.09}
  ]);
}

function seLevelUp(){
  playSeq([
    {f:523,d:.09,type:'sine',g:.08},
    {f:659,d:.09,type:'sine',g:.08},
    {f:784,d:.09,type:'sine',g:.08},
    {f:1046,d:.18,type:'sine',g:.08}
  ]);
}

function seVictory(){
  playSeq([
    {f:392,d:.12,type:'triangle',g:.08},
    {f:523,d:.12,type:'triangle',g:.08},
    {f:659,d:.12,type:'triangle',g:.08},
    {f:784,d:.2,type:'triangle',g:.08}
  ]);
}

function seCheki(){
  playSeq([
    {f:880,d:.08,type:'sine',g:.09},
    {f:1175,d:.08,type:'sine',g:.09},
    {f:1568,d:.18,type:'sine',g:.09}
  ]);
}

/* ===== 旧WebAudio BGM互換 =====
   MP3 BGM版では簡易BGMは使用しません。
========================= */
function startBgm(kind){
  return;
}

/* ===== BGM Utility ===== */
function playBattleBgmForCurrentEnemy(){
  if(!state.enemiesInBattle || !state.enemiesInBattle.length){
    playBgm('bgmBattle');
    return;
  }

  if(state.enemiesInBattle.some(enemy => enemy.helper)){
    playBgm('bgmTamachan');
    return;
  }

  if(state.enemiesInBattle.some(enemy => enemy.boss)){
    playBgm('bgmBoss');
    return;
  }

  playBgm('bgmBattle');
}

/* ===== 初期タイトルBGM ===== */
function bindOpeningBgmOnLoad(){
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => playBgm('bgmOpening'), 300);
  });
}

bindOpeningBgmOnLoad();
