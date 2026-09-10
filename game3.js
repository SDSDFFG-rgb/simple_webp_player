'use strict';
function drawBackground(){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1e69a5');g.addColorStop(.55,'#7dc3ed');g.addColorStop(.56,'#28577b');g.addColorStop(1,'#071522');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=.25;
  for(let i=0;i<12;i++){const x=(i*173+(state.time*8)%173)-80,y=120+(i%4)*70;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x,y,110,25,0,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
  ctx.fillStyle='#225376';ctx.beginPath();ctx.moveTo(0,600);
  for(let x=0;x<=W;x+=80){ctx.lineTo(x,520-Math.sin(x*.013+state.stage)*rand(20,70));}
  ctx.lineTo(W,900);ctx.lineTo(0,900);ctx.fill();
  ctx.fillStyle='#163b56';ctx.beginPath();ctx.moveTo(0,690);
  for(let x=0;x<=W;x+=55){ctx.lineTo(x,615-Math.sin(x*.021)*25-rand(0,40));}
  ctx.lineTo(W,900);ctx.lineTo(0,900);ctx.fill();
  ctx.fillStyle='#142738';ctx.fillRect(0,730,W,170);ctx.fillStyle='#20384a';ctx.fillRect(0,727,W,6);
  for(let x=850;x<1500;x+=90){ctx.fillStyle='#20374a';ctx.fillRect(x,650+(x%180?18:0),50,80);ctx.fillStyle='#fe734c';for(let k=0;k<3;k++)ctx.fillRect(x+8+k*12,675,5,4);}
}

function drawPlayer(){
  ctx.save();ctx.translate(player.x,player.y);
  const eg=ctx.createLinearGradient(-95,0,-25,0);eg.addColorStop(0,'rgba(48,190,255,0)');eg.addColorStop(1,'rgba(88,226,255,.95)');
  ctx.fillStyle=eg;ctx.beginPath();ctx.moveTo(-100,-18);ctx.lineTo(-24,-11);ctx.lineTo(-24,11);ctx.lineTo(-100,18);ctx.closePath();ctx.fill();
  ctx.fillStyle='#e8f6ff';ctx.strokeStyle='#5fcfff';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-55,-31);ctx.lineTo(45,-24);ctx.lineTo(86,0);ctx.lineTo(45,24);ctx.lineTo(-55,31);ctx.lineTo(-79,13);ctx.lineTo(-79,-13);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#2d76ad';ctx.fillRect(-44,-22,65,10);ctx.fillRect(-44,12,65,10);
  ctx.fillStyle='#0a2843';ctx.fillRect(20,-13,37,26);
  ctx.fillStyle='#5fe8ff';ctx.fillRect(-72,-9,12,18);
  for(let i=0;i<9;i++){const [ox,oy]=hardpointOffsets[i];ctx.fillStyle='rgba(8,35,53,.95)';ctx.strokeStyle='#5fd8ff';ctx.lineWidth=1;ctx.beginPath();ctx.arc(ox,oy,8,0,Math.PI*2);ctx.fill();ctx.stroke();}
  ctx.restore();
  for(const d of drones){ctx.save();ctx.translate(d.x,d.y);ctx.fillStyle='#d6f4ff';ctx.strokeStyle='#55d8ff';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-7);ctx.lineTo(-3,0);ctx.lineTo(-8,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
}

function drawEnemy(e){
  ctx.save();ctx.translate(e.x,e.y);
  if(e.type==='boss'){
    ctx.fillStyle='#1a2733';ctx.strokeStyle='#ff5663';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(-130,-48);ctx.lineTo(70,-68);ctx.lineTo(138,-26);ctx.lineTo(150,0);ctx.lineTo(138,26);ctx.lineTo(70,68);ctx.lineTo(-130,48);ctx.lineTo(-165,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#3a444d';for(let x=-95;x<95;x+=38){ctx.fillRect(x,-39,27,16);ctx.fillRect(x,23,27,16);}
    ctx.fillStyle='#ff4b52';for(let x=-75;x<110;x+=46){ctx.fillRect(x,-3,25,6);}
    ctx.fillStyle='#0f151b';ctx.beginPath();ctx.arc(-146,0,31,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ff7a48';ctx.beginPath();ctx.arc(-146,0,18,0,Math.PI*2);ctx.stroke();
  }else if(e.type==='gunship'){
    ctx.fillStyle='#202d38';ctx.strokeStyle='#ff6a5e';ctx.beginPath();ctx.roundRect(-36,-16,62,32,10);ctx.fill();ctx.stroke();ctx.fillRect(-8,-26,16,52);
    ctx.beginPath();ctx.moveTo(26,0);ctx.lineTo(45,-6);ctx.lineTo(45,6);ctx.closePath();ctx.fill();
  }else{
    ctx.fillStyle='#273845';ctx.strokeStyle='#ff7368';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-28,0);ctx.lineTo(16,-11);ctx.lineTo(35,0);ctx.lineTo(16,11);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#ff654e';ctx.fillRect(-26,-3,10,6);
  }
  ctx.restore();
  if(e.type!=='boss'){
    ctx.fillStyle='rgba(5,16,25,.78)';ctx.fillRect(e.x-25,e.y-e.r-13,50,4);ctx.fillStyle='#ff4e58';ctx.fillRect(e.x-25,e.y-e.r-13,50*(e.hp/e.maxHP),4);
  }
}
function drawMissiles(){
  for(const m of friendlyMissiles){
    if(m.trail.length>1){ctx.lineWidth=m.stage===2?4:2;ctx.strokeStyle=m.stage===2?'rgba(255,158,67,.78)':'rgba(172,229,255,.72)';ctx.beginPath();m.trail.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}
    ctx.save();ctx.translate(m.x,m.y);ctx.rotate(Math.atan2(m.vy,m.vx));ctx.fillStyle='#f2f7fb';ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-8,-4);ctx.lineTo(-5,0);ctx.lineTo(-8,4);ctx.closePath();ctx.fill();
    ctx.fillStyle=m.stage===2?'#ff9a3a':'#73d8ff';ctx.fillRect(-12,-2,6,4);ctx.restore();
  }
  for(const m of enemyMissiles){
    if(m.trail.length>1){ctx.strokeStyle='rgba(255,96,70,.5)';ctx.lineWidth=2;ctx.beginPath();m.trail.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}
    ctx.save();ctx.translate(m.x,m.y);ctx.rotate(Math.atan2(m.vy,m.vx));ctx.fillStyle='#ff7864';ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(7,-4);ctx.lineTo(10,0);ctx.lineTo(7,4);ctx.closePath();ctx.fill();ctx.restore();
  }
}
function drawShots(){
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const s of shots){
    const a=clamp(s.life/s.max,0,1);ctx.globalAlpha=a;
    if(s.type==='laser'){ctx.strokeStyle='#72ebff';ctx.lineWidth=4;}
    if(s.type==='ciws'){ctx.strokeStyle='#fff1a8';ctx.lineWidth=2;}
    if(s.type==='flak'){ctx.strokeStyle='#ffd770';ctx.lineWidth=3;}
    if(s.type==='drone'){ctx.strokeStyle='#9effea';ctx.lineWidth=2;}
    ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();
  }
  ctx.restore();
}
function drawParticles(){
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const p of particles){
    const a=clamp(p.life/p.max,0,1);ctx.globalAlpha=a;
    if(p.kind==='spark'){ctx.fillStyle='#ffd487';ctx.fillRect(p.x,p.y,p.size,p.size);}
    if(p.kind==='boom'){const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*(1-a*.35));g.addColorStop(0,'#fff8cd');g.addColorStop(.25,'#ffb236');g.addColorStop(1,'rgba(255,74,32,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.size*(1-a*.35),0,Math.PI*2);ctx.fill();}
    if(p.kind==='ring'){ctx.strokeStyle='#86e8ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,p.size*(1.4-a),0,Math.PI*2);ctx.stroke();}
  }ctx.restore();
}
function render(){
  ctx.save();
  if(state.shake>0)ctx.translate(rand(-state.shake,state.shake),rand(-state.shake,state.shake));
  drawBackground();drawMissiles();
  for(const e of enemies)if(!e.dead)drawEnemy(e);
  drawPlayer();drawShots();drawParticles();ctx.restore();
  drawMiniMap();
}
function drawMiniMap(){
  mctx.clearRect(0,0,mini.width,mini.height);mctx.fillStyle='rgba(0,8,17,.7)';mctx.fillRect(0,0,mini.width,mini.height);
  mctx.strokeStyle='#225d82';mctx.strokeRect(.5,.5,mini.width-1,mini.height-1);
  mctx.fillStyle='#1ebdff';mctx.beginPath();mctx.moveTo(13,38);mctx.lineTo(28,30);mctx.lineTo(42,38);mctx.lineTo(28,46);mctx.closePath();mctx.fill();
  for(const e of enemies){if(e.dead)continue;const x=55+(e.x/W)*(mini.width-65),y=(e.y/H)*mini.height;mctx.fillStyle=e.type==='boss'?'#ff4654':'#ff5b5d';mctx.beginPath();mctx.arc(x,y,e.type==='boss'?6:2.5,0,Math.PI*2);mctx.fill();}
  for(const m of enemyMissiles){const x=55+(m.x/W)*(mini.width-65),y=(m.y/H)*mini.height;mctx.fillStyle='#ff9b65';mctx.fillRect(x-1,y-1,2,2);}
}
function updateHUD(){
  el('coreFill').style.width=state.coreHP+'%';el('corePct').textContent=Math.ceil(state.coreHP)+'%';
  el('waveText').textContent=`STAGE ${state.stage} · WAVE ${String(state.wave).padStart(2,'0')}/05`;
  el('scrapText').textContent=state.scrap;
  if(state.boss&&!state.boss.dead)el('bossFill').style.width=clamp(state.boss.hp/state.boss.maxHP*100,0,100)+'%';
  renderTray();
}
