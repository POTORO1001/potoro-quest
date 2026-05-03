/* =========================
   ポトロクエスト map-bfs-progress-patch.js
   BFS進行度関数 追加パッチ

   追加対象：
   js/map-bfs-progress-patch.js

   読み込み順：
   map.js の直後
   map-status-sync.js より前がおすすめ

   index.html：
   <script src="js/map.js"></script>
   <script src="js/map-bfs-progress-patch.js"></script>
   <script src="js/map-status-sync.js"></script>

   目的：
   - getMapProgressZone is not defined を解消
   - BFS距離で序盤 / 中盤 / 終盤を判定
   - 通常敵が出ない問題を解消
========================= */

(function(){
  if(window.__potoroBfsProgressPatchInstalled) return;
  window.__potoroBfsProgressPatchInstalled = true;

  window.buildDistanceMapFromStart = function(){
    const distMap = Array.from({length:MAZE_H},()=>Array(MAZE_W).fill(-1));
    const queue = [];

    const sx = 1;
    const sy = 1;

    if(!state.maze || !state.maze[sy] || state.maze[sy][sx] !== 0){
      state.mapDistanceMap = distMap;
      state.mapMaxDistance = 1;
      return;
    }

    distMap[sy][sx] = 0;
    queue.push({x:sx,y:sy});

    const dirs = [
      {x:1,y:0},
      {x:-1,y:0},
      {x:0,y:1},
      {x:0,y:-1}
    ];

    let maxDistance = 0;

    while(queue.length){
      const cur = queue.shift();

      for(const d of dirs){
        const nx = cur.x + d.x;
        const ny = cur.y + d.y;

        if(nx < 0 || ny < 0 || nx >= MAZE_W || ny >= MAZE_H) continue;
        if(state.maze[ny][nx] !== 0) continue;
        if(distMap[ny][nx] !== -1) continue;

        distMap[ny][nx] = distMap[cur.y][cur.x] + 1;
        maxDistance = Math.max(maxDistance,distMap[ny][nx]);

        queue.push({x:nx,y:ny});
      }
    }

    state.mapDistanceMap = distMap;
    state.mapMaxDistance = Math.max(1,maxDistance);
  };

  window.getMapDistanceProgress = function(){
    if(!state.mapDistanceMap || !state.mapMaxDistance){
      window.buildDistanceMapFromStart();
    }

    const x = state.player.mapX;
    const y = state.player.mapY;

    const dist = state.mapDistanceMap?.[y]?.[x];

    if(dist === undefined || dist < 0) return 0;

    return Math.max(0,Math.min(1,dist / state.mapMaxDistance));
  };

  window.getMapProgressZone = function(){
    const progress = window.getMapDistanceProgress();

    if(progress <= 0.25) return 'early';
    if(progress <= 0.65) return 'middle';
    return 'late';
  };

  window.getMapProgressLabel = function(){
    const zone = window.getMapProgressZone();

    if(zone === 'early') return '序盤';
    if(zone === 'middle') return '中盤';
    return '終盤';
  };

  window.potoroMapProgressReport = function(){
    const progress = window.getMapDistanceProgress();
    const zone = window.getMapProgressZone();

    const report = {
      floor:state.floor,
      x:state.player.mapX,
      y:state.player.mapY,
      distance:state.mapDistanceMap?.[state.player.mapY]?.[state.player.mapX] ?? null,
      maxDistance:state.mapMaxDistance || null,
      progress:Math.round(progress * 100),
      zone,
      label:window.getMapProgressLabel()
    };

    console.log('[PO・TORO QUEST map progress]',report);
    return report;
  };

  /*
    setupFloor がすでに動いたあとでも使えるよう、
    現在のmazeがあれば初回距離マップを作っておく。
  */
  setTimeout(() => {
    if(state && state.maze && state.maze.length){
      window.buildDistanceMapFromStart();
    }
  },0);

  console.log('[PO・TORO QUEST] map-bfs-progress-patch.js loaded');
})();
