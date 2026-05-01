/* =========================
   ポトロクエスト enemy.js（STEP3）
   敵AI・特殊行動分離ファイル

   読み込み順：
   1. js/game.js
   2. js/battle.js
   3. js/enemy.js
   4. js/magic.js

   重要：
   - 既存 game.js の enemies 配列はそのまま使用します。
   - const enemies は再定義しません。
   - enemySpecialAction を enemy.js 側で上書きします。
========================= */

/* ===== 敵AI設定 ===== */
const POTORO_ENEMY_AI = {
  drain: {
    rate: 0.28,
    label: 'おなかすいた…！'
  },
  double: {
    rate: 0.24,
    label: 'さらに働き続けた！'
  },
  confuse: {
    rate: 0.30,
    turns: 2,
    label: '思考迷走！'
  },
  powerup: {
    rate: 0.28,
    atkUp: 3,
    label: '激務で追い込まれた！'
  },
  sleep: {
    rate: 0.25,
    label: 'うとうと…！'
  },
  drunk: {
    rate: 0.35,
    selfHitRate: 0.35,
    label: '千鳥足トーク！'
  },
  defdown: {
    rate: 0.32,
    turns: 2,
    label: '叱責！'
  },
  boss: {
    rate: 0.35
  }
};

/* ===== 敵AI：特殊行動本体 ===== */
async function enemySpecialAction(e){
  const p = state.player;
  const s = ensurePlayerStatus();

  /* 空腹のご主人様：ドレイン */
  if(e.skill === 'drain' && Math.random() < POTORO_ENEMY_AI.drain.rate){
    const damage = Math.max(4, Math.floor(e.atk * .75) - Math.floor(effectiveDef() * .35));
    p.hp = Math.max(0, p.hp - damage);

    const heal = Math.max(1, Math.floor(damage * .3));
    e.hp = Math.min(e.maxHp, e.hp + heal);

    setMessage(`${e.name} の ${POTORO_ENEMY_AI.drain.label} ${damage}ダメージ、HPを${heal}回復！`);
    showDamage(damage, 'player');
    seHit();
    playerFlash();
    return true;
  }

  /* 残業のご主人様：2回攻撃 */
  if(e.skill === 'double' && Math.random() < POTORO_ENEMY_AI.double.rate){
    setMessage(`${e.name} は ${POTORO_ENEMY_AI.double.label}`);
    await sleep(450);
    await enemyBasicAttack(e);
    if(p.hp > 0) await enemyBasicAttack(e);
    return true;
  }

  /* 迷走のご主人様：混乱 */
  if(e.skill === 'confuse' && Math.random() < POTORO_ENEMY_AI.confuse.rate){
    s.confuse = Math.max(s.confuse, POTORO_ENEMY_AI.confuse.turns);
    setMessage(`${e.name} の ${POTORO_ENEMY_AI.confuse.label} 💫 混乱した！`);
    seMagic();
    screenFlash();
    return true;
  }

  /* 激務のご主人様：攻撃アップ */
  if(e.skill === 'powerup' && Math.random() < POTORO_ENEMY_AI.powerup.rate){
    e.atk += POTORO_ENEMY_AI.powerup.atkUp;
    setMessage(`${e.name} は ${POTORO_ENEMY_AI.powerup.label} 攻撃力が上がった！`);
    seMagic();
    return true;
  }

  /* 寝落のご主人様：睡眠 */
  if(e.skill === 'sleep' && Math.random() < POTORO_ENEMY_AI.sleep.rate){
    s.sleep = Math.max(s.sleep, 1 + Math.floor(Math.random() * 2));
    setMessage(`${e.name} の ${POTORO_ENEMY_AI.sleep.label} 😴 眠ってしまった！`);
    seMagic();
    screenFlash();
    return true;
  }

  /* 泥酔のご主人様：自傷 or 混乱 */
  if(e.skill === 'drunk' && Math.random() < POTORO_ENEMY_AI.drunk.rate){
    if(Math.random() < POTORO_ENEMY_AI.drunk.selfHitRate){
      const selfDamage = Math.max(8, Math.floor(e.atk * .9));
      e.hp = Math.max(0, e.hp - selfDamage);

      if(e.hp <= 0) state.lastDefeatedEnemy = e;

      setMessage(`${e.name} は酔って自分にぶつかった！ ${selfDamage}ダメージ！`);
      showDamage(selfDamage, 'enemy');
      seHit();
      enemyFlash();
    }else{
      s.confuse = Math.max(s.confuse, 2);
      setMessage(`${e.name} の ${POTORO_ENEMY_AI.drunk.label} 💫 混乱した！`);
      seMagic();
      screenFlash();
    }

    return true;
  }

  /* 叱責のご主人様：防御ダウン */
  if(e.skill === 'defdown' && Math.random() < POTORO_ENEMY_AI.defdown.rate){
    s.defDown = Math.max(s.defDown, POTORO_ENEMY_AI.defdown.turns);
    setMessage(`${e.name} の ${POTORO_ENEMY_AI.defdown.label} 🔻 防御が下がった！`);
    seMagic();
    screenFlash();
    return true;
  }

  /* 鬼怒夜魔さん：ボス行動 */
  if(e.skill === 'boss' && Math.random() < POTORO_ENEMY_AI.boss.rate){
    const roll = Math.random();

    if(roll < .45){
      let damage = Math.max(5, Math.floor(e.atk * .75) - Math.floor(effectiveDef() * .35));

      if(p.guarding) damage = Math.max(1, Math.floor(damage / 2));

      p.hp = Math.max(0, p.hp - damage);

      setMessage(`${e.name} の 夜魔の圧！ ${damage}ダメージ！`);
      showDamage(damage, 'player', 'enemy-critical-text');
      seMagic();
      screenFlash();
      playerFlash();
    }

    else if(roll < .7){
      s.defDown = Math.max(s.defDown, 2);
      setMessage(`${e.name} の 威圧！ 🔻 防御が下がった！`);
      seMagic();
      screenFlash();
    }

    else{
      s.confuse = Math.max(s.confuse, 2);
      setMessage(`${e.name} の 闇トーク！ 💫 混乱した！`);
      seMagic();
      screenFlash();
    }

    return true;
  }

  return false;
}

/* ===== 敵データ調整用ヘルパー =====
   今後、敵ステータスを game.js から完全分離する前段階として、
   ここで enemies 配列を安全に調整できます。
========================= */

function findEnemyById(id){
  return enemies.find(enemy => enemy.id === id) || null;
}

function patchEnemy(id, patch){
  const enemy = findEnemyById(id);
  if(!enemy) return false;
  Object.assign(enemy, patch);
  return true;
}

/* ===== STEP3時点では敵ステータスは変更しない =====
   例：
   patchEnemy('kuufuku', { hp: 70, maxHp: 70, atk: 11 });
========================= */

