const enemies=[
  {
    id:'teiji',
    name:'定時のご主人様',
    hp:42,
    maxHp:42,
    atk:5,
    exp:12,
    image:'img/enemies/teiji.png'
  },
  {
    id:'zangyo',
    name:'残業のご主人様',
    hp:70,
    maxHp:70,
    atk:8,
    exp:20,
    image:'img/enemies/zangyo.png'
  },
  {
    id:'shisseki',
    name:'叱責のご主人様',
    hp:95,
    maxHp:95,
    atk:11,
    exp:32,
    image:'img/enemies/shisseki.png'
  },
  {
    id:'boss',
    name:'ご主人王',
    hp:160,
    maxHp:160,
    atk:16,
    exp:100,
    image:'img/enemies/boss.png',
    boss:true
  }
];

const state={
  player:{
    name:'まろ',
    lv:1,
    hp:24,
    maxHp:24,
    mp:8,
    maxMp:8,
    atk:8,
    def:2,
    exp:0,
    nextExp:20,
    guarding:false,
    items:{
      omurice:2,
      tea:1
    }
  },
  enemyIndex:0,
  enemy:null,
  busy:false
};

function cloneEnemy(base){
  return JSON.parse(JSON.stringify(base));
}

function currentEnemy(){
  return state.enemy;
}

function updateUI(){
  const e=currentEnemy();
  const p=state.player;

  document.getElementById('enemyName').textContent=e.name;
  document.getElementById('enemyImage').src=e.image;

  document.getElementById('playerHp').textContent=`HP ${p.hp} / ${p.maxHp}`;
  document.getElementById('playerMp').textContent=`MP ${p.mp} / ${p.maxMp}`;

  const hpPercent=Math.max(0,(e.hp/e.maxHp)*100);
  document.getElementById('enemyHpFill').style.width=`${hpPercent}%`;

  const status=document.querySelector('.status-panel h2');
  if(status){
    status.textContent=`${p.name} Lv.${p.lv}`;
  }
}

function setMessage(text){
  document.getElementById('messageText').textContent=text;
}

function setButtonsDisabled(disabled){
  document.querySelectorAll('.command-panel button').forEach(btn=>{
    btn.disabled=disabled;
  });
}

function sleep(ms){
  return new Promise(resolve=>setTimeout(resolve,ms));
}

function showDamage(value,target){
  const area = target==='player'
    ? document.querySelector('.status-panel')
    : document.querySelector('.enemy-area');

  let damage=document.createElement('div');
  damage.className=target==='player'?'damage-text player-damage':'damage-text';
  damage.textContent=value>0?`-${value}`:`+${Math.abs(value)}`;
  area.appendChild(damage);

  damage.classList.add('show');

  setTimeout(()=>{
    damage.remove();
  },850);
}

function enemyFlash(){
  const img=document.getElementById('enemyImage');
  img.classList.remove('hit');
  void img.offsetWidth;
  img.classList.add('hit');
}

function playerFlash(){
  const panel=document.querySelector('.status-panel');
  panel.classList.remove('player-hit');
  void panel.offsetWidth;
  panel.classList.add('player-hit');
}

function bossEntrance(){
  const panel=document.querySelector('.enemy-panel');
  panel.classList.remove('boss-enter');
  void panel.offsetWidth;
  panel.classList.add('boss-enter');
}

function victoryEffect(){
  const panel=document.querySelector('.enemy-panel');
  panel.classList.remove('victory-flash');
  void panel.offsetWidth;
  panel.classList.add('victory-flash');
}

function startBattle(index){
  state.enemyIndex=index;
  state.enemy=cloneEnemy(enemies[index]);
  state.player.guarding=false;
  updateUI();

  if(state.enemy.boss){
    bossEntrance();
    setMessage('ご主人王が あらわれた！！');
  }else{
    setMessage(`${state.enemy.name} が あらわれた！`);
  }
}

async function playerAction(type){
  if(state.busy) return;
  state.busy=true;
  setButtonsDisabled(true);

  const p=state.player;
  const e=currentEnemy();

  if(type==='attack'){
    const damage=Math.max(1,p.atk+Math.floor(Math.random()*4));
    e.hp=Math.max(0,e.hp-damage);
    setMessage(`${e.name} に ${damage} ダメージ！`);
    showDamage(damage,'enemy');
    enemyFlash();
    updateUI();

    await sleep(700);
    if(e.hp<=0){
      await winBattle();
      return;
    }
    await enemyTurn();

  }else if(type==='magic'){
    if(p.mp<5){
      setMessage('MPがたりない！');
      await sleep(650);
    }else{
      p.mp-=5;
      const damage=18+Math.floor(Math.random()*5);
      e.hp=Math.max(0,e.hp-damage);
      setMessage('もえもえぎゅー！！');
      showDamage(damage,'enemy');
      enemyFlash();
      updateUI();

      await sleep(700);
      if(e.hp<=0){
        await winBattle();
        return;
      }
      await enemyTurn();
    }

  }else if(type==='guard'){
    p.guarding=true;
    setMessage(`${p.name} は みをまもった！`);
    await sleep(650);
    await enemyTurn();

  }else if(type==='item'){
    if(p.items.omurice>0 && p.hp<p.maxHp){
      p.items.omurice--;
      const heal=Math.min(30,p.maxHp-p.hp);
      p.hp+=heal;
      setMessage(`オムライスを食べた！ HPが ${heal} 回復！`);
      showDamage(-heal,'player');
      updateUI();
      await sleep(700);
      await enemyTurn();
    }else{
      setMessage('使えるどうぐがない！');
      await sleep(650);
    }
  }

  state.busy=false;
  setButtonsDisabled(false);
  updateUI();
}

async function enemyTurn(){
  const p=state.player;
  const e=currentEnemy();

  let damage=Math.max(1,e.atk-p.def+Math.floor(Math.random()*3));
  if(p.guarding){
    damage=Math.max(1,Math.floor(damage/2));
    p.guarding=false;
  }

  p.hp=Math.max(0,p.hp-damage);
  setMessage(`${e.name} のこうげき！ ${damage} ダメージ！`);
  showDamage(damage,'player');
  playerFlash();
  updateUI();

  await sleep(850);

  if(p.hp<=0){
    setMessage(`${p.name} は たおれてしまった…`);
    setButtonsDisabled(true);
    state.busy=true;
  }
}

async function winBattle(){
  const p=state.player;
  const e=currentEnemy();

  victoryEffect();
  setMessage(`${e.name} を いやした！ EXP ${e.exp} 獲得！`);
  p.exp+=e.exp;
  updateUI();

  await sleep(1000);

  if(p.exp>=p.nextExp){
    p.exp-=p.nextExp;
    p.lv++;
    p.nextExp=Math.floor(p.nextExp*1.5);
    p.maxHp+=6;
    p.maxMp+=3;
    p.atk+=2;
    p.def+=1;
    p.hp=p.maxHp;
    p.mp=p.maxMp;
    setMessage(`${p.name} は レベル ${p.lv} に あがった！`);
    updateUI();
    await sleep(1200);
  }

  if(state.enemyIndex+1<enemies.length){
    startBattle(state.enemyIndex+1);
    state.busy=false;
    setButtonsDisabled(false);
  }else{
    setMessage('ご主人王をいやした！ ポ・トロに平和がもどった！');
    setButtonsDisabled(true);
    state.busy=true;
  }
}

startBattle(0);
