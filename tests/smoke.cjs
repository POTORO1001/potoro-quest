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

    await page.locator('#mapItemBtn').click();
    await page.locator('#subMenu').waitFor({ state: 'visible' });
    assert(await page.locator('#subMenuTitle').textContent() === 'どうぐ', 'マップのどうぐメニューが開きません。');
    await page.evaluate(() => closeSubMenu());

    await page.locator('#mapEquipBtn').click();
    await page.locator('#equipMenu').waitFor({ state: 'visible' });
    await page.evaluate(() => closeEquipMenu());

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
