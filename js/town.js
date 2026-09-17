/* Town progression is separate from the retained dungeon state. */
const POTORO_TOWN = {
  width:15,height:13,tile:32,
  buildings:[
    {id:'manor',name:'お屋敷',x:1,y:1,w:5,h:3,roof:'#b64776',door:{x:3,y:4}},
    {id:'rest',name:'休憩室',x:9,y:1,w:4,h:3,roof:'#45669b',door:{x:11,y:4}},
    {id:'cafe',name:'メイド喫茶',x:1,y:7,w:4,h:3,roof:'#26887d',door:{x:3,y:10}}
  ],
  places:[
    {id:'plaza',name:'町の広場',door:{x:6,y:7}},
    {id:'exit',name:'町の出口',door:{x:13,y:6}}
  ],
  menu:[{id:'omurice',price:10},{id:'tea',price:8},{id:'cool_tea',price:12}],
  trees:[{x:1,y:5},{x:13,y:2},{x:1,y:11},{x:13,y:11}]
};
let townDialogReturnFocus = null;

function startTown(){
  state.town = {x:7,y:10,lastMoveAt:0};
  state.field = null;
  state.player.townCoins = 30;
  showTown(`ようこそ、${state.player.name}！ ポ・トロの町に、今日もお給仕の時間が訪れました。`);
}

function showTown(message='おかえりなさい。ポ・トロの町は、今日もあなたを待っていました。'){
  if(state.inBattle) return;
  closeTownDialog();
  closeSubMenu();
  closeEquipMenu();
  closeTreasureMenu();
  hideElement('mapScreen');
  hideElement('battleScreen');
  hideElement('endingScreen');
  hideElement('fieldScreen');
  state.location = 'town';
  state.busy = false;
  showElement('townScreen');
  document.getElementById('townMessage').textContent = message;
  playBgm('bgmMap1F');
  drawTown();
  updateTownStatus();
}

function requestReturnToTown(){
  if(state.inBattle || state.busy || document.getElementById('mapScreen').classList.contains('hidden')) return;
  openMapChoiceModal({
    title:'お屋敷の外へ',
    message:'いったん外へ出ますか？ 探索の続きには、この場所から戻れます。',
    primaryText:'外へ出る',
    onPrimary:() => showField('manor')
  });
}

function awardTownCoins(defeatedEnemies){
  const coins = defeatedEnemies.filter(enemy => !enemy.boss && !enemy.helper).length * 5;
  state.player.townCoins = (state.player.townCoins || 0) + coins;
  return coins;
}

function townPlaceAt(x,y){
  return [...POTORO_TOWN.buildings,...POTORO_TOWN.places].find(place => place.door.x === x && place.door.y === y);
}

function townTileBlocked(x,y){
  if(x < 1 || y < 1 || x >= POTORO_TOWN.width-1 || y >= POTORO_TOWN.height-1) return true;
  if(POTORO_TOWN.buildings.some(b => x >= b.x && x < b.x+b.w && y >= b.y && y < b.y+b.h)) return true;
  if(POTORO_TOWN.trees.some(tree => tree.x === x && tree.y === y)) return true;
  return (x >= 9 && x <= 11 && y >= 9 && y <= 10) || (x === 7 && y === 5) || (x === 6 && y === 6 && !state.player.companion);
}

function moveTownPlayer(dx,dy){
  if(state.location !== 'town' || state.busy || state.inBattle) return;
  if(document.getElementById('townScreen').classList.contains('hidden')) return;
  if(!document.getElementById('equipMenu')?.classList.contains('hidden')) return;
  if(Math.abs(dx)+Math.abs(dy) !== 1) return;
  const now = Date.now();
  if(now - state.town.lastMoveAt < 130) return;
  state.town.lastMoveAt = now;
  const x = state.town.x+dx;
  const y = state.town.y+dy;
  if(townTileBlocked(x,y)) return;
  state.town.x = x;
  state.town.y = y;
  drawTown();
  updateTownStatus();
  const place = townPlaceAt(x,y);
  if(place) visitTownPlace(place.id);
}

function updateTownStatus(){
  updateCompanionUI();
  const p = state.player;
  document.getElementById('townCoins').textContent = p.townCoins || 0;
  document.getElementById('townPlayerName').textContent = `${p.name} Lv.${p.lv}`;
  document.getElementById('townHp').textContent = `HP ${p.hp}/${p.maxHp}`;
  document.getElementById('townTp').textContent = `TP ${p.mp}/${p.maxMp}`;
  document.getElementById('townSoundBtn').textContent = soundState.enabled ? '音: ON' : '音: OFF';
  const place = state.town && townPlaceAt(state.town.x,state.town.y);
  const btn = document.getElementById('townVisitBtn');
  btn.disabled = !place;
  btn.textContent = place ? (place.id === 'plaza' ? '話す' : place.id === 'exit' ? '出発する' : '入る') : '訪ねる';
}

function openTownDialog(title,text){
  townDialogReturnFocus = document.activeElement;
  document.getElementById('townDialogTitle').textContent = title;
  document.getElementById('townDialogText').textContent = text;
  document.getElementById('townDialogBody').replaceChildren();
  state.busy = true;
  showElement('townDialog');
  document.getElementById('townDialogClose').focus();
}

function closeTownDialog(){
  hideElement('townDialog');
  if(state.location === 'town' || state.location === 'field') state.busy = false;
  townDialogReturnFocus?.focus();
  townDialogReturnFocus = null;
}

function townDialogAction(label,action){
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.onclick = action;
  document.getElementById('townDialogBody').appendChild(btn);
  return btn;
}

function visitTownPlace(id){
  if(state.location !== 'town' || state.busy || state.inBattle) return;
  const place = townPlaceAt(state.town.x,state.town.y);
  if(!place || place.id !== id) return;
  if(id === 'manor'){
    openTownDialog('お屋敷「ポ・トロ」','「お帰りなさい。奥のお屋敷で、ご主人様たちが困っているの。どうか、あなたのお給仕でいやしてあげて。」');
    townDialogAction('郊外へ出発',leaveTownForField);
  }else if(id === 'rest'){
    openTownDialog('メイドさんの休憩室','「お疲れさま。温かい飲み物を用意したよ。少し休んでいかない？」');
    townDialogAction('ひと休みする',() => {
      const p = state.player;
      p.hp = p.maxHp;
      p.mp = p.maxMp;
      clearPlayerTemporaryState();
      p.buffs = {};
      p.itemBuffs = {};
      syncCompanionLevel(true);
      updateUI();
      updateTownStatus();
      document.getElementById('townDialogText').textContent = 'ゆっくり休んで、元気が戻った！ HP・TPが全回復し、状態異常も治った。';
      seHeal();
    });
  }else if(id === 'cafe'){
    openTownDialog('メイド喫茶','「いらっしゃいませ！ 探索のおともに、お持ち帰りのお食事はいかがですか？」');
    renderTownCafe();
  }else if(id === 'plaza'){
    openTownDialog('町の広場',state.player.companion
      ? 'こはるは隣でほほえんだ。「次のお給仕も、一緒に頑張ろうね。疲れたら休憩室に寄っていこう。」'
      : '「私はこはる。ご主人様たちのお役に立ちたいの。一緒にお給仕に行ってもいい？」');
    if(!state.player.companion) townDialogAction('一緒にお給仕する',recruitCompanion);
  }else if(id === 'exit'){
    openTownDialog('町の出口','門の向こうに、川沿いの道が続いている。お屋敷へ向かいますか？');
    townDialogAction('郊外へ出発',leaveTownForField);
  }
}

function renderTownCafe(){
  const body = document.getElementById('townDialogBody');
  const focusedItem = document.activeElement?.dataset.townBuy;
  body.replaceChildren();
  const wallet = document.createElement('p');
  wallet.className = 'town-cafe-wallet';
  wallet.textContent = `お給仕コイン ${state.player.townCoins || 0}枚`;
  body.appendChild(wallet);
  POTORO_TOWN.menu.forEach(entry => {
    const item = POTORO_ITEMS[entry.id];
    const btn = townDialogAction('',() => buyTownItem(entry.id));
    btn.className = 'town-shop-item';
    btn.dataset.townBuy = entry.id;
    const name = document.createElement('strong');
    name.textContent = item.name;
    const detail = document.createElement('span');
    detail.textContent = `${entry.price}コイン / 所持${state.player.items[entry.id] || 0}`;
    const effect = document.createElement('small');
    effect.textContent = item.label.replace(item.name,'').trim();
    btn.append(name,detail,effect);
    btn.disabled = (state.player.townCoins || 0) < entry.price || !canAddItem(entry.id,1);
    if(focusedItem === entry.id && !btn.disabled) btn.focus();
  });
  if(focusedItem && !body.contains(document.activeElement)) document.getElementById('townDialogClose').focus();
}

function buyTownItem(id){
  if(state.location !== 'town' || !state.busy || document.getElementById('townDialogTitle').textContent !== 'メイド喫茶') return;
  const entry = POTORO_TOWN.menu.find(item => item.id === id);
  if(!entry) return;
  const p = state.player;
  if((p.townCoins || 0) < entry.price || !canAddItem(id,1)) return;
  p.townCoins -= entry.price;
  p.items[id] = (p.items[id] || 0)+1;
  document.getElementById('townDialogText').textContent = `「ありがとうございます！」 ${POTORO_ITEMS[id].name}を1つ受け取った。`;
  updateTownStatus();
  renderTownCafe();
  seTreasure();
}

function drawTown(){
  const canvas = document.getElementById('townCanvas');
  if(!canvas || !state.town) return;
  const ctx = canvas.getContext('2d');
  const s = POTORO_TOWN.tile;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let y=0;y<POTORO_TOWN.height;y++){
    for(let x=0;x<POTORO_TOWN.width;x++){
      const path = x === 7 || y === 6 || (x === 3 && y >= 4 && y <= 11) || (y === 11 && x >= 3 && x <= 7) || (x === 11 && y >= 4 && y <= 6);
      ctx.fillStyle = path ? '#c7cdd1' : (x+y)%2 ? '#398a68' : '#3e9270';
      ctx.fillRect(x*s,y*s,s,s);
      ctx.fillStyle = path ? '#aebbc1' : '#70ab79';
      ctx.fillRect(x*s+7,y*s+22,path ? 18 : 3,2);
      ctx.fillRect(x*s+23,y*s+8,3,2);
    }
  }
  ctx.fillStyle = '#5b7870';
  ctx.fillRect(0,0,canvas.width,7);
  ctx.fillRect(0,canvas.height-7,canvas.width,7);
  ctx.fillRect(0,0,7,canvas.height);
  ctx.fillRect(canvas.width-7,0,7,canvas.height);
  POTORO_TOWN.buildings.forEach(b => drawTownBuilding(ctx,b,s));
  const trees = [...POTORO_TOWN.trees];
  for(let x=1;x<14;x+=2) trees.push({x,y:0},{x,y:12});
  trees.forEach(tree => {
    const x = tree.x*s,y = tree.y*s;
    ctx.fillStyle = '#715d64';ctx.fillRect(x+13,y+19,6,12);
    ctx.fillStyle = '#185b51';ctx.fillRect(x+4,y+8,24,16);ctx.fillRect(x+9,y+1,14,8);
    ctx.fillStyle = '#529f77';ctx.fillRect(x+7,y+8,7,7);
  });
  ctx.fillStyle = '#748c92';ctx.fillRect(9*s-3,9*s-3,3*s+6,2*s+6);
  ctx.fillStyle = '#3ba1b0';ctx.fillRect(9*s,9*s,3*s,2*s);
  ctx.fillStyle = '#a4e3e5';
  for(let i=0;i<4;i++) ctx.fillRect(9*s+12+i*19,9*s+13+(i%2)*24,12,3);
  ctx.fillStyle = '#788c91';ctx.fillRect(7*s+2,5*s+2,s-4,s-4);
  ctx.fillStyle = '#9fdae1';ctx.fillRect(7*s+7,5*s+7,s-14,s-14);
  ctx.fillStyle = '#e65d9c';
  [[5,5],[9,7],[8,11],[12,4],[5,10]].forEach(([x,y]) => {
    ctx.fillRect(x*s+9,y*s+10,5,5);ctx.fillRect(x*s+20,y*s+20,5,5);
  });
  if(!state.player.companion) drawMapPlayer(ctx,s,{x:6,y:6});
  ctx.fillStyle = '#132d33';ctx.fillRect(5*s+17,6*s-14,2*s+13,18);
  ctx.fillStyle = '#fff';ctx.font = '13px sans-serif';ctx.textAlign = 'center';ctx.textBaseline = 'middle';
  ctx.fillText('町の広場',6*s+s/2,6*s-5);
  ctx.fillStyle = '#243943';ctx.fillRect(12*s+1,5*s+4,2*s-3,22);
  ctx.fillStyle = '#fff';ctx.fillText('お屋敷 →',13*s,5*s+15);
  drawCompanionOnMap(ctx,s,state.town,(x,y)=>!townTileBlocked(x,y) && !townPlaceAt(x,y));
  drawMapPlayer(ctx,s,{x:state.town.x,y:state.town.y});
}

function drawTownBuilding(ctx,b,s){
  const x=b.x*s,y=b.y*s,w=b.w*s,h=b.h*s;
  ctx.fillStyle = 'rgba(15,30,40,.2)';ctx.fillRect(x+5,y+5,w,h);
  ctx.fillStyle = '#e9eef0';ctx.fillRect(x+3,y+26,w-6,h-26);
  ctx.fillStyle = '#bdcbd0';ctx.fillRect(x+3,y+h-9,w-6,9);
  ctx.fillStyle = b.roof;ctx.fillRect(x-2,y+5,w+4,30);ctx.fillRect(x+6,y,w-12,5);
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  for(let i=8;i<w;i+=16) ctx.fillRect(x+i,y+6,2,25);
  ctx.fillStyle = '#192a36';ctx.fillRect(x+8,y+12,w-16,19);
  ctx.fillStyle = '#fff';ctx.font = '16px sans-serif';ctx.textAlign = 'center';ctx.textBaseline = 'middle';
  ctx.fillText(b.name,x+w/2,y+21);
  ctx.fillStyle = '#397f98';ctx.fillRect(x+14,y+49,23,23);ctx.fillRect(x+w-37,y+49,23,23);
  ctx.fillStyle = '#b9e6e8';ctx.fillRect(x+18,y+53,7,7);ctx.fillRect(x+w-33,y+53,7,7);
  ctx.fillStyle = '#394755';ctx.fillRect(b.door.x*s+5,y+h-28,s-10,28);
  ctx.fillStyle = '#f6d884';ctx.fillRect(b.door.x*s+s-12,y+h-15,3,3);
  ctx.fillStyle = '#e2dee9';ctx.fillRect(b.door.x*s,b.door.y*s,s,8);
}

function bindTownEvents(){
  document.querySelectorAll('[data-town-move]').forEach(btn => {
    btn.addEventListener('click',() => {
      const deltas = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
      moveTownPlayer(...deltas[btn.dataset.townMove]);
    });
  });
  document.getElementById('townVisitBtn').onclick = () => {
    const place = townPlaceAt(state.town.x,state.town.y);
    if(place) visitTownPlace(place.id);
  };
  document.getElementById('townEquipBtn').onclick = openEquipMenu;
  document.getElementById('townSoundBtn').onclick = () => { toggleSound(); updateTownStatus(); };
  document.getElementById('townDialogClose').onclick = closeTownDialog;
  document.getElementById('mapTownBtn').onclick = requestReturnToTown;
  document.addEventListener('keydown',event => {
    if(state.location !== 'town' && state.location !== 'field') return;
    const dialog = document.getElementById('townDialog');
    if(!dialog.classList.contains('hidden')){
      if(event.key === 'Escape'){ event.preventDefault(); closeTownDialog(); }
      if(event.key === 'Tab'){
        const buttons = [...dialog.querySelectorAll('button:not(:disabled)')];
        const first = buttons[0],last = buttons[buttons.length-1];
        if(!buttons.includes(document.activeElement)){ event.preventDefault(); first.focus(); }
        else if(event.shiftKey && document.activeElement === first){ event.preventDefault(); last.focus(); }
        else if(!event.shiftKey && document.activeElement === last){ event.preventDefault(); first.focus(); }
      }
      return;
    }
    if(state.location !== 'town') return;
    const deltas = {ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
    if(deltas[event.key]){ event.preventDefault(); moveTownPlayer(...deltas[event.key]); }
  });
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',bindTownEvents,{once:true});
else bindTownEvents();
