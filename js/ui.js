/* =========================
   ポトロクエスト ui.js（STEP7）
   UI更新・描画・演出分離ファイル

   読み込み順：
   1. js/game.js
   2. js/ui.js
   3. js/battle.js
   4. js/enemy.js
   5. js/equipment.js
   6. js/item.js
   7. js/map.js
   8. js/magic.js

   重要：
   - ui.js は updateUI / renderEnemySlots / 演出系関数を上書きします。
   - battle.js / enemy.js / magic.js からUI関数を呼ぶため、
     ui.js は battle.js より前に読み込む構成を推奨します。
========================= */

/* ===== Battle UI Update ===== */
function updateUI(){
  const e = currentEnemy();
  const p = state.player;

  if(!e) return;

  const alive = aliveEnemies();
  const displayName = alive.length > 1 ? `${alive.length}体のご主人様` : e.name;

  const enemyName = document.getElementById('enemyName');
  if(enemyName) enemyName.textContent = displayName;

  const enemyStats = document.getElementById('enemyStats');
  if(enemyStats){
    const statTarget = e || {};
    enemyStats.textContent =
      `攻${statTarget.atk || 0} 防${statTarget.def || 0} 速${statTarget.spd || 0} 話${statTarget.talk || 0}`;
  }

  renderEnemySlots();
  updateEnemyHpBar();
  updatePlayerStatusPanel(p);
  updateBossBattleClass();
}

/* ===== Enemy HP Bar ===== */
function updateEnemyHpBar(){
  const e = currentEnemy();
  const fill = document.getElementById('enemyHpFill');

  if(!e || !fill) return;

  const totalHp = state.enemiesInBattle.length
    ? state.enemiesInBattle.reduce((sum,en) => sum + Math.max(0,en.hp),0)
    : Math.max(0,e.hp);

  const totalMaxHp = state.enemiesInBattle.length
    ? state.enemiesInBattle.reduce((sum,en) => sum + en.maxHp,0)
    : e.maxHp;

  const hpPercent = Math.max(0,(totalHp / totalMaxHp) * 100);
  fill.style.width = `${hpPercent}%`;
}

/* ===== Player Status UI ===== */
function updatePlayerStatusPanel(p){
  const hp = document.getElementById('playerHp');
  const mp = document.getElementById('playerMp');
  const spd = document.getElementById('playerSpd');
  const talk = document.getElementById('playerTalk');
  const statusEffects = document.getElementById('playerStatusEffects');
  const exp = document.getElementById('playerExp');
  const title = document.querySelector('.status-panel h2');

  if(hp) hp.textContent = `HP ${p.hp} / ${p.maxHp}`;
  if(mp) mp.textContent = `MP ${p.mp} / ${p.maxMp}`;
  if(spd) spd.textContent = `すばやさ ${totalSpd()}`;
  if(talk) talk.textContent = `トーク力 ${totalTalk()}`;
  if(statusEffects) statusEffects.textContent = `状態：${statusText()}`;
  if(exp) exp.textContent = `EXP ${p.exp} / ${p.nextExp}`;
  if(title) title.textContent = `${p.name} Lv.${p.lv} 攻${totalAtk()} 防${totalDef()}`;
}

/* ===== Boss Background Class ===== */
function updateBossBattleClass(){
  document.body.classList.toggle(
    'boss-battle',
    !!(state.enemiesInBattle || []).some(enemy => enemy.boss)
  );
}

/* ===== Enemy Slots ===== */
function renderEnemySlots(){
  const wrap = document.getElementById('enemySlots');
  if(!wrap) return;

  wrap.innerHTML = '';

  const enemiesInBattle = state.enemiesInBattle || [];

  wrap.classList.toggle('single-enemy', enemiesInBattle.length === 1);
  wrap.classList.toggle('multi-enemy', enemiesInBattle.length >= 2);

  enemiesInBattle.forEach((enemy,index) => {
    wrap.appendChild(createEnemySlot(enemy,index));
  });

  renderTargetButtons();
}

/* ===== Enemy Slot Element ===== */
function createEnemySlot(enemy,index){
  const slot = document.createElement('div');
  slot.className = 'enemy-slot';

  if(index === state.targetIndex && enemy.hp > 0) slot.classList.add('selected');
  if(enemy.hp <= 0) slot.classList.add('defeated');
  if(enemy.helper) slot.classList.add('helper');
  if(enemy.boss) slot.classList.add('boss');
  if(!enemy.helper && !enemy.boss){
    slot.classList.add('regular-enemy', `enemy-${enemy.id}`);
  }
  if(enemy.sleepTurns && enemy.sleepTurns > 0) slot.classList.add('sleeping');

  const indexLabel = document.createElement('div');
  indexLabel.className = 'enemy-slot-index';
  indexLabel.textContent = `敵${index+1}`;

  const marker = document.createElement('div');
  marker.className = 'enemy-target-marker';
  marker.textContent = (index === state.targetIndex && enemy.hp > 0) ? '▼ TARGET' : '';

  const img = document.createElement('img');
  img.src = enemy.image;
  img.alt = enemy.name;
  img.onerror = function(){
    this.classList.add('image-error');
  };

  const name = document.createElement('div');
  name.className = 'enemy-slot-name';
  name.textContent = enemy.hp > 0 ? enemy.name : '撃破';

  const hpBar = document.createElement('div');
  hpBar.className = 'enemy-slot-hp';

  const hpFill = document.createElement('div');
  hpFill.className = 'enemy-slot-hp-fill';
  hpFill.style.width = `${Math.max(0,(enemy.hp / enemy.maxHp) * 100)}%`;

  hpBar.appendChild(hpFill);

  slot.appendChild(indexLabel);
  slot.appendChild(marker);
  slot.appendChild(img);
  slot.appendChild(name);
  slot.appendChild(hpBar);

  if(enemy.hp > 0){
    slot.addEventListener('click', () => selectTarget(index));
  }

  return slot;
}

/* ===== Target Buttons ===== */
function renderTargetButtons(){
  let panel = document.getElementById('targetPanel');
  const command = document.getElementById('commandPanel');

  if(!command) return;

  if(!panel){
    panel = document.createElement('div');
    panel.id = 'targetPanel';
    panel.className = 'target-panel';
    command.insertAdjacentElement('afterend',panel);
  }

  panel.innerHTML = '';

  if(!state.enemiesInBattle || state.enemiesInBattle.length <= 1){
    panel.classList.add('hidden');
    return;
  }

  panel.classList.remove('hidden');

  state.enemiesInBattle.forEach((enemy,index) => {
    const btn = document.createElement('button');
    btn.textContent = enemy.hp > 0 ? `対象${index+1}` : '撃破';

    if(index === state.targetIndex) btn.classList.add('selected-target');

    btn.disabled = enemy.hp <= 0 || state.busy;
    btn.onclick = () => selectTarget(index);

    panel.appendChild(btn);
  });
}

/* ===== Message ===== */
function setMessage(text){
  const el = document.getElementById('messageText');
  if(el) el.textContent = text;
}

/* ===== Button Lock ===== */
function setButtonsDisabled(disabled){
  document
    .querySelectorAll('.command-panel button,.sub-menu-body button,.mini-btn,.sub-btn,.target-panel button')
    .forEach(btn => {
      if(btn.id !== 'restartBtn') btn.disabled = disabled;
    });
}

/* ===== Damage Text ===== */
function showDamage(value,target,extraClass){
  const area = target === 'player'
    ? document.querySelector('.status-panel')
    : document.querySelector('.enemy-area');

  if(!area) return;

  const damage = document.createElement('div');

  damage.className = target === 'player'
    ? 'damage-text player-damage'
    : 'damage-text';

  if(extraClass) damage.classList.add(extraClass);

  damage.textContent = value > 0 ? `-${value}` : `+${Math.abs(value)}`;

  area.appendChild(damage);
  damage.classList.add('show');

  setTimeout(() => damage.remove(),850);
}

/* ===== Screen Effects ===== */
function screenShake(){
  document.body.classList.remove('screen-shake');
  void document.body.offsetWidth;
  document.body.classList.add('screen-shake');

  setTimeout(() => {
    document.body.classList.remove('screen-shake');
  },360);
}

function screenFlash(){
  const fx = document.getElementById('screenFx');
  if(!fx) return;

  fx.classList.remove('hidden');
  void fx.offsetWidth;

  setTimeout(() => {
    fx.classList.add('hidden');
  },360);
}

function criticalFlash(){
  document.body.classList.remove('critical-flash');
  void document.body.offsetWidth;
  document.body.classList.add('critical-flash');

  setTimeout(() => {
    document.body.classList.remove('critical-flash');
  },480);
}

/* ===== Cutin ===== */
function showCutin(title,text){
  const overlay = document.getElementById('cutinOverlay');
  const titleEl = document.getElementById('cutinTitle');
  const textEl = document.getElementById('cutinText');

  if(!overlay || !titleEl || !textEl) return Promise.resolve();

  titleEl.textContent = title;
  textEl.textContent = text;

  overlay.classList.remove('hidden');
  void overlay.offsetWidth;

  return new Promise(resolve => {
    setTimeout(() => {
      overlay.classList.add('hidden');
      resolve();
    },760);
  });
}

/* ===== Toast ===== */
function showLevelToast(text){
  const old = document.querySelector('.level-toast');
  if(old) old.remove();

  const toast = document.createElement('div');
  toast.className = 'level-toast';
  toast.textContent = text;

  document.body.appendChild(toast);

  setTimeout(() => toast.remove(),1300);
}

/* ===== Enemy Hit Animation ===== */
function enemyFlash(){
  screenShake();

  const selected =
    document.querySelector('.enemy-slot.selected img') ||
    document.querySelector('.enemy-slot img');

  if(!selected) return;

  selected.classList.remove('hit');
  void selected.offsetWidth;
  selected.classList.add('hit');
}

/* ===== Player Hit Animation ===== */
function playerFlash(){
  screenShake();

  const panel = document.querySelector('.status-panel');
  if(!panel) return;

  panel.classList.remove('player-hit');
  void panel.offsetWidth;
  panel.classList.add('player-hit');
}

/* ===== Boss Entrance ===== */
function bossEntrance(){
  screenShake();
  screenFlash();
}

/* ===== Victory Effect ===== */
function victoryEffect(){
  const panel = document.querySelector('.enemy-panel');
  if(!panel) return;

  panel.classList.remove('victory-flash');
  void panel.offsetWidth;
  panel.classList.add('victory-flash');
}

/* ===== Utility UI Helpers ===== */
function showElement(id){
  const el = document.getElementById(id);
  if(el) el.classList.remove('hidden');
}

function hideElement(id){
  const el = document.getElementById(id);
  if(el) el.classList.add('hidden');
}

function toggleElement(id,show){
  const el = document.getElementById(id);
  if(el) el.classList.toggle('hidden',!show);
}

