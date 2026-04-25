const MAZE_W=17;
const MAZE_H=17;
const TILE=20;

const enemies=[
  {id:'teiji',name:'定時のご主人様',hp:38,maxHp:38,atk:5,exp:14,image:'img/enemies/teiji.png?v=16'},
  {id:'zangyo',name:'残業のご主人様',hp:66,maxHp:66,atk:8,exp:22,image:'img/enemies/zangyo.png?v=16'},
  {id:'shisseki',name:'叱責のご主人様',hp:92,maxHp:92,atk:11,exp:34,image:'img/enemies/shisseki.png?v=16'},
  {id:'boss',name:'ご主人王',hp:155,maxHp:155,atk:15,exp:100,image:'img/enemies/boss.png?v=16',boss:true}
];

const state={
  maze:[],
  player:{x:1,y:1,lv:1,hp:28,maxHp:28,mp:10,maxMp:10,atk:9,def:3,exp:0,nextExp:20,guard:false,items:{omurice:2,tea:1}},
  boss:{x:15,y:15},
  chests:[],
  currentEnemy:null,
  inBattle:false,
  lastPos:{x:1,y:1}
};

const cvs=document.getElementById('mapCanvas');
const ctx=cvs.getContext('2d');

function makeMaze(){
  const maze=Array.from({length:MAZE_H},()=>Array(MAZE_W).fill(1));

  function carve(x,y){
    maze[y][x]=0;
    const dirs=[[2,0],[-2,0],[0,2],[0,-2]].sort(()=>Math.random()-.5);
    for(const [dx,dy] of dirs){
      const nx=x+dx, ny=y+dy;
      if(nx>0&&ny>0&&nx<MAZE_W-1&&ny<MAZE_H-1&&maze[ny][nx]===1){
        maze[y+dy/2][x+dx/2]=0;
        carve(nx,ny);
      }
    }
  }

  carve(1,1);
  state.maze=maze;
  state.player.x=1;
  state.player.y=1;
  state.boss=findFarthest();
  placeChests();
  drawMaze();
  setMapMessage('ランダムなお屋敷が生成されました。矢印キーで探索してください。');
}

function findFarthest(){
  let best={x:1,y:1,d:0};
  for(let y=1;y<MAZE_H-1;y++){
    for(let x=1;x<MAZE_W-1;x++){
      if(state.maze[y][x]===0){
        const d=Math.abs(x-1)+Math.abs(y-1);
        if(d>best.d) best={x,y,d};
      }
    }
  }
  return {x:best.x,y:best.y};
}

function placeChests(){
  state.chests=[];
  const floors=[];
  for(let y=1;y<MAZE_H-1;y++){
    for(let x=1;x<MAZE_W-1;x++){
      if(state.maze[y][x]===0 && !(x===1&&y===1) && !(x===state.boss.x&&y===state.boss.y)){
        floors.push({x,y});
      }
    }
  }
  floors.sort(()=>Math.random()-.5);
  state.chests=floors.slice(0,4).map((p,i)=>({...p,opened:false,id:i}));
}

function drawMaze(){
  ctx.clearRect(0,0,cvs.width,cvs.height);
  const size=cvs.width/MAZE_W;

  for(let y=0;y<MAZE_H;y++){
    for(let x=0;x<MAZE_W;x++){
      ctx.fillStyle=state.maze[y][x]===1?'#172033':'#8a6b3a';
      ctx.fillRect(x*size,y*size,size,size);
      if(state.maze[y][x]===0){
        ctx.fillStyle='rgba(255,255,255,.08)';
        ctx.fillRect(x*size,y*size+size*.65,size,1);
      }
    }
  }

  for(const chest of state.chests){
    if(chest.opened) continue;
    ctx.fillStyle='#facc15';
    ctx.fillRect(chest.x*size+size*.25,chest.y*size+size*.32,size*.5,size*.42);
  }

  ctx.fillStyle='#dc2626';
  ctx.fillRect(state.boss.x*size+size*.25,state.boss.y*size+size*.25,size*.5,size*.5);

  ctx.fillStyle='#ff7ad6';
  ctx.beginPath();
  ctx.arc(state.player.x*size+size/2,state.player.y*size+size/2,size*.32,0,Math.PI*2);
  ctx.fill();
}

function setMapMessage(text){
  document.getElementById('mapMessage').textContent=text;
}

function movePlayer(dx,dy){
  if(state.inBattle) return;
  const nx=state.player.x+dx;
  const ny=state.player.y+dy;
  if(nx<0||ny<0||nx>=MAZE_W||ny>=MAZE_H) return;
  if(state.maze[ny][nx]===1){
    setMapMessage('壁です。別の道を進みましょう。');
    return;
  }

  state.lastPos={x:state.player.x,y:state.player.y};
  state.player.x=nx;
  state.player.y=ny;
  drawMaze();

  checkTileEvent();
}

function checkTileEvent(){
  const p=state.player;

  const chest=state.chests.find(c=>!c.opened&&c.x===p.x&&c.y===p.y);
  if(chest){
    chest.opened=true;
    state.player.items.omurice++;
    setMapMessage('宝箱を開けた！ オムライスを手に入れた！');
    drawMaze();
    return;
  }

  if(p.x===state.boss.x && p.y===state.boss.y){
    startBattle(enemies[3]);
    return;
  }

  if(Math.random()<0.18){
    const depth=Math.abs(p.x-1)+Math.abs(p.y-1);
    const enemy=depth<10?enemies[0]:(depth<18?enemies[Math.floor(Math.random()*2)]:enemies[Math.floor(Math.random()*3)]);
    startBattle(enemy);
  }else{
    setMapMessage('お屋敷を探索中...');
  }
}

function startBattle(enemyBase){
  state.inBattle=true;
  state.currentEnemy=JSON.parse(JSON.stringify(enemyBase));
  document.body.classList.toggle('boss-battle',!!state.currentEnemy.boss);
  document.getElementById('mapScreen').classList.add('hidden');
  document.getElementById('battleScreen').classList.remove('hidden');
  updateBattleUI();
  setBattleMessage(`${state.currentEnemy.name} が あらわれた！`);
}

function updateBattleUI(){
  const e=state.currentEnemy;
  const p=state.player;
  document.getElementById('enemyName').textContent=e.name;
  document.getElementById('enemyImage').src=e.image;
  document.getElementById('playerHp').textContent=`HP ${p.hp} / ${p.maxHp}`;
  document.getElementById('playerMp').textContent=`MP ${p.mp} / ${p.maxMp}`;
  document.getElementById('playerExp').textContent=`EXP ${p.exp} / ${p.nextExp}`;
  document.querySelector('.status-panel h2').textContent=`まろ Lv.${p.lv}`;
  document.getElementById('enemyHpFill').style.width=`${Math.max(0,e.hp/e.maxHp*100)}%`;
}

function setBattleMessage(text){
  document.getElementById('messageText').textContent=text;
}

function showDamage(value,target){
  const area=target==='player'?document.querySelector('.status-panel'):document.querySelector('.enemy-area');
  const d=document.createElement('div');
  d.className=target==='player'?'damage-text player-damage':'damage-text';
  d.textContent=value>0?`-${value}`:`+${Math.abs(value)}`;
  area.appendChild(d);
  d.classList.add('show');
  setTimeout(()=>d.remove(),850);
}

async function playerAction(type){
  const p=state.player;
  const e=state.currentEnemy;

  if(type==='attack'){
    const dmg=p.atk+Math.floor(Math.random()*4);
    e.hp=Math.max(0,e.hp-dmg);
    setBattleMessage(`${e.name} に ${dmg} ダメージ！`);
    showDamage(dmg,'enemy');
  }else if(type==='magic'){
    if(p.mp<5){setBattleMessage('MPがたりない！');return;}
    p.mp-=5;
    const dmg=22;
    e.hp=Math.max(0,e.hp-dmg);
    setBattleMessage(`もえもえぎゅー！ ${dmg} ダメージ！`);
    showDamage(dmg,'enemy');
  }else if(type==='guard'){
    p.guard=true;
    setBattleMessage('身を守った！');
  }else if(type==='item'){
    if(p.items.omurice>0 && p.hp<p.maxHp){
      p.items.omurice--;
      const heal=Math.min(30,p.maxHp-p.hp);
      p.hp+=heal;
      setBattleMessage(`オムライスで HP ${heal} 回復！`);
      showDamage(-heal,'player');
    }else{
      setBattleMessage('使えるどうぐがない！');
      return;
    }
  }

  updateBattleUI();

  if(e.hp<=0){
    winBattle();
    return;
  }

  setTimeout(enemyTurn,650);
}

function enemyTurn(){
  const p=state.player;
  const e=state.currentEnemy;
  let dmg=Math.max(1,e.atk-p.def+Math.floor(Math.random()*3));
  if(p.guard){
    dmg=Math.max(1,Math.floor(dmg/2));
    p.guard=false;
  }
  p.hp=Math.max(0,p.hp-dmg);
  setBattleMessage(`${e.name} のこうげき！ ${dmg} ダメージ！`);
  showDamage(dmg,'player');
  updateBattleUI();

  if(p.hp<=0){
    setBattleMessage('まろは倒れてしまった... マップを再生成して再挑戦できます。');
  }
}

function winBattle(){
  const e=state.currentEnemy;
  const p=state.player;
  p.exp+=e.exp;
  setBattleMessage(`${e.name} をいやした！ EXP ${e.exp} 獲得！`);

  if(e.boss){
    setTimeout(showEnding,900);
    return;
  }

  if(p.exp>=p.nextExp){
    p.exp-=p.nextExp;
    p.lv++;
    p.maxHp+=6;
    p.maxMp+=2;
    p.atk+=2;
    p.def+=1;
    p.hp=p.maxHp;
    p.mp=p.maxMp;
    p.nextExp=Math.floor(p.nextExp*1.5);
  }

  setTimeout(()=>{
    state.inBattle=false;
    state.currentEnemy=null;
    document.body.classList.remove('boss-battle');
    document.getElementById('battleScreen').classList.add('hidden');
    document.getElementById('mapScreen').classList.remove('hidden');
    setMapMessage('戦闘に勝利した！ 探索を続けよう。');
    drawMaze();
  },900);
}

function formatChekiIssuedAt(date){
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,'0');
  const d=String(date.getDate()).padStart(2,'0');
  const hh=String(date.getHours()).padStart(2,'0');
  const mm=String(date.getMinutes()).padStart(2,'0');
  const ss=String(date.getSeconds()).padStart(2,'0');
  return `${y}/${m}/${d} ${hh}:${mm}:${ss}`;
}

function showEnding(){
  document.getElementById('battleScreen').classList.add('hidden');
  document.getElementById('endingScreen').classList.remove('hidden');
  const cheki=document.getElementById('chekiTicket');
  cheki.classList.add('hidden');

  if(Math.random()<1/3){
    document.getElementById('endingMessage').textContent='ご主人王がチェキ券を落とした！';
    document.getElementById('chekiIssuedAt').textContent=formatChekiIssuedAt(new Date());
    cheki.classList.remove('hidden');
  }else{
    document.getElementById('endingMessage').textContent='ご主人王をいやした！ 一人前のメイドに近づいた！';
  }
}

function startGame(){
  document.getElementById('titleScreen').classList.add('hidden');
  document.getElementById('mapScreen').classList.remove('hidden');
  makeMaze();
}

function restartGame(){
  document.getElementById('endingScreen').classList.add('hidden');
  document.getElementById('titleScreen').classList.remove('hidden');
}

document.getElementById('startBtn').addEventListener('click',startGame);
document.getElementById('newMapBtn').addEventListener('click',makeMaze);
document.getElementById('endingRestartBtn').addEventListener('click',restartGame);

document.querySelectorAll('[data-move]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const dir=btn.dataset.move;
    if(dir==='up') movePlayer(0,-1);
    if(dir==='down') movePlayer(0,1);
    if(dir==='left') movePlayer(-1,0);
    if(dir==='right') movePlayer(1,0);
  });
});

document.addEventListener('keydown',e=>{
  if(e.key==='ArrowUp') movePlayer(0,-1);
  if(e.key==='ArrowDown') movePlayer(0,1);
  if(e.key==='ArrowLeft') movePlayer(-1,0);
  if(e.key==='ArrowRight') movePlayer(1,0);
});
