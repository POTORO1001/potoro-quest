/* =========================
   ポトロクエスト effects.js（ボス戦強化版）
   Final Boss Presentation Edition
========================= */

const POTORO_EFFECTS = {
  enabled:true,
  damageEmoji:true,
  magicAura:true,
  bossWarning:true,
  bossPhase:true,
  bossLowHpAura:true,
  levelBurst:true,
  statusPulse:true
};

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

function showFloatingText(text,type='normal'){
  if(!POTORO_EFFECTS.enabled) return;
  const el = createPotoroEffect(`potoro-floating-text ${type}`,text);
  removeAfter(el,1200);
}

function showBattleBurst(text,type='magic'){
  if(!POTORO_EFFECTS.enabled) return;
  const area = document.querySelector('.battle-screen') || document.body;
  const el = createPotoroEffect(`potoro-battle-burst ${type}`,text,area);
  removeAfter(el,950);
}

function potoroScreenGlow(type='magic'){
  if(!POTORO_EFFECTS.enabled) return;

  document.body.classList.remove(
    'potoro-glow-magic',
    'potoro-glow-heal',
    'potoro-glow-boss',
    'potoro-glow-critical'
  );

  void document.body.offsetWidth;
  document.body.classList.add(`potoro-glow-${type}`);

  setTimeout(() => {
    document.body.classList.remove(`potoro-glow-${type}`);
  },650);
}

let potoroBossPhaseShown = false;
let potoroBossLowHpShown = false;

function resetPotoroBossEffectState(){
  potoroBossPhaseShown = false;
  potoroBossLowHpShown = false;
  document.body.classList.remove('potoro-boss-lowhp');
}

function getCurrentBossEnemy(){
  if(!state || !state.enemiesInBattle) return null;
  return state.enemiesInBattle.find(enemy => enemy && enemy.boss && enemy.hp > 0) || null;
}

function checkBossHpEffects(){
  if(!POTORO_EFFECTS.enabled || !POTORO_EFFECTS.bossLowHpAura) return;

  const boss = getCurrentBossEnemy();
  if(!boss) return;

  const rate = boss.hp / boss.maxHp;

  if(rate <= 0.5 && !potoroBossPhaseShown){
    potoroBossPhaseShown = true;
    showBossPhaseCutin('鬼奴夜魔さんの圧が増した…！');
    potoroScreenGlow('boss');
  }

  if(rate <= 0.25 && !potoroBossLowHpShown){
    potoroBossLowHpShown = true;
    document.body.classList.add('potoro-boss-lowhp');
    showBossPhaseCutin('あと少し…！最後のお給仕です！');
    showBattleBurst('FINAL PHASE','critical');
  }
}

function showBossPhaseCutin(text){
  const el = createPotoroEffect('potoro-boss-phase-cutin',text);
  removeAfter(el,1500);
}

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

const _potoroEffectsCriticalFlash = criticalFlash;

criticalFlash = function(){
  _potoroEffectsCriticalFlash();

  if(!POTORO_EFFECTS.enabled) return;

  potoroScreenGlow('critical');
  showBattleBurst('会心！','critical');
};

const _potoroEffectsBossEntrance = bossEntrance;

bossEntrance = function(){
  resetPotoroBossEffectState();

  if(POTORO_EFFECTS.enabled && POTORO_EFFECTS.bossWarning){
    showBossWarningSequence();
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
}

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

if(typeof endBattleToMap === 'function'){
  const _potoroEffectsEndBattleToMap = endBattleToMap;

  endBattleToMap = function(){
    resetPotoroBossEffectState();
    return _potoroEffectsEndBattleToMap();
  };
}

function togglePotoroEffects(){
  POTORO_EFFECTS.enabled = !POTORO_EFFECTS.enabled;
  console.log('[PO・TORO QUEST effects]',POTORO_EFFECTS.enabled ? 'ON' : 'OFF');
  return POTORO_EFFECTS.enabled;
}

function potoroEffectsReport(){
  console.log('[PO・TORO QUEST effects]',POTORO_EFFECTS);
  return POTORO_EFFECTS;
}
