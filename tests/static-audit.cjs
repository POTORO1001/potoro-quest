const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

const jsFiles = walk(path.join(root, 'js')).filter(file => file.endsWith('.js'));
const syntaxErrors = [];

for (const file of jsFiles) {
  try {
    new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
  } catch (error) {
    syntaxErrors.push(`${path.relative(root, file)}: ${error.message}`);
  }
}

assert(!syntaxErrors.length, `JavaScript構文エラー:\n${syntaxErrors.join('\n')}`);

const activeScripts = [...indexHtml.matchAll(/<script\s+src=["']([^"']+)["'][^>]*><\/script>/g)]
  .map(match => match[1].split('?')[0]);

assert(activeScripts[0] === 'js/game.js', 'game.jsが最初に読み込まれていません。');
assert(activeScripts.includes('js/ending.js'), '通常版ending.jsが読み込まれていません。');
assert(!activeScripts.includes('js/ending-event.js'), '七夕版ending-event.jsが有効になっています。');
assert(new Set(activeScripts).size === activeScripts.length, '同じJavaScriptが重複して読み込まれています。');

for (const script of activeScripts) {
  assert(fs.existsSync(path.join(root, script)), `読み込み対象が見つかりません: ${script}`);
}

const sourceFiles = [indexPath, path.join(root, 'css', 'style.css'), ...jsFiles];
const assetPattern = /(?:src=|url\(|image\s*:\s*|['"])((?:img|audio)\/[^'"?)\s]+)(?:\?[^'"\s)]*)?/g;
const missingAssets = new Set();

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(assetPattern)) {
    const relative = match[1];
    if (!/\.(?:jpe?g|mp3|png)$/i.test(relative)) continue;
    if (!fs.existsSync(path.join(root, relative))) missingAssets.add(relative);
  }
}

assert(!missingAssets.size, `参照先の素材が見つかりません:\n${[...missingAssets].join('\n')}`);

console.log(`静的検査 OK: JavaScript ${jsFiles.length}本 / 有効スクリプト ${activeScripts.length}本`);
