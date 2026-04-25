const state={
player:{name:'まろ',hp:24,maxHp:24,mp:8,maxMp:8},
enemy:{name:'定時のご主人様',hp:42,maxHp:42,image:'img/enemies/teiji.png'},
effects:{
damageText:"",
damageVisible:false,
enemyFlash:false
}
};

function updateUI(){
document.getElementById('enemyName').textContent=state.enemy.name;
document.getElementById('enemyImage').src=state.enemy.image;
document.getElementById('playerHp').textContent=`HP ${state.player.hp} / ${state.player.maxHp}`;
document.getElementById('playerMp').textContent=`MP ${state.player.mp} / ${state.player.maxMp}`;

const hpPercent=Math.max(0,(state.enemy.hp/state.enemy.maxHp)*100);
document.getElementById('enemyHpFill').style.width=`${hpPercent}%`;
}

function setMessage(text){
document.getElementById('messageText').textContent=text;
}

function showDamage(value){
const enemyArea=document.querySelector('.enemy-area');
let damage=document.getElementById('damageText');

if(!damage){
  damage=document.createElement('div');
  damage.id='damageText';
  damage.className='damage-text';
  enemyArea.appendChild(damage);
}

damage.textContent=`-${value}`;
damage.classList.remove('show');
void damage.offsetWidth;
damage.classList.add('show');
}

function enemyFlash(){
const img=document.getElementById('enemyImage');
img.classList.remove('hit');
void img.offsetWidth;
img.classList.add('hit');
}

function bossEntrance(){
setMessage('ボスが あらわれた！！');
const panel=document.querySelector('.enemy-panel');
panel.classList.remove('boss-enter');
void panel.offsetWidth;
panel.classList.add('boss-enter');
}

function victoryEffect(){
setMessage('しょうり！ ご主人様をいやした！');
}

function playerAction(type){
if(type==='attack'){
  const damage=8;
  state.enemy.hp-=damage;
  if(state.enemy.hp<0) state.enemy.hp=0;

  setMessage(`${state.enemy.name} に ${damage} ダメージ！`);
  showDamage(damage);
  enemyFlash();

  if(state.enemy.hp===0){
    setTimeout(victoryEffect,500);
  }

}else if(type==='magic'){
  setMessage('おまじないを使った！');
}else if(type==='guard'){
  setMessage('身を守った！');
}else if(type==='item'){
  setMessage('どうぐを使った！');
}

updateUI();
}

updateUI();
