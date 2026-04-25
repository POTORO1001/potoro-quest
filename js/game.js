
const locations = [
  { name: "玄関ホール", enemy: "定時のご主人様", image: "img/enemies/teiji.png?v=16" },
  { name: "廊下", enemy: "残業のご主人様", image: "img/enemies/zangyo.png?v=16" },
  { name: "休憩室", enemy: "叱責のご主人様", image: "img/enemies/shisseki.png?v=16" },
  { name: "大広間", enemy: "ご主人王", image: "img/enemies/boss.png?v=16" }
];

let currentIndex = 0;
let searched = false;

function startGame(){
  document.getElementById("titleScreen").classList.add("hidden");
  document.getElementById("mapScreen").classList.remove("hidden");
  updateMap();
}

function updateMap(){
  const current = locations[currentIndex];
  document.getElementById("locationName").textContent = current.name;
  document.getElementById("mapMessage").textContent = "探索してみよう！";
  searched = false;
}

function searchArea(){
  if(searched){
    document.getElementById("mapMessage").textContent = "もう探索済みです！ 次へ進もう。";
    return;
  }

  searched = true;
  document.getElementById("mapMessage").textContent =
    currentIndex === locations.length - 1
      ? "ボスの気配がする…！"
      : current.enemy + " が現れた！";

  startBattle();
}

function startBattle(){
  const current = locations[currentIndex];
  document.getElementById("mapScreen").classList.add("hidden");
  document.getElementById("battleScreen").classList.remove("hidden");

  document.getElementById("enemyName").textContent = current.enemy;
  document.getElementById("enemyImage").src = current.image;
  document.getElementById("battleMessage").textContent = current.enemy + " と戦闘！";
}

function finishBattle(){
  document.getElementById("battleScreen").classList.add("hidden");
  document.getElementById("mapScreen").classList.remove("hidden");

  document.getElementById("mapMessage").textContent = "勝利した！ 次へ進める。";
}

function nextArea(){
  if(!searched){
    document.getElementById("mapMessage").textContent = "先に探索しよう！";
    return;
  }

  if(currentIndex < locations.length - 1){
    currentIndex++;
    updateMap();
  } else {
    document.getElementById("mapMessage").textContent = "ご主人王を倒した！ ポ・トロに平和が戻った！";
  }
}

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("searchBtn").addEventListener("click", searchArea);
document.getElementById("nextBtn").addEventListener("click", nextArea);
