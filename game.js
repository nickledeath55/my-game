<!-- ===================== game.js ===================== -->
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const coinEl=document.getElementById("coins");
const scoreEl=document.getElementById("score");
const livesEl=document.getElementById("lives");
const levelEl=document.getElementById("level");

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const gravity=0.5, friction=0.8;
const worldWidth=canvas.width*3;

let camX=0, coinCount=0, score=0, lives=2;
let levelIndex=0, gameOver=false, gameWon=false;

const player={x:50,y:300,width:30,height:40,dx:0,dy:0,speed:4,jumping:false};

const levels=[1,2,3];
let platforms=[],coinsArr=[],specialCoin=null,enemies=[],powerups=[],goal={},boss=null;

function genLevel(){
  platforms=[{x:0,y:canvas.height-50,width:worldWidth,height:50}];
  coinsArr=[];enemies=[];powerups=[];boss=null;

  for(let i=200;i<worldWidth;i+=250){
    const y=canvas.height-120-(Math.random()*100);
    platforms.push({x:i,y,width:120,height:20});
    coinsArr.push({x:i+40,y:y-30,taken:false});
  }

  specialCoin={x:worldWidth/2,y:canvas.height-220,taken:false};

  for(let i=400;i<worldWidth;i+=700){
    enemies.push({x:i,y:canvas.height-260,dx:2+levelIndex,width:32,height:24,frame:0});
  }

  for(let i=700;i<worldWidth;i+=900){
    powerups.push({x:i,y:canvas.height-220,type:'life',taken:false});
  }

  goal={x:worldWidth-60,y:canvas.height-100,width:30,height:50};

  if(levelIndex===2){
    boss={x:worldWidth-400,y:canvas.height-180,width:80,height:60,dx:2,health:5};
  }
}

function loadLevel(i){
  genLevel();
  coinCount=0;
  coinEl.textContent=0;
  levelEl.textContent=i+1;
  resetPlayer();
}

function resetPlayer(){
  player.x=50;player.y=canvas.height-100;
  player.dx=0;player.dy=0;
}

const keys={};
addEventListener("keydown",e=>keys[e.code]=true);
addEventListener("keyup",e=>keys[e.code]=false);

['left','right','jump'].forEach(id=>{
  const el=document.getElementById(id);
  el.ontouchstart=()=>keys[id==='left'?'ArrowLeft':id==='right'?'ArrowRight':'ArrowUp']=true;
  el.ontouchend=()=>keys[id==='left'?'ArrowLeft':id==='right'?'ArrowRight':'ArrowUp']=false;
});

restart.onclick=()=>{
  levelIndex=0;score=0;lives=2;
  gameOver=false;gameWon=false;
  livesEl.textContent=lives;scoreEl.textContent=score;
  loadLevel(0);
};

const rect=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;

function update(){
  if(gameOver||gameWon) return;

  if(keys.ArrowRight)player.dx=player.speed;
  else if(keys.ArrowLeft)player.dx=-player.speed;
  else player.dx*=friction;

  if(keys.ArrowUp&&!player.jumping){player.dy=-10;player.jumping=true;}

  player.dy+=gravity;
  player.x+=player.dx;player.y+=player.dy;

  camX=Math.max(0,Math.min(player.x-canvas.width/2,worldWidth-canvas.width));

  let onPlat=false;
  platforms.forEach(p=>{
    if(player.x<p.x+p.width&&player.x+player.width>p.x&&player.y+player.height<=p.y+player.dy&&player.y+player.height+player.dy>=p.y){
      player.y=p.y-player.height;player.dy=0;player.jumping=false;onPlat=true;
    }
  });
  if(!onPlat)player.jumping=true;

  coinsArr.forEach(c=>{
    if(!c.taken&&rect(player,{x:c.x,y:c.y,width:16,height:16})){
      c.taken=true;coinCount++;score+=100;
      coinEl.textContent=coinCount;scoreEl.textContent=score;
    }
  });

  if(specialCoin&&!specialCoin.taken&&rect(player,{x:specialCoin.x,y:specialCoin.y,width:20,height:20})){
    specialCoin.taken=true;score+=500;scoreEl.textContent=score;
  }

  powerups.forEach(p=>{
    if(!p.taken&&rect(player,{x:p.x,y:p.y,width:20,height:20})){
      p.taken=true;
      if(lives<4){lives++;livesEl.textContent=lives;}
    }
  });

  enemies.forEach(e=>{
    e.x+=e.dx;
    if(e.x<0||e.x>worldWidth-40)e.dx*=-1;
    if(rect(player,e)){
      lives--;livesEl.textContent=lives;resetPlayer();
      if(lives<=0)gameOver=true;
    }
  });

  if(boss){
    boss.x+=boss.dx;
    if(boss.x<goal.x-300||boss.x>goal.x-50)boss.dx*=-1;
    if(rect(player,boss)){
      if(player.dy>0){boss.health--;player.dy=-8;}
      else{lives--;livesEl.textContent=lives;resetPlayer();}
      if(lives<=0)gameOver=true;
    }
    if(boss.health<=0)boss=null;
  }

  if(rect(player,goal)&&coinCount>=3&&specialCoin.taken&&!boss){
    levelIndex++;
    if(levelIndex<levels.length)loadLevel(levelIndex);
    else gameWon=true;
  }
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();ctx.translate(-camX,0);

  ctx.fillStyle='green';platforms.forEach(p=>ctx.fillRect(p.x,p.y,p.width,p.height));
  ctx.fillStyle='gold';coinsArr.forEach(c=>!c.taken&&(ctx.beginPath(),ctx.arc(c.x+8,c.y+8,8,0,Math.PI*2),ctx.fill()));

  if(specialCoin&&!specialCoin.taken){ctx.fillStyle='orange';ctx.beginPath();ctx.arc(specialCoin.x+10,specialCoin.y+10,10,0,Math.PI*2);ctx.fill();}

  ctx.fillStyle='cyan';powerups.forEach(p=>!p.taken&&ctx.fillRect(p.x,p.y,20,20));
  ctx.fillStyle='purple';enemies.forEach(e=>ctx.fillRect(e.x,e.y,e.width,e.height));

  if(boss){ctx.fillStyle='black';ctx.fillRect(boss.x,boss.y,boss.width,boss.height);}

  ctx.fillStyle='red';ctx.fillRect(player.x,player.y,player.width,player.height);
  ctx.fillStyle='blue';ctx.fillRect(goal.x,goal.y,goal.width,goal.height);

  ctx.restore();

  if(gameOver||gameWon){
    ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#fff';ctx.font='32px Arial';
    ctx.fillText(gameOver?'GAME OVER':'YOU WIN!',canvas.width/2-80,canvas.height/2);
  }
}

function loop(){update();draw();requestAnimationFrame(loop);}
loadLevel(0);loop();
