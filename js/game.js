const enemies=[
  {id:'teiji',name:'定時のご主人様',hp:42,maxHp:42,atk:5,exp:12,image:'img/enemies/teiji.png',intro:'定時のご主人様が あらわれた！'},
  {id:'zangyo',name:'残業のご主人様',hp:70,maxHp:70,atk:8,exp:20,image:'img/enemies/zangyo.png',intro:'残業のご主人様が つかれた顔で あらわれた！'},
  {id:'shisseki',name:'叱責のご主人様',hp:95,maxHp:95,atk:11,exp:32,image:'img/enemies/shisseki.png',intro:'叱責のご主人様が ふるえながら あらわれた！'},
  {id:'boss',name:'ご主人王',hp:160,maxHp:160,atk:16,exp:100,image:'img/enemies/boss.png',boss:true,intro:'ご主人王が あらわれた！！'}
];

const initialPlayer={
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
  items:{omurice:2,tea:1,horse:1}
};

const state={
  player:{...initialPlayer,items:{...initialPlayer.items}},
  enemyIndex:0,
  enemy:null,
  busy:false,
  started:false
};

function cloneEnemy(base){return JSON.parse(JSON.stringify(base));}
function currentEnemy(){return state.enemy;}

function updateUI(){
  const e=currentEnemy();
  const p=state.player;
  if(!e) return;

  document.getElementById('enemyName').textContent=e.name;
  document.getElementById('enemyImage').src=e.image;
  document.getElementById('playerHp').textContent=`HP ${p.hp} / ${p.maxHp}`;
  document.getElementById('playerMp').textContent=`MP ${p.mp} / ${p.maxMp}`;
  document.getElementById('playerExp').textContent=`EXP ${p.exp} / ${p.nextExp}`;

  const hpPercent=Math.max(0,(e.hp/e.maxHp)*100);
  document.getElementById('enemyHpFill').style.width=`${hpPercent}%`;

  const status=document.querySelector('.status-panel h2');
  if(status) status.textContent=`${p.name} Lv.${p.lv}`;

  document.body.classList.toggle('boss-battle',!!e.boss);
}

function setMessage(text){
  document.getElementById('messageText').textContent=text;
}

function setButtonsDisabled(disabled){
  document.querySelectorAll('.command-panel button,.sub-menu-body button,.mini-btn').forEach(btn=>btn.disabled=disabled);
}

function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

function showDamage(value,target){
  const area=target==='player'?document.querySelector('.status-panel'):document.querySelector('.enemy-area');
  const damage=document.createElement('div');
  damage.className=target==='player'?'damage-text player-damage':'damage-text';
  damage.textContent=value>0?`-${value}`:`+${Math.abs(value)}`;
  area.appendChild(damage);
  damage.classList.add('show');
  setTimeout(()=>damage.remove(),850);
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

function startGame(){
  document.getElementById('titleScreen').classList.add('hidden');
  document.getElementById('battleScreen').classList.remove('hidden');
  state.started=true;
  resetGame();
}

function resetGame(){
  state.player={...initialPlayer,items:{...initialPlayer.items}};
  state.enemyIndex=0;
  state.busy=false;
  closeSubMenu();
  setButtonsDisabled(false);
  startBattle(0);
}

function startBattle(index){
  state.enemyIndex=index;
  state.enemy=cloneEnemy(enemies[index]);
  state.player.guarding=false;
  closeSubMenu();
  updateUI();

  if(state.enemy.boss){
    bossEntrance();
  }
  setMessage(state.enemy.intro);
}

function openSubMenu(kind){
  if(state.busy) return;
  const sub=document.getElementById('subMenu');
  const title=document.getElementById('subMenuTitle');
  const body=document.getElementById('subMenuBody');
  body.innerHTML='';

  if(kind==='magic'){
    title.textContent='おまじない';
    addSubButton('もえもえぎゅー　MP5 / 敵に18〜22ダメージ',()=>useMagic('moe'));
    if(state.player.lv>=2) addSubButton('おいしくなーれ　MP8 / HP回復',()=>useMagic('heal'));
    if(state.player.lv>=3) addSubButton('にしきぬやまー　MP12 / 大ダメージ',()=>useMagic('nishiki'));
  }else if(kind==='item'){
    title.textContent='どうぐ';
    addSubButton(`オムライス　HP30回復　残り${state.player.items.omurice}`,()=>useItem('omurice'));
    addSubButton(`紅茶　MP10回復　残り${state.player.items.tea}`,()=>useItem('tea'));
    addSubButton(`くろれきし　大ダメージ　残り${state.player.items.horse}`,()=>useItem('horse'));
  }

  sub.classList.remove('hidden');
}

function addSubButton(label,handler){
  const btn=document.createElement('button');
  btn.textContent=label;
  btn.onclick=handler;
  document.getElementById('subMenuBody').appendChild(btn);
}

function closeSubMenu(){
  const sub=document.getElementById('subMenu');
  if(sub) sub.classList.add('hidden');
}

async function playerAction(type){
  if(state.busy) return;
  closeSubMenu();
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
    if(e.hp<=0){await winBattle();return;}
    await enemyTurn();

  }else if(type==='guard'){
    p.guarding=true;
    setMessage(`${p.name} は みをまもった！`);
    await sleep(650);
    await enemyTurn();
  }

  state.busy=false;
  setButtonsDisabled(false);
  updateUI();
}

async function useMagic(kind){
  if(state.busy) return;
  closeSubMenu();
  state.busy=true;
  setButtonsDisabled(true);

  const p=state.player;
  const e=currentEnemy();

  if(kind==='moe'){
    if(p.mp<5){ await failAction('MPがたりない！'); return; }
    p.mp-=5;
    const damage=18+Math.floor(Math.random()*5);
    await damageEnemy(`もえもえぎゅー！！`,damage);
  }else if(kind==='heal'){
    if(p.mp<8){ await failAction('MPがたりない！'); return; }
    p.mp-=8;
    const heal=Math.min(35,p.maxHp-p.hp);
    p.hp+=heal;
    setMessage(`おいしくなーれ！ HPが ${heal} 回復！`);
    showDamage(-heal,'player');
    updateUI();
    await sleep(750);
    await enemyTurn();
  }else if(kind==='nishiki'){
    if(p.mp<12){ await failAction('MPがたりない！'); return; }
    p.mp-=12;
    const damage=e.boss?45:65;
    await damageEnemy(`にしきぬやまー！！`,damage);
  }

  state.busy=false;
  setButtonsDisabled(false);
  updateUI();
}

async function useItem(kind){
  if(state.busy) return;
  closeSubMenu();
  state.busy=true;
  setButtonsDisabled(true);

  const p=state.player;
  const e=currentEnemy();

  if(kind==='omurice'){
    if(p.items.omurice<=0 || p.hp>=p.maxHp){ await failAction('オムライスは使えない！'); return; }
    p.items.omurice--;
    const heal=Math.min(30,p.maxHp-p.hp);
    p.hp+=heal;
    setMessage(`オムライスを食べた！ HPが ${heal} 回復！`);
    showDamage(-heal,'player');
    updateUI();
    await sleep(750);
    await enemyTurn();

  }else if(kind==='tea'){
    if(p.items.tea<=0 || p.mp>=p.maxMp){ await failAction('紅茶は使えない！'); return; }
    p.items.tea--;
    const healMp=Math.min(10,p.maxMp-p.mp);
    p.mp+=healMp;
    setMessage(`紅茶を飲んだ！ MPが ${healMp} 回復！`);
    updateUI();
    await sleep(750);
    await enemyTurn();

  }else if(kind==='horse'){
    if(p.items.horse<=0){ await failAction('くろれきしは持っていない！'); return; }
    p.items.horse--;
    const damage=e.boss?55:999;
    await damageEnemy('くろれきしを召喚した！',damage);
  }

  state.busy=false;
  setButtonsDisabled(false);
  updateUI();
}

async function failAction(message){
  setMessage(message);
  await sleep(700);
  state.busy=false;
  setButtonsDisabled(false);
  updateUI();
}

async function damageEnemy(message,damage){
  const e=currentEnemy();
  e.hp=Math.max(0,e.hp-damage);
  setMessage(`${message} ${e.name} に ${damage} ダメージ！`);
  showDamage(damage,'enemy');
  enemyFlash();
  updateUI();
  await sleep(750);
  if(e.hp<=0){ await winBattle(); return; }
  await enemyTurn();
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
    setMessage(`${p.name} は たおれてしまった… 「最初から」で再挑戦できます。`);
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

  while(p.exp>=p.nextExp){
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

document.getElementById('startBtn').addEventListener('click',startGame);
document.getElementById('restartBtn').addEventListener('click',resetGame);
