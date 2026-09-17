const POTORO_COMPANION_STRATEGIES={attack:'攻撃',heal:'回復優先',guard:'守り'};

function partyMembers(){return [state.player,state.player.companion].filter(Boolean);}
function livingPartyMembers(){return partyMembers().filter(member=>member.hp>0);}
function isPartyDefeated(){return livingPartyMembers().length===0;}

function recruitCompanion(){
  if(state.location!=='town' || state.player.companion || !state.busy || townPlaceAt(state.town.x,state.town.y)?.id!=='plaza') return;
  state.player.companion={name:'こはる',lv:0,hp:0,maxHp:0,mp:0,maxMp:0,atk:0,def:0,
    strategy:'attack',guarding:false,status:{sleep:0,confuse:0,defDown:0}};
  syncCompanionLevel(true);
  document.getElementById('townDialogText').textContent='「一緒なら、きっと大丈夫。よろしくね！」 こはるが仲間に加わった！';
  document.getElementById('townDialogBody').replaceChildren();
  drawTown();updateTownStatus();seLevelUp();
}

function syncCompanionLevel(fullRecovery=false){
  const c=state.player.companion;
  if(!c) return;
  const lv=state.player.lv;
  if(c.lv!==lv){
    const hp=24+(lv-1)*4,mp=8+(lv-1)*2;
    c.hp=c.hp>0 ? Math.min(hp,c.hp+hp-c.maxHp) : 0;
    c.mp=Math.min(mp,c.mp+mp-c.maxMp);
    Object.assign(c,{lv,maxHp:hp,maxMp:mp,atk:6+(lv-1)*2,def:9+(lv-1)});
  }
  if(fullRecovery){c.hp=c.maxHp;c.mp=c.maxMp;c.guarding=false;c.status={sleep:0,confuse:0,defDown:0};}
}

function chooseEnemyPartyTarget(){
  const members=livingPartyMembers();
  return members.length===1 ? members[0] : members[Math.floor(Math.random()*members.length)];
}
function battleMemberDefense(member){return member===state.player ? effectiveDef() : member.status.defDown>0 ? Math.floor(member.def*.65) : member.def;}
function battleMemberDamageCut(member,damage){return member===state.player ? applyEquipmentDamageCut(damage) : damage;}
function battleMemberResists(member,key){return member===state.player && resistsEquipmentStatus(key);}
function battleMemberStatusTurns(member,turns){return member===state.player ? applyEquipmentStatusTurns(turns) : turns;}
function battleMemberDamageTarget(member){return member===state.player ? 'player' : 'companion';}

async function announcePartyMemberDown(member){
  if(member.hp>0) return false;
  setMessage(`${member.name} は たおれてしまった…`);updateUI();await sleep(700);
  if(isPartyDefeated()){
    setMessage(state.player.companion ? '2人の力が尽きてしまった…' : `${member.name} は たおれてしまった…`);
    showGameOver();return true;
  }
  return false;
}

async function companionTurn(){
  const c=state.player.companion;
  if(!c || c.hp<=0 || !state.inBattle || !aliveEnemies().length || currentEnemy()?.helper) return;
  const s=c.status;
  if(s.defDown>0 && --s.defDown===0){setMessage(`${c.name} は身だしなみを整えた！ 防御が戻った！`);updateUI();await sleep(550);}
  if(s.sleep>0){
    s.sleep--;setMessage(`${c.name} は眠っている…`);updateUI();await sleep(650);
    if(s.sleep===0){setMessage(`${c.name} は目を覚ました！`);updateUI();await sleep(550);}
    return;
  }
  if(s.confuse>0){
    s.confuse--;
    if(Math.random()<.35){
      setMessage(`${c.name} は混乱して行動できなかった！`);updateUI();await sleep(650);
      if(s.confuse===0){setMessage(`${c.name} は気持ちを整えた！`);await sleep(550);}
      return;
    }
    if(s.confuse===0){setMessage(`${c.name} は気持ちを整えた！`);await sleep(550);}
  }
  const wounded=livingPartyMembers().filter(member=>member.hp<member.maxHp).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
  if(c.strategy==='heal' && wounded && c.mp>=3){
    c.mp-=3;const heal=Math.min(10+c.lv*2,wounded.maxHp-wounded.hp);
    setMessage(`${c.name} のおまじない！`);await sleep(500);wounded.hp+=heal;
    setMessage(`ほっとひと息！ ${wounded.name} のHPが ${heal} 回復！`);
    updateUI();showDamage(-heal,battleMemberDamageTarget(wounded));seHeal();await sleep(700);return;
  }
  if(c.strategy==='guard' && state.player.hp>0){c.guarding=true;setMessage(`${c.name} はみをまもった！`);updateUI();await sleep(650);return;}
  const target=currentEnemy(),index=state.enemiesInBattle.indexOf(target);
  const damage=Math.max(1,c.atk+Math.floor(Math.random()*3)-Math.floor(target.def*.25));
  setMessage(`${c.name} のこうげき！`);await sleep(500);target.hp=Math.max(0,target.hp-damage);
  if(target.hp===0) state.lastDefeatedEnemy=target;
  setMessage(`${target.name} に ${damage} ダメージ！`);seAttack();updateUI();
  showDamage(damage,'enemy',undefined,index);enemyFlash(index);await sleep(700);
  if(allEnemiesDefeated()) await winBattle();
}

async function continueCompanionBattle(){
  if(!state.inBattle || state.busy || state.player.hp>0 || !state.player.companion || isPartyDefeated()) return;
  closeSubMenu();closeEquipMenu();state.busy=true;setButtonsDisabled(true);await enemyTurn();
  if(state.inBattle && !isPartyDefeated()) unlockBattleControls();
}

function updateCompanionUI(){
  const c=state.player.companion;
  document.querySelectorAll('[data-party-summary]').forEach(el=>{
    el.classList.toggle('hidden',!c);
    if(c) el.textContent=`仲間 ${c.name} Lv.${c.lv} / HP ${c.hp}/${c.maxHp} / TP ${c.mp}/${c.maxMp}${c.hp===0 ? ' / お給仕不能' : ''}`;
  });
  const panel=document.getElementById('companionPanel');
  panel.classList.toggle('hidden',!c);if(!c) return;
  document.getElementById('companionName').textContent=`${c.name} Lv.${c.lv}`;
  document.getElementById('companionHp').textContent=`HP ${c.hp}/${c.maxHp}`;
  document.getElementById('companionTp').textContent=`TP ${c.mp}/${c.maxMp}`;
  document.getElementById('companionHpBar').value=c.hp;document.getElementById('companionHpBar').max=c.maxHp;
  const statuses=c.hp===0 ? ['お給仕不能'] : Object.entries(c.status).filter(([,turns])=>turns>0).map(([key])=>({sleep:'睡眠',confuse:'混乱',defDown:'防御DOWN'}[key]));
  if(c.guarding) statuses.push('ぼうぎょ');
  document.getElementById('companionStatus').textContent=statuses.length ? statuses.join(' / ') : '状態：なし';
  const strategy=document.getElementById('companionStrategy');strategy.value=c.strategy;
  strategy.disabled=state.busy || !state.inBattle || c.hp===0;
  const next=document.getElementById('companionContinueBtn');next.classList.toggle('hidden',state.player.hp>0);
  next.disabled=state.busy || !state.inBattle || isPartyDefeated();
}

function drawCompanionOnMap(ctx,size,position,canStand){
  if(!state.player.companion) return;
  const spot=[[0,1],[-1,0],[1,0],[0,-1]].map(([dx,dy])=>({x:position.x+dx,y:position.y+dy})).find(p=>canStand(p.x,p.y));
  if(!spot) return;
  ctx.save();
  ctx.fillStyle='#88cbbb';
  ctx.beginPath();
  ctx.ellipse((spot.x+.5)*size,(spot.y+.9)*size,size*.3,size*.08,0,0,Math.PI*2);
  ctx.fill();
  drawMapPlayer(ctx,size,spot);
  ctx.restore();
}

function bindCompanionEvents(){
  document.getElementById('companionStrategy').onchange=event=>{
    const c=state.player.companion;
    if(c && state.inBattle && !state.busy && POTORO_COMPANION_STRATEGIES[event.target.value]) c.strategy=event.target.value;
    updateCompanionUI();
  };
  document.getElementById('companionContinueBtn').onclick=continueCompanionBattle;
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bindCompanionEvents,{once:true});
else bindCompanionEvents();
