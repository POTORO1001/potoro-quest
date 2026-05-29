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

function addEnemyIfMissing(enemy){
  if(!enemy || !enemy.id || findEnemyById(enemy.id)) return false;
  enemies.push(enemy);
  return true;
}

function installExpandedEnemyBalance(){
  [
    ['teiji',{atk:8}],
    ['kuufuku',{hp:70,maxHp:70,atk:12}],
    ['zangyo',{hp:90,maxHp:90,atk:16,exp:24}],
    ['meisou',{hp:115,maxHp:115,atk:17,exp:32}],
    ['gekimu',{hp:155,maxHp:155,atk:22,exp:45}],
    ['neochi',{hp:135,maxHp:135,atk:19,exp:41}],
    ['deisui',{hp:185,maxHp:185,atk:23,exp:58}],
    ['shisseki',{hp:250,maxHp:250,atk:28,exp:78}]
  ].forEach(([id,stats]) => patchEnemy(id,stats));

  [
    {id:'maigo',name:'迷子のご主人様',hp:90,maxHp:90,mp:10,maxMp:10,atk:15,def:7,spd:14,talk:9,exp:26,image:'img/enemies/maigo.png?v=expanded-enemies-v1',skill:'lost',intro:'迷子のご主人様が 地図を広げながら あらわれた！'},
    {id:'shousou',name:'焦燥のご主人様',hp:115,maxHp:115,mp:12,maxMp:12,atk:18,def:8,spd:17,talk:12,exp:34,image:'img/enemies/shousou.png?v=expanded-enemies-v1',skill:'rush_pressure',intro:'焦燥のご主人様が 時計を気にしながら あらわれた！'},
    {id:'sanzai',name:'散財のご主人様',hp:135,maxHp:135,mp:14,maxMp:14,atk:20,def:10,spd:11,talk:13,exp:42,image:'img/enemies/sanzai.png?v=expanded-enemies-v1',skill:'spend',intro:'散財のご主人様が ブラックカードをかざして あらわれた！'},
    {id:'bousou',name:'暴走のご主人様',hp:170,maxHp:170,mp:10,maxMp:10,atk:24,def:11,spd:13,talk:10,exp:55,image:'img/enemies/bousou.png?v=expanded-enemies-v1',skill:'runaway',intro:'暴走のご主人様が 煙を上げて あらわれた！'},
    {id:'juuatsu',name:'重圧のご主人様',hp:220,maxHp:220,mp:20,maxMp:20,atk:25,def:18,spd:6,talk:14,exp:72,image:'img/enemies/juuatsu.png?v=expanded-enemies-v1',skill:'weight',intro:'重圧のご主人様が ずっしりと あらわれた！'}
  ].forEach(addEnemyIfMissing);
}

installExpandedEnemyBalance();

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
  maigo: {
    rate: 0.30,
    turns: 2
  },
  shousou: {
    rate: 0.34
  },
  sanzai: {
    rate: 0.30,
    mpDamage: 4
  },
  bousou: {
    rate: 0.32,
    recoilRate: 0.35
  },
  juuatsu: {
    rate: 0.34,
    turns: 2
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

  if(e.skill === 'lost' && Math.random() < POTORO_ENEMY_AI.maigo.rate){
    s.confuse = Math.max(s.confuse, POTORO_ENEMY_AI.maigo.turns);
    setMessage(`${e.name} の 道に迷わせる案内！ 混乱してしまった！`);
    seMagic();
    screenFlash();
    return true;
  }

  if(e.skill === 'rush_pressure' && Math.random() < POTORO_ENEMY_AI.shousou.rate){
    let damage = Math.max(5, Math.floor(e.atk * .85) - Math.floor(effectiveDef() * .45));
    if(p.guarding) damage = Math.max(1, Math.floor(damage / 2));

    p.hp = Math.max(0, p.hp - damage);
    setMessage(`${e.name} の 急かしトーク！ ${damage}ダメージ！`);
    showDamage(damage, 'player', 'enemy-critical-text');
    seMagic();
    playerFlash();
    return true;
  }

  if(e.skill === 'spend' && Math.random() < POTORO_ENEMY_AI.sanzai.rate){
    let damage = Math.max(6, Math.floor(e.atk * .8) - Math.floor(effectiveDef() * .4));
    if(p.guarding) damage = Math.max(1, Math.floor(damage / 2));

    const mpDamage = Math.min(p.mp, POTORO_ENEMY_AI.sanzai.mpDamage + Math.floor(Math.random() * 3));
    p.hp = Math.max(0, p.hp - damage);
    p.mp = Math.max(0, p.mp - mpDamage);

    setMessage(`${e.name} の 爆買いプレッシャー！ ${damage}ダメージ、MP-${mpDamage}！`);
    showDamage(damage, 'player', 'enemy-critical-text');
    seMagic();
    screenFlash();
    playerFlash();
    return true;
  }

  if(e.skill === 'runaway' && Math.random() < POTORO_ENEMY_AI.bousou.rate){
    setMessage(`${e.name} の 暴走突撃！`);
    await sleep(350);
    await enemyBasicAttack(e);
    if(p.hp > 0) await enemyBasicAttack(e);

    if(Math.random() < POTORO_ENEMY_AI.bousou.recoilRate){
      const recoil = Math.max(6, Math.floor(e.atk * .35));
      e.hp = Math.max(0, e.hp - recoil);
      if(e.hp <= 0) state.lastDefeatedEnemy = e;
      setMessage(`${e.name} は勢い余って反動を受けた！ ${recoil}ダメージ！`);
      showDamage(recoil, 'enemy');
      enemyFlash();
    }

    return true;
  }

  if(e.skill === 'weight' && Math.random() < POTORO_ENEMY_AI.juuatsu.rate){
    s.defDown = Math.max(s.defDown, POTORO_ENEMY_AI.juuatsu.turns);

    let damage = Math.max(7, Math.floor(e.atk * .75) - Math.floor(effectiveDef() * .25));
    if(p.guarding) damage = Math.max(1, Math.floor(damage / 2));

    p.hp = Math.max(0, p.hp - damage);
    setMessage(`${e.name} の 重圧！ 防御が下がり、${damage}ダメージ！`);
    showDamage(damage, 'player', 'enemy-critical-text');
    seMagic();
    screenFlash();
    playerFlash();
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

