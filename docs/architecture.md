# ポトロクエスト JS整理メモ

このメモは、今後の改変で読み込み順や関数上書きによる事故を避けるための現状整理です。

## 現在の全体像

`index.html` は静的に多数の JavaScript を順番に読み込んでいます。現状は、初期の大きな `game.js` を土台にして、その後の分割ファイルやパッチファイルが同名関数を再定義・上書きしながら最終的な挙動を作っています。

そのため、単純にファイルを並べ替えたり削除したりすると、見た目は起動しても戦闘、マップ、魔法、報酬、エンディングの一部だけ壊れる可能性があります。

## 読み込み順

現在の `index.html` の読み込み順です。後に読み込まれるファイルほど、同名関数を上書きできます。

1. `js/game.js`
2. `js/core.js`
3. `js/data.js`
4. `js/equipment.js`
5. `js/assets.js`
6. `js/loading.js`
7. `js/audio.js`
8. `js/ui.js`
9. `js/opening.js`
10. `js/ending.js`
11. `js/scene.js`
12. `js/magic-learn-compat.js`
13. `js/battle.js`
14. `js/enemy.js`
15. `js/item.js`
16. `js/map.js`
17. `js/balance.js`
18. `js/drop.js`
19. `js/item-name-rename.js`
20. `js/event.js`
21. `js/magic-config.js`
22. `js/magic.js`
23. `js/magic-learn-effect.js`
24. `js/magic-first-strike.js`
25. `js/magic-level-order.js`
26. `js/magic-complete.js`
27. `js/effects.js`
28. `js/restart-confirm.js`

## 役割ごとのまとまり

### 土台

- `game.js`: 初期実装の大きな土台。現在は多くの関数が後続ファイルで再定義されています。
- `core.js`: 共通処理、状態ガード、戦闘ヘルパー、リセット補助。
- `data.js`: 敵、装備、プレイヤーなどのデータ取得・パッチ補助。

### 画面・UI・イベント

- `ui.js`: 戦闘UI、メッセージ、ボタンロック、画面演出の基本。
- `opening.js`: タイトル、名前入力、オープニング、冒険開始。
- `scene.js`: 戦闘開始、戦闘終了、画面遷移、たまちゃんイベント。
- `event.js`: ボタン、D-pad、キーボード、メニューなどのイベントバインド。
- `loading.js`: 読み込み画面。
- `restart-confirm.js`: 最初からやり直しの確認。

### マップ

- `map.js`: 迷路生成、探索、宝箱、マップ中のアイテム・装備メニュー、スタートからの距離による進行度判定、1F/2F の敵出現範囲固定、マップ画面のステータス同期。

### 戦闘

- `battle.js`: プレイヤー行動、敵ターン、勝利、ゲームオーバー。
- `enemy.js`: 敵ごとの特殊行動。`enemySpecialAction` を上書き。
- `balance.js`: 敵・プレイヤーの難易度調整。
- `effects.js`: ダメージ、会心、ボス演出、レベルアップなどの演出を上書き・追加。

### 装備・報酬・道具

- `equipment.js`: 装備メニュー、装備ステータス、装備処理、装備データの追加、レアリティ付与、装備ステータスの調整。
- `drop.js`: アイテム・装備ドロップ、宝箱報酬、宝箱レアリティ演出。`giveReward`、`treasureDrop` を上書き。
- `item.js`: 道具効果、道具メニュー、バフ。`openSubMenu`、ステータス計算系を一部上書き。
- `item-name-rename.js`: アイテム名の調整。

### 魔法

- `magic-config.js`: 魔法設定、習得状態、MP消費、バフ設定、既存処理向けの補助関数。
- `magic.js`: 魔法メニュー、魔法処理、バフ、`openSubMenu` や `useMagic` の拡張。
- `magic-learn-compat.js`: レベルアップ時の魔法習得互換関数。
- `magic-learn-effect.js`: 魔法習得演出。`winBattle` などを補強。
- `magic-first-strike.js`: 先制魔法の追加。`useMagic` を補強。
- `magic-level-order.js`: 魔法習得順・メニュー表示の調整。`openSubMenu`、`useMagic` を補強。
- `magic-complete.js`: 追加魔法の完成版。`totalSpd`、`totalTalk`、`enemyTurn`、`useMagic` を補強。

### エンディング

- `ending.js`: ボス撃破後のルーレット、見た目の停止マスと内部結果の同期、チェキ券・萌え選券、エンディング表示。
- `ending-event.js`: 七夕イベント版エンディング。現在 `index.html` では読み込まれていません。

### 素材・音

- `assets.js`: 画像・音声素材の一覧とプリロード補助。
- `audio.js`: BGM、効果音、音ON/OFF。

## 主な上書き関係

特に注意すべき関数です。統合や移動の際は、最終的にどの実装が有効になるかを確認します。

- `startGame`: `game.js` の後に `opening.js` が実質的な冒険開始処理を担当。
- `startBattle`: `game.js` の後に `scene.js` が実質的な戦闘開始処理を担当。
- `buildEnemyParty`: `game.js`、`scene.js` の後に `map.js` がマップ敵ゾーン対応版として上書き。
- `checkTileEvent`: `map.js` が宝箱、階段、ボス、たまちゃん、通常エンカウントを担当。
- `enemySpecialAction`: `battle.js` のプレースホルダーを `enemy.js` が上書き。
- `giveReward` / `treasureDrop`: `battle.js` のプレースホルダーを `drop.js` が上書き。
- `openSubMenu`: `item.js`、`map.js`、`magic.js`、`magic-level-order.js` などが補強。
- `useMagic`: `magic.js`、`magic-first-strike.js`、`magic-level-order.js`、`magic-complete.js` が補強。
- `totalSpd` / `totalTalk`: `equipment.js` を土台に `magic.js`、`magic-complete.js`、`item.js` が補強。
- `enemyTurn`: `battle.js` を土台に `magic.js`、`magic-complete.js` が補強。
- `updateUI`: `ui.js` を土台に `map.js`、`effects.js` が補強。
- `showDamage`、`criticalFlash`、`bossEntrance`、`showLevelToast`、`enemyFlash`、`playerFlash`: `ui.js` を土台に `effects.js` が補強。
- `runBossRoulette` / `renderBossRouletteSegments`: `ending.js` が担当。

## 統合のおすすめ順

一気に統合せず、次の順で小さく進めるのが安全です。

1. 未使用ファイルの扱いを決める
   - `ending-event.js`
2. 魔法系を整理
   - `magic-config.js`
   - `magic.js`
   - `magic-first-strike.js`
   - `magic-level-order.js`
   - `magic-complete.js`
3. 最後に `game.js` の旧実装を削る
   - 後続ファイルで完全に置き換わっている関数を、慎重に削除またはコメント整理。

## 統合済み

- 2026-05-21: マップ系パッチを `map.js` に統合。
  - `map-bfs-progress-patch.js` を削除。
  - `map-enemy-zone-lock.js` を削除。
  - `map-status-sync.js` を削除。
- 2026-05-21: エンディングルーレット同期パッチを `ending.js` に統合。
  - `ending-roulette-visual-sync-patch.js` を削除。
- 2026-05-21: 装備追加・装備バランス調整を `equipment.js` に統合。
  - `data-equipment-rarity-addon.js` を削除。
  - `equipment-balance.js` を削除。
- 2026-05-21: 未読込の魔法習得メッセージ旧案を削除。
  - `magic-learn-message-fix.js` を削除。
  - `magic-learn-message-v2.js` を削除。
- 2026-05-21: 魔法設定ブリッジを `magic-config.js` に統合。
  - `magic-config-bridge.js` を削除。
- 2026-05-21: 宝箱レアリティ演出を `drop.js` に統合。
  - `treasure-effects.js` を削除。
- 2026-05-21: 未読込の分割診断ファイルを削除。
  - `compatibility.js` を削除。

## 作業ルール

- 1回のPRまたは変更で統合する領域は1つに限定する。
- 統合後は `index.html` の読み込み順を必ず更新する。
- 統合後は GitHub Pages で次を確認する。
  - タイトルから開始できる
  - マップ移動できる
  - 通常戦闘に入れる
  - 戦闘で勝利または敗北できる
  - 道具・装備・おまじないメニューが開く
- 関数を削除する前に、`rg "関数名"` で参照元を確認する。
- パッチファイルを統合する時は、まず「動作を変えずに移動」だけを行い、改善は別変更に分ける。
