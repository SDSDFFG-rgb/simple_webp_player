'use strict';
let last=performance.now();
function frame(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  if(state.running&&!state.paused)update(dt);
  render();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function renderTray(){
  const tray=el('weaponTray');
  const counts={};for(const k of loadout)counts[k]=(counts[k]||0)+1;
  tray.innerHTML=Object.entries(counts).map(([k,n])=>`<div class="slotMini"><div class="icon">${WEAPONS[k].icon}</div><b>${WEAPONS[k].name}</b><em>x${n}</em></div>`).join('');
}
function renderLoadout(){
  el('loadoutGrid').innerHTML=loadout.map((k,i)=>`<div class="loadSlot ${i===selectedSlot?'selected':''}" data-i="${i}"><span class="num">HP ${i+1}</span><div class="wicon">${WEAPONS[k].icon}</div><div class="wname">${WEAPONS[k].name}</div><div class="desc">${WEAPONS[k].desc}</div></div>`).join('');
  el('palette').innerHTML=Object.entries(WEAPONS).map(([k,w])=>`<button class="weaponChoice" data-w="${k}"><span class="icon">${w.icon}</span><b>${w.name}</b><small>${w.desc}</small></button>`).join('');
  document.querySelectorAll('.loadSlot').forEach(x=>x.onclick=()=>{selectedSlot=+x.dataset.i;renderLoadout();});
  document.querySelectorAll('.weaponChoice').forEach(x=>x.onclick=()=>{loadout[selectedSlot]=x.dataset.w;cooldowns[selectedSlot]=0;selectedSlot=(selectedSlot+1)%9;renderLoadout();renderTray();});
}
function openLoadout(fromStart=false){
  renderLoadout();el('loadout').style.display='grid';el('loadout').dataset.fromStart=fromStart?'1':'0';
  if(!fromStart)state.paused=true;
}
function closeLoadout(){
  const fromStart=el('loadout').dataset.fromStart==='1';el('loadout').style.display='none';
  if(!fromStart&&state.running)state.paused=false;
}
el('startBtn').onclick=startGame;
el('startLoadoutBtn').onclick=()=>openLoadout(true);
el('closeLoadoutBtn').onclick=closeLoadout;
el('loadoutBtn').onclick=()=>openLoadout(false);
el('pauseBtn').onclick=()=>{if(!state.running)return;state.paused=!state.paused;el('pauseBtn').textContent=state.paused?'RESUME':'PAUSE';};
el('retryBtn').onclick=startGame;
el('nextStageBtn').onclick=nextStage;
el('repairBtn').onclick=()=>{
  if(state.scrap<25){toast('SCRAP が足りません');return;}
  if(state.coreHP>=100){toast('CORE は最大耐久です');return;}
  state.scrap-=25;state.coreHP=Math.min(100,state.coreHP+20);updateHUD();toast('CORE +20%');
};
window.addEventListener('keydown',e=>{
  state.keys[e.key]=true;
  if((e.key==='l'||e.key==='L')&&state.running){e.preventDefault();el('loadout').style.display==='grid'?closeLoadout():openLoadout(false);}
  if(e.key==='Escape'&&el('loadout').style.display==='grid')closeLoadout();
});
window.addEventListener('keyup',e=>state.keys[e.key]=false);
function pointerMove(e){
  const r=canvas.getBoundingClientRect();state.mouseY=(e.clientY-r.top)/r.height*H;
}
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&e.buttons===0)return;pointerMove(e);});
canvas.addEventListener('pointerdown',pointerMove);
canvas.addEventListener('pointerup',()=>state.mouseY=null);
canvas.addEventListener('pointerleave',()=>state.mouseY=null);
renderTray();updateHUD();
