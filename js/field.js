/* Field positions never overwrite the retained dungeon coordinates. */
const POTORO_FIELD = {
  width:15,height:13,tile:32,
  buildings:[
    {id:'town',name:'ポ・トロの町',x:1,y:7,w:4,h:2,roof:'#26887d',door:{x:3,y:9}},
    {id:'manor',name:'お屋敷',x:10,y:1,w:4,h:3,roof:'#b64776',door:{x:12,y:4}}
  ],
  trees:[{x:2,y:2},{x:3,y:2},{x:4,y:2},{x:2,y:3},{x:5,y:4},{x:9,y:8},{x:12,y:9},{x:11,y:10}]
};

function leaveTownForField(){
  if(state.location !== 'town' || state.inBattle) return;
  showField('town');
}

function showField(from){
  if(state.inBattle) return;
  closeTownDialog();closeSubMenu();closeEquipMenu();closeTreasureMenu();
  const entry=POTORO_FIELD.buildings.find(place=>place.id===from);
  if(!entry) return;
  state.field={...entry.door,lastMoveAt:0};
  state.location='field';state.busy=false;
  hideElement('townScreen');hideElement('mapScreen');hideElement('battleScreen');hideElement('endingScreen');
  showElement('fieldScreen');
  document.getElementById('fieldMessage').textContent=from==='town'
    ? '町を出ると、川のせせらぎが聞こえた。橋の向こうに、お屋敷の屋根が見える。'
    : 'お屋敷の外に出た。川の向こうには、ポ・トロの町の灯りが見える。';
  drawField();updateFieldStatus();playMapBgm();
  document.getElementById('fieldVisitBtn').focus();
}

function fieldPlaceAt(x,y){
  return POTORO_FIELD.buildings.find(place=>place.door.x===x && place.door.y===y);
}

function fieldTileBlocked(x,y){
  if(x<1 || y<1 || x>=POTORO_FIELD.width-1 || y>=POTORO_FIELD.height-1) return true;
  if(x===7 && y!==6) return true;
  if(POTORO_FIELD.buildings.some(b=>x>=b.x && x<b.x+b.w && y>=b.y && y<b.y+b.h)) return true;
  return POTORO_FIELD.trees.some(tree=>tree.x===x && tree.y===y);
}

function moveFieldPlayer(dx,dy){
  if(state.location!=='field' || state.busy || state.inBattle) return;
  if(document.getElementById('fieldScreen').classList.contains('hidden')) return;
  if(!document.getElementById('equipMenu').classList.contains('hidden')) return;
  if(Math.abs(dx)+Math.abs(dy)!==1) return;
  const now=Date.now();
  if(now-state.field.lastMoveAt<130) return;
  state.field.lastMoveAt=now;
  const x=state.field.x+dx,y=state.field.y+dy;
  if(fieldTileBlocked(x,y)) return;
  state.field.x=x;state.field.y=y;
  drawField();updateFieldStatus();
  const place=fieldPlaceAt(x,y);
  if(place) visitFieldPlace(place.id);
}

function updateFieldStatus(){
  const p=state.player;
  document.getElementById('fieldPlayerName').textContent=`${p.name} Lv.${p.lv}`;
  document.getElementById('fieldHp').textContent=`HP ${p.hp}/${p.maxHp}`;
  document.getElementById('fieldTp').textContent=`TP ${p.mp}/${p.maxMp}`;
  document.getElementById('fieldSoundBtn').textContent=soundState.enabled ? '音: ON' : '音: OFF';
  const place=fieldPlaceAt(state.field.x,state.field.y);
  const btn=document.getElementById('fieldVisitBtn');
  btn.disabled=!place;
  btn.textContent=place ? (place.id==='town' ? '町へ入る' : 'お屋敷へ入る') : '入る';
}

function visitFieldPlace(id){
  if(state.location!=='field' || state.busy || state.inBattle) return;
  if(fieldPlaceAt(state.field.x,state.field.y)?.id!==id) return;
  if(id==='town'){
    openTownDialog('ポ・トロの町','温かい灯りと、おいしそうな香りが迎えてくれる。町へ入りますか？');
    townDialogAction('町へ入る',()=>{
      closeTownDialog();showTown();
      document.getElementById('townVisitBtn').focus();
    });
  }else if(id==='manor'){
    openTownDialog('お屋敷の入口','奥からご主人様たちの声が聞こえる。お屋敷へ入りますか？');
    townDialogAction('お屋敷へ入る',enterFieldDungeon);
  }
  townDialogAction('歩き続ける',closeTownDialog);
}

function enterFieldDungeon(){
  if(state.location!=='field' || state.inBattle || fieldPlaceAt(state.field.x,state.field.y)?.id!=='manor') return;
  closeTownDialog();closeEquipMenu();
  state.location='dungeon';state.busy=false;
  hideElement('fieldScreen');showElement('mapScreen');
  drawMaze();updateMapStatusPanel();
  setMapMessage('お屋敷に着いた。ご主人様たちの声が、奥から聞こえてくる。');
  playMapBgm();document.getElementById('mapTownBtn').focus();
}

function drawField(){
  const canvas=document.getElementById('fieldCanvas');
  if(!canvas || !state.field) return;
  const ctx=canvas.getContext('2d'),s=POTORO_FIELD.tile;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let y=0;y<POTORO_FIELD.height;y++){
    for(let x=0;x<POTORO_FIELD.width;x++){
      const road=y===6 || (x===3 && y>=6 && y<=9) || (x===12 && y>=4 && y<=6);
      ctx.fillStyle=road ? '#c7cdd1' : (x+y)%2 ? '#48926a' : '#539b71';
      ctx.fillRect(x*s,y*s,s,s);
      ctx.fillStyle=road ? '#a5b3bb' : '#94bd72';
      ctx.fillRect(x*s+6,y*s+23,road ? 19 : 3,2);
      ctx.fillRect(x*s+23,y*s+9,3,2);
    }
  }
  ctx.fillStyle='#318aa6';ctx.fillRect(7*s,0,s,canvas.height);
  ctx.fillStyle='#a7dce4';
  for(let y=0;y<13;y++) ctx.fillRect(7*s+5,(y*s+10),18,3);
  ctx.fillStyle='#566977';ctx.fillRect(7*s-4,6*s,s+8,s);
  ctx.fillStyle='#c6a573';ctx.fillRect(7*s-4,6*s+4,s+8,s-8);
  ctx.fillStyle='#705759';
  for(let x=7*s-1;x<8*s+4;x+=8) ctx.fillRect(x,6*s+4,2,s-8);
  ctx.fillStyle='#e7d59c';ctx.fillRect(7*s-5,6*s, s+10,3);ctx.fillRect(7*s-5,7*s-3,s+10,3);
  POTORO_FIELD.buildings.forEach(b=>drawTownBuilding(ctx,b,s));
  const trees=[...POTORO_FIELD.trees];
  for(let x=0;x<15;x++) if(x!==7) trees.push({x,y:0},{x,y:12});
  for(let y=1;y<12;y++) trees.push({x:0,y},{x:14,y});
  trees.forEach(({x,y})=>{
    ctx.fillStyle='#665467';ctx.fillRect(x*s+13,y*s+20,6,12);
    ctx.fillStyle='#215e57';ctx.fillRect(x*s+4,y*s+7,24,17);ctx.fillRect(x*s+9,y*s,14,9);
    ctx.fillStyle='#70ab7b';ctx.fillRect(x*s+7,y*s+8,7,7);
  });
  [[2,5],[5,9],[10,6],[10,10],[9,4]].forEach(([x,y])=>{
    ctx.fillStyle='#e8b2d0';ctx.fillRect(x*s+9,y*s+11,5,5);
    ctx.fillStyle='#fff1a3';ctx.fillRect(x*s+20,y*s+20,4,4);
  });
  ctx.fillStyle='#253e48';ctx.fillRect(5*s-4,5*s+8,2*s+6,18);
  ctx.fillStyle='#fff';ctx.font='13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('お屋敷 →',6*s-1,5*s+17);
  drawMapPlayer(ctx,s,state.field);
}

function bindFieldEvents(){
  const deltas={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  document.querySelectorAll('[data-field-move]').forEach(btn=>btn.addEventListener('click',()=>moveFieldPlayer(...deltas[btn.dataset.fieldMove])));
  document.getElementById('fieldVisitBtn').onclick=()=>{
    const place=fieldPlaceAt(state.field.x,state.field.y);
    if(place) visitFieldPlace(place.id);
  };
  document.getElementById('fieldEquipBtn').onclick=openEquipMenu;
  document.getElementById('fieldSoundBtn').onclick=()=>{toggleSound();updateFieldStatus();};
  document.addEventListener('keydown',event=>{
    if(state.location!=='field') return;
    const keys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};
    if(keys[event.key]){event.preventDefault();moveFieldPlayer(...deltas[keys[event.key]]);}
  });
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bindFieldEvents,{once:true});
else bindFieldEvents();
