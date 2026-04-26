const MAZE_W=17;
const MAZE_H=17;

const enemies=[
  /* v28 初期装備基準
     定時 → Lv3
     残業 → Lv5
     叱責 → Lv8
     ボス → Lv15
  */
  {id:'teiji',name:'定時のご主人様',hp:58,maxHp:58,atk:7,exp:22,image:'img/enemies/teiji.png?v=29',intro:'定時のご主人様が あらわれた！'},
  {id:'zangyo',name:'残業のご主人様',hp:108,maxHp:108,atk:11,exp:42,image:'img/enemies/zangyo.png?v=29',intro:'残業のご主人様が つかれた顔で あらわれた！'},
  {id:'shisseki',name:'叱責のご主人様',hp:178,maxHp:178,atk:17,exp:78,image:'img/enemies/shisseki.png?v=29',intro:'叱責のご主人様が ふるえながら あらわれた！'},
  {id:'boss',name:'ご主人王',hp:420,maxHp:420,atk:28,exp:260,image:'img/enemies/boss.png?v=29',boss:true,intro:'ご主人王が あらわれた！！'}
];

const equipmentData={
  weapons:[
    {id:'duster',name:'フェザーダスター',atk:2},
    {id:'broom',name:'マジカルホーキ',atk:5},
    {id:'vacuum',name:'異国の掃除機',atk:9}
  ],
  uniforms:[
    {id:'stocking',slot:'legs',name:'黒のストッキング',def:2},
    {id:'apron',slot:'body',name:'純白エプロン',def:4},
    {id:'headband',slot:'head',name:'メイドカチューシャ',def:3},
    {id:'real6',slot:'body',name:'初代メイド服',def:24}
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
  exp:0,
  nextExp:20,
  guarding:false,
  items:{omurice:2,tea:1,horse:1},
  inventory:{weapons:['duster'],uniforms:['stocking']},
  equip:{weapon:'duster',head:null,body:null,legs:'stocking'}
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
  boss:{x:15,y:15},
  chests:[],
  inBattle:false
};

function makePlayer(){return JSON.parse(JSON.stringify(initialPlayer));}
function cloneEnemy(base){return JSON.parse(JSON.stringify(base));}
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
  if(main.boss) return [main];

  // 最大2体まで。通常敵は一定確率で2体出現。
  if(Math.random()<0.42){
    const candidates=enemies.filter(e=>!e.boss);
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
  ['head','body','legs'].forEach(slot=>{
    const u=findUniform(p.equip[slot]);
    if(u) def+=u.def;
  });
  return def;
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
function seTreasure(){playSeq([{f:659,d:.08,type:'sine',g:.08},{f:784,d:.08,type:'sine',g:.08},{f:988,d:.12,type:'sine',g:.09}]);}
function seLevelUp(){playSeq([{f:523,d:.09,type:'sine',g:.08},{f:659,d:.09,type:'sine',g:.08},{f:784,d:.09,type:'sine',g:.08},{f:1046,d:.18,type:'sine',g:.08}]);}
function seVictory(){playSeq([{f:392,d:.12,type:'triangle',g:.08},{f:523,d:.12,type:'triangle',g:.08},{f:659,d:.12,type:'triangle',g:.08},{f:784,d:.2,type:'triangle',g:.08}]);}
function seCheki(){playSeq([{f:880,d:.08,type:'sine',g:.09},{f:1175,d:.08,type:'sine',g:.09},{f:1568,d:.18,type:'sine',g:.09}]);}
function startBgm(kind){
  if(!soundState.enabled) return;
  if(soundState.bgmKind===kind) return;
  stopBgm(); soundState.bgmKind=kind;
  const battle=[{f:196,d:.1,g:.035},{f:0,d:.04},{f:247,d:.1,g:.035},{f:0,d:.04},{f:294,d:.1,g:.035},{f:247,d:.1,g:.035},{f:330,d:.12,type:'triangle',g:.03},{f:294,d:.12,type:'triangle',g:.03}];
  const boss=[{f:147,d:.13,g:.04},{f:196,d:.13,g:.04},{f:220,d:.13,g:.04},{f:247,d:.13,g:.04},{f:294,d:.18,type:'sawtooth',g:.035},{f:247,d:.12,type:'sawtooth',g:.035}];
  function loop(){playSeq(kind==='boss'?boss:battle);}
  loop(); soundState.bgmTimer=setInterval(loop,kind==='boss'?1100:1200);
}

/* ===== Assets ===== */
const ASSETS_TO_PRELOAD=[
  'img/enemies/teiji.png?v=29',
  'img/enemies/zangyo.png?v=29',
  'img/enemies/shisseki.png?v=29',
  'img/enemies/boss.png?v=29',
  'img/backgrounds/battle_room.png?v=29',
  'img/backgrounds/battle_boss_room.png?v=29'
];
function preloadImage(src){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({src,ok:true});img.onerror=()=>resolve({src,ok:false});img.src=src;});}
async function preloadAssets(){
  const loading=document.getElementById('loadingScreen');
  await Promise.all(ASSETS_TO_PRELOAD.map(preloadImage));
  if(loading){loading.style.opacity='0';loading.style.transition='opacity .35s ease';setTimeout(()=>loading.remove(),380);}
}
window.addEventListener('load',preloadAssets);

/* ===== Map ===== */
const cvs=document.getElementById('mapCanvas');
const mapCtx=cvs.getContext('2d');

function makeMaze(){
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
  state.maze=maze;
  state.player.mapX=1;
  state.player.mapY=1;
  state.boss=findFarthest();
  placeChests();
  drawMaze();
  setMapMessage('ランダムなお屋敷が生成されました。探索しましょう。');
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
      if(state.maze[y][x]===0 && !(x===1&&y===1) && !(x===state.boss.x&&y===state.boss.y)) floors.push({x,y});
    }
  }
  floors.sort(()=>Math.random()-.5);
  state.chests=floors.slice(0,4).map((p,i)=>({...p,opened:false,id:i}));
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
  mapCtx.fillStyle='#dc2626';
  mapCtx.fillRect(state.boss.x*size+size*.25,state.boss.y*size+size*.25,size*.5,size*.5);
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

function giveMapChestEquipment(){
  const p=state.player;

  // マップ上の宝箱も「装備品のみ」
  // 初代メイド服はレア装備
  const rareFirstMaid = Math.random() < 0.15;
  if(rareFirstMaid && !p.inventory.uniforms.includes('real6')){
    p.inventory.uniforms.push('real6');
    setMapMessage('宝箱を開けた！ レア装備 初代メイド服 を手に入れた！');
    return;
  }

  const candidates=[];
  if(!p.inventory.weapons.includes('broom')) candidates.push({type:'weapon',id:'broom',text:'マジカルホーキ'});
  if(!p.inventory.weapons.includes('vacuum')) candidates.push({type:'weapon',id:'vacuum',text:'異国の掃除機'});
  if(!p.inventory.uniforms.includes('apron')) candidates.push({type:'uniform',id:'apron',text:'純白エプロン'});
  if(!p.inventory.uniforms.includes('headband')) candidates.push({type:'uniform',id:'headband',text:'メイドカチューシャ'});

  if(!candidates.length){
    setMapMessage('宝箱を開けた！ しかし、すでに装備品は揃っていた。');
    return;
  }

  const reward=candidates[Math.floor(Math.random()*candidates.length)];
  if(reward.type==='weapon') p.inventory.weapons.push(reward.id);
  if(reward.type==='uniform') p.inventory.uniforms.push(reward.id);
  setMapMessage(`宝箱を開けた！ ${reward.text} を手に入れた！`);
}

function checkTileEvent(){
  const p=state.player;
  const chest=state.chests.find(c=>!c.opened&&c.x===p.mapX&&c.y===p.mapY);
  if(chest){
    chest.opened=true;
    giveMapChestEquipment();
    seTreasure();
    drawMaze();
    return;
  }
  if(p.mapX===state.boss.x && p.mapY===state.boss.y){
    startBattle(cloneEnemy(enemies[3]),true);
    return;
  }
  if(Math.random()<0.18){
    const depth=Math.abs(p.mapX-1)+Math.abs(p.mapY-1);
    const enemy=depth<10?enemies[0]:(depth<18?enemies[Math.floor(Math.random()*2)]:enemies[Math.floor(Math.random()*3)]);
    startBattle(cloneEnemy(enemy),false);
  }else{
    setMapMessage('お屋敷を探索中...');
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
  document.getElementById('playerMp').textContent=`MP ${p.mp} / ${p.maxMp}`;
  document.getElementById('playerExp').textContent=`EXP ${p.exp} / ${p.nextExp}`;

  const status=document.querySelector('.status-panel h2');
  if(status) status.textContent=`${p.name} Lv.${p.lv}  攻${totalAtk()} 防${totalDef()}`;

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

  if(state.enemiesInBattle.length>1){
    setMessage(`${state.enemiesInBattle[0].name}たちが あらわれた！`);
  }else{
    setMessage(state.enemy.intro||`${state.enemy.name} が あらわれた！`);
  }

  startBgm(state.enemiesInBattle.some(e=>e.boss)?'boss':'battle');
}

function endBattleToMap(){
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
  setMapMessage('戦闘に勝利した！ 探索を続けよう。');
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
    addSubButton('もえもえぎゅー　MP5 / 敵に18〜22ダメージ',()=>useMagic('moe'));
    if(state.player.lv>=3) addSubButton('おいしくなーれ　MP8 / HP回復',()=>useMagic('heal'));
    if(state.player.lv>=10) addSubButton('にしきぬやまー　MP16 / 大ダメージ',()=>useMagic('nishiki'));
    if(state.player.lv>=6) addSubButton('しゅわしゅわー　MP12 / 敵全体ダメージ',()=>useMagic('shower'));
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
  current.innerHTML=`現在の装備<br>武器：${findWeapon(p.equip.weapon)?.name||'なし'}<br>頭：${findUniform(p.equip.head)?.name||'なし'}<br>胴：${findUniform(p.equip.body)?.name||'なし'}<br>脚：${findUniform(p.equip.legs)?.name||'なし'}<br><span class="equip-stat">攻撃 ${totalAtk()} / 防御 ${totalDef()}</span>`;
  body.appendChild(current);
  p.inventory.weapons.forEach(id=>{const w=findWeapon(id);if(w)addEquipButton(`武器：${w.name}　攻+${w.atk}`,()=>equipWeapon(w.id));});
  p.inventory.uniforms.forEach(id=>{const u=findUniform(id);if(u)addEquipButton(`${slotName(u.slot)}：${u.name}　防+${u.def}`,()=>equipUniform(u.id));});
  menu.classList.remove('hidden');
}
function addEquipButton(label,handler){
  const btn=document.createElement('button');
  btn.textContent=label;
  btn.onclick=handler;
  document.getElementById('equipMenuBody').appendChild(btn);
}
function closeEquipMenu(){const menu=document.getElementById('equipMenu');if(menu)menu.classList.add('hidden');}
function slotName(slot){return slot==='head'?'頭':slot==='body'?'胴':slot==='legs'?'脚':slot;}
function equipWeapon(id){state.player.equip.weapon=id;setMessage(`${findWeapon(id).name} を装備した！`);openEquipMenu();updateUI();}
function equipUniform(id){const item=findUniform(id);if(!item)return;state.player.equip[item.slot]=id;setMessage(`${item.name} を装備した！`);openEquipMenu();updateUI();}

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

async function playerAction(type){
  if(state.busy) return;
  closeSubMenu();closeEquipMenu();
  state.busy=true;setButtonsDisabled(true);
  const p=state.player;const e=currentEnemy();
  if(type==='attack'){
    const target=currentEnemy();
    const isCritical=Math.random()<0.10;
    const baseDamage=Math.max(1,totalAtk()+Math.floor(Math.random()*4));
    const damage=isCritical ? Math.floor(baseDamage*2.2) : baseDamage;
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
    await enemyTurn();
  }else if(type==='guard'){
    p.guarding=true;
    setMessage(`${p.name} は みをまもった！`);
    await sleep(650);await enemyTurn();
  }
  state.busy=false;setButtonsDisabled(false);updateUI();
}

async function useMagic(kind){
  if(state.busy) return;
  closeSubMenu();closeEquipMenu();
  state.busy=true;setButtonsDisabled(true);
  const p=state.player;

  if(kind==='moe'){
    if(p.mp<5){await failAction('MPがたりない！');return;}
    p.mp-=5;await showCutin('おまじない','もえもえぎゅー！！');
    const damage=25+Math.floor(Math.random()*6);
    await damageEnemy('もえもえぎゅー！！',damage);
  }else if(kind==='heal'){
    if(p.mp<8){await failAction('MPがたりない！');return;}
    p.mp-=8;await showCutin('おまじない','おいしくなーれ！');
    const heal=Math.min(35,p.maxHp-p.hp);p.hp+=heal;
    setMessage(`おいしくなーれ！ HPが ${heal} 回復！`);
    showDamage(-heal,'player');seHeal();updateUI();
    await sleep(750);await enemyTurn();
  }else if(kind==='nishiki'){
    if(p.mp<16){await failAction('MPがたりない！');return;}
    p.mp-=12;await showCutin('必殺おまじない','にしきぬやまー！！');screenFlash();
    const target=currentEnemy();
    const damage=target.boss?58:82;
    await damageEnemy('にしきぬやまー！！',damage);
  }else if(kind==='shower'){
    if(p.mp<12){await failAction('MPがたりない！');return;}
    p.mp-=16;await showCutin('全体おまじない','しゅわしゅわー！！');screenFlash();
    await damageAllEnemies('しゅわしゅわー！！',38);
  }
  state.busy=false;setButtonsDisabled(false);updateUI();
}

async function useItem(kind){
  if(state.busy) return;
  closeSubMenu();closeEquipMenu();
  state.busy=true;setButtonsDisabled(true);
  const p=state.player;const e=currentEnemy();
  if(kind==='omurice'){
    if(p.items.omurice<=0||p.hp>=p.maxHp){await failAction('オムライスは使えない！');return;}
    p.items.omurice--;
    const heal=Math.min(30,p.maxHp-p.hp);p.hp+=heal;
    setMessage(`オムライスを食べた！ HPが ${heal} 回復！`);
    showDamage(-heal,'player');seHeal();updateUI();
    await sleep(750);await enemyTurn();
  }else if(kind==='tea'){
    if(p.items.tea<=0||p.mp>=p.maxMp){await failAction('紅茶は使えない！');return;}
    p.items.tea--;
    const healMp=Math.min(10,p.maxMp-p.mp);p.mp+=healMp;
    setMessage(`紅茶を飲んだ！ MPが ${healMp} 回復！`);
    seHeal();updateUI();await sleep(750);await enemyTurn();
  }else if(kind==='horse'){
    if(p.items.horse<=0){await failAction('くろれきしは持っていない！');return;}
    p.items.horse--;
    const damage=e.boss?55:999;
    await damageEnemy('くろれきしを召喚した！',damage);
  }
  state.busy=false;setButtonsDisabled(false);updateUI();
}

async function failAction(message){
  setMessage(message);await sleep(700);
  state.busy=false;setButtonsDisabled(false);updateUI();
}

async function damageEnemy(message,damage){
  const target=currentEnemy();
  target.hp=Math.max(0,target.hp-damage);
  if(target.hp<=0) state.lastDefeatedEnemy=target;
  setMessage(`${message} ${target.name} に ${damage} ダメージ！`);
  showDamage(damage,'enemy');seMagic();enemyFlash();updateUI();
  await sleep(750);
  if(allEnemiesDefeated()){ await winBattle(); return; }
  await enemyTurn();
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
  await enemyTurn();
}

async function enemyTurn(){
  const p=state.player;
  const attackers=aliveEnemies();
  if(!attackers.length) return;

  for(const e of attackers){
    let damage=Math.max(1,e.atk-totalDef()+Math.floor(Math.random()*3));
    const isCritical=Math.random()<0.08;
    if(isCritical) damage=Math.floor(damage*2.0);
    if(p.guarding){damage=Math.max(1,Math.floor(damage/2));}

    p.hp=Math.max(0,p.hp-damage);
    if(isCritical){
      setMessage(`${e.name} の会心の一撃！ ${damage} ダメージ！`);
      criticalFlash();
      showDamage(damage,'player','enemy-critical-text');
    }else{
      setMessage(`${e.name} のこうげき！ ${damage} ダメージ！`);
      showDamage(damage,'player');
    }
    seHit();playerFlash();updateUI();
    await sleep(isCritical?1050:850);

    if(p.hp<=0){
      setMessage(`${p.name} は たおれてしまった… 「最初から」で再挑戦できます。`);
      setButtonsDisabled(true);state.busy=true;
      return;
    }
  }
  p.guarding=false;
}

function giveReward(enemyId){
  const p=state.player;

  // v27：敵からのドロップは「どうぐ」のみ
  // くろれきしはどうぐ扱いのレアドロップ
  const rareKurorekishi = Math.random() < 0.12;

  if(rareKurorekishi){
    p.items.horse += 1;
    setMessage('レアドロップ！ くろれきし を手に入れた！');
    return true;
  }

  if(enemyId==='teiji'){
    p.items.omurice += 1;
    setMessage('定時のご主人様が オムライス を落とした！');
    return true;
  }

  if(enemyId==='zangyo'){
    p.items.tea += 1;
    setMessage('残業のご主人様が 紅茶 を落とした！');
    return true;
  }

  if(enemyId==='shisseki'){
    p.items.omurice += 1;
    setMessage('叱責のご主人様が オムライス を落とした！');
    return true;
  }

  return false;
}

function treasureDrop(enemyId){
  const p=state.player;

  // v27：宝箱からのドロップは「装備品」のみ
  // 初代メイド服は装備品扱いのレアドロップ
  if(Math.floor(Math.random()*4)!==0) return false;

  const rareFirstMaid = Math.random() < 0.15;
  if(rareFirstMaid && !p.inventory.uniforms.includes('real6')){
    p.inventory.uniforms.push('real6');
    openTreasureMenu('レア装備！ 初代メイド服 を発見した！ 防御 +24');
    setMessage('宝箱からレア装備を入手！');
    return true;
  }

  const candidates=[];
  if(!p.inventory.weapons.includes('broom')) candidates.push({type:'weapon',id:'broom',text:'マジカルホーキ を発見した！ 攻撃 +5'});
  if(!p.inventory.weapons.includes('vacuum')) candidates.push({type:'weapon',id:'vacuum',text:'異国の掃除機 を発見した！ 攻撃 +9'});
  if(!p.inventory.uniforms.includes('apron')) candidates.push({type:'uniform',id:'apron',text:'純白エプロン を発見した！ 防御 +4'});
  if(!p.inventory.uniforms.includes('headband')) candidates.push({type:'uniform',id:'headband',text:'メイドカチューシャ を発見した！ 防御 +3'});

  if(!candidates.length) return false;

  const reward=candidates[Math.floor(Math.random()*candidates.length)];
  if(reward.type==='weapon') p.inventory.weapons.push(reward.id);
  if(reward.type==='uniform') p.inventory.uniforms.push(reward.id);

  openTreasureMenu(reward.text);
  setMessage('宝箱から装備品を入手！');
  return true;
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
    p.maxHp+=6;p.maxMp+=3;p.baseAtk+=2;p.baseDef+=1;p.hp=p.maxHp;p.mp=p.maxMp;
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
  setMessage('ご主人王をいやした！ ポ・トロに平和がもどった！');
  await sleep(900);
  document.getElementById('battleScreen').classList.add('hidden');
  document.getElementById('mapScreen').classList.add('hidden');
  document.getElementById('endingScreen').classList.remove('hidden');
  const cheki=document.getElementById('chekiTicket');
  cheki.classList.add('hidden');
  if(Math.random()<1/3){
    document.getElementById('endingMessage').textContent='ご主人王がチェキ券を落とした！';
    const issuedAt=document.getElementById('chekiIssuedAt');
    if(issuedAt) issuedAt.textContent=formatChekiIssuedAt(new Date());
    cheki.classList.remove('hidden');
    seCheki();
  }else{
    document.getElementById('endingMessage').textContent='ご主人王をいやした！ 一人前のメイドに近づいた！';
  }
}
function restartFromEnding(){
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
  initAudio();
  document.getElementById('titleScreen').classList.add('hidden');
  document.getElementById('openingScreen').classList.add('hidden');
  document.getElementById('endingScreen').classList.add('hidden');
  document.getElementById('battleScreen').classList.add('hidden');
  document.getElementById('mapScreen').classList.remove('hidden');
  state.player=makePlayer();
  state.player.name=getOshiName();
  state.busy=false;state.started=true;state.inBattle=false;
  setButtonsDisabled(false);
  makeMaze();
}
function resetGame(){
  closeSubMenu();closeEquipMenu();closeTreasureMenu();
  startGame();
}


/* ===== Opening ===== */
let openingTimer=null;
let openingCurrentIndex=0;
const OPENING_FADE_MS=600;
const OPENING_SHOW_MS=4000;

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
  active.style.opacity=0;
  setTimeout(()=>{
    active.innerHTML=lines[index];
    active.style.opacity=1;
  },OPENING_FADE_MS);
}

function startOpeningStory(){
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
  const title=document.getElementById('titleScreen');
  const opening=document.getElementById('openingScreen');
  const active=document.getElementById('openingStoryActive');
  if(openingTimer){
    clearInterval(openingTimer);
    openingTimer=null;
  }
  if(active){
    active.innerHTML='';
    active.style.opacity=0;
  }
  if(title) title.classList.add('hidden');
  if(opening) opening.classList.remove('hidden');
  setTimeout(startOpeningStory,4000);
}

function closeOpening(){
  const title=document.getElementById('titleScreen');
  const opening=document.getElementById('openingScreen');
  const active=document.getElementById('openingStoryActive');
  if(openingTimer){
    clearInterval(openingTimer);
    openingTimer=null;
  }
  if(active){
    active.innerHTML='';
    active.style.opacity=0;
  }
  if(opening) opening.classList.add('hidden');
  if(title) title.classList.remove('hidden');
}

/* ===== Events ===== */
document.getElementById('startBtn').addEventListener('click',startGame);
document.getElementById('openingBtn').addEventListener('click',openOpening);
document.getElementById('openingSkipBtn').addEventListener('click',closeOpening);
document.getElementById('restartBtn').addEventListener('click',resetGame);
document.getElementById('equipBtn').addEventListener('click',openEquipMenu);
document.getElementById('soundBtn').addEventListener('click',toggleSound);
document.getElementById('guideBtn').addEventListener('click',openGuide);
document.getElementById('guideCloseBtn').addEventListener('click',closeGuide);
document.getElementById('guideModal').addEventListener('click',function(e){if(e.target===this) closeGuide();});
document.getElementById('newMapBtn').addEventListener('click',makeMaze);
document.getElementById('endingRestartBtn').addEventListener('click',restartFromEnding);

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
  if(document.getElementById('mapScreen').classList.contains('hidden')) return;
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

