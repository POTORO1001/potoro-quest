const state={
player:{name:'まろ',hp:24,maxHp:24,mp:8,maxMp:8},
enemy:{name:'定時のご主人様',hp:42,maxHp:42,image:'img/enemies/teiji.png'}
};

function updateUI(){
document.getElementById('enemyName').textContent=state.enemy.name;
document.getElementById('enemyImage').src=state.enemy.image;
document.getElementById('playerHp').textContent=`HP ${state.player.hp} / ${state.player.maxHp}`;
document.getElementById('playerMp').textContent=`MP ${state.player.mp} / ${state.player.maxMp}`;
const hpPercent=(state.enemy.hp/state.enemy.maxHp)*100;
document.getElementById('enemyHpFill').style.width=`${hpPercent}%`;
}

function setMessage(text){
document.getElementById('messageText').textContent=text;
}

function playerAction(type){
if(type==='attack'){
state.enemy.hp-=8;
if(state.enemy.hp<0) state.enemy.hp=0;
setMessage(`${state.enemy.name} に 8 ダメージ！`);
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
