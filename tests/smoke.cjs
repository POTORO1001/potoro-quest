const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (error) {
  console.error('Playwrightが見つかりません。先に npm install を実行してください。');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png'
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const absolute = path.resolve(root, relative);

      if (!absolute.startsWith(`${root}${path.sep}`) || !fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
        response.writeHead(404).end('Not found');
        return;
      }

      response.writeHead(200, {
        'Content-Type': mimeTypes[path.extname(absolute).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(absolute).pipe(response);
    });

    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function findBrowserExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ].filter(Boolean);

  return candidates.find(candidate => fs.existsSync(candidate));
}

async function main() {
  const server = await startServer();
  const { port } = server.address();
  const executablePath = findBrowserExecutable();
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {})
  });

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const runtimeErrors = [];
  const failedResponses = [];

  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (response.status() >= 400 && url.pathname !== '/favicon.ico') {
      failedResponses.push(`${response.status()} ${url.pathname}`);
    }
  });

  try {
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.locator('#loadingScreen').waitFor({ state: 'detached', timeout: 5000 });

    await page.locator('#titleScreen').waitFor({ state: 'visible' });
    assert(await page.locator('#titleScreen h1').textContent() === 'ポ・トロクエスト', 'タイトルが表示されていません。');
    assert(await page.locator('#openingBtn').textContent() === 'あらすじ', 'あらすじボタンの表記が違います。');

    await page.locator('#openingBtn').click();
    await page.locator('#openingScreen').waitFor({ state: 'visible' });
    await page.evaluate(() => {
      if (openingDelayTimer) clearTimeout(openingDelayTimer);
      openingDelayTimer = null;
      startOpeningStory();
    });
    await page.waitForFunction(() => document.getElementById('openingStoryActive')?.textContent.trim().length > 0);
    await page.locator('#openingSkipBtn').click();

    await page.locator('#oshiNameInput').fill('テスト推し');
    await page.locator('#startBtn').click();
    await page.locator('#townScreen').waitFor({state:'visible'});
    assert(await page.locator('#townCoins').textContent() === '30', '町の初期コインが表示されません。');
    const townSpawn = await page.evaluate(() => ({...state.town}));
    await page.keyboard.press('ArrowUp');
    const townMoved = await page.evaluate(() => ({...state.town}));
    assert(townMoved.x === townSpawn.x && townMoved.y === townSpawn.y-1, '町のキーボード移動が1歩ずつ動きません。');
    await page.waitForTimeout(150);
    await page.locator('[data-town-move="down"]').click();
    assert(await page.evaluate(() => state.town.y) === townSpawn.y, '町の十字キーが動きません。');
    const walkTown = async id => page.evaluate(id => {
      const target = [...POTORO_TOWN.buildings,...POTORO_TOWN.places].find(place => place.id === id).door;
      const start = {x:state.town.x,y:state.town.y,path:[]};
      const queue = [start];
      const seen = new Set([`${start.x},${start.y}`]);
      let path;
      while(queue.length){
        const current = queue.shift();
        if(current.x === target.x && current.y === target.y){path = current.path;break;}
        for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
          const x=current.x+dx,y=current.y+dy,key=`${x},${y}`;
          if(seen.has(key) || townTileBlocked(x,y)) continue;
          const place = townPlaceAt(x,y);
          if(place && place.id !== id) continue;
          seen.add(key);queue.push({x,y,path:[...current.path,[dx,dy]]});
        }
      }
      if(!path) throw new Error(`町の${id}へ到達できません。`);
      for(const [dx,dy] of path){state.town.lastMoveAt=0;moveTownPlayer(dx,dy);}
      return {x:state.town.x,y:state.town.y,busy:state.busy};
    },id);
    const walkField = async id => page.evaluate(id=>{
      const target=POTORO_FIELD.buildings.find(place=>place.id===id).door;
      const queue=[{x:state.field.x,y:state.field.y,path:[]}],seen=new Set();
      let path;
      while(queue.length){
        const current=queue.shift(),key=`${current.x},${current.y}`;
        if(seen.has(key)) continue;
        seen.add(key);
        if(current.x===target.x && current.y===target.y){path=current.path;break;}
        for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
          const x=current.x+dx,y=current.y+dy;
          if(!fieldTileBlocked(x,y)) queue.push({x,y,path:[...current.path,[dx,dy]]});
        }
      }
      if(!path) throw new Error(`フィールドの${id}へ到達できません。`);
      if(!path.length) visitFieldPlace(id);
      for(const [dx,dy] of path){state.field.lastMoveAt=0;moveFieldPlayer(dx,dy);}
    },id);
    const departTown = async()=>{
      await page.getByRole('button',{name:'郊外へ出発',exact:true}).click();
      await walkField('manor');
      await page.locator('#townDialog').getByRole('button',{name:'お屋敷へ入る',exact:true}).click();
    };
    await walkTown('manor');
    assert(await page.locator('#townDialogTitle').textContent() === 'お屋敷「ポ・トロ」', 'お屋敷で会話が開きません。');
    const blockedDialogMove = await page.evaluate(() => {
      const before = {...state.town};moveTownPlayer(1,0);
      return before.x === state.town.x && before.y === state.town.y;
    });
    assert(blockedDialogMove, '会話中にも町を歩けてしまいます。');
    await page.keyboard.press('Escape');
    assert(await page.locator('#townDialog').isHidden(), '会話をEscapeで閉じられません。');
    assert(await page.evaluate(() => {state.town.lastMoveAt=0;moveTownPlayer(0,-1);return state.town.y===4;}), '建物を通り抜けてしまいます。');
    await walkTown('cafe');
    const cafeBefore = await page.evaluate(() => ({coins:state.player.townCoins,count:state.player.items.omurice}));
    await page.locator('[data-town-buy="omurice"]').click();
    const cafeAfter = await page.evaluate(() => ({coins:state.player.townCoins,count:state.player.items.omurice}));
    assert(cafeAfter.coins === cafeBefore.coins-10 && cafeAfter.count === cafeBefore.count+1, 'メイド喫茶の購入でコイン・所持数が更新されません。');
    const cafeGuards = await page.evaluate(() => {
      const p=state.player;
      p.townCoins=0;renderTownCafe();
      const noCoinsDisabled=document.querySelector('[data-town-buy="omurice"]').disabled;
      const before=p.items.omurice;buyTownItem('omurice');
      const noCoinsSafe=p.items.omurice===before && p.townCoins===0;
      p.townCoins=30;p.items.omurice=getItemLimit('omurice');renderTownCafe();
      const fullDisabled=document.querySelector('[data-town-buy="omurice"]').disabled;
      buyTownItem('omurice');
      const fullSafe=p.items.omurice===getItemLimit('omurice') && p.townCoins===30;
      p.items.omurice=2;renderTownCafe();updateTownStatus();
      return {noCoinsDisabled,noCoinsSafe,fullDisabled,fullSafe};
    });
    assert(Object.values(cafeGuards).every(Boolean), 'コイン不足または所持上限でも購入できてしまいます。');
    if(process.env.POTORO_TEST_SCREENSHOT){
      fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
      await page.screenshot({path:path.join(root,'test-results','town-cafe-mobile.png'),fullPage:true});
    }
    await page.locator('#townDialogClose').click();
    await walkTown('rest');
    await page.evaluate(() => {
      const p=state.player;p.hp=1;p.mp=0;p.status={sleep:2,confuse:2,defDown:2};
      p.buffs={kiraAura:3};p.itemBuffs={turns:3,atk:5};
    });
    await page.getByRole('button',{name:'ひと休みする',exact:true}).click();
    assert(await page.evaluate(() => {
      const p=state.player;
      return p.hp===p.maxHp && p.mp===p.maxMp && Object.values(p.status).every(value=>value===0) && !Object.keys(p.buffs).length && !Object.keys(p.itemBuffs).length;
    }), '休憩室でHP・TP・状態が回復しません。');
    await page.locator('#townDialogClose').click();
    await walkTown('plaza');
    assert(await page.locator('#townDialogTitle').textContent() === '町の広場', '広場で会話が開きません。');
    await page.locator('#townDialogClose').click();
    if(process.env.POTORO_TEST_SCREENSHOT){
      for(const width of [320,390,1280]){
        await page.setViewportSize({width,height:844});
        await page.locator('#townScreen').screenshot({path:path.join(root,'test-results',`town-${width}.png`)});
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '町画面に横方向のはみ出しがあります。');
      }
      await page.setViewportSize({width:390,height:844});
    }
    await walkTown('exit');
    await page.getByRole('button',{name:'郊外へ出発',exact:true}).click();
    await page.locator('#fieldScreen').waitFor({state:'visible'});
    const fieldSpawn=await page.evaluate(()=>({...state.field}));
    await page.keyboard.press('ArrowDown');
    assert(await page.evaluate(()=>state.field.y)===fieldSpawn.y+1,'フィールドのキーボード移動が1歩ずつ動きません。');
    await page.waitForTimeout(150);
    await page.locator('[data-field-move="right"]').click();
    assert(await page.evaluate(()=>state.field.x)===fieldSpawn.x+1,'フィールドの十字キーが動きません。');
    const fieldChecks=await page.evaluate(()=>{
      state.field={x:6,y:5,lastMoveAt:0};moveFieldPlayer(1,0);
      const riverBlocked=state.field.x===6;
      state.field={x:6,y:6,lastMoveAt:0};moveFieldPlayer(1,0);
      const bridgePass=state.field.x===7;
      state.field={x:3,y:9,lastMoveAt:0};moveFieldPlayer(0,-1);
      const buildingBlocked=state.field.y===9;
      state.field={x:1,y:10,lastMoveAt:0};moveFieldPlayer(-1,0);
      const boundaryBlocked=state.field.x===1;
      state.field={x:6,y:6,lastMoveAt:0};drawField();updateFieldStatus();
      const ctx=document.getElementById('fieldCanvas').getContext('2d');
      const pixels=ctx.getImageData(0,0,480,416).data,colors=new Set();
      for(let i=0;i<pixels.length;i+=4) colors.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`);
      return {riverBlocked,bridgePass,buildingBlocked,boundaryBlocked,nonblank:colors.size>20};
    });
    assert(Object.values(fieldChecks).every(Boolean),'フィールドの川・橋・建物の衝突または描画に問題があります。');
    await page.locator('#fieldEquipBtn').click();
    assert(await page.evaluate(()=>{const x=state.field.x;moveFieldPlayer(1,0);return state.field.x===x;}),'装備中にもフィールドを歩けます。');
    await page.evaluate(()=>closeEquipMenu());
    if(process.env.POTORO_TEST_SCREENSHOT){
      for(const width of [320,390,1280]){
        await page.setViewportSize({width,height:844});
        await page.locator('#fieldScreen').screenshot({path:path.join(root,'test-results',`field-${width}.png`)});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'フィールド画面が横にはみ出します。');
      }
      await page.setViewportSize({width:390,height:844});
    }
    await walkField('manor');
    assert(await page.evaluate(()=>{const x=state.field.x;moveFieldPlayer(-1,0);return state.field.x===x;}),'入口の確認中にもフィールドを歩けます。');
    await page.getByRole('button',{name:'歩き続ける',exact:true}).click();
    assert(await page.locator('#fieldScreen').isVisible() && await page.locator('#townDialog').isHidden(),'入口で歩き続けるを選べません。');
    await page.locator('#fieldVisitBtn').click();
    await page.locator('#townDialog').getByRole('button',{name:'お屋敷へ入る',exact:true}).click();
    await page.locator('#mapScreen').waitFor({ state: 'visible' });
    const dungeonBeforeTown = await page.evaluate(() => {
      state.chests[0].opened=true;
      return JSON.stringify({maze:state.maze,chests:state.chests,floor:state.floor,x:state.player.mapX,y:state.player.mapY});
    });
    await page.locator('#mapTownBtn').click();
    await page.locator('.potoro-map-choice-primary').click();
    await walkField('town');
    await page.locator('#townDialog').getByRole('button',{name:'町へ入る',exact:true}).click();
    await page.locator('#townScreen').waitFor({state:'visible'});
    await page.locator('#townVisitBtn').click();
    await departTown();
    const dungeonAfterTown = await page.evaluate(() => JSON.stringify({maze:state.maze,chests:state.chests,floor:state.floor,x:state.player.mapX,y:state.player.mapY}));
    assert(dungeonBeforeTown===dungeonAfterTown, '町との往復で探索位置・マップ・宝箱が失われます。');
    await page.evaluate(() => {state.chests[0].opened=false;});

    await page.waitForFunction(() => potoroMaidMapImage.complete && potoroMaidMapImage.naturalWidth > 0);
    const maidSprite = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 120;
      const ctx = canvas.getContext('2d');
      drawMapPlayer(ctx,40);
      const data = ctx.getImageData(40,40,40,40).data;
      let visible = 0;
      let white = 0;
      let transparent = 0;
      for(let i=0;i<data.length;i+=4){
        if(data[i+3] > 0) visible++;
        else transparent++;
        if(data[i+3] > 0 && data[i] > 180 && data[i+1] > 180 && data[i+2] > 180) white++;
      }
      return {visible,white,transparent,smoothing:ctx.imageSmoothingEnabled,preloaded:getImageAssets().some(src => src.includes('maid-map.png'))};
    });
    assert(maidSprite.visible > 100 && maidSprite.white > 10 && maidSprite.transparent > 100, 'メイドの画像が空白・不透明背景付き、または制服の白が描画されません。');
    assert(maidSprite.smoothing && maidSprite.preloaded, '画像描画後にCanvas設定が戻らないか、プリロード対象になっていません。');
    if(process.env.POTORO_TEST_SCREENSHOT){
      fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
      for(const width of [320,390,1280]){
        await page.setViewportSize({width,height:844});
        await page.locator('#mapScreen').screenshot({path:path.join(root,'test-results',`maid-map-${width}.png`)});
      }
      await page.setViewportSize({width:390,height:844});
    }

    const firstFloor = await page.evaluate(() => ({
      player: getPlayerSnapshot(),
      map: getMapSnapshot(),
      normalEnemyIds: getNormalEnemies().map(enemy => enemy.id),
      equipmentIds: [...getAllWeapons(), ...getAllUniforms()].map(item => item.id),
      equippedItemsExist: Object.values(state.player.equip).every(id => !id || !!getEquipmentById(id)),
      goalIsInAllowedZone: (() => {
        const goal = state.stairs;
        const right = goal.x >= Math.floor(MAZE_W * 0.58);
        const top = goal.y <= Math.floor(MAZE_H * 0.42);
        const left = goal.x <= Math.floor(MAZE_W * 0.42);
        const bottom = goal.y >= Math.floor(MAZE_H * 0.58);
        return (right && top) || (left && bottom) || (right && bottom);
      })(),
      endingType: typeof drawBossChallengeTicketType,
      rouletteBoundaries: (() => {
        const originalRandom = Math.random;
        try {
          Math.random = () => 0;
          const rarest = drawBossChallengeTicketType();
          Math.random = () => 1.5 / 1000000;
          const middle = drawBossChallengeTicketType();
          Math.random = () => 0.5;
          const standard = drawBossChallengeTicketType();
          return [rarest, middle, standard];
        } finally {
          Math.random = originalRandom;
        }
      })()
    }));

    assert(firstFloor.player.name === 'テスト推し', '入力した推し名が反映されていません。');
    assert(firstFloor.map.floor === 1, '開始時の階層が1Fではありません。');
    assert(firstFloor.map.chests.length === 6, '1Fの宝箱数が6個ではありません。');
    assert(firstFloor.equippedItemsExist, '初期装備に存在しない装備IDが含まれています。');
    assert(firstFloor.goalIsInAllowedZone, '1Fの階段が指定された3領域の外に配置されています。');
    assert(firstFloor.endingType === 'function', '通常版ルーレットが読み込まれていません。');
    assert(
      firstFloor.rouletteBoundaries.join(',') === 'moe_select_60_challenge,moe_select_30_challenge,limited_cheki_challenge',
      '通常版ルーレットの確率境界が変わっています。'
    );
    assert(new Set(firstFloor.normalEnemyIds).size === firstFloor.normalEnemyIds.length, '敵IDが重複しています。');
    assert(new Set(firstFloor.equipmentIds).size === firstFloor.equipmentIds.length, '装備IDが重複しています。');

    const damageFloors = await page.evaluate(() => potoroEnemyDamageFloorReport());
    const normalDamageFloors = damageFloors.filter(enemy => enemy.id !== 'boss');
    const bossDamageFloor = damageFloors.find(enemy => enemy.id === 'boss');
    assert(normalDamageFloors.every(enemy => enemy.minimumDamage >= 2 && enemy.minimumDamage <= 6), '通常敵の最低ダメージが想定範囲外です。');
    assert(bossDamageFloor?.minimumDamage === 7, 'ボスの最低ダメージが7ではありません。');

    const armoredDamage = await page.evaluate(() => {
      const enemy = getEnemyById('shisseki');
      return calculateEnemyBasicDamage(enemy,999,0);
    });
    assert(armoredDamage === 6, '高防御時の終盤敵ダメージが最低値になりません。');

    const enemyRotation = await page.evaluate(() => {
      const originalRandom = Math.random;
      try {
        state.lastMapEnemyId = null;
        Math.random = () => 0;
        const first = selectRandomMapEnemy();
        const second = selectRandomMapEnemy();
        const rememberedBeforeReport = state.lastMapEnemyId;
        potoroEnemyZoneReport();
        return {
          first:first?.id || '',
          second:second?.id || '',
          rememberedBeforeReport,
          rememberedAfterReport:state.lastMapEnemyId
        };
      } finally {
        Math.random = originalRandom;
      }
    });
    assert(enemyRotation.first && enemyRotation.second && enemyRotation.first !== enemyRotation.second, '同じ通常敵が連続して選ばれます。');
    assert(enemyRotation.rememberedBeforeReport === enemyRotation.second, '直前に出現した通常敵が記録されません。');
    assert(enemyRotation.rememberedAfterReport === enemyRotation.second, '敵ゾーン診断が出現履歴を書き換えます。');

    const rotationReset = await page.evaluate(() => {
      setupFloor(1);
      return state.lastMapEnemyId;
    });
    assert(rotationReset === null, '階層生成時に通常敵の出現履歴がリセットされません。');

    await page.locator('#mapItemBtn').click();
    await page.locator('#subMenu').waitFor({ state: 'visible' });
    assert(await page.locator('#subMenuTitle').textContent() === 'どうぐ', 'マップのどうぐメニューが開きません。');
    await page.evaluate(() => closeSubMenu());

    await page.locator('#mapEquipBtn').click();
    await page.locator('#equipMenu').waitFor({ state: 'visible' });
    await page.evaluate(() => closeEquipMenu());

    const treasureChoice = await page.evaluate(() => {
      const originalRandom = Math.random;
      try {
        Math.random = () => 0;
        const beforeWeapon = state.player.equip.weapon;
        const reward = giveMapTreasureEquipment();
        return {
          beforeWeapon,
          rewardId:reward?.drop?.id || '',
          menuVisible:!document.getElementById('treasureMenu')?.classList.contains('hidden'),
          comparison:document.querySelector('#treasureMenu .treasure-comparison')?.textContent || '',
          busy:state.busy
        };
      } finally {
        Math.random = originalRandom;
      }
    });
    assert(treasureChoice.rewardId && treasureChoice.rewardId !== treasureChoice.beforeWeapon, '宝箱から未入手装備を獲得できません。');
    assert(treasureChoice.menuVisible && treasureChoice.busy, '宝箱の装備比較モーダルが表示されません。');
    assert(treasureChoice.comparison.includes('現在：ご奉仕ロッド'), '宝箱モーダルに現在装備が表示されません。');
    assert(treasureChoice.comparison.includes('攻↑'), '宝箱モーダルに能力差が表示されません。');

    if(process.env.POTORO_TEST_SCREENSHOT){
      const outputDirectory = path.join(root, 'test-results');
      fs.mkdirSync(outputDirectory, { recursive: true });
      await page.waitForTimeout(1500);
      await page.screenshot({
        path:path.join(outputDirectory, 'treasure-equip-choice-mobile.png'),
        fullPage:true
      });
    }

    await page.getByRole('button', { name: '今すぐ装備', exact: true }).click();
    const equippedTreasure = await page.evaluate(() => ({
      weapon:state.player.equip.weapon,
      menuHidden:document.getElementById('treasureMenu')?.classList.contains('hidden'),
      busy:state.busy,
      message:document.getElementById('mapMessage')?.textContent || ''
    }));
    assert(equippedTreasure.weapon === treasureChoice.rewardId, '宝箱から入手した装備をその場で装備できません。');
    assert(equippedTreasure.menuHidden && !equippedTreasure.busy, '即時装備後に宝箱モーダルの操作ロックが解除されません。');
    assert(equippedTreasure.message.includes('装備した'), '即時装備の完了メッセージが表示されません。');

    const secondFloor = await page.evaluate(() => {
      setupFloor(2);
      const snapshot = getMapSnapshot();
      const goal = snapshot.boss;
      const right = goal.x >= Math.floor(MAZE_W * 0.58);
      const top = goal.y <= Math.floor(MAZE_H * 0.42);
      const left = goal.x <= Math.floor(MAZE_W * 0.42);
      const bottom = goal.y >= Math.floor(MAZE_H * 0.58);
      snapshot.goalIsInAllowedZone = (right && top) || (left && bottom) || (right && bottom);
      return snapshot;
    });
    assert(secondFloor.floor === 2, '2Fを生成できません。');
    assert(secondFloor.chests.length === 8, '2Fの宝箱数が8個ではありません。');
    assert(secondFloor.boss.x >= 0 && secondFloor.boss.y >= 0, '2Fにボスが配置されていません。');
    assert(secondFloor.goalIsInAllowedZone, '2Fのボスが指定された3領域の外に配置されています。');

    const secondFloorBeforeTown = await page.evaluate(() => JSON.stringify(getMapSnapshot()));
    await page.locator('#mapTownBtn').click();
    await page.locator('.potoro-map-choice-primary').click();
    await walkField('town');
    await page.locator('#townDialog').getByRole('button',{name:'町へ入る',exact:true}).click();
    await page.locator('#townVisitBtn').click();
    await departTown();
    assert(await page.evaluate(() => JSON.stringify(getMapSnapshot())) === secondFloorBeforeTown, '町との往復で2Fの探索状態が失われます。');

    await page.evaluate(() => {
      setupFloor(1);
      startBattle(getEnemyById('teiji'), true);
    });
    await page.locator('#battleScreen').waitFor({ state: 'visible' });
    assert(await page.locator('#enemySlots .enemy-slot').count() >= 1, '通常敵が戦闘画面に表示されていません。');
    assert((await page.locator('#messageText').textContent()).includes('はじめてのお給仕です'), '初回お給仕の案内が表示されません。');

    const attackResult = await page.evaluate(async () => {
      const beforeEnemyHp = currentEnemy().hp;
      const originalSleep = sleep;
      try {
        sleep = () => Promise.resolve();
        await playerAction('attack');
      } finally {
        sleep = originalSleep;
      }
      return {
        beforeEnemyHp,
        afterEnemyHp: currentEnemy()?.hp ?? 0,
        busy: state.busy
      };
    });
    assert(attackResult.afterEnemyHp < attackResult.beforeEnemyHp, '通常攻撃で敵のHPが減りません。');
    assert(!attackResult.busy, '通常攻撃後も操作ロックが解除されません。');

    await page.getByRole('button', { name: '効果一覧', exact: true }).click();
    await page.locator('#helpModal').waitFor({ state: 'visible' });
    const effectHelp = await page.evaluate(() => {
      const allItems = [...equipmentData.weapons,...equipmentData.uniforms];
      const rows = [...document.querySelectorAll('[data-help-equipment]')];
      const rowText = id => document.querySelector(`[data-help-equipment="${id}"] > span`)?.textContent || '';
      return {
        itemCount:allItems.length,
        rowCount:rows.length,
        allItemsShown:allItems.every(item => rows.some(row => row.dataset.helpEquipment === item.id)),
        cotton:rowText('heart_tiara'),
        apron:rowText('white_apron'),
        photo:rowText('broMaid_photo'),
        teaDress:rowText('tea_time_dress'),
        hammer:rowText('service_hammer'),
        magicCostsMatch:potoroMagicLevelOrderReport().order.every(magic => {
          const row = document.querySelector(`[data-help-magic="${magic.id}"]`);
          return row?.querySelector('span')?.textContent.startsWith(`基本TP${magic.mp} / `);
        })
      };
    });
    assert(effectHelp.rowCount === effectHelp.itemCount && effectHelp.allItemsShown, '効果一覧に全装備が1回ずつ表示されません。');
    assert(effectHelp.cotton === '防御+3・すばやさ+1', 'コットンシュシュの性能表示が実データと違います。');
    assert(effectHelp.apron === '防御+4 / 基本服装備', '基本服装備の説明が維持されていません。');
    assert(effectHelp.photo === '防御+3・トーク+5', '推しのブロマイドに旧性能が残っています。');
    assert(effectHelp.teaDress.includes('毎ターンTP+1'), '装備のターン回復量が表示されません。');
    assert(effectHelp.hammer.includes('防御ダウン中の敵へダメージ+25%'), '装備の防御ダウン特効が表示されません。');
    assert(effectHelp.magicCostsMatch, 'おまじないの基本消費TPが効果一覧に表示されません。');

    const photoDefense = await page.evaluate(() => {
      const originalAccessory = state.player.equip.accessory;
      try {
        state.player.equip.accessory = '';
        const withoutPhoto = totalDef();
        state.player.equip.accessory = 'broMaid_photo';
        return totalDef() - withoutPhoto;
      } finally {
        state.player.equip.accessory = originalAccessory;
      }
    });
    assert(photoDefense === 3, '推しのブロマイドを装備しても防御が3増えません。');

    const updatedEffectHelp = await page.evaluate(() => {
      const cotton = findUniform('heart_tiara');
      const teaDress = findUniform('tea_time_dress');
      const originalCotton = {name:cotton.name,def:cotton.def,rarity:cotton.rarity};
      const originalRegen = teaDress.effect.turnMpRegen;
      const addedItem = {id:'test_effect_help',slot:'accessory',name:'検査用アクセ',rarity:'B',def:5,effect:{turnMpRegen:2}};
      try {
        cotton.name = '検査用シュシュ';
        cotton.def = 9;
        cotton.rarity = 'A';
        teaDress.effect.turnMpRegen = 2;
        equipmentData.uniforms.push(addedItem);
        closeHelp();
        openHelp();
        return {
          cottonName:document.querySelector('[data-help-equipment="heart_tiara"] > b')?.textContent || '',
          cottonDescription:document.querySelector('[data-help-equipment="heart_tiara"] > span')?.textContent || '',
          teaDress:document.querySelector('[data-help-equipment="tea_time_dress"] > span')?.textContent || '',
          addedItem:document.querySelector('[data-help-equipment="test_effect_help"] > span')?.textContent || ''
        };
      } finally {
        Object.assign(cotton,originalCotton);
        teaDress.effect.turnMpRegen = originalRegen;
        equipmentData.uniforms.splice(equipmentData.uniforms.indexOf(addedItem),1);
        openHelp();
      }
    });
    assert(updatedEffectHelp.cottonName === '検査用シュシュA', '装備名・ランクの変更が効果一覧に反映されません。');
    assert(updatedEffectHelp.cottonDescription === '防御+9・すばやさ+1', '性能変更後も効果一覧に古い数値が残ります。');
    assert(updatedEffectHelp.teaDress.includes('毎ターンTP+2'), '特殊性能の変更が効果一覧に反映されません。');
    assert(updatedEffectHelp.addedItem === '防御+5 / 毎ターンTP+2', '新しく追加した装備が効果一覧に反映されません。');
    assert(await page.locator('[data-help-equipment]').count() === effectHelp.itemCount, '効果一覧を再表示すると装備行が重複します。');

    for(const viewport of [{width:320,height:740},{width:390,height:844},{width:1280,height:900}]){
      await page.setViewportSize(viewport);
      const helpFits = await page.evaluate(() => {
        return [...document.querySelectorAll('#helpModal .help-table > div')].every(row => {
          const bounds = row.getBoundingClientRect();
          return bounds.left >= 0 && bounds.right <= window.innerWidth + 1
            && [...row.children].every(child => child.scrollWidth <= child.clientWidth + 1);
        });
      });
      assert(helpFits, `効果一覧の文字が画面または列からはみ出します (${viewport.width}px)。`);
      if(process.env.POTORO_TEST_SCREENSHOT && viewport.width !== 320){
        const outputDirectory = path.join(root, 'test-results');
        fs.mkdirSync(outputDirectory, {recursive:true});
        await page.locator('[data-help-equipment-slot="body"]').evaluate(table => table.parentElement.scrollIntoView({block:'start'}));
        await page.screenshot({path:path.join(outputDirectory, `effect-help-${viewport.width}.png`),fullPage:true});
      }
    }
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(() => closeHelp());

    await page.getByRole('button', { name: 'おまじない', exact: true }).click();
    await page.locator('#subMenu').waitFor({ state: 'visible' });
    assert(await page.locator('#subMenuTitle').textContent() === 'おまじない', 'おまじないメニューが開きません。');
    await page.evaluate(() => closeSubMenu());

    await page.getByRole('button', { name: 'どうぐ', exact: true }).click();
    await page.locator('#subMenu').waitFor({ state: 'visible' });
    assert(await page.locator('#subMenuTitle').textContent() === 'どうぐ', '戦闘中のどうぐメニューが開きません。');
    await page.evaluate(() => closeSubMenu());

    const enemyHint = await page.evaluate(() => {
      endBattleToMap();
      startBattle(getEnemyById('maigo'), true);
      return {
        message:document.getElementById('messageText')?.textContent || '',
        seen:[...(state.seenEnemyHints || [])],
        hintCount:typeof potoroEnemyHintReport === 'function' ? potoroEnemyHintReport().length : 0
      };
    });
    assert(enemyHint.message.includes('とてもすばやく'), '敵の初遭遇ヒントが表示されません。');
    assert(enemyHint.seen.includes('maigo'), '表示済みの敵ヒントが記録されません。');
    assert(enemyHint.hintCount === 13, '敵特徴ヒントの登録数が想定と違います。');

    const repeatedHintMessage = await page.evaluate(() => {
      endBattleToMap();
      startBattle(getEnemyById('maigo'), true);
      return document.getElementById('messageText')?.textContent || '';
    });
    assert(!repeatedHintMessage.includes('とてもすばやく'), '同じ敵の初遭遇ヒントが繰り返し表示されます。');

    const preparedIntent = await page.evaluate(() => {
      const enemy = currentEnemy();
      const originalRandom = Math.random;
      try {
        Math.random = () => 0;
        const prepared = prepareEnemySpecialIntent(enemy);
        updateUI();
        return {
          prepared,
          pending:enemy.pendingSpecial,
          badge:document.querySelector('.enemy-special-intent')?.textContent || ''
        };
      } finally {
        Math.random = originalRandom;
      }
    });
    assert(preparedIntent.prepared, '敵の特殊行動予兆を準備できません。');
    assert(preparedIntent.pending === 'lost', '予兆に対応する特殊行動が記録されません。');
    assert(preparedIntent.badge.includes('迷わせる案内'), '敵カードに特殊行動予兆が表示されません。');

    if(process.env.POTORO_TEST_SCREENSHOT){
      const outputDirectory = path.join(root, 'test-results');
      fs.mkdirSync(outputDirectory, { recursive: true });
      await page.screenshot({
        path:path.join(outputDirectory, 'enemy-special-intent-mobile.png'),
        fullPage:true
      });
    }

    const resolvedIntent = await page.evaluate(async () => {
      const enemy = currentEnemy();
      const originalSleep = sleep;
      state.player.status.confuse = 0;
      try {
        sleep = () => Promise.resolve();
        const used = await enemySpecialAction(enemy);
        updateUI();
        return {
          used,
          pending:enemy.pendingSpecial,
          confuse:state.player.status.confuse,
          badge:document.querySelector('.enemy-special-intent')?.textContent || ''
        };
      } finally {
        sleep = originalSleep;
      }
    });
    assert(resolvedIntent.used, '予兆後の特殊行動が発動しません。');
    assert(!resolvedIntent.pending, '発動後も特殊行動予兆が残っています。');
    assert(resolvedIntent.confuse > 0, '予兆に対応した特殊効果が適用されません。');
    assert(!resolvedIntent.badge, '発動後も敵カードに予兆が表示されています。');

    const statusBadges = await page.evaluate(() => {
      const p = state.player;
      p.status.sleep = 0;
      p.status.confuse = 0;
      p.status.defDown = 2;
      p.itemBuffs = {
        atk:4,
        def:0,
        spd:0,
        talk:0,
        turns:2,
        magicBoost:1.4,
        magicBoostTurns:1
      };
      p.buffs = {kiraAura:3,perfectService:1};
      updateUI();

      return {
        text:statusText(),
        badges:[...document.querySelectorAll('#playerStatusEffects .status-effect-badge')].map(element => ({
          effect:element.dataset.effect,
          text:element.textContent,
          tone:[...element.classList].find(name => ['positive','negative','neutral'].includes(name)) || ''
        })),
        alert:document.getElementById('playerStatusEffects').classList.contains('potoro-status-alert')
      };
    });
    assert(statusBadges.text.includes('防御DOWN') && statusBadges.text.includes('キラキラオーラ'), 'バフとデバフを同時に状態欄へ表示できません。');
    assert(statusBadges.badges.some(badge => badge.effect === 'defDown' && badge.tone === 'negative'), 'デバフが悪い効果として色分けされません。');
    assert(statusBadges.badges.some(badge => badge.effect === 'kiraAura' && badge.text.includes('残り3') && badge.tone === 'positive'), 'キラキラオーラの残りターンが表示されません。');
    assert(statusBadges.badges.some(badge => badge.effect === 'magicBoost' && badge.text.includes('残り1')), 'どうぐのおまじない強化が表示されません。');
    assert(statusBadges.alert, 'デバフ中に状態欄の注意表示が有効になりません。');

    const buffOnlyAlert = await page.evaluate(() => {
      state.player.status.defDown = 0;
      updateUI();
      return document.getElementById('playerStatusEffects').classList.contains('potoro-status-alert');
    });
    assert(!buffOnlyAlert, '良い効果だけでもデバフ注意表示が有効になります。');

    if(process.env.POTORO_TEST_SCREENSHOT){
      await page.waitForTimeout(500);
      await page.screenshot({
        path:path.join(root, 'test-results', 'player-status-badges-mobile.png'),
        fullPage:true
      });
    }

    const equipmentEffects = await page.evaluate(async () => {
      const originalPlayer = state.player;
      const originalSleep = sleep;
      const originalCutin = showCutin;
      const originalRandom = Math.random;
      try {
        sleep = () => Promise.resolve();
        showCutin = () => Promise.resolve();
        Math.random = () => 0;
        endBattleToMap();
        state.player = makePlayer();
        const p = state.player;
        p.mapX = p.mapY = 1;
        p.equip.weapon = 'speed_tray';
        const mapSpeed = totalSpd();
        startBattle(getEnemyById('teiji'),true);
        state.enemiesInBattle.forEach(enemy => { enemy.spd = 20; enemy.sleepTurns = 4; });
        const openingSpeed = totalSpd();
        const openingEnemyFirst = enemyActsFirstThisTurn();
        const partySize = state.enemiesInBattle.length;
        await enemyTurn();
        const laterSpeed = totalSpd();
        const laterEnemyFirst = enemyActsFirstThisTurn();
        const firstCount = state.enemyTurnCount;
        await enemyTurn();
        const secondCount = state.enemyTurnCount;
        const secondSpeed = totalSpd();
        endBattleToMap();
        const returnedMapSpeed = totalSpd();
        startBattle(getEnemyById('teiji'),true);
        const restartedSpeed = totalSpd();
        state.enemiesInBattle.forEach(enemy => { enemy.sleepTurns = 20; });

        p.lv = 12;
        p.hp = 10;
        p.maxHp = 200;
        p.mp = p.maxMp = 100;
        p.equip.weapon = 'magic_staff';
        p.equip.body = 'white_apron';
        await useMagic('heal');
        const staffHealing = p.hp - 10;
        const staffCost = 100 - p.mp;

        p.equip.body = 'healing_apron';
        p.hp = 10;
        state.enemyActedFirst = true;
        await useMagicHealConfigured();
        const stackedHealing = p.hp - 10;
        p.hp = 198;
        await useMagicHealConfigured();
        const cappedHp = p.hp;

        p.status = {sleep:2,confuse:3,defDown:2};
        Math.random = () => 0.20;
        const missedCure = equipmentRecoveryStatusMessage(1);
        const missedStatus = {...p.status};
        Math.random = () => 0.19;
        const zeroCure = equipmentRecoveryStatusMessage(0);
        const zeroStatus = {...p.status};
        const hitCure = equipmentRecoveryStatusMessage(1);
        const hitStatus = {...p.status};
        p.equip.body = 'white_apron';
        p.status = {sleep:2,confuse:3,defDown:2};
        const unequippedCure = equipmentRecoveryStatusMessage(1);
        const unequippedStatus = {...p.status};

        endBattleToMap();
        p.equip.body = 'healing_apron';
        p.hp = 10;
        p.items.omurice = 2;
        await useItem('omurice');
        const itemHealing = p.hp - 10;
        const itemStatus = {...p.status};
        const itemMessage = document.getElementById('mapMessage').textContent;
        p.equip.body = 'white_apron';
        p.hp = 10;
        await useItem('omurice');
        const normalItemHealing = p.hp - 10;

        return {
          mapSpeed,openingSpeed,openingEnemyFirst,partySize,laterSpeed,laterEnemyFirst,
          firstCount,secondCount,secondSpeed,returnedMapSpeed,restartedSpeed,
          staffHealing,staffCost,stackedHealing,cappedHp,
          missedCure,missedStatus,zeroCure,zeroStatus,hitCure,hitStatus,
          unequippedCure,unequippedStatus,itemHealing,itemStatus,itemMessage,normalItemHealing
        };
      } finally {
        sleep = originalSleep;
        showCutin = originalCutin;
        Math.random = originalRandom;
        endBattleToMap();
        state.player = originalPlayer;
        updateUI();
        updateMapStatusPanel();
      }
    });
    assert(equipmentEffects.openingSpeed === equipmentEffects.mapSpeed + 20, 'スピードトレイの開幕すばやさ補正が働きません。');
    assert(!equipmentEffects.openingEnemyFirst && equipmentEffects.laterEnemyFirst, 'スピードトレイの補正が先手判定に反映されません。');
    assert(equipmentEffects.laterSpeed === equipmentEffects.mapSpeed - 3 && equipmentEffects.secondSpeed === equipmentEffects.laterSpeed, '開幕以降の速度ペナルティが正しく適用されません。');
    assert(equipmentEffects.partySize === 2 && equipmentEffects.firstCount === 1 && equipmentEffects.secondCount === 2, '2体出現時にターンが敵数分進んでしまいます。');
    assert(equipmentEffects.returnedMapSpeed === equipmentEffects.mapSpeed && equipmentEffects.restartedSpeed === equipmentEffects.openingSpeed, '速度補正がマップに残るか、次のお給仕でリセットされません。');
    assert(equipmentEffects.staffHealing === 42 && equipmentEffects.staffCost === 5, 'おまじないステッキの回復+20%・TP軽減が働きません。');
    assert(equipmentEffects.stackedHealing === 52 && equipmentEffects.cappedHp === 200, '回復補正の重ね掛け・HP上限が正しく計算されません。');
    assert(!equipmentEffects.missedCure && Object.values(equipmentEffects.missedStatus).every(value => value > 0), '状態回復の20%当選境界が不正です。');
    assert(!equipmentEffects.zeroCure && Object.values(equipmentEffects.zeroStatus).every(value => value > 0), 'HP回復量0でも状態回復が発動します。');
    assert(equipmentEffects.hitCure.includes('装備効果') && Object.values(equipmentEffects.hitStatus).every(value => value === 0), '状態回復の当選時に解除・通知されません。');
    assert(!equipmentEffects.unequippedCure && Object.values(equipmentEffects.unequippedStatus).every(value => value > 0), '癒しのエプロン未装備でも状態回復が発動します。');
    assert(equipmentEffects.itemHealing === 39 && equipmentEffects.normalItemHealing === 30, '道具に一般回復補正が働かないか、回復おまじない補正まで適用されます。');
    assert(equipmentEffects.itemMessage.includes('装備効果') && Object.values(equipmentEffects.itemStatus).every(value => value === 0), '道具のHP回復時に状態回復が実行・通知されません。');

    const stunEffect = await page.evaluate(async () => {
      const saved = {player:state.player,sleep,setMessage,enemyBasicAttack,enemySpecialAction,random:Math.random};
      const messages = [];
      let attacks = 0;
      try {
        sleep = () => Promise.resolve();
        Math.random = () => 0;
        setMessage = message => { messages.push(message); saved.setMessage(message); };
        enemySpecialAction = async () => false;
        enemyBasicAttack = async () => { attacks++; };
        state.player = makePlayer();
        state.player.mapX = state.player.mapY = 1;
        state.player.equip.weapon = 'punish_frying_pan';
        startBattle(getEnemyById('teiji'),true);
        state.enemiesInBattle = [state.enemiesInBattle[0]];
        const enemy = currentEnemy();
        enemy.hp = enemy.maxHp = 999;
        enemy.spd = 0;
        await playerAction('attack');
        const skippedAttacks = attacks;
        const afterStun = {stun:enemy.stunTurns,sleep:enemy.sleepTurns || 0};
        await enemyTurn();
        const resumedAttacks = attacks;
        enemy.stunTurns = 1;
        enemy.sleepTurns = 2;
        updateUI();
        const sleepingBadge = document.querySelector('.enemy-slot').classList.contains('sleeping');
        await enemyTurn();
        const preservedSleep = enemy.sleepTurns;
        enemy.sleepTurns = 0;
        enemy.stunTurns = 1;
        updateUI();
        const stunBadge = document.querySelector('.enemy-slot').classList.contains('stunned');
        return {messages,skippedAttacks,afterStun,resumedAttacks,preservedSleep,sleepingBadge,stunBadge};
      } finally {
        sleep = saved.sleep;
        setMessage = saved.setMessage;
        enemyBasicAttack = saved.enemyBasicAttack;
        enemySpecialAction = saved.enemySpecialAction;
        Math.random = saved.random;
        endBattleToMap();
        state.player = saved.player;
        updateUI();
        updateMapStatusPanel();
      }
    });
    assert(stunEffect.skippedAttacks === 0 && stunEffect.resumedAttacks === 1, 'ひるみで次の行動を1回だけ休みません。');
    assert(stunEffect.afterStun.stun === 0 && stunEffect.afterStun.sleep === 0, 'フライパンのひるみが眠りとして適用されます。');
    assert(stunEffect.messages.some(message => message.includes('ひるんで動けない')) && stunEffect.messages.some(message => message.includes('ひるみから立ち直った')), 'ひるみ開始・終了のメッセージが表示されません。');
    assert(!stunEffect.messages.some(message => message.includes('目を覚ました')), 'ひるみ解除で目を覚ましたと表示されます。');
    assert(stunEffect.preservedSleep === 2 && stunEffect.sleepingBadge && stunEffect.stunBadge, 'ひるみが既存の眠りを上書きするか、状態表示が不正です。');

    if(process.env.POTORO_TEST_SCREENSHOT){
      await page.evaluate(() => {
        startBattle(getEnemyById('teiji'),true);
        currentEnemy().stunTurns = 1;
        updateUI();
      });
      await page.waitForTimeout(1200);
      await page.screenshot({path:path.join(root,'test-results','enemy-stun-mobile.png'),fullPage:true});
      await page.evaluate(() => endBattleToMap());
    }

    const comboTargets = await page.evaluate(async () => {
      const saved = {player:state.player,sleep,showCutin,enemyFlash,setMessage,random:Math.random};
      const hits = [];
      const messages = [];
      try {
        sleep = () => Promise.resolve();
        showCutin = () => Promise.resolve();
        Math.random = () => 0.75;
        setMessage = message => { messages.push(message); saved.setMessage(message); };
        enemyFlash = index => {
          saved.enemyFlash(index);
          const slots = [...document.querySelectorAll('.enemy-slot')];
          const labels = [...document.querySelectorAll(`.damage-text[data-enemy-index="${index}"]`)];
          const label = labels[0];
          const labelRect = label?.getBoundingClientRect();
          const slotRect = slots[index].getBoundingClientRect();
          hits.push({index,flashing:slots.map((slot,i) => slot.querySelector('img').classList.contains('hit') ? i : -1).filter(i => i >= 0),labelCount:labels.length,label:label?.textContent,centerOffset:labelRect ? Math.abs(labelRect.left + labelRect.width / 2 - slotRect.left - slotRect.width / 2) : null});
        };
        state.player = makePlayer();
        const p = state.player;
        p.mapX = p.mapY = 1;
        p.lv = 12;
        p.mp = p.maxMp = 100;
        startBattle(getEnemyById('teiji'),true);
        const first = state.enemiesInBattle[0];
        const second = {...first,name:'連撃テストのご主人様',hp:1,maxHp:1};
        first.hp = first.maxHp = 9999;
        first.sleepTurns = second.sleepTurns = 20;
        state.enemiesInBattle = [first,second];
        state.targetIndex = 0;
        updateUI();
        await useMagic('combo');
        return {hits,messages,firstHp:first.hp,secondHp:second.hp,cost:100-p.mp,targetIndex:state.targetIndex};
      } finally {
        sleep = saved.sleep;
        showCutin = saved.showCutin;
        enemyFlash = saved.enemyFlash;
        setMessage = saved.setMessage;
        Math.random = saved.random;
        endBattleToMap();
        state.player = saved.player;
        updateUI();
        updateMapStatusPanel();
      }
    });
    assert(JSON.stringify(comboTargets.hits.map(hit => hit.index)) === '[1,0,0,0]', '連撃がランダム対象に当たらないか、撃破済みの敵を狙っています。');
    assert(comboTargets.hits.every(hit => hit.flashing.length === 1 && hit.flashing[0] === hit.index), '連撃の命中対象と光る敵が一致しません。');
    assert(comboTargets.hits.every(hit => hit.labelCount === 1 && /^-\d+$/.test(hit.label) && hit.centerOffset < 2), '連撃の数値が命中対象の位置に表示されないか、連続ヒットで重なります。');
    assert(comboTargets.messages.some(message => message.includes('1回目！ 連撃テストのご主人様 に')), '連撃の各ヒットに命中した敵名が表示されません。');
    assert(comboTargets.firstHp < 9999 && comboTargets.secondHp === 0 && comboTargets.cost === 8 && comboTargets.targetIndex === 0, '連撃のHP・TP処理またはプレイヤーの対象選択が変わってしまいます。');

    if(process.env.POTORO_TEST_SCREENSHOT){
      await page.waitForTimeout(2200);
      await page.evaluate(() => {
        window.testComboSaved = {player:state.player,sleep,showCutin,random:Math.random};
        state.player = makePlayer();
        const p = state.player;
        p.mapX = p.mapY = 1;
        p.lv = 12;
        p.mp = p.maxMp = 100;
        startBattle(getEnemyById('teiji'),true);
        const first = state.enemiesInBattle[0];
        first.hp = first.maxHp = 999;
        first.sleepTurns = 20;
        state.enemiesInBattle = [first,{...first,name:'迷子のご主人様',id:'maigo',image:getEnemyById('maigo').image}];
        state.targetIndex = 0;
        Math.random = () => 0.75;
        showCutin = () => Promise.resolve();
        sleep = duration => duration === 420
          ? new Promise(resolve => { window.testComboRelease = resolve; })
          : Promise.resolve();
        window.testComboPromise = useMagic('combo');
      });
      await page.waitForFunction(() => typeof window.testComboRelease === 'function');
      await page.evaluate(() => {
        document.querySelectorAll('.damage-text[data-enemy-index]').forEach(label => {
          label.style.animation = 'none';
          label.style.opacity = '1';
          label.style.transform = 'translateX(-50%)';
        });
      });
      await page.screenshot({path:path.join(root,'test-results','combo-damage-mobile.png'),fullPage:true});
      await page.evaluate(async () => {
        sleep = () => Promise.resolve();
        window.testComboRelease();
        await window.testComboPromise;
        sleep = window.testComboSaved.sleep;
        showCutin = window.testComboSaved.showCutin;
        Math.random = window.testComboSaved.random;
        endBattleToMap();
        state.player = window.testComboSaved.player;
        updateUI();
        updateMapStatusPanel();
        delete window.testComboSaved;
        delete window.testComboRelease;
        delete window.testComboPromise;
      });
    }

    const chargedActions = await page.evaluate(async () => {
      const saved = {player:state.player,sleep,showCutin,random:Math.random,buffState:{...buffState}};
      try {
        sleep = () => Promise.resolve();
        showCutin = () => Promise.resolve();
        Math.random = () => 0.5;
        async function run(kind,charged){
          endBattleToMap();
          state.player = makePlayer();
          const p = state.player;
          p.mapX = p.mapY = 1;
          p.lv = 12;
          p.hp = p.maxHp = 200;
          p.mp = p.maxMp = 200;
          p.buffs = {};
          buffState.charge = buffState.aura = 0;
          startBattle(getEnemyById('teiji'),true);
          state.enemiesInBattle = [state.enemiesInBattle[0]];
          const enemy = currentEnemy();
          enemy.hp = enemy.maxHp = 99999;
          enemy.spd = 0;
          enemy.sleepTurns = 50;
          let retained = false;
          if(charged){
            await useMagic('perfect_service');
            await playerAction('guard');
            p.hp -= 10;
            await useMagic('heal');
            retained = p.buffs.perfectService > 0;
          }
          const before = enemy.hp;
          if(kind === 'attack') await playerAction('attack');
          else await useMagic(kind);
          const damage = before - enemy.hp;
          const consumed = !p.buffs.perfectService;
          const secondBefore = enemy.hp;
          if(kind === 'attack') await playerAction('attack');
          else await useMagic(kind);
          return {damage,secondDamage:secondBefore-enemy.hp,retained,consumed};
        }
        const result = {};
        for(const kind of ['attack','moe','shower','nishiki','combo','rush','first_strike']){
          result[kind] = {normal:await run(kind,false),charged:await run(kind,true)};
        }
        return result;
      } finally {
        sleep = saved.sleep;
        showCutin = saved.showCutin;
        Math.random = saved.random;
        Object.assign(buffState,saved.buffState);
        endBattleToMap();
        state.player = saved.player;
        updateUI();
        updateMapStatusPanel();
      }
    });
    for(const [kind,result] of Object.entries(chargedActions)){
      const expected = kind === 'combo'
        ? Math.floor((result.normal.damage / 4) * 2.5) + (result.normal.damage / 4) * 3
        : Math.floor(result.normal.damage * 2.5);
      assert(result.charged.damage === expected, `${kind}に完璧なお給仕の2.5倍補正が正しく適用されません。`);
      assert(result.charged.retained && result.charged.consumed, `${kind}の強化が防御・回復で消えるか、攻撃後に残ります。`);
      assert(result.charged.secondDamage === result.normal.damage, `${kind}の2回目にも強化が適用されます。`);
    }

    const showerEquipment = await page.evaluate(async () => {
      const saved = {player:state.player,sleep,showCutin,random:Math.random,buffState:{...buffState}};
      try {
        let display = [];
        let flashing = [];
        sleep = duration => {
          const labels = [...document.querySelectorAll('.damage-text[data-enemy-index]')];
          if(duration === 900 && labels.length){
            display = labels.map(label => ({index:Number(label.dataset.enemyIndex),text:label.textContent}));
            flashing = [...document.querySelectorAll('.enemy-slot')].map((slot,index) => slot.querySelector('img').classList.contains('hit') ? index : -1).filter(index => index >= 0);
          }
          return Promise.resolve();
        };
        showCutin = () => Promise.resolve();
        Math.random = () => 0.5;
        const results = [];
        for(const setup of [
          {weapon:'rod'},
          {weapon:'calling_bell'},
          {weapon:'rod',accessory:'magic_ribbon'},
          {weapon:'legend_menu'},
          {weapon:'service_hammer',defDown:true},
          {weapon:'calling_bell',accessory:'magic_ribbon',charged:true}
        ]){
          document.querySelectorAll('.damage-text').forEach(label => label.remove());
          endBattleToMap();
          state.player = makePlayer();
          const p = state.player;
          p.mapX = p.mapY = 1;
          p.lv = 12;
          p.mp = p.maxMp = 200;
          p.equip.weapon = setup.weapon;
          if(setup.accessory) p.equip.accessory = setup.accessory;
          p.buffs = {perfectService:setup.charged ? 1 : 0};
          buffState.charge = buffState.aura = 0;
          startBattle(getEnemyById('teiji'),true);
          const regular = state.enemiesInBattle[0];
          regular.hp = regular.maxHp = 99999;
          regular.sleepTurns = 50;
          regular.equipmentDefDownTurns = setup.defDown ? 3 : 0;
          const boss = {...regular,boss:true,name:'補正テストBOSS'};
          state.enemiesInBattle = [regular,boss];
          const cfg = requireMagicConfig('shower');
          const base = Math.floor(magicPower(cfg.base) * (setup.charged ? 2.5 : 1));
          const magicRate = equipmentEffectValue('magicDamageRate');
          const bossRate = equipmentEffectValue('bossDamageRate');
          const defRate = setup.defDown ? equipmentEffectValue('defDownDamageRate') : 0;
          const expectedRegular = Math.floor(Math.floor(base * (1+magicRate)) * (1+defRate));
          const expectedBoss = Math.floor(Math.floor(Math.floor(Math.floor(base * cfg.bossRate) * (1+magicRate)) * (1+bossRate)) * (1+defRate));
          await useMagic('shower');
          results.push({setup,expectedRegular,expectedBoss,regular:99999-regular.hp,boss:99999-boss.hp,cost:200-p.mp,consumed:!p.buffs.perfectService,display,flashing});
        }
        return results;
      } finally {
        sleep = saved.sleep;
        showCutin = saved.showCutin;
        Math.random = saved.random;
        Object.assign(buffState,saved.buffState);
        endBattleToMap();
        state.player = saved.player;
        updateUI();
        updateMapStatusPanel();
      }
    });
    for(const result of showerEquipment){
      assert(result.regular === result.expectedRegular && result.boss === result.expectedBoss, `チェキフラッシュの装備補正が対象ごとに適用されません: ${JSON.stringify(result.setup)}`);
      assert(result.cost === (result.setup.accessory ? 13 : 12) && result.consumed, '全体攻撃のTP消費または強化消費が変わっています。');
      assert(result.display.length === 2 && result.display[0].text === `-${result.regular}` && result.display[1].text === `-${result.boss}`, '全体攻撃の各敵に実ダメージが表示されません。');
      assert(JSON.stringify(result.flashing) === '[0,1]', '全体攻撃で命中した敵全員が光りません。');
    }

    if(process.env.POTORO_TEST_SCREENSHOT){
      await page.waitForTimeout(2200);
      await page.evaluate(() => {
        window.testAreaHitSaved = {player:state.player,sleep};
        state.player = makePlayer();
        state.player.mapX = state.player.mapY = 1;
        startBattle(getEnemyById('teiji'),true);
        const enemy = state.enemiesInBattle[0];
        enemy.hp = enemy.maxHp = 999;
        state.enemiesInBattle = [enemy,{...enemy,boss:true,name:'表示確認BOSS'}];
        state.enemyActedFirst = true;
        sleep = () => new Promise(resolve => { window.testAreaHitRelease = resolve; });
        window.testAreaHitPromise = damageAllEnemiesConfigured('チェキフラッシュ！！',100,0.8);
      });
      await page.waitForTimeout(180);
      await page.screenshot({path:path.join(root,'test-results','area-hit-mobile.png'),fullPage:true});
      await page.evaluate(async () => {
        window.testAreaHitRelease();
        await window.testAreaHitPromise;
        sleep = window.testAreaHitSaved.sleep;
        endBattleToMap();
        state.player = window.testAreaHitSaved.player;
        updateUI();
        updateMapStatusPanel();
        delete window.testAreaHitSaved;
        delete window.testAreaHitRelease;
        delete window.testAreaHitPromise;
      });
    }

    const attackTargets = await page.evaluate(async () => {
      const saved = {player:state.player,sleep,enemyFlash,random:Math.random};
      try {
        sleep = () => Promise.resolve();
        const results = [];
        for(const kind of ['normal','critical','follow']){
          endBattleToMap();
          document.querySelectorAll('.damage-text').forEach(label => label.remove());
          state.player = makePlayer();
          const p = state.player;
          p.mapX = p.mapY = 1;
          p.equip.weapon = kind === 'follow' ? 'silver_tea_spoon' : 'rod';
          Math.random = () => kind === 'normal' ? 0.5 : 0;
          startBattle(getEnemyById('teiji'),true);
          const survivor = state.enemiesInBattle[0];
          survivor.hp = survivor.maxHp = 9999;
          survivor.spd = 0;
          survivor.sleepTurns = 20;
          const expectedMain = kind === 'normal' ? totalAtk() + 2 : Math.floor(totalAtk() * 2.2);
          const victim = {...survivor,name:'命中表示テストのご主人様',hp:kind === 'follow' ? expectedMain + 1 : 1};
          state.enemiesInBattle = [survivor,victim];
          state.targetIndex = 1;
          const hits = [];
          enemyFlash = index => {
            saved.enemyFlash(index);
            const label = document.querySelector(`.damage-text[data-enemy-index="${index}"]`);
            const slots = [...document.querySelectorAll('.enemy-slot')];
            hits.push({index,text:label?.textContent,critical:label?.classList.contains('critical-text'),flashing:slots.map((slot,i) => slot.querySelector('img').classList.contains('hit') ? i : -1).filter(i => i >= 0)});
          };
          await playerAction('attack');
          results.push({kind,hits,expectedMain,expectedFollow:Math.max(1,Math.floor(totalAtk()*0.55)),targetIndex:state.targetIndex,victimHp:victim.hp,survivorHp:survivor.hp});
        }
        return results;
      } finally {
        sleep = saved.sleep;
        enemyFlash = saved.enemyFlash;
        Math.random = saved.random;
        endBattleToMap();
        state.player = saved.player;
        updateUI();
        updateMapStatusPanel();
      }
    });
    for(const result of attackTargets){
      assert(result.hits.length === (result.kind === 'follow' ? 2 : 1), '通常攻撃・追撃の命中演出回数が変わっています。');
      assert(result.hits.every(hit => hit.index === 1 && JSON.stringify(hit.flashing) === '[1]'), '撃破した相手ではなく、生存する敵へ命中演出が移っています。');
      assert(result.hits[0].text === `-${result.expectedMain}` && result.hits[0].critical === (result.kind !== 'normal'), '通常・会心攻撃の実ダメージまたは会心表示が一致しません。');
      if(result.kind === 'follow') assert(result.hits[1].text === `-${result.expectedFollow}`, '追撃の実ダメージ表示が一致しません。');
      assert(result.victimHp === 0 && result.survivorHp === 9999 && result.targetIndex === 0, '撃破後の対象切替やHP処理が変わっています。');
    }

    const coinRewards = await page.evaluate(async () => {
      const saved = {sleep,giveReward,treasureDrop,showEnding,coins:state.player.townCoins};
      try {
        sleep=()=>Promise.resolve();giveReward=()=>false;treasureDrop=()=>false;showEnding=async()=>{};
        const results=[];
        for(const ids of [['teiji','maigo'],['boss'],['tamachan']]){
          const party=ids.map(id=>({...getEnemyById(id),exp:0,hp:0}));
          state.enemiesInBattle=party;state.enemy=party[0];state.lastDefeatedEnemy=null;state.inBattle=true;
          const before=state.player.townCoins || 0;
          await winBattle();
          results.push((state.player.townCoins || 0)-before);
        }
        return results;
      } finally {
        sleep=saved.sleep;giveReward=saved.giveReward;treasureDrop=saved.treasureDrop;showEnding=saved.showEnding;
        endBattleToMap();state.player.townCoins=saved.coins;
      }
    });
    assert(JSON.stringify(coinRewards)==='[10,0,0]', '通常敵のコイン報酬、BOSS・たまちゃんの報酬除外が変わっています。');

    await page.evaluate(() => {showTitleScreen();document.getElementById('oshiNameInput').value='新しい推し';});
    await page.locator('#startBtn').click();
    assert(await page.evaluate(() => state.location==='town' && !state.field && state.player.townCoins===30 && state.player.name==='新しい推し' && state.town.x===7 && state.town.y===10), '新しい冒険で町・フィールドの状態が初期化されません。');

    await walkTown('plaza');
    await page.getByRole('button',{name:'一緒にお給仕する',exact:true}).click();
    assert(await page.evaluate(()=>state.player.companion?.name==='こはる' && state.player.companion.hp===24 && state.player.companion.mp===8),'広場で仲間が加入しません。');
    const recruitedParty=await page.evaluate(()=>{const c=state.player.companion;recruitCompanion();return state.player.companion===c && partyMembers().length===2;});
    assert(recruitedParty,'仲間を重複して加入させてしまいます。');
    await page.locator('#townDialogClose').click();
    await walkTown('rest');
    await page.evaluate(()=>{const c=state.player.companion;c.hp=0;c.mp=0;c.status.sleep=2;});
    await page.getByRole('button',{name:'ひと休みする',exact:true}).click();
    assert(await page.evaluate(()=>{const c=state.player.companion;return c.hp===c.maxHp && c.mp===c.maxMp && c.status.sleep===0;}),'休憩室で倒れた仲間が回復しません。');
    await page.locator('#townDialogClose').click();
    await walkTown('exit');await departTown();
    assert(await page.evaluate(()=>state.player.companion?.hp===24),'町・フィールドの往復で仲間が失われます。');

    const companionChecks=await page.evaluate(async()=>{
      const saved={sleep,showCutin,random:Math.random,giveReward,treasureDrop,showEnding,applyEquipmentDamageCut,resistsEquipmentStatus,applyEquipmentStatusTurns};
      const checks={};
      try{
        sleep=()=>Promise.resolve();showCutin=()=>Promise.resolve();Math.random=()=>.5;giveReward=()=>false;treasureDrop=()=>false;
        const p=state.player,c=p.companion;
        const prepare=()=>{
          endBattleToMap();state.busy=false;startBattle(getEnemyById('teiji'),true);syncCompanionLevel(true);
          p.hp=p.maxHp;p.mp=p.maxMp;p.status={sleep:0,confuse:0,defDown:0};p.guarding=false;
          const e=state.enemiesInBattle[0];Object.assign(e,{hp:9999,maxHp:9999,def:4,spd:0,exp:0,skill:'',sleepTurns:20});
          c.strategy='attack';return e;
        };
        let e=prepare();state.enemiesInBattle.push({...e});
        await playerAction('guard');
        checks.oncePerRound=9999-e.hp===6 && state.enemiesInBattle[1].hp===9999 && state.enemyTurnCount===1;
        c.strategy='heal';p.hp=1;const playerTp=p.mp,allyTp=c.mp;
        await enemyTurn();checks.heal=p.hp===13 && c.mp===allyTp-3 && p.mp===playerTp;
        c.mp=0;p.hp=1;const before=e.hp;await enemyTurn();
        checks.noTpFallback=e.hp<before && c.mp===0 && p.hp===1;
        e=prepare();c.strategy='guard';await enemyTurn();checks.guard=c.guarding;
        let gearCalls=0;applyEquipmentDamageCut=damage=>{gearCalls++;return 1;};
        document.querySelector('.status-panel').classList.remove('player-hit');
        document.getElementById('companionPanel').classList.remove('player-hit');
        const allyHp=c.hp;e.atk=20;await enemyBasicAttack(e,{recipient:c});
        checks.separateDefense=c.hp===allyHp-6 && gearCalls===0;
        checks.correctHitPanel=document.getElementById('companionPanel').classList.contains('player-hit') && !document.querySelector('.status-panel').classList.contains('player-hit');
        const heroHp=p.hp;await enemyBasicAttack(e,{recipient:p});
        checks.heroEquipment=p.hp===heroHp-1 && gearCalls===1;
        resistsEquipmentStatus=()=>true;applyEquipmentStatusTurns=()=>1;
        checks.specialTargetMatrix=true;
        for(const skill of ['drain','double','confuse','powerup','sleep','drunk','defdown','lost','rush_pressure','spend','runaway','weight','boss']){
          c.hp=c.maxHp=1000;c.mp=100;c.status={sleep:0,confuse:0,defDown:0};c.guarding=false;
          e.skill=skill;e.pendingSpecial=skill;const hero=JSON.stringify({hp:p.hp,mp:p.mp,status:p.status});gearCalls=0;
          const used=await enemySpecialAction(e,c);
          checks.specialTargetMatrix=checks.specialTargetMatrix && used && gearCalls===0 && hero===JSON.stringify({hp:p.hp,mp:p.mp,status:p.status});
        }
        c.lv=0;syncCompanionLevel(true);
        e.skill='sleep';e.pendingSpecial='sleep';await enemySpecialAction(e,c);
        checks.separateSleep=c.status.sleep===2 && p.status.sleep===0;
        e.skill='spend';e.pendingSpecial='spend';const oldHeroTp=p.mp,oldAllyTp=c.mp;
        await enemySpecialAction(e,c);checks.separateTp=c.mp<oldAllyTp && p.mp===oldHeroTp;
        c.hp=c.maxHp;c.status={sleep:1,confuse:0,defDown:0};const oldEnemyHp=e.hp;
        await companionTurn();checks.sleepSkip=e.hp===oldEnemyHp && c.status.sleep===0;
        c.status.confuse=1;Math.random=()=>0;await companionTurn();
        checks.confuseSkip=e.hp===oldEnemyHp && c.status.confuse===0;
        Math.random=()=>.5;e=prepare();c.hp=0;
        checks.aliveTargetOnly=chooseEnemyPartyTarget()===p;
        const soloHp=e.hp;await companionTurn();checks.downSkip=e.hp===soloHp;
        c.hp=c.maxHp;p.hp=0;checks.allyTargetOnly=chooseEnemyPartyTarget()===c;
        await continueCompanionBattle();checks.heroDownContinues=state.inBattle && !state.busy && e.hp<9999 && !document.getElementById('companionContinueBtn').disabled;
        e=prepare();e.spd=999;e.sleepTurns=20;e.hp=1;
        await playerAction('attack');
        checks.fastEnemyAllyVictory=!state.inBattle && e.hp===0 && !state.busy && document.getElementById('mapScreen').classList.contains('hidden')===false;
        e=prepare();e.boss=true;e.spd=999;e.hp=1;let endings=0;
        showEnding=async()=>{endings++;state.busy=true;};
        const bossCoins=p.townCoins;await playerAction('attack');
        checks.bossAllyVictory=endings===1 && !state.inBattle && e.hp===0 && p.townCoins===bossCoins;
        checks.allActionsEndLocked=true;
        for(const action of ['guard','sleep','aura','tea']){
          e=prepare();e.boss=true;e.hp=1;endings=0;
          showEnding=async()=>{endings++;state.busy=true;hideElement('battleScreen');hideElement('mapScreen');showElement('endingScreen');};
          if(action==='guard') await playerAction('guard');
          else if(action==='tea'){p.items.tea=1;p.mp=0;await useItem('tea');}
          else{p.lv=5;p.mp=100;await useMagic(action);}
          checks[`endLocked_${action}`]=endings===1 && !state.inBattle && state.busy;
          checks.allActionsEndLocked=checks.allActionsEndLocked && checks[`endLocked_${action}`];
          hideElement('endingScreen');p.lv=1;
        }
        showEnding=saved.showEnding;
        e=prepare();p.hp=0;c.hp=1;e.sleepTurns=0;e.atk=999;
        await continueCompanionBattle();checks.partyGameOver=isPartyDefeated() && !state.inBattle && !document.getElementById('gameOverOverlay').classList.contains('hidden');
        hideGameOverScreen();state.busy=false;
        p.lv=3;syncCompanionLevel(true);
        checks.growth=c.lv===3 && c.maxHp===32 && c.maxMp===12 && c.atk===10 && c.def===11;
        p.hp=p.maxHp;
        return checks;
      }finally{
        sleep=saved.sleep;showCutin=saved.showCutin;Math.random=saved.random;giveReward=saved.giveReward;treasureDrop=saved.treasureDrop;showEnding=saved.showEnding;
        applyEquipmentDamageCut=saved.applyEquipmentDamageCut;resistsEquipmentStatus=saved.resistsEquipmentStatus;applyEquipmentStatusTurns=saved.applyEquipmentStatusTurns;
        endBattleToMap();state.busy=false;updateCompanionUI();
      }
    });
    assert(Object.values(companionChecks).every(Boolean),`2人パーティの検査に失敗: ${JSON.stringify(companionChecks)}`);
    await page.evaluate(()=>{startBattle(getEnemyById('teiji'),true);state.busy=false;updateUI();});
    await page.locator('#companionStrategy').selectOption('heal');
    assert(await page.evaluate(()=>state.player.companion.strategy)==='heal','作戦の選択が反映されません。');
    assert(await page.locator('#companionPanel img').evaluate(img=>getComputedStyle(img).filter)==='none','仲間の肌色を変えるフィルターが残っています。');
    assert(await page.evaluate(()=>{
      const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
      const ctx=canvas.getContext('2d');
      drawCompanionOnMap(ctx,32,{x:0,y:0},()=>true);
      const companionPixels=ctx.getImageData(0,32,32,24).data;
      ctx.clearRect(0,0,64,64);drawMapPlayer(ctx,32,{x:0,y:1});
      const originalPixels=ctx.getImageData(0,32,32,24).data;
      return companionPixels.every((value,index)=>value===originalPixels[index]);
    }),'マップの仲間の顔・衣装の色が元画像と違います。');
    if(process.env.POTORO_TEST_SCREENSHOT){
      await page.waitForTimeout(1500);
      for(const width of [320,390,1280]){
        await page.setViewportSize({width,height:844});
        await page.screenshot({path:path.join(root,'test-results',`party-battle-${width}.png`),fullPage:true});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'仲間のお給仕画面が横にはみ出します。');
      }
    }
    await page.evaluate(()=>{endBattleToMap();showTitleScreen();});
    await page.locator('#startBtn').click();
    assert(await page.evaluate(()=>!state.player.companion && partyMembers().length===1),'新しい冒険に前の仲間が残ります。');

    assert(!failedResponses.length, `読み込み失敗:\n${failedResponses.join('\n')}`);
    assert(!runtimeErrors.length, `ブラウザ実行エラー:\n${runtimeErrors.join('\n')}`);
    console.log('ブラウザ検査 OK: タイトル / あらすじ / 町・フィールド / 1F・2F往復 / 宝箱 / お給仕・装備 / 仲間加入・作戦・全敵特殊攻撃対象・勝敗');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
