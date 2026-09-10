'use strict';
const canvas=document.getElementById('game'), ctx=canvas.getContext('2d');
const mini=document.getElementById('miniCanvas'), mctx=mini.getContext('2d');
const W=1600,H=900;
const el=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rand=(a,b)=>a+Math.random()*(b-a);
const dist2=(a,b)=>{const dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy};
const lerp=(a,b,t)=>a+(b-a)*t;

const WEAPONS={
  missile:{name:'MISSILE',icon:'➤',desc:'二段階点火・追尾',cool:1.0},
  ciws:{name:'CIWS',icon:'✦',desc:'敵ミサイル迎撃',cool:.11},
  laser:{name:'LASER',icon:'╋',desc:'高速直射',cool:.38},
  flak:{name:'FLAK',icon:'✹',desc:'範囲爆発',cool:1.45},
  drone:{name:'DRONE',icon:'◆',desc:'随伴機を展開',cool:3.8}
};
const hardpointOffsets=[
  [-42,-52],[0,-60],[42,-52],
  [-53,0],[0,0],[53,0],
  [-42,52],[0,60],[42,52]
];
let loadout=['missile','ciws','laser','ciws','missile','ciws','flak','drone','missile'];
let selectedSlot=0;

const state={
  running:false,paused:false,stage:1,wave:1,scrap:0,coreHP:100,
  waveState:'idle',waveTimer:0,spawnQueue:[],spawnTimer:0,boss:null,
  keys:{},mouseY:null,time:0,shake:0,messageTimer:0
};
const player={x:190,y:450,r:34,vy:0};
let enemies=[],friendlyMissiles=[],enemyMissiles=[],shots=[],particles=[],drones=[];

function resetStage(full=false){
  if(full){state.stage=1;state.scrap=0;state.coreHP=100;}
  state.wave=1;state.waveState='idle';state.waveTimer=1.2;state.boss=null;
  enemies=[];friendlyMissiles=[];enemyMissiles=[];shots=[];particles=[];drones=[];
  player.y=450; updateHUD();
}
function startGame(){
  el('startScreen').style.display='none';el('gameOver').style.display='none';el('victory').style.display='none';
  state.running=true;state.paused=false;resetStage(true);announce('STAGE 1','防衛開始');
}
function beginWave(){
  state.waveState='spawning';
  state.spawnQueue=[];
  const base=4+state.wave*2+Math.floor(state.stage*.7);
  if(state.wave<5){
    for(let i=0;i<base;i++) state.spawnQueue.push({type:i%4===3?'gunship':'fighter', delay:rand(.25,.7)});
    state.spawnTimer=.4;
    announce(`WAVE ${String(state.wave).padStart(2,'0')}/05`,state.wave===4?'重編隊接近':'敵編隊接近');
  }else{
    state.spawnQueue.push({type:'boss',delay:.4});state.spawnTimer=.4;
    announce('BOSS WAVE','大型艦を撃破せよ');
  }
}
function advanceWave(){
  if(state.wave>=5){ clearStage(); return; }
  state.wave++;state.waveState='idle';state.waveTimer=2.1; updateHUD();
}
function clearStage(){
  state.running=false;state.paused=true;
  el('victoryText').textContent=`STAGE ${state.stage} CLEAR — SCRAP ${state.scrap}. 次ステージでは敵の耐久とミサイル攻撃頻度が上昇します。`;
  el('victory').style.display='grid';
}
function nextStage(){
  state.stage++;state.wave=1;state.waveState='idle';state.waveTimer=1.3;state.running=true;state.paused=false;
  enemies=[];friendlyMissiles=[];enemyMissiles=[];shots=[];particles=[];drones=[];state.boss=null;
  state.coreHP=Math.min(100,state.coreHP+15);
  el('victory').style.display='none';announce(`STAGE ${state.stage}`,'敵戦力増大');
  updateHUD();
}
function gameOver(){
  state.running=false;state.paused=true;el('gameOver').style.display='grid';
}
function announce(title,sub=''){
  el('message').innerHTML=`<h2>${title}</h2><p>${sub}</p>`;
  state.messageTimer=1.9;
}
function toast(text){
  const t=el('toast');t.textContent=text;t.style.opacity=1;clearTimeout(toast._t);toast._t=setTimeout(()=>t.style.opacity=0,1200);
}
