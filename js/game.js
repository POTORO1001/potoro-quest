
/* ===== BGM Control ===== */
function stopAllBgm(){
  ['bgmOpening','bgmMap','bgmMap1F','bgmMap2F','bgmBattle','bgmBoss','bgmTamachan'].forEach(id=>{
    const a=document.getElementById(id);
    if(a){
      a.pause();
      a.currentTime=0;
    }
  });
}


function playMapBgm(){
  playBgm(state.floor===2 ? 'bgmMap2F' : 'bgmMap1F');
}

function playBgm(id){
  if(state && state.soundOff) return;
  stopAllBgm();
  const a=document.getElementById(id);
  if(a){
    const p=a.play();
    if(p && typeof p.catch==='function'){ p.catch(()=>{}); }
  }
}

const MAZE_W=17;
const MAZE_H=17;

const enemies=[
  {id:'teiji',name:'定時のご主人様',hp:45,maxHp:45,mp:0,maxMp:0,atk:7,def:3,spd:6,talk:3,exp:10,image:'img/enemies/teiji.png?v=enemy-canvas-v1',intro:'定時のご主人様が あらわれた！'},
  {id:'kuufuku',name:'空腹のご主人様',hp:65,maxHp:65,mp:5,maxMp:5,atk:10,def:4,spd:7,talk:5,exp:15,image:'img/enemies/kuufuku.png?v=enemy-canvas-v1',skill:'drain',intro:'空腹のご主人様が おなかを鳴らして あらわれた！'},
  {id:'zangyo',name:'残業のご主人様',hp:85,maxHp:85,mp:0,maxMp:0,atk:13,def:6,spd:8,talk:6,exp:22,image:'img/enemies/zangyo.png?v=enemy-canvas-v1',skill:'double',intro:'残業のご主人様が つかれた顔で あらわれた！'},
  {id:'meisou',name:'迷走のご主人様',hp:110,maxHp:110,mp:10,maxMp:10,atk:15,def:8,spd:12,talk:10,exp:30,image:'img/enemies/meisou.png?v=enemy-canvas-v1',skill:'confuse',intro:'迷走のご主人様が ぐるぐるしながら あらわれた！'},
  {id:'gekimu',name:'激務のご主人様',hp:150,maxHp:150,mp:12,maxMp:12,atk:19,def:10,spd:12,talk:11,exp:42,image:'img/enemies/gekimu.png?v=enemy-canvas-v1',skill:'powerup',intro:'激務のご主人様が せわしなく あらわれた！'},
  {id:'neochi',name:'寝落のご主人様',hp:130,maxHp:130,mp:15,maxMp:15,atk:16,def:9,spd:9,talk:12,exp:38,image:'img/enemies/neochi.png?v=enemy-canvas-v1',skill:'sleep',intro:'寝落のご主人様が うとうとしながら あらわれた！'},
  {id:'deisui',name:'泥酔のご主人様',hp:180,maxHp:180,mp:18,maxMp:18,atk:21,def:12,spd:8,talk:14,exp:55,image:'img/enemies/deisui.png?v=enemy-canvas-v1',skill:'drunk',intro:'泥酔のご主人様が ふらつきながら あらわれた！'},
  {id:'shisseki',name:'叱責のご主人様',hp:240,maxHp:240,mp:25,maxMp:25,atk:26,def:16,spd:15,talk:16,exp:75,image:'img/enemies/shisseki.png?v=enemy-canvas-v1',skill:'defdown',intro:'叱責のご主人様が ふるえながら あらわれた！'},
  {id:'boss',name:'鬼怒夜魔さん',hp:380,maxHp:380,mp:40,maxMp:40,atk:32,def:20,spd:18,talk:22,exp:120,image:'img/enemies/boss.png?v=boss-portrait-v1',boss:true,skill:'boss',intro:'鬼怒夜魔さんが あらわれた！！'},
  {id:'tamachan',name:'たまちゃん',hp:1,maxHp:1,mp:0,maxMp:0,atk:0,def:0,spd:99,talk:99,exp:0,image:'img/enemies/tamachan.png?v=29special',helper:true,intro:'たまちゃんが あらわれた！'}
];

const equipmentData={
  weapons:[
    {id:'rod',name:'ご奉仕ロッド',atk:2},
    {id:'frill_blade',name:'お絵かきケチャップ',atk:6},
    {id:'gokitaku_mace',name:'ご帰宅メイス',atk:11}
  ],
  uniforms:[
    {id:'maid_headband',slot:'head',name:'メイドカチューシャ',def:3},
    {id:'heart_tiara',slot:'head',name:'コットンシュシュ',def:3},
    {id:'rose_ribbon',slot:'head',name:'猫耳ヘアバンド',def:5},
    {id:'white_apron',slot:'body',name:'純白のエプロン',def:4},
    {id:'long_maid',slot:'body',name:'見習いメイド服',def:5},
    {id:'black_stocking',slot:'accessory',name:'黒のストッキング',def:2},
    {id:'service_proof',slot:'accessory',name:'お給仕の証',def:3,talk:2},
    {id:'oshi_pendant',slot:'accessory',name:'推し活ペンダント',def:7},
    {id:'legend_nameplate',slot:'accessory',name:'伝説の名札',def:12},
    {id:'first_maid',slot:'body',name:'初代メイド服',def:28}
  ]
};

const initialPlayer={
  name:'まろ',
  lv:1,
  hp:28,
  maxHp:28,
  mp:10,
  maxMp:10,
  baseAtk:9,
  baseDef:3,
  baseSpd:6,
  baseTalk:7,
  exp:0,
  nextExp:45,
  guarding:false,
  items:{omurice:2,tea:1,cool_tea:1,horse:1},
  metTamachan:false,
  status:{sleep:0,confuse:0,defDown:0},
  inventory:{weapons:['rod'],uniforms:['maid_headband','white_apron','black_stocking']},
  equip:{weapon:'rod',head:'maid_headband',body:'white_apron',accessory:'black_stocking'}
};

const state={
  player:makePlayer(),
  enemyIndex:0,
  enemy:null,
  enemiesInBattle:[],
  targetIndex:0,
  lastDefeatedEnemy:null,
  busy:false,
  started:false,
  maze:[],
  floor:1,
  stairs:null,
  boss:{x:15,y:15},
  chests:[],
  inBattle:false,
  enemyActedFirst:false
};

window.enemies = enemies;
window.equipmentData = equipmentData;
window.initialPlayer = initialPlayer;
window.state = state;

window.getWeaponById = window.getWeaponById || function(id){
  return equipmentData.weapons.find(item => item.id === id) || null;
};

window.getUniformById = window.getUniformById || function(id){
  return equipmentData.uniforms.find(item => item.id === id) || null;
};

window.getEquipmentById = window.getEquipmentById || function(id){
  return window.getWeaponById(id) || window.getUniformById(id);
};

function makePlayer(){return JSON.parse(JSON.stringify(initialPlayer));}
function cloneEnemy(base){const c=JSON.parse(JSON.stringify(base));c.sleepTurns=0;return c;}
function ensurePlayerStatus(){
  const p=state.player;
  if(!p.status) p.status={sleep:0,confuse:0,defDown:0};
  return p.status;
}
function statusText(){
  const s=ensurePlayerStatus(), parts=[];
  if(s.sleep>0) parts.push(`😴 睡眠(${s.sleep})`);
  if(s.confuse>0) parts.push(`💫 混乱(${s.confuse})`);
  if(s.defDown>0) parts.push(`🔻 防御ダウン(${s.defDown})`);
  return parts.length?parts.join(' '):'なし';
}
function effectiveDef(){
  const s=ensurePlayerStatus();
  const base=totalDef();
  return s.defDown>0?Math.max(0,Math.floor(base*.65)):base;
}

function currentEnemy(){
  if(state.enemiesInBattle && state.enemiesInBattle.length){
    if(!state.enemiesInBattle[state.targetIndex] || state.enemiesInBattle[state.targetIndex].hp<=0){
      const next=state.enemiesInBattle.findIndex(e=>e.hp>0);
      state.targetIndex=next>=0?next:0;
    }
    return state.enemiesInBattle[state.targetIndex] || state.enemy;
  }
  return state.enemy;
}

function aliveEnemies(){
  return (state.enemiesInBattle||[]).filter(e=>e.hp>0);
}

function allEnemiesDefeated(){
  return aliveEnemies().length===0;
}

function selectTarget(index){
  if(state.busy) return;
  if(!state.enemiesInBattle[index] || state.enemiesInBattle[index].hp<=0) return;
  state.targetIndex=index;
  updateUI();
  setMessage(`${state.enemiesInBattle[index].name}を対象にした！`);
}

function buildEnemyParty(enemyBase){
  const main=cloneEnemy(enemyBase);
  if(main.boss || main.helper) return [main];

  // 最大2体まで。通常敵は一定確率で2体出現。
  if(Math.random()<0.42){
    const candidates=enemies.filter(e=>!e.boss && !e.helper);
    const sub=cloneEnemy(candidates[Math.floor(Math.random()*candidates.length)]);
    return [main,sub];
  }
  return [main];
}
function findWeapon(id){return equipmentData.weapons.find(x=>x.id===id)||null;}
function findUniform(id){return equipmentData.uniforms.find(x=>x.id===id)||null;}

function totalAtk(){
  const p=state.player;
  const w=findWeapon(p.equip.weapon);
  return p.baseAtk+(w?w.atk:0);
}

function totalDef(){
  const p=state.player;
  let def=p.baseDef;
  ['head','body','accessory'].forEach(slot=>{
    const u=findUniform(p.equip[slot]);
    if(u) def+=u.def;
  });
  return def;
}

function totalSpd(){
  const p=state.player;
  return p.baseSpd || 0;
}

function totalTalk(){
  const p=state.player;
  return p.baseTalk || 0;
}


function currentEnemyMaxSpd(){
  const alive=aliveEnemies();
  if(!alive.length) return 0;
  return Math.max(...alive.map(e=>e.spd||0));
}

function enemyActsFirstThisTurn(){
  const diff = currentEnemyMaxSpd() - totalSpd();
  if(diff <= 0) return false;
  const chance = Math.min(0.9,0.28 + diff * 0.08);
  return Math.random() < chance;
}

async function enemyFirstCheck(){
  state.enemyActedFirst=false;
  if(enemyActsFirstThisTurn()){
    updateUI();
    await sleep(600);
    await enemyTurn();
    state.enemyActedFirst=true;
    return state.player.hp<=0;
  }
  return false;
}

function magicPower(base){
  return Math.floor(base + totalTalk()*1.6);
}

function moeMagicDamage(){
  // Lv1時点では約25〜30。以後、トーク力の成長分で加算。
  const base=25+Math.floor(Math.random()*6);
  const talkBonus=Math.max(0, Math.floor((totalTalk()-7)*1.2));
  return base+talkBonus;
}

/* ===== Audio ===== */
const soundState={ctx:null,enabled:true,bgmTimer:null,bgmKind:null};
function initAudio(){
  if(soundState.ctx) return soundState.ctx;
  try{soundState.ctx=new (window.AudioContext||window.webkitAudioContext)();return soundState.ctx;}catch(e){return null;}
}
function stopBgm(){if(soundState.bgmTimer){clearInterval(soundState.bgmTimer);soundState.bgmTimer=null;}soundState.bgmKind=null;}
function toggleSound(){
  soundState.enabled=!soundState.enabled;
  const btn=document.getElementById('soundBtn');
  if(btn){btn.textContent=soundState.enabled?'音: ON':'音: OFF';btn.classList.toggle('sound-off',!soundState.enabled);}
  if(!soundState.enabled) stopBgm();
  else if(state.enemy) startBgm(state.enemy.boss?'boss':'battle');
}
function tone(freq,duration,type='square',gain=.08,delay=0){
  if(!soundState.enabled) return;
  const ctx=initAudio(); if(!ctx) return;
  const osc=ctx.createOscillator(); const g=ctx.createGain();
  osc.type=type; osc.frequency.value=freq;
  g.gain.setValueAtTime(gain,ctx.currentTime+delay);
  g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+delay+duration);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(ctx.currentTime+delay); osc.stop(ctx.currentTime+delay+duration);
}
function playSeq(notes){let t=0;notes.forEach(n=>{if(n.f>0)tone(n.f,n.d,n.type||'square',n.g||.08,t);t+=n.wait||n.d;});}
function seAttack(){playSeq([{f:520,d:.06,g:.09},{f:260,d:.08,g:.08}]);}
function seHit(){playSeq([{f:110,d:.09,type:'sawtooth',g:.08},{f:85,d:.08,type:'sawtooth',g:.06}]);}
function seHeal(){playSeq([{f:523,d:.08,type:'sine',g:.08},{f:659,d:.08,type:'sine',g:.08},{f:784,d:.12,type:'sine',g:.08}]);}
function seMagic(){playSeq([{f:740,d:.07,type:'triangle',g:.07},{f:988,d:.07,type:'triangle',g:.07},{f:1175,d:.12,type:'triangle',g:.07}]);}
function seOmajinai(){playSeq([{f:659,d:.05,type:'sine',g:.06},{f:988,d:.06,type:'triangle',g:.07,wait:.07},{f:1318,d:.08,type:'sine',g:.06,wait:.08},{f:1760,d:.12,type:'triangle',g:.05}]);}
function seTreasure(){playSeq([{f:659,d:.08,type:'sine',g:.08},{f:784,d:.08,type:'sine',g:.08},{f:988,d:.12,type:'sine',g:.09}]);}
function seLevelUp(){playSeq([{f:523,d:.09,type:'sine',g:.08},{f:659,d:.09,type:'sine',g:.08},{f:784,d:.09,type:'sine',g:.08},{f:1046,d:.18,type:'sine',g:.08}]);}
function seVictory(){playSeq([{f:392,d:.12,type:'triangle',g:.08},{f:523,d:.12,type:'triangle',g:.08},{f:659,d:.12,type:'triangle',g:.08},{f:784,d:.2,type:'triangle',g:.08}]);}
function seCheki(){playSeq([{f:880,d:.08,type:'sine',g:.09},{f:1175,d:.08,type:'sine',g:.09},{f:1568,d:.18,type:'sine',g:.09}]);}
function startBgm(kind){
  // TP3 BGM版ではWebAudioの簡易BGMは使用しない
  return;
}

/* ===== Assets ===== */
const ASSETS_TO_PRELOAD=[
  'img/enemies/teiji.png?v=enemy-canvas-v1','img/enemies/kuufuku.png?v=enemy-canvas-v1','img/enemies/zangyo.png?v=enemy-canvas-v1',
  'img/enemies/meisou.png?v=enemy-canvas-v1','img/enemies/gekimu.png?v=enemy-canvas-v1','img/enemies/neochi.png?v=enemy-canvas-v1',
  'img/enemies/deisui.png?v=enemy-canvas-v1','img/enemies/shisseki.png?v=enemy-canvas-v1','img/enemies/boss.png?v=boss-portrait-v1',
  'img/enemies/maigo.png?v=enemy-canvas-v1','img/enemies/shousou.png?v=enemy-canvas-v1','img/enemies/sanzai.png?v=enemy-canvas-v1',
  'img/enemies/bousou.png?v=enemy-canvas-v1','img/enemies/juuatsu.png?v=enemy-canvas-v1',
  'img/enemies/tamachan.png?v=29special','img/backgrounds/battle_room.png?v=29special','img/backgrounds/battle_boss_room.png?v=29special'
];
function preloadImage(src){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({src,ok:true});img.onerror=()=>resolve({src,ok:false});img.src=src;});}
function hideLoadingScreen(){
  const loading=document.getElementById('loadingScreen');
  if(!loading) return;
  loading.style.opacity='0';
  loading.style.transition='opacity .35s ease';
  setTimeout(()=>loading.remove(),420);
}

async function preloadAssets(){
  try{
    await Promise.race([
      Promise.all(ASSETS_TO_PRELOAD.map(preloadImage)),
      new Promise(resolve=>setTimeout(resolve,2200))
    ]);
  }catch(e){
  }finally{
    hideLoadingScreen();
  }
}

if(document.readyState==='complete' || document.readyState==='interactive'){
  setTimeout(preloadAssets,0);
}else{
  window.addEventListener('DOMContentLoaded',preloadAssets,{once:true});
}

setTimeout(hideLoadingScreen,3500);

/* ===== Map ===== */
const cvs=document.getElementById('mapCanvas');
const mapCtx=cvs.getContext('2d');

function generateRandomMaze(){
  const maze=Array.from({length:MAZE_H},()=>Array(MAZE_W).fill(1));
  function carve(x,y){
    maze[y][x]=0;
    const dirs=[[2,0],[-2,0],[0,2],[0,-2]].sort(()=>Math.random()-.5);
    for(const [dx,dy] of dirs){
      const nx=x+dx,ny=y+dy;
      if(nx>0&&ny>0&&nx<MAZE_W-1&&ny<MAZE_H-1&&maze[ny][nx]===1){
        maze[y+dy/2][x+dx/2]=0;
        carve(nx,ny);
      }
    }
  }
  carve(1,1);
  return maze;
}

function makeMaze(){
  setupFloor(1);
}

function setupFloor(floor){
  state.floor=floor;
  state.maze=generateRandomMaze();
  state.player.mapX=1;
  state.player.mapY=1;

  const far=findFarthest();

  if(floor===1){
    state.stairs={x:far.x,y:far.y};
    state.boss={x:-1,y:-1};
  }else{
    state.stairs=null;
    state.boss={x:far.x,y:far.y};
  }

  placeChests();
  updateFloorLabel();
  drawMaze();
  playMapBgm();
}

function updateFloorLabel(){
  const label=document.getElementById('floorLabel');
  if(label) label.textContent=`${state.floor}F`;
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
      const isStart=(x===1&&y===1);
      const isBoss=(x===state.boss.x&&y===state.boss.y);
      const isStairs=(state.stairs&&x===state.stairs.x&&y===state.stairs.y);
      if(state.maze[y][x]===0 && !isStart && !isBoss && !isStairs) floors.push({x,y});
    }
  }
  floors.sort(()=>Math.random()-.5);
  state.chests=floors.slice(0,4).map((p,i)=>({...p,opened:false,id:`${state.floor}-${i}`}));
}

function drawMaze(){
  if(!mapCtx) return;
  mapCtx.clearRect(0,0,cvs.width,cvs.height);
  const size=cvs.width/MAZE_W;
  for(let y=0;y<MAZE_H;y++){
    for(let x=0;x<MAZE_W;x++){
      mapCtx.fillStyle=state.maze[y][x]===1?'#172033':'#8a6b3a';
      mapCtx.fillRect(x*size,y*size,size,size);
      if(state.maze[y][x]===0){
        mapCtx.fillStyle='rgba(255,255,255,.08)';
        mapCtx.fillRect(x*size,y*size+size*.65,size,1);
      }
    }
  }

  for(const chest of state.chests){
    if(chest.opened) continue;
    mapCtx.fillStyle='#facc15';
    mapCtx.fillRect(chest.x*size+size*.25,chest.y*size+size*.32,size*.5,size*.42);
  }

  if(state.floor===1 && state.stairs){
    mapCtx.fillStyle='#a78bfa';
    mapCtx.fillRect(state.stairs.x*size+size*.2,state.stairs.y*size+size*.2,size*.6,size*.6);
    mapCtx.fillStyle='#fff';
    mapCtx.font=`${Math.floor(size*.55)}px sans-serif`;
    mapCtx.textAlign='center';
    mapCtx.textBaseline='middle';
    mapCtx.fillText('⇧',state.stairs.x*size+size/2,state.stairs.y*size+size/2);
  }

  if(state.floor===2){
    mapCtx.fillStyle='#dc2626';
    mapCtx.fillRect(state.boss.x*size+size*.25,state.boss.y*size+size*.25,size*.5,size*.5);
  }

  mapCtx.fillStyle='#ff7ad6';
  mapCtx.beginPath();
  mapCtx.arc(state.player.mapX*size+size/2,state.player.mapY*size+size/2,size*.32,0,Math.PI*2);
  mapCtx.fill();
}

function setMapMessage(text){document.getElementById('mapMessage').textContent=text;}

function movePlayer(dx,dy){
  if(state.inBattle || state.busy) return;
  const nx=state.player.mapX+dx, ny=state.player.mapY+dy;
  if(nx<0||ny<0||nx>=MAZE_W||ny>=MAZE_H) return;
  if(state.maze[ny][nx]===1){setMapMessage('壁です。別の道を進みましょう。');return;}
  state.player.mapX=nx; state.player.mapY=ny;
  drawMaze();
  checkTileEvent();
}

function goToSecondFloor(){
  setupFloor(2);
}

function giveMapChestEquipment(){
  // 新仕様：宝箱の中身・レア度・装備追加は drop.js 側に委譲します。
  if(typeof giveMapTreasureEquipment === 'function'){
    giveMapTreasureEquipment();
    return;
  }

  setMapMessage('宝箱を開けた！');
}

function checkTileEvent(){
  const p=state.player;
  const chest=state.chests.find(c=>!c.opened&&c.x===p.mapX&&c.y===p.mapY);
 if(chest){
  chest.opened=true;
  giveMapChestEquipment();
  drawMaze();
  return;
}

  if(state.floor===1 && state.stairs && p.mapX===state.stairs.x && p.mapY===state.stairs.y){
    goToSecondFloor();
    return;
  }

  if(state.floor===2 && p.mapX===state.boss.x && p.mapY===state.boss.y){
    startBattle(cloneEnemy(enemies.find(e=>e.id==='boss')),true);
    return;
  }

  if(!state.player.metTamachan && Math.random()<1/80){
    startBattle(cloneEnemy(enemies.find(e=>e.id==='tamachan')),false);
    return;
  }

  if(Math.random()<0.18){
    let enemy;

    if(state.floor===1){
      const zone=enemies.filter(e=>['teiji','kuufuku','zangyo','meisou'].includes(e.id));
      enemy=zone[Math.floor(Math.random()*zone.length)];
    }else{
      const zone=enemies.filter(e=>['gekimu','neochi','deisui','shisseki'].includes(e.id));
      enemy=zone[Math.floor(Math.random()*zone.length)];
    }

    startBattle(cloneEnemy(enemy),false);
  }else{
  }
}

/* ===== Battle UI ===== */
function updateUI(){
  const e=currentEnemy();
  const p=state.player;
  if(!e) return;

  const alive=aliveEnemies();
  const displayName=alive.length>1 ? `${alive.length}体のご主人様` : e.name;
  document.getElementById('enemyName').textContent=displayName;
  const enemyStats=document.getElementById('enemyStats');
  if(enemyStats){
    const statTarget = e || {};
    enemyStats.textContent = `攻${statTarget.atk||0} 防${statTarget.def||0} 速${statTarget.spd||0} 話${statTarget.talk||0}`;
  }

  renderEnemySlots();

  const totalHp=state.enemiesInBattle.length
    ? state.enemiesInBattle.reduce((sum,en)=>sum+Math.max(0,en.hp),0)
    : Math.max(0,e.hp);
  const totalMaxHp=state.enemiesInBattle.length
    ? state.enemiesInBattle.reduce((sum,en)=>sum+en.maxHp,0)
    : e.maxHp;
  const hpPercent=Math.max(0,(totalHp/totalMaxHp)*100);
  document.getElementById('enemyHpFill').style.width=`${hpPercent}%`;

  document.getElementById('playerHp').textContent=`HP ${p.hp} / ${p.maxHp}`;
  document.getElementById('playerMp').textContent=`TP ${p.mp} / ${p.maxMp}`;
  const spdEl=document.getElementById('playerSpd');
  if(spdEl) spdEl.textContent=`すばやさ ${totalSpd()}`;
  const talkEl=document.getElementById('playerTalk');
  if(talkEl) talkEl.textContent=`トーク力 ${totalTalk()}`;
  const statusEl=document.getElementById('playerStatusEffects');
  if(statusEl) statusEl.textContent=`状態：${statusText()}`;
  document.getElementById('playerExp').textContent=`EXP ${p.exp} / ${p.nextExp}`;

  const status=document.querySelector('.status-panel h2');
  if(status) status.textContent=`${p.name} Lv.${p.lv} 攻${totalAtk()} 防${totalDef()}`;

  document.body.classList.toggle('boss-battle',!!(state.enemiesInBattle||[]).some(en=>en.boss));
}

function renderEnemySlots(){
  const wrap=document.getElementById('enemySlots');
  if(!wrap) return;
  wrap.innerHTML='';
  wrap.classList.toggle('single-enemy',(state.enemiesInBattle||[]).length===1);
  wrap.classList.toggle('multi-enemy',(state.enemiesInBattle||[]).length>=2);

  (state.enemiesInBattle||[]).forEach((enemy,index)=>{
    const slot=document.createElement('div');
    slot.className='enemy-slot';
    if(index===state.targetIndex && enemy.hp>0) slot.classList.add('selected');
    if(enemy.hp<=0) slot.classList.add('defeated');
    if(enemy.helper) slot.classList.add('helper');
    if(enemy.boss) slot.classList.add('boss');
    if(!enemy.helper && !enemy.boss){
      slot.classList.add('regular-enemy',`enemy-${enemy.id}`);
    }
    if(enemy.sleepTurns && enemy.sleepTurns>0) slot.classList.add('sleeping');

    const indexLabel=document.createElement('div');
    indexLabel.className='enemy-slot-index';
    indexLabel.textContent=`敵${index+1}`;

    const marker=document.createElement('div');
    marker.className='enemy-target-marker';
    marker.textContent=(index===state.targetIndex && enemy.hp>0)?'▼ TARGET':'';

    const img=document.createElement('img');
    img.src=enemy.image;
    img.alt=enemy.name;
    img.onerror=function(){this.classList.add('image-error');};

    const name=document.createElement('div');
    name.className='enemy-slot-name';
    name.textContent=enemy.hp>0 ? enemy.name : '撃破';

    const hpBar=document.createElement('div');
    hpBar.className='enemy-slot-hp';

    const hpFill=document.createElement('div');
    hpFill.className='enemy-slot-hp-fill';
    const hpPercent=Math.max(0,(enemy.hp/enemy.maxHp)*100);
    hpFill.style.width=`${hpPercent}%`;

    hpBar.appendChild(hpFill);

    slot.appendChild(indexLabel);
    slot.appendChild(marker);
    slot.appendChild(img);
    slot.appendChild(name);
    slot.appendChild(hpBar);

    if(enemy.hp>0){
      slot.addEventListener('click',()=>selectTarget(index));
    }

    wrap.appendChild(slot);
  });

  renderTargetButtons();
}

function renderTargetButtons(){
  let panel=document.getElementById('targetPanel');
  const command=document.getElementById('commandPanel');
  if(!command) return;

  if(!panel){
    panel=document.createElement('div');
    panel.id='targetPanel';
    panel.className='target-panel';
    command.insertAdjacentElement('afterend',panel);
  }

  panel.innerHTML='';
  if(!state.enemiesInBattle || state.enemiesInBattle.length<=1){
    panel.classList.add('hidden');
    return;
  }

  panel.classList.remove('hidden');
  state.enemiesInBattle.forEach((enemy,index)=>{
    const btn=document.createElement('button');
    btn.textContent=enemy.hp>0 ? `対象${index+1}` : `撃破`;
    if(index===state.targetIndex) btn.classList.add('selected-target');
    btn.disabled=enemy.hp<=0 || state.busy;
    btn.onclick=()=>selectTarget(index);
    panel.appendChild(btn);
  });
}

function setMessage(text){document.getElementById('messageText').textContent=text;}
function setButtonsDisabled(disabled){
  document.querySelectorAll('.command-panel button,.sub-menu-body button,.mini-btn,.sub-btn,.target-panel button').forEach(btn=>{
    if(btn.id!=='restartBtn') btn.disabled=disabled;
  });
}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function showDamage(value,target,extraClass){
  const area=target==='player'?document.querySelector('.status-panel'):document.querySelector('.enemy-area');
  const damage=document.createElement('div');
  damage.className=target==='player'?'damage-text player-damage':'damage-text';
  if(extraClass) damage.classList.add(extraClass);
  damage.textContent=value>0?`-${value}`:`+${Math.abs(value)}`;
  area.appendChild(damage);
  damage.classList.add('show');
  setTimeout(()=>damage.remove(),850);
}
function screenShake(){
  document.body.classList.remove('screen-shake');
  void document.body.offsetWidth;
  document.body.classList.add('screen-shake');
  setTimeout(()=>document.body.classList.remove('screen-shake'),360);
}
function screenFlash(){
  const fx=document.getElementById('screenFx');
  if(!fx) return;
  fx.classList.remove('hidden');
  void fx.offsetWidth;
  setTimeout(()=>fx.classList.add('hidden'),360);
}
function showCutin(title,text){
  const overlay=document.getElementById('cutinOverlay');
  const titleEl=document.getElementById('cutinTitle');
  const textEl=document.getElementById('cutinText');
  if(!overlay||!titleEl||!textEl) return Promise.resolve();
  titleEl.textContent=title;
  textEl.textContent=text;
  overlay.classList.remove('hidden');
  void overlay.offsetWidth;
  return new Promise(resolve=>setTimeout(()=>{overlay.classList.add('hidden');resolve();},760));
}
function criticalFlash(){
  document.body.classList.remove('critical-flash');
  void document.body.offsetWidth;
  document.body.classList.add('critical-flash');
  setTimeout(()=>document.body.classList.remove('critical-flash'),480);
}

function showLevelToast(text){
  const old=document.querySelector('.level-toast');
  if(old) old.remove();
  const toast=document.createElement('div');
  toast.className='level-toast';
  toast.textContent=text;
  document.body.appendChild(toast);
  setTimeout(()=>toast.remove(),1300);
}
function enemyFlash(){
  screenShake();
  const selected=document.querySelector('.enemy-slot.selected img') || document.querySelector('.enemy-slot img');
  if(!selected) return;
  selected.classList.remove('hit');
  void selected.offsetWidth;
  selected.classList.add('hit');
}
function playerFlash(){
  screenShake();
  const panel=document.querySelector('.status-panel');
  panel.classList.remove('player-hit');
  void panel.offsetWidth;
  panel.classList.add('player-hit');
}
function bossEntrance(){screenShake();screenFlash();}
function victoryEffect(){
  const panel=document.querySelector('.enemy-panel');
  panel.classList.remove('victory-flash');
  void panel.offsetWidth;
  panel.classList.add('victory-flash');
}

function startBattle(enemy,fromMap){
  playBgm((enemy && enemy.helper) ? 'bgmTamachan' : ((enemy && enemy.boss) ? 'bgmBoss' : 'bgmBattle'));
  state.inBattle=true;
  state.enemiesInBattle=buildEnemyParty(enemy);
  state.targetIndex=0;
  state.lastDefeatedEnemy=null;
  state.enemy=state.enemiesInBattle[0];
  state.player.guarding=false;
  closeSubMenu();closeEquipMenu();closeTreasureMenu();
  document.getElementById('mapScreen').classList.add('hidden');
  document.getElementById('battleScreen').classList.remove('hidden');
  if(state.enemiesInBattle.some(e=>e.boss)) bossEntrance();
  updateUI();

  if(enemy.helper){
    setMessage('いつもありがと♡お給仕頑張ってね♡');
    setTimeout(()=>showTamachanContinueButton(),5000);
    return;
  }

  if(state.enemiesInBattle.length>1){
    setMessage(`${state.enemiesInBattle[0].name}たちが あらわれた！`);
  }else{
    setMessage(state.enemy.intro||`${state.enemy.name} が あらわれた！`);
  }

  startBgm(state.enemiesInBattle.some(e=>e.boss)?'boss':'battle');
}


function showTamachanContinueButton(){
  completeTamachanEvent();
  const btn=document.getElementById('tamachanContinueBtn');
  if(btn) btn.classList.remove('hidden');
}

function hideTamachanContinueButton(){
  const btn=document.getElementById('tamachanContinueBtn');
  if(btn) btn.classList.add('hidden');
}

function showTamachanGetEffect(){
  const overlay=document.getElementById('tamachanGetOverlay');
  if(!overlay) return;
  const btn=document.getElementById('tamachanContinueBtn');
  if(btn) btn.classList.add('hidden');
  overlay.classList.remove('hidden');
}

function completeTamachanEvent(){
  const p=state.player;
  p.metTamachan=true;

  if(!p.inventory.uniforms.includes('first_maid')){
    p.inventory.uniforms.push('first_maid');
  }

  setMessage('初代メイド服GET！！');
  showTamachanGetEffect();
}

function endBattleToMap(){
  playMapBgm();
  playMapBgm();
  state.inBattle=false;
  state.enemy=null;
  state.enemiesInBattle=[];
  state.targetIndex=0;
  stopBgm();
  document.body.classList.remove('boss-battle');
  document.getElementById('battleScreen').classList.add('hidden');
  document.getElementById('mapScreen').classList.remove('hidden');
  setButtonsDisabled(false);
  state.busy=false;
  setMapMessage('お給仕に勝利した！ 探索を続けよう。');
  drawMaze();
}

function openSubMenu(kind){
  if(state.busy) return;
  const sub=document.getElementById('subMenu');
  const title=document.getElementById('subMenuTitle');
  const body=document.getElementById('subMenuBody');
  body.innerHTML='';
  if(kind==='magic'){
  title.textContent='おまじない';

  const p = state.player;

  if(p.lv>=1) addSubButton('もえもえぎゅー　TP5 / 単体ダメージ',()=>useMagic('moe'));
  if(p.lv>=2) addSubButton('おいしくなーれ　TP6 / HP回復',()=>useMagic('heal'));
  if(p.lv>=3) addSubButton('おやすみなさい　TP3 / 眠り',()=>useMagic('sleep'));
  if(p.lv>=4) addSubButton('ご主人様ファースト　TP5 / 必ず先制攻撃・威力75%',()=>useMagic('first_strike'));
  if(p.lv>=5) addSubButton('キラキラオーラ　TP4 / バフ',()=>useMagic('aura'));
  if(p.lv>=6) addSubButton('チェキフラッシュ　TP12 / 全体攻撃',()=>useMagic('shower'));
  if(p.lv>=7) addSubButton('完璧なお給仕　TP7 / 次2.5倍',()=>useMagic('perfect_service'));
  if(p.lv>=8) addSubButton('ご奉仕連撃　TP8 / 敵を選ばず3〜4回攻撃',()=>useMagic('combo'));
  if(p.lv>=9) addSubButton('萌えちゃーじ　TP0 / TP回復',()=>useMagic('charge'));
  if(p.lv>=10) addSubButton('ご帰宅ラッシュ　TP12 / 単体高ダメージ＋低確率混乱',()=>useMagic('rush'));
  if(p.lv>=11) addSubButton('ひなたぼっこ　TP12 / 全回復',()=>useMagic('sunny'));
  if(p.lv>=12) addSubButton('にしきぬやまー　TP16 / 超ダメージ',()=>useMagic('nishiki'));
  }else if(kind==='item'){
    title.textContent='どうぐ';
    addSubButton(`オムライス　HP30回復　残り${state.player.items.omurice}`,()=>useItem('omurice'));
    addSubButton(`紅茶　TP10回復　残り${state.player.items.tea}`,()=>useItem('tea'));
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

function isMapMode(){
  const map=document.getElementById('mapScreen');
  return !!map && !map.classList.contains('hidden') && !state.inBattle;
}

function closeSubMenu(){const sub=document.getElementById('subMenu');if(sub)sub.classList.add('hidden');}

function openEquipMenu(){
  if(state.busy) return;
  closeSubMenu();
  const menu=document.getElementById('equipMenu');
  const body=document.getElementById('equipMenuBody');
  const p=state.player;
  body.innerHTML='';

  const current=document.createElement('div');
  current.className='equip-current';
  current.innerHTML=`現在の装備<br>武器：${findWeapon(p.equip.weapon)?.name||'なし'}<br>頭：${findUniform(p.equip.head)?.name||'なし'}<br>胴：${findUniform(p.equip.body)?.name||'なし'}<br>アクセ：${findUniform(p.equip.accessory)?.name||'なし'}<br><span class="equip-stat">攻撃 ${totalAtk()} / 防御 ${totalDef()} / すばやさ ${totalSpd()} / トーク力 ${totalTalk()}</span>`;
  body.appendChild(current);

  renderEquipGroup(body,'武器',p.inventory.weapons.map(id=>findWeapon(id)).filter(Boolean).sort((a,b)=>b.atk-a.atk),item=>`武器：${item.name}　攻+${item.atk}`,item=>equipWeapon(item.id),item=>p.equip.weapon===item.id);

  const uniforms=p.inventory.uniforms.map(id=>findUniform(id)).filter(Boolean);
  renderEquipGroup(body,'防具（頭）',uniforms.filter(u=>u.slot==='head').sort((a,b)=>b.def-a.def),item=>`頭：${item.name}　防+${item.def}`,item=>equipUniform(item.id),item=>p.equip.head===item.id);
  renderEquipGroup(body,'防具（胴）',uniforms.filter(u=>u.slot==='body').sort((a,b)=>b.def-a.def),item=>`胴：${item.name}　防+${item.def}`,item=>equipUniform(item.id),item=>p.equip.body===item.id);
  renderEquipGroup(body,'防具（アクセ）',uniforms.filter(u=>u.slot==='accessory').sort((a,b)=>b.def-a.def),item=>`アクセ：${item.name}　防+${item.def}`,item=>equipUniform(item.id),item=>p.equip.accessory===item.id);

  menu.classList.remove('hidden');
}

function renderEquipGroup(parent,title,items,labelFn,handlerFn,isEquippedFn){
  const details=document.createElement('details');
  details.className='equip-group';
  details.open=true;

  const summary=document.createElement('summary');
  summary.textContent=`${title}（${items.length}）`;
  details.appendChild(summary);

  const wrap=document.createElement('div');
  wrap.className='equip-group-body';

  if(!items.length){
    const empty=document.createElement('div');
    empty.className='equip-empty';
    empty.textContent='未入手';
    wrap.appendChild(empty);
  }else{
    items.forEach(item=>{
      const btn=document.createElement('button');
      btn.textContent=labelFn(item);
      if(isEquippedFn(item)) btn.classList.add('equip-equipped');
      btn.onclick=()=>handlerFn(item);
      wrap.appendChild(btn);
    });
  }

  details.appendChild(wrap);
  parent.appendChild(details);
}
function addEquipButton(label,handler){
  const btn=document.createElement('button');
  btn.textContent=label;
  btn.onclick=handler;
  document.getElementById('equipMenuBody').appendChild(btn);
}
function closeEquipMenu(){const menu=document.getElementById('equipMenu');if(menu)menu.classList.add('hidden');}
function slotName(slot){return slot==='head'?'頭':slot==='body'?'胴':slot==='accessory'?'アクセ':slot;}
function equipWeapon(id){state.player.equip.weapon=id;const msg=`${findWeapon(id).name} を装備した！`;if(isMapMode()) setMapMessage(msg); else setMessage(msg);openEquipMenu();updateUI();}
function equipUniform(id){const item=findUniform(id);if(!item)return;state.player.equip[item.slot]=id;const msg=`${item.name} を装備した！`;if(isMapMode()) setMapMessage(msg); else setMessage(msg);openEquipMenu();updateUI();}

function openTreasureMenu(rewardText){
  const menu=document.getElementById('treasureMenu');
  const body=document.getElementById('treasureMenuBody');
  if(!menu||!body) return;
  body.innerHTML='';
  const box=document.createElement('div');
  box.className='equip-current treasure-box';
  box.innerHTML=`<div class="treasure-rare">${rewardText}</div>`;
  body.appendChild(box);
  const btn=document.createElement('button');
  btn.className='treasure-btn';
  btn.textContent='受け取る';
  btn.onclick=closeTreasureMenu;
  body.appendChild(btn);
  menu.classList.remove('hidden');
  seTreasure();
}
function closeTreasureMenu(){const menu=document.getElementById('treasureMenu');if(menu)menu.classList.add('hidden');}

async function playerStatusCheck(){
  const s=ensurePlayerStatus();
  if(s.sleep>0){
    setMessage(`${state.player.name} は眠っている…`);
    s.sleep--; updateUI(); await sleep(800); await enemyTurn();
    if(s.sleep<=0){setMessage(`${state.player.name} は目を覚ました！`);updateUI();await sleep(650);}
    return false;
  }
  if(s.confuse>0){
    s.confuse--;
    if(Math.random()<0.35){
      setMessage(`${state.player.name} は混乱して行動できなかった！`);
      updateUI(); await sleep(800); await enemyTurn();
      if(s.confuse<=0){setMessage(`${state.player.name} は気持ちを整えた！`);updateUI();await sleep(650);}
      return false;
    }
    if(s.confuse<=0){setMessage(`${state.player.name} は気持ちを整えた！`);updateUI();await sleep(650);}
  }
  if(s.defDown>0){
    s.defDown--;
    if(s.defDown<=0){setMessage(`${state.player.name} は身だしなみを整えた！ 防御が戻った！`);updateUI();await sleep(700);}
  }
  return true;
}

async function playerAction(type){
  if(state.player.hp<=0) return;
  if(state.busy) return;
  closeSubMenu();closeEquipMenu();
  state.busy=true;setButtonsDisabled(true);
  if(!(await playerStatusCheck())) return;
  if(await enemyFirstCheck()) return;
  const p=state.player;const e=currentEnemy();
  if(type==='attack'){
    const target=currentEnemy();
    const isCritical=Math.random()<0.10;
    const baseDamage=Math.max(1,totalAtk()+Math.floor(Math.random()*4));
    const damage=isCritical ? Math.floor(baseDamage*2.2) : baseDamage;
    setMessage(`${p.name} のこうげき！`);
    await sleep(500);
    target.hp=Math.max(0,target.hp-damage);
    if(target.hp<=0) state.lastDefeatedEnemy=target;
    if(isCritical){
      setMessage(`会心の癒し！ ${target.name} に ${damage} ダメージ！`);
      criticalFlash();
      showDamage(damage,'enemy','critical-text');
    }else{
      setMessage(`${target.name} に ${damage} ダメージ！`);
      showDamage(damage,'enemy');
    }
    seAttack();enemyFlash();updateUI();
    await sleep(isCritical?950:700);
    if(allEnemiesDefeated()){await winBattle();return;}
    if(!state.enemyActedFirst) await enemyTurn();
  }else if(type==='guard'){
    p.guarding=true;
    setMessage(`${p.name} は みをまもった！`);
    await sleep(650);if(!state.enemyActedFirst) await enemyTurn();
  }
  state.enemyActedFirst=false;state.busy=false;setButtonsDisabled(false);updateUI();
}

async function useMagic(kind){
  if(state.player.hp<=0) return;
  if(state.busy) return;
  closeSubMenu();closeEquipMenu();
  state.busy=true;setButtonsDisabled(true);
  if(!(await playerStatusCheck())) return;
  if(await enemyFirstCheck()) return;
  const p=state.player;

  if(kind==='moe'){
    if(p.mp<5){await failAction('TPがたりない！');return;}
    p.mp-=5;await showCutin('おまじない','もえもえぎゅー！！');
    const damage=moeMagicDamage();
    await damageEnemy('もえもえぎゅー！！',damage);
  }else if(kind==='heal'){
    if(p.mp<8){await failAction('TPがたりない！');return;}
    p.mp-=8;await showCutin('おまじない','おいしくなーれ！');
    const heal=Math.min(35,p.maxHp-p.hp);p.hp+=heal;
    setMessage(`おいしくなーれ！ HPが ${heal} 回復！`);
    showDamage(-heal,'player');seHeal();updateUI();
    await sleep(750);if(!state.enemyActedFirst) await enemyTurn();
  }else if(kind==='sleep'){
    if(p.mp<4){await failAction('TPがたりない！');return;}
    p.mp-=4;
    const target=currentEnemy();
    const turns=2+Math.floor(Math.random()*3);
    target.sleepTurns=turns;
    await showCutin('おまじない','おやすみなさい…');
    setMessage(`${target.name} は 眠った！`);
    seMagic();updateUI();
    await sleep(800);
    if(!state.enemyActedFirst) await enemyTurn();
  }else if(kind==='nishiki'){
    if(p.mp<16){await failAction('TPがたりない！');return;}
    p.mp-=16;await showCutin('必殺おまじない','にしきぬやまー！！');screenFlash();
    const target=currentEnemy();
    const damage=target.boss?magicPower(50):magicPower(75);
    await damageEnemy('にしきぬやまー！！',damage);
  }else if(kind==='shower'){
    if(p.mp<12){await failAction('TPがたりない！');return;}
    p.mp-=12;await showCutin('全体おまじない','チェキフラッシュ！！');screenFlash();
    await damageAllEnemies('チェキフラッシュ！！',magicPower(32));
  }else if(kind==='charge'){
    await showCutin('補助おまじない','萌えちゃーじ！');
    const gain=Math.min(20,p.maxMp-p.mp);
    p.mp+=gain;
    setMessage(`TPが ${gain} 回復した！`);
    seHeal();updateUI();
    await sleep(700);
    if(!state.enemyActedFirst) await enemyTurn();
  }
  state.enemyActedFirst=false;state.busy=false;setButtonsDisabled(false);updateUI();
}

async function useItem(kind){
  if(state.player.hp<=0 && !isMapMode()) return;
  if(state.busy) return;
  closeSubMenu();closeEquipMenu();
  state.busy=true;setButtonsDisabled(true);
  if(!isMapMode() && !(await playerStatusCheck())) return;
  if(!isMapMode() && await enemyFirstCheck()) return;
  const p=state.player;const e=currentEnemy();
  if(kind==='omurice'){
    if(p.items.omurice<=0||p.hp>=p.maxHp){await failAction('オムライスは使えない！');return;}
    p.items.omurice--;
    const heal=Math.min(30,p.maxHp-p.hp);p.hp+=heal;
    setMessage(`オムライスを食べた！ HPが ${heal} 回復！`);
    showDamage(-heal,'player');seHeal();updateUI();
    await sleep(750);if(!isMapMode() && !state.enemyActedFirst) await enemyTurn();
  }else if(kind==='tea'){
    if(p.items.tea<=0||p.mp>=p.maxMp){await failAction('紅茶は使えない！');return;}
    p.items.tea--;
    const healMp=Math.min(10,p.maxMp-p.mp);p.mp+=healMp;
    setMessage(`紅茶を飲んだ！ TPが ${healMp} 回復！`);
    seHeal();updateUI();await sleep(750);if(!isMapMode() && !state.enemyActedFirst) await enemyTurn();
  }else if(kind==='horse'){
    if(isMapMode()){await failAction('くろれきしはお給仕中のみ使えます！');return;}
    if(p.items.horse<=0){await failAction('くろれきしは持っていない！');return;}
    p.items.horse--;
    const damage=e.boss?55:999;
    await damageEnemy('くろれきしを召喚した！',damage);
  }
  state.enemyActedFirst=false;state.busy=false;setButtonsDisabled(false);updateUI();
}

async function failAction(message){
  if(isMapMode()) setMapMessage(message); else setMessage(message);
  await sleep(700);
  state.enemyActedFirst=false;state.busy=false;setButtonsDisabled(false);updateUI();
}

async function damageEnemy(message,damage){
  const target=currentEnemy();
  target.hp=Math.max(0,target.hp-damage);
  if(target.hp<=0) state.lastDefeatedEnemy=target;
  setMessage(`${message} ${target.name} に ${damage} ダメージ！`);
  showDamage(damage,'enemy');seMagic();enemyFlash();updateUI();
  await sleep(750);
  if(allEnemiesDefeated()){ await winBattle(); return; }
  if(!state.enemyActedFirst) await enemyTurn();
}

async function damageAllEnemies(message,baseDamage){
  let defeated=null;
  aliveEnemies().forEach(enemy=>{
    const damage=enemy.boss ? Math.floor(baseDamage*0.8) : baseDamage;
    enemy.hp=Math.max(0,enemy.hp-damage);
    if(enemy.hp<=0) defeated=enemy;
  });
  if(defeated) state.lastDefeatedEnemy=defeated;
  setMessage(`${message} 敵全体にダメージ！`);
  showDamage(baseDamage,'enemy','critical-text');
  seMagic();enemyFlash();updateUI();
  await sleep(900);
  if(allEnemiesDefeated()){ await winBattle(); return; }
  if(!state.enemyActedFirst) await enemyTurn();
}


function showGameOver(){
  state.busy=true;
  state.inBattle=false;
  setButtonsDisabled(true);
  stopAllBgm();
  const overlay=document.getElementById('gameOverOverlay');
  if(overlay) overlay.classList.remove('hidden');
}

function restartFromGameOver(){
  const overlay=document.getElementById('gameOverOverlay');
  if(overlay) overlay.classList.add('hidden');

  document.getElementById('battleScreen').classList.add('hidden');
  document.getElementById('mapScreen').classList.add('hidden');
  document.getElementById('endingScreen').classList.add('hidden');
  document.getElementById('openingScreen').classList.add('hidden');
  document.getElementById('titleScreen').classList.remove('hidden');

  state.player=makePlayer();
  state.enemy=null;
  state.enemiesInBattle=[];
  state.targetIndex=0;
  state.lastDefeatedEnemy=null;
  state.busy=false;
  state.started=false;
  state.inBattle=false;
  state.floor=1;
  state.stairs=null;
  state.maze=[];
  state.chests=[];

  setButtonsDisabled(false);
  playBgm('bgmOpening');
}

async function enemyTurn(){
  const p=state.player;
  ensurePlayerStatus();
  const attackers=aliveEnemies();
  if(!attackers.length) return;

  for(const e of attackers){
    if(e.sleepTurns&&e.sleepTurns>0){
      e.sleepTurns--;
      setMessage(`${e.name} は眠っている…`);
      updateUI(); await sleep(700);
      if(e.sleepTurns<=0){
        setMessage(`${e.name} は目を覚ました！`);
        updateUI(); await sleep(650);
      }
      continue;
    }

    if(e.equipmentDefDownTurns&&e.equipmentDefDownTurns>0){
      e.equipmentDefDownTurns--;
      if(e.equipmentDefDownTurns<=0){
        setMessage(`${e.name} は体勢を立て直した！`);
        updateUI(); await sleep(650);
      }
    }

    if(await enemySpecialAction(e)){
      updateUI(); await sleep(850);
      if(allEnemiesDefeated()){await winBattle();return;}
      if(p.hp<=0){setMessage(`${p.name} は たおれてしまった…`);await sleep(900);showGameOver();return;}
      continue;
    }

    await enemyBasicAttack(e);
    if(p.hp<=0){setMessage(`${p.name} は たおれてしまった…`);await sleep(900);showGameOver();return;}
  }
  p.guarding=false;
}

async function enemyBasicAttack(e){
  const p=state.player;
  let damage=Math.max(1,e.atk-effectiveDef()+Math.floor(Math.random()*3));
  const isCritical=Math.random()<0.08;
  if(isCritical) damage=Math.floor(damage*2);
  if(p.guarding) damage=Math.max(1,Math.floor(damage/2));
  p.hp=Math.max(0,p.hp-damage);
  setMessage(isCritical?`${e.name} の会心の一撃！ ${damage} ダメージ！`:`${e.name} のこうげき！ ${damage} ダメージ！`);
  showDamage(damage,'player',isCritical?'enemy-critical-text':null);
  if(isCritical) criticalFlash();
  seHit();playerFlash();updateUI();await sleep(isCritical?1050:850);
}

async function enemySpecialAction(e){
  const p=state.player;
  const s=ensurePlayerStatus();

  if(e.skill==='drain'&&Math.random()<0.28){
    const damage=Math.max(4,Math.floor(e.atk*.75)-Math.floor(effectiveDef()*.35));
    p.hp=Math.max(0,p.hp-damage);
    const heal=Math.max(1,Math.floor(damage*.3));
    e.hp=Math.min(e.maxHp,e.hp+heal);
    setMessage(`${e.name} の おなかすいた…！ ${damage}ダメージ、HPを${heal}回復！`);
    showDamage(damage,'player');seHit();playerFlash();return true;
  }
  if(e.skill==='double'&&Math.random()<0.24){
    setMessage(`${e.name} は さらに働き続けた！`);await sleep(450);
    await enemyBasicAttack(e); if(p.hp>0) await enemyBasicAttack(e); return true;
  }
  if(e.skill==='confuse'&&Math.random()<0.30){
    s.confuse=Math.max(s.confuse,2);
    setMessage(`${e.name} の 思考迷走！ 💫 混乱した！`);seMagic();screenFlash();return true;
  }
  if(e.skill==='powerup'&&Math.random()<0.28){
    e.atk+=3; setMessage(`${e.name} は 激務で追い込まれた！ 攻撃力が上がった！`);seMagic();return true;
  }
  if(e.skill==='sleep'&&Math.random()<0.25){
    s.sleep=Math.max(s.sleep,1+Math.floor(Math.random()*2));
    setMessage(`${e.name} の うとうと…！ 😴 眠ってしまった！`);seMagic();screenFlash();return true;
  }
  if(e.skill==='drunk'&&Math.random()<0.35){
    if(Math.random()<0.35){
      const selfDamage=Math.max(8,Math.floor(e.atk*.9));
      e.hp=Math.max(0,e.hp-selfDamage);
      if(e.hp<=0) state.lastDefeatedEnemy=e;
      setMessage(`${e.name} は酔って自分にぶつかった！ ${selfDamage}ダメージ！`);
      showDamage(selfDamage,'enemy');seHit();enemyFlash();
    }else{
      s.confuse=Math.max(s.confuse,2);
      setMessage(`${e.name} の 千鳥足トーク！ 💫 混乱した！`);seMagic();screenFlash();
    }
    return true;
  }
  if(e.skill==='defdown'&&Math.random()<0.32){
    s.defDown=Math.max(s.defDown,2);
    setMessage(`${e.name} の 叱責！ 🔻 防御が下がった！`);seMagic();screenFlash();return true;
  }
  if(e.skill==='boss'&&Math.random()<0.35){
    const roll=Math.random();
    if(roll<.45){
      let damage=Math.max(5,Math.floor(e.atk*.75)-Math.floor(effectiveDef()*.35));
      if(p.guarding) damage=Math.max(1,Math.floor(damage/2));
      p.hp=Math.max(0,p.hp-damage);
      setMessage(`${e.name} の 夜魔の圧！ ${damage}ダメージ！`);
      showDamage(damage,'player','enemy-critical-text');seMagic();screenFlash();playerFlash();
    }else if(roll<.7){
      s.defDown=Math.max(s.defDown,2);
      setMessage(`${e.name} の 威圧！ 🔻 防御が下がった！`);seMagic();screenFlash();
    }else{
      s.confuse=Math.max(s.confuse,2);
      setMessage(`${e.name} の 闇トーク！ 💫 混乱した！`);seMagic();screenFlash();
    }
    return true;
  }
  return false;
}

function giveReward(enemyId){
  // 正式仕様：通常敵からのどうぐドロップは無し
  return false;
}

function treasureDrop(enemyId){
  // 新仕様：敵から装備品はドロップしません。
  // 装備品はマップ宝箱、またはたまちゃんイベントのみで入手します。
  return false;
}

async function winBattle(){
  const p=state.player;
  const defeatedEnemies=state.enemiesInBattle && state.enemiesInBattle.length ? state.enemiesInBattle : [currentEnemy()];
  const dropTarget=state.lastDefeatedEnemy || defeatedEnemies[defeatedEnemies.length-1];
  const totalExp=defeatedEnemies.reduce((sum,e)=>sum+(e.exp||0),0);
  const hasBoss=defeatedEnemies.some(e=>e.boss);

  victoryEffect();seVictory();
  setMessage(`ご主人様たちを いやした！ EXP ${totalExp} 獲得！`);
  p.exp+=totalExp;updateUI();
  await sleep(1000);

  while(p.exp>=p.nextExp){
    p.exp-=p.nextExp;p.lv++;p.nextExp=Math.floor(p.nextExp*1.5);
    p.maxHp+=6;p.maxMp+=3;p.baseAtk+=2;p.baseDef+=1;p.baseSpd+=1;p.baseTalk+=2;p.hp=p.maxHp;p.mp=p.maxMp;
    seLevelUp();showLevelToast(`LEVEL UP！ Lv.${p.lv}`);
    setMessage(`${p.name} は レベル ${p.lv} に あがった！`);
    updateUI();await sleep(1200);
  }

  if(hasBoss){await showEnding();return;}

  // v23：ドロップ判定は「最後に倒した敵」が対象
  if(dropTarget && giveReward(dropTarget.id)){updateUI();await sleep(1300);}
  if(dropTarget && treasureDrop(dropTarget.id)){updateUI();await sleep(1200);}
  endBattleToMap();
}

/* ===== Guide / Ending ===== */
function openGuide(){const modal=document.getElementById('guideModal');if(modal)modal.classList.remove('hidden');}
function closeGuide(){const modal=document.getElementById('guideModal');if(modal)modal.classList.add('hidden');}
function formatChekiIssuedAt(date){
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,'0');
  const d=String(date.getDate()).padStart(2,'0');
  const hh=String(date.getHours()).padStart(2,'0');
  const mm=String(date.getMinutes()).padStart(2,'0');
  const ss=String(date.getSeconds()).padStart(2,'0');
  return `${y}/${m}/${d} ${hh}:${mm}:${ss}`;
}
async function showEnding(){
  stopBgm();
  setButtonsDisabled(true);
  state.busy=true;
  setMessage('鬼怒夜魔さんをいやした！ ポ・トロに平和がもどった！');
  await sleep(900);
  document.getElementById('battleScreen').classList.add('hidden');
  document.getElementById('mapScreen').classList.add('hidden');
  document.getElementById('endingScreen').classList.remove('hidden');
  const cheki=document.getElementById('chekiTicket');
  cheki.classList.add('hidden');
  if(Math.random()<1/50){
    document.getElementById('endingMessage').textContent='鬼怒夜魔さんがチェキ券を落とした！';
    const issuedAt=document.getElementById('chekiIssuedAt');
    if(issuedAt) issuedAt.textContent=formatChekiIssuedAt(new Date());
    cheki.classList.remove('hidden');
    seCheki();
  }else{
    document.getElementById('endingMessage').textContent='鬼怒夜魔さんをいやした！ 一人前のメイドに近づいた！';
  }
}
function restartFromEnding(){
  playBgm('bgmOpening');
  document.getElementById('endingScreen').classList.add('hidden');
  document.getElementById('battleScreen').classList.add('hidden');
  document.getElementById('mapScreen').classList.add('hidden');
  document.getElementById('titleScreen').classList.remove('hidden');
  document.getElementById('chekiTicket').classList.add('hidden');
  const issuedAt=document.getElementById('chekiIssuedAt');
  if(issuedAt) issuedAt.textContent='--:--';
  state.busy=false;state.started=false;state.inBattle=false;stopBgm();
}


function getOshiName(){
  const input=document.getElementById('oshiNameInput');
  const raw=input ? input.value.trim() : '';
  return raw ? raw.slice(0,12) : 'おうまさん';
}

/* ===== Start / Reset ===== */
function startGame(){
  playMapBgm();
  initAudio();
  if(openingTimer){
    clearInterval(openingTimer);
    openingTimer=null;
  }
  if(openingDelayTimer){
    clearTimeout(openingDelayTimer);
    openingDelayTimer=null;
  }
  if(openingLineTimer){
    clearTimeout(openingLineTimer);
    openingLineTimer=null;
  }
  document.getElementById('titleScreen').classList.add('hidden');
  document.getElementById('openingScreen').classList.add('hidden');
  document.getElementById('endingScreen').classList.add('hidden');
  document.getElementById('battleScreen').classList.add('hidden');
  document.getElementById('mapScreen').classList.remove('hidden');
  state.player=makePlayer();
  state.player.name=getOshiName();
  state.busy=false;state.started=true;state.inBattle=false;
  setButtonsDisabled(false);
  setupFloor(1);
}
function resetGame(){
  closeSubMenu();closeEquipMenu();closeTreasureMenu();
  startGame();
}


/* ===== Opening ===== */
let openingTimer=null;
let openingDelayTimer=null;
let openingLineTimer=null;
let openingCurrentIndex=0;
const OPENING_FADE_MS=600;
const OPENING_SHOW_MS=5000;

function getOpeningLines(){
  const source=document.getElementById('openingCrawlSource');
  if(!source) return [];
  const lines=[];
  const titleBlock=source.querySelector('.opening-title-block');
  if(titleBlock) lines.push(titleBlock.innerHTML);
  Array.from(source.querySelectorAll('p')).forEach(p=>lines.push(p.innerHTML));
  return lines;
}

function showOpeningLine(lines,index){
  const active=document.getElementById('openingStoryActive');
  if(!active || index<0 || index>=lines.length) return;
  if(openingLineTimer){
    clearTimeout(openingLineTimer);
    openingLineTimer=null;
  }
  active.style.opacity=0;
  openingLineTimer=setTimeout(()=>{
    active.innerHTML=lines[index];
    active.style.opacity=1;
    openingLineTimer=null;
  },OPENING_FADE_MS);
}

function startOpeningStory(){
  if(openingTimer){
    clearInterval(openingTimer);
    openingTimer=null;
  }
  const lines=getOpeningLines();
  if(!lines.length) return;
  openingCurrentIndex=0;
  showOpeningLine(lines,0);
  const interval=OPENING_FADE_MS+OPENING_SHOW_MS;
  openingTimer=setInterval(()=>{
    openingCurrentIndex++;
    if(openingCurrentIndex>=lines.length){
      clearInterval(openingTimer);
      openingTimer=null;
      return;
    }
    showOpeningLine(lines,openingCurrentIndex);
  },interval);
}

function openOpening(){
  playBgm('bgmOpening');
  const title=document.getElementById('titleScreen');
  const opening=document.getElementById('openingScreen');
  const active=document.getElementById('openingStoryActive');
  if(openingTimer){
    clearInterval(openingTimer);
    openingTimer=null;
  }
  if(openingDelayTimer){
    clearTimeout(openingDelayTimer);
    openingDelayTimer=null;
  }
  if(openingLineTimer){
    clearTimeout(openingLineTimer);
    openingLineTimer=null;
  }
  if(active){
    active.innerHTML='';
    active.style.opacity=0;
  }
  if(title) title.classList.add('hidden');
  if(opening) opening.classList.remove('hidden');
  openingDelayTimer=setTimeout(()=>{
    openingDelayTimer=null;
    startOpeningStory();
  },4000);
}

function closeOpening(){
  const title=document.getElementById('titleScreen');
  const opening=document.getElementById('openingScreen');
  const active=document.getElementById('openingStoryActive');
  if(openingTimer){
    clearInterval(openingTimer);
    openingTimer=null;
  }
  if(openingDelayTimer){
    clearTimeout(openingDelayTimer);
    openingDelayTimer=null;
  }
  if(openingLineTimer){
    clearTimeout(openingLineTimer);
    openingLineTimer=null;
  }
  if(active){
    active.innerHTML='';
    active.style.opacity=0;
  }
  if(opening) opening.classList.add('hidden');
  if(title) title.classList.remove('hidden');
}

/* ===== Events ===== */
/*
  安全イベント登録版：
  HTML側に存在しないIDがあっても game.js 全体が停止しないようにする。
*/
function safeBind(id,event,handler,options){
  const el = document.getElementById(id);

  if(!el){
    console.warn('[PO・TORO QUEST] event target not found:', id);
    return false;
  }

  el.addEventListener(event,handler,options);
  return true;
}

safeBind('startBtn','click',startGame);
safeBind('openingBtn','click',openOpening);
safeBind('openingSkipBtn','click',closeOpening);
safeBind('restartBtn','click',resetGame);
safeBind('equipBtn','click',openEquipMenu);
safeBind('battleEquipBtn','click',openEquipMenu);
safeBind('soundBtn','click',toggleSound);
safeBind('guideBtn','click',openGuide);
safeBind('guideCloseBtn','click',closeGuide);
safeBind('guideModal','click',function(e){if(e.target===this) closeGuide();});
safeBind('newMapBtn','click',()=>setupFloor(state.floor||1));
safeBind('mapItemBtn','click',()=>openSubMenu('item'));
safeBind('mapEquipBtn','click',openEquipMenu);
safeBind('endingRestartBtn','click',restartFromEnding);

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
  const mapScreen = document.getElementById('mapScreen');
  if(!mapScreen || mapScreen.classList.contains('hidden')) return;
  if(e.key==='ArrowUp'){e.preventDefault();movePlayer(0,-1);}
  if(e.key==='ArrowDown'){e.preventDefault();movePlayer(0,1);}
  if(e.key==='ArrowLeft'){e.preventDefault();movePlayer(-1,0);}
  if(e.key==='ArrowRight'){e.preventDefault();movePlayer(1,0);}
});


/* ダブルタップ拡大抑制 */
let lastTouchEnd=0;
document.addEventListener('touchend',function(e){
  const now=Date.now();
  if(now-lastTouchEnd<=300){
    e.preventDefault();
  }
  lastTouchEnd=now;
},{passive:false});

document.addEventListener('gesturestart',function(e){
  e.preventDefault();
});



/* ===== Enemy Balance Rework =====
定時 Lv3 / 出現 1〜2
残業 Lv5 / 出現 2〜3
激務 Lv8 / 出現 3〜4
泥酔 Lv12 / 出現 3〜5
叱責 Lv17 / 出現 4〜5
ボス Lv20 / 最深部
通常敵ドロップ：なし
ボス：チェキ券抽選 1/50
*/


/* ===== Tamachan + Level Adjust =====
- レベルアップ速度を遅くするため、初期nextExpを45に変更
- 敵EXPを控えめに調整
- たまちゃんはレア遭遇 1/80
- たまちゃんは必ず単体で出現
- セリフ：「いつもありがと♡お給仕頑張ってね♡」
- イベント終了後、初代メイド服を装備品に追加
*/


/* ===== v29 Tamachan Once + Boss Rename =====
- たまちゃんは一回の冒険で一度しか出会えない
- 一度遭遇後はその冒険中は再出現しない
- ボス名を「鬼怒夜魔さん」に変更
*/

window.addEventListener('DOMContentLoaded', ()=>{
  setTimeout(()=>playBgm('bgmOpening'), 300);
});



/* ===== Map Menu Button Fix ===== */
function bindMapMenuButtons(){
  const itemBtn=document.getElementById('mapItemBtn');
  const equipBtn=document.getElementById('mapEquipBtn');

  if(itemBtn && !itemBtn.dataset.boundMapMenu){
    itemBtn.dataset.boundMapMenu='1';
    itemBtn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      openSubMenu('item');
    });
  }

  if(equipBtn && !equipBtn.dataset.boundMapMenu){
    equipBtn.dataset.boundMapMenu='1';
    equipBtn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      openEquipMenu();
    });
  }
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',bindMapMenuButtons,{once:true});
}else{
  bindMapMenuButtons();
}



function bindTamachanContinueButton(){
  const btn=document.getElementById('tamachanContinueBtn');
  if(!btn || btn.dataset.boundTamachan) return;
  btn.dataset.boundTamachan='1';
  btn.addEventListener('click',()=>{
    hideTamachanContinueButton();
    const overlay=document.getElementById('tamachanGetOverlay');
    if(overlay) overlay.classList.add('hidden');
    endBattleToMap();
  });
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',bindTamachanContinueButton,{once:true});
}else{
  bindTamachanContinueButton();
}



function bindGameOverButton(){
  const btn=document.getElementById('gameOverRestartBtn');
  if(!btn || btn.dataset.boundGameOver) return;
  btn.dataset.boundGameOver='1';
  btn.addEventListener('click',restartFromGameOver);
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',bindGameOverButton,{once:true});
}else{
  bindGameOverButton();
}


/* ===== Battle UI Command Rework ===== */
function bindBattleEquipButton(){
  const btn=document.getElementById('battleEquipBtn');
  if(!btn || btn.dataset.boundBattleEquip) return;
  btn.dataset.boundBattleEquip='1';
  btn.addEventListener('click',openEquipMenu);
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',bindBattleEquipButton,{once:true});
}else{
  bindBattleEquipButton();
}
