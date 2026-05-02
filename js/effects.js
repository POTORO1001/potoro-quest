/* =========================
   ポトロクエスト effects.js
   Boss Sound & Light Tension Edition

   差し替え対象：
   js/effects.js

   目的：
   - ボス戦開始時の音＋光演出
   - ボスHP50%以下の緊張感
   - ボスHP25%以下の最終局面演出
   - 既存バランスは変更しない
========================= */

const POTORO_EFFECTS = {
  enabled:true,
  damageEmoji:true,
  magicAura:true,

  bossWarning:true,
  bossSound:true,
  bossLight:true,
  bossPhase:true,
  bossLowHpAura:true,
  bossDangerPulse:true,

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

/* ===== Sound Helpers ===== */
function playBossWarningSound(){
  if(!POTORO_EFFECTS.enabled || !POTORO_EFFECTS.bossSound) return;

  // 低音警告音 → 上昇音
  if(typeof tone === 'function'){
    tone(82,.18,'sawtooth',.09,0);
    tone(110,.18,'sawtooth',.08,.16);
    tone(147,.22,'sawtooth',.08,.32);
    tone(196,.28,'triangle',.07,.52);
  }
}

function playBossPhaseSound(){
  if(!POTORO_EFFECTS.enabled || !POTORO_EFFECTS.bossSound) return;

  if(typeof tone === 'function'){
    tone(196,.12,'sawtooth',.07,0);
    tone(146,.12,'sawtooth',.07,.12);
    tone(98,.28,'sawtooth',.08,.24);
  }
}

function playBossFinalSound(){
  if(!POTORO_EFFECTS.enabled || !POTORO_EFFECTS.bossSound) return;

  if(typeof tone === 'function'){
    tone(110,.09,'square',.08,0);
    tone(110,.09,'square',.08,.14);
    tone(110,.09,'square',.08,.28);
    tone(82,.35,'sawtooth',.10,.42);
  }
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

  document.body.classList.remove(
    'potoro-glow-magic',
    'potoro-glow-heal',
    'potoro-glow-boss',
    'potoro-glow-critical',
    'potoro-glow-danger'
  );

  void document.body.offsetWidth;
  document.body.classList.add(`potoro-glow-${type}`);

  setTimeout(() => {
    document.body.classList.remove(`potoro-glow-${type}`);
  },720);
}

/* ===== Boss Light Burst ===== */
function showBossLightBurst(){
  if(!POTORO_EFFECTS.enabled || !POTORO_EFFECTS.bossLight) return;

  const el = document.createElement('div');
  el.className = 'potoro-boss-light-burst';
  document.body.appendChild(el);
  removeAfter(el,1100);
}

/* ===== Boss State ===== */
let potoroBossPhaseShown = false;
let potoroBossLowHpShown = false;
let potoroBossCriticalHpShown = false;

function resetPotoroBossEffectState(){
  potoroBossPhaseShown = false;
  potoroBossLowHpShown = false;
  potoroBossCriticalHpShown = false;

  document.body.classList.remove(
    'potoro-boss-lowhp',
    'potoro-boss-criticalhp',
    'potoro-boss-danger'
  );
}

function getCurrentBossEnemy(){
  if(!state || !state.enemiesInBattle) return null;
  return state.enemiesInBattle.find(enemy => enemy && enemy.boss && enemy.hp > 0) || null;
}

function checkBossHpEffects(){
  if(!POTORO_EFFECTS.enabled) return;

  const boss = getCurrentBossEnemy();
  if(!boss){
    resetPotoroBossEffectState();
    return;
  }

  const rate = boss.hp / boss.maxHp;

  if(rate <= 0.5 && !potoroBossPhaseShown){
    potoroBossPhaseShown = true;

    document.body.classList.add('potoro-boss-danger');

    showBossPhaseCutin('鬼奴夜魔さんの圧が増した…！');
    showBattleBurst('PHASE SHIFT','critical');
    potoroScreenGlow('boss');
    playBossPhaseSound();
  }

  if(rate <= 0.25 && !potoroBossLowHpShown){
    potoroBossLowHpShown = true;

    document.body.classList.add('potoro-boss-lowhp');

    showBossPhaseCutin('あと少し…！最後のお給仕です！');
    showBattleBurst('FINAL PHASE','critical');
    potoroScreenGlow('danger');
    playBossFinalSound();
  }

  if(rate <= 0.12 && !potoroBossCriticalHpShown){
    potoroBossCriticalHpShown = true;

    document.body.classList.add('potoro-boss-criticalhp');

    showBossPhaseCutin('押し切れます！全力でお給仕！');
    showBattleBurst('FINISH!','critical');
    potoroScreenGlow('critical');
    playBossFinalSound();
  }
}

/* ===== Boss Phase Cutin ===== */
function showBossPhaseCutin(text){
  const el = createPotoroEffect('potoro-boss-phase-cutin',text);
  removeAfter(el,1500);
}

/* ===== Enhanced Damage ===== */
const _potoroEffectsShowDamage = showDamage;

showDamage = function(value,target,extraClass){
  _potoroEffectsShowDamage(value,target,extraClass);

  if(!POTORO_EFFECTS.enabled || !POTORO_EFFECTS.damageEmoji) return;

  if(target === 'enemy' && value > 0){
    if(extraClass === 'critical-text'){
      showBattleBurst('CRITICAL!', 'critical');
    }else if(value >= 70){
      showBattleBurst('BIG HIT!', 'big');
    }
  }

  if(target === 'player' && value < 0){
    showBattleBurst('HEAL', 'heal');
    potoroScreenGlow('heal');
  }

  setTimeout(checkBossHpEffects,120);
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
  resetPotoroBossEffectState();

  if(POTORO_EFFECTS.enabled && POTORO_EFFECTS.bossWarning){
    showBossWarningSequence();
    playBossWarningSound();
    showBossLightBurst();
    potoroScreenGlow('boss');
  }

  _potoroEffectsBossEntrance();
};

function showBossWarningSequence(){
  const warning = createPotoroEffect('potoro-boss-warning','WARNING');
  removeAfter(warning,1300);

  setTimeout(() => {
    const name = createPotoroEffect('potoro-boss-name-cutin','鬼奴夜魔さん 降臨');
    removeAfter(name,1500);
  },900);

  setTimeout(() => {
    showBattleBurst('BOSS BATTLE','critical');
  },1500);
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

  checkBossHpEffects();
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
  if(statusEl){
    const hasBadStatus = typeof statusText === 'function' && statusText() !== 'なし';
    statusEl.classList.toggle('potoro-status-alert',hasBadStatus);
  }

  checkBossHpEffects();
};

/* ===== Magic-Specific Visual Hooks ===== */
const _potoroEffectsUseMagic = useMagic;

useMagic = async function(kind){
  if(POTORO_EFFECTS.enabled){
    if(kind === 'aura') showFloatingText('キラキラ☆','aura');
    else if(kind === 'charge2') showFloatingText('集中…！','charge');
    else if(kind === 'multi') showFloatingText('連撃！','attack');
    else if(kind === 'rush') showFloatingText('ご帰宅！','critical');
    else if(kind === 'fullheal') showFloatingText('ぽかぽか☀','heal');
  }

  const result = await _potoroEffectsUseMagic(kind);
  checkBossHpEffects();
  return result;
};

/* ===== Battle End Cleanup ===== */
if(typeof endBattleToMap === 'function'){
  const _potoroEffectsEndBattleToMap = endBattleToMap;

  endBattleToMap = function(){
    resetPotoroBossEffectState();
    return _potoroEffectsEndBattleToMap();
  };
}

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
