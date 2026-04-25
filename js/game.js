const enemies=[
  {id:'teiji',name:'定時のご主人様',hp:38,maxHp:38,atk:5,exp:14,image:'img/enemies/teiji.png',intro:'定時のご主人様が あらわれた！'},
  {id:'zangyo',name:'残業のご主人様',hp:66,maxHp:66,atk:8,exp:22,image:'img/enemies/zangyo.png',intro:'残業のご主人様が つかれた顔で あらわれた！'},
  {id:'shisseki',name:'叱責のご主人様',hp:92,maxHp:92,atk:11,exp:34,image:'img/enemies/shisseki.png',intro:'叱責のご主人様が ふるえながら あらわれた！'},
  {id:'boss',name:'ご主人王',hp:155,maxHp:155,atk:15,exp:100,image:'img/enemies/boss.png',boss:true,intro:'ご主人王が あらわれた！！'}
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
    {id:'replica6',slot:'body',name:'六代目メイド服(レプリカ)',def:12}
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
  inventory:{
    weapons:['duster'],
    uniforms:['stocking']
  },
  equip:{
    weapon:'duster',
    head:null,
    body:null,
    legs:'stocking'
  }
};

const state={
  player:makePlayer(),
  enemyIndex:0,
  enemy:null,
  busy:false,
  started:false
};

function makePlayer(){
  return JSON.parse(JSON.stringify(initialPlayer));
}


/* ===== v9 BGM・SE ===== */
const soundState={
  ctx:null,
  enabled:true,
  bgmTimer:null,
  bgmKind:null
};

function initAudio(){
  if(soundState.ctx) return soundState.ctx;
  try{
    soundState.ctx=new (window.AudioContext||window.webkitAudioContext)();
    return soundState.ctx;
  }catch(e){
    return null;
  }
}

function stopBgm(){
  if(soundState.bgmTimer){
    clearInterval(soundState.bgmTimer);
    soundState.bgmTimer=null;
  }
  soundState.bgmKind=null;
}

function toggleSound(){
  soundState.enabled=!soundState.enabled;
  const btn=document.getElementById('soundBtn');
  if(btn){
    btn.textContent=soundState.enabled?'音: ON':'音: OFF';
    btn.classList.toggle('sound-off',!soundState.enabled);
  }
  if(!soundState.enabled) stopBgm();
  else if(state.enemy) startBgm(state.enemy.boss?'boss':'battle');
}

function tone(freq,duration,type='square',gain=0.08,delay=0){
  if(!soundState.enabled) return;
  const ctx=initAudio();
  if(!ctx) return;
  const osc=ctx.createOscillator();
  const g=ctx.createGain();
  osc.type=type;
  osc.frequency.value=freq;
  g.gain.setValueAtTime(gain,ctx.currentTime+delay);
  g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+delay+duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(ctx.currentTime+delay);
  osc.stop(ctx.currentTime+delay+duration);
}

function playSeq(notes){
  let t=0;
  notes.forEach(n=>{
    if(n.f>0) tone(n.f,n.d,n.type||'square',n.g||0.08,t);
    t+=n.wait||n.d;
  });
}

function seAttack(){
  playSeq([{f:520,d:.06,g:.09},{f:260,d:.08,g:.08}]);
}

function seHit(){
  playSeq([{f:110,d:.09,type:'sawtooth',g:.08},{f:85,d:.08,type:'sawtooth',g:.06}]);
}

function seHeal(){
  playSeq([
    {f:523,d:.08,type:'sine',g:.08},
    {f:659,d:.08,type:'sine',g:.08},
    {f:784,d:.12,type:'sine',g:.08}
  ]);
}

function seMagic(){
  playSeq([
    {f:740,d:.07,type:'triangle',g:.07},
    {f:988,d:.07,type:'triangle',g:.07},
    {f:1175,d:.12,type:'triangle',g:.07}
  ]);
}

function seTreasure(){
  playSeq([
    {f:659,d:.08,type:'sine',g:.08},
    {f:784,d:.08,type:'sine',g:.08},
    {f:988,d:.12,type:'sine',g:.09}
  ]);
}

function seLevelUp(){
  playSeq([
    {f:523,d:.09,type:'sine',g:.08},
    {f:659,d:.09,type:'sine',g:.08},
    {f:784,d:.09,type:'sine',g:.08},
    {f:1046,d:.18,type:'sine',g:.08}
  ]);
}

function seVictory(){
  playSeq([
    {f:392,d:.12,type:'triangle',g:.08},
    {f:523,d:.12,type:'triangle',g:.08},
    {f:659,d:.12,type:'triangle',g:.08},
    {f:784,d:.2,type:'triangle',g:.08}
  ]);
}

function seCheki(){
  playSeq([
    {f:880,d:.08,type:'sine',g:.09},
    {f:1175,d:.08,type:'sine',g:.09},
    {f:1568,d:.18,type:'sine',g:.09}
  ]);
}

function startBgm(kind){
  if(!soundState.enabled) return;
  if(soundState.bgmKind===kind) return;
  stopBgm();
  soundState.bgmKind=kind;

  const battle=[
    {f:196,d:.1,g:.035},{f:0,d:.04},{f:247,d:.1,g:.035},{f:0,d:.04},
    {f:294,d:.1,g:.035},{f:247,d:.1,g:.035},
    {f:330,d:.12,type:'triangle',g:.03},{f:294,d:.12,type:'triangle',g:.03}
  ];

  const boss=[
    {f:147,d:.13,g:.04},{f:196,d:.13,g:.04},{f:220,d:.13,g:.04},
    {f:247,d:.13,g:.04},{f:294,d:.18,type:'sawtooth',g:.035},
    {f:247,d:.12,type:'sawtooth',g:.035}
  ];

  function loop(){
    playSeq(kind==='boss'?boss:battle);
  }

  loop();
  soundState.bgmTimer=setInterval(loop,kind==='boss'?1100:1200);
}

function cloneEnemy(base){return JSON.parse(JSON.stringify(base));}
function currentEnemy(){return state.enemy;}

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
  if(status) status.textContent=`${p.name} Lv.${p.lv}  攻${totalAtk()} 防${totalDef()}`;

  document.body.classList.toggle('boss-battle',!!e.boss);
}

function setMessage(text){document.getElementById('messageText').textContent=text;}

function setButtonsDisabled(disabled){
  document.querySelectorAll('.command-panel button,.sub-menu-body button,.mini-btn,.sub-btn').forEach(btn=>{
    if(btn.id!=='restartBtn') btn.disabled=disabled;
  });
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
  screenShake();
  const img=document.getElementById('enemyImage');
  img.classList.remove('hit');
  void img.offsetWidth;
  img.classList.add('hit');
}

function playerFlash(){
  screenShake();
  const panel=document.querySelector('.status-panel');
  panel.classList.remove('player-hit');
  void panel.offsetWidth;
  panel.classList.add('player-hit');
}

function bossEntrance(){
  screenShake();
  screenFlash();
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
  if(!overlay || !titleEl || !textEl) return Promise.resolve();

  titleEl.textContent=title;
  textEl.textContent=text;
  overlay.classList.remove('hidden');
  void overlay.offsetWidth;

  return new Promise(resolve=>{
    setTimeout(()=>{
      overlay.classList.add('hidden');
      resolve();
    },760);
  });
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

function startGame(){
  initAudio();
  document.getElementById('titleScreen').classList.add('hidden');
  document.getElementById('battleScreen').classList.remove('hidden');
  state.started=true;
  resetGame();
}

function resetGame(){
  state.player=makePlayer();
  state.enemyIndex=0;
  state.busy=false;
  closeSubMenu();
  closeEquipMenu();
  setButtonsDisabled(false);
  startBattle(0);
}

function startBattle(index){
  state.enemyIndex=index;
  state.enemy=cloneEnemy(enemies[index]);
  state.player.guarding=false;
  closeSubMenu();
  closeEquipMenu();
  updateUI();

  if(state.enemy.boss) bossEntrance();
  setMessage(state.enemy.intro);
  startBgm(state.enemy.boss?'boss':'battle');
}

function openSubMenu(kind){
  if(state.busy) return;
  closeEquipMenu();
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

function openEquipMenu(){
  if(state.busy) return;
  closeSubMenu();
  const menu=document.getElementById('equipMenu');
  const body=document.getElementById('equipMenuBody');
  const p=state.player;
  body.innerHTML='';

  const current=document.createElement('div');
  current.className='equip-current';
  current.innerHTML=
    `現在の装備<br>`+
    `武器：${findWeapon(p.equip.weapon)?.name||'なし'}<br>`+
    `頭：${findUniform(p.equip.head)?.name||'なし'}<br>`+
    `胴：${findUniform(p.equip.body)?.name||'なし'}<br>`+
    `脚：${findUniform(p.equip.legs)?.name||'なし'}<br>`+
    `<span class="equip-stat">攻撃 ${totalAtk()} / 防御 ${totalDef()}</span>`;
  body.appendChild(current);

  p.inventory.weapons.forEach(id=>{
    const w=findWeapon(id);
    if(w) addEquipButton(`武器：${w.name}　攻+${w.atk}`,()=>equipWeapon(w.id));
  });

  p.inventory.uniforms.forEach(id=>{
    const u=findUniform(id);
    if(u) addEquipButton(`${slotName(u.slot)}：${u.name}　防+${u.def}`,()=>equipUniform(u.id));
  });

  menu.classList.remove('hidden');
  seTreasure();
}

function addEquipButton(label,handler){
  const btn=document.createElement('button');
  btn.textContent=label;
  btn.onclick=handler;
  document.getElementById('equipMenuBody').appendChild(btn);
}

function closeEquipMenu(){
  const menu=document.getElementById('equipMenu');
  if(menu) menu.classList.add('hidden');
}

function slotName(slot){
  if(slot==='head') return '頭';
  if(slot==='body') return '胴';
  if(slot==='legs') return '脚';
  return slot;
}

function equipWeapon(id){
  state.player.equip.weapon=id;
  setMessage(`${findWeapon(id).name} を装備した！`);
  openEquipMenu();
  updateUI();
}

function equipUniform(id){
  const item=findUniform(id);
  if(!item) return;
  state.player.equip[item.slot]=id;
  setMessage(`${item.name} を装備した！`);
  openEquipMenu();
  updateUI();
}

async function playerAction(type){
  if(state.busy) return;
  closeSubMenu();
  closeEquipMenu();
  state.busy=true;
  setButtonsDisabled(true);

  const p=state.player;
  const e=currentEnemy();

  if(type==='attack'){
    const damage=Math.max(1,totalAtk()+Math.floor(Math.random()*4));
    e.hp=Math.max(0,e.hp-damage);
    setMessage(`${e.name} に ${damage} ダメージ！`);
    showDamage(damage,'enemy');
    seAttack();
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
  closeEquipMenu();
  state.busy=true;
  setButtonsDisabled(true);

  const p=state.player;
  const e=currentEnemy();

  if(kind==='moe'){
    if(p.mp<5){ await failAction('MPがたりない！'); return; }
    p.mp-=5;
    await showCutin('おまじない','もえもえぎゅー！！');
    const damage=18+Math.floor(Math.random()*5);
    await damageEnemy(`もえもえぎゅー！！`,damage);
  }else if(kind==='heal'){
    if(p.mp<8){ await failAction('MPがたりない！'); return; }
    p.mp-=8;
    await showCutin('おまじない','おいしくなーれ！');
    const heal=Math.min(35,p.maxHp-p.hp);
    p.hp+=heal;
    setMessage(`おいしくなーれ！ HPが ${heal} 回復！`);
    showDamage(-heal,'player');
    seHeal();
    updateUI();
    await sleep(750);
    await enemyTurn();
  }else if(kind==='nishiki'){
    if(p.mp<12){ await failAction('MPがたりない！'); return; }
    p.mp-=12;
    await showCutin('必殺おまじない','にしきぬやまー！！');
    screenFlash();
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
  closeEquipMenu();
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
    seHeal();
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
  seMagic();
  enemyFlash();
  updateUI();
  await sleep(750);
  if(e.hp<=0){ await winBattle(); return; }
  await enemyTurn();
}

async function enemyTurn(){
  const p=state.player;
  const e=currentEnemy();

  let damage=Math.max(1,e.atk-totalDef()+Math.floor(Math.random()*3));
  if(p.guarding){
    damage=Math.max(1,Math.floor(damage/2));
    p.guarding=false;
  }

  p.hp=Math.max(0,p.hp-damage);
  setMessage(`${e.name} のこうげき！ ${damage} ダメージ！`);
  showDamage(damage,'player');
  seHit();
  playerFlash();
  updateUI();
  await sleep(850);

  if(p.hp<=0){
    setMessage(`${p.name} は たおれてしまった… 「最初から」で再挑戦できます。`);
    setButtonsDisabled(true);
    state.busy=true;
  }
}



function openTreasureMenu(rewardText){
  const menu=document.getElementById('treasureMenu');
  const body=document.getElementById('treasureMenuBody');
  if(!menu || !body) return;

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
}

function closeTreasureMenu(){
  const menu=document.getElementById('treasureMenu');
  if(menu) menu.classList.add('hidden');
}

function treasureDrop(enemyId){
  const p=state.player;

  // ボス前の特別宝箱
  if(enemyId==='shisseki'){
    if(!p.inventory.uniforms.includes('real6')){
      p.inventory.uniforms.push('real6');
      equipmentData.uniforms.push({
        id:'real6',
        slot:'body',
        name:'六代目メイド服（本物）',
        def:24
      });
      openTreasureMenu('六代目メイド服（本物） を発見した！ 防御 +24');
      setMessage('伝説の宝箱を開けた！');
      return true;
    }
  }

  // 通常宝箱（約1/4）
  const roll=Math.floor(Math.random()*4);
  if(roll!==0) return false;

  // レア枠
  const rareRoll=Math.floor(Math.random()*8);

  if(rareRoll===0){
    if(!p.inventory.weapons.includes('vacuum')){
      p.inventory.weapons.push('vacuum');
      openTreasureMenu('異国の掃除機 を発見した！ 攻撃 +9');
      setMessage('宝箱からレア装備が出た！');
      return true;
    }
  }

  if(rareRoll<=2){
    p.items.horse += 1;
    openTreasureMenu('くろれきし を発見した！');
    setMessage('宝箱から特殊アイテムを入手！');
    return true;
  }

  p.items.omurice += 1;
  openTreasureMenu('オムライス を発見した！');
  setMessage('宝箱から回復アイテムを入手！');
  return true;
}


function giveReward(enemyId){
  const p=state.player;
  if(enemyId==='teiji'){
    if(!p.inventory.weapons.includes('broom')) p.inventory.weapons.push('broom');
    setMessage('マジカルホーキを手に入れた！');
    return true;
  }
  if(enemyId==='zangyo'){
    if(!p.inventory.uniforms.includes('apron')) p.inventory.uniforms.push('apron');
    setMessage('純白エプロンを手に入れた！');
    return true;
  }
  if(enemyId==='shisseki'){
    if(!p.inventory.uniforms.includes('headband')) p.inventory.uniforms.push('headband');
    if(!p.inventory.uniforms.includes('replica6')) p.inventory.uniforms.push('replica6');
    setMessage('メイドカチューシャと六代目メイド服(レプリカ)を手に入れた！');
    return true;
  }
  return false;
}

async function winBattle(){
  const p=state.player;
  const e=currentEnemy();

  victoryEffect();
  seVictory();
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
    p.baseAtk+=2;
    p.baseDef+=1;
    p.hp=p.maxHp;
    p.mp=p.maxMp;
    seLevelUp();
    showLevelToast(`LEVEL UP！ Lv.${p.lv}`);
    setMessage(`${p.name} は レベル ${p.lv} に あがった！`);
    updateUI();
    await sleep(1200);
  }

  if(giveReward(e.id)){
    updateUI();
    await sleep(1300);
  }

  if(treasureDrop(e.id)){
    updateUI();
    await sleep(1200);
  }

  if(state.enemyIndex+1<enemies.length){
    startBattle(state.enemyIndex+1);
    state.busy=false;
    setButtonsDisabled(false);
  }else{
    await showEnding();
  }
}


async function showEnding(){
  stopBgm();
  setButtonsDisabled(true);
  state.busy=true;
  setMessage('ご主人王をいやした！ ポ・トロに平和がもどった！');
  await sleep(900);

  document.getElementById('battleScreen').classList.add('hidden');
  document.getElementById('endingScreen').classList.remove('hidden');

  const cheki=document.getElementById('chekiTicket');
  cheki.classList.add('hidden');

  // チェキ券ドロップ率：仮で 1/3。運用時に調整可能。
  const drop=Math.random()<1/3;

  if(drop){
    document.getElementById('endingMessage').textContent='ご主人王がチェキ券を落とした！';
    cheki.classList.remove('hidden');
    seCheki();
  }else{
    document.getElementById('endingMessage').textContent='ご主人王をいやした！ 一人前のメイドに近づいた！';
  }
}

function restartFromEnding(){
  document.getElementById('endingScreen').classList.add('hidden');
  document.getElementById('titleScreen').classList.remove('hidden');
  document.getElementById('chekiTicket').classList.add('hidden');
  state.busy=false;
  state.started=false;
}



function openGuide(){
  const modal=document.getElementById('guideModal');
  if(modal) modal.classList.remove('hidden');
}

function closeGuide(){
  const modal=document.getElementById('guideModal');
  if(modal) modal.classList.add('hidden');
}


document.getElementById('startBtn').addEventListener('click',startGame);
document.getElementById('restartBtn').addEventListener('click',resetGame);
document.getElementById('equipBtn').addEventListener('click',openEquipMenu);

document.getElementById('endingRestartBtn').addEventListener('click',restartFromEnding);

document.getElementById('soundBtn').addEventListener('click',toggleSound);

document.getElementById('guideBtn').addEventListener('click',openGuide);
document.getElementById('guideCloseBtn').addEventListener('click',closeGuide);
document.getElementById('guideModal').addEventListener('click',function(e){
  if(e.target===this) closeGuide();
});
