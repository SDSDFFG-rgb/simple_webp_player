'use strict';
function makeEnemy(type){
  if(type==='boss'){
    const hp=1150+state.stage*260;
    const e={type:'boss',x:1480,y:270,vx:-18,baseY:270,r:116,hp,maxHP:hp,fire:1.3,age:0,dead:false};
    enemies.push(e);state.boss=e;el('bossWrap').style.display='flex';return;
  }
  const gun=type==='gunship';
  const hp=(gun?88:42)*(1+(state.stage-1)*.18);
  enemies.push({type,x:rand(1460,1640),y:rand(150,725),vx:-(gun?44:rand(78,110))*(1+state.stage*.03),
    baseY:rand(150,725),r:gun?28:18,hp,maxHP:hp,fire:rand(.7,2.1),age:rand(0,2),dead:false,phase:rand(0,6.28)});
}
function spawnEnemyMissile(e){
  const boss=e.type==='boss';
  const count=boss?(Math.random()<.35?3:1):1;
  for(let i=0;i<count;i++){
    enemyMissiles.push({x:e.x-(boss?80:10),y:e.y+(i-(count-1)/2)*26,vx:-(boss?245:210)*(1+state.stage*.035),vy:rand(-15,15),
      r:boss?7:5,age:0,turn:boss?.55:.33,damage:boss?12:7,dead:false,trail:[]});
  }
}
function killEnemy(e){
  if(e.dead)return;e.dead=true;
  const reward=e.type==='boss'?120:(e.type==='gunship'?18:9);
  state.scrap+=reward;explode(e.x,e.y,e.type==='boss'?90:28,e.type==='boss'?80:20);
  updateHUD();
  if(e.type==='boss'){ state.boss=null;el('bossWrap').style.display='none'; }
}
function damageEnemy(e,dmg){
  if(e.dead)return;e.hp-=dmg;if(e.hp<=0)killEnemy(e);
}

function fireFriendlyMissile(x,y,idx){
  const candidates=enemies.filter(e=>!e.dead);
  if(!candidates.length)return;
  let target=candidates.reduce((a,b)=>dist2({x,y},a)<dist2({x,y},b)?a:b);
  friendlyMissiles.push({x,y,vx:160,vy:0,age:0,stage:1,target,r:4,slot:idx,dead:false,trail:[]});
}
function fireLaser(x,y){
  const ts=enemies.filter(e=>!e.dead&&e.x>x).sort((a,b)=>dist2({x,y},a)-dist2({x,y},b));
  if(!ts.length)return;
  const t=ts[0];damageEnemy(t,16);
  shots.push({type:'laser',x1:x,y1:y,x2:t.x,y2:t.y,life:.09,max:.09});
  spark(t.x,t.y,5);
}
function fireFlak(x,y){
  const ts=enemies.filter(e=>!e.dead&&e.x>x).sort((a,b)=>dist2({x,y},a)-dist2({x,y},b));
  if(!ts.length)return;
  const t=ts[0], tx=t.x+rand(-30,30),ty=t.y+rand(-25,25);
  shots.push({type:'flak',x1:x,y1:y,x2:tx,y2:ty,life:.22,max:.22});
  for(const e of enemies) if(!e.dead && (e.x-tx)**2+(e.y-ty)**2<105**2) damageEnemy(e,22);
  explode(tx,ty,45,18);
}
function fireCIWS(x,y){
  const targets=enemyMissiles.filter(m=>!m.dead && m.x>x-20 && dist2({x,y},m)<300*300).sort((a,b)=>dist2({x,y},a)-dist2({x,y},b));
  if(!targets.length)return false;
  const t=targets[0];
  shots.push({type:'ciws',x1:x,y1:y,x2:t.x+rand(-5,5),y2:t.y+rand(-5,5),life:.055,max:.055});
  if(Math.random()<.74){t.dead=true;spark(t.x,t.y,9);explode(t.x,t.y,12,8);}
  return true;
}
function deployDrone(x,y){
  if(drones.length>=6)return;
  drones.push({x:x-10,y:y+rand(-20,20),ang:rand(0,6.28),fire:.2,life:12});
}

let cooldowns=Array(9).fill(0);
function weaponUpdate(dt){
  for(let i=0;i<9;i++){
    cooldowns[i]-=dt;
    const w=WEAPONS[loadout[i]], off=hardpointOffsets[i];
    const x=player.x+off[0], y=player.y+off[1];
    if(cooldowns[i]>0)continue;
    if(loadout[i]==='ciws'){
      if(fireCIWS(x,y))cooldowns[i]=w.cool;
      else cooldowns[i]=.03;
    }else if(enemies.some(e=>!e.dead)){
      if(loadout[i]==='missile')fireFriendlyMissile(x,y,i);
      if(loadout[i]==='laser')fireLaser(x,y);
      if(loadout[i]==='flak')fireFlak(x,y);
      if(loadout[i]==='drone')deployDrone(x,y);
      cooldowns[i]=w.cool*(.92+Math.random()*.16);
    }
  }
}
function droneUpdate(dt){
  for(const d of drones){
    d.life-=dt;d.ang+=dt*1.5;
    d.x=player.x+Math.cos(d.ang)*86;d.y=player.y+Math.sin(d.ang)*72;
    d.fire-=dt;
    if(d.fire<=0){
      const t=enemies.filter(e=>!e.dead).sort((a,b)=>dist2(d,a)-dist2(d,b))[0];
      if(t){shots.push({type:'drone',x1:d.x,y1:d.y,x2:t.x,y2:t.y,life:.07,max:.07});damageEnemy(t,5);}
      d.fire=.32;
    }
  }
  drones=drones.filter(d=>d.life>0);
}

function update(dt){
  state.time+=dt;
  if(state.messageTimer>0){state.messageTimer-=dt;if(state.messageTimer<=0)el('message').innerHTML='';}
  const up=state.keys['ArrowUp']||state.keys['w']||state.keys['W'];
  const down=state.keys['ArrowDown']||state.keys['s']||state.keys['S'];
  const targetV=(down?1:0)-(up?1:0);
  player.vy=lerp(player.vy,targetV*330,Math.min(1,dt*8));
  if(state.mouseY!=null){player.y=lerp(player.y,state.mouseY,Math.min(1,dt*7));}
  else player.y+=player.vy*dt;
  player.y=clamp(player.y,115,735);

  if(state.waveState==='idle'){
    state.waveTimer-=dt;if(state.waveTimer<=0)beginWave();
  }else if(state.waveState==='spawning'){
    state.spawnTimer-=dt;
    if(state.spawnTimer<=0&&state.spawnQueue.length){
      const s=state.spawnQueue.shift();makeEnemy(s.type);state.spawnTimer=s.delay;
    }
    if(!state.spawnQueue.length)state.waveState='active';
  }else if(state.waveState==='active'){
    if(!enemies.some(e=>!e.dead) && !state.spawnQueue.length){state.waveState='cleared';state.waveTimer=1.8;toast('WAVE CLEAR');}
  }else if(state.waveState==='cleared'){
    state.waveTimer-=dt;if(state.waveTimer<=0)advanceWave();
  }

  weaponUpdate(dt);droneUpdate(dt);

  for(const e of enemies){
    if(e.dead)continue;e.age+=dt;
    if(e.type==='boss'){
      if(e.x>1220)e.x+=e.vx*dt;
      e.y=e.baseY+Math.sin(e.age*.75)*80;
    }else{
      e.x+=e.vx*dt;e.y+=Math.sin(e.age*1.7+e.phase)*18*dt;
      if(e.x<360){e.vx=Math.abs(e.vx)*.25;e.x=360;}
    }
    e.fire-=dt;
    const fireRate=(e.type==='boss'?1.15:(e.type==='gunship'?1.5:2.2))/(1+state.stage*.05);
    if(e.fire<=0 && e.x>420){spawnEnemyMissile(e);e.fire=fireRate*rand(.72,1.25);}
  }

  for(const m of friendlyMissiles){
    if(m.dead)continue;m.age+=dt;m.trail.push([m.x,m.y,m.stage]);if(m.trail.length>18)m.trail.shift();
    if(!m.target||m.target.dead){
      const ts=enemies.filter(e=>!e.dead);m.target=ts[0]||null;
    }
    if(m.age>.34 && m.stage===1){m.stage=2;ring(m.x,m.y);m.vx+=170; }
    if(m.stage===2 && m.target){
      const dx=m.target.x-m.x,dy=m.target.y-m.y,ln=Math.hypot(dx,dy)||1;
      const sp=Math.hypot(m.vx,m.vy), desiredX=dx/ln*clamp(sp+dt*180,360,560),desiredY=dy/ln*clamp(sp+dt*180,360,560);
      m.vx=lerp(m.vx,desiredX,Math.min(1,dt*4.4));m.vy=lerp(m.vy,desiredY,Math.min(1,dt*4.4));
    }
    m.x+=m.vx*dt;m.y+=m.vy*dt;
    if(m.target&&!m.target.dead && dist2(m,m.target)<(m.target.r+9)**2){damageEnemy(m.target,34);m.dead=true;explode(m.x,m.y,16,10);}
    if(m.x>1700||m.y<-50||m.y>950)m.dead=true;
  }

  for(const m of enemyMissiles){
    if(m.dead)continue;m.age+=dt;m.trail.push([m.x,m.y]);if(m.trail.length>16)m.trail.shift();
    const dy=player.y-m.y;m.vy=lerp(m.vy,clamp(dy*1.35,-140,140),Math.min(1,dt*m.turn));
    m.x+=m.vx*dt;m.y+=m.vy*dt;
    if(m.x<player.x+44 && Math.abs(m.y-player.y)<55){
      m.dead=true;state.coreHP=clamp(state.coreHP-m.damage,0,100);state.shake=10;explode(player.x+30,player.y,30,22);updateHUD();
      if(state.coreHP<=0)gameOver();
    }else if(m.x<-30)m.dead=true;
  }

  for(const s of shots)s.life-=dt;
  for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.985;p.vy*=.985;}
  enemies=enemies.filter(e=>!e.dead&&e.x<1720);
  friendlyMissiles=friendlyMissiles.filter(m=>!m.dead);
  enemyMissiles=enemyMissiles.filter(m=>!m.dead);
  shots=shots.filter(s=>s.life>0);particles=particles.filter(p=>p.life>0);
  state.shake=Math.max(0,state.shake-dt*28);
  updateHUD();
}

function spark(x,y,n=6){
  for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-180,180),vy:rand(-180,180),life:rand(.15,.45),max:.45,size:rand(1,3),kind:'spark'});
}
function explode(x,y,r=30,n=18){
  particles.push({x,y,vx:0,vy:0,life:.28,max:.28,size:r,kind:'boom'});
  for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-220,220),vy:rand(-220,220),life:rand(.2,.75),max:.75,size:rand(1,4),kind:'spark'});
}
function ring(x,y){particles.push({x,y,vx:0,vy:0,life:.25,max:.25,size:22,kind:'ring'});}
