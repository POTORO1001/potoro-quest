/* ======== Core constants ======== */
  const VIEW_W=320, VIEW_H=240, TILE=16;
  const W=20, H=15;

  /* ======== Equipment/Items ======== */
  const WEAPONS=[
   {id:"duster", name:"フェザーダスター", atk:2},
   {id:"broom", name:"マジカルホーキ", atk:4},
   {id:"vacuum_ex", name:"異国の掃除機", atk:7}
  ];
  const UNIFORMS=[
   {id:"legs_stocking", slot:"legs", name:"黒のストッキング", def:2},
   {id:"body_apron",   slot:"body", name:"純白エプロン",     def:4},
   {id:"head_ribbon",  slot:"head", name:"メイドカチューシャ", def:7},
   {id:"body_replica6",slot:"body", name:"六代目メイド服(レプリカ)", def:100}
  ];
  const ITEMS=[
   {id:"omurice", name:"オムライス", kind:"healHP", power:30},
   {id:"tea",     name:"紅茶",       kind:"healMP", power:10},
   {id:"horse",   name:"くろれきし", kind:"insta",  power:0}
  ];

  /* ======== Enemies ======== */
  let ENEMIES=[
   {name:"定時のご主人様",     hp:42,  atk:10, def:6,  exp:22},
   {name:"残業のご主人様",     hp:70,  atk:14, def:8,  exp:36},
   {name:"叱責を受けたご主人様", hp:110, atk:18, def:12, exp:60}
  ];
  let BOSS={name:"残業かつ叱責されたご主人様", hp:220, atk:24, def:16, exp:200, boss:true};

  /* ======== Player base ======== */
  const heroBase={
    name:"まろ（見習いメイド）", lv:1,
    hp:24, maxhp:24, mp:8, maxmp:8,
    atk:5, def:2, exp:0,
    weapon:null, u_legs:null, u_body:null, u_head:null,
    invW:[WEAPONS[0]],
    invU:[UNIFORMS[0]],
    invI:[{id:"omurice",qty:1},{id:"tea",qty:1},{id:"horse",qty:1}]
  };

  /* ======== Audio ======== */
  let mute=false;
  function audio(){
    try{
      if(!audio.ctx){
        audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      return audio.ctx;
    }catch(e){
      return null;
    }
  }
  function tone(f,ms,type,vol,when){
    f   = (typeof f   === "number") ? f   : 440;
    ms  = (typeof ms  === "number") ? ms  : 70;
    vol = (typeof vol === "number") ? vol : 0.5;
    type= type || "square";
    when= (typeof when === "number") ? when : 0;

    if(mute) return;
    const c = audio();
    if(!c) return;
    const o=c.createOscillator();
    const g=c.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.value = vol;
    o.connect(g);
    g.connect(c.destination);
    const t = c.currentTime + when/1000;
    o.start(t);
    o.stop(t + ms/1000);
  }

  // ★ nullish coalescing を使わない seq
  function seq(steps){
    let offset = 0;
    for (var i=0; i<steps.length; i++){
      var s = steps[i];
      var vol  = (typeof s.vol  === "number") ? s.vol  : 0.5;
      var wait = (typeof s.wait === "number") ? s.wait : s.ms;
      tone(s.f, s.ms, s.type || "sine", vol, offset);
      offset += wait;
    }
  }

  /* ======== BGM ======== */
  let bgmTimer=null, bgmKind=null;
  function bgmStop(){
    if(bgmTimer){
      clearInterval(bgmTimer);
      bgmTimer=null;
    }
    bgmKind=null;
  }
  function bgmStart(kind){
    if(mute) return;
    if(bgmKind===kind) return;
    bgmStop();
    bgmKind=kind;

    function loop(bar, steps){
      function play(){ seq(steps); }
      play();
      bgmTimer = setInterval(play, bar);
    }

    if(kind==="field"){
      loop(1600, [
        {f:262,ms:140,vol:0.22,type:'sine'},{f:330,ms:140,vol:0.20,type:'sine'},
        {f:392,ms:140,vol:0.20,type:'sine'},{f:523,ms:140,vol:0.20,type:'sine'},
        {f:330,ms:140,vol:0.18,type:'sine'},{f:392,ms:140,vol:0.18,type:'sine'},
        {f:494,ms:140,vol:0.18,type:'sine'},{f:392,ms:140,vol:0.18,type:'sine'},
        {f:349,ms:160,vol:0.16,type:'sine'},{f:392,ms:160,vol:0.16,type:'sine'},
        {f:330,ms:160,vol:0.16,type:'sine'},{f:262,ms:200,vol:0.16,type:'sine'}
      ]);
    }else if(kind==="battle"){
      loop(2100, [
        {f:196,ms:120,vol:0.34,type:'square'},{f:0,ms:40,vol:0},
        {f:233,ms:120,vol:0.34,type:'square'},{f:0,ms:20,vol:0},
        {f:262,ms:120,vol:0.34,type:'square'},{f:0,ms:20,vol:0},
        {f:233,ms:120,vol:0.34,type:'square'},
        {f:784,ms:80,vol:0.28,type:'triangle'},{f:0,ms:20,vol:0},
        {f:880,ms:80,vol:0.30,type:'triangle'},
        {f:0,ms:20,vol:0},
        {f:120,ms:70,vol:0.35,type:'square'},
        {f:294,ms:120,vol:0.34,type:'square'},{f:0,ms:20,vol:0},
        {f:330,ms:120,vol:0.34,type:'square'},{f:0,ms:20,vol:0},
        {f:370,ms:120,vol:0.34,type:'square'},
        {f:988,ms:90,vol:0.32,type:'triangle'},
        {f:880,ms:90,vol:0.30,type:'triangle'},
        {f:784,ms:160,vol:0.30,type:'square'}
      ]);
    }else if(kind==="boss"){
      loop(1500, [
        {f:196,ms:150,vol:0.36,type:'square'},{f:247,ms:150,vol:0.34,type:'square'},
        {f:294,ms:150,vol:0.34,type:'square'},{f:392,ms:150,vol:0.32,type:'square'},
        {f:330,ms:150,vol:0.34,type:'square'},{f:294,ms:150,vol:0.34,type:'square'},
        {f:247,ms:150,vol:0.34,type:'square'},{f:392,ms:220,vol:0.30,type:'square'},
        {f:523,ms:130,vol:0.28,type:'triangle'},{f:494,ms:130,vol:0.28,type:'triangle'},
        {f:392,ms:220,vol:0.30,type:'square'}
      ]);
    }
  }

  /* ======== World / Map ======== */
  function makeFilled(val){
    var arr = [];
    for(var j=0;j<H;j++){
      var row=[];
      for(var i=0;i<W;i++) row.push(val);
      arr.push(row);
    }
    return arr;
  }

  var MAP      = makeFilled(1);
  var hallMask = makeFilled(false);
  var CHEST_LOOT = {};
  var DIST = null;
  var BOSS_DOOR = {x:1, y:1};

  function inBounds(x,y){ return x>=0 && y>=0 && x<W && y<H; }

  function regenerateWorld(){
    MAP = makeFilled(1);
    hallMask = makeFilled(false);
    CHEST_LOOT = {};

    function neighbors(x,y){
      var r=[];
      var cand=[[x+2,y],[x-2,y],[x,y+2],[x,y-2]];
      for(var i=0;i<cand.length;i++){
        var nx=cand[i][0], ny=cand[i][1];
        if(nx>0 && ny>0 && nx<W-1 && ny<H-1) r.push([nx,ny]);
      }
      return r;
    }

    function carve(x,y){
      MAP[y][x]=0;
      var ns=neighbors(x,y);
      ns.sort(function(){return Math.random()-0.5;});
      for(var i=0;i<ns.length;i++){
        var nx=ns[i][0], ny=ns[i][1];
        if(MAP[ny][nx]===1){
          MAP[(y+ny)/2][(x+nx)/2]=0;
          carve(nx,ny);
        }
      }
    }
    carve(1,1);

    // BFS距離
    var q=[[1,1]];
    var dist=makeFilled(-1);
    dist[1][1]=0;
    var dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    while(q.length){
      var c=q.shift();
      var x=c[0], y=c[1];
      for(var d=0;d<dirs.length;d++){
        var dx=dirs[d][0], dy=dirs[d][1];
        var nx=x+dx, ny=y+dy;
        if(inBounds(nx,ny) && MAP[ny][nx]===0 && dist[ny][nx]===-1){
          dist[ny][nx]=dist[y][x]+1;
          q.push([nx,ny]);
        }
      }
    }
    DIST = dist;

    // 大広間（最奥）
    var hx=1, hy=1, best=-1;
    for(var y=0;y<H;y++){
      for(var x=0;x<W;x++){
        if(MAP[y][x]===0 && dist[y][x]>best){
          best=dist[y][x]; hx=x; hy=y;
        }
      }
    }
    hallMask[hy][hx]=true;
    MAP[hy][hx]=6;

    // 扉（ボス前）
    var dlist=[[1,0],[-1,0],[0,1],[0,-1]];
    for(var k=0;k<dlist.length;k++){
      var dx2=dlist[k][0], dy2=dlist[k][1];
      var nx2=hx+dx2, ny2=hy+dy2;
      if(inBounds(nx2,ny2) && MAP[ny2][nx2]===0 && dist[ny2][nx2]===best-1){
        MAP[ny2][nx2]=2;
        BOSS_DOOR={x:nx2,y:ny2};
        break;
      }
    }

    // 宝箱 4つ
    var candidates=[];
    for(y=1;y<H-1;y++){
      for(x=1;x<W-1;x++){
        if(MAP[y][x]===0 && !(x===1 && y===1) && MAP[y][x]!==6){
          candidates.push([x,y]);
        }
      }
    }
    candidates.sort(function(){return Math.random()-0.5;});
    var chestPos=candidates.slice(0,4);
    var chestItems=[
      {type:"weapon",  item:WEAPONS[1]},
      {type:"uniform", item:UNIFORMS[1]},
      {type:"uniform", item:UNIFORMS[2]},
      {type:"weapon",  item:WEAPONS[2]}
    ];
    for(var ci=0;ci<chestPos.length;ci++){
      var cpos = chestPos[ci];
      var cx=cpos[0], cy=cpos[1];
      MAP[cy][cx]=3;
      CHEST_LOOT[cx+","+cy] = chestItems[ci] || chestItems[chestItems.length-1];
    }

    // 初期位置
    state.x=1; state.y=1; state.facing=2;
    state.visited = makeFilled(false);
    reveal(state.x, state.y, 3);
  }

  /* ======== Global State ======== */
  var state={
    hero:JSON.parse(JSON.stringify(heroBase)),
    x:1,y:1,facing:2, mode:"title",
    dialogQueue:[], battle:null, bossAlive:true, openedChests:{},
    title:{blink:0,show:true}, nameMode:false, playerName:null,
    popups:[], maxPopups:4,
    shakeT:0, shakeMag:0, shakeDur:0, shakeDecay:0.8,
    visited: makeFilled(false),
    afterDialogFn:null
  };

  /* ======== Canvas ======== */
  const cvs = document.getElementById('game');
  const ctx = cvs.getContext('2d');

  /* タイトル用ヒットエリア参照 */
  const titleHitArea = document.getElementById('titleStartHit');
  function syncTitleHitArea(){
    if(!titleHitArea) return;
    titleHitArea.style.display = (state.mode === 'title' && !state.nameMode) ? 'block' : 'none';
  }

  /* ======== Rendering ======== */
  function draw(){
    ctx.save();
    if(state.shakeT>0){
      var r = state.shakeT/state.shakeDur;
      var s = state.shakeMag*r;
      ctx.translate((Math.random()*2-1)*s,(Math.random()*2-1)*s);
    }

    if(state.mode==="title"){
      drawTitle();
      ctx.restore();
      return;
    }
    if(state.mode==="end"){
      drawEnd();
      ctx.restore();
      return;
    }

    // タイル
    for(var j=0;j<H;j++){
      for(var i=0;i<W;i++){
        var t=MAP[j][i];
        if(t===3 && state.openedChests[i+","+j]) t=4;
        if(t===0 || t===3 || t===4 || t===6 || t===2){
          if(hallMask[j][i]) drawRedWood(i*TILE,j*TILE,TILE,TILE);
          else drawWood(i*TILE,j*TILE,TILE,TILE);
        }else{
          ctx.fillStyle="#1f3b2d"; ctx.fillRect(i*TILE,j*TILE,TILE,TILE);
          ctx.fillStyle="#28543d";
          for(var k=0;k<TILE;k+=4) ctx.fillRect(i*TILE, j*TILE+k, TILE, 1);
        }
      }
    }

    // オブジェクト
    for(j=0;j<H;j++){
      for(i=0;i<W;i++){
        t=MAP[j][i];
        if(t===3 || (t===4 && !state.openedChests[i+","+j])){
          ctx.fillStyle="#3a6db4"; ctx.fillRect(i*TILE+3,j*TILE+5,10,8);
          ctx.fillStyle="#284b8a"; ctx.fillRect(i*TILE+3,j*TILE+9,10,1);
        } else if(t===4 && state.openedChests[i+","+j]){
          ctx.fillStyle="#284b8a"; ctx.fillRect(i*TILE+3,j*TILE+9,10,4);
          ctx.fillStyle="#3a6db4"; ctx.fillRect(i*TILE+3,j*TILE+5,10,3);
        } else if(t===2){
          ctx.fillStyle="#8b3434"; ctx.fillRect(i*TILE+2,j*TILE+2,12,12);
        } else if(t===6){
          ctx.fillStyle="#e84d4d"; ctx.fillRect(i*TILE+4,j*TILE+4,8,8);
        }
      }
    }

    // ラベル
    drawText("玄関ホール",18,4,"#a4e0b0");
    var hall = getHallPos();
    drawText("大広間", hall.x*TILE+4, Math.max(0,hall.y*TILE-10), "#ff6b6b", "bold 10px monospace");

    drawMaid(state.x,state.y,state.facing);
    drawFog();
    drawHUD();

    if(state.mode==="dialog")      drawDialog();
    else if(state.mode==="battle") drawBattle();
    else if(state.mode==="equip")  drawEquip();
    else if(state.mode==="items")  drawItemsField();

    drawPopups();
    ctx.restore();
  }

  function drawWood(x,y,w,h){
    ctx.fillStyle="#8a6b3a"; ctx.fillRect(x,y,w,h);
    ctx.fillStyle="#b48a3c"; for(var k=2;k<h;k+=4) ctx.fillRect(x, y+k, w, 1);
    ctx.fillStyle="#7a5f33"; for(k=3;k<w;k+=6) ctx.fillRect(x+k, y+1, 1, h-2);
  }
  function drawRedWood(x,y,w,h){
    ctx.fillStyle="#7a2a2a"; ctx.fillRect(x,y,w,h);
    ctx.fillStyle="#a33b3b"; for(var k=2;k<h;k+=4) ctx.fillRect(x, y+k, w, 1);
    ctx.fillStyle="#6a2323"; for(k=3;k<w;k+=6) ctx.fillRect(x+k, y+1, 1, h-2);
  }

  // ★ タイトル画面（PRESS START 点滅）
  function drawTitle(){
    ctx.fillStyle="#0b0f18";
    ctx.fillRect(0,0,VIEW_W,VIEW_H);

    for(var i=0;i<VIEW_H;i+=8){
      ctx.fillStyle = ( (i/8)%2 ? "#111a2a" : "#0e1626" );
      ctx.fillRect(0, i, VIEW_W, 8);
    }

    centerText("ポ・トロクエスト", VIEW_W/2, 72, "bold 20px sans-serif", "#ff7ad6");

    // 下部にパネル
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, VIEW_H - 70, VIEW_W, 70);

    if(state.title.show){
      centerText("PRESS START", VIEW_W/2, VIEW_H - 48, "bold 18px sans-serif", "#ffffff");
    }
    centerText("タップ または スペースキー", VIEW_W/2, VIEW_H - 26, "bold 11px sans-serif", "#e8ecff");
  }

  function drawEnd(){
    ctx.fillStyle="#0b0f18"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
    var heroName = "あなた";
    if(state.hero && state.hero.name){
      heroName = state.hero.name;
    }else if(state.playerName){
      heroName = state.playerName;
    }
    var line = heroName + "は一人前のメイドになった！";
    centerText(line, VIEW_W/2, VIEW_H/2 - 10, "bold 14px sans-serif", "#ffe9f7");
    drawText("end", VIEW_W-36, VIEW_H-18, "#d0d4ff", "bold 12px monospace");
  }

  function centerText(t,cx,y,font,color){
    font  = font  || "12px monospace";
    color = color || "#fff";
    ctx.font=font; ctx.fillStyle=color;
    var w=ctx.measureText(t).width;
    ctx.textBaseline = "top";
    ctx.fillText(t,cx-w/2,y);
  }
  function drawText(t,x,y,c,font){
    c    = c    || "#fff";
    font = font || "10px monospace";
    ctx.fillStyle=c; ctx.font=font; ctx.textBaseline="top";
    ctx.fillText(t,x,y);
  }

  /* 折返し 等 */
  function wrapLines(text, maxW, font){
    font = font || "10px monospace";
    ctx.font = font;
    var lines=[];
    var rawLines=(""+text).split("\n");
    for(var ri=0;ri<rawLines.length;ri++){
      var raw = rawLines[ri];
      var line="";
      for(var ci=0;ci<raw.length;ci++){
        var ch=raw.charAt(ci);
        var test=line+ch;
        if(ctx.measureText(test).width<=maxW){
          line=test;
        }else{
          lines.push(line);
          line=ch;
        }
      }
      lines.push(line);
    }
    return lines;
  }
  function drawParagraph(lines,x,y,color,font,maxW,maxLines,lineH){
    color   = color   || "#ddd";
    font    = font    || "10px monospace";
    maxW    = (typeof maxW    === "number") ? maxW    : 280;
    maxLines= (typeof maxLines=== "number") ? maxLines: 8;
    lineH   = (typeof lineH   === "number") ? lineH   : 12;

    ctx.font=font; ctx.fillStyle=color;
    var count=0;
    for(var i=0;i<lines.length;i++){
      var wrapped = wrapLines(lines[i], maxW, font);
      for(var j=0;j<wrapped.length;j++){
        ctx.fillText(wrapped[j], x, y);
        y+=lineH; count++;
        if(count>=maxLines) return;
      }
    }
  }

  function drawMaid(tx,ty,dir){
    var x=tx*TILE, y=ty*TILE, h=state.hero;
    var isReplica = (h.u_body && h.u_body.id==="body_replica6");
    var dressMain = isReplica ? "#ffffff" : "#ffd6f2";
    var accent    = isReplica ? "#ffd700" : "#ff9ad6";

    ctx.fillStyle="#6b3f2a"; ctx.fillRect(x+5,y+2,6,4);
    ctx.fillStyle="#ffecd6"; ctx.fillRect(x+6,y+5,4,4);
    ctx.fillStyle=dressMain; ctx.fillRect(x+5,y+9,6,7);
    if(h.u_body){ ctx.fillStyle=accent; ctx.fillRect(x+6,y+10,4,1); }

    var legsCol=h.u_legs?"#2b2b3a":"#222";
    ctx.fillStyle=legsCol; ctx.fillRect(x+5,y+16,2,2); ctx.fillRect(x+9,y+16,2,2);

    if(h.u_head){ ctx.fillStyle=accent; ctx.fillRect(x+7,y+1,2,2); }
    if(dir===1){ ctx.fillStyle=accent; ctx.fillRect(x+11,y+7,2,2); }
    if(dir===3){ ctx.fillStyle=accent; ctx.fillRect(x+3,y+7,2,2); }
  }

  function drawPanel(x,y,w,h){
    ctx.fillStyle="rgba(16,21,34,.92)"; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle="#2b3246"; ctx.strokeRect(x+0.5,y+0.5,w-1,h-1);
  }
  function totalDef(h){
    var d=h.def;
    if(h.u_legs) d+=h.u_legs.def;
    if(h.u_body) d+=h.u_body.def;
    if(h.u_head) d+=h.u_head.def;
    return d;
  }
  function drawHUD(){
    ctx.fillStyle="rgba(0,0,0,.55)"; ctx.fillRect(0,0,VIEW_W,18);
    var h=state.hero;
    var atk=h.atk+(h.weapon?h.weapon.atk:0);
    var def=totalDef(h);
    drawText(h.name+" LV:"+h.lv+" HP:"+h.hp+"/"+h.maxhp+
             " MP:"+h.mp+"/"+h.maxmp+" ATK:"+atk+" DEF:"+def,
             4,4,"#fff");
  }
  function drawDialog(){
    var msg = state.dialogQueue.length ? state.dialogQueue[0] : "...";
    drawPanel(8,160,304,72);
    drawParagraph([msg], 14, 166, "#fff", "10px monospace", 292, 4, 12);
    drawText("▼ タップ/OKで進む",184,222,"#a4b0ff");
  }

  /* === おまじない === */
  function getOmajinaiList(h){
    var list=[ {id:'moe', name:'もえもえぎゅー (MP5)', mp:5, type:'damage20'} ];
    if(h.lv>=3) list.push({id:'oishi',  name:'おいしくなーれ (MP10)', mp:10, type:'healFull'});
    if(h.lv>=5) list.push({id:'nishiki',name:'にしきぬやまー (MP15)', mp:15, type:'insta'});
    return list;
  }

  /* === 戦闘描画 === */
  function drawBattle(){
    var b=state.battle, h=state.hero, e=b.enemy;
    drawPanel(8,20,304,208);

    if(b.phase==="finished"){
      var lines=[];
      lines.push(b.victoryLine || (h.name+"は　"+e.name+"を　いやした！"));
      if(b.postMsgs && b.postMsgs.length){
        for(var pi=0;pi<b.postMsgs.length;pi++) lines.push(b.postMsgs[pi]);
      }
      lines.push(b.summary || "【戦闘結果】");
      drawParagraph(lines,16,64,"#fff","10px monospace",288,8,12);
      return;
    }

    drawText("《戦闘》",16,24,"#fff");
    drawText(e.name,16,40,"#ffd37a");
    drawText(h.name+" HP:"+h.hp+"/"+h.maxhp+" MP:"+h.mp+"/"+h.maxmp,144,40,"#7ad3ff");

    var startIdx = Math.max(0,b.log.length-10);
    drawParagraph(b.log.slice(startIdx), 16,56,"#ddd","10px monospace",276,6,12);

    if(b.phase==="select"){
      var menu=["いやす","おまじない","ぼうぎょ","どうぐ"];
      var cols=2, w=120, hgt=18;
      var mx=VIEW_W-8-cols*w-8, my=VIEW_H-8-2*hgt-8;
      drawPanel(mx,my,cols*w+8,2*hgt+8);
      for(var i=0;i<menu.length;i++){
        var cx=mx+4+(i%cols)*w;
        var cy=my+4+Math.floor(i/cols)*hgt;
        var sel=(b.sel||0)===i;
        ctx.fillStyle=sel?"rgba(255,122,214,.25)":"transparent";
        ctx.fillRect(cx,cy,w,hgt);
        drawText(menu[i],cx+4,cy+4,sel?"#ffd6f2":"#fff");
      }
    }else if(b.phase==="omajinai"){
      var list=getOmajinaiList(state.hero);
      drawPanel(20,56,280,120);
      drawText("《おまじない》 ↑↓で選択 / OKで実行 / 戻るで戻る",28,60,"#fff");
      if(!list.length){ drawText("まだ何も覚えていない…",28,78,"#ddd"); }
      for(i=0;i<list.length;i++){
        var y2=78+i*14;
        var sel2=(b.omSel||0)===i;
        if(sel2){ ctx.fillStyle="rgba(255,122,214,.22)"; ctx.fillRect(24,y2-2,272,14); }
        drawText(list[i].name,32,y2, sel2?"#ffe6f7":"#fff");
      }
    }else if(b.phase==="item"){
      drawItemMenu();
    }else if(b.phase==="inter"){
      drawText("ターン終了。次のターンへ（OK）",16,212,"#a4b0ff");
    }
  }

  function drawItemMenu(){
    var h=state.hero;
    var list=h.invI.filter(function(it){return it.qty>0;});
    drawPanel(20,56,280,120);
    drawText("《どうぐ》 ↑↓で選択 / OKで使用 / 戻るで戻る",28,60,"#fff");
    if(!list.length){
      drawText("まだ何も持っていない…",28,76,"#ddd");
      return;
    }
    for(var i=0;i<list.length;i++){
      var y=78+i*14;
      var sel=(state.battle.itemSel||0)===i;
      if(sel){ ctx.fillStyle="rgba(122,225,255,.22)"; ctx.fillRect(24,y-2,272,14); }
      var base = null;
      for(var ii=0;ii<ITEMS.length;ii++){
        if(ITEMS[ii].id===list[i].id){ base=ITEMS[ii]; break; }
      }
      var label = (base?base.name:list[i].id)+" ×"+list[i].qty;
      drawText(label,32,y, sel?"#e7faff":"#fff");
    }
  }

  /* 霧 */
  function reveal(x,y,r){
    r = (typeof r === "number") ? r : 3;
    for(var j=-r;j<=r;j++){
      for(var i=-r;i<=r;i++){
        var nx=x+i, ny=y+j;
        if(!inBounds(nx,ny)) continue;
        var d=Math.abs(i)+Math.abs(j);
        if(d<=r) state.visited[ny][nx]=true;
      }
    }
  }
  function drawFog(){
    for(var j=0;j<H;j++){
      for(var i=0;i<W;i++){
        if(!state.visited[j][i]){
          ctx.fillStyle="rgba(0,0,0,0.90)";
          ctx.fillRect(i*TILE,j*TILE,TILE,TILE);
        }
      }
    }
  }

  /* FX */
  function addPopup(x,y,text,color,size,up,stay,fade){
    color = color || "#fff";
    size  = (typeof size==="number") ? size : 12;
    up    = (typeof up==="number")   ? up   : 20;
    stay  = (typeof stay==="number") ? stay : 400;
    fade  = (typeof fade==="number") ? fade : 200;

    if(state.popups.length>=state.maxPopups) state.popups.shift();
    state.popups.push({
      x:x,y:y,text:text,color:color,size:size,
      vy:-up/stay,life:stay+fade,stay:stay,fade:fade
    });
  }
  function drawPopups(){
    var arr=state.popups;
    for(var i=arr.length-1;i>=0;i--){
      var p=arr[i];
      var total=p.stay+p.fade;
      var gone = total - p.life;
      var alpha=1;
      if(gone>p.stay) alpha=Math.max(0,1-(gone-p.stay)/p.fade);
      var yy = p.y - (gone * (-p.vy));
      ctx.globalAlpha=alpha;
      drawText(p.text, p.x, yy, p.color, "bold "+p.size+"px monospace");
      ctx.globalAlpha=1;
      p.life--;
      if(p.life<=0) arr.splice(i,1);
    }
  }
  function startShake(mag,dur,decay){
    state.shakeMag = (typeof mag==="number") ? mag : 6;
    state.shakeDur = (typeof dur==="number") ? dur : 120;
    state.shakeT   = state.shakeDur;
    state.shakeDecay = (typeof decay==="number") ? decay : 0.8;
  }

  /* 距離→出現帯（?? や ?. を使わない） */
  function distPercentToBossDoor(x,y){
    if(!DIST || !inBounds(x,y)) return 0;
    var rowD  = DIST[y];
    var rowBD = DIST[BOSS_DOOR.y];
    var d  = (rowD  && typeof rowD[x] === "number")            ? rowD[x]            : -1;
    var md = (rowBD && typeof rowBD[BOSS_DOOR.x] === "number") ? rowBD[BOSS_DOOR.x] : -1;
    if(d<0 || md<=0) return 0;
    var pct = Math.floor((d/md)*100);
    if(pct<0)   pct=0;
    if(pct>100) pct=100;
    return pct;
  }

  function pickEnemyFor(x,y){
    var p = distPercentToBossDoor(x,y);
    if(p<=30){
      return copyEnemy(ENEMIES[0]);
    }else if(p<=60){
      var idx = Math.random()<0.5 ? 0 : 1;
      return copyEnemy(ENEMIES[idx]);
    }else{
      var r = Math.random();
      var idx2 = r < 1/3 ? 0 : (r < 2/3 ? 1 : 2);
      return copyEnemy(ENEMIES[idx2]);
    }
  }

  /* ======== Input & Loop ======== */
  var keys={};
  document.addEventListener('keydown', function(e){
    var tag = (e.target && e.target.tagName) || "";
    var typing = /INPUT|TEXTAREA|SELECT/.test(tag) || (e.target && e.target.isContentEditable);
    keys[e.code] = true;

    if(e.code==="Space" && !typing) e.preventDefault();

    if(state.mode==="title" && (e.code==="Enter" || e.code==="Space")) startNameEntry();
    if(state.mode==="end"   && (e.code==="Enter" || e.code==="Space")) resetToTitle();
  });
  document.addEventListener('keyup', function(e){
    delete keys[e.code];
  });

  var last=0, acc=0;
  function loop(ts){
    var dt=(ts-last)/1000;
    last=ts; acc+=dt;
    while(acc>1/60){
      update(1/60);
      acc-=1/60;
    }
    draw();
    requestAnimationFrame(loop);
  }

  var moveCooldown=0, actionCooldown=0, navCD=0;
  var NAV_INTERVAL=0.18;
  function navReady(){ return navCD<=0; }
  function navSet(){ navCD=NAV_INTERVAL; }
  function pressed(arr){
    for(var i=0;i<arr.length;i++){
      if(keys[arr[i]]) return true;
    }
    return false;
  }

  var prevMode="title";
  function update(dt){
    // タイトルヒットエリア同期
    syncTitleHitArea();

    if(state.mode==='title'){
      syncControlsDisabled();
      return titleUpdate(dt);
    }

    if(prevMode!==state.mode){
      if(state.mode==='field' || state.mode==='equip' || state.mode==='dialog' || state.mode==='items'){
        bgmStart('field');
      }else if(state.mode==='battle'){
        // 切替済み
      }else if(state.mode==='end'){
        bgmStop();
      }else{
        bgmStop();
      }
      prevMode=state.mode;
    }

    if(state.mode==='dialog'){
      if(pressed(["Enter","Space"]) && actionCooldown<=0){
        actionCooldown=0.18;
        state.dialogQueue.shift();
        if(!state.dialogQueue.length){
          var fn=state.afterDialogFn;
          state.afterDialogFn=null;
          if(typeof fn==="function"){ fn(); }
          else { state.mode='field'; }
        }
      }
    }
    else if(state.mode==='battle') battleUpdate(dt);
    else if(state.mode==='equip')  equipUpdate(dt);
    else if(state.mode==='items')  itemsUpdate(dt);
    else if(state.mode==='end'){
      // no-op
    }
    else fieldUpdate(dt);

    moveCooldown=Math.max(0,moveCooldown-dt);
    actionCooldown=Math.max(0,actionCooldown-dt);
    navCD=Math.max(0,navCD-dt);
    if(state.shakeT>0){
      state.shakeT -= dt*1000;
      if(state.shakeT<0) state.shakeT=0;
    }

    syncControlsDisabled();
  }

  function titleUpdate(dt){
    state.title.blink += dt;
    if(state.title.blink >= 0.6){
      state.title.blink = 0;
      state.title.show = !state.title.show;
    }
  }

  /* 名前入力 */
  function startNameEntry(){
    if(state.nameMode || state.mode!=='title') return;
    state.nameMode = true;
    armAudio();

    var proceed = function(name){
      state.hero.name = name;
      state.playerName = name;
      reveal(state.x, state.y, 3);
      prevMode = 'title';
      state.mode = 'field';
      bgmStart('field');
      state.nameMode = false;
    };
    var abort = function(){ state.nameMode = false; };

    try{
      var v = prompt("推しのお名前を入力してください（12文字まで）", "");
      if(v===null){ abort(); return; }
      var name = (v||"").replace(/^\s+|\s+$/g,"").slice(0,12);
      if(!name){
        openNameModal(proceed, abort);
        return;
      }
      proceed(name);
    }catch(e){
      openNameModal(proceed, abort);
    }
  }

  // ===== 名前モーダル制御（?. 使わない） =====
  var nameMask   = document.getElementById('nameMask');
  var nameInput  = document.getElementById('nameInput');
  var nameOk     = document.getElementById('nameOk');
  var nameCancel = document.getElementById('nameCancel');

  function openNameModal(onOK, onCancel){
    if(!nameMask){
      if(onCancel) onCancel();
      return;
    }
    nameMask.style.display='block';
    setTimeout(function(){
      try{
        if(nameInput) nameInput.focus();
      }catch(e){}
    }, 0);

    function ok(){
      var v = "";
      if(nameInput) v = (nameInput.value || "");
      v = v.replace(/^\s+|\s+$/g,"").slice(0,12);
      if(!v){
        alert("名前を入力してください");
        if(nameInput) nameInput.focus();
        return;
      }
      cleanup();
      onOK(v);
    }
    function cancel(){
      cleanup();
      if(onCancel) onCancel();
    }
    function onKey(e){
      if(e.key==='Enter'){
        e.preventDefault(); ok();
      }
      if(e.key==='Escape'){
        e.preventDefault(); cancel();
      }
    }
    function onClickMask(e){
      if(e.target===nameMask) cancel();
    }
    function cleanup(){
      nameMask.style.display='none';
      if(nameOk)     nameOk.removeEventListener('click', ok);
      if(nameCancel) nameCancel.removeEventListener('click', cancel);
      document.removeEventListener('keydown', onKey);
      nameMask.removeEventListener('click', onClickMask);
    }

    if(nameOk)     nameOk.addEventListener('click', ok);
    if(nameCancel) nameCancel.addEventListener('click', cancel);
    document.addEventListener('keydown', onKey);
    nameMask.addEventListener('click', onClickMask);
  }

  /* ======== Field ======== */
  function fieldUpdate(dt){
    var dx = (keys["ArrowRight"]||keys["KeyD"])?1:(keys["ArrowLeft"]||keys["KeyA"])?-1:0;
    var dy = (keys["ArrowDown"]||keys["KeyS"])?1:(keys["ArrowUp"]||keys["KeyW"])?-1:0;
    if(moveCooldown<=0 && (dx||dy)){
      var nx=Math.max(0,Math.min(W-1,state.x+dx));
      var ny=Math.max(0,Math.min(H-1,state.y+dy));
      var t=MAP[ny][nx];
      if(t!==1){
        state.x=nx; state.y=ny; moveCooldown=0.12;
        if(dx>0)      state.facing=1;
        else if(dx<0) state.facing=3;
        else if(dy<0) state.facing=0;
        else if(dy>0) state.facing=2;

        reveal(state.x, state.y, 3);

        if(t===0 && Math.random()<0.16) startBattle(pickEnemyFor(state.x, state.y));
        if(t===2){
          state.mode='dialog';
          state.dialogQueue=["重厚な扉がきしんだ…","大広間から気配を感じる。"];
          state.afterDialogFn=null;
        }
        if(t===6 && state.bossAlive){
          state.mode='dialog';
          var n = state.hero.name || "あなた";
          var speech = "よくぞ来た"+n+"よ！ わしがご主人様の中のご主人様、ご主人王である。わしの日常の疲れを思い知るがよいっ！";
          state.dialogQueue=[speech,"—— 戦闘開始 ——"];
          state.afterDialogFn = function(){ startBattle(copyEnemy(BOSS)); };
        }
        if(t===3){
          var key = nx+","+ny;
          if(!state.openedChests[key]){
            var loot = CHEST_LOOT[key];
            if(loot){
              giveLoot(loot);
              state.openedChests[key]=true;
              seq([{f:880,ms:60,type:'square',vol:0.5},{f:1320,ms:60,type:'square',vol:0.5}]);
            }else{
              state.openedChests[key]=true;
            }
            state.mode='dialog';
            var got = loot ? loot.item.name : "なにか";
            state.dialogQueue=["宝箱をあけた！","「"+got+"」を手に入れた！"];
            try{
              if(Math.random()<1/128){
                var u=state.hero.invU;
                var hasReplica=false;
                for(var ui=0;ui<u.length;ui++){
                  if(u[ui].id==="body_replica6"){ hasReplica=true; break; }
                }
                if(!hasReplica){
                  var rare=null;
                  for(ui=0;ui<UNIFORMS.length;ui++){
                    if(UNIFORMS[ui].id==="body_replica6"){ rare=UNIFORMS[ui]; break; }
                  }
                  if(rare){
                    u.push(rare);
                    state.dialogQueue.push("さらに「"+rare.name+"」を手に入れた！");
                  }
                }
              }
            }catch(e){}
            state.afterDialogFn=null;
          }
        }
      }
    }
  }

  /* === フィールド道具 === */
  var fieldItemSel=0;
  function openItemsField(){ state.mode='items'; fieldItemSel=0; }
  function drawItemsField(){
    var h=state.hero;
    var list=h.invI.filter(function(it){return it.qty>0;});
    drawPanel(20,40,280,152);
    drawText("《道具（フィールド）》 ↑↓で選択 / OKで使用 / 戻るで閉じる",28,44,"#fff");
    if(!list.length){
      drawText("何も持っていない…",28,64,"#ddd");
      return;
    }
    for(var i=0;i<list.length;i++){
      var y=66+i*14;
      var sel=(fieldItemSel||0)===i;
      if(sel){ ctx.fillStyle="rgba(122,225,255,.22)"; ctx.fillRect(24,y-2,272,14); }
      var base=null;
      for(var ii=0;ii<ITEMS.length;ii++){
        if(ITEMS[ii].id===list[i].id){ base=ITEMS[ii]; break; }
      }
      var label=(base?base.name:list[i].id)+" ×"+list[i].qty;
      drawText(label,32,y, sel?"#e7faff":"#fff");
    }
  }
  function itemsUpdate(dt){
    var h=state.hero;
    var list=h.invI.filter(function(it){return it.qty>0;});
    if(navReady() && keys["ArrowUp"] && fieldItemSel>0){ fieldItemSel--; navSet(); }
    if(navReady() && keys["ArrowDown"] && fieldItemSel<Math.max(0,list.length-1)){ fieldItemSel++; navSet(); }
    if(keys["Escape"]||keys["KeyX"]){
      state.mode='field'; return;
    }
    if((keys["Enter"]||keys["Space"]) && actionCooldown<=0){
      actionCooldown=0.18;
      if(!list.length) return;
      var stack=list[fieldItemSel];
      var base=null;
      for(var i=0;i<ITEMS.length;i++){
        if(ITEMS[i].id===stack.id){ base=ITEMS[i]; break; }
      }
      if(!base) return;
      if(base.kind==="insta"){
        state.mode='dialog'; state.dialogQueue=["ここでは使えない…（戦闘中のみ）"]; return;
      }
      if(base.kind==="healHP"){
        var before=h.hp;
        h.hp=Math.min(h.maxhp, h.hp+base.power);
        var g=h.hp-before;
        if(g<=0){
          state.mode='dialog'; state.dialogQueue=["HPは十分だ。"]; return;
        }
        stack.qty--; if(stack.qty<0) stack.qty=0;
        var inMain=null;
        for(i=0;i<h.invI.length;i++){
          if(h.invI[i].id===stack.id){ inMain=h.invI[i]; break; }
        }
        if(inMain) inMain.qty=stack.qty;
        state.mode='dialog'; state.dialogQueue=["「"+base.name+"」を使った。HPが"+g+"回復！"];
      }else if(base.kind==="healMP"){
        var beforeMP=h.mp;
        h.mp=Math.min(h.maxmp, h.mp+base.power);
        var g2=h.mp-beforeMP;
        if(g2<=0){
          state.mode='dialog'; state.dialogQueue=["MPは十分だ。"]; return;
        }
        stack.qty--; if(stack.qty<0) stack.qty=0;
        var inMain2=null;
        for(i=0;i<h.invI.length;i++){
          if(h.invI[i].id===stack.id){ inMain2=h.invI[i]; break; }
        }
        if(inMain2) inMain2.qty=stack.qty;
        state.mode='dialog'; state.dialogQueue=["「"+base.name+"」を使った。MPが"+g2+"回復！"];
      }
    }
  }

  /* === 戦闘 === */
  function copyEnemy(t){ return JSON.parse(JSON.stringify(t)); }
  function hasItem(list,id){
    for(var i=0;i<list.length;i++){
      if(list[i].id===id) return true;
    }
    return false;
  }
  function giveLoot(loot){
    var h=state.hero;
    if(loot.type==="weapon"){
      if(!hasItem(h.invW, loot.item.id)) h.invW.push(loot.item);
    }else{
      if(!hasItem(h.invU, loot.item.id)) h.invU.push(loot.item);
    }
  }

  function startBattle(enemy){
    state.battle={
      enemy:enemy,
      phase:'select',
      log:["「"+enemy.name+"」があらわれた！"],
      sel:0,
      turn:1,
      itemSel:0,
      defending:false,
      omSel:0,
      postMsgs:[],
      summary:""
    };
    bgmStart(enemy.boss ? 'boss' : 'battle');
    state.mode='battle';
  }

  function useItem(base, stack, b, h, e){
    var msg="";
    if(base.kind==="healHP"){
      var before=h.hp;
      h.hp=Math.min(h.maxhp, h.hp+base.power);
      var g=h.hp-before; msg=base.name+"を食べた！ HPが"+g+"回復！";
      if(g>0) addPopup(96,74,"+"+g,"#66e0ff",12,14,350,200);
    }else if(base.kind==="healMP"){
      var beforeMP=h.mp;
      h.mp=Math.min(h.maxmp, h.mp+base.power);
      var g2=h.mp-beforeMP; msg=base.name+"を飲んだ！ MPが"+g2+"回復！";
      if(g2>0) addPopup(96,90,"+"+g2,"#5aa3ff",12,14,350,200);
    }else if(base.kind==="insta"){
      if(e.boss){
        var dd = Math.max(30, Math.floor(e.hp*0.7));
        e.hp = Math.max(1, e.hp - dd);
        msg=base.name+"を召喚！ 強烈な一撃！ "+dd+"ダメージ！（ボスは耐えた）";
        addPopup(200,74,"-"+dd,"#ffd700",14,20,400,200);
      }else{
        e.hp=0;
        msg=base.name+"を召喚した！ "+e.name+"はみるみるうちに倒れた！";
        addPopup(200,74,"撃破！","#ffd700",16,20,400,200);
      }
    }
    stack.qty=Math.max(0, stack.qty-1);
    var inMain=null;
    for(var i=0;i<h.invI.length;i++){
      if(h.invI[i].id===stack.id){ inMain=h.invI[i]; break; }
    }
    if(inMain) inMain.qty=stack.qty;
    b.log.push(msg);
    if(e.hp<=0){ return winBattle(); }
    enemyAct();
  }

  function enemyAttackMessage(name,dmg){
    if(name==="残業かつ叱責されたご主人様") return "ご主人様から叱責されつつ残業と言われた時の気持ちが伝わる！！"+dmg+"ダメージをうけた！";
    if(name==="定時のご主人様")             return "ご主人様から明日も仕事かの気持ちが伝わる！！"+dmg+"ダメージをうけた！";
    if(name==="残業のご主人様")             return "ご主人様から残業と言われた時の気持ちが伝わる！！"+dmg+"ダメージをうけた！";
    if(name==="叱責を受けたご主人様" || name==="叱責されたご主人様")
      return "ご主人様から叱責された時の気持ちが伝わる！！"+dmg+"ダメージをうけた！";
    return name+"のこうげき！ "+dmg+"ダメージ！";
  }

  function enemyAct(){
    var b=state.battle, h=state.hero, e=b.enemy;
    var def=totalDef(h);
    var dmg=Math.max(1, e.atk - def + Math.floor(Math.random()*3));
    if(b.defending){ dmg=Math.floor(dmg/2); b.defending=false; }
    h.hp-=dmg;
    addPopup(96,74,"-"+dmg,"#ff5555",12,16,350,200);
    startShake(6,120,0.8);
    seq([{f:180,ms:120,type:'sine',vol:0.5}]);
    b.log.push(enemyAttackMessage(e.name,dmg));
    if(h.hp<=0){
      b.log.push(h.name+"は倒れてしまった…");
      setTimeout(function(){ gameOver(); },400);
    }else{
      b.phase='inter';
    }
  }

  function winBattle(){
    var b=state.battle, h=state.hero, e=b.enemy;
    b.log.push(e.name+"をたおした！");
    seq([
      {f:523,ms:120,type:'sine',vol:0.5},
      {f:659,ms:120,type:'sine',vol:0.5},
      {f:784,ms:120,type:'sine',vol:0.5}
    ]);

    var gainedExp=e.exp;
    h.exp+=gainedExp;
    var post=[];
    while(h.exp >= h.lv*22){
      h.exp -= h.lv*22; h.lv++;
      h.maxhp+=6; h.maxmp+=2; h.atk+=2; h.def+=1;
      h.hp=h.maxhp; h.mp=h.maxmp;
      post.push(h.name+"は　レベルが　あがった！");
      if(h.lv===3) post.push(h.name+"は　あたらしいおまじないを　おぼえた！");
      if(h.lv===5) post.push(h.name+"は　あたらしいおまじないを　おぼえた！");
    }
    var dropNote="";
    if(!e.boss && Math.random()<0.30){
      var id = (Math.random()<0.5) ? "omurice" : "tea";
      var base=null;
      for(var ii=0;ii<ITEMS.length;ii++){
        if(ITEMS[ii].id===id){ base=ITEMS[ii]; break; }
      }
      var stack=null;
      for(ii=0;ii<h.invI.length;ii++){
        if(h.invI[ii].id===id){ stack=h.invI[ii]; break; }
      }
      if(stack) stack.qty+=1;
      else h.invI.push({id:id,qty:1});
      if(base) dropNote=" / 入手どうぐ："+base.name;
    }
    var needNext=h.lv*22 - h.exp;
    b.victoryLine = h.name+"は　"+e.name+"を　いやした！";
    b.postMsgs = post;
    b.summary  = "【戦闘結果】\nEXP+"+gainedExp+" / 次のレベルまで "+Math.max(0,needNext)+dropNote;

    if(e.boss){
      b.phase='finished';
      setTimeout(function(){ showEnding(); },900);
    }else{
      b.phase='finished';
    }
  }

  function battleUpdate(dt){
    var b=state.battle, h=state.hero, e=b.enemy;
    if(b.phase==='select'){
      if(navReady() && keys["ArrowLeft"] && b.sel%2===1){ b.sel--; navSet(); }
      if(navReady() && keys["ArrowRight"]&& b.sel%2===0){ b.sel++; navSet(); }
      if(navReady() && keys["ArrowUp"]   && b.sel>1)    { b.sel-=2; navSet(); }
      if(navReady() && keys["ArrowDown"] && b.sel<2)    { b.sel+=2; navSet(); }
      if((keys["Enter"]||keys["Space"]) && actionCooldown<=0){
        actionCooldown=0.18;
        if(b.sel===0){
          var atk=h.atk+(h.weapon?h.weapon.atk:0);
          var dmg=Math.max(1, atk - e.def + Math.floor(Math.random()*3));
          e.hp-=dmg;
          b.log.push(h.name+"のいやしの一撃！ "+e.name+"に"+dmg+"ダメージ！");
          addPopup(200,74,String(dmg),"#ffffff",12,20,400,200);
          seq([{f:320,ms:70,type:'square',vol:0.5},{f:220,ms:70,type:'square',vol:0.5}]);
          if(e.hp<=0) return winBattle();
          enemyAct();
        }else if(b.sel===1){
          b.phase='omajinai'; b.omSel=0;
        }else if(b.sel===2){
          b.defending=true;
          b.log.push("身をかためた！ 次の攻撃のダメージを減少");
          enemyAct();
        }else if(b.sel===3){
          b.phase='item'; b.itemSel=0;
        }
      }
    }else if(b.phase==='omajinai'){
      var list=getOmajinaiList(h);
      if(navReady() && keys["ArrowUp"]   && b.omSel>0){ b.omSel--; navSet(); }
      if(navReady() && keys["ArrowDown"] && b.omSel<Math.max(0,list.length-1)){ b.omSel++; navSet(); }
      if(keys["Escape"]||keys["KeyX"]) b.phase='select';
      if((keys["Enter"]||keys["Space"]) && actionCooldown<=0){
        actionCooldown=0.18;
        if(!list.length){ b.log.push("まだ何も覚えていない…"); b.phase='select'; return; }
        var sp=list[b.omSel];
        if(h.mp < sp.mp){ b.log.push("MPがたりない…"); return; }
        h.mp -= sp.mp;
        if(sp.type==='damage20'){
          e.hp-=20; b.log.push("おまじない『もえもえぎゅー』！ 20ダメージ！");
          addPopup(200,74,"20","#ffffff",12,20,400,200);
          seq([{f:660,ms:80,type:'square',vol:0.5},{f:990,ms:80,type:'square',vol:0.5}]);
          if(e.hp<=0) return winBattle();
          enemyAct();
        }else if(sp.type==='healFull'){
          var gain=h.maxhp-h.hp;
          h.hp=h.maxhp; b.log.push("おまじない『おいしくなーれ』！ HPが全回復！");
          if(gain>0) addPopup(96,74,"+"+gain,"#66e0ff",12,14,350,200);
          seq([{f:523,ms:300,type:'sine',vol:0.5},{f:659,ms:300,type:'sine',vol:0.5},{f:784,ms:300,type:'sine',vol:0.5}]);
          enemyAct();
        }else if(sp.type==='insta'){
          if(e.boss){
            var dd=Math.max(30, Math.floor(e.hp*0.7));
            e.hp=Math.max(1,e.hp-dd);
            b.log.push("おまじない『にしきぬやまー』！ 圧倒的な気配！(ボスは耐えた)");
            addPopup(200,74,"-"+dd,"#ffd700",14,20,400,200);
            enemyAct();
          }else{
            e.hp=0;
            b.log.push("おまじない『にしきぬやまー』！ 敵は飲み込まれた…！");
            addPopup(200,74,"撃破！","#ffd700",16,20,400,200);
            return winBattle();
          }
        }
      }
    }else if(b.phase==='item'){
      var list2=h.invI.filter(function(it){return it.qty>0;});
      if(navReady() && keys["ArrowUp"]   && b.itemSel>0){ b.itemSel--; navSet(); }
      if(navReady() && keys["ArrowDown"] && b.itemSel<Math.max(0,list2.length-1)){ b.itemSel++; navSet(); }
      if(keys["Escape"]||keys["KeyX"]) b.phase='select';
      if((keys["Enter"]||keys["Space"]) && actionCooldown<=0){
        actionCooldown=0.18;
        if(!list2.length){ b.log.push("まだ何も持っていない…"); b.phase='select'; return; }
        var stack2=list2[b.itemSel];
        var base2=null;
        for(var i2=0;i2<ITEMS.length;i2++){
          if(ITEMS[i2].id===stack2.id){ base2=ITEMS[i2]; break; }
        }
        if(!base2){ b.phase='select'; return; }
        useItem(base2, stack2, b, h, e);
      }
    }else if(b.phase==='inter'){
      if((keys["Enter"]||keys["Space"]) && actionCooldown<=0){
        actionCooldown=0.18;
        b.phase='select'; b.sel=0; b.turn++;
      }
    }else if(b.phase==='finished'){
      if((keys["Escape"]||keys["KeyX"]) && actionCooldown<=0){
        actionCooldown=0.18;
        endBattle(true);
      }
    }
  }

  function showEnding(){ bgmStop(); state.mode='end'; }
  function endBattle(){ state.mode='field'; state.battle=null; bgmStart('field'); }

  /* ======== Game Over ======== */
  function gameOver(){
    var lastName = (state.hero && state.hero.name) ? state.hero.name : (state.playerName||null);
    state.hero=JSON.parse(JSON.stringify(heroBase));
    if(lastName){
      state.hero.name = lastName; state.playerName = lastName;
    }
    state.battle=null;
    regenerateWorld(); state.bossAlive=true; state.openedChests={};
    state.mode='dialog';
    state.dialogQueue=['目の前が真っ黒になった…','屋敷の気配が変わったようだ（マップが変化した）'];
    state.afterDialogFn=null;
    bgmStart('field');
  }

  /* ======== Equip ======== */
  var equipState={cat:0, sel:0};
  function openEquip(){ equipState={cat:0,sel:0}; state.mode='equip'; }
  function equipList(cat,h){
    if(cat===0) return h.invW;
    if(cat===1) return h.invU.filter(function(i){return i.slot==='legs';});
    if(cat===2) return h.invU.filter(function(i){return i.slot==='body';});
    return h.invU.filter(function(i){return i.slot==='head';});
  }
  function equipUpdate(dt){
    var h=state.hero;
    var list=equipList(equipState.cat,h);
    if(navReady() && (keys["ArrowLeft"]||keys["KeyQ"])) { equipState.cat=(equipState.cat+3)%4; equipState.sel=0; navSet(); }
    if(navReady() && (keys["ArrowRight"]||keys["KeyE"])) { equipState.cat=(equipState.cat+1)%4; equipState.sel=0; navSet(); }
    if(navReady() && keys["ArrowUp"]   && equipState.sel>0){ equipState.sel--; navSet(); }
    if(navReady() && keys["ArrowDown"] && equipState.sel<list.length-1){ equipState.sel++; navSet(); }
    if(keys["Enter"]||keys["Space"]){
      var it=list[equipState.sel];
      if(it) equipItem(h,it);
    }
    if(keys["Escape"]||keys["KeyX"]) closeEquip(true);
  }
  function equipItem(h,it){
    if(it.atk) h.weapon=it;
    else if(it.slot==='legs') h.u_legs=it;
    else if(it.slot==='body') h.u_body=it;
    else h.u_head=it;
  }
  function drawEquip(){
    var h=state.hero;
    drawPanel(8,16,304,208);
    drawText("《装備》",16,20,"#fff");
    drawText("武器: "+(h.weapon?h.weapon.name:"(なし)"),16,36,"#ffd6f2");
    drawText("脚: "+(h.u_legs?h.u_legs.name:"(なし)"),16,48,"#a4ffea");
    drawText("胴: "+(h.u_body?h.u_body.name:"(なし)"),16,60,"#a4ffea");
    drawText("頭: "+(h.u_head?h.u_head.name:"(なし)"),16,72,"#a4ffea");
    drawText("←→カテゴリ / ↑↓選択 / OK=装備 / 戻る=閉じる",16,88,"#ddd");
    var titles=["武器","脚（ストッキング）","胴（エプロン）","頭（カチューシャ）"];
    var title=titles[equipState.cat];
    drawText("カテゴリ: "+title,16,104,"#fff");
    var list=equipList(equipState.cat,h);
    for(var i=0;i<list.length;i++){
      var y=120+i*14;
      var sel=(i===equipState.sel);
      if(sel){ ctx.fillStyle="rgba(122,225,255,.22)"; ctx.fillRect(12,y-2,296,14); }
      var it=list[i];
      var stat = it.atk ? "(+ATK "+it.atk+")":"(+DEF "+it.def+")";
      drawText(it.name+" "+stat,20,y, sel?"#e7faff":"#fff");
    }
  }
  function closeEquip(){ state.mode='field'; }

  /* ======== Buttons / Header Clicks ======== */
  document.getElementById('btnReset').onclick=function(){
    if(confirm("最初からはじめますか？")){
      bgmStop();
      state={
        hero:JSON.parse(JSON.stringify(heroBase)),
        x:1,y:1,facing:2, mode:"title",
        dialogQueue:[], battle:null, bossAlive:true, openedChests:{},
        title:{blink:0,show:true}, nameMode:false,
        playerName:state.playerName,
        popups:[], shakeT:0, shakeMag:0, shakeDur:0, shakeDecay:0.8,
        visited:makeFilled(false),
        afterDialogFn:null
      };
      prevMode='title';
      regenerateWorld();
      syncTitleHitArea();
    }
  };

  document.getElementById('btnMute').onclick=function(e){
    mute=!mute;
    e.target.textContent="効果音: "+(mute?"OFF":"ON");
    if(mute) bgmStop();
    else{
      if(state.mode==='field' || state.mode==='equip' || state.mode==='dialog' || state.mode==='items'){
        bgmStart('field');
      }else if(state.mode==='battle'){
        var boss = state.battle && state.battle.enemy && state.battle.enemy.boss;
        bgmStart(boss ? 'boss' : 'battle');
      }
    }
  };

  document.getElementById('btnFull').onclick=function(){
    var el=document.getElementById('game');
    if(!document.fullscreenElement){
      if(el.requestFullscreen) el.requestFullscreen();
    }else{
      if(document.exitFullscreen) document.exitFullscreen();
    }
  };

  document.getElementById('btnStart').onclick=function(e){
    e.preventDefault();
    if(state.mode==='title' && !state.nameMode) startNameEntry();
  };

  // 戦闘中は無反応
  document.getElementById('btnActEquip').onclick=function(){
    if(state.mode==='battle') return;
    openEquip();
  };
  document.getElementById('btnActItems').onclick=function(){
    if(state.mode==='battle') return;
    openItemsField();
  };

  function syncControlsDisabled(){
    var equipBtn=document.getElementById('btnActEquip');
    var itemsBtn=document.getElementById('btnActItems');
    var disabled=(state.mode==='battle');
    if(equipBtn) equipBtn.classList.toggle('disabled', disabled);
    if(itemsBtn) itemsBtn.classList.toggle('disabled', disabled);
  }

  /* === 説明モーダル === */
  var helpMask=document.getElementById('helpMask');
  var helpBody=document.getElementById('helpBody');
  var helpClose=document.getElementById('helpClose');
  document.getElementById('btnHelp').onclick=function(){
    helpMask.style.display='block';
    setTimeout(function(){ helpBody.scrollTop=0; }, 0);
  };
  helpClose.onclick=function(){ helpMask.style.display='none'; };
  helpMask.addEventListener('click',function(e){
    if(e.target===helpMask) helpMask.style.display='none';
  });

  /* === あらすじモーダル === */
  var storyMask=document.getElementById('storyMask');
  var storyFrame=document.getElementById('storyFrame');
  var storyClose=document.getElementById('storyClose');
  document.getElementById('btnStory').onclick=function(){
    bgmStop();
    storyMask.style.display='block';
    try{
      if(storyFrame){
        // 読み直しで最初から再生
        var src=storyFrame.getAttribute('src');
        storyFrame.setAttribute('src', src);
      }
    }catch(e){}
  };
  storyClose.onclick=function(){
    storyMask.style.display='none';
    if(!mute){
      if(state.mode==='field' || state.mode==='equip' || state.mode==='dialog' || state.mode==='items'){
        bgmStart('field');
      }else if(state.mode==='battle'){
        var boss = state.battle && state.battle.enemy && state.battle.enemy.boss;
        bgmStart(boss ? 'boss' : 'battle');
      }
    }
  };
  storyMask.addEventListener('click',function(e){
    if(e.target===storyMask) storyClose.click();
  });

  /* === iOS audio unlock === */
  function armAudio(){
    try{
      var c = audio();
      if(c && c.state==='suspended' && c.resume) c.resume();
    }catch(e){}
  }
  ['pointerdown','touchstart'].forEach(function(ev){
    document.addEventListener(ev,function(){ armAudio(); },{once:true,passive:true});
  });

  /* === タイトル起動＆タップ開始（キャンバス/ヒットエリア） === */
  function bootGameToTitle(){
    if(bootGameToTitle._booted) return;
    bootGameToTitle._booted=true;

    regenerateWorld();
    prevMode='title';
    state.mode='title';
    state.title.show=true;
    bgmStop();
    syncTitleHitArea();
    requestAnimationFrame(loop);

    function handleTapToStart(e){
      if(state.mode==='title' && !state.nameMode){
        if(e && e.cancelable) e.preventDefault();
        if(e && e.stopPropagation) e.stopPropagation();
        startNameEntry();
      }
    }

    var hit=document.getElementById('titleStartHit');
    ['click','touchstart','touchend','pointerdown','pointerup'].forEach(function(ev){
      cvs.addEventListener(ev,handleTapToStart,{passive:false});
    });
    if(hit){
      ['click','touchstart','touchend','pointerdown','pointerup'].forEach(function(ev){
        hit.addEventListener(ev,handleTapToStart,{passive:false});
      });
    }
  }
  bootGameToTitle();

  function resetToTitle(){
    state={
      hero:JSON.parse(JSON.stringify(heroBase)),
      x:1,y:1,facing:2, mode:"title",
      dialogQueue:[], battle:null, bossAlive:true, openedChests:{},
      title:{blink:0,show:true}, nameMode:false,
      playerName:state.playerName,
      popups:[], shakeT:0, shakeMag:0, shakeDur:0, shakeDecay:0.8,
      visited:makeFilled(false),
      afterDialogFn:null
    };
    regenerateWorld();
    prevMode='title';
    bgmStop();
    syncTitleHitArea();
  }

  /* タッチD-Pad/OK/戻る */
  function press(code,duration){
    duration = (typeof duration==="number") ? duration : 120;
    keys[code]=true;
    setTimeout(function(){ delete keys[code]; }, duration);
  }
  function bindPad(){
    var btns=document.querySelectorAll('.btnc');
    for(var i=0;i<btns.length;i++){
      (function(b){
        var code=b.getAttribute('data-k');
        var tid=null;
        function start(){
          press(code);
          tid=setInterval(function(){ press(code); },150);
        }
        function end(){
          if(tid){ clearInterval(tid); tid=null; }
          delete keys[code];
        }
        b.addEventListener('touchstart',function(e){ e.preventDefault(); start(); },{passive:false});
        b.addEventListener('mousedown',function(e){ e.preventDefault(); start(); });
        ['touchend','touchcancel','mouseup','mouseleave'].forEach(function(ev){
          b.addEventListener(ev,end,{passive:true});
        });
      })(btns[i]);
    }

    var btnL=document.querySelectorAll('.btnL');
    for(i=0;i<btnL.length;i++){
      (function(b){
        var main=b.getAttribute('data-k');
        var alt =b.getAttribute('data-alt');
        if(main){
          b.addEventListener('click',function(e){
            e.preventDefault();
            press(main);
            if(alt) setTimeout(function(){ press(alt); },10);
            if(state.mode==='title' && !state.nameMode && (main==='Enter' || main==='Space')){
              startNameEntry();
            }
          });
        }
      })(btnL[i]);
    }
  }
  bindPad();

  /* ユーティリティ */
  function getHallPos(){
    for(var y=0;y<H;y++){
      for(var x=0;x<W;x++){
        if(hallMask[y][x]) return {x:x,y:y};
      }
    }
    return {x:W-2,y:H-2};
  }


/* ===== ドラクエ風バトル強化 v2 ===== */
var BATTLE_SKINS = {
  "定時のご主人様": {kind:"slime", color:"#8fc7ff", accent:"#ffffff", aura:"#4aa3ff", bgTop:"#22306a", bgBottom:"#0d1224"},
  "残業のご主人様": {kind:"bat", color:"#ad7cff", accent:"#e9d8ff", aura:"#8254ff", bgTop:"#3a245f", bgBottom:"#0d1020"},
  "叱責を受けたご主人様": {kind:"beast", color:"#ff9f7a", accent:"#fff2c9", aura:"#ff7b42", bgTop:"#5a2c24", bgBottom:"#130d10"},
  "叱責されたご主人様": {kind:"beast", color:"#ff9f7a", accent:"#fff2c9", aura:"#ff7b42", bgTop:"#5a2c24", bgBottom:"#130d10"},
  "残業かつ叱責されたご主人様": {kind:"boss", color:"#ff5b89", accent:"#fff1a8", aura:"#ffbe3d", bgTop:"#4c1026", bgBottom:"#0d0810"}
};

function getBattleSkin(enemy){
  return BATTLE_SKINS[enemy.name] || {kind:"slime", color:"#9ad3ff", accent:"#ffffff", aura:"#59b7ff", bgTop:"#1c2759", bgBottom:"#0a0f1d"};
}
function clamp(v, min, max){
  return Math.max(min, Math.min(max, v));
}
function drawGradientBattleBg(enemy){
  var skin = getBattleSkin(enemy);
  var g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, skin.bgTop);
  g.addColorStop(.55, "#10182f");
  g.addColorStop(1, skin.bgBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  var g2 = ctx.createRadialGradient(VIEW_W*0.52, 70, 10, VIEW_W*0.52, 80, 160);
  g2.addColorStop(0, "rgba(255,255,255,.16)");
  g2.addColorStop(.5, "rgba(173,205,255,.05)");
  g2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g2;
  ctx.fillRect(0,0,VIEW_W,VIEW_H);

  for(var i=0;i<24;i++){
    var y = 118 + i*4;
    ctx.fillStyle = (i%2===0) ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.08)";
    ctx.fillRect(0, y, VIEW_W, 2);
  }

  ctx.fillStyle = "rgba(255,255,255,.04)";
  ctx.beginPath();
  ctx.ellipse(162, 148, 90, 18, 0, 0, Math.PI*2);
  ctx.fill();
}

function drawDQWindow(x,y,w,h, active){
  ctx.fillStyle = "#081125";
  ctx.fillRect(x,y,w,h);
  ctx.strokeStyle = active ? "#cbe2ff" : "#7ea2d8";
  ctx.lineWidth = 2;
  ctx.strokeRect(x+1,y+1,w-2,h-2);
  ctx.strokeStyle = "#315890";
  ctx.strokeRect(x+4,y+4,w-8,h-8);
  ctx.lineWidth = 1;
}
function drawBar(x,y,w,h,ratio,fill1,fill2){
  ratio = clamp(ratio,0,1);
  ctx.fillStyle = "#081125";
  ctx.fillRect(x,y,w,h);
  ctx.strokeStyle = "#a7c2e8";
  ctx.strokeRect(x+.5,y+.5,w-1,h-1);
  var gw = Math.max(0, Math.floor((w-4)*ratio));
  var g = ctx.createLinearGradient(x+2,y+2,x+2,y+h-2);
  g.addColorStop(0, fill1);
  g.addColorStop(1, fill2);
  ctx.fillStyle = g;
  ctx.fillRect(x+2,y+2,gw,h-4);
}
function battleText(t,x,y,color,font){
  drawText(t,x,y,color || "#fff",font || "bold 10px monospace");
}

function drawEnemySprite(enemy, x, y){
  var skin = getBattleSkin(enemy);
  var b = state.battle || {};
  var hit = (b.hitFlashT||0) > 0;
  var appear = (b.appearT||0) > 0 ? 1 - (b.appearT / 28) : 1;
  var bob = Math.sin((Date.now()%700)/700*Math.PI*2) * 2;
  var shake = hit ? ((Math.random()*2-1)*3) : 0;
  ctx.save();
  ctx.translate(x + shake, y + bob + (1-appear)*24);
  ctx.globalAlpha = clamp(appear, 0, 1);

  // aura
  var aura = ctx.createRadialGradient(0,0,12,0,0,56);
  aura.addColorStop(0, hit ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.18)");
  aura.addColorStop(.45, hexToRgba(skin.aura, hit ? .38 : .22));
  aura.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0,0,60,0,Math.PI*2);
  ctx.fill();

  if(skin.kind==="slime"){
    ctx.fillStyle = hit ? "#ffffff" : skin.color;
    ctx.beginPath();
    ctx.moveTo(-24,12); ctx.quadraticCurveTo(-27,-18,0,-28);
    ctx.quadraticCurveTo(27,-18,24,12);
    ctx.quadraticCurveTo(0,28,-24,12);
    ctx.fill();
    ctx.fillStyle = hexToRgba(skin.accent, .85);
    ctx.beginPath(); ctx.ellipse(-8,-10,8,5,-.35,0,Math.PI*2); ctx.fill();
    drawEnemyEyes(-10,-2,10,-2, hit);
  }else if(skin.kind==="bat"){
    ctx.fillStyle = hit ? "#ffffff" : skin.color;
    ctx.beginPath();
    ctx.moveTo(-10,-6); ctx.quadraticCurveTo(-46,-28,-54,6); ctx.quadraticCurveTo(-26,-4,-14,8);
    ctx.lineTo(0,2); ctx.lineTo(14,8); ctx.quadraticCurveTo(26,-4,54,6); ctx.quadraticCurveTo(46,-28,10,-6);
    ctx.quadraticCurveTo(0,-22,-10,-6);
    ctx.fill();
    drawEnemyEyes(-9,-2,9,-2, hit);
  }else if(skin.kind==="beast"){
    ctx.fillStyle = hit ? "#ffffff" : skin.color;
    roundBody(-26,-22,52,46,16);
    ctx.fillStyle = skin.accent;
    ctx.beginPath(); ctx.moveTo(-18,-16); ctx.lineTo(-8,-34); ctx.lineTo(0,-12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(18,-16); ctx.lineTo(8,-34); ctx.lineTo(0,-12); ctx.fill();
    drawEnemyEyes(-11,-2,11,-2, hit);
    ctx.fillStyle = "#23181a";
    ctx.fillRect(-3,7,6,7);
  }else{
    ctx.fillStyle = hit ? "#ffffff" : skin.color;
    roundBody(-30,-28,60,58,18);
    ctx.fillStyle = skin.accent;
    ctx.fillRect(-22,-34,14,14);
    ctx.fillRect(8,-34,14,14);
    ctx.fillStyle = "#2b1020";
    ctx.fillRect(-10,8,20,10);
    drawEnemyEyes(-12,-6,12,-6, hit);
  }

  ctx.restore();
}
function roundBody(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.fill();
}
function drawEnemyEyes(x1,y1,x2,y2, hit){
  ctx.fillStyle = hit ? "#111" : "#111827";
  ctx.fillRect(x1-3,y1,6,9);
  ctx.fillRect(x2-3,y2,6,9);
  ctx.fillStyle = "#fff";
  ctx.fillRect(x1-1,y1+2,2,2);
  ctx.fillRect(x2-1,y2+2,2,2);
}
function hexToRgba(hex, alpha){
  var h = (hex || "#ffffff").replace("#","");
  if(h.length===3){ h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]; }
  var r = parseInt(h.substring(0,2),16);
  var g = parseInt(h.substring(2,4),16);
  var b = parseInt(h.substring(4,6),16);
  return "rgba("+r+","+g+","+b+","+alpha+")";
}

function drawBattleStatusPanel(h,e){
  drawDQWindow(8,8,134,36,true);
  battleText(e.name, 16, 14, "#fff3b0");
  drawBar(16,28,112,9, e.hp/Math.max(1,e.maxhp || e.hp), "#ff8ab4", "#b81c54");

  drawDQWindow(188,8,124,54,true);
  battleText(h.name, 196, 14, "#ffffff");
  battleText("H", 196, 28, "#ffffff");
  drawBar(210,28,92,8,h.hp/Math.max(1,h.maxhp),"#74d6ff","#1f79dd");
  battleText(String(h.hp)+"/"+String(h.maxhp), 212, 38, "#d8f2ff", "10px monospace");
  battleText("M", 196, 48, "#ffffff");
  drawBar(210,48,92,8,h.mp/Math.max(1,h.maxmp),"#a7a7ff","#5f4ed8");
}

function getBattleMessages(b){
  var lines = [];
  if(b.phase==="finished"){
    lines.push(b.victoryLine || "");
    if(b.postMsgs && b.postMsgs.length){
      for(var i=0;i<b.postMsgs.length;i++) lines.push(b.postMsgs[i]);
    }
    if(b.summary) {
      var split = String(b.summary).split("\n");
      for(var j=0;j<split.length;j++) lines.push(split[j]);
    }
    return lines;
  }
  var start = Math.max(0, b.log.length - 3);
  return b.log.slice(start);
}

function drawBattleMessageWindow(lines){
  drawDQWindow(8,156,192,76,true);
  drawParagraph(lines, 18, 168, "#ffffff", "10px monospace", 172, 5, 12);
}

function drawBattleCommandWindow(b){
  drawDQWindow(208,156,104,76,true);
  if(b.phase==="select"){
    var menu=["たたかう","じゅもん","ぼうぎょ","どうぐ"];
    for(var i=0;i<menu.length;i++){
      var y=166 + i*14;
      var sel=(b.sel||0)===i;
      battleText((sel?"▶ ":"  ")+menu[i], 218, y, sel?"#fff3b0":"#ffffff");
    }
  }else if(b.phase==="omajinai"){
    var list=getOmajinaiList(state.hero);
    for(var j=0;j<Math.min(4,list.length);j++){
      var y2=166 + j*14;
      var sel2=(b.omSel||0)===j;
      battleText((sel2?"▶ ":"  ")+list[j].name.replace(/ \(MP.*$/,""), 214, y2, sel2?"#fff3b0":"#ffffff", "10px monospace");
    }
  }else if(b.phase==="item"){
    var list2=state.hero.invI.filter(function(it){return it.qty>0;});
    for(var k=0;k<Math.min(4,list2.length);k++){
      var y3=166 + k*14;
      var sel3=(b.itemSel||0)===k;
      var base=null;
      for(var z=0;z<ITEMS.length;z++){ if(ITEMS[z].id===list2[k].id){ base=ITEMS[z]; break; } }
      var name = base ? base.name : list2[k].id;
      battleText((sel3?"▶ ":"  ")+name, 214, y3, sel3?"#fff3b0":"#ffffff", "10px monospace");
    }
  }else if(b.phase==="inter"){
    battleText("▶ つぎへ", 222, 184, "#fff3b0");
  }else{
    battleText("▶ もどる", 222, 184, "#fff3b0");
  }
}

function drawBattle(){
  var b=state.battle, h=state.hero, e=b.enemy;
  drawGradientBattleBg(e);
  drawBattleStatusPanel(h,e);
  drawEnemySprite(e,160,92);

  if((b.encounterFlashT||0)>0){
    ctx.fillStyle = "rgba(255,255,255,"+(b.encounterFlashT/14)*0.7+")";
    ctx.fillRect(0,0,VIEW_W,VIEW_H);
  }

  drawBattleMessageWindow(getBattleMessages(b));
  drawBattleCommandWindow(b);

  if((b.phase==="finished")){
    battleText("戻るで終了", 214, 214, "#dbe7ff", "10px monospace");
  }else if(b.phase==="omajinai"){
    battleText("Xで戻る", 226, 214, "#dbe7ff", "10px monospace");
  }else if(b.phase==="item"){
    battleText("Xで戻る", 226, 214, "#dbe7ff", "10px monospace");
  }
}

var _oldStartBattle = startBattle;
startBattle = function(enemy){
  if(enemy && typeof enemy.maxhp!=="number"){ enemy.maxhp = enemy.hp; }
  state.battle={
    enemy:enemy,
    phase:'select',
    log:[""+enemy.name+" が あらわれた！"],
    sel:0,
    turn:1,
    itemSel:0,
    defending:false,
    omSel:0,
    postMsgs:[],
    summary:"",
    appearT:28,
    hitFlashT:0,
    encounterFlashT:14
  };
  bgmStart(enemy.boss ? 'boss' : 'battle');
  state.mode='battle';
};

function triggerEnemyHit(){
  if(state.battle){
    state.battle.hitFlashT = 8;
  }
  startShake(5,100,0.8);
}
function triggerEncounterTick(dt){
  if(!state.battle) return;
  if(state.battle.appearT>0) state.battle.appearT = Math.max(0, state.battle.appearT-1);
  if(state.battle.hitFlashT>0) state.battle.hitFlashT = Math.max(0, state.battle.hitFlashT-1);
  if(state.battle.encounterFlashT>0) state.battle.encounterFlashT = Math.max(0, state.battle.encounterFlashT-1);
}

var _originalUpdate = update;
update = function(dt){
  if(state.mode==="battle"){ triggerEncounterTick(dt); }
  _originalUpdate(dt);
  if(document && document.body){
    if(state.mode==="battle") document.body.classList.add("battle-mode");
    else document.body.classList.remove("battle-mode");
  }
};

useItem = function(base, stack, b, h, e){
  var msg="";
  if(base.kind==="healHP"){
    var before=h.hp;
    h.hp=Math.min(h.maxhp, h.hp+base.power);
    var g=h.hp-before;
    msg=base.name+"を つかった！ HPが "+g+" かいふく！";
    if(g>0) addPopup(92,70,"+"+g,"#66e0ff",12,14,350,200);
  }else if(base.kind==="healMP"){
    var beforeMP=h.mp;
    h.mp=Math.min(h.maxmp, h.mp+base.power);
    var g2=h.mp-beforeMP;
    msg=base.name+"を つかった！ MPが "+g2+" かいふく！";
    if(g2>0) addPopup(92,88,"+"+g2,"#8f97ff",12,14,350,200);
  }else if(base.kind==="insta"){
    if(e.boss){
      var dd = Math.max(30, Math.floor(e.hp*0.7));
      e.hp = Math.max(1, e.hp - dd);
      msg=base.name+"が あばれた！ "+dd+" ダメージ！";
      addPopup(198,68,"-"+dd,"#ffd700",14,20,400,200);
      triggerEnemyHit();
    }else{
      e.hp=0;
      msg=base.name+"が とびだした！ "+e.name+"を たおした！";
      addPopup(196,68,"撃破!","#ffd700",16,20,400,200);
      triggerEnemyHit();
    }
  }
  stack.qty=Math.max(0, stack.qty-1);
  var inMain=null;
  for(var i=0;i<h.invI.length;i++){ if(h.invI[i].id===stack.id){ inMain=h.invI[i]; break; } }
  if(inMain) inMain.qty=stack.qty;
  b.log.push(msg);
  if(e.hp<=0){ return winBattle(); }
  enemyAct();
};

enemyAct = function(){
  var b=state.battle, h=state.hero, e=b.enemy;
  var def=totalDef(h);
  var dmg=Math.max(1, e.atk - def + Math.floor(Math.random()*3));
  if(b.defending){ dmg=Math.floor(dmg/2); b.defending=false; }
  h.hp-=dmg;
  addPopup(92,70,"-"+dmg,"#ff7c7c",12,16,350,200);
  startShake(6,120,0.8);
  seq([{f:180,ms:120,type:'sine',vol:0.5}]);
  b.log.push(enemyAttackMessage(e.name,dmg));
  if(h.hp<=0){
    b.log.push(h.name+"は たおれてしまった…");
    setTimeout(function(){ gameOver(); },400);
  }else{
    b.phase='inter';
  }
};

winBattle = function(){
  var b=state.battle, h=state.hero, e=b.enemy;
  b.log.push(e.name+"を たおした！");
  seq([
    {f:523,ms:120,type:'sine',vol:0.5},
    {f:659,ms:120,type:'sine',vol:0.5},
    {f:784,ms:120,type:'sine',vol:0.5}
  ]);

  var gainedExp=e.exp;
  h.exp+=gainedExp;
  var post=[];
  while(h.exp >= h.lv*22){
    h.exp -= h.lv*22; h.lv++;
    h.maxhp+=6; h.maxmp+=2; h.atk+=2; h.def+=1;
    h.hp=h.maxhp; h.mp=h.maxmp;
    post.push(h.name+"は レベルが あがった！");
    if(h.lv===3 || h.lv===5) post.push(h.name+"は あたらしい おまじないを おぼえた！");
  }
  var dropNote="";
  if(!e.boss && Math.random()<0.30){
    var id = (Math.random()<0.5) ? "omurice" : "tea";
    var base=null, stack=null;
    for(var ii=0;ii<ITEMS.length;ii++){ if(ITEMS[ii].id===id){ base=ITEMS[ii]; break; } }
    for(var jj=0;jj<h.invI.length;jj++){ if(h.invI[jj].id===id){ stack=h.invI[jj]; break; } }
    if(stack) stack.qty+=1;
    else h.invI.push({id:id,qty:1});
    if(base) dropNote=" / どうぐ: "+base.name;
  }
  var needNext=h.lv*22 - h.exp;
  b.victoryLine = h.name+"は "+e.name+"を いやした！";
  b.postMsgs = post;
  b.summary  = "EXP+"+gainedExp+"\nつぎのレベルまで "+Math.max(0,needNext)+dropNote;
  b.phase='finished';

  if(e.boss){
    setTimeout(function(){ showEnding(); },900);
  }
};

battleUpdate = function(dt){
  var b=state.battle, h=state.hero, e=b.enemy;
  if(b.phase==='select'){
    if(navReady() && keys["ArrowUp"]   && b.sel>0){ b.sel--; navSet(); }
    if(navReady() && keys["ArrowDown"] && b.sel<3){ b.sel++; navSet(); }
    if((keys["Enter"]||keys["Space"]) && actionCooldown<=0){
      actionCooldown=0.18;
      if(b.sel===0){
        var atk=h.atk+(h.weapon?h.weapon.atk:0);
        var dmg=Math.max(1, atk - e.def + Math.floor(Math.random()*3));
        e.hp-=dmg;
        b.log.push(h.name+"の こうげき！ "+e.name+"に "+dmg+" ダメージ！");
        addPopup(198,68,String(dmg),"#ffffff",12,20,400,200);
        seq([{f:320,ms:70,type:'square',vol:0.5},{f:220,ms:70,type:'square',vol:0.5}]);
        triggerEnemyHit();
        if(e.hp<=0) return winBattle();
        enemyAct();
      }else if(b.sel===1){
        b.phase='omajinai'; b.omSel=0;
      }else if(b.sel===2){
        b.defending=true;
        b.log.push("みを まもった！");
        enemyAct();
      }else if(b.sel===3){
        b.phase='item'; b.itemSel=0;
      }
    }
  }else if(b.phase==='omajinai'){
    var list=getOmajinaiList(h);
    if(navReady() && keys["ArrowUp"]   && b.omSel>0){ b.omSel--; navSet(); }
    if(navReady() && keys["ArrowDown"] && b.omSel<Math.max(0,list.length-1)){ b.omSel++; navSet(); }
    if(keys["Escape"]||keys["KeyX"]) b.phase='select';
    if((keys["Enter"]||keys["Space"]) && actionCooldown<=0){
      actionCooldown=0.18;
      if(!list.length){ b.log.push("まだ なにも おぼえていない…"); b.phase='select'; return; }
      var sp=list[b.omSel];
      if(h.mp < sp.mp){ b.log.push("MPが たりない…"); return; }
      h.mp -= sp.mp;
      if(sp.type==='damage20'){
        e.hp-=20; b.log.push("もえもえぎゅー！ 20ダメージ！");
        addPopup(198,68,"20","#ffffff",12,20,400,200);
        seq([{f:660,ms:80,type:'square',vol:0.5},{f:990,ms:80,type:'square',vol:0.5}]);
        triggerEnemyHit();
        if(e.hp<=0) return winBattle();
        enemyAct();
      }else if(sp.type==='healFull'){
        var gain=h.maxhp-h.hp;
        h.hp=h.maxhp; b.log.push("おいしくなーれ！ HPが ぜんかいふく！");
        if(gain>0) addPopup(92,70,"+"+gain,"#66e0ff",12,14,350,200);
        seq([{f:523,ms:300,type:'sine',vol:0.5},{f:659,ms:300,type:'sine',vol:0.5},{f:784,ms:300,type:'sine',vol:0.5}]);
        enemyAct();
      }else if(sp.type==='insta'){
        if(e.boss){
          var dd=Math.max(30, Math.floor(e.hp*0.7));
          e.hp=Math.max(1,e.hp-dd);
          b.log.push("にしきぬやまー！ ボスに "+dd+" ダメージ！");
          addPopup(198,68,"-"+dd,"#ffd700",14,20,400,200);
          triggerEnemyHit();
          enemyAct();
        }else{
          e.hp=0;
          b.log.push("にしきぬやまー！ てきを たおした！");
          addPopup(196,68,"撃破!","#ffd700",16,20,400,200);
          triggerEnemyHit();
          return winBattle();
        }
      }
    }
  }else if(b.phase==='item'){
    var list2=h.invI.filter(function(it){return it.qty>0;});
    if(navReady() && keys["ArrowUp"]   && b.itemSel>0){ b.itemSel--; navSet(); }
    if(navReady() && keys["ArrowDown"] && b.itemSel<Math.max(0,list2.length-1)){ b.itemSel++; navSet(); }
    if(keys["Escape"]||keys["KeyX"]) b.phase='select';
    if((keys["Enter"]||keys["Space"]) && actionCooldown<=0){
      actionCooldown=0.18;
      if(!list2.length){ b.log.push("まだ なにも もっていない…"); b.phase='select'; return; }
      var stack2=list2[b.itemSel];
      var base2=null;
      for(var i2=0;i2<ITEMS.length;i2++){ if(ITEMS[i2].id===stack2.id){ base2=ITEMS[i2]; break; } }
      if(!base2){ b.phase='select'; return; }
      useItem(base2, stack2, b, h, e);
    }
  }else if(b.phase==='inter'){
    if((keys["Enter"]||keys["Space"]) && actionCooldown<=0){
      actionCooldown=0.18;
      b.phase='select'; b.sel=0; b.turn++;
    }
  }else if(b.phase==='finished'){
    if((keys["Escape"]||keys["KeyX"]) && actionCooldown<=0){
      actionCooldown=0.18;
      endBattle(true);
    }
  }
};
