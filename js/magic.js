
/* =========================
ポトロクエスト magic.js（STEP1）
おまじない拡張パック
========================= */

/* ===== バフ状態管理 ===== */
if(!window.buffState){
window.buffState = {
aura: 0,        // キラキラオーラ
charge: 0       // 完璧なお給仕
};
}

/* ===== ターン終了時処理 ===== */
function tickBuffs(){
if(buffState.aura > 0) buffState.aura--;
}

/* ===== ステータス補正 ===== */
const _totalSpd = totalSpd;
totalSpd = function(){
let base = _totalSpd();
if(buffState.aura > 0) base += 5;
return base;
};

const _totalTalk = totalTalk;
totalTalk = function(){
let base = _totalTalk();
if(buffState.aura > 0) base += 5;
return base;
};

/* ===== おまじないメニュー拡張 ===== */
const _openSubMenu = openSubMenu;
openSubMenu = function(kind){
_openSubMenu(kind);

if(kind === 'magic'){
const body = document.getElementById('subMenuBody');

```
addSubButton('キラキラオーラ　MP6 / トーク力↑・速度↑', ()=>useMagic('aura'));
addSubButton('完璧なお給仕　MP8 / 次ダメージ2.5倍', ()=>useMagic('charge2'));
addSubButton('ご奉仕連撃　MP7 / 2〜3回攻撃', ()=>useMagic('multi'));
addSubButton('ご帰宅ラッシュ　MP12 / 高威力＋混乱', ()=>useMagic('rush'));
addSubButton('ひなたぼっこ　MP10 / 全回復＋状態異常解除', ()=>useMagic('fullheal'));
```

}
};

/* ===== useMagic拡張 ===== */
const _useMagic = useMagic;
useMagic = async function(kind){

/* ===== キラキラオーラ ===== */
if(kind === 'aura'){
if(state.player.mp < 6){ await failAction('MPがたりない！'); return; }
state.player.mp -= 6;

```
buffState.aura = 2;

await showCutin('おまじない','キラキラオーラ☆');
setMessage('トーク力とすばやさがアップ！');
seMagic();
updateUI();
await sleep(700);
await enemyTurn();
return;
```

}

/* ===== 完璧なお給仕 ===== */
if(kind === 'charge2'){
if(state.player.mp < 8){ await failAction('MPがたりない！'); return; }
state.player.mp -= 8;

```
buffState.charge = 1;

await showCutin('おまじない','完璧なお給仕♡');
setMessage('次の攻撃が強化された！');
updateUI();
await sleep(700);
await enemyTurn();
return;
```

}

/* ===== ご奉仕連撃 ===== */
if(kind === 'multi'){
if(state.player.mp < 7){ await failAction('MPがたりない！'); return; }
state.player.mp -= 7;

```
await showCutin('おまじない','ご奉仕連撃！');

let hits = 2 + Math.floor(Math.random()*2);

for(let i=0;i<hits;i++){
  let dmg = Math.floor(totalAtk() * 0.6);

  if(buffState.charge){
    dmg = Math.floor(dmg * 2.5);
    buffState.charge = 0;
  }

  const target = currentEnemy();
  target.hp = Math.max(0, target.hp - dmg);

  showDamage(dmg,'enemy');
  enemyFlash();
  await sleep(250);
}

setMessage(`${hits}回攻撃！`);
updateUI();

if(allEnemiesDefeated()){ await winBattle(); return; }

await enemyTurn();
return;
```

}

/* ===== ご帰宅ラッシュ ===== */
if(kind === 'rush'){
if(state.player.mp < 12){ await failAction('MPがたりない！'); return; }
state.player.mp -= 12;

```
await showCutin('必殺','ご帰宅ラッシュ！！');

let dmg = magicPower(60);

if(buffState.charge){
  dmg = Math.floor(dmg * 2.5);
  buffState.charge = 0;
}

const target = currentEnemy();
target.hp = Math.max(0, target.hp - dmg);

if(Math.random() < 0.3){
  target.sleepTurns = 1;
  setMessage('混乱した！');
}

showDamage(dmg,'enemy','critical-text');
updateUI();

if(allEnemiesDefeated()){ await winBattle(); return; }

await enemyTurn();
return;
```

}

/* ===== ひなたぼっこ ===== */
if(kind === 'fullheal'){
if(state.player.mp < 10){ await failAction('MPがたりない！'); return; }
state.player.mp -= 10;

```
await showCutin('回復','ひなたぼっこ…☀');

const p = state.player;
p.hp = p.maxHp;

const s = ensurePlayerStatus();
s.sleep = 0;
s.confuse = 0;
s.defDown = 0;

setMessage('完全回復した！状態異常も解除！');

showDamage(-p.maxHp,'player');
updateUI();
await sleep(700);

await enemyTurn();
return;
```

}

/* ===== 既存処理 ===== */
return _useMagic(kind);
};

/* ===== ターン処理に組み込み ===== */
const _enemyTurn = enemyTurn;
enemyTurn = async function(){
tickBuffs();
await _enemyTurn();
};
