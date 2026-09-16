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
    await page.locator('#mapScreen').waitFor({ state: 'visible' });

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
          hits.push({index,flashing:slots.map((slot,i) => slot.querySelector('img').classList.contains('hit') ? i : -1).filter(i => i >= 0)});
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
    assert(comboTargets.messages.some(message => message.includes('1回目！ 連撃テストのご主人様 に')), '連撃の各ヒットに命中した敵名が表示されません。');
    assert(comboTargets.firstHp < 9999 && comboTargets.secondHp === 0 && comboTargets.cost === 8 && comboTargets.targetIndex === 0, '連撃のHP・TP処理またはプレイヤーの対象選択が変わってしまいます。');

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

    assert(!failedResponses.length, `読み込み失敗:\n${failedResponses.join('\n')}`);
    assert(!runtimeErrors.length, `ブラウザ実行エラー:\n${runtimeErrors.join('\n')}`);
    console.log('ブラウザ検査 OK: タイトル / あらすじ / 1F・2F / 宝箱 / 通常戦闘 / メニュー');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
