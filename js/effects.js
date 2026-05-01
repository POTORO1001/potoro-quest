/* =========================
   ポトロクエスト effects.js（STEP19）
   UI・演出強化ファイル

   読み込み順：
   magic.js の後、compatibility.js の前に読み込んでください。

   目的：
   - ダメージ演出強化
   - 回復演出強化
   - おまじない演出強化
   - レベルアップ演出強化
   - ボス演出強化
   - 状態異常演出強化

   注意：
   - 既存関数を後読みで拡張します。
   - 既存仕様・数値バランスは変更しません。
========================= */

/* ===== Effects Config ===== */
const POTORO_EFFECTS = {
  enabled:true,
  damageEmoji:true,
  magicAura:true,
  bossWarning:true,
  levelBurst:true,
  statusPulse:true
};

/* ===== Effect DOM Helper ===== */
function createPotoroEffect(className,text,parent=document.body){
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

function removeAfter(el,ms){
  setTimeout(() => {
    if(el && el.parentNode) el.remove();
  },ms);
}

/* ===== Floating Text ===== */
function showFloatingText(text,type='normal'){
  if(!POTORO_EFFECTS.enabled) return;

  const el = createPotoroEffect(`potoro-floating-text ${type}`,text);
  removeAfter(el,1200);
}

/* ===== Battle Burst ===== */
function showBattleBurst(text,type='magic'){
  if(!POTORO_EFFECTS.enabled) return;

  const area = document.querySelector('.battle-screen') || document.body;
  const el = createPotoroEffect(`potoro-battle-burst ${type}`,text,area);
  removeAfter(el,950);
}

/* ===== Screen Glow ===== */
function potoroScreenGlow(type='magic'){
  if(!POTORO_EFFECTS.enabled) return;

  document.body.classList.remove('potoro-glow-magic','potoro-glow-heal','potoro-glow-boss','potoro-glow-critical');
  void document.body.offsetWidth;
  document.body.classList.add(`potoro-glow-${type}`);

  setTimeout(() => {
    document.body.classList.remove(`potoro-glow-${type}`);
  },650);
}

/* ===== Enhanced Damage ===== */
const _potoroEffectsShowDamage = showDamage;

showDamage = function(value,target,extraClass){
  _potoroEffectsShowDamage(value,target,extraClass);

  if(!POTORO_EFFECTS.enabled || !POTORO_EFFECTS.damageEmoji) return;

  if(target === 'enemy' && value > 0){
    if(extraClass === 'critical-text'){
      showBattleBurst('CRITICAL!', 'critical');
    }else if(value >= 60){
      showBattleBurst('BIG HIT!', 'big');
    }
  }

  if(target === 'player' && value < 0){
    showBattleBurst('HEAL', 'heal');
    potoroScreenGlow('heal');
  }
};

/* ===== Enhanced Cutin ===== */
const _potoroEffectsShowCutin = showCutin;

showCutin = async function(title,text){
  if(POTORO_EFFECTS.enabled){
    if(title.includes('必殺')){
      potoroScreenGlow('critical');
      showBattleBurst('SPECIAL!', 'critical');
    }else if(title.includes('回復')){
      potoroScreenGlow('heal');
    }else{
      potoroScreenGlow('magic');
    }
  }

  return _potoroEffectsShowCutin(title,text);
};

/* ===== Enhanced Critical ===== */
const _potoroEffectsCriticalFlash = criticalFlash;

criticalFlash = function(){
  _potoroEffectsCriticalFlash();

  if(!POTORO_EFFECTS.enabled) return;

  potoroScreenGlow('critical');
  showBattleBurst('会心！','critical');
};

/* ===== Enhanced Boss Entrance ===== */
const _potoroEffectsBossEntrance = bossEntrance;

bossEntrance = function(){
  if(POTORO_EFFECTS.enabled && POTORO_EFFECTS.bossWarning){
    showBossWarning();
  }

  _potoroEffectsBossEntrance();
};

function showBossWarning(){
  const el = createPotoroEffect('potoro-boss-warning','WARNING');
  removeAfter(el,1300);
}

/* ===== Enhanced Level Up ===== */
const _potoroEffectsShowLevelToast = showLevelToast;

showLevelToast = function(text){
  _potoroEffectsShowLevelToast(text);

  if(!POTORO_EFFECTS.enabled || !POTORO_EFFECTS.levelBurst) return;

  showBattleBurst('LEVEL UP!', 'level');
  potoroScreenGlow('magic');
  createLevelParticles();
};

function createLevelParticles(){
  const count = 14;

  for(let i=0;i<count;i++){
    const el = createPotoroEffect('potoro-level-particle','✦');

    el.style.left = `${50 + (Math.random()*42 - 21)}%`;
    el.style.top = `${28 + (Math.random()*24 - 12)}%`;
    el.style.animationDelay = `${Math.random()*0.18}s`;

    removeAfter(el,1000);
  }
}

/* ===== Enhanced Enemy Flash ===== */
const _potoroEffectsEnemyFlash = enemyFlash;

enemyFlash = function(){
  _potoroEffectsEnemyFlash();

  if(!POTORO_EFFECTS.enabled) return;

  const selected = document.querySelector('.enemy-slot.selected');
  if(selected){
    selected.classList.remove('potoro-hit-ring');
    void selected.offsetWidth;
    selected.classList.add('potoro-hit-ring');
    setTimeout(() => selected.classList.remove('potoro-hit-ring'),500);
  }
};

/* ===== Enhanced Player Flash ===== */
const _potoroEffectsPlayerFlash = playerFlash;

playerFlash = function(){
  _potoroEffectsPlayerFlash();

  if(!POTORO_EFFECTS.enabled) return;

  const panel = document.querySelector('.status-panel');
  if(panel){
    panel.classList.remove('potoro-player-danger');
    void panel.offsetWidth;
    panel.classList.add('potoro-player-danger');
    setTimeout(() => panel.classList.remove('potoro-player-danger'),650);
  }
};

/* ===== Status UI Pulse ===== */
const _potoroEffectsUpdateUI = updateUI;

updateUI = function(){
  _potoroEffectsUpdateUI();

  if(!POTORO_EFFECTS.enabled || !POTORO_EFFECTS.statusPulse) return;

  const statusEl = document.getElementById('playerStatusEffects');
  if(!statusEl) return;

  const hasBadStatus = statusText && statusText() !== 'なし';

  statusEl.classList.toggle('potoro-status-alert',hasBadStatus);
};

/* ===== Magic-Specific Visual Hooks ===== */
const _potoroEffectsUseMagic = useMagic;

useMagic = async function(kind){
  if(POTORO_EFFECTS.enabled){
    if(kind === 'aura'){
      showFloatingText('キラキラ☆','aura');
    }else if(kind === 'charge2'){
      showFloatingText('集中…！','charge');
    }else if(kind === 'multi'){
      showFloatingText('連撃！','attack');
    }else if(kind === 'rush'){
      showFloatingText('ご帰宅！','critical');
    }else if(kind === 'fullheal'){
      showFloatingText('ぽかぽか☀','heal');
    }
  }

  return _potoroEffectsUseMagic(kind);
};

/* ===== Toggle Effects ===== */
function togglePotoroEffects(){
  POTORO_EFFECTS.enabled = !POTORO_EFFECTS.enabled;
  console.log('[PO・TORO QUEST effects]',POTORO_EFFECTS.enabled ? 'ON' : 'OFF');
  return POTORO_EFFECTS.enabled;
}

function potoroEffectsReport(){
  console.log('[PO・TORO QUEST effects]',POTORO_EFFECTS);
  return POTORO_EFFECTS;
}
